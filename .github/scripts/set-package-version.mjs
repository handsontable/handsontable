/**
 * Set the `version` field of a package.json via a targeted line replace, so the
 * diff is exactly the version line. A JSON round-trip would reflow inline objects
 * (handsontable/package.json's `exports` map is written one entry per line), which
 * is a large, wrong diff.
 *
 * Usage: node set-package-version.mjs <version> [package-json-path]
 *
 * Writing the value the file already holds is a clean no-op that still exits 0 --
 * a fresh minor/major docs branch is cut from the release tag (publish.yml), whose
 * package.json already records the release version, so this MUST succeed there.
 * Only a genuinely missing `version` line is an error. Conflating "already correct"
 * with "line absent" (via a bare `next === source` check) fails every x.y.0 release
 * and blocks the docs push (DEV-2925 review).
 */
import { readFileSync, writeFileSync } from 'node:fs';

// The top-level `"version": "x.y.z",` line. `^...$` with the `m` flag and the
// trailing `",` anchor it to the package version, not a nested `"version"` value.
const VERSION_LINE = /^(\s*"version":\s*")[^"]*(",)/m;

/**
 * @returns {number} Process exit code.
 */
function main() {
  const [version, pkgPath = 'handsontable/package.json'] = process.argv.slice(2);

  if (!version) {
    process.stderr.write('Usage: node set-package-version.mjs <version> [package-json-path]\n');

    return 1;
  }

  const source = readFileSync(pkgPath, 'utf8');

  if (!VERSION_LINE.test(source)) {
    process.stderr.write(`::error::no "version" line found in ${pkgPath}\n`);

    return 1;
  }

  const next = source.replace(VERSION_LINE, `$1${version}$2`);

  writeFileSync(pkgPath, next);

  if (next === source) {
    process.stdout.write(`${pkgPath} already at version ${version}; no change.\n`);
  } else {
    process.stdout.write(`Set ${pkgPath} version to ${version}.\n`);
  }

  return 0;
}

process.exitCode = main();
