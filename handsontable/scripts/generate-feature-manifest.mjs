/**
 * Builds the feature manifest from the `feature.json` and `features.json` sources in `src/`.
 *
 * Usage (from `handsontable/`):
 *   node scripts/run.mjs build:feature-manifest      Checks the sources, fails when a committed output is stale,
 *                                                    and writes `dist/manifest.json`.
 *   node scripts/run.mjs generate:feature-manifest   The same, but rewrites the committed outputs first: the
 *                                                    `feature.generated.ts` modules and `released-tokens.json`.
 *   node scripts/generate-feature-manifest.mjs --check-base <file>
 *                                                    Only compares `released-tokens.json` with the base branch's
 *                                                    copy (CI passes it; `{}` before the file existed there).
 *                                                    Needs nothing but Node.
 *
 * Run `generate:feature-manifest` after changing a source, and commit what it writes. The rules are in
 * `src/featureManifest/AGENTS.md`; the checks and builders are in `scripts/utils/feature-manifest.js`.
 */

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import {
  OUTPUT_FILE,
  RELEASED_FILE,
  buildCommittedOutputs,
  buildManifest,
  checkRecordAgainstBase,
  checkReleased,
  checkSources,
  findStaleOutputs,
  loadSources,
} from './utils/feature-manifest.js';

const PACKAGE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values: args } = parseArgs({
  options: {
    write: { type: 'boolean', default: false },
    'check-base': { type: 'string' },
  },
});

/**
 * Prints the problems and marks the run as failed.
 *
 * @param {string} title What failed.
 * @param {string[]} problems The problems.
 */
function fail(title, problems) {
  // eslint-disable-next-line no-console
  console.error(`${title}\n${problems.map(problem => `  - ${problem}`).join('\n')}`);
  process.exitCode = 1;
}

/**
 * Reads a JSON file, naming it when it cannot be parsed.
 *
 * @param {string} path The file.
 * @returns {Promise<object>}
 */
async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));

  } catch (error) {
    throw new Error(`${path} could not be read as JSON: ${error.message}`);
  }
}

/**
 * Compares `released-tokens.json` with the base branch's copy, and nothing else.
 *
 * @param {string} baseFile The base branch's record.
 */
async function checkAgainstBase(baseFile) {
  const baseProblems = checkRecordAgainstBase(await readJson(resolve(baseFile)),
    await readJson(join(PACKAGE_DIR, RELEASED_FILE)));

  if (baseProblems.length > 0) {
    fail(`${RELEASED_FILE} drops what the base branch released. Restore the base branch's lines:`, baseProblems);

  } else {
    // eslint-disable-next-line no-console
    console.log(`${RELEASED_FILE} keeps every id and value the base branch released.`);
  }
}

/**
 * Checks the sources, rewrites the committed outputs with `--write`, and writes `dist/manifest.json`.
 */
async function build() {
  let sources = loadSources(PACKAGE_DIR);
  const problems = [...checkSources(sources)];

  if (problems.length === 0) {
    problems.push(...checkReleased(sources));
  }

  if (problems.length > 0) {
    fail('The feature manifest sources have problems:', problems);

    return;
  }

  if (args.write) {
    const outputs = buildCommittedOutputs(sources);
    const orphaned = sources.generatedModules.filter(({ file }) => !outputs.some(output => output.file === file));

    await Promise.all([
      ...outputs.map(({ file, content }) => writeFile(join(PACKAGE_DIR, file), content)),
      ...orphaned.map(({ file }) => rm(join(PACKAGE_DIR, file))),
    ]);
    sources = loadSources(PACKAGE_DIR);
  }

  const stale = findStaleOutputs(sources);

  if (stale.length > 0) {
    fail('These committed files do not match the manifest sources. Run `npm run generate:feature-manifest` ' +
      '(in handsontable/) and commit the result:', stale);

    return;
  }

  const { version } = JSON.parse(await readFile(join(PACKAGE_DIR, 'package.json'), 'utf8'));
  const outputPath = join(PACKAGE_DIR, OUTPUT_FILE);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(buildManifest(sources, version), null, 2)}\n`);
}

if (args['check-base'] !== undefined) {
  await checkAgainstBase(args['check-base']);

} else {
  await build();
}
