import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import jscodeshift from 'jscodeshift';
import { planRange } from '../src/lib/dependency-range.mjs';
import { PACKAGE_FACT, addFact, hasFactFor, registerPackageDir } from '../src/lib/facts.mjs';
import { buildPlan } from '../src/manifest.mjs';
import { run, transformFile } from '../src/runner.mjs';
import dependencies, { matchesWhen } from '../src/transforms/dependencies.mjs';
import { createRegistry } from '../src/transforms/index.mjs';

/**
 * Write a project under the OS temp directory (never inside the monorepo), run the codemod on it, and hand
 * the result and a file reader to the callback. The project has no git repository, so the run may write.
 *
 * @param {Record<string, string>} files File contents by relative path.
 * @param {object} options Options for `run()`. `from` defaults to `17.1` and `to` to `18.1`.
 * @param {(outcome: {result: object, read: (name: string) => Promise<string>, dir: string}) => Promise<void>} check
 * Assertions.
 * @returns {Promise<void>}
 */
async function migrate(files, options, check) {
  const dir = await mkdtemp(join(tmpdir(), 'codemod-deps-'));

  try {
    for (const [name, content] of Object.entries(files)) {
      await mkdir(dirname(join(dir, name)), { recursive: true });
      await writeFile(join(dir, name), content);
    }

    const result = await run({ cwd: dir, from: '17.1', to: '18.1', ...options });

    await check({ result, read: name => readFile(join(dir, name), 'utf8'), dir });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/**
 * Build the text of a `package.json`.
 *
 * @param {object} value The manifest.
 * @param {string|number} [indent] JSON indent.
 * @returns {string} The text with a trailing newline.
 */
function pkg(value, indent = 2) {
  return `${JSON.stringify(value, null, indent)}\n`;
}

/**
 * Names in the `dependencies` section of a `package.json` text, in file order.
 *
 * @param {string} text The `package.json` text.
 * @returns {string[]} The names.
 */
function keysOf(text) {
  return Object.keys(JSON.parse(text).dependencies);
}

describe('planRange', () => {
  it('keeps the operator the user wrote', () => {
    assert.deepEqual(planRange('^17.0.0', '18.0.0'), { action: 'rewrite', value: '^18.0.0' });
    assert.deepEqual(planRange('~17.1.0', '18.0.0'), { action: 'rewrite', value: '~18.0.0' });
    assert.deepEqual(planRange('17.1.0', '18.0.0'), { action: 'rewrite', value: '18.0.0' });
    assert.deepEqual(planRange('^17', '18.0.0'), { action: 'rewrite', value: '^18.0.0' });
    assert.deepEqual(planRange('~17.1', '18.1.0'), { action: 'rewrite', value: '~18.1.0' });
    assert.deepEqual(planRange(' ^17.1.0 ', '18.0.0'), { action: 'rewrite', value: '^18.0.0' });
  });

  it('never lowers a range', () => {
    assert.deepEqual(planRange('^18.0.0', '18.0.0'), { action: 'keep' });
    assert.deepEqual(planRange('^18.2.0', '18.1.0'), { action: 'keep' });
    assert.deepEqual(planRange('~19.0.0', '18.1.0'), { action: 'keep' });
    assert.deepEqual(planRange('20.0.0', '18.1.0'), { action: 'keep' });
  });

  it('raises a simple range whose lowest version is below the target, and keeps a compound range that admits it', () => {
    assert.deepEqual(planRange('^18.0.0', '18.1.0'), { action: 'rewrite', value: '^18.1.0' });
    assert.deepEqual(planRange('~18.0.0', '18.1.0'), { action: 'rewrite', value: '~18.1.0' });
    assert.deepEqual(planRange('18.0.0', '18.1.0'), { action: 'rewrite', value: '18.1.0' });
    assert.deepEqual(planRange('>=17.1.0 <19', '18.1.0'), { action: 'keep' });
    assert.deepEqual(planRange('*', '18.1.0'), { action: 'keep' });
  });

  it('treats a prerelease as lower than its release', () => {
    assert.deepEqual(planRange('^18.0.0-rc5', '18.0.0'), { action: 'rewrite', value: '^18.0.0' });
    assert.deepEqual(planRange('^18.1.0-rc1', '18.0.0'), { action: 'keep' });
  });

  it('leaves sources and tags alone without a report', () => {
    for (const spec of ['workspace:*', 'workspace:^17.0.0', 'file:../handsontable', 'link:../hot', 'portal:../hot',
      'git+https://github.com/handsontable/handsontable.git', 'github:handsontable/handsontable#develop',
      'https://example.com/handsontable.tgz', 'handsontable/handsontable#semver:^17', '../hot',
      'latest', 'next', 'rc']) {
      assert.deepEqual(planRange(spec, '18.0.0'), { action: 'skip' }, spec);
    }
  });

  it('reports ranges it does not rewrite', () => {
    for (const spec of ['>=17 <18', '^17.0.0 || ^16.0.0', '17.x', '17', '17.1', '1.0.0 - 17.5.0',
      'npm:handsontable@17.0.0', 'v17.0.0', '=17.0.0', 'not a range']) {
      assert.equal(planRange(spec, '18.0.0').action, 'manual', spec);
    }
  });

  it('keeps a range that already allows the target, without a report', () => {
    for (const spec of ['>=16.0.0', '>=17.0.0', '>=17.0.0 <19', '>= 17.0.0 < 19.0.0', '^17 || ^18', '*', 'x', '', '18',
      '18.x', '1.0.0 - 19.0.0', 'npm:handsontable@^18.0.0']) {
      assert.deepEqual(planRange(spec, '18.0.0'), { action: 'keep' }, spec);
    }
  });
});

describe('ranges, overrides, and aliases in a chained run', () => {
  it('reports no entry for a peer range that already allows the target', async() => {
    const input = pkg({
      peerDependencies: { handsontable: '>=16.0.0', '@handsontable/react-wrapper': '>=17.0.0 <19' },
    });

    await migrate({ 'package.json': input }, {}, async({ result, read }) => {
      assert.equal(await read('package.json'), input);
      assert.deepEqual(result.report.entries, []);
    });
  });

  it('reports a range it cannot judge once for the whole chain', async() => {
    const input = pkg({ dependencies: { handsontable: '>=17 <18' } });

    await migrate({ 'package.json': input }, {}, async({ result }) => {
      assert.equal(result.report.entries.length, 1);
      assert.match(result.report.entries[0].message, /Set it to \^18\.1\.0 by hand/);
    });
  });

  it('reports a package that was moved twice as one change from the range the user wrote', async() => {
    const input = pkg({ dependencies: { handsontable: '^17.1.0', '@handsontable/vue3': '~17.1.0' } });

    await migrate({ 'package.json': input }, {}, async({ result }) => {
      assert.deepEqual(result.report.entries.map(entry => entry.message).sort(), [
        'Updated @handsontable/vue3 in dependencies from "~17.1.0" to "~18.1.0".',
        'Updated handsontable in dependencies from "^17.1.0" to "^18.1.0".',
      ]);
    });
  });

  it('reports pins below the target in overrides and aliases, and edits none', async() => {
    const input = pkg({
      dependencies: { handsontable: '^17.1.0', hot17: 'npm:handsontable@17.1.0', hot18: 'npm:handsontable@^18.0.0' },
      overrides: { handsontable: '17.1.0', 'some-lib': { handsontable: '^17.0.0' }, other: '1.0.0' },
      resolutions: { '**/@handsontable/vue3': '17.0.0', 'handsontable@^17.0.0': '^18.0.0' },
      pnpm: { overrides: { 'a>handsontable': '~17.1.0', handsontable: 'workspace:*' } },
    });

    await migrate({ 'package.json': input }, {}, async({ result, read }) => {
      const manual = result.report.entries.filter(entry => entry.severity === 'manual').map(entry => entry.message);

      assert.equal(manual.length, 5, manual.join('\n'));
      assert.ok(manual.some(text => text.startsWith('overrides["handsontable"] pins handsontable to "17.1.0"')));
      assert.ok(manual.some(text => text.startsWith('overrides["some-lib"].handsontable pins handsontable')));
      assert.ok(manual.some(text => text.startsWith('resolutions["**/@handsontable/vue3"] pins @handsontable/vue3')));
      assert.ok(manual.some(text => text.startsWith('pnpm.overrides["a>handsontable"] pins handsontable')));
      assert.ok(manual.some(text => text.startsWith('hot17 in dependencies is an alias of handsontable@17.1.0')));
      assert.equal(manual.filter(text => text.includes('hot18')).length, 0);

      const output = JSON.parse(await read('package.json'));

      assert.deepEqual(output.overrides, JSON.parse(input).overrides);
      assert.deepEqual(output.resolutions, JSON.parse(input).resolutions);
      assert.deepEqual(output.pnpm, JSON.parse(input).pnpm);
      assert.equal(output.dependencies.hot17, 'npm:handsontable@17.1.0');
    });
  });
});

describe('facts', () => {
  const ctxFor = (filePath, facts) => ({ filePath, facts });

  it('records a global key and a directory key', () => {
    const facts = new Set();

    addFact(ctxFor('packages/a/src/x.js', facts), 'uses-formulas');
    addFact(ctxFor('app.js', facts), 'uses-formulas');

    assert.deepEqual([...facts].sort(), ['uses-formulas', 'uses-formulas@.', 'uses-formulas@packages/a/src']);
  });

  it('gives a fact to the nearest package.json only', () => {
    const facts = new Set();

    ['package.json', 'packages/a/package.json', 'packages/b/package.json']
      .forEach(file => registerPackageDir(facts, file));
    addFact(ctxFor('packages/a/src/x.js', facts), 'uses-formulas');

    assert.equal(hasFactFor(ctxFor('packages/a/package.json', facts), 'uses-formulas'), true);
    assert.equal(hasFactFor(ctxFor('packages/b/package.json', facts), 'uses-formulas'), false);
    assert.equal(hasFactFor(ctxFor('package.json', facts), 'uses-formulas'), false);

    addFact(ctxFor('tools/y.js', facts), 'uses-formulas');
    assert.equal(hasFactFor(ctxFor('package.json', facts), 'uses-formulas'), true);
  });

  it('counts every fact below the package.json when no package directories are known', () => {
    const facts = new Set();

    addFact(ctxFor('packages/a/src/x.js', facts), 'uses-formulas');

    assert.equal(hasFactFor(ctxFor('package.json', facts), 'uses-formulas'), true);
    assert.equal(hasFactFor(ctxFor('packages/b/package.json', facts), 'uses-formulas'), false);
    assert.equal(facts.has(`${PACKAGE_FACT}@.`), false);
  });

  it('does not mix fact names that share a prefix', () => {
    const facts = new Set();

    addFact(ctxFor('a.js', facts), 'uses-formulas-extra');

    assert.equal(hasFactFor(ctxFor('package.json', facts), 'uses-formulas'), false);
  });
});

describe('matchesWhen', () => {
  const j = jscodeshift.withParser('tsx');
  const matches = (source, when) => matchesWhen(j, j(source), when);

  it('matches every import form by exact module name or a file inside it', () => {
    const sources = [
      'import numbro from \'numbro\';',
      'import \'numbro/languages/de-DE\';',
      'import type { A } from \'numbro\';',
      'export * from \'numbro\';',
      'export { a } from \'numbro/dist/x\';',
      'const n = require(\'numbro\');',
      'const n = await import(\'numbro/languages/de-DE\');',
      'import n = require(\'numbro\');',
    ];

    for (const source of sources) {
      assert.equal(matches(source, { import: 'numbro' }), true, source);
    }
  });

  it('does not match a longer name, a string, or a bare identifier', () => {
    assert.equal(matches('import a from \'numbro-extra\';', { import: 'numbro' }), false);
    assert.equal(matches('const s = \'numbro\'; foo(\'numbro\'); require(name);', { import: 'numbro' }), false);
    assert.equal(matches('import a from \'@handsontable/pikaday-x\';', { import: '@handsontable/pikaday' }), false);
    assert.equal(matches('import \'@handsontable/pikaday/css/x.css\';', { import: '@handsontable/pikaday' }), true);
  });

  it('matches an object property or a JSX attribute, optionally with a key in its value', () => {
    assert.equal(matches('new H(el, { formulas: { engine: HF } });', { property: 'formulas' }), true);
    const engine = { property: 'formulas', withKey: 'engine' };

    assert.equal(matches('new H(el, { \'formulas\': { engine: HF } });', engine), true);
    assert.equal(matches('new H(el, { formulas: true });', engine), false);
    assert.equal(matches('const x = <HotTable formulas={{ engine: HF }} />;', engine), true);
    assert.equal(matches('const x = <HotTable formulas={cfg} />;', engine), false);
    assert.equal(matches('const x = { [formulas]: 1 };', { property: 'formulas' }), false);
  });

  it('never matches an empty condition', () => {
    assert.equal(matches('import a from \'b\';', {}), false);
    assert.equal(matches('import a from \'b\';', undefined), false);
  });
});

describe('dependency rules on package.json', () => {
  it('bumps each range style and keeps the key order', async() => {
    const input = pkg({
      name: 'app',
      version: '1.0.0',
      dependencies: {
        '@handsontable/react-wrapper': '~17.1.0',
        handsontable: '^17.1.0',
        react: '^19.0.0',
      },
      devDependencies: { '@handsontable/vue3': '17.1.0' },
      scripts: { build: 'vite build' },
    });

    await migrate({ 'package.json': input }, { to: '18.0' }, async({ result, read }) => {
      assert.equal(result.exitCode, 0);
      assert.equal(await read('package.json'), pkg({
        name: 'app',
        version: '1.0.0',
        dependencies: {
          '@handsontable/react-wrapper': '~18.0.0',
          handsontable: '^18.0.0',
          react: '^19.0.0',
        },
        devDependencies: { '@handsontable/vue3': '18.0.0' },
        scripts: { build: 'vite build' },
      }));
      assert.deepEqual(result.changedFiles, ['package.json']);
    });
  });

  it('bumps peer and optional dependencies too', async() => {
    const input = pkg({
      name: 'lib',
      peerDependencies: { handsontable: '^17.0.0' },
      optionalDependencies: { '@handsontable/angular-wrapper': '^17.0.0' },
    });

    await migrate({ 'package.json': input }, { to: '18.0' }, async({ read }) => {
      assert.equal(await read('package.json'), pkg({
        name: 'lib',
        peerDependencies: { handsontable: '^18.0.0' },
        optionalDependencies: { '@handsontable/angular-wrapper': '^18.0.0' },
      }));
    });
  });

  it('chains 17.1 to 18.1: the end state is the 18.1 target', async() => {
    const input = pkg({ dependencies: { handsontable: '^17.1.0' } });

    await migrate({ 'package.json': input }, {}, async({ result, read }) => {
      assert.equal(await read('package.json'), pkg({ dependencies: { handsontable: '^18.1.0' } }));

      const changed = result.report.entries.filter(entry => entry.severity === 'changed');

      assert.deepEqual(changed.map(entry => entry.message), [
        'Updated handsontable in dependencies from "^17.1.0" to "^18.1.0".',
      ]);
    });
  });

  it('never downgrades a range that is already at or above the target', async() => {
    const input = pkg({ dependencies: { handsontable: '^18.2.0', '@handsontable/vue3': '19.0.0' } });

    await migrate({ 'package.json': input }, {}, async({ result, read }) => {
      assert.equal(await read('package.json'), input);
      assert.deepEqual(result.changedFiles, []);
    });
  });

  it('skips local and remote sources and reports ranges it cannot rewrite', async() => {
    const skipped = pkg({
      dependencies: {
        handsontable: 'workspace:*',
        '@handsontable/vue3': 'file:../vue3',
        '@handsontable/react-wrapper': 'latest',
      },
    });

    await migrate({ 'package.json': skipped }, {}, async({ result, read }) => {
      assert.equal(await read('package.json'), skipped);
      assert.equal(result.report.entries.length, 0);
    });

    const manual = pkg({ dependencies: { handsontable: '>=17 <18', '@handsontable/vue3': '^17.0.0 || ^16.0.0' } });

    await migrate({ 'package.json': manual }, {}, async({ result, read }) => {
      assert.equal(await read('package.json'), manual);

      const entries = result.report.entries.filter(entry => entry.severity === 'manual');

      assert.equal(entries.length, 2, 'one entry per package, not one per migration step');
      assert.match(entries[0].message, /handsontable ">=17 <18" in dependencies is not a plain version range/);
    });
  });

  it('reports the old wrapper packages and names the replacement without bumping them', async() => {
    const input = pkg({
      dependencies: {
        handsontable: '^17.1.0',
        '@handsontable/react': '^16.2.0',
        '@handsontable/angular': '^16.2.0',
        '@handsontable/vue': '^16.2.0',
      },
    });

    await migrate({ 'package.json': input }, { to: '18.0' }, async({ result, read }) => {
      assert.deepEqual(JSON.parse(await read('package.json')).dependencies, {
        handsontable: '^18.0.0',
        '@handsontable/react': '^16.2.0',
        '@handsontable/angular': '^16.2.0',
        '@handsontable/vue': '^16.2.0',
      });

      const messages = result.report.entries.filter(entry => entry.severity === 'manual').map(entry => entry.message);

      assert.equal(messages.length, 3);
      const about = name => messages.find(message => message.startsWith(`${name} `));

      assert.match(about('@handsontable/react'), /@handsontable\/react-wrapper/);
      assert.match(about('@handsontable/angular'), /@handsontable\/angular-wrapper/);
      assert.match(about('@handsontable/vue'), /@handsontable\/vue3/);
    });
  });

  it('leaves a package.json without Handsontable untouched, byte for byte', async() => {
    const input = '{"name":"tool",   "dependencies":{"react":"^19.0.0"}}';

    await migrate({ 'package.json': input, 'packages/ui/package.json': input }, {}, async({ result, read }) => {
      assert.equal(await read('package.json'), input);
      assert.equal(await read('packages/ui/package.json'), input);
      assert.equal(result.report.entries.length, 0);
    });
  });

  it('keeps 2-space, 4-space, and tab indents and a missing trailing newline', async() => {
    const value = { name: 'app', dependencies: { handsontable: '^17.1.0' } };
    const next = { name: 'app', dependencies: { handsontable: '^18.1.0' } };

    for (const indent of [2, 4, '\t']) {
      await migrate({ 'package.json': pkg(value, indent) }, {}, async({ read }) => {
        assert.equal(await read('package.json'), pkg(next, indent));
      });
    }

    await migrate({ 'package.json': JSON.stringify(value, null, 2) }, {}, async({ read }) => {
      assert.equal(await read('package.json'), JSON.stringify(next, null, 2));
    });
  });

  it('keeps CRLF line endings', async() => {
    const crlf = text => text.replace(/\n/g, '\r\n');
    const input = crlf(pkg({ name: 'app', dependencies: { handsontable: '^17.1.0' } }));

    await migrate({ 'package.json': input }, {}, async({ read }) => {
      assert.equal(await read('package.json'), crlf(pkg({ name: 'app', dependencies: { handsontable: '^18.1.0' } })));
    });
  });

  it('is idempotent: a second run changes nothing', async() => {
    const files = {
      'package.json': pkg({ dependencies: { handsontable: '^17.1.0' } }),
      'src/app.js': 'import Handsontable from \'handsontable\';\nimport { HyperFormula } from \'hyperformula\';\n',
    };

    await migrate(files, {}, async({ dir, result }) => {
      assert.deepEqual(result.changedFiles, ['package.json']);

      const again = await run({ cwd: dir, from: '17.1', to: '18.1' });

      assert.deepEqual(again.changedFiles, []);
    });
  });

  it('shows a diff and writes nothing on a dry run', async() => {
    const input = pkg({ dependencies: { handsontable: '^17.1.0' } });

    await migrate({ 'package.json': input }, { dryRun: true }, async({ result, read }) => {
      assert.equal(await read('package.json'), input);
      assert.deepEqual(result.changedFiles, ['package.json']);
      assert.match(result.diffs[0].diff, /-\s+"handsontable": "\^17\.1\.0"/);
      assert.match(result.diffs[0].diff, /\+\s+"handsontable": "\^18\.1\.0"/);
    });
  });
});

describe('the phase 1 scan of a phase 2 module', () => {
  const plan = buildPlan([{ version: '18.0.0', rules: [{ id: '18.0.0/d', kind: 'dependency' }] }]);

  /**
   * Build a registry with a recording phase 2 module.
   *
   * @param {object[]} calls Receives `{ fileKind, phase }` for every call.
   * @param {object} [scan] The module's `scan` field.
   * @returns {object} The registry.
   */
  function recorder(calls, scan) {
    return createRegistry([{
      kinds: ['dependency'],
      fileKinds: ['json'],
      scan,
      apply: ctx => calls.push({ fileKind: ctx.fileKind, path: ctx.filePath }),
    }]);
  }

  it('calls a module without `scan` in phase 2 only', async() => {
    const calls = [];
    const registry = recorder(calls);

    const skipped = await transformFile({ filePath: 'a.js', source: 'handsontable', plan, registry });

    assert.equal(skipped.skipped, 'no-transform');
    await transformFile({ filePath: 'package.json', source: '{"handsontable":1}', plan, registry, phase: 1 });
    assert.deepEqual(calls, []);

    await transformFile({ filePath: 'package.json', source: '{"handsontable":1}', plan, registry, phase: 2 });
    assert.deepEqual(calls, [{ fileKind: 'json', path: 'package.json' }]);
  });

  it('calls a module with `scan` in phase 1 on the scan kinds only, and in phase 2 on its own kinds', async() => {
    const calls = [];
    const registry = recorder(calls, { fileKinds: ['js'] });

    await transformFile({ filePath: 'a.js', source: 'import \'handsontable\';', plan, registry, phase: 1 });
    await transformFile({ filePath: 'package.json', source: '{"handsontable":1}', plan, registry, phase: 1 });
    await transformFile({ filePath: 'a.js', source: 'import \'handsontable\';', plan, registry, phase: 2 });
    assert.deepEqual(calls, [{ fileKind: 'js', path: 'a.js' }]);

    await transformFile({ filePath: 'package.json', source: '{"handsontable":1}', plan, registry, phase: 2 });
    assert.deepEqual(calls.at(-1), { fileKind: 'json', path: 'package.json' });
  });

  it('uses the scan precheck instead of the adapter precheck in phase 1', async() => {
    const calls = [];
    const registry = recorder(calls, { fileKinds: ['js'], precheck: /moment/ });

    await transformFile({ filePath: 'a.js', source: 'import \'handsontable\';', plan, registry });
    assert.deepEqual(calls, []);

    await transformFile({ filePath: 'b.js', source: 'import \'moment\';', plan, registry });
    assert.deepEqual(calls, [{ fileKind: 'js', path: 'b.js' }]);
  });
});

describe('adding HyperFormula', () => {
  const app = 'import Handsontable from \'handsontable\';\nimport { HyperFormula } from \'hyperformula\';\n'
    + 'new Handsontable(el, { formulas: { engine: HyperFormula } });\n';

  it('adds it, in alphabetical order, when the project uses formulas', async() => {
    const input = pkg({ dependencies: { handsontable: '^17.1.0', react: '^19.0.0' } });

    await migrate({ 'package.json': input, 'src/app.js': app }, { to: '18.0' }, async({ result, read }) => {
      assert.deepEqual(JSON.parse(await read('package.json')).dependencies, {
        handsontable: '^18.0.0',
        hyperformula: '^3.0.0',
        react: '^19.0.0',
      });
      assert.deepEqual(keysOf(await read('package.json')), ['handsontable', 'hyperformula', 'react']);

      const added = result.report.entries.find(entry => entry.ruleId === '18.0.0/dependency-hyperformula');

      assert.equal(added.severity, 'changed');
      assert.match(added.guideUrl, /#install-hyperformula-separately$/);
    });
  });

  it('appends it when the section is not sorted', async() => {
    const input = pkg({ dependencies: { react: '^19.0.0', handsontable: '^17.1.0' } });

    await migrate({ 'package.json': input, 'src/app.js': app }, { to: '18.0' }, async({ read }) => {
      assert.deepEqual(keysOf(await read('package.json')), ['react', 'handsontable', 'hyperformula']);
    });
  });

  it('adds it for a formulas option alone, a require() call, or a JSX attribute', async() => {
    const sources = {
      option: 'import H from \'handsontable\';\nnew H(el, { formulas: { engine: window.HyperFormula } });\n',
      require: 'const H = require(\'handsontable\');\nconst { HyperFormula } = require(\'hyperformula\');\n',
      jsx: 'import { HotTable } from \'@handsontable/react-wrapper\';\n'
        + 'export default () => <HotTable formulas={{ engine: hf }} />;\n',
    };

    for (const [name, source] of Object.entries(sources)) {
      await migrate({
        'package.json': pkg({ dependencies: { handsontable: '^17.1.0' } }),
        [`src/${name}.${name === 'jsx' ? 'jsx' : 'js'}`]: source,
      }, { to: '18.0' }, async({ read }) => {
        assert.equal(JSON.parse(await read('package.json')).dependencies.hyperformula, '^3.0.0', name);
      });
    }
  });

  it('does not add it when the project has no formulas', async() => {
    const input = pkg({ dependencies: { handsontable: '^17.1.0' } });
    const source = 'import Handsontable from \'handsontable\';\nnew Handsontable(el, { formulas: true, data: [] });\n';

    await migrate({ 'package.json': input, 'src/app.js': source }, { to: '18.0' }, async({ read }) => {
      assert.equal(JSON.parse(await read('package.json')).dependencies.hyperformula, undefined);
    });
  });

  it('does not add it when it is already declared in any section', async() => {
    for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
      const input = pkg({ dependencies: { handsontable: '^18.0.0' }, [section]: { hyperformula: '^3.4.0' } });

      await migrate({ 'package.json': input, 'src/app.js': app }, { to: '18.0' }, async({ result, read }) => {
        assert.equal(await read('package.json'), input, section);
        assert.equal(result.report.entries.length, 0, section);
      });
    }
  });

  it('adds it to the project that uses formulas and not to its sibling in a monorepo', async() => {
    const manifest = pkg({ dependencies: { handsontable: '^17.1.0' } });

    await migrate({
      'package.json': pkg({ name: 'root', private: true }),
      'packages/a/package.json': manifest,
      'packages/a/src/grid.js': app,
      'packages/b/package.json': manifest,
      'packages/b/src/grid.js': 'import Handsontable from \'handsontable\';\nnew Handsontable(el, {});\n',
    }, { to: '18.0' }, async({ read }) => {
      assert.equal(JSON.parse(await read('packages/a/package.json')).dependencies.hyperformula, '^3.0.0');
      assert.equal(JSON.parse(await read('packages/b/package.json')).dependencies.hyperformula, undefined);
      assert.equal(await read('package.json'), pkg({ name: 'root', private: true }));
    });
  });

  it('credits a root package.json with its own files only, not those of a nested package', async() => {
    await migrate({
      'package.json': pkg({ dependencies: { handsontable: '^17.1.0' } }),
      'src/grid.js': 'import Handsontable from \'handsontable\';\n',
      'packages/a/package.json': pkg({ name: 'a' }),
      'packages/a/src/grid.js': app,
    }, { to: '18.0' }, async({ read }) => {
      assert.equal(JSON.parse(await read('package.json')).dependencies.hyperformula, undefined);
    });
  });

  it('puts it next to Handsontable in devDependencies, and reports a peer-only host', async() => {
    await migrate({
      'package.json': pkg({ name: 'app', devDependencies: { handsontable: '^17.1.0' } }),
      'src/app.js': app,
    }, { to: '18.0' }, async({ read }) => {
      assert.deepEqual(JSON.parse(await read('package.json')).devDependencies, {
        handsontable: '^18.0.0',
        hyperformula: '^3.0.0',
      });
      assert.equal(JSON.parse(await read('package.json')).dependencies, undefined);
    });

    await migrate({
      'package.json': pkg({ name: 'lib', peerDependencies: { handsontable: '^17.1.0' } }),
      'src/app.js': app,
    }, { to: '18.0' }, async({ result, read }) => {
      assert.equal(JSON.parse(await read('package.json')).dependencies, undefined);
      assert.ok(result.report.entries
        .some(entry => entry.severity === 'manual' && /Add hyperformula@\^3\.0\.0/.test(entry.message)));
    });
  });

  it('creates the dependencies section before devDependencies when the host is only optional', async() => {
    await migrate({
      'package.json': pkg({
        name: 'app',
        optionalDependencies: { handsontable: '^17.1.0' },
        devDependencies: { vite: '^6.0.0' },
      }),
      'src/app.js': app,
    }, { to: '18.0' }, async({ read }) => {
      assert.deepEqual(Object.keys(JSON.parse(await read('package.json'))), [
        'name', 'optionalDependencies', 'dependencies', 'devDependencies',
      ]);
    });
  });

  it('adds it for a project that lists only a wrapper package', async() => {
    await migrate({
      'package.json': pkg({ dependencies: { '@handsontable/react-wrapper': '^17.1.0' } }),
      'src/app.js': app,
    }, { to: '18.0' }, async({ read }) => {
      assert.deepEqual(JSON.parse(await read('package.json')).dependencies, {
        '@handsontable/react-wrapper': '^18.0.0',
        hyperformula: '^3.0.0',
      });
    });
  });

  it('scans TypeScript files', async() => {
    await migrate({
      'package.json': pkg({ dependencies: { handsontable: '^17.1.0' } }),
      'src/app.ts': 'import Handsontable from \'handsontable\';\n'
        + 'import type { HyperFormula } from \'hyperformula\';\nlet n: number = 1;\n',
    }, { to: '18.0' }, async({ read }) => {
      assert.equal(JSON.parse(await read('package.json')).dependencies.hyperformula, '^3.0.0');
    });
  });
});

describe('reportMissing and reportPresent', () => {
  const rule = fields => ({ id: 'x/r', kind: 'dependency', version: 'x', safe: false, guideUrl: null, ...fields });

  /**
   * Run one rule over a package.json in phase 2.
   *
   * @param {object} dependencyRule The rule.
   * @param {object} manifest The manifest.
   * @param {string[]} [facts] Facts present before the run.
   * @returns {Promise<string[]>} The messages of the report entries.
   */
  async function messages(dependencyRule, manifest, facts = []) {
    const plan = {
      versions: [{ version: 'x', rules: [dependencyRule] }],
      rulesById: new Map([[dependencyRule.id, dependencyRule]]),
    };
    const result = await transformFile({
      filePath: 'package.json',
      source: pkg({ name: 'handsontable-app', ...manifest }),
      plan,
      phase: 2,
      facts: new Set(facts),
    });

    return result.entries.map(entry => entry.message);
  }

  it('reportPresent reports a declared package, with an optional fact and host condition', async() => {
    const present = rule({
      reportPresent: [{ name: 'moment', message: 'Drop moment.', onlyIfDependsOn: 'handsontable' }],
    });
    const gated = rule({ reportPresent: [{ name: 'moment', message: 'Drop moment.', whenFact: 'imports-moment' }] });
    const declared = { dependencies: { handsontable: '^17.1.0', moment: '^2' } };

    assert.deepEqual(await messages(present, declared), ['Drop moment.']);
    assert.deepEqual(await messages(present, { dependencies: { moment: '^2' } }), []);
    assert.deepEqual(await messages(present, { dependencies: { handsontable: '^17.1.0' } }), []);
    assert.deepEqual(await messages(gated, declared), []);
    assert.deepEqual(await messages(gated, declared, ['imports-moment@.']), ['Drop moment.']);
  });

  it('reportMissing reports a package that is not declared', async() => {
    const missing = rule({ reportMissing: [{ name: 'numbro', message: 'Add numbro.' }] });

    assert.deepEqual(await messages(missing, { dependencies: {} }), ['Add numbro.']);
    assert.deepEqual(await messages(missing, { dependencies: { numbro: '^2' } }), []);
  });

  it('validates the items of every list when the manifests load', () => {
    const problems = fields => createRegistry([dependencies]).validate(rule(fields));

    assert.deepEqual(problems({ reportPresent: [{ name: 'a', message: 'm' }] }), []);
    assert.match(problems({ reportPresent: [{ name: 'a' }] })[0], /"reportPresent\[0\]\.message" must be a string/);
    assert.match(problems({ reportMissing: [{ message: 'm' }] })[0], /"reportMissing\[0\]\.name" must be a string/);
    assert.match(problems({ add: [{ name: 'a' }] })[0], /"add\[0\]\.range" must be a string/);
    assert.match(problems({ reportOnly: [{ name: 'a' }] })[0], /"reportOnly" is now "reportMissing"/);
  });
});

describe('reporting packages Handsontable no longer installs', () => {
  const importAll = [
    'import Handsontable from \'handsontable\';',
    'import numbro from \'numbro\';',
    'import \'numbro/languages/de-DE\';',
    'import moment from \'moment\';',
    'import Pikaday from \'@handsontable/pikaday\';',
    'import DOMPurify from \'dompurify\';',
    '',
  ].join('\n');

  it('reports each imported package that the package.json does not declare, and adds nothing', async() => {
    const input = pkg({ dependencies: { handsontable: '^17.1.0' } });

    await migrate({ 'package.json': input, 'src/app.js': importAll }, { to: '18.0' }, async({ result, read }) => {
      assert.deepEqual(Object.keys(JSON.parse(await read('package.json')).dependencies), ['handsontable']);

      const messages = result.report.entries.filter(entry => entry.severity === 'manual').map(entry => entry.message);

      // The file and line of the first import, and the range Handsontable 17.1.0 shipped. No hedge.
      const expected = [
        ['@handsontable/pikaday', 'src/app.js:5', '^1.0.0'],
        ['dompurify', 'src/app.js:6', '^3.1.7'],
        ['moment', 'src/app.js:4', '2.30.1'],
        ['numbro', 'src/app.js:2', '2.5.0'],
      ].map(([name, site, range]) => `Add ${name} to your dependencies. ${site} imports it, and Handsontable no `
        + `longer installs it. Handsontable 17.1.0 shipped ${name} ${range}, so that range is a safe start. `
        + 'The tool never adds it.');

      assert.deepEqual(messages.sort(), expected.sort());
      assert.equal(messages.some(message => /if you still import/.test(message)), false);
    });
  });

  it('names the first importing file, not a later one', async() => {
    await migrate({
      'package.json': pkg({ dependencies: { handsontable: '^17.1.0' } }),
      'src/a.js': 'import Handsontable from \'handsontable\';\n\nimport numbro from \'numbro\';\n',
      'src/b.js': 'import numbro from \'numbro\';\n',
    }, { to: '18.0' }, async({ result }) => {
      const [entry] = result.report.entries.filter(item => item.severity === 'manual');

      assert.match(entry.message, /^Add numbro to your dependencies\. src\/a\.js:3 imports it, /);
    });
  });

  it('links each report to its own guide section', async() => {
    await migrate({
      'package.json': pkg({ dependencies: { handsontable: '^17.1.0' } }),
      'src/app.js': importAll,
    }, { to: '18.0' }, async({ result }) => {
      const anchor = (name) => {
        const entry = result.report.entries.find(item => item.message.startsWith(`Add ${name} `));

        return entry.guideUrl.split('#')[1];
      };

      assert.equal(anchor('numbro'), 'migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat');
      assert.equal(anchor('moment'), 'migrate-date-and-time-cells-to-iso-8601-format');
      assert.equal(anchor('@handsontable/pikaday'), 'migrate-date-and-time-cells-to-iso-8601-format');
      assert.equal(anchor('dompurify'), 'replace-built-in-dompurify-with-a-custom-sanitizer');
    });
  });

  it('stays quiet when the package is declared or never imported', async() => {
    const declared = pkg({
      dependencies: {
        handsontable: '^18.0.0',
        moment: '^2.30.1',
        numbro: '2.5.0',
        dompurify: '^3.1.7',
        '@handsontable/pikaday': '^1.0.0',
      },
    });

    await migrate({ 'package.json': declared, 'src/app.js': importAll }, { to: '18.0' }, async({ result }) => {
      assert.equal(result.report.entries.length, 0);
    });

    await migrate({
      'package.json': pkg({ dependencies: { handsontable: '^18.0.0' } }),
      'src/app.js': 'import Handsontable from \'handsontable\';\nconst moment = \'a moment\';\n',
    }, { to: '18.0' }, async({ result }) => {
      assert.equal(result.report.entries.length, 0);
    });
  });

  it('finds an import in a file that never names Handsontable', async() => {
    await migrate({
      'package.json': pkg({ dependencies: { handsontable: '^18.0.0' } }),
      'src/dates.js': 'import moment from \'moment\';\nexport const day = () => moment().format();\n',
    }, { to: '18.0' }, async({ result }) => {
      assert.equal(result.report.entries.filter(entry => entry.message.startsWith('Add moment ')).length, 1);
    });
  });

  it('does not report a project that does not use Handsontable', async() => {
    await migrate({
      'package.json': pkg({ dependencies: { react: '^19.0.0' } }),
      'src/dates.js': 'import moment from \'moment\';\n',
    }, { to: '18.0' }, async({ result }) => {
      assert.equal(result.report.entries.length, 0);
    });
  });

  it('reports an entry on every run, but writes nothing the second time', async() => {
    await migrate({
      'package.json': pkg({ dependencies: { handsontable: '^17.1.0' } }),
      'src/app.js': importAll,
    }, { to: '18.0' }, async({ dir }) => {
      const again = await run({ cwd: dir, from: '17.1', to: '18.0' });

      assert.deepEqual(again.changedFiles, []);
      assert.equal(again.report.entries.filter(entry => entry.severity === 'manual').length, 4);
    });
  });
});
