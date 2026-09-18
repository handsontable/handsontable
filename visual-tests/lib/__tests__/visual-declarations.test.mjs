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

// The eleven golden prefixes and their record counts, read from the live baseline on 2026-09-18:
// `curl -H 'Cache-Control: no-cache' 'https://visual.handsontable.com/base/develop/out.json?cb=1'`,
// 1676 records, all passing. Re-read it the same way before changing a number here, and say in the pull
// request why the set moved — that is the whole point of writing the numbers down.
const LIVE_GOLDENS = {
  'js/chromium/': 240,
  'js/chromium-theme-main/': 240,
  'js/chromium-theme-main-dark/': 240,
  'js/chromium-theme-horizon/': 240,
  'js/chromium-theme-horizon-dark/': 240,
  'angular-wrapper/chromium/': 92,
  'react-wrapper/chromium/': 92,
  'vue3/chromium/': 92,
  'cross-browser/chromium/': 68,
  'cross-browser/firefox/': 66,
  'cross-browser/webkit/': 66,
};
const LIVE_GOLDEN_TOTAL = 1676;

// The one spec that declares nothing: it parks a test behind `test.skip('Test merging', fn)`, renders
// no capture, and carries its own eslint-disable line naming the task that owns it.
const PARKED_SPEC = 'cross-browser/merging.spec.ts';

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

/**
 * Resolves one declaration value written in a spec: an array literal of string literals or vocabulary
 * names, or a bare vocabulary name.
 *
 * @param {string} raw The source text of the value.
 * @returns {string[] | string} The value.
 */
