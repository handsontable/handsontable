import baseStyles from '../../themes/utils/styles';
import { iconsMap } from '../../themes/variables/helpers/iconsMap';
import { flattenCssVariables } from './helpers';

/**
 * ThemeAPI class.
 *
 * @class ThemeAPI
 */
export class ThemeAPI {
  /**
   * The base styles.
   *
   * @type {HTMLStyleElement}
   */
  baseStyles;
  /**
   * The theme styles.
   *
   * @type {HTMLStyleElement}
   */
  themeStyles;
  /**
   * The instance.
   *
   * @type {Instance}
   */
  instance;
  /**
   * The string instance ID.
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
   * The theme API constructor.
   *
   * @param {object} options - The options object.
   * @param {Instance} options.instance - The instance.
   * @param {string} options.stringInstanceID - The string instance ID.
   * @param {object} options.themeObject - The theme object.
   */
  constructor({ instance, stringInstanceID, themeObject }) {
    this.instance = instance;
    this.themeClassName = `ht-theme-${stringInstanceID}`;

    this.update(themeObject);
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
   * Updates the theme API.
   *
   * @param {object} themeObject - The theme object.
   */
  update(themeObject) {
    if (!this.instance) {
      return;
    }

    if (themeObject.getThemeConfig === undefined) {
      throw new Error('[ThemeAPI] The "theme" option must be an instance of ThemeBuilder.');
    }

    this.themeConfig = themeObject.getThemeConfig();

    if (typeof themeObject.subscribe === 'function') {
      themeObject.subscribe((config) => {
        this.themeConfig = config;
        this.injectThemeStyles();
        this.instance.stylesHandler.clearCache();
        this.instance.render();
        this.instance.runHooks('afterSetTheme', this.themeClassName, false);
      });
    }

    this.mount();
    this.instance.runHooks('afterSetTheme', this.themeClassName, true);
  }

  /**
   * Mounts the theme API.
   */
  mount() {
    this.injectBaseStyles();
    this.injectThemeStyles();
  }

  /**
   * Injects base styles into the document head.
   */
  injectBaseStyles() {
    if (!this.instance || !this.instance.rootDocument || !this.instance.rootDocument.head) {
      return;
    }

    const styleId = 'handsontable-base-styles';
    const existingStyle = this.instance.rootDocument.getElementById(styleId);

    if (existingStyle) {
      return;
    }

    this.baseStyles = this.instance.rootDocument.createElement('style');
    this.baseStyles.id = styleId;
    this.baseStyles.textContent = baseStyles;

    this.instance.rootDocument.head.appendChild(this.baseStyles);
  }

  /**
   * Injects theme styles into the DOM.
   */
  injectThemeStyles() {
    if (!this.themeConfig || !this.instance || !this.instance.rootDocument || !this.instance.rootWrapperElement) {
      return;
    }

    const colorScheme = this.themeConfig.colorScheme === 'auto' ? 'light dark' : this.themeConfig.colorScheme;

    if (this.themeStyles) {
      this.themeStyles.textContent = '';
    } else {
      this.themeStyles = this.instance.rootDocument.createElement('style');
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

    if (this.instance.rootWrapperElement && this.instance.rootWrapperElement.querySelector('style')) {
      this.instance.rootWrapperElement.querySelector('style').textContent = this.themeStyles.textContent;
    } else {
      this.instance.rootWrapperElement.prepend(this.themeStyles);
    }
  }

  /**
   * Unmounts the theme API.
   */
  unmount() {
    if (this.baseStyles) {
      this.baseStyles.remove();
    }

    if (this.themeStyles) {
      this.themeStyles.remove();
    }
  }

  /**
   * Destroys the theme API.
   */
  destroy() {
    this.unmount();
    this.instance.themeAPI = null;
  }
}
