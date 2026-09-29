/**
 * Checks that the visual-test demos render the monorepo's local builds, never a copy from the npm registry.
 *
 * The four demos under `examples/next/visual-tests/<framework>/demo/` declare `"handsontable": "latest"`, and
 * the three wrapper demos declare their `@handsontable/*` wrapper the same way, so an install fills
 * `node_modules` from the registry. `examples/scripts/link-packages.mjs` then replaces each copy with a symlink
 * to the local build. Two paths skip that swap without a message. An install run without the linker leaves the
 * registry copy in place. So does the linker itself when a local build is missing, because it links only a
 * source that exists, and the pnpm link to an unbuilt `handsontable/tmp` points at nothing. Either way the demo
 * builds against the registry version, the render succeeds, and nothing says what was photographed. Measured
 * on 2026-09-29: both paths left `handsontable` 18.1.0 from the registry where the local build was 18.1.1.
 *
 * Two checks close it, both built on this module. `scripts/check-linked-packages.mjs` runs first in every demo's
 * `build` script, so every way of building a demo runs it: `scripts/build.mjs`; the cross-browser leg of
 * `visual.yml` and the `visual-stability.yml` matrix, which build the js demo directly; and `npm run all build`
 * (the `build-all.yml` legs on Ubuntu, macOS, and Windows) and the release cut in `publish.yml`, which build
 * every example through `examples:build next`. It refuses unless every monorepo package the demo declares
 * resolves to the local build. `scripts/build.mjs` runs `findBuildProblems()` before it installs anything: the
 * core and each wrapper the tier renders must be built and linked into the `examples/` workspace, and the core
 * build must be no older than its sources.
 *
 * Node built-ins only. The demo guard runs in whatever tree the demo's install left behind, and the tooling
 * tests run with no dependencies installed. See visual-tests/AGENTS.md (Local builds).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, realpathSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

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
 * What the build itself writes under `src/`, all of it listed in `handsontable/.gitignore`: `build:styles`
 * rewrites the two `handsontableStyles` files on every run, and `build:walkontable` writes `dist/`. Git keeps
 * them out of the age check; these rules keep them out when git cannot list the sources.
 */
const GENERATED_SOURCE_DIRS = new Set(['dist']);
const GENERATED_SOURCE_FILE = /^handsontableStyles\.(js|ts)$/;

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
 * that manifest names. The entry is what the demos' bundlers load, and for the React and Vue wrappers it is the
 * only sign of a build, since their manifest is the source one.
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
 * Explains what a missing local build does to a demo, which depends on what is missing. With no manifest in
 * the build directory (`handsontable/tmp` or the Angular wrapper's `dist/hot-table` never built), the pnpm link
 * the linker copies from points at nothing, so the linker skips the package and the registry copy stays. With
 * the manifest there and only the entry missing (an unbuilt React or Vue wrapper, whose build directory is the
 * package itself), the linker links it and the demo's bundler fails on the missing file.
 *
 * @param {{buildDir: string}} pkg The package, from `workspacePackages()`.
 * @returns {string[]} The explanation, one line per element.
 */
function missingBuildEffect(pkg) {
  return existsSync(join(pkg.buildDir, 'package.json'))
    ? ['The linker links the package anyway, and the demo build fails on the missing file.']
    : ['The linker skips a package whose local build is missing, so the demo would build against the copy',
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
 * Says whether the build compiles a file, judged by its path relative to the source directory.
 *
 * @param {string} path The file, relative to the source directory, with either separator.
 * @param {object} [options] Options.
 * @param {boolean} [options.skipGenerated] Whether to skip the build's own outputs too, for a list git did not
 *   filter.
 * @returns {boolean} `true` for a file the build compiles.
 */
export function isCompiledSource(path, { skipGenerated = false } = {}) {
  const segments = path.split(/[\\/]/);
  const name = segments.pop();

  if (IGNORED_SOURCE_FILE.test(name) || segments.some(segment => IGNORED_SOURCE_DIRS.has(segment))) {
    return false;
  }

  return !skipGenerated
    || (!GENERATED_SOURCE_FILE.test(name) && !segments.some(segment => GENERATED_SOURCE_DIRS.has(segment)));
}

/**
 * Lists the files in a source directory that the build compiles. Git decides first: its tracked files plus the
 * untracked ones no ignore rule covers, so a new source file counts and every generated file stays out whatever
 * ignore rule names it. Without git (not a checkout, or no `git` on the path) a directory walk stands in, with
 * the generated outputs this file knows about skipped by name.
 *
 * @param {string} repoRoot The repository root.
 * @param {string} srcDir The source directory.
 * @returns {string[]} Absolute paths.
 */
export function sourceFiles(repoRoot, srcDir) {
  const listed = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--',
    display(repoRoot, srcDir)], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

  if (listed.status === 0) {
    return listed.stdout.split('\0').filter(Boolean)
      .filter(path => isCompiledSource(relative(srcDir, join(repoRoot, path))))
      .map(path => join(repoRoot, path));
  }

  return readdirSync(srcDir, { withFileTypes: true, recursive: true })
    .filter(entry => entry.isFile())
    .map(entry => join(entry.parentPath ?? entry.path, entry.name))
    .filter(path => isCompiledSource(relative(srcDir, path), { skipGenerated: true }));
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
      // Git still lists a tracked file deleted from the working tree; there is no time to compare.
      return newest;
    }

    return !newest || mtimeMs > newest.mtimeMs ? { path, mtimeMs } : newest;
  }, null);
}

