import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  proposeLabels,
  findChangelogPath,
  parseNameStatus,
  resolveBase,
  run,
  PLUGIN_LABELS,
  CELL_TYPE_LABELS,
  KIND_LABELS,
  EXCLUDED_LABEL_PATTERNS,
} from '../pr-labels.mjs';

const ALL_LABELS = [
  ...new Set([
    ...Object.values(PLUGIN_LABELS),
    ...Object.values(CELL_TYPE_LABELS),
    ...Object.values(KIND_LABELS),
    'Editor', 'Core: Validation', 'Core: Walkontable', 'Core: Selection', 'React', 'Vue 3', 'Angular',
    'Docs: Content', 'Docs: Tools', 'TypeScript', 'Accessibility', 'Tools',
  ]),
];

test('maps plugin directories to labels whose names differ', () => {
  const cases = {
    filters: 'Filtering',
    manualColumnMove: 'Moving',
    manualRowMove: 'Moving',
    moveCells: 'Moving',
    manualColumnFreeze: 'Fixing / Freezing',
    freezeBar: 'Fixing / Freezing',
    hiddenRows: 'Hiding',
    hiddenColumns: 'Hiding',
    exportFile: 'Export',
    collapsibleColumns: 'Collapsing',
    columnSummary: 'Summary calculations',
    stretchColumns: 'Stretching',
    manualRowResize: 'Resizing',
  };

  Object.entries(cases).forEach(([dir, label]) => {
    assert.deepEqual(
      proposeLabels([`handsontable/src/plugins/${dir}/${dir}.ts`], null, ALL_LABELS),
      [label],
      dir,
    );
  });
});

test('every mapped plugin label exists in the live repository label list', () => {
  // Snapshot of the repository labels these mappings target (gh label list, 2026-11-24).
  const live = new Set([
    'Auto column size', 'Auto fill', 'Auto row size', 'BindRowsWithHeaders', 'Collapsing', 'Column sorting',
    'Comments', 'Context menu', 'Copy-paste', 'Custom borders', 'Dropdown menu', 'Export', 'Filtering',
    'Fixing / Freezing', 'Formulas', 'Hiding', 'Merge cells', 'Moving', 'Multi-column sorting',
    'Nested headers', 'Nested rows', 'Resizing', 'Search', 'Stretching', 'Summary calculations', 'Trimming',
    'Undo-redo',
  ]);

  Object.values(PLUGIN_LABELS).forEach(label => assert.ok(live.has(label), label));
});

test('unmapped plugins and the plugin test folder produce nothing', () => {
  assert.deepEqual(proposeLabels([
    'handsontable/src/plugins/pagination/pagination.ts',
    'handsontable/src/plugins/__tests__/foo.unit.js',
    'handsontable/src/plugins/base/base.ts',
  ], null, ALL_LABELS), []);
});

test('editors get Editor plus the matching cell type', () => {
  assert.deepEqual(
    proposeLabels(['handsontable/src/editors/autocompleteEditor/autocompleteEditor.ts'], null, ALL_LABELS),
    ['Cell type: Autocomplete / Dropdown / Handsontable', 'Editor'],
  );
  assert.deepEqual(
    proposeLabels(['handsontable/src/editors/intlTimeEditor/intlTimeEditor.ts'], null, ALL_LABELS),
    ['Cell type: Time', 'Editor'],
  );
  assert.deepEqual(
    proposeLabels(['handsontable/src/editors/multiSelectEditor/multiSelectEditor.ts'], null, ALL_LABELS),
    ['Editor'],
  );
});

test('renderers, validators and cell types map to the cell type, validators add Core: Validation', () => {
  assert.deepEqual(
    proposeLabels(['handsontable/src/renderers/checkboxRenderer/checkboxRenderer.ts'], null, ALL_LABELS),
    ['Cell type: Checkbox'],
  );
  assert.deepEqual(
    proposeLabels(['handsontable/src/validators/numericValidator/numericValidator.ts'], null, ALL_LABELS),
    ['Cell type: Numeric', 'Core: Validation'],
  );
  assert.deepEqual(
    proposeLabels(['handsontable/src/cellTypes/passwordType/passwordType.ts'], null, ALL_LABELS),
    ['Cell type: Base / Text / Password'],
  );
});

