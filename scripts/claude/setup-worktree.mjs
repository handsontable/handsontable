/**
 * Bootstraps a linked git worktree so it behaves like the main checkout.
 *
 * A `git worktree` only materializes TRACKED files, so anything gitignored is
 * absent at birth: the per-package `node_modules` trees, the code-review graph,
 * and — the costly one — the Claude project memory, which lives outside the repo
 * and is keyed by the checkout path, so every worktree resolves to a different,
 * empty directory.
 *
 * `.worktreeinclude` at the repository root covers the file-copy half of this
 * for worktrees Claude Code creates. It cannot install dependencies, and it
 * cannot reach `~/.claude/projects`, which is why this script exists.
 *
 * Run once per worktree:
 *   node scripts/claude/setup-worktree.mjs
 *
 * Flags:
 *   --check         Report readiness and exit 1 when something this script can
 *                   repair is missing. Used by the SessionStart hook; writes
 *                   nothing, and stays silent outside a worktree.
 *   --skip-install  Do everything except the dependency install. Non-destructive:
 *                   an existing node_modules is left exactly as it is.
 *   --dry-run       Print the planned actions without performing them.
 *
 * Does nothing at all in the main checkout, so it is inert for anyone who does
 * not use worktrees.
 *
 * Safe to re-run: every step is idempotent.
 */
