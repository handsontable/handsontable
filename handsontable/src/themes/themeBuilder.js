import { isObject } from '../helpers/object';

/**
 * ThemeBuilder class provides methods to build and configure themes.
 *
 * @class ThemeBuilder
 */
export class ThemeBuilder {
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
    if (!isObject(baseTheme)) {
      throw new Error('baseTheme must be an object');
    }

    // Deep clone the theme to avoid mutating the original
    this.#themeConfig = {
      light: baseTheme.light ? { ...baseTheme.light } : {},
      dark: baseTheme.dark ? { ...baseTheme.dark } : {},
      theme: baseTheme.theme ? { ...baseTheme.theme } : {},
      icons: baseTheme.icons ? { ...baseTheme.icons } : {},
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
    if (!isObject(paramsObject)) {
      throw new Error('paramsObject must be an object');
    }

    this.#themeConfig = {
      ...this.#themeConfig,
      ...paramsObject,
    };

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
   * const myTheme = mainTheme.setColorMode('dark');
   * ```
   */
  setColorMode(mode) {
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
      ...this.#themeConfig,
      colorScheme: this.#colorScheme,
    };
  }
}

