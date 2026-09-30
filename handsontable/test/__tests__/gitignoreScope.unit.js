import { execFileSync, spawnSync } from 'child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { devNull, tmpdir } from 'os';
import { basename, dirname, join, resolve } from 'path';

const HOT_DIR = resolve(__dirname, '../..');
const REPO_ROOT = resolve(HOT_DIR, '..');
// The package's directory in the repository, which is where the scratch copy puts it too.
const PACKAGE_DIR = 'handsontable';

// A git hook exports GIT_DIR, which would point every call below at the hook's repository, and a
// global or system config can name an excludes file. Neither may take part in the answer.
const GIT_ENV = {
  ...process.env,
  GIT_CONFIG_GLOBAL: devNull,
  GIT_CONFIG_NOSYSTEM: '1',
};

delete GIT_ENV.GIT_DIR;
delete GIT_ENV.GIT_WORK_TREE;
delete GIT_ENV.GIT_INDEX_FILE;

// New files below the package root that share a name with a root-only rule: a dictionary lives in a
// `languages/` directory, and a file whose name starts with `dev` is not a dev page.
const NEW_SOURCES = [
  'src/i18n/languages/xx-XX.ts',
  'src/plugins/dev-panel.ts',
  'src/plugins/dev-panel.js',
  'src/plugins/dev-panel.html',
];
// What lands at the package root: `build:languages` writes the UMD files and copies `all.js` to
// `index.js`, `build:languages.es` writes the `.mjs` files, the `handsontable-demo-page` and
// `browserstack-live` skills write the `dev-*.html` pages, and the rest are manual scratch files.
const ROOT_OUTPUTS = [
  'languages/de-DE.js',
  'languages/index.js',
  'languages/de-DE.mjs',
  'dev.html',
  'dev-pr.html',
  'dev-latest.html',
  'dev-generated.html',
  'dev.js',
  'dev.ts',
];

/**
 * Lists the package's tracked files.
 *
 * @returns {string[]} Paths relative to the package root, with forward slashes.
 */
function trackedFiles() {
  return execFileSync('git', ['ls-files', '-z'], {
    cwd: HOT_DIR,
    env: GIT_ENV,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  }).split('\0').filter(Boolean);
}

/**
 * Asks git which committed rule ignores each of the package's paths. It runs in a scratch
 * repository that holds copies of the monorepo root's `.gitignore` and of every `.gitignore` the
 * package tracks, each at its own place, so no other rule can answer: `--template=` writes no
 * `.git/info/exclude`, and `core.excludesFile` points at an empty file.
 *
 * @param {string[]} ignoreFiles The package's tracked `.gitignore` files, relative to the package root.
 * @param {string[]} paths Paths relative to the package root, with forward slashes.
 * @returns {{[key: string]: string}} The ignoring rule per path as `<file>:<pattern>`, `''` where no rule
 * ignores it.
 */
function ignoringRules(ignoreFiles, paths) {
  const scratch = mkdtempSync(join(tmpdir(), 'hot-gitignore-'));

  try {
    const worktree = join(scratch, 'repository');
    const excludesFile = join(scratch, 'excludes');

    execFileSync('git', ['init', '--quiet', '--template=', worktree], { env: GIT_ENV });
    copyFileSync(join(REPO_ROOT, '.gitignore'), join(worktree, '.gitignore'));
    ignoreFiles.forEach((file) => {
      const copy = join(worktree, PACKAGE_DIR, file);

      mkdirSync(dirname(copy), { recursive: true });
      copyFileSync(join(HOT_DIR, file), copy);
    });
    writeFileSync(excludesFile, '');

    // `--non-matching` answers for every path, with empty fields where no rule matches, and git
    // exits 1 when no path is ignored, which is a valid answer here.
    const result = spawnSync('git', [
      '-c', `core.excludesFile=${excludesFile}`,
      'check-ignore', '--no-index', '--verbose', '--non-matching', '-z', '--stdin',
    ], {
      cwd: worktree,
      env: GIT_ENV,
      encoding: 'utf8',
      input: paths.map(path => `${PACKAGE_DIR}/${path}\0`).join(''),
      maxBuffer: 16 * 1024 * 1024,
    });

    if (result.status !== 0 && result.status !== 1) {
      throw new Error(`git check-ignore exited with ${result.status}: ${result.stderr || result.error}`);
    }

    // Each record is four NUL-terminated fields: source, line number, pattern, path.
    const fields = result.stdout.split('\0');
    const rules = {};

    for (let i = 0; i + 3 < fields.length; i += 4) {
      const [source, , pattern, path] = fields.slice(i, i + 4);

      // A negated pattern matches a path to re-include it.
      rules[path.slice(PACKAGE_DIR.length + 1)] = pattern && !pattern.startsWith('!') ? `${source}:${pattern}` : '';
    }

    return rules;
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

/**
 * `handsontable/.gitignore` has rules for what lands at the package root: the build's `languages/`
 * output and the `dev*.html`, `dev*.js` and `dev*.ts` dev pages. Git applies a rule without a slash
 * at every depth, so before they were anchored with a leading `/`, `languages/` matched all 22
 * dictionaries in `src/i18n/languages/` and `dev*.js` matched `.config/development.js`, and the
 * monorepo root's own `dev*.html` and `dev*.js` matched every such name in the package too. A
 * tracked file stays tracked whatever the rules say, but a new one never showed in `git status`, so
 * a new dictionary could be left out of a commit without anyone noticing. This pins the reach of
 * every committed rule that applies to the package, in both directions.
 */
describe('the ignore rules that apply to the package (handsontable/.gitignore, .gitignore)', () => {
  let tracked;
  let rules;

  beforeAll(() => {
    tracked = trackedFiles();
    rules = ignoringRules(
      tracked.filter(file => basename(file) === '.gitignore'),
      [...tracked, ...NEW_SOURCES, ...ROOT_OUTPUTS],
    );
  });

  it('should match no tracked file of the package', () => {
    // An empty listing would pass without checking anything.
    expect(tracked).toContain('src/i18n/languages/en-US.ts');
    expect(tracked
      .filter(file => rules[file] !== '')
      .map(file => `${file} (${rules[file]})`)).toEqual([]);
  });

  it.each(NEW_SOURCES)('should not ignore a new %s', (file) => {
    expect(rules[file]).toBe('');
  });

  it.each(ROOT_OUTPUTS)('should ignore %s at the package root', (file) => {
    expect(rules[file]).toMatch(/\S/);
  });
});
