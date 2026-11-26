import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import tsxParser from 'jscodeshift/parser/tsx.js';
import { buildPlan, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';

const manifests = await loadManifests();
const RULES = ['18.0.0/correct-format-removed', '18.0.0/date-picker-config-removed'];
const PLAN = buildPlan(manifests.filter(manifest => manifest.version === '18.0.0'), RULES);
const IMPORT = 'import { HotTable, HotColumn } from \'@handsontable/react-wrapper\';\n';
const TODO = 'TODO(handsontable-codemod';

/**
 * What JSX makes of the text between tags: the algorithm of the compiler, which drops the lines that hold only white
 * space and trims the ends of the others.
 *
 * @param {string} text The decoded text of a `JSXText`.
 * @returns {string} The text the element renders.
 */
function rendered(text) {
  const lines = text.split(/\r\n|\n|\r/);
  let last = 0;

  lines.forEach((line, index) => {
    if (/[^ \t]/.test(line)) {
      last = index;
    }
  });

  return lines.map((line, index) => {
    let value = line.replace(/\t/g, ' ');

    if (index !== 0) {
      value = value.replace(/^ +/, '');
    }

    if (index !== lines.length - 1) {
      value = value.replace(/ +$/, '');
    }

    return value && index !== last ? `${value} ` : value;
  }).join('');
}

/**
 * Every text of a source that JSX renders, and every text that is not blank, as written.
 *
 * @param {string} source A tsx source.
 * @returns {{rendered: string[], raw: string[]}} The rendered texts in order, and the raw non-blank texts.
 */
function jsxTexts(source) {
  const found = { rendered: [], raw: [] };
  const walk = (node) => {
    if (!node || typeof node !== 'object') {
      return;
    }

    if (Array.isArray(node)) {
      node.forEach(walk);

      return;
    }

    if (node.type === 'JSXText') {
      const text = rendered(node.value);

      if (text !== '') {
        found.rendered.push(text);
      }

      if (/\S/.test(node.value)) {
        found.raw.push(source.slice(node.start, node.end));
      }
    }

    Object.keys(node).filter(key => !['loc', 'tokens', 'comments', 'extra'].includes(key))
      .forEach(key => walk(node[key]));
  };

  walk(tsxParser().parse(source));

  return found;
}

/**
 * Run the rules three times and check what the TODO did to the JSX.
 *
 * @param {string} source A tsx source.
 * @param {number} [todos] How many TODO comments run 1 leaves.
 * @returns {Promise<string>} The output of run 1.
 */
async function check(source, todos = 1) {
  const runs = [];
  let text = source;

  for (let index = 0; index < 3; index += 1) {
    const result = await transformFile({ filePath: 'grid.tsx', source: text, plan: PLAN, options: {} });

    assert.deepEqual(result.entries.filter(entry => /error$/.test(entry.ruleId)), [], `run ${index + 1} failed`);
    runs.push(result);
    text = result.output;
  }

  const [one, two, three] = runs;

  assert.equal(one.output.split(TODO).length - 1, todos, `run 1 left another number of TODO comments:\n${one.output}`);
  assert.equal(two.output, one.output, `run 2 changed the file:\n${two.output}`);
  assert.equal(three.output, one.output, 'run 3 changed the file');
  assert.equal(two.entries.length, one.entries.length, 'run 2 reports another number of entries');
  assert.equal(three.entries.length, one.entries.length, 'run 3 reports another number of entries');

  const before = jsxTexts(source);
  const after = jsxTexts(one.output);

  assert.deepEqual(after.rendered, before.rendered, `the text the JSX renders changed:\n${one.output}`);
  assert.deepEqual(after.raw, before.raw, `the bytes of a JSX text changed:\n${one.output}`);

  return one.output;
}

const COMPUTED = 'licenseKey="k" correctFormat={x()}';
const TWO = `${COMPUTED} datePickerConfig={y()}`;

describe('a TODO next to a JSX element leaves the text of its parent as it was', () => {
  it('keeps the space before an element that stands on its own line', async() => {
    await check(`${IMPORT}const a = (\n  <p>\n    Showing {count} rows\n    <HotTable ${COMPUTED} />\n  </p>\n);\n`);
  });

  it('keeps the space around an expression on one line', async() => {
    await check(`${IMPORT}const a = <p>{count} rows <HotTable ${COMPUTED} /></p>;\n`);
  });

  it('keeps the text before and after the element', async() => {
    const body = '\n    Before the grid \n    <HotTable licenseKey="k" correctFormat={x()} />\n'
      + '    after the grid, \n    and more\n';

    await check(`${IMPORT}const a = (\n  <p>${body}  </p>\n);\n`);
    await check(`${IMPORT}const a = <p>before <HotTable ${COMPUTED} /> after</p>;\n`);
  });

  it('keeps an entity and the white space it holds', async() => {
    await check(`${IMPORT}const a = <p>Rows:&nbsp;{count}&nbsp;<HotTable ${COMPUTED} />&nbsp;&amp; more</p>;\n`);
    const text = '    &nbsp;Tom &amp; Jerry &lt;3\n';

    await check(`${IMPORT}const a = (\n  <p>\n${text}    <HotTable ${COMPUTED} />\n  </p>\n);\n`);
  });

  it('keeps a text of several lines, with tabs', async() => {
    const text = '\t\tFirst line of text\n\t\tsecond line {count}\n\t\tthird line\n';

    await check(`${IMPORT}const a = (\n\t<section>\n${text}\t\t<HotTable ${COMPUTED} />\n\t</section>\n);\n`);
  });

  it('keeps the text in a file with CRLF line endings, and an untouched fragment next to it', async() => {
    const source = `${IMPORT}const a = (\n  <>\n    Showing {count} rows\n    <HotTable ${COMPUTED} />\n  </>\n);\n`
      + 'const b = (\n  <>\n    <HotTable licenseKey="k" />\n    <HotTable licenseKey="k" />\n  </>\n);\n';
    const output = await check(source.replace(/\n/g, '\r\n'));

    assert.ok(!/(?<!\r)\n/.test(output), 'a line break lost its carriage return');
    assert.ok(output.endsWith('  <>\r\n    <HotTable licenseKey="k" />\r\n    <HotTable licenseKey="k" />\r\n'
      + '  </>\r\n);\r\n'));
  });

  it('keeps the text around an element inside a conditional, a map callback, and a fragment', async() => {
    await check(`${IMPORT}const a = <div>total {n} rows {ok && <HotTable ${COMPUTED} />} end</div>;\n`);
    await check(`${IMPORT}const a = <div>all {list.map(i => <HotTable key={i} ${COMPUTED} />)} done</div>;\n`);
    await check(`${IMPORT}const a = <>head <HotTable ${COMPUTED} /> tail</>;\n`);
  });

  it('keeps the text of a sibling element that the run does not touch', async() => {
    await check(`${IMPORT}const a = <div><b> bold </b> and <HotTable ${COMPUTED} /> <i>italic </i></div>;\n`);
  });

  it('keeps the texts of a column inside a grid', async() => {
    const column = '    <HotColumn type="date" correctFormat={x()} />\n    note: {a} b\n';

    await check(`${IMPORT}const a = (\n  <HotTable licenseKey="k">\n${column}  </HotTable>\n);\n`);
  });

  it('still leaves the TODO where it was', async() => {
    const output = await check(`${IMPORT}const a = <p>{count} rows <HotTable ${COMPUTED} /></p>;\n`);

    assert.match(output, /\{\/\* TODO\(handsontable-codemod 18\.0\.0\/correct-format-removed\)[^}]*\*\/\}<HotTable/);
  });
});

