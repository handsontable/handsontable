import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPlan, loadManifests } from '../src/manifest.mjs';
import { compareVersions, parseVersion } from '../src/versions.mjs';
import { transformFile } from '../src/runner.mjs';
import { createRegistry } from '../src/transforms/index.mjs';

const manifests = await loadManifests();
const HEAD = 'import Handsontable from \'handsontable\';\nconst hot = new Handsontable(el, {});\n';
const SHAPES = {
  'a resize-state call whose result is used': {
    code: 'const widths = hot.getPlugin(\'manualColumnResize\').loadManualColumnWidths();\n',
    ids: ['resize-state-methods'],
  },
  'a sanitize call with an extra argument': {
    code: 'const v = Handsontable.helper.sanitize(html, extra);\n',
    ids: ['helper-sanitize'],
  },
  'an export option that a later spread can set': {
    code: 'hot.getPlugin(\'exportFile\').downloadFile(\'csv\', { columnHeaders: false, ...overrides });\n',
    ids: ['export-column-headers'],
  },
  'a re-export of a type that two migrations rename': {
    code: 'export type { Settings } from \'handsontable/plugins/exportFile\';\n',
    ids: { '18.0.0': ['type-exportfile-settings'], '19.0.0': ['export-settings-type'] },
    file: 'a.ts',
  },
  'a re-export of the options type of the data provider': {
    code: 'export type { DataProviderOptions } from \'handsontable/plugins/dataProvider\';\n',
    ids: { '18.0.0': ['type-dataprovider-options'], '19.0.0': ['data-provider-options-type'] },
    file: 'a.ts',
  },
  'a Pikaday selector in a stylesheet': {
    code: '.pika-single {\n  border-radius: 4px;\n}\n',
    ids: { '18.0.0': ['pikaday-leftovers'], '18.1.0': ['pikaday-theme-leftovers'] },
    file: 'a.css',
    head: '',
    versions: ['18.0.0', '18.1.0'],
  },
  'a Pikaday selector in SCSS with a line comment': {
    code: '// theme\n.pika-single {\n  border-radius: 4px;\n}\n',
    ids: { '18.0.0': ['pikaday-leftovers'], '18.1.0': ['pikaday-theme-leftovers'] },
    file: 'a.scss',
    head: '',
    versions: ['18.0.0', '18.1.0'],
  },
};

/**
 * Run the rules of some migrations over a text.
 *
 * @param {string} source File text.
 * @param {string[]} versions Manifest versions to load.
 * @param {string[]|Record<string, string[]>} slugs The slugs of the rules to run: the same in every loaded version, or
 * the slugs of each version.
 * @param {string} [filePath] File name, which picks the adapter.
 * @returns {Promise<{output: string, entries: object[], changed: boolean}>} The result.
 */
function run(source, versions, slugs, filePath = 'a.js') {
  const only = versions.flatMap(version => (Array.isArray(slugs) ? slugs : slugs[version] ?? [])
    .map(slug => `${version}/${slug}`));
  const plan = buildPlan(manifests.filter(manifest => versions.includes(manifest.version)), only);

  return transformFile({ filePath, source, plan, options: {} });
}

