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
