import { ComponentRef, createComponent, EnvironmentInjector, Injectable, NgZone, TemplateRef, Type } from '@angular/core';
import { DynamicComponentService } from '../renderer/hot-dynamic-renderer-component.service';
import { BaseEditorAdapter } from '../editor/base-editor-adapter';
import { GridSettings, GridSettingsInternal } from '../models/grid-settings';
import { CustomValidatorFn, ColumnSettings, ColumnSettingsInternal } from '../models/column-settings';
import { HotCellRendererComponent } from '../renderer/hot-cell-renderer.component';
import { HotCellEditorComponent } from '../editor/hot-cell-editor.component';
import Handsontable from 'handsontable/base';
import { FactoryEditorAdapter } from '../editor/editor-factory-adapter';
import { HotCellRendererAdvancedComponent } from '../renderer/hot-cell-renderer-advanced.component';
import { HotCellEditorAdvancedComponent } from '../editor/hot-cell-editor-advanced.component';

const AVAILABLE_HOOKS_SET = new Set<string>(Handsontable.hooks.getRegistered());
const HOT_ZONE_WRAPPED = Symbol('hotZoneWrapped');

/**
 * Service to resolve and apply custom settings for Handsontable settings object.
 */
@Injectable()
export class HotSettingsResolver {
  constructor(
    private readonly dynamicComponentService: DynamicComponentService,
    private readonly environmentInjector: EnvironmentInjector,
    private readonly ngZone: NgZone,
  ) {}

  /**
   * Applies custom settings to the provided GridSettings.
   * @param settings The original grid settings.
   * @param previousColumns The previously resolved columns (from the prior settings cycle). When
   *   supplied, an editor component already created for a column whose editor type is unchanged is
   *   recycled instead of being recreated, avoiding needless Angular component teardown/rebuild.
   * @returns The merged grid settings with custom settings applied.
   */
  applyCustomSettings(settings: GridSettings, previousColumns?: ColumnSettings[]): GridSettingsInternal {
    // Shallow-clone the user settings (and each column) before mutating. Otherwise we would
    // write generated renderers/editors and `_editorComponentReference` straight onto the
    // caller's objects. When the same settings/columns are shared across two <hot-table>
    // instances, the second resolution would overwrite the first instance's editor refs,
    // leaking them and cross-wiring a single editor component between tables.
    const mergedSettings: GridSettings = { ...settings };

    if (Array.isArray(mergedSettings.columns)) {
      mergedSettings.columns = mergedSettings.columns.map((column) => ({ ...column }));
    }

    this.updateColumnRendererForGivenCustomRenderer(mergedSettings);
    this.updateColumnEditorForGivenCustomEditor(mergedSettings, previousColumns);
    this.updateColumnValidatorForGivenCustomValidator(mergedSettings);

    this.wrapHooksInNgZone(mergedSettings);

    return mergedSettings as GridSettingsInternal;
  }

  /**
   * Ensures that hook callbacks in the provided grid settings run inside Angular's zone.
   *
   * @param settings The original grid settings.
   */
  private wrapHooksInNgZone(settings: GridSettings): void {
    const ngZone = this.ngZone;

    // Iterate only the keys actually present in settings instead of all ~100 registered HOT hooks.
    Object.keys(settings).forEach((key) => {
      if (!AVAILABLE_HOOKS_SET.has(key)) {
        return;
      }
      const option = settings[key];

      if (typeof option === 'function' && !(option as any)[HOT_ZONE_WRAPPED]) {
        const wrapped = function (...args: any) {
          return ngZone.run(() => option.apply(this, args));
        };
        (wrapped as any)[HOT_ZONE_WRAPPED] = true;
        settings[key] = wrapped;
      }
    });
  }

  /**
   * Updates the column renderer for columns with a custom renderer.
   * @param mergedSettings The merged grid settings.
   */
  private updateColumnRendererForGivenCustomRenderer(mergedSettings: GridSettings): void {
    if (!Array.isArray(mergedSettings?.columns)) {
      return;
    }

    (mergedSettings?.columns as ColumnSettings[])
      ?.filter((settings) => this.isCustomRenderer(settings.renderer))
      ?.forEach((cellSettings) => {
        const renderer = cellSettings.renderer;
        const props: any = cellSettings.rendererProps ?? {};

        if (this.isAdvancedRendererComponentRefType(renderer)) {
          cellSettings.renderer = this.dynamicComponentService.createRendererWithFactory(renderer, props);
        } else if (this.isRendererComponentRefType(renderer) || this.isTemplateRef(renderer)) {
          cellSettings.renderer = this.dynamicComponentService.createRendererFromComponent(renderer, props);
        }
      });
  }

  /**
   * Updates the column editor for columns with a custom editor.
   *
   * Iterates by original column index (not a filtered subset) so each column can be matched against
   * the column at the same index in `previousColumns` for editor-component recycling.
   *
   * @param mergedSettings The merged grid settings.
   * @param previousColumns The previously resolved columns, used to recycle editor components.
   */
  private updateColumnEditorForGivenCustomEditor(mergedSettings: GridSettings, previousColumns?: ColumnSettings[]): void {
    if (!Array.isArray(mergedSettings?.columns)) {
      return;
    }

    (mergedSettings.columns as ColumnSettings[]).forEach((cellSettings, index) => {
      const isAdvanced = this.isAdvancedEditorComponentRefType(cellSettings.editor);
      const isBasic = this.isEditorComponentRefType(cellSettings.editor);

      if (!isAdvanced && !isBasic) {
        return;
      }

      const editorType = cellSettings.editor as Type<HotCellEditorComponent<any>> | Type<HotCellEditorAdvancedComponent<any>>;
      const reusableRef = this.reusableEditorRef(previousColumns?.[index], cellSettings, editorType);
      const internalSettings = cellSettings as ColumnSettingsInternal;

      // Recycle the editor component from the previous settings cycle when the same editor type
      // sits at the same column index AND the same logical column (by `data`) still occupies it.
      // Recreating it on every settings change would tear down and rebuild an Angular component
      // (and its DOM/internal state) for no reason. The reused ref is carried into the new column;
      // HotTableComponent.ngOnChanges detects it by identity and skips destroying it.
      const component = reusableRef ?? createComponent(editorType as Type<any>, {
        environmentInjector: this.environmentInjector,
      });

      internalSettings._editorComponentReference = component as ComponentRef<HotCellEditorComponent<any>>;

      if (isAdvanced) {
        cellSettings.editor = FactoryEditorAdapter(component as ComponentRef<HotCellEditorAdvancedComponent<any>>);
      } else {
        internalSettings._environmentInjector = this.environmentInjector;
        cellSettings.editor = BaseEditorAdapter;
      }
    });
  }

