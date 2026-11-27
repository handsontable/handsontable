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
    const source = `${HEAD}const cfg = { correctFormat: true, `
      + 'columns: [{ type: \'numeric\', numericFormat: { culture: \'de-DE\' } }] };\n'
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
    const result = await threeRuns(`${HEAD}const base = { type: 'numeric', numericFormat: { culture: 'de-DE' } };\n`
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

describe('a part of the object that goes to other code holds the object too', () => {
  const NESTED = '{ columns: [{ type: \'date\', correctFormat: true }], title: \'t\' }';
  const head = `${HEAD}const cfg = ${NESTED};\nnew Handsontable(el, cfg);\n`;

  const ESCAPES = [
    ['an element passed to a call', 'legacy(cfg.columns[0]);', /passed to `legacy\(\)`/],
    ['a member passed to a call', 'legacy(cfg.columns);', /passed to `legacy\(\)`/],
    ['a destructured member passed to a call', 'const { columns } = cfg; legacy(columns);', /passed to `legacy\(\)`/],
    ['an element of a callback of forEach', 'cfg.columns.forEach(c => legacy(c));', /passed to `legacy\(\)`/],
    ['an element of a loop', 'for (const c of cfg.columns) { legacy(c); }', /passed to `legacy\(\)`/],
    ['a member under another name', 'const cols = cfg.columns; legacy(cols);', /passed to `legacy\(\)`/],
    ['a member assigned to another name later', 'let cols; cols = cfg.columns; legacy(cols);',
      /passed to `legacy\(\)`/],
    ['a destructured element of a callback', 'cfg.columns.forEach(({ type }, i, all) => legacy(all));',
      /passed to `legacy\(\)`/],
    ['a find result', 'legacy(cfg.columns.find(c => c.type === \'date\'));', /passed to `legacy\(\)`/],
    ['a filter result', 'const some = cfg.columns.filter(c => c.type); legacy(some);', /passed to `legacy\(\)`/],
    ['an element returned from a map callback', 'legacy(cfg.columns.map(c => c));', /passed to `legacy\(\)`/],
    ['a member stored in an object of the project', 'registry.set({ cols: cfg.columns });',
      /stored in an object that is not Handsontable options/],
    ['a member returned', 'function cols() { return cfg.columns; }', /returned/],
    ['a member exported through a declaration', 'export const cols = cfg.columns;', /assigned to|exported/],
    ['a member spread into a call', 'legacy(...cfg.columns);', /spread here/],
    ['an element spread into an object of the project', 'legacy({ ...cfg.columns[0] });',
      /spread into an object that is not Handsontable options/],
    ['a member called as a method of the object', 'cfg.columns.custom(1);', /called as/],
    ['a copy of the array', 'legacy(cfg.columns.slice());', /passed to `legacy\(\)`/],
    ['an element handed to a named callback', 'cfg.columns.forEach(handler);',
      /handed to a callback by `cfg\.columns\.forEach\(\)`/],
  ];

  for (const [label, use, message] of ESCAPES) {
    it(`keeps the key and names the use when ${label}`, async() => {
      const result = await threeRuns(`${head}${use}\n`, CORRECT_FORMAT);
      const entry = result.entries.find(item => item.severity === 'manual');

      assert.ok(entry, result.output);
      assert.match(entry.message, message);
      assert.ok(result.output.includes('correctFormat: true'), result.output);
      assert.ok(!result.entries.some(item => item.severity === 'changed'), result.output);
    });
  }

  it('holds the moved culture too when an element of a column list escapes', async() => {
    const source = `${HEAD}const cfg = { columns: [{ type: 'numeric', numericFormat: { culture: 'de-DE' } }] };\n`
      + 'new Handsontable(el, cfg);\nlegacy(cfg.columns[0]);\ncfg.columns.forEach(c => legacy(c));\n';
    const result = await threeRuns(source, CULTURE);

    assert.deepEqual(kinds(result.entries).filter(kind => kind === 'changed'), []);
    assert.ok(result.output.includes('culture: \'de-DE\''), result.output);
    assert.ok(!result.output.includes('locale: \'de-DE\''), result.output);
  });

  const READS = [
    // eslint-disable-next-line no-template-curly-in-string
    ['a property read in an expression', 'const t = cfg.title + \'!\'; const u = `${cfg.title}`;'],
    ['a length and a comparison', 'if (cfg.columns.length > 1) { go(); } const n = cfg.columns.length;'],
    ['a destructured member that is only read',
      'const { columns, title } = cfg; const n = columns.length + title.length;'],
    ['an alias of a member that is only read',
      'const cols = cfg.columns; const n = cols.length; const first = cols[0].type;'],
    ['an iteration whose callback only reads',
      'let total = 0; cfg.columns.forEach(c => { total += c.width; if (c.type === \'date\') { total++; } });'],
    ['a loop that only reads', 'let n = 0; for (const c of cfg.columns) { n += c.width; }'],
    ['a map to values that are joined', 'const names = cfg.columns.map(c => c.type).join(\',\');'],
    ['a read in a log call', 'console.log(cfg.title, cfg.columns.length);'],
    ['a test on a find result',
      'const hasDate = cfg.columns.some(c => c.type === \'date\') && cfg.columns.every(c => c.type);'],
    ['a push of a new element', 'cfg.columns.push({ type: \'text\' });'],
    ['a write to a member', 'cfg.title = \'x\'; cfg.columns[0].type = \'text\';'],
    ['a read in a JSX child', 'const A = () => <div>{cfg.title}</div>;'],
  ];

  for (const [label, use] of READS) {
    it(`deletes the key when the part is only used as ${label}`, async() => {
      const result = await threeRuns(`${head}${use}\n`, CORRECT_FORMAT);

      assert.ok(result.entries.some(entry => entry.severity === 'changed'), result.output);
      assert.ok(!result.output.includes('correctFormat: true'), result.output);
    });
  }

  it('holds an object that a class member names when an element of it escapes', async() => {
    const source = `${HEAD}class A { cfg = ${NESTED}; go() {\n  new Handsontable(el, this.cfg);\n`
      + '  legacy(this.cfg.columns[0]);\n} }\n';
    const result = await threeRuns(source, CORRECT_FORMAT);

    assert.deepEqual(kinds(result.entries), ['manual']);
  });

  it('follows a spread of an element into another options object', async() => {
    const source = `${HEAD}const cfg = { columns: [{ numericFormat: { culture: 'de-DE' } }] };\n`
      + 'new Handsontable(el, cfg);\n'
      + 'cfg.columns.forEach(c => new Handsontable(el2, { ...c, locale: \'en-US\' }));\n';
    const result = await threeRuns(source, CULTURE);

    assert.deepEqual(kinds(result.entries), ['manual']);
    assert.match(result.entries[0].message, /spread into another one/);
  });
});

describe('an object that a type of the project names keeps its keys', () => {
  const TYPED = [
    ['an annotated variable', 'interface Mine { correctFormat?: boolean }\nconst cfg: Mine = { correctFormat: true };\n'
      + 'new Handsontable(el, cfg);', /typed as `Mine`/],
    ['an `as` cast', 'const cfg = { correctFormat: true } as Mine;\nnew Handsontable(el, cfg);', /typed as `Mine`/],
    ['a `satisfies` clause', 'const cfg = { correctFormat: true } satisfies Mine;\nnew Handsontable(el, cfg);',
      /typed as `Mine`/],
    ['a column cast inline', 'new Handsontable(el, { columns: [{ type: \'date\', correctFormat: true } as Mine] });',
      /typed as `Mine`/],
    ['an array of the type',
      'const cols: Mine[] = [{ correctFormat: true }];\nnew Handsontable(el, { columns: cols });',
      /typed as `Mine\[\]`/],
    ['a helper over the type', 'const cfg: Partial<Mine> = { correctFormat: true };\nnew Handsontable(el, cfg);',
      /typed as `Partial<Mine>`/],
    ['an inline object type', 'const cfg: { correctFormat: boolean } = { correctFormat: true };\n'
      + 'new Handsontable(el, cfg);', /typed as `\{ correctFormat: boolean \}`/],
    ['a class member', 'class A { cfg: Mine = { correctFormat: true }; go() { new Handsontable(el, this.cfg); } }',
      /typed as `Mine`/],
  ];

  for (const [label, body, message] of TYPED) {
    it(`reports and keeps the key of ${label}`, async() => {
      const result = await threeRuns(`${HEAD}${body}\n`, CORRECT_FORMAT);
      const entry = result.entries.find(item => item.severity === 'manual');

      assert.ok(entry, result.output);
      assert.match(entry.message, message);
      assert.ok(result.output.includes('correctFormat: true'), result.output);
      assert.ok(!result.entries.some(item => item.severity === 'changed'), result.output);
    });
  }

  it('keeps the moved culture of a typed column too', async() => {
    const source = `${HEAD}const col: Mine = { type: 'numeric', numericFormat: { culture: 'de-DE' } };\n`
      + 'new Handsontable(el, { columns: [col] });\n';
    const result = await threeRuns(source, CULTURE);

    assert.deepEqual(kinds(result.entries), ['manual']);
    assert.ok(result.output.includes('culture: \'de-DE\''), result.output);
  });

  const HANDSONTABLE = [
    ['GridSettings', 'const cfg: Handsontable.GridSettings = { correctFormat: true };\nnew Handsontable(el, cfg);'],
    ['ColumnSettings[]', 'const cols: Handsontable.ColumnSettings[] = [{ correctFormat: true }];\n'
      + 'new Handsontable(el, { columns: cols });'],
    ['a cast to GridSettings', 'const cfg = { correctFormat: true } as Handsontable.GridSettings;\n'
      + 'new Handsontable(el, cfg);'],
    ['any', 'const cfg: any = { correctFormat: true };\nnew Handsontable(el, cfg);'],
    ['as const', 'const cfg = { correctFormat: true } as const;\nnew Handsontable(el, cfg);'],
  ];

  for (const [label, body] of HANDSONTABLE) {
    it(`still deletes the key of an object typed ${label}`, async() => {
      const result = await threeRuns(`${HEAD}${body}\n`, CORRECT_FORMAT);

      assert.deepEqual(kinds(result.entries), ['changed'], result.output);
      assert.ok(!result.output.includes('correctFormat: true'), result.output);
    });
  }
});

describe('an object that a factory returns is edited only when every use of the factory is the grid\'s own', () => {
  const OPT = 'type: \'date\', dateFormat: \'DD/MM\', correctFormat: true';
  const CULTURE_OPT = 'type: \'numeric\', numericFormat: { culture: \'de-DE\' }';
  const arrow = opt => `const mk = () => ({ ${opt} });\n`;
  const grid = 'new Handsontable(el, { cells: mk });\n';
  const rows = opt => ({
    kept: [
      ['a call whose result goes to another function', `${arrow(opt)}${grid}legacy(mk());\n`, /`legacy\(\)`/],
      ['a call whose result is named and then goes on', `${arrow(opt)}${grid}const o = mk(); legacy(o);\n`,
        /`legacy\(\)`/],
      ['an exported declaration', `export ${arrow(opt)}${grid}`, /exported/],
      ['an export list', `${arrow(opt)}${grid}export { mk };\n`, /exported/],
      ['an exported function declaration',
        `export function mk() { return { ${opt} }; }\n${grid}`, /exported/],
      ['a default export of a function', `export default function mk() { return { ${opt} }; }\n${grid}`, /exported/],
      ['an exported function expression', `export const mk = function() { return { ${opt} }; };\n${grid}`,
        /exported/],
      ['an assignment to module.exports', `${arrow(opt)}${grid}module.exports.mk = mk;\n`, /module\.exports\.mk/],
      ['the factory handed to an unknown call', `${arrow(opt)}${grid}register(mk);\n`, /`register\(\)`/],
      ['a function declaration whose result goes on',
        `function mk() { return { ${opt} }; }\n${grid}legacy(mk());\n`, /`legacy\(\)`/],
      ['a method of an options object that is exported',
        `export const settings = { cells() { return { ${opt} }; } };\nnew Handsontable(el, settings);\n`, /exported/],
      ['a method of an options object that goes on',
        `const s = { cells() { return { ${opt} }; } };\nnew Handsontable(el, s);\nlegacy(s);\n`, /`legacy\(\)`/],
      ['an inline factory handed to another function', `legacy(() => ({ ${opt} }));\n`, /`legacy\(\)`/],
      ['the result of an immediately invoked factory', `legacy((() => ({ ${opt} }))());\n`, /`legacy\(\)`/],
    ],
    rewritten: [
      ['a factory that is only the cells option', `${arrow(opt)}${grid}`],
      ['a function declaration that is only the cells option', `function mk() { return { ${opt} }; }\n${grid}`],
      ['a call whose result names the object and goes to the grid',
        `${arrow(opt)}${grid}const o = mk(); new Handsontable(el, o);\n`],
      ['a call whose result goes to the grid', `${arrow(opt)}${grid}new Handsontable(el, { ...mk() });\n`],
      ['an inline cells function', `new Handsontable(el, { cells: () => ({ ${opt} }) });\n`],
      ['a cells method of an options object', `new Handsontable(el, { cells() { return { ${opt} }; } });\n`],
      ['a cells method of a local options object',
        `const s = { cells() { return { ${opt} }; } };\nnew Handsontable(el, s);\n`],
      ['a callback of useCallback', `const mk = useCallback(() => ({ ${opt} }), []);\n${grid}`],
    ],
  });

  const AGGRESSIVE_KEPT = [
    ['a method of an exported object', opt => `export const api = { make() { return { ${opt} }; } };\n`],
    ['a method of an exported class', opt => `export class Cfg { make() { return { ${opt} }; } }\n`],
    ['a method of the object that module.exports takes',
      opt => `module.exports = { make() { return { ${opt} }; } };\n`],
  ];

  for (const [label, source, message] of rows(OPT).kept) {
    it(`keeps correctFormat and names the use: ${label}`, async() => {
      const result = await threeRuns(`${HEAD}${source}`, CORRECT_FORMAT, { aggressive: true });
      const entry = result.entries.find(item => item.severity === 'manual');

      assert.ok(entry, result.output);
      assert.match(entry.message, message);
      assert.ok(result.output.includes('correctFormat: true'), result.output);
      assert.ok(!result.entries.some(item => item.severity === 'changed'), result.output);
    });
  }

  for (const [label, source] of rows(OPT).rewritten) {
    it(`deletes correctFormat when the only use is the grid's: ${label}`, async() => {
      const result = await threeRuns(`${HEAD}${source}`, CORRECT_FORMAT, { aggressive: true });

      assert.ok(result.entries.some(entry => entry.severity === 'changed'), result.output);
      assert.ok(!result.output.includes('correctFormat: true'), result.output);
    });
  }

  for (const [label, make] of AGGRESSIVE_KEPT) {
    it(`keeps correctFormat of an object that ${label} returns, under --aggressive`, async() => {
      const result = await threeRuns(`${HEAD}${make(OPT)}`, CORRECT_FORMAT, { aggressive: true });

      assert.ok(result.output.includes('correctFormat: true'), result.output);
      assert.ok(!result.entries.some(item => item.severity === 'changed'), result.output);
    });
  }

  it('deletes correctFormat of an object that a method of a local class returns, under --aggressive', async() => {
    const source = `${HEAD}class Cfg { make() { return { ${OPT} }; } }\n`
      + 'new Handsontable(el, { columns: [new Cfg().make()] });\n';
    const result = await threeRuns(source, CORRECT_FORMAT, { aggressive: true });

    assert.ok(!result.output.includes('correctFormat: true'), result.output);
  });

  for (const [label, source] of rows(CULTURE_OPT).kept.filter(([, text]) => text.includes('cells: mk')
    || text.includes('legacy'))) {
    it(`keeps numericFormat.culture where it is, and names the use: ${label}`, async() => {
      const result = await threeRuns(`${HEAD}${source}`, CULTURE, { aggressive: true });

      assert.ok(result.output.includes('culture: \'de-DE\''), result.output);
      assert.ok(!/locale:/.test(result.output), result.output);
      assert.ok(!result.entries.some(item => item.severity === 'changed'), result.output);
    });
  }

  // A spread into options never takes a move, so that row stays out.
  const movable = rows(CULTURE_OPT).rewritten.filter(([, text]) => !text.includes('...mk()'));

  for (const [label, source] of movable) {
    it(`moves numericFormat.culture to locale when the only use is the grid's: ${label}`, async() => {
      const result = await threeRuns(`${HEAD}${source}`, CULTURE, { aggressive: true });

      assert.ok(/locale: 'de-DE'/.test(result.output), result.output);
      assert.ok(!/culture: 'de-DE'/.test(result.output.replace(/TODO[^\n]*/g, '')), result.output);
      assert.ok(result.entries.some(entry => entry.severity === 'changed'), result.output);
    });
  }
});

describe('a line number inside a message is a line of the file, not of the script block', () => {
  // The script block starts on line 5 of the file, so every line the message names must be 4 higher than in the block.
  const VUE_HEAD = '<template>\n  <HotTable :settings="settings" />\n</template>\n\n<script setup lang="ts">\n'
    + 'import { computed } from \'vue\';\nimport { HotTable } from \'@handsontable/vue3\';\n\n';
  const FILE = 'A.vue';

  /**
   * @param {string} script The script block content after the imports (they end on file line 7, then a blank line).
   * @param {string[]} ids Shipped 18.0.0 rule ids.
   * @returns {Promise<object[]>} The entries of one run.
   */
  async function entriesOf(script, ids) {
    const source = `${VUE_HEAD}${script}</script>\n`;
    const plan = buildPlan(manifests.filter(manifest => manifest.version === '18.0.0'), ids);
    const result = await transformFile({ filePath: FILE, source, plan, options: { aggressive: true, markers: true } });

    return result.entries;
  }

  it('names the file line of the factory call that also holds the object', async() => {
    const entries = await entriesOf(
      'const settings = computed(() => ({\n  data: [],\n  columns: [{ type: \'time\', correctFormat: true }],\n}));\n',
      CORRECT_FORMAT);
    const held = entries.find(entry => /also passed to `computed\(\)`/.test(entry.message));

    assert.ok(held, JSON.stringify(entries));
    assert.equal(held.line, 11, 'the entry is on a file line');
    assert.match(held.message, /passed to `computed\(\)` \(line 9\)/, held.message);
  });

  it('names the file line of the spread', async() => {
    const entries = await entriesOf('const base = { numericFormat: { culture: \'de-DE\', pattern: \'0,0\' } };\n'
      + 'const settings = { data: [], columns: [{ type: \'numeric\', ...base, locale: \'en-US\' }] };\n', CULTURE);
    const held = entries.find(entry => /spread into another one/.test(entry.message));

    assert.ok(held, JSON.stringify(entries));
    assert.match(held.message, /spread into another one \(line 10\)/, held.message);
  });

  it('names the file line of the custom reader', async() => {
    const entries = await entriesOf('const settings = {\n  data: [],\n'
      + '  columns: [{ type: \'time\', correctFormat: true, renderer: draw }],\n};\nfunction draw() {}\n',
    CORRECT_FORMAT);
    const kept = entries.find(entry => /It is on line \d+\./.test(entry.message));

    assert.ok(kept, JSON.stringify(entries));
    assert.equal(kept.line, 11);
    assert.match(kept.message, /It is on line 11\./, kept.message);
  });

  it('keeps the number of a script that starts on line 1', async() => {
    const plan = buildPlan(manifests.filter(manifest => manifest.version === '18.0.0'), CORRECT_FORMAT);
    const source = `${HEAD}const cfg = { columns: [{ correctFormat: true }] };\nnew Handsontable(el, cfg);\n`
      + 'legacy.use(cfg);\n';
    const result = await transformFile({ filePath: 'grid.ts', source, plan, options: { markers: true } });

    assert.match(result.entries.find(entry => entry.severity === 'manual').message, /\(line 5\)/);
  });
});
