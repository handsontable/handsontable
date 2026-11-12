import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { collectHotBindings } from '../src/lib/hot-bindings.mjs';
import { parse, print } from './helpers/parse.mjs';

const TS_PARSERS = ['ts', 'tsx'];
const ALL_PARSERS = ['babylon', 'ts', 'tsx'];

/**
 * Collect bindings for a source text.
 *
 * @param {string} source Source text.
 * @param {string} [parser] Parser name.
 * @returns {{j: object, root: object, bindings: object}} Parse result and bindings.
 */
function bind(source, parser = 'tsx') {
  const { j, root } = parse(source, parser);

  return { j, root, bindings: collectHotBindings(j, root) };
}

/**
 * Check, for every `<receiver>.probe()` call in the source, whether the receiver is a grid instance.
 *
 * @param {string} source Source text with `x.probe()` calls.
 * @param {string} [parser] Parser name.
 * @returns {boolean[]} One answer per call, in source order.
 */
function probes(source, parser = 'tsx') {
  const { j, root, bindings } = bind(source, parser);

  return root.find(j.CallExpression)
    .filter(path => path.node.callee.property?.name === 'probe')
    .paths()
    .map(path => bindings.isInstance(path.get('callee', 'object')));
}

describe('namespace bindings', () => {
  for (const parser of ALL_PARSERS) {
    it(`finds default, namespace, and base imports (${parser})`, () => {
      const { bindings } = bind([
        'import Handsontable from \'handsontable\';',
        'import HotBase from \'handsontable/base\';',
        'import * as All from \'handsontable\';',
        'import Other from \'other\';',
      ].join('\n'), parser);

      assert.deepEqual(bindings.namespace, ['Handsontable', 'HotBase', 'All']);
      assert.equal(bindings.isHotFile, true);
    });

    it(`finds require forms (${parser})`, () => {
      const { bindings } = bind([
        'const A = require(\'handsontable\');',
        'const B = require(\'handsontable/base\').default;',
        'const { default: C } = require(\'handsontable\');',
        'const D = require(\'other\');',
      ].join('\n'), parser);

      assert.deepEqual(bindings.namespace, ['A', 'B', 'C']);
    });

    it(`treats an undeclared Handsontable as the global namespace (${parser})`, () => {
      const { bindings } = bind('const hot = new Handsontable(el, {});\n', parser);

      assert.deepEqual(bindings.namespace, ['Handsontable']);
      assert.equal(bindings.isHotFile, true);
    });

    it(`does not treat a locally declared Handsontable as the global (${parser})`, () => {
      const { bindings } = bind([
        'function f(Handsontable) { return new Handsontable(); }',
        'const g = () => { const Handsontable = make(); return Handsontable; };',
      ].join('\n'), parser);

      assert.deepEqual(bindings.namespace, []);
      assert.equal(bindings.isHotFile, false);
    });

    it(`finds nothing in an unrelated file (${parser})`, () => {
      const { bindings } = bind('import React from \'react\';\nconst x = { width: 1 };\n', parser);

      assert.deepEqual(bindings.namespace, []);
      assert.deepEqual(bindings.components, { HotTable: [], HotColumn: [] });
      assert.deepEqual(
        { angular: bindings.angular, vue: bindings.vue, isHotFile: bindings.isHotFile, isModular: bindings.isModular },
        { angular: false, vue: false, isHotFile: false, isModular: false }
      );
    });
  }

  it('finds the TypeScript import-equals form', () => {
    const { bindings } = bind('import H = require(\'handsontable\');\n', 'ts');

    assert.deepEqual(bindings.namespace, ['H']);
  });

  it('keeps a type-only default import as a namespace for type positions', () => {
    const { bindings } = bind('import type Handsontable from \'handsontable\';\n', 'ts');

    assert.deepEqual(bindings.namespace, ['Handsontable']);
  });
});

