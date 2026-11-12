import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { buildPlan, loadManifests, VERSIONS_DIR } from '../src/manifest.mjs';
import { MAX_FILE_BYTES, run, transformFile } from '../src/runner.mjs';
import { createSampleProject, git } from './helpers/sample-project.mjs';

const BIN = fileURLToPath(new URL('../bin/handsontable-codemod.mjs', import.meta.url));
const RANGE = ['--from', '17.1', '--to', '18.1'];
const plan = buildPlan(await loadManifests(VERSIONS_DIR), []);

/**
 * Transform one file with every shipped rule and return the `skipped-file` entries.
 *
 * @param {string} filePath File name.
 * @param {string} source File text.
 * @returns {Promise<Array<{line: number|null, message: string}>>} The entries.
 */
async function skippedOf(filePath, source) {
  const result = await transformFile({ filePath, source, plan });

  return result.entries.filter(entry => entry.ruleId === 'skipped-file')
    .map(({ line, message }) => ({ line, message }));
}

/**
 * Run a callback in a temporary project that is not a git repository, and remove it afterwards.
 *
 * @param {Record<string, string>} files File contents by relative path.
 * @param {(dir: string) => Promise<void>} body Test body.
 * @returns {Promise<void>}
 */
async function inPlainProject(files, body) {
  const dir = await mkdtemp(join(tmpdir(), 'codemod-extras-'));

  try {
    for (const [name, content] of Object.entries(files)) {
      await mkdir(dirname(join(dir, name)), { recursive: true });
      await writeFile(join(dir, name), content);
    }

    await body(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/**
 * Run the real executable.
 *
 * @param {string} dir Working directory.
 * @param {string[]} args Arguments after `migrate`.
 * @returns {{status: number, stdout: string, stderr: string}} Exit code and output.
 */
function migrate(dir, args) {
  const result = spawnSync(process.execPath, [BIN, 'migrate', ...args], { cwd: dir, encoding: 'utf8' });

  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe('files the tool cannot analyze are listed, not dropped', () => {
  it('warns about a Less, Stylus, or Sass file that mentions a theme variable or Handsontable', async() => {
    for (const name of ['a.less', 'a.styl', 'a.stylus', 'a.sass']) {
      const [entry] = await skippedOf(name, '.grid\n  --ht-border-radius: 4px\n');

      assert.match(entry.message, /Less, Stylus, or Sass file was not analyzed/, name);
      assert.equal(entry.line, null);
    }
  });

  it('stays silent about one that says nothing about Handsontable', async() => {
    assert.deepEqual(await skippedOf('a.less', '.card { color: red; }\n'), []);
  });

  it('warns about a Vue style block in another language and about a src= block, with the line of the tag', async() => {
    const source = '<script>import Handsontable from \'handsontable\';</script>\n'
      + '<style lang="less">\n.a { --ht-wrapper-border-radius: 1px; }\n</style>\n'
      + '<style lang="stylus">\n.b { color: red }\n</style>\n'
      + '<style src="./theme.css"></style>\n';

    assert.deepEqual(await skippedOf('App.vue', source), [
      { line: 2, message: 'A <style lang="less"> block was not analyzed. Check it by hand.' },
      { line: 8, message: 'A <style src> block was not analyzed. Check it by hand.' },
    ]);
  });

  it('warns once per HTML page about inline scripts that use Handsontable, at the first script tag', async() => {
    const source = '<html>\n<script src="a.js"></script>\n'
      + '<script>\n  const hot = new Handsontable(el, {});\n</script>\n'
      + '<script>new Handsontable(a, {});</script>\n<script>console.log(1);</script>\n</html>\n';

    assert.deepEqual(await skippedOf('index.html', source), [{
      line: 3,
      message: '2 inline <script> elements that use Handsontable were not analyzed. The tool reads no JavaScript '
        + 'inside an HTML page. Check them by hand.',
    }]);
    assert.deepEqual(await skippedOf('a.html', '<script>var x = 1;</script>\n<div class="ht-theme-main"></div>\n'), []);
    assert.deepEqual(
      await skippedOf('b.html', '<script>new Handsontable(a, {});</script\t\n bar>\n'
        + '<script>new Handsontable(b, {});</script>\n'),
      [{
        line: 1,
        message: '2 inline <script> elements that use Handsontable were not analyzed. The tool reads no JavaScript '
          + 'inside an HTML page. Check them by hand.',
      }]
    );
  });

  it('skips a file above the size limit with a warning, and reads one at the limit', async() => {
    const small = 'import Handsontable from \'handsontable\';\nnew Handsontable(el, { correctFormat: true });\n';

    await inPlainProject({ 'big.js': `${small}${'// padding\n'.repeat(100)}`, 'ok.js': small }, async(dir) => {
      const limit = Buffer.byteLength(small);
      const result = await run({ cwd: dir, from: '17.1', to: '18.1', maxFileSize: limit });

      assert.deepEqual(result.report.skipped().map(entry => entry.file), ['big.js']);
      assert.match(result.report.skipped()[0].message,
        /The file is \d\.\d KB, above the limit of \d+ bytes, so it was not analyzed/);
      assert.deepEqual(result.changedFiles, ['ok.js']);
      assert.equal(await readFile(join(dir, 'big.js'), 'utf8').then(text => text.startsWith('import')), true);
    });
  });

  it('has a limit of 1 MB by default', () => {
    assert.equal(MAX_FILE_BYTES, 1024 * 1024);
  });

  it('reports progress at the interval it is given', async() => {
    await inPlainProject({ 'a.css': 'a { color: red; }\n', 'b.css': 'a { color: red; }\n' }, async(dir) => {
      const seen = [];

      await run({ cwd: dir, from: '17.1', to: '18.1', progressIntervalMs: 0, onProgress: item => seen.push(item) });

      assert.deepEqual(seen, [{ done: 1, total: 2 }, { done: 2, total: 2 }]);
    });
  });
});

describe('HTML pages that pin Handsontable on a CDN', () => {
  it('reports each URL below the target once for a chained run, with its line, and edits nothing', async() => {
    const page = '<link href="https://cdn.jsdelivr.net/npm/handsontable@17.1.0/styles/ht-theme-main.min.css">\n'
      + '<script src="https://unpkg.com/handsontable@17.1.0/dist/handsontable.full.min.js"></script>\n'
      + '<script src="https://cdnjs.cloudflare.com/ajax/libs/handsontable/16.2.0/handsontable.min.js"></script>\n'
      + '<script src="https://cdn.jsdelivr.net/npm/handsontable@^18.1.0/dist/handsontable.full.min.js"></script>\n'
      + '<script src="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js"></script>\n';

    await inPlainProject({ 'index.html': page }, async(dir) => {
      const result = await run({ cwd: dir, from: '17.1', to: '18.1' });
      const pins = result.report.entries
        .filter(entry => entry.file === 'index.html' && entry.ruleId.endsWith('/dependencies'));

      assert.deepEqual(pins.map(entry => entry.line), [1, 2, 3]);
      assert.match(pins[0].message, /^handsontable 17\.1\.0 is loaded from a URL here, which does not allow 18\.1\.0/);
      assert.equal(await readFile(join(dir, 'index.html'), 'utf8'), page);
    });
  });
});

describe('the CLI around a run', () => {
  it('lists skipped files and notes that hold for every file in their own sections of both reports', async() => {
    const dir = await createSampleProject({
      'src/theme.less': '.a { --ht-wrapper-border-radius: 1px; }\n',
      'src/page.html': '<script>new Handsontable(el, {});</script>\n',
    });

    try {
      const result = migrate(dir, [...RANGE, '--report', '../report.md']);
      const report = await readFile(join(dir, '..', 'report.md'), 'utf8');

      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /^Read once \(\d+\)$/m);
      assert.equal(result.stdout.split('CellValue is now `unknown`').length - 1, 1);
      assert.match(result.stdout, /^Skipped files \(2\)$/m);
      assert.match(result.stdout, /^ {2}src\/page\.html {2}An inline <script>/m);
      assert.match(result.stdout, /^ {2}src\/theme\.less {2}The tool reads CSS and SCSS only/m);
      assert.match(report, /^## Read once$/m);
      assert.match(report, /^## Skipped files$/m);
      assert.ok(report.includes(result.stdout.match(/^Summary: .*$/m)[0]), 'the report repeats the console summary');
      assert.ok(report.indexOf('## 18.0.0/') < report.indexOf('## 18.1.0/'), 'sections follow the version order');
      await rm(join(dir, '..', 'report.md'), { force: true });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('writes the report of a dry run and no project file, and the next run ignores that untracked report', async() => {
    const dir = await createSampleProject();

    try {
      const dry = migrate(dir, [...RANGE, '--dry-run', '--report', 'report.md']);

      assert.equal(dry.status, 0, dry.stderr);
      assert.match(await readFile(join(dir, 'report.md'), 'utf8'), /^Summary: 7 files would change, /m);
      assert.equal(git(dir, ['diff', '--name-only']), '');

      const blocked = migrate(dir, RANGE);

      assert.equal(blocked.status, 2, 'any other untracked file still refuses the run');
      assert.match(blocked.stderr, /uncommitted change/);

      const applied = migrate(dir, [...RANGE, '--report', 'report.md']);

      assert.equal(applied.status, 0, applied.stderr);
      assert.match(applied.stdout, /^Summary: 7 files changed, /m);
      git(dir, ['add', '-u']);
      git(dir, ['commit', '-q', '-m', 'migrate']);

      const again = migrate(dir, [...RANGE, '--report', 'report.md']);

      assert.equal(again.status, 0, again.stderr);
      assert.match(again.stdout, /^Summary: 0 files changed, /m);
      assert.equal(migrate(dir, RANGE).status, 2, 'without --report the untracked report is a change');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('detects --from for each path argument and asks for --from when the paths differ', async() => {
    const manifest = range => `${JSON.stringify({ dependencies: { handsontable: range } })}\n`;
    const css = '.a { --ht-wrapper-border-radius: 1px; }\n';
    const dir = await createSampleProject({
      'packages/a/package.json': manifest('^17.1.0'),
      'packages/a/theme.css': css,
      'packages/b/package.json': manifest('^18.0.0'),
      'packages/b/theme.css': css,
    });

    try {
      const one = migrate(dir, ['packages/a/theme.css', '--to', '18.1', '--dry-run']);

      assert.equal(one.status, 0, one.stderr);
      assert.match(one.stderr, /Detected --from 17\.1\.0 \(packages\/a\/package\.json dependencies\)\./);

      const both = migrate(dir, ['packages/a', 'packages/b', '--to', '18.1', '--dry-run']);

      assert.equal(both.status, 2);
      assert.match(both.stderr, /packages\/a: 17\.1\.0, packages\/b: 18\.0\.0/);
      assert.match(both.stderr, /Pass --from/);
      assert.equal(migrate(dir, ['packages/a', 'packages/b', ...RANGE, '--dry-run']).status, 0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('warns before it writes outside a git repository, and not for a dry run', async() => {
    await inPlainProject({ 'a.css': '.a { --ht-wrapper-border-radius: 1px; }\n' }, async(dir) => {
      const dry = migrate(dir, [...RANGE, '--dry-run']);
      const real = migrate(dir, RANGE);

      assert.equal(dry.stderr.includes('Not a git repository'), false);
      assert.equal(real.status, 0, real.stderr);
      assert.ok(real.stderr.includes('Not a git repository: you cannot review the changes with git diff. '
        + 'Stop now and use --dry-run if you want a preview.\n'));
      assert.match(await readFile(join(dir, 'a.css'), 'utf8'), /--ht-border-radius/);
    });
  });

  it('rejects a --max-file-size that is not a whole number above 0', async() => {
    await inPlainProject({ 'a.css': 'a {}\n' }, async(dir) => {
      for (const value of ['0', '-1', 'abc', '1.5']) {
        const result = migrate(dir, [...RANGE, `--max-file-size=${value}`]);

        assert.equal(result.status, 2, value);
        assert.match(result.stderr, /--max-file-size needs a whole number of bytes above 0/);
      }

      assert.equal(migrate(dir, [...RANGE, '--max-file-size', '10']).status, 0);
    });
  });
});
