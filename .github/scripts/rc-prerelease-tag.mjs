#!/usr/bin/env node

/**
 * Prints the tag that the GitHub pre-release of a version sits on.
 *
 * Every release candidate moves the one pre-release of its version to the new `rcN` tag. The
 * step that moves it used to compute the old tag as `rcN-1`. A run that creates the `rcN` tag
 * and stops before the move leaves the pre-release on `rcN-1`, so the next run, which cuts
 * `rcN+1`, looked for a release on `rcN`, found none, and failed. Every re-run failed the same
 * way and used one more RC number. Reading the tag from the release list has no such gap.
 *
 * Usage: gh release list --json tagName,isPrerelease --limit 100 | node rc-prerelease-tag.mjs <version>
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The tag of the pre-release that belongs to a version.
 *
 * @param {Array<{tagName: string, isPrerelease: boolean}>} releases The repository's releases.
 * @param {string} version The stable version the release candidates lead to, for example `19.0.0`.
 * @returns {string|null} The tag of the highest release candidate, or null when the version has no pre-release.
 */
export function prereleaseTag(releases, version) {
  const prefix = `${version}-rc`;
  const candidates = releases
    .filter(({ tagName, isPrerelease }) => isPrerelease && tagName.startsWith(prefix))
    .map(({ tagName }) => ({ tagName, suffix: tagName.slice(prefix.length) }))
    .filter(({ suffix }) => /^\d*$/.test(suffix))
    .sort((a, b) => Number(b.suffix || 0) - Number(a.suffix || 0));

  return candidates.length > 0 ? candidates[0].tagName : null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , version] = process.argv;

  if (!version) {
    console.error('Usage: rc-prerelease-tag.mjs <version>, with the JSON of `gh release list` on stdin.');
    process.exit(1);
  }

  const tag = prereleaseTag(JSON.parse(readFileSync(0, 'utf8')), version);

  if (tag === null) {
    console.error(`::error::No GitHub pre-release found for ${version}. The first RC creates it; check the Releases page.`);
    process.exit(1);
  }

  console.log(tag);
}
