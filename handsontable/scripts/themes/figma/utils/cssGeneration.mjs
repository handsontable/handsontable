import {
  OUTPUT_PATH, PREFIX, SIZING_KEY, DENSITY_KEY, COLORS_KEY, TOKENS_KEY, OTHER_VARIABLES, ICONS_SET,
} from './constants.mjs';
import { writeFileSync, ensureOutputDirectory } from './helpers/fileSystem.mjs';
import { iconsMap } from './helpers/iconsMap.mjs';

// Default density level to use
const DEFAULT_DENSITY_LEVEL = 'default';

/**
 * List of prefixes that indicate a value should be converted to a CSS variable reference.
 */
const VAR_REFERENCE_PREFIXES = ['tokens.', 'colors.', 'sizing.', 'density.'];

/**
 * Converts underscores to hyphens in a string
 *
 * @param {string} str The string to convert.
 * @returns {string} The string with underscores replaced by hyphens.
 */
function toHyphen(str) {
  return str.replace(/_/g, '-');
}
/**
 * Checks if the given object is an object.
 *
 * @param {any} object The object to check.
 * @returns {boolean} True when the value is a plain object.
 */
export function isObject(object) {
  return Object.prototype.toString.call(object) === '[object Object]' && object !== null && object !== undefined;
}

/**
 * Checks if a value is a reference to another CSS variable (e.g., 'colors.primary').
 *
 * @param {*} value The value to check.
 * @returns {boolean} True when the value is a CSS variable reference.
 */
export function isVarReference(value) {
  return typeof value === 'string' && VAR_REFERENCE_PREFIXES.some(prefix => value.includes(prefix));
}

/**
 * Converts a dot notation path to a CSS variable reference.
 * Handles special case for 'tokens.' prefix which strips the first segment.
 *
 * @param {string} path The dot notation path to convert.
 * @returns {string} The CSS variable reference.
 */
function toVarReference(path) {
  if (path.includes('tokens.')) {
    return `var(--ht-${toHyphen(path.split('.').slice(1).join('-'))})`;
  }

  return `var(--ht-${toHyphen(path.split('.').join('-'))})`;
}

/**
 * Converts a key to a CSS variable key.
 *
 * @param {string} prefix The prefix to add to the CSS variable.
 * @param {string} key The key to convert.
 * @returns {string} The CSS variable key.
 */
export function toCssKey(prefix, key) {
  return `--ht-${prefix ? `${prefix}-` : ''}${toHyphen(key)}`;
}

/**
 * Converts a value to a CSS variable declaration value.
 * Handles variable references, light/dark objects, and plain values.
 *
 * @param {*} value The value to convert.
 * @returns {string} The CSS variable declaration value.
 */
export function toCssValue(value) {
  if (isVarReference(value)) {
    return toVarReference(value);
  }

  if (Array.isArray(value)) {
    if (value.length >= 2) {
      const [light, dark] = value;

      return `light-dark(${toCssValue(light)}, ${toCssValue(dark)})`;
    }

    return toCssValue(value[0]);
  }

  return toHyphen(value);
}

/**
 * Converts a key and value to a CSS variable line.
 *
 * @param {string} prefix - The prefix to add to the CSS variable.
 * @param {string} key - The key to convert.
 * @param {string} value - The value to convert.
 * @returns {string} - The CSS variable line.
 */
export function toCssLine(prefix, key, value) {
  return `${toCssKey(prefix, key)}: ${toCssValue(value)};`;
}

/**
 * Flattens the css variables object into a string of CSS variables.
 *
 * @param {object} cssVariables - The css variables object to flatten.
 * @param {string} [prefix='colors'] - The prefix to add to the CSS variables.
 * @param {string} [parentKey=''] - The parent key to add to the CSS variables.
 * @returns {string} - The flattened css variables.
 */
export function flattenCssVariables(cssVariables, prefix = '', parentKey = '') {
  let cssVars = '';

  Object.entries(cssVariables).forEach(([key, value]) => {
    const normalizedKey = toHyphen(key);
    const fullKey = parentKey ? `${parentKey}-${normalizedKey}` : normalizedKey;

    if (isObject(value)) {
      cssVars += flattenCssVariables(value, prefix, fullKey);
    } else {
      cssVars += `  ${toCssLine(prefix, fullKey, value)}\n`;
    }
  });

  return cssVars;
}