test('maps core, wrapper, docs, types and a11y paths', () => {
  assert.deepEqual(proposeLabels([
    'handsontable/src/3rdparty/walkontable/src/table.ts',
    'handsontable/src/selection/highlight/highlight.ts',
    'wrappers/react-wrapper/src/hotTable.tsx',
    'wrappers/vue3/src/HotTable.vue',
    'wrappers/angular-wrapper/projects/x/y.ts',
    'docs/content/guides/a.md',
    'docs/.vuepress/config.js',
    'handsontable/types/settings.d.ts',
    'tests/a11y/coverage.mjs',
    '.github/workflows/checks.yml',
  ], null, ALL_LABELS), [
    'Accessibility', 'Angular', 'Core: Selection', 'Core: Walkontable', 'Docs: Content', 'Docs: Tools',
    'React', 'Tools', 'TypeScript', 'Vue 3',
  ]);
  assert.deepEqual(proposeLabels(['handsontable/src/foo/foo.types.ts'], null, ALL_LABELS), ['TypeScript']);
});

test('kind comes from the changelog type', () => {
  assert.deepEqual(proposeLabels([], 'fixed', ALL_LABELS), ['bug']);
  assert.deepEqual(proposeLabels([], 'added', ALL_LABELS), ['Type: Feature']);
  assert.deepEqual(proposeLabels([], 'changed', ALL_LABELS), ['enhancement']);
  assert.deepEqual(proposeLabels([], 'removed', ALL_LABELS), []);
  assert.deepEqual(proposeLabels([], 'deprecated', ALL_LABELS), []);
  assert.deepEqual(proposeLabels([], null, ALL_LABELS), []);
  assert.deepEqual(proposeLabels([], 'toString', ALL_LABELS), []);
});

test('never proposes labels a person or CI owns, even when they exist', () => {
  const owned = [
    'Status: In development', 'Guess: 2 hours', 'Effort: Low', 'Impact: High', 'CLA signed', 'visual-approved',
    'Requires Manual QA', 'Breaking change', 'Blocked', 'Wontfix', 'Regression', 'QA needed', 'Verified by QA',
    'docs-sync', 'docs-sync: skip', 'ci:docs-deploy', 'run-docs-visual', 'triaged', 'needs-triage',
    'dependencies',
  ];

  owned.forEach((label) => {
    assert.ok(EXCLUDED_LABEL_PATTERNS.some(pattern => pattern.test(label)), label);
  });
  // Even if the repository has them, nothing in the mapping may produce them.
  assert.equal(ALL_LABELS.filter(label => owned.includes(label)).length, 0);
  assert.deepEqual(
    proposeLabels(['handsontable/src/plugins/filters/filters.ts'], 'fixed', [...ALL_LABELS, ...owned]),
    ['Filtering', 'bug'],
  );
});

test('the exclusion list filters a proposal at the final step', () => {
  // A table entry pointing at an excluded label must be dropped, not applied.
  const original = PLUGIN_LABELS.search;

  PLUGIN_LABELS.search = 'Regression';
  try {
    assert.deepEqual(
      proposeLabels(['handsontable/src/plugins/search/search.ts'], null, ['Regression']),
      [],
    );
  } finally {
    PLUGIN_LABELS.search = original;
  }
});

test('drops proposed labels that do not exist and never invents one', () => {
  assert.deepEqual(
    proposeLabels(['handsontable/src/plugins/filters/filters.ts'], 'fixed', ['bug']),
    ['bug'],
  );
  assert.deepEqual(proposeLabels(['handsontable/src/plugins/filters/filters.ts'], 'fixed', []), []);
});

test('returns sorted unique labels', () => {
  const result = proposeLabels([
    'handsontable/src/plugins/manualRowMove/a.ts',
    'handsontable/src/plugins/manualColumnMove/b.ts',
    'handsontable/src/plugins/hiddenRows/c.ts',
    'handsontable/src/plugins/hiddenColumns/d.ts',
    'wrappers/react-wrapper/e.ts',
  ], 'fixed', ALL_LABELS);

  assert.deepEqual(result, ['Hiding', 'Moving', 'React', 'bug']);
  assert.deepEqual(result, [...new Set(result)].sort());
});

test('normalizes Windows separators', () => {
  assert.deepEqual(proposeLabels(['handsontable\\src\\plugins\\filters\\filters.ts'], null, ALL_LABELS), ['Filtering']);
});

