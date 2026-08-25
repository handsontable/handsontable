# Worktrees — what a linked checkout is missing, and how to fix it

Agents in this repo increasingly work in a linked git worktree under
`.claude/worktrees/`. That isolates parallel work, but a worktree is not a copy of
your checkout. `git worktree` materializes **tracked files only**. Everything else
an agent depends on is gitignored or lives outside the repo, so it is absent the
moment the worktree is born.

This page lists what is missing, what each gap actually breaks, and the one command
that closes them.

## If you do not use worktrees

Nothing here changes anything for you. The bootstrap script exits immediately in a
normal clone, the SessionStart hook it wires in prints nothing there, and every
default — ports, scripts, test commands — is unchanged. `HOT_TEST_PORT` is a new
variable name that nothing sets unless you set it.

## The one command

```bash
node scripts/claude/setup-worktree.mjs
```

Run it once per worktree, before you build or test. It is idempotent, so re-running
it is safe. `--check` reports readiness without writing anything, and the
SessionStart hook uses it to warn you.

## What is missing, and what it breaks

| Missing | Why | What breaks |
|---|---|---|
| Per-package `node_modules` | Not tracked. The harness symlinks only the **root** `node_modules`. | `npm --prefix handsontable run test:unit` exits 127 with `env-cmd: command not found`. Every package script fails the same way. |
| `.claude/settings.local.json` | Gitignored. | The permission allowlist is gone. The agent is prompted for `git`, `gh`, and `npm` calls that are approved in the main checkout. |
| Claude project memory | Lives in `~/.claude/projects/<slug>/`, keyed by the **cwd path**. A worktree has a different path, so it gets a different, empty directory. | Every accumulated project fact is unavailable. The agent loses the conventions it learned, so it falls back to generic behavior and reaches for repo skills less often. |
| `.code-review-graph/` | Gitignored, and stamped with the branch it was built on. | Cross-file queries either fail or answer from another branch's structure. |
| `handsontable/tmp`, `dist`, `styles` | Build outputs. | Wrappers cannot resolve the core until you build it. |
| `dev*.html` demo pages | Gitignored. | Manual test pages from the `handsontable-demo-page` skill do not carry over. |
| The `prepare` script's effects | It runs on `pnpm install`. | Without a real install, lefthook is not wired and `.cursor/rules/` is not synced. |

The memory gap is the expensive one. It is invisible — nothing errors, the agent
simply knows less.

## Never symlink `node_modules`

A symlinked root `node_modules` looks like it works. Root binaries such as `eslint`
resolve, so lint passes and the agent assumes the worktree is healthy. But pnpm puts
each package's dependencies and `.bin` shims inside that package's own
`node_modules`, and those directories do not exist. The failure arrives later, in
the middle of a build, as a bare `command not found`.

The legacy Jasmine suite fails the same way, reporting `jasmine is not defined`,
which reads like a test bug rather than a setup problem.

Run a real `pnpm install` in the worktree. The setup script removes the symlink for
you before installing.

A symlink also escapes `.gitignore`. The rule was `node_modules/`, and a trailing
slash matches directories only — so git reported the symlink as untracked, and
`git add -A` would have committed a link holding an absolute path from one machine.
`.gitignore` now carries both spellings.

## Fixed ports collide across worktrees

Three Playwright configs bind fixed ports:

| Config | Port | Behavior |
|---|---|---|
| `tests/playwright.config.ts` | `8123` | Starts a server, `reuseExistingServer` when not on CI. |
| `visual-tests/playwright-cross-browser.config.ts` | `8082` | Same. |
| `visual-tests/playwright.config.ts` | `8082` | **Starts no server at all** — it attaches to whatever is already listening. |

So if worktree A is already serving on 8123, worktree B silently attaches to **A's
server and A's build**. The specs run and report results, but those results describe
the other worktree's code. Nothing warns you. The third config is the worst case: it
never starts a server, so it always tests someone else's.

**The functional suite is fixable and fixed.** `tests/playwright.config.ts` reads
`HOT_TEST_PORT` and passes it to its own server, so the two always agree:

```bash
HOT_TEST_PORT=8124 npx playwright test
```

The variable is namespaced deliberately. A bare `PORT` is a name many shells and
tools already export, and reading it would retarget the suite for people who never
asked.

**The visual suite is not, and you should not try.** Its port is owned in three
other places: `EXAMPLES_SERVER_PORT` in `visual-tests/src/config.mjs`, which
`scripts/run-tests.mjs` uses to launch the server, and a hardcoded
`app.listen(8082)` in both `examples/next/visual-tests/react-wrapper/demo/server.js`
and the Angular equivalent, neither of which reads `--port` at all. Changing only
the Playwright config points the browser at a port nothing is serving and fails
every spec. Run visual tests from one checkout at a time.

Before believing a failure, check what is on the port:

```bash
lsof -i :8123
```

For the functional suite, set `HOT_TEST_PORT` as shown above.

## Housekeeping

Worktrees are not free. Each full install measures around 1.6 GB with `du`. On APFS
the files are copy-on-write clones, so true disk use is lower than that number
suggests — but it is not zero, and the trees add up.

List what exists and remove what is finished:

```bash
git worktree list          # `prunable` marks a directory that is already gone
git worktree prune         # clears the stale bookkeeping
git worktree remove <path> # removes a finished worktree
```

A worktree marked `locked` is deliberately protected. Ask before removing one.

Removing a worktree does not remove its `~/.claude/projects/<slug>/` directory.
Those accumulate, one per worktree ever created.

## Rules

- Bootstrap a worktree before building or testing in it. Do not debug a failure in an
  unbootstrapped worktree — fix the setup first.
- Never symlink `node_modules`.
- Never commit in a worktree without asking. A commit blocks the worktree from being
  removed cleanly.
- Rebase a long-lived worktree. It carries the `AGENTS.md`, `.ai/`, and
  `.claude/skills/` of the commit it branched from, so guidance drifts as `develop`
  moves.
- Check the SessionStart banner. It reports which branch the code-review graph was
  built on, and a mismatch means cross-file answers are untrustworthy.

## Proposed, not yet adopted

Promote the team-safe rules from `.claude/settings.local.json` into the tracked
`.claude/settings.json`. Every worktree would then get them with no bootstrap step
at all. Splitting personal rules from shared ones is a judgment call, so the
bootstrap copies the file for now.
