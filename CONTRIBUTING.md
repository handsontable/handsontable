# Contributing to Handsontable

Your contribution to Handsontable's codebase is most welcome. To fix a bug or propose a new feature, open a new pull request (PR), targeted at the `develop` branch.

## Prerequisites

- **Node.js 22** (see `.nvmrc`).
- **pnpm** (pinned via `packageManager` in the root `package.json`). Activate it with `corepack enable`, then install with `pnpm install`.

`pnpm install` also wires up the local enforcement (git hooks and agent guidance) automatically — see [Definition of done](#definition-of-done-local-enforcement) below. Manual fallback: `npx lefthook install`.

## Contribution rules

To speed up the process of merging your changes, follow these rules:

1. Sign the [Contributor License Agreement](#contributor-license-agreement), to let us publish your changes. This applies to all code you submit, including AI-assisted contributions (see [AI-assisted contributions](#ai-assisted-contributions)).
2. Make your changes on a separate branch. This speeds up the merging process.
3. Always target your PR at the `develop` branch, not the `master` branch.
4. Make changes to the right project:
    - The main Handsontable project is located in the `./handsontable/` directory.
    - Framework wrapper projects are located in the `./wrappers/` directory.
5. Don't edit generated output. Edit source, then build — but don't commit build files. Never edit:
    - `./handsontable/dist/`
    - `./wrappers/angular-wrapper/dist/hot-table/`
    - `./wrappers/vue3/dist/` & `./wrappers/vue3/es/` & `./wrappers/vue3/commonjs/`
    - `./handsontable/languages/`
6. Instead, edit the source files, located in the following directories:
    - `./handsontable/src/`
    - `./wrappers/angular-wrapper/projects/hot-table/src/`
    - `./wrappers/vue3/src/`
7. **Ship a test with your change.** Every change to `handsontable/src/**` or `wrappers/**` must include a matching test change. This is not a courtesy — a **presence gate** enforces it on every PR (and locally, before you push). The *kind* of test follows the *kind* of change:
    - **User-visible** (rendering, editing, selection, keyboard, menus, overlays) → an **E2E** test. New E2E is **Playwright** (`tests/e2e/**/*.spec.ts`). The legacy Jasmine/Puppeteer `*.spec.js` suite is **frozen** — you may edit an existing spec, but **new `*.spec.js` files are blocked**; migrate a broken one to Playwright rather than patch it.
    - **Logic / not user-visible** (data, indexing, algorithms, internal state) → a **Jest unit** test, `*.unit.js` in a `__tests__/` directory next to the source.
    - **Public API / type surface** → a **type test**, `*.types.ts`.
    - **Rendering engine** (`handsontable/src/3rdparty/walkontable/`) → its own test runner (separate pipeline).
    - **Pure refactor or non-runtime change** (types, docs, config, i18n text, re-exports) → no test required, but you must declare it with a `Refactor-only: <reason>` trailer in the commit message.

    Your tests help us understand the issue and make sure it stays fixed forever. Write them to prove the *intended* behavior, ideally before the code — for a bug fix, write the failing test first, confirm it fails for the right reason, then fix it so it stays as a regression guard.
8. Lint your code. From the root directory, run: `npm run lint`. Your code should follow our coding style, inspired by the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript).
9. Add a mandatory [changelog](https://github.com/handsontable/handsontable/blob/master/CHANGELOG.md) entry. From the root directory, run: `npm run changelog entry` (see [`.changelogs/`](https://github.com/handsontable/handsontable/tree/master/.changelogs)). Non-source-code PRs can skip this by writing `[skip changelog]` in the PR description.
10. In your PR, add a thorough description of all the changes, and fill in the test-evidence section of the PR template.

Thank you for your contribution!

## Contributor License Agreement

Handsoncode publishes the code it merges — in open-source releases and in commercial products. Doing that requires the right to use, relicense, and distribute your contribution, and the Contributor License Agreement (CLA) is the record of that permission. You keep the copyright to your work; the CLA grants Handsoncode a license to it.

**Sign it once, for every project.** The signature is recorded against your GitHub account, not against a repository, and covers both [Handsontable](https://github.com/handsontable/handsontable) and [HyperFormula](https://github.com/handsontable/hyperformula). If you have already signed for either one, you are done.

**Sign here: [cla.handsontable.com/sign](https://cla.handsontable.com/sign)** — the [process is explained in full](https://cla.handsontable.com/) on the same site.

How it works on your pull request:

1. You open a PR. A GitHub App looks up your GitHub login and sets the `cla/signed` status check.
2. If you have not signed, the check fails and a bot comments with your signing link.
3. Open the link, authenticate with GitHub, read the agreement, and submit the form.
4. The check turns green — on this PR and on any other open PR of yours, in either repository.

`cla/signed` is a **required check**, so an unsigned PR cannot be merged. Members of the `handsontable` GitHub organization and known bots are exempt.

Signature records are stored in Cloudflare D1 in the EU. For a correction to your record or an erasure request, email [support@handsontable.com](mailto:support@handsontable.com).

> **Reviewers:** there is nothing to verify by hand — the required check is the verification. Never merge a PR whose `cla/signed` check is red, and do not work around it.

## Definition of done (local enforcement)

Quality here is **machine-enforced, not review-dependent** — and the same rules run **locally and in CI**, so you find out before you push, not after. The enforcement is **tool-agnostic**: it lives in git hooks and CI, so it applies whether you use a plain editor, Cursor, Claude Code, or any other assistant.

Running `pnpm install` wires the git hooks (via [lefthook](https://github.com/evilmartians/lefthook)) automatically. They form an escalating chain:

- **pre-commit** — lints your staged files (auto-fixes where it can).
- **pre-push** — runs the **presence gate** (blocks a source change with no matching test), a **test-weakening detector** (warns on dropped/loosened assertions and added skips), and the **unit tests and Playwright specs you touched**.
- **CI** mirrors all of the above and is the authoritative gate.

`git ... --no-verify` bypasses the local hooks, but CI re-runs the same checks — so the bypass only defers the failure. Don't rely on it.

**The meaningfulness bar (non-negotiable):** *green is not the goal — correct behavior is.* When a test is red, diagnose which side is wrong (the code or the test's expectation) and fix that side. Never reach green by weakening the test. These moves are banned and machine-detected:

- removing or loosening assertions,
- `.skip` / `.only` / `xit` / `fit` / `it.flaky`,
- an `it()` with no assertion,
- fixed `sleep()` delays in place of waiting for a condition.

**The tracked human exception.** When automated coverage genuinely cannot judge a change (a subtle UX or visual nuance, a high-risk area), tick **"Manual QA Needed"** in the PR description (the template carries the line) say in the Context section what to check, and apply the red **`Requires Manual QA`** label — CI fails a ticked PR that lacks it (create the PR with `gh pr create --label "Requires Manual QA"`). The Tests pipeline then holds its **`Manual QA / sign-off`** job until a designated reviewer approves the run (the **Review pending deployments** button on the workflow run) — the approver is recorded by GitHub, and self-approval is blocked. Unticked PRs skip the job. The box is read once per run, so if you tick or untick it after the pipeline has run, press **"Re-run all jobs"** to re-decide. This *adds* a recorded human pass — it never replaces the test requirement.

The full local rules live in [`.ai/LOCAL-ENFORCEMENT.md`](https://github.com/handsontable/handsontable/blob/develop/.ai/LOCAL-ENFORCEMENT.md); the test-kind decision rules in [`handsontable/.ai/TESTING.md`](https://github.com/handsontable/handsontable/blob/develop/handsontable/.ai/TESTING.md).

## AI-assisted contributions

AI coding assistants are welcome, and the repo is built to work well with them — but the quality bar does not change. **"An agent wrote it" is not a lower standard.** Whatever produced the code:

- it is your submission, covered by the **CLA** you signed;
- it must meet the same test, meaningfulness, and lint requirements as hand-written code;
- it must not introduce third-party code under a non-permissive license (see the dependency policy in the root `AGENTS.md`).

Machine-readable guidance for agents lives in **`AGENTS.md`** files throughout the repo — the canonical, cross-agent source, following the [AGENTS.md](https://agents.md/) convention that most assistants read natively. `CLAUDE.md` (Claude Code) and `.cursor/rules/` (Cursor) are **generated mirrors** of the same source, regenerated by the `prepare` script — don't hand-edit the mirrors. Claude Code and Cursor additionally get earlier, editor-time hooks on top of the shared floor; every other tool (and plain git) is still fully covered by the hooks and CI.

## Contributing to the documentation

To contribute to the Handsontable documentation, see the separate [documentation section](https://github.com/handsontable/handsontable/blob/master/docs/README.md).

## Team rules

1. We use [pnpm workspaces](https://pnpm.io/workspaces) (version pinned in the root `package.json` via `packageManager`; activate with `corepack enable`).
2. We use the Gitflow workflow.
