import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { VERSIONS_DIR, buildPlan, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';

const manifests = await loadManifests(VERSIONS_DIR);
const REMOVAL = ['18.0.0/resize-state-methods'];
const HEAD = 'import Handsontable from \'handsontable\';\nconst hot = new Handsontable(el, {});\n'
  + 'const plugin = hot.getPlugin(\'manualColumnResize\');\n';
const S = 'plugin.saveManualColumnWidths();';

/**
 * Run the rule that removes a call that is a whole statement, over a text with the head of a module in front of it.
 *
 * @param {string} body Text after the head.
 * @param {object} [more] More arguments for `transformFile()`.
 * @returns {Promise<{output: string, changed: boolean, entries: object[]}>} The outcome, with the head cut off the
 * output.
 */
async function remove(body, more = {}) {
  const source = `${HEAD}${body}`;
  const result = await transformFile({
    filePath: 'a.js',
    source,
    plan: buildPlan(manifests, REMOVAL),
    ...more,
  });

  assert.deepEqual(result.entries.filter(entry => /-error$/.test(entry.ruleId)), [], result.output);

  // A text that is the head and nothing else loses the line break of the head too: its last line goes with it.
  return { ...result, output: result.output.startsWith(HEAD) ? result.output.slice(HEAD.length) : result.output };
}

/**
 * A text that is `source` with some of it cut out, for the tests that name the cut.
 *
 * @param {string} source The text.
 * @param {string[]} cuts The pieces to cut, each once.
 * @returns {string} The text without them.
 */
const without = (source, ...cuts) => cuts.reduce((text, cut) => text.replace(cut, ''), source);

describe('a removed statement is cut out of the text, and the statements around it keep their layout', () => {
  it('cuts the line of a statement that stands alone, with its line break', async() => {
    for (const [body, expected] of [
      [`a();\n${S}\nb();\n`, 'a();\nb();\n'],
      [`${S}\nb();\n`, 'b();\n'],
      [`a();\n\n${S}\n\nb();\n`, 'a();\n\n\nb();\n'],
      [`a();\n\n\n${S}\nb();\n`, 'a();\n\n\nb();\n'],
      [`a();\n${S}\n\n\nb();\n`, 'a();\n\n\nb();\n'],
      [`a();\n${S}\n`, 'a();\n'],
      [`${S}\n`, ''],
    ]) {
      assert.equal((await remove(body)).output, expected, JSON.stringify(body));
    }
  });

  it('cuts the last line of a file that has no line break at its end, with the break before it', async() => {
    assert.equal((await remove(`a();\n${S}`)).output, 'a();');
    assert.equal((await remove(S)).output, HEAD.slice(0, -1));
    assert.equal((await remove(`a();\r\n${S}`)).output, 'a();');
    assert.equal((await remove(`a();\n\n${S}`)).output, 'a();\n');
  });

  it('cuts the first, the last, and the only statement of a block, and keeps the braces where they stood', async() => {
    assert.equal((await remove(`function f() {\n  ${S}\n  b();\n}\n`)).output, 'function f() {\n  b();\n}\n');
    assert.equal((await remove(`function f() {\n  b();\n  ${S}\n}\n`)).output, 'function f() {\n  b();\n}\n');
    assert.equal((await remove(`function f() {\n  ${S}\n}\n`)).output, 'function f() {\n}\n');
    assert.equal((await remove(`if (x) {\n\t${S}\n\tb();\n}\n`)).output, 'if (x) {\n\tb();\n}\n');
    assert.equal((await remove(`switch (k) {\n  case 1:\n    ${S}\n    break;\n}\n`)).output,
      'switch (k) {\n  case 1:\n    break;\n}\n');
  });

  it('cuts a statement that shares its line with another, and the run of spaces that set it apart', async() => {
    for (const [body, expected] of [
      [`a(); ${S} b();\n`, 'a(); b();\n'],
      [`a(); ${S}\n`, 'a();\n'],
      [`${S} b();\n`, 'b();\n'],
      [`a();   ${S}   b();\n`, 'a();   b();\n'],
      [`${S} ${S}\n`, ''],
      [`a(); ${S} ${S} b();\n`, 'a(); b();\n'],
      [`function f() { ${S} }\n`, 'function f() { }\n'],
      [`hot.addHook('x', () => { ${S} });\n`, 'hot.addHook(\'x\', () => { });\n'],
      [`hot.addHook('x', () => { a(); ${S} });\n`, 'hot.addHook(\'x\', () => { a(); });\n'],
    ]) {
      assert.equal((await remove(body)).output, expected, JSON.stringify(body));
    }
  });

  it('leaves the comments of the statement where they stand', async() => {
    for (const [body, expected] of [
      [`// lead\n${S}\nb();\n`, '// lead\nb();\n'],
      [`${S} // trail\nb();\n`, '// trail\nb();\n'],
      [`a();\n\n// lead\n${S} // trail\n\nb();\n`, 'a();\n\n// lead\n// trail\n\nb();\n'],
      [`a(); ${S} // trail\n`, 'a(); // trail\n'],
      [`/* lead */ ${S}\nb();\n`, '/* lead */\nb();\n'],
      [`/*! license */\n${S}\nb();\n`, '/*! license */\nb();\n'],
    ]) {
      assert.equal((await remove(body)).output, expected, JSON.stringify(body));
    }
  });

  it('cuts in a file with CRLF line endings and in one indented with tabs', async() => {
    assert.equal((await remove(`a();\r\n${S}\r\nb();\r\n`)).output, 'a();\r\nb();\r\n');
    assert.equal((await remove(`a();\r\n\r\n${S}\r\n\r\nb();\r\n`)).output, 'a();\r\n\r\n\r\nb();\r\n');
    assert.equal((await remove(`function f() {\r\n  ${S}\r\n  b();\r\n}\r\n`)).output,
      'function f() {\r\n  b();\r\n}\r\n');
    assert.equal((await remove(`function f() {\n\tif (x) {\n\t\t${S}\n\t\tb();\n\t}\n}\n`)).output,
      'function f() {\n\tif (x) {\n\t\tb();\n\t}\n}\n');
    assert.equal((await remove(`a();\r\n${S} // trail\r\nb();\r\n`)).output, 'a();\r\n// trail\r\nb();\r\n');
  });

  it('cuts a statement that spans lines, and one that is written with await, void, or optional chaining', async() => {
    assert.equal((await remove('a();\nplugin\n  .saveManualColumnWidths();\nb();\n')).output, 'a();\nb();\n');
    assert.equal((await remove(`a();\nawait ${S}\nvoid ${S}\nplugin?.saveManualColumnWidths();\nb();\n`)).output,
      'a();\nb();\n');
  });

  it('keeps a semicolon where a file without semicolons would run one line into the next', async() => {
    for (const [body, expected] of [
      // The `;` of the removed statement is the one on the next line, and the line before has none.
      ['const a = 1\nplugin.saveManualColumnWidths()\n;(f)()\n', 'const a = 1\n;(f)()\n'],
      ['const a = 1\nplugin.saveManualColumnWidths();\n;[1].forEach(f)\n', 'const a = 1\n;[1].forEach(f)\n'],
      // Two statements in a row are one gap: the second reads the statements that stay on both sides of it.
      ['const a = 1\nplugin.saveManualColumnWidths();\nplugin.saveManualColumnWidths();\n[1].forEach(f)\n',
        'const a = 1\n;\n[1].forEach(f)\n'],
      ['const a = 1\nplugin.saveManualColumnWidths();\nplugin.saveManualColumnWidths()\n;(f)()\n',
        'const a = 1\n;(f)()\n'],
      ['const a = 1\nplugin.saveManualColumnWidths();\nplugin.saveManualColumnWidths();\nconst b = 2\n',
        'const a = 1\nconst b = 2\n'],
      // The next line does not start a call or an index, or the line before has its own `;`: nothing to keep.
      ['const a = 1;\nplugin.saveManualColumnWidths();\n(f)()\n', 'const a = 1;\n(f)()\n'],
      ['const a = 1\nplugin.saveManualColumnWidths()\nconst b = 2\n', 'const a = 1\nconst b = 2\n'],
    ]) {
      assert.equal((await remove(body)).output, expected, JSON.stringify(body));
    }
  });

  it('keeps the statements around it when another rule changes the list, and cuts the statement all the same',
    async() => {
      // The first rule splits an import in two, so the list grows and the printer lays it out again.
      const plan = buildPlan(manifests, [...REMOVAL, '18.0.0/common-imports']);
      const source = [
        'import Handsontable, { GridSettings } from \'handsontable\';',
        'import type { CellValue as Value, RowObject, SimpleCellCoords } from \'handsontable/common\';',
        'const hot = new Handsontable(el, {});',
        'const plugin = hot.getPlugin(\'manualColumnResize\');',
        '',
        `a(); ${S} b();`,
        '',
        S,
        '',
        'c();',
        'let v: Value;',
        'let s: SimpleCellCoords;',
        '',
      ].join('\n');
      const result = await transformFile({ filePath: 'a.ts', source, plan });

      assert.deepEqual(result.entries.filter(entry => /-error$/.test(entry.ruleId)), []);
      assert.equal(result.output, [
        'import Handsontable, { GridSettings } from \'handsontable\';',
        // The rule left this name behind, with a TODO of its own, and put the others in a declaration of their own.
        result.output.split('\n')[1],
        'import type { SimpleCellCoords } from \'handsontable/common\';',
        'import type { CellValue as Value, RowObject } from \'handsontable\';',
        'const hot = new Handsontable(el, {});',
        'const plugin = hot.getPlugin(\'manualColumnResize\');',
        '',
        // The printer lays the line out again, as it did before, but nothing is fused and nothing is lost.
        'a();',
        'b();',
        '',
        '',
        'c();',
        'let v: Value;',
        'let s: SimpleCellCoords;',
        '',
      ].join('\n'));
      assert.match(result.output.split('\n')[1], /^\/\/ TODO\(handsontable-codemod 18\.0\.0\/common-imports\)/);
      assert.equal(result.entries.filter(entry => entry.severity === 'changed' && entry.ruleId === REMOVAL[0]).length,
        2);
    });

  it('is stable: a second and a third run change nothing and report the same', async() => {
    const body = `a(); ${S} b();\n\n// lead\n${S} // trail\n\nfunction f() {\n  ${S}\n}\n`;
    const plan = buildPlan(manifests, REMOVAL);
    let text = `${HEAD}${body}`;

    for (let run = 0; run < 3; run += 1) {
      const result = await transformFile({ filePath: 'a.js', source: text, plan });

      assert.equal(result.changed, run === 0, `run ${run + 1}`);
      assert.deepEqual(result.entries.filter(entry => entry.severity !== 'changed'), []);

      if (run > 0) {
        assert.deepEqual(result.entries, [], `run ${run + 1} reports something`);
      }

      text = result.output;
    }

    assert.equal(text, `${HEAD}a(); b();\n\n// lead\n// trail\n\nfunction f() {\n}\n`);
  });

  it('keeps a call that has arguments or whose result is used, and says so, as before', async() => {
    const { output, entries } = await remove(`a();\nconst r = ${S}\nplugin.saveManualColumnWidths(x());\nb();\n`);

    assert.equal(output.includes(`const r = ${S}`), true);
    assert.equal(output.includes('plugin.saveManualColumnWidths(x());'), true);
    assert.equal(entries.filter(entry => entry.severity === 'changed').length, 0);
    assert.equal(without(output, ...output.split('\n').filter(row => row.startsWith('//')).map(row => `${row}\n`)),
      `a();\nconst r = ${S}\nplugin.saveManualColumnWidths(x());\nb();\n`);
  });
});
