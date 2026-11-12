import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { ManifestError } from '../src/errors.mjs';
import { PACKAGE_ROOT, RULE_KINDS, buildPlan, loadManifest, loadManifests, validateRule } from '../src/manifest.mjs';
import { KIND_ORDER, registry } from '../src/transforms/index.mjs';

const schema = JSON.parse(await readFile(join(PACKAGE_ROOT, 'src', 'manifest.schema.json'), 'utf8'));

/**
 * Write a version directory with a manifest (and optional extra files) into a temporary versions directory.
 *
 * @param {string} root Versions directory.
 * @param {string} version Version directory name.
 * @param {object} manifest Manifest content. `version`, `status`, and `guide` default to valid values.
 * @param {Record<string, string>} [files] Extra files relative to the version directory.
 * @returns {Promise<string>} The version directory.
 */
async function writeVersion(root, version, manifest, files = {}) {
  const dir = join(root, version);

  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'manifest.json'), JSON.stringify({
    version,
    status: 'released',
    guide: { url: 'https://example.com/guide', source: 'docs/guide.md' },
    ...manifest,
  }));

  for (const [name, content] of Object.entries(files)) {
    await mkdir(join(dir, name, '..'), { recursive: true });
    await writeFile(join(dir, name), content);
  }

  return dir;
}

/**
 * Run a callback with a fresh temporary versions directory.
 *
 * @param {(root: string) => Promise<void>} callback Test body.
 * @returns {Promise<void>}
 */