/**
 * Generates a complete CSS file content for a theme
 *
 * @param {string} themeName The name of the theme to generate CSS for.
 * @param {object} themeVariables The processed theme variables.
 * @param {boolean} withIcons Whether to include icon declarations in the output.
 * @returns {string|null} The generated CSS content, or null when no tokens exist for the theme.
 */
function generateThemeCss(themeName, themeVariables, withIcons = false) {
  const { [SIZING_KEY]: sizing, [DENSITY_KEY]: density, [COLORS_KEY]: colors, [TOKENS_KEY]: tokens } = themeVariables;
  const themeColors = colors[themeName];
  const themeTokens = tokens[themeName];

  if (!themeTokens) {
    console.warn(`No tokens found for theme: ${themeName}`);

    return null;
  }

  if (!themeColors) {
    console.warn(`No colors found for theme: ${themeName}`);

    return null;
  }

  const densityLevel = themeTokens[DENSITY_KEY] || DEFAULT_DENSITY_LEVEL;
  const densityVars = density[densityLevel];

  if (!densityVars) {
    console.warn(`No density level "${densityLevel}" found for theme: ${themeName}`);

    return null;
  }

  // Generate class selectors for all variants
  const baseClass = `.ht-theme-${themeName}`;
  const darkClass = `.ht-theme-${themeName}-dark`;
  const darkAutoClass = `.ht-theme-${themeName}-dark-auto`;

  let css = '';

  // Combined selector for shared variables
  css += `${baseClass},\n`;
  css += `${darkClass},\n`;
  css += `${darkAutoClass} {\n`;

  // Add sizing variables
  css += flattenCssVariables(sizing, 'sizing');

  // Add density variables
  css += flattenCssVariables(densityVars, 'density');

  // Add colors variables
  css += flattenCssVariables(themeColors, 'colors');

  // Remove other variables from theme tokens
  const themeTokensWithoutOtherVariables = Object.fromEntries(
    Object.entries(themeTokens).filter(([key]) => !OTHER_VARIABLES.includes(key))
  );

  // Add token variables
  css += flattenCssVariables(themeTokensWithoutOtherVariables, '');

  css += '}\n';

  // Add color-scheme declarations for each variant
  css += `\n${baseClass} {\n`;
  css += '  color-scheme: light;\n';
  css += '}\n';

  css += `\n${darkClass} {\n`;
  css += '  color-scheme: dark;\n';
  css += '}\n';

  css += `\n${darkAutoClass} {\n`;
  css += '  color-scheme: light dark;\n';
  css += '}\n';

  if (withIcons) {
    css += '\n';

    if (themeName === 'horizon') {
      css += iconsMap(ICONS_SET.horizon, `${PREFIX}-theme-${themeName}`);
    } else {
      css += iconsMap(ICONS_SET.main, `${PREFIX}-theme-${themeName}`);
    }

    css += '\n';
  }

  return css;
}

/**
 * Writes CSS theme files for all themes
 *
 * @param {object} themeVariables The processed theme variables to write.
 */
function writeCssThemeFiles(themeVariables) {
  const baseThemePath = `${OUTPUT_PATH}/css/theme`;
  const baseIconsPath = `${OUTPUT_PATH}/css/icons`;

  ensureOutputDirectory(baseThemePath);
  ensureOutputDirectory(baseIconsPath);

  const themeNames = Object.keys(themeVariables[TOKENS_KEY]);
  const iconsNames = Object.keys(ICONS_SET);

  console.log('\n## CSS Generation ##');
  console.log('\n### CSS theme Generation ###');

  for (const themeName of themeNames) {
    const cssContent = generateThemeCss(themeName, themeVariables);
    const cssContentWithIcons = generateThemeCss(themeName, themeVariables, true);

    if (cssContent) {
      const filePathNoIcons = `${baseThemePath}/${PREFIX}-theme-${themeName}-no-icons.css`;

      writeFileSync(filePathNoIcons, cssContent);

      console.log(`Generated: ${filePathNoIcons}`);

      const filePath = `${baseThemePath}/${PREFIX}-theme-${themeName}.css`;

      writeFileSync(filePath, cssContentWithIcons);

      console.log(`Generated: ${filePath}`);
    }
  }

  console.log('\n### CSS icons Generation ###');

  for (const iconName of iconsNames) {
    const icons = ICONS_SET[iconName];
    const cssContent = iconsMap(icons);
    const filePath = `${baseIconsPath}/${PREFIX}-icons-${iconName}.css`;

    writeFileSync(filePath, cssContent);

    console.log(`Generated: ${filePath}`);
  }
}

export { writeCssThemeFiles, generateThemeCss };
