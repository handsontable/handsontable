import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPlan, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';

const manifests = await loadManifests();
const HEAD = 'import Handsontable from \'handsontable\';\n'
  + 'import { HotTable, HotColumn } from \'@handsontable/react-wrapper\';\n';
const RENAME = { id: '18.0.0/rename', kind: 'optionRename', from: 'oldName', to: 'newName' };
const REMOVE = { id: '18.0.0/remove', kind: 'optionRemove', name: 'gone', advice: 'Use something else.' };
const MOVE = { id: '18.0.0/move', kind: 'optionMove', from: 'format.culture', to: 'locale' };
const CULTURE = ['18.0.0/numeric-format-culture'];
const CORRECT_FORMAT = ['18.0.0/correct-format-removed'];

/**
 * Run rules of the shipped 18.0.0 manifest, or inline rules, three times, as the idempotency contract does.
 *
 * @param {string} source File text.
 * @param {string[]|object} rules Shipped rule ids, or an inline rule.
 * @param {object} [settings] Settings.
 * @param {boolean} [settings.aggressive] The `--aggressive` option.
 * @returns {Promise<{output: string, entries: object[]}>} The first run.
 */
async function threeRuns(source, rules, { aggressive = false } = {}) {
  const plan = Array.isArray(rules)
    ? buildPlan(manifests.filter(manifest => manifest.version === '18.0.0'), rules)
    : buildPlan([{ version: '18.0.0', rules: [{ safe: true, version: '18.0.0', guideUrl: null, ...rules }] }]);
  const options = { aggressive, markers: true };
  const first = await transformFile({ filePath: 'grid.tsx', source, plan, options });
  const second = await transformFile({ filePath: 'grid.tsx', source: first.output, plan, options });
  const third = await transformFile({ filePath: 'grid.tsx', source: second.output, plan, options });

  assert.equal(second.output, first.output, 'run 2 changed the file');
  assert.equal(third.output, second.output, 'run 3 changed the file');

  return first;
}

const kinds = entries => entries.map(entry => entry.severity);

