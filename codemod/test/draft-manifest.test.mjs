import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { main } from '../src/cli.mjs';
import { UsageError } from '../src/errors.mjs';
import { VERSIONS_DIR, buildPlan, loadManifest, loadManifests } from '../src/manifest.mjs';
import { resolvePlan } from '../src/runner.mjs';
import { checkAnchors, missingAnchors } from './helpers/guide-anchors.mjs';

const GUIDE = '## 1. Keep this\n\n## Rename me later\n';

/**
 * Write one version directory with a manifest into a temporary versions directory.
 *
 * @param {string} root Versions directory.
 * @param {string} version Version directory name.
 * @param {object} manifest Fields that replace the defaults of a valid manifest.
 * @returns {Promise<string>} The version directory.
 */
async function writeVersion(root, version, manifest) {
  const dir = join(root, version);

  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'manifest.json'), JSON.stringify({
    version,
    from: String(Number(version.split('.')[0]) - 1),
    status: 'released',
    guide: { url: 'https://example.com/guide', source: 'docs/guide.md' },
    rules: [],
    ...manifest,
  }));

  return dir;
}

/**
 * Run a callback with a fresh temporary directory.
 *
 * @param {(root: string) => Promise<void>} callback Test body.
 * @returns {Promise<void>}
 */
