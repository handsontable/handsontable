import path from 'path';
import glob from 'glob';

/**
 * Expand one npm `workspaces` entry to the workspace directories it names.
 *
 * Matches npm's rule rather than the raw glob: a workspace is a directory holding a `package.json`. A plain
 * `"*"` would otherwise also match the framework directory's own manifests and its `node_modules`.
 *
 * @param {string} baseDir The directory holding the `package.json` that declares `workspaces`.
 * @param {string} entry One `workspaces` entry, e.g. `"*"`.
 * @returns {string[]} The matching workspace directories.
 */
export function expandWorkspaceDirs(baseDir, entry) {
  return glob
    .sync(`${baseDir}/${entry.replace(/\/+$/, '')}/package.json`)
    .map(manifest => path.dirname(manifest));
}
