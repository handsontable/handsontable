/**
 * Decides which js screenshots the seed tier copies into which wrapper directory: each spec's own captures,
 * into the wrappers that spec declares, and nothing else.
 *
 * The seed never renders a wrapper. It renders the js demo and copies the bare js render into the wrapper
 * baselines (the js-copied-baseline gotcha in `../AGENTS.md`), and every other tier is compared against an
 * exact subset of that seed. Until DEV-3351 the copy took the whole `js/chromium/multi-frameworks`
 * directory, which equals the declarations only while every spec there declares all three wrappers. A
 * spec that declares fewer would get wrapper goldens the `full` tier then skips, and the nightly would
 * report them deleted every night. So the copy follows the declarations, spec by spec.
 *
 * The declarations come from `npx playwright test --list --reporter=json`: `visualTest()` attaches each one
 * as a `visual-variants` annotation, which `--list` reports for every collected test, including one the
 * current variant skips, with no browser launched. The spec path comes from the ENCLOSING file suite's
 * `file`, never from a test's own `spec.file`: `visualTest()` registers every test, so Playwright records
 * `../src/test-runner.ts` as the location of all of them.
 *
 * The planning half is pure, so `__tests__/wrapper-copy.test.mjs` pins it without a browser; the two
 * file-system helpers are what `../scripts/run-tests.mjs` calls around it.
 */

import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, posix, relative, sep } from 'node:path';
import { CLASSIC, REFERENCE_FRAMEWORK, WRAPPERS } from '../src/config.mjs';
import { VISUAL_VARIANTS_ANNOTATION } from './visual-declarations.mjs';

/**
 * The directory, relative to the screenshots root, that holds the bare js render the seed copies from.
 * A wrapper run never sets `HOT_THEME`, so the bare render is the only js variant a wrapper golden can be.
 */
export const BARE_JS_DIRECTORY = `${REFERENCE_FRAMEWORK}/chromium`;

/**
 * Escapes a string for use inside a regular expression.
 *
 * @param {string} value The literal text.
 * @returns {string} The text with every regular-expression metacharacter escaped.
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Every test object under a suite, nested `describe` suites included.
 *
 * @param {object} suite A suite of Playwright's JSON report.
 * @returns {object[]} The tests, in report order.
 */
function testsOf(suite) {
  return [
    ...(suite.specs ?? []).flatMap(spec => spec.tests ?? []),
    ...(suite.suites ?? []).flatMap(testsOf),
  ];
}

/**
 * Reads each spec's declaration out of the JSON report of `npx playwright test --list --reporter=json`.
 *
 * Refuses rather than guesses, because what it returns decides which goldens the seed writes:
 *
 * - A report with collection errors means a spec did not load, so its captures would go uncopied and read
 *   as deleted wrapper goldens on the next compare.
 * - A test with no `visual-variants` annotation was not registered through `visualTest()`, so nothing says
 *   which wrappers own its captures.
 * - Two different declarations in one file cannot both describe what renders (both skips are file-scope
 *   modifiers), and the copy would have to pick one.
 *
 * @param {object} report The parsed JSON report.
 * @returns {Map<string, object>} The declaration of each spec, keyed by its path relative to the tests root,
 * with forward slashes.
 */
export function declarationsFromListReport(report) {
  if (!report || !Array.isArray(report.suites)) {
    throw new Error('The `--list --reporter=json` report has no `suites` array, so no spec declaration can '
      + 'be read from it. Was it the JSON reporter\'s output?');
  }

  if (Array.isArray(report.errors) && report.errors.length > 0) {
    const messages = report.errors.map(error => error.message ?? JSON.stringify(error)).join('\n');

    throw new Error('Playwright reported collection errors, so some spec did not load and its captures '
      + `would not be copied into the wrapper baselines:\n${messages}`);
  }

  const declarations = new Map();

  report.suites.forEach((fileSuite) => {
    const specPath = String(fileSuite.file ?? '').replace(/\\/g, '/');

    if (!specPath.endsWith('.spec.ts')) {
      throw new Error(`A top-level suite of the report has the file ${JSON.stringify(fileSuite.file)}, not a `
        + 'path ending in .spec.ts. The copy keys every golden on the spec file, so it cannot tell which '
        + 'spec these tests belong to.');
    }

    const seen = new Set();

    testsOf(fileSuite).forEach((testEntry) => {
      const annotation = (testEntry.annotations ?? [])
        .find(entry => entry.type === VISUAL_VARIANTS_ANNOTATION);

      if (!annotation) {
        throw new Error(`${specPath}: a test carries no "${VISUAL_VARIANTS_ANNOTATION}" annotation, so it was `
          + 'not registered through visualTest() and nothing says which wrappers own its captures.');
      }

      seen.add(annotation.description);
    });

    if (seen.size === 0) {
      return;
    }

    if (seen.size > 1) {
      throw new Error(`${specPath} holds ${seen.size} different visual declarations. Both skips are file-scope `
        + 'modifiers, so the file renders only what all of them name, and the copy cannot pick one.');
    }

    const [description] = seen;
    let declaration;

    try {
      declaration = JSON.parse(description);
    } catch (error) {
      throw new Error(`${specPath}: the "${VISUAL_VARIANTS_ANNOTATION}" annotation is not JSON `
        + `(${error.message}).`);
    }

    declarations.set(specPath, declaration);
  });

  return declarations;
}

