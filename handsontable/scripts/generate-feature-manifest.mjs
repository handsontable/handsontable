/**
 * Builds the feature manifest from the `feature.json` and `features.json` sources in `src/`.
 *
 * Usage (from `handsontable/`):
 *   node scripts/run.mjs build:feature-manifest      Checks the sources, fails when a committed output is stale,
 *                                                    and writes `dist/manifest.json`.
 *   node scripts/run.mjs generate:feature-manifest   The same, but rewrites the committed outputs first: the
 *                                                    `feature.generated.ts` modules and `released-tokens.json`.
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
  buildCommittedOutputs,
  buildManifest,
  checkReleased,
  checkSources,
  findStaleOutputs,
  loadSources,
} from './utils/feature-manifest.js';

const PACKAGE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values: args } = parseArgs({ options: { write: { type: 'boolean', default: false } } });

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

let sources = loadSources(PACKAGE_DIR);
const problems = [...checkSources(sources)];

if (problems.length === 0) {
  problems.push(...checkReleased(sources));
}

if (problems.length > 0) {
  fail('The feature manifest sources have problems:', problems);

} else {
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

  } else {
    const { version } = JSON.parse(await readFile(join(PACKAGE_DIR, 'package.json'), 'utf8'));
    const outputPath = join(PACKAGE_DIR, OUTPUT_FILE);

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(buildManifest(sources, version), null, 2)}\n`);
  }
}
