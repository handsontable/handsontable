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

This is the `issuesOrigin: "private"` flow — the default, and what almost every entry uses. The changelog file is named after the GitHub PR number, so the PR must exist before the entry is written. Guessing the next available number by reading `.changelogs/` or the GitHub API is unreliable — another PR can be opened between the check and the push, and the filename will no longer match.

Correct order:

1. Commit the source code change on the feature branch.
2. Push the branch and run `gh pr create` (see the `pr-creation` skill).
3. Read the PR number from the URL `gh pr create` prints (e.g. `https://github.com/handsontable/handsontable/pull/12395` → `12395`).
4. Create `.changelogs/<PR-number>.json` at the **repo root** using that number, set `"issueOrPR"` to the same number. The correct path is always `<repo-root>/.changelogs/<PR-number>.json` — never inside a package subdirectory like `handsontable/.changelogs/`.
5. Commit the new file with a message like `DEV-xxx: Add changelog entry for PR #<number>` and push — the PR picks it up.

For the rare case where the entry cites a **public GitHub issue** instead, see [Issue Origin](#issue-origin) below.

## JSON Format

Create a file at `.changelogs/{PR-number}.json` (using the PR number returned by `gh pr create`):

```json
{
  "issuesOrigin": "private",
  "title": "User-facing description of what changed.",
  "type": "fixed",
  "issueOrPR": 12345,
  "breaking": false,
  "framework": "none"
}
```

## Issue Origin

`issuesOrigin` answers one question: **is the number in `issueOrPR` a public GitHub issue?** It says nothing about the PR, and nothing about whether the repository is public.

The field picks the link path in the generated `CHANGELOG.md`, and `bin/changelog` derives the filename from `issueOrPR`, so the two fields move together:

| `issuesOrigin` | `issueOrPR` | Filename | Rendered link |
|---|---|---|---|
| `"private"` — default, almost always | PR number | `<PR-number>.json` | `.../pull/<n>` |
| `"public"` — rare | public GitHub **issue** number | `<issue-number>.json` | `.../issues/<n>` |

Use `"private"` when the work is tracked in a private ClickUp task — this is the normal case, including every task with a `DEV-xxx` ID. Use `"public"` only when you are citing a real public GitHub issue number; then name the file after the issue, not the PR.

Getting this wrong is not fatal — GitHub redirects `/issues/<n>` to `/pull/<n>` — but it publishes a wrong path in the release notes and makes the field meaningless.

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
- **Never put an `@/api/...` docs link in the title.** That syntax resolves only on the docs site, and
  `bin/changelog` renders the title verbatim into the root `CHANGELOG.md` and the GitHub release body
  too, where it links to a literal `@/api/...` path and 404s. When a title needs a docs link, use an
  absolute `https://handsontable.com/docs/...` URL. Reference linking for new options, hooks, methods,
  and plugins happens later, on the docs changelog page - see
  [`.changelogs/README.md`](../../../.changelogs/README.md).
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
npm run changelog entry
```

This walks you through each field and writes the JSON file for you. **Use it rather than writing the JSON by hand.** It is the only thing that guarantees the filename, and a hand-written file is how every violation of the rule below has been created.

If the target filename already exists, a non-interactive run refuses to overwrite
it. Edit or remove the existing JSON directly, or run the command in a terminal
to confirm the overwrite.

## One Entry Per Pull Request

**A PR adds one entry. A second is correct only when it cites a different GitHub number.** The authoritative rule lives in [`.changelogs/README.md`](../../../.changelogs/README.md); this section is the short form.

That holds even when the PR fixes several issues or makes several distinct user-facing changes. The title describes the overall change; it does not list individual issues.

Do **not** add a second entry because:

- the PR fixes a second bug that has no issue of its own — fold it into the one title;
- the fix also changes an API, or is `changed` as well as `fixed` — **a different `type` is not a reason for a second file**; describe both in the one title and let the `type` that matters most pick the section;
- the change spans the React, Vue, and Angular wrappers — **a different `framework` is not a reason either**; file it once with `framework: none`;
- the changes feel unrelated — if they are genuinely unrelated, they belong in separate PRs.

A second entry **is** correct for a public GitHub issue closed alongside the PR's own change: one file citing the issue number, one citing the PR number.

**Never invent a filename.** A file is always `<issueOrPR>.json`, a plain number and nothing else. `13442-changed.json`, `13442-react.json`, and `013442.json` are all rejected, because a number owns exactly one file — that is what keeps one PR to one entry. If the name you need is already taken, the entry already exists: fold your title into it.

Two blocking checks assert this, so a violation reds the PR rather than reaching a reviewer: `bin/changelog` rejects a misnamed file (on every PR, via the `consume --dry-run` step of the `changelog` job, and locally via pre-push), and the changelog gate rejects a third entry file. A maintenance PR that back-fills entries for *other* PRs writes `[multiple changelogs]` in the PR description to lift the count limit; `[skip changelog]` does not lift it.

Before you commit, list what the branch adds:

```bash
git fetch origin develop
git diff --name-only --diff-filter=A origin/develop...HEAD -- '.changelogs/*.json'
```

More than two paths is wrong — fold the extra titles together and delete the files. Swap `develop` for the PR's base branch when you target a release branch.

## Checklist

1. Confirm the PR already exists (open or draft). Capture its number from the `gh pr create` output or the PR URL.
2. Pick the correct `type` from the table above.
3. Write a clear, user-facing `title` ending with a period.
4. Set `breaking` to `true` only if the change breaks existing behavior.
5. Set `framework` to match the affected package, or `"none"` for core.
6. Leave `issuesOrigin` as `"private"` unless the entry cites a real public GitHub issue number — see [Issue Origin](#issue-origin).
7. Name the file `<PR-number>.json` and set `"issueOrPR"` to the same number — a plain number, with no suffix of any kind. Do not guess or infer the number — read it from the created PR. Write to `<repo-root>/.changelogs/<PR-number>.json` — **not** inside any package subdirectory (e.g. `handsontable/.changelogs/` is wrong). With `"public"`, both the filename and `issueOrPR` use the **issue** number instead.
8. Commit and push the new changelog file to the same feature branch so the open PR picks it up.
9. Confirm the branch adds **one** file under `.changelogs/`, or two citing different numbers, and that each filename equals its `issueOrPR` — see [One Entry Per Pull Request](#one-entry-per-pull-request).
