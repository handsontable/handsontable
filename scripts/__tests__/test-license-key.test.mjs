import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Every test grid reads its license key from one constant per suite, so a new test key is a
// one-line change. A test that writes the key out again would keep the old key after that change,
// and its grid would get the lock screen once the key stops working. This guard fails on such a
// literal anywhere in the test trees, outside the files below.

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// The text of the internal test key every constant holds (issued with `npm run
// generate-internal-test-key` in the private `license-key` package). It names its holder in capitals.
const TEST_KEY_MARKER = 'HANDSONTABLE INTERNAL TEST KEY';

// Both spellings of the non-commercial key, which the core reads as invalid since 19.0, and the test key.
const LITERALS = ['non-commercial-and-evaluation', 'ht68e-1f2b7-47158-70b05-0842f', TEST_KEY_MARKER];

// One constant per suite, per visual-test demo app, and one for the docs previews. They must hold the
// same key, so renewing it means pasting one new key into each of them.
const CONSTANTS = [
  'handsontable/test/helpers/licenseKey.js',
  'tests/fixtures/demo/test-license-key.js',
  'wrappers/react-wrapper/test/licenseKey.ts',
  'wrappers/vue3/test/licenseKey.ts',
  'wrappers/angular-wrapper/projects/hot-table/src/lib/test-helpers/license-key.ts',
  'performance-tests/fixtures/test-license-key.js',
  'examples/next/visual-tests/js/demo/src/test-license-key.js',
  'examples/next/visual-tests/js/basic-example/src/test-license-key.js',
  'examples/next/visual-tests/react-wrapper/demo/src/test-license-key.ts',
  'examples/next/visual-tests/react-wrapper/basic-example/src/test-license-key.js',
  'examples/next/visual-tests/vue3/demo/src/test-license-key.ts',
  'examples/next/visual-tests/vue3/basic-example/src/test-license-key.ts',
  'examples/next/visual-tests/angular-wrapper/demo/src/test-license-key.ts',
  'examples/next/visual-tests/angular-wrapper/basic-example/src/test-license-key.ts',
  // Not a test: the docs staging and preview builds write it into the executed examples.
  'docs/src/test-license-key.mjs',
];

const VISUAL_DEMOS = 'examples/next/visual-tests';

const TEST_TREES = [
  'handsontable/src',
  'handsontable/test',
  'tests',
  'wrappers/react-wrapper/test',
  'wrappers/vue3/test',
  'wrappers/angular-wrapper/projects',
  // Not `performance-tests/fixtures`: `scripts/run.mjs` copies the built bundles there, and they
  // name the key. Its one tracked file is the constant itself.
  'performance-tests/scenarios',
  // The demos the visual regression suite photographs.
  VISUAL_DEMOS,
];

const SKIPPED_DIRS = new Set(['node_modules', 'dist', 'tmp', 'test-results', 'playwright-report']);

// The files that may hold a literal key, each with the reason.
const ALLOWED = {
  'handsontable/test/helpers/licenseKey.js': 'the constant itself (unit tests and Jasmine specs)',
  'tests/fixtures/demo/test-license-key.js': 'the constant itself (Playwright fixtures)',
  'wrappers/react-wrapper/test/licenseKey.ts': 'the constant itself (React tests)',
  'wrappers/vue3/test/licenseKey.ts': 'the constant itself (Vue tests)',
  'wrappers/angular-wrapper/projects/hot-table/src/lib/test-helpers/license-key.ts':
    'the constant itself (Angular tests)',
  ...Object.fromEntries(CONSTANTS.filter(path => path.startsWith(`${VISUAL_DEMOS}/`))
    .map(path => [path, 'the constant itself (a visual-test demo app)'])),
  'handsontable/src/__tests__/settings/licenseKey.spec.js': 'tests how the key is read',
  'handsontable/src/helpers/__tests__/mixed.unit.ts': 'tests the legacy key checks',
  'handsontable/src/helpers/__tests__/entitlementLicenseInfo.unit.js': 'tests the license state of each key',
  'handsontable/src/utils/entitlementLicenseKey/__tests__/extractKeyData.unit.js': 'tests key format detection',
  'tests/fixtures/demo/license-branding.html': 'builds a grid per license state',
  'tests/e2e/license-branding.spec.ts': 'asserts the license states, and that the lock text does not name the key',
  // The capability gate: these pass the non-commercial key as a key that restricts nothing (an invalid
  // key since 19.0), which a gate must not restrict.
  'handsontable/src/core/__tests__/license.unit.js': 'keeps an invalid-key instance apart from a listed one',
  'handsontable/src/plugins/base/__tests__/licenseGate.unit.js': 'the non-commercial key unlocks every plugin',
  'handsontable/src/utils/licenseCapabilities/__tests__/resolveLicenseCapabilities.unit.js':
    'the non-commercial key resolves to unrestricted grants',
  'handsontable/src/plugins/exportFile/__tests__/exportFile.unit.js': 'a legacy key supports the xlsx export',
  'handsontable/src/plugins/exportFile/__tests__/xlsxLicenseGates.unit.js':
    'compares a legacy export with a listed one',
  'handsontable/src/plugins/exportFile/__tests__/xlsxProtectionOption.unit.js':
    'compares a legacy export with a listed one',
  'handsontable/src/plugins/importFile/__tests__/importFile.unit.js': 'a legacy key supports the xlsx import',
  'handsontable/src/plugins/importFile/__tests__/importLicenseGates.unit.js':
    'compares a legacy import with a listed one',
  'tests/fixtures/xlsxLicenseKeys.ts': 'exports the invalid key the xlsx license specs compare against',
  'wrappers/angular-wrapper/projects/hot-table/src/lib/services/hot-global-config.service.spec.ts':
    'asserts the deprecated NON_COMMERCIAL_LICENSE constant still holds the retired key',
};