import { access, copyFile, lstat, mkdir, readlink, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { gitDir, repoRoot } from '../../.github/scripts/lib/repo-root.mjs';
import { readHookPayload } from './session.mjs';

const checkOnly = process.argv.includes('--check');
const dryRun = process.argv.includes('--dry-run');
const skipInstall = process.argv.includes('--skip-install');

// Bumped whenever a step is added, so a worktree bootstrapped by an older
// version stops reporting ready and gets the new step. The marker records this
// number; `--check` compares it.
const MARKER_VERSION = 1;

// Probed individually because a partial install satisfies one and not the other.
// The Playwright static server already preflights the HyperFormula artifact and
// warns when it is missing, because its absence turns the formulas fixtures into
// bare 404s in the middle of a run rather than a clean failure.
const REQUIRED_DEPS = {
  'handsontable/node_modules': path.join('handsontable', 'node_modules'),
  'tests/node_modules/hyperformula': path.join('tests', 'node_modules', 'hyperformula'),
};

// Per-checkout state that is never committed and disappears with the worktree.
const MARKER = 'claude-worktree-ready';

const log = msg => console.log(`[setup-worktree] ${msg}`);

const exists = p => access(p).then(() => true, () => false);

/**
 * The checkout this run is about.
 *
 * `repoRoot()` resolves from this file's own location, which is correct when the
 * script is run directly. It is NOT correct for the SessionStart hook: Claude
 * Code documents that `${CLAUDE_PROJECT_DIR}` stays at the directory the session
 * started in and does not follow the session into a worktree, while the `cwd`
 * field of the hook's stdin payload does follow it. So the hook runs the MAIN
 * checkout's copy of this script, and without reading that payload every worktree
 * would look like the main checkout and the readiness warning would never fire —
 * silent in exactly the case it exists for.
 *
 * @returns {string} The checkout root to operate on.
 */
function resolveRoot() {
  if (!checkOnly) {
    return repoRoot();
  }

  // Shared with the other hook scripts, and TTY-guarded: reading stdin to EOF
  // would otherwise hang `--check` when a developer runs it by hand.
  return checkoutRootFor(readHookPayload()?.cwd) ?? repoRoot();
}

/**
 * Walks up from a directory to the checkout that contains it.
 *
 * @param {string|undefined} from The starting directory.
 * @returns {string|null} The checkout root, or null when there is none.
 */
function checkoutRootFor(from) {
  if (!from || typeof from !== 'string') {
    return null;
  }

  let dir = path.resolve(from);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (gitDir(dir)) {
      return dir;
    }

    const parent = path.dirname(dir);

    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

const ROOT = resolveRoot();
const GIT_DIR = gitDir(ROOT);

/**
 * Whether a git directory belongs to a LINKED worktree rather than a normal
 * clone. A worktree's git directory is `<main>/.git/worktrees/<name>`, so its
 * parent is literally named `worktrees`.
 *
 * @param {string|null} dir The git directory.
 * @returns {boolean} True for a linked worktree.
 */
function isWorktreeGitDir(dir) {
  return Boolean(dir) && path.basename(path.dirname(dir)) === 'worktrees';
}

/**
 * The main checkout that owns a linked worktree's git directory — three levels
 * up from `<main>/.git/worktrees/<name>`.
 *
 * @param {string} dir The worktree's git directory.
 * @returns {string} The main checkout path.
 */
function worktreeRootFromGitDir(dir) {
  return path.dirname(path.dirname(path.dirname(dir)));
}

/**
 * Candidate directory names Claude Code may use for a checkout's project state.
 *
 * Claude Code builds the name by replacing every character that is not a letter
 * or a digit with a dash. Verified against a recorded session: the checkout
 * `…/.claude/worktrees/feature+DEV-1656_Autocomplete-dropdown-flex-layout` is
 * stored as `…--claude-worktrees-feature-DEV-1656-Autocomplete-dropdown-flex-layout`
 * — the `.`, the `+` and the `_` all became dashes.
 *
 * That underscore matters here: this repository names branches
 * `feature/DEV-xxxx_Name`, so most worktree directories contain one. Preferring
 * a spelling that keeps it would put the memory link in a directory Claude Code
 * never reads, and nothing would report a problem.
 *
 * The second candidate is the narrower historical reading, kept only so an
 * already-linked older worktree is still recognized rather than relinked.
 *
 * @param {string} checkout The checkout path.
 * @returns {string[]} Candidate absolute paths, preferred first.
 */
function projectStateCandidates(checkout) {
  const base = path.join(homedir(), '.claude', 'projects');

  return [
    path.join(base, checkout.replace(/[^a-zA-Z0-9]/g, '-')),
    path.join(base, checkout.replace(/[/\\.]/g, '-')),
  ];
}

/**
 * The project state directory to READ: the first candidate that exists, so an
 * older worktree linked under the narrower spelling is still recognized.
 *
 * Never use this to decide where to WRITE — see `projectStateWriteDir`.
 *
 * @param {string} checkout The checkout path.
 * @returns {Promise<string>} The project state directory.
 */
async function projectStateDir(checkout) {
  const candidates = projectStateCandidates(checkout);

  for (const candidate of candidates) {
    if (await lstat(candidate).then(() => true, () => false)) {
      return candidate;
    }
  }

  return candidates[0];
}

/**
 * The project state directory to WRITE to: always the verified spelling.
 *
 * Recognition and creation want different answers. If only the legacy spelling
 * exists — an older worktree where no session ever ran, so Claude Code never
 * created the correct directory — then writing to "the first that exists" would
 * put the memory link where Claude Code never looks, report "already linked",
 * and leave `--check` satisfied forever. That is exactly the invisible failure
 * this script exists to remove.
 *
 * @param {string} checkout The checkout path.
 * @returns {string} The project state directory to create in.
 */
function projectStateWriteDir(checkout) {
  return projectStateCandidates(checkout)[0];
}

const MAIN = isWorktreeGitDir(GIT_DIR) ? worktreeRootFromGitDir(GIT_DIR) : null;

// Only act when run as a script. The pure helpers are exported so the tooling
// tests can exercise them without the module bootstrapping anything.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!MAIN) {
    // --check runs from the SessionStart hook in EVERY session. Stay silent in
    // the main checkout: anything printed here is injected into the agent's
    // context on every start, for a condition that is not a problem.
    if (!checkOnly) {
      log('Not a linked worktree — nothing to bootstrap.');
    }
  } else if (checkOnly) {
    await reportReadiness();
  } else {
    try {
      await bootstrap();
    } catch (error) {
      // A throw after a multi-minute install would otherwise surface as a raw
      // unhandled rejection with no marker, so the only visible remedy is to run
      // the whole install again.
      log(`Bootstrap failed after the install: ${error.message}`);
      log('  Dependencies may already be in place — re-run this script; it is idempotent.');
      process.exitCode = 1;
    }
  }
}

