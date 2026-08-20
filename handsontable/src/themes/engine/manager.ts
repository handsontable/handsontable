import { iconsMap } from '../static/variables/helpers/iconsMap';
import { throwWithCause } from '../../helpers/errors';
import { addClass, removeClass } from '../../helpers/dom/element';
import { flattenCssVariables } from './utils/cssVariables';
import { validateColorScheme, validateDensityType } from './utils/validation';
import type { ThemeConfig, ThemeColorScheme, DensityType } from '../types';
import type { ThemeBuilder } from './builder';

interface HotInstance {
  guid: string;
  rootDocument: Document;
  rootWrapperElement: HTMLElement;
  rootPortalElement: HTMLElement;
  stylesHandler: { clearCache(): void };
  render(): void;
  runHooks(hookName: string, ...args: unknown[]): void;
  // eslint-disable-next-line no-use-before-define
  themeManager: ThemeManager | null | undefined;
  [key: string]: unknown;
}

/**
 * Per-instance theme overrides applied on top of the theme configuration.
 *
 * They let a single grid pick a color scheme and a density without declaring its own theme, leaving
 * the shared theme object (and therefore every other grid using it) untouched.
 */
export interface ThemeOverrides {
  colorScheme?: ThemeColorScheme;
  density?: DensityType;
}

/**
 * Unvalidated theme overrides as they arrive from the grid settings.
 *
 * The values are `unknown` because the settings object is an external boundary — `setOverrides()`
 * validates them and throws on an unsupported value.
 */
export interface ThemeOverridesInput {
  colorScheme?: unknown;
  density?: unknown;
}

/**
 * The theme prefix.
 *
 * @type {string}
 */
const THEME_PREFIX = 'ht-theme-';
const THEME_STYLE_ATTRIBUTE = 'data-hot-theme-style';

/**
 * Prefix of the class that scopes the per-instance override rules to a single grid.
 *
 * It deliberately does not start with `ht-theme-`, because `Core#onThemeChange` strips every
 * `ht-theme-*` class from the wrapper and portal elements when the theme changes.
 *
 * @type {string}
 */
const THEME_SCOPE_PREFIX = 'ht-scope-';

/**
 * Resolves a color scheme to the value accepted by the CSS `color-scheme` property.
 *
 * @param {string} colorScheme The color scheme ('light', 'dark', or 'auto').
 * @returns {string} The CSS `color-scheme` value.
 */