/**
 * Whether a path is test code. Only test files are scanned for a literal here; product code is
 * scanned by the retired-key test below, which lets comments and docs name the key.
 *
 * @param {string} path The path, relative to the repository root.
 * @returns {boolean}
 */
function isTestFile(path) {
  if (!/\.(m?js|jsx|ts|tsx|vue|html)$/.test(path)) {
    return false;
  }

  if (path.startsWith('handsontable/src/')) {
    return /\/__tests__\//.test(path);
  }

  if (path.startsWith('wrappers/angular-wrapper/')) {
    return /\.spec\.ts$/.test(path) || path.includes('/test-helpers/');
  }

  return true;
}

/**
 * Lists the files under a directory, skipping build output and installed packages.
 *
 * @param {string} dir An absolute directory path.
 * @returns {string[]} The file paths, relative to the repository root.
 */
function walk(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return SKIPPED_DIRS.has(entry.name) ? [] : walk(join(dir, entry.name));
    }

    return [relative(ROOT, join(dir, entry.name)).split('\\').join('/')];
  });
}

/**
 * Finds every file that holds a literal key.
 *
 * @param {string[]} paths The paths to check.
 * @param {(path: string) => string} read Reads a file's text.
 * @returns {string[]} The paths that hold one.
 */
function filesWithLiteral(paths, read) {
  return paths.filter(path => LITERALS.some(literal => read(path).includes(literal)));
}

const readFromRoot = path => readFileSync(join(ROOT, path), 'utf8');
const testFiles = TEST_TREES.flatMap(tree => walk(join(ROOT, tree))).filter(isTestFile);

// The two spellings of the non-commercial key. Since 19.0 no product code compares a key with them.
const RETIRED_KEYS = LITERALS.slice(0, 2);

// The product source of the core and the wrappers. Their tests are scanned by the tests above.
const PRODUCT_TREES = [
  'handsontable/src',
  'wrappers/react-wrapper/src',
  'wrappers/vue3/src',
  'wrappers/angular-wrapper/projects/hot-table/src',
];

/**
 * Finds the code lines that name a retired key. A comment line, or the comment at the end of a
 * line, may name it: the docs say the key reads as invalid.
 *
 * @param {string} text A file's text.
 * @returns {string[]} The code lines that name a retired key.
 */
function codeLinesWithRetiredKey(text) {
  return text.split('\n')
    .filter(line => !/^\s*(\*|\/\/|\/\*)/.test(line))
    .filter(line => RETIRED_KEYS.some(key => line.replace(/\s\/\/.*$/, '').toLowerCase().includes(key)));
}

const productFiles = PRODUCT_TREES.flatMap(tree => walk(join(ROOT, tree)))
  .filter(path => /\.(m?js|jsx|ts|tsx|vue)$/.test(path) && !isTestFile(path) && !/\/__tests__\//.test(path));

// Product files that may hold a retired key in code, with the reason. None of them compares a key.
const PRODUCT_ALLOWED = {
  'wrappers/angular-wrapper/projects/hot-table/src/lib/services/hot-global-config.service.ts':
    'the deprecated NON_COMMERCIAL_LICENSE export, removed in 20.0',
};

test('no test writes the license key out; every suite reads its shared constant', () => {
  const offenders = filesWithLiteral(testFiles, readFromRoot).filter(path => !(path in ALLOWED));

  assert.deepEqual(offenders, [],
    'These tests write the license key out. Use the suite\'s constant instead: `TEST_LICENSE_KEY` '
    + '(handsontable/test/helpers/licenseKey.js, a global in Jasmine specs; licenseKey.ts in the React '
    + 'and Vue tests; test-helpers/license-key.ts in the Angular tests), `window.htTestLicenseKey` in a '
    + 'Playwright fixture (load /tests/fixtures/demo/test-license-key.js) or a performance fixture (load '
    + '../../fixtures/test-license-key.js), `:licenseKey="testLicenseKey"` in a Vue template, or '
    + '`TEST_LICENSE_KEY` from `src/test-license-key` in a visual-test demo app. A test of the license '
    + 'behavior itself goes in ALLOWED, with the reason.');
});

test('every test-key constant holds the same internal test key', () => {
  // Renewing the key means pasting it into each constant; one left behind would lock its suite's grids
  // once the old key stops working.
  const assignment = /^(?:export const TEST_LICENSE_KEY|window\.htTestLicenseKey) = '([^']+)';$/m;
  const keys = CONSTANTS.map((path) => {
    const match = readFromRoot(path).match(assignment);

    assert.ok(match, `${path} assigns no single-line key.`);

    return match[1];
  });

  assert.ok(keys[0].includes(TEST_KEY_MARKER), `The key in ${CONSTANTS[0]} is not the internal test key.`);
  assert.deepEqual(CONSTANTS.filter((path, index) => keys[index] !== keys[0]), [],
    `These constants hold another key than ${CONSTANTS[0]}. Paste the same key into each.`);
});

