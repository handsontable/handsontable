# Local enforcement — the definition of done before a commit or PR

Every change passes these **local** gates before it reaches CI. This is agent-first,
human-second: the **git hooks (lefthook) are the enforcement floor for everyone**, and
the **Claude Code hooks add an earlier, agent-time layer** on top. `--no-verify`
bypasses the git hooks, but CI re-runs the same checks — never rely on the bypass.

Setup is automatic: `pnpm install` runs the root `prepare` script
(`scripts/prepare-dev-env.mjs`), which wires the lefthook git hooks **and** syncs
`.claude/skills/` → `.cursor/rules/` — so Claude, Cursor, and plain-git devs all get
the same floor with no manual step. (Manual fallback: `npx lefthook install` and
`npm run sync-skills`.)

## The local gates (what runs, when)

| When | Gate | Runs | Blocks on |
|---|---|---|---|
| Agent-time (Claude Code) | `PostToolUse` (Edit/Write) | `eslint --fix` the edited spec | genuine lint errors in that spec |
| Agent-time (Claude Code) | `Stop` (turn end) | new-Jasmine check + the touched Playwright specs + the touched **unit** tests | a **new** `*.spec.js`; a **failing** touched spec or unit test |
| **pre-commit** (lefthook) | `scripts/lint-staged.mjs` | `eslint --fix` staged source/specs (determinism + anti-gaming), re-stage fixes | lint **errors** (warnings surface) |
| **pre-push** (lefthook) | `scripts/pre-push.mjs` | presence gate (block) → eslint on changed → test-weakening detector (warn) → changed Playwright specs → changed **unit** tests | missing test; lint errors; a failing spec or unit test |
| CI | `test.yml` + gates | the authoritative mirror of the above | see the pipeline |

Same rules, escalating authority: **agent-time → pre-commit → pre-push → CI.**

