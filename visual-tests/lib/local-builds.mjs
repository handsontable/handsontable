/**
 * Checks that the visual-test examples render the monorepo's local builds, never a copy from the npm registry.
 *
 * The examples under `examples/next/visual-tests/<framework>/` (each framework's `demo/`, which the suite
 * photographs, and its `basic-example/`) declare `"handsontable": "latest"`, and the wrapper examples declare
 * their `@handsontable/*` wrapper the same way, so an install fills `node_modules` from the registry.
 * `examples/scripts/link-packages.mjs` then replaces each copy with a symlink to the local build. Two paths skip
 * that swap without a message. An install run without the linker leaves the registry copy in place. So does the
 * linker itself when a local build is missing, because it links only a source that exists, and the pnpm link to
 * an unbuilt `handsontable/tmp` points at nothing. Either way the example builds against the registry version,
 * the render succeeds, and nothing says what was photographed. Measured on 2026-09-29: both paths left
 * `handsontable` 18.1.0 from the registry where the local build was 18.1.1.
 *
 * Two checks close it, both built on this module. `scripts/check-linked-packages.mjs` runs first in every such
 * example's `build` script, so every way of building one runs it: `scripts/build.mjs`; the cross-browser leg of
 * `visual.yml` and the `visual-stability.yml` matrix, which build the js demo directly; and `npm run all build`
 * (the `build-all.yml` legs on Ubuntu, macOS, and Windows) and the release cut in `publish.yml`, which build
 * every example through `examples:build next`. It refuses unless every monorepo package the example declares
 * resolves to the local build, and, off CI, unless the core build is current. `scripts/build.mjs` runs
 * `findBuildProblems()` before it installs anything: the core and each wrapper the tier renders must be built
 * and linked into the `examples/` workspace, and the core build must be current.
 *
 * Node built-ins only. The guard runs in whatever tree the example's install left behind, and the tooling tests
 * run with no dependencies installed. See visual-tests/AGENTS.md (Local builds).
 */
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, realpathSync, statSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';

/**
 * Directories under a package's `src/` that the build does not compile, so the age check skips them.
 */
const IGNORED_SOURCE_DIRS = new Set(['__tests__', 'test']);

/**
 * Files under `src/` that the build does not compile: the Markdown beside the code (every plugin carries an
 * `AGENTS.md`, edited more often than the plugin), test-only assets such as `walkontable.test.css`, and
 * dotfiles such as the `.DS_Store` a file manager writes.
 */
const IGNORED_SOURCE_FILE = /^\.|\.md$|\.test\.\w+$/;

/**
 * The linker's own rule (`link-packages.mjs`) for the frameworks whose examples also get links in their own
 * `node_modules`, which Angular needs for the stylesheet paths in `angular.json`. The linker never replaces a
 * copy nested under an example of any other framework.
 */
const NESTED_LINK_FRAMEWORK = /^angular(-(\d+|next|wrapper))?$/;

/**
 * A versioned copy of the examples, `examples/<version>/`, which `examples:version` makes from `next/` with every
 * dependency pinned to a published release. The linker skips it on purpose.
 */
const VERSIONED_COPY = /^\d+\.\d+\.\d+[^/]*\//;

/**
 * The line the guard prints for each package it confirmed, which `scripts/build.mjs` passes through from a
 * build whose other output it hides.
 */
const CONFIRMATION = / resolves to the local build /;

/**
 * Reads and parses a JSON file.
 *
 * @param {string} path The file to read.
 * @returns {object} The parsed content.
 */
function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Converts an absolute path to the repository-relative, forward-slash form the messages print.
 *
 * @param {string} repoRoot The repository root.
 * @param {string} path The absolute path.
 * @returns {string} The path relative to `repoRoot`.
 */
function display(repoRoot, path) {
  return relative(repoRoot, path).split('\\').join('/') || '.';
}

/**
 * Says whether a path is a symbolic link (or, on Windows, a junction), whether or not it resolves.
 *
 * @param {string} path The path.
 * @returns {boolean} `true` for a link.
 */
function isLink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    // Nothing at that path, so no link either.
    return false;
  }
}

/**
 * Converts a `.gitignore` glob to the source of an equivalent regular expression: `**` matches across
 * directories, `*` and `?` within one, and everything else literally.
 *
 * @param {string} glob The glob.
 * @returns {string} The regular expression source, unanchored.
 */
