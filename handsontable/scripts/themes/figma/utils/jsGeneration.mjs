import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { OUTPUT_PATH, SIZING_KEY, DENSITY_KEY, OTHER_VARIABLES, ICONS_SET, EXCEPTION_KEYS } from './constants.mjs';
import { readFileSync, writeFileSync, ensureOutputDirectory } from './helpers/fileSystem.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Auto-generated file header.
 */
const AUTO_GENERATED_HEADER = `/*
 * This file is auto-generated. Do not edit directly.
 */

`;

/**
 * ESLint disable comment prepended to icon modules (long base64 data URIs, double quotes).
 */
const ESLINT_DISABLE_ICONS = `/* eslint-disable max-len, quotes */

`;

/**
 * Per-category TypeScript wrapper config: the type to import and where from.
 */
const TS_TYPE_MAP = {
  sizing: { type: 'ThemeSizingConfig', importPath: '../../types' },
  density: { type: 'ThemeDensitySizes', importPath: '../../types' },
  tokens: { type: 'ThemeTokensConfig', importPath: '../../../types' },
  colors: { type: 'ThemeColorsConfig', importPath: '../../../types' },
  icons: { type: 'ThemeIconsConfig', importPath: '../../../types' },
};

/**
 * Converts hyphen-case to camelCase (hyphens before digits become underscores).
 *
 * @param {string} str The hyphen-case string to convert.
 * @returns {string} The camelCased string.
 */
function toCamelCase(str) {
  return str
    .replace(/-(\d)/g, '_$1') // hyphen before digit → underscore
    .replace(/-([a-z])/g, (_, char) => char.toUpperCase()); // hyphen before letter → camelCase
}

/**
 * Converts reference values like "tokens.background-secondary-color" to "tokens.backgroundSecondaryColor".
 *
 * @param {*} value The reference value to convert.
 * @returns {*} The converted value, or the original value when not a string.
 */
function convertValueReferenceToCamelCase(value) {
  if (typeof value !== 'string') {
    return value;
  }

  // Split by dots, convert each part to camelCase, rejoin
  return value
    .split('.')
    .map(part => toCamelCase(part))
    .join('.');
}

/**
 * Recursively converts all keys in an object from hyphen-case to camelCase.
 * Also converts string values that are references (e.g., "themes.background-secondary-color").
 *
 * @param {*} obj The object, array, or value whose keys should be converted.
 * @param {string|null} parentKey The key of the parent object, used to detect exception keys.
 * @returns {*} The converted object, array, or value.
 */
function convertKeysToCamelCase(obj, parentKey = null) {
  if (typeof obj !== 'object' || obj === null) {
    // Skip camelCase conversion for exception keys' values
    if (parentKey && EXCEPTION_KEYS.includes(parentKey) && typeof obj === 'string') {
      return obj;
    }

    return convertValueReferenceToCamelCase(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToCamelCase(item, parentKey));
  }

  return Object.entries(obj).reduce((acc, [key, value]) => {
    const camelKey = toCamelCase(key);

    // Pass the original key (before camelCase) to check if it's an exception key
    acc[camelKey] = convertKeysToCamelCase(value, key);

    return acc;
  }, {});
}

/**
 * Converts a value to a single-quoted string representation (for output files).
 *
 * @param {*} value The value to convert.
 * @returns {string} The single-quoted string representation of the value.
 */
function toSingleQuotedString(value) {
  if (typeof value === 'string') {
    // Escape single quotes and backslashes, then wrap in single quotes
    const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'');

    return `'${escaped}'`;
  }

  return JSON.stringify(value);
}

/**
 * Converts a value to a double-quoted string representation (for icons).
 *
 * @param {*} value The value to convert.
 * @returns {string} The double-quoted string representation of the value.
 */
function toDoubleQuotedString(value) {
  if (typeof value === 'string') {
    // Escape double quotes and backslashes, then wrap in double quotes
    const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    return `"${escaped}"`;
  }

  return JSON.stringify(value);
}

/**
 * Converts an object to a JS string with unquoted keys.
 *
 * @param {object|Array} obj The object or array to serialize.
 * @param {number} indent The number of spaces to use for indentation.
 * @param {boolean} useDoubleQuotes Whether to use double quotes for string values.
 * @returns {string} The serialized JS object literal.
 */