export {
  checkoutRootFor,
  isWorktreeGitDir,
  parseWorktreeInclude,
  projectStateCandidates,
  projectStateWriteDir,
  worktreeRootFromGitDir,
};

/**
 * Read-only readiness probe for the SessionStart hook.
 *
 * Reports ONLY problems this script can actually repair. A gap whose source is
 * missing is not actionable, and naming it would tell the agent to run a
 * bootstrap that provably cannot fix it — every session, forever.
 *
 * @returns {Promise<void>} Resolves once the verdict is printed.
 */
async function reportReadiness() {
  const problems = [];

  problems.push(...await staleMarkerProblems());

  // A symlinked root node_modules resolves root binaries, so lint passes and the
  // worktree looks healthy, but every package-local `.bin` is missing and
  // `npm --prefix <pkg> run <task>` dies with exit 127 partway through a build.
  const link = await lstat(path.join(ROOT, 'node_modules')).catch(() => null);

  if (link?.isSymbolicLink()) {
    problems.push('node_modules is a symlink to the main checkout (breaks package scripts)');
  }

  for (const [label, probe] of Object.entries(REQUIRED_DEPS)) {
    if (!(await exists(path.join(ROOT, probe)))) {
      problems.push(`${label} missing`);
    }
  }

  const mainMemory = path.join(await projectStateDir(MAIN), 'memory');

  if (await exists(mainMemory) && !(await memoryLinkIsCorrect(mainMemory))) {
    problems.push('Claude project memory not linked (accumulated project facts will not load)');
  }

  if (problems.length) {
    console.log(
      `This worktree is not bootstrapped: ${problems.join('; ')}.\n` +
      'Run `node scripts/claude/setup-worktree.mjs` before building or testing.'
    );
    // Set the code rather than calling process.exit(): stdout to a pipe is
    // asynchronous on macOS, and exiting here can truncate the message the hook
    // exists to deliver.
    process.exitCode = 1;
  }
}

/**
 * Problems relating to the readiness marker itself.
 *
 * @returns {Promise<string[]>} Problem descriptions, empty when current.
 */
async function staleMarkerProblems() {
  const raw = await readFile(path.join(GIT_DIR, MARKER), 'utf8').catch(() => null);

  if (raw === null) {
    return ['never bootstrapped'];
  }

  const version = Number(raw.split(/\s+/)[0]);

  // A marker written before versioning, or by an older version, means steps
  // added since then never ran here. Presence alone is not readiness.
  return Number.isInteger(version) && version >= MARKER_VERSION
    ? []
    : ['bootstrapped by an older version of this script'];
}

/**
 * Whether the worktree's memory link exists AND points at the main checkout's
 * memory. A link left over from a moved or renamed checkout still resolves, so
 * "it resolves" is not the same as "it is correct" — and reading another
 * project's memory has no symptom at all.
 *
 * Checks the directory Claude Code actually reads, not the first spelling that
 * happens to exist: a link sitting only under the narrower legacy spelling loads
 * no memory at all, so reporting it as correct would hide the very problem this
 * probe is for.
 *
 * @param {string} mainMemory The main checkout's memory directory.
 * @returns {Promise<boolean>} True when the link is present and correct.
 */
async function memoryLinkIsCorrect(mainMemory) {
  const link = path.join(projectStateWriteDir(ROOT), 'memory');
  const target = await readlink(link).catch(() => null);

  if (target === null) {
    // Not a symlink: a real directory here is the user's own, so leave it be.
    return exists(link);
  }

  return path.resolve(path.dirname(link), target) === path.resolve(mainMemory);
}

/**
 * Performs the bootstrap.
 *
 * @returns {Promise<void>} Resolves once every step has run.
 */
