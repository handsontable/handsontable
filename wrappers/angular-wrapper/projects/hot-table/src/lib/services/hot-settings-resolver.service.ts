import { createComponent, EnvironmentInjector, Injectable, TemplateRef, Type } from '@angular/core';
import { DynamicComponentService } from '../renderer/hot-dynamic-renderer-component.service';
import { BaseEditorAdapter } from '../editor/base-editor-adapter';
import { GridSettings, GridSettingsInternal } from '../models/grid-settings';
import { CustomValidatorFn, ColumnSettings } from '../models/column-settings';
import { HotCellRendererComponent } from '../renderer/hot-cell-renderer.component';
import { HotCellEditorComponent } from '../editor/hot-cell-editor.component';

/**
 * Service to resolve and apply custom settings for Handsontable settings object.
 */
@Injectable()
export class HotSettingsResolver {
  constructor(private dynamicComponentService: DynamicComponentService, private readonly environmentInjector: EnvironmentInjector) {}

  /**
   * Applies custom settings to the provided GridSettings.
   * @param settings The original grid settings.
   * @returns The merged grid settings with custom settings applied.
   */
  applyCustomSettings(settings: GridSettings): GridSettingsInternal {
    const mergedSettings: GridSettings = settings;

    this.updateColumnRendererForGivenCustomRenderer(mergedSettings);
    this.updateColumnEditorForGivenCustomEditor(mergedSettings);
    this.updateColumnValidatorForGivenCustomValidator(mergedSettings);

    return (mergedSettings as GridSettingsInternal) ?? {};
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
      ?.filter((settings) => this.isRendererComponentRefType(settings.renderer) || this.isTemplateRef(settings.renderer))
      ?.forEach((cellSettings) => {
        const renderer = this.isTemplateRef(cellSettings.renderer)
          ? (cellSettings.renderer as TemplateRef<any>)
          : (cellSettings.renderer as Type<HotCellRendererComponent<any, any>>);
        const props: any = cellSettings.rendererProps ?? {};
        cellSettings.renderer = this.dynamicComponentService.createRendererFromComponent(renderer, props);
      });
  }

  /**
   * Updates the column editor for columns with a custom editor.
   * @param mergedSettings The merged grid settings.
   */
  private updateColumnEditorForGivenCustomEditor(mergedSettings: GridSettings): void {
    if (!Array.isArray(mergedSettings?.columns)) {
      return;
    }

    (mergedSettings?.columns as ColumnSettings[])
      ?.filter((settings) => this.isEditorComponentRefType(settings.editor))
      ?.forEach((cellSettings) => {
        const customEditor = cellSettings.editor as Type<HotCellEditorComponent<any>>;
        cellSettings['_editorComponentReference'] = createComponent(customEditor, {
          environmentInjector: this.environmentInjector,
        });
        cellSettings['_environmentInjector'] = this.environmentInjector;
        cellSettings.editor = BaseEditorAdapter;
      });
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
    return typeof editor === 'function' && !!(editor as any)?.ɵcmp;
  }

  private isRendererComponentRefType(renderer: any): renderer is Type<HotCellRendererComponent<any, any>> {
    // ecmp - we need it to check if the renderer is a component
    return typeof renderer === 'function' && !!(renderer as any)?.ɵcmp;
  }

  private isTemplateRef(renderer: any): renderer is TemplateRef<any> {
    return renderer instanceof TemplateRef;
  }
}
