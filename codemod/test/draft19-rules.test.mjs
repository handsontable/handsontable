import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { VERSIONS_DIR, buildPlan, loadManifests } from '../src/manifest.mjs';
import { COMMON_NAME_PRECHECK } from '../src/adapters/css.mjs';
import { transformFile } from '../src/runner.mjs';
import { inPlainProject, migrate } from './helpers/plain-project.mjs';

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
    const source = `${HOT}export function save() {
  const hot = new Handsontable(document.body, {});
  hot.getPlugin('exportFile').exportAsBlob('csv', { columnHeaders: false });
  hot.getPlugin('ExportFile').exportAsBlob('csv', { columnHeaders: false });
  hot.getPlugin('ExportFile').downloadFile('csv', { filename: 'a', columnHeaders: true });
}
`;
    const [first] = await runs('a.js', source, ['19.0.0/export-column-headers']);

    assert.deepEqual(lines(first, '19.0.0/export-column-headers'), ['changed:4', 'changed:5', 'changed:6']);
    assert.equal(first.output.match(/colHeaders/g).length, 3);
    assert.doesNotMatch(first.output, /columnHeaders/);
  });
});

describe('19.0.0/resize-state-methods on a call it keeps', () => {
  const RULE = '19.0.0/resize-state-methods';

  it('names the method in the TODO and in the entry, for a plugin the file cannot confirm', async() => {
    const source = `${HOT}const pluginName = 'manualRowResize';
export function save() {
  const hot = new Handsontable(document.body, {});
  hot.getPlugin(pluginName).saveManualRowHeights();
  hot.getPlugin('manualColumnResize').loadManualColumnWidths();
}
`;
    const results = await runs('a.js', source, [RULE]);
    const [entry] = results[0].entries.filter(item => item.ruleId === RULE);
    const todos = results[0].output.split('\n').filter(row => row.includes(TODO));

    assert.deepEqual(lines(results[0], RULE), ['manual:5', 'changed:6']);
    assert.match(entry.message, /^Replace saveManualRowHeights\(\) with your own store/);
    assert.equal(todos.length, 1);
    assert.ok(todos[0].includes(`${TODO} ${RULE}): Replace saveManualRowHeights() with your own store`));
    assertStable(results, RULE);
  });

  it('names the method for a result that is used and for a call with no braces', async() => {
    const source = `${HOT}export function save() {
  const hot = new Handsontable(document.body, {});
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

  it('gets its TODO on the line above and keeps the statement on its own line, and stays stable', async() => {
    const source = `${HOT}export function save(ready) {
  const hot = new Handsontable(document.body, {});
  const columns = hot.getPlugin('manualColumnResize');

  if (ready) columns.saveManualColumnWidths();
}
`;
    const results = await runs('a.js', source, [RULE]);
    const rows = results[0].output.split('\n');
    const at = rows.findIndex(row => row.includes(`${TODO} ${RULE})`));

    assert.equal(rows[at - 1], '');
    assert.equal(rows[at + 1], '  if (ready) columns.saveManualColumnWidths();');
    assert.equal(rows[at + 2], '}');
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
    assert.deepEqual(lines(first, RULE), ['review:5', 'review:6', 'review:7', 'review:10', 'review:12']);
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

    assert.deepEqual(lines(first, RULE), ['review:5', 'review:6']);
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

    assert.deepEqual(lines(results[0], RULE), ['review:3']);
    assertStable(results, RULE);
  });

  it('reports an Angular binding, and stays silent when the template has no dropdown', async() => {
    const page = type => `<!-- handsontable -->\n<hot-table [settings]="s">\n  <hot-column type="${type}" `
      + '[strict]="false"></hot-column>\n</hot-table>\n';
    const dropdown = page('dropdown');
    const none = page('text');

    assert.deepEqual(lines((await runs('a.html', dropdown, [RULE]))[0], RULE), ['review:3']);
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

describe('Handsontable.helper.sanitize in a run that holds both migrations', () => {
  const OLD = '18.0.0/helper-sanitize';
  const NEW = '19.0.0/helper-sanitize';
  const source = `${HOT}export const clean = Handsontable.helper.sanitize('<b>x</b>');\n`;

  it('reports the spot once, under the earlier rule, with what the later rule says', async() => {
    const [first] = await runs('a.js', source, [OLD, NEW]);
    const entries = first.entries.filter(entry => entry.severity === 'manual');

    assert.equal(entries.length, 1);
    assert.equal(entries[0].ruleId, OLD);
    assert.match(entries[0].message, /19\.0 removes it, so the call throws a TypeError\./);
    assert.match(entries[0].message, /came from 17\.x relied on the sanitizing/);
  });

  it('does not talk about 19.0 in a run of the 18.0 migration alone', async() => {
    const [first] = await runs('a.js', source, [OLD]);
    const [entry] = first.entries.filter(item => item.severity === 'manual');

    assert.equal(entry.ruleId, OLD);
    assert.doesNotMatch(entry.message, /19\.0|TypeError/);
  });

  it('leaves the marker of the earlier rule and changes nothing in runs 2 and 3', async() => {
    const [first, second, third] = await runs('a.js', source, [OLD, NEW]);

    assert.equal((first.output.match(/TODO\(handsontable-codemod/g) ?? []).length, 1, first.output);
    assert.ok(first.output.includes(`TODO(handsontable-codemod ${OLD}):`), first.output);
    assert.equal(second.changed, false);
    assert.equal(third.changed, false);
  });

  it('still says what 19.0 does in a run of the 19.0 migration alone', async() => {
    const [first] = await runs('a.js', source, [NEW]);
    const [entry] = first.entries.filter(item => item.severity === 'manual');

    assert.equal(entry.ruleId, NEW);
    assert.match(entry.message, /19\.0 removes it, so the call throws a TypeError\./);
  });
});

describe('19.0.0/auto-row-size-use-headers says when the read still answers', () => {
  const RULE = '19.0.0/auto-row-size-use-headers';
  // `getSetting()` of a plugin merges the settings the grid gave over the defaults, so a key the grid sets is returned
  // although the default is gone.
  const source = `${HOT}const hot = new Handsontable(el, { autoRowSize: { useHeaders: false } });\n`
    + 'const used = hot.getPlugin(\'autoRowSize\').getSetting(\'useHeaders\');\n';

  it('says that the read returns undefined unless the grid sets the key in the autoRowSize option', async() => {
    const [first] = await runs('a.js', source, [RULE]);
    const [entry] = first.entries.filter(item => item.ruleId === RULE);

    assert.match(entry.message, /returns undefined, unless you set it in the autoRowSize option\./);
  });
});

describe('19.0.0/icon-pseudo-element-selectors in a stylesheet with no other mark of Handsontable', () => {
  const RULE = '19.0.0/icon-pseudo-element-selectors';
  const GENERIC = ['changeType', 'collapsibleIndicator', 'columnSorting.sortAction'];
  const UNIQUE = ['htAutocompleteArrow', 'htUISelectCaption', 'ht-page-first', 'ht-page-prev', 'ht-page-next',
    'ht-page-last', 'ht-page-size-section__select-wrapper', 'ht-multi-select-chip-remove', 'ht-notification__close',
    'htCheckboxRendererInput', 'htUIRadio', 'ht-multi-select-editor-item-selected', 'ht_nestingButton',
    'htDropdownMenu .htItemWrapper span.selected', 'htSubmenu .htItemWrapper', 'th.beforeHiddenColumn',
    'th.afterHiddenColumn', 'th.beforeHiddenRow', 'th.afterHiddenRow'];

  /**
   * The `severity:line` texts that the rule reports in a file.
   *
   * @param {string} filePath File name.
   * @param {string} source File text.
   * @returns {Promise<string[]>} The entries.
   */
  async function reported(filePath, source) {
    const results = await runs(filePath, source, [RULE]);

    // A marker the first run wrote is not a mark of Handsontable: the next runs report the same classes, each one
    // line lower (the marker is a line of its own).
    const classes = result => lines(result, RULE).map(item => item.split(':')[0]);

    assert.deepEqual(classes(results[1]), classes(results[0]));
    assert.deepEqual(classes(results[2]), classes(results[0]));
    assert.equal(results[1].changed, false);

    return lines(results[0], RULE);
  }

  it('reads a class of Handsontable alone as a Handsontable stylesheet (manual), also with no other mark', async() => {
    for (const name of UNIQUE) {
      assert.deepEqual(await reported('a.css', `.${name}::before { content: ''; }\n`), ['manual:1'], name);
    }
  });

  it('reports a common name as review in a stylesheet that names nothing else, and keeps the other class silent', async() => {
    const source = '.changeType::before { color: red; }\n.my-card::before { content: ""; }\n'
      + '.changeType { color: red; }\n';

    assert.deepEqual(await reported('a.css', source), ['review:1']);
    assert.deepEqual(await reported('a.scss', source), ['review:1']);

    for (const name of GENERIC) {
      assert.deepEqual(await reported('a.css', `.${name}::after { color: red; }\n`), ['review:1'], name);
    }

    assert.deepEqual(await reported('a.css', '.my-card::before { content: ""; }\n'), []);
  });

  it('reports a common name as manual once the stylesheet has a mark of Handsontable of its own', async() => {
    const marks = ['a { color: var(--ht-foreground-color); }', '.htCore { margin: 0; }',
      '.ht-theme-main { margin: 0; }',
      '.ht_master { margin: 0; }', '/* The Handsontable grid. */', '.pika-single { margin: 0; }'];

    for (const mark of marks) {
      assert.deepEqual(await reported('a.css', `${mark}\n.changeType::before { color: red; }\n`), ['manual:2'], mark);
    }
  });

  it('does not count its own comment as a mark of Handsontable', async() => {
    const [first] = await runs('a.css', '.changeType::before { color: red; }\n', [RULE]);

    assert.ok(first.output.includes(TODO), 'the review entry is marked in the code');
    assert.deepEqual(lines(first, RULE), ['review:1']);
    assert.deepEqual(lines(await transformFile({ filePath: 'a.css',
      source: first.output,
      plan: buildPlan(manifests, [RULE]) }), RULE), ['review:2']);
  });

  it('reads a common name in a script as before: only in a file that uses Handsontable', async() => {
    assert.deepEqual(await reported('a.js', 'const css = ".changeType::before { color: red; }";\n'), []);
    assert.deepEqual(await reported('a.js', `${HOT}const css = ".changeType::before { color: red; }";\n`),
      ['manual:2']);
  });

  it('is checked on load: unmarked needs a css file, hot-file, a precheck, and a review or warning message', async() => {
    const { validateDetectRule } = await import('../src/transforms/detect.mjs');
    const base = {
      id: 'x/r',
      kind: 'detect',
      files: ['css'],
      message: 'm',
      match: { selector: 'a' },
      precheck: 'a',
      unmarked: { severity: 'review', message: 'n' },
    };

    assert.deepEqual(validateDetectRule(base), []);
    assert.deepEqual(validateDetectRule({ ...base,
      requires: 'hot-file',
      unmarked: { severity: 'warning', message: 'n' } }), []);
    assert.match(validateDetectRule({ ...base, unmarked: 'review' })[0], /must be an object/);
    assert.match(validateDetectRule({ ...base, unmarked: { severity: 'manual', message: 'n' } })[0],
      /severity" must be review or warning/);
    assert.match(validateDetectRule({ ...base, unmarked: { severity: 'review' } })[0], /message" is required/);
    assert.match(validateDetectRule({ ...base, unmarked: { severity: 'review', message: 'n', extra: 1 } })[0],
      /unknown field "extra"/);
    assert.match(validateDetectRule({ ...base, files: ['js'] })[0],
      /goes with "requires": "hot-file" and a "files" list/);
    assert.match(validateDetectRule({ ...base, requires: 'none' })[0], /goes with "requires": "hot-file"/);
    assert.match(validateDetectRule({ ...base, precheck: undefined })[0], /needs a "precheck"/);
  });
});

describe('19.0.0/sr-sp-language-code and the files of the language', () => {
  const RULE = '19.0.0/sr-sp-language-code';
  const SCRIPT = '19.0.0/sr-sp-language-script';
  const PUBLISHED = ['handsontable/i18n/languages/sr-SP', 'handsontable/i18n/languages/sr-SP.js',
    'handsontable/i18n/languages/sr-SP.mjs', 'handsontable/languages/sr-SP', 'handsontable/languages/sr-SP.js',
    'handsontable/languages/sr-SP.mjs', 'handsontable/dist/languages/sr-SP.js',
    'handsontable/dist/languages/sr-SP.min.js'];

  it('reports every published path of the file as a side-effect import, a default import, require(), and import()', async() => {
    const plan = buildPlan(manifests, [RULE]);

    for (const path of PUBLISHED) {
      for (const text of [`import '${path}';\n`, `import serbian from '${path}';\n`,
        `const serbian = require('${path}');\n`,
        `const serbian = await import('${path}');\n`]) {
        const result = await transformFile({ filePath: 'a.js', source: text, plan });

        assert.deepEqual(result.entries.map(entry => entry.line), [1], text);
      }
    }
  });

  it('does not report the new file, a longer name, or a path of another package', async() => {
    const plan = buildPlan(manifests, [RULE]);
    const names = ['handsontable/languages/sr-Latn-RS.js', 'handsontable/i18n/languages/sr-Latn-RS',
      'handsontable/dist/languages/sr-Latn-RS.min.js', 'handsontable/languages/sr-SPA.js',
      'handsontable/languages/sr-SP.json', 'other/languages/sr-SP.js', './languages/sr-SP.js'];

    for (const name of names) {
      const result = await transformFile({ filePath: 'a.js', source: `${HOT}import '${name}';\n`, plan });

      assert.deepEqual(result.entries, [], name);
    }
  });

  it('reports the script tag of a page for the published files, and nothing else', async() => {
    const plan = buildPlan(manifests, [SCRIPT]);
    const report = async(src, tag = 'script') => (await transformFile({
      filePath: 'a.html', source: `<${tag} src="${src}"></${tag}>\n`, plan,
    })).entries.map(entry => entry.line);

    for (const src of ['https://cdn.jsdelivr.net/npm/handsontable/dist/languages/sr-SP.min.js',
      'https://cdn.jsdelivr.net/npm/handsontable@18.1.3/dist/languages/sr-SP.js',
      'https://unpkg.com/handsontable/dist/languages/sr-SP.js', '/node_modules/handsontable/languages/sr-SP.mjs',
      'node_modules/handsontable/i18n/languages/sr-SP.js']) {
      assert.deepEqual(await report(src), [1], src);
    }

    for (const src of ['https://cdn.jsdelivr.net/npm/handsontable/dist/languages/sr-Latn-RS.min.js',
      './languages/sr-SP.js', 'https://cdn.jsdelivr.net/npm/handsontable/dist/languages/sr-SP.min.js.map',
      'https://example.com/handsontable/dist/handsontable.js']) {
      assert.deepEqual(await report(src), [], src);
    }
  });
});

describe('19.0.0/icon-pseudo-element-selectors reads a nested selector as resolved', () => {
  const RULE = '19.0.0/icon-pseudo-element-selectors';
  const HOT_SCSS = '.htAutocompleteArrow { color: red; }\n';

  /**
   * Report lines and classes of the rule for a file.
   *
   * @param {string} filePath File name.
   * @param {string} source File text.
   * @returns {Promise<string[]>} `line:severity` for each entry.
   */
  async function reported(filePath, source) {
    const result = await transformFile({ filePath, source, plan: buildPlan(manifests, [RULE]) });

    return result.entries.filter(entry => entry.ruleId === RULE).map(entry => `${entry.line}:${entry.severity}`);
  }

  it('keeps the precheck of the Vue adapter equal to the precheck of the rule', () => {
    const rule = manifests.flatMap(manifest => manifest.rules).find(item => item.id === RULE);

    assert.equal(COMMON_NAME_PRECHECK.source, rule.precheck);
    assert.equal(COMMON_NAME_PRECHECK.flags, 'i');
  });

  it('resolves & against every parent, through comma lists and at-rules, and a nested descendant', async() => {
    const cases = [
      ['.changeType { &::before {} }\n', ['1:review']],
      ['.changeType {\n  &:after {}\n}\n', ['2:review']],
      ['.a, .changeType {\n  &::before {}\n}\n', ['2:review']],
      ['.changeType {\n  @media print {\n    &::before {}\n  }\n}\n', ['3:review']],
      ['.page {\n  .changeType {\n    &::before {}\n    &:hover {}\n  }\n}\n', ['3:review']],
      ['.changeType {\n  .inner::before {}\n}\n', ['2:review']],
      ['.changeType {\n  &.active {}\n}\n', []],
      ['.my-card {\n  &::before {}\n}\n', []],
      ['.changeType::before {\n  &:hover {}\n}\n', ['1:review']],
    ];

    for (const [source, expected] of cases) {
      assert.deepEqual(await reported('a.scss', source), expected, source);
    }

    assert.deepEqual(await reported('a.css', '.changeType {\n  &::before {}\n}\n'), ['2:review']);
  });

  it('reports a nested selector as manual when the stylesheet names the grid anywhere', async() => {
    assert.deepEqual(await reported('a.scss', `${HOT_SCSS}.changeType {\n  &::before {}\n}\n`), ['3:manual']);
    assert.deepEqual(await reported('a.scss', '.htAutocompleteArrow {\n  &::after {}\n}\n'), ['2:manual']);
  });

  it('does not repeat a match inside a rule that matched on its own', async() => {
    const source = '.changeType::before {\n  a: b;\n  &:hover { c: d; }\n  .x { e: f; }\n}\n';

    assert.deepEqual(await reported('a.scss', source), ['1:review']);
  });

  it('counts a Vue file as a grid file when its template or script uses the wrapper, for every style block', async() => {
    const style = '<style lang="scss">\n.changeType {\n  &::before {}\n}\n</style>\n';
    const hot = '<template><hot-table :data="rows" /></template>\n';
    const imported = '<script setup>\nimport { HotTable } from \'@handsontable/vue3\';\n</script>\n';
    const plain = '<template><div /></template>\n<script setup>\nconst a = 1;\n</script>\n';

    assert.deepEqual(await reported('a.vue', hot + style), ['4:manual']);
    assert.deepEqual(await reported('a.vue', imported + style), ['6:manual']);
    assert.deepEqual(await reported('a.vue', plain + style), ['7:review']);
    assert.deepEqual(await reported('a.vue', style), ['3:review']);
  });

  it('reads each rule of a page style element at its own line, and judges a page by its marks', async() => {
    const page = (marks, head = '') => `<!doctype html>\n<html>\n<head>${head}\n<style>\n.changeType::before {}\n\n`
      + `.collapsibleIndicator::after {}\n</style>\n</head>\n<body>${marks}</body>\n</html>\n`;

    assert.deepEqual(await reported('a.html', page('')), ['5:review', '7:review']);
    assert.deepEqual(await reported('a.html', page('<hot-table></hot-table>')), ['5:manual', '7:manual']);
    assert.deepEqual(await reported('a.html', page('', '<link href="handsontable.min.css">')),
      ['5:manual', '7:manual']);
  });
});

describe('an HTML page with no mark of Handsontable is judged only in a project that depends on it', () => {
  const PAGE = '<!doctype html>\n<style>\n.changeType::before {}\n</style>\n';
  const ARGS = ['--from', '18.1', '--include-draft', '--only', '19.0.0/icon-pseudo-element-selectors', '--dry-run',
    '--json'];

  /**
   * The `severity:file:line` of every entry of a run over the files.
   *
   * @param {Record<string, string>} files The project files.
   * @returns {Promise<string[]>} The entries.
   */
  async function entriesOf(files) {
    let found;

    await inPlainProject(files, async(dir) => {
      found = JSON.parse((await migrate(dir, ARGS)).stdout).entries
        .map(entry => `${entry.severity}:${entry.file}:${entry.line}`);
    });

    return found;
  }

  it('reports it for review when a package.json above it declares handsontable or a wrapper', async() => {
    const declares = name => `{ "dependencies": { "${name}": "^18.1.0" } }\n`;

    for (const name of ['handsontable', '@handsontable/react-wrapper', '@handsontable/vue3']) {
      assert.deepEqual(await entriesOf({ 'package.json': declares(name), 'pages/a.html': PAGE }),
        ['review:pages/a.html:3'], name);
    }

    assert.deepEqual(await entriesOf({ 'package.json': '{ "devDependencies": { "handsontable": "^18.1.0" } }\n',
      'a.html': PAGE }), ['review:a.html:3']);
  });

  it('says nothing for a page of a project that declares no Handsontable', async() => {
    assert.deepEqual(await entriesOf({ 'package.json': '{ "dependencies": { "react": "^18" } }\n', 'a.html': PAGE }),
      []);
    // A stylesheet has no such check: the run itself says the project uses Handsontable.
    assert.deepEqual(await entriesOf({ 'package.json': '{ "dependencies": { "react": "^18" } }\n',
      'a.css': '.changeType::before {}\n' }), ['review:a.css:1']);
  });

  it('judges a page with a mark of its own whatever the project declares', async() => {
    const page = `${PAGE}<hot-table></hot-table>\n`;

    assert.deepEqual(await entriesOf({ 'package.json': '{ "dependencies": { "react": "^18" } }\n', 'a.html': page }),
      ['manual:a.html:3']);
  });
});
