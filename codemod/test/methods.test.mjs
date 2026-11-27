import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { PACKAGE_ROOT } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';

const shipped = JSON.parse(await readFile(join(PACKAGE_ROOT, 'versions', '18.0.0', 'rules', 'methods.json'), 'utf8'));
const byId = id => ({ version: '18.0.0', guideUrl: null, ...shipped.rules.find(rule => rule.id === `18.0.0/${id}`) });

const REMOVE = byId('resize-state-methods');
const MOVE = byId('core-undo-methods');
const UNWRAP = { ...byId('helper-sanitize'), safe: true };

/**
 * Run a transform over a source text with the given rules.
 *
 * @param {string} source Source text.
 * @param {object[]} rules Rules to apply (loaded-rule shape).
 * @param {string} [filePath] File name, which selects the parser.
 * @returns {Promise<{output: string, changed: boolean, entries: object[]}>} The result.
 */
async function run(source, rules, filePath = 'file.ts') {
  const plan = { versions: [{ version: '18.0.0', rules }], rulesById: new Map(rules.map(rule => [rule.id, rule])) };

  return transformFile({ filePath, source, plan, options: { markers: false } });
}

const HEAD = 'import Handsontable from \'handsontable\';\nconst hot = new Handsontable(el, {});\n';

describe('methodRemove', () => {
  const rules = [REMOVE];

  /**
   * Run the removal rule over statements that follow a plugin binding.
   *
   * @param {string} body Statements.
   * @returns {Promise<{output: string, changed: boolean, entries: object[]}>} The result.
   */
  const removal = body => run(`${HEAD}const plugin = hot.getPlugin('manualColumnResize');\n${body}\n`, rules);

  it('shipped rule is safe and points at the guide section', () => {
    assert.equal(REMOVE.safe, true);
    assert.equal(REMOVE.guide, 'stop-calling-deprecated-resize-state-methods');
    assert.deepEqual(REMOVE.receiver, { plugin: ['manualColumnResize', 'manualRowResize'] });
  });

  it('names the option that exists in its advice: colWidths, not columnWidths', () => {
    assert.match(REMOVE.advice, /\bcolWidths\b/);
    assert.doesNotMatch(REMOVE.advice, /columnWidths/);
  });

  it('never deletes on a receiver that is not one of the two resize plugins', async() => {
    const source = `${HEAD}${[
      'class B extends Base { save() { this.saveManualColumnWidths(); super.loadManualRowHeights(); } }',
      'storage.saveManualColumnWidths();',
      'const store = {};',
      'store.loadManualRowHeights();',
      'hot.getPlugin(\'filters\').saveManualColumnWidths();',
      'hot.saveManualRowHeights();',
    ].join('\n')}\n`;
    const { output, changed, entries } = await run(source, rules);

    assert.equal(changed, false);
    assert.equal(output, source);
    assert.deepEqual(entries.map(entry => [entry.severity, entry.line]), [['manual', 4]]);
    assert.match(entries[0].message, /manualColumnResize or manualRowResize plugin/);
  });

  it('follows a plugin held in a variable, an assignment, or a this member', async() => {
    const { output } = await run(`${HEAD}${[
      'let p;',
      'p = hot.getPlugin(\'manualRowResize\');',
      'p.loadManualRowHeights();',
      'class K { go() { this.q = hot.getPlugin(\'manualColumnResize\'); this.q.saveManualColumnWidths(); } }',
    ].join('\n')}\n`, rules);

    assert.doesNotMatch(output, /loadManualRowHeights|saveManualColumnWidths/);
  });

  it('keeps a call whose receiver or arguments can have side effects and leaves a TODO', async() => {
    const body = [
      'new Handsontable(el, {}).getPlugin(\'manualColumnResize\').saveManualColumnWidths();',
      'async function f() { await new Handsontable(el, {}).getPlugin(\'manualColumnResize\')'
        + '.saveManualColumnWidths(); }',
      'plugin.saveManualColumnWidths(sideEffect());',
      'plugin.saveManualColumnWidths(true);',
    ].join('\n');
    const { output, entries } = await removal(body);

    assert.equal(
      output.includes('new Handsontable(el, {}).getPlugin(\'manualColumnResize\').saveManualColumnWidths();'),
      true
    );
    assert.equal(
      output.includes('await new Handsontable(el, {}).getPlugin(\'manualColumnResize\').saveManualColumnWidths(); }'),
      true
    );
    assert.equal(output.includes('plugin.saveManualColumnWidths(sideEffect());'), true);
    assert.equal(output.includes('plugin.saveManualColumnWidths(true);'), true);
    assert.equal((output.match(/TODO\(handsontable-codemod 18\.0\.0\/resize-state-methods\)/g) ?? []).length, 4);
    assert.equal(entries.filter(entry => entry.severity === 'changed').length, 0);
  });

  it('removes a call that is a whole statement, with await, void, and optional chaining', async() => {
    const { output, entries } = await removal([
      'plugin.saveManualColumnWidths();',
      'await plugin.loadManualColumnWidths();',
      'void plugin.saveManualColumnWidths();',
      'plugin?.saveManualColumnWidths();',
      'hot.getPlugin(\'manualRowResize\')!.saveManualRowHeights();',
    ].join('\n'));

    assert.equal(output, `${HEAD}const plugin = hot.getPlugin('manualColumnResize');\n`);
    assert.equal(entries.filter(entry => entry.severity === 'changed').length, 5);
  });

  it('moves the comments of a removed statement to the next statement', async() => {
    const { output } = await removal([
      '// keep: about the plugin',
      'const x = 1;',
      '',
      '// describes the call below',
      'plugin.saveManualColumnWidths(); // trailing note',
      '',
      'const y = 2;',
    ].join('\n'));

    assert.match(output, /\/\/ keep: about the plugin/);
    assert.match(output, /\/\/ describes the call below\n\/\/ trailing note\n/);
    assert.match(output, /const y = 2;/);
  });

  it('keeps the comments of a removed last statement on the previous statement or the block', async() => {
    const last = await removal('const x = 1;\n// about the call\nplugin.saveManualColumnWidths();');

    assert.match(last.output, /const x = 1;\n\/\/ about the call\n?$/);

    const only = await removal('function f() {\n  // about the call\n  plugin.saveManualColumnWidths();\n}');

    assert.match(only.output, /function f\(\) \{\n {2}\/\/ about the call\n\}/);

    const alone = await run('import Handsontable from \'handsontable\';\n'
      + 'hot.getPlugin(\'manualColumnResize\').saveManualColumnWidths(); // trailing\n', rules);

    assert.match(alone.output, /\/\/ trailing/);
  });

  it('keeps a license header on the first statement byte for byte', async() => {
    const header = '/*! Copyright (c) Example\n * All rights reserved. */';
    const source = `${header}\nhot.getPlugin('manualColumnResize').saveManualColumnWidths();\n`
      + 'import Handsontable from \'handsontable\';\nconst hot = new Handsontable(el, {});\nconst y = 2;\n';
    const { output } = await run(source, rules);

    assert.equal(output,
      `${header}\nimport Handsontable from 'handsontable';\nconst hot = new Handsontable(el, {});\nconst y = 2;\n`);
  });

  it('keeps the call and leaves a TODO when its result is used', async() => {
    const body = [
      'const w = plugin.loadManualColumnWidths();',
      'foo(plugin.loadManualColumnWidths());',
      'if (plugin.loadManualColumnWidths().length) {}',
      'ok && plugin.saveManualColumnWidths();',
      'plugin.saveManualColumnWidths().then(done);',
      'export const read = () => plugin.loadManualColumnWidths();',
    ].join('\n');
    const { output, entries } = await removal(body);

    assert.equal(output.includes('plugin.saveManualColumnWidths().then(done);'), true);
    assert.equal((output.match(/TODO\(handsontable-codemod 18\.0\.0\/resize-state-methods\)/g) ?? []).length, 6);
    assert.equal(entries.filter(entry => entry.severity === 'manual').length, 6);
    assert.equal(entries.filter(entry => entry.severity === 'changed').length, 0);
  });

  it('puts the TODO of an arrow expression body on its own statement', async() => {
    const { output } = await removal('const persist = () => plugin.saveManualColumnWidths();');

    assert.match(output,
      /\/\/ TODO\(handsontable-codemod [^)]+\): Remove saveManualColumnWidths\(\) by hand: its result/);
    assert.match(output, /\nconst persist = \(\) => plugin\.saveManualColumnWidths\(\);/);
  });

  it('keeps a call that is the whole body of a braceless statement', async() => {
    const { output, entries } = await removal([
      'if (ok) plugin.saveManualColumnWidths();',
      'else plugin.loadManualColumnWidths();',
      'for (const a of b) plugin.saveManualColumnWidths();',
    ].join('\n'));

    assert.doesNotMatch(output, /if \(ok\)\s*;/);
    assert.match(output, /plugin\.saveManualColumnWidths\(\);/);
    assert.match(output, /it has no braces, so the call was kept\./);
    assert.ok(entries.some(entry => /without braces/.test(entry.message)));
    assert.equal(entries.filter(entry => entry.severity === 'changed').length, 0);
  });

  it('leaves an empty but valid block when the removal empties it', async() => {
    const { output } = await removal([
      'if (ok) {\n  plugin.saveManualColumnWidths();\n}',
      'hook(() => { plugin.saveManualColumnWidths(); });',
    ].join('\n'));

    assert.match(output, /if \(ok\) \{\s*\}/);
    assert.match(output, /hook\(\(\) => \{\s*\}\);/);
  });

  it('removes a statement inside a switch case', async() => {
    const { output } = await removal('switch (a) { case 1: plugin.saveManualColumnWidths(); break; }');

    assert.match(output, /case 1:\s+break;/);
  });

  it('reports a method reference and a destructuring without editing them', async() => {
    const body = 'const f = plugin.saveManualColumnWidths;\nplugin.saveManualColumnWidths.bind(plugin);\n'
      + 'const { loadManualColumnWidths } = plugin;';
    const { output, entries, changed } = await run(
      `${HEAD}const plugin = hot.getPlugin('manualColumnResize');\n${body}\n`,
      rules
    );

    assert.equal(changed, false);
    assert.equal(output.includes(body), true);
    assert.equal(entries.length, 3);
    assert.ok(entries.every(entry => entry.severity === 'manual'));
  });

  it('never rewrites with safe: false, it reports', async() => {
    const { changed, entries } = await run(`${HEAD}hot.getPlugin('manualColumnResize').saveManualColumnWidths();\n`, [
      { ...REMOVE, safe: false },
    ]);

    assert.equal(changed, false);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].severity, 'manual');
  });

  it('does not touch a file that is not a Handsontable file', async() => {
    const source = '// Handsontable\nconst p = make();\np.saveManualColumnWidths();\n';
    const { changed, entries } = await run(source, rules, 'file.js');

    assert.equal(changed, false);
    assert.deepEqual(entries, []);
  });

  it('does not touch a name that the file declares itself, also on a receiver it cannot resolve', async() => {
    const declaration = [
      'class Mine {',
      '  saveManualColumnWidths() {}',
      '  run() { this.saveManualColumnWidths(); }',
      '}',
    ];
    const call = 'function f(store) { store.saveManualColumnWidths(); }';
    const declared = await run(`${HEAD}${declaration.join('\n')}\n${call}\n`, rules);
    const undeclared = await run(`${HEAD}${call}\n`, rules);

    assert.equal(declared.changed, false);
    assert.deepEqual(declared.entries, []);
    // Without the declaration the same call on a parameter is one the tool cannot place, so it reports it.
    assert.deepEqual(undeclared.entries.map(entry => entry.severity), ['manual']);
  });

  it('does not touch a bare function call or a name that only shares a prefix', async() => {
    const source = `${HEAD}saveManualColumnWidths();\nplugin.saveManualColumnWidthsToServer();\n`;
    const { changed } = await run(source, rules);

    assert.equal(changed, false);
  });

  it('works in a babylon-parsed file with top-level await', async() => {
    const source = `${HEAD}await hot.getPlugin('manualRowResize').loadManualRowHeights();\nconst z = 1;\n`;
    const { output } = await run(source, rules, 'file.js');

    assert.equal(output, `${HEAD}const z = 1;\n`);
  });

  it('adds no second TODO and removes nothing on a second run', async() => {
    const first = await removal('const w = plugin.loadManualColumnWidths();');
    const second = await run(first.output, rules);

    assert.equal(second.changed, false);
    assert.equal(second.entries.length, 1);
  });

  it('honors receiver: "instance" and reports only a receiver that looks like a grid', async() => {
    const rule = { ...REMOVE, receiver: 'instance', methods: ['flush'] };
    const source = `${HEAD}hot.flush();\nfunction f(grid, other) { grid.flush(); other.flush(); }\n`;
    const { output, entries } = await run(source, [rule]);

    assert.equal(output.startsWith(`${HEAD}function f`), true);
    assert.equal(entries.filter(entry => entry.severity === 'manual').length, 1);
    assert.match(output, /other\.flush\(\)/);
  });

  it('turns a rule without a valid receiver into a transform-error entry', async() => {
    const rule = { ...REMOVE, receiver: 'sometimes', methods: ['flush'] };
    const { changed, entries } = await run(`${HEAD}hot.flush();\n`, [rule]);

    assert.equal(changed, false);
    assert.equal(entries[0].ruleId, 'transform-error');
  });
});

