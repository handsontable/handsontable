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


## One entry per pull request

**A PR adds one entry. A second is correct only when it cites a different GitHub number.**

One entry stays the norm even when the PR fixes several issues, touches several packages, or makes several distinct user-facing changes — the single title describes the overall change. Two entries for one change land as two lines of the same release, and a reader cannot tell they came from one change. If one title cannot carry everything the PR does, split the PR, not the entry.

The one routine second entry is a public GitHub issue closed alongside the PR's own change: one file citing the issue number, one citing the PR number. Each cites a number of its own, so each is a line about a distinct thing.

**A different `type` is not a reason to add a second file, and neither is a different `framework`.** A fix that also changes an API is still one change: describe both in the one title, and let the `type` that matters most pick the section. A fix that spans the React, Vue, and Angular wrappers is one change too, filed once with `framework: none`.

### What enforces this

Two checks, both blocking, and neither rests on the reviewer:

| Check | Where | What it asserts |
|---|---|---|
| Entry filenames | `bin/changelog` (`consume` and `sync`), and the pre-push hook | Every `.changelogs/*.json` is named `<issueOrPR>.json` — a plain number, matching the number the entry cites |
| Entry count | `.github/scripts/check-changelog.js` | A PR adds at most two entry files |

The filename check is the load-bearing one. A number owns exactly one file, so two entries citing one number cannot coexist on disk — which is what makes a `13442-changed.json` beside `13442.json` impossible rather than merely discouraged. It runs on every PR through the `consume --date 2050-01-01 --dry-run` step of `checks.yml`'s `changelog` job, and it needs no diff, so a rename cannot slip past it.

The filename assertion is intentionally fail-closed in both `consume` and `sync`. There is no bypass for a stale or misnamed file: release compilation must stop until the file is renamed, folded, removed, or corrected. This means one stray file on `develop` can fail an unrelated PR and can stop a release cut, but it prevents invalid release notes from being published silently. The command names every offending file and prints the safe remedy.

`bin/changelog entry` has always written that filename and cannot write another, so **the way to stay on the right side of both checks is to use it** rather than writing the JSON by hand.

**To add more than two entries**, which only a maintenance PR back-filling entries for *other* pull requests should need, write the following in the **PR description**, outside any HTML comment, and re-run the failed **Changelog** check:

```
[multiple changelogs]
```

This is a separate marker from `[skip changelog]` on purpose. That one answers "does this change need an entry at all"; it never lifts the entry limit.

Check before you commit the entry:

```bash
git fetch origin develop
git diff --name-only --diff-filter=A origin/develop...HEAD -- '.changelogs/*.json'
```

