import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { collectTypePointers, findMissingTypePointers } from '../utils/typePointers.mjs';

const present = () => true;
const absent = () => false;

describe('collectTypePointers', () => {
  it('collects the top-level `types` and `typings` fields', () => {
    assert.deepEqual(
      collectTypePointers({ types: './index.d.ts' }),
      [{ field: 'pkg.types', target: './index.d.ts' }]
    );
    // The Angular wrapper's generated manifest uses `typings`, not `types`.
    assert.deepEqual(
      collectTypePointers({ typings: 'index.d.ts' }),
      [{ field: 'pkg.typings', target: 'index.d.ts' }]
    );
  });

  it('collects a `types` condition nested in `exports`', () => {
    assert.deepEqual(
      collectTypePointers({
        exports: {
          '.': { types: './index.d.ts', import: './es/x.mjs', require: './commonjs/x.js' },
        },
      }),
      [{ field: 'pkg.exports["."].types', target: './index.d.ts' }]
    );
  });

  it('recurses through nested conditions and fallback arrays', () => {
    const pointers = collectTypePointers({
      exports: {
        '.': {
          import: { types: './index.d.mts', default: './es/x.mjs' },
          require: [{ types: './index.d.cts' }, './commonjs/x.js'],
        },
      },
    });

    assert.deepEqual(pointers.map(p => p.target), ['./index.d.mts', './index.d.cts']);
    assert.deepEqual(
      pointers.map(p => p.field),
      ['pkg.exports["."].import.types', 'pkg.exports["."].require[0].types']
    );
  });

  it('ignores subpaths that declare no types, and blocked (null) subpaths', () => {
    assert.deepEqual(
      collectTypePointers({
        exports: {
          './dist/x.js': './dist/x.js',
          './internal': null,
          './package.json': { default: './package.json' },
        },
      }),
      []
    );
  });

  it('ignores a types value that names nothing rather than reporting a bogus target', () => {
    assert.deepEqual(collectTypePointers({ types: 42, exports: { '.': { types: null } } }), []);
  });

  it('collects every leaf of a `types` condition that is itself split by condition', () => {
    // The shape publint recommends for the dual-package masquerade. Returning early on a
    // non-string here would silently skip both pointers.
    const pointers = collectTypePointers({
      exports: {
        '.': { types: { import: './index.d.mts', require: './index.d.cts' } },
      },
    });

    assert.deepEqual(pointers, [
      { field: 'pkg.exports["."].types.import', target: './index.d.mts' },
      { field: 'pkg.exports["."].types.require', target: './index.d.cts' },
    ]);
  });

  it('collects every leaf of a `types` condition given as a fallback array', () => {
    assert.deepEqual(
      collectTypePointers({ exports: { '.': { types: ['./a.d.ts', './b.d.ts'] } } }),
      [
        { field: 'pkg.exports["."].types[0]', target: './a.d.ts' },
        { field: 'pkg.exports["."].types[1]', target: './b.d.ts' },
      ]
    );
  });

  it('returns nothing for a manifest that declares no types at all', () => {
    // The Angular wrapper's SOURCE manifest is this shape — ng-packagr injects the
    // pointers into the generated one, so the source manifest must not be flagged.
    assert.deepEqual(collectTypePointers({ name: '@handsontable/angular-wrapper' }), []);
    assert.deepEqual(collectTypePointers({}), []);
    assert.deepEqual(collectTypePointers(undefined), []);
  });
});

describe('findMissingTypePointers', () => {
  it('reports nothing when every pointer resolves', () => {
    const packageJson = {
      types: './index.d.ts',
      exports: { '.': { types: './index.d.ts' } },
    };

    assert.deepEqual(findMissingTypePointers(packageJson, present), []);
  });

  it('reports every broken pointer — the DEV-2732 state', () => {
    // `@handsontable/vue3@18.1.0` exactly: both pointers named a file the tarball
    // did not contain.
    const packageJson = {
      types: './index.d.ts',
      main: './commonjs/vue-handsontable.js',
      exports: {
        '.': {
          types: './index.d.ts',
          import: './es/vue-handsontable.mjs',
          require: './commonjs/vue-handsontable.js',
        },
      },
    };

    assert.deepEqual(findMissingTypePointers(packageJson, absent), [
      { field: 'pkg.types', target: './index.d.ts' },
      { field: 'pkg.exports["."].types', target: './index.d.ts' },
    ]);
  });

  it('reports only the pointer that is broken when others resolve', () => {
    const packageJson = {
      types: './index.d.ts',
      exports: { '.': { types: './missing.d.ts' } },
    };
    const exists = target => target === './index.d.ts';

    assert.deepEqual(findMissingTypePointers(packageJson, exists), [
      { field: 'pkg.exports["."].types', target: './missing.d.ts' },
    ]);
  });

  it('passes each target to `exists` verbatim, so the caller controls resolution', () => {
    const seen = [];

    findMissingTypePointers({ types: './index.d.ts', typings: 'index.d.ts' }, (target) => {
      seen.push(target);

      return true;
    });

    assert.deepEqual(seen, ['./index.d.ts', 'index.d.ts']);
  });
});
