import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addNamedImport,
  findDynamicImports,
  findImports,
  findReExports,
  findRequires,
  getImportedBindings,
  moveNamedImport,
  removeNamedImport,
  renameBinding,
} from '../src/lib/imports.mjs';
import { parse, print } from './helpers/parse.mjs';

const TS_PARSERS = ['ts', 'tsx'];
const ALL_PARSERS = ['babylon', 'ts', 'tsx'];

describe('findImports and getImportedBindings', () => {
  for (const parser of ALL_PARSERS) {
    it(`lists default, named, aliased, and namespace bindings (${parser})`, () => {
      const { j, root } = parse([
        'import H, { a as b, c } from \'handsontable\';',
        'import * as ns from \'handsontable\';',
        'import \'handsontable/styles/handsontable.css\';',
        'import other from \'handsontable-extra\';',
      ].join('\n'), parser);
      const bindings = getImportedBindings(j, root, 'handsontable');

      assert.deepEqual(bindings.map(({ imported, local, kind, form }) => ({ imported, local, kind, form })), [
        { imported: 'default', local: 'H', kind: 'value', form: 'default' },
        { imported: 'a', local: 'b', kind: 'value', form: 'named' },
        { imported: 'c', local: 'c', kind: 'value', form: 'named' },
        { imported: '*', local: 'ns', kind: 'value', form: 'namespace' },
      ]);
      assert.equal(findImports(j, root, 'handsontable').length, 2);
    });
  }

  it('accepts a predicate and does not match a longer module name', () => {
    const { j, root } = parse([
      'import { a } from \'handsontable/common\';',
      'import { b } from \'handsontable-extra\';',
      'import \'handsontable/styles.css\';',
    ].join('\n'));

    assert.equal(findImports(j, root, value => value.startsWith('handsontable/')).length, 2);
    assert.equal(findImports(j, root, 'handsontable').length, 0);
  });

  for (const parser of TS_PARSERS) {
    it(`separates type and value kinds (${parser})`, () => {
      const { j, root } = parse([
        'import type { A } from \'handsontable\';',
        'import { type B, C } from \'handsontable\';',
      ].join('\n'), parser);
      const kinds = getImportedBindings(j, root, 'handsontable').map(({ imported, kind }) => `${imported}:${kind}`);

      assert.deepEqual(kinds, ['A:type', 'B:type', 'C:value']);
    });
  }

  it('skips imports nested in an ambient module', () => {
    const { j, root } = parse('declare module \'x\' { import { a } from \'handsontable\'; }', 'ts');

    assert.equal(findImports(j, root, 'handsontable').length, 0);
  });
});

