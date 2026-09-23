/**
 * The vocabulary and the validation behind `visualTest()` in `../src/test-runner.ts`: which variants a
 * spec declares it renders on, and which golden prefixes that declaration produces.
 *
 * Pure and dependency-free on purpose, and deliberately free of `node:` imports as well — `../src/config.mjs`
 * proves a `.mjs` module loads under Playwright's TypeScript transform (`src/helpers.ts` imports it), and a
 * `node:` import here would break `visualTest` at collection time in every browser run. The same purity is
 * what lets `node --test` pin the rules without a browser or a bucket, the way `visual-tiers.mjs` is pinned.
 *
 * Why declarations exist at all: before them the variants a spec rendered were derived from the directory
 * it sat in, and the only way to render fewer was an ad hoc `test.skip()` at the top of the file (69 js-only
 * specs carried one, 5 cross-browser tests another shape). Nothing stated what a spec was *for*, so the
 * golden set grew from 1646 to 1676 records in nine days with no number to review. A declaration turns the
 * golden count into the sum of the declarations intersected with the tier, which a test can derive and a
 * budget can read.
 */

import { CLASSIC, CROSS_BROWSERS, JS_VARIANTS, REFERENCE_FRAMEWORK, WRAPPERS } from '../src/config.mjs';

/**
 * @typedef {object} VisualDeclaration
 * @property {string[]} themes The js variants the spec renders on — `CLASSIC` plus any of `THEMES`.
 * @property {string[]} browsers The cross-browser projects the spec renders on.
 * @property {string[]} wrappers The wrappers that hold a golden of this spec.
 * @property {string} [wrappersReason] Why those wrappers are worth their goldens; mandatory when `wrappers`
 * is non-empty.
 */

/**
 * What a spec renders when it declares nothing else: the two default themes, chromium, no wrapper.
 *
 * This is the bloat lever the whole guardrail exists for. Every spec written before the declaration landed
 * renders five js variants; a new one renders two unless its author argues for more, so a new capture costs
 * two goldens instead of five (eight in `tests/multi-frameworks/`). The two themes are the `pr` tier's, so a
 * new spec is proven on every pull request rather than first on the seed.
 */
export const DEFAULT_DECLARATION = Object.freeze({
  themes: Object.freeze(['main', 'main-dark']),
  browsers: Object.freeze(['chromium']),
  wrappers: Object.freeze([]),
});

/**
 * The shared `wrappersReason` every spec in `tests/multi-frameworks/` carries after the declaration codemod.
 *
 * The codemod's contract was that no golden record moves, so it wrote today's behavior out rather than
 * today's intent: every multi-framework spec rendered under all three wrappers, so every one of them
 * declares all three. None of those 23 declarations has been argued for yet. The constant marks them as
 * exactly that, and its name is the grep the consolidation audit runs to find the specs still owing a real
 * reason — a per-spec reason replaces it one spec at a time, and when the last one goes this constant goes
 * with it.
 */
export const WRAPPERS_REASON_UNAUDITED
  = 'Unaudited: the declaration codemod recorded the wrappers this spec already rendered under, '
  + 'not a reason to keep them. The consolidation audit replaces this with a per-spec reason.';

/**
 * The annotation type `visualTest()` attaches to every test it registers.
 *
 * `npx playwright test --list --reporter=json` reports it for every collected test, including one a
 * file-scope boolean `skip` has already excluded, so the whole suite's declarations can be read at
 * collection cost with no browser launched. The skip annotation cannot serve that purpose: the browser axis
 * uses the callback form of `test.skip`, which Playwright evaluates in a worker and never reports in
 * `--list`. Anything that reads declarations out of the suite reads this annotation.
 */
export const VISUAL_VARIANTS_ANNOTATION = 'visual-variants';

/**
 * The declaration keys, in the order a spec writes them.
 */
const DECLARATION_KEYS = ['themes', 'browsers', 'wrappers', 'wrappersReason'];

/**
 * Prefixes a validation message with the spec it came from, when the caller knows it.
 *
 * The sweep validates 111 specs in one pass, so a message that states only the rule leaves the reader
 * grepping the tree for whichever file broke it. `visualTest()` knows its own path and the sweep knows
 * the file it is reading, so both can say. The prefix is omitted rather than faked when neither does —
 * a unit test calling this module directly has no file, and an invented one would be worse than none.
 *
 * @param {string} [where] The spec path, when the caller knows it.
 * @returns {string} The prefix to put in front of the message, or an empty string.
 */
