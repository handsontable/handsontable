import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { buildPlan } from '../src/manifest.mjs';
import { MAX_FILE_BYTES, MAX_LINE_LENGTH, run, transformFile } from '../src/runner.mjs';
import { loadReleasedManifests } from './helpers/manifests.mjs';
import { createSampleProject, git, removeSampleProject } from './helpers/sample-project.mjs';

const BIN = fileURLToPath(new URL('../bin/handsontable-codemod.mjs', import.meta.url));
const RANGE = ['--from', '17.1', '--to', '18.1'];
const plan = buildPlan(await loadReleasedManifests(), []);

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
  it('warns about a Less, Stylus, Sass, or PostCSS file that mentions a theme variable or Handsontable', async() => {
    for (const name of ['a.less', 'a.styl', 'a.stylus', 'a.sass', 'a.pcss', 'a.postcss', 'A.PCSS']) {
      const [entry] = await skippedOf(name, '.grid\n  --ht-border-radius: 4px\n');

      assert.match(entry.message, /Less, Stylus, Sass, or PostCSS file was not analyzed/, name);
      assert.equal(entry.line, null);
    }
  });

  it('warns about a Svelte, Astro, or MDX file that names a theme variable or Handsontable, and only then', async() => {
    const style = '<style>\n.grid { border-radius: var(--ht-wrapper-border-radius); }\n</style>\n';
    const fence = '# Theme\n\n```css\n.grid { border-radius: var(--ht-wrapper-border-radius); }\n```\n';

    for (const [name, text] of [['App.svelte', style], ['Page.astro', `---\n---\n${style}`], ['doc.mdx', fence],
      ['Grid.svelte', '<script>import Handsontable from \'handsontable\';</script>\n']]) {
      const [entry] = await skippedOf(name, text);

      assert.match(entry.message, /does not read Svelte, Astro, or MDX files, so this file was not analyzed/, name);
      assert.equal(entry.line, null);
    }

    for (const name of ['App.svelte', 'Page.astro', 'doc.mdx']) {
      assert.deepEqual(await skippedOf(name, '<h1>Hello</h1>\n<style>.a { color: red; }</style>\n'), [], name);
    }
  });

  it('lists these files in a run, in a project that has nothing else to migrate', async() => {
    await inPlainProject({
      'src/App.svelte': '<style>.a { border-radius: var(--ht-wrapper-border-radius); }</style>\n',
      'src/theme.pcss': '.a { border-radius: var(--ht-wrapper-border-radius); }\n',
    }, async(dir) => {
      const result = await run({ cwd: dir, from: '17.1', to: '18.1' });

      assert.deepEqual(result.report.skipped().map(entry => entry.file).sort(), ['src/App.svelte', 'src/theme.pcss']);
      assert.deepEqual(result.changedFiles, []);
    });
  });

  it('stays silent about one that says nothing about Handsontable', async() => {
    assert.deepEqual(await skippedOf('a.less', '.card { color: red; }\n'), []);
  });

  it('warns about a Pikaday selector in a Vue Less block, as it does in a Less file', async() => {
    const style = '<style lang="less">\n.pika-single { color: red; }\n</style>\n';

    assert.equal((await skippedOf('a.less', '.pika-single { color: red; }\n')).length, 1);
    assert.deepEqual(await skippedOf('App.vue', `<template><div /></template>\n${style}`), [
      { line: 2, message: 'A <style lang="less"> block was not analyzed. Check it by hand.' },
    ]);
  });

  it('warns about a Vue style block in another language and about a src= block, with the line of the tag', async() => {
    const source = '<script>import Handsontable from \'handsontable\';</script>\n'
      + '<style lang="less">\n.a { --ht-wrapper-border-radius: 1px; }\n</style>\n'
      + '<style lang="stylus">\n.b { color: red }\n</style>\n'
      + '<style src="./theme.css"></style>\n';

    assert.deepEqual(await skippedOf('App.vue', source), [
      { line: 2, message: 'A <style lang="less"> block was not analyzed. Check it by hand.' },
      {
        line: 8,
        message: 'A <style src> block was not analyzed. It reads theme.css, which is not part of this run. '
          + 'Check it by hand.',
      },
    ]);
  });

  it('warns once per HTML page about inline scripts that use Handsontable, at the first script tag', async() => {
    const source = '<html>\n<script src="a.js"></script>\n'
      + '<script>\n  const hot = new Handsontable(el, {});\n</script>\n'
      + '<script>new Handsontable(a, {});</script>\n<script>console.log(1);</script>\n</html>\n';

    assert.deepEqual(await skippedOf('index.html', source), [{
      line: 3,
      message: '2 inline <script> elements that use Handsontable were not analyzed. The tool reads no JavaScript '
        + 'inside an HTML page. Check them by hand.'
        + ' Check by hand: numeric and date formats, removed options, HTML that needs a sanitizer, the license key, '
        + 'loading title and description markup, sanitizer source values, size options, removed methods.',
    }]);
    assert.deepEqual(await skippedOf('a.html', '<script>var x = 1;</script>\n<div class="ht-theme-main"></div>\n'), []);
    // A browser runs the file of a script that has a src and ignores its body, so the body is no code of the page.
    assert.deepEqual(await skippedOf('c.html', '<script src="a.js">new Handsontable(a, {});</script>\n'), []);
    assert.deepEqual(
      await skippedOf('d.html', '<script type="module" SRC = "a.js">new Handsontable(a, {});</script>\n'), []);
    assert.equal((await skippedOf('e.html', '<script type="module">new Handsontable(a, {});</script>\n')).length, 1);
    assert.deepEqual(
      await skippedOf('b.html', '<script>new Handsontable(a, {});</script\t\n bar>\n'
        + '<script>new Handsontable(b, {});</script>\n'),
      [{
        line: 1,
        message: '2 inline <script> elements that use Handsontable were not analyzed. The tool reads no JavaScript '
          + 'inside an HTML page. Check them by hand.'
          + ' Check by hand: numeric and date formats, removed options, HTML that needs a sanitizer, the license key, '
          + 'loading title and description markup, sanitizer source values, size options, removed methods.',
      }]
    );
  });

  it('treats a script as external only when its attribute is named src, whole', async() => {
    const body = 'new Handsontable(a, {});';
    const inline = attributes => skippedOf('p.html', `<script${attributes}>${body}</script>\n`);

    for (const attributes of ['', ' data-src="x"', ' data-src=x', ' title="src=1"', ' nosrc = "a.js"', ' x-src',
      ' data-src="a.js" type="module"', '\ttype="module"\n\tdata-src=\'y\'']) {
      assert.equal((await inline(attributes)).length, 1, `${JSON.stringify(attributes)} is an inline script`);
    }

    for (const attributes of [' src="a.js"', ' SRC="a.js"', ' SRC = "a.js"', ' data-src="x" src="a.js"', ' src=a.js',
      ' type="module" src', ' src\n=\n\'a.js\'']) {
      assert.deepEqual(await inline(attributes), [], `${JSON.stringify(attributes)} is an external script`);
    }
  });

  it('reads the same attribute for the missing-option check of an inline script', async() => {
    const manifests = await loadReleasedManifests();
    const only = buildPlan(manifests, ['18.1.0/license-key-missing']);
    const reported = async(attributes) => {
      const source = `<script${attributes}>new Handsontable(el, { data: [] });</script>\n`;

      return (await transformFile({ filePath: 'p.html', source, plan: only })).entries
        .filter(entry => entry.ruleId === '18.1.0/license-key-missing').length;
    };

    assert.equal(await reported(' data-src="x"'), 1, 'a data-src script is inline');
    assert.equal(await reported(' SRC="a.js"'), 0, 'a SRC script is external');
    assert.equal(await reported(' src="a.js"'), 0, 'a src script is external');
    assert.equal(await reported(''), 1);
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

  describe('a file with a very long line', () => {
    const IMPORT = 'import Handsontable from \'handsontable\';\n';
    const CALL = 'new Handsontable(el, { correctFormat: true });\n';

    it('is skipped with the reason, and its bytes stay, whether the line is valid code or not', async() => {
      // A minified bundle (valid) and a blob that would not parse: a parse-error would show that the tool read it.
      const bundle = `${IMPORT}${CALL.trim()};var d=[${'1,'.repeat(MAX_LINE_LENGTH / 2)}0];\n`;
      const blob = `// handsontable\n${'x = ;'.repeat((MAX_LINE_LENGTH / 4) + 1)}\n`;
      const lines = { 'bundle.js': bundle, 'blob.ts': blob, 'ok.js': `${IMPORT}${CALL}` };

      await inPlainProject(lines, async(dir) => {
        const result = await run({ cwd: dir, from: '17.1', to: '18.1' });

        assert.equal(result.exitCode, 0, JSON.stringify(result.report.entries));
        assert.deepEqual(result.report.skipped().map(entry => entry.file).sort(), ['blob.ts', 'bundle.js']);
        assert.match(result.report.skipped()[0].message, /has a line of more than 20,000 characters.*not analyzed/);
        assert.deepEqual(result.changedFiles, ['ok.js']);
        assert.equal(await readFile(join(dir, 'bundle.js'), 'utf8'), bundle);
        assert.equal(await readFile(join(dir, 'blob.ts'), 'utf8'), blob);
      });
    });

    it('is read when no line is over the limit, and counts every kind of line break', async() => {
      // Comments keep the parse cheap. A line of exactly the limit passes, and one more character skips the file.
      const exact = `// ${'a'.repeat(MAX_LINE_LENGTH - 3)}`;
      const over = `// ${'a'.repeat(MAX_LINE_LENGTH - 2)}`;
      const cases = {
        'lf.js': `${IMPORT}${CALL}${exact}\n${exact}\n`,
        'crlf.js': `${IMPORT}${CALL}${exact}\r\n${exact}\r\n`,
        'cr.js': `${IMPORT}${CALL}${exact}\r${exact}`,
        'over-crlf.js': `${IMPORT}${CALL}${exact}\r\n${over}\r\n`,
        'over-last.js': `${IMPORT}${CALL}${over}`,
      };

      await inPlainProject(cases, async(dir) => {
        const result = await run({ cwd: dir, from: '17.1', to: '18.1' });

        assert.deepEqual(result.report.skipped().map(entry => entry.file).sort(), ['over-crlf.js', 'over-last.js']);
        assert.deepEqual(result.changedFiles, ['cr.js', 'crlf.js', 'lf.js']);
      });
    });

    it('does not apply to a package.json', async() => {
      const pad = ' '.repeat(MAX_LINE_LENGTH + 5);
      const text = `{"dependencies":{"handsontable":"^17.1.0"},"pad":"${pad}"}\n`;

      await inPlainProject({ 'package.json': text }, async(dir) => {
        const result = await run({ cwd: dir, from: '17.1', to: '18.1' });

        assert.deepEqual(result.changedFiles, ['package.json']);
        assert.match(await readFile(join(dir, 'package.json'), 'utf8'), /\^18\.1\.0/);
      });
    });
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

    // A directory of its own next to the project: a fixed name in the temporary directory is shared by every run.
    const holder = await mkdtemp(join(tmpdir(), 'codemod-report-'));
    const reportFile = join(holder, 'report.md');

    try {
      const result = migrate(dir, [...RANGE, '--report', reportFile]);
      const report = await readFile(reportFile, 'utf8');

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
    } finally {
      await rm(holder, { recursive: true, force: true });
      await removeSampleProject(dir);
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
      await removeSampleProject(dir);
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
      await removeSampleProject(dir);
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

describe('the sample project of the tests does not outlive them', () => {
  const HELPER = new URL('./helpers/sample-project.mjs', import.meta.url).href;
  const SCRIPT = `import { createSampleProject } from ${JSON.stringify(HELPER)};\n`
    + 'process.stdout.write(await createSampleProject());\n';

  /**
   * Make a sample project in a child process that never removes it, and say where it was.
   *
   * @param {Record<string, string>} env Extra environment variables.
   * @returns {{dir: string, stderr: string}} The directory the child made and what it wrote to standard error.
   */
  function forgetful(env) {
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', SCRIPT], {
      encoding: 'utf8',
      env: { ...process.env, CODEMOD_KEEP_PROJECTS: '', ...env },
    });

    assert.equal(child.status, 0, child.stderr);

    return { dir: child.stdout, stderr: child.stderr };
  }

  it('is removed when the process ends, although the test forgot to remove it', () => {
    const { dir, stderr } = forgetful({});

    assert.match(dir, /codemod-e2e-/);
    assert.equal(existsSync(dir), false);
    assert.equal(stderr, '');
  });

  it('stays with CODEMOD_KEEP_PROJECTS set, and the path is printed for a look', async() => {
    const { dir, stderr } = forgetful({ CODEMOD_KEEP_PROJECTS: '1' });

    try {
      assert.equal(existsSync(dir), true);
      assert.ok(stderr.includes(dir), stderr);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('a package.json above the paths of the run', () => {
  const SOURCE = 'import Handsontable from \'handsontable\';\n'
    + 'new Handsontable(el, { data: [], correctFormat: true });\n';
  const ROOT = '{ "dependencies": { "handsontable": "^17.0.0", "react": "^18.0.0" } }\n';

  it('is named in a note when the run covers a folder below it, and is not edited', async() => {
    await inPlainProject({ 'package.json': ROOT, 'src/a.js': SOURCE }, async(dir) => {
      const result = await run({ cwd: dir, paths: ['src'], from: '17.0', to: '18.0', allowDirty: true });
      const note = result.notes.find(text => /package\.json is above the paths/.test(text));

      assert.ok(note, JSON.stringify(result.notes));
      assert.match(note, /It asks for handsontable "\^17\.0\.0", and this run migrates to 18\.0\.0\./);
      assert.ok(result.report.notes.includes(note));
      assert.equal(await readFile(join(dir, 'package.json'), 'utf8'), ROOT);
      assert.deepEqual(result.changedFiles, ['src/a.js']);
    });
  });

  it('says nothing when the run covers it, or when the folder has a package.json of its own', async() => {
    await inPlainProject({ 'package.json': ROOT, 'src/a.js': SOURCE }, async(dir) => {
      const whole = await run({ cwd: dir, paths: ['.'], from: '17.0', to: '18.0', allowDirty: true });
      const bare = await run({ cwd: dir, from: '17.0', to: '18.0', allowDirty: true, dryRun: true });

      assert.equal([...whole.notes, ...bare.notes].some(text => /is above the paths/.test(text)), false);
    });

    await inPlainProject({
      'package.json': ROOT,
      'packages/app/package.json': '{ "dependencies": { "handsontable": "^17.0.0" } }\n',
      'packages/app/a.js': SOURCE,
    }, async(dir) => {
      const result = await run({ cwd: dir, paths: ['packages/app'], from: '17.0', to: '18.0', allowDirty: true });

      assert.equal(result.notes.some(text => /is above the paths/.test(text)), false);
      assert.ok(result.changedFiles.includes('packages/app/package.json'));
    });
  });

  it('says nothing for a package.json above that does not ask for an older version, or names no Handsontable', async() => {
    for (const root of [
      '{ "dependencies": { "handsontable": "^18.0.0" } }\n',
      '{ "dependencies": { "handsontable": "workspace:*" } }\n',
      '{ "dependencies": { "react": "^18.0.0" } }\n',
      '{ not json',
    ]) {
      await inPlainProject({ 'package.json': root, 'src/a.js': SOURCE }, async(dir) => {
        const result = await run({ cwd: dir, paths: ['src'], from: '17.0', to: '18.0', allowDirty: true });

        assert.equal(result.notes.some(text => /is above the paths/.test(text)), false, root);
      });
    }
  });
});
