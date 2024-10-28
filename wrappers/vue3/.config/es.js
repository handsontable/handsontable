import typescript from 'rollup-plugin-typescript2';
import { plugins } from './base';

const env = process.env.NODE_ENV;
const filename = 'vue-handsontable.mjs';

export const esConfig = {
  output: {
    format: env,
    indent: false,
    file: `./es/${filename}`,
    exports: 'named'
  },
  plugins: [
    plugins.json,
    plugins.replace,
    plugins.VuePlugin,
    plugins.commonjs,
    plugins.nodeResolve,
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          declaration: true
        }
      },
      useTsconfigDeclarationDir: true,
      clean: true
    }),
    plugins.babel,
  ]
};