async function bootstrap() {
  await installDependencies();
  await copyIncludedFiles();
  await linkProjectMemory();
  await reportGraph();
  await writeMarker();
}

/**
 * Copies the plain paths listed in `.worktreeinclude` from the main checkout.
 *
 * Claude Code applies that file itself, but only to worktrees IT creates. A
 * worktree made with `git worktree add` by hand gets nothing, so without this the
 * listed files would be missing and no check would mention them.
 *
 * Only literal paths are handled. Glob patterns are Claude Code's job, and
 * reimplementing gitignore matching here would be a second, drifting source of
 * truth — so a pattern is skipped and named rather than half-supported.
 *
 * @returns {Promise<void>} Resolves once the files are in place.
 */
async function copyIncludedFiles() {
  const manifest = await readFile(path.join(ROOT, '.worktreeinclude'), 'utf8').catch(() => null);

  if (manifest === null) {
    return;
  }

  for (const entry of parseWorktreeInclude(manifest)) {
    if (/[*?[\]!]/.test(entry)) {
      log(`Skipping the pattern "${entry}" — only Claude Code expands those.`);
      continue;
    }

    const target = path.join(ROOT, entry);

    if (await exists(target)) {
      continue;
    }

    const source = path.join(MAIN, entry);

    if (!(await exists(source))) {
      continue;
    }

    if (dryRun) {
      log(`Would copy ${entry} from the main checkout.`);
      continue;
    }

    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
    log(`Copied ${entry} from the main checkout.`);
  }
}

/**
 * The meaningful lines of a `.worktreeinclude` file.
 *
 * @param {string} manifest The file contents.
 * @returns {string[]} Entries, with comments and blank lines removed.
 */
function parseWorktreeInclude(manifest) {
  return manifest
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '' && !line.startsWith('#'));
}

/**
 * Step 1 — dependencies.
 *
 * @returns {Promise<void>} Resolves once the install has run.
 */