describe('components, wrappers, isHotFile, isModular', () => {
  it('finds React wrapper components under their local names', () => {
    const { bindings } = bind([
      'import { HotTable, HotColumn as Col } from \'@handsontable/react-wrapper\';',
      'import { HotTable as Old } from \'@handsontable/react\';',
      'import { HotTable as Foreign } from \'some-other-package\';',
    ].join('\n'));

    assert.deepEqual(bindings.components, { HotTable: ['HotTable', 'Old'], HotColumn: ['Col'] });
    assert.equal(bindings.isHotFile, true);
  });

  it('sets the angular and vue flags', () => {
    assert.equal(bind('import { HotTableModule } from \'@handsontable/angular-wrapper\';').bindings.angular, true);
    assert.equal(bind('import { HotTable } from \'@handsontable/vue3\';').bindings.vue, true);
    assert.equal(bind('import { HotTable } from \'@handsontable/vue3\';').bindings.angular, false);
  });

  it('treats a subpath or side-effect import as a Handsontable file', () => {
    assert.equal(bind('import \'handsontable/styles/handsontable.css\';').bindings.isHotFile, true);
    assert.equal(bind('import { registerAllModules } from \'handsontable/registry\';').bindings.isHotFile, true);
    assert.equal(bind('import x from \'handsontable-like\';').bindings.isHotFile, false);
  });

  it('detects the modular setup', () => {
    assert.equal(bind('import Handsontable from \'handsontable/base\';').bindings.isModular, true);
    assert.equal(bind('import Handsontable from \'handsontable/base\';\nimport \'handsontable\';')
      .bindings.isModular, false);
    assert.equal(bind('import Handsontable from \'handsontable\';').bindings.isModular, false);
    assert.equal(bind('import Handsontable from \'handsontable/base\';\nimport type { X } from \'handsontable\';',
      'ts').bindings.isModular, true);
  });

  it('resolves a JSX element to its component and ignores a shadowed name', () => {
    const { j, root, bindings } = bind([
      'import { HotTable, HotColumn as Col } from \'@handsontable/react-wrapper\';',
      'const a = <HotTable><Col /><Other /></HotTable>;',
      'function f(HotTable) { return <HotTable />; }',
    ].join('\n'));
    const names = root.find(j.JSXElement).paths().map(path => bindings.getComponent(path));

    assert.deepEqual(names, ['HotTable', 'HotColumn', null, null]);
  });
});

