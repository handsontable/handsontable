/**
 * Generates the configuration-option levels matrix for the documentation.
 *
 * Reads the `@configScope` tag from every option in `src/dataMap/metaManager/metaSchema.ts`
 * and writes two artifacts:
 *   docs/content/guides/configuration/configuration-option-levels/option-levels.json
 *   the table inside configuration-option-levels.md, between the marker comments
 *
 * `metaSchema.ts` is the single source of truth. This script reads `src/` directly, so it
 * needs no core build first (unlike the `docs:api` pipeline, which reads `tmp/`).
 *
 * Usage (from the repo root):
 *   npm run generate:option-levels --prefix handsontable
 *
 * The parsing and rendering live in `scripts/utils/option-levels.mjs` so the unit test
 * `test/__tests__/optionLevels.unit.js` can import them without this file's path handling.
 * That test asserts every option carries a valid tag and that the committed page matches
 * this generator's output.
 */

import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseOptions, buildMarkdown, buildPayload } from './utils/option-levels.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const META_SCHEMA = resolve(currentDir, '..', 'src', 'dataMap', 'metaManager', 'metaSchema.ts');
const DOCS_DIR = resolve(
  currentDir, '..', '..', 'docs', 'content', 'guides', 'configuration', 'configuration-option-levels'
);
const JSON_OUT = resolve(DOCS_DIR, 'option-levels.json');
const PAGE_MD = resolve(DOCS_DIR, 'configuration-option-levels.md');
const MD_START = '<!-- option-levels:start -->';
const MD_END = '<!-- option-levels:end -->';

/**
 * Entry point: parses the schema, writes the JSON, and injects the table into the page.
 */
function main() {
  const options = parseOptions(readFileSync(META_SCHEMA, 'utf8'));

  mkdirSync(DOCS_DIR, { recursive: true });
  writeFileSync(JSON_OUT, `${JSON.stringify(buildPayload(options), null, 2)}\n`, 'utf8');
  console.error(`Wrote ${JSON_OUT} (${options.length} options)`);

  const page = readFileSync(PAGE_MD, 'utf8');
  const startIdx = page.indexOf(MD_START);
  const endIdx = page.indexOf(MD_END);

  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Markers not found in ${PAGE_MD}. Expected ${MD_START} and ${MD_END}.`);
  }

  const updated = `${page.slice(0, startIdx + MD_START.length)}\n${buildMarkdown(options)}\n${page.slice(endIdx)}`;

  writeFileSync(PAGE_MD, updated, 'utf8');
  console.error(`Wrote ${PAGE_MD}`);
  console.error('\nCommit both updated files to the repository.');
}

main();
