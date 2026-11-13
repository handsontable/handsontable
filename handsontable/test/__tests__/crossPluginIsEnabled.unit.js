import { readdirSync, readFileSync } from 'fs';
import { join, relative, resolve, sep } from 'path';

/**
 * Code that asks another plugin whether it RUNS reads `.enabled`, never `isEnabled()`.
 *
 * `isEnabled()` reads the plugin's option. A plugin a license key leaves out keeps its option
 * (DEV-3658), so `isEnabled()` answers `true` while the plugin never ran `enablePlugin()`: ColumnSummary
 * then had no endpoints and an XLSX export threw, and an import wrote live formulas for a Formulas
 * plugin that was not there. `.enabled` is set by `enablePlugin()` and says whether the plugin runs.
 *
 * The scan reports every `.isEnabled()` call in `src/` whose receiver is not `this` or `super` (a
 * plugin asking about itself), outside tests and comments. A read that really means the option goes
 * in `ALLOWED` with its reason, and each entry must still match one line, so a stale one fails too.
 */

const SRC = resolve(__dirname, '..', '..', 'src');

const ALLOWED = [
  {
    file: 'plugins/loading/loading.ts',
    line: 'if (this.#dialogPlugin?.enabled && !this.#dialogPlugin.isEnabled()) {',
    // In `disablePlugin()`: once Loading released its requirement, Loading asks whether the `dialog`
    // option or another requirer still keeps Dialog on, and turns a running Dialog off when nothing does.
    reason: 'reads whether Dialog should run, after checking that it runs',
  },
];

/**
 * Lists the `.isEnabled()` calls of one line of code whose receiver is another object.
 *
 * @param {string} line One source line, comments included.
 * @returns {number} How many such calls the line holds.
 */
function countForeignIsEnabledCalls(line) {
  const trimmed = line.trim();

  if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
    return 0;
  }

  const code = line.replace(/\s\/\/.*$/, '');
  const calls = [...code.matchAll(/\??\.isEnabled\(\)/g)];

  return calls.filter(({ index }) => !/(^|[^\w$#.])(this|super)$/.test(code.slice(0, index))).length;
}

/**
 * Walks `src/` for the source files the scan reads.
 *
 * @param {string} dir The directory to walk.
 * @returns {string[]} Absolute file paths.
 */
function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : sourceFiles(path);
    }

    return /\.(ts|js)$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [path] : [];
  });
}

describe('reads of another plugin\'s state', () => {
  it('should tell a read of another plugin from a plugin asking about itself', () => {
    expect(countForeignIsEnabledCalls('if (this.hot.getPlugin(\'autoRowSize\')?.isEnabled()) {')).toBe(1);
    expect(countForeignIsEnabledCalls('const on = plugin.isEnabled() && other?.isEnabled();')).toBe(2);
    expect(countForeignIsEnabledCalls('if (!this.#dialogPlugin?.isEnabled()) {')).toBe(1);
    expect(countForeignIsEnabledCalls('if (this.isEnabled()) {')).toBe(0);
    expect(countForeignIsEnabledCalls('return super.isEnabled() && ok;')).toBe(0);
    expect(countForeignIsEnabledCalls('   * Reads `plugin.isEnabled()` in a comment.')).toBe(0);
    expect(countForeignIsEnabledCalls('  isEnabled(): boolean {')).toBe(0);
  });

  it('should use `.enabled`, not `isEnabled()`, to ask whether another plugin runs', () => {
    const found = [];

    sourceFiles(SRC).forEach((file) => {
      const path = relative(SRC, file).split(sep).join('/');

      readFileSync(file, 'utf8').split('\n').forEach((line, index) => {
        if (countForeignIsEnabledCalls(line) === 0) {
          return;
        }

        const allowed = ALLOWED.some(entry => entry.file === path && line.trim() === entry.line);

        if (!allowed) {
          found.push(`${path}:${index + 1}: ${line.trim()}`);
        }
      });
    });

    // A plugin a license key keeps off keeps its option on, so `isEnabled()` answers true while it never
    // started. Read `.enabled`, or add the line to ALLOWED with the reason it means the option.
    expect(found).toEqual([]);
  });

  it('should still find every allowed line', () => {
    ALLOWED.forEach(({ file, line }) => {
      const lines = readFileSync(join(SRC, file), 'utf8').split('\n').map(text => text.trim());

      expect(`${file}: ${lines.filter(text => text === line).length}`).toBe(`${file}: 1`);
    });
  });
});
