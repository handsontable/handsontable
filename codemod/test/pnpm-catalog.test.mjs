import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { findCatalog, parseCatalogs } from '../src/lib/pnpm-catalog.mjs';
import { parseCatalogSpec } from '../src/lib/dependency-range.mjs';
import { run } from '../src/runner.mjs';

/**
 * Write a project under the OS temp directory (never inside the monorepo), run the codemod on it, and hand the
 * result and a file reader to the callback.
 *
 * @param {Record<string, string>} files File contents by relative path.
 * @param {object} options Options for `run()`. `from` defaults to `17.1` and `to` to `18.1`.
 * @param {(outcome: {result: object, read: (name: string) => Promise<string>, dir: string}) => Promise<void>} check
 * Assertions.
 * @returns {Promise<void>}
 */
async function migrate(files, options, check) {
  const dir = await mkdtemp(join(tmpdir(), 'codemod-catalog-'));

  try {
    for (const [name, content] of Object.entries(files)) {
      await mkdir(dirname(join(dir, name)), { recursive: true });
      await writeFile(join(dir, name), content);
    }

    const result = await run({ cwd: dir, from: '17.1', to: '18.1', ...options });

    await check({ result, read: name => readFile(join(dir, name), 'utf8'), dir });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/**
 * The entries of a result that are about a `package.json`.
 *
 * @param {object} result Result of `run()`.
 * @param {string} file Project-relative path.
 * @returns {Array<{ruleId: string, severity: string, message: string}>} The entries.
 */
function entriesOf(result, file) {
  return result.report.entries.filter(entry => entry.file === file);
}

const pkg = spec => `${JSON.stringify({ name: 'app', dependencies: { handsontable: spec } }, null, 2)}\n`;

describe('parseCatalogSpec', () => {
  it('names the catalog a spec points at', () => {
    assert.deepEqual(parseCatalogSpec('catalog:'), { name: null });
    assert.deepEqual(parseCatalogSpec('catalog:default'), { name: null });
    assert.deepEqual(parseCatalogSpec('catalog:legacy'), { name: 'legacy' });
    assert.equal(parseCatalogSpec('^17.1.0'), null);
    assert.equal(parseCatalogSpec('workspace:*'), null);
  });
});

describe('parseCatalogs', () => {
  it('reads the default catalog and the named ones', () => {
    const catalogs = parseCatalogs([
      'packages:',
      '  - apps/*',
      'catalog:',
      '  handsontable: ^17.1.0',
      '  \'@handsontable/vue3\': 17.1.0',
      '  "@handsontable/react-wrapper": "~17.1.0" # pinned',
      'catalogs:',
      '  legacy:',
      '    handsontable: ^16.0.0',
      '  next:',
      '    handsontable: ">=18 <19"',
      'overrides:',
      '  handsontable: ^1.0.0',
      '',
    ].join('\n'));

    assert.deepEqual([...catalogs.get('')], [
      ['handsontable', '^17.1.0'],
      ['@handsontable/vue3', '17.1.0'],
      ['@handsontable/react-wrapper', '~17.1.0'],
    ]);
    assert.deepEqual([...catalogs.get('legacy')], [['handsontable', '^16.0.0']]);
    assert.deepEqual([...catalogs.get('next')], [['handsontable', '>=18 <19']]);
    assert.equal(catalogs.has('overrides'), false);
  });

  it('reads a CRLF file, tabs-free deeper indentation, and the default name under catalogs', () => {
    const catalogs = parseCatalogs('catalogs:\r\n    default:\r\n        handsontable: 17.1.0\r\n');

    assert.deepEqual([...catalogs.get('')], [['handsontable', '17.1.0']]);
  });

  it('gives no entry for a form it does not read', () => {
    assert.equal(parseCatalogs('catalog: { handsontable: ^17.1.0 }\n').get('')?.size ?? 0, 0);
    assert.equal(parseCatalogs('catalog:\n  handsontable:\n    - ^17\n').get('')?.get('handsontable'), undefined);
    assert.equal(parseCatalogs('catalog:\n  handsontable: *anchor\n').get('')?.get('handsontable'), undefined);
    assert.equal(parseCatalogs('packages: []\n').size, 0);
  });
});

describe('findCatalog', () => {
  it('finds the nearest pnpm-workspace.yaml between the package and the project directory', async() => {
    await migrate({
      'pnpm-workspace.yaml': 'catalog:\n  handsontable: ^1.0.0\n',
      'apps/pnpm-workspace.yaml': 'catalog:\n  handsontable: ^17.1.0\n',
      'apps/web/package.json': pkg('catalog:'),
    }, { dryRun: true }, async({ dir }) => {
      const found = await findCatalog(dir, 'apps/web/package.json');

      assert.equal(found.file, 'apps/pnpm-workspace.yaml');
      assert.equal(found.catalogs.get('').get('handsontable'), '^17.1.0');
      assert.equal((await findCatalog(dir, 'package.json')).file, 'pnpm-workspace.yaml');
    });
  });
});

describe('a catalog: spec in package.json', () => {
  it('points at the catalog section of pnpm-workspace.yaml and names its current value', async() => {
    await migrate({
      'pnpm-workspace.yaml': 'packages:\n  - apps/*\ncatalog:\n  handsontable: ^17.1.0\n',
      'apps/web/package.json': pkg('catalog:'),
    }, {}, async({ result, read }) => {
      const [entry, ...rest] = entriesOf(result, 'apps/web/package.json');

      assert.equal(rest.length, 0);
      assert.equal(entry.severity, 'manual');
      assert.equal(entry.message, 'handsontable "catalog:" in dependencies takes its range from the pnpm catalog. '
        + 'The catalog section of pnpm-workspace.yaml has "^17.1.0". Set it to ^18.1.0 there, not in package.json.');
      assert.equal(await read('apps/web/package.json'), pkg('catalog:'));
      assert.equal(await read('pnpm-workspace.yaml'), 'packages:\n  - apps/*\ncatalog:\n  handsontable: ^17.1.0\n');
    });
  });

  it('points at catalogs.<name> for a named catalog', async() => {
    await migrate({
      'pnpm-workspace.yaml': 'catalogs:\n  legacy:\n    handsontable: 17.1.0\n',
      'package.json': pkg('catalog:legacy'),
    }, {}, async({ result }) => {
      assert.equal(entriesOf(result, 'package.json')[0].message,
        'handsontable "catalog:legacy" in dependencies takes its range from the pnpm catalog. '
        + 'The catalogs.legacy section of pnpm-workspace.yaml has "17.1.0". Set it to ^18.1.0 there, '
        + 'not in package.json.');
    });
  });

  it('keeps the generic text when the workspace file or the entry cannot be read', async() => {
    const generic = 'handsontable "catalog:" in dependencies takes its range from the pnpm catalog. '
      + 'Set it to ^18.1.0 in the catalog section of pnpm-workspace.yaml, not in package.json.';

    for (const workspace of [
      null,
      'packages:\n  - .\n',
      'catalog:\n  react: ^19.0.0\n',
      'catalog: { handsontable: ^17 }\n',
    ]) {
      await migrate({
        ...(workspace === null ? {} : { 'pnpm-workspace.yaml': workspace }),
        'package.json': pkg('catalog:'),
      }, {}, async({ result }) => {
        assert.equal(entriesOf(result, 'package.json')[0].message, generic, String(workspace));
      });
    }
  });

  it('says nothing when the catalog entry already admits the target', async() => {
    for (const range of ['>=17.1.0 <19', '^18.1.0', '18.x', '*']) {
      await migrate({
        'pnpm-workspace.yaml': `catalog:\n  handsontable: '${range}'\n`,
        'package.json': pkg('catalog:'),
      }, {}, async({ result }) => {
        assert.deepEqual(entriesOf(result, 'package.json'), [], range);
      });
    }
  });

  it('reports one entry for a chained run, with the latest target, and edits nothing on a second run', async() => {
    await migrate({
      'pnpm-workspace.yaml': 'catalog:\n  handsontable: ^17.1.0\n',
      'package.json': pkg('catalog:'),
    }, { from: '17.1', to: '18.1' }, async({ result, dir, read }) => {
      const entries = entriesOf(result, 'package.json');

      assert.equal(entries.length, 1);
      assert.match(entries[0].message, /Set it to \^18\.1\.0 there/);
      assert.deepEqual(result.changedFiles, []);

      const again = await run({ cwd: dir, from: '17.1', to: '18.1' });

      assert.deepEqual(again.changedFiles, []);
      assert.equal(await read('package.json'), pkg('catalog:'));
    });
  });

  it('does not change how a plain range or an npm alias is handled', async() => {
    await migrate({
      'package.json': `${JSON.stringify({
        dependencies: { handsontable: '^17.1.0', '@handsontable/vue3': 'npm:@handsontable/vue3@^17.1.0' },
      }, null, 2)}\n`,
    }, {}, async({ result, read }) => {
      assert.match(await read('package.json'), /"handsontable": "\^18\.1\.0"/);
      assert.ok(result.changedFiles.includes('package.json'));
    });
  });
});