function toCssColorScheme(colorScheme: ThemeColorScheme | undefined): string | undefined {
  return colorScheme === 'auto' ? 'light dark' : colorScheme;
}

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
   * Class that scopes the per-instance override rules to this grid only. Stamped on the wrapper and
   * the portal element, so menus and dialogs rendered in the portal follow the same overrides.
   *
   * @type {string}
   */
  scopeClassName: string;

  /**
   * Unsubscribes from the theme object's change notifications.
   *
   * @type {Function|null}
   */
  #unsubscribeTheme: (() => void) | null = null;

  /**
   * Per-instance color scheme and density overrides applied on top of the theme configuration.
   *
   * @type {object}
   */
  #overrides: ThemeOverrides = {};

  /**
   * The theme manager constructor.
   *
   * @param {object} options - The options object.
   * @param {Handsontable} options.hot - The Handsontable instance.
   * @param {object} options.themeObject - The theme object.
   * @param {object} [options.overrides] - The per-instance color scheme and density overrides.
   */
  constructor(
    { hot, themeObject, overrides }:
    { hot: HotInstance; themeObject: ThemeBuilder; overrides?: ThemeOverridesInput }
  ) {
    this.hot = hot;
    this.scopeClassName = `${THEME_SCOPE_PREFIX}${hot.guid}`;

    if (overrides) {
      this.#setOverrides(overrides);
    }

    this.update(themeObject);
  }

  /**
   * Validates and stores the per-instance overrides.
   *
   * @param {object} overrides The color scheme and density overrides. An `undefined` value clears
   * the given override and falls back to the theme configuration.
   * @returns {boolean} `true` when the effective overrides changed.
   */
  #setOverrides(overrides: ThemeOverridesInput): boolean {
    const nextOverrides: ThemeOverrides = { ...this.#overrides };

    if (Object.prototype.hasOwnProperty.call(overrides, 'colorScheme')) {
      nextOverrides.colorScheme = overrides.colorScheme === undefined ?
        undefined :
        validateColorScheme(String(overrides.colorScheme));
    }

    if (Object.prototype.hasOwnProperty.call(overrides, 'density')) {
      nextOverrides.density = overrides.density === undefined ?
        undefined :
        validateDensityType(String(overrides.density));
    }

    const hasChanged = nextOverrides.colorScheme !== this.#overrides.colorScheme ||
      nextOverrides.density !== this.#overrides.density;

    this.#overrides = nextOverrides;

    return hasChanged;
  }

  /**
   * Builds the CSS rules that apply the per-instance overrides.
   *
   * The selector doubles the theme class with the instance scope class, giving specificity (0,2,0).
   * That beats both the `:where()` block above (0,0,0) and the static `ht-theme-*.css` declarations
   * (0,1,0), so the override wins no matter which stylesheet the page loaded.
   *
   * @returns {string} The CSS text, or an empty string when no override is active.
   */
  #buildOverrideStyles(): string {
    const { colorScheme, density } = this.#overrides;

    if (!colorScheme && !density) {
      return '';
    }

    const selector = `.${this.themeClassName}.${this.scopeClassName}`;
    const densitySizes = density ? this.themeConfig?.density?.sizes?.[density] : undefined;
    let cssText = '';

    if (densitySizes) {
      cssText += `${selector} {\n${flattenCssVariables(densitySizes, 'density')}}\n`;
    }

    if (colorScheme) {
      cssText += `${selector} {\ncolor-scheme: ${toCssColorScheme(colorScheme)};\n}\n`;
    }

    return cssText;
  }

  /**
   * Injects theme styles into the DOM.
   */
  #injectThemeStyles() {
    if (!this.themeConfig || !this.hot || !this.hot.rootDocument || !this.hot.rootWrapperElement) {
      return;
    }

    const colorScheme = toCssColorScheme(this.themeConfig.colorScheme);

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
        this.themeConfig.density.sizes[this.themeConfig.density.type]!,
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
    this.themeStyles.textContent += `.${this.themeClassName} {\ncolor-scheme: ${colorScheme};\n}\n`;
    this.themeStyles.textContent += this.#buildOverrideStyles();

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
   * Gets the per-instance color scheme and density overrides.
   *
   * @returns {object} A copy of the currently applied overrides.
   */
  getOverrides(): ThemeOverrides {
    return { ...this.#overrides };
  }

  /**
   * Gets the color scheme this grid renders with, taking the per-instance override into account.
   *
   * @returns {string|undefined} The color scheme ('light', 'dark', or 'auto').
   */
  getColorScheme(): ThemeColorScheme | undefined {
    return this.#overrides.colorScheme ?? this.themeConfig?.colorScheme;
  }

  /**
   * Gets the density type this grid renders with, taking the per-instance override into account.
   *
   * @returns {string|undefined} The density type ('default', 'compact', or 'comfortable').
   */
  getDensityType(): DensityType | undefined {
    return this.#overrides.density ?? this.themeConfig?.density?.type;
  }

  /**
   * Applies per-instance color scheme and density overrides and re-injects the theme styles.
   *
   * The shared theme object is never mutated, so other grids using the same theme keep their look.
   *
   * @param {object} overrides The color scheme and density overrides. An `undefined` value clears
   * the given override and falls back to the theme configuration.
   * @returns {boolean} `true` when the effective overrides changed and the styles were re-injected.
   */
  setOverrides(overrides: ThemeOverridesInput): boolean {
    if (!this.#setOverrides(overrides)) {
      return false;
    }

    this.#injectThemeStyles();

    return true;
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
    this.#stampScopeClass();
    this.#injectThemeStyles();
  }

  /**
   * Unmounts the theme manager.
   */
  unmount() {
    this.#unstampScopeClass();

    if (this.themeStyles) {
      this.themeStyles.remove();

    }
  }

  /**
   * Adds the instance scope class to the wrapper and portal elements.
   *
   * Both are stamped because menus, dropdowns, and dialogs render inside the portal element — a
   * wrapper-only scope would leave them on the theme defaults while the grid follows the overrides.
   */
  #stampScopeClass() {
    [this.hot?.rootWrapperElement, this.hot?.rootPortalElement].forEach((element) => {
      if (element) {
        addClass(element, this.scopeClassName);
      }
    });
  }

  /**
   * Removes the instance scope class from the wrapper and portal elements.
   */
  #unstampScopeClass() {
    [this.hot?.rootWrapperElement, this.hot?.rootPortalElement].forEach((element) => {
      if (element) {
        removeClass(element, this.scopeClassName);
      }
    });
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
 * @param {object} [options.overrides] - The per-instance color scheme and density overrides.
 * @returns {ThemeManager} The ThemeManager instance.
 */
export function createThemeManager(
  { hot, themeObject, overrides }:
  { hot: HotInstance; themeObject: ThemeBuilder; overrides?: ThemeOverridesInput }): ThemeManager {
  return new ThemeManager({ hot, themeObject, overrides });
}
