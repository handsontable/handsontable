import { addLicenseBanner } from './helpers/licenseBanner';
import { baseConfig } from './base';
import replace from '@rollup/plugin-replace';

const env = process.env.NODE_ENV;
const filename = 'react-handsontable.js';

const umdConfig = {
  output: {
    format: env,
    name: 'Handsontable.react',
    indent: false,
    sourcemap: true,
    exports: 'named',
    file: `./dist/${filename}`,
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
    })
  ])
};

addLicenseBanner(umdConfig);

export { umdConfig };
