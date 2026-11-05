import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../..');
const tasks = JSON.parse(readFileSync(resolve(ROOT, 'scripts/tasks.json'), 'utf8'));
// eslint-disable-next-line global-require, import/no-dynamic-require
const jestConfig = require(resolve(ROOT, 'jest.config.js'));

/**
 * `test/jestCollectGarbage.js` frees each file's jsdom garbage so a worker's heap stays near its
 * live size and the worker exits within jest-worker's grace. It only works when the unit task
 * exposes `gc` and the config registers the file; this pins both halves of that wiring.
 */
describe('garbage collection between unit test files', () => {
  it('should expose gc to the Jest process and its workers through the test:unit.jest task', () => {
    const { cmd } = tasks.tasks['test:unit.jest'];

    // `$NODE_OPTIONS` keeps whatever the caller set (cross-env expands it), and the flag reaches
    // the workers because jest-worker forks them with the parent's environment.
    expect(cmd).toMatch(/NODE_OPTIONS="\$NODE_OPTIONS --expose-gc"/);
    // The scope router's test pins that this task runs Jest with no flag of its own.
    expect(cmd).toMatch(/\bjest$/);
  });

  it('should register the collecting setup file for every test file', () => {
    expect(jestConfig.setupFilesAfterEnv).toContain('<rootDir>/test/jestCollectGarbage.js');
  });

  it('should not depend on gc being exposed to a bare jest call', () => {
    // The setup file guards on `typeof globalThis.gc`, so this suite runs under a plain `jest`
    // too. When the flag is there, the hook can be called; when it is not, nothing throws.
    expect(['function', 'undefined']).toContain(typeof globalThis.gc);
  });
});
