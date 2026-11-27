import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertLeadingTrivia, maskShebang, splitBom, unmaskShebang } from '../src/lib/leading-trivia.mjs';
import { transformFile } from '../src/runner.mjs';
import { VERSIONS_DIR, buildPlan, loadManifests } from '../src/manifest.mjs';

const BOM = '\uFEFF';
const SHEBANG = '#!/usr/bin/env node';
const MERGE = ['18.0.0/common-imports'];
const REMOVE = ['18.0.0/resize-state-methods'];

const IMPORTS = [
  'import Handsontable from \'handsontable\';',
  'import { RowObject } from \'handsontable/common\';',
  'export const rows: RowObject[] = [];',
  'export const grid = Handsontable;',
  '',
];
const MERGED_FIRST = 'import Handsontable, { RowObject } from \'handsontable\';';
const REMOVED = [
  'hot.getPlugin(\'manualColumnResize\').saveManualColumnWidths();',
  'import Handsontable from \'handsontable\';',
  'const hot = new Handsontable(document.body, {});',
  '',
];

/**
 * Run selected rules over one text.
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
 * The text a run writes for a file that starts with `head`, in a line ending style.
 *
 * @param {string} head What comes before the first statement.
 * @param {string[]} lines The statements.
 * @param {string} only Rule id.
 * @param {string} eol Line terminator.
 * @returns {Promise<string>} The output.
 */
async function run(head, lines, only, eol) {
  const source = head.replace(/\n/g, eol) + lines.join(eol);
  const result = await transform(source, 'a.ts', [only]);

  assert.equal(result.changed, true, `the rule did not run: ${JSON.stringify(result.entries)}`);
  assert.equal(result.entries.some(entry => entry.ruleId === 'transform-error'), false, JSON.stringify(result.entries));

  return result.output;
}

for (const [label, eol] of [['LF', '\n'], ['CRLF', '\r\n']]) {
  describe(`what stands before the first statement (${label})`, () => {
    const heads = {
      'a shebang': `${SHEBANG}\n`,
      'a byte order mark': BOM,
      'a byte order mark and a shebang': `${BOM}${SHEBANG}\n`,
      'a shebang and a license comment': `${SHEBANG}\n/* license */\n`,
      'a license comment': '/* license */\n',
      'a type-check and an eslint directive': '// @ts-check\n/* eslint-disable */\n',
      'a directive prologue': '\'use client\';\n',
      'a shebang, a comment, and a directive': `${SHEBANG}\n// note\n'use strict';\n`,
    };

    for (const [name, head] of Object.entries(heads)) {
      it(`keeps ${name} when the first statement is merged into an earlier import`, async() => {
        const output = await run(head, IMPORTS, MERGE[0], eol);

        assert.equal(output, head.replace(/\n/g, eol) + [MERGED_FIRST, ...IMPORTS.slice(2)].join(eol));
      });

      it(`keeps ${name} when the first statement is removed`, async() => {
        const output = await run(head, REMOVED, REMOVE[0], eol);

        assert.equal(output, head.replace(/\n/g, eol) + REMOVED.slice(1).join(eol));
      });
    }

    it('keeps the line break after a shebang that has nothing but code after it', async() => {
      const output = await run(`${SHEBANG}\n`, IMPORTS, MERGE[0], eol);

      assert.equal(output.split(eol)[0], SHEBANG);
      assert.equal(output.split(eol)[1], MERGED_FIRST);
    });
  });
}

describe('assertLeadingTrivia(), maskShebang(), and splitBom()', () => {
  it('makes the shebang line a comment of the same length and writes it back', () => {
    const source = `${SHEBANG}\nimport a from 'a';\n`;
    const masked = maskShebang(source);

    assert.equal(masked, `//${SHEBANG.slice(2)}\nimport a from 'a';\n`);
    assert.equal(masked.length, source.length);
    assert.equal(maskShebang(`${BOM}${SHEBANG}\nx;`), `${BOM}//${SHEBANG.slice(2)}\nx;`);
    assert.equal(unmaskShebang(source, `${masked.slice(0, SHEBANG.length)}\nimport b from 'b';\n`),
      `${SHEBANG}\nimport b from 'b';\n`);
    assert.equal(unmaskShebang(SHEBANG, `//${SHEBANG.slice(2)}`), SHEBANG);
  });

  it('leaves a text with no shebang alone, and a "#!" that is not on the first line', () => {
    assert.equal(maskShebang('y;\n'), 'y;\n');
    assert.equal(maskShebang('\n#!x\n'), '\n#!x\n');
    assert.equal(unmaskShebang('y;\n', 'x;\n'), 'x;\n');
  });

  it('splits a byte order mark off the text', () => {
    assert.deepEqual(splitBom(`${BOM}x;`), { bom: BOM, text: 'x;' });
    assert.deepEqual(splitBom('x;'), { bom: '', text: 'x;' });
  });

  it('throws when the shebang comment is gone, fused with code, or no longer first', () => {
    const source = `${SHEBANG}\ny;\n`;
    const comment = `//${SHEBANG.slice(2)}`;

    assert.throws(() => unmaskShebang(source, 'x;\n'), /shebang/);
    assert.throws(() => unmaskShebang(source, `${comment}import b from 'b';\n`), /shebang/);
    assert.throws(() => unmaskShebang(source, `// other\n${comment}\nx;\n`), /shebang/);
  });

  it('accepts added comments and throws on a lost comment or directive', () => {
    const source = '// a\n/* b */\n\'use strict\';\n// c\nx();\n';

    assertLeadingTrivia('babylon', source, '// a\n/* b */\n\'use strict\';\n// c\n// added\nx();\n');
    assertLeadingTrivia('babylon', source, '// a\n// moved\n/* b */\n\'use strict\';\n// c\nx();\n');
    assert.throws(() => assertLeadingTrivia('babylon', source, '/* b */\n\'use strict\';\n// c\nx();\n'), /comment/);
    assert.throws(() => assertLeadingTrivia('babylon', source, '// a\n/* b */\n// c\nx();\n'), /directive/);
    assert.throws(() => assertLeadingTrivia('babylon', source,
      '/* b */\n// a\n\'use strict\';\n// c\nx();\n'), /comment/);
  });

  it('does not count a comment that follows the first statement', () => {
    assertLeadingTrivia('babylon', 'x();\n// later\ny();\n', 'y();\n');
  });
});