describe('methodRemove: a plugin that the file keeps in a member, a property, or a branch', () => {
  const report = async(body) => {
    const result = await run(`${HEAD}${body}\n`, [REMOVE]);

    return { ...result, manual: result.entries.filter(entry => entry.severity === 'manual') };
  };

  const REPORTED = [
    ['a this member set from a ternary with a plugin branch',
      'class A { constructor(f) { this.p = f ? hot.getPlugin(\'manualColumnResize\') : null; } '
        + 'go() { this.p.saveManualColumnWidths(); } }'],
    ['a this member set from a ternary of two plugins',
      'class A { constructor(f) { this.p = f ? hot.getPlugin(\'manualColumnResize\') '
        + ': hot.getPlugin(\'manualRowResize\'); } go() { this.p.saveManualColumnWidths(); } }'],
    ['a this member set from || with a plugin',
      'class A { constructor(q) { this.p = q || hot.getPlugin(\'manualColumnResize\'); } '
        + 'go() { this.p.saveManualColumnWidths(); } }'],
    ['a variable set from a ternary with a plugin branch',
      'let p = f ? hot.getPlugin(\'manualColumnResize\') : other; p.saveManualColumnWidths();'],
    ['a property of a local object that holds the plugin',
      'const o = { p: hot.getPlugin(\'manualColumnResize\') }; o.p.saveManualColumnWidths();'],
    ['a property of a local object that holds the plugin in a branch',
      'const o = { p: f ? hot.getPlugin(\'manualColumnResize\') : null }; o.p.saveManualColumnWidths();'],
  ];

  for (const [label, body] of REPORTED) {
    it(`reports a call on ${label}, and removes nothing`, async() => {
      const result = await report(body);

      assert.equal(result.changed, false, result.output);
      assert.equal(result.manual.length, 1, JSON.stringify(result.entries));
      assert.match(result.output, /saveManualColumnWidths/);
    });
  }

  const SILENT = [
    ['a this member set from a ternary of local values',
      'class A { constructor(f) { this.p = f ? { a: 1 } : null; } go() { this.p.saveManualColumnWidths(); } }'],
    ['a this member set from a plugin of another key',
      'class A { constructor(f) { this.p = f ? hot.getPlugin(\'undoRedo\') : null; } '
        + 'go() { this.p.saveManualColumnWidths(); } }'],
    ['a property of a local object that holds something else',
      'const o = { p: other }; o.p.saveManualColumnWidths();'],
    ['a property of a local object that holds a plugin of another key',
      'const o = { p: hot.getPlugin(\'undoRedo\') }; o.p.saveManualColumnWidths();'],
    ['another property of a local object that holds the plugin',
      'const o = { p: hot.getPlugin(\'manualColumnResize\'), q: 1 }; o.q.saveManualColumnWidths();'],
  ];

  for (const [label, body] of SILENT) {
    it(`stays silent about a call on ${label}`, async() => {
      const result = await report(body);

      assert.deepEqual(result.entries, [], result.output);
    });
  }
});

