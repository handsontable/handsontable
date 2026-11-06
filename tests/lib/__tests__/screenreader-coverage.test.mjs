import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { A11Y_PAGES } from '../../a11y/pages.mjs';
import { EDITOR_COVERAGE, PLUGIN_COVERAGE } from '../../a11y/coverage.mjs';
import { SR_FEATURE_COVERAGE, SR_GAP_LIMIT, SR_PAGE_COVERAGE } from '../../screenreader/coverage.mjs';
import { SCREENREADER_LANES, laneUnsupported, loadScenarios } from '../screenreader-scenario.mjs';

// tests/AGENTS.md ("Screen readers", "Coverage: every surface is accounted for"): every page of the axe
// catalog and every plugin and editor of the axe coverage map says how a screen reader reads it, so a new
// surface cannot ship without a scenario, a reason, or a counted gap. The gap count is a ratchet, and the
// accessibility data file's matrix says what each automated reader ran, read from the same scenarios.

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SCENARIOS_DIR = path.join(TESTS_ROOT, 'screenreader/scenarios');
const DATA_FILE = path.join(TESTS_ROOT, '../docs/content/data/accessibility.json');
const FIXTURES = readdirSync(path.join(TESTS_ROOT, 'fixtures/demo')).filter(name => name.endsWith('.html'));
const KINDS = ['scenarios', 'none', 'gap'];
// A reason says what the surface draws or what is missing; a word or two says neither.
const MIN_REASON = 20;
/**
 * The matrix entry of each automated lane in `docs/content/data/accessibility.json`: the screen reader's
 * name on an `automated-nightly` entry.
 */
const LANE_MATRIX_NAMES = { nvda: 'NVDA', voiceover: 'VoiceOver' };

const loaded = loadScenarios(SCENARIOS_DIR, { fixtures: FIXTURES });
const scenarios = new Map(loaded.filter(entry => entry.scenario && entry.problems.length === 0).map(entry => [entry.scenario.id, entry.scenario]));
const MAPS = [
  { label: 'page', coverage: SR_PAGE_COVERAGE, keys: A11Y_PAGES.map(page => page.id), source: 'tests/a11y/pages.mjs' },
  { label: 'plugin or editor', coverage: SR_FEATURE_COVERAGE, keys: [...Object.keys(PLUGIN_COVERAGE), ...Object.keys(EDITOR_COVERAGE)], source: 'tests/a11y/coverage.mjs' },
];

test('the scenarios this test reads all load', () => {
  assert.ok(scenarios.size >= 2, `expected the committed scenarios under ${SCENARIOS_DIR}, found ${scenarios.size}`);
  assert.deepEqual(loaded.filter(entry => entry.problems.length > 0).map(entry => entry.fileName), [],
    'every scenario validates (screenreader-scenarios.test.mjs names the problems)');
});

for (const { label, coverage, keys, source } of MAPS) {
  test(`every ${label} of ${source} has a screen reader coverage entry, and every entry has one`, () => {
    assert.ok(keys.length > 10, `expected the ${label} keys of ${source}, found ${keys.length}`);
    assert.deepEqual(keys.filter(key => !Object.hasOwn(coverage, key)), [],
      `each ${label} needs an entry in tests/screenreader/coverage.mjs: the scenarios that read it, why a reader meets nothing, or a gap`);
    assert.deepEqual(Object.keys(coverage).filter(key => !keys.includes(key)), [],
      `an entry in tests/screenreader/coverage.mjs names a ${label} that ${source} does not have`);
  });

  test(`every ${label} entry is one kind, with committed scenarios or a reason`, () => {
    for (const [key, entry] of Object.entries(coverage)) {
      const kinds = Object.keys(entry);

      assert.equal(kinds.length, 1, `${key}: one of ${KINDS.join(', ')}, got ${kinds.join(', ')}`);
      assert.ok(KINDS.includes(kinds[0]), `${key}: unknown kind "${kinds[0]}"`);

      if (kinds[0] === 'scenarios') {
        assert.ok(Array.isArray(entry.scenarios) && entry.scenarios.length > 0, `${key}: scenarios is a non-empty list`);
        assert.equal(new Set(entry.scenarios).size, entry.scenarios.length, `${key}: a scenario is listed once`);
        entry.scenarios.forEach(id => assert.ok(scenarios.has(id), `${key}: "${id}" is not a committed scenario of tests/screenreader/scenarios/`));
      } else {
        assert.ok(typeof entry[kinds[0]] === 'string' && entry[kinds[0]].trim().length >= MIN_REASON,
          `${key}: a ${kinds[0]} says why, in at least ${MIN_REASON} characters`);
      }
    }
  });
}