/**
 * Plans the seed's wrapper copy: one entry per capture of a spec that declares wrappers, per wrapper it
 * declares.
 *
 * A spec's captures are `<stem>-<N>.png`, where the stem is the spec path without `.spec.ts`
 * (`helpers.screenshotPath()`), so they are matched by exact name and never by prefix: `undo-1.png` is
 * not a capture of `undo-multiline-text`, and `undo-multiline-text-1.png` is not one of `undo`.
 *
 * Throws on a spec that declares wrappers and left no capture in the bare js render: the wrapper
 * baselines would lose every golden of that spec while the `full` tier keeps rendering it, which is the
 * nightly-deletion shape this module exists to prevent, so it fails the seed instead.
 *
 * @param {Map<string, object>} declarations Each spec's declaration, from `declarationsFromListReport()`.
 * @param {string[]} renderedFiles The bare js render, as paths relative to `BARE_JS_DIRECTORY` with
 * forward slashes.
 * @returns {{ source: string, target: string, spec: string, wrapper: string }[]} The copies, as paths
 * relative to the screenshots root with forward slashes, sorted by target.
 */
export function wrapperCopyPlan(declarations, renderedFiles) {
  const plan = [];

  declarations.forEach((declaration, specPath) => {
    const wrappers = Array.isArray(declaration?.wrappers) ? declaration.wrappers : [];

    if (wrappers.length === 0) {
      return;
    }

    wrappers.forEach((wrapper) => {
      if (!WRAPPERS.includes(wrapper)) {
        throw new Error(`${specPath} declares the wrapper "${wrapper}", which is not one of `
          + `${WRAPPERS.join(', ')}.`);
      }
    });

    if (!Array.isArray(declaration.themes) || !declaration.themes.includes(CLASSIC)) {
      throw new Error(`${specPath} declares wrappers without the "${CLASSIC}" theme. The wrapper goldens are `
        + 'the bare js render copied, so a spec without that render has nothing to copy.');
    }

    const stem = specPath.replace(/\.spec\.ts$/, '');
    const directory = posix.dirname(stem);
    const capture = new RegExp(`^${escapeRegExp(posix.basename(stem))}-\\d+\\.png$`);
    const captures = renderedFiles.filter(file => posix.dirname(file) === directory
      && capture.test(posix.basename(file)));

    if (captures.length === 0) {
      throw new Error(`${specPath} declares the wrappers ${wrappers.join(', ')}, and the bare js render left `
        + `no ${stem}-<N>.png under ${BARE_JS_DIRECTORY}/. Copying nothing would delete that spec's wrapper `
        + 'goldens on this seed while the full tier keeps rendering them. Did the bare js run render it?');
    }

    wrappers.forEach((wrapper) => {
      captures.forEach((file) => {
        plan.push({
          source: `${BARE_JS_DIRECTORY}/${file}`,
          target: `${wrapper}/chromium/${file}`,
          spec: specPath,
          wrapper,
        });
      });
    });
  });

  return plan.sort((a, b) => a.target.localeCompare(b.target));
}

/**
 * Lists the files under a directory, recursively, as paths relative to it with forward slashes.
 *
 * @param {string} directory The directory to walk.
 * @returns {string[]} The relative paths, sorted.
 */
export function listFiles(directory) {
  const walk = (current, out) => {
    readdirSync(current, { withFileTypes: true }).forEach((entry) => {
      const full = join(current, entry.name);

      if (entry.isDirectory()) {
        walk(full, out);
      } else if (entry.isFile()) {
        out.push(relative(directory, full).split(sep).join('/'));
      }
    });

    return out;
  };

  return walk(directory, []).sort();
}

/**
 * Carries out a plan from `wrapperCopyPlan()` under a screenshots root.
 *
 * @param {string} screenshotsDirectory The screenshots root (`visual-tests/screenshots`).
 * @param {{ source: string, target: string }[]} plan The copies.
 * @returns {void}
 */
export function copyWrapperPlan(screenshotsDirectory, plan) {
  plan.forEach(({ source, target }) => {
    const destination = join(screenshotsDirectory, ...target.split('/'));

    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(screenshotsDirectory, ...source.split('/')), destination);
  });
}
