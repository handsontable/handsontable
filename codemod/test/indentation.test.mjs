import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { transformFile } from '../src/runner.mjs';
import { VERSIONS_DIR, buildPlan, loadManifests } from '../src/manifest.mjs';

const REMOVAL = ['18.0.0/resize-state-methods'];
const MARKER = ['18.0.0/numbro-pattern'];

/**
 * Run the selected rules of the whole chain over one file text.
 *
 * @param {string} source File text.
 * @param {string} filePath File name.
 * @param {string[]} only Rule ids.
 * @returns {Promise<{output: string, entries: object[], changed: boolean}>} The outcome.
 */
async function transform(source, filePath, only) {
  const plan = buildPlan(await loadManifests(VERSIONS_DIR), only);

  return transformFile({ filePath, source, plan, options: {} });
}

/**
 * A module that mounts a grid and calls the removed method, indented with `unit`.
 *
 * @param {string} unit One level of indentation.
 * @param {string} [annotation] Text after the first parameter, for a typed file.
 * @returns {{source: string, removedLine: string}} The text and the line a run removes.
 */
function removalModule(unit, annotation = '') {
  const removedLine = `${unit}${unit}hot.getPlugin('manualColumnResize').saveManualColumnWidths();`;
  const source = [
    'import Handsontable from \'handsontable\';',
    '',
    'export const grid = {',
    `${unit}mount(el${annotation}) {`,
    `${unit}${unit}const hot = new Handsontable(el, { licenseKey: 'k' });`,
    `${unit}${unit}if (el) {`,
    `${unit}${unit}${unit}hot.render();`,
    `${unit}${unit}}`,
    removedLine,
    '',
    `${unit}${unit}return hot;`,
    `${unit}},`,
    '};',
    '',
  ].join('\n');

  return { source, removedLine };
}

describe('indentation of an edited file', () => {
  const styles = [
    ['tabs', '\t'],
    ['two spaces', '  '],
    ['four spaces', '    '],
  ];

  for (const [label, unit] of styles) {
    for (const [extension, annotation] of [['.js', ''], ['.mjs', ''], ['.ts', ': HTMLElement']]) {
      it(`removing a statement changes only that line in a ${label} ${extension} file`, async() => {
        const { source, removedLine } = removalModule(unit, annotation);
        const { output, changed } = await transform(source, `grid${extension}`, REMOVAL);

        assert.equal(changed, true);
        assert.equal(output, source.replace(`${removedLine}\n`, ''));
      });
    }

    it(`removing a statement changes only that line in the script of a ${label} Vue file`, async() => {
      const { source: script, removedLine } = removalModule(unit);
      const source = `<template>\n<div />\n</template>\n<script>\n${script}</script>\n`;
      const { output } = await transform(source, 'Grid.vue', REMOVAL);

      assert.equal(output, source.replace(`${removedLine}\n`, ''));
    });
  }

  it('keeps the tabs of a CRLF file', async() => {
    const { source, removedLine } = removalModule('\t');
    const crlf = source.replace(/\n/g, '\r\n');
    const { output } = await transform(crlf, 'grid.js', REMOVAL);

    assert.equal(output, crlf.replace(`${removedLine}\r\n`, ''));
  });

  it('indents the lines a rewrite adds with the style of the file', async() => {
    const source = [
      'import Handsontable from \'handsontable\';',
      '',
      'export function mount(el) {',
      '\treturn new Handsontable(el, {',
      '\t\tlicenseKey: \'k\',',
      '\t\tcolumns: [',
      '\t\t\t{ data: \'a\', type: \'numeric\', numericFormat: { pattern: \'0.00\' } },',
      '\t\t],',
      '\t});',
      '}',
      '',
    ].join('\n');
    const { output } = await transform(source, 'grid.js', MARKER);
    const lines = output.split('\n');

    assert.equal(lines.length, source.split('\n').length + 1);
    assert.ok(lines.every(line => !/^ /.test(line)), 'no line starts with a space');
    assert.match(lines[6], /^\t\t\t\/\/ TODO\(handsontable-codemod 18\.0\.0\/numbro-pattern\)/);
    assert.equal(lines[7], source.split('\n')[6]);
  });

  it('prints an object that lost a property with tabs', async() => {
    const source = [
      'import Handsontable from \'handsontable\';',
      '',
      'export function mount(el) {',
      '\tconst hot = new Handsontable(el, {',
      '\t\tlicenseKey: \'k\',',
      '\t\tcolumns: [',
      '\t\t\t{ type: \'date\', correctFormat: true, dateFormat: \'YYYY-MM-DD\' },',
      '\t\t],',
      '\t});',
      '',
      '\treturn hot;',
      '}',
      '',
    ].join('\n');
    const { output, changed } = await transform(source, 'grid.ts', ['18.0.0/correct-format-removed']);

    assert.equal(changed, true);
    assert.ok(output.split('\n').every(line => !/^ /.test(line)), `a line starts with a space:\n${output}`);
  });

  it('prints a file with mixed line endings in the ending most of its lines have', async() => {
    const { source, removedLine } = removalModule('  ');
    const mostlyLf = source.replace('hot.render();\n', 'hot.render();\r\n');
    const { output, changed } = await transform(mostlyLf, 'grid.js', REMOVAL);

    assert.equal(changed, true);
    assert.equal(output.split('\r\n').length - 1 <= 1, true, JSON.stringify(output));
    assert.equal(output.includes(removedLine), false);
  });
});
