import typescript from 'rollup-plugin-typescript2';
import { plugins } from './base';

const env = process.env.NODE_ENV;
const filename = 'react-handsontable.mjs';

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
      clean: true,
    }),
    plugins.babel,
    plugins.nodeResolve,
  ]
};
