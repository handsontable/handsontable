import {
  AfterViewInit,
  ChangeDetectionStrategy,
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
  ViewEncapsulation
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Handsontable from 'handsontable/base';
import { HotSettingsResolver } from './services/hot-settings-resolver.service';
import { HotGlobalConfigService } from './services/hot-global-config.service';
import { GridSettings } from './models/grid-settings';
import { verifyAngularVersion } from './angular-version-checker';
import { skip } from 'rxjs/operators';

export const HOT_DESTROYED_WARNING = 'The Handsontable instance bound to this component was destroyed and cannot be used properly.';

@Component({
  selector: 'hot-table',
  template: '<div #container></div>',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private static _angularVersionVerified = false;

  /** The data for the Handsontable instance. */
  @Input() data: Handsontable.GridSettings['data'] | null = null;
  /** The settings for the Handsontable instance. */
  @Input() settings: GridSettings = {};

  @ViewChild('container')
  private container: ElementRef<HTMLDivElement>;

  /** The Handsontable instance. */
  private __hotInstance: Handsontable | null = null;

  constructor(
    private readonly _hotSettingsResolver: HotSettingsResolver,
    private readonly _hotConfig: HotGlobalConfigService,
    private readonly ngZone: NgZone,
    private readonly environmentInjector: EnvironmentInjector,
    private readonly destroyRef: DestroyRef,
  ) {
    if (!HotTableComponent._angularVersionVerified) {
      HotTableComponent._angularVersionVerified = true;
      verifyAngularVersion();
    }
  }

  /**
   * Gets the Handsontable instance.
   * @returns The Handsontable instance or `null` if it's not yet been created or has been destroyed.
   */
  public get hotInstance(): Handsontable | null {
    if (this.__hotInstance?.isDestroyed) {
      console.warn(HOT_DESTROYED_WARNING);
      return null;
    }

    return this.__hotInstance;
  }

  /**
   * Sets the Handsontable instance.
   * @param hotInstance The Handsontable instance to set.
   */
  private set hotInstance(hotInstance: Handsontable | null) {
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

      (this.hotInstance as any)._angularEnvironmentInjector = this.environmentInjector;

      this.hotInstance.init();
    });

    this._hotConfig.config$.pipe(skip(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
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
      this.destroyEditorComponentRefs();
      const newOptions: Handsontable.GridSettings = this._hotSettingsResolver.applyCustomSettings(
        changes.settings.currentValue
      );

      const dataChanged = changes.data && !changes.data.firstChange;
      this.updateHotTable(dataChanged ? { ...newOptions, data: changes.data.currentValue } : newOptions);
      return;
    }

    if (changes.data && !changes.data.firstChange) {
      this.ngZone.runOutsideAngular(() => {
        this.hotInstance.updateData(changes.data.currentValue);
      });
    }
  }

  /**
   * Destroys the Handsontable instance and clears the columns from custom editors.
   */
  ngOnDestroy(): void {
    if (!this.hotInstance) {
      return;
    }

    this.destroyEditorComponentRefs();

    this.ngZone.runOutsideAngular(() => {
      this.hotInstance.destroy();
      this.hotInstance = null;
    });
  }

  private destroyEditorComponentRefs(): void {
    const columns = this.hotInstance.getSettings().columns;

    if (Array.isArray(columns)) {
      columns.forEach((column) => column._editorComponentReference?.destroy());
    }
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
      this.hotInstance.updateSettings(filteredSettings, false);
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
