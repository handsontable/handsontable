import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { discover, isSkipped } from '../src/discover.mjs';
import { buildPlan } from '../src/manifest.mjs';
import { describeRules, resolvePlan, run, transformFile } from '../src/runner.mjs';
import { createRegistry } from '../src/transforms/index.mjs';

const RADIUS_CSS = 'a {\n  border-radius: var(--ht-wrapper-border-radius, 4px);\n}\n';
const RADIUS_CSS_DONE = 'a {\n  border-radius: var(--ht-border-radius, 4px);\n}\n';

/**
 * Run git inside a test project with an isolated identity and no hooks or signing.
 *
 * @param {string} cwd Project directory.
 * @param {string[]} args Git arguments.
 * @returns {void}
 */
function git(cwd, args) {
  const env = { ...process.env };

  ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE'].forEach(name => delete env[name]);
  const identity = ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', '-c', 'commit.gpgsign=false'];

  execFileSync('git', [...identity, ...args], { cwd, env, stdio: 'ignore' });
}

/**
 * Create a temporary project under the OS temp directory, never inside the monorepo, and optionally commit it.
 *
 * @param {Record<string, string>} files File contents by relative path.
 * @param {object} [options] Options.
 * @param {boolean} [options.repo] Initialize a git repository and commit the files. Defaults to `true`.
 * @returns {Promise<string>} The project directory.
 */
async function makeProject(files, { repo = true } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'codemod-runner-'));

  for (const [name, content] of Object.entries(files)) {
    await mkdir(dirname(join(dir, name)), { recursive: true });
    await writeFile(join(dir, name), content);
  }

  if (repo) {
    git(dir, ['init', '-q']);
    git(dir, ['add', '-A']);
    git(dir, ['commit', '-q', '-m', 'init']);
  }

  return dir;
}

/**
 * Run a callback with a project and remove it afterwards.
 *
 * @param {Record<string, string>} files File contents by relative path.
 * @param {(dir: string) => Promise<void>} callback Test body.
 * @param {{repo?: boolean}} [options] Options for `makeProject`.
 * @returns {Promise<void>}
 */
