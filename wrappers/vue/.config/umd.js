import { addLicenseBanner } from './helpers/licenseBanner';
import { baseConfig } from './base';

const env = process.env.NODE_ENV;
const filename = 'vue-handsontable.js';

const umdConfig = {
  output: {
    format: env,
    name: 'Handsontable.vue',
    indent: false,
    sourcemap: true,
    file: `./dist/${filename}`,
    exports: 'named',
    globals: {
      vue: 'Vue',
      handsontable: 'Handsontable'
    }
  },
  plugins: baseConfig.plugins,
};

addLicenseBanner(umdConfig);

export { umdConfig };
