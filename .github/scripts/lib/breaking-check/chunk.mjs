/**
 * Splits a unified diff into per-file pieces and filters them to the changelog
 * scope. Pure and dependency-free: no git, no network.
 */
import { requiresChangelog } from '../changelog-gate.mjs';

const FILE_HEADER_RE = /^diff --git a\/(.+?) b\/(.+)$/;

/**
 * Split a full unified diff (e.g. `git show --format= --unified=3 <sha>`) into
 * one entry per file, each holding that file's whole diff section (its
 * `diff --git` header line through the line before the next one).
 *
 * @param {string} unifiedDiff
 * @returns {{ path: string, text: string }[]} One entry per file, in diff order.
 *   `path` is the diff's "b" side (the post-change path), so a rename resolves
 *   to its new name.
 */
export function splitDiffByFile(unifiedDiff) {
  const files = [];
  let current = null;

  for (const line of (unifiedDiff ?? '').split('\n')) {
    const headerMatch = FILE_HEADER_RE.exec(line);

    if (headerMatch) {
      current = { path: headerMatch[2], lines: [line] };
      files.push(current);
      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }

  return files.map(({ path, lines }) => ({ path, text: lines.join('\n') }));
}

/**
 * Keep only the files the changelog gate considers in scope (shippable source
 * under `handsontable/src/**`/`wrappers/**`, excluding tests and markdown).
 * Out-of-scope files (docs, tests, CI/tooling) are never inspected.
 *
 * @param {{ path: string, text: string }[]} files
 * @returns {{ path: string, text: string }[]}
 */
export function filterScope(files) {
  return files.filter((file) => requiresChangelog(file.path));
}
