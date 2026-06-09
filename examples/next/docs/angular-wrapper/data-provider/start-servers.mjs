/**
 * Runs the REST (default port 4010) and GraphQL (default port 4011) demo APIs together.
 */
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const node = process.execPath;

const children = [
  spawn(node, [join(__dirname, 'server-rest.mjs')], {
    stdio: 'inherit',
    env: { ...process.env, PORT: process.env.REST_PORT || '4010' },
  }),
  spawn(node, [join(__dirname, 'server-graphql.mjs')], {
    stdio: 'inherit',
    env: { ...process.env, PORT: process.env.GRAPHQL_PORT || '4011' },
  }),
];

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  children.forEach((c) => {
    if (!c.killed) {
      c.kill('SIGTERM');
    }
  });
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

children.forEach((child) => {
  child.on('exit', (exitCode, signal) => {
    if (shuttingDown) {
      return;
    }
    if (signal === 'SIGTERM') {
      return;
    }
    if (exitCode === 0) {
      return;
    }
    shutdown(exitCode ?? 1);
  });
});
