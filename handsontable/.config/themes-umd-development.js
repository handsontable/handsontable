/**
 * Config responsible for building Handsontable theme UMD modules:
 *  - dist/themes/*.js (theme files with auto-registration)
 *  - dist/themes/static/variables/*.js (variables files without auto-registration)
 */
const path = require('path');
const fs = require('fs');
const rspack = require('@rspack/core');
const compilationDoneMarker = require('./plugin/rspack/compilation-done-marker');
const { BROWSERS_LIST } = require('../../browser-targets.js');
const { getLicenseBody } = require('./helper/license');

const PACKAGE_FILENAME = process.env.HOT_FILENAME;
const NEW_LINE_CHAR = '\n';
const SOURCE_THEMES_DIRECTORY = 'src/themes/theme';
const SOURCE_VARIABLES_DIRECTORY = 'src/themes/static/variables';
const OUTPUT_THEMES_DIRECTORY = 'themes';

/**
 * Create the Handsontable import statement.
 *
 * @returns {string} Import statement string.
 */
function createHandsontableImport() {
  return `import Handsontable from '${PACKAGE_FILENAME}';`;
}

/**
 * Create externals configuration for Handsontable.
 *
 * @returns {object} Webpack externals config.
 */
function createHandsontableExternals() {
  return {
    [PACKAGE_FILENAME]: {
      root: 'Handsontable',
      commonjs2: PACKAGE_FILENAME,
      commonjs: PACKAGE_FILENAME,
      amd: PACKAGE_FILENAME,
    },
  };
}

/**
 * Rule for injecting Handsontable import and theme registration into theme files.
 * Theme files export plain config objects with named exports `export { themeName }`.
 * This rule:
 * 1. Adds Handsontable import at the top
 * 2. Registers the theme before export using Handsontable.themes.registerTheme
 */
const ruleForThemeRegistration = {
  test: /theme\/[\w-]+\.ts$/,
  loader: 'string-replace-loader',
  options: {
    multiple: [
      {
        // Add Handsontable import at the very beginning of the file
        search: /^(import )/,
        replace: (match, capturedImport) =>
          `${createHandsontableImport()}${NEW_LINE_CHAR}${NEW_LINE_CHAR}${capturedImport}`,
        flags: ''
      },
      {
        // Register theme before the export statement
        // Matches: export { someTheme };
        search: /(export \{ (\w+) \};)/,
        replace: (match, exportStatement, themeName) => {
          const registrationSnippet = [
            `if (typeof Handsontable !== 'undefined') {`,
            `  Handsontable.themes.registerTheme(${themeName});`,
            `}`
          ].join(NEW_LINE_CHAR);

          return `${registrationSnippet}${NEW_LINE_CHAR}${NEW_LINE_CHAR}${exportStatement}`;
        },
        flags: 'g'
      }
    ]
  }
};

/**
 * Build namespace initialization lines for nested paths.
 *
 * @param {string} namespacePath The path within variables namespace (e.g., 'colors/tokens').
 * @param {string} variableName The variable name to assign.
 * @returns {string[]} Array of initialization lines.
 */
function buildNamespaceLines(namespacePath, variableName) {
  const lines = [
    '  Handsontable.themes.variables = Handsontable.themes.variables || {};',
  ];

  if (namespacePath) {
    let currentPath = 'Handsontable.themes.variables';

    for (const part of namespacePath.split('/')) {
      lines.push(`  ${currentPath}.${part} = ${currentPath}.${part} || {};`);
      currentPath = `${currentPath}.${part}`;
    }

    lines.push(`  ${currentPath}.${variableName} = ${variableName};`);
  } else {
    lines.push(`  Handsontable.themes.variables.${variableName} = ${variableName};`);
  }

  return lines;
}

/**
 * Create rule for injecting Handsontable import and variables registration into variable files.
 *
 * @param {string} variableName The name to use for the variable in the namespace.
 * @param {string} namespacePath The path within variables namespace (e.g., 'colors' for colors/ant.js).
 * @returns {object} Webpack rule configuration.
 */
function createRuleForVariablesRegistration(variableName, namespacePath) {
  return {
    test: /static\/variables\/.*\.ts$/,
    loader: 'string-replace-loader',
    options: {
      multiple: [
        {
          // Add Handsontable import after the comment block at the top
          search: /^(\/\*[\s\S]*?\*\/\s*)/,
          replace: (match, comment) =>
            `${comment}${createHandsontableImport()}${NEW_LINE_CHAR}${NEW_LINE_CHAR}`,
          flags: ''
        },
        {
          // Transform typed const + default export to namespace registration (no export, just side effect)
          // Matches: const varName: Type = { ... };\n\nexport default varName;
          search: /const \w+(?::\s*\w+)?\s*=\s*(\{[\s\S]*\});\s*\n+export default \w+;/,
          replace: (match, objectBody) => {
            const lines = [
              `const ${variableName} = ${objectBody};`,
              '',
              `if (typeof Handsontable !== 'undefined' && Handsontable.themes) {`,
              ...buildNamespaceLines(namespacePath, variableName),
              '}',
            ];

            return lines.join(NEW_LINE_CHAR);
          },
          flags: ''
        }
      ]
    }
  };
}

/**
 * Resolve a path relative to the config directory.
 *
 * @param {string} relativePath Path relative to the config directory.
 * @returns {string} Absolute path.
 */
function resolveFromConfig(relativePath) {
  return path.resolve(__dirname, '..', relativePath);
}

/**
 * Check if a directory exists.
 *
 * @param {string} dirPath Directory path to check.
 * @returns {boolean} True if directory exists.
 */
function directoryExists(dirPath) {
  return fs.existsSync(dirPath);
}

