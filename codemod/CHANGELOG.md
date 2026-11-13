# Changelog

All notable changes to `@handsontable/codemod` are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) on its own: its version is not the Handsontable version.
One release of the tool covers several Handsontable migrations, listed under "Supported migrations" in the README.

How versions are chosen:

- **Patch**: a fix to a rule, a message, or the printer that changes no rule from report to rewrite.
- **Minor**: a new migration (a new `versions/<semver>/` manifest), a new rule, a new flag, or a rule that starts to
  rewrite what it only reported.
- **Major**: a removed or renamed flag, a changed exit code, or a rule that stops rewriting.

## [Unreleased]

### Added

- The 18.1 to 19.0 migration, as a draft: it runs only with `--include-draft` and its rules can change before the
  release of Handsontable 19.0.
- A `notAutomated` list in a manifest for the changes that have no rule. `--list` prints how many there are.

## [0.1.0] – not published

### Added

- The `handsontable-codemod migrate` command, with `--from`, `--to`, `--dry-run`, `--report`, `--only`, `--list`,
  `--aggressive`, `--no-todo`, `--include-draft`, `--allow-dirty`, `--allow-uncovered`, and `--max-file-size`.
- The 17.x to 18.0 migration and the 18.0 to 18.1 migration.
- Support for JavaScript, TypeScript, JSX, TSX, Vue single-file components, CSS, SCSS, HTML templates (report only),
  and `package.json`.
