import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { VERSIONS_DIR, buildPlan, loadManifest, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';
import { listFixtures } from './helpers/fixtures.mjs';
import { loadReleasedManifests } from './helpers/manifests.mjs';

const TODO = 'TODO(handsontable-codemod';
// The one-line shapes run against the released migrations, as a default run selects them. A draft is a separate plan
// below, because a chained run of two versions that act on one call leaves a TODO from each.
const fullPlan = buildPlan(await loadReleasedManifests(), []);
const draftPlan = buildPlan((await loadManifests(VERSIONS_DIR)).filter(manifest => manifest.status === 'draft'), []);

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
    name: 'a marker for a manual entry on a property of a one-line object',
    file: 'a.js',
    todos: 1,
    source: 'import Handsontable from \'handsontable\';\n'
      + 'new Handsontable(el, { licenseKey: \'k\', columns: [{ type: \'date\', dateFormat: \'DD/MM/YYYY\' }] });\n',
  },
  {
    name: 'a marker for a manual entry on a property of a one-line object in a JSX attribute',
    file: 'a.tsx',
    todos: 1,
    source: 'import { HotTable, HotColumn } from \'@handsontable/react-wrapper\';\n'
      + 'export const A = () => <HotTable data={[]}>\n  <HotColumn numericFormat={{ pattern: \'0.0\' }} />\n'
      + '</HotTable>;\n',
  },
  {
    name: 'a marker for a function body that starts on the line of its signature',
    file: 'a.js',
    todos: 2,
    source: 'import Handsontable from \'handsontable\';\n'
      + 'new Handsontable(el, { licenseKey: \'k\', sanitizer(c, s) { return s === \'innerHTML\' ? c : c; } });\n',
  },
  {
    name: 'a draft methodRemove on a used result',
    file: 'a.js',
    todos: 1,
    plan: draftPlan,
    source: 'import Handsontable from \'handsontable\';\n'
      + 'const hot = new Handsontable(el, { manualColumnResize: true });\n'
      + 'const columns = hot.getPlugin(\'manualColumnResize\');\n'
      + 'const w = columns.loadManualColumnWidths();\n',
  },
  {
    name: 'a draft detect rule on a one-line object',
    file: 'a.js',
    todos: 2,
    plan: draftPlan,
    source: 'import Handsontable from \'handsontable\';\n'
      + 'new Handsontable(el, { licenseKey: \'non-commercial-and-evaluation\', rowHeights: 20 });\n',
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
      const [first, second, third] = await threeRuns(item.file, item.source, item.plan ?? fullPlan);
      const count = text => text.split(TODO).length - 1;

      assert.equal(count(first), item.todos, `run 1 should leave ${item.todos} TODO comment(s):\n${first}`);
      assert.equal(second, first, 'run 2 changed the output');
      assert.equal(third, second, 'run 3 changed the output');
    });

    it(`${item.name}: the result still parses and keeps its comments on their own lines`, async() => {
      const [first] = await threeRuns(item.file, item.source, item.plan ?? fullPlan);

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

/**
 * Count the entries a run leaves for the user to read, by rule id. A `changed` entry says what the run did, so the next
 * run has none. A `manual` or `warning` entry says what is still there, so the next run reports it again, unless
 * the run rewrote the spot, which drops the note about it. No entry may be new: a rule that reports its own marker
 * as a second spot shows up as a count that grows.
 *
 * @param {object[]} entries The entries of one run.
 * @returns {Record<string, number>} Entries by rule id and severity.
 */
function standingEntries(entries) {
  const counts = {};

  for (const entry of entries.filter(item => item.severity !== 'changed')) {
    const key = `${entry.ruleId} (${entry.severity})`;

    counts[key] = (counts[key] ?? 0) + 1;
  }

  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

describe('every rule of every manifest, drafts included, reports a spot once however many times it runs', async() => {
  const fixtures = await listFixtures();
  const manifests = await loadManifests(VERSIONS_DIR);

  for (const fixture of fixtures) {
    const manifest = manifests.find(item => item.version === fixture.version);

    for (const scope of ['the rules of the fixture', 'every rule of the manifest']) {
      it(`${fixture.version}/${fixture.name}, ${scope}`, async() => {
        const config = JSON.parse(await readFile(join(fixture.dir, 'options.json'), 'utf8').catch(() => '{}'));
        const input = await readFile(join(fixture.dir, fixture.inputName), 'utf8');
        const plan = buildPlan([manifest], scope === 'every rule of the manifest' ? [] : config.only ?? []);
        const args = {
          filePath: fixture.inputName,
          plan,
          options: { aggressive: Boolean(config.aggressive) },
          facts: new Set(config.facts ?? []),
          phase: config.phase ?? 1,
        };
        const first = await transformFile({ ...args, source: input });
        const second = await transformFile({ ...args, source: first.output });
        const third = await transformFile({ ...args, source: second.output });

        assert.equal(second.changed, false, 'run 2 changed the output');
        assert.equal(third.changed, false, 'run 3 changed the output');
        const [one, two, three] = [first, second, third].map(result => standingEntries(result.entries));

        assert.deepEqual(three, two, 'run 3 reports other entries than run 2');

        for (const [key, count] of Object.entries(two)) {
          assert.ok(count <= (one[key] ?? 0), `run 2 reports ${key} ${count} times, run 1 ${one[key] ?? 0}`);
        }

        // A rule that only reports leaves its spots alone, so it reports as many in every run.
        for (const [key, count] of Object.entries(one)) {
          if (plan.rulesById.get(key.split(' ')[0])?.kind === 'detect') {
            assert.equal(two[key] ?? 0, count, `run 2 reports ${key} ${two[key] ?? 0} times, run 1 ${count}`);
          }
        }
      });
    }
  }
});
