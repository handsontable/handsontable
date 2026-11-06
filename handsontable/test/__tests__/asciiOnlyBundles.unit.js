/**
 * @jest-environment node
 */
import { execFileSync } from 'child_process';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../..');
const CHECK = resolve(ROOT, 'test/helpers/asciiOnlyBundlesCheck.mjs');

/**
 * The checks themselves live in `test/helpers/asciiOnlyBundlesCheck.mjs`, as `node --test` cases, and
 * run here in a process of their own. They load `@rspack/core`, a native binding whose threads outlive
 * any JavaScript teardown: loaded in a Jest worker, it kept the worker from exiting and every full run
 * ended with Jest force-killing one. The root tooling suite installs no dependencies, so the checks
 * cannot live there either. This spec keeps them in the Unit job: `node --test` exits non-zero when any
 * case fails, and its TAP output is the failure message.
 */
describe('ASCII-only bundles', () => {
  it('should pass every check of the minimizer option and the output plugin', async() => {
    expect(() => {
      try {
        execFileSync(process.execPath, ['--test', CHECK], {
          cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch (error) {
        throw new Error(`asciiOnlyBundlesCheck.mjs failed:\n${error.stdout}\n${error.stderr}`);
      }
    }).not.toThrow();
  }, 90000);
});
