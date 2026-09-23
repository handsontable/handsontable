import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLASSIC, CROSS_BROWSERS, JS_VARIANTS, THEMES, VISUAL_TIERS, WRAPPERS } from '../../src/config.mjs';
import { tierPrefixes } from '../visual-tiers.mjs';
import {
  DEFAULT_DECLARATION,
  VISUAL_VARIANTS_ANNOTATION,
  WRAPPERS_REASON_UNAUDITED,
  assertDeclarationFitsLeg,
  declaredPrefixes,
  isDeclared,
  normalizeDeclaration,
  renderedPrefixes,
} from '../visual-declarations.mjs';
import { budgetTotal } from '../visual-budget.mjs';

// What a spec renders used to be derived from the directory it sat in; it is now declared in the spec.
// Two things can go wrong with that, and both are silent. A declaration can name a variant its leg never
// renders, in which case nothing extra appears and every count derived from the declarations is too high
// from then on. Or a declaration can drop a variant the spec still has goldens for, in which case
// reg-suit reports each of those goldens as deleted. The pure-module tests below pin the rules; the sweep
// pins what the 112 checked-in specs say; the arithmetic at the end derives the whole golden set from
// those declarations and compares it against the live manifest, which is what makes the declaration
// codemod a provable no-op rather than a claim.

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TESTS_ROOT = join(PACKAGE_ROOT, 'tests');

// The eleven golden prefixes and their record counts live in ONE place: `visual-tests/visual-budget.json`,
// which the `Visual budget` step of the Compare job enforces against what a build actually renders. They
// were read from the live baseline on 2026-09-18:
// `curl -H 'Cache-Control: no-cache' 'https://visual.handsontable.com/base/develop/out.json?cb=1'`,
// 1676 records, all passing.
//
// Reading them here rather than repeating them is the point. The numbers are true of three different
// things — what the specs DECLARE, what a build RENDERS, and what the budget ALLOWS — and a copy per
// claim is three chances to drift. This file proves the first against the file; the budget gate proves
// the second against the same file. Change the file, and both move together or one of them fails.
const LIVE_GOLDENS = JSON.parse(
  readFileSync(join(PACKAGE_ROOT, 'visual-budget.json'), 'utf8')).prefixes;

// The one spec that declares nothing: it parks a test behind `test.skip('Test merging', fn)`, renders
// no capture, and carries its own eslint-disable line naming the task that owns it.
const PARKED_SPEC = 'cross-browser/merging.spec.ts';

// How many live specs the sweep expects to read a declaration out of, on 2026-09-18: 112 files, one of
// them parked. Adding or deleting a spec moves this number, and moves a number in LIVE_GOLDENS too — the
// pair is the review a description cannot give, so update both in the pull request that adds the spec.
const LIVE_SPEC_COUNT = 111;

// How many of the 23 specs under `tests/multi-frameworks/` still carry the shared unaudited reason.
// The consolidation audit replaces it with a per-spec reason one spec at a time, so this number falls as
// the debt is paid; it must never rise.
const UNAUDITED_WRAPPER_SPECS = 23;

/**
 * Every `.spec.ts` under `tests/`, as paths relative to `tests/`, sorted.
 *
 * @returns {string[]} The spec paths.
 */
function specPaths() {
  const walk = (dir, out) => {
    readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(full, out);
      } else if (entry.name.endsWith('.spec.ts')) {
        out.push(full.slice(TESTS_ROOT.length + 1).split('\\').join('/'));
      }
    });

    return out;
  };

  return walk(TESTS_ROOT, []).sort();
}

// The identifiers a declaration may name, so the sweep can read a declaration out of TypeScript source
// without a TypeScript parser — the `scrollbar-proximity.test.mjs` precedent, where a constant in a `.ts`
// file is pinned by reading the file and matching it. Anything else in a declaration is a string literal.
const VOCABULARY = {
  CLASSIC, CROSS_BROWSERS, JS_VARIANTS, WRAPPERS, WRAPPERS_REASON_UNAUDITED,
};

// What opens a string in a spec. The backtick is in the set because the five looped cross-browser specs
// title their tests with a template literal (`Test rows resizing for: ${url}`), whose `${` would otherwise
// read as the opening brace of the declaration object.
const QUOTES = new Set(['\'', '"', '`']);

/**
 * The index just past the string literal that opens at `start`.
 *
 * A template literal's `${…}` is walked rather than skipped, because an expression inside one can hold a
 * string of its own and a stray quote there would swallow the rest of the file.
 *
 * @param {string} source The source text.
 * @param {number} start The index of the opening quote.
 * @param {string} where The spec path, for the message.
 * @returns {number} The index just past the closing quote.
 */
function endOfString(source, start, where) {
  const quote = source[start];
  let index = start + 1;

  while (index < source.length) {
    const char = source[index];

    if (char === '\\') {
      index += 2;
      continue;
    }

    if (char === quote) {
      return index + 1;
    }

    if (quote === '`' && char === '$' && source[index + 1] === '{') {
      index = endOfTemplateExpression(source, index + 2, where);
      continue;
    }

    index += 1;
  }

  throw new Error(`${where}: a string literal opened at index ${start} and never closed, so the sweep `
    + 'cannot tell code from text.');
}

/**
 * The index just past the `${…}` expression whose body starts at `start`.
 *
 * @param {string} source The source text.
 * @param {number} start The index just past the `${`.
 * @param {string} where The spec path, for the message.
 * @returns {number} The index just past the closing brace.
 */
function endOfTemplateExpression(source, start, where) {
  let depth = 1;
  let index = start;

  while (index < source.length) {
    const char = source[index];

    if (QUOTES.has(char)) {
      index = endOfString(source, index, where);
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        return index + 1;
      }
    }

    index += 1;
  }

  throw new Error(`${where}: a template expression opened at index ${start} and never closed.`);
}

/**
 * The source with every line and block comment replaced by spaces, the line breaks kept.
 *
 * Everything below reads the spec as text, and prose is text too. Measured on this tree before the strip:
 * one in-body comment naming `screenshotPath()` moved the derived golden total from 1676 to 1681 and red
 * the no-op proof on all five js prefixes, although no golden had moved; a comment naming `test(` reads as
 * a bare test call to the scan below in the same way. That is not hypothetical — the consolidation lands
 * about 130 eslint-disable lines and about 91 docblocks on these same spec bodies, describing the captures
 * they sit above. Strings are preserved exactly, so the route literals the cross-browser derivation reads
 * are untouched.
 *
 * A regex literal is not tracked, because a `/…/` holding a quote or a `//` is the only shape that could
 * fool this and the spec tree holds none (measured 2026-09-18: zero regex literals under `tests/`). A `/`
 * that opens neither a comment nor a string is left where it is, so a division survives.
 *
 * @param {string} source The spec file's text.
 * @param {string} where The spec path, for the message.
 * @returns {string} The source with the comments blanked out.
 */
