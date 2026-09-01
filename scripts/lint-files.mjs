/**
 * Shared ESLint runner for the local git hooks (pre-commit + pre-push).
 *
 * The hook must be a strict SUBSET of CI — it lints only files that fall inside a
 * package's actual CI lint scope, and never more. Anything else risks a false
 * block on files CI deliberately does not lint (e.g. `.eslintrc.js` itself, which
 * carries pre-existing max-len violations because no lint task covers it).
 *
 * Scope sources of truth:
 *   handsontable  tasks.json lint:eslint  → src/ test/ .config/plugin scripts/
 *   vue3          package.json lint       → src test
 *   tests         package.json lint       → e2e fixtures
 *   root          package.json eslint     → .github/scripts/ bin/changelog scripts/
 *   react / angular / docs — no plain-eslint script → not linted by the hook.
 *
 * Dot-directories and dotfiles are excluded even when inside a scope: ESLint
 * ignores them by default when passed as individual file paths (CI passes the
 * *directory*, which overrides the ignore), so per-file linting would either
 * warn-and-skip or apply rules CI never applies.
 *
 * eslint exit codes: 0 = clean, 1 = lint errors (block), 2 = config/parse gap
 * (do not block).
 */
import { spawnSync } from 'node:child_process';

// npx is a .cmd shim on Windows; spawnSync needs a shell there or it ENOENTs.
const WIN = process.platform === 'win32';

const SCOPES = [
  /^handsontable\/(src|test|scripts)\//,
  /^wrappers\/vue3\/(src|test)\//,
  /^tests\/(e2e|fixtures)\//,
  /^scripts\//,
];
const LINTABLE = /\.(js|ts|mjs|tsx|vue)$/;
// Any dotfile or dot-directory segment (".eslintrc.js", ".config/…", ".github/…").
const DOT_SEGMENT = /(^|\/)\.[^/]+(\/|$)/;
// Paths that sit inside a scope directory but that the owning package's own
// `.eslintignore` excludes. The hook runs ESLint from the repo root, where that
// ignore file does not apply, so without this the hook lints a file CI never lints —
// exactly the false block this module exists to prevent. The figma templates are
// verbatim TS stencils outside any tsconfig project, so ESLint answers with a
// PARSING error; that is reported as a lint error (exit 1), not as the config gap
// (exit 2) `runEslint` tolerates, and it would block the commit.
const PACKAGE_IGNORED = [
  // handsontable/.eslintignore: "Verbatim TS stencil copied into generated theme
  // output; not lintable source."
  /^handsontable\/scripts\/themes\/figma\/templates\//,
];

/**
 * Keep only files the hook may lint: lintable extension, inside a CI lint scope, not
 * under a dotfile/dot-directory path, and not excluded by the owning package.
 *
 * @param {string[]} files Repo-relative paths.
 * @returns {string[]} The safe-to-lint subset (a strict subset of what CI lints).
 */
export function lintable(files) {
  return files.filter(f => LINTABLE.test(f)
    && !DOT_SEGMENT.test(f)
    && !PACKAGE_IGNORED.some(ignored => ignored.test(f))
    && SCOPES.some(scope => scope.test(f)));
}

/**
 * Run ESLint over the given files. Blocks only on genuine lint errors.
 *
 * @param {string[]} files Files to lint (already filtered with `lintable`).
 * @param {{ fix?: boolean, cwd?: string }} [opts] `fix` applies `--fix`; `cwd`
 *   anchors the run (files are repo-relative, so pass the repo root when the
 *   caller may run from elsewhere).
 * @returns {number} 1 if ESLint reported lint errors (caller should block), else 0.
 */
export function runEslint(files, { fix = false, cwd } = {}) {
  if (files.length === 0) {
    return 0;
  }
  const args = ['eslint', ...(fix ? ['--fix'] : []), ...files];
  const res = spawnSync('npx', args, { stdio: 'inherit', shell: WIN, ...(cwd ? { cwd } : {}) });

  // 1 = lint errors → block. 2 = config/parse gap on some file → do not block
  // (that is tooling, not the author's fault; CI's full lint is authoritative).
  return res.status === 1 ? 1 : 0;
}
