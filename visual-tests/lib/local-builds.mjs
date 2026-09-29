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
 * `build` script, so each way of building a demo runs it (`scripts/build.mjs`, and the cross-browser leg and the
 * stability matrix that build the js demo directly). It refuses unless every monorepo package the demo declares
 * resolves to the local build. `scripts/build.mjs` runs `findBuildProblems()` before it installs anything: the
 * core must be built and no older than its sources, and each wrapper the tier renders must be built.
 *
 * Node built-ins only. The demo guard runs in whatever tree the demo's install left behind, and the tooling
 * tests run with no dependencies installed. See visual-tests/AGENTS.md (Local builds).
 */
import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

/**
 * Directories under a package's `src/` that the build does not compile, so the age check skips them.
 */
const IGNORED_SOURCE_DIRS = new Set(['__tests__', 'test']);

/**
 * Files under `src/` that the build does not compile: the Markdown beside the code (every plugin carries an
 * `AGENTS.md`, edited more often than the plugin) and test-only assets such as `walkontable.test.css`.
 */
const IGNORED_SOURCE_FILE = /\.md$|\.test\.\w+$/;

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
 * Lists the monorepo's workspace packages and where each one's local build lives.
 *
 * The list is the root `package.json` `workspaces`, the one `examples/scripts/link-packages.mjs` reads, so this
 * checks exactly what the linker links. An entry is a directory or a directory followed by `/*`. The local
 * build is what pnpm links a workspace package to: its `publishConfig.directory` when `linkDirectory` is set
 * (`handsontable/tmp`, `wrappers/angular-wrapper/dist/hot-table`), and the package directory otherwise (the
 * React and Vue wrappers, whose builds land in `es/` and `commonjs/` beside their manifest).
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
    const buildDir = publishConfig?.linkDirectory && publishConfig?.directory
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
 * Finds the newest file in a tree, by modification time.
 *
 * @param {string} dir The tree to walk.
 * @param {object} [options] Options.
 * @param {Set<string>} [options.ignoreDirs] Directory names to skip, at any depth.
 * @param {RegExp} [options.ignoreFile] File names to skip.
 * @returns {{path: string, mtimeMs: number}|null} The newest file, or `null` for an empty tree.
 */
export function newestFile(dir, { ignoreDirs = new Set(), ignoreFile = null } = {}) {
  return readdirSync(dir, { withFileTypes: true, recursive: true }).reduce((newest, entry) => {
    const parent = entry.parentPath ?? entry.path;
    const skipped = relative(dir, parent).split(/[\\/]/).some(segment => ignoreDirs.has(segment));

    if (!entry.isFile() || skipped || ignoreFile?.test(entry.name)) {
      return newest;
    }

    const path = join(parent, entry.name);
    const { mtimeMs } = statSync(path);

    return !newest || mtimeMs > newest.mtimeMs ? { path, mtimeMs } : newest;
  }, null);
}

