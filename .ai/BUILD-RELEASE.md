# Build Orchestration and Release (Monorepo)

This file covers how the monorepo builds and releases. For the tool and version
inventory (Rspack, SWC, Sass, output paths, CSS themes, CI workflow names), see
[`.ai/STACK.md`](STACK.md). For core-internal build scripts and tasks, see
`handsontable/.ai/` and `handsontable/AGENTS.md`.

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

## Versioning policy

The monorepo uses SemVer with coordinated versioning across all packages.

- Patch releases are for critical fixes only.
- Even-numbered major releases (16, 18, 20, 22) become **LTS releases**.
- Odd-numbered major releases (17, 19, 21) are **Current-only** (6-month lifecycle).
- No more than 4 major releases per year (preferably 0). Bulk multiple breaking
  changes into a single major release.
- Each release must include no less functionality than its predecessor.

## Branching

- Feature branches: `feature/issue-xxxx`.
- Documentation branches: `docs/issue-xxxx`.
- Release branches: `release/x.y.z`.
- Release documentation branches: `release/x.y.z-docs`, branched from `release/x.y.z`.
- LTS branches: `lts/[major].x`.

Follow the Git flow strategy. Never force-push to `master`, `develop`, or any
feature branch bound to an open pull request.

## Changelog and release flow

- Every pull request that changes package source code must include a changelog
  entry. Create one with `bin/changelog entry` (interactive CLI). Entries live
  in `.changelogs/` and follow the Keep a Changelog format
  (see `.changelogs/README.md`).
- Skip the changelog only for non-source changes by writing `[skip changelog]`
  in the pull request description. New documentation pages are an exception — do
  not skip the changelog for them.
- Pull requests merge with **Squash and merge** in the GitHub UI, by the author,
  after full approval.

### Release steps

1. **Coordinate the version.** Update `HOT_VERSION` in `hot.config.js`; all
   packages share it.
2. **Build.** Run the full build pipeline across the workspace.
3. **Package and publish.** Publish to npm with the coordinated version. The
   `publish.yml` GitHub Actions workflow handles publishing.
4. **Distribute.** Packages are available on npm and CDNs (jsDelivr and unpkg
   serve `dist/handsontable.full.min.js`).