describe('addNamedImport', () => {
  for (const parser of ALL_PARSERS) {
    it(`merges into an existing declaration of the same module (${parser})`, () => {
      const { j, root } = parse('import { a } from \'handsontable\';\nconst x = 1;\n', parser);
      const result = addNamedImport(j, root, { source: 'handsontable', imported: 'b' });

      assert.equal(result.added, true);
      assert.equal(result.local, 'b');
      assert.equal(print(root), 'import { a, b } from \'handsontable\';\nconst x = 1;\n');
    });

    it(`inserts a new declaration after the last import (${parser})`, () => {
      const { j, root } = parse('import a from \'a\';\nimport b from \'b\';\nconst x = 1;\n', parser);

      addNamedImport(j, root, { source: 'handsontable', imported: 'Core', local: 'HotCore' });

      assert.equal(print(root), 'import a from \'a\';\nimport b from \'b\';\n'
        + 'import { Core as HotCore } from \'handsontable\';\nconst x = 1;\n');
    });

    it(`goes before the last import when a blank line follows the import block (${parser})`, () => {
      const { j, root } = parse('import a from \'a\';\nimport b from \'b\';\n\nconst x = 1;\n', parser);

      addNamedImport(j, root, { source: 'handsontable', imported: 'Core' });

      assert.equal(print(root), 'import a from \'a\';\nimport { Core } from \'handsontable\';\n'
        + 'import b from \'b\';\n\nconst x = 1;\n');
    });
  }

  it('does not duplicate an existing specifier and reports the existing local name', () => {
    const { j, root } = parse('import { a as alias } from \'handsontable\';\n');
    const result = addNamedImport(j, root, { source: 'handsontable', imported: 'a' });

    assert.deepEqual({ added: result.added, local: result.local, reason: result.reason },
      { added: false, local: 'alias', reason: 'exists' });
    assert.equal(print(root), 'import { a as alias } from \'handsontable\';\n');
  });

  for (const parser of TS_PARSERS) {
    it(`keeps import type separate from value imports (${parser})`, () => {
      const { j, root } = parse('import { a } from \'handsontable\';\nimport type { T } from \'handsontable\';\n',
        parser);

      addNamedImport(j, root, { source: 'handsontable', imported: 'U', typeOnly: true });
      addNamedImport(j, root, { source: 'handsontable', imported: 'b' });

      assert.equal(print(root), 'import { a, b } from \'handsontable\';\n'
        + 'import type { T, U } from \'handsontable\';\n');
    });

    it(`creates a new import type when only a value import exists (${parser})`, () => {
      const { j, root } = parse('import { a } from \'handsontable\';\n', parser);

      addNamedImport(j, root, { source: 'handsontable', imported: 'U', typeOnly: true });

      assert.equal(print(root), 'import { a } from \'handsontable\';\nimport type { U } from \'handsontable\';\n');
    });

    it(`treats a value import as satisfying a type request (${parser})`, () => {
      const { j, root } = parse('import { U } from \'handsontable\';\n', parser);
      const result = addNamedImport(j, root, { source: 'handsontable', imported: 'U', typeOnly: true });

      assert.equal(result.added, false);
    });

    it(`does not add a value import over a type import of the same local name (${parser})`, () => {
      const { j, root } = parse('import type { U } from \'handsontable\';\n', parser);
      const result = addNamedImport(j, root, { source: 'handsontable', imported: 'U' });

      assert.deepEqual({ added: result.added, reason: result.reason }, { added: false, reason: 'collision' });
      assert.equal(print(root), 'import type { U } from \'handsontable\';\n');
    });
  }

  it('does not merge into a namespace import or a side-effect import', () => {
    const { j, root } = parse('import * as ns from \'handsontable\';\nimport \'handsontable\';\n');

    addNamedImport(j, root, { source: 'handsontable', imported: 'a' });

    assert.equal(print(root), 'import * as ns from \'handsontable\';\nimport \'handsontable\';\n'
      + 'import { a } from \'handsontable\';\n');
  });

  it('merges named specifiers into a default-only declaration', () => {
    const { j, root } = parse('import H from \'handsontable\';\n');

    addNamedImport(j, root, { source: 'handsontable', imported: 'a' });

    assert.equal(print(root), 'import H, { a } from \'handsontable\';\n');
  });

  it('refuses a local name another declaration owns', () => {
    const { j, root } = parse('import { x } from \'other\';\nconst Core = 1;\n');
    const result = addNamedImport(j, root, { source: 'handsontable', imported: 'Core' });

    assert.deepEqual({ added: result.added, reason: result.reason }, { added: false, reason: 'collision' });
    assert.equal(print(root), 'import { x } from \'other\';\nconst Core = 1;\n');
  });

  it('keeps the license header on top when the file has no import', () => {
    const { j, root } = parse('/**\n * License header.\n */\nconst x = 1;\n');

    addNamedImport(j, root, { source: 'handsontable', imported: 'a' });

    assert.equal(print(root), '/**\n * License header.\n */\nimport { a } from \'handsontable\';\n\nconst x = 1;\n');
  });

  it('inserts after a given anchor declaration', () => {
    const { j, root } = parse('import a from \'a\';\nimport b from \'b\';\n');
    const [anchor] = findImports(j, root, 'a');

    addNamedImport(j, root, { source: 'c', imported: 'x', anchor });

    assert.equal(print(root), 'import a from \'a\';\nimport { x } from \'c\';\nimport b from \'b\';\n');
  });
});

