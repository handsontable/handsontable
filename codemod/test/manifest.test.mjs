import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { ManifestError } from '../src/errors.mjs';
import {
  COMMON_FIELDS, PACKAGE_ROOT, RULE_KINDS, buildPlan, loadManifest, loadManifests, validateRule,
} from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';
import { KIND_ORDER, registry } from '../src/transforms/index.mjs';
import { anchorsOf, checkAnchors, slugOf } from './helpers/guide-anchors.mjs';
import { guidePath, skipWithoutGuides, withGuide } from './helpers/guide-source.mjs';

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
    from: String(Number(version.split('.')[0]) - 1),
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

  it('points every guide source at an existing file and builds a public URL', async(context) => {
    const manifests = await loadManifests();

    for (const manifest of manifests.filter(item => item.status === 'released')) {
      assert.ok(manifest.guide, `${manifest.version} is released and has no guide`);
    }

    for (const manifest of withGuide(manifests)) {
      assert.match(manifest.guide.url, /^https:\/\/handsontable\.com\/docs\/javascript-data-grid\/[^/]+$/);
    }

    if (skipWithoutGuides(context, manifests)) {
      return;
    }

    for (const manifest of withGuide(manifests)) {
      assert.ok((await readFile(guidePath(manifest), 'utf8')).length > 0, manifest.guide.source);
    }
  });

  it('names an anchor in every rule `guide` of a released manifest that is a heading of its guide', async(context) => {
    const manifests = await loadManifests();

    if (skipWithoutGuides(context, manifests)) {
      return;
    }

    for (const manifest of withGuide(manifests)) {
      checkAnchors(manifest, await readFile(guidePath(manifest), 'utf8'), context);
    }
  });

  it('builds anchors with the slug rules of the docs site', () => {
    assert.equal(slugOf('Replace `handsontable/common` imports'), 'replace-handsontablecommon-imports');
    assert.equal(slugOf('6. Update theme wrapper border variables'), 'update-theme-wrapper-border-variables');
    assert.equal(slugOf('Migrate numeric format from Numbro.js `pattern` to `Intl.NumberFormat`'),
      'migrate-numeric-format-from-numbrojs-pattern-to-intlnumberformat');
    assert.equal(slugOf('How to migrate -- date cells'), 'how-to-migrate--date-cells');
    assert.equal(slugOf('8. <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + click on a cell'), 'cmdctrl--click-on-a-cell');
    assert.equal(slugOf('Icons are rendered as `<i>` elements'), 'icons-are-rendered-as-i-elements');
    assert.equal(slugOf('Use `--ht-gap` for spacing'), 'use---ht-gap-for-spacing');
    assert.deepEqual([...anchorsOf('## A\n### Who\n```sh\n## not a heading\n```\n## B\n### Who\n')],
      ['a', 'who', 'b', 'who-1']);
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

  it('accepts the same "severity" values for a rule as the loader does', () => {
    const ruleSchema = schema.$defs.rule;
    const bases = {
      detect: { id: '18.0.0/x', kind: 'detect', match: { import: 'a' }, files: ['js'], message: 'Check it.' },
      methodRemove: { id: '18.0.0/x', kind: 'methodRemove', methods: ['a'], receiver: 'any', safe: false },
      exportRemoved: { id: '18.0.0/x', kind: 'exportRemoved', source: 'a', name: 'B', advice: 'Use C.' },
    };

    /**
     * Whether the schema lets a rule of the kind carry the severity: the common property, the branch of the kind,
     * and the `not` clause that keeps `warning` for `detect`.
     *
     * @param {string} kind Rule kind.
     * @param {string} severity The value.
     * @returns {boolean} `true` when the schema accepts it.
     */
    const schemaAccepts = (kind, severity) => {
      const branch = ruleSchema.allOf.find(item => item.if.properties.kind.const === kind);
      const own = branch?.then.properties?.severity?.enum;
      const clause = ruleSchema.not;
      const excluded = clause && clause.properties.kind.not.const !== kind
        && severity === clause.properties.severity.const;

      return ruleSchema.properties.severity.enum.includes(severity) && (!own || own.includes(severity)) && !excluded;
    };

    for (const [kind, base] of Object.entries(bases)) {
      for (const severity of ['manual', 'review', 'warning', 'high']) {
        const rule = { ...base, severity };
        const loader = [...validateRule(rule, '18.0.0'), ...registry.validate(rule)].length === 0;

        assert.equal(schemaAccepts(kind, severity), loader, `${kind} with severity ${severity}`);
      }
    }

    assert.equal(schemaAccepts('detect', 'warning'), true);
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
        rule[field] = {
          string: 'a',
          strings: ['a'],
          stringOrStrings: 'a',
          stringOrObject: 'a',
          object: { a: 1 },
          boolean: true,
        }[type];
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

  it('checks the optionMove fields onlyTypes and typeAdvice and the callUnwrap field arg', () => {
    const move = { id: '18.0.0/x', kind: 'optionMove', from: 'a.b', to: 'c', safe: true };
    const unwrap = { id: '18.0.0/x', kind: 'callUnwrap', callee: 'Handsontable.helper.sanitize', safe: true };

    assert.deepEqual(validateRule({ ...move, onlyTypes: ['numeric'], typeAdvice: 'Move it by hand.' }, '18.0.0'), []);
    assert.deepEqual(validateRule({ ...unwrap, arg: 0 }, '18.0.0'), []);
    assert.deepEqual(validateRule({ ...unwrap, arg: 2 }, '18.0.0'), []);

    assert.match(validateRule({ ...move, onlyTypes: 'numeric' }, '18.0.0')[0], /"onlyTypes" must be of type strings/);
    assert.match(validateRule({ ...move, onlyTypes: [] }, '18.0.0')[0], /"onlyTypes" must be of type strings/);
    assert.match(validateRule({ ...move, onlyTypes: ['numeric', 1] }, '18.0.0')[0], /"onlyTypes"/);
    assert.match(validateRule({ ...move, typeAdvice: 5 }, '18.0.0')[0], /"typeAdvice" must be of type string/);
    assert.match(validateRule({ ...move, typeAdvice: '' }, '18.0.0')[0], /"typeAdvice" must be of type string/);
    assert.match(validateRule({ ...unwrap, arg: '1' }, '18.0.0')[0], /"arg" must be of type index/);
    assert.match(validateRule({ ...unwrap, arg: 1.5 }, '18.0.0')[0], /"arg" must be of type index/);
    assert.match(validateRule({ ...unwrap, arg: -1 }, '18.0.0')[0], /"arg" must be of type index/);
  });

  it('knows every field the schema lists for a kind', () => {
    const common = new Set([...Object.keys(COMMON_FIELDS.required), ...Object.keys(COMMON_FIELDS.optional)]);

    for (const branch of schema.$defs.rule.allOf) {
      const kind = branch.if.properties.kind.const;
      const known = new Set([...Object.keys(RULE_KINDS[kind].required), ...Object.keys(RULE_KINDS[kind].optional)]);
      const listed = Object.keys(branch.then.properties ?? {});
      const missing = listed.filter(field => !known.has(field) && !common.has(field));

      assert.deepEqual(missing, [], `fields of ${kind} that the schema lists and the validator does not check`);
    }
  });

  it('requires a noKeyAdvice when a plugin maps to no option key and the advice uses {optionKey}', () => {
    const rule = {
      id: '18.0.0/x',
      kind: 'exportRemoved',
      source: 'handsontable/plugins/*',
      name: 'Settings',
      advice: 'Use GridSettings[\'{optionKey}\'].',
      optionKeys: { touchScroll: null },
    };

    assert.match(validateRule(rule, '18.0.0')[0], /noKeyAdvice/);
    assert.deepEqual(validateRule({ ...rule, noKeyAdvice: 'Use boolean.' }, '18.0.0'), []);
    assert.deepEqual(validateRule({ ...rule, advice: 'Use boolean.' }, '18.0.0'), []);
    assert.deepEqual(validateRule({ ...rule, optionKeys: { autofill: 'fillHandle' } }, '18.0.0'), []);
  });

  it('rejects {optionKey} in the message when a plugin maps to no option key, with or without a noKeyAdvice', () => {
    // `noKeyAdvice` replaces the advice only: export-removed.mjs expands the message with the message itself in that
    // place, so the key would print empty for the plugin that has none.
    const rule = {
      id: '18.0.0/x',
      kind: 'exportRemoved',
      source: 'handsontable/plugins/*',
      name: 'Settings',
      message: 'Use GridSettings[\'{optionKey}\'] instead of the plugin type.',
      advice: 'Use the option.',
      optionKeys: { touchScroll: null },
    };

    const withNoKeyAdvice = { ...rule, noKeyAdvice: 'Use boolean.' };

    for (const problems of [validateRule(rule, '18.0.0'), validateRule(withNoKeyAdvice, '18.0.0')]) {
      assert.equal(problems.length, 1);
      assert.match(problems[0], /the message uses \{optionKey\}/);
      assert.match(problems[0], /put it in the advice/);
    }

    assert.deepEqual(validateRule({ ...rule, message: 'Use the option.' }, '18.0.0'), []);
    assert.deepEqual(validateRule({ ...rule, optionKeys: { autofill: 'fillHandle' } }, '18.0.0'), []);
  });

  it('keeps the {optionKey} of the advice with a noKeyAdvice when the message has none', () => {
    const rule = {
      id: '18.0.0/x',
      kind: 'exportRemoved',
      source: 'handsontable/plugins/*',
      name: 'Settings',
      message: 'The plugin type is removed.',
      advice: 'Use GridSettings[\'{optionKey}\'].',
      optionKeys: { touchScroll: null },
    };

    assert.match(validateRule(rule, '18.0.0')[0], /the advice uses \{optionKey\}.*noKeyAdvice/);
    assert.deepEqual(validateRule({ ...rule, noKeyAdvice: 'Use boolean.' }, '18.0.0'), []);
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
          { id: '18.0.0/d', kind: 'detect', match: { string: 'a' }, files: ['js'], message: 'm' },
          { id: '18.0.0/r', kind: 'exportRemoved', source: 'a', name: 'b', advice: 'a' },
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

  it('rejects a malformed rule of every kind at load, naming the rule and the field', async() => {
    const bad = [
      ['detect', { kind: 'detect', safe: false, match: { string: 'a' } }, /"message" is required/],
      ['cssVariable', { kind: 'cssVariable', safe: true, from: '--a' }, /needs "to" or "removed": true/],
      ['themeToken', { kind: 'themeToken', safe: true, from: 'a' }, /needs "to" or "removed": true/],
      ['methodRemove', { kind: 'methodRemove', safe: true, methods: ['a'], receiver: 'sometimes' }, /"receiver"/],
      ['methodRemove', { kind: 'methodRemove', safe: true, methods: ['a'], receiver: { plugin: [] } },
        /"receiver.plugin" must be a plugin key/],
      ['methodMove', {
        kind: 'methodMove',
        safe: true,
        methods: { a: 'b' },
        via: { method: 'x' },
        receiver: 'instance',
      }, /"via"/],
      ['namespaceType', { kind: 'namespaceType', safe: true, from: 'Handsontable.A' }, /needs "to"/],
      ['exportRemoved', { kind: 'exportRemoved', source: 'a', name: 'b' }, /needs "advice"/],
      ['importSource', { kind: 'importSource', safe: true, from: 'a', exports: { X: {} } }, /"X" needs "to"/],
      ['callUnwrap', { kind: 'callUnwrap', safe: false, callee: 'sanitize' }, /"callee" to be a dotted path/],
      ['optionMove', { kind: 'optionMove', safe: true, from: 'culture', to: 'locale' },
        /"from" must be "<option>.<key>"/],
      ['optionMove', { kind: 'optionMove', safe: true, from: 'a.b', to: 'c', levels: ['colum'] },
        /"levels" must be a non-empty list of "grid", "column", or "cell"/],
      ['optionMove', { kind: 'optionMove', safe: true, from: 'a.b', to: 'c', levels: [] },
        /"levels" must be of type strings/],
      ['optionMove', { kind: 'optionMove', safe: true, from: 'a.b', to: 'c', levels: ['grid', 'cell'] }, null],
      ['optionRename', {
        kind: 'optionRename',
        safe: true,
        from: 'a',
        to: 'b',
        context: { callArg: ['x'], receiver: 1 },
      }, /"context.receiver"/],
      ['exportRename', { kind: 'exportRename', safe: true, source: ['a'], from: 'A', to: 'B' }, null],
    ];

    for (const [kind, fields, expected] of bad) {
      await withVersionsDir(async(root) => {
        const dir = await writeVersion(root, '18.0.0', { rules: [{ id: `18.0.0/${kind}-x`, ...fields }] });

        if (expected === null) {
          assert.ok(await loadManifest(dir));

          return;
        }

        await assert.rejects(loadManifest(dir), (error) => {
          assert.ok(error.message.includes(`18.0.0/${kind}-x`), error.message);
          assert.match(error.message, expected);

          return true;
        });
      });
    }
  });

  it('rejects a malformed rule when every manifest loads, and never as a per-file error', async() => {
    await withVersionsDir(async(root) => {
      await writeVersion(root, '18.0.0', {
        rules: [{ id: '18.0.0/css-x', kind: 'cssVariable', safe: true, from: '--a' }],
      });
      await assert.rejects(loadManifests(root), /18\.0\.0\/css-x.*needs "to" or "removed": true/);
    });
  });

  it('requires from: the version line the migration starts from, below its own version', async() => {
    await withVersionsDir(async(root) => {
      const missing = await writeVersion(root, '18.0.0', { from: undefined });
      const word = await writeVersion(root, '19.0.0', { from: 'seventeen' });
      const above = await writeVersion(root, '20.0.0', { from: '20' });
      const ok = await writeVersion(root, '21.0.0', { from: '20.1' });

      await assert.rejects(loadManifest(missing), /"from" must name the version line/);
      await assert.rejects(loadManifest(word), /"from" must name the version line/);
      await assert.rejects(loadManifest(above), /"from" \(20\) must be below the version "20\.0\.0"/);
      assert.equal((await loadManifest(ok)).from, '20.1');
    });
  });

  it('rejects a from that is not a string, with a manifest error and not a TypeError', async() => {
    await withVersionsDir(async(root) => {
      for (const [version, from] of [['18.0.0', 17], ['19.0.0', 17.1], ['20.0.0', ['17']], ['21.0.0', null],
        ['22.0.0', { line: 17 }]]) {
        const dir = await writeVersion(root, version, { from });

        await assert.rejects(loadManifest(dir), (error) => {
          return error instanceof ManifestError && /"from" must name the version line/.test(error.message);
        }, JSON.stringify(from));
      }
    });
  });

  it('fails when the versions directory holds a directory that is not named for a full semver version', async() => {
    await withVersionsDir(async(root) => {
      await writeVersion(root, '18.0.0', {});
      await writeVersion(root, '19.0', {});
      await writeVersion(root, 'v19.0.0', {});
      await mkdir(join(root, '.cache'));

      await assert.rejects(loadManifests(root), (error) => {
        return error instanceof ManifestError
          && /not named for a full semver version.*"19\.0", "v19\.0\.0"/.test(error.message)
          && !/\.cache/.test(error.message);
      });
    });
  });

  it('fails for a twin that names no rule, and loads one that names a rule of another manifest', async() => {
    await withVersionsDir(async(root) => {
      const rule = (id, extra = {}) => ({
        id, kind: 'detect', files: ['js'], message: 'm', match: { string: 'a' }, ...extra,
      });

      await writeVersion(root, '18.0.0', { rules: [rule('18.0.0/a')] });
      await writeVersion(root, '19.0.0', { rules: [rule('19.0.0/a', { twins: ['18.0.0/a'] })] });
      assert.equal((await loadManifests(root)).length, 2);

      await writeVersion(root, '20.0.0', { rules: [rule('20.0.0/a', { twins: ['19.0.0/a', '19.0.0/typo'] })] });
      await assert.rejects(loadManifests(root), (error) => {
        return error instanceof ManifestError
          && /20\.0\.0\/a lists the twin "19\.0\.0\/typo", which is no rule/.test(error.message)
          && !/"19\.0\.0\/a"/.test(error.message);
      });
    });
  });

  it('loads the shipped manifests, drafts included', async() => {
    const manifests = await loadManifests();

    assert.ok(manifests.some(manifest => manifest.status === 'draft'));
    assert.ok(manifests.flatMap(manifest => manifest.rules).some(rule => rule.twins?.length > 0));
  });

  it('ships a from for every released migration', async() => {
    const manifests = await loadManifests();

    for (const manifest of manifests) {
      assert.match(manifest.from, /^\d+(\.\d+){0,2}$/, manifest.version);
    }

    assert.equal(manifests.find(manifest => manifest.version === '18.0.0').from, '17');
    assert.equal(manifests.find(manifest => manifest.version === '18.1.0').from, '18.0');
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
          { id: '18.0.0/c', kind: 'optionRemove', name: 'c', safe: true, inGuide: false },
        ],
      });
      const manifest = await loadManifest(dir);

      assert.equal(manifest.rules[0].guideUrl, 'https://example.com/guide#_1-step');
      assert.equal(manifest.rules[1].guideUrl, 'https://example.com/guide');
      assert.equal(manifest.rules[2].guideUrl, null);
      assert.equal(manifest.rules[0].safe, true);
      assert.equal(manifest.rules[0].version, '18.0.0');
    });
  });
});

