import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dominantBreak, restoreLineEndings, splitLines } from '../src/lib/line-endings.mjs';
import { VERSIONS_DIR, buildPlan, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';

const REMOVAL = ['18.0.0/resize-state-methods'];

/**
 * Run one rule over a file text.
 *
 * @param {string} source File text.
 * @param {string[]} [only] Rule ids.
 * @param {string} [filePath] File name.
 * @returns {Promise<{output: string, entries: object[], changed: boolean}>} The outcome.
 */
async function transform(source, only = REMOVAL, filePath = 'grid.js') {
  return transformFile({
    filePath,
    source,
    plan: buildPlan(await loadManifests(VERSIONS_DIR), only),
    options: {},
    facts: new Set(),
    phase: 1,
  });
}

/**
 * The module of the indentation test, written with the given line terminators, one per line in order. The line that a
 * run removes is the one with `saveManualColumnWidths()`.
 *
 * @param {string[]} terms The terminator after each of the 11 lines. A string with fewer entries repeats its last.
 * @returns {{source: string, expected: string}} The source and the output a run must give.
 */
function module(terms) {
  const lines = [
    'import Handsontable from \'handsontable\';',
    '',
    'export function mount(el) {',
    '  const hot = new Handsontable(el, { licenseKey: \'k\' });',
    '  if (el) {',
    '    hot.render();',
    '  }',
    '  hot.getPlugin(\'manualColumnResize\').saveManualColumnWidths();',
    '',
    '  return hot;',
    '}',
  ];
  const termOf = index => terms[Math.min(index, terms.length - 1)];
  const join = list => list.map(([line, index]) => line + termOf(index)).join('');
  const all = lines.map((line, index) => [line, index]);

  return {
    source: join(all),
    expected: join(all.filter(([line]) => !line.includes('saveManualColumnWidths'))),
  };
}

describe('line endings of an edited JavaScript file', () => {
  it('keeps the ending of every line the run did not change, in a file that mixes CRLF and LF', async() => {
    const { source, expected } = module(['\r\n', '\n', '\r\n', '\n', '\n', '\r\n', '\n', '\r\n', '\n', '\r\n', '\n']);
    const { output, changed } = await transform(source);

    assert.equal(changed, true);
    assert.equal(output, expected);
  });

  it('keeps a lone minority line in a CRLF file as the file had it', async() => {
    const { source, expected } = module(['\r\n', '\r\n', '\r\n', '\r\n', '\n', '\r\n']);
    const { output } = await transform(source);

    assert.equal(output, expected);
  });

  it('keeps a file that ends in CRLF, LF, or nothing exactly as it ended', async() => {
    for (const mixedTerms of [['\r\n', '\n'], ['\n', '\r\n']]) {
      const { source, expected } = module(mixedTerms);

      for (const tail of ['', '\n', '\r\n']) {
        const trimmed = source.replace(/(\r\n|\n)$/, '');
        const trimmedExpected = expected.replace(/(\r\n|\n)$/, '');
        const { output } = await transform(trimmed + tail);

        assert.equal(output, trimmedExpected + tail, `${JSON.stringify(mixedTerms)} ending ${JSON.stringify(tail)}`);
      }
    }
  });

  it('keeps a CR-only file as it is, and writes no other ending', async() => {
    const { source, expected } = module(['\r']);
    const { output, changed } = await transform(source);

    assert.equal(changed, true);
    assert.equal(output, expected);
    assert.equal(/\n/.test(output), false);
  });

  it('keeps a file that uses one ending as before', async() => {
    for (const term of ['\n', '\r\n']) {
      const { source, expected } = module([term]);

      assert.equal((await transform(source)).output, expected);
    }
  });

  it('gives a line the tool adds the ending most lines have', async() => {
    // A TODO next to a call that stays adds a comment line, and the file mostly ends its lines with CRLF.
    const source = [
      'import Handsontable from \'handsontable\';\r\n',
      'const hot = new Handsontable(el, {});\r\n',
      'const unknown = other();\n',
      'unknown.saveManualColumnWidths();\r\n',
      'hot.render();\r\n',
    ].join('');
    const { output, entries } = await transform(source);
    const added = output.split(/(?<=\r\n|\n)/).filter(line => /TODO\(handsontable-codemod/.test(line));

    assert.equal(entries.some(entry => entry.severity === 'manual'), true, JSON.stringify(entries));
    assert.equal(added.length, 1, output);
    assert.equal(added[0].endsWith('\r\n'), true, JSON.stringify(added[0]));
    assert.equal(output.includes('const unknown = other();\n'), true, 'the LF line keeps its ending');
  });

  it('refuses to guess when a printed line could have come from lines that end in different ways', () => {
    // A blank line that the file repeats, once with each ending, and a printer that kept one of them: which one the file
    // keeps is not in the text, so the tool does not pick.
    const source = 'a();\n\r\nb();\n\nc();\r\n';

    assert.throws(() => restoreLineEndings(source, 'a();\n\nc();\n', '\n'), /cannot tell which line ending/);
  });

  it('cuts a removed import out between two blank lines that end in different ways, and keeps both', async() => {
    // The import is merged into the first one. The printer used to lay the statements out again, and it could not say
    // which of the two blank lines the file kept, so the file was left alone. The cut leaves both lines as they were.
    const source = [
      'import Handsontable from \'handsontable\';\n',
      '\r\n',
      'import { CellChange } from \'handsontable/common\';\n',
      '\n',
      'export function f(change: CellChange) {\r\n',
      '  return change;\r\n',
      '}\r\n',
    ].join('');
    const { output, changed, entries } = await transform(source, ['18.0.0/common-imports'], 'grid.ts');

    assert.equal(changed, true, JSON.stringify(entries));
    assert.equal(entries.some(entry => entry.ruleId === 'transform-error'), false, JSON.stringify(entries));
    assert.equal(output, [
      'import Handsontable, { CellChange } from \'handsontable\';\r\n',
      '\r\n',
      '\n',
      'export function f(change: CellChange) {\r\n',
      '  return change;\r\n',
      '}\r\n',
    ].join(''));
  });

  it('cuts a removed statement out between two blank lines that end in different ways, and keeps both', async() => {
    const source = [
      'import Handsontable from \'handsontable\';\n',
      'const hot = new Handsontable(el, {});\n',
      '\r\n',
      'hot.getPlugin(\'manualColumnResize\').saveManualColumnWidths();\n',
      '\n',
      'hot.render();\r\n',
    ].join('');
    const { output, changed } = await transform(source);

    assert.equal(changed, true);
    assert.equal(output, source.replace('hot.getPlugin(\'manualColumnResize\').saveManualColumnWidths();\n', ''));
  });

  it('does not refuse when the repeated lines end the same way', async() => {
    const source = [
      'import Handsontable from \'handsontable\';\r\n',
      '\n',
      'const hot = new Handsontable(el, {});\r\n',
      'hot.getPlugin(\'manualColumnResize\').saveManualColumnWidths();\r\n',
      '\n',
      'hot.render();\r\n',
    ].join('');
    const { output, changed } = await transform(source);

    assert.equal(changed, true);
    assert.equal(output, source.replace('hot.getPlugin(\'manualColumnResize\').saveManualColumnWidths();\r\n', ''));
  });

  it('keeps the ending of the lines of a template literal the tool did not touch', async() => {
    const source = [
      'import Handsontable from \'handsontable\';\r\n',
      'const text = `one\r\ntwo\nthree`;\r\n',
      'const hot = new Handsontable(el, {});\n',
      'hot.getPlugin(\'manualColumnResize\').saveManualColumnWidths();\r\n',
      'hot.render();\n',
    ].join('');
    const { output } = await transform(source);

    assert.equal(output, source.replace('hot.getPlugin(\'manualColumnResize\').saveManualColumnWidths();\r\n', ''));
  });

  it('keeps the endings in the script of a Vue file and leaves the rest of the file alone', async() => {
    const script = [
      'import Handsontable from \'handsontable\';\r\n',
      'const hot = new Handsontable(el, {});\n',
      'hot.getPlugin(\'manualColumnResize\').saveManualColumnWidths();\r\n',
      'hot.render();\n',
    ].join('');
    const source = `<template>\n  <div />\r\n</template>\n<script>\r\n${script}</script>\r\n`;
    const { output } = await transform(source, REMOVAL, 'Grid.vue');

    assert.equal(output, source.replace('hot.getPlugin(\'manualColumnResize\').saveManualColumnWidths();\r\n', ''));
  });
});

describe('restoreLineEndings()', () => {
  it('splits a text into lines and the terminator after each', () => {
    assert.deepEqual(splitLines('a\r\nb\nc\rd'), { texts: ['a', 'b', 'c', 'd'], terms: ['\r\n', '\n', '\r', ''] });
    assert.deepEqual(splitLines('a\n'), { texts: ['a'], terms: ['\n'] });
    assert.deepEqual(splitLines(''), { texts: [], terms: [] });
  });

  it('names the dominant ending, with a tie going to CRLF and then LF, and LF for a text without a break', () => {
    assert.equal(dominantBreak('a\r\nb\nc\r\n'), '\r\n');
    assert.equal(dominantBreak('a\r\nb\n'), '\r\n');
    assert.equal(dominantBreak('a\nb\r\nc\n'), '\n');
    assert.equal(dominantBreak('a\rb\rc\n'), '\r');
    assert.equal(dominantBreak('abc'), '\n');
  });

  it('gives back the endings of an unchanged text', () => {
    const source = 'a\r\nb\nc\rd\r\n';

    assert.equal(restoreLineEndings(source, 'a\nb\nc\nd\n', '\n'), source);
  });

  it('writes an added line with the dominant ending, and a changed line too', () => {
    assert.equal(restoreLineEndings('a\r\nb\r\nc\n', 'a\nNEW\nb\nc\n', '\n'), 'a\r\nNEW\r\nb\r\nc\n');
    assert.equal(restoreLineEndings('a\r\nb\r\nc\n', 'a\nB\nc\n', '\n'), 'a\r\nB\r\nc\n');
  });

  it('writes the lone ending of a CR-only text after a printer that used LF', () => {
    assert.equal(restoreLineEndings('a\rb\rc\r', 'a\nB\nc\n', '\n'), 'a\rB\rc\r');
  });

  it('throws for a line it cannot place, and only then', () => {
    // One of two blank lines is gone. They end in different ways, so the one that is left cannot be placed.
    assert.throws(() => restoreLineEndings('a\n\r\n\nb\n', 'a\n\nb\n', '\n'), /cannot tell which line ending/);
    // The same edit is fine when both blank lines end the same way, and a line that only one alignment pairs is fine
    // when every line it could be ends like the dominant ending.
    assert.equal(restoreLineEndings('a\r\n\r\n\r\nb\n', 'a\n\nb\n', '\n'), 'a\r\n\r\nb\n');
    assert.equal(restoreLineEndings('a\r\n\r\nb\r\n\r\n', 'a\n\nb\nx\n', '\n'), 'a\r\n\r\nb\r\nx\r\n');
  });
});
