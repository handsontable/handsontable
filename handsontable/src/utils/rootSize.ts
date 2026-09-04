/**
 * How a grid `width` / `height` option value resolved.
 *
 * - `px`: a number of pixels (a number, `'500'`, `'500px'`), normalized to `<n>px`.
 * - `auto`: the `'auto'` keyword – the axis follows the CSS box like a plain `<div>`.
 * - `css`: any other value the browser can read as a length or a length expression. It is passed
 *   through as written.
 * - `invalid`: nothing the browser can read as a size, or a keyword that would collapse the grid.
 *   The caller ignores the value and warns.
 */
export type RootSizeKind = 'px' | 'auto' | 'css' | 'invalid';

/**
 * The resolution of one root size value.
 */
export interface RootSizeResolution {
  kind: RootSizeKind;
  /**
   * The value to write to the root's inline style, or `null` when the value is invalid.
   */
  cssValue: string | null;
  /**
   * `true` when the size resolves against something outside the grid (the container, the viewport,
   * a custom property), so the grid cannot know the pixel box up front.
   */
  isContainerDriven: boolean;
}

/**
 * Tells whether the browser accepts a value for a size property. Wraps `CSS.supports`, which is
 * absent in jsdom, so the resolver takes it as an optional tail oracle.
 */
export type CssValueOracle = (value: string) => boolean;

/**
 * The classification of an inline `height` / `width` value already written on the root element.
 */
export type InlineSizeState = 'unset' | 'auto' | 'definite' | 'container-driven';

/**
 * A bare number (`'250'`, `'12.5'`) or a pixel string (`'250px'`), after trimming.
 */
const PIXEL_PATTERN = /^(\d+(?:\.\d+)?)(?:\s*px)?$/i;

/**
 * A single length with a known unit. Percentages, font-relative, viewport (with the `s`/`l`/`d`
 * prefixes), container-query, and absolute units.
 */
const LENGTH_PATTERN = new RegExp(
  '^\\d+(?:\\.\\d+)?(?:%|px|em|rem|ex|ch|cap|ic|lh|rlh|[sld]?v(?:w|h|min|max|i|b)' +
  '|cq(?:w|h|i|b|min|max)|cm|mm|q|in|pt|pc)$',
  'i'
);

/**
 * A math or substitution function. The grammar inside is the browser's to judge, so these go to
 * the oracle when one is available.
 */
