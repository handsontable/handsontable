import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { VERSIONS_DIR, buildPlan, loadManifests } from '../src/manifest.mjs';
import {
  expandAdvice,
  matchDotted,
  moduleMatcher,
  optionKeyOf,
  pluginOfModule,
  toList,
} from '../src/lib/type-rules.mjs';
import { transformFile } from '../src/runner.mjs';
import { guidePath, skipWithoutGuides } from './helpers/guide-source.mjs';

const manifests = await loadManifests();
// The type rules of the first migration that has them: the version of the tests below that name its rules.
const manifest = manifests.find(item => item.rules.some(rule => rule.id.endsWith('/type-exportfile-settings')));
const VERSION = manifest.version;
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
 * - `Handsontable.helper.*` functions: removed from the typings only. The runtime never set them on the namespace
 *   (see the `18.0.0/helper-typings-only` detect rule), so a type rule has nothing to rewrite.
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
 * Every removed export of every entry point in a generated diff, as `[entry point, name]`.
 *
 * @param {object} [source] The diff. Defaults to the diff of the version the tests below name.
 * @returns {Array<[string, string]>} The pairs.
 */
function removedExports(source = diff) {
  const pairs = [];

  for (const entry of source.entryPoints.removed) {
    entry.exports.forEach(item => pairs.push([entry.specifier, item.name]));
  }

  for (const [specifier, entry] of Object.entries(source.entryPoints.changed)) {
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
  const selected = only.length ? buildPlan([manifest], only) : plan;

  return transformFile({ filePath, source, plan: selected, options: { markers: false } });
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

  it('points every guide anchor at a heading of the migration guide', async(context) => {
    if (skipWithoutGuides(context, [manifest])) {
      return;
    }

    const guide = await readFile(guidePath(manifest), 'utf8');
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

describe('every migration covers what its exports diff removed', () => {
  for (const item of manifests) {
    const file = join(VERSIONS_DIR, item.version, 'exports-diff.generated.json');
    const available = existsSync(file);

    it(`covers every removed export and namespace member of ${item.version}`, { skip: !available && 'no exports diff' },
      async() => {
        const versionDiff = JSON.parse(await readFile(file, 'utf8'));
        const versionRules = item.rules.filter(rule => TYPE_KINDS.includes(rule.kind));
        const first = item.version === VERSION;
        const uncovered = removedExports(versionDiff)
          .filter(([specifier, name]) => !versionRules.some(rule => coversExport(rule, specifier, name))
            && !(first && ALLOWED_EXPORTS.has(`${specifier} ${name}`)))
          .map(([specifier, name]) => `${specifier} ${name}`);
        const members = (versionDiff.namespace?.removed ?? [])
          .filter(entry => !versionRules.some(rule => coversMember(rule, entry.path))
            && !(first && ALLOWED_NAMESPACE.has(entry.path)))
          .map(entry => `${entry.path} (${entry.space})`);

        assert.deepEqual(uncovered, [], `exports without a rule:\n${uncovered.join('\n')}`);
        assert.deepEqual(members, [], `namespace members without a rule:\n${members.join('\n')}`);
      });
  }

  it('has an exports diff for at least one migration', () => {
    assert.ok(manifests.some(item => existsSync(join(VERSIONS_DIR, item.version, 'exports-diff.generated.json'))));
  });
});

describe('notes of type rules', () => {
  /**
   * The `manual` entries a run of the real rules reports for a snippet, with their `scope`.
   *
   * @param {string} source File text.
   * @returns {Promise<Array<{ruleId: string, scope: string|undefined}>>} The note entries.
   */
  async function notesOf(source) {
    const result = await run('a.ts', source);

    return result.entries.filter(entry => entry.severity === 'manual').map(entry => ({
      ruleId: entry.ruleId,
      scope: entry.scope,
    }));
  }

  it('marks the note of an importSource rule as a note for the whole run', async() => {
    const notes = await notesOf('import type { CellValue } from \'handsontable/common\';\nexport let a: CellValue;\n');

    assert.deepEqual(notes, [{ ruleId: `${VERSION}/common-imports`, scope: 'run' }]);
  });

  it('marks the note of an exportRename rule as a note for the whole run', async() => {
    const notes = await notesOf(
      'import type { Config } from \'handsontable/plugins/columnSorting\';\nexport let a: Config;\n'
    );

    assert.deepEqual(notes, [{ ruleId: `${VERSION}/type-columnsorting-config`, scope: 'run' }]);
  });

  it('marks the note of a namespaceType rule as a note for the whole run', async() => {
    const rule = manifest.rules.find(item => item.kind === 'namespaceType' && item.note);
    const member = toList(rule.from)[0].replaceAll('*', 'ColumnSorting');
    const notes = await notesOf(`import Handsontable from 'handsontable';\nexport let a: ${member};\n`);

    assert.ok(notes.length > 0 && notes.every(note => note.scope === 'run'), JSON.stringify(notes));
    assert.equal(notes[0].ruleId, rule.id);
  });
});

describe('exportRemoved lead sentence', () => {
  const base = {
    id: 'x/deprecated',
    kind: 'exportRemoved',
    version: 'x',
    safe: false,
    guideUrl: null,
    source: 'handsontable/plugins/*',
    name: 'Settings',
    advice: 'Use {plugin} settings instead.',
  };
  const sample = 'import type { Settings } from \'handsontable/plugins/autofill\';\nexport type A = Settings;\n';

  /**
   * Run an `exportRemoved` rule over the sample and return the report messages.
   *
   * @param {object} rule The rule.
   * @returns {Promise<string[]>} The messages.
   */
  async function messagesOf(rule) {
    const single = { versions: [{ version: 'x', rules: [rule] }], rulesById: new Map([[rule.id, rule]]) };
    const result = await transformFile({ filePath: 'a.ts', source: sample, plan: single, options: { markers: false } });

    return result.entries.map(entry => entry.message);
  }

  it('says the name is no longer exported unless the rule has a message', async() => {
    assert.deepEqual(await messagesOf(base), [
      'Settings is no longer exported from "handsontable/plugins/autofill". Use autofill settings instead.',
    ]);
  });

  it('lets a rule message replace that sentence, with the placeholders filled', async() => {
    const rule = { ...base, message: '{name} of {plugin} is deprecated and goes in 19.0.' };

    assert.deepEqual(await messagesOf(rule), [
      'Settings of autofill is deprecated and goes in 19.0. Use autofill settings instead.',
    ]);
  });
});

describe('type rule transforms', () => {
  it('does not leave a second semicolon after a directive when a merged import is removed', async() => {
    for (const quote of ['\'', '"']) {
      const directive = `${quote}use client${quote};`;
      const result = await run('a.ts', [
        directive,
        'import { RowObject } from \'handsontable\';',
        'import { CellValue } from \'handsontable/common\';',
        'export let a: CellValue | RowObject;',
        '',
      ].join('\n'));

      assert.equal(result.output, [
        directive,
        'import { RowObject, CellValue } from \'handsontable\';',
        'export let a: CellValue | RowObject;',
        '',
      ].join('\n'));
    }

    const kept = await run('a.ts',
      '\'use client\';;\nimport { CellValue } from \'handsontable/common\';\nlet a: CellValue;\n');

    assert.match(kept.output, /^'use client';;\n/);
  });

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
