# Changelogs

This directory includes temporary changelog entries, in the form of simple `.json` files. This was done to prevent merge conflicts when modifying the same `CHANGELOG.md` file in many PR's at once.


## Mandatory PR check

A changelog entry is required — and asserted by a GitHub Actions workflow — when a PR changes **shippable source**: anything under `handsontable/src/**` or `wrappers/**` except test files and markdown. The check fails when such a PR does not add a new `.changelogs/*.json` file.

Documentation-only, test-only, and CI/tooling PRs **pass automatically** — no entry and no opt-out needed. If a pushed commit does not have a PR associated with it, the check is skipped entirely.

**To skip the requirement on a source change** (rare — e.g. an internal change with no user-visible effect), add the following string to the **PR description**, outside any HTML comment (a commented mention, like the hint in the PR template, is deliberately inert):

```
[skip changelog]
```

...and re-run the failed **Changelog** check from the PR's checks tab (or push any new commit — `git commit --allow-empty` works). The check reads the PR body at run time; editing the description alone does not re-trigger it. The override is logged together with the source files it waves through, so reviewers can judge it.


## One entry per changelog section

**A PR never adds two entries that land in the same `CHANGELOG.md` section for the same package.** One entry per PR is the norm.

One entry stays the norm even when the PR fixes several issues, touches several packages, or makes several distinct user-facing changes — the single title describes the overall change. Two entries that share a `type` and a `framework` land as two overlapping lines in the same section, and a reader cannot tell they came from one change. If one title cannot carry everything the PR does, split the PR, not the entry.

A second entry is correct only when it lands somewhere else — a different `type`, or a different `framework`. The common case is a public issue fixed alongside a private behavior change: `fixed` plus `changed`. Those two cannot fold into one file, because a file carries one `type` and `type` picks the section.

The CI gate does not count entries. It only asserts that a source change adds at least one, so this rule rests on the author and the reviewer.

Check before you commit the entry:

```bash
git fetch origin develop
git diff --name-only --diff-filter=A origin/develop...HEAD -- '.changelogs/*.json'
```

Read the `type` and `framework` of every path it lists. Two paths that share both are wrong — fold them together and delete the extra. Swap `develop` for the PR's base branch when you target a release branch.


## Entry format

Every `.json` file in this directory holds a single entry with six required fields:

```json
{
  "issuesOrigin": "private",
  "title": "Fixed the cell editor closing unexpectedly on scroll.",
  "type": "fixed",
  "issueOrPR": 12345,
  "breaking": false,
  "framework": "none"
}
```

| Field | Accepted values | Meaning |
|---|---|---|
| `issuesOrigin` | `private`, `public` | Whether `issueOrPR` is a public GitHub issue number. See below. |
| `title` | non-empty string | User-facing description of the change, ending with a period. |
| `type` | `added`, `changed`, `deprecated`, `removed`, `fixed`, `security` | The `CHANGELOG.md` section the entry lands in. |
| `issueOrPR` | number | The cited GitHub number. Also the filename. |
| `breaking` | boolean | Breaking changes are listed first within their section. |
| `framework` | `none`, `react`, `vue`, `angular` | Prefixes the entry with the framework name; `none` for core. |

### `issuesOrigin`

This field answers one question: **is the number in `issueOrPR` a public GitHub issue?** It says nothing about the pull request, and nothing about the repository being public.

It selects the link path in the generated `CHANGELOG.md`, and `bin/changelog` names the file after `issueOrPR`, so the two fields move together:

| `issuesOrigin` | `issueOrPR` | Filename | Rendered link |
|---|---|---|---|
| `private` — the default, and almost always correct | pull request number | `<PR-number>.json` | `https://github.com/handsontable/handsontable/pull/<n>` |
| `public` — rare | public GitHub **issue** number | `<issue-number>.json` | `https://github.com/handsontable/handsontable/issues/<n>` |

Work tracked in a private ClickUp task is `private` — that covers every change with a `DEV-xxx` ID. Reach for `public` only when the entry cites a real public GitHub issue number.

A wrong value does not break the published output, because GitHub redirects `/issues/<n>` to `/pull/<n>` when the number belongs to a pull request. It does publish the wrong path in the release notes, and it makes the field carry no information.

When you create an entry interactively, `bin/changelog entry` warns if you pick `public` for a number that resolves to a pull request. The warning needs network access and is skipped silently without it, and it cannot see entries you write by hand.


## Changelog helper

This repository includes a script that aids in creating new changelog entries and compiling them into the final `CHANGELOG.md` file.

To see the list of commands and their options, run:

```bash
bin/changelog
bin/changelog <command> --help
```

> All commands take command line parameters in addition to being interactive. See `--help` of the individual commands for more info.


### Adding a new entry

To add a new changelog entry, use the `entry` command:

```bash
bin/changelog entry
```

This will create a new `.json` file in this directory. You don't need to modify `CHANGELOG.md` for the entry to be considered valid.


### Compiling

When a new version is ought to be released, the `.changelogs/*.json` files must be compiled into the human-readable `CHANGELOG.md` file.

To do that, use the `consume` command:

```bash
bin/changelog consume
```

This command "consumes" all changelog entries, asserts that they're all valid, formats them, and inserts the result into `CHANGELOG.md`. It also deletes all existing `.changelogs/*.json` files.

It is side-effect free (as in it does nothing outside of your local copy of this repository), to undo just checkout the old versions of `.changelogs` and `CHANGELOG.md`.