function resolveDeclarationValue(raw) {
  const text = raw.trim();

  if (text.startsWith('[')) {
    return text.slice(1, -1).split(',').map(part => part.trim()).filter(Boolean)
      .map(item => (/^'/.test(item) ? item.slice(1, -1) : VOCABULARY[item]));
  }

  return VOCABULARY[text];
}

/**
 * Every `visualTest()` call in one spec's source, with the declaration each one wrote.
 *
 * @param {string} source The spec file's text.
 * @returns {{ declarationSource: string, declaration: object }[]} One entry per call, in source order.
 */
function readDeclarations(source) {
  return [...source.matchAll(/visualTest\([\s\S]*?, \{\n([\s\S]*?)\n[ ]*\}, async\(/g)].map((match) => {
    const declarationSource = match[1];
    const declaration = {};

    declarationSource.split('\n').forEach((line) => {
      const property = line.trim().match(/^(\w+): (.*),$/);

      assert.ok(property, `Cannot read the declaration property from "${line.trim()}". `
        + 'Every declaration property is one `key: value,` line, so the sweep below can read it.');
      declaration[property[1]] = resolveDeclarationValue(property[2]);
    });

    return { declarationSource, declaration };
  });
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
 * @param {string} source The spec file's text.
 * @param {string} relativePath The spec path relative to `tests/`.
 * @returns {Set<string>} The stems, relative to the variant prefix.
 */
function captureStems(source, relativePath) {
  const crossBrowser = relativePath.startsWith('cross-browser/');
  // `helpers.setTestDetails()` makes the directory name relative to the run's root, and the
  // cross-browser leg's root is `tests/cross-browser` itself.
  const specDir = relativePath.replace(/\.spec\.ts$/, '').replace(crossBrowser ? /^cross-browser\// : /^$/, '');
  const urlsBlock = source.match(/const urls = \[([\s\S]*?)\];/);
  const loopedUrls = urlsBlock ? [...urlsBlock[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : null;
  const callOffsets = [...source.matchAll(/visualTest\(/g)].map(match => match.index);
  const stems = new Set();

  callOffsets.forEach((start, index) => {
    const end = index + 1 < callOffsets.length ? callOffsets[index + 1] : source.length;
    const body = source.slice(start, end);
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

test('every live spec declares its variants through visualTest', () => {
  // The rename is the enforcement's premise: a spec that still called `test()` would render on every
  // variant the tier launches while contributing nothing to the derived count below.
  const missing = specPaths().filter((relativePath) => {
    if (relativePath === PARKED_SPEC) {
      return false;
    }

    return !readFileSync(join(TESTS_ROOT, relativePath), 'utf8').includes('visualTest(');
  });

  assert.deepEqual(missing, []);
});

test('no spec scopes itself with a bare test() or a hand-written test.skip()', () => {
  // The lint override in `.eslintrc.js` is the live gate; this is the same rule stated where the rest of
  // the declaration rules live, so a future change to that override cannot quietly drop it. The parked
  // spec is the one exception and it must keep the disable line that makes it one.
  const offenders = specPaths().filter((relativePath) => {
    const source = readFileSync(join(TESTS_ROOT, relativePath), 'utf8');

    if (relativePath === PARKED_SPEC) {
      assert.match(source, /eslint-disable-next-line no-restricted-syntax -- \S+: /,
        `${PARKED_SPEC} keeps its own disable line, which is what makes its test.skip() legal.`);

      return false;
    }

    return /(?<![.\w])test\(/.test(source) || /(?<![.\w])test\.skip\(/.test(source);
  });

  assert.deepEqual(offenders, []);
});

test('every spec holds one declaration, and its leg can render it', () => {
  // A file-scope modifier applies to every test in the file, so two declarations in one file would skip
  // both tests by the union of the two and neither declaration would describe what renders.
  let specsChecked = 0;

  specPaths().forEach((relativePath) => {
    if (relativePath === PARKED_SPEC) {
      return;
    }

    const source = readFileSync(join(TESTS_ROOT, relativePath), 'utf8');
    const declarations = readDeclarations(source);
    const callCount = (source.match(/visualTest\(/g) || []).length;

    assert.equal(declarations.length, callCount,
      `${relativePath}: every visualTest() call must carry a readable declaration object.`);
    assert.ok(declarations.length >= 1, `${relativePath}: no declaration found.`);
    declarations.slice(1).forEach(({ declarationSource }) => {
      assert.equal(declarationSource, declarations[0].declarationSource,
        `${relativePath}: every visualTest() call in one file must declare the same variants.`);
    });

    assertDeclarationFitsLeg(
      normalizeDeclaration(declarations[0].declaration),
      { crossBrowser: relativePath.startsWith('cross-browser/') },
    );
    specsChecked += 1;
  });

  assert.equal(specsChecked, 111, 'The spec tree holds 112 files, one of them parked (2026-09-18).');
});

test('the declaration codemod wrote today behavior out per directory', () => {
  // The codemod's contract was that no golden record moves, which means it wrote the rendered set every
  // directory already had: five js variants everywhere, all three wrappers on the multi-framework specs
  // the seed copies wholesale, and all three browsers on the cross-browser leg except the clipboard specs
  // Chromium alone can run. A change to any of these is a change to the golden set, never a tidy-up.
  const shapes = { 'js-only': new Set(), 'multi-frameworks': new Set(), 'cross-browser': new Set() };

  specPaths().forEach((relativePath) => {
    if (relativePath === PARKED_SPEC) {
      return;
    }

    const [first] = readDeclarations(readFileSync(join(TESTS_ROOT, relativePath), 'utf8'));

    assert.ok(first, `${relativePath} declares no variants; every live spec calls visualTest().`);
    shapes[relativePath.split('/')[0]].add(JSON.stringify(normalizeDeclaration(first.declaration)));
  });

  assert.deepEqual([...shapes['js-only']], [
    JSON.stringify({ themes: JS_VARIANTS, browsers: ['chromium'], wrappers: [] }),
  ]);
  assert.deepEqual([...shapes['multi-frameworks']], [
    JSON.stringify({
      themes: JS_VARIANTS,
      browsers: ['chromium'],
      wrappers: WRAPPERS,
      wrappersReason: WRAPPERS_REASON_UNAUDITED,
    }),
  ]);
  assert.deepEqual([...shapes['cross-browser']].sort(), [
    JSON.stringify({ themes: [CLASSIC], browsers: ['chromium'], wrappers: [] }),
    JSON.stringify({ themes: [CLASSIC], browsers: CROSS_BROWSERS, wrappers: [] }),
  ].sort());
});

test('all 23 multi-framework specs carry the shared unaudited wrappers reason', () => {
  // The audit that trims those 69 wrapper goldens greps for this constant, so the constant has to be the
  // literal every one of those specs names. A per-spec reason replaces it one spec at a time.
  const carrying = specPaths()
    .filter(relativePath => relativePath.startsWith('multi-frameworks/'))
    .filter(relativePath => readFileSync(join(TESTS_ROOT, relativePath), 'utf8')
      .includes('wrappersReason: WRAPPERS_REASON_UNAUDITED,'));

  assert.equal(carrying.length, 23);
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
    const [first] = readDeclarations(source);

    assert.ok(first, `${relativePath} declares no variants, so its goldens cannot be derived. `
      + 'Every live spec renders through visualTest(title, { themes, browsers, wrappers }, fn).');

    const declaration = normalizeDeclaration(first.declaration);
    const crossBrowser = relativePath.startsWith('cross-browser/');
    const stems = captureStems(source, relativePath);

    declaredPrefixes(declaration, { crossBrowser }).forEach((prefix) => {
      perPrefix[prefix] = (perPrefix[prefix] ?? 0) + stems.size;
      total += stems.size;
    });
  });

  process.stdout.write(`golden records implied by the checked-in declarations: ${total}\n`);
  assert.deepEqual(perPrefix, LIVE_GOLDENS);
  assert.equal(total, LIVE_GOLDEN_TOTAL);
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
