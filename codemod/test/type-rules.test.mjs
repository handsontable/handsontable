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
 * Whether a rule covers a member path of the `Handsontable` namespace. A `namespaceType` rule covers a type member
 * by its `from` pattern. A `callUnwrap` rule covers the value member it unwraps, named by its `callee`.
 *
 * @param {object} rule A loaded rule.
 * @param {string} path Full path such as `Handsontable.plugins.Autofill.Settings`.
 * @returns {boolean} `true` when a `from` pattern or the `callee` of the rule matches.
 */
function coversMember(rule, path) {
  if (rule.kind === 'callUnwrap') {
    return toList(rule.callee).includes(path);
  }

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
    assert.equal(expandAdvice({ ...rule, noKeyAdvice: undefined }, { plugin: 'touchScroll' }),
      'Use GridSettings[\'\'] for touchScroll.', 'a plugin with no option never gets an invented key');
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
        const versionRules = item.rules.filter(rule => [...TYPE_KINDS, 'callUnwrap'].includes(rule.kind));
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

describe('every module a type rule sends a name to is one the new package exports it from', () => {
  // The entry points that the diff found a replacement in, and the main entry point. A misspelled alternate source,
  // which would write an import from a module that does not exist, is not among them.
  const entryPoints = new Set(['handsontable']);

  for (const candidate of diff.candidates) {
    candidate.matches.forEach(match => entryPoints.add(match.specifier));
  }

  /**
   * The modules a rule can write an import from.
   *
   * @param {object} rule A type rule.
   * @returns {string[]} The module specifiers.
   */
  function targetsOf(rule) {
    const targets = [];

    if (rule.kind === 'namespaceType') {
      targets.push(...toList(rule.to?.source ?? []));
    } else if (rule.kind === 'exportRename') {
      targets.push(...toList(rule.toSource ?? []));
    } else if (rule.kind === 'importSource') {
      Object.values(rule.exports).forEach(entry => targets.push(...toList(entry.to ?? [])));
    }

    return targets;
  }

  it('checks a good number of targets', () => {
    assert.equal(rules.flatMap(targetsOf).length >= 40, true);
    assert.equal(rules.filter(rule => rule.kind === 'namespaceType' && Array.isArray(rule.to?.source)).length, 6);
  });

  for (const rule of rules.filter(item => targetsOf(item).length > 0)) {
    it(`${rule.id} writes imports only from entry points of the new package`, () => {
      const unknown = targetsOf(rule).filter(target => !entryPoints.has(target));

      assert.deepEqual(unknown, []);
    });
  }

  for (const [member, name, source] of [
    ['CellCoords', 'CellCoords', 'handsontable/base'],
    ['SelectOptionsObject', 'SelectOptionsObject', 'handsontable/base'],
    ['SelectOptionsObject', 'SelectOptionsObject', 'handsontable/settings'],
    ['EditorType', 'EditorType', 'handsontable/base'],
    ['CellType', 'CellType', 'handsontable/base'],
    ['CellType', 'CellType', 'handsontable/cellTypes'],
    ['ThemeConfig', 'ThemeConfig', 'handsontable/base'],
    ['ThemeConfig', 'ThemeConfig', 'handsontable/themes'],
    ['RecordTranslation.IndexMapper', 'IndexMapper', 'handsontable/base'],
  ]) {
    it(`writes the import of Handsontable.${member} from ${source} for a file that imports from there`, async() => {
      const head = source === 'handsontable/base' ? `import Handsontable from '${source}';\n`
        : `import Handsontable from 'handsontable';\nimport type { ${name} } from '${source}';\n`;
      const result = await run('a.ts', `${head}export let a: Handsontable.${member};\n`);
      const expected = source === 'handsontable/base' ? `${head}import type { ${name} } from '${source}';\n`
        : head;

      assert.equal(result.output, `${expected}export let a: ${name};\n`);
    });
  }

  for (const rule of rules.filter(item => item.kind === 'namespaceType' && Array.isArray(item.to?.source))) {
    const from = toList(rule.from)[0];
    const member = from.slice(NAMESPACE.length);
    const name = rule.to.name ?? member.split('.').pop();

    for (const source of rule.to.source) {
      it(`${rule.id} reuses the import of ${name} that the file already has from ${source}`, async() => {
        const text = `import Handsontable from 'handsontable';\nimport type { ${name} } from '${source}';\n`
          + `export let a: Handsontable.${member};\n`;
        const result = await run('a.ts', text, [rule.id]);

        assert.equal(result.output, text.replace(`Handsontable.${member}`, name));
        assert.deepEqual(result.entries.map(entry => entry.severity), ['changed']);
      });
    }
  }
});

describe('notes of type rules', () => {
  /**
   * The `review` entries a run of the real rules reports for a snippet, with their `scope`. The note of a type rename
   * says what changed in the shape of the type, and the rename is already applied: the user looks and may change
   * nothing, so it is `review` and not `manual`.
   *
   * @param {string} source File text.
   * @returns {Promise<Array<{ruleId: string, scope: string|undefined}>>} The note entries.
   */
  async function notesOf(source) {
    const result = await run('a.ts', source);

    return result.entries.filter(entry => entry.severity === 'review').map(entry => ({
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

const REMOVED_BASE = {
  kind: 'exportRemoved',
  version: 'x',
  safe: false,
  guideUrl: null,
  name: 'Settings',
};

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

  it('moves a name whose new name is taken and keeps the old local name, alone or with other specifiers', async() => {
    const only = [`${VERSION}/type-multicolumnsorting-config`];
    const target = 'handsontable/plugins/columnSorting';
    const old = 'handsontable/plugins/multiColumnSorting';

    for (const [specifiers, left] of [['Config', ''], ['Config, Other', `import type { Other } from '${old}';\n`]]) {
      const source = `import type { ${specifiers} } from '${old}';\nconst ColumnSortingConfig = 1;\nlet a: Config;\n`;
      const result = await run('a.ts', source, only);

      assert.equal(result.output,
        `${left}import type { ColumnSortingConfig as Config } from '${target}';\n`
        + 'const ColumnSortingConfig = 1;\nlet a: Config;\n', specifiers);
      assert.ok(result.entries.some(entry => entry.severity === 'changed'
        && entry.message.includes('The local name Config stays')), specifiers);
      assert.equal((await run('a.ts', result.output, only)).changed, false, 'a second run changes nothing');
    }
  });

  it('keeps an import when a rule names the module the name already comes from as its target', async() => {
    const source = 'import { Config } from \'handsontable/plugins/columnSorting\';\nlet a: Config;\n';
    const same = {
      id: `${VERSION}/same-module`,
      kind: 'importSource',
      version: VERSION,
      safe: true,
      guideUrl: null,
      from: 'handsontable/plugins/columnSorting',
      exports: { Config: { to: 'handsontable/plugins/columnSorting' } },
    };
    const renameInPlace = {
      id: `${VERSION}/rename-in-place`,
      kind: 'exportRename',
      version: VERSION,
      safe: true,
      guideUrl: null,
      source: ['handsontable/plugins/columnSorting'],
      from: 'Config',
      to: 'ColumnSortingConfig',
      toSource: 'handsontable/plugins/columnSorting',
    };

    for (const rule of [same, renameInPlace]) {
      const plain = buildPlan([{ version: VERSION, rules: [rule] }]);
      const first = await transformFile({ filePath: 'a.ts', source, plan: plain, options: { markers: false } });
      const second = await transformFile({
        filePath: 'a.ts',
        source: first.output,
        plan: plain,
        options: { markers: false },
      });

      for (const output of [first.output, second.output]) {
        assert.match(output,
          /import \{ (?:Config|ColumnSortingConfig(?: as Config)?) \} from 'handsontable\/plugins\/columnSorting';/,
          rule.id);
        assert.match(output, /let a: (?:Config|ColumnSortingConfig);/, rule.id);
      }

      assert.equal(second.changed, false, rule.id);
    }
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

  describe('a local binding of the new name between the reference and the module', () => {
    const header = 'import Handsontable from \'handsontable\';';
    const shadowed = [
      ['a type parameter',
        'export function f<CellRange extends object>(x: CellRange, y: Handsontable.CellRange) { return [x, y]; }'],
      ['a block-scoped interface',
        'export function g() { interface CellCoords { z: number } const c: Handsontable.CellCoords = {} as any; }'],
      ['a block-scoped type alias',
        'export function g() { type CellCoords = number; const c: Handsontable.CellCoords = {} as any; }'],
      ['a class generic parameter', 'export class K<CellRange> { m(y: Handsontable.CellRange) { return y; } }'],
      ['a method generic parameter', 'export class K { m<CellRange>(y: Handsontable.CellRange) { return y; } }'],
      ['a type parameter of an arrow', 'export const h = <CellRange,>(y: Handsontable.CellRange) => y;'],
      ['a namespace member',
        'namespace N { export interface CellCoords { z: number } export let c: Handsontable.CellCoords; }'],
    ];

    for (const [label, code] of shadowed) {
      it(`reports and leaves the reference when ${label} has the name`, async() => {
        const source = `${header}\n${code}\n`;
        const result = await run('a.ts', source);
        const entries = result.entries.filter(entry => entry.ruleId === '18.0.0/ns-core-types');

        assert.equal(result.changed, false, label);
        assert.equal(result.output, source, label);
        assert.equal(entries.length, 1, JSON.stringify(result.entries));
        assert.equal(entries[0].severity, 'manual');
        assert.match(entries[0].message, /declared in an enclosing scope/);
      });
    }

    it('still rewrites a reference that no local binding of the name reaches', async() => {
      const result = await run('a.ts', [
        header,
        'export function f<CellRange extends object>(x: CellRange) { return x; }',
        'export function g(y: Handsontable.CellRange) { return y; }',
        'export function h() { interface CellCoords { z: number } return {} as CellCoords; }',
        'export let c: Handsontable.CellCoords;',
        '',
      ].join('\n'));

      assert.match(result.output, /export function g\(y: CellRange\)/);
      assert.match(result.output, /export let c: CellCoords;/);
      assert.match(result.output, /import type \{ CellRange, CellCoords \} from 'handsontable';/);
    });

    it('checks the scope of the name an existing import gives it', async() => {
      const source = [
        'import Handsontable, { CellCoords as Coords } from \'handsontable\';',
        'export function g<Coords>(c: Handsontable.CellCoords) { return c; }',
        '',
      ].join('\n');
      const result = await run('a.ts', source);

      assert.equal(result.output, source);
      assert.equal(result.entries.filter(entry => entry.severity === 'manual').length, 1);
    });
  });

  describe('a re-export of every name of a module whose names a rule renames or removes', () => {
    const RENAMED = 'handsontable/plugins/columnSorting';
    const REMOVED = 'handsontable/plugins/nestedHeaders';

    for (const code of [
      `export * from '${RENAMED}';`,
      `export * as sorting from '${RENAMED}';`,
      `export type * from '${RENAMED}';`,
      `export*from'${RENAMED}';`,
    ]) {
      it(`reports a barrel of a renamed name, once for each rule that names the module: ${code}`, async() => {
        const result = await run('barrel.ts', `${code}\n`, ['18.0.0/type-columnsorting-config']);
        const ours = result.entries.filter(entry => entry.ruleId === '18.0.0/type-columnsorting-config');

        assert.equal(ours.length, 1, JSON.stringify(result.entries));
        assert.equal(ours[0].severity, 'manual');
        assert.equal(ours[0].line, 1);
        assert.match(ours[0].message, /passes on every name of "handsontable\/plugins\/columnSorting"/);
        assert.match(ours[0].message, /Config is now ColumnSortingConfig/);
        assert.equal(result.output, `${code}\n`);
      });
    }

    it('reports a barrel of a removed name with a TODO on the export', async() => {
      const result = await run('barrel.ts', `export * from '${REMOVED}';\nexport const keep = 1;\n`,
        ['18.0.0/type-nestedheaders-settings']);
      const ours = result.entries.filter(entry => entry.ruleId === '18.0.0/type-nestedheaders-settings');

      assert.equal(ours.length, 1, JSON.stringify(result.entries));
      assert.ok(ours[0].message.startsWith('Check Settings, which this export * from '
        + '"handsontable/plugins/nestedHeaders" may pass on. '), ours[0].message);
      assert.ok(result.output.startsWith('// TODO(handsontable-codemod 18.0.0/type-nestedheaders-settings): '
        + 'Check Settings, which this export * may pass on.'), result.output);
      assert.equal(result.output.split('\n').filter(line => line.includes('TODO(')).length, 1);

      const again = await run('barrel.ts', result.output, ['18.0.0/type-nestedheaders-settings']);

      assert.equal(again.changed, false);
    });

    it('names every name of a rule that covers several, and says "may", because one module holds only some', async() => {
      const result = await run('barrel.ts', 'export * from \'handsontable/editors\';\n', ['18.0.0/type-registry-maps']);
      const [entry] = result.entries;

      assert.equal(result.entries.length, 1);
      assert.ok(entry.message.startsWith('Check CellTypes, Editors, Renderers, Validators, which this export * from '
        + '"handsontable/editors" may pass on. '), entry.message);
      assert.doesNotMatch(entry.message, /no longer exported from/);
    });

    it('stays quiet about a barrel of another module, and about a re-export of a named import', async() => {
      for (const code of [
        'export * from \'lodash\';',
        'export * from \'./local\';',
        'export * as lodash from \'lodash\';',
        'export * from \'handsontable/plugins/columnSorting/other\';',
      ]) {
        const result = await run('barrel.ts', `${code}\n`);

        assert.deepEqual(result.entries, [], code);
      }
    });

    it('reports a type import and a destructured require of the renamed name', async() => {
      const typed = await run('a.ts', `type A = import('${RENAMED}').Config;\nexport type { A };\n`);
      const required = await run('a.ts', `const { Config } = require('${RENAMED}');\nexport { Config };\n`);
      const other = await run('a.ts', `const { Other } = require('${RENAMED}');\nexport { Other };\n`);

      assert.equal(typed.entries.filter(entry => entry.ruleId === '18.0.0/type-columnsorting-config').length, 1);
      assert.equal(required.entries.filter(entry => entry.ruleId === '18.0.0/type-columnsorting-config').length, 1);
      assert.equal(other.entries.filter(entry => entry.ruleId === '18.0.0/type-columnsorting-config').length, 0);
    });
  });

  describe('a JSDoc type that still says the old name after an import rename', () => {
    const IMPORT = 'import { Config } from \'handsontable/plugins/columnSorting\';\n';
    const only = ['18.0.0/type-columnsorting-config'];
    const stale = result => result.entries.filter(entry => entry.severity === 'manual'
      && /^Rename .* in the type of this comment/.test(entry.message)).map(entry => entry.line);

    it('is reported at its line, once per line, and the comment is not edited', async() => {
      const source = `${IMPORT}\n/**\n * Sort.\n * @param {Config} first The first.\n`
        + ' * @param {Array<Config>} rest The rest.\n * @returns {Config|null} The result.\n */\n'
        + 'export function sort(first, rest) { return first || rest; }\n';
      const result = await run('a.js', source, only);

      assert.deepEqual(stale(result), [5, 6, 7]);
      assert.match(result.output, /^import \{ ColumnSortingConfig \} from/);
      assert.ok(result.output.includes(' * @param {Config} first The first.'), 'comments are never edited');
    });

    it('is not reported for a qualified name, another word, prose, a line comment, or an aliased import', async() => {
      const quiet = `${IMPORT}/**\n`
        + ' * @param {import(\'handsontable/plugins/columnSorting\').Config} a The same type, by import.\n'
        + ' * @param {ConfigOther} b Another word.\n * @param {Plugin.Config} c A member.\n'
        + ' * The Config is mentioned in prose only.\n */\nexport function f(a, b, c) {}\n// @param {Config} d\n';
      const aliased = 'import { Config as Mine } from \'handsontable/plugins/columnSorting\';\n'
        + '/** @param {Config} a Not the local name. */\nexport function g(a) {}\n';

      assert.deepEqual(stale(await run('a.js', quiet, only)), []);
      assert.deepEqual(stale(await run('a.js', aliased, only)), []);
    });
  });

  describe('a JSDoc type that reads a name through import() of its module', () => {
    const RENAMED = 'handsontable/plugins/columnSorting';
    const REMOVED = 'handsontable/plugins/nestedHeaders';
    const viaImport = (result, ruleId) => result.entries.filter(entry => entry.ruleId === ruleId
      && /^Replace \w+ in the type of this comment by hand/.test(entry.message));

    it('reports a renamed name in a typedef, a param, and a generic, at its line, and edits no comment', async() => {
      const source = `/** @typedef {import('${RENAMED}').Config} Cfg */\n/**\n`
        + ` * @param {import("${RENAMED}").Config} s The settings.\n`
        + ` * @param {Array< import( '${RENAMED}' ).Config >} list The list.\n`
        + ` * @returns {import('${RENAMED}').Other} Another name.\n */\nexport function f(s, list) {}\n`;
      const result = await run('a.js', source, ['18.0.0/type-columnsorting-config']);
      const entries = viaImport(result, '18.0.0/type-columnsorting-config');

      assert.deepEqual(entries.map(entry => [entry.severity, entry.line]),
        [['manual', 1], ['manual', 3], ['manual', 4]]);
      assert.match(entries[0].message, /Config is now ColumnSortingConfig/);
      assert.match(entries[0].message, /does not edit comments/);
      assert.equal(result.output, source);
    });

    it('reports a removed name, with the advice of its rule', async() => {
      const source = `/**\n * @param {import('${REMOVED}').Settings} s\n */\nexport function f(s) {}\n`;
      const result = await run('a.js', source, ['18.0.0/type-nestedheaders-settings']);
      const entries = viaImport(result, '18.0.0/type-nestedheaders-settings');

      assert.deepEqual(entries.map(entry => entry.line), [2]);
      assert.match(entries[0].message, /Settings is no longer exported from "handsontable\/plugins\/nestedHeaders"/);
      assert.equal(result.output, source);
    });

    it('stays quiet for another module, another name, prose, a line comment, and code', async() => {
      const source = '/**\n * @param {import(\'other-lib\').Config} a Another module.\n'
        + ` * @param {import('${RENAMED}').Other} b Another name.\n`
        + ` * The type import('${RENAMED}').Config is mentioned in prose only.\n */\n`
        + `// @param {import('${RENAMED}').Config} c\n`
        + `export type T = import('${RENAMED}').Other;\n`;
      const result = await run('a.ts', source, ['18.0.0/type-columnsorting-config']);

      assert.deepEqual(viaImport(result, '18.0.0/type-columnsorting-config'), []);
    });
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

  it('flags a removed name of nestedHeaders through its own rule, which the wildcard rule leaves out', async() => {
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

  describe('two removal rules that match one name', () => {
    const specific = {
      ...REMOVED_BASE,
      id: 'x/specific',
      source: 'handsontable/plugins/autofill',
      advice: 'Use the specific text.',
    };
    const wildcard = {
      ...REMOVED_BASE,
      id: 'x/wildcard',
      source: 'handsontable/plugins/*',
      advice: 'Use the wildcard text.',
    };

    /**
     * Run rules of one synthetic version over a source text.
     *
     * @param {object[]} ordered The rules, in manifest order.
     * @param {string} source File text.
     * @returns {Promise<{output: string, entries: object[]}>} The result.
     */
    function runRules(ordered, source) {
      const single = {
        versions: [{ version: 'x', rules: ordered }],
        rulesById: new Map(ordered.map(rule => [rule.id, rule])),
      };

      return transformFile({ filePath: 'a.ts', source, plan: single, options: { markers: false } });
    }

    for (const [label, source] of [
      ['a named import',
        'import type { Settings } from \'handsontable/plugins/autofill\';\nexport type A = Settings;\n'],
      ['a named re-export', 'export type { Settings } from \'handsontable/plugins/autofill\';\n'],
    ]) {
      it(`reports ${label} once, for the first rule in the manifest`, async() => {
        const first = await runRules([specific, wildcard], source);
        const swapped = await runRules([wildcard, specific], source);

        assert.deepEqual(first.entries.map(entry => entry.ruleId), ['x/specific']);
        assert.match(first.entries[0].message, /Use the specific text\./);
        assert.equal(first.output.match(/TODO\(handsontable-codemod/g).length, 1);
        assert.deepEqual(swapped.entries.map(entry => entry.ruleId), ['x/wildcard']);
        assert.equal(swapped.output.match(/TODO\(handsontable-codemod/g).length, 1);
      });
    }
  });

  describe('a name of a renamed export that is read without an import statement', () => {
    const RENAMED = 'handsontable/plugins/columnSorting';

    for (const [label, source, reported] of [
      ['an import type with a qualifier', `export type A = import('${RENAMED}').Config;\n`, true],
      ['an import type of another name', `export type A = import('${RENAMED}').Other;\n`, false],
      ['a destructured require', `const { Config } = require('${RENAMED}');\nexport { Config };\n`, true],
      ['a destructured require of another name',
        `const { Other } = require('${RENAMED}');\nexport { Other };\n`, false],
      ['a destructured require of a renamed name',
        `const { Config: Mine } = require('${RENAMED}');\nexport { Mine };\n`, true],
      ['a require destructured by a string-literal key',
        `const { 'Config': Mine } = require('${RENAMED}');\nexport { Mine };\n`, true],
      ['a require destructured by a computed string key',
        `const { ['Config']: Mine } = require('${RENAMED}');\nexport { Mine };\n`, true],
      ['a require destructured by a computed variable key',
        `const { [key]: Mine } = require('${RENAMED}');\nexport { Mine };\n`, false],
      ['a require with a template-literal specifier',
        `const { Config } = require(\`${RENAMED}\`);\nexport { Config };\n`, true],
      ['a dynamic import with a template-literal specifier',
        `export const load = import(\`${RENAMED}\`).then(({ Config }) => Config);\n`, true],
    ]) {
      it(`${reported ? 'reports' : 'stays quiet for'} ${label}, and edits nothing`, async() => {
        const result = await run('a.ts', source);
        const entries = result.entries.filter(entry => entry.ruleId === '18.0.0/type-columnsorting-config');

        assert.equal(result.changed, false);
        assert.equal(result.output, source);
        assert.deepEqual(entries.map(entry => [entry.severity, entry.line]), reported ? [['manual', 1]] : []);

        if (reported) {
          assert.match(entries[0].message, /This code loads "handsontable\/plugins\/columnSorting"/);
        }
      });
    }
  });

  describe('a name of a renamed or removed export that is read through an import-equals declaration', () => {
    const RENAMED = 'handsontable/plugins/columnSorting';
    const REMOVED = 'handsontable/plugins/nestedHeaders';

    for (const [label, source, ruleId, name, reported] of [
      ['a type read of a renamed name', `import CS = require('${RENAMED}');\nlet c: CS.Config;\n`,
        '18.0.0/type-columnsorting-config', 'Config', true],
      ['a value read of a renamed name', `import CS = require('${RENAMED}');\nconst c = CS.Config;\n`,
        '18.0.0/type-columnsorting-config', 'Config', true],
      ['an exported import-equals', `export import CS = require('${RENAMED}');\nlet c: CS.Config;\n`,
        '18.0.0/type-columnsorting-config', 'Config', true],
      ['a type read of a removed name', `import NH = require('${REMOVED}');\nlet c: NH.Settings;\n`,
        '18.0.0/type-nestedheaders-settings', 'Settings', true],
      ['another name of the module', `import CS = require('${RENAMED}');\nlet c: CS.Other;\n`,
        '18.0.0/type-columnsorting-config', 'Config', false],
      ['the same member of another object', `import CS = require('${RENAMED}');\nlet c: Mine.Config;\n`,
        '18.0.0/type-columnsorting-config', 'Config', false],
      ['an alias of an entity, which names no module', 'import CS = Handsontable.plugins;\nlet c: CS.Config;\n',
        '18.0.0/type-columnsorting-config', 'Config', false],
      ['a module that no rule names', 'import CS = require(\'other-lib\');\nlet c: CS.Config;\n',
        '18.0.0/type-columnsorting-config', 'Config', false],
      ['a parameter that shadows the import-equals name',
        `import CS = require('${RENAMED}');\nfunction f(CS: any) { return CS.Config; }\n`,
        '18.0.0/type-columnsorting-config', 'Config', false],
      ['a local that shadows the namespace import name',
        `import * as CS from '${RENAMED}';\nfunction f() { const CS = other(); return CS.Config; }\n`,
        '18.0.0/type-columnsorting-config', 'Config', false],
      ['a local namespace that shadows the namespace import name in a type',
        `import * as NH from '${REMOVED}';\n`
        + 'function f() { namespace NH { export type Settings = 1; } let c: NH.Settings; }\n',
        '18.0.0/type-nestedheaders-settings', 'Settings', false],
      ['a namespace import that nothing shadows',
        `import * as CS from '${RENAMED}';\nfunction f() { return CS.Config; }\n`,
        '18.0.0/type-columnsorting-config', 'Config', true],
    ]) {
      it(`${reported ? 'reports' : 'stays quiet for'} ${label}, and edits nothing`, async() => {
        const result = await run('a.ts', source, [ruleId]);
        const entries = result.entries.filter(entry => entry.ruleId === ruleId);

        assert.equal(result.changed, false);
        assert.equal(result.output, source);
        assert.deepEqual(entries.map(entry => [entry.severity, entry.line]), reported ? [['manual', 2]] : [], name);

        if (reported) {
          assert.match(entries[0].message, new RegExp(`"${RENAMED.replace('columnSorting', '')}`));
        }
      });
    }
  });

  it('leaves a CommonJS require of a removed module as it is and reports it', async() => {
    const source = 'const common = require(\'handsontable/common\');\nexport { common };\n';
    const result = await run('a.ts', source);

    assert.equal(result.changed, false);
    assert.equal(result.entries.filter(entry => entry.severity === 'manual').length, 1);
  });
});
