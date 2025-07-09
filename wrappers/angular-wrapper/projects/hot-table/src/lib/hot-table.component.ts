import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import Handsontable from 'handsontable/base';
import { HotSettingsResolver } from './services/hot-settings-resolver.service';
import { HotGlobalConfigService } from './services/hot-global-config.service';
import { GridSettings } from './models/grid-settings';
import { Subscription } from 'rxjs';

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
  private configSubscription: Subscription;

  constructor(private _hotSettingsResolver: HotSettingsResolver, private _hotConfig: HotGlobalConfigService, public ngZone: NgZone) {}

  /**
   * Gets the Handsontable instance.
   * @returns The Handsontable instance or `null` if it's not yet been created or has been destroyed.
   */
  public get hotInstance(): Handsontable | null {
    if (!this.__hotInstance || (this.__hotInstance && !this.__hotInstance.isDestroyed)) {
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
    let options: Handsontable.GridSettings = this._hotSettingsResolver.applyCustomSettings(this.settings, this.ngZone);

    const negotiatedSettings = this.getNegotiatedSettings(options);
    options = { ...options, ...negotiatedSettings, data: this.data };

    this.ngZone.runOutsideAngular(() => {
      this.hotInstance = new Handsontable.Core(this.container.nativeElement, options);

      this.hotInstance.init();
    });

    this.configSubscription = this._hotConfig.config$.subscribe((config) => {
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
      const newOptions: Handsontable.GridSettings = this._hotSettingsResolver.applyCustomSettings(
        changes.settings.currentValue,
        this.ngZone
      );

      this.updateHotTable(newOptions);
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
      if (!this.hotInstance) {
        return;
      }

      const columns = this.hotInstance.getSettings().columns;

      if (columns && Array.isArray(columns)) {
        columns.forEach((column) => {
          if (column._editorComponentReference) {
            column._editorComponentReference.destroy();
          }
        });
      }

      this.hotInstance.destroy();
    });

    this.configSubscription.unsubscribe();
  }

  /**
   * Updates the Handsontable instance with new settings.
   * @param newSettings The new settings to apply to the Handsontable instance.
   */
  private updateHotTable(newSettings: Handsontable.GridSettings): void {
    if (!this.hotInstance) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.hotInstance?.updateSettings(newSettings, false);
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
    negotiatedSettings.themeName = settings.themeName ?? hotConfig.themeName;
    negotiatedSettings.language = settings.language ?? hotConfig.language;

    // settings that can be set only before the Handsontable instance is initialized
    if (!this.__hotInstance) {
      negotiatedSettings.layoutDirection = settings.layoutDirection ?? hotConfig.layoutDirection;
    }

    return negotiatedSettings;
  }
}
