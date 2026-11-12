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

  return transformFile({ filePath, source, plan });
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
    assert.equal(REMOVE.receiver, 'any');
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

  it('drops the comments attached to a removed statement and keeps the others', async() => {
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
    assert.doesNotMatch(output, /describes the call below|trailing note/);
    assert.match(output, /const y = 2;/);
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

    assert.match(output, /\/\/ TODO\(handsontable-codemod [^)]+\): saveManualColumnWidths\(\) is removed\. Its result/);
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
    assert.match(output, /without braces/);
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
    const { output, entries, changed } = await run(`${HEAD}const plugin = hot.getPlugin('a');\n${body}\n`, rules);

    assert.equal(changed, false);
    assert.equal(output.includes(body), true);
    assert.equal(entries.length, 3);
    assert.ok(entries.every(entry => entry.severity === 'manual'));
  });

  it('never rewrites with safe: false, it reports', async() => {
    const { changed, entries } = await run(`${HEAD}hot.getPlugin('a').saveManualColumnWidths();\n`, [
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

  it('does not touch a name that the file declares itself', async() => {
    const source = `${HEAD}${[
      'class Mine {',
      '  saveManualColumnWidths() {}',
      '  run() { this.saveManualColumnWidths(); }',
      '}',
    ].join('\n')}\n`;
    const { changed, entries } = await run(source, rules);

    assert.equal(changed, false);
    assert.deepEqual(entries, []);
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
    assert.deepEqual(MOVE.anyReceiver, ['clearUndo']);
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

  it('keeps optional chaining semantics', async() => {
    const { output } = await move([
      'hot?.undo();',
      'hot.undo?.();',
      'hot?.undo?.();',
      'a?.b.hotInstance.undo();',
      'a?.hotInstance?.undo();',
      'hot?.undoRedo;',
      'hot?.undoRedo.undo();',
      'hot.undoRedo?.undo();',
    ].join('\n'));

    assert.deepEqual(output.split('\n').slice(2, 10), [
      'hot?.getPlugin(\'undoRedo\').undo();',
      'hot.getPlugin(\'undoRedo\').undo?.();',
      'hot?.getPlugin(\'undoRedo\').undo?.();',
      'a?.b.hotInstance.getPlugin(\'undoRedo\').undo();',
      'a?.hotInstance?.getPlugin(\'undoRedo\').undo();',
      'hot?.getPlugin(\'undoRedo\');',
      'hot?.getPlugin(\'undoRedo\').undo();',
      'hot.getPlugin(\'undoRedo\')?.undo();',
    ]);
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

  it('replaces the undoRedo property with the plugin lookup', async() => {
    const { output } = await move('const h = hot.undoRedo;\nhot.undoRedo.clear();\nlist.push(hot.undoRedo);');

    assert.match(output, /const h = hot\.getPlugin\('undoRedo'\);/);
    assert.match(output, /hot\.getPlugin\('undoRedo'\)\.clear\(\);/);
    assert.match(output, /list\.push\(hot\.getPlugin\('undoRedo'\)\);/);
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

  it('rewrites an anyReceiver name on any receiver, unless the file declares it', async() => {
    const any = await move('other.clearUndo();\nother.undo();');

    assert.match(any.output, /other\.getPlugin\('undoRedo'\)\.clear\(\);/);
    assert.match(any.output, /other\.undo\(\);/);

    const declared = await move('class B { clearUndo() {} run() { this.clearUndo(); } }');

    assert.equal(declared.changed, false);
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

describe('callUnwrap', () => {
  const rules = [UNWRAP];
  const head = 'import Handsontable from \'handsontable\';\n';

  it('ships as report-only because 17.x sanitize used DOMPurify', () => {
    assert.equal(byId('helper-sanitize').safe, false);
    assert.equal(byId('helper-sanitize').guide, 'replace-built-in-dompurify-with-a-custom-sanitizer');
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
