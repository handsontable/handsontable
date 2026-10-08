import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Every formulas leg runs exactly one HyperFormula. The `umd` legs load it from THIS package's
// node_modules (`/tests/node_modules/hyperformula/…`) beside `dist/handsontable.js`; the `full-min`
// legs run the engine `handsontable.full.min.js` bakes in, which is whatever the `handsontable`
// importer resolves. The two only match while `tests/package.json` pins the exact version that
// importer locks. An identical range is not enough (both packages once declared `^3.0.0` and locked
// 3.3.0 and 3.4.0), and a lockfile refresh can move the core's copy without touching the pin. Then an
// engine difference reads as a `umd` vs `full-min` split, the shape tests/AGENTS.md teaches a reader
// to blame on the bundle. Other importers (`docs` resolves its own copy) do not reach either leg.

const DEPENDENCY = 'hyperformula';
const ENGINE_OWNER = 'handsontable';
const PIN_OWNER = 'tests';

const read = relativePath => readFileSync(new URL(`../../../${relativePath}`, import.meta.url), 'utf8');

/**
 * Reads what each workspace importer of a pnpm v9 lockfile resolves one dependency to.
 *
 * @param {string} lockfile The `pnpm-lock.yaml` text.
 * @param {string} dependency The package name.
 * @returns {Map<string, {specifier: string, version: string}>} The specifier and the resolved version,
 * peer suffix dropped, per importer that depends on it.
 */
function importerResolutions(lockfile, dependency) {
  const resolutions = new Map();
  const dependencyKey = new RegExp(`^ {6}'?${dependency.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}'?:$`);
  let inImporters = false;
  let importer = null;
  let current = null;

  for (const line of lockfile.split('\n')) {
    if (/^\S/.test(line)) {
      inImporters = line === 'importers:';
      current = null;
      continue;
    }

    if (!inImporters) {
      continue;
    }

    const importerMatch = line.match(/^ {2}'?([^\s']+)'?:$/);

    if (importerMatch) {
      importer = importerMatch[1];
      current = null;

    } else if (dependencyKey.test(line)) {
      current = { specifier: '', version: '' };
      resolutions.set(importer, current);

    } else if (current) {
      const field = line.match(/^ {8}(specifier|version): '?([^'\s]+)'?$/);

      if (field) {
        current[field[1]] = field[1] === 'version' ? field[2].replace(/\(.*$/, '') : field[2];
      } else if (!/^ {8}/.test(line)) {
        current = null;
      }
    }
  }

  return resolutions;
}

/**
 * Lists every way the fixture-served engine can drift from the one baked into `full.min`.
 *
 * @param {string} lockfile The `pnpm-lock.yaml` text.
 * @param {string} testsPackageJson The `tests/package.json` text.
 * @returns {string[]} One message per problem; empty when the pin holds.
 */
function pinProblems(lockfile, testsPackageJson) {
  const resolutions = importerResolutions(lockfile, DEPENDENCY);
  const engine = resolutions.get(ENGINE_OWNER);
  const pinned = resolutions.get(PIN_OWNER);
  const declared = JSON.parse(testsPackageJson).devDependencies?.[DEPENDENCY];
  const problems = [];

  if (!engine) {
    problems.push(`pnpm-lock.yaml: the '${ENGINE_OWNER}' importer resolves no ${DEPENDENCY}.`);
  }

  if (!pinned) {
    problems.push(`pnpm-lock.yaml: the '${PIN_OWNER}' importer resolves no ${DEPENDENCY}.`);
  }

  if (engine && pinned && engine.version !== pinned.version) {
    problems.push(
      `The umd legs load ${DEPENDENCY} ${pinned.version} (tests/package.json), but ` +
      `handsontable.full.min.js bakes in ${engine.version} (the '${ENGINE_OWNER}' importer). ` +
      `Pin tests/package.json to ${engine.version} and reinstall.`
    );
  }

  if (engine && declared !== engine.version) {
    problems.push(
      `tests/package.json declares ${DEPENDENCY} "${declared}"; it must be exactly "${engine.version}", the ` +
      `version the '${ENGINE_OWNER}' importer locks (not a range: pnpm resolves each importer on its own).`
    );
  }

  return problems;
}

/**
 * A minimal pnpm v9 lockfile with the two importers the pin compares.
 *
 * @param {string} engineVersion What `handsontable` resolves.
 * @param {string} pinnedVersion What `tests` resolves.
 * @returns {string} The lockfile text.
 */
function lockfileWith(engineVersion, pinnedVersion) {
  return [
    "lockfileVersion: '9.0'",
    '',
    'importers:',
    '',
    '  docs:',
    '    dependencies:',
    '      hyperformula:',
    '        specifier: ^3.4.0',
    '        version: 3.4.0',
    '',
    '  handsontable:',
    '    dependencies:',
    '      hyperformula:',
    '        specifier: ^3.0.0',
    `        version: ${engineVersion}`,
    '',
    '  tests:',
    '    devDependencies:',
    "      '@playwright/test':",
    '        specifier: 1.62.1',
    '        version: 1.62.1',
    '      hyperformula:',
    `        specifier: ${pinnedVersion}`,
    `        version: ${pinnedVersion}`,
    '',
    'packages:',
    '',
    '  hyperformula@3.3.0:',
    '    resolution: {integrity: sha512-x}',
    '',
  ].join('\n');
}

test('reads each importer\'s own resolution, not the first one in the file', () => {
  const resolutions = importerResolutions(lockfileWith('3.3.0(chevrotain@1.0.0)', '3.3.0'), DEPENDENCY);

  assert.deepEqual(Object.fromEntries(resolutions), {
    docs: { specifier: '^3.4.0', version: '3.4.0' },
    handsontable: { specifier: '^3.0.0', version: '3.3.0' },
    tests: { specifier: '3.3.0', version: '3.3.0' },
  });
});

test('reports a fixture-served engine that drifted from the one in full.min', () => {
  const problems = pinProblems(
    lockfileWith('3.4.0', '3.3.0'),
    JSON.stringify({ devDependencies: { hyperformula: '3.3.0' } })
  );

  assert.equal(problems.length, 2);
  assert.match(problems[0], /umd legs load hyperformula 3\.3\.0 .* bakes in 3\.4\.0/);
  assert.match(problems[1], /declares hyperformula "3\.3\.0"; it must be exactly "3\.4\.0"/);
});

test('reports a range in tests/package.json even while it resolves to the same version', () => {
  const problems = pinProblems(
    lockfileWith('3.3.0', '3.3.0'),
    JSON.stringify({ devDependencies: { hyperformula: '^3.0.0' } })
  );

  assert.deepEqual(problems, [
    'tests/package.json declares hyperformula "^3.0.0"; it must be exactly "3.3.0", the version the ' +
    '\'handsontable\' importer locks (not a range: pnpm resolves each importer on its own).',
  ]);
});

test('reports an importer that no longer resolves the engine, instead of passing vacuously', () => {
  const problems = pinProblems(
    lockfileWith('3.3.0', '3.3.0').replace('  tests:', '  wrappers/vue3:'),
    JSON.stringify({ devDependencies: { hyperformula: '3.3.0' } })
  );

  assert.deepEqual(problems, ['pnpm-lock.yaml: the \'tests\' importer resolves no hyperformula.']);
});

test('the umd legs load the same HyperFormula that handsontable.full.min.js bakes in', () => {
  assert.deepEqual(pinProblems(read('pnpm-lock.yaml'), read('tests/package.json')), []);
});