describe('removeNamedImport', () => {
  for (const parser of ALL_PARSERS) {
    it(`removes one specifier and keeps the declaration (${parser})`, () => {
      const { j, root } = parse('import { a, b } from \'x\';\nconst y = 1;\n', parser);
      const [binding] = getImportedBindings(j, root, 'x');
      const result = removeNamedImport(j, root, binding.declaration, binding.specifier);

      assert.deepEqual(result, { removed: true, declarationRemoved: false });
      assert.equal(print(root), 'import { b } from \'x\';\nconst y = 1;\n');
    });

    it(`removes the declaration with its last specifier (${parser})`, () => {
      const { j, root } = parse('import { a } from \'x\';\nimport \'side-effect\';\nconst y = 1;\n', parser);
      const [binding] = getImportedBindings(j, root, 'x');
      const result = removeNamedImport(j, root, binding.declaration, binding.specifier);

      assert.equal(result.declarationRemoved, true);
      assert.equal(print(root), 'import \'side-effect\';\nconst y = 1;\n');
    });
  }

  it('moves the file header to the next statement when the first import goes away', () => {
    const { j, root } = parse('/**\n * License header.\n */\nimport { a } from \'x\';\nimport b from \'b\';\n');
    const [binding] = getImportedBindings(j, root, 'x');

    removeNamedImport(j, root, binding.declaration, binding.specifier);

    assert.equal(print(root), '/**\n * License header.\n */\nimport b from \'b\';\n');
  });

  it('accepts nodes instead of paths', () => {
    const { j, root } = parse('import { a, b } from \'x\';\n');
    const [binding] = getImportedBindings(j, root, 'x');

    removeNamedImport(j, root, binding.declaration.node, binding.specifier.node);

    assert.equal(print(root), 'import { b } from \'x\';\n');
  });

  it('leaves a side-effect import alone and returns removed false for a foreign specifier', () => {
    const { j, root } = parse('import \'x\';\nimport { a } from \'y\';\n');
    const [side] = findImports(j, root, 'x');
    const [binding] = getImportedBindings(j, root, 'y');

    assert.equal(removeNamedImport(j, root, side, binding.specifier).removed, false);
  });
});

describe('moveNamedImport', () => {
  for (const parser of ALL_PARSERS) {
    it(`moves a specifier next to the old one and keeps its alias (${parser})`, () => {
      const { j, root } = parse('import { a as alias, b } from \'old\';\nconst y = 1;\n', parser);
      const [binding] = getImportedBindings(j, root, 'old');
      const result = moveNamedImport(j, root, binding.declaration, binding.specifier, 'new');

      assert.deepEqual(result, { moved: true });
      assert.equal(print(root), 'import { b } from \'old\';\nimport { a as alias } from \'new\';\nconst y = 1;\n');
    });

    it(`replaces the old declaration in place when it was the only specifier (${parser})`, () => {
      const { j, root } = parse('import { a } from \'old\';\nimport z from \'z\';\n', parser);
      const [binding] = getImportedBindings(j, root, 'old');

      moveNamedImport(j, root, binding.declaration, binding.specifier, 'new');

      assert.equal(print(root), 'import { a } from \'new\';\nimport z from \'z\';\n');
    });
  }

  it('merges into an existing declaration of the target', () => {
    const { j, root } = parse('import { a } from \'old\';\nimport { c } from \'new\';\n');
    const [binding] = getImportedBindings(j, root, 'old');

    moveNamedImport(j, root, binding.declaration, binding.specifier, 'new');

    assert.equal(print(root), 'import { c, a } from \'new\';\n');
  });

  it('keeps the license header when the moved import was the first statement', () => {
    const { j, root } = parse('/**\n * License header.\n */\nimport { a } from \'old\';\n');
    const [binding] = getImportedBindings(j, root, 'old');

    moveNamedImport(j, root, binding.declaration, binding.specifier, 'new');

    assert.equal(print(root), '/**\n * License header.\n */\nimport { a } from \'new\';\n');
  });

  it('renames the exported name when asked', () => {
    const { j, root } = parse('import { a } from \'old\';\n');
    const [binding] = getImportedBindings(j, root, 'old');

    moveNamedImport(j, root, binding.declaration, binding.specifier, 'new', { imported: 'A' });

    assert.equal(print(root), 'import { A as a } from \'new\';\n');
  });

  for (const parser of TS_PARSERS) {
    it(`keeps a type specifier a type import (${parser})`, () => {
      const { j, root } = parse('import type { T } from \'old\';\n', parser);
      const [binding] = getImportedBindings(j, root, 'old');

      moveNamedImport(j, root, binding.declaration, binding.specifier, 'new');

      assert.equal(print(root), 'import type { T } from \'new\';\n');
    });
  }

  it('keeps both specifiers when the target already imports the name under another alias', () => {
    const { j, root } = parse('import { a } from \'old\';\nimport { a as other } from \'new\';\n');
    const [binding] = getImportedBindings(j, root, 'old');

    assert.equal(moveNamedImport(j, root, binding.declaration, binding.specifier, 'new').moved, true);
    assert.equal(print(root), 'import { a as other, a } from \'new\';\n');
  });

  it('refuses a default or namespace specifier', () => {
    const { j, root } = parse('import H from \'old\';\n');
    const [binding] = getImportedBindings(j, root, 'old');

    assert.deepEqual(moveNamedImport(j, root, binding.declaration, binding.specifier, 'new'),
      { moved: false, reason: 'not-named' });
  });
});

