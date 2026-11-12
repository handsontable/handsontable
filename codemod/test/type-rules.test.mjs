import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { PACKAGE_ROOT, VERSIONS_DIR, buildPlan, loadManifest } from '../src/manifest.mjs';
import {
  expandAdvice,
  matchDotted,
  moduleMatcher,
  optionKeyOf,
  pluginOfModule,
  toList,
} from '../src/lib/type-rules.mjs';
import { transformFile } from '../src/runner.mjs';

const VERSION = '18.0.0';
const manifest = await loadManifest(join(VERSIONS_DIR, VERSION));
const plan = buildPlan([manifest]);
const diff = JSON.parse(await readFile(join(VERSIONS_DIR, VERSION, 'exports-diff.generated.json'), 'utf8'));
const TYPE_KINDS = ['importSource', 'exportRename', 'exportRemoved', 'namespaceType'];
const rules = manifest.rules.filter(rule => TYPE_KINDS.includes(rule.kind));
const NAMESPACE = 'Handsontable.';

/**
 * Names deliberately left without an import or type rule, by entry point. Empty: every removed export of every
 * entry point has a rule.
 *
 * @type {Map<string, string>}
 */
const ALLOWED_EXPORTS = new Map();

/**
 * Removed members of the `Handsontable` namespace that no rule of these four kinds covers, with the reason. They
 * are value members, not type positions, so a type rule has nothing to rewrite:
 *
 * - The theme registry functions and themes (`Handsontable.registerTheme` and the rest). The 17.1.0 runtime never
 *   set them on the namespace (it set `Handsontable.themes.registerTheme`), so no working code reads them there.
 * - `Handsontable.helper.*` functions: removed helpers. No rule of any kind covers them yet, and a type rule
 *   has nothing to rewrite.
 * - `sortByRelevance` statics, `baseVersion`, and the `RecordTranslation` namespace object: runtime members with
 *   no type position.
 *
 * @type {Map<string, string>}
 */
const ALLOWED_NAMESPACE = new Map([
  ...[
    'registerTheme',
    'reinitTheme',
    'getTheme',
    'getThemes',
    'getThemeNames',
    'hasTheme',
    'mainTheme',
    'classicTheme',
    'horizonTheme',
  ].map(name => [`${NAMESPACE}${name}`, 'theme registry value, never on the namespace at runtime']),
  ...[
    'error',
    'hasCaptionProblem',
    'info',
    'isIE',
    'isIE9',
    'isMSBrowser',
    'isValidDate',
    'log',
    'toSingleLine',
    'warn',
  ].map(name => [`${NAMESPACE}helper.${name}`, 'removed helper function, a value member']),
  [`${NAMESPACE}editors.AutocompleteEditor.sortByRelevance`, 'static method, a value member'],
  [`${NAMESPACE}cellTypes.autocomplete.editor.sortByRelevance`, 'static method, a value member'],
  [`${NAMESPACE}baseVersion`, 'value member'],
  [`${NAMESPACE}RecordTranslation`, 'namespace object, its type members have their own rules'],
]);

/**
 * Whether a rule covers an export of an entry point.
 *
 * @param {object} rule A loaded rule.
 * @param {string} specifier Entry point.
 * @param {string} name Export name.
 * @returns {boolean} `true` when the rule names the export.
 */
function coversExport(rule, specifier, name) {
  if (rule.kind === 'importSource') {
    return rule.from === specifier && Object.hasOwn(rule.exports, name);
  }

  if (rule.kind === 'exportRename') {
    return toList(rule.source).includes(specifier) && rule.from === name;
  }

  if (rule.kind === 'exportRemoved') {
    return moduleMatcher(rule.source, rule.except)(specifier) && toList(rule.name).includes(name);
  }

  return false;
}

/**
 * Whether a rule covers a member path of the `Handsontable` namespace.
 *
 * @param {object} rule A loaded rule.
 * @param {string} path Full path such as `Handsontable.plugins.Autofill.Settings`.
 * @returns {boolean} `true` when a `from` pattern of the rule matches.
 */
function coversMember(rule, path) {
  return rule.kind === 'namespaceType'
    && toList(rule.from).some(from => matchDotted(from.slice(NAMESPACE.length), path.slice(NAMESPACE.length)));
}

/**
 * Every removed export of every entry point in the generated diff, as `[entry point, name]`.
 *
 * @returns {Array<[string, string]>} The pairs.
 */
