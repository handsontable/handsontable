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

Add `[skip changelog]` in the PR description to explicitly skip.

## JSON Format

Create a file at `.changelogs/{issue-or-pr-number}.json`:

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

1. Pick the correct `type` from the table above.
2. Write a clear, user-facing `title` ending with a period.
3. Set `breaking` to `true` only if the change breaks existing behavior.
4. Set `framework` to match the affected package, or `"none"` for core.
5. Name the file after the GitHub PR number (ask the user, never infer).