describe('renameBinding', () => {
  /**
   * Rename the single specifier of the first import of `x`.
   *
   * @param {string} source Source text.
   * @param {string} parser Parser name.
   * @param {string} newName New imported name.
   * @returns {{result: object, output: string}} The helper result and the printed source.
   */
  function rename(source, parser, newName) {
    const { j, root } = parse(source, parser);
    const [binding] = getImportedBindings(j, root, 'x');
    const result = renameBinding(j, root, binding.specifier, newName);

    return { result, output: print(root) };
  }

  for (const parser of ['babylon', 'tsx']) {
    it(`renames references, JSX names, and shorthand values (${parser})`, () => {
      const { result, output } = rename([
        'import { Comp } from \'x\';',
        'const a = <Comp />;',
        'const b = { Comp };',
        'const c = { Comp: Comp, other: Comp };',
        'call(Comp);',
        'export { Comp };',
      ].join('\n'), parser, 'Widget');

      assert.equal(result.renamed, true);
      assert.equal(output, [
        'import { Widget } from \'x\';',
        'const a = <Widget />;',
        'const b = { Comp: Widget };',
        'const c = { Comp: Widget, other: Widget };',
        'call(Widget);',
        'export { Widget as Comp };',
      ].join('\n'));
    });
  }

  for (const parser of ALL_PARSERS) {
    it(`leaves shadowed names, property names, and unrelated keys alone (${parser})`, () => {
      const source = [
        'import { Comp } from \'x\';',
        'function f(Comp) { return Comp; }',
        'function g() { { const Comp = 1; use(Comp); } return Comp; }',
        'function h() { try { } catch (Comp) { use(Comp); } }',
        'const { Comp: renamed } = obj; const [Comp2] = arr;',
        'use(obj.Comp, { Comp: 1 }, class { Comp() {} });',
        'label: for (const Comp of list) { use(Comp); }',
        'use(Comp);',
      ].join('\n');
      const { output } = rename(source, parser, 'Widget');

      assert.equal(output, [
        'import { Widget } from \'x\';',
        'function f(Comp) { return Comp; }',
        'function g() { { const Comp = 1; use(Comp); } return Widget; }',
        'function h() { try { } catch (Comp) { use(Comp); } }',
        'const { Comp: renamed } = obj; const [Comp2] = arr;',
        'use(obj.Comp, { Comp: 1 }, class { Comp() {} });',
        'label: for (const Comp of list) { use(Comp); }',
        'use(Widget);',
      ].join('\n'));
    });
  }

  for (const parser of TS_PARSERS) {
    it(`renames type references, qualified names, and typeof (${parser})`, () => {
      const { output } = rename([
        'import { Settings } from \'x\';',
        'let a: Settings;',
        'let b: Settings.Nested;',
        'let c: typeof Settings;',
        'interface I extends Settings { Settings: string }',
        'type Q<T> = Array<Settings>;',
        'function f<Settings>(p: Settings) {}',
      ].join('\n'), parser, 'Options');

      assert.equal(output, [
        'import { Options } from \'x\';',
        'let a: Options;',
        'let b: Options.Nested;',
        'let c: typeof Options;',
        'interface I extends Options { Settings: string }',
        'type Q<T> = Array<Options>;',
        'function f<Settings>(p: Settings) {}',
      ].join('\n'));
    });

    it(`does not treat a value-only local as shadowing a type reference (${parser})`, () => {
      const { output } = rename([
        'import { Settings } from \'x\';',
        'function f(Settings: number) { let a: Settings; }',
      ].join('\n'), parser, 'Options');

      assert.equal(output, [
        'import { Options } from \'x\';',
        'function f(Settings: number) { let a: Options; }',
      ].join('\n'));
    });
  }

  it('only renames the imported name of an aliased specifier', () => {
    const { result, output } = rename('import { Comp as C } from \'x\';\nuse(C);\n', 'tsx', 'Widget');

    assert.equal(result.renamed, true);
    assert.equal(output, 'import { Widget as C } from \'x\';\nuse(C);\n');
  });

  it('does not rename on a collision with a declaration in the file', () => {
    const source = 'import { Comp } from \'x\';\nconst Widget = 1;\nuse(Comp);\n';
    const { result, output } = rename(source, 'babylon', 'Widget');

    assert.deepEqual(result, { renamed: false, reason: 'collision' });
    assert.equal(output, source);
  });

  it('does not rename on a collision with an import in the file', () => {
    const source = 'import { Comp } from \'x\';\nimport { Widget } from \'y\';\nuse(Comp, Widget);\n';
    const { result, output } = rename(source, 'babylon', 'Widget');

    assert.equal(result.reason, 'collision');
    assert.equal(output, source);
  });

  it('does not rename when a scope that holds a reference declares the new name', () => {
    const source = 'import { Comp } from \'x\';\nfunction f(Widget) { return Comp + Widget; }\n';
    const { result, output } = rename(source, 'babylon', 'Widget');

    assert.equal(result.reason, 'collision');
    assert.equal(output, source);
  });

  it('accepts a declaration that holds one specifier and refuses one with several', () => {
    const one = parse('import { Comp } from \'x\';\nuse(Comp);\n');
    const [declaration] = findImports(one.j, one.root, 'x');

    assert.equal(renameBinding(one.j, one.root, declaration, 'Widget').renamed, true);

    const many = parse('import { Comp, B } from \'x\';\n');
    const [manyDeclaration] = findImports(many.j, many.root, 'x');

    assert.deepEqual(renameBinding(many.j, many.root, manyDeclaration, 'Widget'),
      { renamed: false, reason: 'ambiguous' });
  });

  it('reports the same name and a non-named specifier', () => {
    assert.equal(rename('import { Comp } from \'x\';\n', 'babylon', 'Comp').result.reason, 'same');

    const { j, root } = parse('import Comp from \'x\';\n');
    const [binding] = getImportedBindings(j, root, 'x');

    assert.equal(renameBinding(j, root, binding.specifier, 'Widget').reason, 'not-named');
  });

  it('leaves untouched lines byte-identical', () => {
    const source = [
      'const   spaced  =  1;   // keep',
      'import { Comp } from \'x\';',
      'function  keep ( ) { return  { a : 1 } }',
      'use( Comp );',
      '',
    ].join('\n');
    const { output } = rename(source, 'babylon', 'Widget');

    assert.equal(output, source.replace('{ Comp }', '{ Widget }').replace('use( Comp )', 'use( Widget )'));
  });
});

