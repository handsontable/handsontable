import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ISOLATION_PROBE_MAX_FILES,
  describeVerdict,
  failedFiles,
  formatAnnotation,
  formatPageErrorAnnotation,
  renderSummary,
  specFileFilter,
  specFilePath,
  toFailedSpec,
  toRecord,
} from '../lib/failed-specs.mjs';

const RESULT = {
  id: 'spec12',
  fullName: 'Core_alter remove_row should remove one row',
  description: 'should remove one row',
  filePath: 'handsontable/test/e2e/core/alter.spec.js',
  failedExpectations: [
    { message: 'Expected 5 to be 4.', stack: 'Error: Expected 5 to be 4.\n    at <Jasmine>' },
    { message: 'Expected 30% to equal 29%.' },
  ],
};

test('specFilePath joins a require.context key onto its repo-relative base', () => {
  assert.equal(
    specFilePath('handsontable/test/e2e/', './core/alter.spec.js'),
    'handsontable/test/e2e/core/alter.spec.js'
  );
  assert.equal(
    specFilePath('handsontable/src/', './plugins/filters/__tests__/filters.spec.js'),
    'handsontable/src/plugins/filters/__tests__/filters.spec.js'
  );
});

test('toFailedSpec keeps the name, the file, and every expectation message', () => {
  assert.deepEqual(toFailedSpec(RESULT), {
    fullName: 'Core_alter remove_row should remove one row',
    description: 'should remove one row',
    filePath: 'handsontable/test/e2e/core/alter.spec.js',
    messages: ['Expected 5 to be 4.', 'Expected 30% to equal 29%.'],
  });
  // A spec the loader could not place (MemoryLeakTest) and one with no expectations still records.
  assert.deepEqual(toFailedSpec({ fullName: 'MemoryLeakTest leaks', description: 'leaks' }), {
    fullName: 'MemoryLeakTest leaks',
    description: 'leaks',
    filePath: null,
    messages: [],
  });
});

test('failedFiles lists each file once, in first-seen order, and skips unplaced specs', () => {
  const specs = [
    { filePath: 'handsontable/test/e2e/core/alter.spec.js' },
    { filePath: null },
    { filePath: 'handsontable/src/plugins/filters/__tests__/filters.spec.js' },
    { filePath: 'handsontable/test/e2e/core/alter.spec.js' },
  ];

  assert.deepEqual(failedFiles(specs), [
    'handsontable/test/e2e/core/alter.spec.js',
    'handsontable/src/plugins/filters/__tests__/filters.spec.js',
  ]);
});

test('specFileFilter selects exactly that file among the require.context keys', () => {
  const keys = [
    './core/alter.spec.js',
    './core/alterRows.spec.js',
    './core/alter.spec.jsx',
    './plugins/alter.spec.js',
  ];
  const matches = filter => keys.filter(key => new RegExp(filter, 'i').test(key));

  assert.deepEqual(matches(specFileFilter('handsontable/test/e2e/core/alter.spec.js')), ['./core/alter.spec.js']);
  assert.deepEqual(
    matches(specFileFilter('handsontable/src/plugins/alter.spec.js')),
    ['./plugins/alter.spec.js'],
    'a src spec is addressed below its own context directory'
  );
});

test('formatAnnotation names the spec, the leg, the file, and the first message, escaped for the command', () => {
  const spec = toFailedSpec({
    ...RESULT,
    failedExpectations: [{ message: 'Expected 50% to be\n"a:b, c"' }],
  });
  const line = formatAnnotation(spec, 'UMD (theme: main)');

  assert.equal(
    line,
    '::error title=Jasmine spec failed — UMD (theme%3A main),file=handsontable/test/e2e/core/alter.spec.js'
      + '::Core_alter remove_row should remove one row%0AExpected 50%25 to be%0A"a:b, c"'
  );
  assert.ok(!line.includes('\n'), 'a workflow command is a single line');
});

