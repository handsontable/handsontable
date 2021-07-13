const allowedE2EModules = [
  'window',
  'hyperformula*',
  'jasmine-co',
  'jest-matcher-utils',
  'html-parse-stringify',
  'core-js/*',
  'regenerator-runtime/runtime*',
  '@babel/runtime/*',
  './htmlNormalize',
  './common',
  './mouseEvents',
  './keyboardEvents',
  './../bootstrap',
  './helpers/custom-matchers',
  './asciiTable',
  './MemoryLeakTest',
  '../MemoryLeakTest',
];

const babelPresetConfig = () => ({
  targets: {
    chrome: '41',
    firefox: '34',
    ie: '9',
    safari: '9'
  },
  modules: false,
  debug: false,
  useBuiltIns: 'usage',
  corejs: 3,
});

module.exports = {
  presets: [
    ['@babel/preset-env', babelPresetConfig()]
  ],
  plugins: [
    ['@babel/plugin-proposal-object-rest-spread', { useBuiltIns: true }],
    ['transform-inline-environment-variables'],
    ['@babel/plugin-proposal-class-properties']
  ],
  env: {
    // Environment for unit testing, source code and languages building via webpack (UMD).
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
    // Environment for transpiling files to be compatible with CommonJS.
    commonjs_dist: {
      plugins: [
        ['@babel/plugin-transform-modules-commonjs', { loose: true }],
        ['babel-plugin-transform-require-ignore', { extensions: ['.css'] }]
      ],
      ignore: [
        '**/__tests__/**',
        '**/test/**',
        '**/dist/**',
      ]
    },
    // Environment for transpiling files to be compatible with ES Modules.
    es: {
      plugins: [
        ['babel-plugin-transform-require-ignore', { extensions: ['.css'] }],
        ['./.config/plugin/babel/add-import-extension.js', { extension: 'mjs' }]
      ],
      ignore: [
        '**/__tests__/**',
        '**/test/**',
        '**/dist/**',
      ],
    },
    // Environment for transpiling only legacy language files (e.q. import `languages/pl-PL`)
    // which need to be compatible with ES Modules. That format, by default, automatically
    // registers the language pack. It's not suitable to use with the modularized version of
    // the Handsontable.
    es_languages: {
      plugins: [
        ['babel-plugin-transform-require-ignore', { extensions: ['.css'] }],
        ['./.config/plugin/babel/add-import-extension.js', { extension: 'mjs' }],
        ['./.config/plugin/babel/add-language-registration.js'],
      ],
    },
    // Environment for building E2E tests (UMD).
    commonjs_e2e: {
      plugins: [
        ['@babel/plugin-transform-runtime', {
          corejs: false,
          helpers: true,
          regenerator: true,
          useESModules: false,
        }],
        ['@babel/plugin-transform-modules-commonjs', { loose: true }],
        ['babel-plugin-forbidden-imports', {
          allowedModules: allowedE2EModules
        }]
      ],
    },
  },
  ignore: [
    'src/3rdparty/walkontable/dist/',
    'src/3rdparty/walkontable/test/dist/',
  ],
};