function removedExports() {
  const pairs = [];

  for (const entry of diff.entryPoints.removed) {
    entry.exports.forEach(item => pairs.push([entry.specifier, item.name]));
  }

  for (const [specifier, entry] of Object.entries(diff.entryPoints.changed)) {
    (entry.removed ?? []).forEach(item => pairs.push([specifier, item.name]));
  }

  return pairs;
}

/**
 * Slug the docs site gives a heading: the leading list number goes, punctuation goes without a hyphen, and
 * spaces become hyphens.
 *
 * @param {string} heading Heading text without the leading hashes.
 * @returns {string} Anchor without the `#`.
 */
function slug(heading) {
  return heading.replace(/^\d+\.\s+/, '').toLowerCase().replace(/[^a-z0-9 _-]/g, '').replace(/ /g, '-');
}

/**
 * Run a file through the real 18.0.0 rules.
 *
 * @param {string} filePath File name, which picks the adapter.
 * @param {string} source File text.
 * @param {string[]} [only] Rule ids to keep.
 * @returns {Promise<{output: string, changed: boolean, entries: object[]}>} The `transformFile` result.
 */
function run(filePath, source, only = []) {
  return transformFile({ filePath, source, plan: only.length ? buildPlan([manifest], only) : plan });
}

describe('type rule helpers', () => {
  it('matches a module pattern with one-segment wildcards and an exclusion list', () => {
    const matches = moduleMatcher('handsontable/plugins/*', ['handsontable/plugins/exportFile']);

    assert.equal(matches('handsontable/plugins/autofill'), true);
    assert.equal(matches('handsontable/plugins/exportFile'), false);
    assert.equal(matches('handsontable/plugins'), false);
    assert.equal(matches('handsontable/plugins/base/index'), false);
    assert.equal(moduleMatcher(['a.b', 'c'])('axb'), false);
    assert.equal(moduleMatcher(['a.b', 'c'])('c'), true);
  });

  it('matches dotted paths and returns what each wildcard matched', () => {
    assert.deepEqual(matchDotted('plugins.*.Settings', 'plugins.ColumnSorting.Settings'), ['ColumnSorting']);
    assert.equal(matchDotted('plugins.*.Settings', 'plugins.ColumnSorting.Config'), null);
    assert.equal(matchDotted('plugins.*.Settings', 'plugins.Settings'), null);
    assert.deepEqual(matchDotted('CellCoords', 'CellCoords'), []);
  });

  it('resolves option keys with a default, overrides, and null for no option', () => {
    const optionKeys = { Autofill: 'fillHandle', touchScroll: null };

    assert.equal(optionKeyOf('ColumnSorting', optionKeys), 'columnSorting');
    assert.equal(optionKeyOf('autofill', optionKeys), 'fillHandle');
    assert.equal(optionKeyOf('Autofill', optionKeys), 'fillHandle');
    assert.equal(optionKeyOf('TouchScroll', optionKeys), null);
    assert.equal(pluginOfModule('handsontable/plugins/columnSorting'), 'columnSorting');
    assert.equal(pluginOfModule('handsontable/settings'), null);
  });

  it('fills the advice placeholders and switches to the no-key advice', () => {
    const rule = {
      advice: 'Use GridSettings[\'{optionKey}\'] for {plugin}.',
      noKeyAdvice: '{plugin} has no option.',
      optionKeys: { autofill: 'fillHandle', touchScroll: null },
    };

    assert.equal(expandAdvice(rule, { plugin: 'autofill' }), 'Use GridSettings[\'fillHandle\'] for autofill.');
    assert.equal(expandAdvice(rule, { plugin: 'touchScroll' }), 'touchScroll has no option.');
    assert.equal(expandAdvice({ advice: '{name} from {source}' }, { name: 'A', source: 'b' }), 'A from b');
  });
});