describe('isInstance', () => {
  for (const parser of ['babylon', 'tsx']) {
    it(`tracks variables set from new <namespace> (${parser})`, () => {
      const answers = probes([
        'import Handsontable from \'handsontable\';',
        'const hot = new Handsontable(el, {});',
        'let later;',
        'later = new Handsontable(el, {});',
        'const copy = hot;',
        'hot.probe(); later.probe(); copy.probe();',
      ].join('\n'), parser);

      assert.deepEqual(answers, [true, true, true]);
    });

    it(`follows hotInstance chains and variables initialised from them (${parser})`, () => {
      const answers = probes([
        'const a = ref.current?.hotInstance;',
        'a.probe();',
        'this.hotRef.current.hotInstance.probe();',
        'ref.current?.hotInstance?.probe();',
        'hotRef.value.hotInstance.probe();',
        'other.current.probe();',
      ].join('\n'), parser);

      assert.deepEqual(answers, [true, true, true, true, false]);
    });

    it(`tracks class properties set from new and ignores unrelated receivers (${parser})`, () => {
      const answers = probes([
        'import Handsontable from \'handsontable\';',
        'class A {',
        '  hot = new Handsontable(el, {});',
        '  other = {};',
        '  init() { this.late = new Handsontable(el, {}); }',
        '  run() { this.hot.probe(); this.late.probe(); this.other.probe(); this.nothing.probe(); }',
        '}',
        'editor.probe();',
        'new Other().probe();',
      ].join('\n'), parser);

      assert.deepEqual(answers, [true, true, false, false, false, false]);
    });

    it(`does not track a shadowed namespace or a shadowed variable (${parser})`, () => {
      const answers = probes([
        'import Handsontable from \'handsontable\';',
        'const hot = new Handsontable(el, {});',
        'function f(Handsontable) { const h = new Handsontable(); h.probe(); }',
        'function g(hot) { hot.probe(); }',
        'function k() { { const hot = {}; hot.probe(); } hot.probe(); }',
      ].join('\n'), parser);

      assert.deepEqual(answers, [false, false, false, true]);
    });

    it(`tracks the global namespace (${parser})`, () => {
      const answers = probes('const hot = new Handsontable(el, {});\nhot.probe();\n', parser);

      assert.deepEqual(answers, [true]);
    });
  }

  for (const parser of TS_PARSERS) {
    it(`tracks annotations: Handsontable, Handsontable.Core, Core, HotInstance, unions (${parser})`, () => {
      const answers = probes([
        'import Handsontable from \'handsontable\';',
        'import type { Core, HotInstance } from \'handsontable\';',
        'import type { Core as Mine } from \'elsewhere\';',
        'declare const a: Handsontable;',
        'declare const b: Handsontable.Core;',
        'declare const c: Core;',
        'declare const d: HotInstance | null;',
        'declare const e: Handsontable | undefined;',
        'declare const f: Mine;',
        'declare const g: Handsontable | string;',
        'declare const h: Other;',
        'function fn(p: Core, q: string) { p.probe(); q.probe(); }',
        'a.probe(); b.probe(); c.probe(); d.probe(); e.probe(); f.probe(); g.probe(); h.probe();',
      ].join('\n'), parser);

      assert.deepEqual(answers, [true, false, true, true, true, true, true, false, false, false]);
    });

    it(`tracks annotated class properties, parameter properties, and typed ref holders (${parser})`, () => {
      const answers = probes([
        'import Handsontable from \'handsontable\';',
        'import { useRef } from \'react\';',
        'class A {',
        '  hot: Handsontable.Core;',
        '  holder = createRef<Handsontable>();',
        '  constructor(private readonly injected: Handsontable) {}',
        '  run() { this.hot.probe(); this.injected.probe(); this.holder.current.probe(); this.hot2.probe(); }',
        '}',
        'const ref = useRef<Handsontable | null>(null);',
        'const plain = useRef<string>(null);',
        'ref.current.probe(); ref.current?.probe(); plain.current.probe();',
      ].join('\n'), parser);

      assert.deepEqual(answers, [true, true, true, false, true, true, false]);
    });

    it(`ignores type assertions around the expression (${parser})`, () => {
      const answers = probes([
        'import Handsontable from \'handsontable\';',
        'const hot = new Handsontable(el, {}) as unknown as Handsontable;',
        '(hot as any).probe();',
        'hot!.probe();',
      ].join('\n'), parser);

      assert.deepEqual(answers, [true, true]);
    });
  }
});

describe('resolveNamespaceMember', () => {
  /**
   * Resolve the member chain of every `target.<...>` expression statement.
   *
   * @param {string} source Source text.
   * @param {string} [parser] Parser name.
   * @returns {Array<string|null>} Results in source order, one per `use(...)` argument.
   */
  function members(source, parser = 'tsx') {
    const { j, root, bindings } = bind(source, parser);

    return root.find(j.CallExpression, { callee: { name: 'use' } }).paths()
      .map(path => bindings.resolveNamespaceMember(path.get('arguments', 0)));
  }

  for (const parser of ALL_PARSERS) {
    it(`returns the dotted path under the namespace (${parser})`, () => {
      const results = members([
        'import Handsontable from \'handsontable\';',
        'use(Handsontable.helper.sanitize);',
        'use(Handsontable[\'helper\'].sanitize);',
        'use(Handsontable.helper);',
        'use(Handsontable);',
        'use(Handsontable[name].x);',
        'use(Other.helper.sanitize);',
        'function f(Handsontable) { use(Handsontable.helper.sanitize); }',
      ].join('\n'), parser);

      assert.deepEqual(results, ['helper.sanitize', 'helper.sanitize', 'helper', null, null, null, null]);
    });
  }

  for (const parser of TS_PARSERS) {
    it(`resolves qualified type names and typeof (${parser})`, () => {
      const { j, root, bindings } = bind([
        'import Handsontable from \'handsontable\';',
        'let a: Handsontable.CellMeta;',
        'let b: Handsontable.plugins.ColumnSorting.Settings;',
        'let c: typeof Handsontable.helper;',
        'let d: Other.CellMeta;',
      ].join('\n'), parser);
      const results = root.find(j.TSQualifiedName)
        .filter(path => path.parent.node.type !== 'TSQualifiedName')
        .paths()
        .map(path => bindings.resolveNamespaceMember(path));

      assert.deepEqual(results, ['CellMeta', 'plugins.ColumnSorting.Settings', 'helper', null]);
    });

    it(`resolves type names to Handsontable types (${parser})`, () => {
      const { j, root, bindings } = bind([
        'import Handsontable from \'handsontable\';',
        'import type { GridSettings, CellProperties as Cell } from \'handsontable/settings\';',
        'import type { Thing } from \'elsewhere\';',
        'let a: GridSettings; let b: Cell; let c: Handsontable.ColumnSettings; let d: Thing; let e: Local;',
      ].join('\n'), parser);
      const results = root.find(j.TSTypeReference).paths()
        .map(path => bindings.resolveTypeName(path.get('typeName')));

      assert.deepEqual(results, ['GridSettings', 'CellProperties', 'ColumnSettings', null, null]);
    });
  }

  it('resolves the require namespace and a namespace import', () => {
    const results = members('const H = require(\'handsontable\');\nuse(H.helper.x);\n', 'babylon');

    assert.deepEqual(results, ['helper.x']);
    assert.deepEqual(members('import * as H from \'handsontable\';\nuse(H.helper.x);\n'), ['helper.x']);
  });
});

