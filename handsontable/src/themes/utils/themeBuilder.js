import sizing from '../variables/sizing';
import densitySizes from '../variables/density';
import {
  isObject,
  deepMerge,
  validateInput,
  validateDensityType,
  validateColorScheme,
  cloneObject,
} from './helpers';

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
   * @param {object} baseTheme The base theme object with light, dark, theme, and icons properties.
   */
  constructor(baseTheme) {
    this.#themeConfig = {
      sizing,
      density: {
        type: 'default',
        sizes: densitySizes,
      },
    };

    if (baseTheme.colorScheme !== undefined) {
      this.setColorScheme(baseTheme.colorScheme);
    }

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
   * Applies a density parameter to the configuration.
   *
   * @param {object} config The configuration object to modify.
   * @param {string|object} value The density value (string type or object with type/sizes).
   * @private
   */
  #applyDensityParam(config, value) {
    if (typeof value === 'string') {
      config.density.type = validateDensityType(value, config.density.sizes);
    } else if (isObject(value) && value.type && value.sizes) {
      config.density = deepMerge(config.density, value);
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
    validateInput(paramsObject, 'params');

    const config = cloneObject(this.#initThemeConfig || this.#themeConfig);

    if (paramsObject.density !== undefined) {
      this.#applyDensityParam(config, paramsObject.density);
    }

    ['sizing', 'icons', 'colors', 'tokens'].forEach((key) => {
      if (paramsObject[key] !== undefined && isObject(paramsObject[key])) {
        config[key] = deepMerge(config[key], paramsObject[key]);
      }
    });

    if (!config.icons || !config.colors || !config.tokens) {
      throw new Error('[ThemeBuilder] icons, colors and tokens are required.');
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

    this.#notifyChange();

    return this;
  }

  /**
   * Gets the current theme configuration.
   *
   * @returns {object} The theme configuration object.
   */
  getThemeConfig() {
    return {
      ...this.#themeConfig,
      colorScheme: this.#colorScheme,
    };
  }
}

/**
 * Creates a new ThemeBuilder instance.
 *
 * @param {object} baseTheme The base theme object with light, dark, theme, and icons properties.
 * @returns {ThemeBuilder} The ThemeBuilder instance.
 */
export function createTheme(baseTheme) {
  return new ThemeBuilder(baseTheme);
}
