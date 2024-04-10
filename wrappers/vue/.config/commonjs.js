import { baseConfig } from './base';

const env = process.env.NODE_ENV;
const filename = 'vue-handsontable.js';

export const cjsConfig = {
  output: {
    format: env,
    indent: false,
    file: `./commonjs/${filename}`,
    interop: 'compat',
    generatedCode: {
			reservedNamesAsProps: false
		},
    systemNullSetters: false,
    exports: 'named'
  },
  plugins: baseConfig.plugins,
};
