/**
 * Pins what the ignore rules that apply to the core package match: no tracked file of the package, none of the
 * probes for new sources below, and no dev page at another package's root, but every output below that lands at a
 * root.
 *
 * `handsontable/.gitignore` has rules for what exists only at the package root: the build's `languages/` output and
 * the local dev pages, `dev*.html`, `dev*.js`, and `dev*.ts`. The monorepo root's `.gitignore` has `dev*.html` and
 * `dev*.js` of its own, left over from when the repository root was the package root. Git applies a rule with no
 * slash, or only a trailing one, at every depth. So until these rules gained a leading slash, `languages/` matched
 * all 21 dictionaries and the barrel in `handsontable/src/i18n/languages/`, and `dev*.js` matched
 * `handsontable/.config/development.js`. A tracked file stays tracked whatever the rules say, but a new one never
 * showed in `git status`, so a new dictionary could be left out of a commit without anyone noticing.
 *
 * The tests ask git itself, in a scratch repository that holds a copy of every `.gitignore` the checkout has, at its
 * own place, and nothing else. It lives in the tooling suite because CI runs that suite on every pull request, while
 * the core's Unit job skips a change that touches only a `.gitignore`.
 */
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { devNull, tmpdir } from 'node:os';
import path from 'node:path';
import { repoRoot } from '../../.github/scripts/lib/repo-root.mjs';

const ROOT = repoRoot();

// A git hook exports GIT_DIR, which would point every call below at the hook's repository. The checkout's own
// listings keep the rest of the environment: git reads `safe.directory`, which a checkout owned by another user needs
// (a CI container, a bind mount, a WSL `/mnt/c` checkout), from the global and system configs only.
const REPO_ENV = { ...process.env };

delete REPO_ENV.GIT_DIR;
delete REPO_ENV.GIT_WORK_TREE;
delete REPO_ENV.GIT_INDEX_FILE;

// The scratch repository answers from the copied rules alone, so it reads no global or system config, which could
// name an excludes file. The current user creates it, so it needs no `safe.directory`.
const SCRATCH_ENV = {
  ...REPO_ENV,
  GIT_CONFIG_GLOBAL: devNull,
  GIT_CONFIG_NOSYSTEM: '1',
};

// New sources whose names a rule for the package root would also match without its leading slash: a dictionary lives
// in a `languages/` directory, and a file whose name starts with `dev` is not a dev page. Each name sits at two
// depths, because a pattern such as `*/dev*.ts` reaches one level only, and one has an extension no rule names today.
const NEW_SOURCES = [
  'handsontable/src/i18n/languages/xx-XX.ts',
  'handsontable/src/languages/xx-XX.ts',
  'handsontable/src/dev-panel.ts',
  'handsontable/src/dev-panel.js',
  'handsontable/src/dev-panel.html',
  'handsontable/src/plugins/dev-panel.ts',
  'handsontable/src/plugins/dev-panel.js',
  'handsontable/src/plugins/dev-panel.html',
  'handsontable/test/helpers/dev-fixture.js',
  'handsontable/scripts/dev-report.mjs',
  'handsontable/.config/dev-server.js',
];
// What lands at a root and must stay ignored. `build:languages` writes the UMD files and copies `all.js` to
// `index.js`, and `build:languages.es` writes the `.mjs` files. The `handsontable-demo-page` skill writes
// `dev-pr.html` and `dev-latest.html` (`dev-generated.html` is a name it used before). The rest are manual scratch
// files, at the package root and at the repository root.
const ROOT_OUTPUTS = [
  'handsontable/languages/de-DE.js',
  'handsontable/languages/index.js',
  'handsontable/languages/de-DE.mjs',
  'handsontable/dev.html',
  'handsontable/dev-pr.html',
  'handsontable/dev-latest.html',
  'handsontable/dev-generated.html',
  'handsontable/dev.js',
  'handsontable/dev.ts',
  'dev.html',
  'dev.js',
];
// The root rules cover the repository root only, so a dev page at another package's root shows in `git status`. That
// is the one thing the anchoring changed outside the core, and nothing writes such a page today.
const OTHER_PACKAGE_PAGES = [
  'wrappers/react-wrapper/dev.html',
  'wrappers/react-wrapper/dev.js',
];

/**
 * Lists files of the checkout through `git ls-files`.
 *
 * @param {string[]} args The `ls-files` options and pathspecs.
 * @returns {string[]} Paths relative to the repository root, with forward slashes.
 */