function globSource(glob) {
  let source = '';

  for (let i = 0; i < glob.length; i += 1) {
    if (glob.startsWith('**', i)) {
      source += '.*';
      i += 1;
    } else if (glob[i] === '*') {
      source += '[^/]*';
    } else if (glob[i] === '?') {
      source += '[^/]';
    } else {
      source += glob[i].replace(/[\\^$.|+()[\]{}]/g, '\\$&');
    }
  }

  return source;
}

/**
 * Reads what a package's `.gitignore` says its build writes under `src/`: the entries written with a `src/`
 * prefix, such as `src/styles/handsontableStyles.js` and `src/3rdparty/walkontable/dist/`. The age check skips
 * exactly those. It does not ask git which files are ignored, for two measured reasons. Git's answer takes in every
 * ignore rule, a machine's global excludes file and `.git/info/exclude` included, so a rule written for another path
 * hides real sources too: until each gained a leading slash, the core's own `languages/` and `dev*.ts` hid a new
 * `src/i18n/languages/xx-XX.ts` and a new `src/plugins/dev-panel.ts`. And a checkout without its own
 * `.git` inside another repository would get that repository's answer, which can be to ignore everything.
 *
 * @param {string} packageDir The package directory.
 * @returns {RegExp[]} One pattern per entry, matched against a forward-slash path relative to `src/`.
 */
