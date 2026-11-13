import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { PACKAGE_ROOT } from '../../src/manifest.mjs';

/**
 * Absolute path of the migration guide a manifest names. The guide lives in the monorepo, next to the package.
 *
 * @param {{guide: {source: string}}} manifest A loaded manifest.
 * @returns {string} The path.
 */
export function guidePath(manifest) {
  return join(PACKAGE_ROOT, '..', manifest.guide.source);
}

/**
 * Skip a test when the migration guides are not on disk, which is the case for a package installed outside the
 * monorepo. A test that reads a guide calls it first and returns when it gives `true`.
 *
 * @param {{skip: (message?: string) => void}} context The `node:test` context of the test.
 * @param {Array<{guide: {source: string}}>} manifests The manifests whose guides the test reads.
 * @returns {boolean} `true` when a guide is missing and the test was skipped.
 */
export function skipWithoutGuides(context, manifests) {
  const missing = manifests.find(manifest => !existsSync(guidePath(manifest)));

  if (missing) {
    context.skip(`${missing.guide.source} is not available outside the monorepo`);
  }

  return Boolean(missing);
}