async function withProject(files, callback, options) {
  const dir = await makeProject(files, options);

  try {
    await callback(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/**
 * Write a temporary versions directory.
 *
 * @param {Record<string, object>} versions Manifest overrides by version.
 * @returns {Promise<string>} The versions directory.
 */
async function makeVersionsDir(versions) {
  const root = await mkdtemp(join(tmpdir(), 'codemod-versions-'));

  for (const [version, manifest] of Object.entries(versions)) {
    await mkdir(join(root, version), { recursive: true });
    await writeFile(join(root, version, 'manifest.json'), JSON.stringify({
      version,
      status: 'released',
      guide: { url: `https://example.com/${version}`, source: 'docs/x.md' },
      rules: [],
      ...manifest,
    }));
  }

  return root;
}

/**
 * Build a plan from a list of rules of one version without touching the disk.
 *
 * @param {object[]} rules Rules without `version` and `guideUrl`.
 * @returns {import('../src/types.mjs').Plan} The plan.
 */
function planOf(rules) {
  const full = rules.map(rule => ({
    safe: true,
    version: '18.0.0',
    guideUrl: `https://example.com/g#${rule.id}`,
    ...rule,
  }));

  return buildPlan([{ version: '18.0.0', rules: full }]);
}

describe('transformFile with the default registry', () => {
  const plan = planOf([{
    id: '18.0.0/r',
    kind: 'cssVariable',
    guideUrl: 'https://example.com/g',
    from: '--ht-wrapper-border-radius',
    to: '--ht-border-radius',
  }]);

  it('rewrites a CSS file and reports the rewrite with the guide link', async() => {
    const result = await transformFile({ filePath: 'a.css', source: RADIUS_CSS, plan });

    assert.equal(result.changed, true);
    assert.equal(result.output, RADIUS_CSS_DONE);
    assert.deepEqual(result.entries, [{
      ruleId: '18.0.0/r',
      severity: 'changed',
      file: 'a.css',
      line: 2,
      message: 'Renamed --ht-wrapper-border-radius to --ht-border-radius.',
      guideUrl: 'https://example.com/g',
    }]);
  });

  it('skips a file silently when the cheap precheck does not match', async() => {
    const result = await transformFile({ filePath: 'a.css', source: 'a { color: red; }\n', plan });

    assert.deepEqual([result.changed, result.skipped, result.entries], [false, 'precheck', []]);
  });

  it('skips a JS file without parsing it when no registered transform handles js', async() => {
    const cssOnly = createRegistry([{ kinds: ['cssVariable'], fileKinds: ['css'], apply() {} }]);
    const source = 'this is not valid js handsontable (';
    const result = await transformFile({ filePath: 'a.js', source, plan, registry: cssOnly });

    assert.deepEqual([result.changed, result.skipped, result.entries], [false, 'no-transform', []]);
  });

  it('skips an unknown extension and a page the template precheck rejects', async() => {
    const html = await transformFile({ filePath: 'a.html', source: '<p>hello</p>', plan });

    assert.equal(html.skipped, 'precheck');
    assert.equal((await transformFile({ filePath: 'a.md', source: '# x', plan })).skipped, 'no-adapter');
  });

  it('turns a parse failure into a warning entry and leaves the source alone', async() => {
    const source = 'a { --ht-wrapper-border-radius: 1px;\n';
    const result = await transformFile({ filePath: 'broken.css', source, plan });

    assert.equal(result.changed, false);
    assert.equal(result.output, source);
    assert.equal(result.entries.length, 1);
    assert.equal(result.entries[0].ruleId, 'parse-error');
    assert.equal(result.entries[0].severity, 'warning');
    assert.equal(result.entries[0].file, 'broken.css');
  });

  it('rewrites SCSS too', async() => {
    const result = await transformFile({
      filePath: 'a.scss',
      source: '// c\n.a {\n  &:hover { --ht-wrapper-border-radius: 2px; }\n}\n',
      plan,
    });

    assert.equal(result.output, '// c\n.a {\n  &:hover { --ht-border-radius: 2px; }\n}\n');
  });
});

describe('transformFile and the transform contract', () => {
  /**
   * Build a fake transform that records its calls.
   *
   * @param {string[]} kinds Kinds it handles.
   * @param {string[]} calls Shared call log.
   * @param {(ctx: object, rules: object[]) => void} [body] Extra work inside `apply`.
   * @returns {import('../src/types.mjs').Transform} The transform.
   */
  function fake(kinds, calls, body = () => {}) {
    return {
      kinds,
      fileKinds: ['css'],
      apply(ctx, rules) {
        calls.push(`${kinds.join('+')}:${rules.map(rule => rule.id).join(',')}`);
        body(ctx, rules);
      },
    };
  }

  const css = 'a { --ht-x: 1; }\n';
  const rule = (id, kind) => ({ id, kind });
  const onePlan = () => planOf([rule('18.0.0/a', 'cssVariable')]);

  /**
   * Run one fake transform over the sample stylesheet.
   *
   * @param {(ctx: object) => void} body What the fake does inside `apply`.
   * @param {object} [extra] Extra `transformFile` arguments.
   * @returns {ReturnType<typeof transformFile>} The result.
   */
  function runFake(body, extra = {}) {
    const registry = createRegistry([fake(['cssVariable'], [], body)]);

    return transformFile({ filePath: 'a.css', source: css, plan: onePlan(), registry, ...extra });
  }

  it('calls modules in the fixed kind order, once per module, with their rules in manifest order', async() => {
    const calls = [];
    const registry = createRegistry([
      fake(['optionRename', 'optionRemove'], calls),
      fake(['importSource'], calls),
      fake(['cssVariable'], calls),
    ]);
    const plan = planOf([
      rule('18.0.0/css', 'cssVariable'),
      rule('18.0.0/remove', 'optionRemove'),
      rule('18.0.0/import', 'importSource'),
      rule('18.0.0/rename', 'optionRename'),
    ]);

    await transformFile({ filePath: 'a.css', source: css, plan, registry });

    assert.deepEqual(calls, [
      'importSource:18.0.0/import',
      'optionRename+optionRemove:18.0.0/remove,18.0.0/rename',
      'cssVariable:18.0.0/css',
    ]);
  });

  it('applies versions in ascending order', async() => {
    const calls = [];
    const registry = createRegistry([fake(['cssVariable'], calls)]);
    const entry = (version, id) => ({
      version,
      rules: [{ id, kind: 'cssVariable', version, guideUrl: null, safe: true }],
    });
    const plan = buildPlan([entry('18.0.0', '18.0.0/a'), entry('18.1.0', '18.1.0/b')]);

    await transformFile({ filePath: 'a.css', source: css, plan, registry });

    assert.deepEqual(calls, ['cssVariable:18.0.0/a', 'cssVariable:18.1.0/b']);
  });

  it('skips rule kinds that have no transform without any output', async() => {
    const calls = [];
    const registry = createRegistry([fake(['cssVariable'], calls)]);
    const plan = planOf([rule('18.0.0/a', 'optionRename'), rule('18.0.0/b', 'cssVariable')]);
    const result = await transformFile({ filePath: 'a.css', source: css, plan, registry });

    assert.deepEqual(calls, ['cssVariable:18.0.0/b']);
    assert.deepEqual(result.entries, []);
  });

  it('hands over the documented context', async() => {
    let seen;
    const facts = new Set(['already-there']);

    await runFake((ctx) => {
      seen = ctx;
    }, { filePath: 'dir/a.css', facts, options: { aggressive: true } });

    assert.deepEqual(Object.keys(seen).sort(), [
      'facts', 'fileKind', 'filePath', 'j', 'markChanged', 'options', 'report', 'root', 'source', 'todo',
    ]);
    assert.equal(seen.filePath, 'dir/a.css');
    assert.equal(seen.fileKind, 'css');
    assert.equal(seen.source, css);
    assert.equal(seen.j, null);
    assert.equal(seen.root.type, 'root');
    assert.equal(seen.facts, facts);
    assert.deepEqual(seen.options, { aggressive: true, dryRun: false });
  });

  it('prints only after markChanged and keeps the original bytes otherwise', async() => {
    const noop = await runFake((ctx) => {
      ctx.root.first.first.value = '2';
    });
    const edit = await runFake((ctx) => {
      ctx.root.first.first.value = '2';
      ctx.markChanged();
    });

    assert.equal(noop.changed, false);
    assert.equal(noop.output, css);
    assert.equal(edit.output, 'a { --ht-x: 2; }\n');
  });

  it('fills file, guideUrl, and a null line into report entries and rejects malformed ones', async() => {
    const result = await runFake((ctx) => {
      ctx.report({ ruleId: '18.0.0/a', severity: 'warning', message: 'Look here.' });
    });

    assert.deepEqual(result.entries, [{
      ruleId: '18.0.0/a',
      severity: 'warning',
      file: 'a.css',
      line: null,
      message: 'Look here.',
      guideUrl: 'https://example.com/g#18.0.0/a',
    }]);

    const failed = await runFake(ctx => ctx.report({ ruleId: 'x', severity: 'loud', message: 'm' }));

    assert.equal(failed.entries[0].ruleId, 'transform-error');
  });

  it('leaves a TODO once, reports manual every time, and marks the part changed', async() => {
    const body = (ctx) => {
      ctx.todo(ctx.root.first.nodes.find(node => node.type === 'decl'), '18.0.0/a', 'Check this value.');
    };
    const first = await runFake(body);

    assert.equal(first.changed, true);
    assert.match(first.output, /\/\* TODO\(handsontable-codemod 18\.0\.0\/a\): Check this value\. \*\//);
    assert.deepEqual(first.entries.map(entry => [entry.severity, entry.line]), [['manual', 1]]);

    const second = await runFake(body, { source: first.output });

    assert.equal(second.changed, false);
    assert.equal(second.output, first.output);
    assert.equal(second.entries.length, 1, 'the manual entry is reported on every run');
  });

  it('turns a throwing transform into a transform-error and discards its edits', async() => {
    const result = await runFake((ctx) => {
      ctx.markChanged();

      throw new Error('boom');
    });

    assert.equal(result.changed, false);
    assert.equal(result.output, css);
    assert.match(result.entries[0].message, /boom/);
  });

  it('runs phase 2 kinds only in phase 2', async() => {
    const calls = [];
    const dependency = { kinds: ['dependency'], fileKinds: ['json'], apply: () => calls.push('dependency') };
    const registry = createRegistry([fake(['cssVariable'], calls), dependency]);
    const plan = planOf([rule('18.0.0/a', 'cssVariable'), rule('18.0.0/d', 'dependency')]);
    const manifest = { filePath: 'package.json', source: '{"name":"handsontable-app"}', plan, registry };

    await transformFile({ filePath: 'a.css', source: css, plan, registry });
    await transformFile(manifest);
    assert.deepEqual(calls, ['cssVariable:18.0.0/a']);

    await transformFile({ ...manifest, phase: 2 });
    assert.deepEqual(calls, ['cssVariable:18.0.0/a', 'dependency']);
  });

  it('rejects two modules for one kind and a kind outside the order', () => {
    const twice = [fake(['cssVariable'], []), fake(['cssVariable'], [])];

    assert.throws(() => createRegistry(twice), /two transform modules/);
    assert.throws(() => createRegistry([fake(['unknownKind'], [])]), /missing from KIND_ORDER/);
  });
});

describe('resolvePlan and describeRules', () => {
  it('lists every rule with whether its kind has a transform', async() => {
    const versionsDir = await makeVersionsDir({
      '18.0.0': { rules: [
        { id: '18.0.0/css', kind: 'cssVariable', from: 'a', to: 'b' },
        { id: '18.0.0/opt', kind: 'optionRemove', name: 'x' },
      ] },
    });

    try {
      const { plan } = await resolvePlan({ cwd: tmpdir(), from: '17', versionsDir });

      const registry = createRegistry([{ kinds: ['cssVariable'], fileKinds: ['css'], apply() {} }]);

      assert.deepEqual(describeRules(plan, registry).map(row => [row.id, row.implemented]), [
        ['18.0.0/opt', false],
        ['18.0.0/css', true],
      ]);
    } finally {
      await rm(versionsDir, { recursive: true, force: true });
    }
  });

  it('rejects an unknown --only id and an empty range', async() => {
    const cwd = tmpdir();

    await assert.rejects(resolvePlan({ cwd, from: '17', only: ['18.0.0/nope'] }), /Unknown rule id: 18\.0\.0\/nope/);
    await assert.rejects(resolvePlan({ cwd, from: '18', to: '18.1' }), /No migration to run/);
  });
});

describe('run', () => {
  it('refuses a dirty git tree with exit code 2 and writes nothing', async() => {
    await withProject({ 'a.css': RADIUS_CSS }, async(dir) => {
      await writeFile(join(dir, 'untracked.txt'), 'x');

      const result = await run({ cwd: dir, from: '17', to: '18' });

      assert.equal(result.exitCode, 2);
      assert.match(result.error, /uncommitted change/);
      assert.deepEqual(result.changedFiles, []);
      assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), RADIUS_CSS);
    });
  });

  it('runs on a clean tree, writes changed files only, and a second run changes nothing', async() => {
    await withProject({ 'a.css': RADIUS_CSS, 'b.css': 'b { color: red; }\n', 'c.txt': 'text' }, async(dir) => {
      const first = await run({ cwd: dir, from: '17', to: '18' });

      assert.equal(first.exitCode, 0);
      assert.deepEqual(first.changedFiles, ['a.css']);
      assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), RADIUS_CSS_DONE);
      assert.equal(first.report.entries.length, 1);

      const second = await run({ cwd: dir, from: '17', to: '18', allowDirty: true });

      assert.deepEqual(second.changedFiles, []);
      assert.equal(second.report.entries.length, 0);
    });
  });

  it('accepts a dirty tree with allowDirty', async() => {
    await withProject({ 'a.css': RADIUS_CSS }, async(dir) => {
      await writeFile(join(dir, 'untracked.txt'), 'x');

      assert.equal((await run({ cwd: dir, from: '17', to: '18', allowDirty: true })).exitCode, 0);
    });
  });

  it('writes nothing in dry-run mode, returns a diff, and ignores a dirty tree', async() => {
    await withProject({ 'a.css': RADIUS_CSS }, async(dir) => {
      await writeFile(join(dir, 'untracked.txt'), 'x');

      const result = await run({ cwd: dir, from: '17', to: '18', dryRun: true });

      assert.equal(result.exitCode, 0);
      assert.deepEqual(result.changedFiles, ['a.css']);
      assert.equal(result.diffs.length, 1);
      assert.match(result.diffs[0].diff, /^-.*--ht-wrapper-border-radius/m);
      assert.match(result.diffs[0].diff, /^\+.*--ht-border-radius,/m);
      assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), RADIUS_CSS);
    });
  });

  it('writes nothing when write is false', async() => {
    await withProject({ 'a.css': RADIUS_CSS }, async(dir) => {
      const result = await run({ cwd: dir, from: '17', to: '18', write: false });

      assert.deepEqual(result.changedFiles, ['a.css']);
      assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), RADIUS_CSS);
    });
  });

  it('runs outside a git repository without a guard', async() => {
    await withProject({ 'a.css': RADIUS_CSS }, async(dir) => {
      const result = await run({ cwd: dir, from: '17', to: '18' });

      assert.equal(result.exitCode, 0);
      assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), RADIUS_CSS_DONE);
    }, { repo: false });
  });

  it('keeps only the rules named by --only', async() => {
    const versionsDir = await makeVersionsDir({
      '18.0.0': { rules: [
        { id: '18.0.0/one', kind: 'cssVariable', from: '--ht-one', to: '--ht-uno' },
        { id: '18.0.0/two', kind: 'cssVariable', from: '--ht-two', to: '--ht-dos' },
      ] },
    });

    try {
      await withProject({ 'a.css': 'a { --ht-one: 1; --ht-two: 2; }\n' }, async(dir) => {
        const result = await run({ cwd: dir, from: '17', to: '18', only: ['18.0.0/two'], versionsDir });

        assert.equal(result.exitCode, 0);
        assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), 'a { --ht-one: 1; --ht-dos: 2; }\n');
      });
    } finally {
      await rm(versionsDir, { recursive: true, force: true });
    }
  });

  it('reports a parse error, skips the file, still migrates the others, and exits 1', async() => {
    await withProject({
      'broken.css': 'a { --ht-wrapper-border-radius: 1px;\n',
      'good.css': RADIUS_CSS,
    }, async(dir) => {
      const result = await run({ cwd: dir, from: '17', to: '18' });

      assert.equal(result.exitCode, 1);
      assert.deepEqual(result.changedFiles, ['good.css']);
      assert.ok(result.report.entries.some(entry => entry.ruleId === 'parse-error' && entry.file === 'broken.css'));
      assert.equal(await readFile(join(dir, 'broken.css'), 'utf8'), 'a { --ht-wrapper-border-radius: 1px;\n');
    });
  });

  it('migrates only the paths it is given', async() => {
    await withProject({ 'src/a.css': RADIUS_CSS, 'other/b.css': RADIUS_CSS }, async(dir) => {
      const result = await run({ cwd: dir, from: '17', to: '18', paths: ['src'] });

      assert.deepEqual(result.changedFiles, ['src/a.css']);

      const single = await run({ cwd: dir, from: '17', to: '18', paths: ['other/b.css'], allowDirty: true });

      assert.deepEqual(single.changedFiles, ['other/b.css']);
    });
  });

  it('exits 2 for an empty range, a missing path, and an undetectable --from', async() => {
    await withProject({ 'a.css': RADIUS_CSS }, async(dir) => {
      assert.equal((await run({ cwd: dir, from: '18', to: '18.1' })).exitCode, 2);
      assert.equal((await run({ cwd: dir, from: '17', paths: ['nope'] })).exitCode, 2);
      assert.equal((await run({ cwd: dir, from: '17', paths: ['../outside'] })).exitCode, 2);
    });

    await withProject({ 'a.css': RADIUS_CSS }, async(dir) => {
      const result = await run({ cwd: dir, allowDirty: true });

      // A hoisted install above the temp directory could legitimately answer, so only the refusal shape is pinned.
      const detected = result.notes.some(note => note.startsWith('Detected --from'));

      assert.ok(result.exitCode === 2 ? /--from/.test(result.error) : detected);
    }, { repo: false });
  });

  it('detects --from from package.json and says so', async() => {
    await withProject({
      'package.json': '{"dependencies":{"handsontable":"^17.1.0"}}\n',
      'a.css': RADIUS_CSS,
    }, async(dir) => {
      const result = await run({ cwd: dir, to: '18' });

      assert.equal(result.exitCode, 0);
      assert.deepEqual(result.changedFiles, ['a.css', 'package.json']);
      assert.ok(result.notes.some(note => /Detected --from 17\.1\.0 \(package\.json dependencies\)/.test(note)));
    });
  });

  it('notes draft manifests it left out and runs them with includeDraft', async() => {
    const versionsDir = await makeVersionsDir({
      '19.0.0': { status: 'draft', rules: [{ id: '19.0.0/x', kind: 'cssVariable', from: '--ht-a', to: '--ht-b' }] },
      '18.0.0': { rules: [{ id: '18.0.0/y', kind: 'cssVariable', from: '--ht-c', to: '--ht-d' }] },
    });

    try {
      await withProject({ 'a.css': 'a { --ht-a: 1; --ht-c: 2; }\n' }, async(dir) => {
        const skipped = await run({ cwd: dir, from: '17', to: '19', dryRun: true, versionsDir });

        assert.ok(skipped.notes.some(note => /Skipped draft manifests: 19\.0\.0/.test(note)));
        assert.match(skipped.diffs[0].diff, /--ht-d/);
        assert.doesNotMatch(skipped.diffs[0].diff, /--ht-b/);

        const included = await run({ cwd: dir, from: '17', to: '19', dryRun: true, includeDraft: true, versionsDir });

        assert.match(included.diffs[0].diff, /--ht-b/);
      });
    } finally {
      await rm(versionsDir, { recursive: true, force: true });
    }
  });

  it('updates package.json in phase 2 only when a dependency transform exists', async() => {
    const versionsDir = await makeVersionsDir({
      '18.0.0': { rules: [{ id: '18.0.0/dep', kind: 'dependency', package: 'handsontable', action: 'bump' }] },
    });
    const dependency = {
      kinds: ['dependency'],
      fileKinds: ['json'],
      apply(ctx) {
        ctx.root.dependencies.handsontable = '^18.0.0';
        ctx.markChanged();
      },
    };

    try {
      const manifest = '{\n  "dependencies": {\n    "handsontable": "^17.1.0"\n  }\n}\n';

      await withProject({ 'package.json': manifest }, async(dir) => {
        const base = { cwd: dir, from: '17', to: '18', versionsDir };
        const none = await run({ ...base, dryRun: true });

        assert.deepEqual(none.changedFiles, []);

        const result = await run({ ...base, registry: createRegistry([dependency]) });

        assert.deepEqual(result.changedFiles, ['package.json']);
        assert.match(await readFile(join(dir, 'package.json'), 'utf8'), /"handsontable": "\^18\.0\.0"/);
      });
    } finally {
      await rm(versionsDir, { recursive: true, force: true });
    }
  });
});