export function generatedSourcePatterns(packageDir) {
  const ignoreFile = join(packageDir, '.gitignore');

  if (!existsSync(ignoreFile)) {
    return [];
  }

  return readFileSync(ignoreFile, 'utf8').split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => /^\/?src\//.test(line))
    .map((line) => {
      const entry = line.replace(/^\/?src\//, '');
      const directory = entry.endsWith('/');

      // A directory entry matches everything under it; a file entry matches the file, or a directory of that name.
      return new RegExp(`^${globSource(entry.replace(/\/$/, ''))}${directory ? '/' : '(?:/|$)'}`);
    });
}

/**
 * Says whether the build compiles a file, judged by its path relative to the source directory.
 *
 * @param {string} path The file, relative to the source directory, with either separator.
 * @param {RegExp[]} [generated] The build's own outputs, from `generatedSourcePatterns()`.
 * @returns {boolean} `true` for a file the build compiles.
 */
export function isCompiledSource(path, generated = []) {
  const normalized = path.split('\\').join('/');
  const segments = normalized.split('/');
  const name = segments.pop();

  return !IGNORED_SOURCE_FILE.test(name)
    && !segments.some(segment => IGNORED_SOURCE_DIRS.has(segment))
    && !generated.some(pattern => pattern.test(normalized));
}

/**
 * Lists the files under a package's `src/` that its build compiles: every file there, tracked or new, apart from
 * the tests, the Markdown, the dotfiles, and what the package's `.gitignore` says the build writes there.
 *
 * @param {string} packageDir The package directory.
 * @returns {string[]} Absolute paths.
 */
export function sourceFiles(packageDir) {
  const srcDir = join(packageDir, 'src');
  const generated = generatedSourcePatterns(packageDir);

  return readdirSync(srcDir, { withFileTypes: true, recursive: true })
    .filter(entry => entry.isFile())
    .map(entry => join(entry.parentPath ?? entry.path, entry.name))
    .filter(path => isCompiledSource(relative(srcDir, path), generated));
}

/**
 * Finds the most recently modified of a list of files.
 *
 * @param {string[]} files Absolute paths.
 * @returns {{path: string, mtimeMs: number}|null} The newest file, or `null` when none exists.
 */
export function newestFile(files) {
  return files.reduce((newest, path) => {
    let mtimeMs;

    try {
      ({ mtimeMs } = statSync(path));
    } catch {
      // Removed between the listing and the read: there is no time to compare.
      return newest;
    }

    return !newest || mtimeMs > newest.mtimeMs ? { path, mtimeMs } : newest;
  }, null);
}

/**
 * Lists the monorepo's workspace packages and where each one's local build lives.
 *
 * The list is the root `package.json` `workspaces`, the one `examples/scripts/link-packages.mjs` reads, so this
 * checks exactly what the linker links. An entry is a directory or a directory followed by `/*`. The local
 * build is what pnpm links a workspace package to: its `publishConfig.directory`, unless `linkDirectory` is
 * `false` (pnpm 10's rule; `handsontable/tmp` and `wrappers/angular-wrapper/dist/hot-table` today), and the
 * package directory otherwise (the React and Vue wrappers, whose builds land in `es/` and `commonjs/` beside
 * their manifest).
 *
 * @param {string} repoRoot The repository root.
 * @returns {Map<string, {dir: string, buildDir: string}>} Absolute directories, keyed by package name.
 */
export function workspacePackages(repoRoot) {
  const packages = new Map();
  const dirs = (readJson(join(repoRoot, 'package.json')).workspaces ?? []).flatMap((entry) => {
    if (!entry.endsWith('/*')) {
      return [join(repoRoot, entry)];
    }

    const parent = join(repoRoot, entry.slice(0, -2));

    return existsSync(parent)
      ? readdirSync(parent, { withFileTypes: true })
        .filter(child => child.isDirectory())
        .map(child => join(parent, child.name))
      : [];
  });

  dirs.filter(dir => existsSync(join(dir, 'package.json'))).forEach((dir) => {
    const { name, publishConfig } = readJson(join(dir, 'package.json'));
    const buildDir = typeof publishConfig?.directory === 'string' && publishConfig.linkDirectory !== false
      ? join(dir, publishConfig.directory)
      : dir;

    packages.set(name, { dir, buildDir });
  });

  return packages;
}

/**
 * Says whether a package's local build exists: the manifest in its build directory, and the ES module entry
 * that manifest names. The entry is what the examples' bundlers load, and for the React and Vue wrappers it is
 * the only sign of a build, since their manifest is the source one.
 *
 * @param {string} repoRoot The repository root.
 * @param {{dir: string, buildDir: string}} pkg The package, from `workspacePackages()`.
 * @returns {string|null} The first missing file, repository-relative, or `null` when the build exists.
 */
export function missingBuildFile(repoRoot, pkg) {
  const manifestPath = join(pkg.buildDir, 'package.json');

  if (!existsSync(manifestPath)) {
    return display(repoRoot, manifestPath);
  }

  const { module: entry } = readJson(manifestPath);

  if (entry && !existsSync(join(pkg.buildDir, entry))) {
    return display(repoRoot, join(pkg.buildDir, entry));
  }

  return null;
}

/**
 * Explains what a missing local build does to an example, which depends on what is missing. With no manifest in
 * the build directory (`handsontable/tmp` or the Angular wrapper's `dist/hot-table` never built), the pnpm link
 * the linker copies from points at nothing, so the linker skips the package and the registry copy stays. With
 * the manifest there and only the entry missing (an unbuilt React or Vue wrapper, whose build directory is the
 * package itself), the linker links it and the example's bundler fails on the missing file.
 *
 * @param {{buildDir: string}} pkg The package, from `workspacePackages()`.
 * @returns {string[]} The explanation, one line per element.
 */
function missingBuildEffect(pkg) {
  return existsSync(join(pkg.buildDir, 'package.json'))
    ? ['The linker links the package anyway, and the build fails on the missing file.']
    : ['The linker skips a package whose local build is missing, so the example would build against the copy',
      'installed from the npm registry, and nothing would fail.'];
}

/**
 * The command that builds a workspace package, as a developer runs it from the repository root.
 *
 * @param {string} repoRoot The repository root.
 * @param {{dir: string}} pkg The package, from `workspacePackages()`.
 * @returns {string} The command.
 */
export function buildCommand(repoRoot, pkg) {
  return `npm --prefix ${display(repoRoot, pkg.dir)} run build`;
}

/**
 * Says whether the age check runs: everywhere but CI. It could find nothing there: the render job composes
 * `handsontable/tmp` for the commit it checked out (its `postbuild:partial` rewrites the stamp after the Build
 * artifact is extracted), and `build-all.yml` builds the core in the same job. Kept off, a later change to a
 * job's step order cannot turn it into a false red.
 *
 * @param {object} env The environment, `process.env` in a script.
 * @returns {boolean} `true` off CI.
 */
export function ageCheckEnabled(env) {
  return env.CI !== 'true';
}

/**
 * The options `scripts/build.mjs` passes to `findBuildProblems()`, kept here so the tests can pin them: the
 * tier's frameworks without the reference one, and the age check off on CI.
 *
 * @param {object} options Options.
 * @param {object} options.env The environment, `process.env` in the script.
 * @param {string[]} options.frameworks The tier's frameworks.
 * @param {string} options.referenceFramework The framework the wrappers are compared with (`js`).
 * @returns {{wrappers: string[], checkAge: boolean}} The options.
 */
export function preflightOptions({ env, frameworks, referenceFramework }) {
  return {
    wrappers: frameworks.filter(framework => framework !== referenceFramework),
    checkAge: ageCheckEnabled(env),
  };
}

/**
 * Checks that the core build is no older than its sources: no file `sourceFiles()` lists may be newer than
 * `handsontable/tmp/package.json`, which `postbuild` and `postbuild:partial` write when they compose the
 * package. That stamp, rather than the newest file in the tree, is deliberate: a rebuild of one task through
 * `scripts/run.mjs` runs neither step and leaves some output current and the rest stale. The check reads
 * modification times, so a checkout, rebase, or stash that rewrites a source counts too, whatever it wrote. It
 * reads no build input outside `src/`: not `handsontable/package.json` (the version and exports `postbuild`
 * writes into the stamp), its `.config/`, `scripts/`, `rspack.config.js`, `babel.config.js`, or `tsconfig*.json`
 * files, nor the root `browser-targets.js`, `babel.config.js`, and `hot.config.js`.
 *
 * @param {string} repoRoot The repository root.
 * @param {{dir: string, buildDir: string}} core The core package, built.
 * @returns {{summary: string, detail: string[], remedy: string}|null} The problem, or `null` when current.
 */
function coreAgeProblem(repoRoot, core) {
  const source = newestFile(sourceFiles(core.dir));
  const stamp = join(core.buildDir, 'package.json');
  const composedMs = statSync(stamp).mtimeMs;

  if (!source || source.mtimeMs <= composedMs) {
    return null;
  }

  return {
    summary: `The core build is older than its sources: ${display(repoRoot, core.buildDir)} predates `
      + `${display(repoRoot, source.path)}.`,
    detail: [
      `Newest source: ${display(repoRoot, source.path)} (${new Date(source.mtimeMs).toISOString()})`,
      `Build composed: ${display(repoRoot, stamp)} (${new Date(composedMs).toISOString()})`,
      'A source changed after the build, so the examples may render the previous one.',
    ],
    remedy: `Build the core first: ${buildCommand(repoRoot, core)}`,
  };
}

/**
 * Checks that the linker's source for a package, its pnpm link in `examples/node_modules`, resolves to the
 * package's local build. The linker copies its links from there, so without it every example keeps its registry
 * copy, and a reinstall of the examples cannot help.
 *
 * @param {string} repoRoot The repository root.
 * @param {string} name The package name.
 * @param {{buildDir: string}} pkg The package, from `workspacePackages()`.
 * @returns {{summary: string, detail: string[], remedy: string}|null} The problem, or `null` when it resolves.
 */
function linkerSourceProblem(repoRoot, name, pkg) {
  const source = join(repoRoot, 'examples', 'node_modules', ...name.split('/'));

  if (existsSync(join(source, 'package.json')) && realpathSync(source) === realpathSync(pkg.buildDir)) {
    return null;
  }

  return {
    summary: `${display(repoRoot, source)} does not link to the local build ${display(repoRoot, pkg.buildDir)}.`,
    detail: ['The linker copies its links from there, so every example would keep the copy installed from the',
      'npm registry, and reinstalling the examples cannot link them.'],
    remedy: 'Recreate the workspace links: pnpm install',
  };
}

/**
 * Finds what stops `scripts/build.mjs` from rendering the local builds, before it installs anything.
 *
 * Four checks. The core is built: `handsontable/tmp` holds its manifest and ES entry. Each wrapper the tier
 * renders is built. The linker has a source for each of them: pnpm's link in `examples/node_modules` resolves
 * to the build. And the core build is current (`coreAgeProblem()`). The wrappers' age is not checked.
 *
 * @param {object} options Options.
 * @param {string} options.repoRoot The repository root.
 * @param {string[]} [options.wrappers] The wrapper directory names the tier renders, e.g. `react-wrapper`.
 * @param {boolean} [options.checkAge] Whether to compare the core build with its sources.
 * @returns {Array<{summary: string, detail: string[], remedy: string}>} The problems, empty when none.
 */
export function findBuildProblems({ repoRoot: givenRoot, wrappers = [], checkAge = true }) {
  const repoRoot = realpathSync(givenRoot);
  const problems = [];
  const packages = workspacePackages(repoRoot);
  const core = packages.get('handsontable');

  if (!core) {
    return [{
      summary: 'The root package.json lists no workspace package named "handsontable".',
      detail: ['The linker reads that list, so it has nothing to link the examples to.'],
      remedy: 'Restore "handsontable" in the root package.json "workspaces".',
    }];
  }

  const coreMissing = missingBuildFile(repoRoot, core);

  if (coreMissing) {
    problems.push({
      summary: `The core is not built: ${coreMissing} is missing.`,
      detail: missingBuildEffect(core),
      remedy: `Build the core first: ${buildCommand(repoRoot, core)}`,
    });
  } else {
    problems.push(...[linkerSourceProblem(repoRoot, 'handsontable', core),
      checkAge ? coreAgeProblem(repoRoot, core) : null].filter(Boolean));
  }

  wrappers.forEach((wrapper) => {
    const [name, pkg] = [...packages].find(([, { dir }]) => display(repoRoot, dir) === `wrappers/${wrapper}`) ?? [];
    const missing = pkg ? missingBuildFile(repoRoot, pkg) : `wrappers/${wrapper}/package.json`;

    if (missing) {
      problems.push({
        summary: `The ${wrapper} build is missing: ${missing} does not exist.`,
        detail: [`The tier renders the ${wrapper} demo, which imports that build.`]
          .concat(pkg ? missingBuildEffect(pkg) : []),
        remedy: `Build it first: npm --prefix wrappers/${wrapper} run build`,
      });
    } else {
      problems.push(...[linkerSourceProblem(repoRoot, name, pkg)].filter(Boolean));
    }
  });

  return problems;
}

/**
 * Lists the `node_modules/<name>` paths a build in `fromDir` looks in, from `fromDir` up to and including
 * `stopDir`, nearest first.
 *
 * @param {string} fromDir The directory the build runs in.
 * @param {string} stopDir The last directory to look in.
 * @param {string} name The package name, scoped or not.
 * @returns {string[]} Absolute paths, whether or not anything is there.
 */
function candidatePaths(fromDir, stopDir, name) {
  const candidates = [];

  for (let dir = fromDir; ; dir = dirname(dir)) {
    candidates.push(join(dir, 'node_modules', ...name.split('/')));

    if (dir === stopDir || dir === dirname(dir)) {
      break;
    }
  }

  return candidates;
}

/**
 * Lists every copy of a package that a build in `fromDir` can read: each `node_modules/<name>` holding a
 * manifest, from `fromDir` up to and including `stopDir`. The first one is what a bare import resolves to.
 * The others matter too: the React demo copies its stylesheets from the framework directory's copy by path,
 * and the linker's own source is the one in `stopDir`.
 *
 * @param {string} fromDir The directory the build runs in.
 * @param {string} stopDir The last directory to look in.
 * @param {string} name The package name, scoped or not.
 * @returns {string[]} Absolute paths, nearest first.
 */
export function packageCopies(fromDir, stopDir, name) {
  // `existsSync` follows the link, so a dangling one is skipped the way the resolver skips it.
  return candidatePaths(fromDir, stopDir, name).filter(candidate => existsSync(join(candidate, 'package.json')));
}

/**
 * Lists the links on the same path that point at nothing. The resolver passes over them, but a copy by path
 * (the React demo's stylesheets, the js demo's copy plugin) does not, and it copies nothing without a message.
 * The linker writes absolute links, so moving the checkout leaves them all dangling.
 *
 * @param {string} fromDir The directory the build runs in.
 * @param {string} stopDir The last directory to look in.
 * @param {string} name The package name, scoped or not.
 * @returns {string[]} Absolute paths, nearest first.
 */
export function danglingLinks(fromDir, stopDir, name) {
  return candidatePaths(fromDir, stopDir, name).filter(candidate => isLink(candidate) && !existsSync(candidate));
}

/**
 * A problem for a guard run from a directory that is no example it can check, so it refuses rather than pass.
 *
 * @param {string} summary What is wrong.
 * @returns {{summary: string, detail: string[], remedy: string}} The problem.
 */
function notAnExample(summary) {
  return {
    summary,
    detail: ['The guard checks the example it runs in, so it runs from that example\'s directory, the way its',
      'build script runs it.'],
    remedy: 'Build the example through its own script: npm --prefix examples/next/visual-tests/<framework>/demo '
      + 'run build',
  };
}

/**
 * Checks that every monorepo package an example declares resolves to its local build, the guard's judgment.
 *
 * The packages are the example's `dependencies` and `devDependencies` named `handsontable` or `@handsontable/*`:
 * the core, and the wrapper for a wrapper example. Each one must be a workspace package, since the linker links
 * nothing else; its local build must exist; the example's tree must hold at least one copy (up to the `examples/`
 * workspace, where pnpm links the local builds and the linker reads them); every such copy must resolve to the
 * local build; and no link on the way may dangle. With `checkAge`, the core build must also be current, so an
 * example built directly after a source edit is refused like `scripts/build.mjs` refuses it. The check skips a
 * versioned copy of the examples, which pins a published release on purpose, and refuses any other directory,
 * so a run from the wrong place cannot pass by checking nothing.
 *
 * @param {object} options Options.
 * @param {string} options.repoRoot The repository root.
 * @param {string} options.demoDir The example's directory.
 * @param {boolean} [options.checkAge] Whether to compare the core build with its sources.
 * @returns {{demo: string, skipped: string|null, checked: Array<{name: string, buildDir: string}>,
 *   problems: Array<{summary: string, detail: string[], remedy: string}>}} What was checked and what is wrong.
 */
export function checkLinkedPackages({ repoRoot: givenRoot, demoDir: givenDemoDir, checkAge = true }) {
  // Real paths throughout, so a symlinked checkout or temp directory cannot make the example look like it sits
  // outside `examples/next/`, or a copy like it sits outside the example's tree.
  const repoRoot = realpathSync(givenRoot);
  const demoDir = realpathSync(givenDemoDir);
  const examplesDir = join(repoRoot, 'examples');
  // Paths in the messages are repository-relative, which leaves the root itself as `.`.
  const demo = demoDir === repoRoot ? 'the repository root' : display(repoRoot, demoDir);
  const inExamples = display(examplesDir, demoDir);
  const result = problems => ({ demo, skipped: null, checked: [], problems });

  if (VERSIONED_COPY.test(inExamples)) {
    return {
      demo,
      skipped: `${demo} is a versioned copy of the examples, which pins a published release; the linker links `
        + 'next/ only.',
      checked: [],
      problems: [],
    };
  }

  if (!inExamples.startsWith('next/')) {
    return result([notAnExample(`${demo} is not an example under examples/next/, so there is nothing to check.`)]);
  }

  if (!existsSync(join(demoDir, 'package.json'))) {
    return result([notAnExample(`${demo} has no package.json, so it is not an example.`)]);
  }

  const packages = workspacePackages(repoRoot);
  const manifest = readJson(join(demoDir, 'package.json'));
  // By name rather than by the workspace list, so a package the list does not know is refused instead of
  // going unchecked: the linker would leave its registry copy in place too.
  const declared = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })
    .filter(name => name === 'handsontable' || name.startsWith('@handsontable/'));

  if (declared.length === 0) {
    return result([notAnExample(`${demo} declares no handsontable or @handsontable/* package, so there is `
      + 'nothing to check.')]);
  }

  // The framework directory, relative to `examples/`: what `npm run examples:install` takes to reinstall and
  // relink this example (`next/visual-tests/js` for `next/visual-tests/js/demo`).
  const install = `npm run examples:install ${display(examplesDir, dirname(demoDir))}`;
  const nestsLinks = NESTED_LINK_FRAMEWORK.test(basename(dirname(demoDir)));
  const checked = [];
  const problems = [];

  declared.forEach((name) => {
    const pkg = packages.get(name);

    if (!pkg) {
      problems.push({
        summary: `${name}: no workspace package has this name.`,
        detail: ['The linker links only the packages the root package.json "workspaces" lists, so this example',
          'would keep the copy installed from the npm registry.'],
        remedy: 'List the package in the root package.json "workspaces", or drop the dependency from the example.',
      });

      return;
    }

    const buildDir = display(repoRoot, pkg.buildDir);
    const missing = missingBuildFile(repoRoot, pkg);

    checked.push({ name, buildDir });

    if (missing) {
      problems.push({
        summary: `${name}: the local build is missing (${missing}).`,
        detail: missingBuildEffect(pkg),
        remedy: `Build it, then relink the example: ${buildCommand(repoRoot, pkg)} && ${install}`,
      });

      return;
    }

    const expected = realpathSync(pkg.buildDir);
    const copies = packageCopies(demoDir, examplesDir, name);
    const dangling = danglingLinks(demoDir, examplesDir, name);
    const strays = copies.filter(copy => realpathSync(copy) !== expected);
    // The linker copies its links from here. Unless this one resolves to the local build, reinstalling the
    // example has nothing to link from, and only the root install (which recreates the workspace link) helps.
    const linkerSource = join(examplesDir, 'node_modules', ...name.split('/'));
    const linkerSourceOk = copies.includes(linkerSource) && !strays.includes(linkerSource);
    // A copy in the example's own `node_modules`, which the linker replaces for Angular examples only: for any
    // other framework a reinstall leaves it, and the relink remedy would loop.
    const nestedCopy = join(demoDir, 'node_modules', ...name.split('/'));
    const nestedStray = !nestsLinks && (strays.includes(nestedCopy) || dangling.includes(nestedCopy));

    if (copies.length === 0) {
      problems.push({
        summary: `${name}: not installed for this example.`,
        detail: [`Expected a link to ${buildDir} in a node_modules directory above ${demo}.`],
        remedy: `Recreate the workspace links, then install and link the example: pnpm install && ${install}`,
      });
    } else if (strays.length > 0 || dangling.length > 0) {
      let trailer = 'The linker replaces these with links to the local build when examples:install runs it.';
      let remedy = `Install and link the example: ${install}`;

      if (!linkerSourceOk) {
        trailer = `The linker copies its links from ${display(repoRoot, linkerSource)}, which does not resolve to `
          + 'the local build either.';
        remedy = `Recreate the workspace links, then install and link the example: pnpm install && ${install}`;
      } else if (nestedStray) {
        trailer = 'The linker replaces a copy nested under an example for Angular only, so it never replaces this '
          + 'one. If it comes back after the relink, the framework\'s lockfile records it there.';
        remedy = `Delete ${display(repoRoot, nestedCopy)}, then relink the example: ${install}`;
      }

      problems.push({
        summary: strays.length > 0
          ? `${name}: resolves to a copy that is not the local build ${buildDir}.`
          : `${name}: a link on the example's path points at nothing, not at the local build ${buildDir}.`,
        detail: [
          ...strays.map((copy) => {
            const { version } = readJson(join(copy, 'package.json'));

            // A link here points somewhere other than the local build; a plain directory is what an install
            // leaves behind when the linker does not replace it.
            return isLink(copy)
              ? `${display(repoRoot, copy)} links to ${display(repoRoot, realpathSync(copy))} (version ${version}).`
              : `${display(repoRoot, copy)} is a plain copy of version ${version}, not a link.`;
          }),
          ...dangling.map(link => `${display(repoRoot, link)} links to ${readlinkSync(link)}, which does not exist.`),
          trailer,
        ],
        remedy,
      });
    }

    if (checkAge && name === 'handsontable') {
      problems.push(...[coreAgeProblem(repoRoot, pkg)].filter(Boolean));
    }
  });

  return { demo, skipped: null, checked, problems };
}

