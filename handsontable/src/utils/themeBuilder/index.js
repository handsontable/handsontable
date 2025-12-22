import sizing from '../../themes/variables/sizing';
import densitySizes from '../../themes/variables/density';
import { validateParams, validateDensityType, validateColorScheme } from './helpers';
import { isObject, deepClone, deepMerge } from '../../helpers/object';

/**
 * Config keys that support deep merging when updating theme params.
 *
 * @type {string[]}
 */
const MERGEABLE_CONFIG_KEYS = ['sizing', 'icons', 'colors', 'tokens'];

/**
 * ThemeBuilder class provides methods to build and configure themes.
 *
 * @class ThemeBuilder
 */
class ThemeBuilder {
  /**
   * The initial theme configuration object.
   *
   * @private
   * @type {object}
   */
  #initThemeConfig;

  /**
   * Theme configuration object.
   *
   * @private
   * @type {object}
   */
  #themeConfig;

  /**
   * Registered listeners notified when the theme configuration changes.
   *
   * @private
   * @type {Set<Function>}
   */
  #listeners = new Set();

  /**
   * Current color mode ('light', 'dark', or 'auto').
   *
   * @private
   * @type {string}
   */
  #colorScheme = 'auto';

  /**
   * Current density type ('compact', 'default', or 'comfortable').
   *
   * @private
   * @type {string}
   */
  #densityType = 'default';

  /**
   * The theme builder constructor.
   *
   * @param {object} baseTheme - The base theme object with `sizing`, `density`, `icons`, `colors`, `tokens`, and `colorScheme` properties.
   */
  constructor(baseTheme) {
    this.#themeConfig = {
      sizing,
      density: {
        type: this.#densityType,
        sizes: densitySizes,
      },
      icons: {},
      colors: {},
      tokens: {},
      colorScheme: this.#colorScheme,
    };

    this.params(baseTheme);
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
  #applyDensityConfig(config, density) {
    if (isObject(density)) {
      config.density = deepMerge(config.density, density);

      this.#densityType = density.type;

      if (this.#initThemeConfig?.density) {
        this.#initThemeConfig.density.type = density.type;
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
   * Subscribes to theme configuration changes.
   *
   * @param {Function} listener The callback invoked with the updated theme configuration.
   * @returns {Function} An unsubscribe function.
   */
  subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('[ThemeBuilder] listener must be a function.');
    }

    this.#listeners.add(listener);

    return () => this.#listeners.delete(listener);
  }

  /**
   * Sets multiple theme parameters at once.
   *
   * @param {object} paramsObject An object containing key-value pairs of parameters to set.
   * @returns {ThemeBuilder} Returns the ThemeBuilder instance for chaining.
   */
  params(paramsObject) {
    validateParams(paramsObject, 'params');

    const config = deepClone(this.#initThemeConfig ?? this.#themeConfig);

    // Apply mergeable config keys
    MERGEABLE_CONFIG_KEYS.forEach((key) => {
      if (paramsObject[key] !== undefined && isObject(paramsObject[key])) {
        config[key] = deepMerge(config[key], paramsObject[key]);
      }
    });

    // Apply density (special handling for string or object)
    if (paramsObject.density !== undefined) {
      this.#applyDensityConfig(config, paramsObject.density);
    }

    // Apply color scheme
    if (paramsObject.colorScheme !== undefined) {
      config.colorScheme = paramsObject.colorScheme;

      this.#colorScheme = paramsObject.colorScheme;

      if (this.#initThemeConfig?.colorScheme) {
        this.#initThemeConfig.colorScheme = paramsObject.colorScheme;
      }
    }

    this.#themeConfig = config;
    this.#initThemeConfig ??= config;

    this.#notifyChange();

    return this;
  }

  /**
   * Sets the color mode (light, dark, or auto).
   *
   * @param {string} mode The color mode ('light', 'dark', or 'auto').
   * @returns {ThemeBuilder} Returns the ThemeBuilder instance for chaining.
   *
   * @example
   * ```js
   * const myTheme = mainTheme.setColorScheme('dark');
   * ```
   */
  setColorScheme(mode) {
    this.#colorScheme = validateColorScheme(mode);
    this.#themeConfig.colorScheme = this.#colorScheme;
    this.#initThemeConfig.colorScheme = this.#colorScheme;

    this.#notifyChange();

    return this;
  }

  /**
   * Sets the density type (compact, default, or comfortable).
   *
   * @param {string} type The density type ('compact', 'default', or 'comfortable').
   * @returns {ThemeBuilder} Returns the ThemeBuilder instance for chaining.
   *
   * @example
   * ```js
   * const myTheme = mainTheme.setDensity('compact');
   * ```
   */
  setDensityType(type) {
    this.#densityType = validateDensityType(type);
    this.#themeConfig.density.type = this.#densityType;
    this.#initThemeConfig.density.type = this.#densityType;

    this.#notifyChange();

    return this;
  }

  /**
   * Gets the current theme configuration.
   *
   * @returns {object} The theme configuration object.
   */
  getThemeConfig() {
    return this.#themeConfig;
  }
}

/**
 * Creates a new ThemeBuilder instance.
 *
 * @param {object} baseTheme The base theme object with light, dark, theme, and icons properties.
 * @returns {ThemeBuilder} The ThemeBuilder instance.
 */
export function createTheme(baseTheme = {}) {
  return new ThemeBuilder(baseTheme);
}
