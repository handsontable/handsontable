# CONCERNS.md

Known sharp edges, technical debt, and behaviors that are easy to get wrong.

## `src/themes/static` is destroyed on every run

`index.mjs::main()` calls `rmSync(OUTPUT_PATH, { recursive: true })` before regenerating. Every file under `src/themes/static/` is tool-generated, so the wipe is safe — but it means the directory is **not** a place for hand-authored files. Unlike the original standalone repo, this output is **committed** to VCS: a regeneration shows up in the PR diff and must be reviewed. The single source of truth is `tokens.json`; if a theme is missing from the export, its files disappear on the next run (see the idempotency check in the migration plan).

## A hand edit of `src/themes/static` fails the unit suite

A token typed into the static files by hand (instead of being added to Figma and generated) looks complete until the next regeneration drops it, which is how the freezeBar and asyncValues tokens nearly shipped. So every run ends with `writeManifest()` (`utils/manifest.mjs`), which writes `static-manifest.json` next to `index.mjs`: one SHA-256 per file under `src/themes/static`, LF-normalized so a Windows `autocrlf` checkout matches. `src/themes/__tests__/staticThemesGenerated.unit.js` (Jest, so it runs in `test:unit` in CI) re-hashes the directory and fails on any added, removed, or changed file, with a message that points to the Figma-first workflow. Three rules:
- Commit the manifest together with the regenerated files. The two are one change; a manifest edited by hand to make the test pass defeats the gate and must never be done.
- The Jest test keeps its own copy of the hash (Jest does not load the generator's ESM). If `hashContent()` changes, change both, or the test fails right after the next regeneration.
- Dotfiles (a `.DS_Store` that Finder creates) are skipped by both listings, so they never reach the manifest or fail the test. An added or removed file gets its own message, apart from the hand-edit one.
- The generated files must stay lint-clean as written: the pre-commit hook runs `eslint --fix` on staged files, and a fix there would rewrite a file after the manifest was taken.

## Silent drops

- Tokens present in `tokens.json` but not listed in `tokensKeys.mjs` are **silently dropped** from per-theme output. There is no warning. If a design change doesn't show up in the generated CSS, this is the first place to check.
- `processTokenValue` returns `null` when a token isn't found at all, and `processThemeTokens` filters the null. `main()` then aborts before the wipe: `findUnresolvedTokens()` lists every `tokensKeys.mjs` entry a theme did not resolve, so a stale or incomplete export can no longer strip public variables from the committed themes. The manifest cannot catch that case, because a regeneration rewrites it. Export a fresh `tokens.json`, or add the variable to Figma first.
- `mode` references that don't resolve both a light and a dark variant return `null` (see `processReference` case `MODE_KEY`: it requires `result.length === 2`). A variant may be a `{colors.…}` reference or a plain literal (a raw RGBA such as `#1a42e81a`, which is how Figma stores the semi-transparent `<theme>/custom/row-selection`); a literal is emitted as is. Until that was accepted, `row-selection-background-color` was dropped from every theme on regeneration.

## A theme with no `ICONS_SET` entry silently falls back to `main`

`utils/cssGeneration.mjs::generateThemeCss` picks the icon set with `ICONS_SET[themeName] ?? ICONS_SET.main` — no branch to edit when adding a theme, but also no warning when a theme's `ICONS_SET` entry is missing or misspelled: it just renders with the `main` icons instead of its own. If a new theme's icons look wrong, check that its key in `ICONS_SET` (`utils/constants.mjs`) actually matches its `themeName`.

## No input validation

`loadTokens()` only handles the missing-file case (with a friendly error and `process.exit(1)`). A malformed or partially-populated `tokens.json` will fail somewhere deep in `generateAllVariables` with a harder-to-diagnose error. If you're debugging a weird crash, first verify the shape of `tokens.json` matches what `generateAllVariables` expects: top-level `sizing`, `density`, `colors`, `themes`.

## Unit heuristics are name-based

`formatValue` decides units from substrings of the *key name* (`"opacity"` → `%`, `"transition"` → `s`, else `px`). A future token whose name doesn't follow this pattern will get the wrong unit. Fix is to extend `formatValue`, not to inline a unit in `tokens.json`.

## `EXCEPTION_KEYS` affects two generators differently

- In `themeProcessing.js::formatValue`, these keys bypass **unit formatting**.
- In `jsGeneration.js::convertKeysToCamelCase`, values under these keys bypass **reference-camelCase conversion** (so a font stack string isn't munged).

Both behaviors must stay in sync. Currently the list contains only `"font-family"`.

## Limited test coverage

`__tests__/` covers the typed-module emitter (`buildTsModule`, `tsConstName`), the iconStyles drift guard, the manifest, and a few `processTokenValue` cases (mode references with literal and referenced variants). Run it with `node --test scripts/themes/figma/__tests__/*.test.mjs` (the bare directory path fails to resolve on Node 22); the root `npm run test:tooling` runs it too, which is what the CI `Checks / tooling tests` job runs, so keep these tests on Node built-ins only. **Full reference resolution (`utils/themeProcessing.mjs`) is not unit-tested** — there is no automated check that it produces the same output for a given `tokens.json`. The safeguards there are:
1. Running `npm run generate:themes` and reviewing the `src/themes/static` diff (the CSS output is the semantic anchor — see the migration plan's idempotency check).
2. The repo's theme registry unit tests (`src/themes/__tests__/`) running against the regenerated modules.

Treat changes to `utils/themeProcessing.mjs` with extra care.

## The `.ai/` self-improvement rule

When an AI agent discovers information in `AGENTS.md` / `CLAUDE.md` / `.ai/` that is **incorrect, outdated, or missing**, update the correct file immediately as part of the current task. Do not defer.

| What changed | Update where |
|---|---|
| Pipeline / data-flow change | `.ai/ARCHITECTURE.md` |
| New or renamed file / directory | `.ai/STRUCTURE.md` |
| Node / tooling / script change | `.ai/STACK.md` |
| Naming rule, formatting rule, new exception key | `.ai/CONVENTIONS.md` |
| New gotcha / footgun / silent failure | this file |
| Quick-reference item that every agent should see first | `AGENTS.md` |