More than two paths is wrong. Two paths citing the same number cannot happen. Swap `develop` for the PR's base branch when you target a release branch.


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
| `issueOrPR` | number | The cited GitHub number. Also the filename, exactly — `<issueOrPR>.json`, never a suffixed variant. Asserted; see [One entry per pull request](#one-entry-per-pull-request). |
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


## Publishing to the docs changelog page

`consume` and `sync` write the root `CHANGELOG.md`, and the release workflow copies that version's
section into `docs/content/guides/upgrade-and-migration/changelog/changelog.md`. **Nothing writes the
per-major page** `docs/content/guides/upgrade-and-migration/changelog-<N>/changelog-<N>.md`. Someone
copies the section there by hand, demoting `###` to `####`, and that page is what the docs site and
the version-comparison UI read.

That hand step owns one editorial rule, and it is the reason this section exists: **every new option,
hook, method, and plugin named in an `Added` entry links to its reference page.** The practice ran
from 10.0.0 to 14.2.0, was never written down, and lapsed at 14.3.0 when the person doing it left
(DEV-2790).

Use the bracketed form, with a lowercase anchor:

```markdown
- Added an Enter key handler and a new [`searchMode`](@/api/options.md#searchmode) option to the
  [`Filters`](@/api/filters.md) plugin. [#11871](https://github.com/handsontable/handsontable/pull/11871)
```

| Named thing | Link target |
|---|---|
| configuration option | `@/api/options.md#<lowercased name>` |
| hook | `@/api/hooks.md#<lowercased name>` |
| Core method | `@/api/core.md#<lowercased name>` |
| plugin, or a plugin method | `@/api/<pluginName>.md`, `@/api/<pluginName>.md#<lowercased method>` |

Anchors are the plain lowercased member name, because the reference page emits the name verbatim as a
heading. `#minRowHeights` never resolves; `#minrowheights` does.

Leave unlinked anything that has no reference page: theme tokens and CSS class names, TypeScript type
names, external APIs such as `Intl.NumberFormat`, object keys that are not API members, and wrapper
package names. A link to a page that does not document the name is worse than no link.

`npm run docs:validate-changelog-links --prefix docs` lists the candidates and flags `@/api/` links
whose file or anchor cannot resolve. It is report-only, runs on every docs pull request, and its
candidate set is a heuristic: a backticked word that happens to match an option name is not proof the
entry introduced that option. Judge each finding.

It sees options, hooks, plugin classes, and `Core` members. **It does not see plugin methods**, and
cannot: a bare `collapseAll()` belongs to both the `CollapsibleColumns` and the `NestedRows` plugin,
and only the sentence around it says which. Link those by hand.

### Why the link cannot live in the entry `title`

`bin/changelog` renders `title` verbatim into four destinations: the root `CHANGELOG.md`, the GitHub
release body, the docs changelog page, and the version-comparison UI. Only the docs page resolves
`@/api/` links. On GitHub the same text renders as a link to a literal `@/api/...` path, which 404s,
and the version-comparison UI drops the link and keeps the text. So an entry title that needs a docs
link uses an absolute `https://handsontable.com/docs/...` URL, and reference linking happens later,
on the docs page.


## No entry may be published twice

`consume` and `sync` both check a pending entry against what `CHANGELOG.md` already publishes, and refuse to compile it when that match is conclusive; a less certain match only warns. Without that check the same change gets announced in two consecutive releases, which happened at most releases up to 18.1.0.

The cause is that a pending `.json` file can outlive the release-to-develop merge-back after the release branch has already consumed it. Two merge shapes produce it, and neither is easy to spot:

- The change is committed once on the release branch and once on `develop`, with no ancestry between the two commits. Against the merge base the release side reads as add-then-delete, so develop's add is the only change on either side and the merge keeps it. **No conflict is raised at all.**
- The `.json` file is edited on `develop` after the release branch consumed it. That is a modify/delete conflict, and resolving it in favor of develop keeps a file that should have gone.

Rather than trying to recognize either shape, the check asserts the one thing both produce. It matches on two keys, with different severities:

| Match | Result |
|---|---|
| `issueOrPR` already cited in `CHANGELOG.md`, and `issuesOrigin` is `private` | **fails** |
| `issueOrPR` already cited, `issuesOrigin` is `public`, and the title also matches | **fails** |
| `issueOrPR` already cited, `issuesOrigin` is `public`, and the title does not match | warns |
| only the entry's title already published, under any number | warns |

A pull request number cannot ship twice, so a `private` number match is conclusive. A public **issue** number may legitimately be cited by two releases when a partial fix is followed by a complete one — but a partial fix gets a new title, so a `public` number match that also matches the title is not that case, and fails the same way a `private` match does. A title-only match may still legitimately appear in two sections when a fix is backported to several release lines, so it always warns. Both keys are still needed — a wrong link in the published entry hides the number, and rewording an entry on one branch hides the title.

`sync` targets one version section and already skips entries present in it, so there the check looks at every *other* section.

Because `consume --dry-run` runs on every pull request (see `.github/workflows/checks.yml`), this is enforced on every PR as well as at release time. A failure names every offending file and prints the `git rm` line that clears them.

**To resolve a failure**, delete the entry files it names — their change already shipped. If one of them is genuinely a new change that happens to reuse a released pull request number, renumber the entry to cite its own pull request instead. There is no skip flag: an entry that is already published has nothing left to announce.

After performing a release-to-develop merge-back, check for this before pushing:

```bash
bin/changelog consume --date 2050-01-01 --dry-run
```
