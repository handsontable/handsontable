import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { VERSIONS_DIR, buildPlan, loadManifest } from '../../src/manifest.mjs';
import { transformFile } from '../../src/runner.mjs';

/**
 * A fixture on disk: `versions/<version>/__fixtures__/<name>/input.<ext>`, `output.<ext>`, and the optional
 * `report.json` and `options.json`.
 *
 * @typedef {object} Fixture
 * @property {string} version Version directory name.
 * @property {string} name Fixture directory name.
 * @property {string} dir Absolute fixture directory.
 * @property {string} inputName File name of the input, for example `input.css`.
 * @property {string} outputName File name of the expected output.
 */

/**
 * Read a text file, or return `null` when it does not exist.
 *
 * @param {string} path File path.
 * @returns {Promise<string|null>} The text, or `null`.
 */
async function readOptional(path) {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

/**
 * Find every fixture under a versions directory.
 *
 * @param {string} [versionsDir] Directory with one subdirectory per version.
 * @returns {Promise<Fixture[]>} Fixtures sorted by version and name.
 */
export async function listFixtures(versionsDir = VERSIONS_DIR) {
  const fixtures = [];
  const versions = (await readdir(versionsDir, { withFileTypes: true })).filter(entry => entry.isDirectory());

  for (const version of versions) {
    const root = join(versionsDir, version.name, '__fixtures__');
    const cases = await readdir(root, { withFileTypes: true }).catch(() => []);

    for (const entry of cases.filter(item => item.isDirectory())) {
      const files = await readdir(join(root, entry.name));
      const inputName = files.find(file => /^input\./.test(file));
      const outputName = files.find(file => /^output\./.test(file));

      fixtures.push({
        version: version.name,
        name: entry.name,
        dir: join(root, entry.name),
        inputName,
        outputName,
      });
    }
  }

  return fixtures.sort((a, b) => `${a.version}/${a.name}`.localeCompare(`${b.version}/${b.name}`));
}

/**
 * Run a fixture through `transformFile` with only the rules of its own version. Nothing touches the disk
 * except reading the fixture files.
 *
 * `options.json` may set `aggressive`, `only` (an array of rule ids), `phase` (1 or 2, default 1), and `facts`
 * (fact keys present before the run, for example `["uses-formulas@."]`; see `src/lib/facts.mjs`). A `package.json`
 * fixture needs `"phase": 2`.
 *
 * @param {Fixture} fixture The fixture.
 * @param {string} [versionsDir] Directory with the manifests.
 * @returns {Promise<{input: string, output: string, expected: string, expectedReport: object[],
 * entries: object[], changed: boolean, rerun: {output: string, changed: boolean}}>} Everything the assertions
 * need. `rerun` is the result of transforming the output a second time.
 */
export async function runFixture(fixture, versionsDir = VERSIONS_DIR) {
  const manifest = await loadManifest(join(versionsDir, fixture.version));
  const input = await readFile(join(fixture.dir, fixture.inputName), 'utf8');
  const expected = await readFile(join(fixture.dir, fixture.outputName), 'utf8');
  const expectedReport = JSON.parse(await readOptional(join(fixture.dir, 'report.json')) ?? '[]');
  const options = JSON.parse(await readOptional(join(fixture.dir, 'options.json')) ?? '{}');
  const plan = buildPlan([manifest], options.only ?? []);
  const transformOptions = { aggressive: Boolean(options.aggressive) };
  const phase = options.phase ?? 1;
  const facts = new Set(options.facts ?? []);
  const first = await transformFile({
    filePath: fixture.inputName,
    source: input,
    plan,
    options: transformOptions,
    facts,
    phase,
  });
  const second = await transformFile({
    filePath: fixture.outputName,
    source: first.output,
    plan,
    options: transformOptions,
    facts,
    phase,
  });

  return {
    input,
    output: first.output,
    expected,
    expectedReport,
    entries: first.entries,
    changed: first.changed,
    rerun: { output: second.output, changed: second.changed },
  };
}

/**
 * Compare expected report entries with actual ones. Every expected entry must match a distinct actual entry
 * on each field it names (`ruleId`, `severity`, `line`). Actual entries that no expectation names are
 * allowed.
 *
 * @param {Array<{ruleId: string, severity: string, line?: number}>} expected Expected entries.
 * @param {Array<{ruleId: string, severity: string, line: number|null}>} actual Actual entries.
 * @returns {object[]} The expected entries that found no match, empty when the report is as expected.
 */
export function unmatchedEntries(expected, actual) {
  const available = [...actual];

  return expected.filter((want) => {
    const index = available.findIndex(have => Object.entries(want).every(([field, value]) => have[field] === value));

    if (index === -1) {
      return true;
    }

    available.splice(index, 1);

    return false;
  });
}
