import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { PACKAGE_ROOT } from '../../src/manifest.mjs';

/**
 * Absolute path of the migration guide a manifest names. The guide lives in the monorepo, next to the package.
 *
 * @param {{version?: string, guide: {source: string}|null}} manifest A loaded manifest with a guide.
 * @returns {string} The path.
 * @throws {Error} For a manifest with no guide (a draft whose page does not exist yet): the caller filters it out.
 */
export function guidePath(manifest) {
  if (!manifest.guide) {
    throw new Error(`The manifest ${manifest.version ?? ''} has no guide: filter it out with withGuide() first.`);
  }

  return join(PACKAGE_ROOT, '..', manifest.guide.source);
}

/**
 * The manifests that name a migration guide. A draft may have none until its page exists, and a test that reads a
 * guide skips it.
 *
 * @template {{guide: object|null}} T
 * @param {T[]} manifests Loaded manifests.
 * @returns {T[]} The ones with a guide.
 */
export function withGuide(manifests) {
  return manifests.filter(manifest => manifest.guide);
}

/**
 * Whether the package sits in the monorepo: the workspace file is two levels above it. Inside the monorepo the guides
 * and the core sources must exist, and a test that cannot find one fails, because a moved or renamed file would
 * otherwise turn every check on it into a silent skip. A package installed on its own has neither, and the test skips.
 *
 * @type {boolean}
 */
export const IN_MONOREPO = existsSync(join(PACKAGE_ROOT, '..', 'pnpm-workspace.yaml'));

/**
 * Fail inside the monorepo, skip outside it, when a file a test reads is missing.
 *
 * @param {{skip: (message?: string) => void}} context The `node:test` context of the test.
 * @param {string} path Absolute path the test reads.
 * @param {string} what What the file is, for the message.
 * @returns {boolean} `true` when the file is missing and the test was skipped, so the caller returns.
 * @throws {assert.AssertionError} When the file is missing inside the monorepo.
 */
export function skipWithoutFile(context, path, what) {
  if (existsSync(path)) {
    return false;
  }

  if (IN_MONOREPO) {
    assert.fail(`${what} is missing at ${path}, but the package is in the monorepo. A file moved or was renamed: `
      + 'update the test, not the skip.');
  }

  context.skip(`${what} is not available outside the monorepo`);

  return true;
}

/**
 * Skip a test when the migration guides are not on disk, which is the case for a package installed outside the
 * monorepo, and fail it inside the monorepo. A test that reads a guide calls it first and returns when it gives
 * `true`.
 *
 * @param {{skip: (message?: string) => void}} context The `node:test` context of the test.
 * @param {Array<{guide: {source: string}|null}>} manifests The manifests whose guides the test reads. One with no
 * guide at all (a draft) is not read.
 * @returns {boolean} `true` when a guide is missing and the test was skipped.
 * @throws {assert.AssertionError} When a guide is missing inside the monorepo.
 */
export function skipWithoutGuides(context, manifests) {
  const missing = withGuide(manifests).find(manifest => !existsSync(guidePath(manifest)));

  return missing ? skipWithoutFile(context, guidePath(missing), missing.guide.source) : false;
}