  /**
   * Returns the previous column's editor component ref when it can be reused for the new column, or
   * `undefined` to signal a fresh component is needed.
   *
   * A ref is only recycled when, at the same index, both the editor component type AND the logical
   * column identity (its `data` binding) are unchanged. The component-type check alone would already
   * be functionally safe — a Handsontable editor is not per-cell rendered state but a single
   * on-demand component that `BaseEditorAdapter`/`FactoryEditorAdapter` re-prepare on every edit
   * (`prepare()` re-reads the ref from the *current* column meta and `applyPropsToEditor()` re-applies
   * the full cell context on each `open()`). The extra `data` check is a defensive guard: when columns
   * are reordered/shortened so a *different* logical column lands on an index, we build a fresh editor
   * rather than carry the previous column's instance over, so no custom editor that caches
   * column-specific config at construction can leak stale state into the new cell.
   *
   * @param previousColumn The column at the same index in the previous settings cycle.
   * @param currentColumn The column now occupying this index.
   * @param editorType The editor component type requested for the new column.
   */
  private reusableEditorRef(
    previousColumn: ColumnSettings | undefined,
    currentColumn: ColumnSettings,
    editorType: Type<unknown>
  ): ComponentRef<any> | undefined {
    const previousRef = (previousColumn as ColumnSettingsInternal | undefined)?._editorComponentReference;

    if (!previousRef || previousRef.componentType !== editorType) {
      return undefined;
    }

    // Same logical column still occupies this index. Columns without a `data` binding are identified
    // purely by position, so two `undefined` data values compare equal and recycle as before.
    const sameLogicalColumn =
      (previousColumn as Handsontable.ColumnSettings | undefined)?.data ===
      (currentColumn as Handsontable.ColumnSettings).data;

    return sameLogicalColumn ? previousRef : undefined;
  }

  /**
   * Updates the column validator for columns with a custom validator.
   * @param mergedSettings The merged grid settings.
   */
  private updateColumnValidatorForGivenCustomValidator(mergedSettings: GridSettings): void {
    if (!Array.isArray(mergedSettings?.columns)) {
      return;
    }

    (mergedSettings?.columns as ColumnSettings[])
      ?.filter((settings) => this.isCustomValidatorFn(settings.validator))
      ?.forEach((cellSettings) => {
        const customValidatorFn = cellSettings.validator as CustomValidatorFn<any>;

        cellSettings.validator = (value: any, callback: (result: boolean) => void) => {
          callback(customValidatorFn(value));
        };
      });
  }

  private isCustomValidatorFn(validator: unknown): validator is CustomValidatorFn<any> {
    return typeof validator === 'function' && validator.length === 1;
  }

  private isEditorComponentRefType(editor: any): editor is Type<HotCellEditorComponent<any>> {
    // ecmp - we need it to check if the editor is a component
    return typeof editor === 'function' &&
      !!(editor as any)?.ɵcmp &&
      (editor as any)?.EDITOR_MARKER === HotCellEditorComponent.EDITOR_MARKER;
  }

  private isAdvancedEditorComponentRefType(editor: any): editor is Type<HotCellEditorAdvancedComponent<any>> {
    // ecmp - we need it to check if the editor is a component
    return typeof editor === 'function' &&
      !!(editor as any)?.ɵcmp &&
      (editor as any)?.EDITOR_MARKER === HotCellEditorAdvancedComponent.EDITOR_MARKER;
  }

  private isRendererComponentRefType(renderer: any): renderer is Type<HotCellRendererComponent<any, any>> {
    // ecmp - we need it to check if the renderer is a component
    return typeof renderer === 'function' &&
      !!(renderer as any)?.ɵcmp &&
      (renderer as any)?.RENDERER_MARKER === HotCellRendererComponent.RENDERER_MARKER;
  }

  private isAdvancedRendererComponentRefType(renderer: any): renderer is Type<HotCellRendererAdvancedComponent<any, any>> {
    // ecmp - we need it to check if the renderer is a component
    return typeof renderer === 'function' &&
      !!(renderer as any)?.ɵcmp &&
      (renderer as any)?.RENDERER_MARKER === HotCellRendererAdvancedComponent.RENDERER_MARKER;
  }

  private isTemplateRef(renderer: any): renderer is TemplateRef<any> {
    return renderer && typeof renderer.createEmbeddedView === 'function';
  }

  private isCustomRenderer(renderer: any): renderer is Type<HotCellRendererComponent<any, any>> |
    TemplateRef<any> |
    Type<HotCellRendererAdvancedComponent<any, any>> {
    return this.isRendererComponentRefType(renderer) ||
      this.isTemplateRef(renderer) ||
      this.isAdvancedRendererComponentRefType(renderer);
  }
}