function listFiles(args) {
  return execFileSync('git', ['ls-files', '-z', ...args], {
    cwd: ROOT,
    env: REPO_ENV,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }).split('\0').filter(Boolean);
}

/**
 * Asks git which rule ignores each path. It runs in a scratch repository that holds a copy of each given
 * `.gitignore`, at its own place, so nothing else can answer: `--template=` writes no `.git/info/exclude`,
 * `core.excludesFile` points at an empty file, and `core.ignorecase` is off, so a checkout on a case-insensitive disk
 * matches the way the Linux CI runner does.
 *
 * @param {string[]} ignoreFiles The `.gitignore` files to copy, relative to the repository root.
 * @param {string[]} paths Paths relative to the repository root, with forward slashes.
 * @returns {Map<string, string>} The ignoring rule per path as `<file>:<pattern>`, `''` where no rule ignores it.
 */
function ignoringRules(ignoreFiles, paths) {
  const scratch = mkdtempSync(path.join(tmpdir(), 'hot-gitignore-'));

  try {
    const worktree = path.join(scratch, 'repository');
    const excludesFile = path.join(scratch, 'excludes');

    execFileSync('git', ['init', '--quiet', '--template=', worktree], { env: SCRATCH_ENV });
    ignoreFiles.forEach((file) => {
      const copy = path.join(worktree, file);

      mkdirSync(path.dirname(copy), { recursive: true });
      copyFileSync(path.join(ROOT, file), copy);
    });
    writeFileSync(excludesFile, '');

    // `--non-matching` answers for every path, with empty fields where no rule matches, and git exits 1 when no path
    // is ignored, which is a valid answer here.
    const result = spawnSync('git', [
      '-c', `core.excludesFile=${excludesFile}`,
      '-c', 'core.ignorecase=false',
      'check-ignore', '--no-index', '--verbose', '--non-matching', '-z', '--stdin',
    ], {
      cwd: worktree,
      env: SCRATCH_ENV,
      encoding: 'utf8',
      input: paths.map(file => `${file}\0`).join(''),
      maxBuffer: 64 * 1024 * 1024,
    });

    assert.ok(result.status === 0 || result.status === 1,
      `git check-ignore exited with ${result.status}: ${result.stderr || result.error}`);

    // Each record is four NUL-terminated fields: source, line number, pattern, path.
    const fields = result.stdout.split('\0');
    const rules = new Map();

    for (let i = 0; i + 3 < fields.length; i += 4) {
      const [source, , pattern, file] = fields.slice(i, i + 4);

      // A negated pattern matches a path to re-include it.
      rules.set(file, pattern && !pattern.startsWith('!') ? `${source}:${pattern}` : '');
    }

    return rules;
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

let coreFiles;
let rules;

before(() => {
  // The `.gitignore` files git reads in this checkout: tracked or new, and on disk. Listed from the index alone, a new
  // one would be left out until it is staged, and a tracked one deleted with plain `rm` could not be copied.
  const ignoreFiles = [...new Set(listFiles(['--cached', '--others', '--exclude-standard']))]
    .filter(file => path.posix.basename(file) === '.gitignore' && existsSync(path.join(ROOT, file)));

  coreFiles = listFiles(['--', 'handsontable']);
  rules = ignoringRules(ignoreFiles, [...coreFiles, ...NEW_SOURCES, ...ROOT_OUTPUTS, ...OTHER_PACKAGE_PAGES]);
});

test('no ignore rule matches a tracked file of the core package', () => {
  // An empty listing would pass without checking anything.
  assert.ok(coreFiles.includes('handsontable/src/i18n/languages/en-US.ts'), 'the listing holds the dictionaries');
  assert.deepEqual(coreFiles
    .filter(file => rules.get(file) !== '')
    .map(file => `${file} (${rules.get(file)})`), []);
});

NEW_SOURCES.forEach((file) => {
  test(`a new ${file} is not ignored`, () => {
    assert.equal(rules.get(file), '');
  });
});

ROOT_OUTPUTS.forEach((file) => {
  test(`${file} stays ignored`, () => {
    assert.match(rules.get(file) ?? '', /\S/);
  });
});

OTHER_PACKAGE_PAGES.forEach((file) => {
  test(`${file} is not ignored, because the root rules cover the repository root only`, () => {
    assert.equal(rules.get(file), '');
  });
});
