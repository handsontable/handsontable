import path from 'node:path';
import { globSync } from 'node:fs';

/**
 * Expand one npm `workspaces` entry to the workspace directories it names.
 *
 * Matches npm's rule rather than the raw glob: a workspace is a directory holding a `package.json`. A plain
 * `"*"` would otherwise also match the framework directory's own manifests and its `node_modules`. Uses the
 * built-in `fs.globSync`, so the root tooling tests can load it without an install.
 *
 * @param {string} baseDir The directory holding the `package.json` that declares `workspaces`.
 * @param {string} entry One `workspaces` entry, e.g. `"*"`.
 * @returns {string[]} The matching workspace directories.
 */
export function expandWorkspaceDirs(baseDir, entry) {
  return globSync(`${entry.replace(/\/+$/, '')}/package.json`, { cwd: baseDir })
    .map(manifest => path.join(baseDir, path.dirname(manifest)));
}
