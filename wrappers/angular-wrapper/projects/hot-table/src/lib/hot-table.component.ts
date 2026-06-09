import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Handsontable from 'handsontable/base';
import { HotSettingsResolver } from './services/hot-settings-resolver.service';
import { HotGlobalConfigService } from './services/hot-global-config.service';
import { GridSettings } from './models/grid-settings';
import { DynamicComponentService } from './renderer/hot-dynamic-renderer-component.service';
import { HotInstanceWithAngularInjector } from './editor/models/factory-editor-properties';
import { skip } from 'rxjs/operators';

export const HOT_DESTROYED_WARNING = 'The Handsontable instance bound to this component was destroyed and cannot be' + ' used properly.';

@Component({
  selector: 'hot-table',
  template: '<div #container></div>',
  encapsulation: ViewEncapsulation.None,
  providers: [HotSettingsResolver],
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class HotTableComponent implements AfterViewInit, OnChanges, OnDestroy {
  // component inputs
  /** The data for the Handsontable instance. */
  @Input() data: Handsontable.GridSettings['data'] | null = null;
  /** The settings for the Handsontable instance. */
  @Input() settings: GridSettings = {};

  /** The container element for the Handsontable instance. */
  @ViewChild('container', { static: false })
  public container: ElementRef<HTMLDivElement>;

  /** The Handsontable instance. */
  private __hotInstance: Handsontable | null = null;
  private readonly _destroyRef = inject(DestroyRef);

  constructor(
    private _hotSettingsResolver: HotSettingsResolver,
    private _hotConfig: HotGlobalConfigService,
    public ngZone: NgZone,
    private readonly environmentInjector: EnvironmentInjector,
    private readonly _dynamicComponentService: DynamicComponentService
  ) {}

  /**
   * Gets the Handsontable instance.
   * @returns The Handsontable instance or `null` if it's not yet been created or has been destroyed.
   */
  public get hotInstance(): Handsontable | null {
    if (!this.__hotInstance || !this.__hotInstance.isDestroyed) {
      // Will return the Handsontable instance or `null` if it's not yet been created.
      return this.__hotInstance;
    } else {
      console.warn(HOT_DESTROYED_WARNING);
      return null;
    }
  }

  /**
   * Sets the Handsontable instance.
   * @param hotInstance The Handsontable instance to set.
   */
  private set hotInstance(hotInstance) {
    this.__hotInstance = hotInstance;
  }

  /**
   * Initializes the Handsontable instance after the view has been initialized.
   * The initial settings of the table are also prepared here
   */
  ngAfterViewInit(): void {
    let options: Handsontable.GridSettings = this._hotSettingsResolver.applyCustomSettings(this.settings);

    const negotiatedSettings = this.getNegotiatedSettings(options);
    options = { ...options, ...negotiatedSettings, ...(this.data != null ? { data: this.data } : {}) };

    this.ngZone.runOutsideAngular(() => {
      this.hotInstance = new Handsontable.Core(this.container.nativeElement, options);

      (this.hotInstance as HotInstanceWithAngularInjector)._angularEnvironmentInjector = this.environmentInjector;

      this.hotInstance.init();
    });

    this._hotConfig.config$.pipe(skip(1), takeUntilDestroyed(this._destroyRef)).subscribe((config) => {
      if (this.hotInstance) {
        const negotiatedSettings = this.getNegotiatedSettings(this.settings);
        this.updateHotTable(negotiatedSettings);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.hotInstance === null) {
      return;
    }

    if (changes.settings && !changes.settings.firstChange) {
      // Capture old editor refs before applying new settings so HOT can close any active editor first.
      const prevColumns = this.__hotInstance?.getSettings().columns;
      const prevColumnsArray = Array.isArray(prevColumns) ? prevColumns : undefined;

      // Pass the previous columns so unchanged editor types recycle their existing component
      // instead of creating a fresh one on every settings change.
      const newOptions: Handsontable.GridSettings = this._hotSettingsResolver.applyCustomSettings(
        changes.settings.currentValue,
        prevColumnsArray
      );

      // updateHotTable closes any active editor via HOT.updateSettings before we destroy old refs.
      this.updateHotTable(newOptions);

      // Only destroy old editor refs when new settings actually replace columns.
      // If newOptions has no columns, HOT keeps the old column objects active — destroying
      // their refs would crash FactoryEditorAdapter / BaseEditorAdapter on next edit.
      if (prevColumnsArray && Array.isArray(newOptions.columns)) {
        // Refs recycled into the new columns must survive — destroy only the ones left behind.
        const reusedRefs = new Set(
          newOptions.columns
            .map((column) => column._editorComponentReference)
            .filter((ref): ref is NonNullable<typeof ref> => !!ref)
        );

        prevColumnsArray.forEach((column) => {
          if (column._editorComponentReference && !reusedRefs.has(column._editorComponentReference)) {
            column._editorComponentReference.destroy();
          }
        });
      }
    }

    if (changes.data && !changes.data.firstChange) {
      this.hotInstance?.updateData(changes.data.currentValue);
    }
  }

  /**
   * Destroys the Handsontable instance and clears the columns from custom editors.
   */
  ngOnDestroy(): void {
    this.ngZone.runOutsideAngular(() => {
      if (!this.__hotInstance || this.__hotInstance.isDestroyed) {
        return;
      }

      // Destroy renderer Angular components attached to table cells before HOT removes the DOM.
      if (this.container) {
        this._dynamicComponentService.cleanupContainer(this.container.nativeElement, this.__hotInstance);
      }

      const columns = this.__hotInstance.getSettings().columns;

      if (columns && Array.isArray(columns)) {
        columns.forEach((column) => {
          if (column._editorComponentReference) {
            column._editorComponentReference.destroy();
          }
        });
      }

      this.__hotInstance.destroy();
    });
  }

  /**
   * Updates the Handsontable instance with new settings.
   * @param newSettings The new settings to apply to the Handsontable instance.
   */
  private updateHotTable(newSettings: Handsontable.GridSettings): void {
    if (!this.hotInstance) {
      return;
    }

    const initOnlySettingKeys = new Set<string>(
      (this.hotInstance.getSettings() as any)?._initOnlySettings ?? []
    );
    const filteredSettings: Handsontable.GridSettings = {};

    for (const key of Object.keys(newSettings)) {
      if (!initOnlySettingKeys.has(key)) {
        (filteredSettings as any)[key] = (newSettings as any)[key];
      }
    }

    this.ngZone.runOutsideAngular(() => {
      this.hotInstance?.updateSettings(filteredSettings, false);
    });
  }

  /**
   * Merges the provided Handsontable grid settings with the global configuration.
   *
   * This method retrieves the global configuration from the HotGlobalConfigService and negotiates the final
   * Handsontable settings by giving precedence to the provided settings.
   * Additionally, the `layoutDirection` is only merged if the Handsontable instance has not yet been initialized.
   *
   * @param settings - The grid settings provided by the user or component.
   * @returns The final negotiated grid settings after merging with global defaults.
   */
  private getNegotiatedSettings(settings: GridSettings): Handsontable.GridSettings {
    const hotConfig = this._hotConfig.getConfig();
    const negotiatedSettings: Handsontable.GridSettings = {};

    negotiatedSettings.licenseKey = settings.licenseKey ?? hotConfig.license;
    negotiatedSettings.language = settings.language ?? hotConfig.language;

    const theme = settings.theme ?? hotConfig.theme;
    const themeName = settings.themeName ?? hotConfig.themeName;

    if (theme !== undefined) {
      negotiatedSettings.theme = theme as Handsontable.GridSettings['theme'];
    } else if (themeName) {
      negotiatedSettings.themeName = themeName;
    }

    // settings that can be set only before the Handsontable instance is initialized
    if (!this.__hotInstance) {
      negotiatedSettings.layoutDirection = settings.layoutDirection ?? hotConfig.layoutDirection;
    }

    return negotiatedSettings;
  }
}