async function withVersionsDir(callback) {
  const root = await mkdtemp(join(tmpdir(), 'codemod-manifest-'));

  try {
    await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

describe('every shipped manifest', () => {
  it('loads and validates', async() => {
    const manifests = await loadManifests();

    assert.ok(manifests.length >= 2);
    assert.deepEqual(manifests.map(manifest => manifest.version), [...manifests.map(manifest => manifest.version)].sort(
      (a, b) => a.localeCompare(b, undefined, { numeric: true })
    ));
  });

  it('has unique rule ids across all versions, each prefixed with its version', async() => {
    const ids = new Set();

    for (const manifest of await loadManifests()) {
      for (const rule of manifest.rules) {
        assert.ok(rule.id.startsWith(`${manifest.version}/`), rule.id);
        assert.ok(!ids.has(rule.id), `duplicate id ${rule.id}`);
        ids.add(rule.id);
      }
    }
  });

  it('points every guide source at an existing file and builds a public URL', async() => {
    for (const manifest of await loadManifests()) {
      const source = join(PACKAGE_ROOT, '..', manifest.guide.source);

      assert.ok((await readFile(source, 'utf8')).length > 0, manifest.guide.source);
      assert.match(manifest.guide.url, /^https:\/\/handsontable\.com\/docs\/javascript-data-grid\/[^/]+$/);
    }
  });

  it('only uses rule kinds that the kind order knows', async() => {
    for (const manifest of await loadManifests()) {
      for (const rule of manifest.rules) {
        assert.ok(KIND_ORDER.includes(rule.kind), rule.kind);
      }
    }
  });
});

describe('validator and schema parity', () => {
  const schemaKinds = schema.$defs.rule.properties.kind.enum;

  it('knows exactly the kinds the schema lists', () => {
    assert.deepEqual([...Object.keys(RULE_KINDS)].sort(), [...schemaKinds].sort());
  });

  it('requires the same fields per kind as the schema', () => {
    for (const branch of schema.$defs.rule.allOf) {
      const kind = branch.if.properties.kind.const;

      assert.deepEqual(
        [...branch.then.required].sort(),
        Object.keys(RULE_KINDS[kind].required).sort(),
        `required fields of ${kind}`
      );
    }

    assert.equal(schema.$defs.rule.allOf.length, schemaKinds.length);
  });

  it('matches the kind order and the registry', () => {
    assert.deepEqual([...KIND_ORDER].sort(), [...schemaKinds].sort());

    for (const kind of registry.byKind.keys()) {
      assert.ok(schemaKinds.includes(kind), kind);
    }
  });
});

describe('validateRule', () => {
  it('accepts a minimal rule of each kind', () => {
    for (const [kind, spec] of Object.entries(RULE_KINDS)) {
      const rule = { id: '18.0.0/x', kind, safe: false };

      Object.entries(spec.required).forEach(([field, type]) => {
        rule[field] = { string: 'a', strings: ['a'], stringOrStrings: 'a', object: { a: 1 }, boolean: true }[type];
      });

      assert.deepEqual(validateRule(rule, '18.0.0'), [], kind);
    }
  });

  it('reports unknown kinds, missing fields, wrong types, and bad ids', () => {
    const first = rule => validateRule(rule, '18.0.0')[0];
    const remove = { id: '18.0.0/x', kind: 'optionRemove', name: 'a', safe: true };
    const css = { id: '18.0.0/x', kind: 'cssVariable', from: 'a', to: 'b', safe: true };

    assert.match(first({ id: '18.0.0/x', kind: 'nope' }), /unknown kind/);
    assert.match(first({ id: css.id, kind: 'optionRename', from: 'a' }), /missing required field "to"/);
    assert.match(first({ ...css, to: 1 }), /"to" must be of type string/);
    assert.match(first({ ...remove, id: '17.0.0/x' }), /must start with "18\.0\.0\/"/);
    assert.match(first({ ...remove, id: '18.0.0/' }), /no slug/);
    assert.match(first({ ...remove, safe: 'yes' }), /"safe" must be of type boolean/);
    assert.match(first({ ...remove, minConfidence: 'low' }), /minConfidence/);
    assert.deepEqual(validateRule('text', '18.0.0'), ['the rule is not an object']);
  });

  it('requires safe on every kind except detect and exportRemoved, which only report', () => {
    const problems = rule => validateRule({ id: '18.0.0/x', ...rule }, '18.0.0');

    assert.match(problems({ kind: 'optionRemove', name: 'a' })[0], /missing required field "safe"/);
    assert.match(problems({ kind: 'dependency' })[0], /missing required field "safe"/);
    assert.match(problems({ kind: 'custom', module: 'a.mjs' })[0], /missing required field "safe"/);
    assert.deepEqual(problems({ kind: 'detect', match: { string: 'a' } }), []);
    assert.deepEqual(problems({ kind: 'exportRemoved', source: 'a', name: 'b', safe: false }), []);
    assert.match(problems({ kind: 'detect', match: { string: 'a' }, safe: true })[0], /only report/);
    assert.match(problems({ kind: 'exportRemoved', source: 'a', name: 'b', safe: true })[0], /only report/);
  });

  it('allows extra properties so a transform can grow', () => {
    const rule = { id: '18.0.0/x', kind: 'optionRemove', name: 'a', safe: true, futureField: [1] };

    assert.deepEqual(validateRule(rule, '18.0.0'), []);
  });
});

describe('loadManifest', () => {
  it('gives the report-only kinds safe: false and never invents safe for another kind', async() => {
    await withVersionsDir(async(root) => {
      const dir = await writeVersion(root, '18.0.0', {
        rules: [
          { id: '18.0.0/d', kind: 'detect', match: { string: 'a' } },
          { id: '18.0.0/r', kind: 'exportRemoved', source: 'a', name: 'b' },
          { id: '18.0.0/o', kind: 'optionRemove', name: 'a', safe: true },
        ],
      });
      const manifest = await loadManifest(dir);

      assert.deepEqual(manifest.rules.map(rule => rule.safe), [false, false, true]);
    });
  });

  it('rejects a duplicate id', async() => {
    await withVersionsDir(async(root) => {
      const rule = { id: '18.0.0/a', kind: 'optionRemove', name: 'x', safe: true };
      const dir = await writeVersion(root, '18.0.0', { rules: [rule, rule] });

      await assert.rejects(loadManifest(dir), (error) => {
        return error instanceof ManifestError && /duplicate id/.test(error.message);
      });
    });
  });

  it('rejects a version that differs from the directory and an invalid status', async() => {
    await withVersionsDir(async(root) => {
      const dir = await writeVersion(root, '18.0.0', { version: '18.0.1', status: 'beta', rules: [] });

      await assert.rejects(loadManifest(dir), (error) => {
        return /"version" is "18\.0\.1"/.test(error.message) && /"status"/.test(error.message);
      });
    });
  });

  it('lists every problem at once', async() => {
    await withVersionsDir(async(root) => {
      const dir = await writeVersion(root, '18.0.0', { rules: [{ id: 'bad', kind: 'nope' }, { id: '18.0.0/y' }] });

      await assert.rejects(loadManifest(dir), error => error.message.split('\n').length >= 3);
    });
  });

  it('merges included files after the inline rules and checks them too', async() => {
    await withVersionsDir(async(root) => {
      const dir = await writeVersion(root, '18.0.0', {
        include: ['rules/types.json'],
        rules: [{ id: '18.0.0/inline', kind: 'optionRemove', name: 'a', safe: true }],
      }, {
        'rules/types.json': JSON.stringify({
          rules: [{ id: '18.0.0/included', kind: 'optionRemove', name: 'b', safe: true }],
        }),
      });
      const manifest = await loadManifest(dir);

      assert.deepEqual(manifest.rules.map(rule => rule.id), ['18.0.0/inline', '18.0.0/included']);

      const clash = { rules: [{ id: '18.0.0/inline', kind: 'optionRemove', name: 'b', safe: true }] };

      await writeFile(join(dir, 'rules', 'types.json'), JSON.stringify(clash));
      await assert.rejects(loadManifest(dir), /duplicate id/);
    });
  });

  it('rejects an include or a custom module that leaves the version directory', async() => {
    await withVersionsDir(async(root) => {
      const outside = await writeVersion(root, '18.0.0', { include: ['../escape.json'], rules: [] });

      await assert.rejects(loadManifest(outside), /must stay inside the version directory/);

      const custom = await writeVersion(root, '18.1.0', {
        rules: [{ id: '18.1.0/c', kind: 'custom', module: '../../x.mjs' }],
      });

      await assert.rejects(loadManifest(custom), /must stay inside the version directory/);
    });
  });

  it('resolves a custom module relative to the version directory and requires it to exist', async() => {
    await withVersionsDir(async(root) => {
      const dir = await writeVersion(root, '18.1.0', {
        rules: [{ id: '18.1.0/c', kind: 'custom', module: 'custom/x.mjs', safe: false }],
      }, { 'custom/x.mjs': 'export default {};' });
      const manifest = await loadManifest(dir);

      assert.equal(manifest.rules[0].modulePath, join(dir, 'custom', 'x.mjs'));

      await rm(join(dir, 'custom', 'x.mjs'));
      await assert.rejects(loadManifest(dir), /custom module "custom\/x\.mjs" does not exist/);
    });
  });

  it('builds the guide URL of a rule from the guide URL and the anchor', async() => {
    await withVersionsDir(async(root) => {
      const dir = await writeVersion(root, '18.0.0', {
        rules: [
          { id: '18.0.0/a', kind: 'optionRemove', name: 'a', safe: true, guide: '_1-step' },
          { id: '18.0.0/b', kind: 'optionRemove', name: 'b', safe: true },
        ],
      });
      const manifest = await loadManifest(dir);

      assert.equal(manifest.rules[0].guideUrl, 'https://example.com/guide#_1-step');
      assert.equal(manifest.rules[1].guideUrl, 'https://example.com/guide');
      assert.equal(manifest.rules[0].safe, true);
      assert.equal(manifest.rules[0].version, '18.0.0');
    });
  });
});

describe('buildPlan', () => {
  it('keeps only the requested rule ids and drops versions left empty', async() => {
    const manifests = await loadManifests();
    const all = buildPlan(manifests);
    const only = buildPlan(manifests, ['18.0.0/css-wrapper-border-radius']);

    assert.equal(only.rulesById.size, 1);
    assert.deepEqual(only.versions.map(entry => entry.version), ['18.0.0']);
    assert.ok(all.rulesById.size >= only.rulesById.size);
  });
});
