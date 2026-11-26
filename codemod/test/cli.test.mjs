import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { main, nextSteps } from '../src/cli.mjs';
import { loadManifests } from '../src/manifest.mjs';
import { run } from '../src/runner.mjs';
import { isolatedGitEnv } from './helpers/git-env.mjs';

const BIN = fileURLToPath(new URL('../bin/handsontable-codemod.mjs', import.meta.url));
const CSS = 'a {\n  border-radius: var(--ht-wrapper-border-radius);\n}\n';

/**
 * Run the CLI in process and capture its output.
 *
 * Without a `cwd` the CLI runs in an empty directory made for the call and removed after it, never in the host's
 * temporary directory itself: a case that reaches the migration by mistake would then rewrite whatever else sits
 * there, and the temporary directory of a developer holds other projects.
 *
 * @param {string[]} argv Arguments.
 * @param {string} [cwd] Working directory.
 * @returns {Promise<{code: number, out: string, err: string}>} Exit code and captured streams.
 */
async function cli(argv, cwd) {
  const own = cwd === undefined ? await mkdtemp(join(tmpdir(), 'codemod-cli-empty-')) : null;
  let out = '';
  let err = '';

  try {
    const code = await main(argv, { cwd: cwd ?? own,
      stdout: (text) => {
        out += text;
      },
      stderr: (text) => {
        err += text;
      } });

    return { code, out, err };
  } finally {
    if (own !== null) {
      await rm(own, { recursive: true, force: true });
    }
  }
}

/**
 * Write one version directory with a manifest into a temporary versions directory.
 *
 * @param {string} root Versions directory.
 * @param {string} version Version directory name.
 * @param {object} manifest Fields that replace the defaults of a valid manifest.
 * @returns {Promise<void>}
 */
async function writeVersion(root, version, manifest) {
  const dir = join(root, version);

  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'manifest.json'), JSON.stringify({
    version,
    from: '18',
    status: 'released',
    guide: { url: 'https://example.com/guide', source: 'docs/guide.md' },
    rules: [],
    ...manifest,
  }));
}

/**
 * Create a temporary project with one stylesheet, optionally as a committed git repository.
 *
 * @param {boolean} repo Whether to initialize and commit.
 * @returns {Promise<string>} The project directory.
 */
async function makeProject(repo) {
  const dir = await mkdtemp(join(tmpdir(), 'codemod-cli-'));

  await writeFile(join(dir, 'a.css'), CSS);

  if (repo) {
    const env = isolatedGitEnv();

    const identity = ['-c', 'user.name=T', '-c', 'user.email=t@example.com', '-c', 'commit.gpgsign=false'];

    for (const args of [['init', '-q'], ['add', '-A'], [...identity, 'commit', '-q', '-m', 'init']]) {
      execFileSync('git', args, { cwd: dir, env, stdio: 'ignore' });
    }
  }

  return dir;
}

