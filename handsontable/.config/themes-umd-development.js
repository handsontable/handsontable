/**
 * Config responsible for building Handsontable theme UMD modules:
 *  - dist/themes/*.js
 *  - dist/themes/variables/*.js
 */
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const compilationDoneMarker = require('./plugin/webpack/compilation-done-marker');

let licenseBody = fs.readFileSync(path.resolve(__dirname, '../../LICENSE.txt'), 'utf8');
licenseBody += '\nVersion: ' + process.env.HOT_VERSION;
licenseBody += '\nRelease date: ' + process.env.HOT_RELEASE_DATE + ' (built at ' + process.env.HOT_BUILD_DATE + ')';

function createConfig(entryName, entryPath, libraryName, envArgs) {
  return {
    mode: 'none',
    entry: { [entryName]: entryPath },
    output: {
      filename: `themes/${entryName}.js`,
      globalObject: `typeof self !== 'undefined' ? self : this`,
      library: {
        type: 'umd',
        export: 'default',
        name: libraryName,
      },
      path: path.resolve(__dirname, '../dist'),
      umdNamedDefine: true,
    },
    devtool: 'source-map',
    resolve: {
      alias: {
        // Redirect to minimal stubs that only export what's actually used
        [path.resolve(__dirname, '../src/helpers/mixed.js')]: path.resolve(__dirname, './stubs/theme-mixed.js'),
        [path.resolve(__dirname, '../src/helpers/console.js')]: path.resolve(__dirname, './stubs/theme-console.js'),
        [path.resolve(__dirname, '../src/helpers/object.js')]: path.resolve(__dirname, './stubs/theme-object.js'),
      },
    },
    optimization: {
      usedExports: true,
      sideEffects: true,
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              dead_code: true,
              unused: true,
              drop_debugger: true,
            },
            mangle: false,
            format: {
              beautify: true,
            },
          },
          extractComments: false,
        }),
      ],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          include: [
            path.resolve(__dirname, '../src/helpers'),
            path.resolve(__dirname, '../src/utils'),
            path.resolve(__dirname, '../src/themes'),
            path.resolve(__dirname, './stubs'),
          ],
          sideEffects: false,
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  chrome: '90',
                  firefox: '88',
                  safari: '14',
                  edge: '90',
                },
                modules: false,
                useBuiltIns: false,
              }]
            ],
            plugins: [
              ['transform-inline-environment-variables'],
            ],
          },
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
}

function scanThemesDirectory() {
  const themesDir = path.resolve(__dirname, '../src/themes');
  const entryConfigs = {};

  // Scan root theme files (excluding directories and non-theme files)
  const rootFiles = fs.readdirSync(themesDir, { withFileTypes: true });
  const themeFiles = rootFiles
    .filter(dirent => dirent.isFile() && dirent.name.endsWith('.js') && dirent.name !== 'index.js')
    .map(dirent => dirent.name.replace('.js', ''));

  // Add root theme files
  themeFiles.forEach(fileName => {
    const entryName = fileName;
    const libraryName = fileName;
    const entryPath = path.resolve(themesDir, `${fileName}.js`);
    entryConfigs[entryName] = {
      entryPath: entryPath,
      libraryName: libraryName,
    };
  });

  // Scan icons subdirectory
  const iconsDir = path.join(themesDir, 'icons');
  if (fs.existsSync(iconsDir)) {
    const iconFiles = fs.readdirSync(iconsDir)
      .filter(file => file.endsWith('.js'))
      .map(file => file.replace('.js', ''));

    iconFiles.forEach(fileName => {
      const entryName = `${fileName}Icons`;
      const libraryName = entryName;
      const entryPath = path.resolve(iconsDir, `${fileName}.js`);
      entryConfigs[entryName] = {
        entryPath: entryPath,
        libraryName: libraryName,
      };
    });
  }

  // Scan variables directory recursively
  const variablesDir = path.join(themesDir, 'variables');
  if (fs.existsSync(variablesDir)) {
    const scanVariablesDir = (dir, prefix = 'variables') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      entries.forEach(entry => {
        if (entry.isFile() && entry.name.endsWith('.js')) {
          const fileName = entry.name.replace('.js', '');
          const entryName = `${prefix}/${fileName}`;
          const libraryName = fileName;
          const entryPath = path.resolve(dir, entry.name);
          entryConfigs[entryName] = {
            entryPath: entryPath,
            libraryName: libraryName,
          };
        } else if (entry.isDirectory()) {
          scanVariablesDir(path.join(dir, entry.name), `${prefix}/${entry.name}`);
        }
      });
    };

    scanVariablesDir(variablesDir);
  }

  return entryConfigs;
}

module.exports.create = function create(envArgs) {
  const entryConfigs = scanThemesDirectory();

  return Object.entries(entryConfigs).map(([entryName, config]) => {
    return createConfig(entryName, config.entryPath, config.libraryName, envArgs);
  });
};

