import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { VERSIONS_DIR, buildPlan, loadManifest, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';
import { listFixtures } from './helpers/fixtures.mjs';

const TODO = 'TODO(handsontable-codemod';
const allManifests = await loadManifests(VERSIONS_DIR);
const fullPlan = buildPlan(allManifests, []);

/**
 * Transform a text three times in a row, each run on the output of the one before.
 *
 * @param {string} filePath File name, for the adapter.
 * @param {string} source Starting text.
 * @param {import('../src/types.mjs').Plan} plan The rules.
 * @param {object} [options] Run options.
 * @returns {Promise<string[]>} The text after run 1, 2, and 3.
 */
async function threeRuns(filePath, source, plan, options = {}) {
  const outputs = [];
  let text = source;

  for (let run = 0; run < 3; run += 1) {
    text = (await transformFile({ filePath, source: text, plan, options })).output;
    outputs.push(text);
  }

  return outputs;
}

/**
 * One-line shapes for every kind that leaves a TODO comment. Each input is a single line (or a one-line object
 * inside a call) because that is where the parser attaches a comment to a neighbor, not to the node it was
 * written for. `todos` is how many different TODO comments the first run must leave.
 */
const ONE_LINE_CASES = [
  {
    name: 'themeToken removal in a one-line object',
    file: 'a.ts',
    todos: 1,
    source: 'import { registerTheme, mainTheme } from \'handsontable/themes\';\n'
      + 'registerTheme(\'t\', mainTheme).params({ tokens: { wrapperBorderRadius: 1, wrapperBorderColor: 2 } });\n',
  },
  {
    name: 'themeToken removal of two tokens in a one-line object',
    file: 'a.ts',
    todos: 2,
    source: 'import { registerTheme, mainTheme } from \'handsontable/themes\';\n'
      + 'registerTheme(\'t\', mainTheme).params({ tokens: { a: 1, wrapperBorderWidth: 1, wrapperBorderColor: 2 } });\n',
  },
  {
    name: 'themeToken removal as the last token of a one-line object',
    file: 'a.ts',
    todos: 1,
    source: 'import { registerTheme, mainTheme } from \'handsontable/themes\';\n'
      + 'registerTheme(\'t\', mainTheme).params({ tokens: { a: 1, wrapperBorderColor: \'#000\' } });\n',
  },
  {
    name: 'themeToken removal in a multi-line object',
    file: 'a.ts',
    todos: 1,
    source: 'import { registerTheme, mainTheme } from \'handsontable/themes\';\n'
      + 'registerTheme(\'t\', mainTheme).params({\n  tokens: {\n    a: 1,\n    wrapperBorderColor: 2,\n  },\n});\n',
  },
  {
    name: 'optionRemove in a one-line object',
    file: 'a.js',
    todos: 2,
    source: 'import Handsontable from \'handsontable\';\n'
      + 'new Handsontable(el, { data: [], correctFormat: true, datePickerConfig: {}, colHeaders: true });\n',
  },
  {
    name: 'optionRemove of the last property of a one-line object',
    file: 'a.js',
    todos: 1,
    source: 'import Handsontable from \'handsontable\';\nnew Handsontable(el, { data: [], correctFormat: true });\n',
  },
  {
    name: 'optionRemove of the only property',
    file: 'a.js',
    todos: 1,
    source: 'import Handsontable from \'handsontable\';\nnew Handsontable(el, { correctFormat: true });\n',
  },
  {
    name: 'optionRemove on a one-line wrapper element',
    file: 'a.tsx',
    todos: 1,
    source: 'import { HotColumn } from \'@handsontable/react-wrapper\';\n'
      + 'export const A = () => <HotColumn data="a" correctFormat />;\n',
  },
  {
    name: 'optionRemove on a wrapper element that is a JSX child',
    file: 'a.tsx',
    todos: 1,
    source: 'import { HotTable, HotColumn } from \'@handsontable/react-wrapper\';\n'
      + 'export const A = () => (\n  <HotTable data={[]}>\n    <HotColumn data="a" correctFormat />\n'
      + '    <HotColumn data="b" />\n  </HotTable>\n);\n',
  },
  {
    name: 'methodRemove on a used result',
    file: 'a.js',
    todos: 1,
    source: 'import Handsontable from \'handsontable\';\n'
      + 'const hot = new Handsontable(el, { manualColumnResize: true });\n'
      + 'const columns = hot.getPlugin(\'manualColumnResize\');\nconst w = columns.loadManualColumnWidths();\n',
  },
  {
    name: 'cssVariable removal in one-line css',
    file: 'a.css',
    todos: 1,
    source: '.ht-theme-main { --ht-wrapper-border-width: 1px; color: red; }\n',
  },
];

describe('idempotency of TODO comments', () => {
  for (const item of ONE_LINE_CASES) {
    it(`${item.name}: runs 2 and 3 change nothing and add no second comment`, async() => {
      const [first, second, third] = await threeRuns(item.file, item.source, fullPlan);
      const count = text => text.split(TODO).length - 1;

      assert.equal(count(first), item.todos, `run 1 should leave ${item.todos} TODO comment(s):\n${first}`);
      assert.equal(second, first, 'run 2 changed the output');
      assert.equal(third, second, 'run 3 changed the output');
    });

    it(`${item.name}: the result still parses and keeps its comments on their own lines`, async() => {
      const [first] = await threeRuns(item.file, item.source, fullPlan);

      if (item.file.endsWith('.css')) {
        return;
      }

      first.split('\n').filter(line => line.includes(TODO)).forEach((line) => {
        assert.match(line.trim(), /^(?:\/\/|\/\*|\{\/\*)/, `a TODO comment shares its line with code:\n${first}`);
      });
    });
  }

  it('lets a different object with the same removed token keep its own comment', async() => {
    const source = 'import { registerTheme, mainTheme } from \'handsontable/themes\';\n'
      + 'registerTheme(\'a\', mainTheme).params({ tokens: { wrapperBorderColor: 1 } });\n'
      + 'registerTheme(\'b\', mainTheme).params({ tokens: { wrapperBorderColor: 2 } });\n';
    const [first, second] = await threeRuns('a.ts', source, fullPlan);

    assert.equal(first.split(TODO).length - 1, 2);
    assert.equal(second, first);
  });
});

describe('every fixture output is stable across three runs', async() => {
  const fixtures = await listFixtures();

  for (const fixture of fixtures) {
    it(`${fixture.version}/${fixture.name}`, async() => {
      const manifest = await loadManifest(join(VERSIONS_DIR, fixture.version));
      const optionsFile = await readFile(join(fixture.dir, 'options.json'), 'utf8').catch(() => '{}');
      const config = JSON.parse(optionsFile);
      const output = await readFile(join(fixture.dir, fixture.outputName), 'utf8');
      const plan = buildPlan([manifest], config.only ?? []);
      const options = { aggressive: Boolean(config.aggressive) };
      const facts = new Set(config.facts ?? []);
      let text = output;

      for (let run = 2; run <= 3; run += 1) {
        const result = await transformFile({
          filePath: fixture.outputName,
          source: text,
          plan,
          options,
          facts,
          phase: config.phase ?? 1,
        });

        assert.equal(result.changed, false, `run ${run} changed the output`);
        text = result.output;
      }
    });
  }
});
