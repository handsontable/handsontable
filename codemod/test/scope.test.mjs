import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPlan, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';
import { lookup, referenceSpace } from '../src/lib/scope.mjs';
import { parse } from './helpers/parse.mjs';

const manifests = await loadManifests();

/**
 * The namespace each occurrence of a name has, in source order.
 *
 * @param {string} source Source text.
 * @param {string} name Identifier name.
 * @param {'babylon'|'ts'|'tsx'} [parser] Parser name.
 * @returns {Array<'value'|'type'|null>} One answer per `Identifier` of that name.
 */
function spaces(source, name, parser = 'ts') {
  const { j, root } = parse(source, parser);

  return root.find(j.Identifier, { name }).paths().map(path => referenceSpace(path));
}

describe('referenceSpace: a name that is not a reference to a binding', () => {
  it('skips the qualifier of an import type', () => {
    assert.deepEqual(spaces('type A = import(\'./mine\').Config;', 'Config'), [null]);
    assert.deepEqual(spaces('type A = import(\'./mine\').Config.Inner;', 'Config'), [null]);
    assert.deepEqual(spaces('type A = import(\'./mine\').Config.Inner;', 'Inner'), [null]);
  });

  it('skips the pattern of a parameter of a function type, a construct signature, and a call signature', () => {
    assert.deepEqual(spaces('type G = ({ Config }: any) => void;', 'Config'), [null, null]);
    assert.deepEqual(spaces('type H = (...Config: any[]) => void;', 'Config'), [null]);
    assert.deepEqual(spaces('type I = ([Config]: any) => void;', 'Config'), [null]);
    assert.deepEqual(spaces('type J = new ({ a: Config }: any) => void;', 'Config'), [null]);
    assert.deepEqual(spaces('interface K { m({ Config }: any): void }', 'Config'), [null, null]);
  });

  it('skips the key and the name of a Flow object type and function type', () => {
    assert.deepEqual(spaces('type A = { Config: number };', 'Config', 'babylon'), [null]);
    assert.deepEqual(spaces('type B = (Config: number) => void;', 'Config', 'babylon'), [null]);
  });

  it('still takes the references next to them', () => {
    assert.deepEqual(spaces('let x: Config;', 'Config'), ['type']);
    assert.deepEqual(spaces('type A = typeof Config;', 'Config'), ['value']);
    assert.deepEqual(spaces('type A = Config.Inner;', 'Config'), ['type']);
    assert.deepEqual(spaces('type A = { Config: Config };', 'Config').length, 2);
    assert.deepEqual(spaces('type A = { a: Config };', 'Config'), ['type']);
    assert.deepEqual(spaces('type A = { Config: Config };', 'Config', 'babylon').at(-1), 'value');
    assert.deepEqual(spaces('({ Config } = bag);', 'Config'), [null, 'value']);
    assert.deepEqual(spaces('const o = { Config };', 'Config'), [null, 'value']);
  });
});

describe('a rename does not touch a member name or a parameter name that spells the old name', () => {
  const IMPORT = 'import { Config } from \'handsontable/plugins/columnSorting\';\n';
  const plan = buildPlan(manifests.filter(manifest => manifest.version === '18.0.0'),
    ['18.0.0/type-columnsorting-config']);

  /**
   * Run the rename over a source text.
   *
   * @param {string} body Statements after the import.
   * @param {string} [file] File name.
   * @returns {Promise<string>} The output.
   */
  async function rename(body, file = 'a.ts') {
    const result = await transformFile({ filePath: file, source: `${IMPORT}${body}\n`, plan, options: {} });

    assert.deepEqual(result.entries.filter(entry => /error$/.test(entry.ruleId)), []);

    return result.output;
  }

  it('leaves the qualifier of an import type', async() => {
    const output = await rename('type A = import(\'./mine\').Config;\nlet x: Config;');

    assert.match(output, /type A = import\('\.\/mine'\)\.Config;/);
    assert.match(output, /let x: ColumnSortingConfig;/);
  });

  it('leaves the key of a Flow object type', async() => {
    const output = await rename('type A = { Config: Config };', 'a.js');

    assert.match(output, /type A = \{ Config: ColumnSortingConfig \};/);
  });

  it('leaves the parameters of a function type', async() => {
    const output = await rename('type G = ({ Config }: any) => void;\ntype H = (...Config: any[]) => void;\n'
      + 'let y: Config;');

    assert.match(output, /type G = \(\{ Config \}: any\) => void;/);
    assert.match(output, /type H = \(\.\.\.Config: any\[\]\) => void;/);
    assert.match(output, /let y: ColumnSortingConfig;/);
  });
});

describe('a var is hoisted out of a namespace body and a static block', () => {
  /**
   * The kind and scope node type of the binding a name resolves to at its last occurrence.
   *
   * @param {string} source Source text.
   * @param {string} name Name to resolve.
   * @returns {{kind: string, scope: string}|null} The binding.
   */
  function bindingOf(source, name) {
    const { j, root } = parse(source, 'ts');
    const path = root.find(j.Identifier, { name }).paths().at(-1);
    const binding = lookup(path, name, 'value');

    return binding ? { kind: binding.kind, scope: binding.scope.type } : null;
  }

  it('declares a var of a namespace in the namespace, not in the module', () => {
    assert.deepEqual(bindingOf('const hot = a;\nnamespace N { if (c) { var hot = b; } use(hot); }', 'hot'),
      { kind: 'var', scope: 'TSModuleBlock' });
  });

  it('declares a var of a static block in the block', () => {
    assert.deepEqual(bindingOf('const hot = a;\nclass B { static { if (c) { var hot = b; } use(hot); } }', 'hot'),
      { kind: 'var', scope: 'StaticBlock' });
  });

  it('keeps a var of a function and of the module where they were', () => {
    assert.deepEqual(bindingOf('function f() { { var hot = b; } use(hot); }', 'hot'),
      { kind: 'var', scope: 'FunctionDeclaration' });
    assert.deepEqual(bindingOf('{ var hot = b; }\nuse(hot);', 'hot'), { kind: 'var', scope: 'Program' });
  });

  it('does not hoist a let out of a static block', () => {
    assert.deepEqual(bindingOf('const hot = a;\nclass B { static { let hot = b; use(hot); } }', 'hot'),
      { kind: 'let', scope: 'StaticBlock' });
    assert.deepEqual(bindingOf('class B { static { let hot = b; } }\nuse(hot);', 'hot'), null);
  });
});
