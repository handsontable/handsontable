# ARCHITECTURE.md

The tool is a three-stage pipeline over a single in-memory object (`themeVariables`). All stages are pure transforms; filesystem I/O is confined to `index.mjs` and `utils/helpers/fileSystem.mjs`.

```
tokens.json ──► [Stage 1: themeProcessing] ──► themeVariables ──┬──► [Stage 2: jsGeneration]  ──► src/themes/static/variables/**
                                                                └──► [Stage 3: cssGeneration] ──► src/themes/static/css/**
```

## Stage 1 — Reference resolution (`utils/themeProcessing.mjs`)

Entry point: `generateAllVariables(themes)`. Produces a single object:

```js
{
  sizing:  { /* flat sizing scale */ },
  density: { /* density level → token map */ },
  colors:  { [themeName]: { /* color palette */ } },
  tokens:  { [themeName]: { /* theme tokens, filtered by tokensKeys.mjs */ } },
}
```

### Token tree shape (input)

Figma's export uses nested objects where each leaf has a `value` field:

```json
{ "themes": { "main": { "light": { "background-color": { "value": "{colors.main.background-primary}" } } } } }
```

`extractNestedValues` collapses this to the bare value and `findValueRecursively` / `findValueByPath` walk the tree.

### Reference resolution — `processReference(value, themes, refType)`

Token values can be literal (`"16"`, `"#fff"`) or references of the form `{path.to.something}`. `getReferencePath` extracts the path; the prefix determines how it's rewritten:

| Prefix | Behavior |
|---|---|
| `{mode.*}` | Expands into a **`[light, dark]` tuple** by resolving the path twice with `"light"` and `"dark"` substituted at index 1 of the dotted path. Each resolved value is itself a `{colors.*}` reference, transformed via `transformReferencePath(path, [1, 2])`. Tuples are later rendered as CSS `light-dark(...)`. |
| `{colors.*}`, `{themes.*}` | Keeps only the first and last segments (`transformReferencePathFirstLast`). `themes` is rewritten to `tokens` so downstream CSS references resolve against the token CSS variables. |
| `{density.*}`, `{sizing.*}` | Drops index 1 from the path (`transformReferencePath(path, [1])`). |

After rewriting, references look like `tokens.background-secondary-color`, `colors.primary-100`, etc. — these dotted strings are the contract between stage 1 and the two generators.

### Value formatting — `formatValue(key, value)`

Primitive values get units based on the key name:
- Key contains `"opacity"` → append `%`.
- Key contains `"transition"` → append `s`.
- Any other number → append `px`.
- Keys in `EXCEPTION_KEYS` (currently `["font-family"]`) are passed through verbatim.

### Per-theme tokens — `processThemeTokens`

Iterates `tokensKeys.mjs` in order, looks up each key recursively in the theme's value tree, and runs `processTokenValue`. Keys not found in the tree are silently skipped. This is the allow-list that defines the public surface of a theme.

## Stage 2 — JS serialization (`utils/jsGeneration.mjs`)

Entry point: `writeJsThemeFiles(themeVariables)`. Writes:

- `src/themes/static/variables/sizing.ts` and `density.ts` — flat modules shared by all themes.
- `src/themes/static/variables/colors/<name>.ts` and `tokens/<name>.ts` — one file per theme.
- `src/themes/static/variables/icons/<name>.ts` — one per entry in `ICONS_SET`.
- `src/themes/static/variables/helpers/iconsMap.ts` — copied verbatim from `templates/iconsMap.ts` (the typed source; `utils/helpers/iconsMap.mjs` is the runtime mirror used during generation).

### Key transformations

- **`toCamelCase`** — hyphen before letter → camelCase (`foo-bar` → `fooBar`); hyphen before digit → underscore (`colors-100` → `colors_100`). Applied recursively to object keys by `convertKeysToCamelCase`.
- **`convertValueReferenceToCamelCase`** — applied to *string values* that look like references, so `"tokens.background-secondary-color"` becomes `"tokens.backgroundSecondaryColor"`. This keeps reference strings consistent with the camelCased keys they point at.
- **`EXCEPTION_KEYS`** — values under these keys skip the reference-camelCase transform.

### Output styling

`toJsObject` emits unquoted keys and chooses quote style per file:
- Non-icon files: single quotes (`toSingleQuotedString`).
- Icon files: double quotes (`toDoubleQuotedString`), plus an `eslint-disable max-len, quotes` header.

All files begin with `AUTO_GENERATED_HEADER`.

## Stage 3 — CSS serialization (`utils/cssGeneration.mjs`)

Entry point: `writeCssThemeFiles(themeVariables)`. For each theme emits two files (`ht-theme-<name>.css` with icons, `ht-theme-<name>-no-icons.css` without), plus one standalone icon stylesheet per entry in `ICONS_SET`.

### Selector shape

All three variants share one declaration block:

```css
.ht-theme-<name>,
.ht-theme-<name>-dark,
.ht-theme-<name>-dark-auto {
  /* sizing, density, colors, theme tokens */
}
```

Followed by three tiny blocks that only differ in `color-scheme`:

```css
.ht-theme-<name>        { color-scheme: light; }
.ht-theme-<name>-dark   { color-scheme: dark; }
.ht-theme-<name>-dark-auto { color-scheme: light dark; }
```

Light/dark differentiation for *values* happens inside the shared block via CSS `light-dark(...)`, produced by `toCssValue` when it sees a two-element array (the `mode` tuple from stage 1).

### Density selection

Each theme's tokens include a `density` key (e.g., `"default"`, `"compact"`). The CSS generator looks it up and emits the corresponding density level's variables. Falls back to `"default"` if absent.

### Reference → `var(...)` conversion

`isVarReference` detects values prefixed with any of `tokens.`, `colors.`, `sizing.`, `density.`. `toVarReference` converts them to CSS custom property references:
- `tokens.background-secondary-color` → `var(--ht-background-secondary-color)` (the `tokens.` segment is stripped).
- `colors.primary-100` → `var(--ht-colors-primary-100)` (full path preserved, hyphenated).

### Icons

`iconsMap(icons, themePrefix)` generates all Handsontable icon selectors for a given icon set. The theme-prefix argument scopes the selectors to a specific theme class (e.g., `[class*=ht-theme-main]`); the standalone `output/css/icons/*.css` files are emitted without a prefix so they apply globally.

The CSS generator hardcodes `themeName === "horizon"` to pick the horizon icon set; all other themes use `main`. If you add a third icon family you must update this branch.

## Why this shape

- The single `themeVariables` intermediate lets the two generators stay completely independent — CSS and JS outputs can diverge in formatting without forcing changes to reference resolution.
- The dotted-string reference format (`tokens.foo-bar`) is easy to rewrite into either CSS `var(--ht-foo-bar)` or JS `'tokens.fooBar'` with a one-pass visitor.
- `tokensKeys.mjs` as an explicit allow-list means adding Figma tokens doesn't accidentally leak them into the public theme API.
