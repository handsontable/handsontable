---
name: pr-creation
description: Use whenever you are about to create, push, open, update, or edit a pull request in the Handsontable monorepo – load this BEFORE running `gh pr create` or pushing a feature/docs/fix branch, not only when the user says "PR". Triggers: create/open/submit a PR, push the branch, commit and push, ship it, ready to review, update or fix a PR description, any PR URL, finishing work on a `feature/*`/`docs/*`/`fix/*` branch, or a completed ClickUp/DEV task ready to submit. Covers branch naming, pre-flight lint/tests, the PR-first then changelog flow, `gh auth` fallback, and filling the GitHub PR template.
---

## 1. Branch naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature (ClickUp, default) | `feature/<TASK-ID>_Short-Description` | `feature/DEV-627_Forum-Update` |
| Docs (ClickUp) | `docs/<TASK-ID>_Short-Description` | `docs/DEV-458_Clarify-undo-redo-docs` |
| Feature (public GitHub issue) | `feature/issue-xxxx` | `feature/issue-11832` |
| Docs (public GitHub issue) | `docs/issue-xxxx` | `docs/issue-9500` |
| Release | `release/x.y.z` | `release/16.1.0` |

`<TASK-ID>` is the human-readable ClickUp custom ID, so ClickUp links the branch. Its prefix follows the task's space (`SU-833`, `PRO-858`): copy it from the task. The internal hash ID (e.g. `86c9j4fxj`) is not a valid identifier for branch linking.

`clickup_create_task` returns `custom_id: null`. Call `clickup_get_task(task_id)` right after creating a task to get the real custom ID before naming the branch.

## 2. Pre-flight checks

Run before opening the PR and fix failures first.

```bash
npm run eslint --prefix handsontable
npm run stylelint --prefix handsontable
npm run build --prefix handsontable   # wrappers depend on this output
npm run test:unit --prefix handsontable --testPathPattern=<regex>
npm run test:e2e --prefix handsontable --testPathPattern=<regex>
# if you touched a wrapper
npm run test --prefix wrappers/react-wrapper
npm run test --prefix wrappers/vue3
npm run test --prefix wrappers/angular-wrapper
```

## 3. Fill the PR template

Template: `.github/PULL_REQUEST_TEMPLATE.md`.

