---
name: node-scripts-dev
description: Use when creating or modifying any .mjs file in the Handsontable monorepo - scripts, utilities, or library modules. Covers .mjs conventions, native node: imports, top-level await, cross-platform compatibility, and fs/promises async patterns. Trigger on any new .mjs file creation, not just files in scripts/ directories.
---

# Writing Node.js `.mjs` Modules

All Node.js-side code (scripts, utilities, library modules, Playwright helpers, build tooling) is ESM `.mjs`.

## File conventions

- Extension: `.mjs` for all Node.js-side code.
- Location: `scripts/` for CLI-invoked scripts, `lib/` for shared modules; package-specific paths are fine (`performance-tests/lib/`, `wrappers/react-wrapper/scripts/`).
- Invocation: `node scripts/your-script.mjs` from `package.json` scripts, or as a `cmd` in `handsontable/scripts/tasks.json`.

## Adding npm scripts to the handsontable core package

`handsontable/` uses a unified dispatcher. Put every command in `handsontable/scripts/tasks.json` and keep a thin shim in `package.json`:

```json
"my-task": {
  "cmd": "node scripts/my-script.mjs",
  "deps": ["build:styles"],
  "mode": "inherit"
}
```

```json
"my-task": "node scripts/run.mjs my-task"
```

| Field | Required | Values | Purpose |
|-------|----------|--------|---------|
| `cmd` | yes | shell string | Run via `spawn(..., { shell: true })` |
| `deps` | no | task name array | Tasks that must complete first (DAG scheduler in parallel mode, sequential in direct invocation) |
| `mode` | no | `quiet` (default) \| `inherit` \| `interactive` | `quiet` = spinner; `inherit` = stream output (linters); `interactive` = full TTY pass-through (Jest) |
| `cwd` | no | path relative to `handsontable/` | Working directory override |
| `passthrough` | no | boolean | Append extra CLI flags (after `--`) to the cmd |
| `note` | no | string | Annotation only |

Pipelines go in the `pipelines` block:

```json
"pipelines": {
  "my-pipeline": {
    "before": ["clean"],
    "tasks": ["my-task", "other-task"],
    "after":  ["prepare-package-for-publish"]
  }
}
```

`before` and `after` run sequentially; `tasks` run sequentially with `--sequential` or via DAG with `--parallel`.

Wrapper packages and `performance-tests/`, `visual-tests/` take scripts directly in their own `package.json` (no `run.mjs` dispatcher).

## Imports and top-level await

- Prefix built-ins with `node:` (`import { readFile } from 'node:fs/promises'`, `node:path`, `node:url`, `node:child_process`, `node:util`).
- Use top-level `await` in module scope; wrap in try/catch only for an error boundary.

## Native modules over dependencies

Do not add third-party dependencies for what Node.js does natively.

| Task | Use | Not |
|------|-----|-----|
| Read/write files | `node:fs/promises` | `fs-extra` |
| Delete recursively | `rm({ recursive: true, force: true })` | `rimraf` |
| Move/rename | `rename()` | `mv` |
| Run child process | `node:child_process` + `promisify(exec)` | `execa` |
| Parse CLI args | `node:util` `parseArgs()` or `process.argv` | `yargs`, `commander` |
| Path manipulation | `node:path` | `slash`, `normalize-path` |
| Glob matching | `node:fs` `readdir` + filter (`glob`/`fast-glob` only for complex patterns) | `glob`, `fast-glob` otherwise |

## Cross-platform (Linux, macOS, Windows)

- `package.json` scripts: use Node helpers in place of bash constructs (`if [ ]`, `mv`, `rm -rf`, `a && b || c` conditionals). Plain `&&` sequencing is fine.
- Build paths with `node:path` `join()`.
- Use async `node:fs/promises` (`readdir`, `rename`, `rm`, `access`).
- `__dirname` equivalent: `import.meta.dirname` (Node 21+) or `dirname(fileURLToPath(import.meta.url))`.
- Reference: `wrappers/react-wrapper/scripts/prepare-types.mjs`.

Existence check:

```js
const exists = async (path) => access(path).then(() => true, () => false);
```

## Error handling

- Set `process.exitCode = 1` on failure so cleanup finishes.
- Comment every silent `catch` with why the error is swallowed.
- Include the file path or operation in error messages.

## Existing scripts

| Script | Purpose |
|--------|---------|
| `scripts/sync-skills-to-cursor.mjs` | Sync .claude/skills to .cursor/rules |
| `scripts/translate-to-native-npm.mjs` | Workspace command delegation |
| `scripts/verify-bundles.mjs` | Post-build version verification |
| `scripts/pre-release.mjs` | Pre-release version generation |
| `wrappers/react-wrapper/scripts/prepare-types.mjs` | Cross-platform type preparation |
