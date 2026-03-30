/**
 * Design token resolver for E2E tests.
 *
 * Reads the auto-generated token files and resolves all references so that
 * tests can calculate expected dimensions from design tokens instead of
 * using hardcoded magic numbers.
 *
 * Token resolution chain:
 *   tokens.cellVerticalPadding → density.cellVertical → sizing.size_1 → 4 (px)
 */
import sizing from '../../src/themes/static/variables/sizing';
import density from '../../src/themes/static/variables/density';
import mainTokens from '../../src/themes/static/variables/tokens/main';
import classicTokens from '../../src/themes/static/variables/tokens/classic';
import horizonTokens from '../../src/themes/static/variables/tokens/horizon';
import { getLoadedTheme } from './common';

// ── Raw token data per theme ────────────────────────────────────────────────

const THEME_TOKENS = {
  main: mainTokens,
  classic: classicTokens,
  horizon: horizonTokens,
};

const THEME_DENSITY = {
  main: 'default',
  classic: 'compact',
  horizon: 'comfortable',
};

// ── Reference resolution ────────────────────────────────────────────────────

/**
 * Parse a pixel string like '14px' to a number. Returns the input if it's
 * already a number or can't be parsed.
 *
 * @param {string|number} value The value to parse.
 * @returns {number} The numeric value.
 */
function parsePx(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.endsWith('px')) {
    return Number(value.slice(0, -2));
  }

  return Number(value);
}

/**
 * Resolve a sizing reference like 'sizing.size_1' to its numeric px value.
 *
 * @param {string} ref The sizing reference.
 * @returns {number} The resolved pixel value.
 */
function resolveSizing(ref) {
  const key = ref.replace('sizing.', '');

  return parsePx(sizing[key]);
}

/**
 * Resolve a density reference like 'density.cellVertical' for a given
 * density level (default, compact, comfortable).
 *
 * @param {string} ref The density reference.
 * @param {string} level The density level.
 * @returns {number} The resolved pixel value.
 */
function resolveDensity(ref, level) {
  const key = ref.replace('density.', '');
  const rawValue = density[level][key];

  if (typeof rawValue === 'string' && rawValue.startsWith('sizing.')) {
    return resolveSizing(rawValue);
  }

  return parsePx(rawValue);
}

/**
 * Resolve any token reference to a numeric pixel value for a given theme.
 *
 * Handles chained references: tokens.X → density.Y → sizing.Z → Npx.
 *
 * @param {string} ref The reference string (e.g. 'sizing.size_1', 'density.cellVertical', 'tokens.cellVerticalPadding').
 * @param {string} themeName The theme name (main, classic, horizon).
 * @returns {number} The resolved pixel value.
 */
function resolveRef(ref, themeName) {
  if (typeof ref === 'number') return ref;
  if (typeof ref !== 'string') return NaN;

  if (ref.startsWith('sizing.')) {
    return resolveSizing(ref);
  }

  if (ref.startsWith('density.')) {
    return resolveDensity(ref, THEME_DENSITY[themeName]);
  }

  if (ref.startsWith('tokens.')) {
    const key = ref.replace('tokens.', '');

    return resolveToken(key, themeName);
  }

  return parsePx(ref);
}

/**
 * Resolve a single token key to a numeric value for a given theme.
 *
 * @param {string} key The token key (e.g. 'cellVerticalPadding').
 * @param {string} themeName The theme name.
 * @returns {number} The resolved pixel value.
 */
function resolveToken(key, themeName) {
  const tokens = THEME_TOKENS[themeName];
  const value = tokens[key];

  if (value === undefined) return NaN;

  // Array values are [light, dark] — use light for dimension calculations.
  if (Array.isArray(value)) {
    return resolveRef(value[0], themeName);
  }

  return resolveRef(value, themeName);
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Get a resolved numeric token value for a specific theme.
 *
 * @param {string} key Token key (e.g. 'lineHeight', 'cellVerticalPadding').
 * @param {string} themeName Theme name (main, classic, horizon).
 * @returns {number} Resolved pixel value.
 */
export function getTokenValue(key, themeName) {
  return resolveToken(key, themeName);
}

/**
 * Get a resolved numeric token value for the currently loaded theme.
 *
 * @param {string} key Token key (e.g. 'lineHeight', 'fontSize').
 * @returns {number} Resolved pixel value.
 */
export function token(key) {
  return resolveToken(key, getLoadedTheme());
}

/**
 * Get resolved token values for all three themes at once.
 * Useful with `.forThemes()`.
 *
 * @param {string} key Token key.
 * @returns {{ classic: number, main: number, horizon: number }}
 */
export function tokenForThemes(key) {
  return {
    classic: resolveToken(key, 'classic'),
    main: resolveToken(key, 'main'),
    horizon: resolveToken(key, 'horizon'),
  };
}

/**
 * Calculate the default row height for a theme from design tokens.
 *
 * Formula: lineHeight + (cellVerticalPadding * 2) + 1px border
 *
 * @param {string} [themeName] Theme name. Defaults to the loaded theme.
 * @returns {number} Row height in pixels.
 */
export function calcRowHeight(themeName) {
  const theme = themeName || getLoadedTheme();
  const lineHeight = resolveToken('lineHeight', theme);
  const cellVertical = resolveToken('cellVerticalPadding', theme);

  return lineHeight + (cellVertical * 2) + 1; // +1 for bottom border
}

/**
 * Calculate the default column header height for a theme from design tokens.
 *
 * Formula: lineHeight + (cellVerticalPadding * 2)
 *
 * @param {string} [themeName] Theme name. Defaults to the loaded theme.
 * @returns {number} Column header height in pixels.
 */
export function calcColHeaderHeight(themeName) {
  const theme = themeName || getLoadedTheme();
  const lineHeight = resolveToken('lineHeight', theme);
  const cellVertical = resolveToken('cellVerticalPadding', theme);

  return lineHeight + (cellVertical * 2);
}

/**
 * Calculate values for all themes. Returns an object with classic/main/horizon
 * keys, each holding the result of the callback.
 *
 * @param {Function} fn A function that receives (themeName) and returns a number.
 * @returns {{ classic: number, main: number, horizon: number }}
 */
export function forAllThemes(fn) {
  return {
    classic: fn('classic'),
    main: fn('main'),
    horizon: fn('horizon'),
  };
}
