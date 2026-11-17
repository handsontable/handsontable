import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { VERSIONS_DIR, buildPlan, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';

const manifests = await loadManifests(VERSIONS_DIR);
const PLAN = buildPlan(manifests, ['18.0.0/common-imports']);
const MAIN = 'import Handsontable from \'handsontable\';';
const COMMON = 'import { RowObject } from \'handsontable/common\';';
const MERGED = 'import Handsontable, { RowObject } from \'handsontable\';';
const BOM = String.fromCharCode(0xfeff);
const TWO = 'export const g: RowObject[] = []; export const h = Handsontable;';

/**
 * Run the import rule three times over a text, and check that runs 2 and 3 change nothing.
 *
 * @param {string} source File text.
 * @param {string} [filePath] File name.
 * @returns {Promise<string>} The output of run 1.
 */
async function run(source, filePath = 'a.ts') {
  const first = await transformFile({ filePath, source, plan: PLAN, options: {} });

  assert.equal(first.changed, true, JSON.stringify(first.entries));
  assert.equal(first.entries.some(entry => entry.ruleId === 'transform-error'), false, JSON.stringify(first.entries));

  const second = await transformFile({ filePath, source: first.output, plan: PLAN, options: {} });
  const third = await transformFile({ filePath, source: second.output, plan: PLAN, options: {} });

  assert.equal(second.changed, false, 'run 2 changed the file');
  assert.equal(third.changed, false, 'run 3 changed the file');

  return first.output;
}

describe('an import that merged into another declaration is cut out, and its neighbors keep their bytes', () => {
  it('keeps statements that share a line with the removed import as they were written', async() => {
    const source = `${MAIN}\na();${COMMON}b();\n${TWO}\n`;

    assert.equal(await run(source), `${MERGED}\na();b();\n${TWO}\n`);
  });

  it('keeps the space that separated the removed import from what followed it', async() => {
    const source = `${MAIN}\na(); ${COMMON} b();\n${TWO}\n`;

    assert.equal(await run(source), `${MERGED}\na(); b();\n${TWO}\n`);
  });

  it('keeps the statement after an import on its own line, and the one after that', async() => {
    const source = `${MAIN}\n${COMMON} export const g: RowObject[] = [];\nexport const h = Handsontable;\n`;

    assert.equal(await run(source), `${MERGED}\nexport const g: RowObject[] = [];\nexport const h = Handsontable;\n`);
  });

  it('keeps every blank line around the removed line, and the style of the statements without semicolons', async() => {
    const source = `${MAIN.slice(0, -1)}\n\n\n${COMMON.slice(0, -1)}\n\n\nexport const g: RowObject[] = []\n`
      + 'export const h = Handsontable\n';

    assert.equal(await run(source),
      `${MERGED}\n\n\n\n\nexport const g: RowObject[] = []\nexport const h = Handsontable\n`);
  });

  it('keeps a file that has no line break at its end', async() => {
    const source = `${MAIN}\n${COMMON}\n${TWO}`;

    assert.equal(await run(source), `${MERGED}\n${TWO}`);
  });

  it('cuts the last line of a file that has no line break at its end', async() => {
    const source = `export const g = Handsontable;\n${MAIN}\n${COMMON}`;
    const output = await run(`${MAIN}\nexport const g: RowObject[] = [];\n${COMMON}`);

    assert.equal(output, `${MERGED}\nexport const g: RowObject[] = [];`);
    assert.ok(source.length > 0);
  });

  it('moves a comment that stands above the removed import to the declaration that took its name', async() => {
    const source = `${MAIN}\n\n// the row type\n${COMMON}\n\nexport const g: RowObject[] = [];\n`
      + 'export const h = Handsontable;\n';

    assert.equal(await run(source),
      `// the row type\n${MERGED}\n\n\nexport const g: RowObject[] = [];\nexport const h = Handsontable;\n`);
  });

  it('moves a comment at the end of the removed import line, and leaves the next statement on its line', async() => {
    const source = `${MAIN}\n${COMMON} // the row type\n${TWO}\n`;
    const output = await run(source);

    assert.equal(output, `// the row type\n${MERGED}\n${TWO}\n`);
  });

  it('keeps the other statements of a file in CRLF as they were', async() => {
    const source = [MAIN, '', COMMON, '', TWO, ''].join('\r\n');

    assert.equal(await run(source),
      [MERGED, '', '', TWO, ''].join('\r\n'));
  });

  it('keeps a one-line neighbor in a file in CRLF', async() => {
    const source = `${MAIN}\r\na();${COMMON}b();\r\nexport const g: RowObject[] = [];\r\n`;

    assert.equal(await run(source), `${MERGED}\r\na();b();\r\nexport const g: RowObject[] = [];\r\n`);
  });

  it('keeps a byte order mark at the start of a line that stays', async() => {
    const source = `${BOM}${MAIN}\n${COMMON}\n${BOM}export const g: RowObject[] = [];\n`
      + `${BOM}export const h = Handsontable;\n`;

    assert.equal(await run(source),
      `${BOM}${MERGED}\n${BOM}export const g: RowObject[] = [];\n${BOM}export const h = Handsontable;\n`);
  });

  it('keeps a license comment above the removed import, which is the first statement', async() => {
    const source = `/* license */\n${COMMON}\n${MAIN}\n${TWO}\n`;

    assert.equal(await run(source),
      `/* license */\n${MERGED}\n${TWO}\n`);
  });

  it('keeps a shebang and a directive above the removed first import', async() => {
    const head = '#!/usr/bin/env node\n\'use strict\';\n';
    const source = `${head}${COMMON}\n${MAIN}\n${TWO}\n`;

    assert.equal(await run(source),
      `${head}${MERGED}\n${TWO}\n`);
  });

  it('keeps a header comment that belongs to the removed first import, in front of the statement that follows', async() => {
    const source = `// @ts-check\n/* license */\n${COMMON}\n${MAIN}\n${TWO}\n`;
    const output = await run(source);

    assert.ok(output.startsWith('// @ts-check\n/* license */\n'), output);
    assert.ok(output.includes(`${MERGED}\nexport const g`), output);
  });

  it('keeps the statements around a removed import when a block comment stands before it on the line', async() => {
    const source = `${MAIN}\n/* a */ ${COMMON}\n${TWO}\n`;
    const output = await run(source);

    assert.ok(output.includes(`${TWO}\n`), output);
    assert.ok(output.includes('/* a */'), output);
  });

  it('cuts two removed imports of neighboring lines and keeps the rest', async() => {
    const source = `${MAIN}\n${COMMON}\nimport type { CellChange } from 'handsontable/common';\n`
      + 'export const g: RowObject[] = [];\n'
      + 'export type C = CellChange; export const h = Handsontable;\n';
    const output = await run(source);

    assert.ok(output.includes('export const g: RowObject[] = [];\nexport type C = CellChange; '
      + 'export const h = Handsontable;\n'), output);
    assert.equal(output.includes('handsontable/common'), false, output);
  });
});