function toJsObject(obj, indent = 2, useDoubleQuotes = false) {
  const spaces = ' '.repeat(indent);
  const stringFormatter = useDoubleQuotes ? toDoubleQuotedString : toSingleQuotedString;

  // Handle arrays
  if (Array.isArray(obj)) {
    const items = obj.map((item) => {
      if (typeof item === 'object' && item !== null) {
        return toJsObject(item, indent + 2, useDoubleQuotes);
      }

      return stringFormatter(item);
    });

    return `[${items.join(', ')}]`;
  }

  const entries = Object.entries(obj).map(([key, value]) => {
    const formattedValue =
      typeof value === 'object' && value !== null
        ? toJsObject(value, indent + 2, useDoubleQuotes)
        : stringFormatter(value);

    return `${spaces}${key}: ${formattedValue}`;
  });

  return `{\n${entries.join(',\n')}\n${' '.repeat(indent - 2)}}`;
}

/**
 * Computes the exported const name for a generated module.
 *
 * @param {string} category The token category (e.g., 'sizing', 'density', 'colors').
 * @param {string} themeName The theme name used to build the const name.
 * @returns {string} The exported const name.
 */
export function tsConstName(category, themeName) {
  if (category === 'sizing') {
    return 'sizing';
  }

  if (category === 'density') {
    return 'densitySizes';
  }

  const suffix = `${category.charAt(0).toUpperCase()}${category.slice(1)}`;

  return `${toCamelCase(themeName)}${suffix}`;
}

/**
 * Wraps a serialized object literal in a typed, auto-generated TypeScript module.
 *
 * @param {object} root0 The build options.
 * @param {string} root0.category The token category used to resolve the TypeScript type.
 * @param {string} root0.themeName The theme name used to build the const name.
 * @param {string} root0.objectLiteral The serialized object literal to assign.
 * @returns {string} The generated TypeScript module source.
 */
export function buildTsModule({ category, themeName, objectLiteral }) {
  const { type, importPath } = TS_TYPE_MAP[category];
  const name = tsConstName(category, themeName);
  const prefix = category === 'icons' ? ESLINT_DISABLE_ICONS : '';

  return `${prefix}${AUTO_GENERATED_HEADER}import type { ${type} } from '${importPath}';\n\n`
    + `const ${name}: ${type} = ${objectLiteral};\n\nexport default ${name};\n`;
}

/**
 * Writes typed TypeScript theme-variable files for the processed theme variables.
 *
 * @param {object} themeVariables The processed theme variables to write.
 */
function writeJsThemeFiles(themeVariables) {
  const path = `${OUTPUT_PATH}/variables`;

  ensureOutputDirectory(path);

  console.log('## TS Generation ##');

  Object.entries(themeVariables).forEach(([key, value]) => {
    if (key === SIZING_KEY || key === DENSITY_KEY) {
      const camelCaseValue = convertKeysToCamelCase(value);
      const objectLiteral = toJsObject(camelCaseValue);

      writeFileSync(`${path}/${key}.ts`, buildTsModule({ category: key, themeName: null, objectLiteral }));
      console.log(`Generated: ${path}/${key}.ts`);
    } else {
      const dir = `${path}/${key}`;

      ensureOutputDirectory(dir);

      Object.entries(value).forEach(([subKey, subValue]) => {
        const values = Object.entries(subValue).reduce((acc, [k, v]) => {
          if (!OTHER_VARIABLES.includes(k)) {
            acc[k] = v;
          }

          return acc;
        }, {});

        const objectLiteral = toJsObject(convertKeysToCamelCase(values));

        writeFileSync(`${dir}/${subKey}.ts`, buildTsModule({ category: key, themeName: subKey, objectLiteral }));
        console.log(`Generated: ${dir}/${subKey}.ts`);
      });
    }
  });

  const iconsPath = `${path}/icons`;

  ensureOutputDirectory(iconsPath);

  Object.entries(ICONS_SET).forEach(([key, value]) => {
    const objectLiteral = toJsObject(value, 2, true);

    writeFileSync(`${iconsPath}/${key}.ts`, buildTsModule({ category: 'icons', themeName: key, objectLiteral }));
    console.log(`Generated: ${iconsPath}/${key}.ts`);
  });

  const helpersPath = `${path}/helpers`;

  ensureOutputDirectory(helpersPath);

  // The typed iconsMap module is copied verbatim from the template (already TS, already typed).
  const iconsMapTemplate = readFileSync(resolve(__dirname, '..', 'templates', 'iconsMap.ts'), 'utf8');

  writeFileSync(`${helpersPath}/iconsMap.ts`, iconsMapTemplate);
  console.log(`Generated: ${helpersPath}/iconsMap.ts`);
}

export { writeJsThemeFiles };