async function installDependencies() {
  if (skipInstall) {
    // Deliberately BEFORE the symlink removal. Removing the link and then not
    // installing would leave the worktree with no dependencies at all — strictly
    // worse than it started, and not what "skip the install" promises.
    log('Skipping install (--skip-install); node_modules left untouched.');

    return;
  }

  const nodeModules = path.join(ROOT, 'node_modules');
  const link = await lstat(nodeModules).catch(() => null);

  if (link?.isSymbolicLink()) {
    log(`Removing node_modules symlink -> ${await readlink(nodeModules)}`);
    log('  A symlinked node_modules leaves every package-local .bin missing.');

    // Must happen before the install: pnpm would otherwise write THROUGH the
    // link into the main checkout's tree.
    if (!dryRun) {
      await rm(nodeModules, { force: true });
    }
  }

  if (dryRun) {
    log('Would run: pnpm install --frozen-lockfile');

    return;
  }

  log('Installing dependencies (pnpm install --frozen-lockfile)…');

  // Strip GIT_DIR/GIT_WORK_TREE: this child gets an explicit cwd, and the root
  // `prepare` script runs `lefthook install`, which writes git state. With either
  // variable inherited from a hook environment, that write targets the wrong
  // git directory (.ai/LOCAL-ENFORCEMENT.md).
  const { GIT_DIR: _gitDir, GIT_WORK_TREE: _gitWorkTree, ...env } = process.env;

  const install = spawnSync('pnpm', ['install', '--frozen-lockfile'], {
    cwd: ROOT,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (install.status !== 0) {
    // status is null when the binary could not be spawned at all (no pnpm on
    // PATH); the reason is on `error`, and dropping it leaves a bare "failed"
    // right after the node_modules symlink may have been removed.
    log(`Install failed${install.error ? `: ${install.error.message}` : '.'}`);

    if (link?.isSymbolicLink()) {
      log('  The node_modules symlink was removed first, so this worktree now has NO dependencies.');
      log('  Recover with: pnpm install --frozen-lockfile');
    }

    process.exitCode = 1;
  }
}

/**
 * Step 2 — project memory.
 *
 * The highest-value step, and the one nothing else can do: `.worktreeinclude`
 * copies files inside the repository, and this target lives outside it.
 *
 * Claude Code keys its project directory by the checkout path, so a worktree
 * session starts with an empty memory and none of the accumulated project facts.
 * Symlinking it back to the main checkout's makes one shared memory serve every
 * worktree, which is what the content assumes — the facts are about the
 * repository, not about a checkout of it.
 *
 * @returns {Promise<void>} Resolves once the link is in place.
 */
async function linkProjectMemory() {
  const mainMemory = path.join(await projectStateDir(MAIN), 'memory');

  if (!(await exists(mainMemory))) {
    log('Main checkout has no memory directory yet — nothing to link.');

    return;
  }

  // The write target is always the verified spelling, never "the first that
  // exists" — linking under a legacy directory Claude Code does not read would
  // satisfy every later check while doing nothing.
  const worktreeState = projectStateWriteDir(ROOT);
  const worktreeMemory = path.join(worktreeState, 'memory');
  const entry = await lstat(worktreeMemory).catch(() => null);

  if (entry && !entry.isSymbolicLink()) {
    log('Project memory is a real directory here — left untouched.');

    return;
  }
  if (entry?.isSymbolicLink()) {
    if (await memoryLinkIsCorrect(mainMemory)) {
      log('Project memory already linked — left untouched.');

      return;
    }

    // Covers both a dangling link and one aimed somewhere else: the first reads
    // as "absent" to a follow-the-link check, the second reads as "present" and
    // silently serves another project's memory.
    log(`Replacing an incorrect project memory link -> ${await readlink(worktreeMemory)}`);

    if (!dryRun) {
      await rm(worktreeMemory, { force: true });
    }
  }

  if (dryRun) {
    log(`Would link project memory -> ${mainMemory}`);

    return;
  }

  try {
    await mkdir(worktreeState, { recursive: true });
    await symlink(mainMemory, worktreeMemory, 'dir');
    log(`Linked project memory -> ${mainMemory}`);
  } catch (error) {
    // Directory symlinks need Developer Mode or an elevated shell on Windows.
    // Report and continue: the install already succeeded and the marker should
    // still reflect that, rather than aborting on an unhandled rejection.
    log(`Could not link project memory (${error.code ?? error.message}).`);
    log(`  Link it by hand: ${worktreeMemory} -> ${mainMemory}`);
  }
}

/**
 * Step 3 — the code-review graph.
 *
 * `.code-review-graph/` is gitignored and branch-stamped. A stale graph is
 * worse than none: it answers cross-file queries with the wrong branch's
 * structure. Deliberately NOT copied by `.worktreeinclude` for that reason.
 *
 * @returns {Promise<void>} Resolves once the state is reported.
 */
async function reportGraph() {
  if (await exists(path.join(ROOT, '.code-review-graph'))) {
    log('code-review-graph present — rebuild it if the SessionStart banner reports another branch.');
  } else {
    log('No code-review-graph here. Build it with `code-review-graph build` before cross-file queries.');
  }
}

/**
 * Step 4 — the marker.
 *
 * Gated on the dependencies actually being present, not on an install having
 * been attempted, so `--skip-install` can never leave a marker that claims a
 * missing toolchain is ready.
 *
 * @returns {Promise<void>} Resolves once the verdict is printed.
 */
async function writeMarker() {
  if (dryRun) {
    return;
  }

  if (process.exitCode === 1) {
    log('Install failed — not marking this worktree ready.');

    return;
  }

  for (const [label, probe] of Object.entries(REQUIRED_DEPS)) {
    if (!(await exists(path.join(ROOT, probe)))) {
      log(`${label} is still missing — not marking this worktree ready.`);

      return;
    }
  }

  await writeFile(path.join(GIT_DIR, MARKER), `${MARKER_VERSION} ${new Date().toISOString()}\n`, 'utf8');
  log('Worktree ready.');
}
