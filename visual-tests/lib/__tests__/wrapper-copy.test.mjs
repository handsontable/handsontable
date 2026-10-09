import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JS_VARIANTS, WRAPPERS } from '../../src/config.mjs';
import { VISUAL_VARIANTS_ANNOTATION } from '../visual-declarations.mjs';
import {
  BARE_JS_DIRECTORY,
  copyWrapperPlan,
  declarationsFromListReport,
  listFiles,
  wrapperCopyPlan,
} from '../wrapper-copy.mjs';

// The seed renders js once and copies the bare render into the wrapper baselines. The copy decides which
// wrapper goldens exist: one it writes that the `full` tier never renders is reported deleted by every
// nightly, and one it skips that the `full` tier does render is reported new. So it is pinned here on the
// shape `npx playwright test --list --reporter=json` really reports, and end to end on a throwaway tree.

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const TWO_THEMES = { themes: ['main', 'main-dark'], browsers: ['chromium'], wrappers: [] };
const ALL_WRAPPERS = {
  themes: JS_VARIANTS, browsers: ['chromium'], wrappers: WRAPPERS, wrappersReason: 'the parity canary',
};
const REACT_ONLY = {
  themes: JS_VARIANTS, browsers: ['chromium'], wrappers: ['react-wrapper'], wrappersReason: 'a React case',
};

/**
 * One test entry the way the JSON reporter's `--list` writes it: the annotation `visualTest()` attached,
 * and the runner as the test's location.
 *
 * @param {object | null} declaration The declaration, or `null` for a test registered without one.
 * @returns {object} The test entry.
 */
function testEntry(declaration) {
  return {
    annotations: declaration === null ? [] : [{
      type: VISUAL_VARIANTS_ANNOTATION,
      description: JSON.stringify(declaration),
      location: { file: '/repo/visual-tests/src/test-runner.ts', line: 728, column: 10 },
    }],
    projectName: 'chromium',
    results: [],
    status: 'skipped',
  };
}

/**
 * A top-level file suite, titled and filed under the spec path relative to the tests root, whose specs
 * all name the runner as their file — the shape that makes `spec.file` useless for this purpose.
 *
 * @param {string} file The spec path relative to `tests/`.
 * @param {...(object|null)} declarations One declaration per test in the file.
 * @returns {object} The suite.
 */
function fileSuite(file, ...declarations) {
  return {
    title: file,
    file,
    specs: declarations.map(declaration => ({
      title: `/repo/visual-tests/tests/${file}`,
      file: '../src/test-runner.ts',
      tests: [testEntry(declaration)],
    })),
  };
}

test('the declarations are read per file suite, never from a test\'s own spec.file', () => {
  const declarations = declarationsFromListReport({
    suites: [
      fileSuite('js-only/dialog/dialog-template.spec.ts', TWO_THEMES),
      fileSuite('multi-frameworks/select-few-cells-by-mouse.spec.ts', ALL_WRAPPERS),
      // A nested describe keeps the file suite's path.
      {
        title: 'multi-frameworks/nested.spec.ts',
        file: 'multi-frameworks/nested.spec.ts',
        suites: [fileSuite('multi-frameworks/nested.spec.ts', REACT_ONLY, REACT_ONLY)],
      },
    ],
    errors: [],
  });

  assert.deepEqual([...declarations.keys()], [
    'js-only/dialog/dialog-template.spec.ts',
    'multi-frameworks/select-few-cells-by-mouse.spec.ts',
    'multi-frameworks/nested.spec.ts',
  ]);
  assert.deepEqual(declarations.get('multi-frameworks/nested.spec.ts').wrappers, ['react-wrapper']);
  assert.ok(![...declarations.keys()].some(path => path.includes('test-runner')),
    'No declaration may be keyed on the runner, which every test names as its own file.');
});

test('a Windows report keys the spec with forward slashes', () => {
  const declarations = declarationsFromListReport({
    suites: [fileSuite('multi-frameworks\\mergeCells\\column-selection.spec.ts', TWO_THEMES)],
  });

  assert.deepEqual([...declarations.keys()], ['multi-frameworks/mergeCells/column-selection.spec.ts']);
});

test('the reader refuses a report it cannot trust', () => {
  assert.throws(() => declarationsFromListReport({}), /no `suites` array/);
  assert.throws(() => declarationsFromListReport({
    suites: [], errors: [{ message: 'SyntaxError: Unexpected token in tests/x.spec.ts' }],
  }), /collection errors[\s\S]*Unexpected token/);
  assert.throws(() => declarationsFromListReport({
    suites: [fileSuite('multi-frameworks/bare.spec.ts', null)],
  }), /multi-frameworks\/bare\.spec\.ts: a test carries no "visual-variants" annotation/);
  assert.throws(() => declarationsFromListReport({
    suites: [fileSuite('multi-frameworks/two.spec.ts', TWO_THEMES, ALL_WRAPPERS)],
  }), /two\.spec\.ts holds 2 different visual declarations/);
  assert.throws(() => declarationsFromListReport({
    suites: [{ title: 'x', file: '../src/test-runner.ts', specs: [] }],
  }), /not a path ending in \.spec\.ts/);
});

