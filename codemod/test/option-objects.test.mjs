import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { collectHotBindings } from '../src/lib/hot-bindings.mjs';
import {
  GENERIC_OPTIONS,
  KNOWN_OPTIONS,
  findJsxOptionAttributes,
  findOptionObjects,
  getNestedProperty,
  getProperty,
  getProperties,
  hasSpread,
} from '../src/lib/option-objects.mjs';
import { skipWithoutFile } from './helpers/guide-source.mjs';
import { parse, print } from './helpers/parse.mjs';

const TS_PARSERS = ['ts', 'tsx'];
const ALL_PARSERS = ['babylon', 'ts', 'tsx'];
const IMPORT = 'import Handsontable from \'handsontable\';\n';

/**
 * Find the option objects of a source text and describe each by confidence, role, origin, and own keys.
 *
 * @param {string} source Source text.
 * @param {string} [parser] Parser name.
 * @returns {string[]} One `confidence role origin [keys]` line per object.
 */
function describeObjects(source, parser = 'tsx') {
  const { j, root } = parse(source, parser);
  const bindings = collectHotBindings(j, root);

  return findOptionObjects(j, root, bindings).map(({ path, confidence, role, origin }) => {
    const keys = path.node.properties.map(node => node.key?.name ?? node.key?.value ?? '...');

    return `${confidence} ${role} ${origin} [${keys.join(',')}]`;
  });
}