describe('methodMove', () => {
  const rules = [MOVE];

  /**
   * Run the move rule over statements after a tracked grid.
   *
   * @param {string} body Statements.
   * @param {string} [file] File name.
   * @returns {Promise<{output: string, changed: boolean, entries: object[]}>} The result.
   */
  const move = (body, file) => run(`${HEAD}${body}\n`, rules, file);

  it('shipped rule is safe, instance-only, and names the plugin API', () => {
    assert.equal(MOVE.safe, true);
    assert.equal(MOVE.receiver, 'instance');
    assert.deepEqual(MOVE.via, { method: 'getPlugin', args: ['undoRedo'] });
    assert.equal('anyReceiver' in MOVE, false);
  });

  it('moves each method, keeping arguments, await, return, and chains', async() => {
    const { output } = await move([
      'hot.undo();',
      'await hot.redo();',
      'const a = hot.isUndoAvailable() && hot.isRedoAvailable();',
      'hot.clearUndo();',
      'function f() { return hot.undo(); }',
    ].join('\n'));

    assert.equal(output, `${HEAD}${[
      'hot.getPlugin(\'undoRedo\').undo();',
      'await hot.getPlugin(\'undoRedo\').redo();',
      'const a = hot.getPlugin(\'undoRedo\').isUndoAvailable() && hot.getPlugin(\'undoRedo\').isRedoAvailable();',
      'hot.getPlugin(\'undoRedo\').clear();',
      'function f() { return hot.getPlugin(\'undoRedo\').undo(); }',
    ].join('\n')}\n`);
  });

  it('leaves a grid that a cast or an annotation names as a type of the project', async() => {
    const { output, entries } = await run([
      'import Handsontable from \'handsontable\';',
      'const typed = new Handsontable(el, {}) as MyUndo;',
      'typed.undo();',
      'const declared: MyUndo = new Handsontable(el, {});',
      'declared.undo();',
      'const hot: Handsontable = new Handsontable(el, {});',
      'hot.undo();',
      'const viaUnknown = new Handsontable(el, {}) as unknown as Handsontable;',
      'viaUnknown.undo();',
    ].join('\n'), rules);

    assert.match(output, /typed\.undo\(\);/);
    assert.match(output, /declared\.undo\(\);/);
    assert.match(output, /hot\.getPlugin\('undoRedo'\)\.undo\(\);/);
    assert.match(output, /viaUnknown\.getPlugin\('undoRedo'\)\.undo\(\);/);
    assert.equal(entries.filter(entry => entry.severity === 'changed').length, 2);
  });

  it('keeps optional chaining semantics, and reports an optional call without rewriting it', async() => {
    const { output, entries } = await move([
      'hot?.undo();',
      'hot.undo?.();',
      'hot?.undo?.();',
      'a?.b.hotInstance.undo();',
      'a?.hotInstance?.undo();',
      'hot?.undoRedo;',
      'hot?.undoRedo.undo();',
    ].join('\n'));

    assert.deepEqual(output.split('\n').slice(2, 9), [
      'hot?.getPlugin(\'undoRedo\').undo();',
      'hot.undo?.();',
      'hot?.undo?.();',
      'a?.b.hotInstance.getPlugin(\'undoRedo\').undo();',
      'a?.hotInstance?.getPlugin(\'undoRedo\').undo();',
      'hot?.undoRedo;',
      'hot?.getPlugin(\'undoRedo\').undo();',
    ]);
    assert.deepEqual(entries.filter(entry => entry.severity === 'manual').map(entry => entry.line), [4, 5, 8]);
    assert.match(entries.find(entry => entry.severity === 'manual').message, /^undo\?\.\(\) is an optional call/);
  });

  it('does not make two undos of `hot.undo?.() ?? hot.getPlugin(\'undoRedo\').undo()`', async() => {
    const line = 'hot.undo?.() ?? hot.getPlugin(\'undoRedo\').undo();';
    const { output } = await move(line);

    assert.ok(output.includes(`\n${line}\n`), output);
  });

  it('keeps the quote style of the file', async() => {
    const single = await move('hot.undo();');
    const double = await run(
      'import Handsontable from "handsontable";\nconst hot = new Handsontable(el, {});\nhot.undo();\n',
      rules
    );

    assert.match(single.output, /getPlugin\('undoRedo'\)/);
    assert.match(double.output, /getPlugin\("undoRedo"\)/);
  });

  it('replaces the undoRedo property with the plugin lookup when a member of it is used', async() => {
    const { output } = await move('hot.undoRedo.clear();\nhot.undoRedo.isUndoAvailable();\nhot?.undoRedo.redo();');

    assert.match(output, /hot\.getPlugin\('undoRedo'\)\.clear\(\);/);
    assert.match(output, /hot\.getPlugin\('undoRedo'\)\.isUndoAvailable\(\);/);
    assert.match(output, /hot\?\.getPlugin\('undoRedo'\)\.redo\(\);/);
  });

  it('does not turn a call of the undoRedo property into a call of the plugin: it was no function on 17.x', async() => {
    const { output, entries } = await move('hot.undoRedo();\nawait hot?.undoRedo();');

    assert.equal(output.includes('getPlugin'), false, output);
    assert.equal(entries.filter(entry => entry.severity === 'changed').length, 0);
    assert.deepEqual(entries.filter(entry => entry.severity === 'manual').map(entry => entry.line), [3, 4]);
    assert.match(entries[0].message, /undoRedo is used in a form the tool does not rewrite\./);
  });

  it('keeps a read of the undoRedo property that is used as a value: it was undefined on 17.x', async() => {
    const { output, entries } = await move(
      'const h = hot.undoRedo;\nlist.push(hot.undoRedo);\nconst s = hot?.undoRedo;');

    assert.ok(!output.includes('getPlugin'), output);
    assert.equal(entries.filter(entry => entry.severity === 'changed').length, 0);
    assert.equal(entries.filter(entry => entry.severity === 'manual').length, 3);
    assert.match(entries[0].message, /undoRedo is read here as a value, and it was undefined on 17\.x/);
  });

  it('moves calls through this.hot, hotInstance, and typed holders', async() => {
    const source = [
      'import Handsontable from \'handsontable\';',
      'import { useRef } from \'react\';',
      'class A {',
      '  hot: Handsontable;',
      '  go() { this.hot.undo(); }',
      '}',
      'const ref = useRef<Handsontable | null>(null);',
      'ref.current?.undo();',
      'holder.current?.hotInstance?.redo();',
    ].join('\n');
    const { output } = await run(source, rules, 'file.tsx');

    assert.match(output, /this\.hot\.getPlugin\('undoRedo'\)\.undo\(\)/);
    assert.match(output, /ref\.current\?\.getPlugin\('undoRedo'\)\.undo\(\)/);
    assert.match(output, /holder\.current\?\.hotInstance\?\.getPlugin\('undoRedo'\)\.redo\(\)/);
  });

  it('is idempotent and never touches a plugin receiver', async() => {
    const source = `${HEAD}hot.getPlugin('undoRedo').undo();\nhot.getPlugin('undoRedo').isUndoAvailable();\n`
      + 'const plugin = hot.getPlugin(\'undoRedo\');\nplugin.isRedoAvailable();\nplugin.undo();\n';
    const { changed, entries } = await run(source, rules);

    assert.equal(changed, false);
    assert.deepEqual(entries, []);

    const once = await move('hot.undo();\nhot.isUndoAvailable();');
    const twice = await run(once.output, rules);

    assert.equal(twice.changed, false);
  });

  it('reports an unconfirmed receiver named like a grid and ignores a generic one', async() => {
    const source = [
      'import Handsontable from \'handsontable\';',
      'function f(hot, grid, editor, history) {',
      '  hot.undo();',
      '  grid.redo();',
      '  editor.undo();',
      '  history.redo();',
      '}',
      '',
    ].join('\n');
    const { changed, entries } = await run(source, rules);

    assert.equal(changed, false);
    assert.deepEqual(entries.map(entry => [entry.severity, entry.line]), [['manual', 3], ['manual', 4]]);
  });

  it('stays silent in a file that is not a Handsontable file', async() => {
    const { changed, entries } = await run('// Handsontable\nconst hot = make();\nhot.undo();\n', rules, 'file.js');

    assert.equal(changed, false);
    assert.deepEqual(entries, []);
  });

  it('rewrites only tracked instances, so clearUndo on an untracked receiver is left alone', async() => {
    const untracked = await move('other.clearUndo();\nother.undo();\nhot.clearUndo();');

    assert.match(untracked.output, /other\.clearUndo\(\);/);
    assert.match(untracked.output, /other\.undo\(\);/);
    assert.match(untracked.output, /hot\.getPlugin\('undoRedo'\)\.clear\(\);/);

    const grid = await move('function f(grid) { grid.clearUndo(); }');

    assert.equal(grid.changed, false);
    assert.equal(grid.entries.filter(entry => entry.severity === 'manual').length, 1);
  });

  it('rejects receiver "any" on a move rule', async() => {
    const { entries } = await run(`${HEAD}hot.undo();\n`, [{ ...MOVE, receiver: 'any' }]);

    assert.equal(entries[0].ruleId, 'transform-error');
  });

  it('reports references, computed access, and write targets without editing them', async() => {
    const body = [
      'const f = hot.undo;',
      'hot.undo.bind(hot);',
      'hot[\'undo\']();',
      'hot.undoRedo = null;',
      'delete hot.undoRedo;',
      'const { redo } = hot;',
    ].join('\n');
    const { output, entries, changed } = await move(body);

    assert.equal(changed, false);
    assert.equal(output.includes(body), true);
    assert.equal(entries.length, 6);
    assert.ok(entries.every(entry => entry.severity === 'manual'));
  });

  it('never rewrites with safe: false, it reports', async() => {
    const { changed, entries } = await run(`${HEAD}hot.undo();\n`, [{ ...MOVE, safe: false }]);

    assert.equal(changed, false);
    assert.equal(entries[0].severity, 'manual');
  });

  it('keeps comments on a moved statement', async() => {
    const { output } = await move('// undo the last edit\nhot.undo(); // now\n');

    assert.match(output, /\/\/ undo the last edit\nhot\.getPlugin\('undoRedo'\)\.undo\(\); \/\/ now/);
  });

  it('works in a babylon-parsed file', async() => {
    const { output } = await move('hot?.undo();', 'file.js');

    assert.match(output, /hot\?\.getPlugin\('undoRedo'\)\.undo\(\);/);
  });

  it('rejects a rule with a malformed via or property', async() => {
    const badVia = await run(`${HEAD}hot.undo();\n`, [{ ...MOVE, via: { method: 'getPlugin' } }]);
    const badProperty = await run(`${HEAD}hot.undo();\n`, [{ ...MOVE, properties: { undoRedo: 'x' } }]);

    assert.equal(badVia.entries[0].ruleId, 'transform-error');
    assert.equal(badProperty.entries[0].ruleId, 'transform-error');
  });
});

