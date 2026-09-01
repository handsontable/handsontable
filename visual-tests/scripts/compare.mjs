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

const actualKey = process.env.REG_ACTUAL_KEY ?? '';

if (process.env.CI !== 'true' && actualKey.startsWith('base/')) {
  console.error(`Refusing to publish to "${actualKey}" outside CI.`);
  console.error('Keys under `base/` are the golden records every pull request is compared against;');
  console.error('only a CI build of that branch may write them. Use a `local/...` key to experiment.');
  process.exitCode = 1;
} else {
  const exitCode = await new Promise((resolve) => {
    spawn('npx', ['--no', 'reg-suit', 'run'], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    }).on('close', resolve);
  });

  // `close` passes null when the child was killed by a signal (OOM,
  // cancellation). Treating that as success would report a green comparison
  // that never finished.
  process.exitCode = exitCode ?? 1;
}