- **Context**: why the change is needed. Link the ClickUp task or GitHub issue.
- **How has this been tested?**: the specific tests added or run, with copy-pasteable commands.
- **Related issue(s)**: GitHub issues as `#xxx`. The only ClickUp ID allowed is the one task this PR closes (see **One task ID only**).
- **Affected project(s)**: check every package the change touches.
- **Checklist**: the CLA is checked by the required `cla/signed` status check; one signature covers Handsontable and HyperFormula. See [`CONTRIBUTING.md`](../../../CONTRIBUTING.md#contributor-license-agreement).

## 4. Target branch

All PRs target **develop**. Maintainers handle cherry-picks to `release/*` or `lts/*`.

## 5. Create the PR first (before the changelog)

The changelog file is named after the PR number, so create the PR first.

1. Commit on the feature branch.
2. Push (run `gh auth setup-git` once if git uses SSH and the session has no SSH key; then push over HTTPS).
3. Run `gh pr create` and capture the PR number.
4. Use that number in the changelog entry (section 6).

Create PRs as **drafts**; the author marks ready for review.

**Authentication fallback** when `git push` fails with `Permission denied (publickey)`:

```bash
git remote set-url origin https://github.com/handsontable/handsontable.git
gh auth setup-git
git push -u origin <branch-name>
```

**Write the PR body with the Write tool to a task-scoped file and pass `--body-file`.** A `--body "$(cat <<'EOF'...EOF)"` heredoc stores backticks as literal `\``. Name the file after the task or issue (`/tmp/pr-body-DEV-1860.md`, `/tmp/pr-body-issue-11832.md`; add a suffix like `-2` if it exists): the Write tool refuses to overwrite a file it has not read this session, so a fixed `/tmp/pr-body.md` fails with "Error writing file." when a stale copy exists.

```bash
gh pr create --draft --base develop \
  --title "DEV-xxx: Short description" \
  --body-file /tmp/pr-body-DEV-xxx.md
```

**Start from the live template, every time.** Run `cat .github/PULL_REQUEST_TEMPLATE.md` and mirror every `###` heading and every checklist line, including `MANUAL QA NEEDED`, left unticked when no manual QA is needed. That line is machine-read by the Checks scope router (`checks.yml`), so keep its wording; without it the gate can never be armed on that PR without editing the description. The copy below is a convenience: `.github/scripts/__tests__/pr-template-skill-sync.test.mjs` pins its headings and checklist lines to the template, and when the two disagree the template wins.

Body file template (write it with the Write tool, backticks and all):

````markdown
### Context

The PR fixes/adds/changes <what>. <Why the change is needed; link the task and explain the problem.>

### Test evidence (required for source changes)

- Unit tests added/modified (`*.unit.js`): <paths, or "none – covered by <path>">
- E2E tests added/modified (Playwright `tests/e2e/*.spec.ts`): <paths>
- Type tests (`*.types.ts`) updated if public API changed: <paths, or "none">
- For a bug fix – the spec that fails without this fix: <name>
- Demo page / recorded trace (for UI changes): <link, or "none">
- Visual spec added/modified (`visual-tests/tests/**/*.spec.ts`, only for pixels no DOM probe can express – in addition to, never instead of the E2E above): <paths, or "none">

### Commands run

```bash
<the test commands you ran, one per block>
```
<their final output lines>

### Types of changes

- [x] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature or improvement (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Additional language file or change to the existing one (translations)

### Related issue(s):

1. DEV-xxx

### Affected project(s):

- [x] `handsontable`
- [ ] `@handsontable/angular-wrapper`
- [ ] `@handsontable/react-wrapper`
- [ ] `@handsontable/vue3`

### Checklist:

- [x] I have reviewed the guidelines about [Contributing to Handsontable](https://github.com/handsontable/handsontable/blob/master/CONTRIBUTING.md) and I confirm that my code follows the code style of this project.
- [x] I have signed the [Contributor License Agreement](https://cla.handsontable.com/sign) – one signature covers both Handsontable and HyperFormula; the `cla/signed` check on this PR confirms it.
- [ ] My change requires a change to the documentation.
- [ ] MANUAL QA NEEDED – <!-- one line: WHAT to check and why automation can't judge it. Also add the red `Requires Manual QA` label (that exact name – it already exists; `QA needed` and `Verified by QA` are different labels). Ticking holds the Tests run for a manual-qa environment approval by a designated reviewer (the author counts – GitHub records who clicked). The box is read once per run, so if you change it after the pipeline ran, press "Re-run all jobs". This line is machine-read – keep its wording. -->

ClickUp task: https://app.clickup.com/t/9015210959/DEV-xxx
````

- **Commit messages:** descriptive, max 80 characters, with the task ID (e.g. `DEV-627: Fix filter column index`).
- Include the ClickUp task ID in the PR title.
- **One task ID only.** The ClickUp GitHub integration attaches every task ID it finds in a PR title, body, commit message, or comment, and moves each through the PR lifecycle ("code review" on open, onward on merge). The attachment is permanent: editing the ID out later does not detach the task. The PR title, body, commits, and every PR or review comment may name exactly one ID, the task in the branch name. Describe a parent, follow-up, related task, or cherry-pick source in words or by PR number. Every prefix counts (`DEV-`, `PRO-`, `RELEASE-`, `IT-`, `SU-`); check drafted text with `grep -oE '\b[A-Z]{2,}-[0-9]+\b' <file> | sort -u` before the write.
- Start **Context** with "The PR fixes/adds/changes/..." and be direct.
- A breaking change needs the `Breaking change` label and a migration section with before/after examples. Update migration guides in `docs/content/guides/upgrade-and-migration/`.
- **If you tick "MANUAL QA NEEDED", also apply the red `Requires Manual QA` label** (nothing applies it automatically):

  ```bash
  gh pr edit <number> --add-label "Requires Manual QA"
  ```

  The label already exists; match the name exactly (`gh label list --search "Manual QA"` also returns `QA needed` and `Verified by QA`, which are different labels). A near-miss name (`Manual QA required`) creates a second red label nobody filters on.

  The label is a marker only. The gate is the ticked box, read once per run by the Checks scope router: it holds `Manual QA / sign-off` until a designated reviewer approves the run. After ticking or unticking on a PR whose pipeline already ran, press **"Re-run all jobs"** on the Tests run.

## 5a. Updating an existing PR's body

Write the body to `/tmp/pr-body-<task-id>.md` with the Write tool, then `gh pr edit <number> --body-file /tmp/pr-body-<task-id>.md`. Keep the full template structure.

## 6. Changelog entry (after the PR is created)

Every PR that changes source code needs a changelog entry in `.changelogs/`. `bin/changelog` names the file after the entry's `issueOrPR` field, so the filename is the **PR number** only for a `private` entry (the default, assumed below). A `public` entry is named after its GitHub issue number, known before the PR exists, so commit it with the code.

**`.changelogs/README.md` decides which `issuesOrigin` to use.**

Two blocking checks constrain the entry. The filename must be `<issueOrPR>.json`, a plain number with no suffix, matching the entry's `issueOrPR` field (`bin/changelog` fails the `changelog` job over a mismatch; the pre-push hook fails locally). The PR may add at most **two** entry files, the second only for a separate GitHub issue it closes; a maintenance PR back-filling entries for other PRs writes `[multiple changelogs]` in the description to lift that. `npm run changelog entry` satisfies the filename rule by construction.

**In a non-interactive session, pass the fields `--help` does not list.** `bin/changelog entry` prompts only on a TTY, so every field must arrive as a flag. `--issuesOrigin` is not declared in `--help`, and the declared `--issue` is dead: the builder reads `issueOrPR`, so `--issue` is silently dropped and the command dies in `assertChangelogEntryFormat` with a stack trace. Working invocation:

```bash
bin/changelog entry "Fixed …, ending with a period." \
  --type fixed --issuesOrigin private --issueOrPR <PR-number> \
  --breaking false --framework none
```

The command prints the destination path and the compiled markdown line before writing.

For a `private` entry, commit the file on the same branch (`DEV-xxx: Add changelog entry for PR #<number>`) and push.

The changelog gate is path-aware: a PR confined to docs, tests, `.github/`, `.ai/`, `.claude/`, `visual-tests/`, or `tests/` passes with no entry or `[skip changelog]`, and needs no PR-first round-trip. Write `[skip changelog]` in the PR body only to deliberately skip the entry on a genuine change under `handsontable/src/**` or `wrappers/**`, and say why in the Context. A PR that grows the visual golden set declares it with `[visual budget: N – reason]` (the template's comment block explains N, which must match what `visual-tests/visual-budget.json` sums to; the `Visual budget` step of Visual / Compare reads the live description and blocks a PR that raises that file without saying so); that marker is unrelated to the changelog.

## 7. After PR creation

Leave the ClickUp task status to the GitHub integration: it moves the task to **"code review"** when the PR opens, and onward on merge.

## 8. Merge strategy

All PRs are merged with **"Squash and merge"**; the squashed commit message becomes the permanent history, so keep the PR title clear.