describe('cli', () => {
  it('prints help with exit code 0', async() => {
    const { code, out } = await cli(['--help']);

    assert.equal(code, 0);
    assert.match(out, /Usage: handsontable-codemod migrate/);
    assert.match(out, /--include-draft/);
    assert.match(out, /^ {2}130 {2}Stopped with Ctrl-C \(SIGINT\)\.$/m);
  });

  it('answers a bad option with one sentence, the usage line, and exit code 2', async() => {
    const unknown = await cli(['migrate', '--bogus']);
    const missing = await cli(['migrate', '--from']);

    assert.equal(unknown.code, 2);
    assert.equal(unknown.err,
      'Unknown option "--bogus".\nUsage: handsontable-codemod migrate [paths...] [options]\n'
      + 'Run with --help for all options.\n');
    assert.equal(missing.code, 2);
    assert.match(missing.err, /^Option "--from" needs a value\.\nUsage: /);
  });

  it('treats an empty --from or --to as a missing value, not as no value', async() => {
    for (const flag of ['--from', '--to']) {
      const empty = await cli(['migrate', flag, '', '--dry-run']);
      const inline = await cli(['migrate', `${flag}=`, '--dry-run']);

      for (const result of [empty, inline]) {
        assert.equal(result.code, 2, flag);
        assert.ok(result.err.startsWith(`Option "${flag}" needs a value.\nUsage: `), result.err);
      }
    }
  });

  it('lists the rules of a project whose handsontable range is a tag, from the beginning', async() => {
    const dir = await mkdtemp(join(tmpdir(), 'codemod-cli-tag-'));

    try {
      await writeFile(join(dir, 'package.json'), '{ "dependencies": { "handsontable": "latest" } }\n');

      const listed = await cli(['migrate', '--list'], dir);
      const migrate = await cli(['migrate', '--dry-run', '.'], dir);

      assert.equal(listed.code, 0, listed.err);
      assert.match(listed.out.trimEnd().split('\n').pop(), /^\d+ rules: \d+ rewrite, \d+ report\.$/);
      assert.equal(migrate.code, 2);
      assert.match(migrate.err, /names handsontable as "latest", which is not a version\. Pass --from\./);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('prints the help for -h and the package version for --version', async() => {
    const short = await cli(['-h']);
    const version = await cli(['--version']);
    const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

    assert.equal(short.code, 0);
    assert.match(short.out, /^Usage: handsontable-codemod migrate/);
    assert.equal(version.code, 0);
    assert.equal(version.out, `${manifest.version}\n`);
  });

  it('documents every flag and every exit code in the help', async() => {
    const { out } = await cli(['--help']);

    for (const flag of ['from', 'to', 'dry-run', 'allow-dirty', 'report', 'only', 'list', 'json', 'fail-on-manual',
      'aggressive', 'include-draft', 'allow-uncovered', 'version']) {
      assert.match(out, new RegExp(`^ {2}--${flag}\\b`, 'm'), flag);
    }

    assert.match(out, /^ {2}-h, --help /m);

    assert.match(out, /^ {2}paths /m);
    assert.match(out, /^ {2}0 {2}Done\./m);
    assert.match(out, /^ {2}1 {2}A file could not be read/m);
    assert.match(out, /^ {2}2 {2}Usage error or refusal/m);
    assert.match(out, /^ {2}3 {2}The run finished and left manual steps, and --fail-on-manual was given\./m);
  });

  it('prints the usage on stderr for an unknown flag, with exit code 2', async() => {
    const { code, out, err } = await cli(['migrate', '--bogus']);

    assert.equal(code, 2);
    assert.equal(out, '');
    assert.match(err, /--bogus/);
    assert.match(err, /Usage: handsontable-codemod migrate/);
  });

  it('exits 2 with a clear message when --from is missing and cannot be detected', async() => {
    const dir = await mkdtemp(join(tmpdir(), 'codemod-cli-empty-'));

    try {
      const { code, err } = await cli(['migrate'], dir);

      assert.equal(code, 2);
      assert.match(err, /Cannot tell which Handsontable version this project uses/);
      assert.match(err, /Pass --from/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('exits 2 and lists the known migrations when --from is not below --to', async() => {
    const known = (await loadManifests())
      .map(manifest => `${manifest.version}${manifest.status === 'draft' ? ' (draft)' : ''}`).join(', ')
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    for (const args of [['--from', '18.1', '--to', '18.1'], ['--from', '18.1', '--to', '18'],
      ['--from', '19', '--to', '18.0']]) {
      const { code, err } = await cli(['migrate', ...args]);

      assert.equal(code, 2, args.join(' '));
      assert.match(err, /Nothing to migrate from .* to /);
      assert.match(err, new RegExp(`Known migrations: ${known}\\.`));
    }
  });

  it('exits 2 when --only selects no rule', async() => {
    const { code, err } = await cli(['migrate', '--from', '17', '--only', '18.0.0/type-nope-*']);

    assert.equal(code, 2);
    assert.match(err, /Unknown rule id: 18\.0\.0\/type-nope-\*/);
  });

  it('accepts a full rule id and a prefix that ends in * for --only', async() => {
    const one = await cli(['migrate', '--list', '--from', '17', '--only', '18.0.0/css-wrapper-border-radius']);
    const prefix = await cli(['migrate', '--list', '--from', '17', '--only', '18.0.0/type-*']);
    const both = await cli(['migrate', '--list', '--from', '17', '--only', '18.0.0/type-*', '--only',
      '18.0.0/css-wrapper-border-radius']);
    const ids = text => text.split('\n').filter(line => /^\d+\.\d+\.\d+\//.test(line));

    assert.equal(ids(one.out).length, 1);
    assert.ok(ids(prefix.out).length > 10);
    assert.ok(ids(prefix.out).every(line => line.startsWith('18.0.0/type-')));
    assert.equal(ids(both.out).length, ids(prefix.out).length + 1);
  });

  it('ends the list with the number of rules that rewrite and that only report', async() => {
    const { out } = await cli(['migrate', '--list', '--from', '17', '--to', '18.1']);
    const rows = out.split('\n').filter(line => /^\d+\.\d+\.\d+\//.test(line));
    const rewrite = rows.filter(line => /\srewrite$/.test(line)).length;
    const report = rows.filter(line => /\sreport$/.test(line)).length;

    assert.ok(rewrite > 0 && report > 0);
    assert.equal(rewrite + report, rows.length, 'every rule has a transform');
    assert.match(out, new RegExp(`^${rows.length} rules: ${rewrite} rewrite, ${report} report\\.$`, 'm'));
  });

  it('exits 2 for an unknown flag, a missing command, and an unknown command', async() => {
    assert.equal((await cli(['migrate', '--bogus'])).code, 2);
    assert.equal((await cli([])).code, 2);
    assert.equal((await cli(['upgrade'])).code, 2);
    assert.equal((await cli(['migrate', '--from'])).code, 2);
  });

  it('lists the rules in range', async() => {
    const { code, out } = await cli(['migrate', '--list', '--from', '17', '--to', '18.1']);

    assert.equal(code, 0);
    assert.match(out, /^18\.0\.0\/css-wrapper-border-radius +cssVariable +rewrite$/m);
  });

  it('lists from the beginning when --from is absent and cannot be detected', async() => {
    const dir = await mkdtemp(join(tmpdir(), 'codemod-cli-empty-'));

    try {
      const { code, out } = await cli(['migrate', '--list'], dir);

      assert.equal(code, 0);
      assert.match(out, /18\.0\.0\/css-wrapper-border-radius/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('exits 2 for an empty version range and for an unknown --only id', async() => {
    const empty = await cli(['migrate', '--from', '18', '--to', '18.1']);

    assert.equal(empty.code, 2);
    assert.match(empty.err, /Nothing to migrate/);
    assert.equal((await cli(['migrate', '--list', '--from', '17', '--only', '18.0.0/nope'])).code, 2);
    assert.equal((await cli(['migrate', '--list', '--from', 'banana'])).code, 2);
  });

  it('refuses a dirty tree with exit code 2, and --allow-dirty overrides it', async() => {
    const dir = await makeProject(true);

    try {
      await writeFile(join(dir, 'extra.txt'), 'x');

      const refused = await cli(['migrate', '--from', '17', '--to', '18'], dir);

      assert.equal(refused.code, 2);
      assert.match(refused.err, /uncommitted/);
      assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), CSS);

      const allowed = await cli(['migrate', '--from', '17', '--to', '18', '--allow-dirty'], dir);

      assert.equal(allowed.code, 0);
      assert.match(await readFile(join(dir, 'a.css'), 'utf8'), /--ht-border-radius/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('prints a diff and writes nothing with --dry-run', async() => {
    const dir = await makeProject(true);

    try {
      const { code, out } = await cli(['migrate', '--from', '17', '--to', '18', '--dry-run'], dir);

      assert.equal(code, 0);
      assert.match(out, /^--- a\/a\.css/m);
      assert.match(out, /Summary: 1 file would change, 1 rewrite would be applied/);
      assert.doesNotMatch(out, /Next:/);
      assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), CSS);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('prints no release candidate advice for the published 19.0 draft, and writes no 19.1 range', async() => {
    const dir = await makeProject(false);
    const input = '{ "dependencies": { "handsontable": "^18.1.0" } }\n';

    try {
      await writeFile(join(dir, 'package.json'), input);

      // Two drafts are in range: 19.0.0 (published, bumps the packages) and 19.1.0 (no rules yet). The run ends at
      // 19.1.0, and the range it writes comes from the 19.0.0 rule.
      const draft = await cli(['migrate', '--from', '18.1', '--include-draft', '--allow-dirty'], dir);

      assert.equal(draft.code, 0, draft.err);
      assert.match(draft.out, /^Next: install the new package ranges/m);
      assert.doesNotMatch(draft.out, /matches no published version|@rc/);
      assert.match(await readFile(join(dir, 'package.json'), 'utf8'), /"handsontable": "\^19\.0\.0"/);
      assert.doesNotMatch(await readFile(join(dir, 'package.json'), 'utf8'), /19\.1/);
      assert.match(draft.err, /The draft migration 19\.1\.0 has no rules yet/);

      await writeFile(join(dir, 'package.json'), '{ "dependencies": { "handsontable": "^17.1.0" } }\n');

      const released = await cli(['migrate', '--from', '17', '--to', '18', '--allow-dirty'], dir);

      assert.match(released.out, /^Next: install the new package ranges/m);
      assert.doesNotMatch(released.out, /@rc/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  describe('the release candidate advice of nextSteps()', () => {
    const report = { counts: () => ({ manual: 0, marked: 0 }) };
    const lines = (result) => {
      let out = '';

      nextSteps({ changedFiles: ['package.json'], report, draftRangeVersion: null, ...result }, (text) => {
        out += text;
      });

      return out;
    };

    it('names the range of the unpublished draft that wrote it, and nothing for a run without one', () => {
      assert.match(lines({ draftRangeVersion: '19.1.0' }),
        /^Next: the range \^19\.1\.0 matches no published version yet.*npm install handsontable@rc$/m);
      assert.doesNotMatch(lines({}), /matches no published version/);
      assert.doesNotMatch(lines({ changedFiles: ['a.css'], draftRangeVersion: '19.1.0' }), /matches no published/);
    });

    it('is decided by the run: a draft with a bump that is not published, and only that one', async() => {
      for (const [published, rules, expected] of [
        [false, [{ bump: { handsontable: '19.1.0' } }], '19.1.0'],
        [true, [{ bump: { handsontable: '19.1.0' } }], null],
        [false, [{ reportMissing: [{ name: 'numbro' }] }], null],
        [false, [], null],
      ]) {
        const root = await mkdtemp(join(tmpdir(), 'codemod-cli-versions-'));
        const dir = await makeProject(false);

        try {
          await writeVersion(root, '18.1.0', { from: '18.0' });
          await writeVersion(root, '19.1.0', {
            from: '18.1',
            status: 'draft',
            ...(published ? { published } : {}),
            rules: rules.map((rule, index) => ({ id: `19.1.0/d${index}`, kind: 'dependency', safe: true, ...rule })),
          });
          await writeFile(join(dir, 'package.json'), '{ "dependencies": { "handsontable": "^18.1.0" } }\n');

          const result = await run({ cwd: dir, from: '18.1', includeDraft: true, versionsDir: root, allowDirty: true });

          assert.equal(result.usedDraft, true);
          assert.equal(result.draftRangeVersion, expected, JSON.stringify({ published, rules }));
        } finally {
          await rm(root, { recursive: true, force: true });
          await rm(dir, { recursive: true, force: true });
        }
      }
    });
  });

  it('says to install when it edited a package.json, and not otherwise', async() => {
    const withPackage = await makeProject(false);
    const cssOnly = await makeProject(false);

    try {
      await writeFile(join(withPackage, 'package.json'), '{ "dependencies": { "handsontable": "^17.1.0" } }\n');

      const edited = await cli(['migrate', '--from', '17', '--to', '18'], withPackage);
      const plain = await cli(['migrate', '--from', '17', '--to', '18'], cssOnly);

      assert.match(edited.out, /^Next: install the new package ranges with your package manager\./m);
      assert.ok(edited.out.indexOf('Next: install') < edited.out.indexOf('Next: run your formatter'));
      assert.doesNotMatch(plain.out, /Next: install/);
    } finally {
      await rm(withPackage, { recursive: true, force: true });
      await rm(cssOnly, { recursive: true, force: true });
    }
  });

  it('writes the Markdown report with --report and prints the console report', async() => {
    const dir = await makeProject(false);

    try {
      const { code, out } = await cli(['migrate', '--from', '17', '--to', '18', '--report', 'report.md'], dir);

      assert.equal(code, 0);
      assert.match(out, /18\.0\.0\/css-wrapper-border-radius \(1 changed\)/);
      assert.match(out, /^Next: run your formatter and linter on the changed files\.$/m);
      assert.match(out, /^Next: run tsc and your tests\.$/m);
      assert.match(await readFile(join(dir, 'report.md'), 'utf8'), /- \[x\] `a\.css:2` /);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('refuses a --report path that is a tracked file or a file the run would migrate', async() => {
    for (const repo of [true, false]) {
      const dir = await makeProject(repo);

      try {
        const { code, err } = await cli(['migrate', '--from', '17', '--to', '18', '--report', 'a.css'], dir);
        const dry = await cli(['migrate', '--from', '17', '--to', '18', '--dry-run', '--report', 'a.css'], dir);

        for (const result of [{ code, err }, { code: dry.code, err: dry.err }]) {
          assert.equal(result.code, 2);
          assert.match(result.err, /--report a\.css would overwrite a project file/);
        }

        assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), CSS);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    }
  });

  it('overwrites an untracked report from the previous run, and refuses a report that is a link', async() => {
    const dir = await makeProject(true);

    try {
      await writeFile(join(dir, 'report.md'), '# Handsontable migration report: 17 to 18 (2026-01-01)\n\nold report\n');

      const again = await cli(['migrate', '--from', '17', '--to', '18', '--report', 'report.md'], dir);

      assert.equal(again.code, 0, again.err);
      assert.match(await readFile(join(dir, 'report.md'), 'utf8'), /- \[x\] `a\.css:2` /);

      await rm(join(dir, 'report.md'));
      await symlink(join(dir, 'a.css'), join(dir, 'link.md'));

      const linked = await cli(['migrate', '--from', '17', '--to', '18', '--dry-run', '--report', 'link.md'], dir);

      assert.equal(linked.code, 2);
      assert.match(linked.err, /symbolic link/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('exits 1 when a file cannot be parsed', async() => {
    const dir = await makeProject(false);

    try {
      await writeFile(join(dir, 'broken.css'), 'a { --ht-wrapper-border-radius: 1px;\n');

      const { code, out } = await cli(['migrate', '--from', '17', '--to', '18'], dir);

      assert.equal(code, 1);
      assert.match(out, /parse-error/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('a crash that is not a usage error', () => {
  /**
   * Run the CLI with a standard output that throws, as a closed pipe does, and capture standard error.
   *
   * @param {string[]} argv Arguments.
   * @param {string} cwd Working directory.
   * @returns {Promise<{code: number, err: string}>} Exit code and standard error.
   */
  async function withBrokenOutput(argv, cwd) {
    let err = '';
    const code = await main(argv, {
      cwd,
      stdout: () => {
        throw new Error('boom: the output is closed');
      },
      stderr: (text) => {
        err += text;
      },
    });

    return { code, err };
  }

  it('exits 1 and prints the stack when the run is over and the output fails, after files were written', async() => {
    const dir = await makeProject(true);

    try {
      const { code, err } = await withBrokenOutput(['migrate', '--from', '17', '--to', '18'], dir);

      assert.equal(code, 1);
      assert.match(err, /Error: boom: the output is closed\n\s+at /);
      assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), CSS.replace('wrapper-', ''),
        'the run had written the file before it crashed');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('exits 1 and prints the stack for a crash while listing the rules', async() => {
    const { code, err } = await withBrokenOutput(['migrate', '--list', '--from', '17', '--to', '18'], tmpdir());

    assert.equal(code, 1);
    assert.match(err, /Error: boom: the output is closed\n\s+at /);
  });

  it('exits 2, and not 1, for a usage error', async() => {
    const { code, err } = await cli(['migrate', '--from', 'banana']);

    assert.equal(code, 2);
    assert.doesNotMatch(err, /\n\s+at /);
  });
});

describe('bin', () => {
  it('is executable, has a shebang, and sets the exit code without calling process.exit', async() => {
    const source = await readFile(BIN, 'utf8');

    assert.ok(source.startsWith('#!/usr/bin/env node\n'));
    assert.doesNotMatch(source, /process\.exit\(/);
    await access(BIN);
  });

  it('runs as a process and forwards the exit code', () => {
    const help = spawnSync(process.execPath, [BIN, '--help'], { encoding: 'utf8' });
    const bad = spawnSync(process.execPath, [BIN, 'migrate', '--nope'], { encoding: 'utf8' });

    assert.equal(help.status, 0);
    assert.match(help.stdout, /Usage:/);
    assert.equal(bad.status, 2);
  });
});
