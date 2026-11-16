import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPlan, loadManifests } from '../src/manifest.mjs';
import { compareVersions, parseVersion } from '../src/versions.mjs';
import { transformFile } from '../src/runner.mjs';

const manifests = await loadManifests();
const HEAD = 'import Handsontable from \'handsontable\';\nconst hot = new Handsontable(el, {});\n';
const SHAPES = {
  'a resize-state call whose result is used': {
    code: 'const widths = hot.getPlugin(\'manualColumnResize\').loadManualColumnWidths();\n',
    ids: ['resize-state-methods'],
  },
  'a sanitize call with an extra argument': {
    code: 'const v = Handsontable.helper.sanitize(html, extra);\n',
    ids: ['helper-sanitize'],
  },
  'an export option that a later spread can set': {
    code: 'hot.getPlugin(\'exportFile\').downloadFile(\'csv\', { columnHeaders: false, ...overrides });\n',
    ids: ['export-column-headers'],
  },
};

/**
 * Run the rules of some migrations over a text.
 *
 * @param {string} source File text.
 * @param {string[]} versions Manifest versions to load.
 * @param {string[]} slugs The slugs of the rules to run, in every loaded version.
 * @returns {Promise<{output: string, entries: object[], changed: boolean}>} The result.
 */
function run(source, versions, slugs) {
  const only = versions.flatMap(version => slugs.map(slug => `${version}/${slug}`));
  const plan = buildPlan(manifests.filter(manifest => versions.includes(manifest.version)), only);

  return transformFile({ filePath: 'a.js', source, plan, options: {} });
}

const todos = text => (text.match(/TODO\(handsontable-codemod/g) ?? []).length;
const manual = result => result.entries.filter(entry => entry.severity === 'manual');

describe('twin rules of two migrations report one spot once', () => {
  for (const [label, { code, ids }] of Object.entries(SHAPES)) {
    describe(label, () => {
      it('leaves one marker and one entry in a run that holds both, owned by the earliest', async() => {
        const first = await run(`${HEAD}${code}`, ['18.0.0', '19.0.0'], ids);
        const second = await run(first.output, ['18.0.0', '19.0.0'], ids);

        assert.equal(todos(first.output), 1, first.output);
        assert.equal(manual(first).length, 1);
        assert.match(manual(first)[0].ruleId, /^18\.0\.0\//);
        assert.match(first.output, /TODO\(handsontable-codemod 18\.0\.0\//);
        assert.equal(second.changed, false);
        assert.equal(todos(second.output), 1);
      });

      it('leaves no second marker when a later migration runs over code the earlier one marked', async() => {
        const earlier = await run(`${HEAD}${code}`, ['18.0.0'], ids);
        const later = await run(earlier.output, ['19.0.0'], ids);
        const again = await run(later.output, ['19.0.0'], ids);

        assert.equal(todos(earlier.output), 1);
        assert.equal(todos(later.output), 1, later.output);
        assert.equal(manual(later).length, 1, 'the later migration still reports the spot');
        assert.equal(again.changed, false);
      });

      it('still marks the spot when the earlier migration did not', async() => {
        const only = await run(`${HEAD}${code}`, ['19.0.0'], ids);

        assert.equal(todos(only.output), 1, only.output);
        assert.match(only.output, /TODO\(handsontable-codemod 19\.0\.0\//);
      });
    });
  }

  it('keeps a marker for each of two different spots', async() => {
    const source = `${HEAD}${SHAPES['a resize-state call whose result is used'].code}`
      + 'const heights = hot.getPlugin(\'manualRowResize\').loadManualRowHeights();\n';
    const result = await run(source, ['18.0.0', '19.0.0'], ['resize-state-methods']);

    assert.equal(todos(result.output), 2, result.output);
    assert.equal(manual(result).length, 2);
  });

  it('names an earlier rule of the same kind in the data of every twin', () => {
    const byId = new Map(manifests.flatMap(manifest => manifest.rules.map(rule => [rule.id, { rule, manifest }])));
    const twinned = [...byId.values()].filter(({ rule }) => rule.twins);

    assert.ok(twinned.length >= 3);

    for (const { rule, manifest } of twinned) {
      for (const id of rule.twins) {
        const found = byId.get(id);

        assert.ok(found, `${rule.id} names ${id}, which is no rule`);
        assert.equal(found.rule.kind, rule.kind, `${rule.id} and ${id} are of one kind`);
        const order = compareVersions(parseVersion(found.manifest.version), parseVersion(manifest.version));

        assert.ok(order < 0, `${id} is not earlier than ${rule.id}`);
      }
    }
  });
});
