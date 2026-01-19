import { iconsMap } from '../static/variables/helpers/iconsMap';
import { flattenCssVariables } from './utils/cssVariables';

/**
 * The theme prefix.
 *
 * @type {string}
 */
const THEME_PREFIX = 'ht-theme-';

/**
 * ThemeManager class provides methods to manage the theme styles.
 *
 * @class ThemeManager
 */
export class ThemeManager {
  /**
   * The Handsontable instance.
   *
   * @type {Handsontable}
   */
  hot;
  /**
   * The theme styles element.
   *
   * @type {HTMLStyleElement}
   */
  themeStyles;
  /**
   * The theme class name.
   *
   * @type {string}
   */
  themeClassName;
  /**
   * The theme config.
   *
   * @type {object}
   */
  themeConfig;

  /**
   * The theme manager constructor.
   *
   * @param {object} options - The options object.
   * @param {Handsontable} options.hot - The Handsontable instance.
   * @param {object} options.themeObject - The theme object.
   */
  constructor({ hot, themeObject }) {
    this.hot = hot;

    this.update(themeObject);
  }

  /**
   * Injects theme styles into the DOM.
   */
  #injectThemeStyles() {
    if (!this.themeConfig || !this.hot || !this.hot.rootDocument || !this.hot.rootWrapperElement) {
      return;
    }

    const colorScheme = this.themeConfig.colorScheme === 'auto' ? 'light dark' : this.themeConfig.colorScheme;

    if (this.themeStyles) {
      this.themeStyles.textContent = '';
    } else {
      this.themeStyles = this.hot.rootDocument.createElement('style');
    }

    this.themeStyles.textContent = `:where(.${this.themeClassName}) {\n`;
    this.themeStyles.textContent += `color-scheme: ${colorScheme};\n`;

    if (this.themeConfig.sizing) {
      this.themeStyles.textContent += flattenCssVariables(this.themeConfig.sizing, 'sizing');
    }

    if (
      this.themeConfig.density &&
      this.themeConfig.density.type &&
      this.themeConfig.density.sizes &&
      this.themeConfig.density.sizes[this.themeConfig.density.type]
    ) {
      this.themeStyles.textContent += flattenCssVariables(
        this.themeConfig.density.sizes[this.themeConfig.density.type],
        'density'
      );
    }

    if (this.themeConfig.colors) {
      this.themeStyles.textContent += flattenCssVariables(this.themeConfig.colors, 'colors');
    }

    if (this.themeConfig.tokens) {
      this.themeStyles.textContent += flattenCssVariables(this.themeConfig.tokens);
    }

    if (this.themeConfig.icons) {
      this.themeStyles.textContent += iconsMap(this.themeConfig.icons);
    }

    this.themeStyles.textContent += '}';

    if (this.hot.rootWrapperElement && this.hot.rootWrapperElement.querySelector('style')) {
      this.hot.rootWrapperElement.querySelector('style').textContent = this.themeStyles.textContent;
    } else {
      this.hot.rootWrapperElement.prepend(this.themeStyles);
    }
  }

  /**
   * Gets the theme class name.
   *
   * @returns {string} The theme class name.
   */
  getClassName() {
    return this.themeClassName;
  }

  /**
   * Updates the theme manager.
   *
   * @param {object} themeObject - The theme object.
   */
  update(themeObject) {
    if (!this.hot) {
      return;
    }

    if (themeObject.getThemeConfig === undefined) {
      throw new Error('[ThemeManager] The "theme" option must be an instance of ThemeBuilder.');
    }

    this.themeConfig = themeObject.getThemeConfig();
    this.themeClassName = `${THEME_PREFIX}${this.themeConfig.name}`;

    if (typeof themeObject.subscribe === 'function') {
      themeObject.subscribe((config) => {
        this.themeConfig = config;
        this.#injectThemeStyles();
        this.hot.stylesHandler.clearCache();
        this.hot.render();
        this.hot.runHooks('afterSetTheme', this.themeClassName, false);
      });
    }

    this.mount();
    this.hot.runHooks('afterSetTheme', this.themeClassName, true);
  }

  /**
   * Mounts the theme manager.
   */
  mount() {
    this.#injectThemeStyles();
  }

  /**
   * Unmounts the theme manager.
   */
  unmount() {
    if (this.themeStyles) {
      this.themeStyles.remove();
    }
  }

  /**
   * Destroys the theme manager.
   */
  destroy() {
    this.unmount();
    this.hot.themeManager = null;
  }
}

/**
 * Creates a new ThemeManager instance.
 *
 * @param {object} options - The options object.
 * @param {Handsontable} options.hot - The Handsontable instance.
 * @param {object} options.themeObject - The theme object.
 * @returns {ThemeManager} The ThemeManager instance.
 */
export function createThemeManager({ hot, themeObject }) {
  return new ThemeManager({ hot, themeObject });
}
