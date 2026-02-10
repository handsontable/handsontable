import { isObject, deepClone, deepMerge } from '../../helpers/object';
import sizing from '../static/variables/sizing';
import densitySizes from '../static/variables/density';
import { validateParams, validateDensityType, validateColorScheme } from './utils/validation';
import { warn } from '../../helpers/console';
import type { ThemeConfig, ThemeParams, ThemeColorScheme, DensityType } from '../types';

/**
 * Config keys that support deep merging when updating theme params.
 *
 * @type {string[]}
 */
const MERGEABLE_CONFIG_KEYS = ['sizing', 'icons', 'colors', 'tokens'];

/**
 * Required config keys.
 *
 * @type {string[]}
 */
const REQUIRED_CONFIG_KEYS = ['name', 'icons', 'colors', 'tokens'];

/**
 * ThemeBuilder class provides methods to build and configure themes.
 *
 * @class ThemeBuilder
 */
export class ThemeBuilder {
  /**
   * The initial theme configuration object.
   *
   * @private
   * @type {object}
   */
  #initThemeConfig: ThemeConfig & Record<string, unknown>;

  /**
   * Theme configuration object.
   *
   * @private
   * @type {object}
   */
  #themeConfig!: ThemeConfig & Record<string, unknown>;

  /**
   * Registered listeners notified when the theme configuration changes.
   *
   * @private
   * @type {Set<Function>}
   */
  #listeners: Set<(config: ThemeConfig) => void> = new Set();

  /**
   * Current color mode ('light', 'dark', or 'auto').
   *
   * @private
   * @default 'auto'
   * @type {string}
   */
  #colorScheme: ThemeColorScheme = 'auto';

  /**
   * Current density type ('compact', 'default', or 'comfortable').
   *
   * @private
   * @default 'default'
   * @type {string}
   */
  #densityType: DensityType = 'default';

  /**
   * The theme builder constructor.
   *
   * @param {object} themeConfig - The theme config object with `name`, `sizing`, `density`, `icons`, `colors`, `tokens`, and `colorScheme` properties.
   */
  constructor(themeConfig: ThemeParams) {
    validateParams(themeConfig, 'themeConfig', {
      requiredFields: REQUIRED_CONFIG_KEYS,
    });

    this.#initThemeConfig = {
      name: undefined,
      sizing,
      density: {
        type: this.#densityType as DensityType,
        sizes: densitySizes,
      },
      icons: {},
      colors: {},
      tokens: {},
      colorScheme: this.#colorScheme as ThemeColorScheme,
    } as ThemeConfig & Record<string, unknown>;

    this.#setParams(themeConfig);
    this.#initThemeConfig = this.#themeConfig;
  }

  /**
   * Notifies all listeners about a theme configuration change.
   *
   * @private
   */
  #notifyChange() {
    const config = this.getThemeConfig();

    this.#listeners.forEach(listener => listener(config));
  }

  /**
   * Applies density configuration from the params object.
   *
   * @private
   * @param {object} config The config object to modify.
   * @param {string|object} density The density value from params.
   */
  #applyDensityConfig(config: Record<string, any>, density: DensityType | Record<string, unknown>) {
    if (isObject(density)) {
      config.density = deepMerge(config.density, density as Record<string, any>);

      this.#densityType = (density as Record<string, unknown>).type as DensityType;

      if (this.#initThemeConfig?.density) {
        this.#initThemeConfig.density.type = (density as Record<string, unknown>).type as DensityType;
      }
    } else if (typeof density === 'string') {
      config.density.type = density;

      this.#densityType = density;

      if (this.#initThemeConfig?.density) {
        this.#initThemeConfig.density.type = density;
      }
    }
  }

  /**
   * Sets the parameters to the theme configuration.
   *
   * @private
   * @param {object} paramsObject The parameters object to set.
   */
  #setParams(paramsObject: ThemeParams) {
    const config = deepClone(this.#initThemeConfig) as Record<string, any>;
    const params = paramsObject as Record<string, any>;

    if (params.name !== undefined) {
      if (this.#initThemeConfig.name !== undefined) {
        warn('[ThemeBuilder] The "name" property can only be set during ' +
          '`registerTheme()` and cannot be updated via `params()`.');
      } else {
        config.name = params.name;
      }
    }

    // Apply mergeable config keys
    MERGEABLE_CONFIG_KEYS.forEach((key) => {
      if (params[key] !== undefined && isObject(params[key])) {
        config[key] = deepMerge(config[key], params[key]);
      }
    });

    // Apply density (special handling for string or object)
    if (params.density !== undefined) {
      this.#applyDensityConfig(config, params.density as DensityType | Record<string, unknown>);
    }

    // Apply color scheme
    if (params.colorScheme !== undefined) {
      config.colorScheme = params.colorScheme;

      this.#colorScheme = params.colorScheme as ThemeColorScheme;

      if (this.#initThemeConfig?.colorScheme) {
        this.#initThemeConfig.colorScheme = params.colorScheme;
      }
    }

    this.#themeConfig = config as ThemeConfig & Record<string, unknown>;
  }

  /**
   * Subscribes to theme configuration changes.
   *
   * @param {Function} listener The callback invoked with the updated theme configuration.
   * @returns {Function} An unsubscribe function.
   */
  subscribe(listener: (config: ThemeConfig) => void): () => boolean {
    if (typeof listener !== 'function') {
      throw new Error('[ThemeBuilder] listener must be a function.');
    }

    this.#listeners.add(listener);

    return () => this.#listeners.delete(listener);
  }

  /**
   * Sets theme configuration parameters.
   *
   * @param {object} paramsObject An object with theme configuration parameters.
   * @returns {ThemeBuilder} The ThemeBuilder instance for chaining.
   */
  params(paramsObject: ThemeParams): ThemeBuilder {
    validateParams(paramsObject, 'params');

    this.#setParams(paramsObject);
    this.#notifyChange();

    return this;
  }

  /**
   * Sets the color mode (light, dark, or auto).
   *
   * @param {string} mode The color mode ('light', 'dark', or 'auto').
   * @returns {ThemeBuilder} The ThemeBuilder instance for chaining.
   */
  setColorScheme(mode: ThemeColorScheme): ThemeBuilder {
    this.#colorScheme = validateColorScheme(mode) as ThemeColorScheme;
    this.#themeConfig.colorScheme = this.#colorScheme;
    this.#initThemeConfig.colorScheme = this.#colorScheme;

    this.#notifyChange();

    return this;
  }

  /**
   * Sets the density type (compact, default, or comfortable).
   *
   * @param {string} type The density type ('compact', 'default', or 'comfortable').
   * @returns {ThemeBuilder} The ThemeBuilder instance for chaining.
   */
  setDensityType(type: DensityType): ThemeBuilder {
    this.#densityType = validateDensityType(type) as DensityType;
    this.#themeConfig.density.type = this.#densityType;
    this.#initThemeConfig.density.type = this.#densityType;

    this.#notifyChange();

    return this;
  }

  /**
   * Gets the current theme configuration.
   *
   * @returns {ThemeConfig} The theme configuration object.
   */
  getThemeConfig(): ThemeConfig {
    return this.#themeConfig;
  }
}

/**
 * Creates a new ThemeBuilder instance.
 *
 * @param {object} baseTheme The base theme object with theme configuration parameters.
 * @returns {ThemeBuilder} The ThemeBuilder instance.
 */
export function createTheme(baseTheme: ThemeParams): ThemeBuilder {
  return new ThemeBuilder(baseTheme);
}
