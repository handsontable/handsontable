import { toHyphen } from '../../../helpers/string';
import type { IconKey, IconValue, ThemeIconsConfig } from '../../types';

export const ICON_CLASS = 'ht-icon';
export const ICON_EXTERNAL_CLASS = 'ht-icon--external';
export const ICON_FLIP_RTL_CLASS = 'ht-icon--flip-rtl';

/**
 * Every icon slot the grid renders. Kept in sync with the generated icon sets by
 * `iconsUtils.unit.js`, and with the `IconKey` union by the `satisfies` clause below.
 */
export const ICON_NAMES = [
  'arrowRight', 'arrowRightWithBar', 'arrowLeft', 'arrowLeftWithBar', 'arrowDown', 'menu',
  'selectArrow', 'arrowNarrowUp', 'arrowNarrowDown', 'check', 'checkbox', 'caretHiddenLeft',
  'caretHiddenRight', 'caretHiddenUp', 'caretHiddenDown', 'collapseOff', 'collapseOn', 'radio',
  'chipClose', 'search', 'plus', 'menuList',
] as const satisfies readonly IconKey[];

type MissingIconName = Exclude<IconKey, (typeof ICON_NAMES)[number]>;
// Compile-time exhaustiveness: adding an `IconKey` without listing it here is a type error.
const assertAllIconNamesListed: MissingIconName extends never ? true : never = true;

void assertAllIconNamesListed;

/**
 * Returns the per-glyph class for an icon slot, e.g. `ht-icon-arrow-right`.
 */
export function getIconClassName(name: string): string {
  return `${ICON_CLASS}-${toHyphen(name)}`;
}

/**
 * Returns the CSS custom property that carries an icon slot's glyph, e.g. `--ht-icon-arrow-right`.
 */
export function getIconCssVariable(name: string): string {
  return `--${ICON_CLASS}-${toHyphen(name)}`;
}

/**
 * Image file extensions a bare path or URL is recognized by, optionally followed by a query
 * string or a fragment (`/icons/check.svg?v=2`, `check.png#dark`).
 */
const IMAGE_PATH_PATTERN = /\.(svg|png|gif|jpe?g|webp|avif|bmp|ico)([?#].*)?$/i;

/**
 * Prefixes that only a URL or a path can start with. A class list cannot: none of them is a
 * valid start of a class token a stylesheet would write without escaping.
 */
const URL_PREFIXES = ['data:', 'url(', 'http://', 'https://', 'blob:', '//', '/', './', '../'];

/**
 * Tells whether a string icon value is a glyph rather than a class list. A glyph is:
 * - markup: anything starting with `<` (`<svg ...>`, `<?xml ...?><svg ...>`);
 * - a URL or a path: a `data:`, `blob:`, `http(s):`, protocol-relative, absolute or relative
 *   (`./`, `../`) value, or `url(...)`;
 * - a single token (no whitespace) naming an image file, with an optional query or fragment
 *   (`icons/check.svg`, `arrow.png?v=2`).
 *
 * In 18.1 every string was wrapped in `url(...)`; since 19.0 a string that is none of the above is
 * a class list. The rules above cover the URL shapes an 18.1 config holds in practice; an
 * extension-less relative path (`icons/check`) is the one form that now reads as a class.
 */
export function isGlyphValue(value: string): boolean {
  const trimmed = value.trim();

  if (trimmed.startsWith('<')) {
    return true;
  }

  const lower = trimmed.toLowerCase();

  if (URL_PREFIXES.some(prefix => lower.startsWith(prefix))) {
    return true;
  }

  return !/\s/.test(trimmed) && IMAGE_PATH_PATTERN.test(trimmed);
}

/**
 * Normalizes a glyph value to a bare URL (no `url()` wrapper). Markup (SVG, with or without an
 * XML prolog) is encoded into a `data:` URI.
 */
export function toGlyphUrl(value: string): string {
  const trimmed = value.trim();

  if (trimmed.startsWith('<')) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(trimmed)}`;
  }

  if (trimmed.toLowerCase().startsWith('url(')) {
    // Tolerate a missing closing paren instead of silently dropping the URL's last character.
    const inner = trimmed.endsWith(')') ? trimmed.slice(4, -1) : trimmed.slice(4);

    return inner.trim().replace(/^["']|["']$/g, '').replace(/[\r\n]/g, '');
  }

  // A line break inside a bare URL is never valid, and would end the `url("...")` string the
  // generator writes it into.
  return trimmed.replace(/[\r\n]/g, '');
}

/**
 * Splits an icons config into glyph values (emitted as CSS variables) and external values
 * (class lists and renderer callbacks applied to the element at creation).
 */
export function splitIcons(icons: ThemeIconsConfig): {
  glyphs: Record<string, string>;
  external: Map<string, IconValue>;
} {
  const glyphs: Record<string, string> = {};
  const external = new Map<string, IconValue>();

  Object.entries(icons).forEach(([name, value]) => {
    if (!(ICON_NAMES as readonly string[]).includes(name)) {
      // `validateThemeConfig` already warns about an unknown key. It must not reach the generated
      // CSS either, where the key is written unescaped into a custom-property name and a class
      // selector - a stray `}` in a key would otherwise inject rules into the theme's stylesheet.
      return;
    }

    if (typeof value === 'function') {
      external.set(name, value);
    } else if (typeof value === 'string' && isGlyphValue(value)) {
      glyphs[name] = toGlyphUrl(value);
    } else if (typeof value === 'string' && value.trim() !== '') {
      external.set(name, value);
    }
  });

  return { glyphs, external };
}
