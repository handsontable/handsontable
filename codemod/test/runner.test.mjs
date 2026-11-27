import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { discover, isSkipped, resolvesInside } from '../src/discover.mjs';
import { buildPlan } from '../src/manifest.mjs';
import { describeRules, formatSize, resolvePlan, run, transformFile } from '../src/runner.mjs';
import { KIND_ORDER, createRegistry, registry as defaultRegistry } from '../src/transforms/index.mjs';
import { isolatedGitEnv } from './helpers/git-env.mjs';

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
  const env = isolatedGitEnv();
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
      from: String(Number(version.split('.')[0]) - 1),
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

/**
 * A report-only detect rule of one matcher, for the tests of the order of the kinds.
 *
 * @param {string} id Rule id.
 * @param {object} match The matcher.
 * @param {string} message The message.
 * @returns {object} The rule, without `version` and `guideUrl`.
 */
function detectRule(id, match, message) {
  return { id, kind: 'detect', safe: false, severity: 'manual', files: ['js'], requires: 'hot-file', match, message };
}

describe('transformFile with the default registry', () => {
  const plan = planOf([{
    id: '18.0.0/r',
    kind: 'cssVariable',
    guideUrl: 'https://example.com/g',
    from: '--ht-wrapper-border-radius',
    to: '--ht-border-radius',
  }]);

  it('runs the kinds of one version in the order the docs give, whatever the order of the manifest', () => {
    assert.deepEqual(KIND_ORDER, [
      'importSource',
      'exportRename',
      'namespaceType',
      'exportRemoved',
      'optionRename',
      'optionMove',
      'optionRemove',
      'methodRemove',
      'methodMove',
      'callUnwrap',
      'cssVariable',
      'themeToken',
      'detect',
      'custom',
      'dependency',
    ]);
    assert.deepEqual([...defaultRegistry.order], KIND_ORDER);
    assert.deepEqual([...defaultRegistry.phaseTwo], ['dependency']);
  });

  it('lets a detect rule see the code that the rewrites of the same version produced', async() => {
    const rules = [
      // The detect rules come first in the manifest. The order of the kinds, not the order of the file, decides.
      detectRule('18.0.0/sees-new', { property: 'newName' }, 'Check newName, which the rename just wrote.'),
      detectRule('18.0.0/sees-old', { property: 'oldName' }, 'Check oldName, which the rename took away.'),
      { id: '18.0.0/rename', kind: 'optionRename', from: 'oldName', to: 'newName' },
    ];
    const source = 'import Handsontable from \'handsontable\';\nnew Handsontable(el, { oldName: 1 });\n';
    const result = await transformFile({ filePath: 'a.js', source, plan: planOf(rules), options: { markers: false } });

    assert.equal(result.output, source.replace('oldName', 'newName'));
    assert.deepEqual(result.entries.map(entry => [entry.ruleId, entry.severity]),
      [['18.0.0/rename', 'changed'], ['18.0.0/sees-new', 'manual']]);
  });

  it('lets a detect rule see the variable a cssVariable rule just wrote', async() => {
    const rules = [
      detectRule('18.0.0/sees-color', { string: '--ht-new-name' }, 'Check the new variable.'),
      { id: '18.0.0/css', kind: 'cssVariable', from: '--ht-old-name', to: '--ht-new-name' },
    ];
    const source = 'import Handsontable from \'handsontable\';\nel.style.setProperty(\'--ht-old-name\', \'1px\');\n';
    const result = await transformFile({ filePath: 'a.js', source, plan: planOf(rules), options: { markers: false } });

    assert.equal(result.output, source.replace('--ht-old-name', '--ht-new-name'));
    assert.deepEqual(result.entries.map(entry => entry.ruleId), ['18.0.0/css', '18.0.0/sees-color']);
  });

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
      'ancestors', 'browserslistrc', 'catalog', 'comment', 'css', 'cssScope', 'derived', 'facts', 'fileKind',
      'filePath', 'fromText', 'hotComponent', 'j', 'json', 'lineOffset', 'markChanged', 'options', 'parser',
      'projectUsesHandsontable', 'removeStatement', 'report', 'root', 'source', 'todo',
    ]);
    assert.equal(seen.parser, null);
    assert.equal(seen.catalog, null);
    assert.equal(typeof seen.css.replaceInDeclaration, 'function');
    assert.equal(seen.filePath, 'dir/a.css');
    assert.equal(seen.fileKind, 'css');
    assert.equal(seen.source, css);
    assert.equal(seen.j, null);
    assert.equal(seen.root.type, 'root');
    assert.equal(seen.facts, facts);
    assert.deepEqual(seen.options, { aggressive: true, dryRun: false, todo: true });
  });

  it('prints only after markChanged and keeps the original bytes otherwise', async() => {
    const noop = await runFake((ctx) => {
      ctx.css.replaceInDeclaration(ctx.root.first.first, /1/g, '2');
    });
    const edit = await runFake((ctx) => {
      ctx.css.replaceInDeclaration(ctx.root.first.first, /1/g, '2');
      ctx.markChanged();
    });

    assert.equal(noop.changed, false);
    assert.equal(noop.output, css);
    assert.equal(edit.output, 'a { --ht-x: 2; }\n');
  });

  it('turns an edit that the printer cannot verify into a transform-error and leaves the file alone', async() => {
    const result = await runFake((ctx) => {
      ctx.css.replaceInDeclaration(ctx.root.first.first, /1/g, '2');
      ctx.root.first.first.prop = '--ht-other';
      ctx.markChanged();
    });

    assert.equal(result.changed, false);
    assert.equal(result.output, css);
    assert.equal(result.entries.length, 1);
    assert.equal(result.entries[0].ruleId, 'transform-error');
    assert.match(result.entries[0].message, /does not match the intended edits/);
  });

  it('turns a direct edit of the postcss root, which the document never saw, into a transform-error', async() => {
    const result = await runFake((ctx) => {
      ctx.root.first.first.value = '2';
      ctx.markChanged();
    });

    assert.equal(result.changed, false);
    assert.equal(result.output, css);
    assert.equal(result.entries[0].ruleId, 'transform-error');
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

  it('passes the scope and the line list of an entry on, and moves both by the part line offset', async() => {
    const vueRule = { id: '18.0.0/a', kind: 'detect', safe: false };
    const registry = createRegistry([{
      kinds: ['detect'],
      fileKinds: ['js'],
      apply(ctx) {
        ctx.report({ ruleId: '18.0.0/a', severity: 'manual', line: 1, lines: [1, 3], message: 'Look.', scope: 'run' });
      },
    }]);
    const source = '<template><div /></template>\n<script>\nconst handsontable = 1;\n</script>\n';
    const result = await transformFile({ filePath: 'a.vue', source, plan: planOf([vueRule]), registry });

    assert.equal(result.entries[0].line, 2);
    assert.deepEqual(result.entries[0].lines, [2, 4]);
    assert.equal(result.entries[0].scope, 'run');
  });

  it('keeps what ctx.derived() read for the next transform until an edit is recorded', async() => {
    const seen = [];
    const step = (kind, behavior) => ({
      kinds: [kind], fileKinds: ['js'], apply: ctx => behavior(ctx), rescue: rules => rules,
    });
    const registry = createRegistry([
      step('detect', (ctx) => {
        seen.push(['detect', ctx.derived('x', () => `made ${seen.length}`), ctx.derived('x', () => 'again')]);
      }),
      step('optionRename', (ctx) => {
        seen.push(['rename', ctx.derived('x', () => 'unused')]);
        ctx.markChanged();
        seen.push(['after edit', ctx.derived('x', () => `made ${seen.length}`)]);
      }),
    ], ['detect', 'optionRename']);
    const plan = buildPlan([{ version: '18.0.0',
      rules: ['detect', 'optionRename'].map(kind => ({
        id: `18.0.0/${kind}`, kind, safe: true, version: '18.0.0', guideUrl: null,
      })) }, { version: '18.1.0',
      rules: [{
        id: '18.1.0/detect', kind: 'detect', safe: false, version: '18.1.0', guideUrl: null,
      }] }]);

    await transformFile({ filePath: 'a.js', source: 'const handsontable = 1;\n', plan, registry });

    assert.deepEqual(seen, [
      ['detect', 'made 0', 'made 0'],
      ['rename', 'made 0'],
      ['after edit', 'made 2'],
      ['detect', 'made 2', 'made 2'],
    ]);
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
        { id: '18.0.0/css', kind: 'cssVariable', from: 'a', to: 'b', safe: true },
        { id: '18.0.0/opt', kind: 'optionRemove', name: 'x', safe: false },
      ] },
    });

    try {
      const { plan } = await resolvePlan({ cwd: tmpdir(), from: '17', versionsDir });

      const registry = createRegistry([{ kinds: ['cssVariable'], fileKinds: ['css'], apply() {} }]);

      assert.deepEqual(describeRules(plan, registry).map(row => [row.id, row.implemented, row.mode]), [
        ['18.0.0/opt', false, 'report'],
        ['18.0.0/css', true, 'rewrite'],
      ]);
    } finally {
      await rm(versionsDir, { recursive: true, force: true });
    }
  });

  it('rejects an unknown --only id and an empty range', async() => {
    const cwd = tmpdir();

    await assert.rejects(resolvePlan({ cwd, from: '17', only: ['18.0.0/nope'] }), /Unknown rule id: 18\.0\.0\/nope/);
    await assert.rejects(resolvePlan({ cwd, from: '18', to: '18.1' }), /Nothing to migrate/);
  });
});

