import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { VERSIONS_DIR, buildPlan, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';

const TODO = 'TODO(handsontable-codemod';
const manifests = await loadManifests(VERSIONS_DIR);
// The rule that edits a one-line object in the "edited object" shapes: a comment inside the object makes the printer
// spread it over lines, which moves the code after it.
const OBJECT_RULE = '18.0.0/correct-format-removed';

/**
 * A plan with the rule of a body and the rule that edits the object, so a run parses and visits the file once for the
 * rules that matter and not for the whole manifest.
 *
 * @param {string} ruleId Id of the rule under test.
 * @returns {import('../src/types.mjs').Plan} The plan.
 */
function planFor(ruleId) {
  return buildPlan(manifests, [ruleId, OBJECT_RULE]);
}

const HEADER = 'import Handsontable from \'handsontable\';\n'
  + 'import { registerTheme, mainTheme } from \'handsontable/themes\';\n';

/**
 * Code that holds a call, a function, or an object on one line. `{{BODY}}` is the statement list of the shape.
 * Every shape puts the statements on the line of the wrapper, because that is where the printer spreads an object and
 * moves the next statement to a line of its own, so the anchor of a marker changes between run 1 and run 2.
 */
const WRAPPERS = [
  { name: 'function declaration', code: 'function f() { {{BODY}} }' },
  { name: 'class method', code: 'class A { m() { {{BODY}} } }' },
  { name: 'arrow function with a block', code: 'const f = () => { {{BODY}} };' },
  { name: 'object method', code: 'const o = { m() { {{BODY}} } };' },
  { name: 'method of a Vue options object', code: 'export default { mounted() { {{BODY}} } };' },
  { name: 'if block', code: 'if (ready) { {{BODY}} }' },
  // A block that is a statement of its own has no statement above it to take the marker, so the first statement
  // inside it that shares the line does.
  { name: 'block statement', code: '{ {{BODY}} }' },
  { name: 'block statement nested twice', code: '{ { {{BODY}} } }' },
  { name: 'block statement inside a function', code: 'function f() {\n  { {{BODY}} }\n}' },
  { name: 'block statement of a switch case', code: 'switch (kind) { case 1: { {{BODY}} } }' },
  { name: 'callback argument', code: 'setup(function() { {{BODY}} });' },
  { name: 'immediately invoked function', code: '(function() { {{BODY}} })();' },
  { name: 'function nested twice', code: 'function outer() { function inner() { {{BODY}} } inner(); }' },
  { name: 'arrow function in a property', code: 'export default { data: 1, run: () => { {{BODY}} } };' },
  // The statements share one line, but inside a block that has lines of its own.
  { name: 'block with a line of its own', code: 'function f() {\n  {{BODY}}\n}' },
  { name: 'nested block indented with tabs', code: 'function f() {\n\tif (ready) {\n\t\t{{BODY}}\n\t}\n}' },
  // The body is a statement without braces. A comment on the statement makes the printer move the body to its own
  // line, so the statement the second run anchors on is the body, inside the one the first run commented.
  { name: 'for without braces', code: 'for (;;) {{BODY}}', braceless: true },
  { name: 'while without braces', code: 'while (ready) {{BODY}}', braceless: true },
  { name: 'do without braces', code: 'do {{BODY}} while (ready);', braceless: true },
  { name: 'if without braces', code: 'if (ready) {{BODY}}', braceless: true },
  { name: 'if with an else without braces', code: 'if (ready) {{BODY}} else other();', braceless: true },
  { name: 'else without braces', code: 'if (ready) other(); else {{BODY}}', braceless: true },
  { name: 'labeled statement', code: 'outer: {{BODY}}', braceless: true },
  { name: 'for of without braces', code: 'for (const item of list) {{BODY}}', braceless: true },
  { name: 'nested without braces', code: 'if (ready) while (more) {{BODY}}', braceless: true },
];

const PLUGIN_HEADER = 'const hot = new Handsontable(el, {});\nconst plugin = hot.getPlugin(\'manualColumnResize\');\n';

/**
 * One kind of TODO per body: the call, option, detect, type, and theme rules, each with the plan that holds it.
 */
const BODIES = [
  { name: 'methodRemove', file: 'a.js', plan: planFor('18.0.0/core-undo-methods'), code: 'this.hot.undo();' },
  {
    name: 'optionRemove',
    file: 'a.js',
    plan: planFor(OBJECT_RULE),
    code: 'new Handsontable(el, { data: [], correctFormat: true });',
  },
  // The two bodies that reach the statement carriers: a kept call, whose TODO is the comment of a statement, and a bare
  // call, which a statement without braces keeps with a TODO and a block removes (the text of the statement is cut out).
  {
    name: 'methodRemove kept: the result is used',
    file: 'a.js',
    plan: planFor('18.0.0/resize-state-methods'),
    header: PLUGIN_HEADER,
    code: 'check(plugin.saveManualColumnWidths());',
  },
  {
    name: 'methodRemove: a bare call',
    file: 'a.js',
    plan: planFor('18.0.0/resize-state-methods'),
    header: PLUGIN_HEADER,
    code: 'plugin.saveManualColumnWidths();',
    removedInBlocks: true,
  },
  { name: 'detect', file: 'a.js', plan: planFor('18.0.0/helper-typings-only'), code: 'Handsontable.helper.isIE();' },
  {
    name: 'type rule',
    file: 'a.ts',
    plan: planFor('18.0.0/ns-nestedheaders-settings'),
    code: 'let x: Handsontable.plugins.NestedHeaders.Settings;',
    declaration: true,
  },
  {
    name: 'themeToken',
    file: 'a.js',
    plan: planFor('18.0.0/theme-token-wrapper-border-color'),
    code: 'registerTheme(\'t\', mainTheme).params({ tokens: { wrapperBorderColor: 1 } });',
  },
  {
    name: '19.0 detect',
    file: 'a.js',
    plan: planFor('19.0.0/non-commercial-license-key'),
    code: 'new Handsontable(el, { licenseKey: \'non-commercial-and-evaluation\', rowHeights: 20 });',
  },
  {
    name: 'optionRemove kept in a one-line array element',
    file: 'a.js',
    plan: planFor(OBJECT_RULE),
    code: 'new Handsontable(el, { columns: [{ type: \'date\', correctFormat: x() }, { type: \'text\' }] });',
  },
  {
    name: 'optionRemove kept next to a custom reader',
    file: 'a.js',
    plan: planFor(OBJECT_RULE),
    code: 'new Handsontable(el, { columns: [{ type: \'date\', correctFormat: true, validator: v }, { a: 1 }] });',
  },
  {
    name: 'optionMove kept next to a custom renderer',
    file: 'a.js',
    plan: planFor('18.0.0/numeric-format-culture'),
    code: 'new Handsontable(el, { columns: [{ renderer: r, numericFormat: { culture: \'de-DE\' } }, { a: 1 }] });',
  },
  {
    name: 'optionRemove kept in an object argument that another rule rewrites',
    file: 'a.js',
    plan: buildPlan(manifests, ['18.0.0/date-picker-config-removed', '18.0.0/numeric-format-culture']),
    // A cell object, because the move of a grid-level culture is only reported. The pattern keeps the note about the
    // number format out, so the object holds one TODO.
    code: 'hot.setCellMetaObject(0, 0, { type: \'numeric\', numericFormat: { culture: \'nb-NO\', pattern: \'0,0\' }, '
      + 'datePickerConfig: cfg() });',
  },
  {
    name: 'JSX element with a TODO',
    file: 'a.jsx',
    plan: planFor(OBJECT_RULE),
    header: 'import { HotTable } from \'@handsontable/react-wrapper\';\n',
    code: 'return <HotTable licenseKey="k" correctFormat={x()} />;',
  },
];

/**
 * The other statements on the line: none, one on each side of the statement under test, and a one-line object that the run
 * edits, before it and after it.
 */
const NEIGHBORS = [
  { name: 'alone', before: '', after: '' },
  { name: 'between two statements', before: 'a(); ', after: ' b(); c();' },
  {
    name: 'after a one-line object that the run edits',
    before: 'this.hot = new Handsontable(this.$el, { correctFormat: true, data: [] }); ',
    after: '',
  },
  {
    name: 'before a one-line object that the run edits',
    before: '',
    after: ' this.hot = new Handsontable(this.$el, { correctFormat: true, data: [] });',
  },
];

const BRACELESS_NEIGHBORS = new Set(['alone', 'before a one-line object that the run edits']);

/**
 * Transform a text three times, each run on the output of the one before.
 *
 * @param {object} item The shape.
 * @param {string} source Starting text.
 * @returns {Promise<Array<{output: string, changed: boolean, entries: object[]}>>} The three results.
 */
async function threeRuns(item, source) {
  const results = [];
  let text = source;

  for (let run = 0; run < 3; run += 1) {
    const result = await transformFile({ filePath: item.file, source: text, plan: item.plan, options: {} });

    results.push(result);
    text = result.output;
  }

  return results;
}

/**
 * Count what a run leaves for the user to read: the entries that are not `changed`, by rule id and severity.
 *
 * @param {object[]} entries The entries of one run.
 * @returns {string} A stable text.
 */
function standing(entries) {
  const counts = {};

  for (const entry of entries.filter(item => item.severity !== 'changed')) {
    const key = `${entry.ruleId} (${entry.severity})`;

    counts[key] = (counts[key] ?? 0) + 1;
  }

  return JSON.stringify(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

const count = text => text.split(TODO).length - 1;

describe('a call that shares its line with other code stays stable across three runs', () => {
  for (const body of BODIES) {
    describe(body.name, () => {
      // A declaration is no body for a statement without braces, and a statement without braces takes the neighbors
      // that stand around the whole wrapper, two of which show the shift of a line that a one-line object causes.
      for (const wrapper of WRAPPERS.filter(item => !(item.braceless && body.declaration))) {
        for (const neighbor of NEIGHBORS.filter(item => !wrapper.braceless || BRACELESS_NEIGHBORS.has(item.name))) {
          it(`${wrapper.name}, ${neighbor.name}`, async() => {
            // A statement without braces holds one statement, so the neighbors stand around the whole wrapper.
            const inside = wrapper.braceless ? body.code : `${neighbor.before}${body.code}${neighbor.after}`;
            const shape = wrapper.code.replace('{{BODY}}', inside);
            const around = wrapper.braceless ? `${neighbor.before}${shape}${neighbor.after}` : shape;
            const source = `${HEADER}${body.header ?? ''}${around}\n`;
            const [one, two, three] = await threeRuns(body, source);

            // A block removes a bare call, so there is no comment to count, and the call is gone from the text.
            const removed = body.removedInBlocks && !wrapper.braceless;

            if (removed) {
              assert.equal(one.output.includes('saveManualColumnWidths'), false, `the call stayed:\n${one.output}`);
            } else {
              assert.ok(count(one.output) > 0, `run 1 left no TODO comment:\n${one.output}`);
            }

            assert.equal(two.changed, false, `run 2 changed the file:\n${one.output}\n--- run 2\n${two.output}`);
            assert.equal(three.changed, false, `run 3 changed the file:\n${three.output}`);
            assert.equal(count(two.output), count(one.output), 'run 2 changed the number of TODO comments');
            assert.equal(standing(three.entries), standing(two.entries), 'run 3 reports other entries than run 2');

            for (const result of [one, two, three]) {
              const failed = result.entries.filter(entry => /^(?:parse|transform)-error$/.test(entry.ruleId));

              assert.deepEqual(failed, [], `a run failed on:\n${one.output}`);
            }
          });
        }
      }
    });
  }

  it('marks every manual step that sits in a one-line block, and the entries say so', async() => {
    const body = BODIES[0];
    const blocks = [
      '{ {{BODY}} }',
      '{ { {{BODY}} } }',
      '{ let a = 1; {{BODY}} let b = 2; }',
      'if (ready) { {{BODY}} }',
      'const f = () => { {{BODY}} };',
      'const g = () => this.hot.undo();',
    ];

    for (const block of blocks) {
      const source = `${HEADER}${block.replace('{{BODY}}', body.code)}\n`;
      const [one, two, three] = await threeRuns(body, source);
      const manual = one.entries.filter(entry => entry.severity === 'manual');

      assert.ok(manual.length > 0, block);
      assert.ok(manual.every(entry => entry.marked), `an entry has no marker in: ${one.output}`);
      assert.equal(count(one.output), manual.length, one.output);
      assert.equal(two.changed, false, one.output);
      assert.equal(three.changed, false, block);
      assert.ok(two.entries.filter(entry => entry.severity === 'manual').every(entry => entry.marked), block);
    }
  });

  it('adds no second comment above a property of the object argument of a top-level call', async() => {
    const body = BODIES.find(item => item.name.startsWith('optionRemove kept in an object argument'));
    const source = `${HEADER}const hot = new Handsontable(el, { licenseKey: 'k' });\n${body.code}\n`;
    const [one, two, three] = await threeRuns(body, source);

    assert.equal(count(one.output), 1, one.output);
    assert.equal(two.changed, false, two.output);
    assert.equal(three.changed, false);
  });

  it('keeps one comment for each of two calls that stand on different lines of one function', async() => {
    const body = BODIES[0];
    const source = `${HEADER}function f() {\n  this.hot.undo();\n  this.hot.redo();\n}\n`;
    const [one, two] = await threeRuns(body, source);

    assert.equal(count(one.output), 2);
    assert.equal(two.changed, false);
  });

  it('gives a call on a line of its own a comment of its own, next to a call on the line of its object', async() => {
    const body = BODIES[0];
    const source = `${HEADER}export default { a() { this.hot.undo(); },\n  b() {\n    this.hot.undo();\n  } };\n`;
    const [one, two, three] = await threeRuns(body, source);

    assert.equal(count(one.output), 2, one.output);
    assert.equal(two.changed, false);
    assert.equal(three.changed, false);
  });

  it('does not let the marker of another rule stand in for the marker of a call', async() => {
    const body = BODIES[0];
    const source = `${HEADER}export default { mounted() { new Handsontable(el, { correctFormat: true });\n`
      + '    this.hot.undo(); } };\n';
    const [one, two] = await threeRuns(body, source);

    assert.equal(count(one.output), 2, one.output);
    assert.equal(two.changed, false);
  });

  it('holds in a file with CRLF line endings and in a file indented with tabs', async() => {
    const body = BODIES[0];
    const shape = 'export default { mounted() { this.hot = new Handsontable(this.$el, { correctFormat: true, '
      + 'data: [] }); this.hot.undo(); } };\n';
    const crlf = `${HEADER}${shape}`.replace(/\n/g, '\r\n');
    const tabbed = `${HEADER}function f() {\n\tif (ready) {\n`
      + '\t\tthis.hot = new Handsontable(this.$el, { correctFormat: true, data: [] }); this.hot.undo();\n\t}\n}\n';

    for (const source of [crlf, tabbed]) {
      const [one, two, three] = await threeRuns(body, source);

      assert.ok(count(one.output) >= 2, one.output);
      assert.equal(two.changed, false, `run 2 changed:\n${JSON.stringify(two.output)}`);
      assert.equal(three.changed, false);
    }
  });

  it('puts one shared comment above two calls on one line, reports both, and adds none on a second run', async() => {
    const body = BODIES[0];
    const source = `${HEADER}export default { mounted() { this.hot.undo(); this.hot.redo(); } };\n`;
    const [one, two, three] = await threeRuns(body, source);

    // One line takes one marker per rule, so the two calls share it; each call still has its own report entry.
    assert.equal(count(one.output), 1, one.output);
    assert.deepEqual(one.entries.filter(entry => entry.severity === 'manual').map(entry => entry.marked), [true, true]);
    assert.equal(two.changed, false);
    assert.equal(three.changed, false);
  });
});
