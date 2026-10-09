import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

// `tests/fixtures/demo/shared-demo-grid.html` rebuilds, by hand, the grid the visual suite's `/` route
// builds (`init()` in the js demo's `demos/default/index.js`), so the e2e specs that replaced the
// `multi-frameworks` captures check the grid those captures showed. Nothing else ties the two together:
// a column, a `dateFormat` or a plugin option changed in the demo would leave the fixture on the old
// grid, and every spec would keep passing on it. So both option objects are read out of their files,
// evaluated with the demo's helpers stubbed, and compared, with every intended difference named below.

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const DEMO = 'examples/next/visual-tests/js/demo/src/demos/default/index.js';
const FIXTURE = 'tests/fixtures/demo/shared-demo-grid.html';

// Options either side sets that the other does not reproduce, each with the reason. Everything else
// must be equal.
const NOT_COMPARED = {
  data: 'the fixture builds synthetic rows in the demo\'s shape, with ISO dates the native date editor needs',
  layoutDirection: 'the demo reads the direction from the URL; the fixture is LTR only',
  language: 'the demo reads the direction from the URL; the fixture is LTR only',
  themeName: 'the fixture sets the theme as a class on its container, from the allowlisted ?theme=',
  afterGetRowHeader: 'the demo draws a checkbox into every row header; the fixture stamps test ids',
  afterOnCellMouseDown: 'the demo toggles that checkbox; the fixture has none',
  beforeRenderer: 'the demo adds the row class that follows that checkbox; the fixture has none',
  afterRenderer: 'the fixture stamps test ids on the cells',
  afterGetColHeader: 'the fixture stamps test ids on the headers',
};

// Per column: the demo's progress-bar and star renderers are demo code, and so is the `star` class only
// the star renderer's stylesheet reads. The fixture keeps those columns' `editor: false` and `readOnly`.
const NOT_COMPARED_PER_COLUMN = ['renderer'];
const DEMO_ONLY_CLASSES = ['star'];

/**
 * Reads the object literal that follows `marker` in a source file, by matching braces outside strings.
 *
 * @param {string} file The path, relative to the repository root.
 * @param {string} marker The text just before the literal's opening brace.
 * @returns {string} The literal's source.
 */
function objectLiteralAfter(file, marker) {
  const source = readFileSync(join(ROOT, file), 'utf8');
  const at = source.indexOf(marker);

  assert.notEqual(at, -1, `${file} no longer contains "${marker}". Update this test to find its grid options.`);

  const start = source.indexOf('{', at + marker.length);
  let depth = 0;
  let quote = null;

  for (let index = start; index < source.length; index++) {
    const char = source[index];

    if (quote) {
      if (char === '\\') {
        index += 1;
      } else if (char === quote) {
        quote = null;
      }
    } else if (char === '\'' || char === '"' || char === '`') {
      quote = char;
    } else if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  throw new Error(`${file}: the object after "${marker}" never closes.`);
}

/**
 * Evaluates an object literal in a fresh context that holds only the given globals.
 *
 * @param {string} literal The literal's source.
 * @param {object} globals The identifiers the literal may read.
 * @param {string} file The file it came from, for the error message.
 * @returns {object} The evaluated options.
 */
function evaluate(literal, globals, file) {
  try {
    return vm.runInNewContext(`(${literal})`, { ...globals });
  } catch (error) {
    throw new Error(`${file}: its grid options read something this test does not stub (${error.message}). `
      + 'Add a stub, and if it changes the grid, mirror it in the other file.');
  }
}

/**
 * The options to compare: everything but `NOT_COMPARED`, with each column's demo-only parts removed.
 *
 * @param {object} options The evaluated options.
 * @returns {object} The comparable options.
 */
function comparable(options) {
  const kept = Object.fromEntries(Object.entries(options).filter(([key]) => !(key in NOT_COMPARED)));

  kept.columns = kept.columns.map((column) => {
    const copy = Object.fromEntries(Object.entries(column)
      .filter(([key]) => !NOT_COMPARED_PER_COLUMN.includes(key)));

    if (typeof copy.className === 'string') {
      copy.className = copy.className.split(/\s+/).filter(name => !DEMO_ONLY_CLASSES.includes(name)).join(' ');
    }

    return copy;
  });

  // Through JSON, so both sides are plain objects of this realm: a strict comparison would otherwise
  // tell the two contexts' `Object.prototype` apart.
  return JSON.parse(JSON.stringify(kept));
}

const stub = name => Object.defineProperty(() => {}, 'name', { value: name });

// The demo's helpers and imports, stubbed for the left-to-right `/` route the captures photographed.
const DEMO_GLOBALS = {
  generateExampleData: () => [],
  getDirectionFromURL: () => 'ltr',
  getThemeNameFromURL: () => 'ht-theme-main',
  arAR: { languageCode: 'ar-AR' },
  progressBarRenderer: stub('progressBarRenderer'),
  starRenderer: stub('starRenderer'),
  drawCheckboxInRowHeaders: stub('drawCheckboxInRowHeaders'),
  changeCheckboxCell: stub('changeCheckboxCell'),
  addClassesToRows: stub('addClassesToRows'),
};

test('the shared-demo fixture builds the grid the visual suite\'s / route builds', () => {
  const demo = evaluate(objectLiteralAfter(DEMO, 'new Handsontable(example, '), DEMO_GLOBALS, DEMO);
  const fixture = evaluate(objectLiteralAfter(FIXTURE, 'window.hot = new Handsontable(container, '), {
    sourceRow: () => [],
  }, FIXTURE);

  assert.deepEqual(comparable(fixture), comparable(demo),
    `${FIXTURE} no longer builds the grid ${DEMO} builds. Mirror the change in the fixture, or, when the `
    + 'difference is intended, name it in NOT_COMPARED with the reason.');
});

test('every option the comparison skips is still set by one of the two files', () => {
  // A stale entry would silently stop comparing an option either file starts setting later.
  const demo = objectLiteralAfter(DEMO, 'new Handsontable(example, ');
  const fixture = objectLiteralAfter(FIXTURE, 'window.hot = new Handsontable(container, ');

  Object.keys(NOT_COMPARED).forEach((key) => {
    assert.ok(new RegExp(`\\b${key}\\b\\s*[:(]`).test(demo) || new RegExp(`\\b${key}\\b\\s*[:(]`).test(fixture),
      `NOT_COMPARED names "${key}", which neither file sets any more. Remove it.`);
  });
});

test('the comparison catches a changed option, column or plugin on one side', () => {
  // The guard's own control: a copy of the fixture's literal with one value changed must fail it.
  const literal = objectLiteralAfter(FIXTURE, 'window.hot = new Handsontable(container, ');
  const demo = comparable(evaluate(objectLiteralAfter(DEMO, 'new Handsontable(example, '), DEMO_GLOBALS, DEMO));

  [
    literal.replace('height: 450', 'height: 451'),
    literal.replace("dateStyle: 'short'", "dateStyle: 'medium'"),
    literal.replace('customBorders: true,', ''),
  ].forEach((changed) => {
    assert.notEqual(changed, literal, 'The control must change the literal.');
    assert.notDeepEqual(comparable(evaluate(changed, { sourceRow: () => [] }, FIXTURE)), demo);
  });
});