describe('renameBinding scope edge cases', () => {
  /**
   * Rename `Comp` to `Widget` and return the printed source.
   *
   * @param {string} source Source text.
   * @param {string} [parser] Parser name.
   * @returns {string} Printed source.
   */
  function renamed(source, parser = 'tsx') {
    const { j, root } = parse(`import { Comp } from 'x';\n${source}`, parser);
    const [binding] = getImportedBindings(j, root, 'x');

    renameBinding(j, root, binding.specifier, 'Widget');

    return print(root).replace('import { Widget } from \'x\';\n', '');
  }

  it('respects var hoisting, loops, switch cases, and named expressions', () => {
    const source = [
      'function a() { if (c) { var Comp = 1; } return Comp; }',
      'function b() { for (let Comp = 0; Comp < 1; Comp++) { use(Comp); } use(Comp); }',
      'function c2() { switch (k) { case 1: let Comp = 2; use(Comp); } use(Comp); }',
      'const d = function Comp() { return Comp; }; use(Comp);',
      'const e = class Comp { m() { return Comp; } }; use(Comp);',
      'const f = ({ Comp }) => Comp; const g = ([Comp]) => Comp; use(Comp);',
      'try { } catch ({ Comp }) { use(Comp); } use(Comp);',
    ].join('\n');

    assert.equal(renamed(source), [
      'function a() { if (c) { var Comp = 1; } return Comp; }',
      'function b() { for (let Comp = 0; Comp < 1; Comp++) { use(Comp); } use(Widget); }',
      'function c2() { switch (k) { case 1: let Comp = 2; use(Comp); } use(Widget); }',
      'const d = function Comp() { return Comp; }; use(Widget);',
      'const e = class Comp { m() { return Comp; } }; use(Widget);',
      'const f = ({ Comp }) => Comp; const g = ([Comp]) => Comp; use(Widget);',
      'try { } catch ({ Comp }) { use(Comp); } use(Widget);',
    ].join('\n'));
  });

  it('treats TypeScript declarations as shadows only in their own namespace', () => {
    const source = [
      'namespace N { const Comp = 1; use(Comp); }',
      'function f<T extends Comp>(a: T, b: typeof Comp, c: Comp) {}',
      'type G<Comp> = { a: Comp };',
      'type H = Y extends infer Comp ? Comp : Comp;',
      'enum E { Comp = 1, Other = Comp }',
    ].join('\n');

    assert.equal(renamed(source, 'ts'), [
      'namespace N { const Comp = 1; use(Comp); }',
      'function f<T extends Widget>(a: T, b: typeof Widget, c: Widget) {}',
      'type G<Comp> = { a: Comp };',
      'type H = Y extends infer Comp ? Comp : Widget;',
      'enum E { Comp = 1, Other = Comp }',
    ].join('\n'));
  });

  it('keeps shadows that only a parameter makes in value position', () => {
    assert.equal(renamed('function f(Comp: number) { return typeof Comp; }', 'ts'),
      'function f(Comp: number) { return typeof Comp; }');
  });
});

