# Build Orchestration (Monorepo)

This file covers how the monorepo builds. For the tool and version
inventory (Rspack, SWC, Sass, output paths, CSS themes, CI workflow names), see
[`.ai/STACK.md`](STACK.md). For core-internal build scripts and tasks, see
`handsontable/.ai/` and `handsontable/AGENTS.md`.

Releasing and publishing are fully automated (the `publish.yml` workflow with a
coordinated `HOT_VERSION`); agents do not drive them, so they are not documented
here.

## Build order across the workspace

The core package must build before the wrappers. Each wrapper depends on the
built core output, not on core source.

1. **Build core first.** `npm --prefix handsontable run build`.
2. **Then build wrappers.** React, Angular, and Vue 3 wrappers consume the core
   `tmp/` output through pnpm workspace linking
   (`"handsontable": "workspace:^"` override in the root `package.json`).

Skipping the core build leaves wrappers linked against stale or missing output.
Wrapper tests fail for the same reason — build core before running them.

### Core build orchestration

The core build is driven by `handsontable/scripts/run.mjs`, which reads task
definitions and pipeline dependency graphs from `handsontable/scripts/tasks.json`.
Edit `tasks.json` to add, remove, or change any build, lint, or test step for
the core package — do not add raw shell commands to `package.json` scripts.

The root-level `translate-to-native-npm.mjs` script is a cross-workspace fan-out
for the root `npm run lint` and `npm run test` commands. It maps a root command
across all workspace packages. It does not orchestrate the core build.

### Environment variables

Build scripts read environment variables from `hot.config.js` (repo root),
injected via `env-cmd -f ../hot.config.js`. `hot.config.js` defines
`HOT_FILENAME`, `HOT_VERSION`, `HOT_PACKAGE_NAME`, `HOT_BUILD_DATE`, and
`HOT_RELEASE_DATE`. `HOT_VERSION` is the canonical version shared across all
packages, which keeps releases coordinated. There are no `.env` files (the
repository supports air-gapped environments).

## Build variants and outputs

The core library ships two UMD build variants:

| Variant | File | Contents |
|---|---|---|
| Base | `handsontable.js` | External dependencies not bundled |
| Full | `handsontable.full.js` | HyperFormula bundled in |

Test both when you change build-time behavior.

| Output | Path | Format |
|---|---|---|
| UMD and minified bundles | `handsontable/dist/` | UMD |
| ES and CommonJS modules (consumed by wrappers) | `handsontable/tmp/` | ESM (`.mjs`) and CJS (`.js`) |
| Compiled CSS | `handsontable/styles/` | CSS |
| Type declarations (auto-generated, do not edit) | `handsontable/tmp/*.d.ts` | `.d.ts` |

Type declarations come from `tsc --emitDeclarationOnly` (the `build:types` task,
using `tsconfig.build-types.json`). Published `.d.ts` files are downleveled so
TypeScript 5.1+ (Angular 16's maximum) can consume them.

For the branch-naming and changelog rules that gate a pull request, see the root
`AGENTS.md` and the `pr-creation` / `changelog-creation` skills.
