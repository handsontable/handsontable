# STRUCTURE.md

## Layout

The generator lives at `handsontable/scripts/themes/figma/` and writes into `handsontable/src/themes/static/`.

```
handsontable/scripts/themes/figma/
├── index.mjs                    # Entry point (npm run generate:themes)
├── tokens.json                  # Input — exported from Figma (gitignored, user-provided)
├── tokensKeys.mjs               # Allow-list + ordering of token keys to emit per theme
├── README.md
├── .ai/                         # This reference set
├── __tests__/                   # node:test specs (jsGeneration, iconsMap)
├── templates/
│   └── iconsMap.ts              # Typed icon-CSS helper, copied verbatim into the output
├── icons/
│   ├── main.mjs                 # Icon name → SVG data URI for the "main" theme family
│   └── horizon.mjs              # Icon name → SVG data URI for the "horizon" theme
└── utils/
    ├── constants.mjs            # Shared keys, resolved paths, variants, ICONS_SET wiring
    ├── themeProcessing.mjs      # Stage 1 — resolve Figma refs → in-memory `themeVariables`
    ├── jsGeneration.mjs         # Stage 2 — serialize `themeVariables` to typed .ts modules
    ├── cssGeneration.mjs        # Stage 3 — serialize `themeVariables` to CSS custom props
    └── helpers/
        ├── fileSystem.mjs       # fs wrappers + `loadTokens()` (exits on missing file)
        ├── tokenReference.mjs   # `{path.to.ref}` parsing and transformation utilities
        └── iconsMap.mjs         # Runtime icon-CSS generator (used by cssGeneration at run time)

handsontable/src/themes/static/  # OUTPUT — wiped and regenerated on every run
├── css/
│   ├── theme/ht-theme-<name>.css
│   ├── theme/ht-theme-<name>-no-icons.css
│   └── icons/ht-icons-<name>.css
└── variables/
    ├── sizing.ts                # const sizing: ThemeSizingConfig
    ├── density.ts               # const densitySizes: ThemeDensitySizes
    ├── colors/<name>.ts         # const <name>Colors: ThemeColorsConfig
    ├── tokens/<name>.ts         # const <name>Tokens: ThemeTokensConfig
    ├── icons/<name>.ts          # const <name>Icons: ThemeIconsConfig
    └── helpers/iconsMap.ts      # copied verbatim from templates/iconsMap.ts
```

## Key files

### `index.mjs`
Orchestrator. Calls `loadTokens()` → `generateAllVariables()` → wipes `OUTPUT_PATH` (`src/themes/static`) → `writeJsThemeFiles()` → `writeCssThemeFiles()`. Wraps the write phase in a try/catch that logs and exits non-zero on error.

### `utils/constants.mjs`
Resolves `OUTPUT_PATH` (→ `src/themes/static`) and `TOKENS_PATH` (→ `scripts/themes/figma/tokens.json`) relative to the module via `import.meta.url`, so the tool is cwd-independent. Also defines the token-tree keys (`THEME_KEY`, `MODE_KEY`, `TOKENS_KEY`, `COLORS_KEY`, `DENSITY_KEY`, `SIZING_KEY`), `VARIANTS`, `OTHER_VARIABLES`, `EXCEPTION_KEYS`, and `ICONS_SET`.

### `utils/jsGeneration.mjs`
Stage 2. `buildTsModule({ category, themeName, objectLiteral })` wraps a serialized object literal in a typed module: the `auto-generated` header, a `import type { … } from '…'` line, a named `const`, and `export default <name>`. `tsConstName` derives the const name (`sizing`, `densitySizes`, `<theme>Tokens`, `<theme>Colors`, `<theme>Icons`). `TS_TYPE_MAP` holds the type name and relative import depth per category.

### `templates/iconsMap.ts` and `utils/helpers/iconsMap.mjs`
Two copies of the same icon-CSS helper. The `.ts` template is the artifact emitted into `static/variables/helpers/iconsMap.ts`. The `.mjs` is the runtime version `cssGeneration.mjs` imports to inline icon CSS while generating. A `node:test` (`__tests__/iconsMap.test.mjs`) asserts they produce identical CSS so they cannot drift.

### `tokensKeys.mjs`
An explicit, ordered array of token keys. Only tokens listed here are emitted per theme. Adding a new design token almost always means adding a key here.

### `icons/*.mjs`
Hand-maintained icon sets — object literals mapping icon names (e.g., `arrowRight`, `check`, `caretHiddenLeft`) to SVG `data:` URIs.

## Input / output contract

- **Input:** `tokens.json` next to the generator (gitignored). Produced by Figma's "Design Tokens" plugin export. `loadTokens()` calls `process.exit(1)` with a friendly message if the file is missing.
- **Output:** `src/themes/static/` — wiped and regenerated on every run, then committed. Do not hand-edit; the next run overwrites it.