describe('several edits on one parsed file', () => {
  it('sees a rename when a later add checks for a collision', () => {
    const { j, root } = parse('import { Comp } from \'x\';\nuse(Comp);\n');
    const [binding] = getImportedBindings(j, root, 'x');

    assert.equal(renameBinding(j, root, binding.specifier, 'Widget').renamed, true);

    const result = addNamedImport(j, root, { source: 'y', imported: 'Widget' });

    assert.deepEqual({ added: result.added, reason: result.reason }, { added: false, reason: 'collision' });
    assert.equal(print(root), 'import { Widget } from \'x\';\nuse(Widget);\n');
  });

  it('sees an earlier add when a second add wants the same local name', () => {
    const { j, root } = parse('import a from \'a\';\n');

    assert.equal(addNamedImport(j, root, { source: 'x', imported: 'Core' }).added, true);
    assert.equal(addNamedImport(j, root, { source: 'y', imported: 'Core' }).reason, 'collision');
    assert.equal(print(root), 'import a from \'a\';\nimport { Core } from \'x\';\n');
  });

  it('sees a removal when a later add wants the freed name', () => {
    const { j, root } = parse('import { Core } from \'x\';\nimport a from \'a\';\n');
    const [binding] = getImportedBindings(j, root, 'x');

    assert.equal(addNamedImport(j, root, { source: 'y', imported: 'Core' }).reason, 'collision');
    removeNamedImport(j, root, binding.declaration, binding.specifier);

    assert.equal(addNamedImport(j, root, { source: 'y', imported: 'Core' }).added, true);
  });

  it('refuses a name that an undeclared global in the file already uses', () => {
    const source = 'import { Comp } from \'x\';\nuse(Comp, Widget);\n';
    const { j, root } = parse(source);
    const [binding] = getImportedBindings(j, root, 'x');

    assert.equal(renameBinding(j, root, binding.specifier, 'Widget').reason, 'collision');
    assert.equal(addNamedImport(j, root, { source: 'y', imported: 'Widget' }).reason, 'collision');
    assert.equal(print(root), source);
  });
});

