/**
 * Wrapper for e2e dump that parses --theme=<name> from argv, sets HOT_THEME env,
 * and runs rspack so that theme is not passed to rspack (which would error).
 * Usage: node run-e2e-dump.mjs [--theme=main] [other rspack args...]
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

const args = process.argv.slice(2);
let theme = process.env.HOT_THEME || process.env.npm_config_theme;
const filteredArgs = [];

for (const arg of args) {
  if (arg.startsWith('--theme=')) {
    theme = arg.slice('--theme='.length);
  } else {
    filteredArgs.push(arg);
  }
}

if (theme) {
  process.env.HOT_THEME = theme;
  process.env.npm_config_theme = theme;
}

const rspackArgs = [
  './test/helpers/index.js',
  './test/e2e/index.js',
  ...filteredArgs,
];

const child = spawn(
  'npx',
  [
    'env-cmd', '-f', path.resolve(rootDir, '../hot.config.js'),
    'rspack',
    ...rspackArgs,
  ],
  {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      BABEL_ENV: 'commonjs_e2e',
      NODE_ENV: 'test-e2e',
    },
  }
);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
