import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { main } from '../src/cli.mjs';
import { run } from '../src/runner.mjs';

/**
 * Write a project under the OS temp directory (never inside the monorepo), run the codemod on it, and hand the
 * result and a file reader to the callback.
 *
 * @param {Record<string, string>} files File contents by relative path.
 * @param {object} options Options for `run()`.
 * @param {(outcome: {result: object, read: (name: string) => Promise<string>}) => Promise<void>} check Assertions.
 * @returns {Promise<void>}
 */
async function migrate(files, options, check) {
  const dir = await mkdtemp(join(tmpdir(), 'codemod-below-'));

  try {
    for (const [name, content] of Object.entries(files)) {
      await mkdir(dirname(join(dir, name)), { recursive: true });
      await writeFile(join(dir, name), content);
    }

    const result = await run({ cwd: dir, to: '18.1', ...options });

    await check({ result, read: name => readFile(join(dir, name), 'utf8') });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/**
 * Build the text of a `package.json`.
 *
 * @param {object} value The manifest.
 * @returns {string} The text.
 */
function pkg(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

const MONOREPO = {
  'package.json': pkg({ name: 'root', private: true }),
  'packages/old/package.json': pkg({
    name: 'old',
    dependencies: { handsontable: '~17.1.0', '@handsontable/react-wrapper': '~17.1.0' },
  }),
  'packages/old/src/grid.js': 'import Handsontable from \'handsontable\';\nnew Handsontable(el, {});\n',
  'packages/new/package.json': pkg({ name: 'new', dependencies: { handsontable: '18.0.0' } }),
};

describe('a raised peer range', () => {
  it('stays raised and gets one manual entry that says it drops the older line', async() => {
    await migrate({
      'package.json': pkg({ name: 'lib', peerDependencies: { handsontable: '^17.1.0' } }),
    }, { from: '17.1' }, async({ result, read }) => {
      assert.equal(JSON.parse(await read('package.json')).peerDependencies.handsontable, '^18.1.0');

      const notes = result.report.entries.filter(entry => entry.severity === 'manual');

      assert.equal(notes.length, 1);
      assert.equal(notes[0].message, 'Raised the peer range of handsontable to ^18.1.0. This drops 17.x for consumers '
        + 'of this package. Widen it by hand if you still support older versions.');
    });
  });

  it('is not mentioned for a dependency', async() => {
    await migrate({
      'package.json': pkg({ name: 'app', dependencies: { handsontable: '^17.1.0' } }),
    }, { from: '17.1' }, async({ result }) => {
      assert.equal(result.report.entries.filter(entry => entry.severity === 'manual').length, 0);
    });
  });
});

describe('the CLI', () => {
  it('prints the below-from warning on stderr and exits 0', async() => {
    const dir = await mkdtemp(join(tmpdir(), 'codemod-below-cli-'));

    try {
      await mkdir(join(dir, 'packages/old'), { recursive: true });
      await writeFile(join(dir, 'packages/old/package.json'), pkg({ dependencies: { handsontable: '~17.1.0' } }));

      let err = '';
      const code = await main(['migrate', '--from', '18.0', '--to', '18.1', '--allow-dirty'], {
        cwd: dir,
        stdout: () => {},
        stderr: (text) => {
          err += text;
        },
      });

      assert.equal(code, 0);
      assert.match(err, /^Warning: packages\/old\/package\.json declares handsontable ~17\.1\.0, which is below /m);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('a package below --from', () => {
  it('is not bumped, and gets one warning that names the package and --from', async() => {
    await migrate(MONOREPO, { from: '18.0' }, async({ result, read }) => {
      assert.equal(JSON.parse(await read('packages/old/package.json')).dependencies.handsontable, '~17.1.0');
      assert.equal(JSON.parse(await read('packages/old/package.json')).dependencies['@handsontable/react-wrapper'],
        '~17.1.0');
      assert.equal(JSON.parse(await read('packages/new/package.json')).dependencies.handsontable, '18.1.0');

      const warnings = result.report.entries.filter(entry => entry.ruleId === 'below-from');

      assert.equal(warnings.length, 1);
      assert.equal(warnings[0].severity, 'warning');
      assert.equal(warnings[0].file, 'packages/old/package.json');
      assert.match(warnings[0].message, /^packages\/old\/package\.json declares handsontable ~17\.1\.0 and /);
      assert.match(warnings[0].message, /which are below --from 18\.0\. It was not changed\. /);
      assert.match(warnings[0].message, /Run the tool on that package with --from 17\.1\.$/);
      assert.equal(result.exitCode, 0);
    });
  });

  it('is bumped when --from is below its line, with no warning', async() => {
    await migrate(MONOREPO, { from: '17.1' }, async({ result, read }) => {
      assert.equal(JSON.parse(await read('packages/old/package.json')).dependencies.handsontable, '~18.1.0');
      assert.equal(result.report.entries.filter(entry => entry.ruleId === 'below-from').length, 0);
    });
  });

  it('is not flagged when the range is on the same line as --from', async() => {
    await migrate({
      'package.json': pkg({ dependencies: { handsontable: '^18.0.0' } }),
    }, { from: '18.0' }, async({ result, read }) => {
      assert.equal(JSON.parse(await read('package.json')).dependencies.handsontable, '^18.1.0');
      assert.equal(result.report.entries.filter(entry => entry.ruleId === 'below-from').length, 0);
    });
  });

  it('is reported once for a chained run that selects two migrations', async() => {
    await migrate({
      'package.json': pkg({ dependencies: { handsontable: '^16.2.0' } }),
    }, { from: '17.1', allowUncovered: true }, async({ result, read }) => {
      assert.equal(JSON.parse(await read('package.json')).dependencies.handsontable, '^16.2.0');
      assert.equal(result.report.entries.filter(entry => entry.ruleId === 'below-from').length, 1);
    });
  });

  it('names the page that pins a CDN URL below --from, and says the earlier steps were not checked', async() => {
    await migrate({
      'legacy.htm': '<script src="https://unpkg.com/handsontable@17.1.0/dist/handsontable.full.min.js"></script>\n',
    }, { from: '18.0' }, async({ result }) => {
      const [entry] = result.report.entries.filter(item => item.file === 'legacy.htm' && item.severity === 'manual');

      assert.match(entry.message, /below --from 18\.0/);
      assert.match(entry.message, /earlier steps were not checked/);
    });
  });
});