describe('import edits in a realistic file', () => {
  const file = [
    '/**',
    ' * License header.',
    ' */',
    'import React from \'react\';',
    'import { Core, Settings } from \'handsontable/common\';',
    '',
    'const x: Core = make();',
    '',
  ].join('\n');

  it('splits a specifier out of a declaration without extra blank lines', () => {
    const { j, root } = parse(file, 'ts');
    const [core] = getImportedBindings(j, root, 'handsontable/common');

    moveNamedImport(j, root, core.declaration, core.specifier, 'handsontable');

    assert.equal(print(root), file.replace('import { Core, Settings } from \'handsontable/common\';',
      'import { Core } from \'handsontable\';\nimport { Settings } from \'handsontable/common\';'));
  });

  it('moves every specifier of a declaration without touching other lines', () => {
    const { j, root } = parse(file, 'ts');
    const [core, settings] = getImportedBindings(j, root, 'handsontable/common');

    moveNamedImport(j, root, core.declaration, core.specifier, 'handsontable');
    moveNamedImport(j, root, settings.declaration, settings.specifier, 'handsontable');

    assert.equal(print(root), file.replace('{ Core, Settings } from \'handsontable/common\'',
      '{ Core, Settings } from \'handsontable\''));
  });
});

describe('findReExports, findDynamicImports, findRequires', () => {
  for (const parser of ALL_PARSERS) {
    it(`finds re-exports of a module (${parser})`, () => {
      const { j, root } = parse([
        'export { X } from \'src\';',
        'export * from \'src\';',
        'export * as ns from \'src\';',
        'export { Y } from \'other\';',
        'const Z = 1;',
        'export { Z };',
      ].join('\n'), parser);

      assert.equal(findReExports(j, root, 'src').length, 3);
    });

    it(`finds dynamic imports and requires, not shadowed require (${parser})`, () => {
      const { j, root } = parse([
        'import(\'src\');',
        'import(name);',
        'const a = require(\'src\');',
        'const b = require(dynamicName);',
        'function f(require) { return require(\'src\'); }',
        'import(\'other\');',
      ].join('\n'), parser);

      assert.equal(findDynamicImports(j, root, 'src').length, 1);
      assert.equal(findRequires(j, root, 'src').length, 1);
    });
  }

  for (const parser of TS_PARSERS) {
    it(`finds import types and type-only re-exports (${parser})`, () => {
      const { j, root } = parse('let a: import(\'src\').Foo;\nexport type { X } from \'src\';\n', parser);

      assert.equal(findDynamicImports(j, root, 'src').length, 1);
      assert.equal(findReExports(j, root, 'src').length, 1);
    });
  }
});
