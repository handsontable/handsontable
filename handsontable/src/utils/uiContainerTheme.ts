import { addClass, removeClass } from '../helpers/dom/element';

/**
 * The classes a theme puts on an element: the theme class (`ht-theme-*`) and the theme engine's
 * per-grid scope class (`ht-scope-*`).
 */
const THEME_CLASSES = [/^ht-theme-/, /^ht-scope-/];

/**
 * Themes an element a plugin mounts in a custom `uiContainer`, outside the grid's root wrapper, the way the
 * wrapper is themed. The theme engine writes a grid's `colorScheme`, `density` and other overrides under
 * the theme class doubled with the grid's scope class, and stamps the scope class on the wrapper and the
 * portal only, so an element with the theme class alone matched the theme's base rules: a dark grid had
 * a light bar. Both classes go on the element, and the ones a previous theme put there come off.
 *
 * @param {HTMLElement} element The element mounted in the `uiContainer`.
 * @param {string} [themeName] The grid's theme class, `undefined` when it has none.
 * @param {string} [scopeClassName] The theme engine's scope class for the grid, when the grid uses the
 * theme engine.
 */
export function applyUiContainerTheme(element: HTMLElement, themeName?: string, scopeClassName?: string): void {
  removeClass(element, THEME_CLASSES);

  if (themeName) {
    addClass(element, scopeClassName ? [themeName, scopeClassName] : themeName);
  }
}
