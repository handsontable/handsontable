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
        // Jest's own timeout cannot interrupt a synchronous call, so the child gets one of its own.
        execFileSync(process.execPath, ['--test', CHECK], {
          cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 80000,
        });
      } catch (error) {
        // A spawn failure or a timeout carries no TAP output, only a message.
        const output = [error.stdout, error.stderr].filter(Boolean).join('\n') || error.message;

        throw new Error(`asciiOnlyBundlesCheck.mjs failed:\n${output}`);
      }
    }).not.toThrow();
  }, 90000);
});
