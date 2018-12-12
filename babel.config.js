const proFeatures = [
  'src/plugins/bindRowsWithHeaders/',
  'src/plugins/collapsibleColumns/',
  'src/plugins/columnSummary/',
  'src/plugins/dropdownMenu/',
  'src/plugins/exportFile/',
  'src/plugins/filters/',
  'src/plugins/formulas/',
  'src/plugins/ganttChart/',
  'src/plugins/headerTooltips/',
  'src/plugins/hiddenColumns/',
  'src/plugins/hiddenRows/',
  'src/plugins/multiColumnSorting/',
  'src/plugins/nestedHeaders/',
  'src/plugins/nestedRows/',
  'src/plugins/trimRows/',
];

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

const unwantedPolyfills = [
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

const babelPreset = {
  targets: {
    chrome: '41',
    firefox: '34',
    ie: '9',
    safari: '9'
  },
  exclude: unwantedPolyfills,
  modules: false,
  debug: false,
  useBuiltIns: 'entry',
};

module.exports = {
  presets: [
    ['@babel/preset-env', babelPreset]
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
    ce_commonjs: {
      plugins: [
        ['@babel/plugin-transform-runtime', {
          'corejs': false,
          'helpers': true,
          'regenerator': true,
          'useESModules': false,
        }],
        ['@babel/plugin-transform-modules-commonjs', {loose: true}],
        ['./.config/plugin/babel-ignore-pro-features.js']
      ],
      ignore: proFeatures
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
    ce_commonjs_dist: {
      plugins: [
        ['@babel/plugin-transform-modules-commonjs', {loose: true}],
        ['babel-plugin-transform-require-ignore', {extensions: ['.css']}],
        ['./.config/plugin/babel-ignore-pro-features.js']
      ],
      ignore: proFeatures
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
    ce_es: {
      plugins: [
        ['babel-plugin-transform-require-ignore', {extensions: ['.css']}],
        ["./.config/plugin/babel-ignore-pro-features.js"]
      ],
      ignore: proFeatures
    },
    // Environment for building E2E tests (UMD).
    commonjs_e2e: {
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
    ce_commonjs_e2e: {
      plugins: [
        ['@babel/plugin-transform-runtime', {
          'corejs': false,
          'helpers': true,
          'regenerator': true,
          'useESModules': false,
        }],
        ['@babel/plugin-transform-modules-commonjs', {loose: true}],
        ['./.config/plugin/babel-ignore-pro-features.js'],
        ['babel-plugin-forbidden-imports', {
          allowedModules: allowedE2EModules
        }]
      ],
      ignore: [
        ...proFeatures,
        'src/plugins/**/test/**'
      ]
    }
  },

  ignore: [
    'src/3rdparty/walkontable/dist/',
    'src/3rdparty/walkontable/test/dist/'
  ]
};
