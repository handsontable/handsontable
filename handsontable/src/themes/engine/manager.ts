import { iconsMap } from '../static/variables/helpers/iconsMap';
import { throwWithCause } from '../../helpers/errors';
import { flattenCssVariables } from './utils/cssVariables';
import type { ThemeConfig } from '../types';
import type { ThemeBuilder } from './builder';

interface HotInstance {
  rootDocument: Document;
  rootWrapperElement: HTMLElement;
  stylesHandler: { clearCache(): void };
  render(): void;
  runHooks(hookName: string, ...args: unknown[]): void;
  // eslint-disable-next-line no-use-before-define
  themeManager: ThemeManager | null;
  [key: string]: unknown;
}

/**
 * The theme prefix.
 *
 * @type {string}
 */
const THEME_PREFIX = 'ht-theme-';
const THEME_STYLE_ATTRIBUTE = 'data-hot-theme-style';

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
  hot: HotInstance;
  /**
   * The theme styles element.
   *
   * @type {HTMLStyleElement}
   */
  themeStyles: HTMLStyleElement | null = null;
  /**
   * The theme class name.
   *
   * @type {string}
   */
  themeClassName: string = '';
  /**
   * The theme config.
   *
   * @type {object}
   */
  themeConfig: ThemeConfig | null = null;

  /**
   * Unsubscribes from the theme object's change notifications.
   *
   * @type {Function|null}
   */
  #unsubscribeTheme: (() => void) | null = null;

  /**
   * The theme manager constructor.
   *
   * @param {object} options - The options object.
   * @param {Handsontable} options.hot - The Handsontable instance.
   * @param {object} options.themeObject - The theme object.
   */
  constructor({ hot, themeObject }: { hot: HotInstance; themeObject: ThemeBuilder }) {
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

    if (!this.themeStyles) {
      this.themeStyles = this.hot.rootDocument.createElement('style');
      this.themeStyles.setAttribute(THEME_STYLE_ATTRIBUTE, 'true');
    }

    this.themeStyles.textContent = `:where(.${this.themeClassName}) {\n`;

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

    this.themeStyles.textContent += '}\n';
    // Separate rule with class-level specificity (0,1,0) so this <style> (injected into <body>)
    // wins over same-specificity color-scheme declarations in static ht-theme-*.css files via
    // source order, while keeping all other tokens at :where() specificity for easy overrides.
    this.themeStyles.textContent += `.${this.themeClassName} {\ncolor-scheme: ${colorScheme};\n}`;

    // Ensure that the manager always controls its own style node.
    // Some wrappers may contain other <style> tags and updating/removing a generic
    // querySelector('style') can leave the theme style mounted.
    if (this.themeStyles.parentNode !== this.hot.rootWrapperElement) {
      this.hot.rootWrapperElement.prepend(this.themeStyles);
    }
  }

  /**
   * Gets the theme class name.
   *
   * @returns {string} The theme class name.
   */
  getClassName(): string {
    return this.themeClassName;
  }

  /**
   * Updates the theme manager.
   *
   * @param {object} themeObject - The theme object.
   */
  update(themeObject: ThemeBuilder) {
    if (!this.hot) {
      return;
    }

    if (themeObject.getThemeConfig === undefined) {
      throwWithCause('[ThemeManager] The "theme" option must be an instance of ThemeBuilder.');
    }

    this.themeConfig = themeObject.getThemeConfig();
    this.themeClassName = `${THEME_PREFIX}${this.themeConfig.name}`;

    if (typeof themeObject.subscribe === 'function') {
      this.#unsubscribeTheme?.();
      this.#unsubscribeTheme = themeObject.subscribe((config) => {
        if (!this.hot?.stylesHandler) {
          return;
        }

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
    this.#unsubscribeTheme?.();
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
export function createThemeManager(
  { hot, themeObject }: { hot: HotInstance; themeObject: ThemeBuilder }): ThemeManager {
  return new ThemeManager({ hot, themeObject });
}
