# CONVENTIONS.md

## Source files

- **ESM everywhere.** Use `import`/`export`, include the `.mjs` extension in every relative import path (Node ESM requirement); use the `node:` prefix for built-ins.
- **Single quotes** in source — the generator lives under `handsontable/scripts/` and follows the monorepo ESLint config (airbnb-base). Note this is the opposite of the *emitted* output's icon files, which use double quotes by design.
- Every function/exported declaration needs a JSDoc block (`jsdoc/require-jsdoc` runs at `error` on `scripts/**/*.mjs`): a blank line before `/**`, then the `/**` … `*/` block.
- Run `npm run eslint` from `handsontable/` before committing; ESLint is the gate (there is no Prettier step here).
- **No side effects at module top level** except in `index.mjs` (which calls `main()`).

## Naming

- **Hyphen-case** throughout the *token domain* — that is what Figma exports and what `tokensKeys.mjs`, CSS generation, and raw tokens.json paths all use.
- **camelCase** in *generated JS output* only — applied by `toCamelCase` / `convertKeysToCamelCase` in `utils/jsGeneration.mjs`.
- Hyphen-before-digit → underscore (`colors-100` → `colors_100`). This is unusual — don't "fix" it; `handsontable` expects it.
- **CSS custom properties** are always prefixed `--ht-` (see `PREFIX` in `utils/constants.mjs`). The `tokens.` segment of a dotted reference is stripped from the CSS variable name (`tokens.background-color` → `--ht-background-color`), while `colors.`, `sizing.`, `density.` are kept (`colors.primary-100` → `--ht-colors-primary-100`).

## Token value conventions

- Every value that is a reference to another token looks like `{path.to.value}` in `tokens.json` and becomes a dotted string (`"tokens.background-color"`, `"colors.main-100"`) in `themeVariables`.
- Numeric values are unitless in `tokens.json`. `formatValue` adds the unit based on the key name:
  - Key contains `opacity` → `%`
  - Key contains `transition` → `s`
  - Otherwise → `px`
- Any key that should bypass unit formatting must be added to `EXCEPTION_KEYS` in `utils/constants.mjs`. Today that list contains only `"font-family"`.

## Adding a new token

1. Add the hyphen-case key to `tokensKeys.mjs` in the appropriate section (the file is grouped by feature area — keep groupings intact).
2. If the token needs a non-standard unit (not `px`/`%`/`s`), extend `formatValue` in `utils/themeProcessing.mjs` rather than hard-coding a unit in the token value.
3. If the token's *value* must pass through verbatim (e.g., a string like a font stack), add the key to `EXCEPTION_KEYS`.
4. Run `npm run generate:themes` and diff `src/themes/static` — both the TS (`src/themes/static/variables/tokens/<theme>.ts`) and CSS (`src/themes/static/css/theme/ht-theme-<theme>.css`) should pick up the new key automatically.

## Adding a new theme

1. Add the theme block to Figma and re-export `tokens.json`.
2. If the theme needs its own icon family, add an entry to `ICONS_SET` in `utils/constants.mjs`, keyed by the theme name. `utils/cssGeneration.mjs::generateThemeCss` resolves it as `ICONS_SET[themeName] ?? ICONS_SET.main` — a fallback, not a branch you have to edit — but with no entry the theme silently gets the `main` icon set, so add one whenever the theme's icons should actually differ. `Object.keys(ICONS_SET)` also drives which standalone `ht-icons-<name>.css` files get written, so a new entry needs no separate wiring there.
3. Otherwise, the theme flows through automatically — `generateAllVariables` iterates `themes[THEME_KEY]`, so any new entry gets its own `src/themes/static/variables/tokens/<name>.ts` and `src/themes/static/css/theme/ht-theme-<name>.css`.

## Adding or changing an icon

- Edit `icons/main.mjs` or `icons/horizon.mjs` — values are SVG `data:` URIs. The keys become CSS custom property names (`--ht-icon-<kebab-case-name>`) and `.ht-icon-<kebab-case-name>` class selectors inside `utils/helpers/iconStyles.mjs`, and the same keys are what `createIcon`/`syncIcon` (`src/themes/engine/icons.ts`) and `getIconClassName` (`src/themes/engine/utils/icons.ts`) look up at runtime, so renaming an icon requires updating every call site that references the name, not just the icon set.
- An icon name must be added or renamed in ALL FOUR of these places, or a test or the type checker fails: both generated icon sets (`icons/main.mjs` and `icons/horizon.mjs`), the `IconKey` union (`src/themes/types.ts`), `ICON_NAMES` (`src/themes/engine/utils/icons.ts`), and `VALID_ICON_KEYS` (`src/themes/engine/utils/validation.ts`). `iconsUtils.unit.js` asserts `ICON_NAMES` stays in sync with both generated sets; a `satisfies readonly IconKey[]` clause plus a compile-time exhaustiveness check in the same file catches a name missing from `ICON_NAMES` but present in `IconKey`; `validation.unit.js` covers `VALID_ICON_KEYS`. These four lists are what keep the generator, the type system, and the runtime DX warning in sync — updating only one "looks" complete and breaks one of the others silently until its test runs.
- The icons-only CSS (`src/themes/static/css/icons/ht-icons-<name>.css`) is generated by calling `iconStyles(icons, ':root')`, so those stylesheets apply globally rather than scoped to a theme class.

## Output files

- Never hand-edit anything under `src/themes/static`. The `main()` function in `index.mjs` calls `rmSync(OUTPUT_PATH, { recursive: true })` before every regeneration.
- Every generated file begins with `AUTO_GENERATED_HEADER`; icon JS files additionally carry `/* eslint-disable max-len, quotes */` because they're consumed by a project with a stricter ESLint config.