function stripComments(source, where) {
  let out = '';
  let index = 0;

  while (index < source.length) {
    const char = source[index];

    if (QUOTES.has(char)) {
      const end = endOfString(source, index, where);

      out += source.slice(index, end);
      index = end;
      continue;
    }

    if (char === '/' && source[index + 1] === '/') {
      const newline = source.indexOf('\n', index);
      const end = newline === -1 ? source.length : newline;

      out += ' '.repeat(end - index);
      index = end;
      continue;
    }

    if (char === '/' && source[index + 1] === '*') {
      const closing = source.indexOf('*/', index + 2);
      const end = closing === -1 ? source.length : closing + 2;

      out += source.slice(index, end).replace(/[^\n]/g, ' ');
      index = end;
      continue;
    }

    out += char;
    index += 1;
  }

  return out;
}

/**
 * The index of the bracket that closes the one at `open`.
 *
 * @param {string} source Comment-free source text.
 * @param {number} open The index of the opening bracket.
 * @param {string} where The spec path, for the message.
 * @returns {number} The index of the matching closing bracket.
 */
function matchingBracket(source, open, where) {
  let depth = 0;
  let index = open;

  while (index < source.length) {
    const char = source[index];

    if (QUOTES.has(char)) {
      index = endOfString(source, index, where);
      continue;
    }

    if (char === '(' || char === '[' || char === '{') {
      depth += 1;
    } else if (char === ')' || char === ']' || char === '}') {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }

    index += 1;
  }

  throw new Error(`${where}: the bracket at index ${open} is never closed.`);
}

/**
 * `text` split on the commas that sit outside every bracket and every string, with the empty parts of a
 * trailing comma dropped.
 *
 * This is what makes the declaration's layout free: `{ themes: ['main'], browsers: ['chromium'] }` on one
 * line and the same object spread over four lines split into the same parts.
 *
 * @param {string} text Comment-free source text.
 * @param {string} where The spec path, for the message.
 * @param {string} [separator=','] The single character to split on.
 * @returns {string[]} The trimmed, non-empty parts.
 */
function splitTopLevel(text, where, separator = ',') {
  const parts = [];
  let depth = 0;
  let start = 0;
  let index = 0;

  while (index < text.length) {
    const char = text[index];

    if (QUOTES.has(char)) {
      index = endOfString(text, index, where);
      continue;
    }

    if (char === '(' || char === '[' || char === '{') {
      depth += 1;
    } else if (char === ')' || char === ']' || char === '}') {
      depth -= 1;
    } else if (char === separator && depth === 0) {
      parts.push(text.slice(start, index));
      start = index + 1;
    }

    index += 1;
  }

  parts.push(text.slice(start));

  return parts.map(part => part.trim()).filter(part => part !== '');
}

/**
 * The value of a declaration written as one string literal, or as several joined with `+`.
 *
 * The concatenated form is accepted because the audit's per-spec `wrappersReason` is prose and the
 * package's line limit is 120 characters, so a reason long enough to be worth reading is written in
 * pieces. A quote that does not close the whole value is not a string literal here — it falls through to
 * the vocabulary and throws, rather than being sliced into a half-expression nobody notices.
 *
 * @param {string} text Comment-free source text of one value.
 * @param {string} where The spec path, for the message.
 * @returns {string|null} The string, or `null` when the value is not a string literal expression.
 */
function readStringLiteral(text, where) {
  const parts = splitTopLevel(text, where, '+');
  const literals = parts.filter(part => QUOTES.has(part[0]) && endOfString(part, 0, where) === part.length);

  if (literals.length !== parts.length || parts.length === 0) {
    return null;
  }

  return literals.map(part => part.slice(1, -1)).join('');
}

/**
 * Resolves one declaration value written in a spec: an array literal of string literals or vocabulary
 * names, a bare string literal, or a bare vocabulary name.
 *
 * An identifier the vocabulary does not hold throws rather than resolving to `undefined`. Failing open
 * here is what let `wrappersReason: 'a real reason'` read as a missing reason and what would let
 * `themes: THEMES` read as the two-theme default — the same loud-failure rule `normalizeDeclaration()`
 * applies to an unknown key, for the same reason: a value nothing can resolve changes every count derived
 * from the declarations and turns nothing red at the place it was written.
 *
 * @param {string} raw The source text of the value.
 * @param {object} context Where the value was read.
 * @param {string} context.where The spec path, for the message.
 * @param {string} context.key The declaration key, for the message.
 * @returns {string[] | string} The value.
 */
function resolveDeclarationValue(raw, { where, key }) {
  const text = raw.trim();

  if (text.startsWith('[')) {
    return splitTopLevel(text.slice(1, matchingBracket(text, 0, where)), where)
      .map(item => resolveDeclarationValue(item, { where, key }));
  }

  const literal = readStringLiteral(text, where);

  if (literal !== null) {
    return literal;
  }

  if (!Object.prototype.hasOwnProperty.call(VOCABULARY, text)) {
    throw new Error(`${where}: cannot resolve "${text}" in the "${key}" declaration. A declaration names `
      + `a string literal or one of ${Object.keys(VOCABULARY).join(', ')}; anything else resolves to `
      + 'nothing here and silently changes every golden count derived from the declarations. Add the '
      + 'constant to VOCABULARY in lib/__tests__/visual-declarations.test.mjs, or write the value out.');
  }

  return VOCABULARY[text];
}

/**
 * Every `visualTest()` call in one spec's source, with the declaration each one wrote.
 *
 * The declaration is read by matching the call's own brackets, not by matching lines: the inline form the
 * `visual-testing` skill shows and the one-property-per-line form `AGENTS.md` and the specs use are the
 * same declaration, and a reader that accepts only one of them turns a whitespace choice into three red
 * tooling tests. Comments are stripped first, so a docblock between two calls belongs to neither.
 *
 * @param {string} source The spec file's text.
 * @param {string} where The spec path, for the messages.
 * @returns {{ declarationSource: string, declaration: object }[]} One entry per call, in source order.
 */
function readDeclarations(source, where) {
  const clean = stripComments(source, where);

  return visualTestCallOffsets(clean).map((callStart) => {
    const argsOpen = clean.indexOf('(', callStart);
    const args = splitTopLevel(clean.slice(argsOpen + 1, matchingBracket(clean, argsOpen, where)), where);

    if (args.length !== 3) {
      throw new Error(`${where}: visualTest() takes (title, declaration, body) and this call passes `
        + `${args.length} arguments. The declaration is the second one.`);
    }

    const declarationSource = args[1];

    if (!declarationSource.startsWith('{') || !declarationSource.endsWith('}')) {
      throw new Error(`${where}: the second argument of visualTest() must be an object literal written in `
        + 'the file, for example { themes: [\'main\', \'main-dark\'], browsers: [\'chromium\'], '
        + `wrappers: [] }; got "${declarationSource}". The sweep reads it as text, so a variable cannot `
        + 'be used here.');
    }

    const declaration = {};

    splitTopLevel(declarationSource.slice(1, -1), where).forEach((property) => {
      const parsed = property.match(/^(\w+)\s*:\s*([\s\S]+)$/);

      if (!parsed) {
        throw new Error(`${where}: cannot read "${property}" as a "key: value" declaration property.`);
      }

      declaration[parsed[1]] = resolveDeclarationValue(parsed[2], { where, key: parsed[1] });
    });

    return { declarationSource, declaration };
  });
}