/**
 * Finds what stops `scripts/build.mjs` from rendering the local builds, before it installs anything.
 *
 * Three checks. The core is built: `handsontable/tmp` holds its manifest and ES entry. The core build is no
 * older than its sources: the newest file under `handsontable/src` (tests and Markdown aside) is not newer than
 * `handsontable/tmp/package.json`, which `postbuild` writes when it composes the package. That stamp, rather
 * than the newest file in the tree, is deliberate: a partial rebuild (`build:styles` alone, or a task run
 * through `scripts/run.mjs`, which skips `postbuild`) leaves some output current and the rest stale, and the
 * full build is the one command that makes all of it current. And each wrapper the tier renders is built. The
 * age check reads modification times, and CI extracts `handsontable/tmp` from the Build job's artifact with the
 * times of that job, earlier than this job's checkout of the sources, so it is off on CI, where the render job
 * composes the tree for the commit it checked out. The wrappers' age is not checked.
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
  } else if (checkAge) {
    const source = newestFile(join(core.dir, 'src'), {
      ignoreDirs: IGNORED_SOURCE_DIRS,
      ignoreFile: IGNORED_SOURCE_FILE,
    });
    const stamp = join(core.buildDir, 'package.json');
    const composedMs = statSync(stamp).mtimeMs;

    if (source && source.mtimeMs > composedMs) {
      problems.push({
        summary: `The core build is older than its sources: ${display(repoRoot, core.buildDir)} predates `
          + `${display(repoRoot, source.path)}.`,
        detail: [
          `Newest source: ${display(repoRoot, source.path)} (${new Date(source.mtimeMs).toISOString()})`,
          `Build composed: ${display(repoRoot, stamp)} (${new Date(composedMs).toISOString()})`,
          'The demos would render the previous build, not the sources in this checkout.',
        ],
        remedy: `Build the core first: ${buildCommand(repoRoot, core)}`,
      });
    }
  }

  wrappers.forEach((wrapper) => {
    const pkg = [...packages.values()].find(({ dir }) => display(repoRoot, dir) === `wrappers/${wrapper}`);
    const missing = pkg ? missingBuildFile(repoRoot, pkg) : `wrappers/${wrapper}/package.json`;

    if (missing) {
      problems.push({
        summary: `The ${wrapper} build is missing: ${missing} does not exist.`,
        detail: [`The tier renders the ${wrapper} demo, which imports that build.`]
          .concat(pkg ? missingBuildEffect(pkg) : []),
        remedy: `Build it first: npm --prefix wrappers/${wrapper} run build`,
      });
    }
  });

  return problems;
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
  const copies = [];

  for (let dir = fromDir; ; dir = dirname(dir)) {
    const candidate = join(dir, 'node_modules', ...name.split('/'));

    // `existsSync` follows the link, so a dangling one is skipped the way the resolver skips it.
    if (existsSync(join(candidate, 'package.json'))) {
      copies.push(candidate);
    }

    if (dir === stopDir || dir === dirname(dir)) {
      break;
    }
  }

  return copies;
}

/**
 * Checks that every monorepo package a demo declares resolves to its local build, the demo guard's judgement.
 *
 * The packages are the demo's `dependencies` and `devDependencies` named `handsontable` or `@handsontable/*`:
 * the core, and the wrapper for a wrapper demo. Each one must be a workspace package, since the linker links
 * nothing else; its local build must exist; the demo's tree must hold at least one copy (up to the `examples/`
 * workspace, where pnpm links the local builds and the linker reads them); and every such copy must resolve to
 * the local build. A demo outside `examples/next/` is skipped, since the linker links `next/` only and a
 * versioned copy is pinned to a published release on purpose.
 *
 * @param {object} options Options.
 * @param {string} options.repoRoot The repository root.
 * @param {string} options.demoDir The demo's directory.
 * @returns {{skipped: string|null, checked: Array<{name: string, buildDir: string}>, problems: Array<{summary:
 *   string, detail: string[], remedy: string}>}} What was checked and what is wrong.
 */
export function checkLinkedPackages({ repoRoot: givenRoot, demoDir: givenDemoDir }) {
  // Real paths throughout, so a symlinked checkout or temp directory cannot make the demo look like it sits
  // outside `examples/next/`, or a copy like it sits outside the demo's tree.
  const repoRoot = realpathSync(givenRoot);
  const demoDir = realpathSync(givenDemoDir);
  const examplesDir = join(repoRoot, 'examples');
  const demoPath = display(examplesDir, demoDir);

  if (!demoPath.startsWith('next/')) {
    return {
      skipped: `${display(repoRoot, demoDir)} is not under examples/next/, and the linker links next/ only.`,
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
    const expected = missing ? null : realpathSync(pkg.buildDir);
    const copies = packageCopies(demoDir, examplesDir, name);
    const strays = copies.filter(copy => realpathSync(copy) !== expected);
    // The linker copies from here, so a stray at this spot survives a reinstall of the demo, and only the root
    // install (which recreates the workspace link) removes it.
    const linkerSource = join(examplesDir, 'node_modules', ...name.split('/'));

    checked.push({ name, buildDir });

    if (missing) {
      problems.push({
        summary: `${name}: the local build is missing (${missing}).`,
        detail: missingBuildEffect(pkg),
        remedy: `Build it, then relink the demo: ${buildCommand(repoRoot, pkg)} && ${install}`,
      });
    } else if (copies.length === 0) {
      // The walk ends at the linker's source, so finding nothing means that link is missing too, and a
      // reinstall of the demo alone would have nothing to link from.
      problems.push({
        summary: `${name}: not installed for this demo.`,
        detail: [`Expected a link to ${buildDir} in a node_modules directory above ${display(repoRoot, demoDir)}.`],
        remedy: `Recreate the workspace links, then install and link the demo: pnpm install && ${install}`,
      });
    } else if (strays.length > 0) {
      problems.push({
        summary: `${name}: resolves to a copy that is not the local build ${buildDir}.`,
        detail: strays.map((copy) => {
          const { version } = readJson(join(copy, 'package.json'));

          // A link here points somewhere other than the local build; a plain directory is what an install
          // leaves behind when the linker does not replace it.
          return lstatSync(copy).isSymbolicLink()
            ? `${display(repoRoot, copy)} links to ${display(repoRoot, realpathSync(copy))} (version ${version}).`
            : `${display(repoRoot, copy)} is a plain copy of version ${version}, not a link.`;
        }).concat('An install without the linker leaves the registry copy in place; examples:install links it.'),
        remedy: strays.includes(linkerSource)
          ? `Recreate the workspace links, then relink the demo: pnpm install && ${install}`
          : `Install and link the demo: ${install}`,
      });
    }
  });

  return { skipped: null, checked, problems };
}
