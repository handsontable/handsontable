import sizing from '../../themes/variables/sizing';
import densitySizes from '../../themes/variables/density';
import {
  validateParams,
  validateDensityType,
  validateColorScheme,
} from './helpers';
import { isObject, deepClone, deepMerge } from '../../helpers/object';

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
   * @param {object} baseTheme The base theme object with sizing, icons, density, colors, and tokens properties.
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

    this.#listeners.forEach((listener) => {
      listener(config);
    });
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

    return () => {
      this.#listeners.delete(listener);
    };
  }

  /**
   * Sets multiple theme parameters at once.
   *
   * @param {object} paramsObject An object containing key-value pairs of parameters to set.
   * @returns {ThemeBuilder} Returns the ThemeBuilder instance for chaining.
   *
   */
  params(paramsObject) {
    validateParams(paramsObject, 'params');

    const config = deepClone(this.#initThemeConfig || this.#themeConfig);

    ['sizing', 'icons', 'colors', 'tokens'].forEach((key) => {
      if (paramsObject[key] !== undefined && isObject(paramsObject[key])) {
        config[key] = deepMerge(config[key], paramsObject[key]);
      }
    });

    if (paramsObject.density !== undefined) {
      if (isObject(paramsObject.density)) {
        config.density = deepMerge(config.density, paramsObject.density);
        this.#densityType = paramsObject.density.type;
      } else if (typeof paramsObject.density === 'string') {
        this.#densityType = paramsObject.density;
        config.density.type = paramsObject.density;
      }
    }

    if (paramsObject.colorScheme !== undefined) {
      this.#colorScheme = paramsObject.colorScheme;
      config.colorScheme = paramsObject.colorScheme;
    }

    this.#themeConfig = config;

    if (!this.#initThemeConfig) {
      this.#initThemeConfig = config;
    }

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