/**
 * The offset of every `visualTest(` call in comment-free source.
 *
 * @param {string} clean Comment-free source text.
 * @returns {number[]} The offsets, in source order.
 */
function visualTestCallOffsets(clean) {
  return [...clean.matchAll(/(?<![.\w])visualTest\(/g)].map(match => match.index);
}

/**
 * The reg-suit stems one spec produces, without the variant prefix and without the `.png`.
 *
 * Mirrors `helpers.screenshotPath()`: the capture index restarts at 1 for every test (the `tablePage`
 * fixture resets the counter), and a cross-browser capture carries the demo route it was taken on, so two
 * tests in one cross-browser file that photograph the same route share stems rather than adding them. That
 * is why this returns a set and not a count, and it is why the five `urls.forEach` specs hold 33 capture
 * calls but 66 goldens per browser.
 *
 * Counted over comment-free source, and that is load-bearing: the slice runs from one `visualTest(` offset
 * to the next, so in a multi-call spec a docblock written above the second call sits inside the first
 * call's slice. One sentence naming `screenshotPath()` there used to add a golden to the derived total and
 * red the no-op proof although no golden had moved.
 *
 * @param {string} source The spec file's text.
 * @param {string} relativePath The spec path relative to `tests/`.
 * @returns {Set<string>} The stems, relative to the variant prefix.
 */
function captureStems(source, relativePath) {
  const clean = stripComments(source, relativePath);
  const crossBrowser = relativePath.startsWith('cross-browser/');
  // `helpers.setTestDetails()` makes the directory name relative to the run's root, and the
  // cross-browser leg's root is `tests/cross-browser` itself.
  const withoutExtension = relativePath.replace(/\.spec\.ts$/, '');
  const specDir = crossBrowser ? withoutExtension.replace(/^cross-browser\//, '') : withoutExtension;
  const urlsBlock = clean.match(/const urls = \[([\s\S]*?)\];/);
  const loopedUrls = urlsBlock ? [...urlsBlock[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : null;
  const callOffsets = visualTestCallOffsets(clean);
  const stems = new Set();

  callOffsets.forEach((start, index) => {
    const end = index + 1 < callOffsets.length ? callOffsets[index + 1] : clean.length;
    const body = clean.slice(start, end);
    const captures = (body.match(/screenshotPath\(\)/g) || []).length;

    if (captures === 0) {
      return;
    }

    let routeSuffixes = [''];

    if (crossBrowser) {
      const literalGoto = body.match(/goto\('([^']+)'\)/);

      if (literalGoto) {
        routeSuffixes = [safeRoute(literalGoto[1])];
      } else if (/goto\(url\)/.test(body) && loopedUrls) {
        routeSuffixes = loopedUrls.map(safeRoute);
      }
    }

    routeSuffixes.forEach((suffix) => {
      for (let n = 1; n <= captures; n += 1) {
        stems.add(`${specDir}${suffix}-${n}`);
      }
    });
  });

  return stems;
}

/**
 * Mirrors the route-to-file-name rule in `helpers.screenshotPath()`: every non-word character becomes a
 * hyphen, and the bare `/` route contributes nothing.
 *
 * @param {string} url The demo route.
 * @returns {string} The route as it appears in a golden name.
 */
function safeRoute(url) {
  const encoded = url.split('?')[0].replace(/[^\w]/g, '-');

  return encoded === '-' ? '' : encoded;
}

test('the default declaration is two themes, one browser and no wrapper', () => {
  // This default is the guardrail: a new spec costs two goldens per capture rather than the five every
  // spec written before the declaration costs. A change here changes the price of every future spec.
  assert.deepEqual({ ...DEFAULT_DECLARATION }, {
    themes: ['main', 'main-dark'],
    browsers: ['chromium'],
    wrappers: [],
  });
  assert.deepEqual(normalizeDeclaration({}), {
    themes: ['main', 'main-dark'],
    browsers: ['chromium'],
    wrappers: [],
  });
});

test('classic is a token in themes, not a separate flag', () => {
  // The bare js run has no theme name because `HOT_THEME` is unset for it. Making it a token keeps the js
  // axis one flat list a codemod can write and a budget can sum, and keeps the token out of the
  // environment, where it would request a theme that does not exist.
  assert.equal(CLASSIC, 'classic');
  assert.deepEqual(JS_VARIANTS, ['classic', ...THEMES]);
  assert.deepEqual(normalizeDeclaration({ themes: JS_VARIANTS }).themes, JS_VARIANTS);
});

test('normalizeDeclaration rejects an unknown name on every axis', () => {
  // A typo renders nothing and deletes that variant's goldens on the next compare, so it has to throw
  // rather than fall through. The message names the offender and the allowed list, like `parseWrappers`.
  assert.throws(() => normalizeDeclaration({ themes: ['mian'] }), /Unknown theme "mian".*horizon-dark/s);
  assert.throws(() => normalizeDeclaration({ browsers: ['safari'] }), /Unknown browser "safari".*webkit/s);
  assert.throws(
    () => normalizeDeclaration({ themes: JS_VARIANTS, wrappers: ['vue2'], wrappersReason: 'why' }),
    /Unknown wrapper "vue2".*vue3/s,
  );
});

test('normalizeDeclaration rejects an unknown key', () => {
  // `theme:` for `themes:` would silently fall back to the default and halve what the spec renders.
  assert.throws(() => normalizeDeclaration({ theme: ['main'] }), /Unknown key "theme"/);
  assert.throws(() => normalizeDeclaration({ browser: ['chromium'] }), /Unknown key "browser"/);
});

test('normalizeDeclaration rejects a duplicate', () => {
  // A duplicated variant renders once and is counted twice by anything that sums declarations, which is
  // how a golden budget drifts away from the records it guards.
  assert.throws(() => normalizeDeclaration({ themes: ['main', 'main'] }), /Duplicate theme "main"/);
});

test('normalizeDeclaration rejects a non-array axis and a non-object declaration', () => {
  // A bare string or an array passed where the declaration object belongs would otherwise be read as a
  // declaration and silently defaulted: `themes: 'main'` has a `length` and an `includes`, so every axis
  // check would pass on the characters of the word and the spec would render the two-theme default.
  assert.throws(() => normalizeDeclaration({ themes: 'main' }), /"themes" must be an array/);
  assert.throws(() => normalizeDeclaration(undefined), /must be an object/);
  assert.throws(() => normalizeDeclaration(['main']), /must be an object/);
});

test('normalizeDeclaration rejects an empty axis', () => {
  // An empty axis renders the spec nowhere on that leg, which reg-suit reports as deleted goldens and
  // never as a skip.
  assert.throws(() => normalizeDeclaration({ themes: [] }), /at least one theme/);
  assert.throws(() => normalizeDeclaration({ browsers: [] }), /at least one browser/);
});

test('normalizeDeclaration rejects wrappers without the classic theme', () => {
  // A wrapper run never sets HOT_THEME, and on the seed tier the wrapper goldens are the bare js render
  // copied wholesale — the spec-level twin of the `copyWrappers` guard in scripts/run-tests.mjs.
  assert.throws(
    () => normalizeDeclaration({ themes: ['main'], wrappers: WRAPPERS, wrappersReason: 'why' }),
    /must include the "classic" theme/,
  );
  assert.doesNotThrow(
    () => normalizeDeclaration({ themes: [CLASSIC], wrappers: WRAPPERS, wrappersReason: 'why' }),
  );
});

test('normalizeDeclaration rejects wrappers without a reason, and a reason without wrappers', () => {
  // Three goldens a capture is the most expensive thing a spec can ask for, so that axis argues for
  // itself in the file; a leftover reason after a trim claims coverage the spec no longer has.
  assert.throws(
    () => normalizeDeclaration({ themes: [CLASSIC], wrappers: ['vue3'] }),
    /needs a "wrappersReason"/,
  );
  assert.throws(
    () => normalizeDeclaration({ themes: [CLASSIC], wrappers: ['vue3'], wrappersReason: '  ' }),
    /needs a "wrappersReason"/,
  );
  assert.throws(
    () => normalizeDeclaration({ themes: [CLASSIC], wrappers: [], wrappersReason: 'left over' }),
    /"wrappersReason" but no wrappers/,
  );
});

test('isDeclared reads themes on the js pass and wrappers on a wrapper pass', () => {
  // HOT_THEME unset is the classic run, which is why the caller passes `helpers.hotTheme || CLASSIC`. A
  // wrapper pass always renders bare, so it never consults the theme axis.
  const declaration = normalizeDeclaration({
    themes: [CLASSIC, 'main'], wrappers: ['vue3'], wrappersReason: 'why',
  });

  assert.equal(isDeclared(declaration, { framework: 'js', theme: CLASSIC }), true);
  assert.equal(isDeclared(declaration, { framework: 'js', theme: 'main' }), true);
  assert.equal(isDeclared(declaration, { framework: 'js', theme: 'horizon' }), false);
  assert.equal(isDeclared(declaration, { framework: 'vue3', theme: CLASSIC }), true);
  assert.equal(isDeclared(declaration, { framework: 'react-wrapper', theme: CLASSIC }), false);
});

test('declaredPrefixes maps each axis onto the golden layout', () => {
  // This is the per-spec mirror of `helpers.screenshotPath()` — the directory each golden lands in. A
  // drift here renames every record under that prefix at once: reg-suit matches by path, so the whole
  // prefix reads as deleted and the new one as new, on every variant the spec declares.
  const jsOnly = normalizeDeclaration({ themes: JS_VARIANTS, browsers: ['chromium'], wrappers: [] });
  const multi = normalizeDeclaration({
    themes: JS_VARIANTS, browsers: ['chromium'], wrappers: WRAPPERS, wrappersReason: 'why',
  });
  const crossBrowser = normalizeDeclaration({ themes: [CLASSIC], browsers: CROSS_BROWSERS, wrappers: [] });

  assert.deepEqual(declaredPrefixes(jsOnly), [
    'js/chromium/',
    'js/chromium-theme-main/',
    'js/chromium-theme-main-dark/',
    'js/chromium-theme-horizon/',
    'js/chromium-theme-horizon-dark/',
  ]);
  assert.deepEqual(declaredPrefixes(multi).slice(-3), [
    'angular-wrapper/chromium/', 'react-wrapper/chromium/', 'vue3/chromium/',
  ]);
  // The same `chromium` lands under a different prefix on the other leg, which is why the leg is an
  // argument and not something read off the declaration.
  assert.deepEqual(declaredPrefixes(crossBrowser, { crossBrowser: true }), [
    'cross-browser/chromium/', 'cross-browser/firefox/', 'cross-browser/webkit/',
  ]);
});

test('the three checked-in declaration shapes cover exactly the seed tier prefixes', () => {
  // `declaredPrefixes()` is the third hand-written mirror of `helpers.screenshotPath()`, after
  // `tierPrefixes()`. A drift between the two would either prune a variant the build rendered or keep one
  // it did not, so the two are pinned against each other the way `tierPrefixes()` is pinned to a manifest.
  const jsOnly = normalizeDeclaration({ themes: JS_VARIANTS, browsers: ['chromium'], wrappers: [] });
  const multi = normalizeDeclaration({
    themes: JS_VARIANTS, browsers: ['chromium'], wrappers: WRAPPERS, wrappersReason: 'why',
  });
  const crossBrowser = normalizeDeclaration({ themes: [CLASSIC], browsers: CROSS_BROWSERS, wrappers: [] });
  const union = new Set([
    ...declaredPrefixes(jsOnly),
    ...declaredPrefixes(multi),
    ...declaredPrefixes(crossBrowser, { crossBrowser: true }),
  ]);

  assert.deepEqual([...union].sort(), [...tierPrefixes(VISUAL_TIERS.seed)].sort());
  assert.deepEqual([...union].sort(), Object.keys(LIVE_GOLDENS).sort());
});

test('a declaration can never name a variant no tier renders', () => {
  // The drift guard in the other direction: every value the vocabulary allows must land in a prefix the
  // `full` tier renders, or a spec could declare something the suite has no place to put.
  const full = tierPrefixes(VISUAL_TIERS.full);
  const everyJsVariant = normalizeDeclaration({
    themes: JS_VARIANTS, browsers: ['chromium'], wrappers: WRAPPERS, wrappersReason: 'why',
  });
  const everyBrowser = normalizeDeclaration({ themes: [CLASSIC], browsers: CROSS_BROWSERS, wrappers: [] });

  declaredPrefixes(everyJsVariant).forEach(prefix => assert.ok(full.includes(prefix), prefix));
  declaredPrefixes(everyBrowser, { crossBrowser: true })
    .forEach(prefix => assert.ok(full.includes(prefix), prefix));
});

test('renderedPrefixes intersects a declaration with the tier', () => {
  // The arithmetic behind "the golden set is the sum of the declarations": a spec that declares five js
  // variants renders two of them on a pull request.
  const jsOnly = normalizeDeclaration({ themes: JS_VARIANTS, browsers: ['chromium'], wrappers: [] });

  assert.deepEqual(renderedPrefixes(jsOnly, tierPrefixes(VISUAL_TIERS.pr)), [
    'js/chromium-theme-main/', 'js/chromium-theme-main-dark/',
  ]);
  assert.deepEqual(renderedPrefixes(jsOnly, tierPrefixes(VISUAL_TIERS.seed)), declaredPrefixes(jsOnly));
});

test('assertDeclarationFitsLeg rejects over-declaration on both legs', () => {
  // Over-declaration is silent: the main config has one chromium project and ignores tests/cross-browser,
  // and the cross-browser leg sets neither HOT_THEME nor HOT_FRAMEWORK. Nothing renders for the extra
  // variant, nothing turns red, and every count derived from the declarations is too high from then on.
  assert.throws(
    () => assertDeclarationFitsLeg(
      normalizeDeclaration({ themes: JS_VARIANTS, browsers: CROSS_BROWSERS }),
      { crossBrowser: false },
    ),
    /"browsers" must be \['chromium'\]/,
  );
  assert.throws(
    () => assertDeclarationFitsLeg(
      normalizeDeclaration({ themes: JS_VARIANTS, browsers: CROSS_BROWSERS }),
      { crossBrowser: true },
    ),
    /"themes" must be \['classic'\]/,
  );
  assert.throws(
    () => assertDeclarationFitsLeg(
      normalizeDeclaration({ themes: [CLASSIC], browsers: CROSS_BROWSERS, wrappers: WRAPPERS, wrappersReason: 'w' }),
      { crossBrowser: true },
    ),
    /"wrappers" must be empty/,
  );
});

test('a leg violation names the spec it came from', () => {
  // The caller is a sweep over every spec in the tree, so a message that only restates the rule leaves
  // the reader grepping for which file broke it — and the rule is the half they can already read in the
  // source. `normalizeDeclaration()` already prefixes its own errors this way; this is the other half.
  [
    [{ crossBrowser: false, where: 'js-only/pagination/paging.spec.ts' }, { browsers: CROSS_BROWSERS }],
    [{ crossBrowser: true, where: 'cross-browser/selection.spec.ts' }, { themes: JS_VARIANTS }],
    [
      { crossBrowser: true, where: 'cross-browser/undo-redo.spec.ts' },
      { themes: [CLASSIC], wrappers: WRAPPERS, wrappersReason: 'w' },
    ],
  ].forEach(([leg, declared]) => {
    // A prefix check, not a pattern match: building a regex out of a path means escaping every
    // metacharacter it might carry, and an escape list that misses one (a backslash, on Windows) is a
    // silently wrong assertion rather than a failing one. CodeQL flagged the first version for exactly
    // that.
    assert.throws(
      () => assertDeclarationFitsLeg(normalizeDeclaration(declared), leg),
      error => error.message.startsWith(`${leg.where}: `),
      `the leg violation for ${leg.where} must name the spec before it states the rule`,
    );
  });
});

test('the reader accepts the inline declaration and the one-per-line declaration alike', () => {
  // The three authoring surfaces do not agree on whitespace, and they should not have to: the skill's
  // fenced example writes the declaration inline, `AGENTS.md`, the template and all 111 codemod-written
  // specs put one `key: value,` per line. A reader that accepted only one of them turned a line break
  // into three red tooling tests, on a message that said the spec declared nothing when it declared
  // exactly what the skill told the author to copy. The reader matches the call's brackets instead.
  const inline = 'visualTest(__filename, { themes: [\'main\'], browsers: [\'chromium\'], wrappers: [] },\n'
    + '  async({ tablePage }) => { await tablePage.screenshot({ path: helpers.screenshotPath() }); });\n';
  const multiLine = 'visualTest(__filename, {\n'
    + '  themes: [\'main\'],\n'
    + '  browsers: [\'chromium\'],\n'
    + '  wrappers: [],\n'
    + '}, async({ tablePage }) => {\n'
    + '  await tablePage.screenshot({ path: helpers.screenshotPath() });\n'
    + '});\n';
  const expected = { themes: ['main'], browsers: ['chromium'], wrappers: [] };

  assert.deepEqual(readDeclarations(inline, 'probe.spec.ts')[0].declaration, expected);
  assert.deepEqual(readDeclarations(multiLine, 'probe.spec.ts')[0].declaration, expected);
  // The template-literal title of the five looped cross-browser specs holds an interpolation, whose brace
  // would be read as the declaration's opening brace by anything that looks for the first `{`. The
  // interpolation is assembled here so this fixture is not itself read as an accidental template string.
  const interpolation = ['$', '{url}'].join('');
  const loopedTitle = `visualTest(\`Rows for: ${interpolation}\`, { themes: [CLASSIC], `
    + 'browsers: CROSS_BROWSERS, wrappers: [] }, async({ goto }) => {});';

  assert.deepEqual(readDeclarations(loopedTitle, 'probe.spec.ts')[0].declaration, {
    themes: [CLASSIC], browsers: CROSS_BROWSERS, wrappers: [],
  });
});

test('the reader resolves a string-literal reason and refuses a name it cannot resolve', () => {
  // The audit this guardrail exists to enable replaces the shared constant with a per-spec sentence, one
  // spec at a time. Before this, that sentence resolved to `undefined` and the sweep reported the reason
  // as missing on the very specs that had just been given one. An identifier outside the vocabulary now
  // throws instead of resolving to nothing — `themes: THEMES` would otherwise have read as the two-theme
  // default and moved 111 specs' derived counts with nothing turning red where it was written.
  const withReason = 'visualTest(__filename, { themes: [CLASSIC], browsers: [\'chromium\'], '
    + 'wrappers: WRAPPERS, wrappersReason: \'Wrapper scroll handlers differ; the js render cannot prove '
    + 'them.\' }, async({ tablePage }) => {});';

  assert.equal(
    readDeclarations(withReason, 'probe.spec.ts')[0].declaration.wrappersReason,
    'Wrapper scroll handlers differ; the js render cannot prove them.',
  );
  // A reason worth reading is longer than the package's 120-character line, so it arrives in pieces.
  assert.equal(
    readDeclarations('visualTest(__filename, { themes: [CLASSIC], browsers: [\'chromium\'], '
      + 'wrappers: WRAPPERS, wrappersReason: \'Wrapper scroll handlers differ; \'\n'
      + '    + \'the js render cannot prove them.\' }, async({ tablePage }) => {});',
    'probe.spec.ts')[0].declaration.wrappersReason,
    'Wrapper scroll handlers differ; the js render cannot prove them.',
  );
  assert.throws(
    () => readDeclarations('visualTest(__filename, { themes: THEMES, browsers: [\'chromium\'], '
      + 'wrappers: [] }, async({ tablePage }) => {});', 'probe.spec.ts'),
    /probe\.spec\.ts: cannot resolve "THEMES" in the "themes" declaration/,
  );
  assert.throws(
    () => readDeclarations('visualTest(__filename, { themes: [MAIN], browsers: [\'chromium\'], '
      + 'wrappers: [] }, async({ tablePage }) => {});', 'probe.spec.ts'),
    /probe\.spec\.ts: cannot resolve "MAIN" in the "themes" declaration/,
  );
  assert.throws(
    () => readDeclarations('visualTest(__filename, declaration, async({ tablePage }) => {});',
      'probe.spec.ts'),
    /probe\.spec\.ts: the second argument of visualTest\(\) must be an object literal/,
  );
});

test('a comment that names screenshotPath() or test() is prose, not a capture', () => {
  // The derivation counts `screenshotPath()` over a spec's source, and the consolidation lands about 130
  // eslint-disable lines and about 91 docblocks on these exact spec bodies, describing the captures they
  // sit above. One such sentence used to add a golden to the derived total per declared variant and red
  // the no-op proof on all five js prefixes although no golden had moved.
  const body = 'visualTest(__filename, {\n  themes: [\'main\'],\n  browsers: [\'chromium\'],\n'
    + '  wrappers: [],\n}, async({ tablePage }) => {\n'
    + '  await tablePage.screenshot({ path: helpers.screenshotPath() });\n});\n';
  const commented = `${body.replace('async({ tablePage }) => {\n',
    'async({ tablePage }) => {\n  // The capture goes through helpers.screenshotPath() so the name is '
    + 'deterministic, and a bare test() would not.\n')}`;

  assert.equal(captureStems(body, 'js-only/probe.spec.ts').size, 1);
  assert.deepEqual(
    [...captureStems(commented, 'js-only/probe.spec.ts')],
    [...captureStems(body, 'js-only/probe.spec.ts')],
  );
  assert.equal(/(?<![.\w])test\(/.test(stripComments(commented, 'js-only/probe.spec.ts')), false);
  // A route literal is code, not prose, so the cross-browser derivation still reads it.
  assert.deepEqual(
    [...captureStems('visualTest(\'t\', { themes: [CLASSIC], browsers: [\'chromium\'], wrappers: [] },\n'
      + '  async({ goto, tablePage }) => {\n    await goto(\'/merged-cells-demo\'); // the demo route\n'
      + '    await tablePage.screenshot({ path: helpers.screenshotPath() });\n  });\n',
    'cross-browser/probe.spec.ts')],
    ['probe-merged-cells-demo-1'],
  );
});

test('every live spec declares its variants through visualTest', () => {
  // The rename is the enforcement's premise: a spec that still called `test()` would render on every
  // variant the tier launches while contributing nothing to the derived count below. Read over
  // comment-free source, so a spec cannot pass on a sentence that merely names the helper.
  const missing = specPaths().filter((relativePath) => {
    if (relativePath === PARKED_SPEC) {
      return false;
    }

    const source = readFileSync(join(TESTS_ROOT, relativePath), 'utf8');

    return visualTestCallOffsets(stripComments(source, relativePath)).length === 0;
  });

  assert.deepEqual(missing, [], 'Every live spec registers through visualTest(title, { themes, browsers, '
    + 'wrappers }, fn) — see visual-tests/AGENTS.md, Variant declaration.');
});

test('no spec scopes itself with a bare test() or a hand-written test.skip()', () => {
  // The lint override in `.eslintrc.js` is the live gate; this is the same rule stated where the rest of
  // the declaration rules live, so a future change to that override cannot quietly drop it. The parked
  // spec is the one exception and it must keep the disable line that makes it one.
  //
  // Comments are stripped before the scan, and the disable line is checked on the raw source for the same
  // reason: prose about a bare `test(` is prose, and the line that makes the parked spec legal IS a
  // comment. Without the strip, the consolidation's ~91 docblocks would each be a candidate offender.
  const offenders = specPaths().filter((relativePath) => {
    const source = readFileSync(join(TESTS_ROOT, relativePath), 'utf8');

    if (relativePath === PARKED_SPEC) {
      assert.match(source, /eslint-disable-next-line no-restricted-syntax -- \S+: /,
        `${PARKED_SPEC} keeps its own disable line, which is what makes its test.skip() legal.`);

      return false;
    }

    const clean = stripComments(source, relativePath);

    return /(?<![.\w])test\(/.test(clean) || /(?<![.\w])test\.skip\(/.test(clean);
  });

  assert.deepEqual(offenders, [], 'A spec names its variants in its visualTest() declaration and '
    + 'visualTest() emits the skip; a hand-written one applies at file scope too, so the two combine and '
    + 'the declaration stops describing what renders.');
});

test('every spec holds one declaration, and its leg can render it', () => {
  // Two declarations in one file do not combine the way a reader expects: both skips are file-scope
  // modifiers, so each applies to every test in the file and the file renders only the variants BOTH
  // declarations name — the intersection, which can be empty. Neither declaration then describes what
  // renders, so one declaration per file is the rule.
  let specsChecked = 0;

  specPaths().forEach((relativePath) => {
    if (relativePath === PARKED_SPEC) {
      return;
    }

    const source = readFileSync(join(TESTS_ROOT, relativePath), 'utf8');
    const declarations = readDeclarations(source, relativePath);
    const callCount = visualTestCallOffsets(stripComments(source, relativePath)).length;

    // Not `declarations.length === callCount` — both sides count the same `visualTestCallOffsets()`
    // result, so that comparison can never be false. What can go wrong is a call whose declaration the
    // reader found but could not slice: `readDeclarations()` throws on an unreadable one, so the check
    // that differs is that each entry carries the source it parsed.
    assert.equal(declarations.length, callCount,
      `${relativePath}: every visualTest() call must carry a readable declaration object.`);
    assert.ok(declarations.length >= 1, `${relativePath}: no declaration found.`);
    declarations.forEach(({ declarationSource }, index) => {
      assert.ok(declarationSource && declarationSource.trim() !== '',
        `${relativePath}: visualTest() call ${index + 1} carries an empty declaration source, so the `
        + 'sweep is reading a call it cannot check.');
    });

    const [first] = declarations;
    const firstShape = JSON.stringify(normalizeDeclaration(first.declaration, relativePath));

    declarations.slice(1).forEach(({ declaration }) => {
      assert.equal(JSON.stringify(normalizeDeclaration(declaration, relativePath)), firstShape,
        `${relativePath}: every visualTest() call in one file must declare the same variants. The two `
        + 'skips are file-scope modifiers, so the file would render only the variants both calls name.');
    });

    assertDeclarationFitsLeg(
      normalizeDeclaration(first.declaration, relativePath),
      { crossBrowser: relativePath.startsWith('cross-browser/'), where: relativePath },
    );
    specsChecked += 1;
  });

  assert.equal(specsChecked, LIVE_SPEC_COUNT, 'The spec tree held 112 files on 2026-09-18, one of them '
    + 'parked. Adding or deleting a spec moves this count: update LIVE_SPEC_COUNT in this file, and '
    + 'expect LIVE_GOLDENS to move with it. A moved number is the review this pin exists for, not a bug.');
});

test('every spec declares a shape its own directory can host', () => {
  // The codemod wrote the rendered set every directory already had, so no golden record moved: five js
  // variants everywhere, all three wrappers on the multi-framework specs the seed copies wholesale, and
  // all three browsers on the cross-browser leg except the clipboard specs Chromium alone can run.
  //
  // This pin is NOT "one shape per directory". The guardrail's whole point is that a new spec takes the
  // two-theme default, and a pin that rejected the default would block the behavior the default exists to
  // encourage — the first new js-only spec would have failed with a bare diff of two JSON strings. What is
  // load-bearing per directory is narrower, and it is the seed's wholesale copy: every multi-framework
  // spec must declare all three wrappers, because `scripts/run-tests.mjs` copies the whole
  // `js/chromium/multi-frameworks` directory into the three wrapper baselines. A spec there that declares
  // fewer gets wrapper goldens the `full` tier then never renders, and the nightly reports them deleted
  // every night until the per-spec copy lands.
  //
  // The reason string is deliberately not part of the shape: the audit's job is to replace the shared
  // constant with a per-spec reason, and the count that tracks it is the next test.
  const shapeOf = declaration => JSON.stringify({
    themes: declaration.themes,
    browsers: declaration.browsers,
    wrappers: declaration.wrappers,
  });
  const allowedShapes = {
    'js-only': [
      { themes: JS_VARIANTS, browsers: ['chromium'], wrappers: [] },
      { ...DEFAULT_DECLARATION },
    ],
    'multi-frameworks': [
      { themes: JS_VARIANTS, browsers: ['chromium'], wrappers: WRAPPERS, wrappersReason: 'any' },
    ],
    'cross-browser': [
      { themes: [CLASSIC], browsers: ['chromium'], wrappers: [] },
      { themes: [CLASSIC], browsers: CROSS_BROWSERS, wrappers: [] },
    ],
  };
  const remedies = {
    'js-only': 'A js-only spec renders the five js variants (what the codemod wrote) or the documented '
      + 'default { themes: [\'main\', \'main-dark\'], browsers: [\'chromium\'], wrappers: [] }.',
    'multi-frameworks': 'Every spec here declares all three wrappers, because the seed copies the whole '
      + 'js/chromium/multi-frameworks directory into the three wrapper baselines (scripts/run-tests.mjs). '
      + 'A spec that needs no wrapper belongs in tests/js-only/; trimming a wrapper here needs the '
      + 'per-spec seed copy first, or the nightly reports the orphaned goldens deleted every night.',
    'cross-browser': 'The cross-browser leg sets no HOT_THEME and no HOT_FRAMEWORK, so themes is '
      + '[\'classic\'] and wrappers is empty; browsers is all three, or chromium alone for the clipboard '
      + 'specs only Chromium can run.',
  };

  specPaths().forEach((relativePath) => {
    if (relativePath === PARKED_SPEC) {
      return;
    }

    const [first] = readDeclarations(readFileSync(join(TESTS_ROOT, relativePath), 'utf8'), relativePath);

    assert.ok(first, `${relativePath} declares no variants; every live spec calls visualTest().`);

    const directory = relativePath.split('/')[0];

    // A spec under a new top-level directory would otherwise die on `undefined.map` — an opaque
    // TypeError in a file whose whole design is loud, self-explaining failure. The directory decides
    // which shapes are legal (the seed copies `multi-frameworks` wholesale; the cross-browser leg
    // renders bare), so a new one is a decision, not an oversight: it has to be registered here.
    assert.ok(allowedShapes[directory],
      `${relativePath}: the directory "${directory}" has no allowed declaration shapes. Register it in `
      + 'allowedShapes and remedies, and say in the pull request what the new directory renders.');

    const allowed = allowedShapes[directory].map(shape => shapeOf(normalizeDeclaration(shape)));
    const written = shapeOf(normalizeDeclaration(first.declaration, relativePath));

    assert.ok(allowed.includes(written), `${relativePath} declares ${written}, which this directory `
      + `cannot host. ${remedies[directory]} Another shape is a change to the golden set: add it to `
      + 'allowedShapes in lib/__tests__/visual-declarations.test.mjs, say in the pull request what it '
      + 'buys, and expect the per-prefix numbers below to move — a moved number there is the review, '
      + 'not a bug.');
  });
});

test('the multi-framework specs still carry the shared unaudited wrappers reason', () => {
  // The audit that trims those 69 wrapper goldens greps for this constant, so the constant has to be the
  // literal every one of those specs names. A per-spec reason replaces it one spec at a time, so this
  // count falls as the debt is paid and must never rise.
  const multiFrameworkSpecs = specPaths().filter(relativePath => relativePath.startsWith('multi-frameworks/'));
  const carrying = multiFrameworkSpecs.filter((relativePath) => {
    const [first] = readDeclarations(readFileSync(join(TESTS_ROOT, relativePath), 'utf8'), relativePath);

    return first.declaration.wrappersReason === WRAPPERS_REASON_UNAUDITED;
  });

  assert.equal(carrying.length, UNAUDITED_WRAPPER_SPECS,
    'WRAPPERS_REASON_UNAUDITED marks a wrapper declaration nobody has argued for yet. A FALLING count is '
    + 'the consolidation audit paying that debt one spec at a time: lower UNAUDITED_WRAPPER_SPECS in this '
    + 'file by the number of specs that gained a real reason. A RISING count is a new spec under '
    + 'tests/multi-frameworks/ that copied the placeholder instead of saying what its wrapper render '
    + 'proves that the js render does not.');
});

test('every capture-cap exception matches what the spec actually takes', () => {
  // The nine exception counts in visual-budget.json are a second statement of a fact the spec tree
  // already makes, so derive it rather than trusting the file.
  //
  // The quantity is captures per REG-SUIT STEM, which is the number of `screenshotPath()` calls in the
  // spec — not `captureStems().size`, which is golden records per spec. The two differ whenever a spec
  // loops over demo URLs: `cross-browser/scroll.spec.ts` has one call inside a loop over six demos, so
  // it produces six stems of one capture each. Six records, one capture per stem, under the cap of 4.
  // Comparing against records instead would demand an exception for a spec that takes one capture.
  const budget = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'visual-budget.json'), 'utf8'));
  const capturesPerStem = new Map();

  specPaths().forEach((relativePath) => {
    if (relativePath === PARKED_SPEC) {
      return;
    }

    const source = readFileSync(join(TESTS_ROOT, relativePath), 'utf8');

    capturesPerStem.set(relativePath.replace(/\.spec\.ts$/, ''),
      (source.match(/screenshotPath\(\)/g) ?? []).length);
  });

  Object.entries(budget.capExceptions ?? {}).forEach(([stem, exception]) => {
    const actual = capturesPerStem.get(stem);

    assert.notEqual(actual, undefined,
      `visual-budget.json lists a cap exception for ${stem}, which is not a spec in the tree. A renamed `
      + 'or deleted spec leaves its exception behind, permitting captures nothing takes.');
    assert.equal(exception.captures, actual,
      `visual-budget.json says ${stem} takes ${exception.captures} captures; the spec makes ${actual} `
      + 'screenshotPath() calls. An exception is a ceiling on what is there — move it in the pull '
      + 'request that changed the spec.');
  });

  // And nothing over the cap may be missing from the list, or a build fails on it twenty minutes in
  // rather than here.
  [...capturesPerStem.entries()].forEach(([stem, count]) => {
    if (count > budget.captureCap) {
      assert.ok(budget.capExceptions?.[stem],
        `${stem} makes ${count} screenshotPath() calls, over the cap of ${budget.captureCap}, with no `
        + 'entry in visual-budget.json capExceptions. Add it with the ticket that will bring it down, '
        + 'or trim the spec.');
    }
  });
});

test('the declarations derive exactly the live golden set', () => {
  // The static proof that the codemod moved nothing: sum each spec's captures over the prefixes its own
  // declaration produces, and the eleven per-prefix totals must be the live baseline's. A later trim, or
  // a new spec on the two-theme default, changes a number here — which is the point. The implied total is
  // printed so the movement is a number a reviewer sees rather than a claim in a description.
  const perPrefix = {};
  let total = 0;

  specPaths().forEach((relativePath) => {
    if (relativePath === PARKED_SPEC) {
      return;
    }

    const source = readFileSync(join(TESTS_ROOT, relativePath), 'utf8');
    const [first] = readDeclarations(source, relativePath);

    assert.ok(first, `${relativePath} declares no variants, so its goldens cannot be derived. `
      + 'Every live spec renders through visualTest(title, { themes, browsers, wrappers }, fn).');

    const declaration = normalizeDeclaration(first.declaration, relativePath);
    const crossBrowser = relativePath.startsWith('cross-browser/');
    const stems = captureStems(source, relativePath);

    declaredPrefixes(declaration, { crossBrowser }).forEach((prefix) => {
      perPrefix[prefix] = (perPrefix[prefix] ?? 0) + stems.size;
      total += stems.size;
    });
  });

  const remedy = 'A number moved because a spec was added, deleted, trimmed or given a capture — which '
    + 'is exactly what this pin is for. Update `visual-tests/visual-budget.json` to the set this change '
    + 'produces, and say in the pull request why it moved — a growth also needs the '
    + '`[visual budget: N – reason]` marker the Compare job reads. A moved number is the review, not a '
    + 'bug; an UNEXPLAINED one is the bug.';

  process.stdout.write(`golden records implied by the checked-in declarations: ${total}\n`);
  assert.deepEqual(perPrefix, LIVE_GOLDENS, 'The per-prefix golden counts derived from the checked-in '
    + `declarations are not the budget file's. ${remedy}`);

  // Not a second check of the same thing: the deepEqual above compares the derived counts to the file
  // prefix by prefix, and LIVE_GOLDEN_TOTAL is that file's sum — so once it passes, the totals agree by
  // construction. What this catches is the SUMMING, which is the part the budget gate does
  // independently: `budgetTotal()` is what the growth marker's N is checked against, and a change that
  // made the two ways of adding up the same file disagree would show here first.
  assert.equal(total, budgetTotal({ prefixes: LIVE_GOLDENS }),
    `The declarations imply ${total} golden records and the budget file sums to `
    + `${budgetTotal({ prefixes: LIVE_GOLDENS })}. ${remedy}`);
});

test('visualTest emits both skips before it registers the annotated test', () => {
  // node:test cannot import a `.ts` file, so the runner's shape is pinned by reading it — the
  // `scrollbar-proximity.test.mjs` precedent. The order matters: the two skips are file-scope modifiers
  // and have to be declared before the test they apply to. The annotation type is what a reader outside
  // the run (`npx playwright test --list --reporter=json`) keys on, so a rename in one place fails here.
  const runner = readFileSync(join(PACKAGE_ROOT, 'src', 'test-runner.ts'), 'utf8');
  const start = runner.indexOf('export function visualTest(');

  assert.notEqual(start, -1, 'src/test-runner.ts must export a `visualTest` function.');

  const body = runner.slice(start);
  const firstSkip = body.indexOf('test.skip(');
  const callbackSkip = body.indexOf('({ browserName }) => !declaration.browsers.includes(browserName)');
  const registration = body.indexOf(`annotation: { type: ${'VISUAL_VARIANTS_ANNOTATION'}`);

  assert.notEqual(firstSkip, -1, 'visualTest must skip the undeclared framework and theme.');
  assert.notEqual(callbackSkip, -1,
    'visualTest must read browserName from the fixture: the project`s `use.browserName` is undefined at '
    + 'file scope, because the cross-browser config builds its projects from `devices[...]`.');
  assert.notEqual(registration, -1, 'visualTest must register the test with the static annotation.');
  assert.ok(firstSkip < registration && callbackSkip < registration,
    'Both file-scope skips must be declared before the test they apply to.');
  assert.equal(VISUAL_VARIANTS_ANNOTATION, 'visual-variants');
});

test('the fixtures derive the spec file from the suite, never from testInfo.file', () => {
  // `testInfo.file` is where `test()` was called, and `visualTest()` calls it, so it is `test-runner.ts`
  // for every spec now — measured on Playwright 1.60.0. Every golden path is keyed on the spec file, so
  // reading `testInfo.file` here would collapse all 1676 records onto one name with nothing turning red.
  const runner = readFileSync(join(PACKAGE_ROOT, 'src', 'test-runner.ts'), 'utf8');
  const fixtureCalls = [...runner.matchAll(/testFilePath: (.*),/g)].map(match => match[1]);

  assert.deepEqual(fixtureCalls, ['specFilePath(testInfo)', 'specFilePath(testInfo)'],
    'Both fixtures must resolve the spec file through specFilePath().');
  assert.match(runner, /const \[relativeSpecPath\] = testInfo\.titlePath;/);
  assert.match(runner, /not a path ending in \.spec\.ts/,
    'specFilePath() must fail loudly when the suite shape changes, not capture under a wrong name.');
});
