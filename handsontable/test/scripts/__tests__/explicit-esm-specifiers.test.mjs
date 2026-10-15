/* eslint-disable max-len -- the declaration fixtures are one line per statement */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  SELF_CONTAINED_MTS_DIRS,
  ENTRY_SHIM_SUFFIX,
  listEntryShimTargets,
  toEntryShim,
  toExplicitEsmSpecifiers,
  toMtsDeclaration,
} from '../../../scripts/utils/explicit-esm-specifiers.mjs';

/**
 * The `.d.mts` self-contained copies of the theme presets and language dictionaries (DEV-3421) need every relative
 * specifier explicit, because ESM resolution does not map `./x` or `./dir` the way the `.d.ts` graph does.
 */

/**
 * Run a callback against a temporary declaration tree: `a/b/main.d.ts`, `types.d.ts`, `dir.d.ts` next to
 * `dir/index.d.ts`, and an `index.d.ts` in `a` and `a/b`.
 *
 * @param {Function} run Receives the path of `main.d.ts`.
 */
function withTree(run) {
  const root = mkdtempSync(path.join(tmpdir(), 'hot-specifiers-'));

  try {
    mkdirSync(path.join(root, 'a', 'b'), { recursive: true });
    mkdirSync(path.join(root, 'dir'));
    ['types.d.ts', 'dir.d.ts', 'dir/index.d.ts', 'a/index.d.ts', 'a/b/index.d.ts'].forEach((file) => {
      writeFileSync(path.join(root, file), '');
    });
    run(path.join(root, 'a', 'b', 'main.d.ts'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('a file specifier gets .mjs, in import, import type and export type ... from', () => {
  withTree((dts) => {
    const source = [
      'import type { A } from \'../../types\';',
      'import B from \'../../types\';',
      'export type { C } from \'../../types\';',
      '',
    ].join('\n');

    assert.equal(toExplicitEsmSpecifiers(source, dts), source.replaceAll('\'../../types\'', '\'../../types.mjs\''));
  });
});

test('a multiline import list is rewritten', () => {
  withTree((dts) => {
    const source = 'import type {\n  A,\n  B,\n} from \'../../types\';\n';

    assert.equal(toExplicitEsmSpecifiers(source, dts), source.replace('types', 'types.mjs'));
  });
});

test('a directory specifier becomes <dir>/index.mjs, and import() types are covered', () => {
  withTree((dts) => {
    assert.equal(
      toExplicitEsmSpecifiers('import type { A } from \'../../dir/\';\ntype T = import(\'../../dir/\').A;', dts),
      'import type { A } from \'../../dir/index.mjs\';\ntype T = import(\'../../dir/index.mjs\').A;'
    );
  });
});

test('a trailing slash means a directory even when <spec>.d.ts exists', () => {
  withTree((dts) => {
    // `../../dir.d.ts` exists next to `../../dir/index.d.ts`: the slash decides.
    assert.equal(toExplicitEsmSpecifiers('import type { A } from \'../../dir/\';', dts), 'import type { A } from \'../../dir/index.mjs\';');
    assert.equal(toExplicitEsmSpecifiers('import type { A } from \'../../dir\';', dts), 'import type { A } from \'../../dir.mjs\';');
  });
});

test('the bare . and .. specifiers resolve to their index', () => {
  withTree((dts) => {
    assert.equal(toExplicitEsmSpecifiers('import type { A } from \'.\';', dts), 'import type { A } from \'./index.mjs\';');
    assert.equal(toExplicitEsmSpecifiers('import type { A } from \'..\';', dts), 'import type { A } from \'../index.mjs\';');
  });
});

test('an explicit .js or .mjs specifier and a bare package are left alone, double quotes are kept', () => {
  withTree((dts) => {
    const untouched = 'import type { A } from \'handsontable/base\';\nexport * from \'../../types.js\';\nexport * from \'./x.mjs\';';

    assert.equal(toExplicitEsmSpecifiers(untouched, dts), untouched);
    assert.equal(
      toExplicitEsmSpecifiers('import type { A } from "../../types";', dts),
      'import type { A } from "../../types.mjs";'
    );
  });
});

test('a specifier inside a comment is neither rewritten nor checked', () => {
  withTree((dts) => {
    const source = [
      '/**',
      ' * Mirrors `import x from \'../../missing\'` and',
      ' * export { y } from \'../../types\';',
      ' */',
      '// import z from \'../../missing\';',
      'import type { A } from \'../../types\';',
    ].join('\n');

    assert.equal(
      toExplicitEsmSpecifiers(source, dts),
      source.replace('import type { A } from \'../../types\';', 'import type { A } from \'../../types.mjs\';')
    );
  });
});

test('a specifier that matches no declaration throws instead of guessing /index.mjs', () => {
  withTree((dts) => {
    assert.throws(
      () => toExplicitEsmSpecifiers('import type { A } from \'../../missing\';', dts),
      /neither .*missing\.d\.ts nor/
    );
  });
});

test('the packaging step writes a self-contained copy for a preset and a language, and a wrapper elsewhere', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'hot-mts-'));
  const write = (file, content) => {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  };

  try {
    write('themes/types.d.ts', 'export type Cfg = { a: 1 };\n');
    write('themes/static/variables/tokens/main.d.ts', 'import type { Cfg } from \'../../../types\';\ndeclare const t: Cfg;\nexport default t;\n');
    write('themes/static/variables/helpers/named.d.ts', 'export declare const n: number;\n');
    write('i18n/languages/de-DE.d.ts', 'declare const dictionary: { languageCode: string };\nexport default dictionary;\n');
    write('i18n/languages/index.d.ts', 'import deDE from \'./de-DE\';\nexport { deDE };\n');
    write('core.d.ts', 'declare class Core {}\nexport default Core;\n');

    assert.deepEqual(SELF_CONTAINED_MTS_DIRS, ['themes/static/variables/', 'i18n/languages/']);
    assert.equal(
      toMtsDeclaration(root, 'themes/static/variables/tokens/main.d.ts'),
      'import type { Cfg } from \'../../../types.mjs\';\ndeclare const t: Cfg;\nexport default t;\n'
    );
    assert.equal(
      toMtsDeclaration(root, 'i18n/languages/de-DE.d.ts'),
      'declare const dictionary: { languageCode: string };\nexport default dictionary;\n'
    );
    // A named-only file under a self-contained directory, a default export elsewhere, and a languages barrel
    // without a default export all keep the wrapper.
    assert.equal(toMtsDeclaration(root, 'themes/static/variables/helpers/named.d.ts'), 'export * from \'./named.js\';\n');
    assert.equal(toMtsDeclaration(root, 'i18n/languages/index.d.ts'), 'export * from \'./index.js\';\n');
    assert.equal(
      toMtsDeclaration(root, 'core.d.ts'),
      'export * from \'./core.js\';\nexport { default } from \'./core.js\';\n'
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the entry points re-export their default through an entry shim, only at the package root', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'hot-mts-entry-'));
  const write = (file, content) => {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  };

  try {
    write('core/index.d.ts', 'export declare const core: number;\n');
    write('base.d.ts', 'declare const Handsontable: { a: 1 };\nexport default Handsontable;\n');
    write('index.d.ts', 'import Handsontable from \'./base\';\nexport default Handsontable;\n');
    write('themes/index.d.ts', 'declare const themes: number;\nexport default themes;\n');

    assert.equal(ENTRY_SHIM_SUFFIX, '.entry.d.ts');
    // The default comes from a NAMED import of the shim: a default import of the CommonJS `.d.ts` is typed as the
    // module namespace under `node16` (DEV-3430), and a copy of the declaration would split its identity.
    assert.equal(
      toMtsDeclaration(root, 'base.d.ts'),
      'export * from \'./base.js\';\nimport { Handsontable } from \'./base.entry.js\';\nexport default Handsontable;\n'
    );
    assert.equal(
      toMtsDeclaration(root, 'index.d.ts'),
      'export * from \'./index.js\';\nimport { Handsontable } from \'./index.entry.js\';\nexport default Handsontable;\n'
    );
    assert.equal(toEntryShim('base.d.ts'), 'import Handsontable from \'./base\';\nexport { Handsontable };\n');
    assert.equal(toEntryShim('index.d.ts'), 'import Handsontable from \'./index\';\nexport { Handsontable };\n');
    // Only the entry declarations the tree holds, with a default export, get a shim.
    assert.deepEqual(listEntryShimTargets(root), ['index.d.ts', 'base.d.ts']);
    write('index.d.ts', 'export declare const named: number;\n');
    assert.deepEqual(listEntryShimTargets(root), ['base.d.ts']);
    assert.deepEqual(listEntryShimTargets(path.join(root, 'core')), []);
    // A same-named file in a subdirectory, with or without a default export, keeps the wrapper.
    assert.equal(toMtsDeclaration(root, 'core/index.d.ts'), 'export * from \'./index.js\';\n');
    assert.equal(
      toMtsDeclaration(root, 'themes/index.d.ts'),
      'export * from \'./index.js\';\nexport { default } from \'./index.js\';\n'
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
