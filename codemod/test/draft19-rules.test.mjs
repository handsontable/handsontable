import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { VERSIONS_DIR, buildPlan, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';

const manifests = await loadManifests(VERSIONS_DIR);
const TODO = 'TODO(handsontable-codemod';
const HOT = 'import Handsontable from \'handsontable\';\n';

/**
 * Run the rules with the given ids over a text three times, each run on the output of the one before.
 *
 * @param {string} filePath File name.
 * @param {string} source Starting text.
 * @param {string[]} only Rule ids.
 * @returns {Promise<Array<{output: string, changed: boolean, entries: object[]}>>} The three results.
 */
async function runs(filePath, source, only) {
  const plan = buildPlan(manifests, only);
  const results = [];
  let text = source;

  for (let run = 0; run < 3; run += 1) {
    const result = await transformFile({ filePath, source: text, plan });

    results.push(result);
    text = result.output;
  }

  return results;
}

/**
 * The entries of one rule, as `severity:line` texts.
 *
 * @param {{entries: object[]}} result A run result.
 * @param {string} ruleId Rule id.
 * @returns {string[]} The entries.
 */
function lines(result, ruleId) {
  return result.entries.filter(entry => entry.ruleId === ruleId).map(entry => `${entry.severity}:${entry.line}`);
}

/**
 * Assert that runs 2 and 3 change nothing and report what run 1 reported for a rule.
 *
 * @param {Array<{changed: boolean, entries: object[]}>} results The three runs.
 * @param {string} ruleId Rule id.
 * @returns {void}
 */
function assertStable(results, ruleId) {
  assert.equal(results[1].changed, false, 'run 2 changed the file');
  assert.equal(results[2].changed, false, 'run 3 changed the file');
  const standing = result => lines(result, ruleId).filter(item => !item.startsWith('changed')).length;

  // A TODO that run 1 adds moves the lines below it, so the runs are compared by how many entries they report.
  assert.equal(standing(results[1]), standing(results[0]), 'run 2 reports another number of entries');
  assert.equal(standing(results[2]), standing(results[0]), 'run 3 reports another number of entries');
}

describe('export columnHeaders passed from a variable', () => {
  const RULES = ['18.0.0/export-column-headers', '19.0.0/export-column-headers'];
  const base = `${HOT}export function save(hot: Handsontable) {
  const plugin = hot.getPlugin('exportFile');
  const base = { filename: 'trades', columnHeaders: true };

  plugin.downloadFile('csv', base);
}
`;

  for (const ruleId of RULES) {
    it(`${ruleId} reports the call that passes a same-file const object, and names the variable`, async() => {
      const results = await runs('a.ts', base, [ruleId]);
      const entry = results[0].entries.find(item => item.ruleId === ruleId);

      assert.equal(entry.severity, 'manual');
      assert.equal(entry.line, 6);
      assert.match(entry.message, /`base`/);
      assert.match(entry.message, /columnHeaders/);
      assert.ok(results[0].output.split('\n').findIndex(row => row.includes(`${TODO} ${ruleId})`))
        === results[0].output.split('\n').findIndex(row => row.includes('plugin.downloadFile')) - 1,
      'the TODO stands right above the call');
      assertStable(results, ruleId);
    });
  }

  it('reports a member read of a const object and a let object the same way, and a spread-free object only', async() => {
    const source = `${HOT}const opts = { csv: { columnHeaders: true } };
const hot = new Handsontable(document.body, { exportFile: true });

hot.getPlugin('exportFile').exportAsString('csv', opts.csv);
`;
    const [first] = await runs('a.js', source, ['19.0.0/export-column-headers']);

    assert.deepEqual(lines(first, '19.0.0/export-column-headers'), ['manual:5']);
  });

  it('is silent for an object that does not set the key, an unresolved argument, and another receiver', async() => {
    const source = `${HOT}import { settings } from './settings';
const plain = { filename: 'trades' };
const chart = { downloadFile(kind, options) {} };
const base = { columnHeaders: true };

export function save(hot, other) {
  const plugin = hot.getPlugin('exportFile');

  plugin.downloadFile('csv', plain);
  plugin.downloadFile('csv', settings);
  plugin.downloadFile('csv', other);
  chart.downloadFile('png', base);
}
`;
    const [first] = await runs('a.js', source, ['19.0.0/export-column-headers']);

    assert.deepEqual(lines(first, '19.0.0/export-column-headers'), []);
  });

  it('keeps renaming an inline object, and spelling the plugin key with a capital letter', async() => {
    const source = `${HOT}export function save(hot) {
  hot.getPlugin('exportFile').exportAsBlob('csv', { columnHeaders: false });
  hot.getPlugin('ExportFile').exportAsBlob('csv', { columnHeaders: false });
  hot.getPlugin('ExportFile').downloadFile('csv', { filename: 'a', columnHeaders: true });
}
`;
    const [first] = await runs('a.js', source, ['19.0.0/export-column-headers']);

    assert.deepEqual(lines(first, '19.0.0/export-column-headers'), ['changed:3', 'changed:4', 'changed:5']);
    assert.equal(first.output.match(/colHeaders/g).length, 3);
    assert.doesNotMatch(first.output, /columnHeaders/);
  });
});

describe('19.0.0/resize-state-methods on a call it keeps', () => {
  const RULE = '19.0.0/resize-state-methods';

  it('names the method in the TODO and in the entry, for a plugin the file cannot confirm', async() => {
    const source = `${HOT}const pluginName = 'manualRowResize';
export function save(hot) {
  hot.getPlugin(pluginName).saveManualRowHeights();
  hot.getPlugin('manualColumnResize').loadManualColumnWidths();
}
`;
    const results = await runs('a.js', source, [RULE]);
    const [entry] = results[0].entries.filter(item => item.ruleId === RULE);
    const todos = results[0].output.split('\n').filter(row => row.includes(TODO));

    assert.deepEqual(lines(results[0], RULE), ['manual:4', 'changed:5']);
    assert.match(entry.message, /^Replace saveManualRowHeights\(\) with your own store/);
    assert.equal(todos.length, 1);
    assert.ok(todos[0].includes(`${TODO} ${RULE}): Replace saveManualRowHeights() with your own store`));
    assertStable(results, RULE);
  });

  it('names the method for a result that is used and for a call with no braces', async() => {
    const source = `${HOT}export function save(hot) {
  const columns = hot.getPlugin('manualColumnResize');
  const widths = columns.loadManualColumnWidths();

  if (widths) columns.saveManualColumnWidths();
}
`;
    const [first] = await runs('a.js', source, [RULE]);
    const todos = first.output.split('\n').filter(row => row.includes(TODO));

    assert.equal(todos.length, 2);
    assert.match(todos[0], /Remove loadManualColumnWidths\(\) by hand/);
    assert.match(todos[1], /Remove saveManualColumnWidths\(\) by hand/);
  });
});

describe('a kept call that is the whole body of a statement without braces', () => {
  const RULE = '19.0.0/resize-state-methods';

  it('gets its TODO above the statement, which recast prints over two lines (a documented limitation), and stays stable', async() => {
    const source = `${HOT}export function save(hot, ready) {
  const columns = hot.getPlugin('manualColumnResize');

  if (ready) columns.saveManualColumnWidths();
}
`;
    const results = await runs('a.js', source, [RULE]);
    const rows = results[0].output.split('\n');
    const at = rows.findIndex(row => row.includes(`${TODO} ${RULE})`));

    assert.equal(rows[at + 1], '  if (ready)');
    assert.equal(rows[at + 2], '    columns.saveManualColumnWidths();');
    assert.equal(results[1].changed, false);
    assert.equal(results[2].changed, false);
  });
});

describe('the fields of the new detect forms', () => {
  it('check pluginRegistration, withoutPlugin, and precheck', async() => {
    const { validateDetectRule } = await import('../src/transforms/detect.mjs');
    const base = { id: 'x/r', kind: 'detect', files: ['js'], message: 'm', match: { pluginRegistration: 'Loading' } };

    assert.deepEqual(validateDetectRule(base), []);
    assert.deepEqual(validateDetectRule({ ...base,
      match: { pluginRegistration: 'Loading', withoutPlugin: 'Dialog' } }), []);
    assert.match(validateDetectRule({ ...base, match: { pluginRegistration: '' } })[0], /pluginRegistration must be/);
    assert.match(validateDetectRule({ ...base, match: { pluginRegistration: 'A', withoutPlugin: 1 } })[0],
      /withoutPlugin must be/);
    assert.match(validateDetectRule({ ...base, files: ['js', 'css'] })[0], /reads js only/);
    assert.deepEqual(validateDetectRule({ ...base, requires: 'none', precheck: 'key' }), []);
    assert.match(validateDetectRule({ ...base, precheck: 'key' })[0], /goes with "requires": "none"/);
    assert.match(validateDetectRule({ ...base, requires: 'none', precheck: '(' })[0], /not a valid regular expression/);
  });
});

describe('19.0.0/checked-menu-item-property reads menu items, not every object with a checked key', () => {
  const RULE = '19.0.0/checked-menu-item-property';

  it('reports the items of contextMenu and dropdownMenu in every form they take', async() => {
    const source = `${HOT}const grid = new Handsontable(el, {
  contextMenu: {
    items: {
      sync: { name: 'Sync', checked: true, callback() {} },
      plain: { checked: () => false },
      sub: { name: 'More', submenu: { items: { deep: { key: 'deep', checked: 'mixed' } } } },
    },
  },
  dropdownMenu: ['filter_by_value', { key: 'flag', name: 'Flag', checked: true }, { name: 'Other', checked: false }],
});
const detached = { name: 'Detached', callback() {}, checked: true };
`;
    const [first] = await runs('a.js', source, [RULE]);

    // Line 7 holds the submenu item too, and one entry per line is reported.
    assert.deepEqual(lines(first, RULE), ['manual:5', 'manual:6', 'manual:7', 'manual:10', 'manual:12']);
  });

  it('reports a menu defined in JSX and in an items array', async() => {
    const source = `import { HotTable } from '@handsontable/react-wrapper';
export const A = () => (
  <HotTable
    data={[]}
    contextMenu={{ items: [{ name: 'Sync', checked: true }] }}
    dropdownMenu={['filter_by_value', { key: 'flag', name: 'Flag', checked: true }]}
  />
);
`;
    const [first] = await runs('a.tsx', source, [RULE]);

    assert.deepEqual(lines(first, RULE), ['manual:5', 'manual:6']);
  });

  it('is silent for a checked key of an object that is no menu item, in a file that has a menu', async() => {
    const source = `${HOT}export const editorState = { undo: false, checked: true };
export const item = { key: 'x', checked: true };
new Handsontable(el, {
  contextMenu: ['row_above', 'row_below'],
  columns: [{ type: 'checkbox', checked: true }],
  cells() { return { checked: true }; },
});
`;
    const [first] = await runs('a.js', source, [RULE]);

    assert.deepEqual(lines(first, RULE), []);
  });

  it('rejects the menu-item place for a rule that reads templates', async() => {
    const { validateDetectRule } = await import('../src/transforms/detect.mjs');
    const rule = {
      id: 'x/r',
      kind: 'detect',
      files: ['js', 'template'],
      message: 'm',
      match: { property: 'checked', in: 'menu-item' },
    };

    assert.match(validateDetectRule(rule)[0], /in "menu-item" reads js only/);
    assert.match(validateDetectRule({ ...rule, files: ['js'], match: { property: 'checked', in: 'menu' } })[0],
      /in must be "option-object" or "menu-item"/);
  });
});

describe('19.0.0/dropdown-strict-false in templates', () => {
  const RULE = '19.0.0/dropdown-strict-false';

  it('reports a bound strict=false attribute of a dropdown column in a Vue template', async() => {
    const source = `<template>
  <HotTable :settings="settings">
    <HotColumn data="side" type="dropdown" :source="['Buy', 'Sell']" :strict="false" />
    <HotColumn data="flag" type="dropdown" :source="['Buy']" :strict="true" />
    <HotColumn data="text" type="dropdown" :source="['Buy']" strict="false" />
  </HotTable>
</template>

<script setup lang="ts">
import { HotTable, HotColumn } from '@handsontable/vue3';
const settings = { licenseKey: 'k' };
</script>
`;
    const results = await runs('A.vue', source, [RULE]);

    assert.deepEqual(lines(results[0], RULE), ['manual:3']);
    assertStable(results, RULE);
  });

  it('reports an Angular binding, and stays silent when the template has no dropdown', async() => {
    const page = type => `<!-- handsontable -->\n<hot-table [settings]="s">\n  <hot-column type="${type}" `
      + '[strict]="false"></hot-column>\n</hot-table>\n';
    const dropdown = page('dropdown');
    const none = page('text');

    assert.deepEqual(lines((await runs('a.html', dropdown, [RULE]))[0], RULE), ['manual:3']);
    assert.deepEqual(lines((await runs('a.html', none, [RULE]))[0], RULE), []);
  });
});

describe('19.0.0/loading-without-dialog follows what the file imports, not the local names', () => {
  const RULE = '19.0.0/loading-without-dialog';
  const BASE = 'import Handsontable from \'handsontable/base\';\n';

  it('reports a Loading plugin imported under another name and registered without Dialog', async() => {
    const source = `${BASE}import { registerPlugin, Loading as LoadingPlugin } from 'handsontable/plugins';
registerPlugin(LoadingPlugin);
new Handsontable(document.body, { loading: true });
`;
    const results = await runs('a.js', source, [RULE]);

    assert.deepEqual(lines(results[0], RULE), ['manual:3']);
    assertStable(results, RULE);
  });

  it('reports the plain name, a namespace import, a plugin entry point, and a renamed registerPlugin', async() => {
    const source = `${BASE}import { registerPlugin as register, Loading } from 'handsontable/plugins';
import * as plugins from 'handsontable/plugins';
import { Loading as Own } from 'handsontable/plugins/loading';
register(Loading);
plugins.registerPlugin(plugins.Loading);
register(Own);
`;
    const [first] = await runs('a.js', source, [RULE]);

    assert.deepEqual(lines(first, RULE), ['manual:5', 'manual:6', 'manual:7']);
  });

  it('is silent when the file registers Dialog, under any local name', async() => {
    const alias = `${BASE}import { registerPlugin, Loading, Dialog as DialogPlugin } from 'handsontable/plugins';
registerPlugin(Loading);
registerPlugin(DialogPlugin);
`;
    const namespaced = `${BASE}import * as plugins from 'handsontable/plugins';
plugins.registerPlugin(plugins.Loading);
plugins.registerPlugin(plugins.Dialog);
`;

    assert.deepEqual(lines((await runs('a.js', alias, [RULE]))[0], RULE), []);
    assert.deepEqual(lines((await runs('a.js', namespaced, [RULE]))[0], RULE), []);
  });

  it('is not fooled by a local name that only spells Loading or Dialog', async() => {
    const other = `${BASE}import { registerPlugin } from 'handsontable/plugins';
import { Loading } from './my-loading';
registerPlugin(Loading);
`;
    const decoy = `${BASE}import { registerPlugin, Loading } from 'handsontable/plugins';
import { Dialog } from './my-dialog';
registerPlugin(Loading);
registerPlugin(Dialog);
`;
    const text = `${BASE}import { registerPlugin, Loading } from 'handsontable/plugins';
// registerPlugin(Dialog) would go here
registerPlugin(Loading);
`;

    assert.deepEqual(lines((await runs('a.js', other, [RULE]))[0], RULE), []);
    assert.deepEqual(lines((await runs('a.js', decoy, [RULE]))[0], RULE), ['manual:4']);
    assert.deepEqual(lines((await runs('a.js', text, [RULE]))[0], RULE), ['manual:4']);
  });
});

describe('Handsontable.helper.sanitize through an alias of the namespace', () => {
  const RULE = '19.0.0/helper-sanitize';

  it('reports a call on a destructured helper and a call on a destructured function', async() => {
    const source = `import HT from 'handsontable';
const { helper } = HT;
const { sanitize } = helper;

export const a = helper.sanitize('<i>a</i>');
export const b = sanitize('<i>b</i>');
export const c = HT.helper.sanitize('<i>c</i>');
`;
    const results = await runs('a.js', source, [RULE]);

    assert.deepEqual(lines(results[0], RULE), ['manual:5', 'manual:6', 'manual:7']);
    assert.equal(results[0].output.split(TODO).length - 1, 3);
    assertStable(results, RULE);
  });

  it('reports a reference without a call, and an exported alias whose uses are in other files', async() => {
    const source = `import HT from 'handsontable';
import DOMPurify from 'dompurify';
const { helper: tools } = HT;

export const sanitizer = HT.helper.sanitize;
export const { sanitize } = HT.helper;
export const clean = tools.sanitize;
export const other = DOMPurify.sanitize('<b>e</b>');
export const kept = HT.helper.isDate;
`;
    const results = await runs('a.js', source, [RULE]);

    assert.deepEqual(lines(results[0], RULE), ['manual:5', 'manual:6', 'manual:7']);
    assertStable(results, RULE);
  });

  it('stays silent for a local alias that nothing reads, another object, and a name that only looks alike', async() => {
    const source = `import HT from 'handsontable';
import DOMPurify from 'dompurify';
const helper = { sanitize: value => value };
const { sanitize } = DOMPurify;
const unused = HT.helper.sanitize;

export const a = helper.sanitize('x');
export const b = sanitize('x');
export const c = DOMPurify.sanitize('x');
`;
    const [first] = await runs('a.js', source, [RULE]);

    assert.deepEqual(lines(first, RULE), []);
  });

  it('does not take a destructured name of another object for the helper', async() => {
    const source = `import HT from 'handsontable';
import utils from './utils';
const { helper } = utils;

export const a = helper.sanitize('x');
export const b = new HT(document.body, {});
`;
    const [first] = await runs('a.js', source, [RULE]);

    assert.deepEqual(lines(first, RULE), []);
  });
});
