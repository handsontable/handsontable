import { execFileSync } from 'child_process';
import { resolve } from 'path';

const HOT_DIR = resolve(__dirname, '../..');
const RULE = 'handsontable/no-fixed-sleep-in-spec';

// Test files the frozen-tier override must cover: every Jasmine spec and every Jest unit test, in
// both languages, wherever it lives — `src/**/__tests__/`, walkontable's `test/`, SheetClip's `test/`.
const TEST_FILES = [
  'src/helpers/__tests__/function.unit.ts',
  'src/helpers/__tests__/dateTime.unit.js',
  'src/plugins/filters/__tests__/filtersUI.spec.js',
  'src/3rdparty/walkontable/test/unit/viewport/workspaceSize.unit.ts',
  'src/3rdparty/walkontable/test/spec/scroll/scroll.spec.js',
  'src/3rdparty/SheetClip/test/SheetClip.unit.ts',
];
// Not tests: the rule must stay off, or a source-side timer would warn as a "fixed sleep in a spec".
const NON_TEST_FILES = [
  'src/helpers/function.ts',
  'src/core.ts',
  'test/helpers/common.js',
];

/**
 * Resolve the rule's configured level for each path through ESLint's own cascading config
 * resolution, in a child Node process. In-process would be simpler, but loading the config
 * pulls in `@typescript-eslint/parser`, whose ESM dependencies Jest's module loader refuses.
 *
 * @param {string[]} files Paths relative to the handsontable package.
 * @returns {{[key: string]: string|null}} The rule's severity per path, `null` where it is not configured.
 */
function ruleLevels(files) {
  const script = [
    'const { ESLint } = require("eslint");',
    'const eslint = new ESLint({ cwd: process.cwd() });',
    'Promise.all(process.argv.slice(1).map(async(file) => {',
    '  const config = await eslint.calculateConfigForFile(file);',
    `  return [file, config.rules[${JSON.stringify(RULE)}] ? config.rules[${JSON.stringify(RULE)}][0] : null];`,
    '})).then(entries => console.log(JSON.stringify(Object.fromEntries(entries))));',
  ].join('\n');
  const output = execFileSync(process.execPath, ['-e', script, '--', ...files], { cwd: HOT_DIR, encoding: 'utf8' });

  return JSON.parse(output);
}

/**
 * The frozen-tier determinism rule is switched on by one override in `handsontable/.eslintrc.js`,
 * and only the file patterns that override names are covered: the 217 `*.unit.ts` files sat
 * outside it until review found `src/helpers/__tests__/function.unit.ts` carrying eleven `sleep()`
 * calls the rule never saw, while the same source saved as `.unit.js` warned. This pins the
 * override's reach in both directions.
 */
describe('the frozen-tier determinism rule scope (handsontable/.eslintrc.js)', () => {
  const levels = ruleLevels([...TEST_FILES, ...NON_TEST_FILES]);

  it.each(TEST_FILES)('is on, at warn, in %s', (file) => {
    expect(levels[file]).toBe('warn');
  });

  it.each(NON_TEST_FILES)('is off in %s, which is not a test file', (file) => {
    expect(levels[file]).toBeNull();
  });
});
