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
**Coverage is a CI floor, not a hook** (it needs a full instrumented run, too slow
for a hook): the `[CHECK] Coverage floor` job measures the percent of *added*
executable lines the unit tests cover (`.github/scripts/diff-coverage-gate.mjs`,
report-only at 80% until calibrated — a unit floor reads 0% for correctly
E2E-tested changes, so it earns "blocking" only after the numbers are trusted).

**Touched E2E specs run exactly once locally, whichever tool proves them first.**
The Stop hook and pre-push share a green-run cache (`.git/hot-e2e-green.json`,
via `scripts/e2e-run-cache.mjs`) keyed on spec content + environment (dist bundle,
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

### The tracked human exception (the manual-QA tickbox)

When automated coverage genuinely cannot judge a change (subtle UX, a visual
nuance no snapshot covers, a high-risk area), tick **"This change needs a
manual QA pass"** in the PR description (the template carries it) and say what
to check. The `[CHECK] Manual QA` job in the Tests pipeline then stays RED
until a human who is **not** the PR author comments **`/manual-qa passed`**
(comment authorship is API-verified identity) and the job is re-run — it reads
the live body + comments, not the frozen event payload. Unticked PRs pass
immediately. This **adds** a recorded human pass; it never replaces the
presence gate or the test requirement. Do not use it to dodge writing tests.

## 2. Creating or changing enforcement hooks (git + agent) — exact rules

- **Location.** Git hooks → `lefthook.yml` + `scripts/` (`pre-push.mjs`, `lint-staged.mjs`, `lint-files.mjs`). Agent hooks → `scripts/claude/` (`post-tool-use.mjs`, `stop.mjs`, `session.mjs`), wired in `.claude/settings.json`. Shared, pure classifiers → `.github/scripts/lib/` (`presence-gate.mjs`, `test-weakening.mjs`).
- **Pure + tested.** Put the decision logic in a **pure function** in a lib and **unit-test it** (`scripts/__tests__/`, `.github/scripts/__tests__/`, run with `node --test`). **A hook change ships a test change** — this rule applies to the enforcement machinery too.
- **Must not false-block.** Skip config/parse gaps (ESLint exit 2), record only **repo-relative, in-repo** paths (never scratchpad/out-of-repo), tolerate a missing base ref. A hook that fires on a false positive gets disabled — that is worse than no hook.
- **Must stay fast.** No build in the pre-push or agent hooks; run only the **changed scope**. Heavy/full-suite work is CI's job.
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
