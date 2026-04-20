---
name: pr-creation
description: Use this skill whenever you are about to create, update, or edit a pull request in the Handsontable monorepo. **This skill must be loaded BEFORE running `gh pr create` or pushing a feature branch to GitHub**, not just when the user says the word "PR". Trigger it on any of these phrases, even indirect ones: "create a PR / pull request", "open a PR", "submit a PR", "push the branch", "push changes", "commit and push", "fix the issue" (when a branch has been created from a task), "ship it", "ready to review", "update the PR", "edit PR body", "fix PR description", "update PR description", or any mention of a PR URL. Also trigger when finishing work on a `feature/*`, `docs/*`, or `fix/*` branch, or when a ClickUp/DEV task has been implemented and needs to be submitted. Covers branch naming conventions, pre-flight checks (lint and tests), the PR-first / changelog-second workflow, authentication fallback (`gh auth setup-git` when SSH is unavailable), and filling the GitHub PR template with context, test plan, affected projects, and ClickUp task link.
---

## 1. Branch Naming

Choose the prefix that matches your work:

| Type | Pattern | Example |
|------|---------|---------|
| Feature (ClickUp) | `feature/DEV-xxx_Short-Description` | `feature/DEV-627_Forum-Update` |
| Feature (GitHub) | `feature/issue-xxxx` | `feature/issue-11832` |
| Docs | `docs/issue-xxxx` | `docs/issue-9500` |
| Release | `release/x.y.z` | `release/16.1.0` |

When working from a ClickUp task, the task ID (e.g. `DEV-627`) **must** appear in the branch name so ClickUp links automatically.

## 2. Pre-flight Checks

Run these **before** opening the PR. Fix any failures first.

```bash
# Lint
npm run eslint --prefix handsontable
npm run stylelint --prefix handsontable

# Build (wrappers depend on this output)
npm run build --prefix handsontable

# Unit tests for the area you changed
npm run test:unit --testPathPattern=<regex> --prefix handsontable

# E2E tests for the area you changed
npm run test:e2e --testPathPattern=<regex> --prefix handsontable

# If you touched a wrapper, test it too
npm run test --prefix wrappers/react-wrapper
npm run test --prefix wrappers/vue3
npm run test --prefix wrappers/angular-wrapper
```

## 3. Fill the PR Template

The repository has a PR template at `.github/PULL_REQUEST_TEMPLATE.md`. Fill in each section:

- **Context** -- Explain *why* the change is needed, not just what changed. Link the ClickUp task or GitHub issue.
- **How has this been tested?** -- List the specific tests you added or ran (unit, E2E, manual). Include commands someone can copy-paste to reproduce.
- **Types of changes** -- Check the box that applies: bug fix, new feature, breaking change, or translation.
- **Related issue(s)** -- Link GitHub issues with `#xxx`. Include ClickUp task IDs (e.g. `DEV-627`) so they auto-link.
- **Affected project(s)** -- Check every package your change touches: `handsontable`, `@handsontable/react-wrapper`, `@handsontable/angular-wrapper`, `@handsontable/vue3`.
- **Checklist** -- Confirm code style, CLA signature, and whether documentation needs updating.

## 4. Target Branch

All PRs target the **develop** branch. Cherry-picks to `release/*` or `lts/*` branches are handled separately by maintainers.

## 5. Create the PR First (before the changelog)

The PR is created **before** the changelog entry. The changelog file is named after the PR number, so you need the number the GitHub API returns from `gh pr create` before you can write the file correctly. Creating the changelog first and guessing the next PR number is unreliable — other PRs can be opened between your check and your push.

Workflow:

1. Commit the code change on the feature branch.
2. Push the branch (use `gh auth setup-git` once if git is configured for SSH and the SSH key is unavailable in the session; then push over HTTPS).
3. Run `gh pr create` and capture the returned PR URL / number.
4. Use that PR number when creating the changelog entry (next step).

Use the GitHub CLI to create the PR. **Always create PRs as drafts** -- the author marks it ready for review when appropriate.

**Authentication fallback:** If `git push` fails with `Permission denied (publickey)` because the session has no SSH key, switch the remote to HTTPS and let `gh` provide credentials, then push:

```bash
git remote set-url origin https://github.com/handsontable/handsontable.git
gh auth setup-git
git push -u origin <branch-name>
```

**Fill the full PR template in `--body`.** Do not submit a bare "Summary / Test plan" body — the repo's template at `.github/PULL_REQUEST_TEMPLATE.md` has **Context**, **How has this been tested?**, **Types of changes**, **Related issue(s)**, **Affected project(s)**, and **Checklist** sections, and every section must be filled in. Always include the ClickUp task URL on its own line so ClickUp auto-links the PR.

```bash
gh pr create --draft --base develop \
  --title "DEV-xxx: Short description" \
  --body "$(cat <<'EOF'
### Context

<why this change is needed; link the task and explain the problem>

### How has this been tested?

- <tests you added or ran, with commands>

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
- [x] I have signed the [Contributor License Agreement](https://docs.google.com/forms/d/e/1FAIpQLScpMq4swMelvw3-onxC8Jl29m0fVp5hpf7d1yQVklqVjGjWGA/viewform?c=0&w=1)
- [ ] My change requires a change to the documentation.

ClickUp task: https://app.clickup.com/t/9015210959/DEV-xxx
EOF
)"
```

- **Commit messages:** Descriptive, max 80 characters. Include task ID (e.g. `DEV-627: Fix filter column index`).
- Include the ClickUp task ID in the PR title when applicable.
- Start the **Context** section with "The PR fixes/adds/changes/..." -- be direct, no filler.
- If the PR introduces a breaking change, require the `Breaking change` label and include a migration section with before/after examples. Update migration guides in `docs/content/guides/upgrade-and-migration/`.

## 5a. Updating an Existing PR's Body

When asked to update, fix, or re-fill a PR description, use `gh pr edit <number> --body "$(cat <<'EOF' ... EOF)"`. Keep the full template structure — do not replace it with a shorter summary. The heredoc approach preserves newlines and checkboxes reliably.

## 6. Changelog Entry (after PR is created)

Every PR that changes source code needs a changelog entry in `.changelogs/`. The filename **must** be `{PR-number}.json`, using the PR number returned by `gh pr create` in the previous step. See the `changelog-creation` skill for the JSON schema and title-writing rules.

After writing the file:

1. Commit it on the same branch (`DEV-xxx: Add changelog entry for PR #<number>`).
2. Push so the PR picks up the new commit.

Use `[skip changelog]` in the PR body only for test-only, docs-only, or CI/tooling changes. When skipping, you do **not** create a PR-first round-trip — just open the PR and be done.

## 7. After PR Creation

When working from a ClickUp task, use the ClickUp MCP tools to update the task status to **"code review"**.

## 8. Merge Strategy

All PRs are merged using **"Squash and merge"**. The squashed commit message becomes the permanent history, so make sure the PR title is clear and descriptive.
