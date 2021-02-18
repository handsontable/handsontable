import { addLicenseBanner } from './helpers/licenseBanner';
import { baseConfig } from './base';
import replace from 'rollup-plugin-replace';

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
      handsontable: 'Handsontable'
    }
  },
  plugins: baseConfig.plugins.concat([
    replace({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ])
};

addLicenseBanner(umdConfig);

export { umdConfig };
