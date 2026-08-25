/**
 * Bootstraps a linked git worktree so it behaves like the main checkout.
 *
 * A `git worktree` only materialises TRACKED files. Everything an agent relies
 * on that is gitignored or lives outside the repo is therefore absent at birth:
 * the per-package `node_modules` trees, the permission allowlist in
 * `.claude/settings.local.json`, the code-review-graph, and — the costly one —
 * the Claude project memory, which is keyed by the cwd path and so resolves to
 * a different, empty directory in every worktree.
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
import { access, copyFile, lstat, mkdir, readlink, rm, symlink, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { gitDir, repoRoot } from '../../.github/scripts/lib/repo-root.mjs';

const ROOT = repoRoot();
const checkOnly = process.argv.includes('--check');
const dryRun = process.argv.includes('--dry-run');
const skipInstall = process.argv.includes('--skip-install');

// Written last, so its presence means every earlier step succeeded. Kept in the
// worktree's own git directory: per-checkout state that is never committed and
// disappears with the worktree itself.
const MARKER = 'claude-worktree-ready';

// Resolved once. `gitDir()` reads the `.git` pointer file, and two calls could
// in principle disagree.
const GIT_DIR = gitDir(ROOT);

const log = msg => console.log(`[setup-worktree] ${msg}`);

const exists = p => access(p).then(() => true, () => false);

/**
 * Whether a path exists as a directory entry, INCLUDING a symlink whose target
 * is gone. `access()` follows links and so reports a dangling one as absent,
 * which would make a repair step believe there is nothing to replace.
 *
 * @param {string} p The path to test.
 * @returns {Promise<boolean>} True when the entry itself exists.
 */
const entryExists = p => lstat(p).then(() => true, () => false);

/**
 * The main checkout that owns this worktree, or null when run in the main
 * checkout itself.
 *
 * In a linked worktree `<root>/.git` is a FILE pointing at
 * `<main>/.git/worktrees/<name>`, so the main checkout is that path's
 * great-grandparent.
 *
 * @returns {string|null} The main checkout path, or null outside a worktree.
 */
function mainCheckout() {
  return isWorktreeGitDir(GIT_DIR) ? worktreeRootFromGitDir(GIT_DIR) : null;
}

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
 * Claude derives the name from the absolute path, but the exact character class
 * it replaces is its own private convention. Observed here: separators AND dots
 * become dashes, so `.claude` turns into `--claude`. Whether it also rewrites
 * other characters (an underscore in a worktree name, a Windows drive colon) is
 * NOT established, and guessing wrong would put the memory link in a directory
 * nothing reads — a failure with no symptom.
 *
 * So do not guess: return both readings, most-specific first, and let the caller
 * pick whichever actually exists on disk.
 *
 * @param {string} checkout The checkout path.
 * @returns {string[]} Candidate absolute paths, preferred first.
 */
function projectStateCandidates(checkout) {
  const base = path.join(homedir(), '.claude', 'projects');

  return [
    path.join(base, checkout.replace(/[/\\.]/g, '-')),
    path.join(base, checkout.replace(/[^a-zA-Z0-9]/g, '-')),
  ];
}

/**
 * The project state directory for a checkout: the first candidate that exists,
 * falling back to the preferred spelling when none does.
 *
 * @param {string} checkout The checkout path.
 * @returns {Promise<string>} The project state directory.
 */
