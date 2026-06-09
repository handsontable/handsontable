---
name: node-scripts-dev
description: Use when creating or modifying any .mjs file in the Handsontable monorepo - scripts, utilities, or library modules. Covers .mjs conventions, native node: imports, top-level await, cross-platform compatibility, and fs/promises async patterns. Trigger on any new .mjs file creation, not just files in scripts/ directories.
---

# Writing Node.js `.mjs` Modules

All Node.js-side code in the monorepo -- scripts, utilities, and library modules -- uses ESM (`.mjs`). Follow these conventions for any `.mjs` file, whether it lives in `scripts/`, `lib/`, or elsewhere.

## File conventions

- **Extension:** Always `.mjs` (never `.js` or `.cjs` for Node.js-side code).
- **Location:** `scripts/` for CLI-invoked scripts. `lib/` for shared utilities and library modules. Package-specific paths are fine (e.g., `performance-tests/lib/`, `wrappers/react-wrapper/scripts/`).
- **Invocation:** `node scripts/your-script.mjs` from `package.json` scripts, or as a `cmd` value in `handsontable/scripts/tasks.json` (see below).
- **Scope:** These conventions apply to all `.mjs` files -- standalone scripts, library modules, Playwright helpers, build tooling, etc.

## Adding npm scripts to the handsontable core package

The `handsontable/` package uses a unified dispatcher. **Do not add raw shell commands directly to `handsontable/package.json` scripts.** Instead:

1. Add the task to `handsontable/scripts/tasks.json`:

```json
"my-task": {
  "cmd": "node scripts/my-script.mjs",
  "deps": ["build:styles"],
  "mode": "inherit"
}
```

2. Add a thin shim to `package.json` that delegates to the dispatcher:

```json
"my-task": "node scripts/run.mjs my-task"
```

### tasks.json schema

| Field | Required | Values | Purpose |
|-------|----------|--------|---------|
| `cmd` | yes | shell string | Command run via `spawn(..., { shell: true })` |
| `deps` | no | task name array | Tasks that must complete first (resolved by DAG scheduler in parallel mode; resolved sequentially in direct invocation mode) |
| `mode` | no | `quiet` (default) \| `inherit` \| `interactive` | `quiet` = suppress output with spinner; `inherit` = stream output (linters); `interactive` = full TTY pass-through (Jest) |
| `cwd` | no | path relative to `handsontable/` | Working directory override |
| `passthrough` | no | boolean | Append extra CLI flags (after `--`) to the cmd |
| `note` | no | string | Human annotation only, ignored at runtime |

### Pipeline definitions

To group tasks into an ordered pipeline (e.g., a build or test sequence), add to the `pipelines` block:

```json
"pipelines": {
  "my-pipeline": {
    "before": ["clean"],
    "tasks": ["my-task", "other-task"],
    "after":  ["prepare-package-for-publish"]
  }
}
```

`before` and `after` steps run sequentially. `tasks` run sequentially with `--sequential` or via DAG with `--parallel`.

### Other packages

For wrapper packages (`wrappers/react-wrapper/`, `wrappers/angular-wrapper/`, `wrappers/vue3/`) and other monorepo packages (`performance-tests/`, `visual-tests/`), add directly to that package's `package.json` scripts as usual — those packages do not use the `run.mjs` dispatcher.

## Native module imports

Always use the `node:` protocol prefix for built-in modules. This makes it explicit that the import is a Node.js built-in, not a third-party package.

```js
// GOOD
import { readdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

// BAD - missing node: prefix
import { readFile } from 'fs/promises';
import { join } from 'path';
```

## Top-level await

Use top-level `await` directly in the module scope. No need to wrap in an `async function main()` unless you need structured error handling.

```js
// GOOD - direct top-level await
const content = await readFile(filePath, 'utf-8');
const entries = await readdir(dir, { withFileTypes: true });

// Also acceptable - when you need a try/catch boundary
try {
  await doWork();
} catch (err) {
  console.error(err);
  process.exitCode = 1;
}
```

## Prefer native modules

Do not add third-party dependencies for tasks that Node.js handles natively:

| Task | Use | Not |
|------|-----|-----|
| Read/write files | `node:fs/promises` | `fs-extra` |
| Delete recursively | `rm({ recursive: true, force: true })` | `rimraf` |
| Move/rename | `rename()` | `mv` |
| Run child process | `node:child_process` + `promisify(exec)` | `execa` |
| Parse CLI args | `node:util` `parseArgs()` or manual `process.argv` | `yargs`, `commander` |
| Path manipulation | `node:path` | `slash`, `normalize-path` |
| Glob matching | `node:fs` `readdir` + filter | `glob`, `fast-glob` (unless complex patterns needed) |

## Cross-platform compatibility

Scripts must work on Linux, macOS, and Windows. This is the monorepo's most common scripting gotcha.

- **No bash constructs** in `package.json` scripts: no `if [ ]`, `mv`, `rm -rf`, `&&` chaining with `||`.
- **Use `node:path` `join()`** for all paths -- never hardcode `/` separators.
- **Use `node:fs/promises`** async APIs (`readdir`, `rename`, `rm`, `access`) -- not their sync counterparts.
- **Use `import.meta.dirname`** (Node 21+) or `dirname(fileURLToPath(import.meta.url))` for `__dirname` equivalent.
- **Reference:** `wrappers/react-wrapper/scripts/prepare-types.mjs` as a well-structured example.

## Existence check pattern

```js
const exists = async (path) => access(path).then(() => true, () => false);
```

## Script structure template

```js
// Description of what this script does.
//
// Usage: node scripts/my-script.mjs [--dry-run]

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = import.meta.dirname
  ? join(import.meta.dirname, '..')
  : join(dirname(fileURLToPath(import.meta.url)), '..');

const dryRun = process.argv.includes('--dry-run');

// ... script logic using top-level await ...

const files = await readdir(join(ROOT, 'src'), { withFileTypes: true });

for (const entry of files) {
  if (!entry.isDirectory()) continue;
  // process entry
}

console.log('Done.');
```

## Error handling

- Set `process.exitCode = 1` on failure instead of `process.exit(1)` -- allows cleanup to finish.
- Silent `catch` blocks must include a comment explaining why the error is swallowed.
- Log actionable error messages -- include the file path or operation that failed.

## Existing scripts for reference

| Script | Purpose |
|--------|---------|
| `scripts/sync-skills-to-cursor.mjs` | Sync .claude/skills to .cursor/rules |
| `scripts/translate-to-native-npm.mjs` | Workspace command delegation |
| `scripts/verify-bundles.mjs` | Post-build version verification |
| `scripts/pre-release.mjs` | Pre-release version generation |
| `wrappers/react-wrapper/scripts/prepare-types.mjs` | Cross-platform type preparation |