describe('a rule that names the guide and says it is not in it', () => {
  it('is rejected, because the link the author wrote would be dropped without a word', async() => {
    await withVersionsDir(async(root) => {
      const dir = await writeVersion(root, '18.0.0', {
        rules: [{ id: '18.0.0/a', kind: 'optionRemove', name: 'a', safe: true, guide: 'step', inGuide: false }],
      });

      await assert.rejects(loadManifest(dir), /18\.0\.0\/a.*"inGuide": false.*cannot also name a "guide" anchor/s);
    });
  });

  it('is reported by validateRule, and each field alone is fine', () => {
    const base = { id: '18.0.0/a', kind: 'optionRemove', name: 'a', safe: true };

    assert.match(validateRule({ ...base, guide: 'step', inGuide: false }, '18.0.0').join(), /inGuide/);
    assert.deepEqual(validateRule({ ...base, guide: 'step' }, '18.0.0'), []);
    assert.deepEqual(validateRule({ ...base, inGuide: false }, '18.0.0'), []);
    assert.deepEqual(validateRule({ ...base, guide: 'step', inGuide: true }, '18.0.0'), []);
  });
});

describe('a custom rule module', () => {
  const SOURCE = 'import Handsontable from \'handsontable\';\nnew Handsontable(el, {});\n';
  const STYLE = 'a { color: var(--ht-foreground-color); }\n';

  /**
   * Write a version with one custom rule whose module has the given text, and run files through it.
   *
   * @param {string} moduleText The text of `custom/x.mjs`.
   * @param {Array<[string, string]>} files File names and texts to transform.
   * @returns {Promise<Array<{entries: object[]}>>} The results, in order.
   */
  async function runModule(moduleText, files) {
    let results = [];

    await withVersionsDir(async(root) => {
      const dir = await writeVersion(root, '18.1.0', {
        rules: [{ id: '18.1.0/c', kind: 'custom', module: 'custom/x.mjs', safe: false }],
      }, { 'custom/x.mjs': moduleText });
      const plan = buildPlan([await loadManifest(dir)]);

      results = await Promise.all(files.map(([filePath, source]) => transformFile({
        filePath, source, plan, options: { markers: false },
      })));
    });

    return results;
  }

  const REPORTING = [
    'export default {',
    '  fileKinds: ["css"],',
    '  apply(ctx, rule) {',
    // eslint-disable-next-line no-template-curly-in-string
    '    ctx.report({ ruleId: rule.id, severity: "manual", message: "ran on " + ctx.fileKind });',
    '  },',
    '};',
  ].join('\n');

  it('runs only on the part kinds it lists', async() => {
    const [js, css, both] = await Promise.all([
      runModule(REPORTING, [['a.js', SOURCE]]),
      runModule(REPORTING, [['a.css', STYLE]]),
      runModule(REPORTING.replace('["css"]', '["css", "js"]'), [['a.js', SOURCE], ['a.css', STYLE]]),
    ]);

    assert.deepEqual(js[0].entries, [], 'a css module did not run on a js part');
    assert.deepEqual(css[0].entries.map(entry => entry.message), ['ran on css']);
    assert.deepEqual(both.map(result => result.entries.map(entry => entry.message)), [['ran on js'], ['ran on css']]);
  });

  for (const [label, moduleText] of [
    ['has no default export', 'export const x = 1;'],
    ['exports null', 'export default null;'],
    ['has no fileKinds', 'export default { apply() {} };'],
    ['lists its fileKinds as a string', 'export default { fileKinds: "js", apply() {} };'],
    ['has no apply', 'export default { fileKinds: ["js"] };'],
    ['has an apply that is no function', 'export default { fileKinds: ["js"], apply: 1 };'],
  ]) {
    it(`turns a module that ${label} into one transform-error that names the rule and leaves the file alone`,
      async() => {
        const [result] = await runModule(moduleText, [['a.js', SOURCE]]);

        assert.equal(result.changed, false);
        assert.equal(result.output, SOURCE);
        assert.deepEqual(result.entries.map(entry => entry.ruleId), ['transform-error']);
        assert.match(result.entries[0].message,
          /18\.1\.0\/c: custom\/x\.mjs must default-export \{ fileKinds: string\[\], apply\(ctx, rule\) \}\./);
      });
  }
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