describe('type rules of 18.0.0', () => {
  it('has the expected shape on every rule', () => {
    for (const rule of rules) {
      if (rule.kind === 'namespaceType') {
        assert.equal(typeof rule.to === 'object' && rule.removed === true, false, `${rule.id}: to and removed`);
        assert.ok(rule.to || rule.removed === true, `${rule.id}: needs to or removed`);
        toList(rule.from).forEach(from => assert.ok(from.startsWith(NAMESPACE), `${rule.id}: ${from}`));
      }

      if (rule.removed === true || rule.kind === 'exportRemoved') {
        assert.equal(typeof rule.advice, 'string', `${rule.id}: advice`);
        assert.equal(rule.safe, false, `${rule.id}: a removal needs review`);
      }

      assert.equal(typeof rule.safe, 'boolean', `${rule.id}: safe`);
    }
  });

  it('never leaves a placeholder unfilled in the advice of an export or member the diff lists', () => {
    for (const [specifier, name] of removedExports()) {
      for (const rule of rules.filter(item => coversExport(item, specifier, name) && item.advice)) {
        const text = expandAdvice(rule, { plugin: pluginOfModule(specifier), name, source: specifier });

        assert.doesNotMatch(text, /\{[a-zA-Z]+\}/, `${rule.id} for ${specifier} ${name}`);
      }
    }

    for (const item of diff.namespace.removed) {
      for (const rule of rules.filter(candidate => coversMember(candidate, item.path) && candidate.advice)) {
        const captures = toList(rule.from).map(from => matchDotted(from.slice(NAMESPACE.length),
          item.path.slice(NAMESPACE.length))).find(Boolean);
        const text = expandAdvice(rule, { plugin: captures?.[0] ?? null, name: item.path });

        assert.doesNotMatch(text, /\{[a-zA-Z]+\}/, `${rule.id} for ${item.path}`);
      }
    }
  });

  it('only advises GridSettings option keys that GridSettings really has', () => {
    const keys = new Set([
      'autoColumnSize', 'autoRowSize', 'fillHandle', 'bindRowsWithHeaders', 'collapsibleColumns', 'columnSorting',
      'columnSummary', 'comments', 'contextMenu', 'copyPaste', 'customBorders', 'dataProvider', 'dialog',
      'dragToScroll', 'dropdownMenu', 'emptyDataState', 'filters', 'formulas', 'hiddenColumns', 'hiddenRows',
      'loading', 'manualColumnFreeze', 'manualColumnMove', 'manualColumnResize', 'manualRowMove', 'manualRowResize',
      'mergeCells', 'multiColumnSorting', 'nestedHeaders', 'nestedRows', 'pagination', 'search', 'stretchH',
      'trimRows', 'undo',
    ]);
    const used = new Set();

    for (const [specifier, name] of removedExports()) {
      const rule = rules.find(item => item.kind === 'exportRemoved' && coversExport(item, specifier, name)
        && item.advice.includes('{optionKey}'));
      const plugin = pluginOfModule(specifier);

      if (rule && optionKeyOf(plugin, rule.optionKeys) !== null) {
        used.add(optionKeyOf(plugin, rule.optionKeys));
      }
    }

    assert.ok(used.size > 20, `only ${used.size} option keys used`);
    assert.deepEqual([...used].filter(key => !keys.has(key)), []);
  });

  it('covers every export the 17.1.0 to 18.0.0 diff removed', () => {
    const uncovered = removedExports()
      .filter(([specifier, name]) => !rules.some(rule => coversExport(rule, specifier, name))
        && !ALLOWED_EXPORTS.has(`${specifier} ${name}`))
      .map(([specifier, name]) => `${specifier} ${name}`);

    assert.deepEqual(uncovered, [], `exports without a rule:\n${uncovered.join('\n')}`);
  });

  it('covers every type member the diff removed from the Handsontable namespace', () => {
    const uncovered = diff.namespace.removed
      .filter(item => !rules.some(rule => coversMember(rule, item.path)) && !ALLOWED_NAMESPACE.has(item.path))
      .map(item => `${item.path} (${item.space})`);

    assert.deepEqual(uncovered, [], `namespace members without a rule:\n${uncovered.join('\n')}`);
  });

  it('allows only members that are value members and that the diff really lists', () => {
    const removed = new Map(diff.namespace.removed.map(item => [item.path, item.space]));

    for (const path of ALLOWED_NAMESPACE.keys()) {
      assert.ok(removed.has(path), `${path} is not removed in the diff`);
      assert.equal(removed.get(path), 'value', `${path} is not a value member`);
    }

    for (const key of ALLOWED_EXPORTS.keys()) {
      assert.ok(removedExports().some(([specifier, name]) => `${specifier} ${name}` === key), key);
    }
  });

  it('points every guide anchor at a heading of the migration guide', async() => {
    const guide = await readFile(join(PACKAGE_ROOT, '..', manifest.guide.source), 'utf8');
    const anchors = [...guide.matchAll(/^##+ (.+)$/gm)].map(match => slug(match[1]));

    for (const rule of rules.filter(item => item.guide)) {
      assert.ok(anchors.includes(rule.guide), `${rule.id} anchor ${rule.guide}`);
    }
  });

  it('keeps every rename source an entry point the diff knows as changed or removed', () => {
    const known = new Set([
      ...Object.keys(diff.entryPoints.changed),
      ...diff.entryPoints.removed.map(entry => entry.specifier),
    ]);

    for (const rule of rules.filter(item => item.kind === 'exportRename')) {
      toList(rule.source).forEach(source => assert.ok(known.has(source), `${rule.id}: ${source}`));
    }
  });

  it('renames only names the entry point really exported in 17.1.0 and no longer exports', () => {
    const aliases = [`${VERSION}/type-exportfile-settings`, `${VERSION}/type-dataprovider-options`];

    for (const rule of rules.filter(item => item.kind === 'exportRename' && !aliases.includes(item.id))) {
      toList(rule.source).forEach((source) => {
        const removed = (diff.entryPoints.changed[source]?.removed ?? []).map(item => item.name);

        assert.ok(removed.includes(rule.from), `${rule.id}: ${rule.from} is still exported from ${source}`);
      });
    }
  });

  it('keeps the two deprecated aliases that are renamed although they are still exported', () => {
    for (const [id, source, from] of [
      [`${VERSION}/type-exportfile-settings`, 'handsontable/plugins/exportFile', 'Settings'],
      [`${VERSION}/type-dataprovider-options`, 'handsontable/plugins/dataProvider', 'DataProviderOptions'],
    ]) {
      const rule = rules.find(item => item.id === id);
      const removed = (diff.entryPoints.changed[source]?.removed ?? []).map(item => item.name);

      assert.equal(rule.from, from);
      assert.equal(removed.includes(from), false, `${from} is removed from ${source}`);
    }
  });
});

describe('type rule transforms', () => {
  it('moves a name from handsontable/common to handsontable and keeps the alias and the import kind', async() => {
    const result = await run('a.ts', [
      'import { RowObject as Row } from \'handsontable/common\';',
      'import type { CellChange as Change } from \'handsontable/common\';',
      'export const a: Row | Change | null = null;',
      '',
    ].join('\n'));

    assert.equal(result.output, [
      'import { RowObject as Row } from \'handsontable\';',
      'import type { CellChange as Change } from \'handsontable\';',
      'export const a: Row | Change | null = null;',
      '',
    ].join('\n'));
  });

  it('skips a name whose local name the target scope already declares and reports it', async() => {
    const source = [
      'import { RowObject } from \'handsontable/common\';',
      'import { RowObject as Other } from \'handsontable\';',
      'const RowObject = 1;',
      'export { Other, RowObject };',
      '',
    ].join('\n');
    const result = await run('a.ts', source);

    assert.equal(result.changed, false);
    assert.ok(result.entries.some(entry => entry.severity === 'manual' && /already declared/.test(entry.message)));
  });

  it('adds a type import for an aliased namespace and leaves the namespace value alone', async() => {
    const result = await run('a.ts', [
      'import HOT from \'handsontable\';',
      'export let c: HOT.CellCoords;',
      'export const d = new HOT.CellCoords(0, 0);',
      '',
    ].join('\n'));

    assert.match(result.output, /import type \{ CellCoords \} from 'handsontable';/);
    assert.match(result.output, /export let c: CellCoords;/);
    assert.match(result.output, /new HOT\.CellCoords\(0, 0\)/);
  });

  it('reuses a CellCoords the file already imports, even under another name', async() => {
    const result = await run('a.ts', [
      'import Handsontable, { CellCoords as Coords } from \'handsontable\';',
      'export let c: Handsontable.CellCoords;',
      '',
    ].join('\n'));

    assert.equal(result.output, [
      'import Handsontable, { CellCoords as Coords } from \'handsontable\';',
      'export let c: Coords;',
      '',
    ].join('\n'));
  });

  it('flags the first matching removed rule only', async() => {
    const result = await run('a.ts', [
      'import type { Settings } from \'handsontable/plugins/nestedHeaders\';',
      'export let a: Settings;',
      '',
    ].join('\n'));
    const todos = result.output.split('\n').filter(line => line.startsWith('// TODO'));

    assert.equal(todos.length, 1);
    assert.match(todos[0], /type-nestedheaders-settings/);
    assert.match(todos[0], /NestedHeader\[\]\[\]/);
  });

  it('leaves a CommonJS require of a removed module as it is and reports it', async() => {
    const source = 'const common = require(\'handsontable/common\');\nexport { common };\n';
    const result = await run('a.ts', source);

    assert.equal(result.changed, false);
    assert.equal(result.entries.filter(entry => entry.severity === 'manual').length, 1);
  });
});
