import {
  createComponent,
  EnvironmentInjector,
  Injectable,
} from '@angular/core';
import { DynamicComponentService } from '../renderer/hot-dynamic-renderer-component.service';
import { BaseEditorAdapter } from '../editor/base-editor-adapter';
import { GridSettings, GridSettingsInternal } from '../models/grid-settings';
import {
  ColumnSettings,
  ColumnSettingsInternal,
} from '../models/column-settings';

/**
 * Service to resolve and apply custom settings for Handsontable settings object.
 */
@Injectable()
export class HotSettingsResolver {
  constructor(
    private dynamicComponentService: DynamicComponentService,
    private readonly environmentInjector: EnvironmentInjector
  ) {}

  /**
   * Applies custom settings to the provided GridSettings.
   * @param settings The original grid settings.
   * @returns The merged grid settings with custom settings applied.
   */
  applyCustomSettings(settings: GridSettings): GridSettingsInternal {
    const mergedSettings: GridSettingsInternal = settings;

    this.updateColumnRendererForGivenCustomRenderer(mergedSettings);
    this.updateColumnEditorForGivenCustomEditor(mergedSettings);
    this.updateColumnValidatorForGivenCustomValidator(mergedSettings);

    return mergedSettings ?? {};
  }

  /**
   * Updates the column renderer for columns with a custom renderer.
   * @param mergedSettings The merged grid settings.
   */
  private updateColumnRendererForGivenCustomRenderer(
    mergedSettings: GridSettingsInternal
  ): void {
    (mergedSettings?.columns as ColumnSettingsInternal[])
      ?.filter((settings) => settings.componentRenderer)
      ?.forEach((cellSettings) => {
        const props: any = cellSettings.componentRendererProps ?? {};
        cellSettings.renderer =
          this.dynamicComponentService.createRendererFromComponent(
            cellSettings.componentRenderer,
            props
          );
      });
  }

  /**
   * Updates the column editor for columns with a custom editor.
   * @param mergedSettings The merged grid settings.
   */
  private updateColumnEditorForGivenCustomEditor(
    mergedSettings: GridSettingsInternal
  ): void {
    (mergedSettings?.columns as ColumnSettings[])
      ?.filter((settings) => settings.customEditor)
      ?.forEach((cellSettings) => {
        cellSettings.editor = BaseEditorAdapter;
        cellSettings._editorComponentReference = createComponent(
          cellSettings.customEditor,
          {
            environmentInjector: this.environmentInjector,
          }
        );
        cellSettings._environmentInjector = this.environmentInjector;
      });
  }

  /**
   * Updates the column validator for columns with a custom validator.
   * @param mergedSettings The merged grid settings.
   */
  private updateColumnValidatorForGivenCustomValidator(
    mergedSettings: GridSettingsInternal
  ): void {
    (mergedSettings?.columns as ColumnSettingsInternal[])
      ?.filter((settings) => settings.customValidator)
      ?.forEach((cellSettings) => {
        cellSettings.validator = (
          value: any,
          callback: (result: boolean) => void
        ) => {
          callback(cellSettings.customValidator(value));
        };
      });
  }
}