async function projectStateDir(checkout) {
  const candidates = projectStateCandidates(checkout);

  for (const candidate of candidates) {
    if (await entryExists(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}

const MAIN = mainCheckout();

// Only act when run as a script. The pure helpers below are exported so the
// tooling tests can exercise them without the module bootstrapping anything.
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
    await bootstrap();
  }
}

export { isWorktreeGitDir, projectStateCandidates, worktreeRootFromGitDir };

/**
 * Read-only readiness probe for the SessionStart hook.
 *
 * Reports ONLY problems this script can actually repair. A gap whose source is
 * missing in the main checkout is not actionable, and naming it would tell the
 * agent to run a bootstrap that provably cannot fix it — every session, forever.
 *
 * @returns {Promise<void>} Resolves once the verdict is printed.
 */
async function reportReadiness() {
  const problems = [];
  const nodeModules = path.join(ROOT, 'node_modules');

  if (!(await exists(path.join(GIT_DIR, MARKER)))) {
    problems.push('never bootstrapped');
  }

  // A symlinked root node_modules resolves root binaries, so lint passes and the
  // worktree looks healthy, but every package-local `.bin` is missing and
  // `npm --prefix <pkg> run <task>` dies with exit 127 partway through a build.
  const link = await lstat(nodeModules).catch(() => null);

  if (link?.isSymbolicLink()) {
    problems.push('node_modules is a symlink to the main checkout (breaks package scripts)');
  }
  if (!(await exists(path.join(ROOT, 'handsontable', 'node_modules')))) {
    problems.push('handsontable/node_modules missing');
  }
  if (
    !(await exists(path.join(ROOT, '.claude', 'settings.local.json'))) &&
    await exists(path.join(MAIN, '.claude', 'settings.local.json'))
  ) {
    problems.push('.claude/settings.local.json missing (expect permission prompts)');
  }

  const mainMemory = path.join(await projectStateDir(MAIN), 'memory');

  if (!(await exists(path.join(await projectStateDir(ROOT), 'memory'))) && await exists(mainMemory)) {
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
 * Performs the bootstrap.
 *
 * @returns {Promise<void>} Resolves once every step has run.
 */
async function bootstrap() {
  await installDependencies();
  await copyLocalSettings();
  await linkProjectMemory();
  await reportGraph();
  await writeMarker();
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

    if (!dryRun) {
      await rm(nodeModules, { force: true });
    }
  }

  if (dryRun) {
    log('Would run: pnpm install --frozen-lockfile');

    return;
  }

  log('Installing dependencies (pnpm install --frozen-lockfile)…');

  const install = spawnSync('pnpm', ['install', '--frozen-lockfile'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (install.status !== 0) {
    log('Install failed — fix it before using this worktree.');
    process.exitCode = 1;
  }
}

/**
 * Step 2 — the permission allowlist.
 *
 * `.claude/settings.local.json` is gitignored, so it never reaches a worktree.
 * Copied rather than symlinked: a worktree may legitimately need to add a rule
 * without editing the main checkout's file.
 *
 * @returns {Promise<void>} Resolves once the file is in place.
 */
async function copyLocalSettings() {
  const relative = path.join('.claude', 'settings.local.json');
  const source = path.join(MAIN, relative);
  const target = path.join(ROOT, relative);

  if (await exists(target)) {
    log('.claude/settings.local.json already present — left untouched.');

    return;
  }
  if (!(await exists(source))) {
    log('No .claude/settings.local.json in the main checkout — nothing to copy.');

    return;
  }

  if (dryRun) {
    log('Would copy .claude/settings.local.json from the main checkout.');

    return;
  }

  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(source, target);
  log('Copied .claude/settings.local.json from the main checkout.');
}

/**
 * Step 3 — project memory.
 *
 * The highest-value step. Claude keys its project directory by cwd, so a
 * worktree session starts with an empty memory and none of the accumulated
 * project facts. Symlinking the memory directory back to the main checkout's
 * makes one shared memory serve every worktree, which is what the content
 * assumes — the facts are about the repository, not about a checkout of it.
 *
 * @returns {Promise<void>} Resolves once the link is in place.
 */
async function linkProjectMemory() {
  const mainMemory = path.join(await projectStateDir(MAIN), 'memory');

  if (!(await exists(mainMemory))) {
    log('Main checkout has no memory directory yet — nothing to link.');

    return;
  }

  const worktreeState = await projectStateDir(ROOT);
  const worktreeMemory = path.join(worktreeState, 'memory');
  const entry = await lstat(worktreeMemory).catch(() => null);

  if (entry && !entry.isSymbolicLink()) {
    log('Project memory is a real directory here — left untouched.');

    return;
  }
  if (entry?.isSymbolicLink()) {
    // A link whose target moved reads as "absent" to --check and as "present" to
    // a naive lstat guard, so the warning would repeat forever while every
    // re-run reported success. Repair it instead.
    if (await exists(worktreeMemory)) {
      log('Project memory already linked — left untouched.');

      return;
    }

    log(`Replacing a dangling project memory link -> ${await readlink(worktreeMemory)}`);

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
 * Step 4 — the code-review graph.
 *
 * `.code-review-graph/` is gitignored and branch-stamped. A stale graph is
 * worse than none: it answers cross-file queries with the wrong branch's
 * structure. Report, and let the agent decide when to spend the rebuild.
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
 * Step 5 — the marker.
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
  if (!(await exists(path.join(ROOT, 'handsontable', 'node_modules')))) {
    log('handsontable/node_modules is still missing — not marking this worktree ready.');

    return;
  }

  await writeFile(path.join(GIT_DIR, MARKER), `${new Date().toISOString()}\n`, 'utf8');
  log('Worktree ready.');
}
