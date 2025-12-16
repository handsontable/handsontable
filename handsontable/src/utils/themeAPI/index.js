import baseStyles from '../../themes/utils/styles';
import { addClass } from '../../helpers/dom/element';
import { iconsMap } from '../../themes/variables/helpers/iconsMap';
import { toCssValue, flattenColors, toHyphen } from './helpers';

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
  stringInstanceID;
  /**
   * The theme config.
   *
   * @type {object}
   */
  themeConfig;

  constructor({ instance, stringInstanceID, themeObject }) {
    this.instance = instance;
    this.stringInstanceID = stringInstanceID;

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
        this.instance.runHooks('afterSetTheme', undefined, false);
      });
    }

    this.mount();
  }

  /**
   * Mounts the theme API.
   */
  mount() {
    this.injectBaseStyles();
    this.injectThemeStyles();
  }

  /**
   * Sets the theme object.
   *
   * @param {object} themeObject - The theme object.
   */
  updateTheme(themeObject) {
    if (themeObject.getThemeConfig === undefined) {
      throw new Error('[ThemeAPI] The "theme" option must be an instance of ThemeBuilder.');
    }

    this.themeConfig = themeObject.getThemeConfig();
    this.injectThemeStyles();
  }

  /**
   * Injects base styles into the document head.
   */
  injectBaseStyles() {
    if (!this.instance.rootDocument || !this.instance.rootDocument.head) {
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
    if (!this.themeConfig) {
      return;
    }

    const inlineThemeClassName = `ht-theme-${this.stringInstanceID}`;

    addClass(this.instance.rootWrapperElement, inlineThemeClassName);
    addClass(this.instance.rootPortalElement, inlineThemeClassName);

    const colorScheme = this.themeConfig.colorScheme === 'auto' ? 'light dark' : this.themeConfig.colorScheme;

    if (this.themeStyles) {
      this.themeStyles.textContent = '';
    } else {
      this.themeStyles = this.instance.rootDocument.createElement('style');
    }

    this.themeStyles.textContent = `:where(.${inlineThemeClassName}) {\n`;
    this.themeStyles.textContent += `color-scheme: ${colorScheme};\n`;
    this.themeStyles.textContent += Object.entries(this.themeConfig.sizing || {}).map(
      ([key, value]) => `--ht-sizing-${toHyphen(key)}: ${value};`
    ).join('\n');
    this.themeStyles.textContent += '\n';
    this.themeStyles.textContent += Object.entries(
      this.themeConfig.density.sizes[this.themeConfig.density.type] || {}
    ).map(
      ([key, value]) => `--ht-density-${toHyphen(key)}: ${toCssValue(value)};`
    ).join('\n');
    this.themeStyles.textContent += '\n';
    this.themeStyles.textContent += flattenColors(this.themeConfig.colors || {});
    this.themeStyles.textContent += Object.entries(this.themeConfig.tokens || {}).map(
      ([key, value]) => `--ht-${toHyphen(key)}: ${toCssValue(value)};`
    ).join('\n');
    this.themeStyles.textContent += iconsMap(this.themeConfig.icons || {});
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
}
