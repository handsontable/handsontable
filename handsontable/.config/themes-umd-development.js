/**
 * Config responsible for building Handsontable theme UMD modules:
 *  - dist/themes/mainTheme.js
 *  - dist/themes/horizonTheme.js
 *  - dist/themes/classicTheme.js
 *  - dist/themes/mainIcons.js
 *  - dist/themes/horizonIcons.js
 */
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
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
    externals: {},
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
          options: {
            cacheDirectory: false,
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
                corejs: false,
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
    node: false,
  };
}

function scanThemesDirectory() {
  const themesDir = path.resolve(__dirname, '../src/themes');
  const entryConfigs = {};

  // Scan root theme files (excluding directories and non-theme files)
  const rootFiles = fs.readdirSync(themesDir, { withFileTypes: true });
  const themeFiles = rootFiles
    .filter(dirent => dirent.isFile() && dirent.name.endsWith('.js') && dirent.name !== 'styles.js')
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

  return entryConfigs;
}

module.exports.create = function create(envArgs) {
  const entryConfigs = scanThemesDirectory();

  return Object.entries(entryConfigs).map(([entryName, config]) => {
    return createConfig(entryName, config.entryPath, config.libraryName, envArgs);
  });
};

