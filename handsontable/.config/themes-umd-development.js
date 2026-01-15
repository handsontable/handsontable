/**
 * Config responsible for building Handsontable theme UMD modules:
 *  - dist/themes/*.js (theme files with auto-registration)
 *  - dist/themes/static/variables/*.js (variables files without auto-registration)
 */
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const compilationDoneMarker = require('./plugin/webpack/compilation-done-marker');

const PACKAGE_FILENAME = process.env.HOT_FILENAME;
const NEW_LINE_CHAR = '\n';
const SOURCE_THEMES_DIRECTORY = 'src/themes/theme';
const SOURCE_VARIABLES_DIRECTORY = 'src/themes/static/variables';
const OUTPUT_THEMES_DIRECTORY = 'themes';

let licenseBody = fs.readFileSync(path.resolve(__dirname, '../../LICENSE.txt'), 'utf8');
licenseBody += '\nVersion: ' + process.env.HOT_VERSION;
licenseBody += '\nRelease date: ' + process.env.HOT_RELEASE_DATE + ' (built at ' + process.env.HOT_BUILD_DATE + ')';

/**
 * Rule for injecting Handsontable import and theme registration into theme files.
 * Theme files export plain config objects with named exports `export { themeName }`.
 * This rule:
 * 1. Adds Handsontable import at the top
 * 2. Registers the theme before export using Handsontable.themes.registerTheme
 */
const ruleForThemeRegistration = {
  test: /theme\/[\w-]+\.js$/,
  loader: 'string-replace-loader',
  options: {
    multiple: [
      {
        // Add Handsontable import at the very beginning of the file
        search: /^(import )/,
        replace(match, capturedImport) {
          return `import Handsontable from '${PACKAGE_FILENAME}';${NEW_LINE_CHAR}${NEW_LINE_CHAR}${capturedImport}`;
        },
        flags: ''
      },
      {
        // Register theme before the export statement
        // Matches: export { someTheme };
        search: /(export \{ (\w+) \};)/,
        replace(match, exportStatement, themeName) {
          const snippet = `Handsontable.themes.registerTheme(${themeName});`;

          return `${snippet}${NEW_LINE_CHAR}${NEW_LINE_CHAR}${exportStatement}`;
        },
        flags: 'g'
      }
    ]
  }
};

/**
 * Get all theme entry files from src/themes/theme/ directory.
 *
 * @returns {object} Entry configurations for theme files.
 */
function getThemeEntryFiles() {
  const entryObject = {};
  const themesDir = path.resolve(__dirname, `../${SOURCE_THEMES_DIRECTORY}`);

  if (!fs.existsSync(themesDir)) {
    return entryObject;
  }

  const filesInThemesDirectory = fs.readdirSync(themesDir);

  filesInThemesDirectory.forEach((fileName) => {
    const jsExtensionRegExp = /\.js$/;

    // Skip index.js - only process individual theme files
    if (jsExtensionRegExp.test(fileName) && fileName !== 'index.js') {
      const fileNameWithoutExtension = fileName.replace(jsExtensionRegExp, '');
      const filePath = path.resolve(themesDir, fileName);
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Extract the named export from the file (e.g., "export { classicTheme };" -> "classicTheme")
      const namedExportMatch = fileContent.match(/export \{ (\w+) \};/);
      const exportName = namedExportMatch ? namedExportMatch[1] : `${fileNameWithoutExtension}Theme`;

      entryObject[fileNameWithoutExtension] = {
        entryPath: filePath,
        libraryName: exportName,
        exportName,
        isThemeFile: true,
      };
    }
  });

  return entryObject;
}

/**
 * Scan variables directory recursively for entry files.
 *
 * @returns {object} Entry configurations for variables files.
 */
function getVariablesEntryFiles() {
  const entryObject = {};
  const variablesDir = path.resolve(__dirname, `../${SOURCE_VARIABLES_DIRECTORY}`);

  if (!fs.existsSync(variablesDir)) {
    return entryObject;
  }

  const scanDir = (dir, prefix = 'static/variables') => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach((entry) => {
      if (entry.isFile() && entry.name.endsWith('.js')) {
        const fileName = entry.name.replace('.js', '');
        const entryName = `${prefix}/${fileName}`;
        const entryPath = path.resolve(dir, entry.name);

        entryObject[entryName] = {
          entryPath,
          libraryName: fileName,
          isThemeFile: false,
        };
      } else if (entry.isDirectory()) {
        scanDir(path.join(dir, entry.name), `${prefix}/${entry.name}`);
      }
    });
  };

  scanDir(variablesDir);

  return entryObject;
}

/**
 * Create webpack configuration for a single entry.
 *
 * @param {string} entryName The entry name (output filename without extension).
 * @param {string} entryPath The entry file path.
 * @param {string} libraryName The UMD library name.
 * @param {object} envArgs Environment arguments.
 * @param {boolean} isThemeFile Whether this is a theme file that needs auto-registration.
 * @param {string} exportName The export name to use (named export for themes, 'default' for variables).
 * @returns {object} Webpack configuration object.
 */
function createConfig(entryName, entryPath, libraryName, envArgs, isThemeFile = false, exportName = 'default') {
  const config = {
    mode: 'none',
    entry: { [entryName]: entryPath },
    output: {
      filename: `${OUTPUT_THEMES_DIRECTORY}/${entryName}.js`,
      globalObject: `typeof self !== 'undefined' ? self : this`,
      library: {
        type: 'umd',
        export: exportName,
        name: libraryName,
      },
      path: path.resolve(__dirname, '../dist'),
      umdNamedDefine: true,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new webpack.BannerPlugin(licenseBody),
      new webpack.DefinePlugin({
        '__ENV_ARGS__': JSON.stringify(envArgs),
      }),
      compilationDoneMarker(),
    ],
  };

  // Add theme registration rule and Handsontable external for theme files
  if (isThemeFile) {
    config.module.rules.push(ruleForThemeRegistration);
    config.externals = {
      [PACKAGE_FILENAME]: {
        root: 'Handsontable',
        commonjs2: PACKAGE_FILENAME,
        commonjs: PACKAGE_FILENAME,
        amd: PACKAGE_FILENAME,
      },
    };
  }

  return config;
}

module.exports.create = function create(envArgs) {
  const themeEntries = getThemeEntryFiles();
  const variablesEntries = getVariablesEntryFiles();
  const allEntries = { ...themeEntries, ...variablesEntries };

  return Object.entries(allEntries).map(([entryName, config]) => {
    const exportName = config.exportName || 'default';

    return createConfig(entryName, config.entryPath, config.libraryName, envArgs, config.isThemeFile, exportName);
  });
};