const todos = text => (text.match(/TODO\(handsontable-codemod/g) ?? []).length;
const manual = result => result.entries.filter(entry => entry.severity === 'manual');

describe('twin rules of two migrations report one spot once', () => {
  for (const [label, shape] of Object.entries(SHAPES)) {
    const { code, ids, file = 'a.js', head = HEAD } = shape;
    const [early, late] = shape.versions ?? ['18.0.0', '19.0.0'];

    describe(label, () => {
      it('leaves one marker and one entry in a run that holds both, owned by the earliest', async() => {
        const first = await run(`${head}${code}`, [early, late], ids, file);
        const second = await run(first.output, [early, late], ids, file);

        assert.equal(todos(first.output), 1, first.output);
        assert.equal(manual(first).length, 1);
        assert.ok(manual(first)[0].ruleId.startsWith(`${early}/`), manual(first)[0].ruleId);
        assert.ok(first.output.includes(`TODO(handsontable-codemod ${early}/`), first.output);
        assert.equal(second.changed, false);
        assert.equal(todos(second.output), 1);
      });

      it('leaves no second marker when a later migration runs over code the earlier one marked', async() => {
        const earlier = await run(`${head}${code}`, [early], ids, file);
        const later = await run(earlier.output, [late], ids, file);
        const again = await run(later.output, [late], ids, file);

        assert.equal(todos(earlier.output), 1);
        assert.equal(todos(later.output), 1, later.output);
        assert.equal(manual(later).length, 1, 'the later migration still reports the spot');
        assert.equal(again.changed, false);
      });

      it('still marks the spot when the earlier migration did not', async() => {
        const only = await run(`${head}${code}`, [late], ids, file);

        assert.equal(todos(only.output), 1, only.output);
        assert.ok(only.output.includes(`TODO(handsontable-codemod ${late}/`), only.output);
      });
    });
  }

  it('keeps a marker for each of two different spots', async() => {
    const source = `${HEAD}${SHAPES['a resize-state call whose result is used'].code}`
      + 'const heights = hot.getPlugin(\'manualRowResize\').loadManualRowHeights();\n';
    const result = await run(source, ['18.0.0', '19.0.0'], ['resize-state-methods']);

    assert.equal(todos(result.output), 2, result.output);
    assert.equal(manual(result).length, 2);
  });

  it('declares as twins every rule that repeats a rule of an earlier migration', () => {
    const fields = {
      exportRename: rule => [rule.source, rule.from, rule.to],
      optionRename: rule => [rule.from, rule.to, rule.context],
      methodRemove: rule => [[...(rule.methods ?? [])].sort(), rule.receiver],
      callUnwrap: rule => [rule.callee],
      cssVariable: rule => [rule.from, rule.to],
      themeToken: rule => [rule.from, rule.to],
      namespaceType: rule => [rule.from, rule.to],
      exportRemoved: rule => [rule.source, rule.name],
      importSource: rule => [rule.from, Object.keys(rule.exports ?? {}).sort()],
      detect: rule => (rule.mergeKey ? [rule.mergeKey] : null),
    };
    const signature = (rule) => {
      const parts = fields[rule.kind]?.(rule);

      return parts ? JSON.stringify([rule.kind, parts]) : null;
    };
    const seen = new Map();
    const missing = [];

    const ordered = [...manifests]
      .sort((a, b) => compareVersions(parseVersion(a.version), parseVersion(b.version)));

    for (const manifest of ordered) {
      for (const rule of manifest.rules) {
        const key = signature(rule);

        if (key === null) {
          continue;
        }

        for (const earlier of seen.get(key) ?? []) {
          if (!(rule.twins ?? []).includes(earlier)) {
            missing.push(`${rule.id} repeats ${earlier} and does not list it in twins`);
          }
        }
      }

      for (const rule of manifest.rules) {
        const key = signature(rule);

        if (key !== null) {
          seen.set(key, [...seen.get(key) ?? [], rule.id]);
        }
      }
    }

    assert.deepEqual(missing, []);
  });

  it('gives a chained run and the same migrations run one at a time the same output on the twinned fixtures', async() => {
    const twinned = manifests.flatMap(manifest => manifest.rules.filter(rule => rule.twins).map(rule => rule.id));
    const names = new Set(twinned.map(id => id.split('/')[1]));

    assert.ok(names.size >= 5);

    for (const [file, source] of [
      ['a.css', '.pika-single { border-radius: 4px; }\n.pika-prev, .pika-next { opacity: 0.5; }\n'],
      ['a.ts', 'export type { Settings } from \'handsontable/plugins/exportFile\';\n'
        + 'export type { DataProviderOptions } from \'handsontable/plugins/dataProvider\';\n'],
    ]) {
      const chained = await transformFile({ filePath: file, source, plan: buildPlan(manifests, []), options: {} });
      let text = source;

      for (const manifest of manifests) {
        const stepPlan = buildPlan([manifest], []);
        const step = await transformFile({ filePath: file, source: text, plan: stepPlan, options: {} });

        text = step.output;
      }

      assert.equal(text, chained.output, file);
    }
  });

  it('names an earlier rule of the same kind in the data of every twin', () => {
    const byId = new Map(manifests.flatMap(manifest => manifest.rules.map(rule => [rule.id, { rule, manifest }])));
    const twinned = [...byId.values()].filter(({ rule }) => rule.twins);

    assert.ok(twinned.length >= 3);

    for (const { rule, manifest } of twinned) {
      for (const id of rule.twins) {
        const found = byId.get(id);

        assert.ok(found, `${rule.id} names ${id}, which is no rule`);
        assert.equal(found.rule.kind, rule.kind, `${rule.id} and ${id} are of one kind`);
        const order = compareVersions(parseVersion(found.manifest.version), parseVersion(manifest.version));

        assert.ok(order < 0, `${id} is not earlier than ${rule.id}`);
      }
    }
  });
});

/**
 * Run two fake rules, `18.0.0/a` and its twin `19.0.0/a`, that each say something of their own about a statement.
 *
 * @param {object} args Arguments.
 * @param {string} args.source File text.
 * @param {string[]} [args.versions] The migrations in the plan.
 * @param {'todo'|'report'} args.how How the rules leave their note: `ctx.todo()` on the statement, or a `manual` entry
 * on its line that gets a generic marker.
 * @returns {Promise<{output: string, changed: boolean, entries: object[]}>} The outcome.
 */
async function runChain({ source, versions = ['18.0.0', '19.0.0'], how }) {
  const TEXTS = { '18.0.0/a': 'Check the early thing. It is early.', '19.0.0/a': 'Check the late thing. It is late.' };
  const transform = {
    kinds: ['detect'],
    fileKinds: ['js'],
    apply(ctx, rules) {
      for (const rule of rules) {
        const [statement] = ctx.root.find(ctx.j.ExpressionStatement).paths();

        if (how === 'todo') {
          ctx.todo(statement.node, rule.id, TEXTS[rule.id]);
        } else {
          ctx.report({ ruleId: rule.id,
            severity: 'manual',
            line: statement.node.loc.start.line,
            message: TEXTS[rule.id] });
        }
      }
    },
    rescue: rules => rules,
  };
  const manifestsOf = versions.map(version => ({
    version,
    rules: [{
      id: `${version}/a`,
      kind: 'detect',
      safe: true,
      version,
      guide: 'x',
      guideUrl: `https://example.com/${version}`,
      ...(version === '19.0.0' ? { twins: ['18.0.0/a'] } : {}),
    }],
  }));

  return transformFile({
    filePath: 'a.js',
    source,
    plan: buildPlan(manifestsOf),
    registry: createRegistry([transform], ['detect'], new Set()),
    options: {},
  });
}

describe('a chained run keeps the earlier twin and says what the later one says', () => {
  const source = 'call();\n';

  for (const how of ['todo', 'report']) {
    describe(`a note left through ${how === 'todo' ? 'ctx.todo()' : 'a report entry and a generic marker'}`, () => {
      it('puts the later text in the entry and the comment, under the id and link of the earlier rule', async() => {
        const first = await runChain({ source, how });
        const [entry, ...others] = first.entries.filter(item => item.severity === 'manual');

        assert.equal(others.length, 0);
        assert.equal(entry.ruleId, '18.0.0/a');
        assert.equal(entry.message, 'Check the late thing. It is late.');
        assert.equal(entry.guideUrl, 'https://example.com/18.0.0');
        assert.equal(entry.marked, true);
        assert.equal(first.output,
          '// TODO(handsontable-codemod 18.0.0/a): Check the late thing. It is late. See https://example.com/18.0.0\n'
          + 'call();\n');
      });

      it('changes nothing in runs 2 and 3, and adds no second marker', async() => {
        const first = await runChain({ source, how });
        const second = await runChain({ source: first.output, how });
        const third = await runChain({ source: second.output, how });

        assert.equal(second.changed, false, second.output);
        assert.equal(third.changed, false, third.output);
        assert.equal(todos(third.output), 1);
        assert.equal(second.entries.filter(item => item.severity === 'manual')[0].message,
          'Check the late thing. It is late.');
      });

      it('adds no second marker when the later migration alone runs over the marked code', async() => {
        const first = await runChain({ source, how });
        const later = await runChain({ source: first.output, how, versions: ['19.0.0'] });

        assert.equal(later.changed, false, later.output);
        assert.equal(todos(later.output), 1);
      });

      it('says only what the earlier rule says in a run of its migration alone', async() => {
        const early = await runChain({ source, how, versions: ['18.0.0'] });

        assert.equal(early.entries[0].message, 'Check the early thing. It is early.');
        assert.ok(early.output.includes('Check the early thing. It is early.'), early.output);
      });
    });
  }

  it('leaves the entry of a migration that lies after the spot alone: two spots, two entries', async() => {
    const result = await runChain({ source: 'call();\ncall();\n', how: 'report' });
    const entries = result.entries.filter(item => item.severity === 'manual');

    assert.equal(entries.length, 1, 'both rules look at the first statement only');
  });
});