const FUNCTION_PATTERN = /^(?:calc|min|max|clamp|var|env)\(/i;

/**
 * Units and functions that resolve against the container, the viewport, or a custom property.
 * Each unit is preceded by a digit so `var(` cannot match a `v` unit and `%` matches anywhere,
 * including inside `calc()`.
 */
const CONTAINER_DRIVEN_PATTERN = /%|\d[sld]?v(?:w|h|min|max|i|b)\b|\dcq(?:w|h|i|b|min|max)\b|\bvar\(|\benv\(/i;

/**
 * CSS keywords the browser accepts for a size but which collapse or unsize the grid. They are
 * rejected before the oracle sees them, because `CSS.supports` would accept every one.
 */
const REJECTED_KEYWORDS = new Set([
  'fit-content', 'min-content', 'max-content', 'inherit', 'initial', 'unset', 'revert',
  'revert-layer', 'stretch', 'none', 'normal',
]);

/**
 * Builds an invalid resolution.
 *
 * @returns {RootSizeResolution}
 */
function invalid(): RootSizeResolution {
  return { kind: 'invalid', cssValue: null, isContainerDriven: false };
}

/**
 * Builds a pass-through resolution for a value the browser can read.
 *
 * @param {string} cssValue The trimmed value.
 * @returns {RootSizeResolution}
 */
function css(cssValue: string): RootSizeResolution {
  return { kind: 'css', cssValue, isContainerDriven: CONTAINER_DRIVEN_PATTERN.test(cssValue) };
}

/**
 * Resolves a string value. The grammar decides the common forms; the oracle, when present, judges
 * the rest.
 *
 * @param {string} value The trimmed, non-empty string.
 * @param {CssValueOracle} [isSupported] The browser's own acceptance test.
 * @returns {RootSizeResolution}
 */
function resolveString(value: string, isSupported?: CssValueOracle): RootSizeResolution {
  const lowerValue = value.toLowerCase();

  if (lowerValue === 'auto') {
    return { kind: 'auto', cssValue: 'auto', isContainerDriven: true };
  }

  const pixelMatch = PIXEL_PATTERN.exec(value);

  if (pixelMatch !== null) {
    return { kind: 'px', cssValue: `${pixelMatch[1]}px`, isContainerDriven: false };
  }

  if (REJECTED_KEYWORDS.has(lowerValue) || lowerValue.startsWith('fit-content(')) {
    return invalid();
  }

  if (LENGTH_PATTERN.test(value)) {
    return css(value);
  }

  if (FUNCTION_PATTERN.test(value)) {
    return isSupported !== undefined && !isSupported(value) ? invalid() : css(value);
  }

  return isSupported !== undefined && isSupported(value) ? css(value) : invalid();
}

/**
 * Resolves a grid `width` / `height` option value.
 *
 * Numbers are pixels. Strings follow the grammar first, so the documented forms resolve the same
 * in every environment, and the oracle only decides what the grammar does not know. Without an
 * oracle (jsdom), an unknown string is invalid.
 *
 * This lives outside `helpers/` on purpose: every export of a `helpers/` module is spread onto the
 * public `Handsontable.helper`, which the no-removal rule then keeps forever.
 *
 * @param {*} value The option value, after the `beforeHeightChange` / `beforeWidthChange` hook.
 * @param {CssValueOracle} [isSupported] The browser's own acceptance test, from `createCssValueOracle()`.
 * @returns {RootSizeResolution}
 */
export function resolveRootSize(value: unknown, isSupported?: CssValueOracle): RootSizeResolution {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ?
      { kind: 'px', cssValue: `${value}px`, isContainerDriven: false } :
      invalid();
  }

  if (typeof value !== 'string') {
    return invalid();
  }

  const trimmedValue = value.trim();

  return trimmedValue === '' ? invalid() : resolveString(trimmedValue, isSupported);
}

/**
 * Wraps the window's `CSS.supports` for one size property. Returns `undefined` where the API is
 * missing (jsdom), so the resolver falls back to its grammar alone.
 *
 * @param {Window} rootWindow The window the grid renders in.
 * @param {'height'|'width'} property The property to test values against.
 * @returns {CssValueOracle|undefined}
 */
export function createCssValueOracle(rootWindow: Window, property: 'height' | 'width'): CssValueOracle | undefined {
  // The DOM lib declares `CSS` as a global namespace, not as a `Window` member, so the read is
  // widened here rather than reaching for the global (the grid may live in another window).
  const cssApi = (rootWindow as Window & { CSS?: typeof CSS }).CSS;

  if (cssApi === undefined || typeof cssApi.supports !== 'function') {
    return undefined;
  }

  return (value: string) => {
    try {
      return cssApi.supports(property, value);
    } catch {
      return false;
    }
  };
}

/**
 * Classifies an inline `height` / `width` value read back from the root element's style.
 *
 * A `definite` value is a fixed box the grid must not overflow, so the root may clip that axis. A
 * `container-driven` value (`%`, viewport and container-query units, `var()`, `env()`) resolves
 * against something outside the grid, so clipping it would hide content with no scrollbar. The
 * test is fail-safe: anything it does not recognize as container-driven is definite, except the
 * two free states.
 *
 * @param {string} inlineValue The value of `element.style.height` or `element.style.width`.
 * @returns {InlineSizeState}
 */
export function classifyInlineSize(inlineValue: string): InlineSizeState {
  if (inlineValue === '') {
    return 'unset';
  }

  if (inlineValue === 'auto') {
    return 'auto';
  }

  return CONTAINER_DRIVEN_PATTERN.test(inlineValue) ? 'container-driven' : 'definite';
}
