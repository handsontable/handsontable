# STACK.md

## Runtime

- **Node.js 22** (the monorepo `.nvmrc`). Uses ESM, `node:fs` sync APIs, and no transpilation step.
- **ESM only.** All files are `.mjs` and use `import`/`export`; the `.mjs` extension is required in every relative import path (Node ESM requirement). Native modules use the `node:` prefix (`node:fs`, `node:path`, `node:url`).

## Dependencies

- **No runtime dependencies.** Everything is built on the Node standard library.
- **No extra dev dependencies.** Linting is the monorepo ESLint config (the tool lives under `handsontable/scripts/`); tests use the built-in `node:test` runner. There is no bundler and no TypeScript compiler in the generator itself — it *emits* TypeScript as text.

## Scripts

Run from the `handsontable/` package root:

| Command | What it does |
|---|---|
| `npm run generate:themes` | Runs `node scripts/themes/figma/index.mjs` via the task runner — the whole build. Wipes `src/themes/static/` and regenerates it. |
| `node --test scripts/themes/figma/__tests__/` | Runs the generator's own unit tests (emitter + iconsMap drift guard). |

The task is registered as `generate:themes-static` in `scripts/tasks.json`. It is **not** part of the default build graph — it is on-demand codegen.

## Output formatting

- Generated `.ts` variable files use **single quotes**; icon files use **double quotes** plus a leading `/* eslint-disable max-len, quotes */`. This is decided inside `utils/jsGeneration.mjs` (`toSingleQuotedString` / `toDoubleQuotedString`), not by a formatter run over the output.
- Every generated file carries the `auto-generated` header comment (CSS files excepted — the CSS emitter adds none). The generated files are committed to the repo and linted/type-checked like any other source under `src/`.

## External contract

The generated files land directly in `handsontable/src/themes/static/`. They are consumed by the `handsontable` package — its `registerTheme` API (the `.ts` variable modules) and the `theme` class-name option (the CSS files). `src/themes/types.ts` provides the types the generated modules import.
