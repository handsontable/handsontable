import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { toExplicitEsmSpecifiers } from '../../../scripts/utils/explicit-esm-specifiers.mjs';

/**
 * The `.d.mts` self-contained copies of the theme presets (DEV-3421) need every relative specifier
 * explicit, because ESM resolution does not map `./x` or `./dir` the way the `.d.ts` graph does.
 */

/**
 * Run a callback against a temporary declaration tree: `a/b/main.d.ts` next to `types.d.ts` and `dir/index.d.ts`.
 *
 * @param {Function} run Receives the path of `main.d.ts`.
 */
function withTree(run) {
  const root = mkdtempSync(path.join(tmpdir(), 'hot-specifiers-'));

  try {
    mkdirSync(path.join(root, 'a', 'b'), { recursive: true });
    mkdirSync(path.join(root, 'dir'));
    writeFileSync(path.join(root, 'types.d.ts'), '');
    writeFileSync(path.join(root, 'dir', 'index.d.ts'), '');
    run(path.join(root, 'a', 'b', 'main.d.ts'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('a file specifier gets .js, in import, import type and export type ... from', () => {
  withTree((dts) => {
    const source = [
      'import type { A } from \'../../types\';',
      'import B from \'../../types\';',
      'export type { C } from \'../../types\';',
      '',
    ].join('\n');

    assert.equal(toExplicitEsmSpecifiers(source, dts), source.replaceAll('\'../../types\'', '\'../../types.js\''));
  });
});

test('a multiline import list is rewritten', () => {
  withTree((dts) => {
    const source = 'import type {\n  A,\n  B,\n} from \'../../types\';\n';

    assert.equal(toExplicitEsmSpecifiers(source, dts), source.replace('types', 'types.js'));
  });
});

test('a directory specifier becomes <dir>/index.js, and import() types are covered', () => {
  withTree((dts) => {
    assert.equal(
      toExplicitEsmSpecifiers('import type { A } from \'../../dir\';\ntype T = import(\'../../dir/\').A;', dts),
      'import type { A } from \'../../dir/index.js\';\ntype T = import(\'../../dir/index.js\').A;'
    );
  });
});

test('an explicit .js specifier and a bare package are left alone, double quotes are kept', () => {
  withTree((dts) => {
    const untouched = 'import type { A } from \'handsontable/base\';\nexport * from \'../../types.js\';';

    assert.equal(toExplicitEsmSpecifiers(untouched, dts), untouched);
    assert.equal(
      toExplicitEsmSpecifiers('import type { A } from "../../types";', dts),
      'import type { A } from "../../types.js";'
    );
  });
});

test('a specifier that matches no declaration throws instead of guessing /index.js', () => {
  withTree((dts) => {
    assert.throws(
      () => toExplicitEsmSpecifiers('import type { A } from \'../../missing\';', dts),
      /neither .*missing\.d\.ts nor/
    );
  });
});