async function withTempDir(callback) {
  const root = await mkdtemp(join(tmpdir(), 'codemod-draft-'));

  try {
    await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

/**
 * Run the CLI in process and capture its output.
 *
 * @param {string[]} argv Arguments.
 * @returns {Promise<{code: number, out: string, err: string}>} Exit code and captured streams.
 */
async function cli(argv) {
  let out = '';
  let err = '';
  const code = await main(argv, { cwd: tmpdir(),
    stdout: (text) => {
      out += text;
    },
    stderr: (text) => {
      err += text;
    } });

  return { code, out, err };
}

describe('a draft manifest', () => {
  const rule = { id: '19.0.0/a', kind: 'optionRemove', name: 'a', safe: true };

  it('stays out of a default run and of the default --to, and runs with includeDraft', async() => {
    await withTempDir(async(root) => {
      await writeVersion(root, '18.1.0', { from: '18.0', rules: [{ ...rule, id: '18.1.0/a' }] });
      await writeVersion(root, '19.0.0', { from: '18.1', status: 'draft', rules: [rule] });

      const normal = await resolvePlan({ cwd: root, from: '18.0', versionsDir: root });
      const upTo = await resolvePlan({ cwd: root, from: '18.0', to: '19.0', versionsDir: root });
      const drafts = await resolvePlan({ cwd: root, from: '18.0', includeDraft: true, versionsDir: root });

      assert.deepEqual(normal.selected.map(manifest => manifest.version), ['18.1.0']);
      assert.equal(normal.toText, '18.1.0');
      assert.deepEqual(upTo.selected.map(manifest => manifest.version), ['18.1.0']);
      assert.ok(upTo.notes.some(note => /Skipped draft migrations: 19\.0\.0/.test(note)));
      assert.deepEqual(drafts.selected.map(manifest => manifest.version), ['18.1.0', '19.0.0']);
      await assert.rejects(resolvePlan({ cwd: root, from: '18.1', to: '19.0', versionsDir: root }),
        error => error instanceof UsageError && /Only draft migrations are in range, add --include-draft/
          .test(error.message));
    });
  });

  it('keeps every shipped draft out of a default run, and selects it with includeDraft', async() => {
    const manifests = await loadManifests();
    const drafts = manifests.filter(manifest => manifest.status === 'draft');

    for (const draft of drafts) {
      // A default run with nothing released in range is a usage error, which also keeps the draft out.
      const normal = await resolvePlan({ cwd: tmpdir(), from: draft.from }).catch(error => error);
      const included = await resolvePlan({ cwd: tmpdir(), from: draft.from, to: draft.version, includeDraft: true });

      assert.ok(normal instanceof UsageError || !normal.selected.some(manifest => manifest.version === draft.version),
        draft.version);
      assert.ok(included.selected.some(manifest => manifest.version === draft.version), draft.version);
    }
  });

  it('is what the 19.0.0 manifest is until its guide is final', async() => {
    // Delete this test with the flip of 19.0.0 to released, which also needs the README row (readme.test.mjs).
    const manifest = (await loadManifests()).find(item => item.version === '19.0.0');

    assert.equal(manifest.status, 'draft');
    assert.equal(manifest.from, '18.1');

    const normal = await resolvePlan({ cwd: tmpdir(), from: '18.1' }).catch(error => error);
    const explicit = await resolvePlan({ cwd: tmpdir(), from: '18.1', to: '19.0' }).catch(error => error);

    assert.ok(normal instanceof UsageError, 'a default run from 18.1 has nothing released to migrate to');
    assert.match(normal.message, /Known migrations: .*19\.0\.0 \(draft\)/);
    assert.ok(explicit instanceof UsageError, 'a run to 19.0 without --include-draft has nothing to migrate');
    assert.match(explicit.message, /Only draft migrations are in range, add --include-draft to run them\./);

    const listed = await cli(['migrate', '--list', '--from', '18.1', '--to', '19.0', '--include-draft']);
    const rows = listed.out.split('\n').filter(line => line.startsWith('19.0.0/'));

    assert.equal(listed.code, 0);
    assert.ok(rows.length > 20, `${rows.length} rules listed`);
    assert.match(listed.out.trimEnd().split('\n').pop(), /^\d+ rules: \d+ rewrite, \d+ report\.$/);
  });
});

describe('the guide anchors of a manifest', () => {
  const rules = [
    { id: 'x/kept', guide: 'keep-this' },
    { id: 'x/renamed', guide: 'old-heading' },
    { id: 'x/no-section' },
  ];

  /**
   * A manifest like the loader returns it, with the given status.
   *
   * @param {string} status `released` or `draft`.
   * @returns {object} The manifest.
   */
  const manifestOf = status => ({ version: '19.0.0', status, rules, guide: { source: 'docs/guide.md' } });

  it('lists the rules whose anchor is no heading of the guide', () => {
    assert.deepEqual(missingAnchors(manifestOf('released'), GUIDE), [{ id: 'x/renamed', guide: 'old-heading' }]);
    assert.deepEqual(missingAnchors({ rules: [rules[0], rules[2]] }, GUIDE), []);
  });

  it('fails for a released manifest', () => {
    const messages = [];

    assert.throws(() => checkAnchors(manifestOf('released'), GUIDE, { diagnostic: text => messages.push(text) }),
      /x\/renamed/);
    assert.deepEqual(messages, []);
  });

  it('only reports a draft manifest through a test diagnostic', () => {
    const messages = [];
    const missing = checkAnchors(manifestOf('draft'), GUIDE, { diagnostic: text => messages.push(text) });

    assert.deepEqual(missing, [{ id: 'x/renamed', guide: 'old-heading' }]);
    assert.equal(messages.length, 1);
    assert.match(messages[0], /draft 19\.0\.0: x\/renamed anchor "old-heading" is not a heading of docs\/guide\.md/);
  });

  it('keeps a loaded temporary manifest on the same policy', async() => {
    await withTempDir(async(root) => {
      const guideFile = join(root, 'guide.md');
      const body = { rules: [{ id: '19.0.0/a', kind: 'optionRemove', name: 'a', safe: true, guide: 'gone' }] };

      await writeFile(guideFile, GUIDE);

      for (const status of ['released', 'draft']) {
        const dir = await writeVersion(join(root, status), '19.0.0', { ...body, status, from: '18.1' });
        const manifest = await loadManifest(dir);
        const messages = [];
        const outcome = () => checkAnchors(manifest, GUIDE, { diagnostic: text => messages.push(text) });

        if (status === 'released') {
          assert.throws(outcome, /19\.0\.0\/a/);
        } else {
          assert.equal(outcome().length, 1);
          assert.equal(messages.length, 1);
        }
      }
    });
  });
});

describe('notAutomated', () => {
  it('is loaded, collected by the plan, and printed by --list as one line before the counts', async() => {
    await withTempDir(async(root) => {
      await writeVersion(root, '18.1.0', { from: '18.0' });
      await writeVersion(root, '19.0.0', {
        from: '18.1',
        status: 'draft',
        rules: [{ id: '19.0.0/a', kind: 'optionRemove', name: 'a', safe: true }],
        notAutomated: [{ guide: 'some-section', reason: 'It is a behavior change.' },
          { title: 'A row of the deprecation table', reason: 'The guide has no section for it.' }],
      });

      const manifests = await loadManifests(root);
      const plan = buildPlan(manifests.filter(manifest => manifest.version === '19.0.0'));

      assert.equal(manifests[1].notAutomated.length, 2);
      assert.deepEqual(manifests[0].notAutomated, []);
      assert.deepEqual(plan.notAutomated.map(item => item.version), ['19.0.0', '19.0.0']);
    });
  });

  it('is rejected when an item has no reason, no name, both names, or repeats a name', async() => {
    const bad = [
      [{ guide: 'a' }, /"notAutomated\[0\]" must be an object with a string "reason"/],
      [{ reason: 'Why.' }, /"notAutomated\[0\]" must be an object with a string "reason"/],
      [{ guide: 'a', title: 'b', reason: 'Why.' }, /exactly one of the string fields "guide" and "title"/],
      [[{ guide: 'a', reason: 'Why.' }, { guide: 'a', reason: 'Why.' }], /repeats "a"/],
      [[], /"notAutomated" must be a non-empty array/],
    ];

    for (const [value, pattern] of bad) {
      await withTempDir(async(root) => {
        const dir = await writeVersion(root, '19.0.0', { notAutomated: Array.isArray(value) ? value : [value] });

        await assert.rejects(loadManifest(dir), pattern);
      });
    }
  });

  it('prints its summary line before the counts, so the last line stays the counts', async() => {
    const { code, out } = await cli(['migrate', '--list', '--from', '18.1', '--to', '19.0', '--include-draft']);
    const lines = out.trimEnd().split('\n');

    assert.equal(code, 0);
    assert.match(lines.at(-1), /^\d+ rules: \d+ rewrite, \d+ report\.$/);
    assert.match(lines.at(-3), /^Changes with no rule, to read in the guide: \d+ in 19\.0\.0\.$/);
    assert.equal(lines.at(-2), '');

    const old = await cli(['migrate', '--list', '--from', '17', '--to', '18.1']);

    assert.doesNotMatch(old.out, /Changes with no rule/);
  });

  it('names every guide section of the 19.0.0 manifest that has no rule, and none that has one', async(context) => {
    const manifest = (await loadManifests()).find(item => item.version === '19.0.0');

    context.diagnostic(`${manifest.notAutomated.length} entries`);

    const withRule = new Set(manifest.rules.map(rule => rule.guide).filter(Boolean));
    const listed = manifest.notAutomated.map(item => item.guide).filter(Boolean);

    assert.deepEqual(listed.filter(anchor => withRule.has(anchor)), []);
    assert.ok(manifest.notAutomated.every(item => item.reason.endsWith('.') && !/[\u2013\u2014]/.test(item.reason)));
  });
});

describe('the fixtures of every shipped draft', () => {
  it('give every rule of the manifest a fixture that names it', async() => {
    const drafts = (await loadManifests()).filter(manifest => manifest.status === 'draft');

    for (const manifest of drafts) {
      const root = join(VERSIONS_DIR, manifest.version, '__fixtures__');
      const named = new Set();

      for (const entry of await readdir(root, { withFileTypes: true })) {
        const report = await readFile(join(root, entry.name, 'report.json'), 'utf8').catch(() => '[]');
        const parsed = JSON.parse(report);

        (Array.isArray(parsed) ? parsed : parsed.entries ?? []).forEach(item => named.add(item.ruleId));
      }

      assert.deepEqual(manifest.rules.map(rule => rule.id).filter(id => !named.has(id)), [], manifest.version);
    }
  });
});
