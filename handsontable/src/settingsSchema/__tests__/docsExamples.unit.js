import { readdirSync, readFileSync } from 'fs';
import { deserialize, serialize } from 'v8';
import { join, relative, resolve } from 'path';
import ts from 'typescript';
import Handsontable from 'handsontable';
import { validateSettings } from 'handsontable/settingsSchema';

// Runs every JavaScript example of the documentation guides with a `Handsontable` constructor
// that records its settings instead of building a grid, and checks each recorded configuration.
// A documented configuration is valid by definition, so any problem here is a false positive of
// `validateSettings()` (or an example that really is wrong and needs fixing).
//
// The examples are read at run time, so the Unit filter in `checks.yml` names them
// (`docs/content/guides/**/javascript/example*.js`): a docs-only pull request that changes one runs
// this file.

const GUIDES_DIR = resolve(__dirname, '../../../../docs/content/guides');

/**
 * Problems an example has on purpose, by `<file> <path> (<code>)`, with the reason.
 */
const EXPECTED_PROBLEMS = {
  // The first column binds a property no row has, on purpose: it is an empty column that holds
  // only the row-selection checkboxes.
  'rows/row-selection/javascript/example3.js columns[0].data (unknownDataProperty)': true,
};

/**
 * Examples that build no grid, so they record no configuration, with the reason.
 */
const EXAMPLES_WITHOUT_A_GRID = {
};

/**
 * Lists the JavaScript example files under a directory.
 *
 * @param {string} dir The directory.
 * @returns {string[]}
 */
function findExamples(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return findExamples(path);
    }

    return /[\\/]javascript[\\/]example[^\\/]*\.js$/.test(path) ? [path] : [];
  });
}

/**
 * An object that answers every property read and call with itself, standing in for the grid an
 * example builds and for packages the test does not load.
 */
const inert = new Proxy((() => {}), {
  get: (target, key) => (key === Symbol.toPrimitive ? () => '' : inert),
  apply: () => inert,
  construct: () => inert,
});

describe('validateSettings over the documentation examples', () => {
  const recorded = [];
  let currentFile = null;
  const RecordingHandsontable = new Proxy(Handsontable, {
    construct(target, [, settings]) {
      recorded.push({ file: currentFile, settings });

      return inert;
    },
  });

  /**
   * Resolves an example's import.
   *
   * @param {string} specifier The module specifier.
   * @returns {object}
   */
  function requireForExample(specifier) {
    if (specifier === 'handsontable' || specifier === 'handsontable/base') {
      return { __esModule: true, default: RecordingHandsontable };
    }

    if (/\.css$/.test(specifier)) {
      return {};
    }

    if (specifier.startsWith('handsontable/') || specifier === 'hyperformula') {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      return require(specifier);
    }

    return { __esModule: true, default: inert };
  }

  const examples = findExamples(GUIDES_DIR);
  const failedToRun = [];

  beforeAll(() => {
    const { querySelector, getElementById } = document;

    // An example looks up its container and the buttons or inputs of its own markup before it
    // builds the grid. Every lookup that finds nothing gets an empty element, so no markup has to
    // be parsed into the page.
    document.querySelector = function(selector) {
      return querySelector.call(this, selector) ?? document.body.appendChild(document.createElement('div'));
    };
    document.getElementById = function(id) {
      return getElementById.call(this, id) ?? document.body.appendChild(document.createElement('div'));
    };

    examples.forEach((file) => {
      const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
      });
      const before = recorded.length;

      currentFile = relative(GUIDES_DIR, file);
      document.body.replaceChildren();

      try {
        // eslint-disable-next-line no-new-func
        new Function('require', 'module', 'exports', 'structuredClone', outputText)(
          requireForExample,
          { exports: {} },
          {},
          // jsdom does not expose `structuredClone`; Node's serializer clones the same values.
          value => deserialize(serialize(value)),
        );
      } catch (error) {
        // An example may use the grid it built (a button handler, an API call); only an example that
        // stops before it builds the grid matters here.
        if (recorded.length === before) {
          failedToRun.push(`${currentFile}: ${error.message}`);
        }
      }
    });

    document.querySelector = querySelector;
    document.getElementById = getElementById;
  });

  it('should run every example up to its grid', () => {
    expect(failedToRun).toEqual([]);
    expect(examples.length).toBeGreaterThan(0);
  });

  it('should record a configuration from every example', () => {
    const recordedFiles = new Set(recorded.map(({ file }) => file));
    const withoutConfig = examples.map(file => relative(GUIDES_DIR, file))
      .filter(file => !recordedFiles.has(file) && !EXAMPLES_WITHOUT_A_GRID[file]);

    expect(withoutConfig).toEqual([]);
  });

  it('should find no problem in any documented configuration', () => {
    const problems = recorded.flatMap(({ file, settings }) => validateSettings(settings).problems
      .filter(({ path, code }) => !EXPECTED_PROBLEMS[`${file} ${path} (${code})`])
      .map(({ path, code, message }) => `${file} ${path} (${code}): ${message}`));

    expect(problems).toEqual([]);
  });
});
