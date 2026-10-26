import typescript from 'rollup-plugin-typescript2';
import { plugins } from './base';

const env = process.env.NODE_ENV;
const filename = 'react-handsontable.mjs';

export const esConfig = {
  output: {
    format: env,
    indent: false,
    file: `./es/${filename}`,
    // Rollup strips a source-level directive, so this banner is the first statement.
    banner: "'use client';",
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
