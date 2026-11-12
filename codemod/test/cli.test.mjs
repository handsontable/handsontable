import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { main } from '../src/cli.mjs';

const BIN = fileURLToPath(new URL('../bin/handsontable-codemod.mjs', import.meta.url));
const CSS = 'a {\n  border-radius: var(--ht-wrapper-border-radius);\n}\n';

/**
 * Run the CLI in process and capture its output.
 *
 * @param {string[]} argv Arguments.
 * @param {string} [cwd] Working directory.
 * @returns {Promise<{code: number, out: string, err: string}>} Exit code and captured streams.
 */
async function cli(argv, cwd = tmpdir()) {
  let out = '';
  let err = '';
  const code = await main(argv, { cwd,
    stdout: (text) => {
      out += text;
    },
    stderr: (text) => {
      err += text;
    } });

  return { code, out, err };
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
    const env = { ...process.env };

    ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE'].forEach(name => delete env[name]);

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
  });

  it('documents every flag and every exit code in the help', async() => {
    const { out } = await cli(['--help']);

    for (const flag of ['from', 'to', 'dry-run', 'allow-dirty', 'report', 'only', 'list', 'aggressive',
      'include-draft', 'help']) {
      assert.match(out, new RegExp(`^ {2}--${flag}\\b`, 'm'), flag);
    }

    assert.match(out, /^ {2}paths /m);
    assert.match(out, /^ {2}0 {2}Done\./m);
    assert.match(out, /^ {2}1 {2}A file could not be read/m);
    assert.match(out, /^ {2}2 {2}Usage error or refusal/m);
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
    for (const args of [['--from', '18.1', '--to', '18.1'], ['--from', '18.1', '--to', '18'],
      ['--from', '19', '--to', '18.0']]) {
      const { code, err } = await cli(['migrate', ...args]);

      assert.equal(code, 2, args.join(' '));
      assert.match(err, /Nothing to migrate from .* to /);
      assert.match(err, /Known migrations: 18\.0\.0, 18\.1\.0\./);
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

  it('writes the Markdown report with --report and prints the console report', async() => {
    const dir = await makeProject(false);

    try {
      const { code, out } = await cli(['migrate', '--from', '17', '--to', '18', '--report', 'report.md'], dir);

      assert.equal(code, 0);
      assert.match(out, /18\.0\.0\/css-wrapper-border-radius \(1 changed\)/);
      assert.match(out, /^Next: run your formatter and linter on the changed files\.$/m);
      assert.match(out, /^Next: run tsc and your tests\.$/m);
      assert.match(await readFile(join(dir, 'report.md'), 'utf8'), /- \[x\] a\.css:2 /);
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