test('a spec\'s captures go into only the wrappers it declares', () => {
  const declarations = new Map([
    ['multi-frameworks/select-few-cells-by-mouse.spec.ts', ALL_WRAPPERS],
    ['multi-frameworks/mergeCells/column-selection.spec.ts', TWO_THEMES],
    ['multi-frameworks/editors/textEditor/undo.spec.ts', REACT_ONLY],
  ]);
  const rendered = [
    'multi-frameworks/select-few-cells-by-mouse-1.png',
    'multi-frameworks/mergeCells/column-selection-1.png',
    'multi-frameworks/editors/textEditor/undo-1.png',
    'multi-frameworks/editors/textEditor/undo-2.png',
    // A longer stem that starts with `undo-`: matched by exact name, never by prefix.
    'multi-frameworks/editors/textEditor/undo-multiline-text-1.png',
    'js-only/dialog/dialog-template-1.png',
  ];
  const plan = wrapperCopyPlan(declarations, rendered);

  assert.deepEqual(plan.map(entry => entry.target), [
    'angular-wrapper/chromium/multi-frameworks/select-few-cells-by-mouse-1.png',
    'react-wrapper/chromium/multi-frameworks/editors/textEditor/undo-1.png',
    'react-wrapper/chromium/multi-frameworks/editors/textEditor/undo-2.png',
    'react-wrapper/chromium/multi-frameworks/select-few-cells-by-mouse-1.png',
    'vue3/chromium/multi-frameworks/select-few-cells-by-mouse-1.png',
  ]);
  plan.forEach((entry) => {
    assert.equal(entry.source, `${BARE_JS_DIRECTORY}/${entry.target.split('/').slice(2).join('/')}`,
      'Every copy is the bare js render of the same capture path.');
  });
});

test('the plan refuses a declared spec the bare js render did not capture', () => {
  // A wrapper declaration without its bare render would delete that spec's wrapper goldens on the seed
  // while the full tier keeps rendering them.
  assert.throws(() => wrapperCopyPlan(new Map([
    ['multi-frameworks/select-few-cells-by-mouse.spec.ts', ALL_WRAPPERS],
  ]), ['multi-frameworks/select-few-cells-by-mouse-extra-1.png']),
  new RegExp('select-few-cells-by-mouse\\.spec\\.ts declares the wrappers .* left no '
    + 'multi-frameworks/select-few-cells-by-mouse-<N>\\.png'));
  assert.throws(() => wrapperCopyPlan(new Map([
    ['multi-frameworks/x.spec.ts', { ...ALL_WRAPPERS, wrappers: ['svelte'] }],
  ]), ['multi-frameworks/x-1.png']), /declares the wrapper "svelte"/);
  assert.throws(() => wrapperCopyPlan(new Map([
    ['multi-frameworks/x.spec.ts', { ...REACT_ONLY, themes: ['main'] }],
  ]), ['multi-frameworks/x-1.png']), /without the "classic" theme/);
});

test('a spec declaring one wrapper yields goldens in that wrapper\'s directory only', () => {
  const root = mkdtempSync(join(tmpdir(), 'visual-wrapper-copy-'));

  try {
    const write = (path, content) => {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), content);
    };

    write(`${BARE_JS_DIRECTORY}/multi-frameworks/editors/textEditor/undo-1.png`, 'undo one');
    write(`${BARE_JS_DIRECTORY}/multi-frameworks/editors/textEditor/undo-multiline-text-1.png`, 'multiline');
    write(`${BARE_JS_DIRECTORY}/multi-frameworks/mouse-wheel-1.png`, 'wheel');
    write('js/chromium-theme-main/multi-frameworks/editors/textEditor/undo-1.png', 'themed');

    const declarations = declarationsFromListReport({
      suites: [
        fileSuite('multi-frameworks/editors/textEditor/undo.spec.ts', REACT_ONLY),
        fileSuite('multi-frameworks/editors/textEditor/undo-multiline-text.spec.ts', TWO_THEMES),
        fileSuite('multi-frameworks/mouse-wheel.spec.ts', TWO_THEMES),
      ],
    });

    copyWrapperPlan(root, wrapperCopyPlan(declarations, listFiles(join(root, BARE_JS_DIRECTORY))));

    assert.deepEqual(listFiles(join(root, 'react-wrapper')), [
      'chromium/multi-frameworks/editors/textEditor/undo-1.png',
    ]);
    assert.equal(readFileSync(join(root, 'react-wrapper/chromium/multi-frameworks/editors/textEditor/undo-1.png'),
      'utf8'), 'undo one', 'The wrapper golden is the BARE js render, not a themed one.');
    WRAPPERS.filter(wrapper => wrapper !== 'react-wrapper').forEach((wrapper) => {
      assert.equal(existsSync(join(root, wrapper)), false, `${wrapper} declared nothing, so it gets nothing.`);
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('run-tests.mjs copies through the plan, never a whole directory', () => {
  // The script has no seam a unit test can call without rendering, so its wiring is pinned by reading it:
  // the `scrollbar-proximity.test.mjs` precedent.
  const script = readFileSync(join(PACKAGE_ROOT, 'scripts', 'run-tests.mjs'), 'utf8');
  const copyBlock = script.slice(script.indexOf('if (tier.copyWrappers) {'));

  assert.notEqual(script.indexOf('if (tier.copyWrappers) {'), -1, 'run-tests.mjs must keep its seed copy.');
  assert.match(copyBlock, /npx playwright test --list --reporter=json/,
    'The declarations come from the --list report, which reports every declaration at collection cost.');
  assert.match(copyBlock,
    /wrapperCopyPlan\(declarationsFromListReport\(JSON\.parse\(stdout\)\), listFiles\(bareJs\)\)/);
  assert.match(copyBlock, /copyWrapperPlan\(/);
  assert.doesNotMatch(script, /copySync\(/,
    'A directory copy writes wrapper goldens for specs that declare no wrapper.');
});
