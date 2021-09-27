import { baseConfig } from './base';
import { addLicenseBanner } from './helpers/licenseBanner';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';

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
      handsontable: 'Handsontable'
    }
  },
  plugins: baseConfig.plugins.concat([
    replace({
      'process.env.NODE_ENV': JSON.stringify('production')
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
