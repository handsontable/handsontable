import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import VuePlugin from 'rollup-plugin-vue';
import typescript from 'rollup-plugin-typescript2';
import json from 'rollup-plugin-json';
import commonjs from 'rollup-plugin-commonjs';

export const plugins = {
  replace: replace({
    'process.env.NODE_ENV': JSON.stringify('production')
  }),
  VuePlugin: VuePlugin({
    defaultLang: {
      script: 'ts'
    },
    template: {
      isProduction: true
    }
  }),
  typescript: typescript({
    objectHashIgnoreUnknownHack: true,
    clean: true
  }),
  babel: babel({
    babelrc: false,
    exclude: 'node_modules/**',
    extensions: ['.js', '.ts', '.vue'],
    presets: [
      '@babel/env'
    ],
  }),
  nodeResolve: nodeResolve(),
  json: json({
    include: 'package.json',
    compact: true
  }),
  commonjs: commonjs({
    include: [
      '../../node_modules/**',
      'node_modules/**',
      'src/lib/**'
    ],
    namedExports: {
      'src/lib/lru/lru.js': [
        'LRUMap'
      ]
    }
  }),
};

export const baseConfig = {
  input: './src/index.ts',
  plugins: [
    plugins.json,
    plugins.replace,
    plugins.VuePlugin,
    plugins.commonjs,
    plugins.typescript,
    plugins.babel,
    plugins.nodeResolve
  ],
  external: [
    'handsontable',
    'vue'
  ]
};

