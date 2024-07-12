import { baseConfig } from './base';
import { addLicenseBanner } from './helpers/licenseBanner';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';

const minFilename = 'react-handsontable.min.js';

const minConfig = {
  output: {
    format: 'umd',
    name: 'Handsontable.react',
    indent: false,
    sourcemap: true,
    exports: 'named',
    file: `./dist/${minFilename}`,
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      'handsontable/base': 'Handsontable',
      'handsontable/renderers/registry': 'Handsontable.renderers',
      'handsontable/editors/registry': 'Handsontable.editors',
    }
  },
  plugins: baseConfig.plugins.concat([
    replace({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify('production')
      },
    }),
    terser({
      output: {
        comments: /^!/
      },
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
      }
    })
  ])
};

addLicenseBanner(minConfig);

export { minConfig };
