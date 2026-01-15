import { deepClone, isObject } from '../helpers/object';
import { warn } from '../helpers/console';
import { staticRegister } from '../utils/staticRegister';
import { createTheme } from './engine';

const {
  hasItem,
  getItem,
  getNames,
  getValues,
  register,
} = staticRegister('themes');

/**
 * Check if a theme with the specified name is registered.
 *
 * @param {string} themeName The theme name.
 * @returns {boolean}
 */
export function hasTheme(themeName) {
  return hasItem(themeName);
}

/**
 * Get a registered theme by name.
 *
 * @param {string} themeName The theme name.
 * @returns {object|undefined} The theme or undefined if not found.
 */
export function getTheme(themeName) {
  if (!hasTheme(themeName)) {
    warn(`Theme "${themeName}" is not registered. Please ensure it is registered before using it.`);

    return undefined;
  }

  return getItem(themeName);
}

/**
 * Get all registered theme names.
 *
 * @returns {string[]}
 */
export function getThemeNames() {
  return getNames();
}

/**
 * Get all registered themes.
 *
 * @returns {object[]}
 */
export function getThemes() {
  return getValues();
}

/**
 * Register a theme.
 *
 * @param {string|object} themeNameOrConfig Theme name for specific theme or object representing theme config.
 * @param {object} [themeConfig] The theme config object (optional if first parameter has already theme config).
 * @returns {object} The registered theme (ThemeBuilder instance).
 */
export function registerTheme(themeNameOrConfig, themeConfig) {
  let themeName = themeNameOrConfig;
  let themeConfigObject = deepClone(themeConfig);

  if (typeof themeNameOrConfig === 'string' && isObject(themeConfig)) {
    themeConfigObject.name = themeNameOrConfig;
  } else if (isObject(themeNameOrConfig)) {
    themeConfigObject = deepClone(themeNameOrConfig);
    themeName = themeConfigObject.name;
  }

  const theme = createTheme(themeConfigObject);

  if (hasTheme(themeName)) {
    warn(`Theme "${themeName}" is already registered. Registration skipped.`);

    return getTheme(themeName);
  }

  register(themeName, theme);

  return theme;
}