describe('every flagged JSX child on a line of its own gets a marker of its own', () => {
  const plan19 = buildPlan(manifests.filter(manifest => manifest.version === '19.0.0'), ['19.0.0/col-widths-null']);
  const lines = [
    '    <HotTable data={[]} colWidths={null} />',
    '    {ok && <HotTable data={[]} colWidths={null} />}',
    '    {list.map(i => <HotTable data={[]} colWidths={null} />)}',
  ];
  const source = `${IMPORT}export const a = (\n  <div>\n${lines.join('\n')}\n  </div>\n);\n`;

  /**
   * Run the rule three times and check that runs 2 and 3 change nothing.
   *
   * @param {string} text A tsx source.
   * @returns {Promise<{output: string, entries: object[]}>} Run 1.
   */
  async function stable(text) {
    const one = await transformFile({ filePath: 'grid.tsx', source: text, plan: plan19, options: {} });
    const two = await transformFile({ filePath: 'grid.tsx', source: one.output, plan: plan19, options: {} });
    const three = await transformFile({ filePath: 'grid.tsx', source: two.output, plan: plan19, options: {} });

    assert.equal(one.entries.some(entry => /error$/.test(entry.ruleId)), false, JSON.stringify(one.entries));
    assert.equal(two.output, one.output, 'run 2 changed the file');
    assert.equal(three.output, one.output, 'run 3 changed the file');

    return one;
  }

  it('puts one JSX comment in front of each of the three children and none on the statement', async() => {
    const { output } = await stable(source);
    const rows = output.split('\n');

    assert.equal(output.split(TODO).length - 1, 3, output);
    assert.equal(rows.filter(row => row.trimStart().startsWith(`// ${TODO}`)).length, 0, output);

    for (const child of ['<HotTable data', '{ok && <HotTable', '{list.map(']) {
      const at = rows.findIndex(row => row.trimStart().startsWith(child));

      assert.match(rows[at - 1], /^\s*\{\/\* TODO\(handsontable-codemod 19\.0\.0\/col-widths-null\)/, child);
    }
  });

  it('says marked for each entry, as each has its own marker', async() => {
    const { entries } = await stable(source);
    const manual = entries.filter(entry => entry.severity === 'review');

    assert.equal(manual.length, 3);
    assert.deepEqual(manual.map(entry => entry.marked), [true, true, true]);
  });

  it('marks a child that shares its line with a sibling', async() => {
    const text = `${IMPORT}export const a = (\n  <div>\n    <b>x</b>{ok && <HotTable data={[]} colWidths={null} />}\n`
      + '  </div>\n);\n';
    const { output } = await stable(text);

    assert.equal(output.split(TODO).length - 1, 1, output);
  });
});

describe('every flagged JSX child of one line gets a marker of its own', () => {
  const plan19 = buildPlan(manifests.filter(manifest => manifest.version === '19.0.0'), ['19.0.0/col-widths-null']);
  const flagged = '<HotTable data={[]} colWidths={null} />';
  const clean = '<HotTable data={[]} />';
  const wrap = body => `${IMPORT}export const a = (\n  <div>\n    ${body}\n  </div>\n);\n`;

  /**
   * Run the rule three times: runs 2 and 3 must change nothing, and the text must stay valid JSX.
   *
   * @param {string} text A tsx source.
   * @returns {Promise<{output: string, entries: object[]}>} Run 1.
   */
  async function stable(text) {
    const runs = [];
    let current = text;

    for (let run = 0; run < 3; run += 1) {
      const result = await transformFile({ filePath: 'grid.tsx', source: current, plan: plan19, options: {} });

      assert.equal(result.entries.some(entry => /error$/.test(entry.ruleId)), false, JSON.stringify(result.entries));
      runs.push(result);
      current = result.output;
    }

    assert.equal(runs[1].output, runs[0].output, 'run 2 changed the file');
    assert.equal(runs[2].output, runs[0].output, 'run 3 changed the file');
    assert.doesNotThrow(() => tsxParser().parse(runs[0].output), `the output is not valid JSX:\n${runs[0].output}`);

    return runs[0];
  }

  const todosIn = text => text.split(TODO).length - 1;

  it('puts a marker in front of each of two siblings on one line', async() => {
    const { output, entries } = await stable(wrap(`${flagged}${flagged}`));
    const [row] = output.split('\n').filter(line => line.includes('<HotTable data={[]} colWidths={null} />{/*'));

    assert.equal(todosIn(output), 2, output);
    assert.ok(row, output);
    assert.ok(entries.filter(entry => entry.severity === 'review').every(entry => entry.marked === true));
  });

  it('puts a marker in front of a sibling and of a conditional child on one line', async() => {
    const { output } = await stable(wrap(`${flagged} {ok && ${flagged}}`));

    assert.equal(todosIn(output), 2, output);
    assert.match(output, /\/> \{\/\* TODO\(handsontable-codemod 19\.0\.0\/col-widths-null\)[^}]*\*\/\}\{ok &&/);
  });

  it('marks only the flagged one of two siblings', async() => {
    const first = await stable(wrap(`${flagged}${clean}`));
    const second = await stable(wrap(`${clean}${flagged}`));

    assert.equal(todosIn(first.output), 1, first.output);
    assert.equal(todosIn(second.output), 1, second.output);
    assert.match(second.output, /<HotTable data=\{\[\]\} \/>\{\/\* TODO[^}]*\*\/\}<HotTable data=\{\[\]\} colWidths/);
  });

  it('leaves one marker for two flagged attributes of one element', async() => {
    const { output } = await stable(wrap('<HotTable colWidths={null} data={[]} licenseKey="k" colWidths={null} />'));

    assert.equal(todosIn(output), 1, output);
  });

  it('marks each of seven siblings, which the report collapses into one entry', async() => {
    const { output, entries } = await stable(wrap(flagged.repeat(7)));

    assert.equal(todosIn(output), 7, output);
    assert.equal(entries.filter(entry => entry.severity === 'review').length, 1);
  });

  it('marks the first one of siblings that sit in a fragment with a text between them', async() => {
    const { output } = await stable(`${IMPORT}export const a = <>${flagged} and ${flagged}</>;\n`);

    assert.equal(todosIn(output), 2, output);
  });
});

describe('two TODOs on one JSX child do not multiply', () => {
  it('holds in a parent element', async() => {
    await check(`${IMPORT}const a = <div><HotTable ${TWO} /></div>;\n`, 2);
  });

  it('holds in a conditional', async() => {
    await check(`${IMPORT}const a = <div>{ok && <HotTable ${TWO} />}</div>;\n`, 2);
  });

  it('holds in a map callback', async() => {
    await check(`${IMPORT}const a = <div>{list.map(i => <HotTable key={i} ${TWO} />)}</div>;\n`, 2);
  });

  it('holds in a fragment', async() => {
    await check(`${IMPORT}const a = <><HotTable ${TWO} /></>;\n`, 2);
  });

  it('holds on lines of their own, with text around', async() => {
    await check(`${IMPORT}const a = (\n  <div>\n    intro\n    <HotTable ${TWO} />\n    outro\n  </div>\n);\n`, 2);
  });

  it('gives each of two elements its own pair', async() => {
    await check(`${IMPORT}const a = <div><HotTable ${TWO} /><HotTable ${TWO} /></div>;\n`, 4);
  });
});
