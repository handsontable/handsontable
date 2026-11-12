# @handsontable/codemod

A migration CLI that applies the mechanical part of a Handsontable upgrade to your project and reports everything
it cannot do. The package is private and not published yet. This page is a first draft.

## Usage

```bash
node codemod/bin/handsontable-codemod.mjs migrate [paths...] --from <version> --to <version>
```

`paths` are files or directories relative to the current directory. The default is the current directory.

| Flag | Meaning |
|---|---|
| `--from <version>` | Version the project is on: `17`, `17.1`, or `18.0.0`. A partial version means "any version of that line". Detected from `node_modules/handsontable` or the `package.json` range when omitted. |
| `--to <version>` | Version to migrate to. A partial version means the highest known release of that line. Defaults to the latest released migration. |
| `--dry-run` | Print a unified diff and write nothing. |
| `--allow-dirty` | Run even when the git tree has uncommitted changes. |
| `--report <file>` | Also write the report as a Markdown checklist. |
| `--only <ruleId>` | Run only this rule. Repeat the flag for several rules. |
| `--list` | List the rules in the version range and exit. |
| `--aggressive` | Also rewrite settings objects found with medium confidence. |
| `--include-draft` | Run migrations that are still drafts. |
| `--help` | Show the help. |

A migration for version `v` runs when `from < v <= to`. Rules whose kind has no transform yet are listed as
"not implemented" by `--list` and skipped in a normal run.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Done. |
| 1 | A file could not be read, parsed, or transformed. The other files are still migrated. |
| 2 | Usage error, or a refusal: dirty git tree, empty version range, unknown rule id. |

## Behavior

- The tool refuses to run on a dirty git tree so the migration shows up as one clean diff. `--dry-run` and `--list`
  skip that check.
- Files inside `node_modules`, `dist`, `build`, and `coverage`, minified files, and `.d.ts` files are skipped.
- Only changed files are written. Run your formatter afterwards.
- A second run changes nothing. Follow-up comments are `TODO(handsontable-codemod <ruleId>): ...` and are never
  duplicated.
- The tool never inserts a sanitizer or a license key.

For contributors: see [`AGENTS.md`](./AGENTS.md).