describe('an object that something else holds is edited only when every use is the grid\'s own', () => {
  const UNDERSTOOD = [
    ['new Handsontable()', 'const cfg = { correctFormat: true }; new Handsontable(el, cfg);'],
    ['updateSettings() of a grid',
      'const hot = new Handsontable(el, {}); const cfg = { correctFormat: true }; hot.updateSettings(cfg);'],
    ['a wrapper settings prop through useMemo',
      'const A = () => { const s = useMemo(() => ({ correctFormat: true }), []); return <HotTable settings={s} />; };'],
    ['an array of columns', 'const cols = [{ correctFormat: true }]; new Handsontable(el, { columns: cols });'],
    ['a spread into another options object',
      'const base = { correctFormat: true }; new Handsontable(el, { ...base });'],
    ['a spread attribute of a wrapper',
      'const base = { correctFormat: true }; const A = () => <HotTable {...base} />;'],
    ['a class member that only the grid takes',
      'class A { cfg = { correctFormat: true }; go() { new Handsontable(el, this.cfg); } }'],
    ['a member read and a destructuring',
      'const cfg = { correctFormat: true }; new Handsontable(el, cfg); const { columns } = cfg; const t = typeof cfg;'],
    ['a declaration that the grid takes after another assignment',
      'let cfg; cfg = { correctFormat: true }; new Handsontable(el, cfg);'],
    ['a negated guard',
      'const cfg = { correctFormat: true }; if (!cfg) { throw new Error(); } new Handsontable(el, cfg);'],
    ['a double negation', 'const cfg = { correctFormat: true }; const has = !!cfg; new Handsontable(el, cfg);'],
    ['a null check', 'const cfg = { correctFormat: true }; if (cfg == null) { return; } new Handsontable(el, cfg);'],
    ['a strict comparison with undefined',
      'const cfg = { correctFormat: true }; const ok = cfg !== undefined; new Handsontable(el, cfg);'],
    ['an in test', 'const cfg = { correctFormat: true }; const has = \'columns\' in cfg; new Handsontable(el, cfg);'],
    ['the left operand of &&',
      'const cfg = { correctFormat: true }; const c = cfg && cfg.columns; new Handsontable(el, cfg);'],
    ['a test inside || and a logical test',
      'const cfg = { correctFormat: true }; if (cfg || other) { go(); } new Handsontable(el, cfg);'],
    ['a while test', 'const cfg = { correctFormat: true }; while (cfg) { break; } new Handsontable(el, cfg);'],
    ['a ternary test and Boolean()',
      'const cfg = { correctFormat: true }; const n = cfg ? 1 : 2; const b = Boolean(cfg); new Handsontable(el, cfg);'],
    ['a void', 'const cfg = { correctFormat: true }; void cfg; new Handsontable(el, cfg);'],
  ];

  for (const [label, body] of UNDERSTOOD) {
    it(`deletes the key when the only use is ${label}`, async() => {
      const result = await threeRuns(`${HEAD}${body}\n`, CORRECT_FORMAT);

      assert.ok(result.entries.some(entry => entry.severity === 'changed'), result.output);
      assert.ok(!result.output.includes('correctFormat: true'), result.output);
    });
  }

  const OTHER = [
    ['an argument of another call', 'legacyFormatter.configure(cfg);',
      /^Remove correctFormat by hand\. This object is also passed to `legacyFormatter\.configure\(\)` \(line \d+\)/],
    ['an argument of new', 'new Legacy(cfg);', /also passed to `new Legacy\(\)`/],
    ['an assignment to another name', 'const copy = cfg;', /also assigned to `copy`/],
    ['a value of || that flows on', 'const copy = cfg || {};', /also assigned to `copy`/],
    ['a value of && on the right that flows on', 'const copy = ready && cfg;', /also assigned to `copy`/],
    ['a value returned through ||', 'function make() { return cfg || other; }', /also returned/],
    ['an arithmetic use', 'const n = cfg + 1;', /also used here/],
    ['a spread into an object that is not options', 'legacy({ ...cfg });',
      /also spread into an object that is not Handsontable options/],
    ['a source of Object.assign', 'Object.assign({}, cfg);', /also passed to `Object\.assign\(\)`/],
    ['a component that is not a wrapper', 'const x = <Other settings={cfg} />;',
      /also passed to a component that is not a Handsontable wrapper/],
    ['updateSettings() of a library', 'formKit.updateSettings(cfg);',
      /also passed to `formKit\.updateSettings\(\)`/],
    ['a default export', 'export default cfg;', /also exported/],
    ['a named export', 'export { cfg };', /also exported/],
    ['a return', 'function f() { return cfg; }', /also returned/],
  ];

  for (const [label, use, message] of OTHER) {
    it(`keeps the key and names the use when the object is also ${label}`, async() => {
      const source = `${HEAD}import formKit from 'form-kit';\nconst cfg = { correctFormat: true };\n`
        + `new Handsontable(el, cfg);\n${use}\n`;
      const result = await threeRuns(source, CORRECT_FORMAT);
      const entry = result.entries.find(item => item.severity === 'manual');

      assert.ok(entry, result.output);
      assert.match(entry.message, message);
      assert.match(entry.message, /The tool left it alone\.$/);
      assert.ok(result.output.includes('correctFormat: true'), result.output);
      assert.ok(!result.entries.some(item => item.severity === 'changed'));
    });
  }

  it('reports the reviewed case: another consumer would lose the deleted key and the moved culture', async() => {
    const source = `${HEAD}const cfg = { correctFormat: true, columns: [{ numericFormat: { culture: 'de-DE' } }] };\n`
      + 'new Handsontable(el, cfg);\nlegacyFormatter.configure(cfg);\n';
    const result = await threeRuns(source, [...CORRECT_FORMAT, ...CULTURE]);

    assert.deepEqual(kinds(result.entries).filter(kind => kind === 'changed'), []);
    assert.ok(result.output.includes('correctFormat: true'));
    assert.ok(result.output.includes('culture: \'de-DE\''));
    assert.equal(result.entries.filter(entry => /legacyFormatter\.configure/.test(entry.message)).length, 2);
  });

  it('holds a column of a shared array, and a class member that another object takes too', async() => {
    const array = await threeRuns(`${HEAD}const cols = [{ correctFormat: true }];\n`
      + 'new Handsontable(el, { columns: cols });\nrender(cols);\n', CORRECT_FORMAT);
    const member = await threeRuns(`${HEAD}class A { cfg = { correctFormat: true }; go() {\n`
      + '  new Handsontable(el, this.cfg);\n  other.use(this.cfg);\n} }\n', CORRECT_FORMAT);

    assert.deepEqual(kinds(array.entries), ['manual']);
    assert.deepEqual(kinds(member.entries), ['manual']);
  });

  it('holds an object through a column element too, and an object that a typed holder names', async() => {
    const element = await threeRuns(`${HEAD}const col = { correctFormat: true };\n`
      + 'new Handsontable(el, { columns: [col] });\nlegacy.use(col);\n', CORRECT_FORMAT);
    const typed = await threeRuns(`${HEAD}const cfg: Handsontable.GridSettings = { correctFormat: true };\n`
      + 'legacy.use(cfg);\n', CORRECT_FORMAT);
    const satisfied = await threeRuns(`${HEAD}export const cfg = { columns: [{ type: 'date', correctFormat: true }] } `
      + 'satisfies Handsontable.GridSettings;\n', CORRECT_FORMAT);

    assert.deepEqual(kinds(element.entries), ['manual']);
    // The type names the object as Handsontable's, so every other use of it is held to that type.
    assert.deepEqual(kinds(typed.entries), ['changed']);
    assert.deepEqual(kinds(satisfied.entries), ['changed']);
  });

  it('takes the updateSettings() of a receiver the file does not show as the grid\'s only with --aggressive', async() => {
    const source = `${HEAD}const cfg = { correctFormat: true, colHeaders: true, rowHeaders: true };\n`
      + 'new Handsontable(el, cfg);\nfunction f(grid) { grid.updateSettings(cfg); }\n';
    const plain = await threeRuns(source, CORRECT_FORMAT);
    const aggressive = await threeRuns(source, CORRECT_FORMAT, { aggressive: true });

    assert.deepEqual(kinds(plain.entries), ['manual']);
    assert.deepEqual(kinds(aggressive.entries), ['changed']);
  });

  it('holds an object that a rename or a move would change for another consumer too', async() => {
    const rename = await threeRuns(
      `${HEAD}const cfg = { oldName: 1 };\nnew Handsontable(el, cfg);\nlegacy.use(cfg);\n`, RENAME);
    const move = await threeRuns(`${HEAD}const col = { format: { culture: 'de-DE' } };\n`
      + 'new Handsontable(el, { columns: [col] });\nlegacy.use(col);\n', MOVE);

    assert.deepEqual(kinds(rename.entries), ['manual']);
    assert.match(rename.entries[0].message,
      /^Rename oldName to newName by hand\. This object is also passed to `legacy\.use\(\)`/);
    assert.deepEqual(kinds(move.entries), ['manual']);
    assert.match(move.entries[0].message, /^Move format\.culture to locale by hand\./);
  });
});

