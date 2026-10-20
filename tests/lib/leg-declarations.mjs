/**
 * Which legs of the theme × bundle matrix a Playwright spec runs on: the pure half.
 *
 * Every spec used to run on all six Chromium legs (`e2e-<theme>` and `e2e-<theme>-min` in
 * `tests/playwright.config.ts`). Most specs assert DOM or API facts that cannot differ by theme or
 * bundle, so a spec now DECLARES the axes it is sensitive to, with a tag on every top-level block:
 *
 * - no tag: `e2e-main` only (plain UMD, the main theme) – the default;
 * - `THEMES_TAG`: the three UMD legs (`e2e-main`, `e2e-horizon`, `e2e-classic`);
 * - `BUNDLES_TAG`: `e2e-main` and `e2e-main-min`;
 * - both: all six (`e2e-horizon-min` and `e2e-classic-min` run only specs that declare both axes).
 *
 * The config turns the declaration into a per-project `grep` (`legGrep()`); `HOT_E2E_FULL_MATRIX=1`
 * drops the greps so the nightly runs everything (`parseFullMatrix()`). The rest of this module is the
 * static sweep behind `tests/lib/__tests__/leg-declarations.test.mjs`: a scanner that reads a spec's
 * top-level blocks and their tags out of the source text, a table of surface markers (the code shapes
 * that make a spec theme- or bundle-sensitive), and `checkSpec()`, which refuses a spec that touches
 * such a surface without declaring the axis. The sweep reads text, not an AST: the root tooling job
 * installs no dependencies. `tests/scripts/leg-replay.mjs` shares the declaration reader.
 *
 * Written up in `tests/AGENTS.md` ("Declaring the legs").
 */

// eslint-disable-next-line no-restricted-syntax -- this defines the tag the rule bans elsewhere
export const THEMES_TAG = '@themes';
// eslint-disable-next-line no-restricted-syntax -- this defines the tag the rule bans elsewhere
export const BUNDLES_TAG = '@bundles';

/**
 * The environment variable that makes every project run every spec, whatever it declares: the
 * nightly's and the release path's full matrix. `'1'` is on, `''`, unset and `'0'` are off, and
 * anything else throws (`parseFullMatrix()`).
 */
export const FULL_MATRIX_ENV = 'HOT_E2E_FULL_MATRIX';

/**
 * The tag constants a declaration may name, and the tag each one stands for. `readBlocks()` resolves
 * an identifier in a `{ tag: … }` through this table; an identifier outside it is a problem, never
 * `undefined` (Playwright accepts `{ tag: undefined }` silently, and the spec then runs on one leg).
 */
export const TAG_CONSTANTS = Object.freeze({
  THEMES_TAG,
  BUNDLES_TAG,
  CROSS_BROWSER_TAG: '@cross-browser',
  CLIPBOARD_SHORTCUT_TAG: '@clipboard-shortcut',
  MOTION_TAG: '@motion',
});

/**
 * A tag one typo away from a leg tag. The ESLint rule in `tests/.eslintrc.cjs` bans the same shape as
 * a bare string, and the sweep flags it when it is written as a literal in a declaration.
 */
export const LEG_TAG_LIKE = /^@(?:[Tt]hemes?|[Bb]undles?)$/;

/**
 * The comment that opts a spec out of one marker: `// leg-declarations: ignore <marker-id> -- <why>`.
 * It is read from the SPEC file only, never from a page object, so an opt-out stays beside the test
 * it speaks for.
 */
export const IGNORE_COMMENT = 'leg-declarations: ignore';
export const IGNORE_WHY_MIN_LENGTH = 10;

