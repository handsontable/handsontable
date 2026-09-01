/**
 * Runs the comparison, refusing to overwrite golden records from a local run.
 *
 * The deleted `upload.mjs` threw when a reference-branch upload was attempted
 * outside CI. `reg-suit run` has no equivalent: a developer holding R2
 * credentials for debugging, with `REG_ACTUAL_KEY` pointing at a `base/` key,
 * would silently replace the baseline every pull request is compared against.
 *
 * Usage: node visual-tests/scripts/compare.mjs
 */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Nothing else loads it: dotenv is not a dependency and both Playwright configs
// have their `require('dotenv').config()` commented out. The README tells people
// to put their R2 credentials here, so honour that rather than silently running
// with the keys unset.
const envFile = join(import.meta.dirname, '..', '.env');

if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf-8').split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);

    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

const actualKey = process.env.REG_ACTUAL_KEY ?? '';
const expectedKey = process.env.REG_EXPECTED_KEY ?? '';

if (!actualKey || !expectedKey) {
  // reg-suit expands an unset `${REG_ACTUAL_KEY}` to the literal string
  // "undefined", which slips past the `base/` guard below and publishes the
  // whole tree to `s3://<bucket>/undefined/`. Fail before spawning instead.
  console.error('REG_EXPECTED_KEY and REG_ACTUAL_KEY must both be set.');
  console.error('reg-suit expands an unset key to the literal string "undefined" and publishes there.');
  process.exitCode = 1;
} else if (process.env.CI !== 'true' && actualKey.startsWith('base/')) {
  console.error(`Refusing to publish to "${actualKey}" outside CI.`);
  console.error('Keys under `base/` are the golden records every pull request is compared against;');
  console.error('only a CI build of that branch may write them. Use a `local/...` key to experiment.');
  process.exitCode = 1;
} else {
  const exitCode = await new Promise((resolve) => {
    spawn('npx', ['--no', 'reg-suit', 'run'], {
      // reg-suit resolves regconfig.json by walking up from cwd to the nearest
      // package.json. Unpinned, running this file from the repo root finds the
      // monorepo manifest, loads no config, and compares nothing while exiting 0.
      cwd: join(import.meta.dirname, '..'),
      stdio: 'inherit',
      shell: process.platform === 'win32',
    }).on('close', resolve);
  });

  // `close` passes null when the child was killed by a signal (OOM,
  // cancellation). Treating that as success would report a green comparison
  // that never finished.
  process.exitCode = exitCode ?? 1;
}
