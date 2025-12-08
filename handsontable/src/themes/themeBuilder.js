import sizing from './variables/sizing';
import density from './variables/density';

/**
 * ThemeBuilder class provides methods to build and configure themes.
 *
 * @class ThemeBuilder
 */
export default class ThemeBuilder {
  /**
   * Theme configuration object.
   *
   * @private
   * @type {object}
   */
  #themeConfig;

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
    if (typeof baseTheme !== 'object' || baseTheme === null) {
      throw new Error('baseTheme must be an object');
    }

    // Deep clone the theme to avoid mutating the original
    this.#themeConfig = {
      icons: baseTheme.icons ? { ...baseTheme.icons } : {},
      colors: baseTheme.colors ? { ...baseTheme.colors } : {},
      tokens: baseTheme.tokens ? { ...baseTheme.tokens } : {},
    };

    if (
      typeof baseTheme.density === 'object'
      && baseTheme.density !== null
      && typeof baseTheme.density.sizes === 'object'
      && typeof baseTheme.density.type === 'string'
    ) {
      const densitySizes = { ...density, ...baseTheme.density.sizes };

      this.#themeConfig.density = { ...densitySizes[baseTheme.density.type] };
    } else if (typeof baseTheme.density === 'string') {
      if (density[baseTheme.density]) {
        this.#themeConfig.density = density[baseTheme.density];
      } else {
        throw new Error(`Invalid density: ${baseTheme.density}. Must be one of ${Object.keys(density).join(', ')}.`);
      }
    } else {
      this.#themeConfig.density = density.default;
    }
  }

  /**
   * Sets multiple theme parameters at once.
   *
   * @param {object} paramsObject An object containing key-value pairs of parameters to set.
   * @returns {ThemeBuilder} Returns the ThemeBuilder instance for chaining.
   *
   */
  params(paramsObject) {
    if (typeof paramsObject !== 'object' || paramsObject === null) {
      throw new Error('paramsObject must be an object');
    }

    const mergeObject = (obj1, obj2) => {
      Object.keys(obj2).forEach((key) => {
        if (typeof obj2[key] === 'object' && obj2[key] !== null) {
          obj1[key] = mergeObject(obj1[key], obj2[key]);
        } else {
          obj1[key] = obj2[key];
        }
      });

      return obj1;
    };

    Object.keys(paramsObject).forEach((key) => {
      this.#themeConfig[key] = mergeObject(this.#themeConfig[key], paramsObject[key]);
    });

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
    if (mode !== 'light' && mode !== 'dark' && mode !== 'auto') {
      throw new Error(`Invalid color mode: ${mode}. Must be 'light', 'dark', or 'auto'.`);
    }

    this.#colorScheme = mode;

    return this;
  }

  /**
   * Gets the current theme configuration.
   *
   * @returns {object} The theme configuration object.
   */
  getThemeConfig() {
    return {
      sizing,
      ...this.#themeConfig,
      colorScheme: this.#colorScheme,
    };
  }
}

