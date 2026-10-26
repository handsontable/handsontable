import { baseConfig } from './base';

const env = process.env.NODE_ENV;
const filename = 'react-handsontable.js';

export const cjsConfig = {
  output: {
    format: env,
    indent: false,
    file: `./commonjs/${filename}`,
    exports: 'named',
    // Rollup inserts "use strict" first, then prepends this banner, so the directive stays first.
    banner: "'use client';",
  },
  plugins: baseConfig.plugins,
};
