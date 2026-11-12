import assert from 'node:assert/strict';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { VERSIONS_DIR, buildPlan, loadManifest, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';

/**
 * Run the rules of the given versions over one file.
 *
 * @param {string} source File text.
 * @param {string} filePath File name.
 * @param {string[]} [versions] Version directories to load, in order.
 * @param {string[]} [only] Rule ids to keep.
 * @returns {Promise<{output: string, changed: boolean, entries: object[]}>} The outcome.
 */
async function run(source, filePath, versions = ['18.0.0'], only = []) {
  const manifests = await Promise.all(versions.map(version => loadManifest(join(VERSIONS_DIR, version))));

  return transformFile({ filePath, source, plan: buildPlan(manifests, only) });
}

describe('handsontable/common that is re-exported, typeof-imported, or loaded at runtime', () => {
  const ID = '18.0.0/common-imports';
  const messages = result => result.entries.filter(entry => entry.ruleId === ID).map(entry => entry.message);

  it('lists only names the 17.1.0 typings exported, and the removed ones with their replacements', async() => {
    const reExport = await run('export { CellValue } from \'handsontable/common\';\n', 'a.ts');
    const [message] = messages(reExport);

    assert.match(message, /^Replace "handsontable\/common" here by hand\. This re-export reads from /);
    assert.match(message, /The names moved: [^;]*CellValue/);
    assert.match(message, /RowObject/);

    // Names the 17.1.0 `common.d.ts` never exported must not appear as moved.
    for (const name of ['GridSettings', 'ColumnSettings', 'CellProperties', 'CellMeta', 'Events', 'HotInstance',
      'HooksRegistry', 'CellCoords', 'CellRange', 'IndexMapper']) {
      assert.equal(new RegExp(`\\b${name}\\b`).test(message), false, name);
    }

    // The removed names come with their replacements.
    assert.match(message, /Removed names: SimpleCellCoords: Use `\{ row: number; col: number \}` instead of /);
    assert.match(message, /NumericFormatOptions: Use `Intl\.NumberFormatOptions` instead/);
    assert.match(message, /LabelOptions: Use the inline type /);
    assert.match(message, /NumbroFormatOptions: Use `Intl\.NumberFormatOptions` instead/);
  });

  it('keeps redirecting a named import of a name that was never exported', async() => {
    const result = await run('import type { GridSettings } from \'handsontable/common\';\nlet a: GridSettings;\n',
      'a.ts');

    assert.match(result.output,
      /import type \{ GridSettings \} from '(?:handsontable|handsontable\/base|handsontable\/settings)'/);
  });

  it('says a typeof import() of the module lists the real names', async() => {
    const result = await run('type T = typeof import(\'handsontable/common\');\n', 'a.ts');
    const [message] = messages(result);

    assert.match(message, /^Replace "handsontable\/common" here by hand\. This code loads "handsontable\/common"/);
    assert.equal(message.includes('GridSettings'), false);
    assert.match(message, /Removed names: /);
  });

  it('tells a runtime import() or require() that the module had no runtime code', async() => {
    const dynamic = await run('const loaded = await import(\'handsontable/common\');\n', 'a.js');
    const required = await run('const common = require(\'handsontable/common\');\n', 'a.js');
    const advice = 'Remove this import: handsontable/common had no runtime code and is removed in 18.0.';

    assert.deepEqual(messages(dynamic), [advice]);
    assert.deepEqual(messages(required), [advice]);
  });
});

describe('the sanitizer wording rests on the 18.0 and 18.1 call sites', () => {
  it('has one wording per shape, and none says to move a branch to a header branch blindly', async() => {
    const source = 'import Handsontable from \'handsontable\';\n'
      + 'new Handsontable(el, { sanitizer: (c, s) => (s === \'innerHTML\' ? c.replace(/</g, \'&lt;\') : c) });\n';
    const result = await run(source, 'a.js', ['18.1.0'], ['18.1.0/sanitizer-source']);
    const [entry] = result.entries;

    assert.match(entry.message, /^Delete this 'innerHTML' branch: /);
    assert.match(entry.message, /Do not move this branch to a 'header' branch/);
  });
});

describe('the wording of the report entries', () => {
  it('says Settings of exportFile is deprecated in 18.0 and removed in 19.0', async() => {
    const rename = await run('import type { Settings } from \'handsontable/plugins/exportFile\';\nlet s: Settings;\n',
      'a.ts');
    const [entry] = rename.entries.filter(item => item.ruleId === '18.0.0/type-exportfile-settings');

    assert.equal(entry.message, 'Renamed the Settings import from "handsontable/plugins/exportFile" to '
      + 'ExportFileSettings. Settings is deprecated in 18.0 and removed in 19.0.');
  });

  it('names the exported name of a namespace type, and the local alias only as "available here as"', async() => {
    const plain = await run('import Handsontable from \'handsontable\';\n'
      + 'let s: Handsontable.plugins.ExportFile.Settings;\n', 'a.ts');
    const aliased = await run('import Handsontable from \'handsontable\';\n'
      + 'import type { ExportFileSettings as ExportSettings } from \'handsontable/plugins/exportFile\';\n'
      + 'let s: Handsontable.plugins.ExportFile.Settings;\n', 'a.ts');
    const message = result => result.entries.find(entry => entry.ruleId === '18.0.0/ns-exportfile-settings').message;

    assert.equal(message(plain), 'Replaced Handsontable.plugins.ExportFile.Settings with ExportFileSettings imported '
      + 'from "handsontable/plugins/exportFile". Settings is deprecated in 18.0 and removed in 19.0.');
    assert.match(message(aliased),
      /^Replaced Handsontable\.plugins\.ExportFile\.Settings with ExportFileSettings imported from /);
    assert.match(message(aliased), /\(available here as \w+\)\./);
  });

  it('gives the reason a theme registry name moves to handsontable/themes', async() => {
    const result = await run('import { registerTheme, mainTheme } from \'handsontable\';\nregisterTheme(mainTheme);\n',
      'a.ts');
    const messages = result.entries.filter(entry => entry.severity === 'changed').map(entry => entry.message);

    assert.ok(messages.includes('Moved the registerTheme import from "handsontable" to "handsontable/themes". '
      + '17.x declared registerTheme on "handsontable" in its typings only.'), messages.join('\n'));
  });

  it('says what 18.0 does with a locale and culture that differ', async() => {
    const result = await run('import Handsontable from \'handsontable\';\n'
      + 'new Handsontable(el, { locale: \'fr-FR\', numericFormat: { culture: \'de-DE\' } });\n', 'a.js');
    const [entry] = result.entries.filter(item => item.ruleId === '18.0.0/numeric-format-culture');

    assert.equal(entry.message, 'Set locale to \'de-DE\' if that was intended, then remove culture. 18.0 formats '
      + 'this column with locale \'fr-FR\' and ignores numericFormat.culture \'de-DE\', so the output changed from '
      + 'de-DE to fr-FR.');
  });
});

describe('the wrapper border advice', () => {
  const ID = '18.0.0/css-wrapper-border-width';
  const manual = result => result.entries.filter(entry => entry.ruleId === ID).map(entry => entry.message);

  it('tells a zero value to delete the line and turn a box-shadow off', async() => {
    for (const value of ['0', 'none', '0px']) {
      const result = await run(`@media print {\n  :root {\n    --ht-wrapper-border-width: ${value};\n  }\n}\n`,
        'print.css');

      assert.equal(manual(result)[0], 'Delete this line. If you draw the border with a box-shadow, turn it off here '
        + 'with box-shadow: none.', value);
    }
  });

  it('keeps the box-shadow advice for a real width', async() => {
    const result = await run(':root {\n  --ht-wrapper-border-width: 2px;\n}\n', 'theme.css');

    assert.match(manual(result)[0],
      /^Draw the outer border with a box-shadow on the root wrapper, because 18\.0 removed/);
  });

  it('adds the runtime-element sentence in a scoped Vue style, a module style, and an Angular component stylesheet',
    async() => {
      const sentence = 'Handsontable creates .ht-root-wrapper at runtime, so put that rule in a global stylesheet '
        + 'or behind :deep() / ::ng-deep.';
      const sfc = css => `<template><div /></template>\n<style ${css}>\n.a {\n`
        + '  border: var(--ht-wrapper-border-width);\n}\n</style>\n';
      const scoped = await run(sfc('scoped'), 'A.vue');
      const module = await run(sfc('module'), 'B.vue');
      const plain = await run(sfc(''), 'C.vue');
      const angular = await run('.a {\n  border: var(--ht-wrapper-border-width);\n}\n', 'grid.component.scss');
      const global = await run('.a {\n  border: var(--ht-wrapper-border-width);\n}\n', 'grid.scss');

      for (const result of [scoped, module, angular]) {
        assert.ok(manual(result)[0].endsWith(sentence), manual(result)[0]);
      }

      for (const result of [plain, global]) {
        assert.equal(manual(result)[0].includes('.ht-root-wrapper at runtime'), false);
      }
    });
});

describe('a chained run', () => {
  it('lets the earliest rule own a merged Pikaday entry', async() => {
    const manifests = await loadManifests(VERSIONS_DIR);
    const plan = buildPlan(manifests);
    const source = '/* Handsontable */\n.pika-single {\n  color: red;\n}\n';
    const result = await transformFile({ filePath: 'a.css', source, plan });
    const entries = result.entries.filter(entry => /pikaday/.test(entry.ruleId));

    assert.equal(entries.length, 1);
    assert.equal(entries[0].ruleId, '18.0.0/pikaday-leftovers');
  });
});
