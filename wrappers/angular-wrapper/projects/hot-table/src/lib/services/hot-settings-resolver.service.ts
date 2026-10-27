import { ComponentRef, createComponent, EnvironmentInjector, Injectable, NgZone, TemplateRef, Type } from '@angular/core';
import { DynamicComponentService } from '../renderer/hot-dynamic-renderer-component.service';
import { BaseEditorAdapter } from '../editor/base-editor-adapter';
import { GridSettings, GridSettingsInternal } from '../models/grid-settings';
import { CustomValidatorFn, ColumnSettings, ColumnSettingsInternal } from '../models/column-settings';
import { HotCellRendererComponent } from '../renderer/hot-cell-renderer.component';
import { HotCellEditorComponent } from '../editor/hot-cell-editor.component';
import Handsontable from 'handsontable/base';
import { SettingsUpdate } from 'handsontable/settings';
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
  /**
   * The resolved copy of each column object `resolveAppliedSettings()` resolved.
   */
  private readonly appliedColumns = new WeakMap<ColumnSettings, ColumnSettings>();
  /**
   * The editor components `resolveAppliedSettings()` created.
   */
  private readonly appliedEditorRefs = new Set<ComponentRef<HotCellEditorComponent<any>>>();
  /**
   * The zone wrapper of each hook callback.
   */
  private readonly zoneWrappers = new WeakMap<Function, Function>();

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
      mergedSettings.columns = mergedSettings.columns.map((column, index) => {
        const resolved = { ...column };

        this.resolveColumnRenderer(resolved);
        this.resolveColumnEditor(resolved, previousColumns?.[index]);
        this.resolveColumnValidator(resolved);

        return resolved;
      });
    }

    this.wrapHooksInNgZone(mergedSettings);

    return mergedSettings as GridSettingsInternal;
  }

  /**
   * Resolves the settings core is about to apply through `updateSettings()`, which reaches the grid
   * without passing `applyCustomSettings()`: a sheet's own `settings` that the sheets bar applies on a
   * switch, through `updateSheetSettings()`, or for a duplicated sheet. Registered on the grid with
   * `_addSettingsFilter()`. A value already resolved is left as it is, so the settings of the `settings`
   * input pass unchanged.
   *
   * The result for a column object, and the zone wrapper of a hook, is created once and reused on every
   * later payload holding the same object or function. The sheets bar compares a sheet's settings
   * function by function, and a sheet that shows again keeps the editor component it had.
   *
   * @param settings The payload of `updateSettings()`.
   * @returns The payload to apply: `settings` itself when nothing needed resolving, a new object
   *   otherwise. The caller's object is never changed.
   */
  resolveAppliedSettings(settings: SettingsUpdate): SettingsUpdate {
    const columns = settings.columns;
    const resolvedColumns = Array.isArray(columns) ? this.resolveAppliedColumns(columns) : columns;
    const hooks = this.zoneWrappedHooksOf(settings);

    if (resolvedColumns === columns && hooks === null) {
      return settings;
    }

    const resolved: SettingsUpdate = { ...settings, ...hooks };

    if (resolvedColumns !== columns) {
      resolved.columns = resolvedColumns as ColumnSettingsInternal[];
    }

    return resolved;
  }

  /**
   * Destroys every editor component `resolveAppliedSettings()` created.
   */
  destroyAppliedEditors(): void {
    this.appliedEditorRefs.forEach(ref => ref.destroy());
    this.appliedEditorRefs.clear();
  }

  /**
   * Resolves each column of an applied payload.
   *
   * @param columns The columns of the payload.
   * @returns `columns` itself when no column needed resolving, a new array otherwise.
   */
  private resolveAppliedColumns(columns: ColumnSettings[]): ColumnSettings[] {
    const resolved = columns.map(column => this.resolveAppliedColumn(column));

    return resolved.every((column, index) => column === columns[index]) ? columns : resolved;
  }

  /**
   * Resolves one column of an applied payload, once per column object.
   *
   * @param column The column.
   * @returns The resolved column, or `column` itself when it holds nothing to resolve.
   */
  private resolveAppliedColumn(column: ColumnSettings): ColumnSettings {
    if (!this.needsResolution(column)) {
      return column;
    }

    const cached = this.appliedColumns.get(column);

    if (cached) {
      return cached;
    }

    const resolved = { ...column };

    this.resolveColumnRenderer(resolved);

    const editorRef = this.resolveColumnEditor(resolved);

    if (editorRef) {
      this.appliedEditorRefs.add(editorRef);
    }

    this.resolveColumnValidator(resolved);
    this.appliedColumns.set(column, resolved);

    return resolved;
  }

  /**
   * Tells whether a column holds a renderer, an editor or a validator Handsontable cannot read as it is.
   *
   * @param column The column.
   * @returns `true` when the column needs resolving.
   */
  private needsResolution(column: ColumnSettings): boolean {
    return typeof column === 'object' && column !== null && (
      this.isCustomRenderer(column.renderer) ||
      this.isEditorComponentRefType(column.editor) ||
      this.isAdvancedEditorComponentRefType(column.editor) ||
      this.isCustomValidatorFn(column.validator)
    );
  }

  /**
   * Returns the zone wrappers of the hook callbacks a payload holds that are not wrapped yet.
   *
   * @param settings The payload.
   * @returns The wrappers by hook name, or `null` when every hook callback is wrapped already.
   */
  private zoneWrappedHooksOf(settings: SettingsUpdate): Record<string, Function> | null {
    let wrapped: Record<string, Function> | null = null;

    Object.keys(settings).forEach((key) => {
      const option: unknown = settings[key as keyof SettingsUpdate];

      if (AVAILABLE_HOOKS_SET.has(key) && typeof option === 'function' && !(option as any)[HOT_ZONE_WRAPPED]) {
        wrapped = { ...wrapped, [key]: this.zoneWrapped(option) };
      }
    });

    return wrapped;
  }

  /**
   * Ensures that hook callbacks in the provided grid settings run inside Angular's zone.
   *
   * @param settings The original grid settings.
   */
  private wrapHooksInNgZone(settings: GridSettings): void {
    // Iterate only the keys actually present in settings instead of all ~100 registered HOT hooks.
    Object.keys(settings).forEach((key) => {
      if (!AVAILABLE_HOOKS_SET.has(key)) {
        return;
      }
      const option = settings[key];

      if (typeof option === 'function' && !(option as any)[HOT_ZONE_WRAPPED]) {
        settings[key] = this.zoneWrapped(option);
      }
    });
  }

  /**
   * Returns the function that runs a hook callback inside Angular's zone, the same one for every call
   * with the same callback.
   *
   * @param callback The hook callback.
   * @returns The wrapper.
   */
  private zoneWrapped(callback: Function): Function {
    const known = this.zoneWrappers.get(callback);

    if (known) {
      return known;
    }

    const ngZone = this.ngZone;
    const wrapped = function (...args: any) {
      return ngZone.run(() => callback.apply(this, args));
    };

    (wrapped as any)[HOT_ZONE_WRAPPED] = true;
    this.zoneWrappers.set(callback, wrapped);

    return wrapped;
  }

  /**
   * Replaces a custom renderer of a column with a renderer function.
   *
   * @param cellSettings The column, a copy the caller owns.
   */
  private resolveColumnRenderer(cellSettings: ColumnSettings): void {
    const renderer = cellSettings.renderer;

    if (!this.isCustomRenderer(renderer)) {
      return;
    }

    const props: any = cellSettings.rendererProps ?? {};

    if (this.isAdvancedRendererComponentRefType(renderer)) {
      cellSettings.renderer = this.dynamicComponentService.createRendererWithFactory(renderer, props);
    } else {
      cellSettings.renderer = this.dynamicComponentService.createRendererFromComponent(renderer, props);
    }
  }

  /**
   * Replaces an editor component of a column with an editor class, and creates the component.
   *
   * @param cellSettings The column, a copy the caller owns.
   * @param previousColumn The column at the same index in the previous settings cycle, used to
   *   recycle its editor component.
   * @returns The editor component the column holds now, or `undefined` when it declares none.
   */
  private resolveColumnEditor(
    cellSettings: ColumnSettings,
    previousColumn?: ColumnSettings
  ): ComponentRef<HotCellEditorComponent<any>> | undefined {
    const isAdvanced = this.isAdvancedEditorComponentRefType(cellSettings.editor);
    const isBasic = this.isEditorComponentRefType(cellSettings.editor);

    if (!isAdvanced && !isBasic) {
      return undefined;
    }

    const editorType = cellSettings.editor as Type<HotCellEditorComponent<any>> | Type<HotCellEditorAdvancedComponent<any>>;
    const reusableRef = this.reusableEditorRef(previousColumn, cellSettings, editorType);
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

    return internalSettings._editorComponentReference;
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
   * Replaces a validator that returns a boolean with one that answers through the callback.
   *
   * @param cellSettings The column, a copy the caller owns.
   */
  private resolveColumnValidator(cellSettings: ColumnSettings): void {
    const customValidatorFn = cellSettings.validator;

    if (!this.isCustomValidatorFn(customValidatorFn)) {
      return;
    }

    cellSettings.validator = (value: any, callback: (result: boolean) => void) => {
      callback(customValidatorFn(value));
    };
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
