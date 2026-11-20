import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { VERSIONS_DIR, buildPlan, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';
import { blankCodeComments, blankToolComments } from '../src/lib/tool-comments.mjs';
import { validateDetectRule } from '../src/transforms/detect.mjs';

const drafts = (await loadManifests(VERSIONS_DIR)).filter(manifest => manifest.status === 'draft');
const LICENSE = '19.0.0/non-commercial-license-key';
const TODO = 'TODO(handsontable-codemod';

/**
 * Run a plan over a text three times, each run on the output of the one before.
 *
 * @param {string} filePath File name.
 * @param {string} source Starting text.
 * @param {string[]} only Rule ids.
 * @returns {Promise<Array<{output: string, changed: boolean, entries: object[]}>>} The three results.
 */
async function threeRuns(filePath, source, only) {
  const plan = buildPlan(drafts, only);
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
 * A `detect` rule that looks for text, with working defaults.
 *
 * @param {object} fields Fields that differ from the defaults.
 * @returns {object} The rule, shaped like a loaded manifest rule.
 */
function textRule(fields) {
  return {
    id: 'x/r',
    kind: 'detect',
    version: 'x',
    safe: false,
    guideUrl: null,
    files: ['js'],
    requires: 'none',
    message: 'Check this.',
    ...fields,
  };
}

/**
 * Run one rule over a file, with the markers off.
 *
 * @param {object} rule A rule from `textRule()`.
 * @param {string} source File text.
 * @param {string} filePath File name.
 * @returns {Promise<object[]>} The entries.
 */
async function entriesOf(rule, source, filePath = 'a.js') {
  const mention = filePath.endsWith('.html') ? '<!-- handsontable --> ' : '/* handsontable */ ';
  const plan = { versions: [{ version: 'x', rules: [rule] }], rulesById: new Map([[rule.id, rule]]) };

  return (await transformFile({ filePath, source: mention + source, plan, options: { markers: false } })).entries;
}

describe('the comments the tool writes', () => {
  it('are blanked with their line breaks kept, in every comment form', () => {
    const text = `a // ${TODO} r): foo. See http://x/#foo\nb /* ${TODO} r): foo */ c\n`
      + `{/* ${TODO} r): foo\n * more */}\n`;
    const blank = blankToolComments(text);

    assert.equal(blank.length, text.length);
    assert.equal(blank.split('\n').length, text.split('\n').length);
    assert.doesNotMatch(blank, /foo/);
    assert.match(blank, /^a +\nb +c\n\{ +\n +\}\n$/);
  });

  it('leave a comment of the project alone in blankToolComments(), and blankCodeComments() blanks it too', () => {
    const text = 'const a = 1; // keep me\n/* and me */ const b = "// not a comment";\n';

    assert.equal(blankToolComments(text), text);
    assert.equal(blankCodeComments('babylon', text),
      'const a = 1;           \n             const b = "// not a comment";\n');
  });

  it('blank the comments of a tab-indented file at their real offsets', () => {
    const text = '\t\tconst a = 1; // x\n\t\tconst b = 2;\n';

    assert.equal(blankCodeComments('ts', text), '\t\tconst a = 1;     \n\t\tconst b = 2;\n');
  });

  it('are never matched by a regex of a detect rule, and the same text in code is', async() => {
    const rule = textRule({ match: { regex: 'needle' } });
    const marker = `// ${TODO} x/r): Replace the thing. See https://example.com/#needle\n`;

    assert.deepEqual(await entriesOf(rule, `${marker}const a = 1;\n`), []);
    assert.equal((await entriesOf(rule, `${marker}const needle = 1;\n`)).length, 1);
    assert.deepEqual(await entriesOf(textRule({ files: ['css'], match: { regex: 'needle' } }),
      `/* ${TODO} x/r): Fix it. See https://example.com/#needle */\na { color: red; }\n`, 'a.css'), []);
  });

  it('are not read by unlessFileMatches either', async() => {
    const rule = textRule({ unlessFileMatches: 'needle', match: { regex: 'target' } });
    const marker = `// ${TODO} x/r): Replace the thing. See https://example.com/#needle\n`;

    assert.equal((await entriesOf(rule, `${marker}const target = 1;\n`)).length, 1);
    assert.deepEqual(await entriesOf(rule, '// needle\nconst target = 1;\n'), []);
  });
});

describe('the regex matcher on string values and on code', () => {
  it('rejects an unknown "in" and a "code" that does not belong', () => {
    assert.deepEqual(validateDetectRule(textRule({ match: { regex: 'a', in: 'strings', code: true } })), []);
    assert.match(validateDetectRule(textRule({ match: { regex: 'a', in: 'comments' } }))[0], /in must be "strings"/);
    assert.match(validateDetectRule(textRule({ match: { regex: 'a', code: false } }))[0], /code must be true/);
    assert.match(validateDetectRule(textRule({ match: { string: 'a', code: true } }))[0], /unknown field "code"/);
  });

  it('with in "strings" tests each js string value as a whole, never a URL or a comment that holds the word', async() => {
    const rule = textRule({ match: { regex: '^\\s*key-a\\s*$', in: 'strings', flags: 'i' } });

    assert.equal((await entriesOf(rule, 'const a = "KEY-A";\nconst b = `key-a`;\n')).length, 2);
    assert.deepEqual(await entriesOf(rule, 'const a = "https://x.test/#key-a";\nconst b = "my key-a here";\n'), []);
    assert.deepEqual(await entriesOf(rule, '// key-a\nconst a = 1;\n'), []);
    const jsx = 'export const A = () => <HotTable licenseKey="key-a" />;\n';

    assert.equal((await entriesOf(rule, jsx, 'a.tsx')).length, 1);
  });

  it('with in "strings" tests each quoted value of a template, and an apostrophe in the prose hides nothing', async() => {
    const rule = textRule({ files: ['template'], match: { regex: '^\\s*key-a\\s*$', in: 'strings' } });
    const page = '<p>don\'t panic</p>\n<hot-table license-key="key-a"></hot-table>\n'
      + '<script>new Handsontable(el, { licenseKey: \'key-a\' });</script>\n<a href="https://x.test/#key-a">docs</a>\n';
    const entries = (await entriesOf(rule, page, 'a.html')).filter(entry => entry.ruleId === 'x/r');

    assert.deepEqual(entries.map(entry => entry.line), [2, 3]);
  });

  it('with code: true ignores every comment of a js part and keeps matching code', async() => {
    const rule = textRule({ match: { regex: '\\bneedle\\b', code: true } });

    assert.deepEqual(await entriesOf(rule, '// needle\n/* needle */\nconst a = 1;\n'), []);
    assert.deepEqual(await entriesOf(rule, 'const a = <div>{/* needle */}</div>;\n', 'a.jsx'), []);
    assert.equal((await entriesOf(rule, '// needle\nconst needle = 1;\n')).length, 1);
    assert.equal((await entriesOf(rule, 'const s = "// needle";\n')).length, 1);
  });
});

describe('19.0.0/non-commercial-license-key', () => {
  const KEY = 'non-commercial-and-evaluation';

  /**
   * Assert that runs 2 and 3 change nothing and report as many entries of the rule as run 1.
   *
   * @param {Array<{changed: boolean, entries: object[]}>} runs The three results.
   * @param {number} expected Entries of the rule in run 1.
   * @returns {void}
   */
  function assertStable(runs, expected) {
    const count = result => result.entries.filter(entry => entry.ruleId === LICENSE).length;

    assert.equal(count(runs[0]), expected, 'run 1');
    assert.equal(runs[1].changed, false, 'run 2 changed the file');
    assert.equal(runs[2].changed, false, 'run 3 changed the file');
    assert.equal(count(runs[1]), expected, 'run 2 reports another number of entries');
    assert.equal(count(runs[2]), expected, 'run 3 reports another number of entries');
  }

  it('reports a key once, and its own marker is not a second key, in a js file', async() => {
    const source = `import Handsontable from 'handsontable';\nnew Handsontable(el, { licenseKey: '${KEY}' });\n`;
    const runs = await threeRuns('a.js', source, [LICENSE]);

    assert.ok(runs[0].output.includes(`${TODO} ${LICENSE}`));
    assertStable(runs, 1);
  });

  it('reports a key once in a JSX attribute and adds the marker only once', async() => {
    const source = 'import { HotTable } from \'@handsontable/react-wrapper\';\n'
      + `export const A = () => <HotTable data={[]} licenseKey="${KEY}" />;\n`;
    const runs = await threeRuns('a.tsx', source, [LICENSE]);

    assert.equal(runs[0].output.split(TODO).length - 1, 1);
    assertStable(runs, 1);
  });

  it('reports the second key of the same kind, in any letter case', async() => {
    const source = 'import Handsontable from \'handsontable\';\n'
      + 'new Handsontable(el, { licenseKey: \'Non-Commercial-And-Evaluation\' });\n'
      + 'new Handsontable(el, { licenseKey: \'ht68e-1f2b7-47158-70b05-0842f\' });\n';

    assertStable(await threeRuns('a.js', source, [LICENSE]), 2);
  });

  it('reports the Angular constant, in a file that never says handsontable', async() => {
    const source = 'import { NON_COMMERCIAL_LICENSE } from \'@somewhere/else\';\n'
      + 'export const key = NON_COMMERCIAL_LICENSE;\n';

    assertStable(await threeRuns('a.ts', source, [LICENSE]), 0);
    assertStable(await threeRuns('a.ts', `// handsontable\n${source}`, [LICENSE]), 2);
  });

  it('does not report a docs URL, a sentence, or a comment that holds the key text', async() => {
    const source = 'import Handsontable from \'handsontable\';\n'
      + `export const DOCS = 'https://handsontable.com/docs/#the-${KEY}-license-key-no-longer-works';\n`
      + `export const HINT = 'Replace ${KEY} before you ship';\n`
      + `// licenseKey: '${KEY}'\n`
      + 'new Handsontable(el, { licenseKey: \'my-own-key\' });\n';
    const runs = await threeRuns('a.js', source, [LICENSE]);

    assertStable(runs, 0);
    assert.equal(runs[0].output, source);
  });

  it('reads the key in a file that never says handsontable, and runs no other rule there', async() => {
    const source = `let licenseKey = '${KEY}';\n`
      + 'export const grid = { rowHeights: 20, undo: false, beforeInit() {}, maxLength: 5, editor: false, '
      + 'colWidths: null, strict: false, type: \'dropdown\', width: \'inherit\' };\nclass A extends BaseEditor {}\n'
      + 'registerPlugin(Loading);\n';
    const runs = await threeRuns('license.ts', source, []);

    assert.deepEqual([...new Set(runs[0].entries.map(entry => entry.ruleId))], [LICENSE]);
    assert.equal(runs[0].entries.length, 1);
    assert.equal(runs[0].entries[0].line, 1);
    assert.equal(runs[1].changed, false);
    assert.equal(runs[1].entries.length, 1);
    assert.equal(runs[2].entries.length, 1);
  });

  it('does not read a file that holds neither the key nor the word handsontable', async() => {
    const runs = await threeRuns('plain.ts', 'export const grid = { rowHeights: 20, undo: false };\n', []);

    assert.equal(runs[0].entries.length, 0);
    assert.equal(runs[0].changed, false);
  });

  it('keeps the word a marker leaves from letting a file through', async() => {
    const source = `// ${TODO} ${LICENSE}): Replace this. See https://x.test/#the-${KEY}-license-key-no-longer-works\n`
      + 'export const grid = { rowHeights: 20 };\n';
    const [first] = await threeRuns('plain.ts', source, []);

    assert.equal(first.entries.length, 0);
  });

  it('reads the key in a page that never says handsontable', async() => {
    const page = `<html><body><script>var key = '${KEY}';</script></body></html>\n`;
    const [first] = await threeRuns('index.html', page, []);

    assert.deepEqual(first.entries.map(entry => entry.ruleId), [LICENSE]);
  });
});

describe('19.0.0/editor-set-value', () => {
  it('does not report a comment that names the base class, and reports the class', async() => {
    const source = 'import Handsontable from \'handsontable\';\n// a custom editor that extends BaseEditor\n'
      + 'export class MyEditor extends Handsontable.editors.BaseEditor {}\n';
    const [first] = await threeRuns('a.ts', source, ['19.0.0/editor-set-value']);

    assert.deepEqual(first.entries.map(entry => entry.line), [3]);
  });
});
