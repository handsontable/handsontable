---
name: changelog-creation
description: Use when a source code change needs a changelog entry, or before committing and pushing any bug fix, feature, or behavior change to source code - detecting when entries are required, categorizing changes correctly (added/changed/fixed/deprecated/removed/security), writing user-facing titles, and creating the JSON entry in .changelogs/
---

## When a Changelog Entry Is Required

Any PR that changes source code needs a changelog entry. This includes bug fixes, new features, behavior changes, deprecations, and security fixes.

**Not required for:**
- Test-only changes (no production code touched)
- Documentation-only changes
- CI/tooling changes
- Fixing a bug that was introduced but **not yet released** (the regression never reached users, so there is nothing to document)

Add `[skip changelog]` in the PR description to explicitly skip.

## Workflow: Create the PR First, Then the Changelog

The changelog file is named after the GitHub PR number, so the PR must exist before the entry is written. Guessing the next available number by reading `.changelogs/` or the GitHub API is unreliable — another PR can be opened between the check and the push, and the filename will no longer match.

Correct order:

1. Commit the source code change on the feature branch.
2. Push the branch and run `gh pr create` (see the `pr-creation` skill).
3. Read the PR number from the URL `gh pr create` prints (e.g. `https://github.com/handsontable/handsontable/pull/12395` → `12395`).
4. Create `.changelogs/<PR-number>.json` at the **repo root** using that number, set `"issueOrPR"` to the same number. The correct path is always `<repo-root>/.changelogs/<PR-number>.json` — never inside a package subdirectory like `handsontable/.changelogs/`.
5. Commit the new file with a message like `DEV-xxx: Add changelog entry for PR #<number>` and push — the PR picks it up.

## JSON Format

Create a file at `.changelogs/{PR-number}.json` (using the PR number returned by `gh pr create`):

```json
{
  "issuesOrigin": "public",
  "title": "User-facing description of what changed.",
  "type": "fixed",
  "issueOrPR": 12345,
  "breaking": false,
  "framework": "none"
}
```

## Categorization Guide

| Type | When to use | Title example |
|------|-------------|---------------|
| `added` | A wholly new feature or capability | "Added pagination plugin for large datasets." |
| `changed` | Enhancement or modification to existing behavior | "Improved column resize performance with CSS scale transforms." |
| `fixed` | A bug fix | "Fixed filters not updating after manual column move." |
| `deprecated` | Feature scheduled for removal in the next major | "Deprecated `moment`-based date formatting in favor of native Intl." |
| `removed` | Feature already removed in this release | "Removed legacy row grouping plugin." |
| `security` | Vulnerability or XSS fix | "Fixed XSS vulnerability in custom HTML cell renderer." |

## Writing a Good Title

- **Write from the user's perspective.** Describe what changed for someone using Handsontable, not what you changed in the code.
- **Start with a past-tense verb:** "Added...", "Fixed...", "Improved...", "Removed..."
- **Be specific.** Instead of "Fixed a bug", write "Fixed cell editor closing unexpectedly on scroll."
- **Do not reference internal code.** Avoid titles like "Refactored DataMap" or "Updated metaSchema.js". Users do not know these internals.
- **End with a period.**
- **Breaking changes** (`"breaking": true`) appear first in the generated changelog. Make the title clearly describe what breaks and what to do instead.

## Framework Field

| Value | When to use |
|-------|-------------|
| `"none"` | Default. Change affects the core `handsontable` package. |
| `"react"` | Change is specific to `@handsontable/react-wrapper`. |
| `"angular"` | Change is specific to `@handsontable/angular-wrapper`. |
| `"vue"` | Change is specific to `@handsontable/vue3`. |

## CLI Tool

For interactive creation, run:

```bash
node bin/changelog entry
```

This walks you through each field and writes the JSON file for you. You can also create the file manually -- the format is simple enough.

## One Entry Per PR

Create **one changelog entry per PR**, even if the PR fixes multiple issues. The title should describe the overall change, not list individual issues.

## Checklist

1. Confirm the PR already exists (open or draft). Capture its number from the `gh pr create` output or the PR URL.
2. Pick the correct `type` from the table above.
3. Write a clear, user-facing `title` ending with a period.
4. Set `breaking` to `true` only if the change breaks existing behavior.
5. Set `framework` to match the affected package, or `"none"` for core.
6. Name the file `<PR-number>.json` and set `"issueOrPR"` to the same number. Do not guess or infer the number — read it from the created PR. Write to `<repo-root>/.changelogs/<PR-number>.json` — **not** inside any package subdirectory (e.g. `handsontable/.changelogs/` is wrong).
7. Commit and push the new changelog file to the same feature branch so the open PR picks it up.
