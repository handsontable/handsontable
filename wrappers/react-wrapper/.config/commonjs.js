import { baseConfig } from './base';

const env = process.env.NODE_ENV;
const filename = 'react-handsontable.js';

export const cjsConfig = {
  output: {
    format: env,
    indent: false,
    file: `./commonjs/${filename}`,
    exports: 'named'
  },
  plugins: baseConfig.plugins,
};
