import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { VERSIONS_DIR, buildPlan, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';

const manifests = await loadManifests(VERSIONS_DIR);
const IMPORTS = 'import Handsontable from \'handsontable\';\nimport formKit from \'form-kit\';\n';
const TODO = 'TODO(handsontable-codemod';
const CULTURE = '{ numericFormat: { pattern: \'0,0\', culture: \'de-DE\' } }';
// The same format in a column: a grid-level culture is only reported, because a grid-level locale reaches every column.
const COLUMN_CULTURE = '{ columns: [{ type: \'numeric\', numericFormat: { pattern: \'0,0\', culture: \'de-DE\' } }] }';

/**
 * Run a plan over a file three times, as the idempotency contract does, and return the first run.
 *
 * @param {string} source The file text.
 * @param {object} plan The plan.
 * @param {string} [filePath] The file name.
 * @returns {Promise<{output: string, entries: object[]}>} The first run.
 */
async function threeRuns(source, plan, filePath = 'grid.js') {
  const first = await transformFile({ filePath, source, plan, options: { markers: true } });
  const second = await transformFile({ filePath, source: first.output, plan, options: { markers: true } });
  const third = await transformFile({ filePath, source: second.output, plan, options: { markers: true } });

  assert.equal(second.output, first.output, 'run 2 changed the file');
  assert.equal(third.output, second.output, 'run 3 changed the file');

  return first;
}

const released = manifests.filter(manifest => manifest.version === '18.0.0');
const everyRule = buildPlan(released, undefined);
const plan19 = buildPlan(manifests.filter(manifest => manifest.version === '19.0.0'), undefined);

/**
 * The receivers a file shows to be something other than the grid, each as the lines that define it.
 */
const OTHER_RECEIVERS = [
  ['a local object', 'const form = { updateSettings(s) { return s; } };', 'form'],
  ['a local class instance', 'class Form { updateSettings(s) { return s; } }\nconst form = new Form();', 'form'],
  ['an imported library', '', 'formKit'],
  [
    'a plugin from getPlugin()',
    'const hot = new Handsontable(document.body, {});\nconst form = hot.getPlugin(\'filters\');',
    'form',
  ],
  ['a getPlugin() call', 'const hot = new Handsontable(document.body, {});', 'hot.getPlugin(\'filters\')'],
];

describe('an object that another receiver than the grid takes is not Handsontable options', () => {
  for (const [label, setup, receiver] of OTHER_RECEIVERS) {
    it(`ignores numericFormat.culture on updateSettings() of ${label}`, async() => {
      const source = `${IMPORTS}${setup}\n${receiver}.updateSettings(${CULTURE});\n`;
      const result = await threeRuns(source, everyRule);

      assert.deepEqual(result.entries, []);
      assert.equal(result.output, source);
      assert.ok(!result.output.includes(TODO));
    });

    it(`ignores the other option reports on updateSettings() of ${label}`, async() => {
      const body = '{ correctFormat: true, datePickerConfig: {}, columnHeaders: false, '
        + 'columns: [{ type: \'date\', dateFormat: \'DD/MM/YYYY\', numericFormat: { culture: \'fr-FR\' } }] }';
      const source = `${IMPORTS}${setup}\n${receiver}.updateSettings(${body});\n`;
      const result = await threeRuns(source, everyRule);

      assert.deepEqual(result.entries, []);
      assert.equal(result.output, source);
    });
  }

  it('ignores an object that a variable holds, when only another receiver takes it', async() => {
    const source = `${IMPORTS}const settings = ${CULTURE};\nformKit.updateSettings(settings);\n`;
    const result = await threeRuns(source, everyRule);

    assert.deepEqual(result.entries, []);
    assert.equal(result.output, source);
  });

  it('reports, and does not edit, an object that a grid takes and another receiver takes too', async() => {
    const source = `${IMPORTS}const hot = new Handsontable(document.body, {});\nconst settings = ${COLUMN_CULTURE};\n`
      + 'formKit.updateSettings(settings);\nhot.updateSettings(settings);\n';
    const result = await threeRuns(source, everyRule);
    const entry = result.entries.find(item => item.ruleId === '18.0.0/numeric-format-culture');

    assert.equal(entry.severity, 'manual');
    assert.match(entry.message, /also passed to `formKit\.updateSettings\(\)`/);
    assert.ok(result.output.includes('culture: \'de-DE\''), result.output);
    assert.ok(!result.output.includes('locale: \'de-DE\''), result.output);
  });

  it('rewrites an object that only a grid takes', async() => {
    const source = `${IMPORTS}const hot = new Handsontable(document.body, {});\nconst settings = ${COLUMN_CULTURE};\n`
      + 'hot.updateSettings(settings);\n';
    const result = await threeRuns(source, everyRule);

    assert.ok(result.entries.some(entry => entry.ruleId === '18.0.0/numeric-format-culture'));
    assert.ok(result.output.includes('locale: \'de-DE\''), result.output);
  });

  it('still reports a receiver that the file does not show, as a medium object, and rewrites a confirmed grid', async() => {
    const plans = {
      parameter: 'function f(grid) { grid.updateSettings(SETTINGS); }',
      global: 'window.table.updateSettings(SETTINGS);',
      call: 'getGrid().updateSettings(SETTINGS);',
    };

    for (const [kind, line] of Object.entries(plans)) {
      const source = `${IMPORTS}${line.replace('SETTINGS', COLUMN_CULTURE)}\n`;
      const result = await threeRuns(source, everyRule);
      const manual = result.entries.filter(entry => entry.severity === 'manual'
        && entry.ruleId === '18.0.0/numeric-format-culture');

      assert.equal(manual.length, 1, kind);
      assert.equal(result.output.includes('culture:'), true, kind);
    }

    const confirmed = await threeRuns(`${IMPORTS}const hot = new Handsontable(document.body, {});\n`
      + `hot.updateSettings(${COLUMN_CULTURE});\n`, everyRule);

    assert.ok(confirmed.output.includes('locale: \'de-DE\''), confirmed.output);
  });

  it('ignores a cell option that a call on another receiver sets, and keeps an unresolved one', async() => {
    const calls = [
      'form.setCellMeta(0, 1, \'correctFormat\', true);',
      'form.setCellMetaObject(0, 1, { correctFormat: true });',
      'form.setCellMetaObject(0, 1, { type: \'numeric\', numericFormat: { culture: \'de-DE\' } });',
    ];

    for (const call of calls) {
      const source = `${IMPORTS}const form = { setCellMeta() {}, setCellMetaObject() {} };\n${call}\n`;
      const result = await threeRuns(source, everyRule);

      assert.deepEqual(result.entries, [], call);
    }

    for (const call of calls) {
      const source = `${IMPORTS}${call.replace('form', 'window.picker')}\n`;
      const result = await threeRuns(source, everyRule);

      assert.ok(result.entries.length > 0, call);
    }
  });

  it('keeps a detect match on an unresolved receiver and drops it on another one', async() => {
    const call = receiver => `${receiver}.updateSettings({ afterOnCellMouseDown: null });\n`;
    const draft = (receiver, setup = '') => `${IMPORTS}${setup}${call(receiver)}`;
    const onGrid = await threeRuns(draft('table'), plan19);
    const onOther = await threeRuns(draft('form', 'const form = { updateSettings() {} };\n'), plan19);

    assert.ok(onGrid.entries.some(entry => entry.ruleId === '19.0.0/hook-set-to-null'), JSON.stringify(onGrid.entries));
    assert.deepEqual(onOther.entries, []);
  });
});

describe('the update-settings-data-provider rule needs an updateSettings call on a grid', () => {
  const rule = '19.0.0/update-settings-data-provider';
  const run = async source => (await threeRuns(`${IMPORTS}${source}`, plan19))
    .entries.filter(entry => entry.ruleId === rule).map(entry => entry.line);

  it('reports a call on a confirmed grid, and on a receiver the file does not show', async() => {
    const lines = await run('const hot = new Handsontable(document.body, { dataProvider: { fetchRows() {} } });\n'
      + 'hot.updateSettings({ pagination: true });\nfunction f(grid) {\n'
      + '  grid.updateSettings({ colHeaders: true });\n}\n');

    assert.deepEqual(lines, [4, 6]);
  });

  it('does not report a call on a local object, an imported library, or a plugin', async() => {
    const lines = await run('const form = { updateSettings() {} };\nform.updateSettings({ dataProvider: 1 });\n'
      + 'formKit.updateSettings({ dataProvider: 1 });\nconst hot = new Handsontable(document.body, {});\n'
      + 'hot.getPlugin(\'filters\').updateSettings({ dataProvider: 1 });\n');

    assert.deepEqual(lines, []);
  });

  it('reports the grid call and not the call on another object of the same file', async() => {
    const lines = await run('const other = { updateSettings() {} };\nother.updateSettings({ dataProvider: 1 });\n'
      + 'const hot = new Handsontable(document.body, { dataProvider: { fetchRows() {} } });\n'
      + 'hot.updateSettings({ pagination: true });\n');

    assert.deepEqual(lines, [6]);
  });

  it('does not report a bare updateSettings() function, and reports nothing without a dataProvider', async() => {
    assert.deepEqual(await run('const dataProvider = {};\nupdateSettings({ dataProvider });\n'), []);
    assert.deepEqual(await run('const hot = new Handsontable(document.body, {});\n'
      + 'hot.updateSettings({ colHeaders: true });\n'), []);
  });
});
