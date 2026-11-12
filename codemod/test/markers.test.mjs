import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { main } from '../src/cli.mjs';
import { Report, renderConsole, renderMarkdown } from '../src/report.mjs';
import { resolvePlan, run, transformFile } from '../src/runner.mjs';
import { VERSIONS_DIR, buildPlan, loadManifests } from '../src/manifest.mjs';

/**
 * Write a project under the OS temp directory (never inside the monorepo) and hand its path to the callback. The
 * project has no git repository, so a run may write.
 *
 * @param {Record<string, string>} files File contents by relative path.
 * @param {(dir: string) => Promise<void>} callback Test body.
 * @returns {Promise<void>}
 */
async function inProject(files, callback) {
  const dir = await mkdtemp(join(tmpdir(), 'codemod-markers-'));

  try {
    for (const [name, content] of Object.entries(files)) {
      await mkdir(dirname(join(dir, name)), { recursive: true });
      await writeFile(join(dir, name), content);
    }

    await callback(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/**
 * Run the whole 17.1 to 18.1 chain over one file text.
 *
 * @param {string} source File text.
 * @param {string} filePath File name.
 * @param {object} [options] Run options.
 * @returns {Promise<{output: string, entries: object[], changed: boolean}>} The outcome.
 */
async function chain(source, filePath, options = {}) {
  const plan = buildPlan(await loadManifests(VERSIONS_DIR));

  return transformFile({ filePath, source, plan, options });
}

const HOT = 'import Handsontable from \'handsontable\';\n';

describe('TODO markers for manual entries', () => {
  it('leaves one at the line of a manual entry in a js file, and not a second one on the next run', async() => {
    const source = `${HOT}new Handsontable(el, {\n  data: [],\n`
      + '  columns: [{ type: \'date\', dateFormat: \'DD/MM/YYYY\' }],\n});\n';
    const first = await chain(source, 'a.js');
    const marker = /\/\/ TODO\(handsontable-codemod 18\.0\.0\/moment-date-format\): Replace the string dateFormat /;

    assert.match(first.output, marker);
    assert.equal(first.entries.find(entry => entry.ruleId === '18.0.0/moment-date-format').marked, true);

    const second = await chain(first.output, 'a.js');

    assert.equal(second.changed, false);
    assert.equal(second.output.match(/moment-date-format\)/g).length, 1);
    assert.equal(second.entries.find(entry => entry.ruleId === '18.0.0/moment-date-format').marked, true);
  });

  it('leaves none under todo: false, and none for a run-wide note or a rule that says todo: false', async() => {
    const source = `${HOT}new Handsontable(el, { columns: [{ type: 'date', dateFormat: 'DD/MM/YYYY' }], data: [] });\n`;
    const off = await chain(source, 'a.js', { todo: false });
    const noLicense = await chain(`${HOT}new Handsontable(el, { data: [] });\n`, 'b.js');

    assert.equal(off.output, source);
    assert.equal(off.entries.some(entry => entry.marked), false);
    assert.equal(noLicense.output.includes('TODO('), false);
    assert.equal(noLicense.entries.some(entry => entry.ruleId === '18.1.0/license-key-missing'), true);
  });

  it('leaves none under todo: false even where a transform writes a comment itself', async() => {
    const source = `${HOT}new Handsontable(el, { correctFormat: true, data: [] });\n`;
    const on = await chain(source, 'a.js');
    const off = await chain(source, 'a.js', { todo: false });

    assert.match(on.output,
      /TODO\(handsontable-codemod 18\.0\.0\/correct-format-removed\): Deleted correctFormat here\./);
    assert.equal(off.output.includes('TODO('), false);
    assert.equal(off.output.includes('correctFormat'), false);
  });

  it('puts a marker at each line of a collapsed entry', async() => {
    const lines = Array.from({ length: 7 },
      (_, index) => `new Handsontable(el${index}, { columns: [{ dateFormat: 'D' }] });\n`);
    const result = await chain(`${HOT}${lines.join('')}`, 'a.js');
    const entry = result.entries.find(item => item.ruleId === '18.0.0/moment-date-format' && item.lines);

    assert.equal(entry.lines.length, 7);
    assert.equal(result.output.match(/TODO\(handsontable-codemod 18\.0\.0\/moment-date-format\)/g).length, 7);
  });

  it('keeps JSX valid: a JSX comment before a child element, a line comment on the statement otherwise', async() => {
    const source = 'import { HotTable, HotColumn } from \'@handsontable/react-wrapper\';\n'
      + 'export const A = () => (\n  <HotTable data={[]}>\n'
      + '    <HotColumn type="numeric" numericFormat={{ pattern: \'0.0\' }} />\n  </HotTable>\n);\n'
      + 'export const B = () => <HotTable data={[]} columns={[{ numericFormat: { pattern: \'0\' } }]} />;\n';
    const first = await chain(source, 'a.tsx');
    const second = await chain(first.output, 'a.tsx');

    assert.match(first.output, /\{\/\* TODO\(handsontable-codemod 18\.0\.0\/numbro-pattern\)/);
    assert.equal(first.entries.some(entry => entry.ruleId === 'parse-error'), false);
    assert.equal(second.entries.some(entry => ['parse-error', 'transform-error'].includes(entry.ruleId)), false);
    assert.equal(second.changed, false);
  });

  it('never puts a comment between a signature and its body', async() => {
    const source = `${HOT}new Handsontable(el, {\n  sanitizer: function(c, s) {\n`
      + '    return s === \'innerHTML\' ? c : c;\n  },\n});\n';
    const result = await chain(source, 'a.js');

    assert.doesNotMatch(result.output, /\) \/\/ TODO|=> \/\/ TODO/);
    assert.equal((await chain(result.output, 'a.js')).changed, false);
  });

  it('leaves no marker in an HTML page, and none for a manual entry the tool cannot place', async() => {
    const page = '<script>\n  new Handsontable(el, { data: [], columns: [{ dateFormat: \'D\' }] });\n</script>\n';
    const result = await chain(page, 'index.html');

    assert.equal(result.output, page);
    assert.equal(result.entries.some(entry => entry.marked), false);
  });
});

describe('the markers in the CSS family', () => {
  const css = '.a {\n  --ht-wrapper-border-width: 2px;\n}\n';

  it('writes a block comment with a space before the closing mark', async() => {
    const result = await chain(css, 'a.css');

    assert.match(result.output, /#update-theme-wrapper-border-variables \*\/\n/);
    assert.doesNotMatch(result.output, /[^ ]\*\//);
  });

  it('writes a line comment in a SCSS file that already uses them, and a block comment otherwise', async() => {
    const withLine = await chain(`// Brand tokens.\n${css}`, 'a.scss');
    const without = await chain(`/* Brand tokens. */\n${css}`, 'b.scss');
    const oneLine = await chain('.a { --ht-wrapper-border-width: 2px; }\n// note\n', 'c.scss');

    assert.match(withLine.output, /^ {2}\/\/ TODO\(handsontable-codemod 18\.0\.0\/css-wrapper-border-width\)/m);
    assert.match(without.output, /^ {2}\/\* TODO\(handsontable-codemod 18\.0\.0\/css-wrapper-border-width\)/m);
    assert.match(oneLine.output, /\{ \/\* TODO\(handsontable-codemod [^)]+\)[^]*\*\/ --ht-wrapper-border-width/);
    assert.equal((await chain(withLine.output, 'a.scss')).changed, false);
  });
});

describe('the closing lines of the CLI', () => {
  /**
   * Run the CLI in process on a directory.
   *
   * @param {string[]} argv Arguments.
   * @param {string} cwd Working directory.
   * @returns {Promise<{code: number, out: string, err: string}>} Exit code and streams.
   */
  async function cli(argv, cwd) {
    let out = '';
    let err = '';
    const code = await main(argv, {
      cwd,
      stdout: (text) => {
        out += text;
      },
      stderr: (text) => {
        err += text;
      },
    });

    return { code, out, err };
  }

  const FILES = {
    'package.json': '{ "dependencies": { "handsontable": "^17.1.0" } }\n',
    'src/a.js': `${HOT}new Handsontable(el, { licenseKey: 'k', data: [], columns: [{ dateFormat: 'DD/MM/YYYY' }] });\n`,
    'index.html': '<script>\n  new Handsontable(el, { data: [] });\n</script>\n',
  };

  it('says how many manual steps have a marker and how many are in the report only', async() => {
    await inProject(FILES, async(dir) => {
      const result = await cli(['migrate', '--from', '17.1', '--to', '18.1'], dir);

      assert.match(result.out, new RegExp('^Next: work through the \\d+ manual steps in the report\\. '
        + '\\d+ of \\d+ are marked in the code; the rest are listed in the report only\\.$', 'm'));
      assert.match(result.out, /^Next: find the markers with: git grep "TODO\(handsontable-codemod"$/m);
    });
  });

  it('prints the work-through line even when no file changed, and no marker search when there is no marker', async() => {
    await inProject({ 'index.html': FILES['index.html'] }, async(dir) => {
      const result = await cli(['migrate', '--from', '18.0', '--to', '18.1'], dir);

      assert.doesNotMatch(result.out, /^Next: run /m);
      assert.match(result.out,
        /^Next: work through the 1 manual step in the report\. They are listed in the report only\.$/m);
      assert.doesNotMatch(result.out, /git grep/);
    });
  });

  it('switches every marker off with --no-todo, and lists every step in the report only', async() => {
    await inProject(FILES, async(dir) => {
      const result = await cli(['migrate', '--from', '17.1', '--to', '18.1', '--no-todo'], dir);
      const code = await readFile(join(dir, 'src/a.js'), 'utf8');

      assert.equal(result.code, 0, result.err);
      assert.equal(code.includes('TODO('), false);
      assert.match(result.out, /They are listed in the report only\./);
      assert.doesNotMatch(result.out, /git grep/);
    });
  });

  it('documents --no-todo in the help', async() => {
    const result = await cli(['--help'], tmpdir());

    assert.match(result.out, /^ {2}--no-todo /m);
  });

  it('says where the full list is when --report names a file, instead of asking for one', async() => {
    const files = { 'package.json': FILES['package.json'] };

    for (let index = 0; index < 12; index += 1) {
      files[`src/f${index}.js`] = `${HOT}new Handsontable(el, { licenseKey: 'k', columns: [{ dateFormat: 'D' }] });\n`;
    }

    await inProject(files, async(dir) => {
      const without = await cli(['migrate', '--from', '17.1', '--to', '18.1', '--dry-run'], dir);
      const withFile = await cli(['migrate', '--from', '17.1', '--to', '18.1', '--dry-run', '--report',
        join(tmpdir(), 'codemod-markers-report.md')], dir);

      assert.match(without.out, /\+\d+ more \(use --report <file> for the full list\)/);
      assert.doesNotMatch(withFile.out, /use --report <file>/);
      assert.match(withFile.out, /\+\d+ more in .*codemod-markers-report\.md/);
    });
  });

  it('prints a summary line on stderr when a file could not be read, and keeps the report on stdout', async() => {
    const files = { 'package.json': FILES['package.json'], 'src/broken.js': `${HOT}const x = {\n  a: 1,\n` };

    await inProject(files, async(dir) => {
      const result = await cli(['migrate', '--from', '17.1', '--to', '18.1'], dir);

      assert.equal(result.code, 1);
      assert.match(result.err, /^1 file could not be read\. See the warnings above\.$/m);
      assert.match(result.out, /parse-error/);
    });
  });
});

describe('a parse error', () => {
  it('is reported on the last line, as an unexpected end of file, when the text ends too early', async() => {
    const result = await chain(`${HOT}new Handsontable(el, {\n  data: [\n`, 'a.js');
    const [entry] = result.entries;

    assert.equal(entry.ruleId, 'parse-error');
    assert.equal(entry.line, 3);
    assert.match(entry.message, /skipped: unexpected end of file\.$/);
  });

  it('keeps the parser message and shows the source line, cut to 80 characters, for another error', async() => {
    const long = `const value = ${'x'.repeat(100)} @@@ ;`;
    const result = await chain(`${HOT}const a = 1;\n${long}\nconst b = 2;\n`, 'a.js');
    const [entry] = result.entries;

    assert.equal(entry.ruleId, 'parse-error');
    assert.equal(entry.line, 3);
    assert.match(entry.message, /skipped: Missing semicolon, at: const value = x{66}$/);
  });
});

describe('the markdown report', () => {
  it('keeps every checkbox in its own list and every shared message in its own paragraph', () => {
    const report = new Report();

    report.add({ ruleId: '18.0.0/r', severity: 'manual', file: 'a.js', line: 1, message: 'Alone.' });
    report.add({ ruleId: '18.0.0/r', severity: 'manual', file: 'b.js', line: 2, message: 'Shared message.' });
    report.add({ ruleId: '18.0.0/r', severity: 'manual', file: 'c.js', line: 3, message: 'Shared message.' });
    report.add({ ruleId: '18.0.0/r', severity: 'changed', file: 'd.js', line: 4, message: 'Another one alone.' });
    report.add({ ruleId: '18.0.0/r', severity: 'manual', file: 'e.js', line: 5, message: 'Other shared.' });
    report.add({ ruleId: '18.0.0/r', severity: 'manual', file: 'f.js', line: 6, message: 'Other shared.' });

    const lines = renderMarkdown(report).split('\n');
    const isItem = line => /^- \[[ x]\] /.test(line);

    lines.forEach((line, index) => {
      const before = lines[index - 1];

      if (isItem(line) && index > 0) {
        assert.ok(before === '' || isItem(before) || /^ +- /.test(before), `item without a blank line: ${line}`);
      }

      if (line !== '' && !isItem(line) && !/^[#>]|^ +- |^Guide: |^Summary: /.test(line) && index > 0) {
        assert.ok(before === '', `paragraph that follows a line of text: ${line}`);
      }
    });

    assert.match(renderMarkdown(report),
      /- \[ \] a\.js:1 Alone\.\n\nShared message\.\n\n- \[ \] b\.js:2\n- \[ \] c\.js:3\n/);
  });

  it('names the report file in the console, and tells the user to pass --report otherwise', () => {
    const report = new Report();

    for (let line = 1; line <= 12; line += 1) {
      report.add({ ruleId: '18.0.0/r', severity: 'manual', file: 'a.js', line, message: `m${line}` });
    }

    assert.match(renderConsole(report, { reportFile: 'out/report.md' }), /\+2 more in out\/report\.md$/m);
    assert.match(renderConsole(report), /\+2 more \(use --report <file> for the full list\)$/m);
  });
});

describe('symbolic links the run does not follow', () => {
  it('says where an in-project link points, and whether the run migrates the target', async() => {
    const css = '.a { --ht-wrapper-border-radius: 1px; }\n';

    await inProject({ 'src/real.css': css, 'other/skipped.txt': 'x' }, async(dir) => {
      await symlink(join(dir, 'src/real.css'), join(dir, 'link.css'));
      await symlink(join(dir, 'other/skipped.txt'), join(dir, 'text-link.css'));

      const result = await run({ cwd: dir, from: '17.1', to: '18.0', dryRun: true });
      const message = file => result.report.skipped().find(entry => entry.file === file).message;

      assert.equal(message('link.css'), 'This is a symbolic link to src/real.css, not followed. The target is '
        + 'migrated as its own file.');
      assert.equal(message('text-link.css'), 'This is a symbolic link to other/skipped.txt, not followed. The target '
        + 'is not part of this run.');
    });
  });

  it('keeps the general advice for a link to a place outside the project', async() => {
    const outside = await mkdtemp(join(tmpdir(), 'codemod-markers-outside-'));

    try {
      await writeFile(join(outside, 'x.css'), '.a { --ht-wrapper-border-radius: 1px; }\n');
      await inProject({ 'src/real.css': '.b {}\n' }, async(dir) => {
        await symlink(join(outside, 'x.css'), join(dir, 'out.css'));

        const result = await run({ cwd: dir, from: '17.1', to: '18.0', dryRun: true });

        assert.match(result.report.skipped().find(entry => entry.file === 'out.css').message,
          /A link can point outside the project\. Migrate the file it points to in its own project\./);
      });
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });
});

describe('detecting --from in a monorepo', () => {
  const pkg = range => `${JSON.stringify({ dependencies: { handsontable: range } })}\n`;

  it('says the packages differ when they declare different versions, and names them', async() => {
    await inProject({
      'package.json': '{ "private": true }\n',
      'packages/a/package.json': pkg('^17.1.0'),
      'packages/b/package.json': pkg('^18.0.0'),
    }, async(dir) => {
      await assert.rejects(resolvePlan({ cwd: dir }), {
        message: 'The packages use different Handsontable versions (packages/a: 17.1.0, packages/b: 18.0.0). '
          + 'Pass --from, or run the tool on each package.',
      });
    });
  });

  it('uses the version the packages agree on, and says which files it came from', async() => {
    await inProject({
      'package.json': '{ "private": true }\n',
      'packages/a/package.json': pkg('^17.1.0'),
      'packages/b/package.json': pkg('~17.1.0'),
    }, async(dir) => {
      const { fromText, notes } = await resolvePlan({ cwd: dir });

      assert.equal(fromText, '17.1.0');
      assert.ok(notes.includes('Detected --from 17.1.0 (packages/a/package.json, packages/b/package.json).'));
    });
  });

  it('names every path package.json in the message that says the project is already on the target', async() => {
    await inProject({
      'package.json': '{ "private": true }\n',
      'packages/a/package.json': pkg('^18.1.0'),
      'packages/b/package.json': pkg('18.1.0'),
    }, async(dir) => {
      await assert.rejects(resolvePlan({ cwd: dir, paths: ['packages/a', 'packages/b'] }), {
        message: /^packages\/a\/package\.json and packages\/b\/package\.json already name 18\.1\.0, so there is /,
      });
    });
  });
});

describe('a Vue style block that reads a file', () => {
  const sfc = '<template><div /></template>\n<style src="./theme.css"></style>\n'
    + '<script>\nimport Handsontable from \'handsontable\';\n</script>\n';

  it('is not listed as skipped when the run migrates the target, and is when it does not', async() => {
    await inProject({ 'A.vue': sfc, 'theme.css': '.a { --ht-wrapper-border-radius: 1px; }\n' }, async(dir) => {
      const both = await run({ cwd: dir, from: '17.1', to: '18.0', dryRun: true });
      const only = await run({ cwd: dir, paths: ['A.vue'], from: '17.1', to: '18.0', dryRun: true });

      assert.deepEqual(both.report.skipped().map(entry => entry.file), []);
      assert.equal(only.report.skipped()[0].message, 'A <style src> block was not analyzed. It reads theme.css, '
        + 'which is not part of this run. Check it by hand.');
    });
  });
});

describe('inline scripts of an HTML page', () => {
  it('lists what to check by hand for the selected migrations, and flags a grid with no licenseKey', async() => {
    const page = '<script>\n  new Handsontable(el, { data: [] });\n'
      + '  new Handsontable(el2, { licenseKey: \'k\', data: [] });\n'
      + '  new Handsontable(el3, config);\n</script>\n';
    const to181 = await chain(page, 'index.html');
    const from181 = await transformFile({
      filePath: 'index.html',
      source: page,
      plan: buildPlan((await loadManifests(VERSIONS_DIR)).filter(manifest => manifest.version === '18.1.0')),
    });
    const note = result => result.entries.find(entry => entry.ruleId === 'skipped-file').message;
    const missing = result => result.entries.filter(entry => entry.ruleId === '18.1.0/license-key-missing');

    assert.match(note(from181),
      /Check by hand: the license key, loading title and description markup, sanitizer source values\.$/);
    assert.match(note(to181), /numeric and date formats, removed options/);
    assert.deepEqual(missing(from181).map(entry => entry.line), [2]);
    assert.match(missing(from181)[0].message, /^Pass a valid licenseKey to this grid, because it sets none\./);
    assert.equal(from181.output, page);
  });
});