/**
 * Extract named export from a theme file content.
 *
 * @param {string} content File content.
 * @param {string} fallbackName Fallback export name.
 * @returns {string} The export name.
 */
function extractNamedExport(content, fallbackName) {
  const match = content.match(/export \{ (\w+) \};/);

  return match ? match[1] : fallbackName;
}

/**
 * Get all theme entry files from src/themes/theme/ directory.
 *
 * @returns {object} Entry configurations for theme files.
 */
function getThemeEntryFiles() {
  const themesDir = resolveFromConfig(SOURCE_THEMES_DIRECTORY);

  if (!directoryExists(themesDir)) {
    return {};
  }

  const entries = {};
  const TS_EXTENSION = /\.ts$/;

  for (const fileName of fs.readdirSync(themesDir)) {
    // Skip index.ts - only process individual theme files
    if (!TS_EXTENSION.test(fileName) || fileName === 'index.ts') {
      continue;
    }

    const baseName = fileName.replace(TS_EXTENSION, '');
    const filePath = path.resolve(themesDir, fileName);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const exportName = extractNamedExport(fileContent, `${baseName}Theme`);

    entries[baseName] = {
      entryPath: filePath,
      libraryName: exportName,
      exportName,
      isThemeFile: true,
    };
  }

  return entries;
}

/**
 * Scan variables directory recursively for entry files.
 *
 * @returns {object} Entry configurations for variables files.
 */
function getVariablesEntryFiles() {
  const variablesDir = resolveFromConfig(SOURCE_VARIABLES_DIRECTORY);

  if (!directoryExists(variablesDir)) {
    return {};
  }

  const entries = {};

  const scanDirectory = (dir, prefix = 'static/variables', namespacePath = '') => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const { name } = entry;

      if (entry.isFile() && name.endsWith('.ts')) {
        const baseName = name.replace('.ts', '');

        entries[`${prefix}/${baseName}`] = {
          entryPath: path.resolve(dir, name),
          libraryName: baseName,
          namespacePath,
          isThemeFile: false,
        };
      } else if (entry.isDirectory()) {
        const newNamespacePath = namespacePath ? `${namespacePath}/${name}` : name;

        scanDirectory(path.join(dir, name), `${prefix}/${name}`, newNamespacePath);
      }
    }
  };

  scanDirectory(variablesDir);

  return entries;
}

/**
 * Create library output configuration.
 *
 * @param {boolean} isThemeFile Whether this is a theme file.
 * @param {string} exportName Export name for themes.
 * @param {string} libraryName Library name for UMD.
 * @returns {object} Library configuration.
 */
function createLibraryConfig(isThemeFile, exportName, libraryName) {
  // Theme files get full UMD export to window (e.g., window.classicTheme)
  // Variables get UMD wrapper (for Handsontable external) but no named global export
  if (isThemeFile) {
    return {
      type: 'umd',
      export: exportName,
      name: libraryName,
    };
  }

  return { type: 'umd' };
}

/**
 * Create webpack configuration for a single entry.
 *
 * @param {object} options Configuration options.
 * @param {string} options.entryName The entry name (output filename without extension).
 * @param {string} options.entryPath The entry file path.
 * @param {string} options.libraryName The UMD library name.
 * @param {object} options.envArgs Environment arguments.
 * @param {boolean} [options.isThemeFile=false] Whether this is a theme file that needs auto-registration.
 * @param {string} [options.exportName='default'] The export name to use.
 * @param {string} [options.namespacePath=''] The namespace path for variables.
 * @returns {object} Webpack configuration object.
 */
function createConfig({
  entryName,
  entryPath,
  libraryName,
  envArgs,
  isThemeFile = false,
  exportName = 'default',
  namespacePath = '',
}) {
  const registrationRule = isThemeFile
    ? ruleForThemeRegistration
    : createRuleForVariablesRegistration(libraryName, namespacePath);

  return {
    mode: 'none',
    devtool: false,
    entry: { [entryName]: entryPath },
    output: {
      filename: `${OUTPUT_THEMES_DIRECTORY}/${entryName}.js`,
      globalObject: `typeof self !== 'undefined' ? self : this`,
      path: resolveFromConfig('dist'),
      umdNamedDefine: true,
      library: createLibraryConfig(isThemeFile, exportName, libraryName),
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'builtin:swc-loader',
          exclude: /node_modules/,
          options: {
            env: {
              targets: BROWSERS_LIST.join(', '),
            },
            jsc: {
              parser: {
                syntax: 'ecmascript',
              },
            },
          },
        },
        {
          test: /\.(ts|tsx)$/,
          loader: 'builtin:swc-loader',
          exclude: /node_modules/,
          options: {
            env: {
              targets: BROWSERS_LIST.join(', '),
            },
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
                decorators: true,
              },
            },
          },
        },
        registrationRule,
      ],
    },
    externals: createHandsontableExternals(),
    plugins: [
      new rspack.BannerPlugin({ banner: getLicenseBody() }),
      new rspack.DefinePlugin({
        __ENV_ARGS__: JSON.stringify(envArgs),
      }),
      compilationDoneMarker(),
    ],
  };
}

/**
 * Create webpack configurations for all theme and variable entries.
 *
 * @param {object} envArgs Environment arguments.
 * @returns {object[]} Array of webpack configuration objects.
 */
module.exports.create = function create(envArgs) {
  const allEntries = {
    ...getThemeEntryFiles(),
    ...getVariablesEntryFiles(),
  };

  return Object.entries(allEntries).map(([entryName, config]) =>
    createConfig({
      entryName,
      entryPath: config.entryPath,
      libraryName: config.libraryName,
      envArgs,
      isThemeFile: config.isThemeFile,
      exportName: config.exportName || 'default',
      namespacePath: config.namespacePath || '',
    })
  );
};