describe('methodMove: a member that code tests before it uses', () => {
  const rules = [MOVE];
  const BODY_HEAD = `${HEAD}const other = new Handsontable(el, {});\n`;

  /**
   * Run the move rule over a body with markers, three times, and check that runs 2 and 3 change nothing.
   *
   * @param {string} body Statements after the grid.
   * @returns {Promise<{output: string, entries: object[]}>} The first run.
   */
  async function twice(body) {
    const plan = { versions: [{ version: '18.0.0', rules }], rulesById: new Map(rules.map(rule => [rule.id, rule])) };
    const options = { markers: true };
    const first = await transformFile({ filePath: 'file.ts', source: `${BODY_HEAD}${body}\n`, plan, options });
    const second = await transformFile({ filePath: 'file.ts', source: first.output, plan, options });
    const third = await transformFile({ filePath: 'file.ts', source: second.output, plan, options });

    assert.equal(second.output, first.output, 'run 2 changed the file');
    assert.equal(third.output, second.output, 'run 3 changed the file');

    return first;
  }

  const manual = entries => entries.filter(entry => entry.severity === 'manual');
  const changed = entries => entries.filter(entry => entry.severity === 'changed');

  it('says in the rule and in the entry that the call did not work on 17.x', async() => {
    const { entries, output } = await twice('function f() { hot.undo(); }');

    assert.match(MOVE.message, /did not work on 17\.x: it threw a TypeError/);
    assert.match(MOVE.advice, /Core had no undo methods and no undoRedo property in 17\.x/);
    assert.match(changed(entries)[0].message, /threw a TypeError/);
    assert.ok(output.includes('hot.getPlugin(\'undoRedo\').undo()'), output);
  });

  it('still moves a plain call, and a plain read of the property, on a confirmed instance', async() => {
    const { entries, output } = await twice('function f() { hot.undo(); hot.undoRedo.clear(); }');

    assert.equal(changed(entries).length, 2);
    assert.ok(output.includes('hot.getPlugin(\'undoRedo\').undo()'), output);
    assert.ok(output.includes('hot.getPlugin(\'undoRedo\').clear()'), output);
  });

  const TESTS = [
    ['the test of an if', 'function f() { if (hot.undoRedo) { hot.undoRedo.clear(); } }', 2],
    ['a negated test with an early return', 'function f() { if (!hot.undoRedo) { return; } hot.undoRedo.clear(); }', 2],
    ['typeof', 'function f() { return typeof hot.undo === \'function\' ? hot.undo() : null; }', 2],
    ['the in operator', 'function f() { return \'undo\' in hot && hot.undo(); }', 2],
    ['an optional chain on the property', 'function f() { return hot.undoRedo?.clear(); }', 1],
    ['a logical operand', 'function f() { hot.undoRedo && hot.undoRedo.clear(); }', 2],
    ['a comparison with undefined',
      'function f() { if (hot.undoRedo === undefined) { return; } hot.undoRedo.clear(); }', 2],
    ['a comparison with null', 'function f() { if (hot.undoRedo != null) { hot.undoRedo.clear(); } }', 2],
    ['Boolean()', 'function f() { return Boolean(hot.undo) && hot.undo(); }', 2],
    ['a conditional expression', 'function f() { return hot.undo ? hot.undo() : null; }', 2],
    ['a while loop', 'function f() { while (hot.undoRedo) { hot.undoRedo.clear(); } }', 2],
    ['a callback inside the guarded function',
      'function f() { if (hot.undoRedo) { [1].forEach(() => hot.undoRedo.clear()); } }', 2],
    ['this.hot',
      'class A { go() { this.hot = new Handsontable(el, {}); if (this.hot.undoRedo) { this.hot.undoRedo.clear(); } } }',
      2],
  ];

  for (const [label, body, count] of TESTS) {
    it(`reports the test and what it guards, and moves nothing: ${label}`, async() => {
      const { entries, output } = await twice(body);
      const held = manual(entries).filter(entry => /test/.test(entry.message));

      assert.equal(changed(entries).length, 0, output);
      assert.equal(held.length, count, JSON.stringify(entries.map(entry => entry.message)));
      assert.ok(!output.includes('getPlugin(\'undoRedo\').clear'), output);
      assert.ok(!output.includes('getPlugin(\'undoRedo\').undo'), output);
    });
  }

  it('says what happened on 17.x, not that the test never passed, for a negated test', async() => {
    const { entries } = await twice('function f() { if (!hot.undoRedo) { return; } hot.undoRedo.clear(); }');
    const held = manual(entries).filter(entry => /test/.test(entry.message));

    assert.equal(held.length, 2);

    for (const entry of held) {
      assert.doesNotMatch(entry.message, /never passed/);
      assert.match(entry.message, /undoRedo was undefined on 17\.x/);
    }
  });

  const COMPARISONS = [
    // [comparison, whether its answer changes when the read stops being undefined]
    ['hot.undoRedo == null', true],
    ['hot.undoRedo != null', true],
    ['null == hot.undoRedo', true],
    ['hot.undoRedo === undefined', true],
    ['hot.undoRedo !== undefined', true],
    ['undefined !== hot.undoRedo', true],
    ['hot.undoRedo === void 0', true],
    ['hot.undoRedo === null', false],
    ['hot.undoRedo !== null', false],
    ['hot.undoRedo === \'x\'', false],
    ['hot.undoRedo !== \'x\'', false],
    ['hot.undoRedo == \'x\'', false],
  ];

  for (const [comparison, changes] of COMPARISONS) {
    it(`${changes ? 'reports' : 'does not report as a test'} the comparison ${comparison}`, async() => {
      const { entries, output } = await twice(`function f() { return ${comparison} ? 1 : 2; }`);
      const asTest = manual(entries).filter(entry => /read in a test here/.test(entry.message));

      assert.equal(asTest.length, changes ? 1 : 0, JSON.stringify(entries.map(entry => entry.message)));
      assert.equal(changed(entries).length, 0, output);
    });
  }

  it('names the guard in the entry', async() => {
    const { entries } = await twice('function f() { if (hot.undoRedo) { hot.undoRedo.clear(); } }');
    const [test, guarded] = manual(entries).filter(entry => entry.line === 4);

    assert.match(test.message, /^Call them on the plugin: hot\.getPlugin\('undoRedo'\)\./);
    assert.match(test.message, /The tool left undoRedo alone: (?:it is read in a test here|a test of undoRedo)/);
    assert.match(test.message, /, and undoRedo was undefined on 17\.x, because core had no undoRedo\./);
    assert.ok([test, guarded].some(entry => /it is read in a test here/.test(entry.message)));
    assert.ok([test, guarded].some(entry => /a test of undoRedo on the same receiver guards it/.test(entry.message)));
    assert.match(test.message, /a rewrite would change what that test answers and which code it guards runs\.$/);
  });

  it('moves a call that a test on another receiver, in another function, or after it does not guard', async() => {
    const cases = [
      'function f() { if (other.undoRedo) { other.undoRedo.clear(); } hot.undo(); }',
      'function f() { if (hot.undoRedo) { hot.undoRedo.clear(); } } function g() { hot.undo(); }',
      'function g() { hot.undo(); } function f() { if (hot.undo) { return 1; } }',
      'function f() { if (this.hot.undoRedo) { this.hot.undoRedo.clear(); } hot.undo(); }',
    ];

    for (const body of cases) {
      const { entries, output } = await twice(body);
      const moved = changed(entries);

      assert.ok(moved.length >= 1, body);
      assert.ok(output.includes('hot.getPlugin(\'undoRedo\').undo()'), `${body}\n${output}`);
    }
  });

  it('reports a test of a receiver that is not a confirmed instance only as before', async() => {
    const { entries } = await twice('function f(thing) { if (thing.undoRedo) { thing.undoRedo.clear(); } }');

    assert.deepEqual(entries, []);
  });
});