test('formatAnnotation omits the file property for an unplaced spec and appends the isolation verdict', () => {
  const spec = toFailedSpec({ fullName: 'MemoryLeakTest leaks', description: 'leaks', failedExpectations: [] });

  assert.equal(
    formatAnnotation(spec, 'UMD.min (theme: classic)', 'passes alone'),
    '::error title=Jasmine spec failed — UMD.min (theme%3A classic)'
      + '::MemoryLeakTest leaks%0A(no expectation message)%0AIn isolation: passes alone.'
  );
});

test('formatPageErrorAnnotation names the leg and says the run stopped there', () => {
  assert.equal(
    formatPageErrorAnnotation('Error: boom\n    at <anonymous>', 'UMD (theme: main)'),
    '::error title=Uncaught page error — UMD (theme%3A main)'
      + '::Error: boom%0A    at <anonymous>%0AThe run was aborted here; the specs after this point did not run.'
  );
});

test('describeVerdict words the three probe outcomes', () => {
  assert.equal(describeVerdict({ failed: 0 }), 'passes alone');
  assert.equal(describeVerdict({ failed: 2 }), 'fails alone (2 failed)');
  assert.equal(describeVerdict({ failed: 0, error: 'page error' }), 'could not be probed (page error)');
});

test('renderSummary lists every failed spec with its verdict, explains the verdicts, and reports the cap', () => {
  const specs = [
    toFailedSpec(RESULT),
    toFailedSpec({ fullName: 'MemoryLeakTest leaks', description: 'leaks', failedExpectations: [{ message: 'x' }] }),
  ];
  const probes = new Map([['handsontable/test/e2e/core/alter.spec.js', { failed: 0 }]]);
  const markdown = renderSummary(specs, 'UMD (theme: main)', probes, 2);

  assert.match(markdown, /^## Jasmine failures — UMD \(theme: main\)\n/);
  assert.ok(markdown.includes([
    '- **Core_alter remove_row should remove one row** (`handsontable/test/e2e/core/alter.spec.js`)'
      + ' — in isolation: passes alone',
    '  - Expected 5 to be 4.',
    '  - Expected 30% to equal 29%.',
    '',
  ].join('\n')), 'a placed spec carries its file, its verdict, and each message on its own line');
  assert.ok(
    markdown.includes('- **MemoryLeakTest leaks**\n  - x\n'),
    'an unplaced spec has no file and no verdict'
  );
  assert.match(markdown, /passes alone\*\* failed because of the specs that ran before it/);
  assert.ok(
    markdown.includes('2 more failing file(s) were not re-run alone – the probe stops after '
      + `${ISOLATION_PROBE_MAX_FILES} files`),
    'the cap note counts the files the probe skipped'
  );

  const quiet = renderSummary([toFailedSpec(RESULT)], 'UMD (theme: main)', new Map());

  assert.ok(!quiet.includes('passes alone**'), 'no probe, no explanation');
  assert.ok(!quiet.includes('not re-run alone'), 'no cap note when nothing was skipped');
});

test('toRecord carries the leg, theme, run id, and each spec with its verdict', () => {
  const probes = new Map([['handsontable/test/e2e/core/alter.spec.js', { failed: 1 }]]);
  const context = { leg: 'UMD (theme: main)', theme: 'main', runId: '3f9ca9d7' };
  const record = toRecord(context, [toFailedSpec(RESULT)], probes);

  assert.deepEqual(record, {
    leg: 'UMD (theme: main)',
    theme: 'main',
    runId: '3f9ca9d7',
    failed: [{
      fullName: 'Core_alter remove_row should remove one row',
      description: 'should remove one row',
      filePath: 'handsontable/test/e2e/core/alter.spec.js',
      messages: ['Expected 5 to be 4.', 'Expected 30% to equal 29%.'],
      isolation: 'fails alone (1 failed)',
    }],
  });
});
