import assert from 'node:assert/strict';
import { chmod, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { main } from '../src/cli.mjs';
import { SCHEMA_VERSION, cleanDeep, serialize, wantsJson, wantsList } from '../src/json-output.mjs';
import { inPlainProject, migrate, migrateBin } from './helpers/plain-project.mjs';

const TOKEN = 'ghp_SECRETTOKEN0123456789';
const RANGE = ['--from', '17.1', '--to', '18.1'];
const PACKAGE = '{ "dependencies": { "handsontable": "^17.1.0" } }\n';
const GRID = [
  'import Handsontable from \'handsontable\';',
  '',
  'new Handsontable(document.body, {',
  '  licenseKey: \'x\',',
  '  columns: [{ type: \'date\' }, { type: \'numeric\', numericFormat: { pattern: \'0,0.00\' } }],',
  '});',
  '',
].join('\n');
const PROJECT = { 'package.json': PACKAGE, 'src/grid.js': GRID };

/**
 * Parse standard output as the one JSON document it must be, and check that nothing else is there: the text is the
 * document, indented with two spaces, and one line break.
 *
 * @param {string} stdout What the command wrote to standard output.
 * @returns {object} The document.
 */
function documentOf(stdout) {
  const document = JSON.parse(stdout);

  assert.equal(stdout, `${JSON.stringify(document, null, 2)}\n`, 'standard output is exactly one document');

  return document;
}

/**
 * The numbers of the summary line of a text report.
 *
 * @param {string} stdout The text report.
 * @returns {{manual: number, review: number, warning: number, changed: number, files: number}} The counts.
 */
function summaryOf(stdout) {
  const match = new RegExp('^Summary: (\\d+) files? (?:would change|changed), '
    + '(\\d+) rewrites? (?:would be applied|applied), (\\d+) manual steps?, (\\d+) to review, (\\d+) warnings?\\.$',
  'm').exec(stdout);

  assert.ok(match, stdout);

  return { files: Number(match[1]),
    changed: Number(match[2]),
    manual: Number(match[3]),
    review: Number(match[4]),
    warning: Number(match[5]) };
}

describe('wantsJson()', () => {
  it('reads the exact token before a -- terminator', () => {
    assert.equal(wantsJson(['migrate', '--json']), true);
    assert.equal(wantsJson(['--json', '--bogus']), true);
    assert.equal(wantsJson(['migrate', '--json=1']), true, 'a value given to the flag still asks for the document');
    assert.equal(wantsJson(['migrate', '--json=false']), true);
    assert.equal(wantsJson(['migrate', '--jsonx']), false);
    assert.equal(wantsJson(['migrate', '--', '--json']), false);
    assert.equal(wantsJson(['migrate', '--', '--json=1']), false);
    assert.equal(wantsJson(['migrate']), false);
  });
});

describe('wantsList()', () => {
  it('reads the exact token before a -- terminator, as wantsJson() does', () => {
    assert.equal(wantsList(['migrate', '--list']), true);
    assert.equal(wantsList(['--bogus', '--list']), true);
    assert.equal(wantsList(['migrate', '--list=1']), true, 'a value given to the flag still names the mode');
    assert.equal(wantsList(['migrate', '--listing']), false);
    assert.equal(wantsList(['migrate', '--', '--list']), false);
    assert.equal(wantsList(['migrate']), false);
  });
});

describe('cleanDeep() and serialize()', () => {
  it('hides a credential and spells out a control character or a bidirectional override, in every string', () => {
    const document = { a: [`git+https://u:${TOKEN}@h.example/r.git`], b: { c: 'a\u202eb\u001b[2Jc\u0085' }, d: 1 };
    const text = serialize(document);
    const parsed = JSON.parse(text);

    assert.ok(!text.includes(TOKEN));
    assert.equal(parsed.a[0], 'git+https://***@h.example/r.git');
    assert.equal(parsed.b.c, 'a\\u202eb\\x1b[2Jc\\x85');
    assert.equal(parsed.d, 1);
    assert.deepEqual(cleanDeep(['ok', 2, null]), ['ok', 2, null]);
  });
});

describe('--json on a run', () => {
  it('prints one document and nothing else, and the counts are the ones the text report gives', async() => {
    await inPlainProject(PROJECT, async(dir) => {
      const json = await migrate(dir, [...RANGE, '--dry-run', '--json']);
      const text = await migrate(dir, [...RANGE, '--dry-run']);
      const document = documentOf(json.stdout);
      const summary = summaryOf(text.stdout);

      assert.equal(json.status, 0, json.stderr);
      assert.equal(json.status, text.status);
      assert.equal(document.schemaVersion, SCHEMA_VERSION);
      assert.deepEqual(document.tool, { name: '@handsontable/codemod', version: '0.1.0' });
      assert.equal(document.mode, 'run');
      assert.equal(document.from, '17.1');
      assert.equal(document.to, '18.1.0');
      assert.equal(document.dryRun, true);
      assert.equal(document.exitCode, 0);
      assert.equal(document.interrupted, false);
      assert.equal(document.error, null);
      assert.equal(document.counts.changed, summary.changed);
      assert.equal(document.counts.manual, summary.manual);
      assert.equal(document.counts.review, summary.review);
      assert.equal(document.counts.warning, summary.warning);
      assert.equal(document.counts.filesChanged, summary.files);
      assert.ok(document.counts.changed > 0 && document.counts.manual > 0 && document.counts.review > 0);

      for (const severity of ['changed', 'manual', 'review', 'warning']) {
        assert.equal(document.entries.filter(entry => entry.severity === severity).length, document.counts[severity],
          severity);
      }

      assert.ok(!/^(---|\+\+\+|Next:|Summary:)/m.test(json.stdout));
    });
  });

  it('lists the changed files, every entry with its fields, and the diff of each file in a dry run', async() => {
    await inPlainProject(PROJECT, async(dir) => {
      const { stdout } = await migrate(dir, [...RANGE, '--dry-run', '--json']);
      const document = documentOf(stdout);
      const [range] = document.entries.filter(entry => entry.file === 'package.json' && entry.severity === 'changed');
      const pattern = document.entries.find(entry => entry.ruleId === '18.0.0/numbro-pattern');
      const date = document.entries.find(entry => entry.ruleId === '18.0.0/date-default-format');

      assert.deepEqual(document.changedFiles, ['package.json', 'src/grid.js']);
      assert.deepEqual(document.changes.map(change => change.file), ['package.json', 'src/grid.js']);
      assert.match(document.changes[0].diff, /^-.*"\^17\.1\.0"/m);
      assert.match(document.changes[1].diff, /^\+ *\/\/ TODO\(handsontable-codemod 18\.0\.0\/numbro-pattern\)/m);
      assert.ok(range.message.includes('^18.1.0'));
      assert.equal(range.line, null);
      assert.deepEqual(range.lines, []);
      assert.equal(range.marker, false);
      assert.equal(pattern.severity, 'manual');
      assert.equal(pattern.file, 'src/grid.js');
      assert.equal(pattern.line, 5);
      assert.equal(pattern.marker, true);
      assert.match(pattern.guideUrl,
        /^https:\/\/handsontable\.com\/docs\/javascript-data-grid\/migration-from-17\.1-to-18\.0#/);
      assert.equal(date.severity, 'review');
      assert.equal(date.marker, true);
    });
  });

  it('writes the files without a diff, and a second run changes nothing', async() => {
    await inPlainProject(PROJECT, async(dir) => {
      const first = documentOf((await migrate(dir, [...RANGE, '--json'])).stdout);
      const second = documentOf((await migrate(dir, [...RANGE, '--json'])).stdout);

      assert.deepEqual(first.changedFiles, ['package.json', 'src/grid.js']);
      assert.deepEqual(first.changes, []);
      assert.equal(first.dryRun, false);
      assert.match(await readFile(join(dir, 'package.json'), 'utf8'), /\^18\.1\.0/);
      assert.deepEqual(second.changedFiles, []);
      assert.equal(second.counts.changed, 0);
    });
  });

  it('keeps notes on standard error, and lists them in the document too', async() => {
    await inPlainProject(PROJECT, async(dir) => {
      const { stdout, stderr } = await migrate(dir, ['--from', '17.1', '--to', '19', '--json', '--dry-run']);
      const document = documentOf(stdout);

      assert.ok(document.notes.length > 0);

      for (const note of document.notes) {
        assert.ok(stderr.includes(note), note);
      }
    });
  });

  it('lists the changes with no rule of a draft, with the guide link of each', async() => {
    await inPlainProject({ 'package.json': '{ "dependencies": { "handsontable": "^18.1.0" } }\n' }, async(dir) => {
      const { stdout } = await migrate(dir, ['--from', '18.1', '--include-draft', '--dry-run', '--json']);
      const document = documentOf(stdout);
      const item = document.notAutomated.find(entry => entry.guide === 'license-keys-are-checked-more-strictly');

      assert.ok(document.notAutomated.length > 0);
      assert.equal(item.version, '19.0.0');
      assert.equal(item.title, null);
      assert.match(item.guideUrl, /migration-from-18\.1-to-19\.0#license-keys-are-checked-more-strictly$/);
      assert.ok(item.reason.length > 0);
    });
  });

  it('exits 1 with the parse error in the entries and the other files migrated', async() => {
    await inPlainProject({ ...PROJECT, 'src/bad.js': 'import Handsontable from \'handsontable\';\nconst = ;\n' },
      async(dir) => {
        const json = await migrate(dir, [...RANGE, '--json']);
        const text = await migrate(dir, [...RANGE, '--allow-dirty']);
        const document = documentOf(json.stdout);

        assert.equal(json.status, 1);
        assert.equal(document.exitCode, 1);
        assert.ok(document.entries.some(entry => entry.ruleId === 'parse-error' && entry.file === 'src/bad.js'));
        assert.equal(text.status, 1);
      });
  });

  it('says on standard error and in the document which file could not be written, and exits 1', {
    skip: process.platform === 'win32',
  }, async() => {
    await inPlainProject({ ...PROJECT, 'src/ro.js': GRID }, async(dir) => {
      await chmod(join(dir, 'src/ro.js'), 0o444);

      const json = await migrate(dir, [...RANGE, '--json']);
      const text = await migrate(dir, [...RANGE]);
      const document = documentOf(json.stdout);

      assert.equal(json.status, 1);
      assert.equal(text.status, 1);
      assert.match(text.stderr, /^Warning: src\/(?:ro|grid)\.js: The file could not be written: /m);
      assert.match(text.stderr, /^1 file could not be written\. See the warnings above\.$/m);
      assert.match(json.stderr, /^1 file could not be written\. See the warnings above\.$/m);
      assert.equal(document.exitCode, 1);
      assert.match(document.error, /^1 file could not be written\./);
      assert.ok(document.entries.some(entry => entry.ruleId === 'write-error' && entry.file === 'src/ro.js'));
      assert.equal(document.counts.warning >= 1, true);
    });
  });

  it('says in the document that a file could not be read or parsed, and leaves error null for a clean run', async() => {
    await inPlainProject({ ...PROJECT, 'src/bad.js': 'import Handsontable from \'handsontable\';\nconst = ;\n' },
      async(dir) => {
        const failed = documentOf((await migrate(dir, [...RANGE, '--json', '--dry-run'])).stdout);

        assert.match(failed.error, /^1 file could not be read\./);
      });
    await inPlainProject(PROJECT, async(dir) => {
      assert.equal(documentOf((await migrate(dir, [...RANGE, '--json', '--dry-run'])).stdout).error, null);
    });
  });

  it('spells a control character of a file name the same way in the console, the report, and the document', async() => {
    // NTFS refuses a control character in a name, so Windows keeps the bidirectional override only.
    const names = ['a\nb.js', 'e\u001bc.js', 'r\u202etl.js', 'tab\tname.js', 'ls\u2028x.js', 'ps\u2029x.js',
      'zw\u200bx.js', 'bom\ufeffx.js', 'lrm\u200ex.js']
      .filter(name => process.platform !== 'win32' || /[\u202e\u2028\u2029\u200b\ufeff\u200e]/.test(name));
    const spelling = ['a\\x0ab.js', 'e\\x1bc.js', 'r\\u202etl.js', 'tab\\x09name.js', 'ls\\u2028x.js', 'ps\\u2029x.js',
      'zw\\u200bx.js', 'bom\\ufeffx.js', 'lrm\\u200ex.js']
      .filter(name => process.platform !== 'win32' || /u(202e|2028|2029|200b|feff|200e)/.test(name));
    const files = { 'package.json': PACKAGE, ...Object.fromEntries(names.map(name => [`src/${name}`, GRID])) };

    await inPlainProject(files, async(dir) => {
      const args = [...RANGE, '--dry-run', '--only', '18.0.0/numbro-pattern'];
      const text = await migrate(dir, [...args, '--report', 'r.md']);
      const markdown = await readFile(join(dir, 'r.md'), 'utf8');
      const document = documentOf((await migrate(dir, [...args, '--json'])).stdout);
      const fileFields = [...document.changedFiles, ...document.entries.map(entry => entry.file),
        ...document.changes.map(change => change.file)].filter(Boolean);

      for (const name of spelling) {
        assert.ok(text.stdout.includes(`src/${name}`), `console: ${name}`);
        assert.ok(markdown.includes(`src/${name}`), `report: ${name}`);
        assert.ok(document.changedFiles.includes(`src/${name}`), `changedFiles: ${name}`);
      }

      const unsafe = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u;

      assert.ok(fileFields.every(file => !unsafe.test(file)), fileFields.join());
    });
  });

  it('lists the files that were skipped, with the reason, and counts them as warnings', async() => {
    await inPlainProject({ ...PROJECT, 'src/a.less': '@import "handsontable/styles/ht-theme-main.css";\n' },
      async(dir) => {
        const document = documentOf((await migrate(dir, [...RANGE, '--dry-run', '--json'])).stdout);

        assert.deepEqual(document.skipped.map(item => item.file), ['src/a.less']);
        assert.match(document.skipped[0].reason, /\S/);
        assert.ok(document.entries.some(entry => entry.ruleId === 'skipped-file' && entry.severity === 'warning'));
      });
  });

  it('prints a note that holds for every file once, with its files', async() => {
    const types = 'import type { Config } from \'handsontable/plugins/columnSorting\';\nexport let a: Config;\n';

    await inPlainProject({ ...PROJECT, 'src/a.ts': types, 'src/b.ts': types }, async(dir) => {
      const document = documentOf((await migrate(dir, [...RANGE, '--dry-run', '--json'])).stdout);
      const note = document.entries.find(entry => entry.scope === 'run');

      assert.equal(note.file, null);
      assert.equal(note.severity, 'review');
      assert.deepEqual(note.files, ['src/a.ts', 'src/b.ts']);
    });
  });

  it('works with --report: the Markdown file is written and standard output is still the one document', async() => {
    await inPlainProject(PROJECT, async(dir) => {
      const { stdout, stderr } = await migrate(dir, [...RANGE, '--dry-run', '--json', '--report', 'report.md'],
        { writeReport: async(path, text) => {
          assert.ok(path.endsWith('report.md'));
          assert.match(text, /^# Handsontable migration report/);
          assert.match(text, /^## To review$/m);
        } });

      documentOf(stdout);
      assert.match(stderr, /Report written to report\.md\./);
    });
  });

  it('spells out what a file name or a message holds that JSON cannot show, and hides a credential', async() => {
    const spec = `git+https://user:${TOKEN}@github.com/o/r.git#v1`;

    await inPlainProject({
      'package.json': `{ "dependencies": { "handsontable": "${spec}" } }\n`,
      'src/a\u202e.js': GRID,
    }, async(dir) => {
      const { stdout } = await migrate(dir, [...RANGE, '--dry-run', '--json']);
      const document = documentOf(stdout);

      assert.ok(!stdout.includes(TOKEN));
      assert.ok(!stdout.includes('\u202e'));
      assert.ok(document.entries.some(entry => entry.file === 'src/a\\u202e.js'));
      assert.ok(document.entries.some(entry => /\*\*\*@github\.com/.test(entry.message)));
    });
  });

  it('is the same for the executable: standard output holds the document and the exit code is the same', async() => {
    await inPlainProject(PROJECT, async(dir) => {
      const json = migrateBin(dir, [...RANGE, '--dry-run', '--json']);
      const text = migrateBin(dir, [...RANGE, '--dry-run']);

      assert.equal(json.status, text.status);
      assert.equal(documentOf(json.stdout).counts.manual, summaryOf(text.stdout).manual);
    });
  });
});

describe('--json on --list', () => {
  it('lists every rule with its action, class, and guide link, and the counts of the text list', async() => {
    const json = await migrate(process.cwd(), ['--list', '--from', '18.1', '--include-draft', '--json']);
    const text = await migrate(process.cwd(), ['--list', '--from', '18.1', '--include-draft']);
    const document = documentOf(json.stdout);
    const [, total, rewrite, report] = /^(\d+) rules: (\d+) rewrite, (\d+) report\.$/m.exec(text.stdout);
    const rule = document.rules.find(item => item.id === '19.0.0/before-init-option');

    assert.equal(json.status, 0);
    assert.equal(document.mode, 'list');
    assert.equal(document.counts.rules, Number(total));
    assert.equal(document.counts.rewrite, Number(rewrite));
    assert.equal(document.counts.report, Number(report));
    assert.equal(document.rules.length, Number(total));
    assert.ok(document.counts.notAutomated > 0);
    assert.equal(document.notAutomated.length, document.counts.notAutomated);
    assert.deepEqual({ ...rule }, {
      id: '19.0.0/before-init-option',
      version: '19.0.0',
      kind: 'detect',
      action: 'report',
      severity: 'review',
      guideUrl: 'https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0'
        + '#a-beforeinit-callback-in-your-settings-now-runs',
      implemented: true,
    });
    assert.equal(document.rules.find(item => item.id === '19.0.0/dependencies').action, 'rewrite');
    assert.equal(document.rules.find(item => item.id === '19.0.0/dependencies').severity, null);
  });
});

describe('--json on an error', () => {
  it('prints a document with the error and the exit code for a usage error, and the text stays on stderr', async() => {
    const result = await migrate(process.cwd(), ['--json', '--bogus']);
    const document = documentOf(result.stdout);

    assert.equal(result.status, 2);
    assert.equal(document.exitCode, 2);
    assert.equal(document.error, 'Unknown option "--bogus".');
    assert.deepEqual(document.entries, []);
    assert.equal(document.counts.manual, 0);
    assert.match(result.stderr, /^Unknown option "--bogus"\./);
  });

  it('honors --json for a flag that parseArgs rejects, before the arguments are read', async() => {
    const result = await migrate(process.cwd(), ['--from', '--json']);

    assert.equal(result.status, 2);
    assert.equal(documentOf(result.stdout).exitCode, 2);
  });

  it('prints the error document of a run that was refused, with the shape of a run', async() => {
    await inPlainProject({ 'src/a.js': GRID }, async(dir) => {
      const result = await migrate(dir, ['--json']);
      const document = documentOf(result.stdout);

      assert.equal(result.status, 2);
      assert.equal(document.exitCode, 2);
      assert.match(document.error, /Pass --from/);
      assert.equal(document.mode, 'run');
      assert.deepEqual(document.changedFiles, []);
      assert.deepEqual(document.changes, []);
      assert.match(result.stderr, /Pass --from/);
    });
  });

  it('prints the error document of an unknown rule id, and of a missing command', async() => {
    await inPlainProject(PROJECT, async(dir) => {
      const rule = await migrate(dir, [...RANGE, '--only', 'nope', '--json']);
      let out = '';
      const none = await main(['--json'], { cwd: dir,
        stdout: (text) => {
          out += text;
        },
        stderr: () => {} });

      assert.equal(rule.status, 2);
      assert.match(documentOf(rule.stdout).error, /Unknown rule id: nope/);
      assert.equal(none, 2);
      assert.equal(documentOf(out).error, 'Missing command.');
    });
  });

  it('prints the shape of a list for an error of --list', async() => {
    const result = await migrate(process.cwd(), ['--list', '--from', '99', '--json']);
    const document = documentOf(result.stdout);

    assert.equal(result.status, 2);
    assert.equal(document.mode, 'list');
    assert.deepEqual(document.rules, []);
  });

  it('delivers the usage error of --json=<value> and --list=<value> as the document, with the message', async() => {
    for (const value of ['1', 'true', 'false', '']) {
      const result = await migrate(process.cwd(), [`--json=${value}`]);
      const document = documentOf(result.stdout);

      assert.equal(result.status, 2, value);
      assert.equal(document.exitCode, 2);
      assert.equal(document.error, `Option "--json" takes no value, so "--json=${value}" is not valid.`);
      assert.equal(document.mode, 'run');
      assert.match(result.stderr, /takes no value/);
    }

    const list = await migrate(process.cwd(), ['--list=1', '--json']);
    const listDocument = documentOf(list.stdout);

    assert.equal(list.status, 2);
    assert.equal(listDocument.mode, 'list');
    assert.deepEqual(listDocument.rules, []);
    assert.equal(listDocument.error, 'Option "--list" takes no value, so "--list=1" is not valid.');

    const listOnly = await migrate(process.cwd(), ['--list=1']);

    assert.equal(listOnly.status, 2);
    assert.equal(listOnly.stdout, '', 'without --json the text stays on standard error');
  });

  it('spells a line break or an escape of a path argument, an option, or a report path the same way as a file name', async() => {
    await inPlainProject(PROJECT, async(dir) => {
      const path = 'no\u001b[31mpath\nx';
      const spelled = 'no\\x1b[31mpath\\x0ax';
      const missing = await migrate(dir, [...RANGE, path, '--json']);
      const option = await migrate(dir, ['--bog\nus', '--json']);
      const report = await migrate(dir, [...RANGE, '--report', 'no\nfolder/r.md', '--json']);
      let out = '';
      const command = await main(['no\nverb', '--json'], {
        cwd: dir,
        stdout: (text) => {
          out += text;
        },
        stderr: () => {},
      });

      assert.equal(documentOf(missing.stdout).error, `"${spelled}" does not exist.`);
      assert.ok(missing.stderr.includes(`"${spelled}" does not exist.\n`), missing.stderr);
      assert.equal(documentOf(option.stdout).error, 'Unknown option "--bog\\x0aus".');
      assert.ok(option.stderr.startsWith('Unknown option "--bog\\x0aus".\n'), option.stderr);
      assert.match(documentOf(report.stdout).error,
        /^--report no\\x0afolder\/r\.md: the directory no\\x0afolder does not exist\./);
      assert.equal(command, 2);
      assert.equal(documentOf(out).error, 'Unknown command "no\\x0averb".');
    });
  });

  it('does not honor --help or --version, which print their own text, and ignores a flag after --', async() => {
    const help = await migrate(process.cwd(), ['--help', '--json']);
    const after = await migrate(process.cwd(), ['--', '--json=1']);

    assert.equal(help.status, 0);
    assert.match(help.stdout, /^Usage: handsontable-codemod migrate/);
    assert.equal(after.stdout, '', 'a token after -- is a path, not a flag');
  });

  it('prints the document of an interrupted run with interrupted set, and exits 130', async() => {
    await inPlainProject(PROJECT, async(dir) => {
      const controller = new AbortController();

      controller.abort();

      const result = await migrate(dir, [...RANGE, '--json'], { signal: controller.signal });
      const document = documentOf(result.stdout);

      assert.equal(result.status, 130);
      assert.equal(document.exitCode, 130);
      assert.equal(document.interrupted, true);
    });
  });
});
