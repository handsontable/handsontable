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
    'material-checkbox': '../../../node_modules/@angular/material/fesm2022/checkbox.mjs',
    'cdk-a11y': '../../../node_modules/@angular/cdk/fesm2022/a11y.mjs',
    'cdk-observers': '../../../node_modules/@angular/cdk/fesm2022/observers.mjs',
    'cdk-coercion': '../../../node_modules/@angular/cdk/fesm2022/coercion.mjs',
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
    {
      'handsontable/editors/factory': {
        root: ['Handsontable', 'editors'],
        commonjs: 'handsontable/editors/factory',
        commonjs2: 'handsontable/editors/factory',
        amd: 'handsontable/editors/factory'
      },
      'handsontable/editors': {
        root: ['Handsontable', 'editors'],
        commonjs: 'handsontable/editors',
        commonjs2: 'handsontable/editors',
        amd: 'handsontable/editors'
      },
      'handsontable/renderers/factory': {
        root: ['Handsontable', 'renderers'],
        commonjs: 'handsontable/renderers/factory',
        commonjs2: 'handsontable/renderers/factory',
        amd: 'handsontable/renderers/factory'
      },
      'handsontable/renderers': {
        root: ['Handsontable', 'renderers'],
        commonjs: 'handsontable/renderers',
        commonjs2: 'handsontable/renderers',
        amd: 'handsontable/renderers'
      },
      rxjs: 'rxjs',
      'rxjs/operators': {
        root: ['rxjs', 'operators'],
        commonjs: 'rxjs.operators',
        commonjs2: 'rxjs.operators',
        amd: 'rxjs.operators'
      },
      'date-fns': {
        root: 'dateFns',
        commonjs: 'dateFns',
        commonjs2: 'date-fns',
        amd: 'date-fns'
      },
      '@angular/material/checkbox': {
        root: ['ng', 'material-checkbox'],
        commonjs: '@angular/material/checkbox',
        commonjs2: '@angular/material/checkbox',
        amd: '@angular/material/checkbox'
      },
      '@angular/cdk/a11y': {
        root: ['ng', 'cdk-a11y'],
        commonjs: '@angular/cdk/a11y',
        commonjs2: '@angular/cdk/a11y',
        amd: '@angular/cdk/a11y'
      },
      '@angular/cdk/observers': {
        root: ['ng', 'cdk-observers'],
        commonjs: '@angular/cdk/observers',
        commonjs2: '@angular/cdk/observers',
        amd: '@angular/cdk/observers'
      },
      '@angular/cdk/coercion': {
        root: ['ng', 'cdk-coercion'],
        commonjs: '@angular/cdk/coercion',
        commonjs2: '@angular/cdk/coercion',
        amd: '@angular/cdk/coercion'
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
    },
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
  ],
};