/**
 * The catalog pages a scenario stands for: the page it opens, or the ones a scenario on its own fixture names.
 *
 * @param {{page?: string, catalogPages?: string[]}} scenario The scenario.
 * @returns {string[]} The pages.
 */
const standsFor = scenario => (scenario.page === undefined ? scenario.catalogPages ?? [] : [scenario.page]);

test('a page lists a scenario that opens that page, or one on a fixture of its own that names the page in its catalogPages', () => {
  for (const [page, entry] of Object.entries(SR_PAGE_COVERAGE)) {
    (entry.scenarios ?? []).filter(id => scenarios.has(id)).forEach((id) => {
      const scenario = scenarios.get(id);

      assert.ok(standsFor(scenario).includes(page), scenario.page === undefined
        ? `${page}: "${id}" runs on its fixture and stands for ${standsFor(scenario).join(', ')} (its catalogPages), not this page`
        : `${page}: "${id}" opens the catalog page "${scenario.page}", so it reads that page, not this one`);
    });
  }
});

test('a scenario is listed under every page it stands for', () => {
  for (const [id, scenario] of scenarios) {
    standsFor(scenario).forEach(page => assert.ok((SR_PAGE_COVERAGE[page]?.scenarios ?? []).includes(id),
      `${page}: "${id}" stands for this page (${scenario.page === undefined ? 'its catalogPages' : 'its page'}), so the page lists it`));
  }
});

test('every committed scenario covers a page of the catalog', () => {
  const listed = new Set(Object.values(SR_PAGE_COVERAGE).flatMap(entry => entry.scenarios ?? []));

  assert.deepEqual([...scenarios.keys()].filter(id => !listed.has(id)), [],
    'a scenario is listed under the page it reads in SR_PAGE_COVERAGE (tests/screenreader/coverage.mjs)');
});

test('SR_GAP_LIMIT is exactly the number of gaps: a new gap fails, a closed gap lowers it', () => {
  const gaps = MAPS.flatMap(({ coverage }) => Object.entries(coverage).filter(([, entry]) => 'gap' in entry).map(([key]) => key));

  assert.equal(gaps.length, SR_GAP_LIMIT,
    `tests/screenreader/coverage.mjs has ${gaps.length} gaps and SR_GAP_LIMIT is ${SR_GAP_LIMIT}. `
    + 'A new surface reads as a gap only with a scenario planned; a closed gap lowers the limit in the same change.');
});

test('the matrix in the accessibility data file says what each automated reader ran', () => {
  const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  const resolved = [...scenarios.values()];

  for (const lane of SCREENREADER_LANES) {
    const entries = data.matrix.filter(entry => entry.name === LANE_MATRIX_NAMES[lane] && entry.howTested.includes('automated-nightly'));

    assert.equal(entries.length, 1, `docs/content/data/accessibility.json: one automated-nightly entry for ${LANE_MATRIX_NAMES[lane]}`);
    assert.equal(entries[0].scenarios, resolved.length,
      `docs/content/data/accessibility.json: the ${LANE_MATRIX_NAMES[lane]} automated entry's "scenarios" is the number of committed scenarios, which every lane runs`);
    assert.deepEqual(entries[0].unsupported, laneUnsupported(resolved, lane),
      `docs/content/data/accessibility.json: the ${LANE_MATRIX_NAMES[lane]} automated entry's "unsupported" lists the primitives the ${lane} lane does not drive (laneUnsupported())`);
  }
});
