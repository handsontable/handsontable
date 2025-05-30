const fs = require('fs');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

// Check if the locally linked Angular wrapper exists and use it, otherwise use the one from node_modules.
const localAngularWrapperPath = '../../public/@handsontable/angular-wrapper/fesm2022/handsontable-angular-wrapper.mjs';
const dependencyAngularWrapperPath =
'../../../node_modules/@handsontable/angular-wrapper/fesm2022/handsontable-angular-wrapper.mjs';
const angularImportPath = fs.existsSync(path.resolve(__dirname, localAngularWrapperPath))
  ? localAngularWrapperPath
  : dependencyAngularWrapperPath;

module.exports = {
  mode: 'production',
  entry: {
    core: '../../../node_modules/@angular/core/fesm2022/core.mjs',
    common: '../../../node_modules/@angular/common/fesm2022/common.mjs',
    forms: '../../../node_modules/@angular/forms/fesm2022/forms.mjs',
    platformBrowser: '../../../node_modules/@angular/platform-browser/fesm2022/platform-browser.mjs',
    platformBrowserDynamic:
      '../../../node_modules/@angular/platform-browser-dynamic/fesm2022/platform-browser-dynamic.mjs',
    compiler: '../../../node_modules/@angular/compiler/fesm2022/compiler.mjs',
    'core-primitives-signals': '../../../node_modules/@angular/core/fesm2022/primitives/signals.mjs',
    'core-primitives-di': '../../../node_modules/@angular/core/fesm2022/primitives/di.mjs',
    'common-http': '../../../node_modules/@angular/common/fesm2022/http.mjs',
    'handsontable-angular-wrapper': {
      import: angularImportPath,
      library: {
        name: ['Handsontable', 'angular'],
        type: 'umd'
      }
    }
  },
  output: {
    path: path.resolve(__dirname, '../../public/scripts/prebuilt-umd'),
    filename: (pathData) => {
      if (pathData.chunk.name === 'handsontable-angular-wrapper') {
        return 'handsontable-angular-wrapper.umd.min.js';
      }

      return 'angular-[name].umd.min.js';
    },
    library: {
      name: ['ng', '[name]'],
      type: 'umd',
      umdNamedDefine: true
    },
    globalObject: 'this'
  },
  resolve: {
    extensions: ['.mjs', '.js'],
    mainFields: ['fesm2022', 'es2022', 'es2020', 'es2015', 'module', 'main']
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false
      })
    ]
  },
  externals: [
    function({ request }, callback) {
      // Externalize any handsontable module
      if (request === 'handsontable' || request.startsWith('handsontable/')) {
        return callback(null, {
          root: 'Handsontable',
          commonjs: 'handsontable',
          commonjs2: 'handsontable',
          amd: 'handsontable'
        });
      }
      callback();
    },
    {
      rxjs: 'rxjs',
      'rxjs/operators': {
        root: ['rxjs', 'operators'],
        commonjs: 'rxjs.operators',
        commonjs2: 'rxjs.operators',
        amd: 'rxjs.operators'
      },
      '@handsontable/angular-wrapper': {
        root: ['Handsontable', 'angular'],
        commonjs: '@handsontable/angular-wrapper',
        commonjs2: '@handsontable/angular-wrapper',
        amd: '@handsontable/angular-wrapper'
      },
      '@angular/core': {
        root: ['ng', 'core'],
        commonjs: '@angular/core',
        commonjs2: '@angular/core',
        amd: '@angular/core'
      },
      '@angular/common': {
        root: ['ng', 'common'],
        commonjs: '@angular/common',
        commonjs2: '@angular/common',
        amd: '@angular/common'
      },
      '@angular/platform-browser': {
        root: ['ng', 'platformBrowser'],
        commonjs: '@angular/platform-browser',
        commonjs2: '@angular/platform-browser',
        amd: '@angular/platform-browser'
      },
      '@angular/platform-browser-dynamic': {
        root: ['ng', 'platformBrowserDynamic'],
        commonjs: '@angular/platform-browser-dynamic',
        commonjs2: '@angular/platform-browser-dynamic',
        amd: '@angular/platform-browser-dynamic'
      },
      '@angular/compiler': {
        root: ['ng', 'compiler'],
        commonjs: '@angular/compiler',
        commonjs2: '@angular/compiler',
        amd: '@angular/compiler'
      },
      '@angular/forms': {
        root: ['ng', 'forms'],
        commonjs: '@angular/forms',
        commonjs2: '@angular/forms',
        amd: '@angular/forms'
      },
      '@angular/core/primitives/signals': {
        root: ['ng', 'core-primitives-signals'],
        commonjs: '@angular/core/primitives/signals',
        commonjs2: '@angular/core/primitives/signals',
        amd: '@angular/core/primitives/signals'
      },
      '@angular/core/primitives/di': {
        root: ['ng', 'core-primitives-di'],
        commonjs: '@angular/core/primitives/di',
        commonjs2: '@angular/core/primitives/di',
        amd: '@angular/core/primitives/di'
      },
      '@angular/common/http': {
        root: ['ng', 'common-http'],
        commonjs: '@angular/common/http',
        commonjs2: '@angular/common/http',
        amd: '@angular/common/http'
      }
    }
  ],
};