const changed = (...paths) => paths.map(path => ({ status: 'A', path }));

test('finds the changelog entry among changed paths', () => {
  assert.equal(findChangelogPath(changed('a.ts', '.changelogs/14440.json')), '.changelogs/14440.json');
  assert.equal(findChangelogPath(changed('.changelogs/README.md', '.changelogs/x/1.json')), null);
});

test('never picks a deleted changelog entry, whatever the order', () => {
  const changes = parseNameStatus('D\t.changelogs/10028.json\nA\t.changelogs/14439.json\nM\ta.ts\n');

  assert.equal(findChangelogPath(changes), '.changelogs/14439.json');
  assert.equal(findChangelogPath(parseNameStatus('D\t.changelogs/10028.json\n')), null);
});

test('base: --base wins, then the PR base, then develop', () => {
  assert.equal(resolveBase('origin/x', 'release/18.1.3'), 'origin/x');
  assert.equal(resolveBase(undefined, 'release/18.1.3'), 'origin/release/18.1.3');
  assert.equal(resolveBase(undefined, null), 'origin/develop');
});

/**
 * Builds a fake `exec` that answers the commands `run` issues.
 *
 * @param {object} answers The answers.
 * @param {string|null} answers.prBase The PR base branch, or null when there is no PR.
 * @param {string} answers.diff The `git diff --name-status` output.
 * @param {string[]} calls Collects the diff ranges asked for.
 * @returns {Function}
 */
function fakeExec({ prBase, diff }, calls) {
  return async(command, args) => {
    const line = `${command} ${args.join(' ')}`;

    if (line.startsWith('gh pr view')) {
      if (prBase === null) {
        throw new Error('no pull requests found for branch "feature/x"');
      }
      if (prBase instanceof Error) {
        throw prBase;
      }

      return JSON.stringify({ baseRefName: prBase });
    }
    if (line.startsWith('git rev-parse')) {
      return '/repo\n';
    }
    if (line.startsWith('git diff')) {
      calls.push(args.at(-1));

      return diff;
    }
    if (line.startsWith('gh label list')) {
      return JSON.stringify(ALL_LABELS.map(name => ({ name })));
    }

    throw new Error(`unexpected command: ${line}`);
  };
}

test('run: diffs against the PR base and reads the added entry from the repo root', async() => {
  const calls = [];
  const reads = [];
  const { labels } = await run([], {
    exec: fakeExec({
      prBase: 'release/18.1.3',
      diff: 'D\t.changelogs/10028.json\nA\t.changelogs/14439.json\nM\thandsontable/src/plugins/filters/filters.ts\n',
    }, calls),
    read: async(path) => {
      reads.push(path);

      return JSON.stringify({ type: 'fixed' });
    },
    cwd: '/repo/handsontable',
  });

  assert.deepEqual(calls, ['origin/release/18.1.3...HEAD']);
  assert.deepEqual(reads, ['/repo/.changelogs/14439.json']);
  assert.deepEqual(labels, ['Filtering', 'bug']);
});

test('run: no PR yet falls back to develop; --changelog resolves against the cwd', async() => {
  const calls = [];
  const reads = [];

  await run(['--changelog', '../.changelogs/1.json'], {
    exec: fakeExec({ prBase: null, diff: 'M\ta.ts\n' }, calls),
    read: async(path) => {
      reads.push(path);

      return '{}';
    },
    cwd: '/repo/handsontable',
  });

  assert.deepEqual(calls, ['origin/develop...HEAD']);
  assert.deepEqual(reads, ['/repo/.changelogs/1.json']);
});

test('run: --base overrides the PR base', async() => {
  const calls = [];

  await run(['--base', 'origin/feature/x'], {
    exec: fakeExec({ prBase: 'unused', diff: '' }, calls),
    read: async() => '{}',
  });

  assert.deepEqual(calls, ['origin/feature/x...HEAD']);
});

test('run: a gh failure other than "no PR" stops the run instead of falling back to develop', async() => {
  const calls = [];

  await assert.rejects(
    run([], {
      exec: fakeExec({ prBase: new Error('HTTP 401: Bad credentials'), diff: '' }, calls),
      read: async() => '{}',
    }),
    /Cannot read the PR base, pass --base: HTTP 401/,
  );
  assert.deepEqual(calls, []);
});
