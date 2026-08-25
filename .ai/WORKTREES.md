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

## The two mechanisms

**`.worktreeinclude`** at the repository root copies gitignored *files* into every
worktree Claude Code creates — `--worktree`, subagent isolation, and the desktop
app. It uses `.gitignore` syntax, and only copies files that match and are also
gitignored. It does not run for a worktree made with `git worktree add` by hand, or
when a `WorktreeCreate` hook replaces the mechanism.

It cannot install dependencies, and it cannot reach anything outside the repository
— which is where the costliest gap lives. It also does not run for a hand-made
worktree, so the bootstrap copies the plain paths it lists as a fallback. Glob
patterns stay Claude Code's job.

So it does not replace:

```bash
node scripts/claude/setup-worktree.mjs
```

Run that once per worktree, before you build or test. It is idempotent, so
re-running is safe. `--check` reports readiness without writing anything, and the
SessionStart hook uses it to warn you.

## What is missing, and what it breaks

| Missing | Why | What breaks |
|---|---|---|
| Per-package `node_modules` | Not tracked. The root one may be created as a symlink to the main checkout, or be absent entirely. | `npm --prefix handsontable run test:unit` exits 127 with `env-cmd: command not found`. Every package script fails the same way. |
| Claude project memory | Lives in `~/.claude/projects/<slug>/`, keyed by the **checkout path**. A worktree has a different path, so it gets a different, empty directory. | Every accumulated project fact is unavailable. The agent loses the conventions it learned, so it falls back to generic behavior and reaches for repo skills less often. |
| The local enforcement hooks | They resolve paths against the checkout the hook script lives in, and `${CLAUDE_PROJECT_DIR}` does not follow a session into a worktree. | The PostToolUse spec autolint and the Stop new-Jasmine-spec block **fail open**: they do not error, they simply never match, and the Stop verdict is always "ok". |
| `docs/.env`, `docs/tests/.env` | Gitignored. | Docs work and the docs test suite fail there. `.worktreeinclude` covers worktrees Claude Code creates; the bootstrap copies them for a hand-made one. |
| `.code-review-graph/` | Gitignored, and stamped with the branch it was built on. | Cross-file queries either fail or answer from another branch's structure. Deliberately not copied — a stale graph is worse than none. |
| `handsontable/tmp`, `dist`, `styles` | Build outputs. | Wrappers cannot resolve the core until you build it. Deliberately not copied — a stale bundle is the "wrong build" trap again. |
| `dev*.html` demo pages | Gitignored. | Manual test pages from the `handsontable-demo-page` skill do not carry over. |
| The `prepare` script's effects | It runs on `pnpm install`. | Without a real install, lefthook is not wired and `.cursor/rules/` is not synced. |

The memory gap is the expensive one. It is invisible — nothing errors, the agent
simply knows less.

**Permission approvals are not on this list, and do not need to be.** Since Claude
Code v2.1.211, choosing "don't ask again" inside a worktree saves the rule to the
**main checkout's** `.claude/settings.local.json`, and it applies in the main
checkout and in every worktree of the repository. Copying that file into a worktree
would only create a second copy that drifts. Project-scope plugins are shared the
same way.

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

## What a worktree shares with the main checkout

A worktree has its own files and branch, but one `.git` directory serves them all.
That surprises people in four ways:

- **A branch can only be checked out once.** `git checkout develop` in a worktree
  fails with `already checked out at …` when another worktree or the main checkout
  is on it. That reads like a broken worktree; it is not.
- **The stash stack, refs, and config are shared.** A bare `git stash pop` can take
  another session's work. Prefer a temporary commit, or `git stash push -m <tag>`
  and apply by SHA.
- **Git hooks are shared.** `git rev-parse --git-path hooks` resolves to the main
  checkout's `.git/hooks` even from inside a worktree, so the `pnpm install` this
  page recommends runs `lefthook install` and rewrites the **shared** hooks with the
  worktree's absolute path, leaving a `pre-commit.old` behind. The generated stub
  falls back gracefully, so this is a papercut rather than a break — but it is the
  main checkout's state, changed from a worktree.
- **Permission approvals and project-scope plugins are shared**, as described above.

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

**Worktrees hold copies of your secrets.** The files `.worktreeinclude` carries are
env files — `docs/.env` holds `DB_USER`, `DB_PASS`, and `GH_TOKEN`, and
`docs/tests/.env` holds `PASS_COOKIE` and `VITE_SUPABASE_ANON_KEY`. Every worktree
gets its own copy, and a worktree you never `git worktree remove` keeps it
indefinitely. Nothing reaches a commit — `.claude/worktrees/` is gitignored — but
the copies are real files on disk, so remove worktrees you have finished with.

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
- Do not trust a green local gate in a worktree. The pre-commit and pre-push hooks
  still run, but the agent-time Claude hooks fail open there, so run the suite
  yourself.

## Known gaps

Two things this page documents but does not fix. Both are silent, so they are worth
knowing rather than discovering.

- **The port collision is avoidable, not prevented.** `HOT_TEST_PORT` only helps
  someone who already knows to set it; on defaults two checkouts still share one
  server. Closing it properly means teaching `tests/support/static-server.mjs` to
  report the root it serves and having the config refuse a server belonging to
  another checkout. That would also cover `visual-tests/playwright.config.ts`, which
  starts no server at all.
- **The agent-time enforcement hooks fail open in a worktree**, as the table above
  notes. Fixing it means resolving the session's checkout from the hook payload's
  `cwd` in `post-tool-use.mjs` and `stop.mjs`, the way `setup-worktree.mjs --check`
  now does.
