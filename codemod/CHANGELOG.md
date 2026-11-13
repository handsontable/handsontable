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
- Detect rules read the quoted values of a part (`regex` with `in: "strings"`), code without comments (`regex` with
  `code: true`), `registerPlugin()` calls by what the file imports (`pluginRegistration`), menu items (`property`
  with `in: "menu-item"`), and `true`, `false`, and `null` attributes of a template (`valueIs`). A rule with
  `requires: "none"` can name a `precheck` that lets a file through that never says Handsontable.
- A `manual` entry for a `handsontable` or wrapper dependency that installs from a repository or a URL
  (`github:`, `git+https:`, `https:`, `owner/repo`), because the tool cannot tell its version.
- A manual entry for an export call that passes a same-file `const` object that sets `columnHeaders` (the 18.0 and
  19.0 rules), naming the variable.
- Reports for `Handsontable.helper.sanitize` read through a destructured helper (`const { helper } = Handsontable`),
  and for an exported alias or reference of the function.

### Fixed

- A detect rule no longer matches the TODO comment the tool wrote, which repeated the guide link and the first
  sentence of the rule: the second run reported the key of the license check again and, in JSX, added a second
  comment. The license key check now reads the string whose whole value is the key, not a URL or a sentence that holds
  it, and reads a file that never says Handsontable.
- `19.0.0/loading-without-dialog` follows the imports of `Loading` and `Dialog`, so a renamed import is read.
- `19.0.0/editor-set-value` and the `srSP` check ignore a comment, `19.0.0/checked-menu-item-property` reports only a
  menu item, and `19.0.0/dropdown-strict-false` reads Vue and Angular templates.
- `getPlugin('ExportFile')` and `getPlugin('exportFile')` name the same plugin for every rule that needs a plugin
  receiver, as in Handsontable.
- `--to 19.0` without `--include-draft` says that 19.0 is a draft that was skipped, not that no migration is known.
  `--only '19.0.0/*'` without the flag names the draft. `--to` and `--include-draft` say in `--help` and in the README
  that the flag moves the default `--to` to the newest draft.
- The note about a pin in `resolutions` says "resolutions", not "overrides".
- The TODO of `19.0.0/resize-state-methods` on a call it keeps names the method.

## [0.1.0] – not published

### Added

- The `handsontable-codemod migrate` command, with `--from`, `--to`, `--dry-run`, `--report`, `--only`, `--list`,
  `--aggressive`, `--no-todo`, `--include-draft`, `--allow-dirty`, `--allow-uncovered`, and `--max-file-size`.
- The 17.x to 18.0 migration and the 18.0 to 18.1 migration.
- Support for JavaScript, TypeScript, JSX, TSX, Vue single-file components, CSS, SCSS, HTML templates (report only),
  and `package.json`.