describe('which versions a run covers', () => {
  const GUIDES = 'https://handsontable.com/docs/javascript-data-grid/';
  const noRepo = { repo: false };

  it('refuses a project below the oldest covered version and names the guides of the steps left out', async() => {
    await assert.rejects(resolvePlan({ cwd: tmpdir(), from: '16.2' }), (error) => {
      assert.match(error.message, /Handsontable 16\.2 is older than the oldest version this tool migrates from \(17\)/);
      assert.ok(error.message.includes(`${GUIDES}migration-from-16.2-to-17.0`));
      assert.match(error.message, /--allow-uncovered/);

      return true;
    });
    await assert.rejects(resolvePlan({ cwd: tmpdir(), from: '15.0' }), (error) => {
      for (const step of ['15.3-to-16.0', '16.0-to-16.1', '16.2-to-17.0']) {
        assert.ok(error.message.includes(`${GUIDES}migration-from-${step}`), step);
      }

      assert.equal(error.message.includes('migration-from-14.6-to-15.0'), false);

      return true;
    });
  });

  it('covers every 17.x project and runs an uncovered one with --allow-uncovered, noting what it skips', async() => {
    const covered = await resolvePlan({ cwd: tmpdir(), from: '17.0.0' });
    const allowed = await resolvePlan({ cwd: tmpdir(), from: '16.2', allowUncovered: true });

    assert.deepEqual(covered.reportNotes, []);
    assert.equal(allowed.reportNotes.length, 1);
    assert.ok(allowed.reportNotes[0].includes(`${GUIDES}migration-from-16.2-to-17.0`));
    assert.deepEqual(allowed.selected.map(manifest => manifest.version), ['18.0.0', '18.1.0']);
  });

  it('puts the note about an uncovered start at the top of the report of a run', async() => {
    await withProject({ 'a.css': RADIUS_CSS }, async(dir) => {
      const result = await run({ cwd: dir, from: '16.2', to: '18', allowUncovered: true });

      assert.equal(result.exitCode, 0);
      assert.match(result.report.notes[0], /It does not cover:\n {2}16\.2 to 17\.0: /);
    });
  });

  it('migrates up to the highest known version when --to is above every migration, and says so', async() => {
    for (const to of ['20', '18.2']) {
      const { reportNotes, selected } = await resolvePlan({ cwd: tmpdir(), from: '17', to });

      assert.deepEqual(reportNotes, [`No migration for ${to} is known. Migrated up to 18.1.0.`], to);
      assert.equal(selected[selected.length - 1].version, '18.1.0');
    }

    for (const to of ['18', '18.1', '18.1.5']) {
      assert.deepEqual((await resolvePlan({ cwd: tmpdir(), from: '17', to })).reportNotes, [], to);
    }
  });

  it('raises the dependency ranges to the highest known version, not to the requested one', async() => {
    const manifest = `${JSON.stringify({ dependencies: { handsontable: '^17.1.0' } }, null, 2)}\n`;

    await withProject({ 'package.json': manifest }, async(dir) => {
      const result = await run({ cwd: dir, from: '17.1', to: '19' });

      assert.equal(result.exitCode, 0);
      assert.match(await readFile(join(dir, 'package.json'), 'utf8'), /"handsontable": "\^18\.1\.0"/);
      assert.equal(result.report.notes.length, 1);
    }, noRepo);
  });

  it('says that package.json already names the target when a rerun finds nothing to migrate', async() => {
    const manifest = `${JSON.stringify({ dependencies: { handsontable: '^18.1.0' } })}\n`;

    await withProject({ 'package.json': manifest }, async(dir) => {
      await assert.rejects(resolvePlan({ cwd: dir }), (error) => {
        assert.match(error.message,
          /^package\.json already names 18\.1\.0, so there is nothing to migrate to 18\.1\.0\./);
        assert.match(error.message,
          /To run the migration again, pass --from <your previous version>, for example --from 17\.1\./);

        return true;
      });
    }, noRepo);

    await withProject({ 'node_modules/handsontable/package.json': '{ "name": "handsontable", "version": "18.1.2" }' },
      async(dir) => {
        await assert.rejects(resolvePlan({ cwd: dir }),
          { message: /^The installed handsontable package is 18\.1\.2, so / });
      }, noRepo);
  });

  it('suggests the minor line for a partial --from that stands for the end of its line', async() => {
    await assert.rejects(resolvePlan({ cwd: tmpdir(), from: '18', to: '18.1' }), (error) => {
      assert.match(error.message, /--from 18 means any 18\.x release, which is above every 18\.x migration\./);
      assert.match(error.message, /pass --from 18\.0\./);

      return true;
    });
  });

  it('says that a latest range is not a version', async() => {
    const manifest = `${JSON.stringify({ dependencies: { handsontable: 'latest' } })}\n`;

    await withProject({ 'package.json': manifest }, async(dir) => {
      await assert.rejects(resolvePlan({ cwd: dir }), {
        message: 'package.json names handsontable as "latest", which is not a version. Pass --from.',
      });
    }, noRepo);
  });

  it('says that a path, link, URL, repository, or catalog spec is not a version, and names no digits of it', async() => {
    for (const spec of [
      'file:../vendor/handsontable-build-2025.11.tgz',
      'link:../forks/handsontable-v2',
      'portal:../handsontable-17',
      'workspace:^',
      'catalog:',
      'catalog:v17',
      'git+https://github.com/example/handsontable.git#v17.1.0',
      'github:example/handsontable#17.1.0',
      'https://example.com/handsontable-17.1.0.tgz',
    ]) {
      const manifest = `${JSON.stringify({ name: 'a', dependencies: { handsontable: spec } })}\n`;

      await withProject({ 'package.json': manifest }, async(dir) => {
        await assert.rejects(resolvePlan({ cwd: dir, to: '18.1' }), {
          message: `package.json names handsontable as "${spec}", which is not a version. Pass --from.`,
        }, spec);
      }, noRepo);
    }
  });

  it('reads the version of an npm alias, and of a later field when an earlier one is a path', async() => {
    const alias = `${JSON.stringify({ dependencies: { handsontable: 'npm:handsontable@^17.1.0' } })}\n`;
    const later = `${JSON.stringify({
      dependencies: { handsontable: 'file:../vendor/handsontable-2025.11.tgz' },
      devDependencies: { handsontable: '^17.1.0' },
    })}\n`;

    for (const manifest of [alias, later]) {
      await withProject({ 'package.json': manifest }, async(dir) => {
        const { fromText } = await resolvePlan({ cwd: dir, to: '18.1' });

        assert.equal(fromText, '17.1.0');
      }, noRepo);
    }
  });

  it('skips a path or catalog spec when it scans a monorepo, and says so when nothing else names a version', async() => {
    const pkg = spec => `${JSON.stringify({ dependencies: { handsontable: spec } })}\n`;

    await withProject({
      'package.json': '{ "private": true }\n',
      'packages/a/package.json': pkg('^17.1.0'),
      'packages/b/package.json': pkg('file:../vendor/handsontable-2025.11.tgz'),
      'packages/c/package.json': pkg('catalog:'),
      'packages/d/package.json': pkg('link:../forks/handsontable-v2'),
    }, async(dir) => {
      const { fromText, notes } = await resolvePlan({ cwd: dir, to: '18.1' });

      assert.equal(fromText, '17.1.0');
      assert.ok(notes.includes('Detected --from 17.1.0 (packages/a/package.json).'), notes.join('\n'));
    }, noRepo);

    await withProject({
      'package.json': '{ "private": true }\n',
      'packages/b/package.json': pkg('file:../vendor/handsontable-2025.11.tgz'),
      'packages/c/package.json': pkg('catalog:'),
    }, async(dir) => {
      await assert.rejects(resolvePlan({ cwd: dir, to: '18.1' }), (error) => {
        assert.equal(error.message, 'packages/b/package.json names handsontable as '
          + '"file:../vendor/handsontable-2025.11.tgz", which is not a version. Pass --from.');
        assert.doesNotMatch(error.message, /2025\.11 so|already names|older than/);

        return true;
      });
    }, noRepo);
  });

  it('reports a Pikaday style rule once in a chained run, owned by the earliest migration', async() => {
    await withProject({ 'theme.css': '.pika-single { color: red; }\n' }, async(dir) => {
      const result = await run({ cwd: dir, from: '17', to: '18.1', dryRun: true });
      const entries = result.report.entries.filter(entry => entry.file === 'theme.css');

      assert.deepEqual(entries.map(entry => [entry.ruleId, entry.line]), [['18.0.0/pikaday-leftovers', 1]]);
      assert.match(entries[0].message, /^Remove this code, or style the native input instead\./);
    });
  });

  it('reports a Pikaday style rule of an HTML page once in a chained run, and in a run from 18.0', async() => {
    const page = '<style>\n  .pika-single { color: red; }\n</style>\n<hot-table></hot-table>\n';

    await withProject({ 'index.html': page }, async(dir) => {
      for (const [from, ruleId] of [['17', '18.0.0/pikaday-leftovers'], ['18.0', '18.1.0/pikaday-theme-leftovers']]) {
        const result = await run({ cwd: dir, from, to: '18.1', dryRun: true });
        const entries = result.report.entries.filter(entry => entry.file === 'index.html');

        assert.deepEqual(entries.map(entry => [entry.ruleId, entry.line]), [[ruleId, 2]], `from ${from}`);
      }
    });
  });

  it('writes sizes in bytes below 1 KB and with one decimal above', () => {
    assert.equal(formatSize(1), '1 byte');
    assert.equal(formatSize(300), '300 bytes');
    assert.equal(formatSize(1023), '1023 bytes');
    assert.equal(formatSize(1536), '1.5 KB');
    assert.equal(formatSize(1048576), '1024.0 KB');
  });

  it('counts the uncommitted changes in the refusal', async() => {
    await withProject({ 'a.css': RADIUS_CSS }, async(dir) => {
      await writeFile(join(dir, 'one.txt'), 'x');

      assert.match((await run({ cwd: dir, from: '17', to: '18' })).error,
        /has 1 uncommitted change\. Commit or stash it /);

      await writeFile(join(dir, 'two.txt'), 'x');

      assert.match((await run({ cwd: dir, from: '17', to: '18' })).error,
        /has 2 uncommitted changes\. Commit or stash them /);
    });
  });

  it('does not call a rule file a manifest in a message to the user', async() => {
    await assert.rejects(resolvePlan({ cwd: tmpdir(), from: '18', to: '18.1', includeDraft: false }),
      error => !/manifest/i.test(error.message));
    await assert.rejects(resolvePlan({ cwd: tmpdir(), from: '17', only: ['18.0.0/nope'] }),
      error => !/manifest/i.test(error.message));
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

  describe('the clean-tree guard sees every way a tracked project can be dirty', () => {
    const CASES = [
      ['an edited tracked file', async(dir) => {
        await writeFile(join(dir, 'other.css'), 'b { color: blue; }\n');
      }],
      ['a staged edit of a tracked file', async(dir) => {
        await writeFile(join(dir, 'other.css'), 'b { color: blue; }\n');
        git(dir, ['add', 'other.css']);
      }],
      ['a staged new file', async(dir) => {
        await writeFile(join(dir, 'added.css'), 'c { color: green; }\n');
        git(dir, ['add', 'added.css']);
      }],
      ['a rename with git mv', async(dir) => {
        git(dir, ['mv', 'other.css', 'moved.css']);
      }],
      ['a deleted tracked file', async(dir) => {
        await rm(join(dir, 'other.css'));
      }],
      ['an untracked file', async(dir) => {
        await writeFile(join(dir, 'untracked.css'), 'd { color: black; }\n');
      }],
    ];

    /**
     * Read every file of a project but the git directory, as a snapshot to compare byte for byte.
     *
     * @param {string} dir Project directory.
     * @returns {Promise<Record<string, string>>} File contents by name.
     */
    async function snapshot(dir) {
      const files = (await readdir(dir, { recursive: true }))
        .filter(name => !name.split(/[\\/]/).includes('.git')).sort();
      const contents = {};

      for (const name of files) {
        if ((await stat(join(dir, name))).isFile()) {
          contents[name] = await readFile(join(dir, name), 'utf8');
        }
      }

      return contents;
    }

    for (const [label, makeDirty] of CASES) {
      it(`refuses ${label} with exit code 2 and changes no byte`, async() => {
        await withProject({ 'a.css': RADIUS_CSS, 'other.css': 'b { color: red; }\n' }, async(dir) => {
          await makeDirty(dir);

          const before = await snapshot(dir);
          const result = await run({ cwd: dir, from: '17', to: '18' });

          assert.equal(result.exitCode, 2, label);
          assert.match(result.error, /^The git tree has 1 uncommitted change\./, label);
          assert.deepEqual(result.changedFiles, []);
          assert.deepEqual(await snapshot(dir), before);
          assert.equal(before['a.css'], RADIUS_CSS, 'the file the rule would migrate is untouched');
        });
      });
    }

    it('counts one change per file for a mix of the states', async() => {
      await withProject({ 'a.css': RADIUS_CSS, 'other.css': 'b { color: red; }\n' }, async(dir) => {
        await writeFile(join(dir, 'other.css'), 'b { color: blue; }\n');
        await writeFile(join(dir, 'added.css'), 'c { color: green; }\n');
        git(dir, ['add', 'added.css']);
        await writeFile(join(dir, 'untracked.css'), 'd { color: black; }\n');

        const result = await run({ cwd: dir, from: '17', to: '18' });

        assert.equal(result.exitCode, 2);
        assert.match(result.error, /^The git tree has 3 uncommitted changes\./);
      });
    });

    it('leaves out the report file the user asked for, and still counts an edited tracked file', async() => {
      await withProject({ 'a.css': RADIUS_CSS, 'other.css': 'b { color: red; }\n' }, async(dir) => {
        await writeFile(join(dir, 'report.md'), '# Handsontable migration report: 17 to 18\n');

        const clean = await run({ cwd: dir, from: '17', to: '18', reportPath: 'report.md', dryRun: false });

        assert.equal(clean.exitCode, 0, 'an untracked report file of an earlier run is not a change');

        // The run above migrated a.css, so that edit is the one tracked change now.
        const edited = await run({ cwd: dir, from: '17', to: '18', reportPath: 'report.md' });

        assert.equal(edited.exitCode, 2);
        assert.match(edited.error, /^The git tree has 1 uncommitted change\./);
      });
    });
  });

  describe('the clean-tree guard sees a tracked file that git is told not to look at', () => {
    const FLAGS = [
      ['assume-unchanged', 'assume-unchanged', '--assume-unchanged'],
      ['skip-worktree', 'skip-worktree', '--skip-worktree'],
    ];

    for (const [label, flag, option] of FLAGS) {
      it(`refuses an edited file marked ${label}, names the file and the flag, and changes no byte`, async() => {
        await withProject({ 'a.css': RADIUS_CSS, 'other.css': 'b { color: red; }\n' }, async(dir) => {
          git(dir, ['update-index', option, 'other.css']);
          await writeFile(join(dir, 'other.css'), 'b { color: blue; }\n');

          const result = await run({ cwd: dir, from: '17', to: '18' });

          assert.equal(result.exitCode, 2, 'git status shows nothing, and the run was not refused');
          assert.match(result.error,
            new RegExp(`^1 file under this directory is flagged .*: other\\.css \\(${flag}\\)\\.`));
          assert.match(result.error, /--allow-dirty/);
          assert.deepEqual(result.changedFiles, []);
          assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), RADIUS_CSS);
          assert.equal(await readFile(join(dir, 'other.css'), 'utf8'), 'b { color: blue; }\n');
        });
      });

      it(`refuses an unedited file marked ${label} too, because the next edit would stay hidden`, async() => {
        await withProject({ 'a.css': RADIUS_CSS, 'other.css': 'b { color: red; }\n' }, async(dir) => {
          git(dir, ['update-index', option, 'other.css']);

          assert.equal((await run({ cwd: dir, from: '17', to: '18' })).exitCode, 2);
        });
      });

      it(`runs with --allow-dirty and previews with a dry run when a file is marked ${label}`, async() => {
        await withProject({ 'a.css': RADIUS_CSS, 'other.css': 'b { color: red; }\n' }, async(dir) => {
          git(dir, ['update-index', option, 'other.css']);

          assert.equal((await run({ cwd: dir, from: '17', to: '18', dryRun: true })).exitCode, 0);
          assert.equal((await run({ cwd: dir, from: '17', to: '18', allowDirty: true })).exitCode, 0);
          assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), RADIUS_CSS_DONE);
        });
      });
    }

    it('lists the first files, counts the rest, and names the flag of each', async() => {
      const files = Object.fromEntries(Array.from({ length: 7 },
        (_, index) => [`f${index}.css`, 'b { color: red; }\n']));

      await withProject({ 'a.css': RADIUS_CSS, ...files }, async(dir) => {
        git(dir, ['update-index', '--assume-unchanged', 'f0.css', 'f1.css', 'f2.css', 'f3.css', 'f4.css', 'f5.css']);
        git(dir, ['update-index', '--skip-worktree', 'f6.css']);

        const { error } = await run({ cwd: dir, from: '17', to: '18' });

        assert.match(error, /^7 files under this directory are flagged /);
        assert.match(error, /f0\.css \(assume-unchanged\), f1\.css/);
        assert.match(error, /and 2 more\./);
      });
    });

    it('ignores a flagged file outside the directory of the run and a flagged file that is not on disk', async() => {
      await withProject({ 'app/a.css': RADIUS_CSS, 'outside.css': 'b { color: red; }\n', 'app/gone.css': 'c {}\n' },
        async(dir) => {
          git(dir, ['update-index', '--assume-unchanged', 'outside.css']);
          git(dir, ['update-index', '--skip-worktree', 'app/gone.css']);
          await rm(join(dir, 'app', 'gone.css'));

          const result = await run({ cwd: join(dir, 'app'), from: '17', to: '18' });

          assert.equal(result.exitCode, 0, result.error);
          assert.deepEqual(result.changedFiles, ['a.css']);
        });
    });

    it('still runs on a tree with no flagged file', async() => {
      await withProject({ 'a.css': RADIUS_CSS }, async(dir) => {
        assert.equal((await run({ cwd: dir, from: '17', to: '18' })).exitCode, 0);
      });
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

  it('builds no diff for a run that writes', async() => {
    await withProject({ 'a.css': RADIUS_CSS }, async(dir) => {
      const result = await run({ cwd: dir, from: '17', to: '18' });

      assert.deepEqual(result.changedFiles, ['a.css']);
      assert.deepEqual(result.diffs, []);
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
        { id: '18.0.0/one', kind: 'cssVariable', from: '--ht-one', to: '--ht-uno', safe: true },
        { id: '18.0.0/two', kind: 'cssVariable', from: '--ht-two', to: '--ht-dos', safe: true },
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

  it('exits 1 for a file whose transform failed, leaves it alone, and still migrates the others', async() => {
    // A custom rule that throws on a script: the file is left as it was, and the stylesheet is still migrated.
    const versionsDir = await makeVersionsDir({
      '18.0.0': { rules: [
        { id: '18.0.0/boom', kind: 'custom', module: 'custom/boom.mjs', safe: true },
        { id: '18.0.0/radius',
          kind: 'cssVariable',
          from: '--ht-wrapper-border-radius',
          to: '--ht-border-radius',
          safe: true },
      ] },
    });
    const script = 'import Handsontable from \'handsontable\';\r\n\nnew Handsontable(el, {});\r\n';

    await mkdir(join(versionsDir, '18.0.0', 'custom'), { recursive: true });
    await writeFile(join(versionsDir, '18.0.0', 'custom', 'boom.mjs'),
      'export default { fileKinds: [\'js\'], apply(ctx) { ctx.markChanged(); throw new Error(\'boom\'); } };\n');

    try {
      await withProject({ 'mixed.ts': script, 'good.css': RADIUS_CSS }, async(dir) => {
        const result = await run({ cwd: dir, from: '17', to: '18', versionsDir });

        assert.equal(result.exitCode, 1);
        assert.deepEqual(result.changedFiles, ['good.css']);
        const failed = result.report.entries.filter(entry => entry.ruleId === 'transform-error');

        assert.deepEqual(failed.map(entry => entry.file), ['mixed.ts']);
        assert.equal(await readFile(join(dir, 'mixed.ts'), 'utf8'), script);
        assert.equal(await readFile(join(dir, 'good.css'), 'utf8'), RADIUS_CSS_DONE);
      });
    } finally {
      await rm(versionsDir, { recursive: true, force: true });
    }
  });

  it('exits 1 for a file that cannot be read, leaves the rest alone, and still migrates the others', async() => {
    await withProject({ 'good.css': RADIUS_CSS }, async(dir) => {
      // A listed file that is gone by the time the tool reads it: a race with a removal, or a permission.
      const hooks = { discover: async() => ['gone.js', 'good.css'] };
      const result = await run({ cwd: dir, from: '17', to: '18', hooks });

      assert.equal(result.exitCode, 1);
      assert.deepEqual(result.changedFiles, ['good.css']);
      assert.deepEqual(result.report.entries.filter(entry => entry.ruleId === 'read-error').map(entry => entry.file),
        ['gone.js']);
      assert.equal(await readFile(join(dir, 'good.css'), 'utf8'), RADIUS_CSS_DONE);
    });
  });

  it('exits 0 when every file was read, parsed, transformed, and written', async() => {
    await withProject({ 'good.css': RADIUS_CSS }, async(dir) => {
      const result = await run({ cwd: dir, from: '17', to: '18' });

      assert.equal(result.exitCode, 0);
      assert.deepEqual(result.report.entries.filter(entry => entry.severity === 'warning'), []);
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
      '19.0.0': {
        status: 'draft',
        rules: [{ id: '19.0.0/x', kind: 'cssVariable', from: '--ht-a', to: '--ht-b', safe: true }],
      },
      '18.0.0': { rules: [{ id: '18.0.0/y', kind: 'cssVariable', from: '--ht-c', to: '--ht-d', safe: true }] },
    });

    try {
      await withProject({ 'a.css': 'a { --ht-a: 1; --ht-c: 2; }\n' }, async(dir) => {
        const skipped = await run({ cwd: dir, from: '17', to: '19', dryRun: true, versionsDir });

        assert.ok(skipped.notes.some(note => /Skipped draft migrations: 19\.0\.0/.test(note)));
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
      '18.0.0': {
        rules: [{ id: '18.0.0/dep', kind: 'dependency', package: 'handsontable', action: 'bump', safe: true }],
      },
    });
    const dependency = {
      kinds: ['dependency'],
      fileKinds: ['json'],
      apply(ctx) {
        ctx.json.setString('dependencies', 'handsontable', '^18.0.0');
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

describe('symbolic links and the project boundary', () => {
  /**
   * Create a project and a directory outside it with a file the tool would rewrite, link to it from inside the
   * project, and run the callback.
   *
   * @param {{repo: boolean, tracked?: boolean}} options Whether the project is a git repository, and whether the
   * links are committed.
   * @param {(context: {dir: string, outside: string, outsideFile: string}) => Promise<void>} callback Test body.
   * @returns {Promise<void>}
   */
  async function withLinks({ repo, tracked = true }, callback) {
    const outside = await mkdtemp(join(tmpdir(), 'codemod-outside-'));
    const outsideFile = join(outside, 'target.css');

    await writeFile(outsideFile, RADIUS_CSS);
    await writeFile(join(outside, 'inner.css'), RADIUS_CSS);

    await withProject({ 'src/own.css': RADIUS_CSS, 'README.md': '#' }, async(dir) => {
      await symlink(outsideFile, join(dir, 'src', 'link.css'));
      await symlink(outside, join(dir, 'linkdir'));

      if (repo && tracked) {
        git(dir, ['add', '-A']);
        git(dir, ['commit', '-q', '-m', 'links']);
      }

      try {
        await callback({ dir, outside, outsideFile });
      } finally {
        await rm(outside, { recursive: true, force: true });
      }
    }, { repo });
  }

  for (const [label, options] of [
    ['a tracked link in git', { repo: true }],
    ['an untracked link in git', { repo: true, tracked: false }],
    ['a link outside git', { repo: false }],
  ]) {
    it(`never writes through a file or directory link (${label})`, async() => {
      await withLinks(options, async({ dir, outsideFile }) => {
        const result = await run({ cwd: dir, from: '17', to: '18', allowDirty: true });

        assert.deepEqual(result.changedFiles, ['src/own.css']);
        assert.equal(await readFile(outsideFile, 'utf8'), RADIUS_CSS);
        assert.equal(await readFile(join(dir, 'src', 'own.css'), 'utf8'), RADIUS_CSS_DONE);

        const skipped = result.report.skipped().map(entry => entry.file);

        assert.ok(skipped.includes('src/link.css'), skipped.join(','));
        assert.ok(skipped.includes('linkdir'), `a link to a directory is listed once: ${skipped.join(',')}`);
        assert.equal(skipped.filter(file => file === 'linkdir').length, 1);
        assert.equal(result.report.skipped().find(entry => entry.file === 'src/link.css').severity, 'warning');
        assert.match(result.report.skipped()[0].message, /symbolic link/);
      });
    });
  }

  it('skips a directory link named as a path argument, and a file below one', async() => {
    await withLinks({ repo: false }, async({ dir, outside }) => {
      const asDirectory = await run({ cwd: dir, paths: ['linkdir'], from: '17', to: '18' });
      const below = await run({ cwd: dir, paths: ['linkdir/inner.css'], from: '17', to: '18' });
      const direct = await run({ cwd: dir, paths: ['src/link.css'], from: '17', to: '18' });

      for (const result of [asDirectory, below, direct]) {
        assert.deepEqual(result.changedFiles, []);
        assert.equal(result.report.skipped().length, 1);
      }

      assert.equal(await readFile(join(outside, 'inner.css'), 'utf8'), RADIUS_CSS);
    });
  });

  it('knows which real locations are inside the project before a write', async() => {
    await withLinks({ repo: false }, async({ dir }) => {
      assert.equal(await resolvesInside(dir, 'src/own.css'), true);
      assert.equal(await resolvesInside(dir, 'src/link.css'), false);
      assert.equal(await resolvesInside(dir, 'linkdir/inner.css'), false);
      assert.equal(await resolvesInside(dir, 'src/missing.css'), false);
    });
  });

  it('lists a link once, however many roots reach it', async() => {
    await withLinks({ repo: false }, async({ dir }) => {
      const skipped = [];

      await discover({ cwd: dir, paths: ['src', 'src', 'src/link.css'], skipped });

      assert.deepEqual(skipped.map(entry => entry.file), ['src/link.css']);
    });
  });

  it('accepts a project directory whose name starts with two dots', async() => {
    await withProject({ '..odd/a.css': RADIUS_CSS }, async(dir) => {
      assert.deepEqual(await discover({ cwd: dir, paths: ['..odd'] }), ['..odd/a.css']);
      assert.deepEqual(await discover({ cwd: dir, paths: ['..odd/a.css'] }), ['..odd/a.css']);
      await assert.rejects(discover({ cwd: dir, paths: ['..'] }), /outside the project directory/);
      await assert.rejects(discover({ cwd: dir, paths: ['../x'] }), /outside the project directory/);
    });
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
