module.exports = {
  extends: '../babel.config.js',
  assumptions: {
    // save 21 kB (July 12, 2023) https://babeljs.io/docs/assumptions#noincompletensimportdetection
    noIncompleteNsImportDetection: true,
    // Use simple property assignment for private class fields instead of WeakMap-based brand checks.
    // Required because the hook pattern references private methods via closures.
    privateFieldsAsProperties: true,
  },
  env: {
    // Environment for unit testing via Jest. Babel is no longer used for builds
    // (Rspack uses builtin:swc-loader, file-per-file transpilation uses @swc/core).
    commonjs: {
      presets: [
        ['@babel/preset-typescript', { allowDeclareFields: true }],
      ],
      plugins: [
        ['@babel/plugin-transform-runtime', {
          corejs: false,
          helpers: true,
          regenerator: true,
          useESModules: false,
        }],
        ['@babel/plugin-transform-modules-commonjs', { loose: true }]
      ]
    },
  },
  ignore: [
    'src/3rdparty/walkontable/dist/',
    'src/3rdparty/walkontable/test/dist/',
  ],
};
