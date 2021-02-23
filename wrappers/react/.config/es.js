import typescript from 'rollup-plugin-typescript2';
import { baseConfig } from './base';
import { plugins } from './base';

const env = process.env.NODE_ENV;
const filename = 'react-handsontable.js';

export const esConfig = {
  output: {
    format: env,
    indent: false,
    file: `./es/${filename}`
  },
  plugins: [
    plugins.json,
    plugins.replace,
    plugins.commonjs,
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          declaration: true
        }
      },
      useTsconfigDeclarationDir: true,
      objectHashIgnoreUnknownHack: true,
      clean: true,
    }),
    plugins.babel,
    plugins.nodeResolve,
  ]
};
