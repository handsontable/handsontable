/**
 * Writes the website strings export, `content/data/accessibility-website-strings.json`, from the
 * accessibility data file. The handsontable.com repository keeps a copy of the export, so the
 * target, the report version, and the tested screen readers reach the website from the same source
 * as the docs.
 *
 * Usage, from `docs/`:
 *   node scripts/export-accessibility-strings.mjs           # write the export
 *   node scripts/export-accessibility-strings.mjs --check   # exit 1 when the committed export is stale
 *
 * The root `test:tooling` suite runs the same comparison (`scripts/__tests__/accessibility-claims.test.mjs`).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadAccessibilityData, websiteStringsJson } from '../src/plugins/accessibility-data.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** The export's path. */
export const WEBSITE_STRINGS_FILE = resolve(__dirname, '../content/data/accessibility-website-strings.json');

/**
 * Compares the committed export with a fresh render.
 *
 * @returns {{ fresh: string, committed: string|null }} Both texts; `committed` is `null` when the
 *   file does not exist yet.
 */
export function compareWebsiteStrings() {
  const fresh = websiteStringsJson(loadAccessibilityData());
  let committed = null;

  try {
    committed = readFileSync(WEBSITE_STRINGS_FILE, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  return { fresh, committed };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { fresh, committed } = compareWebsiteStrings();

  if (process.argv.includes('--check')) {
    if (committed === fresh) {
      console.log('accessibility-website-strings.json is up to date');
    } else {
      console.error('accessibility-website-strings.json is stale: run `npm run docs:export-accessibility-strings --prefix docs`');
      process.exit(1);
    }
  } else {
    writeFileSync(WEBSITE_STRINGS_FILE, fresh);
    console.log(`wrote ${WEBSITE_STRINGS_FILE}`);
  }
}