/**
 * The options `scripts/build.mjs` passes to `findBuildProblems()`, kept here so the tests can pin them.
 *
 * The wrappers are the tier's frameworks without the reference one. The age check is off on CI. It could not
 * find anything there: the render job composes `handsontable/tmp` for the commit it checked out (its
 * `postbuild:partial` rewrites the stamp after the Build artifact is extracted), and `build-all.yml` builds the
 * core in the same job. Kept off, a later change to a job's step order cannot turn it into a false red.
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
    checkAge: env.CI !== 'true',
  };
}

/**
 * Checks that the linker's source for a package, its pnpm link in `examples/node_modules`, resolves to the
 * package's local build. The linker copies its links from there, so without it every demo keeps its registry
 * copy, and a reinstall of the demos cannot help.
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
    detail: ['The linker copies its links from there, so every demo would keep the copy installed from the npm',
      'registry, and reinstalling the demos cannot link them.'],
    remedy: 'Recreate the workspace links: pnpm install',
  };
}

/**
 * Finds what stops `scripts/build.mjs` from rendering the local builds, before it installs anything.
 *
 * Four checks. The core is built: `handsontable/tmp` holds its manifest and ES entry. Each wrapper the tier
 * renders is built. The linker has a source for each of them: pnpm's link in `examples/node_modules` resolves
 * to the build. And the core build is no older than its sources: no file under `handsontable/src` that the
 * build compiles (tests, Markdown, and the build's own outputs aside) is newer than `handsontable/tmp/package.json`,
 * which `postbuild` and `postbuild:partial` write when they compose the package. That stamp, rather than the
 * newest file in the tree, is deliberate: a rebuild of one task through `scripts/run.mjs` skips both steps and
 * leaves some output current and the rest stale. The check reads modification times, so a checkout, rebase, or
 * stash that rewrites a source also counts, whatever it wrote. It does not read the build's configuration
 * (`browser-targets.js`, `handsontable/.config`, `handsontable/scripts`), nor the wrappers' age.
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
      detail: ['The linker reads that list, so it has nothing to link the demos to.'],
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
    const unlinked = linkerSourceProblem(repoRoot, 'handsontable', core);

    if (unlinked) {
      problems.push(unlinked);
    }

    const source = checkAge ? newestFile(sourceFiles(repoRoot, join(core.dir, 'src'))) : null;
    const stamp = join(core.buildDir, 'package.json');
    const composedMs = statSync(stamp).mtimeMs;

    if (source && source.mtimeMs > composedMs) {
      problems.push({
        summary: `The core build is older than its sources: ${display(repoRoot, core.buildDir)} predates `
          + `${display(repoRoot, source.path)}.`,
        detail: [
          `Newest source: ${display(repoRoot, source.path)} (${new Date(source.mtimeMs).toISOString()})`,
          `Build composed: ${display(repoRoot, stamp)} (${new Date(composedMs).toISOString()})`,
          'A source changed after the build, so the demos may render the previous one.',
        ],
        remedy: `Build the core first: ${buildCommand(repoRoot, core)}`,
      });
    }
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
      const unlinked = linkerSourceProblem(repoRoot, name, pkg);

      if (unlinked) {
        problems.push(unlinked);
      }
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
 * Checks that every monorepo package a demo declares resolves to its local build, the demo guard's judgment.
 *
 * The packages are the demo's `dependencies` and `devDependencies` named `handsontable` or `@handsontable/*`:
 * the core, and the wrapper for a wrapper demo. Each one must be a workspace package, since the linker links
 * nothing else; its local build must exist; the demo's tree must hold at least one copy (up to the `examples/`
 * workspace, where pnpm links the local builds and the linker reads them); every such copy must resolve to the
 * local build; and no link on the way may dangle. The check skips a demo outside `examples/next/`, since the
 * linker links `next/` only and a versioned copy pins a published release on purpose.
 *
 * @param {object} options Options.
 * @param {string} options.repoRoot The repository root.
 * @param {string} options.demoDir The demo's directory.
 * @returns {{demo: string, skipped: string|null, checked: Array<{name: string, buildDir: string}>,
 *   problems: Array<{summary: string, detail: string[], remedy: string}>}} What was checked and what is wrong.
 */
