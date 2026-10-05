---
name: changelog-creation
description: Use when a source code change needs a changelog entry, or before committing and pushing any bug fix, feature, or behavior change to source code - detecting when entries are required, categorizing changes correctly (added/changed/fixed/deprecated/removed/security), writing user-facing titles, and creating the JSON entry in .changelogs/
---

## When an entry is required

Any PR that changes source code: bug fixes, features, behavior changes, deprecations, security fixes.

Not required for test-only, documentation-only, and CI/tooling changes (the gate passes them automatically; leave the marker out), or for a bug introduced but not yet released. To deliberately skip the entry on a change under `handsontable/src/**` or `wrappers/**`, write `[skip changelog]` in the PR description outside HTML comments.

## Workflow: PR first, then the changelog

The file is named after the GitHub PR number, so the PR must exist first (a guessed number can go stale when another PR opens).

1. Commit the source change on the feature branch.
2. Push and run `gh pr create` (see the `pr-creation` skill).
3. Read the PR number from the printed URL (`.../pull/12395` is `12395`).
4. Create `<repo-root>/.changelogs/<PR-number>.json` with `"issueOrPR"` set to the same number. The path is the repo root, never a package subdirectory such as `handsontable/.changelogs/`.
5. Commit with a message like `DEV-xxx: Add changelog entry for PR #<number>` and push.

## Fields

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

`issuesOrigin` answers one question: is `issueOrPR` a public GitHub issue number? It picks the link path in the generated `CHANGELOG.md`, and `bin/changelog` derives the filename from `issueOrPR`, so the two move together:

| `issuesOrigin` | `issueOrPR` | Filename | Rendered link |
|---|---|---|---|
| `"private"` (default, every `DEV-xxx` task) | PR number | `<PR-number>.json` | `.../pull/<n>` |
| `"public"` (rare, cites a real public GitHub issue) | issue number | `<issue-number>.json` | `.../issues/<n>` |

`type`:

| Type | When |
|---|---|
| `added` | Wholly new feature or capability |
| `changed` | Enhancement or modification of existing behavior |
| `fixed` | Bug fix |
| `deprecated` | Feature scheduled for removal in the next major |
| `removed` | Feature already removed in this release |
| `security` | Vulnerability or XSS fix |

`framework`: `"none"` (default, core `handsontable`), `"react"` (`@handsontable/react-wrapper`), `"angular"` (`@handsontable/angular-wrapper`), `"vue"` (`@handsontable/vue3`). Set `breaking` to `true` only when existing behavior breaks.

## Title

- Write from the user's perspective, in the past tense, specific, ending with a period: "Fixed cell editor closing unexpectedly on scroll."
- Describe user-visible behavior; leave internal names ("Refactored DataMap", "Updated metaSchema.js") out.
- A docs link uses an absolute `https://handsontable.com/docs/...` URL. The `@/api/...` syntax resolves only on the docs site, and `bin/changelog` renders the title verbatim into `CHANGELOG.md` and the GitHub release body, where it 404s. Reference links for new options, hooks, methods, and plugins are added later on the docs changelog page (see [`.changelogs/README.md`](../../../.changelogs/README.md)).
- For `"breaking": true` (listed first in the generated changelog), state what breaks and what to do instead.

## CLI

Create the entry with `npm run changelog entry`; it is the only thing that guarantees the filename (hand-written files are how every filename violation below happened). An existing target file is not overwritten in a non-interactive run: edit or remove it directly, or run in a terminal to confirm.

Without a terminal (agent session, CI) pass every field as a flag using the entry's own field names. `--issue`, the flag `--help` lists, never reaches `issueOrPR`, and `issuesOrigin` has no listed flag, so a run with only the listed flags dies with `input.issuesOrigin must be one of: private,public (got: undefined)`:

```bash
node bin/changelog entry --issuesOrigin private --issueOrPR 12345 --type fixed --no-breaking --framework none "Fixed ..."
```

## One entry per pull request

A PR adds one entry, even when it fixes several issues or makes several user-facing changes: fold them into one title. A second entry is correct only for a public GitHub issue closed alongside the PR: one file citing the issue number, one citing the PR number. Full rule: [`.changelogs/README.md`](../../../.changelogs/README.md).

A different `type`, a different `framework` (a change spanning the React, Vue, and Angular wrappers is one entry with `framework: none`), a second bug without an issue of its own, or unrelated-feeling changes (those belong in separate PRs) are not reasons for a second file. The `type` that matters most picks the section.

A file is always `<issueOrPR>.json`, a plain number. `13442-changed.json`, `13442-react.json`, and `013442.json` are rejected, because a number owns exactly one file. If the name you need exists, fold your title into that entry.

Two blocking checks enforce this: `bin/changelog` rejects a misnamed file (every PR via the `consume --dry-run` step of the `changelog` job, locally via pre-push), and the changelog gate rejects a third entry file. A maintenance PR back-filling entries for other PRs writes `[multiple changelogs]` in the description to lift the count limit (`[skip changelog]` does not).

Before committing, list what the branch adds:

```bash
git fetch origin develop
git diff --name-only --diff-filter=A origin/develop...HEAD -- '.changelogs/*.json'
```

More than two paths means fold the titles and delete the extra files. Use the PR's base branch in place of `develop` for a release-branch PR.

## Checklist

1. PR exists (open or draft); its number comes from the `gh pr create` output or URL.
2. `type`, user-facing `title` ending with a period, `breaking`, `framework` set.
3. `issuesOrigin` is `"private"` unless the entry cites a real public GitHub issue.
4. File is `<repo-root>/.changelogs/<PR-number>.json` (issue number with `"public"`), `issueOrPR` equal to the filename number, no suffix.
5. Committed and pushed to the PR's branch.
6. The branch adds one file under `.changelogs/` (or two citing different numbers).
