import {Injectable, InjectionToken, Inject} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

/**
 * A constant representing the non-commercial and evaluation license.
 * */
export const NON_COMMERCIAL_LICENSE = 'non-commercial-and-evaluation';

/**
 * Type representing a theme name.
 * Possible values include predefined themes and any custom string.
 */
export enum PredefinedTheme {
  Main = 'ht-theme-main',
  MainDark = 'ht-theme-main-dark',
  MainDarkAuto = 'ht-theme-main-dark-auto',
  Horizon = 'ht-theme-horizon',
  HorizonDark = 'ht-theme-horizon-dark',
  HorizonDarkAuto = 'ht-theme-horizon-dark-auto'
}

export type ThemeName = PredefinedTheme | string;

/**
 * Interface for the Handsontable global configuration.
 */
export interface HotGlobalConfig {
  /**
   * The license key for Handsontable.
   */
  license?: string;

  /**
   * The name of the theme to be used.
   */
  themeName?: ThemeName;

  /**
   * The language code to be used for localization.
   * For example, 'en-US', 'pl-PL', etc.
   * **Note:** The language must be chosen from the languages supported by Handsontable and registered in the application.
   */
  language?: string;

  /**
   * The layout direction for the Handsontable instance.
   * This property defines whether the layout should be left-to-right ('ltr'), right-to-left ('rtl'),
   * or inherit the direction from the parent element ('inherit').
   */
  layoutDirection?: 'ltr' | 'rtl' | 'inherit';
}

/**
 * Injection token for providing a global default configuration.
 */
export const HOT_GLOBAL_CONFIG = new InjectionToken<HotGlobalConfig>('HOT_GLOBAL_CONFIG', {
  providedIn: 'root',
  factory: () => ({})
});

/**
 * Service for configuring Handsontable settings.
 * This service allows setting and retrieving global configuration.
 */
@Injectable({
  providedIn: 'root',
})
export class HotGlobalConfigService {

  /**
   * The default configuration object for Handsontable.
   *
   * This object is used as the initial value for the configuration BehaviorSubject.
   * It can be overridden by a global configuration provided through the
   * {@link HOT_GLOBAL_CONFIG} injection token.
   *
   * @private
   * @type {HotGlobalConfig}
   */
  private defaultConfig: HotGlobalConfig = {
    license: undefined,
    themeName: ''
  };

  /**
   * A BehaviorSubject that holds the current Handsontable configuration.
   *
   * New configuration values can be emitted by calling next() on this subject.
   * This allows subscribers to react to configuration changes dynamically.
   *
   * @private
   * @type {BehaviorSubject<HotGlobalConfig>}
   */
  private configSubject = new BehaviorSubject<HotGlobalConfig>(this.defaultConfig);

  /**
   * An Observable stream of the current Handsontable configuration.
   *
   * Components can subscribe to this observable to receive updates whenever the configuration changes.
   *
   * @returns The configuration as an observable stream.
   */
  get config$(): Observable<HotGlobalConfig> {
    return this.configSubject.asObservable();
  }

  constructor(
    @Inject(HOT_GLOBAL_CONFIG) globalConfig: HotGlobalConfig
  ) {
    // Merge global configuration (if provided) into defaultConfig immutably.
    this.defaultConfig = { ...this.defaultConfig, ...globalConfig };
    this.configSubject.next(this.defaultConfig);
  }

  /**
   * Sets the global configuration for Handsontable.
   *
   * @param config - An object containing configuration options.
   *                 Each Handsontable instance can override this configuration by providing its own settings.
   */
  setConfig(config: HotGlobalConfig) {
    this.configSubject.next({ ...this.defaultConfig, ...config });
  }

  /**
   * Retrieves the current Handsontable configuration.
   *
   * @returns An object with the current settings.
   */
  getConfig(): HotGlobalConfig {
    return this.configSubject.value;
  }

  /**
   * Resets the configuration to the default settings.
   * This method updates the configuration BehaviorSubject with the default configuration.
   */
  resetConfig(): void {
    this.configSubject.next({ ...this.defaultConfig });
  }
}
