import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { importerResolutions } from '../lockfile-importers.mjs';

// `hyperformula-ui` is pinned to an exact version: its 0.x line may break in a minor, and the
// FormulaBuilder plugin is tested against one version. Four workspace packages load it: `handsontable`
// (the unit tests), `tests` (the fixtures import it from `tests/node_modules/`), `docs` (the guide's
// examples), and `docs/angular-type-check`. pnpm resolves each importer on its own, so a bump in one of
// them would let the docs, the E2E fixtures, and the unit tests run different versions with nothing
// failing. Every importer must declare and lock the version the `handsontable` importer locks.

const DEPENDENCY = 'hyperformula-ui';
const OWNER = 'handsontable';

const read = relativePath => readFileSync(new URL(`../../../${relativePath}`, import.meta.url), 'utf8');

/**
 * Lists every importer whose `hyperformula-ui` differs from the one `handsontable` locks.
 *
 * @param {string} lockfile The `pnpm-lock.yaml` text.
 * @returns {string[]} One message per problem; empty when every importer agrees.
 */
function pinProblems(lockfile) {
  const resolutions = importerResolutions(lockfile, DEPENDENCY);
  const owner = resolutions.get(OWNER);

  if (!owner) {
    return [`pnpm-lock.yaml: the '${OWNER}' importer resolves no ${DEPENDENCY}.`];
  }

  const problems = [];

  resolutions.forEach(({ specifier, version }, importer) => {
    if (specifier !== owner.version) {
      problems.push(
        `${importer}/package.json declares ${DEPENDENCY} "${specifier}"; it must be exactly "${owner.version}", ` +
        `the version the '${OWNER}' importer locks.`
      );
    }

    if (version !== owner.version) {
      problems.push(`The '${importer}' importer locks ${DEPENDENCY} ${version}, not ${owner.version}.`);
    }
  });

  return problems;
}

/**
 * A minimal pnpm v9 lockfile with the given importers of the dependency.
 *
 * @param {Array<[string, string, string]>} importers `[importer, specifier, version]` per importer.
 * @returns {string} The lockfile text.
 */
function lockfileWith(importers) {
  return [
    "lockfileVersion: '9.0'",
    '',
    'importers:',
    '',
    ...importers.flatMap(([importer, specifier, version]) => [
      `  ${importer}:`,
      '    devDependencies:',
      `      ${DEPENDENCY}:`,
      `        specifier: ${specifier}`,
      `        version: ${version}(hyperformula@3.3.0)`,
      '',
    ]),
    'packages:',
    '',
  ].join('\n');
}

test('every workspace package locks the hyperformula-ui version the handsontable package locks', () => {
  assert.deepEqual(pinProblems(read('pnpm-lock.yaml')), []);
});

test('the check reports an importer that declares a range or locks another version', () => {
  const problems = pinProblems(lockfileWith([
    ['handsontable', '0.3.5', '0.3.5'],
    ['tests', '0.3.5', '0.3.5'],
    ['docs', '^0.3.5', '0.3.6'],
  ]));

  assert.equal(problems.length, 2);
  assert.match(problems[0], /docs\/package\.json declares hyperformula-ui "\^0\.3\.5"/);
  assert.match(problems[1], /'docs' importer locks hyperformula-ui 0\.3\.6, not 0\.3\.5/);
});

test('the check passes when every importer agrees', () => {
  assert.deepEqual(pinProblems(lockfileWith([
    ['handsontable', '0.3.5', '0.3.5'],
    ['tests', '0.3.5', '0.3.5'],
  ])), []);
});
