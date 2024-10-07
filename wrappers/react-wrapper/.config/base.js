import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';

export const plugins = {
  typescript: typescript({
    clean: true
  }),
  babel: babel({
    babelHelpers: 'bundled',
    babelrc: false,
    exclude: ['/node_modules/', '**.json'],
    extensions: ['.js', '.ts', '.tsx', '.jsx'],
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
    ]
  })
};

export const baseConfig = {
  input: 'src/index.tsx',
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
    plugins.commonjs,
    plugins.typescript,
    plugins.babel,
    plugins.nodeResolve,
  ],
  external: [
    'react',
    'react-dom',
    'handsontable/base',
    'handsontable/renderers/registry',
    'handsontable/editors/registry',
  ],
};