describe('an object that another object spreads is edited only when the receiver cannot set the same key', () => {
  it('reports the reviewed case: the column\'s own locale would win after the spread', async() => {
    const source = `${HEAD}const base = { numericFormat: { culture: 'de-DE', pattern: '0,0' } };\n`
      + 'new Handsontable(el, { columns: [{ type: \'numeric\', ...base, locale: \'en-US\' }] });\n';
    const result = await threeRuns(source, CULTURE);
    const entry = result.entries.find(item => item.ruleId === '18.0.0/numeric-format-culture');

    assert.equal(entry.severity, 'manual');
    assert.match(entry.message,
      /^Move numericFormat\.culture to locale by hand\. This object is spread into another one \(line 4\)/);
    assert.ok(result.output.includes('culture: \'de-DE\''), result.output);
    assert.ok(!result.output.includes('locale: \'de-DE\''), result.output);
  });

  it('reports a move for any object that is spread, even when the receiver sets no locale', async() => {
    const source = `${HEAD}const base = { numericFormat: { culture: 'de-DE' } };\n`
      + 'new Handsontable(el, { columns: [{ type: \'numeric\', ...base }] });\n';
    const result = await threeRuns(source, CULTURE);

    assert.deepEqual(kinds(result.entries), ['manual']);
  });

  it('moves the key of an object that stays out of every spread', async() => {
    const result = await threeRuns(`${HEAD}const base = { numericFormat: { culture: 'de-DE' } };\n`
      + 'new Handsontable(el, { columns: [base] });\n', CULTURE);

    assert.deepEqual(kinds(result.entries), ['changed', 'manual']);
    assert.ok(result.output.includes('locale: \'de-DE\''), result.output);
  });

  it('reports a rename when the receiver sets the new name, or the old one after the spread', async() => {
    const cases = [
      'new Handsontable(el, { ...base, newName: 2 });',
      'new Handsontable(el, { ...base, oldName: 2 });',
      'new Handsontable(el, { newName: 2, ...base });',
      'const A = () => <HotTable {...base} oldName={2} />;',
    ];

    for (const body of cases) {
      const result = await threeRuns(`${HEAD}const base = { oldName: 1 };\n${body}\n`, RENAME);
      const held = result.entries.filter(entry => entry.severity === 'manual');

      // The receiver may rename its own key, but the object it spreads stays. A receiver key that stands after the
      // spread is reported too: the spread already sets the old name, so the key is left alone as well.
      const own = /oldName[:=]/.test(body.replace(/\.\.\.base/, ''));

      assert.equal(held.length, own && !body.includes('newName') ? 2 : 1, body);
      assert.ok(held.some(entry => /spread into another one/.test(entry.message)), body);
      assert.ok(result.output.includes('oldName: 1'), body);
    }
  });

  it('renames when the receiver sets the old name before the spread, or another key', async() => {
    const cases = [
      'new Handsontable(el, { oldName: 2, ...base });',
      'new Handsontable(el, { ...base, other: 2 });',
      'new Handsontable(el, { ...base });',
      'const A = () => <HotTable {...base} other={2} />;',
    ];

    for (const body of cases) {
      const result = await threeRuns(`${HEAD}const base = { oldName: 1 };\n${body}\n`, RENAME);

      assert.ok(result.entries.some(entry => entry.severity === 'changed'), body);
      assert.ok(result.output.includes('newName: 1'), body);
    }
  });

  it('removes a key that no receiver can give a meaning, and stays the same on a second run', async() => {
    const cases = [
      'new Handsontable(el, { ...base, gone: 2 });',
      'new Handsontable(el, { gone: 2, ...base });',
      'new Handsontable(el, { ...base, other: 2 });',
    ];

    for (const body of cases) {
      const result = await threeRuns(`${HEAD}const base = { gone: 1 };\n${body}\n`, REMOVE);

      assert.ok(result.entries.some(entry => entry.severity === 'changed'), body);
      assert.ok(!result.output.includes('gone: 1'), body);
    }
  });

  it('reports a move for an element that spreads the object', async() => {
    const result = await threeRuns(`${HEAD}const base = { numericFormat: { culture: 'de-DE' } };\n`
      + 'const A = () => <HotColumn {...base} locale="en-US" />;\n', CULTURE);

    assert.deepEqual(kinds(result.entries), ['manual']);
    assert.match(result.entries[0].message, /spread into another one/);
  });
});