const IGNORE_PATTERN = new RegExp(`^[ \\t]*//[ \\t]*${IGNORE_COMMENT}[ \\t]+(\\S+)(?:[ \\t]+--[ \\t]*(.*))?$`, 'gm');
const SPEC_IMPORT = /\bimport\s+(type\s+)?(?:[^'";]*?\s+from\s+)?['"](\.\.?\/[^'"]+)['"]|\bimport\(\s*['"](\.\.?\/[^'"]+)['"]\s*\)/g;
const RUNTIME_EXPORT = /\bexport\s+(?:default|const|let|var|function|async|class|abstract|enum)\b|\bexport\s*\{/;
const HTML_NAME = /(?<![\w.-])((?:[a-z0-9-]+\/)*[a-z0-9-]+\.html)\b/g;
const FIXTURE_DIR_PREFIX = /^(?:tests\/)?fixtures\/demo\//;
const BARE_FIXTURE_NAME = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/;
const DYNAMIC_HTML_NAME = /\$\{(?:this\.)?([A-Za-z_$][\w$]*)\}\.html/g;
const CONSTRUCTOR_CALL = /\bnew\s+[A-Z][\w$]*\s*\(/g;
// The words after which a `/` starts a regular expression rather than a division.
const REGEX_AFTER_WORDS = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else',
  'yield', 'await',
]);

// A layout box or a size the browser computed: what the `geometry` marker reads in a spec, and what makes
// a page object's function a geometry helper (`readGeometryHelpers()`).
const GEOMETRY_READ = /\bgetBoundingClientRect\(|\.boundingBox\(|\b(?:offset|client|scroll)(?:Width|Height)\b/;
// Where a pointer is aimed: the coordinates of a real press or move, and the `x`/`y` of a point (a CDP
// event, a `position` option, a point a drag helper takes).
const POINTER_CALL = /(?<![\w$])(?:mouse|touchscreen)\s*\.\s*(?:click|dblclick|move|tap)\s*\(/g;
const POINT_KEY = /[{,]\s*[xy]\s*:/g;
// A locator action's `position` is an offset from the element's top-left corner already, so a constant
// there aims a fixed number of pixels from a box edge with no box term written (`{ x: 5, y: 5 }`).
const POSITION_OPTION = /\b(?:position|sourcePosition|targetPosition)\s*:\s*\{/g;
const PIXEL_COUNT = /^-?\s*\d+(?:\.\d+)?$/;
// An edge or a size of a box (`box.x`, `rect.right`, `box?.height`), never a method of that name.
const BOX_TERM = /\??\.\s*(?:x|y|width|height|left|right|top|bottom)\b(?!\s*\()/;
// A whole number of pixels added or subtracted (`+ 4`, `- 20`, `3 +`), never a factor (`/ 2`, `10 *`).
const PIXEL_OFFSET = /(?<=[\w$)\]]\s*)[-+]\s*\d+(?:\.\d+)?(?![\w.]|\s*[*/%])|(?<![\w$.*/%]\s*)\b\d+(?:\.\d+)?\s*[-+]\s*(?=[\w$(])/;
// The definitions a page object names a function with: a method or a function declaration, and an arrow
// function or a function expression bound to a `const`/`let`.
const METHOD_DEFINITION = /^[ \t]*((?:(?:export|default|public|private|protected|static|async|override|get)\s+)*)(?:function\s*\*?\s*)?(#?[A-Za-z_$][\w$]*)\s*(?:<[^>\n]*>)?\s*\(/gm;
const BOUND_FUNCTION = /^[ \t]*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=\n]+)?=\s*(?:async\s*)?(?:function\b[^(]*)?\(/gm;
// An arrow function a class keeps in a field (`rowHeight = async () => …`): a method in all but syntax.
const CLASS_FIELD_FUNCTION = /^[ \t]*(?:(?:public|private|protected|static|readonly|override)\s+)*(#?[A-Za-z_$][\w$]*)\s*(?::[^=\n]+)?=\s*(?:async\s*)?\(/gm;
const NOT_A_FUNCTION_NAME = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'with', 'await', 'typeof', 'new', 'super',
  'void', 'delete', 'yield', 'throw', 'do', 'else', 'constructor',
]);
// The type names a declared return type is made of when it cannot be a size or a position.
const NON_GEOMETRY_TYPES = new Set([
  'Promise', 'void', 'string', 'Locator', 'ElementHandle', 'JSHandle', 'null', 'undefined', 'never', 'Array',
  'ReadonlyArray',
]);
const EXPECT_CALL = /(?<![\w$.])expect(?:\.(?:soft|poll))?\s*\(/g;
const LITERAL_MATCHER = /^\s*(?:\.\s*(?:not|resolves|rejects)\s*)*\.\s*(toBe|toEqual|toStrictEqual|toMatchObject|toBeCloseTo|toBeLessThan|toBeLessThanOrEqual|toBeGreaterThan|toBeGreaterThanOrEqual)\s*\(/;
// A verdict with the literal in the matcher's name, counted only on a helper declared to return a boolean:
// on a box it says no more than that the element exists.
const TRUTHY_MATCHER = /^\s*(?:\.\s*(?:not|resolves|rejects)\s*)*\.\s*(toBeTruthy|toBeFalsy)\s*\(\s*\)/;
// A number, a numeric constant (`TALL_ROW_PX`), arithmetic of those, or a boolean.
const LITERAL_VALUE = /^(?:true|false|(?=[^a-z$]*[\dA-Z])[-+*/%().\s\d_A-Z]+)$/;
const NUMBER_TOKEN = /(?<![\w$.])\d|(?<![\w$.])[A-Z][A-Z\d]*_[A-Z\d_]*\b/;
const DECLARATION = /(?<![\w$.])(?:const|let|var)\s+(?=[A-Za-z_$[{])/g;
// A call, a class header, and a variable the spec says holds a page object (`x = new GridPage(`, `x: GridPage`).
const CALL = /(?<![\w$#])(#?[A-Za-z_$][\w$]*)\s*\(/g;
const PROPERTY_READ = /\.\s*(#?[A-Za-z_$][\w$]*)\b(?!\s*\()/g;
const CLASS_HEADER = /\bclass\s+([A-Za-z_$][\w$]*)([^{;]*)\{/g;
// The calls that hand a number through unchanged in kind. A variable inside the arguments of any other call
// is given to a function the sweep cannot follow (`leave(anchor)` returns milliseconds), and carries nothing.
const VALUE_PRESERVING_CALL = /(?:\bMath\.[\w$]+|\bNumber(?:\.[\w$]+)?|\bparse(?:Float|Int))\s*$/;
const NAMESPACE_IMPORT = /\bimport\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\b/g;
const TYPED_VARIABLE = /(?<![\w$.])([A-Za-z_$][\w$]*)\s*(?::\s*([A-Z][\w$]*)\b(?!\s*[.<(])|=\s*new\s+([A-Z][\w$]*)\s*[(<])/g;

/**
 * The surface markers: the code shapes that make a spec sensitive to an axis. A marker is read by a
 * `pattern` that runs over comment-stripped text with the strings kept (`--ht-` lives in strings), or,
 * where a shape spans an expression or two files, by a `find` function over the scanned code (pointer
 * targets, a page object's geometry compared in a spec); `scopes` says which texts are read for it: the
 * spec itself (`spec`), the page objects and helpers it imports (`module`), and the fixture HTML those
 * name (`fixture`). A hit without the axis's tag, and without an ignore comment naming the marker, fails
 * the sweep.
 *
 * Deliberately not markers: the bare words `theme`, `bundle`, `umd`, `full-min` and the file names
 * `handsontable.js`/`handsontable.full.min.js` (every fixture's `?theme=`/`?bundle=` allowlist and
 * every page object's constructor carry them as plumbing), and literal pixel values (too noisy for a
 * static rule; the geometry reads catch the specs that compare pixels). A geometry read is a marker in
 * the spec text only: a base page object with one `boundingBox()` helper would otherwise force the
 * theme axis on everything that imports it. In a page object, geometry counts only where it decides an
 * outcome, which two narrower markers read: a pointer aimed a fixed number of pixels from a box edge
 * (`pointer-offset`), and a geometry read compared to a literal, by the spec or by the page object
 * itself (`geometry-helper`). An index near the edge of the rendered band (tests/AGENTS.md, the matrix
 * section) is not a marker: whether row 6 is on screen depends on the fixture's height and the theme's
 * row heights, which the text does not say.
 */
export const SURFACE_MARKERS = Object.freeze([
  {
    id: 'theme-compare',
    axis: 'themes',
    // A comparison (either side), a lookup keyed by the theme (the bracket right after an object:
    // `widths[theme]`, `widths[this.theme]`, never the destructuring `const [theme] = …`), a switch on it, a
    // membership test, or a string test on its value (`htTheme.startsWith('h')`, `/…/.test(theme)`): every
    // shape that picks a value per theme, so each branch runs on one theme leg only. `this.` is optional
    // everywhere: a page object reads the axis off itself.
    pattern: /\b(?:this\.)?(?:ht|hot)?[Tt]heme\s*[!=]==|[!=]==\s*(?:this\.)?(?:ht|hot)?[Tt]heme\b|(?<=[\w)\]}])\[\s*(?:this\.)?(?:ht|hot)?[Tt]heme\s*\]|\bswitch\s*\(\s*(?:this\.)?(?:ht|hot)?[Tt]heme\s*\)|\.includes\(\s*(?:this\.)?(?:ht|hot)?[Tt]heme\s*\)|\b(?:this\.)?(?:ht|hot)?[Tt]heme\??\.(?:indexOf|lastIndexOf|includes|startsWith|endsWith|match|search)\(|\.test\(\s*(?:window\.)?(?:this\.)?(?:ht|hot)?[Tt]heme\s*\)/,
    scopes: ['spec', 'module', 'fixture'],
    why: 'the code branches on the theme, so each branch runs on one theme leg only',
  },
  {
    id: 'computed-style',
    axis: 'themes',
    pattern: /\bgetComputedStyle\(/,
    scopes: ['spec', 'module', 'fixture'],
    why: 'a computed style is what the theme stylesheet decides',
  },
  {
    id: 'css-token',
    axis: 'themes',
    pattern: /--ht-/,
    scopes: ['spec', 'module', 'fixture'],
    why: 'a design token has a value per theme',
  },
  {
    id: 'theme-class',
    axis: 'themes',
    pattern: /\bht-theme-/,
    scopes: ['spec', 'module'],
    why: 'the code names a theme class; a fixture\'s own param block builds it as plumbing, so fixtures are not read',
  },
  {
    id: 'hit-test',
    axis: 'themes',
    // Every API that asks what sits under a point: the element, all the elements, and the caret.
    pattern: /\b(?:elements?FromPoint|caret(?:Range|Position)FromPoint)\b/,
    scopes: ['spec', 'module', 'fixture'],
    why: 'what sits under a point depends on the theme\'s sizes and paddings',
  },
  {
    id: 'geometry',
    axis: 'themes',
    pattern: new RegExp(`${GEOMETRY_READ.source}|\\btoHaveCSS\\(`),
    scopes: ['spec'],
    why: 'a geometry read compared in the spec is a pixel assertion, and row heights, paddings and '
      + 'column widths differ per theme',
  },
  {
    id: 'pointer-offset',
    axis: 'themes',
    // A coordinate a pointer is aimed at (`mouse.click|dblclick|move`, `touchscreen.tap`, or the `x`/`y`
    // of a point) that adds or subtracts a fixed number of pixels to a box edge: `box.x + box.width - 4`.
    // A fraction of the box (`box.width / 2`) scales with the box the theme sized, and is not one.
    find: findPointerOffsets,
    scopes: ['spec', 'module'],
    why: 'a pointer aimed a fixed number of pixels from a box edge lands on a label, a padding or an icon '
      + 'depending on the theme\'s sizes',
  },
  {
    id: 'geometry-helper',
    axis: 'themes',
    // A page object's function that reads geometry (`readGeometryHelpers()`), its result compared to a
    // literal in an `expect()` of the spec, and a geometry read an `expect()` inside the page object
    // compares to one. Read in page objects because that is where the read hides from `geometry`.
    find: findGeometryComparisons,
    scopes: ['spec', 'module'],
    why: 'a size or a position compared to a literal is a pixel assertion wherever the read sits, and '
      + 'row heights, paddings and column widths differ per theme',
  },
  {
    id: 'formulas',
    axis: 'bundles',
    pattern: /\bformulas\b/i,
    scopes: ['spec', 'module', 'fixture'],
    why: 'the Formulas plugin runs on the engine the bundle ships (the plain UMD loads it as an external '
      + 'script, full.min bakes it in)',
  },
  {
    id: 'hyperformula',
    axis: 'bundles',
    pattern: /hyperformula/i,
    scopes: ['spec', 'module', 'fixture'],
    why: 'HyperFormula is the one library the two bundles ship differently',
  },
  {
    id: 'bundle-compare',
    axis: 'bundles',
    // The same five shapes on the bundle; the string test is how a fixture picks a file per bundle
    // (`window.htBundle.indexOf('.min.')` loads a theme's `.min.js` on the -min legs only). A page object's
    // argument check that only throws on an unknown bundle reads as a branch too: it belongs in
    // `fixtures/bundle.ts` (`assertKnownBundle()`), which the sweep does not read, since a text rule cannot
    // tell a throw-only guard from a behavior branch.
    pattern: /\b(?:this\.)?(?:ht)?[Bb]undle\s*[!=]==|[!=]==\s*(?:this\.)?(?:ht)?[Bb]undle\b|[!=]==\s*['"](?:umd|full-min|handsontable(?:\.full)?(?:\.min)?\.js)['"]|(?<=[\w)\]}])\[\s*(?:this\.)?(?:ht)?[Bb]undle\s*\]|\bswitch\s*\(\s*(?:this\.)?(?:ht)?[Bb]undle\s*\)|\.includes\(\s*(?:this\.)?(?:ht)?[Bb]undle\s*\)|\b(?:this\.)?(?:ht)?[Bb]undle\??\.(?:indexOf|lastIndexOf|includes|startsWith|endsWith|match|search)\(|\.test\(\s*(?:window\.)?(?:this\.)?(?:ht)?[Bb]undle\s*\)/,
    scopes: ['spec', 'module', 'fixture'],
    why: 'the code branches on the bundle, so each branch runs on one bundle leg only',
  },
]);

const MARKER_IDS = new Set(SURFACE_MARKERS.map(marker => marker.id));

/**
 * Whether the full matrix is on, from the raw value of `HOT_E2E_FULL_MATRIX`.
 *
 * Throws on anything but `'1'`, `'0'`, `''` and unset: `HOT_E2E_FULL_MATRIX=true` or `=yes` must not
 * quietly run the reduced shape on the night meant to run everything (the `HOT_TEST_PORT` precedent
 * in `tests/playwright.config.ts`).
 *
 * @param {string|undefined} raw The environment variable's value.
 * @returns {boolean} `true` when every project runs every spec.
 */
export function parseFullMatrix(raw) {
  if (raw === undefined || raw === '' || raw === '0') {
    return false;
  }
  if (raw === '1') {
    return true;
  }

  throw new Error(`${FULL_MATRIX_ENV} must be "1" (run every spec on every leg), "0" or unset, received `
    + `${JSON.stringify(raw)}.`);
}

/**
 * `text` with every character a regular expression reads as syntax escaped, the backslash included,
 * so the text matches only itself inside `new RegExp()`.
 *
 * @param {string} text The text.
 * @returns {string} The escaped text.
 */
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * A lookahead that requires `tag` as a whitespace-delimited token somewhere in the string Playwright
 * greps: `<project> <file> <describe titles and tags> <test title> <test tags>`, space-joined. The
 * lookbehind and lookahead keep `foo@themes` and `@themes-extra` from matching, and a describe titled
 * "theme switch" or a file named `theme-switch.spec.ts` never contains the `@`.
 *
 * @param {string} tag The tag, with its `@`.
 * @returns {string} The lookahead source.
 */
export function tagLookahead(tag) {
  return `(?=[\\s\\S]*(?<!\\S)${escapeRegExp(tag)}(?!\\S))`;
}

/**
 * The `grep` a project of the matrix runs with, or `undefined` for every spec.
 *
 * `e2e-main` (main theme, plain UMD) runs everything, whatever the declarations say. The other UMD
 * themes run the specs tagged `@themes`; `e2e-main-min` runs the specs tagged `@bundles`; the two
 * other `-min` legs run the specs tagged both, in one regex of two lookaheads (an AND, which an array
 * of regexes cannot express: Playwright ORs an array). With `fullMatrix` every project runs
 * everything, the nightly's shape. The two classic legs also leave out every spec tagged `@motion`, in
 * the full matrix too: the classic theme sets `--ht-table-transition` to `0s`, so a motion test has
 * nothing to watch there.
 *
 * @param {object} leg The project's axes.
 * @param {string} leg.theme `main`, `horizon` or `classic`.
 * @param {string} leg.bundle `umd` or `full-min`.
 * @param {boolean} [leg.fullMatrix] Whether `HOT_E2E_FULL_MATRIX` is on.
 * @returns {RegExp|undefined} The grep, or `undefined` when the project runs every spec.
 */
export function legGrep({ theme, bundle, fullMatrix = false }) {
  const tags = [];

  if (theme !== 'main') {
    tags.push(THEMES_TAG);
  }
  if (bundle !== 'umd') {
    tags.push(BUNDLES_TAG);
  }
  const lookaheads = fullMatrix ? [] : tags.map(tagLookahead);

  if (theme === 'classic') {
    lookaheads.push(tagLookahead(TAG_CONSTANTS.MOTION_TAG).replace('(?=', '(?!'));
  }
  if (lookaheads.length === 0) {
    return undefined;
  }

  return new RegExp(`^${lookaheads.join('')}`);
}

/**
 * The axes a list of tags declares.
 *
 * @param {string[]} tags The tags, with their `@`.
 * @returns {{themes: boolean, bundles: boolean}} The declaration.
 */
export function legsOf(tags) {
  return { themes: tags.includes(THEMES_TAG), bundles: tags.includes(BUNDLES_TAG) };
}

/**
 * The projects of `tests/playwright.config.ts` a declaration runs on: the truth table `legGrep()`
 * implements, written out, for the replay and the docs. (`tests/e2e/leg-declarations.spec.ts`
 * hardcodes its own copy on purpose, so a mistake here cannot agree with itself.)
 *
 * @param {{themes: boolean, bundles: boolean}} legs The declaration.
 * @returns {string[]} The project names, in the config's order.
 */
export function projectsOf({ themes, bundles }) {
  const projects = ['e2e-main'];

  if (themes) {
    projects.push('e2e-horizon', 'e2e-classic');
  }
  if (bundles) {
    projects.push('e2e-main-min');
  }
  if (themes && bundles) {
    projects.push('e2e-horizon-min', 'e2e-classic-min');
  }

  return projects;
}

/**
 * The 1-based line of an index in a text.
 *
 * @param {string} text The text.
 * @param {number} index The index.
 * @returns {number} The line.
 */
export function lineOf(text, index) {
  let line = 1;

  for (let at = text.indexOf('\n'); at !== -1 && at < index; at = text.indexOf('\n', at + 1)) {
    line += 1;
  }

  return line;
}

/**
 * Reads a TypeScript or JavaScript source once and returns it twice: `code` with every comment
 * blanked (strings, templates and regular expressions kept), for the marker patterns, and `masked`
 * with the contents of strings, template chunks and regular expressions blanked too (their delimiters
 * kept), for the structural reads. Both keep every line break and the source's length, so an index
 * in one is the same index in the other and in the source.
 *
 * One pass over all four token kinds, in order: a stripper that removes comments first breaks on a
 * glob like `'**' + '/fixture-image/*.svg'` written in one string (it opens a fake block comment and
 * eats the code below), and one that handles strings first breaks on an apostrophe in a comment. A
 * template literal's `${…}` is walked as code, so a string or a nested template inside it is read
 * right. A `/` starts a regular expression when the token before it cannot end an operand (an
 * operator, an opening bracket, a `}`, the start of the file, or a keyword such as `return`); after
 * an identifier, a number, a closing bracket or a literal it is a division. A candidate regular
 * expression that does not close on its line is read as a division after all.
 *
 * Throws on an unterminated string, template, template expression or block comment, naming the file:
 * a half-read file would let a top-level block or a marker hide in text the scan mistook for a
 * literal.
 *
 * @param {string} source The file's text.
 * @param {string} [where] The file, for the messages.
 * @returns {{
 *   code: string,
 *   masked: string,
 *   literals: Array<{start: number, end: number, value: string}>,
 * }} The two views and every plain string literal and template chunk (`start` is the index of the
 * first character of the value, `end` the index just past it).
 */
export function scanSource(source, where = 'source') {
  const code = source.split('');
  const masked = source.split('');
  const literals = [];
  const length = source.length;

  const blank = (array, from, to) => {
    for (let at = from; at < to; at += 1) {
      if (array[at] !== '\n') {
        array[at] = ' ';
      }
    }
  };
  const fail = (what, at) => {
    throw new Error(`${where}: ${what} opened at line ${lineOf(source, at)} and never closed, so the sweep cannot `
      + 'tell code from text.');
  };

  /**
   * The index just past a `'`/`"` string that opens at `start`.
   *
   * @param {number} start The opening quote.
   * @returns {number} The index just past the closing quote.
   */
  const scanString = (start) => {
    const quote = source[start];

    for (let at = start + 1; at < length; at += 1) {
      const char = source[at];

      if (char === '\\') {
        at += 1;
      } else if (char === quote) {
        literals.push({ start: start + 1, end: at, value: source.slice(start + 1, at) });
        blank(masked, start + 1, at);

        return at + 1;
      } else if (char === '\n') {
        break;
      }
    }

    return fail('a string literal', start);
  };

  /**
   * The index just past a regular expression that opens at `start`, or `-1` when the `/` does not
   * close a regular expression on its line (a division after all).
   *
   * @param {number} start The opening slash.
   * @returns {number} The index just past the flags, or `-1`.
   */
  const scanRegex = (start) => {
    let inClass = false;

    for (let at = start + 1; at < length; at += 1) {
      const char = source[at];

      if (char === '\n') {
        return -1;
      }
      if (char === '\\') {
        at += 1;
      } else if (inClass) {
        inClass = char !== ']';
      } else if (char === '[') {
        inClass = true;
      } else if (char === '/') {
        let end = at + 1;

        while (end < length && /[a-z]/i.test(source[end])) {
          end += 1;
        }
        blank(masked, start + 1, at);

        return end;
      }
    }

    return -1;
  };

  let scanTemplate;

  /**
   * Scans code from `start`. Inside a template expression it stops at the `}` that closes the
   * expression and returns its index; at the top level it runs to the end of the file.
   *
   * @param {number} start Where to start.
   * @param {boolean} inExpression Whether this is the body of a `${…}`.
   * @returns {number} The index of the closing `}`, or the length of the source.
   */
  const scanCode = (start, inExpression) => {
    let depth = 0;
    let previous = '';
    let word = '';
    let at = start;

    while (at < length) {
      const char = source[at];
      const next = source[at + 1];

      if (char === '/' && next === '/') {
        const newline = source.indexOf('\n', at);
        const end = newline === -1 ? length : newline;

        blank(code, at, end);
        blank(masked, at, end);
        at = end;
        continue;
      }
      if (char === '/' && next === '*') {
        const closing = source.indexOf('*/', at + 2);

        if (closing === -1) {
          fail('a block comment', at);
        }
        blank(code, at, closing + 2);
        blank(masked, at, closing + 2);
        at = closing + 2;
        continue;
      }
      if (char === '\'' || char === '"') {
        at = scanString(at);
        previous = 'literal';
        word = '';
        continue;
      }
      if (char === '`') {
        at = scanTemplate(at);
        previous = 'literal';
        word = '';
        continue;
      }
      if (char === '/') {
        const operand = previous === 'literal' || previous === ')' || previous === ']'
          || (/[\w$]/.test(previous) && !REGEX_AFTER_WORDS.has(word));
        const end = operand ? -1 : scanRegex(at);

        if (end !== -1) {
          at = end;
          previous = 'literal';
          word = '';
          continue;
        }
      }
      if (inExpression) {
        if (char === '{') {
          depth += 1;
        } else if (char === '}') {
          if (depth === 0) {
            return at;
          }
          depth -= 1;
        }
      }
      if (!/\s/.test(char)) {
        previous = char;
        word = /[\w$]/.test(char) ? word + char : '';
      }
      at += 1;
    }

    if (inExpression) {
      fail('a template expression', start);
    }

    return length;
  };

  /**
   * The index just past a template literal that opens at `start`. Its text chunks are blanked in the
   * masked view and recorded as literals; its `${…}` expressions are scanned as code.
   *
   * @param {number} start The opening backtick.
   * @returns {number} The index just past the closing backtick.
   */
  scanTemplate = (start) => {
    let chunkStart = start + 1;

    for (let at = start + 1; at < length; at += 1) {
      const char = source[at];

      if (char === '\\') {
        at += 1;
      } else if (char === '`') {
        literals.push({ start: chunkStart, end: at, value: source.slice(chunkStart, at) });
        blank(masked, chunkStart, at);

        return at + 1;
      } else if (char === '$' && source[at + 1] === '{') {
        literals.push({ start: chunkStart, end: at, value: source.slice(chunkStart, at) });
        blank(masked, chunkStart, at);
        at = scanCode(at + 2, true);
        chunkStart = at + 1;
      }
    }

    return fail('a template literal', start);
  };

  scanCode(0, false);

  return { code: code.join(''), masked: masked.join(''), literals };
}

/**
 * The index of the bracket that closes the one at `open`, in masked text.
 *
 * @param {string} masked The masked view of the source.
 * @param {number} open The index of the opening bracket.
 * @param {string} where The file, for the message.
 * @returns {number} The index of the matching closing bracket.
 */
export function matchingBracket(masked, open, where) {
  let depth = 0;

  for (let at = open; at < masked.length; at += 1) {
    const char = masked[at];

    if (char === '(' || char === '[' || char === '{') {
      depth += 1;
    } else if (char === ')' || char === ']' || char === '}') {
      depth -= 1;

      if (depth === 0) {
        return at;
      }
    }
  }

  throw new Error(`${where}: the bracket at line ${lineOf(masked, open)} is never closed.`);
}

/**
 * The spans of `masked.slice(from, to)` between the commas that sit outside every bracket, trimmed,
 * with the empty part of a trailing comma dropped.
 *
 * @param {string} masked The masked view of the source.
 * @param {number} from The first index.
 * @param {number} to The index just past the last.
 * @returns {Array<{start: number, end: number}>} The spans, as indexes into the source.
 */
export function splitTopLevel(masked, from, to) {
  const spans = [];
  let depth = 0;
  let start = from;

  const push = (end) => {
    let first = start;
    let last = end;

    while (first < last && /\s/.test(masked[first])) {
      first += 1;
    }
    while (last > first && /\s/.test(masked[last - 1])) {
      last -= 1;
    }
    if (last > first) {
      spans.push({ start: first, end: last });
    }
  };

  for (let at = from; at < to; at += 1) {
    const char = masked[at];

    if (char === '(' || char === '[' || char === '{') {
      depth += 1;
    } else if (char === ')' || char === ']' || char === '}') {
      depth -= 1;
    } else if (char === ',' && depth === 0) {
      push(at);
      start = at + 1;
    }
  }
  push(to);

  return spans;
}

/**
 * One item of a `tag:` value: a string literal, an identifier from `TAG_CONSTANTS`, or something the
 * sweep cannot read.
 *
 * @param {string} text The item's source text, trimmed.
 * @returns {{kind: 'literal'|'identifier'|'unknown-identifier'|'unreadable', tag: string|null, text: string}} The item.
 */
function readTagItem(text) {
  const literal = text.match(/^(['"`])([^'"`$\\]*)\1$/);

  if (literal) {
    return { kind: 'literal', tag: literal[2], text };
  }
  if (/^[A-Za-z_$][\w$]*$/.test(text)) {
    return Object.hasOwn(TAG_CONSTANTS, text)
      ? { kind: 'identifier', tag: TAG_CONSTANTS[text], text }
      : { kind: 'unknown-identifier', tag: null, text };
  }

  return { kind: 'unreadable', tag: null, text };
}

/**
 * The details argument of a `test()`/`test.describe()` call: `{ tag: … }` read for its tags,
 * `quarantined(…)` recognized, anything else unreadable.
 *
 * @param {object} views The scanned source.
 * @param {string} views.code The comment-stripped source.
 * @param {string} views.masked The masked source.
 * @param {{start: number, end: number}} span The argument's span.
 * @returns {{kind: 'object'|'quarantined'|'unreadable', items: object[], tags: string[], text: string}} The details.
 */
function readDetails({ code, masked }, span) {
  const text = code.slice(span.start, span.end);

  if (/^quarantined\s*\(/.test(text)) {
    return { kind: 'quarantined', items: [], tags: [], text };
  }
  if (!text.startsWith('{') || masked[span.end - 1] !== '}') {
    return { kind: 'unreadable', items: [], tags: [], text };
  }

  const items = [];

  for (const property of splitTopLevel(masked, span.start + 1, span.end - 1)) {
    const maskedProperty = masked.slice(property.start, property.end);
    const rawProperty = code.slice(property.start, property.end);
    const key = maskedProperty.match(/^([A-Za-z_$][\w$]*)\s*:/);

    // Playwright reads a shorthand `{ tag }` and a quoted `'tag':` key like any other; this reader does
    // not, and a block it reads as untagged while Playwright tags it would be checked against the wrong
    // declaration. Both are reported rather than skipped.
    if (/^tag\s*$/.test(maskedProperty) || /^(['"])tag\1\s*:/.test(rawProperty)) {
      items.push({ kind: 'unreadable', tag: null, text: rawProperty.trim() });
      continue;
    }
    if (!key || key[1] !== 'tag') {
      continue;
    }

    const valueStart = property.start + key[0].length;
    const valueSpans = masked[valueStart + (masked.slice(valueStart, property.end).match(/^\s*/)[0].length)] === '['
      ? splitTopLevel(masked, masked.indexOf('[', valueStart) + 1, property.end - 1)
      : [{ start: valueStart, end: property.end }];

    valueSpans.forEach((value) => {
      items.push(readTagItem(code.slice(value.start, value.end).trim()));
    });
  }

  return { kind: 'object', items, tags: items.map(item => item.tag).filter(tag => tag !== null), text };
}

/**
 * @typedef {object} Block
 * @property {'describe'|'test'} kind What the call declares.
 * @property {string} callee `test`, `test.describe`, `test.describe.serial` or `test.describe.parallel`.
 * @property {number} start The index of the call in the source.
 * @property {number} end The index just past the call's closing parenthesis.
 * @property {number} line The 1-based line of the call.
 * @property {number} depth How many `test`/`test.describe` callbacks enclose it; `0` is top level.
 * @property {string} title The title argument's source text.
 * @property {number} argumentCount How many arguments the call takes.
 * @property {Array<{start: number, end: number}>} argumentSpans Each argument's span in the source
 * (trimmed), for a tool that rewrites the call in place.
 * @property {{kind: string, items: object[], tags: string[], text: string}|null} details The details
 * argument, or `null` when the call has two arguments.
 * @property {string[]} tags The tags the details resolve to.
 */

/**
 * Every `test()` and `test.describe()` call in a source, with its nesting depth, title and tags.
 *
 * A top-level block is a call no other `test`/`test.describe` callback encloses, wherever it sits:
 * many sit inside `for` loops and `forEach` callbacks, so column 0 means nothing. `test.describe.configure()`,
 * `test.use()`, `test.beforeEach()`, `test.step()` and the rest are not blocks.
 *
 * @param {string} source The file's text.
 * @param {string} [where] The file, for the messages.
 * @returns {Block[]} The blocks, in source order.
 */
export function readBlocks(source, where = 'source') {
  const views = scanSource(source, where);
  const { code, masked } = views;
  const calls = [];

  for (const match of masked.matchAll(/(?<![.\w$])test(\.describe(?:\.(?:serial|parallel))?)?\(/g)) {
    const open = match.index + match[0].length - 1;
    const close = matchingBracket(masked, open, where);
    const spans = splitTopLevel(masked, open + 1, close);

    calls.push({
      kind: match[1] ? 'describe' : 'test',
      callee: `test${match[1] ?? ''}`,
      start: match.index,
      end: close + 1,
      line: lineOf(source, match.index),
      spans,
    });
  }

  return calls.map((call) => {
    const depth = calls.filter(other => other !== call && other.start < call.start && call.start < other.end).length;
    const details = call.spans.length === 3 ? readDetails(views, call.spans[1]) : null;

    return {
      kind: call.kind,
      callee: call.callee,
      start: call.start,
      end: call.end,
      line: call.line,
      depth,
      title: call.spans.length > 0 ? code.slice(call.spans[0].start, call.spans[0].end) : '',
      argumentCount: call.spans.length,
      argumentSpans: call.spans,
      details,
      tags: details ? details.tags : [],
    };
  });
}

/**
 * The ignore comments of a spec: `// leg-declarations: ignore <marker-id> -- <why>`.
 *
 * @param {string} source The spec's text.
 * @returns {Array<{marker: string, why: string, line: number}>} The comments, in source order.
 */
export function readIgnores(source) {
  return [...source.matchAll(IGNORE_PATTERN)].map(match => ({
    marker: match[1],
    why: (match[2] ?? '').trim(),
    line: lineOf(source, match.index),
  }));
}

/**
 * Every marker hit in one comment-stripped text.
 *
 * @param {string} code The text, comments blanked.
 * @param {'spec'|'module'|'fixture'} scope Which text this is.
 * @param {string} file The file, for the report.
 * @param {object} [context] What the `find` markers read besides the text.
 * @param {string} [context.masked] The masked view of the same source (`scanSource()`); computed when absent.
 * @param {object} [context.geometry] The geometry index of the page objects the spec reaches
 * (`geometryIndexOf()`); none when absent.
 * @returns {Array<{id: string, axis: string, scope: string, file: string, line: number, count: number, detail?: string}>}
 * The hits; `detail` says what the first one found, where a finder can say more than the line.
 */
export function findMarkerHits(code, scope, file, context = {}) {
  const hits = [];
  let { masked } = context;

  for (const marker of SURFACE_MARKERS) {
    if (!marker.scopes.includes(scope)) {
      continue;
    }

    let found;

    if (marker.find) {
      if (masked === undefined) {
        masked = scanSource(code, file).masked;
      }
      found = marker.find({ code, masked }, { scope, file, geometry: context.geometry ?? geometryIndexOf([]) })
        .sort((a, b) => a.index - b.index);
    } else {
      found = [...code.matchAll(new RegExp(marker.pattern.source, `${marker.pattern.flags.replace('g', '')}g`))];
    }
    if (found.length > 0) {
      hits.push({
        id: marker.id,
        axis: marker.axis,
        scope,
        file,
        line: lineOf(code, found[0].index),
        count: found.length,
        ...(found[0].detail ? { detail: found[0].detail } : {}),
      });
    }
  }

  return hits;
}

/**
 * The index just past an expression that starts at `from`: the first `,` or `;` outside every bracket, or
 * the bracket that closes the one the expression sits in.
 *
 * @param {string} masked The masked view of the source.
 * @param {number} from Where the expression starts.
 * @returns {number} The index just past its last character.
 */
function expressionEnd(masked, from) {
  let depth = 0;

  for (let at = from; at < masked.length; at += 1) {
    const char = masked[at];

    if (char === '(' || char === '[' || char === '{') {
      depth += 1;
    } else if (char === ')' || char === ']' || char === '}') {
      if (depth === 0) {
        return at;
      }
      depth -= 1;
    } else if ((char === ',' || char === ';') && depth === 0) {
      return at;
    }
  }

  return masked.length;
}

// The brace structure of each text the sweep has read, keyed by the masked text: the innermost open
// brace at every index and where each brace closes. A spec reaches the same page objects as many others,
// and a scan that walked back from every declaration was quadratic in the page object's length.
const BRACE_STRUCTURES = new Map();

/**
 * The brace structure of a masked text, computed once per text.
 *
 * @param {string} masked The masked view of the source.
 * @returns {{innermost: Int32Array, close: Map<number, number>}} The innermost open brace before each
 * index (`-1` at the top), and the closing brace of each opening one.
 */
function braceStructure(masked) {
  let structure = BRACE_STRUCTURES.get(masked);

  if (!structure) {
    const innermost = new Int32Array(masked.length + 1);
    const close = new Map();
    const open = [];

    for (let at = 0; at <= masked.length; at += 1) {
      innermost[at] = open.length > 0 ? open[open.length - 1] : -1;

      if (masked[at] === '{') {
        open.push(at);
      } else if (masked[at] === '}' && open.length > 0) {
        close.set(open.pop(), at);
      }
    }
    structure = { innermost, close };
    BRACE_STRUCTURES.set(masked, structure);
  }

  return structure;
}

/**
 * The block a declaration at `index` belongs to: the innermost brace pair around it, or the whole text.
 *
 * @param {string} masked The masked view of the source.
 * @param {number} index The declaration.
 * @returns {{start: number, end: number}} The block.
 */
function enclosingBlock(masked, index) {
  const { innermost, close } = braceStructure(masked);
  const start = innermost[index];

  return start === -1 ? { start: -1, end: masked.length } : { start, end: close.get(start) ?? masked.length };
}

/**
 * The names a declaration binds: one identifier, or the names a destructuring pattern binds (the value
 * side of `key: name`, without defaults).
 *
 * @param {string} pattern The binding's text.
 * @returns {string[]} The names.
 */
function boundNames(pattern) {
  if (!/^[{[]/.test(pattern)) {
    return [pattern];
  }

  return pattern.slice(1, -1).split(',')
    .map(part => part.replace(/=.*$/s, '').split(':').pop().replace(/^\s*\.\.\./, '').trim())
    .filter(name => /^[A-Za-z_$][\w$]*$/.test(name));
}

/**
 * The `const`/`let`/`var` declarations of a text that assign a value, in source order: the names each
 * binds, the block it is visible in, and the span of its initializer.
 *
 * @param {{code: string, masked: string}} views The scanned text.
 * @param {string} where The file, for the messages.
 * @returns {Array<{start: number, names: string[], block: {start: number, end: number}, init: {start: number, end: number}}>}
 * The declarations.
 */
function readDeclarations({ code, masked }, where) {
  const declarations = [];

  for (const match of masked.matchAll(DECLARATION)) {
    const patternStart = match.index + match[0].length;
    const pattern = /^[{[]/.test(masked[patternStart])
      ? code.slice(patternStart, matchingBracket(masked, patternStart, where) + 1)
      : code.slice(patternStart).match(/^[A-Za-z_$][\w$]*/)?.[0] ?? '';
    const assign = masked.indexOf('=', patternStart + pattern.length);

    if (pattern === '' || assign === -1 || masked[assign + 1] === '='
      || /[;(){}]/.test(masked.slice(patternStart + pattern.length, assign))) {
      continue;
    }
    declarations.push({
      start: match.index,
      names: boundNames(pattern),
      block: enclosingBlock(masked, match.index),
      init: { start: assign + 1, end: expressionEnd(masked, assign + 1) },
    });
  }

  return declarations;
}

/**
 * The value a text reaches through a variable: of the declarations visible at `at` (the latest one per
 * name), the first whose name the text uses and whose `key` is set.
 *
 * @param {object[]} declarations The text's declarations (`readDeclarations()`), in source order.
 * @param {string} text The expression, masked.
 * @param {number} at Where the expression sits.
 * @param {string} key The property of a declaration that holds the value.
 * @returns {{name: string, value: string}|null} The variable and its value, or `null`.
 */
function valueThroughVariable(declarations, text, at, key) {
  const visible = declaration => declaration.start < at && declaration.block.start < at && at < declaration.block.end;

  for (const declaration of declarations) {
    if (!declaration[key] || !visible(declaration)) {
      continue;
    }
    for (const name of declaration.names) {
      const shadowed = declarations.some(other => other.start > declaration.start && visible(other)
        && other.names.includes(name));

      if (!shadowed && new RegExp(`(?<![\\w$.])${escapeRegExp(name)}(?![\\w$])`).test(text)) {
        return { name, value: declaration[key] };
      }
    }
  }

  return null;
}

/**
 * An expression as a variable's value flows through it: the masked text with the arguments of every call
 * blanked, except `Math.*()`, `Number()`, `parseFloat()` and `parseInt()`. A grouping parenthesis stays.
 *
 * @param {string} masked The masked view of the source.
 * @param {number} start The expression's first index.
 * @param {number} end The index just past it.
 * @returns {string} The text to look for variables in.
 */
function valueText(masked, start, end) {
  let out = '';

  for (let at = start; at < end; at += 1) {
    const before = masked.slice(Math.max(start, at - 40), at);
    const word = before.match(/([\w$]+)\s*$/)?.[1];
    const isCall = masked[at] === '(' && /[\w$\])]\s*$/.test(before) && !REGEX_AFTER_WORDS.has(word)
      && !VALUE_PRESERVING_CALL.test(before);

    if (isCall) {
      const close = Math.min(matchingBracket(masked, at, 'call'), end - 1);

      out += `(${' '.repeat(Math.max(close - at - 1, 0))})`;
      at = close;
    } else {
      out += masked[at];
    }
  }

  return out;
}

/**
 * An expression's own level: the masked text with the contents of every bracket group blanked.
 *
 * @param {string} masked The masked view of the source.
 * @param {number} start The expression's first index.
 * @param {number} end The index just past it.
 * @returns {string} The text.
 */
function topLevelText(masked, start, end) {
  let out = '';

  for (let at = start; at < end; at += 1) {
    if ('([{'.includes(masked[at])) {
      const close = matchingBracket(masked, at, 'expression');

      out += `${masked[at]}${' '.repeat(close - at - 1)}${masked[close]}`;
      at = close;
    } else {
      out += masked[at];
    }
  }

  return out;
}

/**
 * Whether an expression adds or subtracts a whole number of pixels to a box term of the same
 * expression. It is read level by level: a group in parentheses (a call or a grouping) carries a box
 * term up to the level around it, and an index in brackets carries nothing, so `(box?.x ?? 0) + 5` and
 * `Math.round(box.x) + 2` are offsets and `cells[i + 1].x` is not.
 *
 * @param {string} masked The masked view of the source.
 * @param {number} start The expression's first index.
 * @param {number} end The index just past it.
 * @returns {boolean} `true` for a pixel offset.
 */
function offsetBesideBox(masked, start, end) {
  const level = (from, to) => {
    let flat = '';
    let carries = false;
    let hit = false;

    for (let at = from; at < to; at += 1) {
      const char = masked[at];

      if (char === '(' || char === '[' || char === '{') {
        const close = matchingBracket(masked, at, 'coordinate');
        const inner = level(at + 1, close);

        hit = hit || inner.hit;
        carries = carries || (char !== '[' && inner.carries);
        flat += `${char}${' '.repeat(close - at - 1)}${masked[close]}`;
        at = close;
      } else {
        flat += char;
      }
    }
    carries = carries || BOX_TERM.test(flat);

    return { carries, hit: hit || (carries && PIXEL_OFFSET.test(flat)) };
  };

  return level(start, end).hit;
}

/**
 * The `pointer-offset` finder: every coordinate a pointer is aimed at that adds or subtracts a fixed
 * number of pixels to a box edge or size, written in place or kept in a variable first
 * (`const x = box.x + box.width - 4`). The coordinates are the arguments of `mouse.click()`,
 * `mouse.dblclick()`, `mouse.move()` and `touchscreen.tap()`, and the `x`/`y` values of an object literal
 * (a CDP event, the point a drag helper takes). A locator action's `position`, `sourcePosition` or
 * `targetPosition` is measured from the element's corner already, so a non-zero number or an added
 * constant in it is an offset by itself (`click({ position: { x: 5, y: 5 } })`).
 *
 * @param {{code: string, masked: string}} views The scanned text.
 * @param {{file: string}} context The file, for the messages.
 * @returns {Array<{index: number, detail: string}>} One entry per coordinate, at its start.
 */
function findPointerOffsets({ code, masked }, { file }) {
  const spans = [];
  const declarations = readDeclarations({ code, masked }, file);
  const shown = (start, end) => code.slice(start, end).trim().replace(/\s+/g, ' ');

  // A variable aims when its value is an offset, or is built from a variable that aims.
  declarations.forEach((declaration) => {
    const { start, end } = declaration.init;

    declaration.aim = offsetBesideBox(masked, start, end)
      ? shown(start, end)
      : valueThroughVariable(declarations, valueText(masked, start, end), declaration.start, 'aim')?.value;
  });

  for (const match of masked.matchAll(POINTER_CALL)) {
    const open = match.index + match[0].length - 1;

    spans.push(...splitTopLevel(masked, open + 1, matchingBracket(masked, open, 'pointer call')));
  }
  for (const match of masked.matchAll(POINT_KEY)) {
    const start = match.index + match[0].length;

    spans.push({ start, end: expressionEnd(masked, start) });
  }
  for (const match of masked.matchAll(POSITION_OPTION)) {
    const open = match.index + match[0].length - 1;
    const close = matchingBracket(masked, open, 'position');
    const offset = splitTopLevel(masked, open + 1, close).some((property) => {
      const key = masked.slice(property.start, property.end).match(/^([xy])\s*:\s*/);
      const valueStart = property.start + (key?.[0].length ?? 0);
      const value = code.slice(valueStart, property.end).trim();

      return key !== null && ((PIXEL_COUNT.test(value) && Number(value.replace(/\s+/g, '')) !== 0)
        || PIXEL_OFFSET.test(topLevelText(masked, valueStart, property.end)));
    });

    if (offset) {
      spans.push({ start: open, end: close + 1, position: true });
    }
  }

  const found = [];

  spans.sort((a, b) => a.start - b.start).forEach((span) => {
    // A point passed straight to a pointer call is one coordinate pair, not two.
    if (found.some(hit => hit.index <= span.start && span.end <= hit.end)) {
      return;
    }
    if (span.position || offsetBesideBox(masked, span.start, span.end)) {
      found.push({
        index: span.start,
        end: span.end,
        detail: `aimed at \`${shown(span.start, span.end)}\`${span.position ? ' from the element\'s corner' : ''}`,
      });

      return;
    }

    const variable = valueThroughVariable(declarations, valueText(masked, span.start, span.end), span.start, 'aim');

    if (variable) {
      found.push({ index: span.start, end: span.end, detail: `aimed at \`${variable.name}\` = \`${variable.value}\`` });
    }
  });

  return found.map(({ index, detail }) => ({ index, detail }));
}

/**
 * The index of the type that ends a function's signature, skipped: the body's opening brace, or `-1` when
 * the text after the `:` is not a return type followed by a body (an object literal's property, a ternary).
 * A brace right after `:`, `|`, `&`, `,`, `(` or `<` opens an object type; any other brace opens the body.
 *
 * @param {string} masked The masked view of the source.
 * @param {number} at The index just past the `:`.
 * @returns {number} The index of the body's `{`, or `-1`.
 */
function bodyAfterReturnType(masked, at) {
  let depth = 0;
  let previous = ':';

  for (let index = at; index < masked.length; index += 1) {
    const char = masked[index];

    if (/\s/.test(char)) {
      continue;
    }
    if (char === '=' && masked[index + 1] === '>') {
      previous = '>';
      index += 1;
      continue;
    }
    if (char === '{') {
      if (depth === 0 && !/[:|&,(<]/.test(previous)) {
        return index;
      }
      index = matchingBracket(masked, index, 'return type');
      previous = '}';
      continue;
    }
    if (char === '(' || char === '[' || char === '<') {
      depth += 1;
    } else if (char === ')' || char === ']' || char === '>') {
      depth -= 1;
    } else if (depth === 0 && (char === ';' || char === '=' || char === ',' || char === '}')) {
      return -1;
    }
    previous = char;
  }

  return -1;
}

/**
 * The index just past the `=>` that ends an arrow function's return type, or `-1` when there is none
 * outside the type's own brackets.
 *
 * @param {string} masked The masked view of the source.
 * @param {number} at The index just past the `:`.
 * @returns {number} The index just past the `=>`, or `-1`.
 */
function arrowAfterReturnType(masked, at) {
  let depth = 0;

  for (let index = at; index < masked.length; index += 1) {
    const char = masked[index];

    if (char === '=' && masked[index + 1] === '>') {
      if (depth === 0) {
        return index + 2;
      }
      index += 1;
    } else if ('([{<'.includes(char)) {
      depth += 1;
    } else if (')]}>'.includes(char)) {
      depth -= 1;
    } else if (depth === 0 && char === ';') {
      return -1;
    }
  }

  return -1;
}

/**
 * The classes a source declares: each name, the class it extends, and the span of its body.
 *
 * @param {string} masked The masked view of the source.
 * @returns {Array<{name: string, parent: string|null, start: number, end: number}>} The classes; `start` is
 * the body's `{`.
 */
function readClasses(masked) {
  return [...masked.matchAll(CLASS_HEADER)].map((match) => {
    let header = match[2];

    // Type parameters can carry their own `extends`: drop them before reading the class's.
    while (/<[^<>]*>/.test(header)) {
      header = header.replace(/<[^<>]*>/g, '');
    }

    const start = match.index + match[0].length - 1;

    return {
      name: match[1],
      parent: header.match(/\bextends\s+([A-Za-z_$][\w$]*)/)?.[1] ?? null,
      start,
      end: matchingBracket(masked, start, 'class body'),
    };
  });
}

/**
 * The named functions a source defines at the top: the methods of its classes (getters and arrow
 * functions kept in a field included), and the functions it declares or binds to a `const`/`let`
 * outside any block. A function defined inside another (a helper inside an `evaluate()` callback) is part
 * of that function's body, never one of its own, so a generic name such as `width()` there names nothing
 * a spec could call.
 *
 * @param {{code: string, masked: string}} views The scanned source.
 * @param {string} where The file, for the messages.
 * @param {Array<{name: string, start: number}>} classes The source's classes (`readClasses()`).
 * @returns {Array<{name: string, owner: string|null, getter: boolean, line: number, returns: string, start: number, end: number}>}
 * The functions; `owner` is the class of a method, `getter` marks one read without a call, `returns` is
 * `''` when no type is declared, and `start`/`end` bound the body.
 */
function readFunctions({ code, masked }, where, classes) {
  const functions = [];
  const classAt = new Map(classes.map(cls => [cls.start, cls.name]));

  for (const definition of [METHOD_DEFINITION, BOUND_FUNCTION, CLASS_FIELD_FUNCTION]) {
    const arrow = definition !== METHOD_DEFINITION;

    for (const match of masked.matchAll(definition)) {
      const name = arrow ? match[1] : match[2];
      const getter = !arrow && /\bget\s+$/.test(match[1]);
      const block = enclosingBlock(masked, match.index);
      const owner = classAt.get(block.start) ?? null;

      if (NOT_A_FUNCTION_NAME.has(name) || (block.start !== -1 && owner === null)
        || (definition === CLASS_FIELD_FUNCTION && owner === null)) {
        continue;
      }

      const open = match.index + match[0].length - 1;
      let at = matchingBracket(masked, open, where) + 1;
      let returns = '';
      const skipSpace = () => {
        while (at < masked.length && /\s/.test(masked[at])) {
          at += 1;
        }
      };

      skipSpace();
      if (masked[at] === ':' && arrow) {
        const after = arrowAfterReturnType(masked, at + 1);

        if (after === -1) {
          continue;
        }
        returns = code.slice(at + 1, after - 2).trim();
        at = after;
        skipSpace();
      } else if (masked[at] === ':') {
        const body = bodyAfterReturnType(masked, at + 1);

        if (body === -1) {
          continue;
        }
        returns = code.slice(at + 1, body).trim();
        at = body;
      } else if (arrow && masked.startsWith('=>', at)) {
        at += 2;
        skipSpace();
      }

      const line = lineOf(code, match.index);

      if (masked[at] === '{') {
        functions.push({ name, owner, getter, line, returns, start: at, end: matchingBracket(masked, at, where) + 1 });
      } else if (arrow && masked.slice(match.index, at).includes('=>')) {
        functions.push({ name, owner, getter, line, returns, start: at, end: expressionEnd(masked, at) });
      }
    }
  }

  return functions;
}

/**
 * Whether a declared return type can hold a size, a position or a verdict on one: anything but a type
 * made only of strings, locators, handles and nothing (`Promise<string[]>`, `Promise<void>`).
 *
 * @param {string} returns The declared type, or `''`.
 * @returns {boolean} `true` when the function's result may be geometry.
 */
function mayReturnGeometry(returns) {
  const words = returns.match(/[A-Za-z_$][\w$]*/g) ?? [];

  return words.length === 0 || !words.every(word => NON_GEOMETRY_TYPES.has(word));
}

/**
 * The function a call resolves to: `this.name()` to the method of the calling class or the nearest class
 * it extends, `receiver.name()` to the method of the receiver's class where the spec says it
 * (`new GridPage(…)`, `grid: GridPage`), a bare `name()` or a member of a namespace import
 * (`geometry.rowHeights()`) to a function of the calling file, else one the page objects declare
 * outside a class, and any other receiver to every function of that name but the calling one.
 *
 * @param {object} index The geometry index (`geometryIndexOf()`).
 * @param {object} call The call.
 * @param {string} call.name The called name, with the `#` of a private method.
 * @param {'this'|'bare'|'member'} call.kind How it is called.
 * @param {string|null} call.receiver The receiver's identifier, for a member call.
 * @param {object} from Where the call sits.
 * @param {string|null} from.owner The class of the calling method.
 * @param {string} from.file The calling file.
 * @param {Set<string>} [from.namespaces] The namespace imports of the calling file.
 * @param {object} [from.self] The calling function, never its own candidate.
 * @param {Map<string, Set<string>>} [from.receivers] The classes the spec's variables hold.
 * @returns {object[]} The candidate functions; empty when the call names no page-object function.
 */
function candidatesOf(index, { name, kind, receiver }, { owner, file, namespaces, self, receivers }) {
  const memberOf = (cls) => {
    for (let current = cls, steps = 0; current && steps < 20; current = index.classes.get(current)?.parent, steps += 1) {
      const method = index.members.get(`${current} ${name}`);

      if (method) {
        return method;
      }
    }

    return null;
  };
  const named = index.byName.get(name) ?? [];

  if (kind === 'this') {
    const method = owner && memberOf(owner);

    return method ? [method] : [];
  }
  if (kind === 'bare' || namespaces?.has(receiver)) {
    const declared = named.filter(fn => fn.owner === null);
    const local = declared.filter(fn => fn.file === file);

    return local.length > 0 ? local : declared;
  }

  const typed = receiver ? [...(receivers?.get(receiver) ?? [])].map(memberOf).filter(Boolean) : [];

  return typed.length > 0 ? typed : named.filter(fn => fn !== self);
}

/**
 * The first call in an expression that resolves to geometry: a call, or the read of a getter, whose
 * candidates (`candidatesOf()`) are all geometry helpers. Requiring all of them keeps a generic name that
 * one page object measures with and another does not (`cell()`, `box()`) from counting on a guess.
 *
 * @param {object} index The geometry index (`geometryIndexOf()`).
 * @param {string} text The expression, masked.
 * @param {object} from Where it sits (`candidatesOf()`).
 * @returns {object|null} The helper, or `null`.
 */
function geometryCallIn(index, text, from) {
  const access = (name, before) => {
    const member = before.match(/(?:\b(this)|([A-Za-z_$][\w$]*)|[\])]|)\s*\??\.\s*$/);

    return member
      ? { name, kind: member[1] ? 'this' : 'member', receiver: member[2] ?? null }
      : { name, kind: 'bare', receiver: null };
  };
  const resolves = candidates => candidates.length > 0 && candidates.every(fn => fn.geometry);

  for (const match of text.matchAll(CALL)) {
    const candidates = candidatesOf(index, access(match[1], text.slice(0, match.index)), from)
      .filter(fn => !fn.getter);

    if (resolves(candidates)) {
      return candidates[0];
    }
  }
  if (index.hasGetters) {
    for (const match of text.matchAll(PROPERTY_READ)) {
      const dot = match.index + match[0].indexOf('.') + 1;
      const candidates = candidatesOf(index, access(match[1], text.slice(0, dot)), from).filter(fn => fn.getter);

      if (resolves(candidates)) {
        return candidates[0];
      }
    }
  }

  return null;
}

// The classes and functions of each page object, keyed by its masked text: every spec that reaches a
// page object reads the same facts, and only which of them are geometry helpers depends on the spec.
const MODULE_FACTS = new Map();

/**
 * The functions of a set of scanned page objects, with which of them are geometry helpers: a function
 * whose body reads a layout box or a size (`getBoundingClientRect()`, `boundingBox()`, `offsetWidth`
 * and the like) or calls a geometry helper, unless its declared return type cannot carry the result
 * (`Promise<string[]>`, `Promise<void>`, a `Locator`).
 *
 * @param {Array<{file: string, views: {code: string, masked: string}}>} scanned The page objects.
 * @returns {object} The index: every function, by name and by class, and the classes.
 */
function geometryIndexOf(scanned) {
  const functions = [];
  const classes = new Map();

  scanned.forEach(({ file, views }) => {
    let facts = MODULE_FACTS.get(views.masked);

    if (!facts) {
      const declared = readClasses(views.masked);

      facts = {
        classes: declared,
        functions: readFunctions(views, file, declared),
        namespaces: new Set([...views.masked.matchAll(NAMESPACE_IMPORT)].map(match => match[1])),
      };
      MODULE_FACTS.set(views.masked, facts);
    }
    facts.classes.forEach(cls => classes.set(cls.name, { file, parent: cls.parent }));
    facts.functions.forEach((fn) => {
      functions.push({
        ...fn, file, namespaces: facts.namespaces, body: views.masked.slice(fn.start, fn.end), geometry: false,
      });
    });
  });

  const index = {
    functions, classes, byName: new Map(), members: new Map(), hasGetters: functions.some(fn => fn.getter),
  };

  functions.forEach((fn) => {
    index.byName.set(fn.name, [...(index.byName.get(fn.name) ?? []), fn]);
    if (fn.owner !== null) {
      index.members.set(`${fn.owner} ${fn.name}`, fn);
    }
  });

  let grew = true;

  while (grew) {
    grew = false;
    functions.forEach((fn) => {
      if (!fn.geometry && mayReturnGeometry(fn.returns)
        && (GEOMETRY_READ.test(fn.body)
          || geometryCallIn(index, fn.body, { owner: fn.owner, file: fn.file, namespaces: fn.namespaces, self: fn }))) {
        fn.geometry = true;
        grew = true;
      }
    });
  }

  return index;
}

/**
 * The geometry helpers of the page objects a spec reaches (`geometryIndexOf()`). A module of types only
 * declares none.
 *
 * @param {Array<{file: string, source: string}>} modules The page objects and helpers.
 * @returns {Array<{name: string, owner: string|null, file: string, line: number}>} The helpers, in the
 * order the modules define them.
 */
export function readGeometryHelpers(modules) {
  return geometryIndexOf(modules
    .map(module => ({ file: module.file, views: scanSource(module.source, module.file) }))
    .filter(({ views }) => !isTypeOnlyModule(views.code)))
    .functions.filter(fn => fn.geometry)
    .map(({ name, owner, file, line }) => ({ name, owner, file, line }));
}

/**
 * The classes a spec's variables hold, where the spec says so: `x = new GridPage(…)` and `x: GridPage`.
 *
 * @param {string} masked The masked view of the spec.
 * @returns {Map<string, Set<string>>} The classes per variable name.
 */
function readReceivers(masked) {
  const receivers = new Map();

  for (const match of masked.matchAll(TYPED_VARIABLE)) {
    const cls = match[2] ?? match[3];

    receivers.set(match[1], new Set([...(receivers.get(match[1]) ?? []), cls]));
  }

  return receivers;
}

/**
 * The `geometry-helper` finder: every `expect()` whose subject is a geometry helper's result, directly or
 * through a variable declared from one in scope, compared to a literal (a number, a numeric constant, a
 * boolean, or an object or array literal holding a number, `toMatchObject()` included), and a helper
 * declared to return a boolean checked with `toBeTruthy()` or `toBeFalsy()`. In a page object a subject that reads
 * geometry itself counts too; in the spec that read is the `geometry` marker's. Three comparisons say
 * nothing about the theme and are skipped: `toBeGreaterThan(0)` (the box is laid out at all), a subject
 * that ends in `.length` (a count of what a geometry filter picked), and a comparison with another read.
 *
 * @param {{code: string, masked: string}} views The scanned text.
 * @param {{scope: string, file: string, geometry: object}} context Which text this is, and the geometry
 * index of the page objects the spec reaches (`geometryIndexOf()`).
 * @returns {Array<{index: number, detail: string}>} One entry per comparison, at its `expect`.
 */
function findGeometryComparisons({ code, masked }, { scope, file, geometry }) {
  const inline = scope === 'spec' ? null : GEOMETRY_READ;
  const classes = scope === 'spec' ? [] : readClasses(masked);
  const receivers = scope === 'spec' ? readReceivers(masked) : new Map();
  const namespaces = new Set([...masked.matchAll(NAMESPACE_IMPORT)].map(match => match[1]));
  const declarations = readDeclarations({ code, masked }, file);
  const ownerAt = at => classes.filter(cls => cls.start < at && at < cls.end).pop()?.name ?? null;
  // What an expression reads geometry through, or `null`: a helper, a read, or a variable in scope, and
  // whether that is a helper declared to return a boolean.
  const sourceOf = (start, end, at) => {
    const text = masked.slice(start, end);
    const helper = geometryCallIn(geometry, text, { owner: ownerAt(at), file, namespaces, receivers });

    if (helper) {
      return { detail: `through ${helper.name}() at ${helper.file}:${helper.line}`, boolean: /\bboolean\b/.test(helper.returns) };
    }

    const read = inline && text.match(inline);

    if (read) {
      return { detail: `through \`${read[0].replace(/\($/, '()')}\``, boolean: false };
    }

    return valueThroughVariable(declarations, valueText(masked, start, end), at, 'source')?.value ?? null;
  };

  declarations.forEach((declaration) => {
    declaration.source = sourceOf(declaration.init.start, declaration.init.end, declaration.start);
  });

  const found = [];

  for (const match of masked.matchAll(EXPECT_CALL)) {
    const open = match.index + match[0].length - 1;
    const close = matchingBracket(masked, open, file);
    const subjectSpan = splitTopLevel(masked, open + 1, close)[0];
    const truthy = TRUTHY_MATCHER.test(masked.slice(close + 1));
    const matcher = masked.slice(close + 1).match(LITERAL_MATCHER);

    if (!subjectSpan || (!matcher && !truthy) || /\.length\s*$/.test(code.slice(subjectSpan.start, subjectSpan.end))) {
      continue;
    }
    if (matcher) {
      const matcherOpen = close + matcher[0].length;
      const valueSpan = splitTopLevel(masked, matcherOpen + 1, matchingBracket(masked, matcherOpen, file))[0];
      const value = valueSpan ? code.slice(valueSpan.start, valueSpan.end).trim() : '';
      const literal = LITERAL_VALUE.test(value) || (/^[{[]/.test(value) && NUMBER_TOKEN.test(value));

      if (!literal || (matcher[1] === 'toBeGreaterThan' && value === '0')) {
        continue;
      }
    }

    const source = sourceOf(subjectSpan.start, subjectSpan.end, match.index);

    if (source && (!truthy || source.boolean)) {
      found.push({ index: match.index, detail: source.detail });
    }
  }

  return found;
}

/**
 * A fixture HTML file as the marker patterns read it: HTML comments blanked, and every `<script>`
 * body read through `scanSource()` so its JavaScript comments are blanked too. Markup and `<style>`
 * blocks stay as they are.
 *
 * Walked in one pass, so the two kinds of comment cannot eat each other: at each step the nearer of
 * the next `<!--` and the next `<script` decides. Inside a script body an HTML comment sequence is
 * script text (a string holding `"<!--"` and `"-->"` would otherwise blank the code between them, and
 * the marker in that code with it); inside an HTML comment a `<script>` is commentary, never run, and
 * stays blanked.
 *
 * @param {string} source The fixture's text.
 * @param {string} [where] The file, for the messages.
 * @returns {string} The text to run the marker patterns over.
 */
export function scanFixtureHtml(source, where = 'fixture') {
  const SCRIPT_OPEN = /<script\b[^>]*>/gi;
  const SCRIPT_CLOSE = /<\/script\b[^>]*>/gi;
  const blankComment = comment => comment.replace(/[^\n]/g, ' ');
  let out = '';
  let at = 0;

  while (at < source.length) {
    const comment = source.indexOf('<!--', at);

    SCRIPT_OPEN.lastIndex = at;
    const open = SCRIPT_OPEN.exec(source);

    if (comment === -1 && !open) {
      out += source.slice(at);
      break;
    }
    if (comment !== -1 && (!open || comment < open.index)) {
      const closing = source.indexOf('-->', comment + 4);
      const end = closing === -1 ? source.length : closing + 3;

      out += source.slice(at, comment) + blankComment(source.slice(comment, end));
      at = end;
      continue;
    }

    SCRIPT_CLOSE.lastIndex = open.index + open[0].length;
    const close = SCRIPT_CLOSE.exec(source);
    const bodyStart = open.index + open[0].length;
    const bodyEnd = close ? close.index : source.length;

    out += source.slice(at, bodyStart) + scanSource(source.slice(bodyStart, bodyEnd), where).code
      + (close ? close[0] : '');
    at = close ? close.index + close[0].length : source.length;
  }

  return out;
}

/**
 * Whether a module declares types only: no runtime export, so nothing in it can make a spec
 * sensitive to an axis, and the word `formulas` in a `getPlugin(name: 'formulas')` overload is not a
 * use of the plugin. Read over comment-stripped code.
 *
 * @param {string} code The module's comment-stripped text.
 * @returns {boolean} `true` for a module of types and declarations only.
 */
export function isTypeOnlyModule(code) {
  return !RUNTIME_EXPORT.test(code);
}

/**
 * The relative module specifiers a source imports at runtime: `import … from './x'`, `import './x'`
 * and `import('./x')`, skipping `import type`.
 *
 * @param {string} code The comment-stripped source.
 * @returns {string[]} The specifiers, in order, deduplicated.
 */
export function relativeImports(code) {
  const specifiers = [];

  for (const match of code.matchAll(SPEC_IMPORT)) {
    const specifier = match[2] ?? match[3];

    if (!match[1] && specifier && !specifiers.includes(specifier)) {
      specifiers.push(specifier);
    }
  }

  return specifiers;
}

/**
 * The fixture files a set of texts name, resolved against an index of the demo directory.
 *
 * A name is any `<dir/>name.html` token in the comment-stripped text, with a `tests/fixtures/demo/`
 * or `fixtures/demo/` prefix dropped first, resolved by its relative path under `fixtures/demo/`, else
 * by its basename when that is unique. When a text builds a name dynamically (`${this.fixture}.html`),
 * bare string literals count too, where the name can come from: in the text that builds the name, the
 * literals on a line that names the interpolated property (a constructor's `fixture = 'numeric'`
 * default, a `fixture: 'numeric' | 'numeric-formulas'` union), and in the other texts the literals
 * passed to a constructor (`new NumericGridPage(page, theme, bundle, 'numeric-formulas')`). Any other
 * literal (a test id, a shortcut context such as `'grid'`, in the spec or in the page object) names no
 * fixture, or `fixtures/demo/grid.html` would be scanned for every spec that mentions the word.
 *
 * @param {Array<{code: string, masked: string, literals: Array<{start: number, value: string}>}>} texts
 * The scanned spec and modules.
 * @param {Map<string, string>} index Fixture names, both as relative paths under `fixtures/demo/` and as
 * unique basenames, to their relative paths.
 * @returns {string[]} The relative paths of the fixtures named, sorted.
 */
export function fixturesNamed(texts, index) {
  const found = new Set();
  const names = new Set(texts.flatMap(text => [...text.code.matchAll(DYNAMIC_HTML_NAME)].map(match => match[1])));
  const dynamic = names.size > 0;
  const namesLine = (text, at) => {
    const line = text.code.slice(text.code.lastIndexOf('\n', at) + 1, text.code.indexOf('\n', at) === -1 ? undefined : text.code.indexOf('\n', at));

    return [...names].some(name => new RegExp(`\\b${name}\\b`).test(line));
  };

  for (const text of texts) {
    for (const match of text.code.matchAll(HTML_NAME)) {
      const name = match[1].replace(FIXTURE_DIR_PREFIX, '');
      const resolved = index.get(name) ?? index.get(name.slice(name.lastIndexOf('/') + 1));

      if (resolved) {
        found.add(resolved);
      }
    }
    if (!dynamic) {
      continue;
    }

    const buildsTheName = [...text.code.matchAll(DYNAMIC_HTML_NAME)].length > 0;
    const spans = buildsTheName
      ? []
      : [...(text.masked ?? '').matchAll(CONSTRUCTOR_CALL)].map((call) => {
        const open = call.index + call[0].length - 1;

        return { start: open, end: matchingBracket(text.masked, open, 'fixture resolution') };
      });

    for (const literal of text.literals) {
      const counts = buildsTheName
        ? namesLine(text, literal.start)
        : spans.some(span => literal.start > span.start && literal.start < span.end);

      if (!counts) {
        continue;
      }
      if (BARE_FIXTURE_NAME.test(literal.value) && index.has(`${literal.value}.html`)) {
        found.add(index.get(`${literal.value}.html`));
      }
    }
  }

  return [...found].sort();
}

/**
 * @typedef {object} SpecInput
 * @property {string} file The spec, relative to the tests package.
 * @property {string} source The spec's text.
 * @property {Array<{file: string, source: string}>} modules The page objects and helpers it reaches.
 * @property {Array<{file: string, source: string}>} fixtures The fixture HTML files those name.
 */

/**
 * @typedef {object} SpecReport
 * @property {string} file The spec.
 * @property {Block[]} blocks Every block.
 * @property {Block[]} topLevel The top-level blocks.
 * @property {{themes: boolean, bundles: boolean}|null} declared What the spec declares, or `null` when
 * its top-level blocks disagree or it has none.
 * @property {string[]} tags Every tag the top-level blocks carry.
 * @property {Array<{rule: string, message: string}>} violations What fails the sweep.
 * @property {Array<{id: string, axis: string, scope: string, file: string, line: number, count: number}>} hits
 * Every marker hit in scope, covered or not.
 * @property {Array<{marker: string, why: string, line: number}>} ignores The spec's ignore comments.
 */

/**
 * Checks one spec against the declaration rules, over its own text, the modules it reaches and the
 * fixtures those name. Pure: the caller reads the files (`readSpecInputs()`).
 *
 * @param {SpecInput} input The spec and what it reaches.
 * @returns {SpecReport} The report.
 */
export function checkSpec({ file, source, modules = [], fixtures = [] }) {
  const violations = [];
  const violate = (rule, message) => violations.push({ rule, message: `${file}: ${message}` });
  const blocks = readBlocks(source, file);
  const topLevel = blocks.filter(block => block.depth === 0);
  const spec = scanSource(source, file);

  if (topLevel.length === 0) {
    violate('no-top-level-block', 'no top-level test() or test.describe() found; the sweep has nothing to read a '
      + 'declaration from.');
  }

  blocks.forEach((block) => {
    const at = `${block.callee}() at line ${block.line}`;

    if (block.argumentCount < 2 || block.argumentCount > 3) {
      violate('details-unreadable', `${at} takes ${block.argumentCount} arguments; expected (title, fn) or `
        + '(title, details, fn).');
    }
    if (block.details?.kind === 'unreadable') {
      violate('details-unreadable', `${at} has a details argument the sweep cannot read: ${JSON.stringify(block.details.text)}. `
        + 'Write an object literal ({ tag: THEMES_TAG }) or quarantined(…).');
    }
    block.details?.items.forEach((item) => {
      if (item.kind === 'unknown-identifier') {
        violate('details-unreadable', `${at} tags with ${item.text}, which is not one of `
          + `${Object.keys(TAG_CONSTANTS).join(', ')}. A misspelled constant evaluates to undefined and Playwright `
          + 'accepts { tag: undefined } silently: the spec then runs on e2e-main only.');
      } else if (item.kind === 'unreadable') {
        violate('details-unreadable', `${at} has a tag the sweep cannot read: ${JSON.stringify(item.text)}.`);
      } else if (item.kind === 'literal' && LEG_TAG_LIKE.test(item.tag)) {
        violate('literal-leg-tag', `${at} writes the leg tag as a string (${JSON.stringify(item.tag)}). Use THEMES_TAG / `
          + 'BUNDLES_TAG from fixtures/test: a bare string is one typo from a spec that silently runs on one leg.');
      }
    });

    const legs = legsOf(block.tags);

    if (block.depth > 0 && (legs.themes || legs.bundles)) {
      violate('nested-leg-tag', `${at} is nested and carries a leg tag. A spec is declared as a whole, on every `
        + 'top-level block, because its page objects and fixtures are scanned as a whole.');
    }
  });

  // A top-level `test(title, quarantined(…), body)` cannot carry a leg tag (the helper returns the details
  // object), so it is the no-tag shape: fine in a file that declares nothing (`tests/AGENTS.md`, Quarantine,
  // shows that form), a disagreement in a file that declares an axis, and in a file that needs one the
  // marker check below says where the tag has to go.
  const quarantinedTopLevel = topLevel.some(block => block.details?.kind === 'quarantined');
  const shapes = topLevel.map((block) => {
    const legs = legsOf(block.tags);

    return `${legs.themes ? 'themes' : ''}|${legs.bundles ? 'bundles' : ''}`;
  });
  const agree = topLevel.length > 0 && shapes.every(shape => shape === shapes[0]);

  if (!agree) {
    const listed = topLevel.map((block, index) => `${block.callee}() at line ${block.line}: `
      + `${block.details?.kind === 'quarantined' ? 'quarantined(…), which cannot carry a leg tag' : (shapes[index].replace(/\|/g, ' ').trim() || 'no leg tag')}`);

    if (topLevel.length > 0) {
      violate('top-level-legs-agree', 'every top-level block must declare the same legs (the spec is declared as a '
        + `whole). Found:\n  ${listed.join('\n  ')}\n  A quarantined top-level test sits inside a describe that carries the `
        + 'file\'s tags.');
    }
  }

  const declared = agree ? legsOf(topLevel[0].tags) : null;
  const tags = [...new Set(topLevel.flatMap(block => block.tags))];

  // `test.use({ theme })` or `{ bundle }` would override the leg's option and run every leg on one
  // theme or bundle while the project's name still says otherwise.
  for (const match of spec.masked.matchAll(/(?<![.\w$])test\.use\(/g)) {
    const open = match.index + match[0].length - 1;
    const close = matchingBracket(spec.masked, open, file);
    const inner = spec.masked.slice(open + 1, close);
    const axis = inner.match(/(?<![\w$.])(theme|bundle)\s*:/);

    if (axis) {
      violate('test-use-axis', `test.use() at line ${lineOf(source, match.index)} sets \`${axis[1]}\`, which overrides `
        + 'the leg\'s option: every project would then load that one value under its own name. Declare the axis '
        + 'with a tag instead and let the project choose.');
    }
  }

  const scannedModules = modules
    .map(module => ({ module, file: module.file, views: scanSource(module.source, module.file) }))
    .filter(({ views }) => !isTypeOnlyModule(views.code));
  const geometry = geometryIndexOf(scannedModules);
  const hits = findMarkerHits(spec.code, 'spec', file, { masked: spec.masked, geometry });

  scannedModules.forEach(({ module, views }) => {
    hits.push(...findMarkerHits(views.code, 'module', module.file, { masked: views.masked, geometry }));

    if (readIgnores(module.source).length > 0) {
      violate('ignore-misplaced', `${module.file} carries a "${IGNORE_COMMENT}" comment. An opt-out belongs in the spec `
        + 'file, beside the tests it speaks for; a page object is shared.');
    }
  });
  fixtures.forEach((fixture) => {
    hits.push(...findMarkerHits(scanFixtureHtml(fixture.source, fixture.file), 'fixture', fixture.file));
  });

  const ignores = readIgnores(source);
  const ignored = new Set();

  ignores.forEach((ignore) => {
    const marker = SURFACE_MARKERS.find(candidate => candidate.id === ignore.marker);

    if (!marker) {
      violate('ignore-unknown-marker', `line ${ignore.line}: "${IGNORE_COMMENT} ${ignore.marker}" names no marker; the `
        + `markers are ${[...MARKER_IDS].join(', ')}.`);

      return;
    }
    if (ignore.why.length < IGNORE_WHY_MIN_LENGTH) {
      violate('ignore-no-reason', `line ${ignore.line}: "${IGNORE_COMMENT} ${ignore.marker}" needs \`-- <why>\` of at least `
        + `${IGNORE_WHY_MIN_LENGTH} characters: the reader of the spec, and of the nightly's red, needs to know why the `
        + 'marker does not mean what it usually means here.');
    }
    if (!hits.some(hit => hit.id === ignore.marker)) {
      violate('ignore-stale', `line ${ignore.line}: "${IGNORE_COMMENT} ${ignore.marker}" ignores a marker that no longer `
        + 'hits in this spec, its page objects or its fixtures. Remove the comment.');
    }
    if (declared && declared[marker.axis]) {
      violate('ignore-redundant', `line ${ignore.line}: "${IGNORE_COMMENT} ${ignore.marker}" ignores a ${marker.axis} marker `
        + `while the spec declares ${marker.axis === 'themes' ? 'THEMES_TAG' : 'BUNDLES_TAG'} anyway. Remove the comment.`);
    }
    ignored.add(ignore.marker);
  });

  if (declared) {
    ['themes', 'bundles'].forEach((axis) => {
      if (declared[axis]) {
        return;
      }

      const uncovered = hits.filter(hit => hit.axis === axis && !ignored.has(hit.id));

      if (uncovered.length === 0) {
        return;
      }

      const tag = axis === 'themes' ? 'THEMES_TAG' : 'BUNDLES_TAG';
      const listed = uncovered.map((hit) => {
        const marker = SURFACE_MARKERS.find(candidate => candidate.id === hit.id);

        return `${hit.id} in ${hit.file}:${hit.line}${hit.count > 1 ? ` (${hit.count} hits)` : ''}`
          + `${hit.detail ? `, ${hit.detail}` : ''}: ${marker.why}`;
      });

      violate(`undeclared-${axis}`, `touches ${axis} surface without declaring ${tag}:\n  ${listed.join('\n  ')}\n  `
        + `Add { tag: ${tag} } to every top-level block (tests/AGENTS.md, "Declaring the legs"), or, for a marker `
        + `that does not mean ${axis} sensitivity here, write \`// ${IGNORE_COMMENT} <marker-id> -- <why>\` in this file.`
        + (quarantinedTopLevel ? ' A quarantined top-level test cannot carry the tag: put it inside a describe that does.' : ''));
    });
  }

  return { file, blocks, topLevel, declared, tags, violations, hits, ignores };
}
