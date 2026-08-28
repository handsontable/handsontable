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


## No entry may be published twice

`consume` and `sync` both refuse to compile a pending entry whose change `CHANGELOG.md` already publishes. Without that check the same change gets announced in two consecutive releases, which happened at most releases up to 18.1.0.

The cause is that a pending `.json` file can outlive the release-to-develop merge-back after the release branch has already consumed it. Two merge shapes produce it, and neither is easy to spot:

- The change is committed once on the release branch and once on `develop`, with no ancestry between the two commits. Against the merge base the release side reads as add-then-delete, so develop's add is the only change on either side and the merge keeps it. **No conflict is raised at all.**
- The `.json` file is edited on `develop` after the release branch consumed it. That is a modify/delete conflict, and resolving it in favor of develop keeps a file that should have gone.

Rather than trying to recognize either shape, the check asserts the one thing both produce. It matches on two keys, with different severities:

| Match | Result |
|---|---|
| `issueOrPR` already cited in `CHANGELOG.md`, and `issuesOrigin` is `private` | **fails** |
| `issueOrPR` already cited, and `issuesOrigin` is `public` | warns |
| the entry's title already published, under any number | warns |

A pull request number cannot ship twice, so a `private` number match is conclusive. The other two can be legitimate: a public **issue** number may be cited by two releases when a partial fix is followed by a complete one, and one title may appear in two sections when a fix is backported to several release lines. Both keys are still needed — a wrong link in the published entry hides the number, and rewording an entry on one branch hides the title.

`sync` targets one version section and already skips entries present in it, so there the check looks at every *other* section.

Because `consume --dry-run` runs on every pull request (see `.github/workflows/checks.yml`), this is enforced on every PR as well as at release time. A failure names every offending file and prints the `git rm` line that clears them.

**To resolve a failure**, delete the entry files it names — their change already shipped. If one of them is genuinely a new change that happens to reuse a released pull request number, renumber the entry to cite its own pull request instead. There is no skip flag: an entry that is already published has nothing left to announce.

After performing a release-to-develop merge-back, check for this before pushing:

```bash
bin/changelog consume --date 2050-01-01 --dry-run
```