describe('discover', () => {
  const files = {
    'src/a.css': RADIUS_CSS,
    'src/b.ts': 'export {};',
    'src/c.d.ts': 'export {};',
    'src/vendor.min.js': 'x',
    'src/page.vue': '<template/>',
    'src/view.html': '<div></div>',
    'node_modules/dep/index.js': 'x',
    'dist/out.js': 'x',
    'build/out.js': 'x',
    'coverage/out.js': 'x',
    'packages/app/package.json': '{}',
    'tsconfig.json': '{}',
    'notes.md': '#',
    'ignored/x.js': 'x',
    '.gitignore': 'ignored/\n',
  };
  const EXPECTED = ['packages/app/package.json', 'src/a.css', 'src/b.ts', 'src/page.vue', 'src/view.html'];

  it('inside git, lists tracked and unignored untracked files, skipping output and deleted files', async() => {
    await withProject(files, async(dir) => {
      await writeFile(join(dir, 'src', 'untracked.js'), 'x');
      await rm(join(dir, 'src', 'view.html'));

      const expected = [...EXPECTED.filter(file => file !== 'src/view.html'), 'src/untracked.js'].sort();

      assert.deepEqual(await discover({ cwd: dir }), expected);
    });
  });

  it('outside git, walks the directory and skips the same output', async() => {
    // Without git there is no ignore list, so the ignored directory is left out of the fixture.
    const withoutIgnored = Object.fromEntries(Object.entries(files).filter(([name]) => name !== 'ignored/x.js'));

    await withProject(withoutIgnored, async(dir) => {
      assert.deepEqual(await discover({ cwd: dir }), EXPECTED);
    }, { repo: false });
  });

  it('limits the search to the given paths and takes an explicit file even from a skipped directory', async() => {
    await withProject(files, async(dir) => {
      const inSrc = ['src/a.css', 'src/b.ts', 'src/page.vue', 'src/view.html'];

      assert.deepEqual(await discover({ cwd: dir, paths: ['src'] }), inSrc);
      assert.deepEqual(await discover({ cwd: dir, paths: ['src/a.css', 'src/b.ts'] }), ['src/a.css', 'src/b.ts']);
      assert.deepEqual(await discover({ cwd: dir, paths: ['dist/out.js'] }), ['dist/out.js']);
    });
  });

  it('classifies generated output', () => {
    const generated = [
      'node_modules/a.js', 'a/dist/b.js', 'x/build/y.css', 'coverage/z.js', 'a.min.js', 'a.min.css', 'a.d.ts',
    ];

    for (const path of generated) {
      assert.equal(isSkipped(path), true, path);
    }

    for (const path of ['src/a.js', 'distribution/a.js', 'src/minimal.js', 'src/a.ts']) {
      assert.equal(isSkipped(path), false, path);
    }
  });
});