function at(where) {
  return where ? `${where}: ` : '';
}

/**
 * Validates one axis of a declaration and returns it as a plain array.
 *
 * Rejects a duplicate as well as an unknown name: a duplicated variant renders once but is counted twice by
 * anything that sums declarations, which is how a golden budget drifts away from the records it guards.
 *
 * @param {string} key The axis name, for the message.
 * @param {unknown} value What the spec declared for it.
 * @param {string[]} allowed Every name this axis accepts.
 * @param {string} [where] The spec this declaration came from, for the message.
 * @returns {string[]} The declared names, in `allowed` order.
 */
function parseAxis(key, value, allowed, where) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${at(where)}The visual declaration's "${key}" must be an array; `
      + `got ${JSON.stringify(value)}.`);
  }

  value.forEach((name) => {
    if (!allowed.includes(name)) {
      throw new Error(`${at(where)}Unknown ${key.replace(/s$/, '')} "${name}" in a visual declaration; `
        + `expected any of ${allowed.join(', ')}.`);
    }
  });

  const duplicate = value.find((name, index) => value.indexOf(name) !== index);

  if (duplicate !== undefined) {
    throw new Error(`${at(where)}Duplicate ${key.replace(/s$/, '')} "${duplicate}" in a visual declaration; `
      + 'a variant renders once but a duplicate is counted twice by anything that sums declarations.');
  }

  return allowed.filter(name => value.includes(name));
}

/**
 * Fills a spec's declaration with the defaults and rejects the shapes that would render nothing, render
 * something nobody asked for, or claim coverage the suite does not produce.
 *
 * Every rule here is a failure measured on the suite rather than a style preference:
 *
 * - An unknown name is a typo that renders nothing and deletes that variant's goldens on the next compare.
 * - An unknown key is the same failure wearing a plausible name (`theme:` for `themes:`): the axis silently
 *   falls back to the default and the spec's rendered set changes without anybody editing it.
 * - An empty axis renders the spec nowhere on that leg, which reads as a deleted golden, never as a skip.
 * - `wrappers` without `CLASSIC` cannot work: a wrapper run never sets `HOT_THEME`, and on the seed tier the
 *   wrapper goldens are the bare js render copied wholesale (`scripts/run-tests.mjs`). Declaring a wrapper
 *   while dropping the bare js render asks the copy for a file the render never wrote.
 * - `wrappers` without `wrappersReason` is how the suite got 23 wrapper-rendered specs nobody can account
 *   for; three goldens a capture is the most expensive thing a spec can ask for, so it is the one axis that
 *   has to argue for itself in the file.
 * - A `wrappersReason` with no wrappers is a half-finished trim: the prose still claims a wrapper the spec
 *   no longer renders, and the audit greps reasons.
 *
 * @param {VisualDeclaration} input The declaration as the spec wrote it.
 * @param {string} [where] The spec this declaration came from, so a failure names the file. The sweep
 * validates 111 specs in one pass, where a message stating only the rule leaves the reader grepping.
 * @returns {VisualDeclaration} The frozen, defaulted, validated declaration.
 */
