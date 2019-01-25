const allowedE2EModules = [
  'window',
  'jasmine-co',
  'core-js/*',
  'regenerator-runtime/runtime',
  '@babel/runtime/*',
  './common',
  './../bootstrap',
  './helpers/custom-matchers',
  './asciiTable',
  './MemoryLeakTest',
  '../MemoryLeakTest',
];

const unwantedCommonPolyfills = [
  'es6.reflect.*',
  'es6.math.*',
  'es6.typed.*',
  'es6.date.*',
  'es6.regex.*',
  'es6.array.sort',
  'es6.array.species',
  'es6.string.anchor',
  'es6.string.big',
  'es6.string.blink',
  'es6.string.bold',
  'es6.string.fixed',
  'es6.string.fontcolor',
  'es6.string.fontsize',
  'es6.string.italics',
  'es6.string.link',
  'es6.string.small',
  'es6.string.strike',
  'es6.string.sub',
  'es6.string.sup',
  'es6.string.iterator',
  'es6.function.has-instance',
  'es7.object.define-getter',
  'es7.object.define-setter',
  'es7.object.lookup-getter',
  'es7.object.lookup-setter',
  'es7.symbol.async-iterator',
  'web.timers',
];

const unwantedDistPolyfills = [
  '@babel/plugin-transform-regenerator',
];

const babelPresetConfig = (exclude) => ({
  targets: {
    chrome: '41',
    firefox: '34',
    ie: '9',
    safari: '9'
  },
  exclude,
  modules: false,
  debug: false,
  useBuiltIns: 'entry',
});

module.exports = {
  presets: [
    ['@babel/preset-env', babelPresetConfig([...unwantedCommonPolyfills, ...unwantedDistPolyfills])]
  ],
  plugins: [
    ['@babel/plugin-proposal-object-rest-spread', {useBuiltIns: true}],
    ['transform-inline-environment-variables']
  ],
  env: {
    // Environment for unit testing, source code and languages building via webpack (UMD).
    commonjs: {
      plugins: [
        ['@babel/plugin-transform-runtime', {
          'corejs': false,
          'helpers': true,
          'regenerator': true,
          'useESModules': false,
        }],
        ['@babel/plugin-transform-modules-commonjs', {loose: true}]
      ]
    },
    // Environment for transpiling files to be compatible with CommonJS.
    commonjs_dist: {
      plugins: [
        ['@babel/plugin-transform-modules-commonjs', {loose: true}],
        ['babel-plugin-transform-require-ignore', {extensions: ['.css']}]
      ],
      ignore: [
        'src/plugins/**/test/**'
      ]
    },
    // Environment for transpiling files to be compatible with ES Modules.
    es: {
      plugins: [
        ['babel-plugin-transform-require-ignore', {extensions: ['.css']}]
      ],
      ignore: [
        'src/plugins/**/test/**'
      ]
    },
    // Environment for building E2E tests (UMD).
    commonjs_e2e: {
      presets: [
        ['@babel/preset-env', babelPresetConfig(unwantedCommonPolyfills)]
      ],
      plugins: [
        ['@babel/plugin-transform-runtime', {
          'corejs': false,
          'helpers': true,
          'regenerator': true,
          'useESModules': false,
        }],
        ['@babel/plugin-transform-modules-commonjs', {loose: true}],
        ['babel-plugin-forbidden-imports', {
          allowedModules: allowedE2EModules
        }]
      ],
      ignore: [
        'src/plugins/**/test/**'
      ]
    },
  },

  ignore: [
    'src/3rdparty/walkontable/dist/',
    'src/3rdparty/walkontable/test/dist/'
  ]
};
