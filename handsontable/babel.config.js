module.exports = {
  extends: '../babel.config.js',
  assumptions: {
    // save 21 kB (July 12, 2023) https://babeljs.io/docs/assumptions#noincompletensimportdetection
    noIncompleteNsImportDetection: true,
  },
  env: {
    // Environment for unit testing via Jest. Babel is no longer used for builds
    // (Rspack uses builtin:swc-loader, file-per-file transpilation uses @swc/core).
    commonjs: {
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
