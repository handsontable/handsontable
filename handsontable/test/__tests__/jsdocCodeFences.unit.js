import { readdirSync, readFileSync } from 'fs';
import { join, relative, resolve, sep } from 'path';

/**
 * The API reference is generated from the JSDoc blocks of the core source. A fenced code block
 * that is opened in a block but never closed swallows everything the generator emits after it:
 * the next option or method renders inside the code block, so it gets no heading and no anchor.
 * That broke the `filterValueComparator` section of the API reference in 19.0.0-rc7, and swallowed
 * another heading in 18.1.3.
 *
 * A fence line that carries a language (```` ```js ````) opens a block. A bare fence line closes the
 * open one. Counting fence lines is not enough: in Markdown a fence line with a language inside an
 * open block is content, not a closer, so a block with an unclosed ```` ```jsx ```` followed by a
 * ```` ```ts ```` still holds an even number of fence lines and swallows the second example.
 * The scan therefore walks each block line by line.
 */

const REPO_ROOT = resolve(__dirname, '../..', '..');
const CORE_SRC = 'handsontable/src';

// Test code and test helpers are not API documentation.
const SKIPPED_DIR_NAMES = ['__tests__', 'test', 'node_modules'];

// A comment line that starts with a code fence, as in ` * ```js` or ` * ```` ` (the info string is captured).
const FENCE_LINE = /^\s*\*\s*```(\S*)/;
// A JSDoc block, from its opening `/**` to the first closing `*/`.
const JSDOC_BLOCK = /\/\*\*[\s\S]*?\*\//g;

/**
 * Lists the source files under `dir`, recursively. Test folders and declaration files are skipped.
 *
 * @param {string} dir Directory to walk, relative to the repository root.
 * @returns {string[]} Repository-relative paths, using forward slashes.
 */
function walk(dir) {
  const found = [];
  const queue = [resolve(REPO_ROOT, dir)];

  while (queue.length > 0) {
    const current = queue.pop();

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);

      if (entry.isDirectory()) {
        if (!SKIPPED_DIR_NAMES.includes(entry.name)) {
          queue.push(path);
        }
      } else if (/\.(ts|js)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
        found.push(relative(REPO_ROOT, path).split(sep).join('/'));
      }
    }
  }

  return found;
}

/**
 * Describes what is wrong with the fences of one JSDoc block.
 *
 * @param {string} block The text of one JSDoc block.
 * @returns {string|null} A description of the first defect, or `null` when every fence closes.
 */
function describeFenceDefect(block) {
  const lines = block.split('\n');
  let openedAt = -1;

  for (let index = 0; index < lines.length; index++) {
    const match = FENCE_LINE.exec(lines[index]);

    if (match) {
      if (openedAt === -1) {
        openedAt = index;
      } else if (match[1] !== '') {
        return `\`\`\`${match[1]} at block line ${index + 1} sits inside the fence opened at line ${openedAt + 1}`;
      } else {
        openedAt = -1;
      }
    }
  }

  return openedAt === -1 ? null : `the fence opened at block line ${openedAt + 1} is never closed`;
}

/**
 * Finds the JSDoc blocks of one source text whose code fences do not close.
 *
 * @param {string} source The source text.
 * @param {string} file The name to report the finding under.
 * @returns {string[]} Findings as `<file>:<line>: <defect>`, where the line is the block's first line.
 */
function findFenceDefectsInSource(source, file) {
  const findings = [];

  for (const match of source.matchAll(JSDOC_BLOCK)) {
    const defect = describeFenceDefect(match[0]);

    if (defect !== null) {
      findings.push(`${file}:${source.slice(0, match.index).split('\n').length}: ${defect}`);
    }
  }

  return findings;
}

/**
 * Finds the JSDoc blocks whose code fences do not close, in the given files.
 *
 * @param {string[]} files Repository-relative paths to scan.
 * @returns {string[]} Findings, empty when every fence closes.
 */
function findFenceDefects(files) {
  return files.flatMap(file => findFenceDefectsInSource(readFileSync(resolve(REPO_ROOT, file), 'utf8'), file));
}

describe('JSDoc code fences', () => {
  it('should close every fenced code block in the core JSDoc comments', () => {
    const files = walk(CORE_SRC);

    expect(files.length).toBeGreaterThan(500);
    expect(findFenceDefects(files)).toEqual([]);
  });

  it('should report a block that opens a fence and never closes it', () => {
    const source = [
      'const first = 1;',
      '',
      '/**',
      ' * Description.',
      ' *',
      ' * @example',
      ' * ```js',
      ' * option: true,',
      ' */',
      'option: true,',
    ].join('\n');

    expect(findFenceDefectsInSource(source, 'sample.ts')).toEqual([
      'sample.ts:3: the fence opened at block line 5 is never closed',
    ]);
  });

  it('should report a fence with a language that sits inside an unclosed fence', () => {
    const source = [
      '/**',
      ' * ```jsx',
      ' * <HotTable />',
      ' * ```ts',
      ' * settings = {};',
      ' * ```',
      ' * ```html',
      ' * <hot-table />',
      ' * ```',
      ' */',
    ].join('\n');

    expect(findFenceDefectsInSource(source, 'sample.ts')).toEqual([
      'sample.ts:1: ```ts at block line 4 sits inside the fence opened at line 2',
    ]);
  });

  it('should accept blocks that close every fence', () => {
    const source = [
      '/**',
      ' * @example',
      ' * ```js',
      ' * option: true,',
      ' * ```',
      ' *',
      ' * ```ts',
      ' * option = true;',
      ' * ```',
      ' */',
    ].join('\n');

    expect(findFenceDefectsInSource(source, 'sample.ts')).toEqual([]);
  });
});