describe('callUnwrap', () => {
  const rules = [UNWRAP];
  const head = 'import Handsontable from \'handsontable\';\n';

  it('ships as report-only because 17.x sanitize used DOMPurify', () => {
    assert.equal(byId('helper-sanitize').safe, false);
    assert.equal(byId('helper-sanitize').guide, 'replace-built-in-dompurify-with-a-custom-sanitizer');
  });

  it('follows a module-level const that holds the namespace, one hop', async() => {
    const lines = entries => entries.filter(entry => entry.severity === 'manual').map(entry => entry.line);
    const aliased = `${head}const HT = Handsontable;\nconst v = HT.helper.sanitize(x);\n`;
    const alias = await run(aliased, [byId('helper-sanitize')]);

    assert.deepEqual(lines(alias.entries), [3]);

    for (const preamble of [
      'let HT = Handsontable;',
      'var HT = Handsontable;',
      'const HT = other;',
      'const HT = Handsontable.helper;',
      'const { HT } = Handsontable;',
      'function f() { const HT = Handsontable; return HT.helper.sanitize(x); }',
    ]) {
      const result = await run(`${head}${preamble}\nconst v = HT.helper.sanitize(x);\n`, [byId('helper-sanitize')]);

      assert.deepEqual(lines(result.entries), [], preamble);
    }
  });

  it('reports every match and edits nothing when the rule is not safe', async() => {
    const source = `${head}const a = Handsontable.helper.sanitize(x);\nconst b = Handsontable.helper.sanitize(y, o);\n`;
    const { changed, entries } = await run(source, [byId('helper-sanitize')]);

    assert.equal(changed, false);
    assert.deepEqual(entries.map(entry => entry.severity), ['manual', 'manual']);
    assert.match(entries[0].message, /DOMPurify/);
  });

  it('replaces the call with its argument and adds parentheses for precedence', async() => {
    const { output, entries } = await run([
      head,
      'const a = Handsontable.helper.sanitize(x);',
      'const b = Handsontable.helper.sanitize(p || q).trim();',
      // eslint-disable-next-line no-template-curly-in-string
      'const c = `<i>${Handsontable.helper.sanitize(html)}</i>`;',
      'const d = () => Handsontable.helper.sanitize({ a: 1 });',
      'const e = Handsontable.helper.sanitize(a ? b : c).length;',
      'const f = Handsontable.helper.sanitize(await load());',
      '/* why */ Handsontable.helper.sanitize(g);',
    ].join(''), rules);

    assert.match(output, /const a = x;/);
    assert.match(output, /const b = \(p \|\| q\)\.trim\(\);/);
    assert.match(output, /`<i>\$\{html\}<\/i>`/);
    assert.match(output, /\(\{\s*a: 1\s*\}\)/);
    assert.match(output, /const e = \(a \? b : c\)\.length;/);
    assert.match(output, /const f = await load\(\);/);
    assert.match(output, /\/\* why \*\/ g;/);
    assert.equal(entries.filter(entry => entry.severity === 'changed').length, 7);
  });

  it('resolves a namespace under another local name and a require', async() => {
    const imported = await run('import Hot from \'handsontable\';\nconst a = Hot.helper.sanitize(x);\n', rules);
    const required = await run(
      'const Hot = require(\'handsontable\');\nconst a = Hot.helper.sanitize(x);\n',
      rules,
      'file.js'
    );
    const global = await run('const a = Handsontable.helper.sanitize(x);\n', rules, 'file.js');

    assert.match(imported.output, /const a = x;/);
    assert.match(required.output, /const a = x;/);
    assert.match(global.output, /const a = x;/);
  });

  it('follows a const alias and a destructured function', async() => {
    const { output } = await run([
      head,
      'const { sanitize } = Handsontable.helper;\n',
      'const { sanitize: clean } = Handsontable.helper;\n',
      'const alias = Handsontable.helper.sanitize;\n',
      'const a = sanitize(x) + clean(y) + alias(z);\n',
    ].join(''), rules);

    assert.match(output, /const a = x \+ y \+ z;/);
    assert.match(output, /const \{ sanitize \} = Handsontable\.helper;/);
  });

  it('does not follow a let or var alias, which the file can set again, and still follows the const one', async() => {
    const source = [
      head,
      'let clean = Handsontable.helper.sanitize;\n',
      'var older = Handsontable.helper.sanitize;\n',
      'const kept = Handsontable.helper.sanitize;\n',
      'const a = clean(x) + older(y) + kept(z);\n',
    ].join('');
    const { output, changed } = await run(source, rules);

    assert.equal(changed, true);
    assert.match(output, /const a = clean\(x\) \+ older\(y\) \+ z;/);
  });

  it('reports instead of editing extra arguments, spreads, optional calls, and references', async() => {
    const body = [
      'Handsontable.helper.sanitize(x, options);',
      'Handsontable.helper.sanitize(...args);',
      'Handsontable.helper.sanitize();',
      'Handsontable.helper?.sanitize(x);',
      'Handsontable.helper.sanitize?.(x);',
      'list.map(Handsontable.helper.sanitize);',
    ].join('\n');
    const { output, entries, changed } = await run(`${head}${body}\n`, rules);

    assert.equal(changed, false);
    assert.equal(output.includes(body), true);
    assert.equal(entries.length, 6);
    assert.ok(entries.every(entry => entry.severity === 'manual'));
  });

  it('leaves a shadowed namespace and a different function alone', async() => {
    const source = `${head}function f(Handsontable) { return Handsontable.helper.sanitize(x); }\n`
      + 'const a = Handsontable.helper.toHyphen(x);\nconst b = other.helper.sanitize(x);\n';
    const { changed, entries } = await run(source, rules);

    assert.equal(changed, false);
    assert.deepEqual(entries, []);
  });

  it('stays silent in a file that is not a Handsontable file', async() => {
    const { changed, entries } = await run('// Handsontable\nconst a = helper.sanitize(x);\n', rules, 'file.js');

    assert.equal(changed, false);
    assert.deepEqual(entries, []);
  });

  it('is idempotent', async() => {
    const once = await run(`${head}const a = Handsontable.helper.sanitize(x);\n`, rules);
    const twice = await run(once.output, rules);

    assert.equal(twice.changed, false);
  });

  it('honors arg and rejects a malformed rule', async() => {
    const second = await run(`${head}const a = Handsontable.helper.pick(x, y);\n`, [
      { ...UNWRAP, callee: 'Handsontable.helper.pick', arg: 1 },
    ]);
    const bad = await run(`${head}const a = Handsontable.sanitize(x);\n`, [{ ...UNWRAP, callee: 'sanitize' }]);

    assert.match(second.output, /const a = y;/);
    assert.equal(bad.entries[0].ruleId, 'transform-error');
  });
});
