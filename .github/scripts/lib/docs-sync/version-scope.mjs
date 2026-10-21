/**
 * Pages that exist for a version the target branch does not have.
 *
 * A migration guide into `18.2` and a `changelog-19` page describe versions
 * newer than what a `prod-docs/18.1` reader runs. They are excluded before the
 * classifier ever sees them, so the model spends its attention on the genuinely
 * ambiguous cases.
 */
import { compareMinor } from './target.mjs';

const MIGRATION = /^docs\/content\/guides\/upgrade-and-migration\/migrating-from-(\d+)\.(\d+)-to-(\d+)\.(\d+)\//;
const CHANGELOG_PAGE = /^docs\/content\/guides\/upgrade-and-migration\/changelog-(\d+)\//;

/**
 * Whether a content file belongs to a version above the released one.
 *
 * @param {string} file Repository-relative path.
 * @param {{ major: number, minor: number }} released The target branch's version.
 * @returns {boolean}
 */
export function isAboveReleased(file, released) {
  const migration = MIGRATION.exec(file);

  if (migration) {
    return compareMinor({ major: Number(migration[3]), minor: Number(migration[4]) }, released) > 0;
  }

  const changelog = CHANGELOG_PAGE.exec(file);

  if (changelog) {
    return Number(changelog[1]) > released.major;
  }

  return false;
}

/**
 * The subset of files that are version-scoped above the release.
 *
 * @param {string[]} files Repository-relative paths.
 * @param {{ major: number, minor: number }} released The target branch's version.
 * @returns {string[]}
 */
export function versionScopedAbove(files, released) {
  return files.filter((file) => isAboveReleased(file, released));
}
