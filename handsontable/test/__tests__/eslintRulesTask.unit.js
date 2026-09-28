import { existsSync, readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

const HOT_DIR = resolve(__dirname, '../..');
const RULE_TESTS_DIR = '.config/plugin/eslint/__tests__';

/**
 * The `test:eslint-rules` task (`npm run test:eslint-rules`, CI's `Lint / core` job) is the only
 * place the custom ESLint rules' RuleTester tests run, and `node --test` fails on a missing file
 * only under one condition: it exits 1 (`Could not find '<path>'`) when nothing matched AND every
 * pattern in the list is a literal path. A glob anywhere in the list — even next to an explicit
 * path — turns a missing file into a green `tests 0`, so a rename, or a new test landing with a
 * suffix the glob does not match, would leave the step passing with nothing run. A second literal
 * file that still exists masks a renamed first one the same way (the run is green on the second
 * file's tests alone). Hence the task names its test files literally, with no glob, and this test
 * pins that list in both directions: every test file in the directory is named, and every named
 * file exists.
 */
describe('the test:eslint-rules task', () => {
  const { tasks } = JSON.parse(readFileSync(resolve(HOT_DIR, 'scripts/tasks.json'), 'utf8'));
  const { cmd } = tasks['test:eslint-rules'];
  const namedFiles = cmd.split(/\s+/).filter(token => token.startsWith(`${RULE_TESTS_DIR}/`));

  it('runs the tests through node --test', () => {
    expect(cmd).toMatch(/^node --test /);
  });

  it('names every RuleTester test file explicitly, so a rename or an unmatched suffix fails the run', () => {
    const testFiles = readdirSync(resolve(HOT_DIR, RULE_TESTS_DIR)).filter(name => name.endsWith('.test.mjs'));

    expect(testFiles.length).toBeGreaterThan(0);

    testFiles.forEach((name) => {
      expect(namedFiles).toContain(`${RULE_TESTS_DIR}/${name}`);
    });
  });

  it('names only files that exist, so a stale entry is caught here and not by a Could not find in CI', () => {
    expect(namedFiles.length).toBeGreaterThan(0);

    namedFiles.forEach((path) => {
      expect(existsSync(resolve(HOT_DIR, path))).toBe(true);
    });
  });

  it('carries no glob, because one glob in the list makes node --test ignore a missing literal path', () => {
    expect(cmd).not.toMatch(/[*?[\]{}]/);
  });
});
