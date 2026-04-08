---
name: pr-creation
description: Use when creating or updating a pull request for the Handsontable monorepo, or when asked to commit and push changes - covers branch naming conventions, pre-flight checks (lint and tests), changelog entry, and filling the PR template with context, test plan, and affected projects
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

## 3. Changelog Entry

Every PR that changes source code needs a changelog entry in `.changelogs/`. See the `changelog-creation` skill for the full process. Use `[skip changelog]` in the PR description only for test-only or docs-only changes.

## 4. Fill the PR Template

The repository has a PR template at `.github/PULL_REQUEST_TEMPLATE.md`. Fill in each section:

- **Context** -- Explain *why* the change is needed, not just what changed. Link the ClickUp task or GitHub issue.
- **How has this been tested?** -- List the specific tests you added or ran (unit, E2E, manual). Include commands someone can copy-paste to reproduce.
- **Types of changes** -- Check the box that applies: bug fix, new feature, breaking change, or translation.
- **Related issue(s)** -- Link GitHub issues with `#xxx`. Include ClickUp task IDs (e.g. `DEV-627`) so they auto-link.
- **Affected project(s)** -- Check every package your change touches: `handsontable`, `@handsontable/react-wrapper`, `@handsontable/angular-wrapper`, `@handsontable/vue3`.
- **Checklist** -- Confirm code style, CLA signature, and whether documentation needs updating.

## 5. Target Branch

All PRs target the **develop** branch. Cherry-picks to `release/*` or `lts/*` branches are handled separately by maintainers.

## 6. Create the PR

Use the GitHub CLI to create the PR:

```bash
gh pr create --base develop --title "DEV-xxx: Short description" --body "..."
```

- **Commit messages:** Descriptive, max 80 characters. Include task ID (e.g. `DEV-627: Fix filter column index`).
- Include the ClickUp task ID in the PR title when applicable.
- Start the description with "The PR fixes/adds/changes/..." -- be direct, no filler.
- If the PR introduces a breaking change, require the `Breaking change` label and include a migration section with before/after examples. Update migration guides in `docs/content/guides/upgrade-and-migration/`.

## 7. After PR Creation

When working from a ClickUp task, use the ClickUp MCP tools to update the task status to **"code review"**.

## 8. Merge Strategy

All PRs are merged using **"Squash and merge"**. The squashed commit message becomes the permanent history, so make sure the PR title is clear and descriptive.