describe('known-options.json', () => {
  it('is sorted without duplicates and holds the removed 17.x options', () => {
    const names = [...KNOWN_OPTIONS];

    assert.equal(names.length, new Set(names).size);

    for (const removed of ['correctFormat', 'datePickerConfig', 'persistentState']) {
      assert.ok(KNOWN_OPTIONS.has(removed), `${removed} must stay known`);
    }

    assert.ok([...GENERIC_OPTIONS].every(name => KNOWN_OPTIONS.has(name)), 'every generic name is a known option');
  });

  it('has every option that metaSchema.ts declares', (context) => {
    const schemaPath = fileURLToPath(new URL('../../handsontable/src/dataMap/metaManager/metaSchema.ts',
      import.meta.url));

    if (skipWithoutFile(context, schemaPath, 'metaSchema.ts')) {
      return;
    }

    const lines = readFileSync(schemaPath, 'utf8').split('\n');
    const start = lines.findIndex(line => line.startsWith('export default '));
    const declared = [];
    let inComment = false;

    for (const line of lines.slice(start + 1)) {
      if (/^\s*\/\*/.test(line)) {
        inComment = true;
      }

      if (inComment) {
        inComment = !line.includes('*/');
      } else {
        const match = line.match(/^ {4}([A-Za-z$][\w$]*)\s*[:(]/);

        if (match) {
          declared.push(match[1]);
        }
      }
    }

    assert.ok(declared.length > 100, 'the schema scan found the option list');

    const missing = declared.filter(name => !KNOWN_OPTIONS.has(name));

    assert.deepEqual(missing, [],
      `src/lib/known-options.json lacks options that metaSchema.ts declares: ${missing.join(', ')}. `
      + 'Add them to the JSON, keeping it sorted.');
  });
});

describe('object property helpers', () => {
  it('finds plain, string-literal, and method keys, last one wins, ignores computed keys and spreads', () => {
    const { j, root } = parse('const o = { a: 1, \'b\': 2, c() {}, [d]: 3, ...rest, a: 4 };\n');
    const [object] = root.find(j.ObjectExpression).paths();

    assert.equal(getProperty(object, 'a').node.value.value, 4);
    assert.equal(getProperty(object, 'b').node.value.value, 2);
    assert.equal(getProperty(object, 'c').node.type, 'ObjectMethod');
    assert.equal(getProperty(object, 'd'), null);
    assert.equal(getProperty(object, 'rest'), null);
    assert.equal(hasSpread(object), true);
    assert.deepEqual(getProperties(object).map(item => item.name), ['a', 'b', 'c', 'a']);
  });

  it('reports no spread for a plain object', () => {
    const { j, root } = parse('const o = { a: 1 };\n');

    assert.equal(hasSpread(root.find(j.ObjectExpression).paths()[0]), false);
  });

  it('walks dotted paths through nested object literals', () => {
    const { j, root } = parse('const o = { numericFormat: { culture: \'de-DE\', nested: 1 }, flat: 2 };\n');
    const [object] = root.find(j.ObjectExpression).paths();

    assert.equal(getNestedProperty(object, 'numericFormat.culture').node.value.value, 'de-DE');
    assert.equal(getNestedProperty(object, 'numericFormat').node.key.name, 'numericFormat');
    assert.equal(getNestedProperty(object, 'numericFormat.missing'), null);
    assert.equal(getNestedProperty(object, 'flat.culture'), null);
    assert.equal(getNestedProperty(object, 'nothing.culture'), null);
  });

  it('sees through a type assertion on a nested object', () => {
    const { j, root } = parse('const o = { numericFormat: { culture: \'x\' } as Format };\n', 'ts');
    const [object] = root.find(j.ObjectExpression).paths();

    assert.equal(getNestedProperty(object, 'numericFormat.culture').node.key.name, 'culture');
  });
});

describe('findOptionObjects: high confidence seeds', () => {
  for (const parser of ALL_PARSERS) {
    it(`finds new <namespace>(el, {...}) and updateSettings on a confirmed instance (${parser})`, () => {
      const found = describeObjects(`${IMPORT}`
        + 'const hot = new Handsontable(el, { colHeaders: true });\n'
        + 'hot.updateSettings({ rowHeaders: true });\n'
        + 'unrelated.deep.chain.updateSettings({ x: 1 });\n'
        + 'ref.current?.hotInstance?.updateSettings({ y: 1 });\n'
        + 'new Handsontable({ not: 1 }, { second: 1 });\n'
        + 'new Other(el, { notHot: 1 });\n', parser);

      assert.deepEqual(found, [
        'high grid new [colHeaders]',
        'high grid new [second]',
        'high grid updateSettings [rowHeaders]',
        'medium grid updateSettings [x]',
        'high grid updateSettings [y]',
      ]);
    });

    it(`resolves one identifier hop to a const or let literal (${parser})`, () => {
      const found = describeObjects(`${IMPORT}`
        + 'const a = { colHeaders: true };\n'
        + 'let b = { rowHeaders: true };\n'
        + 'const chained = a;\n'
        + 'const hot = new Handsontable(el, a);\n'
        + 'hot.updateSettings(b);\n'
        + 'hot.updateSettings(chained);\n'
        + 'function f(param) { hot.updateSettings(param); }\n'
        + 'function g() { const a = { shadow: 1 }; hot.updateSettings(a); }\n', parser);

      assert.deepEqual(found, [
        'high grid new:identifier [colHeaders]',
        'high grid updateSettings:identifier [rowHeaders]',
        'high grid updateSettings:identifier [shadow]',
      ]);
    });

    it(`finds columns, cell, cells, and columns() below a high object (${parser})`, () => {
      const found = describeObjects(`${IMPORT}`
        + 'const colB = { data: \'b\' };\n'
        + 'const list = [{ data: \'c\' }];\n'
        + 'const hot = new Handsontable(el, {\n'
        + '  columns: [{ type: \'text\' }, colB, ...others],\n'
        + '  cell: [{ row: 0, col: 0, readOnly: true }],\n'
        + '  cells(row, col) { if (row) { return { className: \'x\' }; } return { readOnly: true }; },\n'
        + '});\n'
        + 'hot.updateSettings({ columns: list });\n'
        + 'hot.updateSettings({ columns(index) { return { data: index }; } });\n'
        + 'hot.updateSettings({ cells: (row) => ({ comment: row }) });\n', parser);

      assert.deepEqual(found, [
        'high grid new [columns,cell,cells]',
        'high column columns [type]',
        'high column columns:identifier [data]',
        'high cell cell [row,col,readOnly]',
        'high cell cells() [className]',
        'high cell cells() [readOnly]',
        'high grid updateSettings [columns]',
        'high column columns [data]',
        'high grid updateSettings [columns]',
        'high column columns() [data]',
        'high grid updateSettings [cells]',
        'high cell cells() [comment]',
      ]);
    });

    it(`resolves spread sources and skips plain option values (${parser})`, () => {
      const found = describeObjects(`${IMPORT}`
        + 'const base = { colHeaders: true };\n'
        + 'new Handsontable(el, { ...base, ...{ rowHeaders: true },\n'
        + '  numericFormat: { pattern: \'0\', culture: \'x\' },\n'
        + '  afterChange() { const local = { readOnly: true, className: \'y\', colHeaders: 1 }; } });\n', parser);

      assert.deepEqual(found, [
        'high grid new [...,...,numericFormat,afterChange]',
        'high grid spread:identifier [colHeaders]',
        'high grid spread [rowHeaders]',
      ]);
    });
  }

  it('finds settings on HotTable and HotColumn, through a variable, and through useMemo', () => {
    const found = describeObjects([
      'import { HotTable, HotColumn } from \'@handsontable/react-wrapper\';',
      'const fixed = { colHeaders: true };',
      'const App = () => {',
      '  const memo = useMemo(() => ({ rowHeaders: true }), []);',
      '  return (<>',
      '    <HotTable settings={{ licenseKey: \'x\' }}><HotColumn settings={{ type: \'text\' }} /></HotTable>',
      '    <HotTable settings={fixed} />',
      '    <HotTable settings={memo} />',
      '    <Other settings={{ licenseKey: \'no\' }} />',
      '  </>);',
      '};',
    ].join('\n'), 'babylon');

    assert.deepEqual(found, [
      'high grid jsx-settings [licenseKey]',
      'high column jsx-settings [type]',
      'high grid jsx-settings:identifier [colHeaders]',
      'high grid jsx-settings:identifier [rowHeaders]',
    ]);
  });

  it('finds the objects of the columns, cell, and cells props of a wrapper component', () => {
    const found = describeObjects([
      'import { HotTable, HotColumn } from \'@handsontable/react-wrapper\';',
      'const columnDefs = [{ data: \'a\' }, { data: \'b\' }];',
      'const cellDefs = [{ row: 0, col: 0, readOnly: true }];',
      'const App = () => {',
      '  const memoColumns = useMemo(() => [{ data: \'m\' }], []);',
      '  const twoReturns = useMemo(() => { if (x) { return [{ data: \'n\' }]; } return [{ data: \'o\' }]; }, []);',
      '  return (<>',
      '    <HotTable columns={[{ data: \'x\', type: \'numeric\' }, extra, ...spread]} />',
      '    <HotTable columns={columnDefs} cell={cellDefs} />',
      '    <HotTable columns={memoColumns} />',
      '    <HotTable columns={twoReturns} />',
      '    <HotTable columns={(index) => ({ data: index })} cells={(row) => ({ className: row })} />',
      '    <HotTable cell={[{ row: 1, col: 1, comment: \'c\' }]} />',
      '    <HotTable nestedHeaders={[[{ label: \'a\', colspan: 2 }, \'b\']]}',
      '      columnSummary={[{ sourceColumn: 0, type: \'sum\' }]} />',
      '    <Other columns={[{ data: \'no\' }]} cells={() => ({ data: \'no\' })} />',
      '  </>);',
      '};',
    ].join('\n'), 'tsx');

    assert.deepEqual(found, [
      'high column columns [data,type]',
      'high column columns [data]',
      'high column columns [data]',
      'high cell cell [row,col,readOnly]',
      'high column columns [data]',
      'high column columns() [data]',
      'high cell cells() [className]',
      'high cell cell [row,col,comment]',
    ]);
  });

  describe('a cells function passed by reference', () => {
    it('resolves a same-file arrow, function expression, declaration, and useCallback behind one name', () => {
      const found = describeObjects([
        'import { HotTable } from \'@handsontable/react-wrapper\';',
        'const arrowCells = () => ({ a: 1 });',
        'const expressionCells = function() { return { b: 1 }; };',
        'function declaredCells() { return { c: 1 }; }',
        'const App = () => {',
        '  const memoCells = useCallback(() => ({ d: 1 }), []);',
        '  const reactCells = React.useCallback(function() { return { e: 1 }; }, []);',
        '  return (<>',
        '    <HotTable cells={arrowCells} />',
        '    <HotTable cells={expressionCells} />',
        '    <HotTable cells={declaredCells} />',
        '    <HotTable cells={memoCells} />',
        '    <HotTable cells={reactCells} />',
        '    <HotTable cells={useCallback(() => ({ f: 1 }), [])} />',
        '  </>);',
        '};',
      ].join('\n'), 'tsx');

      assert.deepEqual(found, [
        'high cell cells():identifier [a]',
        'high cell cells():identifier [b]',
        'high cell cells():identifier [c]',
        'high cell cells():identifier [d]',
        'high cell cells():identifier [e]',
        'high cell cells() [f]',
      ]);
    });

    it('resolves the cells key of a settings object the same way', () => {
      const found = describeObjects(`${IMPORT}`
        + 'const fmtCells = () => ({ numericFormat: { culture: \'de-DE\' } });\n'
        + 'function dateCells() { return { dateFormat: \'DD/MM/YYYY\' }; }\n'
        + 'const hot = new Handsontable(el, { cells: fmtCells });\n'
        + 'hot.updateSettings({ cells: dateCells });\n', 'babylon');

      assert.deepEqual(found, [
        'high grid new [cells]',
        'high cell cells():identifier [numericFormat]',
        'high grid updateSettings [cells]',
        'high cell cells():identifier [dateFormat]',
      ]);
    });

    it('sees both branches of a returned conditional', () => {
      const found = describeObjects(`${IMPORT}`
        + 'const priceCells = (row, col) => (col === 1 ? { numericFormat: {} } : { readOnly: true });\n'
        + 'new Handsontable(el, { cells: priceCells });\n', 'babylon');

      assert.deepEqual(found, [
        'high grid new [cells]',
        'high cell cells():identifier [numericFormat]',
        'high cell cells():identifier [readOnly]',
      ]);
    });

    it('resolves a name that may hold another function as a guess, and skips what it cannot see', () => {
      const found = describeObjects([
        'import { HotTable } from \'@handsontable/react-wrapper\';',
        'import { importedCells } from \'./cells\';',
        'let reassigned = () => ({ a: 1 });',
        'reassigned = other;',
        'function replaced() { return { b: 1 }; }',
        'replaced = other;',
        'const { destructured } = holder;',
        'const notAFunction = { e: 1 };',
        'function shadowed(cells) {',
        '  return <HotTable cells={cells} />;',
        '}',
        'const unused = () => ({ correctFormat: true });',
        'export const App = (props) => (<>',
        '  <HotTable cells={importedCells} />',
        '  <HotTable cells={reassigned} />',
        '  <HotTable cells={replaced} />',
        '  <HotTable cells={destructured} />',
        '  <HotTable cells={notAFunction} />',
        '  <HotTable cells={props.cells} />',
        '</>);',
      ].join('\n'), 'tsx');

      assert.deepEqual(found, [
        'medium cell cells():identifier [a]',
        'medium cell cells():identifier [b]',
      ]);
    });
  });

  for (const parser of TS_PARSERS) {
    it(`finds annotation, as, satisfies, return type, and generic-call forms (${parser})`, () => {
      const found = describeObjects([
        'import Handsontable from \'handsontable\';',
        'import type { GridSettings, ColumnSettings, CellMeta } from \'handsontable/settings\';',
        'const a: GridSettings = { aa: 1 };',
        'const b: Handsontable.GridSettings = { bb: 1 };',
        'const c = { cc: 1 } satisfies GridSettings;',
        'const d = { dd: 1 } as ColumnSettings;',
        'const e: Partial<GridSettings> = { ee: 1 };',
        'const f: CellMeta | undefined = { ff: 1 };',
        'function make(): GridSettings { return { gg: 1 }; }',
        'const make2 = (): ColumnSettings => ({ hh: 1 });',
        'const [state] = useState<GridSettings>({ ii: 1 });',
        'class K { settings: GridSettings = { jj: 1 }; }',
      ].join('\n'), parser);

      assert.deepEqual(found, [
        'high grid annotation [aa]',
        'high grid annotation [bb]',
        'high grid annotation [ee]',
        'high cell annotation [ff]',
        'high grid annotation [jj]',
        'high grid annotation [cc]',
        'high column annotation [dd]',
        'high grid annotation [gg]',
        'high column annotation [hh]',
        'high grid annotation [ii]',
      ]);
    });

    it(`ignores same-named types that Handsontable does not own (${parser})`, () => {
      const found = describeObjects([
        'import type { GridSettings } from \'other-grid\';',
        'import Handsontable from \'handsontable\';',
        'type CellMeta = { mine: 1 };',
        'const a: GridSettings = { aa: 1 };',
        'const b: CellMeta = { bb: 1 };',
        'const c: Handsontable.Unknown = { cc: 1 };',
      ].join('\n'), parser);

      assert.deepEqual(found, []);
    });
  }
});

describe('findOptionObjects: medium confidence', () => {
  for (const parser of ALL_PARSERS) {
    it(`needs two known keys with a distinctive one, in a Handsontable file (${parser})`, () => {
      const found = describeObjects(`${IMPORT}`
        + 'const one = { colHeaders: true, other: 1 };\n'
        + 'const generic = { width: 1, height: 2, title: \'t\' };\n'
        + 'const two = { colHeaders: true, rowHeaders: true };\n'
        + 'const mixed = { data: [], colHeaders: true };\n'
        + 'const state = ref({ licenseKey: \'x\', stretchH: \'all\' });\n', parser);

      assert.deepEqual(found, [
        'medium grid heuristic [colHeaders,rowHeaders]',
        'medium grid heuristic [data,colHeaders]',
        'medium grid heuristic [licenseKey,stretchH]',
      ]);
    });
  }

  it('covers Angular class properties without an annotation, with nested children', () => {
    const found = describeObjects([
      'import { Component } from \'@angular/core\';',
      'import { GridSettings } from \'@handsontable/angular-wrapper\';',
      '@Component({ selector: \'app\', template: \'\' })',
      'export class AppComponent {',
      '  readonly settings = { colHeaders: true, rowHeaders: true,',
      '    columns: [{ type: \'text\' }, { readOnly: true }], cells() { return { className: \'x\' }; } };',
      '  readonly other = { selector: 1 };',
      '}',
    ].join('\n'), 'ts');

    assert.deepEqual(found, [
      'medium grid heuristic [colHeaders,rowHeaders,columns,cells]',
      'medium column columns [type]',
      'medium column columns [readOnly]',
      'medium cell cells() [className]',
    ]);
  });

  it('does not run in a file without Handsontable', () => {
    const source = 'export const settings = { colHeaders: true, rowHeaders: true };\n';

    assert.deepEqual(describeObjects(source, 'ts'), []);
  });

  it('reports each object once at its highest confidence', () => {
    const found = describeObjects(`${IMPORT}new Handsontable(el, { colHeaders: true, rowHeaders: true });\n`);

    assert.deepEqual(found, ['high grid new [colHeaders,rowHeaders]']);
  });

  it('does not match objects nested in the option values of a found object', () => {
    const found = describeObjects(`${IMPORT}`
      + 'new Handsontable(el, { contextMenu: { items: { a: 1 }, colHeaders: 1, rowHeaders: 2 } });\n');

    assert.deepEqual(found, ['high grid new [contextMenu]']);
  });
});

describe('findJsxOptionAttributes', () => {
  /**
   * List the JSX option attributes of a source as `role name[:spread]` strings.
   *
   * @param {string} source Source text.
   * @returns {string[]} The entries.
   */
  function attributes(source) {
    const { j, root } = parse(source, 'babylon');
    const bindings = collectHotBindings(j, root);

    return findJsxOptionAttributes(j, root, bindings)
      .map(item => `${item.elementRole} ${item.name}${item.viaSpread ? ':spread' : ''}`);
  }

  it('lists attributes of HotTable and HotColumn, skipping settings, ref, and key', () => {
    const found = attributes([
      'import { HotTable, HotColumn } from \'@handsontable/react-wrapper\';',
      'const a = (<HotTable data={rows} colHeaders ref={r} key="k" settings={{ x: 1 }}',
      '  licenseKey="x" afterChange={cb}>',
      '  <HotColumn data="a" readOnly />',
      '  <Other data={1} />',
      '</HotTable>);',
    ].join('\n'));

    assert.deepEqual(found, [
      'grid data',
      'grid colHeaders',
      'grid licenseKey',
      'grid afterChange',
      'column data',
      'column readOnly',
    ]);
  });

  it('resolves a spread one hop to its properties', () => {
    const found = attributes([
      'import { HotTable } from \'@handsontable/react-wrapper\';',
      'const base = { colHeaders: true, rowHeaders: true };',
      'const a = <HotTable {...base} {...unknown} licenseKey="x" />;',
    ].join('\n'));

    assert.deepEqual(found, ['grid colHeaders:spread', 'grid rowHeaders:spread', 'grid licenseKey']);
  });

  it('gives attribute paths and value paths, and null for a bare boolean attribute', () => {
    const { j, root } = parse([
      'import { HotTable } from \'@handsontable/react\';',
      'const a = <HotTable colHeaders x="s" y={1} />;',
    ].join('\n'), 'babylon');
    const entries = findJsxOptionAttributes(j, root, collectHotBindings(j, root));

    assert.deepEqual(entries.map(item => item.valuePath?.node.type ?? null), [null, 'StringLiteral', 'NumericLiteral']);
    assert.deepEqual(entries.map(item => item.attributePath.node.type), new Array(3).fill('JSXAttribute'));
  });
});

describe('finders do not edit the tree', () => {
  it('leaves the printed source byte-identical', () => {
    const source = `${IMPORT}const s  =  { colHeaders: true,  columns: [ { data: 'a' } ] };\n`
      + 'new Handsontable(el,   s);\n';
    const { j, root } = parse(source);
    const bindings = collectHotBindings(j, root);

    findOptionObjects(j, root, bindings);
    findJsxOptionAttributes(j, root, bindings);

    assert.equal(print(root), source);
  });
});

describe('findOptionObjects: the receiver of updateSettings', () => {
  const REACT = 'import { HotTable } from \'@handsontable/react-wrapper\';\n';
  const SHAPES = [
    ['a confirmed instance', `${IMPORT}const hot = new Handsontable(el);\nhot.updateSettings({ a: 1 });\n`, 'high'],
    ['a React hotInstance chain', `${REACT}ref.current?.hotInstance?.updateSettings({ a: 1 });\n`, 'high'],
    ['a name set from hotInstance', `${REACT}const grid = ref.current.hotInstance;\ngrid.updateSettings({ a: 1 });\n`,
      'high'],
    ['a class member set from new', `${IMPORT}class A { init() { this.hot = new Handsontable(el); }\n`
      + '  go() { this.hot.updateSettings({ a: 1 }); } }\n', 'high'],
    ['a parameter', `${IMPORT}function f(grid) { grid.updateSettings({ a: 1 }); }\n`, 'medium'],
    ['a global', `${IMPORT}hot.updateSettings({ a: 1 });\n`, 'medium'],
    ['the result of a call', `${IMPORT}registry.getInstance(id).updateSettings({ a: 1 });\n`, 'medium'],
    ['a class member the class does not set', `${IMPORT}class A { go() { this.hot.updateSettings({ a: 1 }); } }\n`,
      'medium'],
    ['a class member set from a call', `${IMPORT}class A { init() { this.hot = registry.get(); }\n`
      + '  go() { this.hot.updateSettings({ a: 1 }); } }\n', 'medium'],
    ['a name set once from new and once from a call', `${IMPORT}let hot = new Handsontable(el);\n`
      + 'hot = registry.get();\nhot.updateSettings({ a: 1 });\n', 'medium'],
    ['a local object', `${IMPORT}const store = { updateSettings() {} };\nstore.updateSettings({ a: 1 });\n`, null],
    ['an instance of another class', `${IMPORT}const form = new Form();\nform.updateSettings({ a: 1 });\n`, null],
    ['an import', `${IMPORT}import form from './form';\nform.updateSettings({ a: 1 });\n`, null],
    ['a class member that holds an object', `${IMPORT}class A { store = { updateSettings() {} };\n`
      + '  go() { this.store.updateSettings({ a: 1 }); } }\n', null],
    ['this', `${IMPORT}class A { go() { this.updateSettings({ a: 1 }); } }\n`, null],
    ['super', `${IMPORT}class A extends B { go() { super.updateSettings({ a: 1 }); } }\n`, null],
    ['a plugin looked up by key', `${IMPORT}hot.getPlugin('filters').updateSettings({ a: 1 });\n`, null],
    ['a name set from a plugin',
      `${IMPORT}const plugin = hot.getPlugin('filters');\nplugin.updateSettings({ a: 1 });\n`, null],
  ];

  for (const [name, source, expected] of SHAPES) {
    it(`gives ${expected ?? 'no'} confidence for ${name}`, () => {
      const found = describeObjects(source, 'tsx').filter(line => line.endsWith('[a]'));

      assert.deepEqual(found, expected ? [`${expected} grid updateSettings [a]`] : []);
    });
  }

  it('never lets the key heuristic take the argument of a receiver the file shows to be something else', () => {
    const settings = '{ correctFormat: true, colHeaders: true, rowHeaders: true }';

    for (const receiver of ['store', 'hot.getPlugin(\'filters\')']) {
      const found = describeObjects(`${IMPORT}const store = { updateSettings() {} };\n`
        + `${receiver}.updateSettings(${settings});\n`);

      assert.deepEqual(found, [], receiver);
    }

    // An unresolved receiver keeps the object as a medium grid object, with no heuristic duplicate.
    assert.deepEqual(describeObjects(`${IMPORT}other.updateSettings(${settings});\n`),
      ['medium grid updateSettings [correctFormat,colHeaders,rowHeaders]']);
  });

  it('does not make a medium object of a call in a file that never names Handsontable', () => {
    assert.deepEqual(describeObjects('function f(grid) { grid.updateSettings({ a: 1 }); }\n'), []);
  });

  it('follows an identifier argument to the object the receiver check applies to', () => {
    const found = describeObjects(`${IMPORT}const opts = { a: 1 };\nconst store = {};\n`
      + 'store.updateSettings(opts);\nfn(grid).updateSettings(opts);\n');

    assert.deepEqual(found, ['medium grid updateSettings:identifier [a]']);
  });
});

describe('findOptionObjects: the highest confidence wins', () => {
  it('upgrades an object a later pass annotates, and what hangs below it', () => {
    const source = `${IMPORT}const opts: Handsontable.GridSettings = { columns: [{ data: 'a' }] };\n`
      + 'other.updateSettings(opts);\n';

    assert.deepEqual(describeObjects(source, 'ts'), [
      'high grid annotation [columns]',
      'high column columns [data]',
    ]);
  });

  it('upgrades an object reached through a mutable cells function, then annotated', () => {
    const source = `${IMPORT}let make = (row) => ({ readOnly: true });\n`
      + 'const cellOptions: Handsontable.CellProperties = { readOnly: false };\n'
      + 'let pick = () => cellOptions;\n'
      + 'new Handsontable(el, { cells: pick });\n'
      + 'new Handsontable(el, { cells: make });\n';

    assert.deepEqual(describeObjects(source, 'ts'), [
      'high grid new [cells]',
      'high cell annotation [readOnly]',
      'high grid new [cells]',
      'medium cell cells():identifier [readOnly]',
    ]);
  });

  it('keeps the first discovery when two passes tie', () => {
    const source = `${IMPORT}const opts: Handsontable.ColumnSettings = { data: 'a' };\n`
      + 'const hot = new Handsontable(el, opts);\n';

    assert.deepEqual(describeObjects(source, 'ts'), ['high grid new:identifier [data]']);
  });

  it('does not lower an object a later pass reaches with less confidence', () => {
    const source = `${IMPORT}const opts = { data: 'a' };\nconst hot = new Handsontable(el, opts);\n`
      + 'other.updateSettings(opts);\n';

    assert.deepEqual(describeObjects(source, 'ts'), ['high grid new:identifier [data]']);
  });
});