**Changed unit tests** run too — fast (Jest maps to `src`, no build), in both the
Stop hook and pre-push. A Jest *infra* failure (couldn't start) warns instead of
blocking (CI is authoritative), the same way the presence gate skips a config gap.
**A run that was killed is the same case.** A child aborted by Node on buffer
overflow (`ENOBUFS`) or by a signal produced no verdict — `spawnSync` returns
`status: null` with a truncated buffer, which is indistinguishable from a real
failure unless the caller inspects `error`/`signal`. `isSpawnInfraFailure()`
(`scripts/pre-push.mjs`) classifies it, and it warns instead of blocking. Every
hook-spawned test run also passes `TEST_RUN_MAX_BUFFER` (64 MB) so the run reaches
its summary rather than dying on Node's 1 MB default. The trade-off is deliberate:
a genuinely failing run whose output overflows stops blocking locally, and CI
catches it.
**Coverage is a CI floor, not a hook** (it needs a full instrumented run, too slow
for a hook): the `[CHECK] Coverage floor` job measures the percent of *added*
executable lines the unit tests cover (`.github/scripts/diff-coverage-gate.mjs`,
report-only at 80% until calibrated — a unit floor reads 0% for correctly
E2E-tested changes, so it earns "blocking" only after the numbers are trusted).

**Touched E2E specs run exactly once locally, whichever tool proves them first.**
The Stop hook and pre-push share a green-run cache (`hot-e2e-green.json` in the
checkout's git directory — `<root>/.git/` in a clone, `<main>/.git/worktrees/<name>/`
in a linked worktree; via `scripts/e2e-run-cache.mjs`) keyed on spec content + environment (dist bundle,
fixtures, Playwright config): with Claude, Stop proves the spec and pre-push skips
it; with Cursor (no agent hooks), pre-push proves it once and repeat pushes skip.
Editing the spec, rebuilding the dist, or touching a fixture invalidates the entry.
CI stays authoritative and always runs the full project on the PR.

## 1. Creating tests — exact rules

### Which test (by change)
Machine-enforced by the presence gate; full decision rules in
[`handsontable/.ai/TESTING.md`](../handsontable/.ai/TESTING.md).

- **User-visible** (render, interaction, keyboard, menus, overlays) → **Playwright E2E**, `tests/e2e/**/*.spec.ts`.
- **Logic / invisible** (data, indexing, algorithms, internal state) → **Jest unit**, `*.unit.js` in a `__tests__/` dir next to the source.
- **Public API / type surface** → a **type test**, `*.types.ts`.
- **Framework consumption** (wrapper / npm) → an integration demo (matrix; being built).
- **Pure refactor / non-runtime** (types, docs, config, i18n text, re-exports) → **no test**; declare `Refactor-only: <reason>` as a commit trailer.
- New Jasmine `*.spec.js` is **blocked** — new E2E is Playwright; migrate broken Jasmine specs rather than patch them.

### The meaningfulness bar (non-negotiable)
- **Intent-first:** encode the *intended* behavior (ideally before the code), not what the code currently does.
- **When red, diagnose which is wrong** — the code or the test's expectation — and fix whichever genuinely is. The code is the prime *suspect*, not a rule.
- **Never fake green:** no removed/loosened assertions, no `.skip`/`.only`/`xit`/`fit`, no `it()` with no assertion, no `it.flaky`. (Lint + the weakening detector enforce this.)
- **Bug fix → failing test first:** turn the repro into a test that fails *for the right reason*, then fix; it stays as a regression guard so nobody re-checks it by hand.
- **Run the impacted test green locally** before commit/push, and state the result with the run's evidence. For E2E that means **only the specs you created/changed** (the Stop hook and pre-push select exactly those); the full suite runs in PR CI and the develop nightly — never locally.
- **Coverage is the floor** (necessary); **mutation/meaningfulness is the ceiling** (sufficient). Never pad coverage with hollow tests.

Full discipline: the `test-writing-discipline` skill.

### The determinism rules (what lint bans, per tier)

One rule, three enforcement points, so the local hooks, CI, and the evals scorer
agree on what a "fixed wait" is:

| Tier | Where | Level | Flags |
|---|---|---|---|
| Playwright (`tests/`) | `tests/.eslintrc.cjs` (`no-restricted-syntax`) | **error** | `waitForTimeout(`, `sleep(`, `setTimeout(` (the global timer only — bare, `window.`, or `globalThis.` — inside `page.evaluate` too; `test.setTimeout(ms)` / `testInfo.setTimeout(ms)` set a budget, not a wait, and pass), `'networkidle'`, `.only`, `.skip`, bare `test.fixme` |
| Frozen Jasmine + Jest (`*.spec.js`, `*.unit.js`, `*.unit.ts`) | `handsontable/no-fixed-sleep-in-spec` (`handsontable/.config/plugin/eslint/rules/`) | warn | `sleep(` (`noSleep`), `setTimeout(fn, <non-zero numeric literal>)` on the global timer (`noSetTimeout` — a literal `0` is a macrotask hand-off, not a wait, and passes), `waitForNextAnimationFrames(` (`noFrameWait` — a literal `0` resolves at once and passes too) |
| Evals scorer | `evals/score.mjs` `findDeterminismSmells()` | verdict `suspect` | `sleep-call`, `wait-for-timeout`, `network-idle`, `set-timeout`, `fixed-frame-wait` — with the frozen rule's exemptions: the global timer only, a non-zero numeric-literal delay only, a literal `0` frame count passes |

The replacement is always a condition: a web-first assertion or `expect.poll` on
the Playwright tier, the `waitUntil(condition, timeout)` spec global
(`handsontable/test/helpers/common.js`) on the frozen tier. The Playwright tier's
only sanctioned exception is a 0ms scheduling barrier that lets a negative
assertion prove "nothing else fired"; it carries the same eslint-disable line as
`test.fixme`, naming the owning task (`tests/AGENTS.md`). The frozen tier stays
at **warn** until the debt is burned down — the count is the burn-down's backlog,
not a gate. The rule's RuleTester coverage lives in
`handsontable/.config/plugin/eslint/__tests__/` and runs through
`npm run test:eslint-rules` in `handsontable/` (CI: the `Lint / core` job). Every
**determinism-smell** signal has a fixture under
`evals/fixtures/<case>/counterexamples/` — named `<scenario>.<smell>.spec.ts` — that
must score `suspect` for exactly that smell; the hollow-test and gaming signals are
covered by the inline-source unit tests in `evals/__tests__/score.test.mjs` only. All
of it runs under the root `npm run test:tooling` (CI: `Checks / tooling tests`).

### The tracked human exception (the manual-QA tickbox)

When automated coverage genuinely cannot judge a change (subtle UX, a visual
nuance no snapshot covers, a high-risk area — or a QA-owned pass such as an
RC adversarial sweep or a screen-reader check), tick **"MANUAL QA NEEDED"**
in the PR description (author or agent may tick it; the template carries the
line, and its wording is machine-read — keep it verbatim) and say in one line
what to check, and add the red **`Manual QA required`** label so the request
is visible in the PR list (applied by hand, like every other label here — the
`pr-creation` skill instructs it; it is a marker, never the trigger). The
Checks scope router
reads the box live and routes the Manual QA module only when ticked; its
`sign-off` job then waits on the **`manual-qa` environment approval**: a
designated reviewer (the environment's required-reviewers list; self-review
is blocked — and an agent can request a check but never clear one) clicks
Approve on the workflow run, and GitHub records the approver as the
sign-off. While it waits, CI Gate cannot report, so the merge stays blocked
without any job going red; a rejection turns CI Gate red. Unticked PRs
*skip* the module — shown as skipped, never as a misleading green "passed",
with no runner spent. Approval is per run: a new push re-asks the reviewers.
Enforcement is decided per run too — the box is evaluated when the scope router
runs — so changing it afterwards needs a **"Re-run all jobs"** to re-decide, in
either direction. A box ticked after a green run therefore leaves the PR
mergeable until someone re-runs it; that is a known limitation, accepted in
exchange for having no labelling or re-running automation at all. The sign-off
job does fail closed: it asserts that an approval is actually recorded for the
run, so a missing or drifted `manual-qa` environment turns CI Gate red instead
of passing silently. This **adds** a recorded human pass; it
never replaces the presence gate or the test requirement. Do not use it to
dodge writing tests.

## 2. Creating or changing enforcement hooks (git + agent) — exact rules

- **Location.** Git hooks → `lefthook.yml` + `scripts/` (`pre-push.mjs`, `lint-staged.mjs`, `lint-files.mjs`). Agent hooks → `scripts/claude/` (`post-tool-use.mjs`, `stop.mjs`, `session.mjs`), wired in `.claude/settings.json`. Shared, pure classifiers and layout helpers → `.github/scripts/lib/` (`presence-gate.mjs`, `test-weakening.mjs`, `repo-root.mjs`).
- **Must work in a linked worktree.** Agent-driven work runs in `git worktree` checkouts, so never derive the repo layout from git or the cwd: take the root from `repoRoot()` (`.github/scripts/lib/repo-root.mjs`) and per-checkout state from `gitDir(root)`. A hook exports `GIT_DIR`, and with it set `git rev-parse --show-toplevel` returns the *cwd*, not the work tree; in a worktree `<root>/.git` is a **file**, so writing under it fails with ENOTDIR. Strip `GIT_DIR`/`GIT_WORK_TREE` from the environment of any child you spawn with an explicit `cwd`.
- **Pure + tested.** Put the decision logic in a **pure function** in a lib and **unit-test it** (`scripts/__tests__/`, `.github/scripts/__tests__/`, run with `node --test`). **A hook change ships a test change** — this rule applies to the enforcement machinery too. A custom ESLint rule is machinery as well: it gets RuleTester coverage in `handsontable/.config/plugin/eslint/__tests__/*.test.mjs` (ESLint's `RuleTester` pointed at `node:test`'s `describe`/`it`), run by `npm run test:eslint-rules` in `handsontable/` (a `scripts/tasks.json` task) from CI's `Lint / core` job — **not** from the root `test:tooling` glob. That script backs the `Checks / tooling tests` job, which is checkout + Node only, so a test that imports `eslint` dies there with `ERR_MODULE_NOT_FOUND` and red-walls every PR; keep the root glob dependency-free. Name every test file in that task as a literal path, with **no glob**: `node --test` exits 1 (`Could not find`) only when nothing in the list matched *and* every pattern is literal — a glob anywhere, even next to an explicit path, turns a missing file into a green `tests 0`, and a second literal file that still exists masks a renamed first one the same way, so a rename would leave the step passing with nothing, or less, run (`handsontable/test/__tests__/eslintRulesTask.unit.js` pins the list in both directions — every file in the directory named, every named file present — and bans glob characters). A determinism-smell scorer signal gets a `counterexamples/` fixture named after the smell (`evals/README.md`), and `evals/__tests__/` is in the root glob. A new test directory that is in neither script never runs anywhere.
- **A custom ESLint rule edit is live only while its hard link holds.** `eslint-plugin-handsontable` is a `file:` dependency, and pnpm materializes it under `node_modules/.pnpm/` as **hard links** to the source files (same inode, link count 2 — check with `stat`), not a symlink to the directory. An edit that writes the file **in place** is therefore live at once, with no reinstall. The trap is the write that replaces the inode: an editor's save-then-rename (atomic save), `sed -i`, a branch switch or `git checkout` that rewrites the file, a fresh worktree, and always a **brand-new rule file**, which the store has never seen. After any of those, every lint run — the hooks, `npm run lint`, a `--format json` debt count — executes the rule as it was at the last install, while the RuleTester tests (which import the source file) already pass. `pnpm install --frozen-lockfile --offline` (under a minute) relinks it; verify with `stat` (same inode) or `diff` against the store copy before trusting a lint result that disagrees with the tests.
- **Must not false-block.** Skip config/parse gaps (ESLint exit 2), record only **repo-relative, in-repo** paths (never scratchpad/out-of-repo), tolerate a missing base ref. A hook that fires on a false positive gets disabled — that is worse than no hook.
- **Must stay fast.** No build in the pre-push or agent hooks; run only the **changed scope**. Heavy/full-suite work is CI's job.
- **Bound what you feed the agent.** An agent hook's failure message is a conversation message, so its cost is re-paid on every later request in the session — never paste a raw run or lint report into it. Pass it through `condenseTestOutput()` (`scripts/pre-push.mjs`): noise stripped, repeats collapsed, the excerpt anchored at the failing test so the diagnosis survives, capped at 120 lines / 8 KB. The caps are structural, not filter-dependent — filter-proof input still condenses. A hook writing to a **terminal** (pre-push) keeps printing in full up to `TERMINAL_OUTPUT_LIMIT`.
- **Know who reads your stderr.** Claude Code forwards a hook's stderr to the agent only on **exit 2**. A non-blocking leg's note lands in the debug log unless a later leg in the same run blocks, so treat those notes as best-effort and never make the flow depend on the agent reading one.
- **Floor for everyone.** The git hooks must work without Claude Code; the agent hooks are additive, never the only line of defense.

## 3. Creating or updating skills — exact rules

- **Location.** `.claude/skills/<name>/SKILL.md` (committed). **Never** in the gitignored `quality/` scaffold, and **no committed artifact may reference `quality/`.**
- **Lean entry + progressive disclosure.** `SKILL.md` is a short dispatcher; put detail in `references/*.md` loaded on demand. Frontmatter `name` + a `description` that states exactly *when* to use it.
- **Sync to Cursor.** Run `node scripts/sync-skills-to-cursor.mjs` after editing (mirrors to `.cursor/rules/*.mdc`); keep the skill's `GLOB_MAP` entry.
- **Skill vs rule.** A mechanical, always-true constraint → an **ESLint rule / gate** (enforced). A judgment-based workflow → a **skill** (guidance). Prefer enforcement for anything mechanical.

---

The planning scaffold in `quality/` is ephemeral; every durable rule above is baked
into the committed repo (this file, `AGENTS.md`, `handsontable/.ai/`, `.claude/skills/`,
`.config/plugin/eslint/`, the hooks) so enforcement survives once `quality/` is gone.