export function normalizeDeclaration(input, where) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError(`${at(where)}A visual declaration must be an object, for example `
      + `{ themes: ['main', 'main-dark'], browsers: ['chromium'], wrappers: [] }; got ${JSON.stringify(input)}.`);
  }

  const unknownKey = Object.keys(input).find(key => !DECLARATION_KEYS.includes(key));

  if (unknownKey !== undefined) {
    throw new Error(`${at(where)}Unknown key "${unknownKey}" in a visual declaration; expected any of `
      + `${DECLARATION_KEYS.join(', ')}. A misspelled key falls back to the default and silently changes `
      + 'what the spec renders.');
  }

  const themes = parseAxis('themes', input.themes ?? DEFAULT_DECLARATION.themes, JS_VARIANTS, where);
  const browsers = parseAxis('browsers', input.browsers ?? DEFAULT_DECLARATION.browsers, CROSS_BROWSERS, where);
  const wrappers = parseAxis('wrappers', input.wrappers ?? DEFAULT_DECLARATION.wrappers, WRAPPERS, where);
  const wrappersReason = input.wrappersReason;

  if (themes.length === 0) {
    throw new Error(`${at(where)}A visual declaration needs at least one theme; an empty "themes" renders `
      + `the spec nowhere and reads as a deleted golden. Use [${JS_VARIANTS.map(t => `'${t}'`).join(', ')}] `
      + 'or a subset.');
  }

  if (browsers.length === 0) {
    throw new Error(`${at(where)}A visual declaration needs at least one browser; an empty "browsers" `
      + 'renders the spec nowhere and reads as a deleted golden. Use '
      + `[${CROSS_BROWSERS.map(b => `'${b}'`).join(', ')}] or a subset.`);
  }

  if (wrappers.length > 0 && !themes.includes(CLASSIC)) {
    throw new Error(`${at(where)}A visual declaration with wrappers must include the "${CLASSIC}" theme: a `
      + 'wrapper run never sets HOT_THEME, and on the seed tier the wrapper goldens are the bare js render '
      + `copied. Add '${CLASSIC}' to "themes" or empty "wrappers".`);
  }

  if (wrappers.length > 0 && (typeof wrappersReason !== 'string' || wrappersReason.trim() === '')) {
    throw new Error(`${at(where)}A visual declaration with wrappers needs a "wrappersReason": each wrapper `
      + 'is one more golden per capture, so say what the wrapper render proves that the js render does not.');
  }

  if (wrappers.length === 0 && wrappersReason !== undefined) {
    throw new Error(`${at(where)}A visual declaration has a "wrappersReason" but no wrappers; drop the `
      + 'reason, or restore the wrappers it describes.');
  }

  return Object.freeze({
    themes: Object.freeze(themes),
    browsers: Object.freeze(browsers),
    wrappers: Object.freeze(wrappers),
    ...(wrappers.length > 0 ? { wrappersReason } : {}),
  });
}

/**
 * Whether a declaration covers the framework and theme a run is rendering.
 *
 * The js pass consults the theme axis and the wrapper pass does not: a wrapper run always renders bare (it
 * sets `HOT_FRAMEWORK` and never `HOT_THEME`), so asking it about themes would skip every wrapper whose
 * spec dropped `CLASSIC` — a state `normalizeDeclaration()` already rejects, but the asymmetry is the
 * reason the two branches read different axes. The browser axis is separate because only the cross-browser
 * config has more than one project, and its value reaches a spec through a fixture, never through the
 * environment.
 *
 * @param {VisualDeclaration} declaration A normalized declaration.
 * @param {object} run The variant being rendered.
 * @param {string} run.framework `HOT_FRAMEWORK`, defaulted to `js` — `helpers.hotWrapper`.
 * @param {string} run.theme `HOT_THEME`, or `CLASSIC` when it is unset — `helpers.hotTheme || CLASSIC`.
 * @returns {boolean} `true` when this run is one the spec declared.
 */
export function isDeclared(declaration, { framework, theme }) {
  if (framework === REFERENCE_FRAMEWORK) {
    return declaration.themes.includes(theme);
  }

  return declaration.wrappers.includes(framework);
}

/**
 * The screenshot-relative directory prefixes a declaration's goldens sit under.
 *
 * The third hand-written mirror of `helpers.screenshotPath()`, after `tierPrefixes()` in `visual-tiers.mjs`,
 * and pinned against it the same way: a tier can never render a prefix no declaration can name, and a
 * declaration can never name a prefix no tier renders.
 *
 * `crossBrowser` is an argument rather than something read off the declaration because the two legs are
 * split by directory, not by content: `playwright.config.ts` ignores `tests/cross-browser/**` and runs one
 * chromium project, while `playwright-cross-browser.config.ts` runs only that directory and sets neither
 * `HOT_THEME` nor `HOT_FRAMEWORK`. Both legs therefore declare `chromium`, and the same declaration lands
 * under `js/chromium/` in one and `cross-browser/chromium/` in the other.
 *
 * @param {VisualDeclaration} declaration A normalized declaration.
 * @param {object} [options] Where the spec lives.
 * @param {boolean} [options.crossBrowser=false] Whether the spec sits under `tests/cross-browser/`.
 * @returns {string[]} The prefixes, each ending in `/`, in golden-layout order.
 */
