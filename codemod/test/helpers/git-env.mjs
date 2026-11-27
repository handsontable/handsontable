import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * A directory that holds an empty git configuration file. Every test process makes one and removes it on exit.
 */
const HOME = mkdtempSync(join(tmpdir(), 'codemod-git-home-'));
const EMPTY_CONFIG = join(HOME, 'gitconfig');

writeFileSync(EMPTY_CONFIG, '');
process.on('exit', () => {
  rmSync(HOME, { recursive: true, force: true });
});

/**
 * The variables that cut git off from the machine of whoever runs the tests: an empty global configuration, no
 * system configuration, and a home and an XDG directory with nothing in them, so `core.excludesFile` (and its default,
 * `$XDG_CONFIG_HOME/git/ignore`), `status.showUntrackedFiles`, `core.autocrlf`, and the like of a developer's
 * machine cannot change a result.
 */
export const GIT_ISOLATION = Object.freeze({
  GIT_CONFIG_GLOBAL: EMPTY_CONFIG,
  GIT_CONFIG_NOSYSTEM: '1',
  XDG_CONFIG_HOME: HOME,
  HOME,
  USERPROFILE: HOME,
});

/**
 * Environment for a git child process of a test: the current environment, minus the variables that select a
 * repository (a test runner started from a git hook inherits them), plus `GIT_ISOLATION`.
 *
 * @param {Record<string, string>} [extra] Variables to set on top.
 * @returns {NodeJS.ProcessEnv} The environment.
 */
export function isolatedGitEnv(extra = {}) {
  const env = { ...process.env, ...GIT_ISOLATION, ...extra };

  ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_PREFIX'].forEach(name => delete env[name]);

  return env;
}

// Importing this module isolates the test process as well. The tool runs git in process (`run()`, `main()`) with a
// copy of `process.env`, and the real executable a test spawns inherits it, so one assignment covers both.
Object.assign(process.env, GIT_ISOLATION);
['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_PREFIX'].forEach((name) => {
  delete process.env[name];
});
