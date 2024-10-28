import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';
import VuePlugin from 'rollup-plugin-vue';
import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';

export const plugins = {
  replace: replace({
    preventAssignment: true,
    values: {
      'process.env.NODE_ENV': JSON.stringify('production')
    },
  }),
  VuePlugin: VuePlugin({
    defaultLang: {
      script: 'ts'
    },
    template: {
      isProduction: true
    }
  }),
  nodeResolve: nodeResolve(),
  typescript: typescript({
    clean: true
  }),
  babel: babel({
    babelHelpers: 'bundled',
    babelrc: false,
    exclude: 'node_modules/**',
    extensions: ['.js', '.ts', '.vue'],
    presets: [
      '@babel/env'
    ],
  }),
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
  }),
};

export const baseConfig = {
  input: './src/index.ts',
  output: {
    interop: 'compat',
    generatedCode: {
			reservedNamesAsProps: false
		},
    systemNullSetters: false,
  },
  plugins: [
    plugins.json,
    plugins.replace,
    plugins.VuePlugin,
    plugins.commonjs,
    plugins.nodeResolve,
    plugins.typescript,
    plugins.babel,
  ],
  external: [
    'handsontable/base',
    'vue'
  ]
};
