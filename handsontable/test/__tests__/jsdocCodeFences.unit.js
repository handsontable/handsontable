import { readdirSync, readFileSync } from 'fs';
import { join, relative, resolve, sep } from 'path';

/**
 * The API reference is generated from the JSDoc blocks of the core source. A fenced code block
 * that is opened in a block but never closed swallows everything the generator emits after it:
 * the next option or method renders inside the code block, so it gets no heading and no anchor.
 * That broke the `filterValueComparator` page section in 19.0.0-rc7, and swallowed another
 * heading in 18.1.3.
 *
 * Each JSDoc block must hold an even number of fence lines.
 */

const REPO_ROOT = resolve(__dirname, '../..', '..');
const CORE_SRC = 'handsontable/src';

// Vendored output rather than authored source.
const SKIPPED_DIRS = [
  join('handsontable', 'src', '3rdparty', 'walkontable', 'dist'),
];

// A comment line that starts with a code fence, as in ` * ```js` or ` * ```ts`.
const FENCE_LINE = /^\s*\*\s*```/;
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
      const relativePath = relative(REPO_ROOT, path);

      if (SKIPPED_DIRS.includes(relativePath) || entry.name === '__tests__' || entry.name === 'node_modules') {
        continue;
      }

      if (entry.isDirectory()) {
        queue.push(path);
      } else if (/\.(ts|js)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
        found.push(relativePath.split(sep).join('/'));
      }
    }
  }

  return found;
}

/**
 * Finds the JSDoc blocks of one source text that hold an odd number of code fence lines.
 *
 * @param {string} source The source text.
 * @param {string} file The name to report the finding under.
 * @returns {string[]} Findings as `<file>:<line>: <fence count> fence lines`.
 */
function findUnbalancedFencesInSource(source, file) {
  const findings = [];

  for (const match of source.matchAll(JSDOC_BLOCK)) {
    const fenceCount = match[0].split('\n').filter(line => FENCE_LINE.test(line)).length;

    if (fenceCount % 2 !== 0) {
      const line = source.slice(0, match.index).split('\n').length;

      findings.push(`${file}:${line}: ${fenceCount} fence lines`);
    }
  }

  return findings;
}

/**
 * Finds the JSDoc blocks with an odd number of code fence lines in the given files.
 *
 * @param {string[]} files Repository-relative paths to scan.
 * @returns {string[]} Findings, empty when everything is balanced.
 */
function findUnbalancedFences(files) {
  return files.flatMap(file => findUnbalancedFencesInSource(readFileSync(resolve(REPO_ROOT, file), 'utf8'), file));
}

describe('JSDoc code fences', () => {
  it('should close every fenced code block in the core JSDoc comments', () => {
    const files = walk(CORE_SRC);

    expect(files.length).toBeGreaterThan(500);
    expect(findUnbalancedFences(files)).toEqual([]);
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

    expect(findUnbalancedFencesInSource(source, 'sample.ts')).toEqual(['sample.ts:3: 1 fence lines']);
  });

  it('should accept a block that closes its fence', () => {
    const source = [
      '/**',
      ' * @example',
      ' * ```js',
      ' * option: true,',
      ' * ```',
      ' */',
    ].join('\n');

    expect(findUnbalancedFencesInSource(source, 'sample.ts')).toEqual([]);
  });
});