export function checkLinkedPackages({ repoRoot: givenRoot, demoDir: givenDemoDir }) {
  // Real paths throughout, so a symlinked checkout or temp directory cannot make the demo look like it sits
  // outside `examples/next/`, or a copy like it sits outside the demo's tree.
  const repoRoot = realpathSync(givenRoot);
  const demoDir = realpathSync(givenDemoDir);
  const examplesDir = join(repoRoot, 'examples');
  const demo = display(repoRoot, demoDir);

  if (!display(examplesDir, demoDir).startsWith('next/')) {
    return {
      demo,
      skipped: `${demo} is not under examples/next/, and the linker links next/ only.`,
      checked: [],
      problems: [],
    };
  }

  const packages = workspacePackages(repoRoot);
  const manifest = readJson(join(demoDir, 'package.json'));
  // By name rather than by the workspace list, so a package the list does not know is refused instead of
  // going unchecked: the linker would leave its registry copy in place too.
  const declared = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })
    .filter(name => name === 'handsontable' || name.startsWith('@handsontable/'));
  // The framework directory, relative to `examples/`: what `npm run examples:install` takes to reinstall and
  // relink this demo (`next/visual-tests/js` for `next/visual-tests/js/demo`).
  const install = `npm run examples:install ${display(examplesDir, dirname(demoDir))}`;
  const checked = [];
  const problems = [];

  declared.forEach((name) => {
    const pkg = packages.get(name);

    if (!pkg) {
      problems.push({
        summary: `${name}: no workspace package has this name.`,
        detail: ['The linker links only the packages the root package.json "workspaces" lists, so this demo',
          'would keep the copy installed from the npm registry.'],
        remedy: 'List the package in the root package.json "workspaces", or drop the dependency from the demo.',
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
        remedy: `Build it, then relink the demo: ${buildCommand(repoRoot, pkg)} && ${install}`,
      });

      return;
    }

    const expected = realpathSync(pkg.buildDir);
    const copies = packageCopies(demoDir, examplesDir, name);
    const dangling = danglingLinks(demoDir, examplesDir, name);
    const strays = copies.filter(copy => realpathSync(copy) !== expected);
    // The linker copies its links from here. Unless this one resolves to the local build, reinstalling the demo
    // has nothing to link from, and only the root install (which recreates the workspace link) helps.
    const linkerSource = join(examplesDir, 'node_modules', ...name.split('/'));
    const linkerSourceOk = copies.includes(linkerSource) && !strays.includes(linkerSource);
    const remedy = linkerSourceOk
      ? `Install and link the demo: ${install}`
      : `Recreate the workspace links, then install and link the demo: pnpm install && ${install}`;

    if (copies.length === 0) {
      problems.push({
        summary: `${name}: not installed for this demo.`,
        detail: [`Expected a link to ${buildDir} in a node_modules directory above ${demo}.`],
        remedy,
      });
    } else if (strays.length > 0 || dangling.length > 0) {
      problems.push({
        summary: strays.length > 0
          ? `${name}: resolves to a copy that is not the local build ${buildDir}.`
          : `${name}: a link on the demo's path points at nothing, not at the local build ${buildDir}.`,
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
          linkerSourceOk
            ? 'The linker replaces these with links to the local build when examples:install runs it.'
            : `The linker copies its links from ${display(repoRoot, linkerSource)}, which does not resolve to `
              + 'the local build either.',
        ],
        remedy,
      });
    }
  });

  return { demo, skipped: null, checked, problems };
}