describe('isPluginReceiver', () => {
  /**
   * Check, for every `<receiver>.probe()` call in the source, whether the receiver is a plugin of the given keys.
   *
   * @param {string} source Source text with `x.probe()` calls.
   * @param {string[]} keys Plugin keys.
   * @returns {boolean[]} One answer per call, in source order.
   */
  function pluginProbes(source, keys) {
    const { j, root, bindings } = bind(source);

    return root.find(j.CallExpression)
      .filter(path => path.node.callee.property?.name === 'probe')
      .paths()
      .map(path => bindings.isPluginReceiver(path.get('callee', 'object'), keys));
  }

  const KEYS = ['manualColumnResize', 'manualRowResize'];

  it('accepts a direct getPlugin call with a listed key on any object, optional chaining included', () => {
    assert.deepEqual(pluginProbes([
      'hot.getPlugin(\'manualColumnResize\').probe();',
      'this.hot.getPlugin("manualRowResize").probe();',
      'hot?.getPlugin(\'manualColumnResize\')?.probe();',
      'hot.getPlugin(\'manualColumnResize\')!.probe();',
      'hot.getPlugin(\'filters\').probe();',
      'hot.getPlugin(key).probe();',
      'hot.getOther(\'manualColumnResize\').probe();',
    ].join('\n'), KEYS), [true, true, true, true, false, false, false]);
  });

  it('follows a variable, an assignment, and a this member for one hop', () => {
    assert.deepEqual(pluginProbes([
      'const a = hot.getPlugin(\'manualColumnResize\');',
      'let b;',
      'b = hot.getPlugin(\'manualRowResize\');',
      'const c = other();',
      'class K {',
      '  go() { this.p = hot.getPlugin(\'manualColumnResize\'); this.p.probe(); this.q.probe(); }',
      '}',
      'a.probe();',
      'b.probe();',
      'c.probe();',
      'const d = hot.getPlugin(\'filters\');',
      'd.probe();',
    ].join('\n'), KEYS), [true, false, true, true, false, false]);
  });

  it('does not follow a shadowed name', () => {
    assert.deepEqual(pluginProbes([
      'const a = hot.getPlugin(\'manualColumnResize\');',
      'function f(a) { a.probe(); }',
    ].join('\n'), KEYS), [false]);
  });
});

describe('queries do not edit the tree', () => {
  it('leaves the printed source untouched', () => {
    const source = 'import   Handsontable from \'handsontable\';\nconst hot = new  Handsontable(el, {  a: 1 });\n';
    const { root, bindings } = bind(source);

    assert.deepEqual(bindings.namespace, ['Handsontable']);
    assert.equal(print(root), source);
  });
});
