import { deepClone, isObject } from '../helpers/object';
import { warn } from '../helpers/console';
import { staticRegister } from '../utils/staticRegister';
import { createTheme } from './engine';
import type { ThemeBuilder } from './engine/builder';
import type { BaseTheme } from './types';

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
export function hasTheme(themeName: string): boolean {
  return hasItem(themeName) as boolean;
}

/**
 * Get a registered theme by name.
 *
 * @param {string} themeName The theme name.
 * @returns {object|undefined} The theme or undefined if not found.
 */
export function getTheme(themeName: string): ThemeBuilder | undefined {
  if (!hasTheme(themeName)) {
    warn(`Theme "${themeName}" is not registered. Please ensure it is registered before using it.`);

    return undefined;
  }

  return getItem(themeName) as ThemeBuilder;
}

/**
 * Get all registered theme names.
 *
 * @returns {string[]}
 */
export function getThemeNames(): string[] {
  return getNames() as string[];
}

/**
 * Get all registered themes.
 *
 * @returns {object[]}
 */
export function getThemes(): ThemeBuilder[] {
  return getValues() as ThemeBuilder[];
}

/**
 * Parse theme name and config from arguments.
 *
 * @private
 * @param {string|object} themeNameOrConfig Theme name for specific theme or object representing theme config.
 * @param {object} [themeConfig] The theme config object (optional if first parameter has already theme config).
 * @returns {{themeName: string, themeConfigObject: object}} Parsed theme name and config object.
 */
function parseThemeArgs(
  themeNameOrConfig: string | BaseTheme, themeConfig?: BaseTheme): { themeName: string; themeConfigObject: BaseTheme } {
  let themeName = themeNameOrConfig as string;
  let themeConfigObject = deepClone(themeConfig) as BaseTheme;

  if (typeof themeNameOrConfig === 'string' && isObject(themeConfig)) {
    themeConfigObject.name = themeNameOrConfig;
  } else if (typeof themeNameOrConfig !== 'string' && isObject(themeNameOrConfig)) {
    themeConfigObject = deepClone(themeNameOrConfig) as BaseTheme;
    themeName = themeConfigObject.name ?? '';
  }

  return { themeName, themeConfigObject };
}

/**
 * Register a theme.
 *
 * @param {string|object} themeNameOrConfig Theme name for specific theme or object representing theme config.
 * @param {object} [themeConfig] The theme config object (optional if first parameter has already theme config).
 * @returns {object} The registered theme (ThemeBuilder instance).
 */
export function registerTheme(themeNameOrConfig: string | BaseTheme, themeConfig?: BaseTheme): ThemeBuilder {
  const { themeName, themeConfigObject } = parseThemeArgs(themeNameOrConfig, themeConfig);

  const theme = createTheme(themeConfigObject);

  if (hasTheme(themeName)) {
    warn(`Theme "${themeName}" is already registered. Registration skipped.`);

    return getTheme(themeName)!;
  }

  register(themeName, theme);

  return theme;
}

/**
 * Reinitialize an existing theme with a new configuration.
 *
 * @param {string|object} themeNameOrConfig Theme name for specific theme or object representing theme config.
 * @param {object} [themeConfig] The theme config object to reinitialize (optional if first parameter has already theme config).
 * @returns {object|undefined} The reinitialized theme (ThemeBuilder instance) or undefined if theme not found.
 */
export function reinitTheme(themeNameOrConfig: string | BaseTheme, themeConfig?: BaseTheme): ThemeBuilder | undefined {
  const { themeName, themeConfigObject } = parseThemeArgs(themeNameOrConfig, themeConfig);

  if (!hasTheme(themeName)) {
    warn(`Theme "${themeName}" is not registered. Cannot reinitialize a non-existent theme.`);

    return undefined;
  }

  // Create a new theme with the new config
  const reinitializedTheme = createTheme(themeConfigObject);

  // Re-register the theme (this will replace the existing one)
  register(themeName, reinitializedTheme);

  return reinitializedTheme;
}