export function declaredPrefixes(declaration, { crossBrowser = false } = {}) {
  if (crossBrowser) {
    return declaration.browsers.map(browser => `cross-browser/${browser}/`);
  }

  const prefixes = [];

  if (declaration.themes.includes(CLASSIC)) {
    prefixes.push(`${REFERENCE_FRAMEWORK}/chromium/`);
  }

  declaration.themes.filter(theme => theme !== CLASSIC).forEach((theme) => {
    prefixes.push(`${REFERENCE_FRAMEWORK}/chromium-theme-${theme}/`);
  });

  declaration.wrappers.forEach((wrapper) => {
    prefixes.push(`${wrapper}/chromium/`);
  });

  return prefixes;
}

/**
 * The prefixes a declaration actually renders in one tier — the declaration intersected with what the tier
 * launches.
 *
 * This is the arithmetic behind "the golden set is the sum of the declarations": summing a spec's captures
 * over this list, for every spec, is the record count a tier produces.
 *
 * @param {VisualDeclaration} declaration A normalized declaration.
 * @param {string[]} tierPrefixList The tier's prefixes, from `tierPrefixes()` in `visual-tiers.mjs`.
 * @param {object} [options] Where the spec lives.
 * @param {boolean} [options.crossBrowser=false] Whether the spec sits under `tests/cross-browser/`.
 * @returns {string[]} The prefixes both the declaration and the tier name, in golden-layout order.
 */
export function renderedPrefixes(declaration, tierPrefixList, { crossBrowser = false } = {}) {
  return declaredPrefixes(declaration, { crossBrowser }).filter(prefix => tierPrefixList.includes(prefix));
}

/**
 * Rejects a declaration that names a variant its leg cannot render.
 *
 * Over-declaration is silent, which is what makes it worth a hard error rather than a review note. The main
 * Playwright config has a single `chromium` project and ignores `tests/cross-browser/**`, so a js-only spec
 * that declared `firefox` would render nothing extra; the cross-browser leg sets neither `HOT_THEME` nor
 * `HOT_FRAMEWORK`, so a cross-browser spec that declared `horizon` or a wrapper would render nothing extra
 * either. In both cases the suite stays green, the goldens stay where they were, and every count derived
 * from the declarations is too high from then on.
 *
 * Kept separate from `normalizeDeclaration()` because nothing at file scope knows which directory a spec
 * sits in — a cross-browser spec's title is a plain string, not `__filename`. The static sweep in
 * `__tests__/visual-declarations.test.mjs` walks the tree and calls this per file.
 *
 * Every message names the spec, through the same {@link at} prefix `normalizeDeclaration()` uses. The
 * caller is a sweep over 111 files, so a message that only restates the rule leaves the reader grepping
 * the tree for which file broke it — and the rule is the half they can already read here.
 *
 * @param {VisualDeclaration} declaration A normalized declaration.
 * @param {object} leg Where the spec lives.
 * @param {boolean} leg.crossBrowser Whether the spec sits under `tests/cross-browser/`.
 * @param {string} [leg.where] The spec path, for the message.
 * @returns {void} Throws when the declaration names a variant the leg does not render.
 */
export function assertDeclarationFitsLeg(declaration, { crossBrowser, where }) {
  if (crossBrowser) {
    if (declaration.themes.length !== 1 || !declaration.themes.includes(CLASSIC)) {
      throw new Error(`${at(where)}a spec under tests/cross-browser/ renders bare, so its "themes" must be `
        + `['${CLASSIC}']; got [${declaration.themes.join(', ')}]. The leg sets no HOT_THEME, so a theme `
        + 'named here renders nothing and only inflates the derived golden count.');
    }

    if (declaration.wrappers.length > 0) {
      throw new Error(`${at(where)}a spec under tests/cross-browser/ renders no wrapper, so its "wrappers" `
        + `must be empty; got [${declaration.wrappers.join(', ')}]. The leg sets no HOT_FRAMEWORK, so a `
        + 'wrapper named here renders nothing and only inflates the derived golden count.');
    }

    return;
  }

  if (declaration.browsers.length !== 1 || !declaration.browsers.includes('chromium')) {
    throw new Error(`${at(where)}a spec outside tests/cross-browser/ runs on the main Playwright config, `
      + 'which has one chromium project, so its "browsers" must be [\'chromium\']; got '
      + `[${declaration.browsers.join(', ')}]. A browser named here renders nothing and only inflates the `
      + 'derived golden count.');
  }
}