/**
 * Lays out problems the way both scripts print them: each summary, its detail indented, and its remedy, then
 * one line saying where to run the commands.
 *
 * @param {Array<{summary: string, detail: string[], remedy: string}>} problems The problems.
 * @param {object} [options] Options.
 * @param {(text: string) => string} [options.highlight] Applied to each summary line, for a terminal color.
 * @returns {string[]} The lines, each printed as it is.
 */
export function formatProblems(problems, { highlight = text => text } = {}) {
  return [
    ...problems.flatMap(({ summary, detail, remedy }) => [
      '',
      highlight(`- ${summary}`),
      ...detail.map(line => `  ${line}`),
      `  ${remedy}`,
    ]),
    '',
    'Run the commands from the repository root. See visual-tests/AGENTS.md (Local builds).',
  ];
}

/**
 * The lines the guard prints for what it confirmed, one per package.
 *
 * @param {Array<{name: string, buildDir: string}>} checked What `checkLinkedPackages()` checked.
 * @returns {string[]} The lines.
 */
export function confirmationLines(checked) {
  return checked.map(({ name, buildDir }) => `${name} resolves to the local build ${buildDir}.`);
}

/**
 * Picks the guard's confirmations out of a build's standard output, which `scripts/build.mjs` otherwise hides.
 *
 * @param {string} stdout The build's standard output.
 * @returns {string[]} The guard's lines, in order.
 */
export function readConfirmations(stdout) {
  return stdout.split(/\r?\n/).filter(line => CONFIRMATION.test(line));
}