test('no Vue template passes the key in JSX braces', () => {
  // In a Vue template `licenseKey={TEST_LICENSE_KEY}` is a static attribute: the grid gets the text
  // `{TEST_LICENSE_KEY}` and shows the lock screen. Bind it (`:licenseKey="..."`) instead.
  const jsxBraces = /(?<![:\w-])licenseKey=\{/;
  const offenders = testFiles.filter(path => path.endsWith('.vue') && jsxBraces.test(readFromRoot(path)));

  assert.deepEqual(offenders, [], 'These Vue templates pass the key as the literal text in braces. Bind it with '
    + '`:licenseKey="..."` to a value the component exposes.');
  assert.ok(jsxBraces.test('licenseKey={TEST_LICENSE_KEY}') && !jsxBraces.test(':licenseKey="licenseKeyProp"'),
    'The JSX-brace check must catch the JSX form and pass a binding.');
});

test('every file the guard allows still holds a literal key', () => {
  // A stale entry would let a literal back into that file unnoticed.
  const holding = new Set(filesWithLiteral(Object.keys(ALLOWED).filter(path => existsSync(join(ROOT, path))),
    readFromRoot));
  const stale = Object.keys(ALLOWED).filter(path => !holding.has(path));

  assert.deepEqual(stale, [], 'ALLOWED names files that no longer hold a literal key. Remove them.');
});

test('no product code compares a key with the retired non-commercial key', () => {
  // Handsontable 19.0 reads the non-commercial key as invalid. A literal comparison added back to the
  // key reader or the legacy path would bring the key back without any test noticing.
  const holding = productFiles.filter(path => codeLinesWithRetiredKey(readFromRoot(path)).length > 0);
  const offenders = holding.filter(path => !(path in PRODUCT_ALLOWED));
  const stale = Object.keys(PRODUCT_ALLOWED).filter(path => !holding.includes(path));

  assert.deepEqual(offenders, [], 'These product files name the retired non-commercial key in code. '
    + 'Handsontable reads it as an invalid key since 19.0: do not recognize it again.');
  assert.deepEqual(stale, [], 'PRODUCT_ALLOWED names files that no longer hold the key. Remove them.');
  assert.ok(productFiles.length > 500,
    `The scan found only ${productFiles.length} product files; check PRODUCT_TREES.`);
});

test('the retired-key scan catches a code line and passes a comment', () => {
  // The control of the test above: without it, a check that matched nothing would pass.
  const code = '  if (key.toLowerCase() === \'non-commercial-and-evaluation\') {';
  const upperCase = '  const KEYS = [\'HT68E-1F2B7-47158-70B05-0842F\'];';
  const text = [
    code,
    upperCase,
    ' * Since 19.0, the `\'non-commercial-and-evaluation\'` key is not a valid key.',
    '  // \'ht68e-1f2b7-47158-70b05-0842f\' reads as invalid.',
    '  return state; // was \'non-commercial-and-evaluation\'',
  ].join('\n');

  assert.deepEqual(codeLinesWithRetiredKey(text), [code, upperCase]);
});

// A grid constructor: `new Handsontable(`, `new Handsontable.Core(`, `new Core(`, the same through the object a
// page exposes it on (`new win.Handsontable(` in a `page.evaluate`), or jQuery's `.handsontable(`.
const GRID_CONSTRUCTOR =
  /new\s+(?:[A-Za-z_$][\w$]*\.)*(?:Handsontable(?:\.Core|\.default)?|Core)\s*\(|\.handsontable\s*\(/g;

// The characters after which a `/` starts a regular expression literal rather than a division.
const BEFORE_REGEXP = new Set([...'(,=:[!&|?{};+-*%<>~^']);

// The keywords after which a `/` starts a regular expression literal (`return /'/.test(s)`).
const REGEXP_KEYWORDS = new Set(['return', 'typeof', 'case', 'throw', 'in', 'of', 'delete', 'void', 'yield',
  'await', 'instanceof', 'new', 'else', 'do']);

/**
 * Returns the word that ends right before `index`, skipping white space.
 *
 * @param {string} text The text.
 * @param {number} index The index.
 * @returns {string}
 */
function wordBefore(text, index) {
  let end = index;

  while (end > 0 && /\s/.test(text[end - 1])) {
    end -= 1;
  }

  let start = end;

  while (start > 0 && /[\w$]/.test(text[start - 1])) {
    start -= 1;
  }

  return text.slice(start, end);
}

/**
 * Lexes the code of one script: masks the contents of strings, template literals, regular expressions and
 * comments in `code`, and the comments alone in `noComments`, with spaces. The quotes, the newlines and every
 * index stay, so a position in either output is the same position in the text. A string ends at a newline
 * as well, so text that only looks like code (an apostrophe in JSX text) can open nothing past its line.
 *
 * @param {string} text The text.
 * @param {number} from The index the script starts at.
 * @param {number} to The index the script ends at.
 * @param {string[]} code The masked code, written in place.
 * @param {string[]} noComments The text without comments, written in place.
 * @returns {Array<[number, number]>} The spans of the template literals' text, between their backticks.
 */
function lexScript(text, from, to, code, noComments) {
  // One entry per open `${`: the brace depth inside it, so its closing `}` resumes the template, and where
  // that template's text started.
  const templates = [];
  const templateSpans = [];
  let templateStart = 0;
  let state = 'code';
  let quote = '';
  let lastSignificant = '';
  let inClass = false;

  const blank = (index, keepInNoComments) => {
    if (text[index] !== '\n') {
      code[index] = ' ';

      if (!keepInNoComments) {
        noComments[index] = ' ';
      }
    }
  };

  for (let index = from; index < to; index++) {
    const char = text[index];
    const next = text[index + 1];

    if (state === 'line-comment') {
      if (char === '\n') {
        state = 'code';
      } else {
        blank(index, false);
      }
    } else if (state === 'block-comment') {
      blank(index, false);

      if (char === '*' && next === '/') {
        blank(index + 1, false);
        index += 1;
        state = 'code';
      }
    } else if (state === 'string' || state === 'regexp') {
      if (char === '\n') {
        state = 'code';
        inClass = false;
      } else if (char === '\\') {
        blank(index, true);
        blank(index + 1, true);
        index += 1;
      } else if (state === 'regexp' && (char === '[' || (char === ']' && inClass))) {
        inClass = char === '[';
        blank(index, true);
      } else if (char === quote && !inClass) {
        state = 'code';
        lastSignificant = 'a';
      } else {
        blank(index, true);
      }
    } else if (state === 'template') {
      if (char === '\\') {
        blank(index, true);
        blank(index + 1, true);
        index += 1;
      } else if (char === '`') {
        templateSpans.push([templateStart, index]);
        state = 'code';
        lastSignificant = 'a';
      } else if (char === '$' && next === '{') {
        templates.push({ depth: 0, start: templateStart });
        index += 1;
        state = 'code';
        lastSignificant = '{';
      } else {
        blank(index, true);
      }
    } else if (char === '/' && next === '/') {
      blank(index, false);
      state = 'line-comment';
    } else if (char === '/' && next === '*') {
      blank(index, false);
      state = 'block-comment';
    } else if (char === '\'' || char === '"') {
      state = 'string';
      quote = char;
    } else if (char === '`') {
      state = 'template';
      templateStart = index + 1;
    } else if (char === '/' && (lastSignificant === '' || BEFORE_REGEXP.has(lastSignificant)
        || (lastSignificant === 'a' && REGEXP_KEYWORDS.has(wordBefore(text, index))))) {
      state = 'regexp';
      quote = '/';
      inClass = false;
    } else if (templates.length > 0 && (char === '{' || char === '}')) {
      const template = templates[templates.length - 1];

      if (char === '{') {
        template.depth += 1;
      } else if (template.depth === 0) {
        templates.pop();
        templateStart = template.start;
        state = 'template';
      } else {
        template.depth -= 1;
      }

      lastSignificant = char;
    } else if (!/\s/.test(char)) {
      lastSignificant = /[\w$]/.test(char) ? 'a' : char;
    }
  }

  return templateSpans;
}

/**
 * Lexes the `<script>` blocks of a markup span as code, and the `<script>` blocks of every template literal
 * they hold: a spec that builds its fixture page in a template literal keeps its grid in one. A block inside
 * a template literal is read with the template's escapes undone, in place, so every index stays: an escaped
 * backtick, dollar sign or backslash reads as the character it writes.
 *
 * @param {string} text The text.
 * @param {number} from The index the markup starts at.
 * @param {number} to The index it ends at.
 * @param {string[]} code The masked code, written in place.
 * @param {string[]} noComments The text without comments, written in place.
 * @param {boolean} [inTemplate] Whether the markup is the text of a template literal.
 */
function lexScriptBlocks(text, from, to, code, noComments, inTemplate = false) {
  for (const match of text.slice(from, to).matchAll(/(<script\b[^>]*>)([\s\S]*?)<\/script\b[^>]*>/gi)) {
    const start = from + match.index + match[1].length;
    const end = start + match[2].length;
    const view = inTemplate
      ? text.slice(0, start) + match[2].replace(/\\([`$\\])/g, ' $1') + text.slice(end)
      : text;

    for (let index = start; index < end; index++) {
      code[index] = text[index];
      noComments[index] = text[index];
    }

    lexCode(view, start, end, code, noComments);
  }
}

/**
 * Lexes a span of code (`lexScript()`), then the `<script>` blocks inside its template literals.
 *
 * @param {string} text The text.
 * @param {number} from The index the code starts at.
 * @param {number} to The index it ends at.
 * @param {string[]} code The masked code, written in place.
 * @param {string[]} noComments The text without comments, written in place.
 */
function lexCode(text, from, to, code, noComments) {
  lexScript(text, from, to, code, noComments)
    .forEach(([start, end]) => lexScriptBlocks(text, start, end, code, noComments, true));
}

/**
 * Masks a file for the keyless scan: `code` holds the code with strings, template literals, regular
 * expressions and comments blanked, `noComments` the code with comments blanked, both as long as the text.
 * An HTML or Vue file is code only inside its `<script>` blocks; the markup around them is blanked in both,
 * so an apostrophe in a paragraph cannot open a string. A `<script>` block inside a template literal is
 * code too.
 *
 * @param {string} text The file's text.
 * @param {string} path The file's path, which decides whether it is markup.
 * @returns {{ code: string, noComments: string }}
 */
function maskSource(text, path) {
  // By UTF-16 unit, as the lexer and `matchAll()` index: a character outside the Basic Multilingual Plane
  // (an emoji) is two units, and spreading the string would shift every index after it.
  const code = text.split('');
  const noComments = text.split('');

  if (/\.(html|vue)$/.test(path)) {
    code.forEach((char, index) => {
      if (char !== '\n') {
        code[index] = ' ';
        noComments[index] = ' ';
      }
    });
    lexScriptBlocks(text, 0, text.length, code, noComments);
  } else {
    lexCode(text, 0, text.length, code, noComments);
  }

  return { code: code.join(''), noComments: noComments.join('') };
}

/**
 * Returns the index of the parenthesis that closes the one at `open`, or the text length. Run on masked code,
 * so a parenthesis inside a string or a comment counts for nothing.
 *
 * @param {string} code The masked code.
 * @param {number} open The index of an opening parenthesis.
 * @returns {number}
 */
function closingParen(code, open) {
  let depth = 0;

  for (let index = open; index < code.length; index++) {
    if (code[index] === '(') {
      depth += 1;
    } else if (code[index] === ')') {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return code.length;
}

/**
 * Returns the span of a constructor call's options argument in masked code: the second argument of
 * `new …(element, options)`, the first of `.handsontable(options)`, or `null` when the call passes none.
 *
 * @param {string} code The masked code.
 * @param {number} from The index right after the call's opening parenthesis.
 * @param {number} to The index of its closing parenthesis.
 * @param {boolean} isJquery Whether the call is jQuery's `.handsontable(`.
 * @returns {[number, number] | null}
 */
function optionsSpan(code, from, to, isJquery) {
  const trimmed = ([start, end]) => {
    while (start < end && /\s/.test(code[start])) {
      start += 1;
    }

    return start < end ? [start, end] : null;
  };

  if (isJquery) {
    return trimmed([from, to]);
  }

  let depth = 0;

  for (let index = from; index < to; index++) {
    const char = code[index];

    if ('([{'.includes(char)) {
      depth += 1;
    } else if (')]}'.includes(char)) {
      depth -= 1;
    } else if (char === ',' && depth === 0) {
      return trimmed([index + 1, to]);
    }
  }

  return null;
}

/**
 * Returns the index where the expression that starts at `from` ends: a `;`, a closing bracket it did not
 * open, or a line break that ends the statement (automatic semicolon insertion, read loosely: a line that
 * ends on an operator other than `/`, or a next line that starts with one, goes on).
 *
 * @param {string} code The masked code.
 * @param {number} from The index the expression starts at.
 * @returns {number}
 */
function expressionEnd(code, from) {
  let depth = 0;

  for (let index = from; index < code.length; index++) {
    const char = code[index];

    if ('([{'.includes(char)) {
      depth += 1;
    } else if (')]}'.includes(char)) {
      depth -= 1;

      if (depth < 0) {
        return index;
      }
    } else if (depth === 0 && (char === ';' || char === ',')) {
      return index;
    } else if (depth === 0 && char === '\n') {
      const before = code.slice(from, index).trimEnd();
      const after = code.slice(index + 1).trimStart();

      // A `/` at a line end is the end of a masked regular expression as often as a division: not read on.
      if (before !== '' && !/[=+\-*%&|^!~?:<>(,[{.]$/.test(before) && !/^[.?:+\-*/%&|^<>=,)\]}]/.test(after)) {
        return index;
      }
    }
  }

  return code.length;
}

/**
 * Returns the index of the brace that closes the one at `open` in masked code, or the code length.
 *
 * @param {string} code The masked code.
 * @param {number} open The index of an opening brace.
 * @returns {number}
 */
function closingBrace(code, open) {
  let depth = 0;

  for (let index = open; index < code.length; index++) {
    if (code[index] === '{') {
      depth += 1;
    } else if (code[index] === '}') {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return code.length;
}

/**
 * Escapes a name for a regular expression.
 *
 * @param {string} name The name.
 * @returns {string}
 */
function escapeName(name) {
  return name.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

// A name, possibly dotted (`window.htSettings`), at the start of an expression.
const LEADING_NAME = /^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*([([]?)/;

// The names that never lead to a key in this file.
const NOT_RESOLVED = new Set(['window', 'document', 'this', 'undefined', 'null', 'structuredClone', 'JSON']);

/**
 * Whether a span names `licenseKey` in code: as an identifier, or as a quoted property name. A `licenseKey`
 * inside any other string (a title, a message) gives no grid a key.
 *
 * @param {{ code: string, noComments: string }} source The masked file.
 * @param {number} from The index the span starts at.
 * @param {number} to The index it ends at.
 * @returns {boolean}
 */
function namesKey(source, from, to) {
  return /\blicenseKey\b/.test(source.code.slice(from, to))
    || /['"]licenseKey['"]\s*:/.test(source.noComments.slice(from, to));
}

/**
 * Splits the text between a pair of brackets at its top-level commas.
 *
 * @param {string} inner The text between the brackets.
 * @returns {string[]}
 */
function topLevelParts(inner) {
  const parts = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < inner.length; index++) {
    if ('([{'.includes(inner[index])) {
      depth += 1;
    } else if (')]}'.includes(inner[index])) {
      depth -= 1;
    } else if (inner[index] === ',' && depth === 0) {
      parts.push(inner.slice(start, index));
      start = index + 1;
    }
  }

  return [...parts, inner.slice(start)];
}

/**
 * Lists the names whose value flows into an expression, read from masked code: the expression itself when it
 * is a name (`settings`, `window.htSettings`), the function it calls (`baseSettings('a')`) or the object it
 * indexes (`scenarios[name]()`), the spread sources of an object literal (`{ ...base }`), the arguments of
 * `Object.assign()`, and an arrow function's result. A name inside a callback, a call's arguments or a
 * property's value flows nowhere, so a grid that only mentions a keyed one does not borrow its key.
 *
 * @param {string} text The expression, masked.
 * @returns {string[]}
 */
function flowNames(text) {
  let expression = text.trim()
    .replace(/^<[^>]*>\s*/, '')
    .replace(/\s+(?:as|satisfies)\s+[\w$.<>[\], |]+$/, '');

  while (expression.startsWith('(') && closingParen(expression, 0) === expression.length - 1) {
    expression = expression.slice(1, -1).trim();
  }

  const arrow = expression.match(/^(?:async\s+)?(?:\([^()]*\)|[A-Za-z_$][\w$]*)\s*=>\s*/);

  if (arrow) {
    const body = expression.slice(arrow[0].length);

    return body.startsWith('{') ? returnedNames(body) : flowNames(body);
  }

  if (expression.startsWith('{')) {
    return topLevelParts(expression.slice(1, closingBrace(expression, 0)))
      .map(part => part.trim().match(/^\.\.\.\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)/)?.[1])
      .filter(name => name !== undefined);
  }

  const leading = expression.match(LEADING_NAME);

  if (!leading) {
    return [];
  }

  if (leading[1] === 'Object.assign' && leading[2] === '(') {
    const open = leading[0].length - 1;

    return topLevelParts(expression.slice(open + 1, closingParen(expression, open))).flatMap(flowNames);
  }

  return [leading[1]];
}

/**
 * Lists the names whose value a function body returns.
 *
 * @param {string} body The body, masked, braces included.
 * @returns {string[]}
 */
function returnedNames(body) {
  return [...body.matchAll(/\breturn\b/g)]
    .flatMap(match => flowNames(body.slice(match.index + 6, expressionEnd(body, match.index + 6))));
}

/**
 * Lists what gives a name its value in a file: the expression of a `const`, `let` or `var` declaration or of
 * an assignment, and the body of a function declaration. The whole file is searched, not the name's scope.
 *
 * @param {string} code The masked code.
 * @param {string} name The name, possibly dotted (`window.htSettings`).
 * @returns {Array<{ span: [number, number], isBody: boolean }>}
 */
function declarationSpans(code, name) {
  const escaped = escapeName(name);
  const spans = [];
  const assignment = new RegExp(`(?:\\b(?:const|let|var)\\s+|(?<![\\w$.]))${escaped}\\s*(?::[^=;\\n]+)?=(?![=>])`, 'g');
  const declaration = new RegExp(`\\bfunction\\s*\\*?\\s*${escaped}\\s*\\(`, 'g');

  for (const match of code.matchAll(assignment)) {
    const from = match.index + match[0].length;

    spans.push({ span: [from, expressionEnd(code, from)], isBody: false });
  }

  for (const match of code.matchAll(declaration)) {
    const open = code.indexOf('{', closingParen(code, match.index + match[0].length - 1));

    if (open !== -1) {
      spans.push({ span: [open, closingBrace(code, open) + 1], isBody: true });
    }
  }

  return spans;
}

/**
 * Whether an expression carries a license key this file gives it: the expression names `licenseKey`, or a
 * name whose value flows into it (`flowNames()`, `returnedNames()` for a function body) is declared in the
 * file with a value or a body that does, or gets one assigned (`settings.licenseKey = …`). Followed three
 * names deep. Names are matched in the whole file, not by scope, so two tests that each declare `settings`
 * share what either declaration holds. A name declared in another file carries nothing.
 *
 * @param {{ code: string, noComments: string }} source The masked file.
 * @param {[number, number]} span The span to read.
 * @param {boolean} isBody Whether the span is a function body.
 * @param {number} depth How many names deep this span is.
 * @param {Set<string>} seen The names already followed.
 * @returns {boolean}
 */
function carriesKey(source, [from, to], isBody = false, depth = 0, seen = new Set()) {
  if (namesKey(source, from, to)) {
    return true;
  }

  if (depth >= 3) {
    return false;
  }

  const text = source.code.slice(from, to);
  const names = (isBody ? returnedNames(text) : flowNames(text))
    .flatMap(name => (name.startsWith('window.') ? [name, name.slice('window.'.length)] : [name]));

  return names.filter(name => !NOT_RESOLVED.has(name) && !seen.has(name)).some((name) => {
    seen.add(name);

    if (new RegExp(`(?<![\\w$.])${escapeName(name)}\\.licenseKey\\s*=(?!=)`).test(source.code)) {
      return true;
    }

    return declarationSpans(source.code, name)
      .some(declared => carriesKey(source, declared.span, declared.isBody, depth + 1, seen));
  });
}

/**
 * Finds the grids a test file builds without a license key, by line. The file is read through
 * `maskSource()`, so a constructor, a parenthesis or a comma inside a string or a comment counts for
 * nothing. A call passes when its arguments name `licenseKey`, when they are a string (a jQuery method call
 * such as `.handsontable('getInstance')`), or when its options carry a key the file gives them (`carriesKey()`).
 *
 * @param {string} text The file's text.
 * @param {string} [path] The file's path, which decides whether the file is markup.
 * @returns {number[]} The line numbers of the keyless calls.
 */
function keylessGridLines(text, path = 'spec.js') {
  // Most files build no grid: lexing only the ones that name a constructor keeps the scan fast.
  if (text.search(GRID_CONSTRUCTOR) === -1) {
    return [];
  }

  const source = maskSource(text, path);

  return [...source.code.matchAll(GRID_CONSTRUCTOR)]
    .filter((match) => {
      const open = match.index + match[0].length - 1;
      const close = closingParen(source.code, open);

      if (/^\s*['"`]/.test(source.code.slice(open + 1, close)) || namesKey(source, open + 1, close)) {
        return false;
      }

      const options = optionsSpan(source.code, open + 1, close, match[0].startsWith('.'));

      return options === null || !carriesKey(source, options);
    })
    .map(match => text.slice(0, match.index).split('\n').length);
}

// The files that build grids without a key on purpose, with the reason. The license specs build theirs
// through the Jasmine helper (`handsontable({}, true)`), which this scan does not read, or through a fixture
// page that takes its key from the spec, so only the lock guard's own page object is listed.
const KEYLESS_ALLOWED = {
  'tests/fixtures/pages/LicenseLockGuardPage.ts': 'builds the locked grid the lock guard\'s own spec must find',
};

test('every grid a spec or a fixture builds takes a license key', () => {
  // Since 19.0 a grid built without a valid key sits behind the license lock: API calls still work, so a
  // spec that only reads the grid passes, while clicks, focus, screenshots and axe scans meet the lock.
  // Jest unit tests are left to the guard in `handsontable/test/jestExpectedConsole.js`, which fails a unit
  // test whose grid mounts the license lock or logs a license key message.
  const scanned = testFiles.filter(path => !/\.unit\.[jt]sx?$|\.types\.ts$|\.test\.mjs$/.test(path));
  const offenders = scanned.filter(path => !(path in KEYLESS_ALLOWED))
    .map(path => [path, keylessGridLines(readFromRoot(path), path)])
    .filter(([, lines]) => lines.length > 0)
    .map(([path, lines]) => `${path}:${lines.join(',')}`);

  assert.deepEqual(offenders, [], 'These specs or fixtures build a grid without a license key. Pass '
    + '`licenseKey: TEST_LICENSE_KEY` (a global in Jasmine specs) or `licenseKey: window.htTestLicenseKey` (a '
    + 'Playwright fixture). A test of a missing key itself goes in KEYLESS_ALLOWED, with the reason.');
  assert.ok(scanned.some(path => path.endsWith('.spec.js')), 'The keyless scan found no Jasmine spec.');
  const stale = Object.keys(KEYLESS_ALLOWED).filter(path => keylessGridLines(readFromRoot(path), path).length === 0);

  assert.deepEqual(stale, [],
    'KEYLESS_ALLOWED names files that no longer build a grid without a key. Remove them.');
});

test('the keyless scan catches a grid built without a key and passes one built with it', () => {
  // The control of the test above: without it, a scan that matched nothing would pass.
  const text = [
    'const a = new Handsontable(container, { data });',
    'const b = new Handsontable(container);',
    'const c = $("<div>").appendTo("body").handsontable();',
    'const d = $container.handsontable({ data: [] });',
    'const f = $container.handsontable(\'getInstance\');',
    'it(\'fires between `new Handsontable.Core()` and `init()`\', () => {});',
    'const g = new Handsontable(container, { ...base, data });',
  ].join('\n');

  assert.deepEqual(keylessGridLines(text), [1, 2, 3, 4, 7],
    'Without a licenseKey anywhere in the file, a spread cannot carry one either.');
  assert.deepEqual(keylessGridLines([
    text,
    'const base = { licenseKey: TEST_LICENSE_KEY };',
    'const e = new Handsontable(container, { licenseKey: TEST_LICENSE_KEY, data });',
  ].join('\n')), [1, 2, 3, 4]);
});

test('the keyless scan reads no parenthesis or constructor inside a string or a comment', () => {
  // A `)` inside a string closed a keyed call early, so its key was cut off and the grid read as keyless.
  assert.deepEqual(keylessGridLines(
    'new Handsontable(el, { data: [[\'a)b\']], licenseKey: TEST_LICENSE_KEY });',
  ), []);
  // A `(` inside a comment ran a keyless call on into the next one, which lent it its key.
  assert.deepEqual(keylessGridLines([
    'new Handsontable(el, { data: [] /* ( */ });',
    'new Handsontable(el, { licenseKey: TEST_LICENSE_KEY });',
  ].join('\n')), [1]);
  // A constructor in a block comment, or in a multi-line template, builds nothing.
  assert.deepEqual(keylessGridLines([
    '/*',
    ' * new Handsontable(container, {});',
    ' */',
    'const title = `',
    '  new Handsontable(container, {})',
    '`;',
  ].join('\n')), []);
  // A grid a spec builds in `page.evaluate` through the object the page exposes the class on.
  assert.deepEqual(keylessGridLines('win.hot = new win.Handsontable(container, { data: [] });'), [1]);
  // A character outside the Basic Multilingual Plane is two indexes: every index after it stays in place.
  assert.deepEqual(keylessGridLines([
    'new Handsontable(el, { data: [[\'\u{1F600}\', \')\']], licenseKey: TEST_LICENSE_KEY });',
    'new Handsontable(el, {});',
  ].join('\n')), [2]);
  // A regular expression after a keyword holds a quote that opens no string.
  assert.deepEqual(keylessGridLines([
    'function hasQuote(s) { return /\'/.test(s); } new Handsontable(el, {});',
  ].join('\n')), [1]);
});

test('the keyless scan reads a fixture as markup, and a page a spec writes in a template literal', () => {
  // The apostrophe in the paragraph is text: lexed as code, it would open a string across the script.
  assert.deepEqual(keylessGridLines([
    '<p>Don\'t lock the grid</p>',
    '<script>',
    '  new Handsontable(a, { licenseKey: window.htTestLicenseKey });',
    '  new Handsontable(b, {});',
    // An end tag with white space or attributes still ends the block, so the prose after it is not code.
    '</script\t foo>',
    '<p>Don\'t</p><script>new Handsontable(c, {});</script>',
  ].join('\n'), 'tests/fixtures/demo/new.html'), [4, 6]);
  assert.deepEqual(keylessGridLines([
    'const html = `<!DOCTYPE html>',
    '<script>',
    '  new Handsontable(container, { data: [] });',
    '</script>`;',
  ].join('\n'), 'tests/e2e/new.spec.ts'), [3]);
  // A template nested in the page's own `${}`, and an escaped backtick in its script, change neither.
  assert.deepEqual(keylessGridLines([
    // eslint-disable-next-line no-template-curly-in-string -- the scanned source holds a template literal
    'const html = `<script>${`/* nested */`}',
    '  const s = \\`a\\`;',
    '  new Handsontable(container, {});',
    '</script>`;',
  ].join('\n'), 'tests/e2e/new.spec.ts'), [3]);
});

test('the keyless scan follows indirect options to the key the file gives them, and nowhere else', () => {
  // A key on another object, or in a comment, no longer passes a grid built from a variable or a spread.
  assert.deepEqual(keylessGridLines([
    'const keyed = { licenseKey: TEST_LICENSE_KEY };',
    'const plain = { data: [] };',
    'new Handsontable(el, { ...plain, height: 100 });',
    'new Handsontable(el, plain);',
  ].join('\n')), [3, 4]);
  assert.deepEqual(keylessGridLines([
    '// Each grid takes a licenseKey.',
    'import { settings } from \'./licenseKey\';',
    'new Handsontable(el, settings);',
    'new Handsontable(el, { title: \'licenseKey\' });',
  ].join('\n')), [3, 4]);
  // A name inside a callback, a call's arguments or a property's value does not flow into the options.
  assert.deepEqual(keylessGridLines([
    'const hot = new Handsontable(a, { licenseKey: TEST_LICENSE_KEY });',
    'const data = { licenseKey: TEST_LICENSE_KEY };',
    'new Handsontable(b, { afterChange() { log(hot); } });',
    'new Handsontable(b, { data: copy(hot) });',
    'new Handsontable(b, { data: [[1]] });',
  ].join('\n')), [3, 4, 5]);
  // A statement that ends on a regular expression does not run on into the next line's key.
  assert.deepEqual(keylessGridLines([
    'const re = /x/',
    'const other = { licenseKey: TEST_LICENSE_KEY }',
    'const settings = re',
    'new Handsontable(el, settings);',
  ].join('\n')), [4]);

  // A key the options get through a variable, a spread, `Object.assign()`, a helper or an assignment passes.
  assert.deepEqual(keylessGridLines([
    'const base = { licenseKey: window.htTestLicenseKey };',
    'const settings = { ...base, data: [] };',
    'function baseSettings(id) {',
    '  return { id, licenseKey: window.htTestLicenseKey };',
    '}',
    'window.htSettings = { licenseKey: window.htTestLicenseKey };',
    'function build(options) {',
    '  options.licenseKey = TEST_LICENSE_KEY;',
    '  return new Handsontable(el, options);',
    '}',
    'new Handsontable(el, settings);',
    'new Handsontable(el, Object.assign({}, base, { data: [] }));',
    'new Handsontable(el, baseSettings(\'a\'));',
    'new Handsontable(el, window.htSettings);',
  ].join('\n')), []);
});

test('the scan finds a literal key it is given, in every spelling', () => {
  // The guard's own control: without it, a scan that read no file would pass the first test.
  const demo = `${VISUAL_DEMOS}/js/demo/src/demos/new/index.js`;
  const fake = {
    'tests/fixtures/demo/new.html': `licenseKey: '${LITERALS[0]}',`,
    'wrappers/vue3/test/new.spec.ts': `licenseKey="${LITERALS[1]}"`,
    [demo]: `licenseKey: 'This is a key for ${TEST_KEY_MARKER}'`,
    'tests/e2e/clean.spec.ts': 'licenseKey: window.htTestLicenseKey,',
  };

  assert.deepEqual(filesWithLiteral(Object.keys(fake), path => fake[path]),
    ['tests/fixtures/demo/new.html', 'wrappers/vue3/test/new.spec.ts', demo]);
  assert.ok(testFiles.length > 500, `The scan found only ${testFiles.length} test files; check TEST_TREES.`);
});
