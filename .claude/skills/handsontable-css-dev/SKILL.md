---
name: handsontable-css-dev
description: Use when working with Handsontable themes, CSS custom properties, SCSS files, theme tokens, or visual styling - covers theme architecture, CSS variable API, the strict CSS/JS separation rule, and the four-layer process for adding or renaming theme tokens
---

# Theme and CSS Development

## Themes

Handsontable ships three themes, each with a standard and a `-no-icons` variant (6 bundles total):

| Theme class | Description |
|---|---|
| `ht-theme-main` | Default modern theme |
| `ht-theme-classic` | Legacy/classic look |
| `ht-theme-horizon` | Horizon design |

No-icons variants: `ht-theme-main-no-icons`, `ht-theme-classic-no-icons`, `ht-theme-horizon-no-icons`.

## CSS Custom Properties Are Public API

Theme customization is done entirely through CSS variables. These variables are the **public API** for theming. Renaming or removing a CSS custom property is a **breaking change** and requires a legacy compatibility path (keep the old variable working).

## Strict CSS/JS Separation

Never mix CSS into JavaScript files. CSS and JS are always in separate files. This is enforced by convention and code review.

## File Structure

| Path | Contents |
|---|---|
| `src/styles/` | SCSS source files (base styles) |
| `src/themes/` | Theme-specific SCSS files |
| `handsontable/styles/` | Compiled CSS output (committed to repo) |
| `browser-targets.js` | Supported browser list |

## Build Commands

- `build:styles` - Compile SCSS to CSS.
- `build:themes-*` - Build theme-specific assets.
- Stylelint validates all CSS/SCSS (`npm run stylelint --prefix handsontable`).

## Browser Compatibility

All CSS features must work in browsers listed in `browser-targets.js` (latest 2 major versions of Chrome, Firefox, Safari, Edge). The `eslint-plugin-compat` rule enforces this.

## Breaking Change Rules

- **Renaming/removing a CSS custom property** = breaking change. Keep the old variable working.
- **Renaming/removing a CSS class** = breaking change. Keep the old class in the DOM.
- **Always test all 3 themes** after any visual or styling change.

## Adding a New Theme Token -- The Four-Layer Process

Handsontable's theme system maintains defense-in-depth across CSS and JS consumers, plus TypeScript support. A new token needs to land in **four layers** -- updating fewer looks complete but breaks either the runtime DX or the type contract.

Use this flow whenever you add a `--ht-<component>-<property>` CSS variable or its matching JS token. Renaming or removing a token follows the same playbook plus a legacy-alias path (see Breaking Change Rules above).

### Layer 1 - Static CSS defaults (6 files)

```
handsontable/src/themes/static/css/theme/ht-theme-main.css
handsontable/src/themes/static/css/theme/ht-theme-main-no-icons.css
handsontable/src/themes/static/css/theme/ht-theme-classic.css
handsontable/src/themes/static/css/theme/ht-theme-classic-no-icons.css
handsontable/src/themes/static/css/theme/ht-theme-horizon.css
handsontable/src/themes/static/css/theme/ht-theme-horizon-no-icons.css
```

Each file defines the CSS custom property (`--ht-<kebab-case-name>`) and its resolved default for that theme. Values commonly reference existing lower-level tokens via `var(...)` rather than hardcoded colors, so downstream theme overrides keep cascading.

Group the new variable next to related ones (e.g. `pagination-button-*` next to `pagination-bar-*`) so the file stays scannable. All three themes should declare the same key set; only the resolved values differ.

**Symptom when missing**: the CSS variable is undefined in DevTools but the JS ThemeBuilder "works" in tests that don't assert rendered styles.

### Layer 2 - Token JS runtime defaults (3 files)

```
handsontable/src/themes/static/variables/tokens/main.js
handsontable/src/themes/static/variables/tokens/classic.js
handsontable/src/themes/static/variables/tokens/horizon.js
```

These objects drive the `ThemeBuilder` class at runtime (the JS API for programmatic theming). Use camelCase keys that mirror the CSS variable -- `paginationButtonBorderColor` maps to `--ht-pagination-button-border-color`. Values reference other tokens with the `'tokens.otherTokenName'` string syntax or primitive arrays like `['colors.palette.100', 'colors.palette.700']`.

**Symptom when missing**: `ThemeBuilder` doesn't recognize the token at runtime; users passing it to `createTheme()` get no-op behavior.

### Layer 3 - Validation allow-list (1 file)

```
handsontable/src/themes/engine/utils/validation.js
```

The `VALID_TOKEN_KEYS` Set (around lines 319-363) is the **runtime DX guardrail**. If a user passes a token key not in this set, the ThemeBuilder logs `[ThemeBuilder] Unknown token key: "xxx"` to help them catch typos. Legitimate new tokens must be registered here or users get spurious warnings when they use your new API.

Add the key in the same semantic section as your CSS and tokens changes (e.g., under the `// Pagination` comment).

**Symptom when missing**: unit test `src/themes/engine/__tests__/builder.unit.js` fails the "should not warn for unknown token keys when using built-in tokens in createTheme" case. The test iterates every real token in `mainTokens` and asserts none trigger the warning -- it exists specifically to catch drift between layer 2 and layer 3.

### Layer 4 - TypeScript type definitions (1 file)

```
handsontable/types/themes.d.ts
```

The `TokenKey` union (around lines 300-374) is the **compile-time DX for TypeScript users**. Missing entry → TS consumers calling the JS API with your new token get a type error.

Add the key in the same semantic section as the other layers. The `test:types` script (`npm run test:types --prefix handsontable`, which runs `tsc -p ./test/types`) enforces this.

**Symptom when missing**: `npm run test:types` fails with a `TokenKey` assignability error.

### Layer 5 (soft) - Public docs

```
docs/content/guides/styling/theme-customization/theme-customization.md
```

Not load-bearing for the runtime, but anything registered in the allow-list and type union is part of the public API contract -- it belongs in the variables reference table on this page. Match the existing two-column pattern (CSS name + JS name, then description).

### Naming Convention

JS camelCase ↔ CSS kebab-case, prefixed with `--ht-`. The mapping is by convention -- there is no generator, so consistency is on the author:

| JS token name | CSS variable |
|---|---|
| `paginationButtonBorderColor` | `--ht-pagination-button-border-color` |
| `secondaryButtonHoverBackgroundColor` | `--ht-secondary-button-hover-background-color` |
| `dialogContentPaddingHorizontal` | `--ht-dialog-content-padding-horizontal` |

### Consumption in SCSS

Reference the new variable from the component's SCSS file under `src/styles/components/` (for example, `_pagination.scss`). Default to `var(--ht-<name>)` -- only use the `var(--ht-<name>, <fallback>)` form when a legacy compatibility fallback is genuinely needed, since a fallback can mask missing-variable bugs.

### Pre-Flight Checklist

Before committing token work, mentally walk the four layers plus tests:

1. CSS in all 6 theme files?
2. JS token in all 3 runtime files?
3. Registered in `validation.js` allow-list?
4. Added to `TokenKey` in `themes.d.ts`?
5. `npm run test:unit --prefix handsontable -- --testPathPattern=themes` passes?
6. `npm run test:types --prefix handsontable` passes?
7. Docs table updated?
