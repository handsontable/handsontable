---
name: handsontable-css-dev
path: handsontable/src/{styles,themes}/**
description: Use when working with Handsontable themes, CSS custom properties, SCSS files, theme tokens, or visual styling - covers theme architecture, CSS variable API, the strict CSS/JS separation rule, and the four-layer process for adding or renaming theme tokens
---

# Theme and CSS Development

## Themes

Three themes, each with a `-no-icons` variant (6 bundles): `ht-theme-main` (default), `ht-theme-classic`, `ht-theme-horizon`, and `ht-theme-main-no-icons`, `ht-theme-classic-no-icons`, `ht-theme-horizon-no-icons`. Test all 3 themes after any styling change.

## Rules

- CSS custom properties are the public API for theming. Renaming or removing one is a breaking change: keep the old variable working.
- Renaming or removing a CSS class is a breaking change: keep the old class in the DOM.
- CSS and JS live in separate files.
- Every CSS feature must work in the `browser-targets.js` browsers (`eslint-plugin-compat` enforces it).

## Cell padding comes from the variables

`StylesHandler#getDefaultRowHeight()` computes `--ht-line-height + 2 * --ht-cell-vertical-padding + border-bottom-width`, and Walkontable sizes a table's scroll range from the summed row heights. A `padding` written onto a `td` leaves the variable at the theme value, so the scroll range comes out wrong. Override `--ht-cell-vertical-padding` / `--ht-cell-horizontal-padding` and derive the `td` padding from them.

A nested grid built inside a hidden container masks this: its styles cache is empty, the derived row height reads `null`, and the engine measures the DOM.

## File structure and commands

| Path | Contents |
|---|---|
| `src/styles/` | Base SCSS |
| `src/themes/` | Theme SCSS |
| `handsontable/styles/` | Compiled CSS (committed) |

`build:styles` compiles SCSS, `build:themes-*` builds theme assets, `npm run stylelint --prefix handsontable` lints CSS/SCSS.

## No `:has()` in stylesheets

The stylelint rule `handsontable/no-has-selector` (error) bans `:has()` in `src/**/*.{css,scss}`: in Chrome it re-runs style invalidation across the host page on every grid DOM mutation, and the grid mutates on every scroll render. Drive the style from a class that JS toggles on the target element (reference pattern: `SelectionManager` `#markActiveHeaderNeighbors` and the `-seam` taggers).

The rule lives in `.config/plugin/stylelint/`, a pnpm `file:` dependency that is copied, not symlinked: run `pnpm install` after editing it.

An exception for state not re-evaluated during a scroll (dialog focus, dropdown selection, offscreen `.htGhostTable`) uses `// stylelint-disable-next-line handsontable/no-has-selector -- <reason>` with the reason why it is off the scroll path.

## Text-bearing spans declare their own text metrics

Every `<span>` (or other inline element) the grid renders with visible text declares `font-size`, `line-height`, `font-weight`, `letter-spacing`, and `font-family` itself. A host rule on the bare element (`span { font-size: 20px }`, specificity (0,0,1)) beats an inherited value (#11306, DEV-75). The older guards cover two properties only: `span.colHeader`/`span.rowHeader` (tokens in `_base.scss`), `.htCheckboxRendererLabel`, `.ht-sheets-bar__tab-label`; their `font-weight`, `letter-spacing`, and `font-family` still leak.

Pattern: the component root (`.ht-pagination`, `td`, `.ht-sheets-bar`) carries the token (`font-size: var(--ht-font-size)`), and every text-bearing span below it declares the five properties as `inherit`. That wins over the host's element selector and follows a user's override on the root, provided the override beats the root's rule on specificity. Source order does not decide it, because the core stylesheet is injected into `<head>` at init and often loads after the user's CSS. Core's cell rule `.handsontable :where(...) > td` is (0,1,1): a user's `.handsontable td` ties and loses on order, `.handsontable tbody td` (0,1,2) wins. The bar's `.handsontable.ht-pagination` is (0,2,0): `div.handsontable.ht-pagination` (0,2,1) wins. State three limits in the PR:

- A user rule on the guarded class at lower specificity than the guard now loses: `.ht-multi-select-chip { font-size: 16px }` (guard (0,2,0)), `.ht-page-navigation-section__label { font-weight: 600 }`, and `.handsontable .ht-page-navigation-section__label` (guard `.handsontable.ht-pagination ...` (0,3,0)).
- A bare `.ht-pagination { font-size }` never beat the bar's own `.handsontable.ht-pagination` rule.
- Offsets computed from the `--ht-line-height` token (multiselect and autocomplete arrow `top`, chip end padding) do not follow a user's `td` `line-height` override.

Scope the declarations to the guarded classes: a blanket `.handsontable span { ... }` (0,1,1) overrides a user's `.my-class` on spans inside custom renderers.

`tests/e2e/host-span-styles.spec.ts` (fixture `tests/fixtures/demo/host-span-styles.html`) hosts a hostile `span {}` rule and asserts the guarded spans against their cascade parent. Its user-override tests prepend their rule to `<head>` (`HostSpanStylesPage.prependUserStyles`). Add every new text-bearing span to that spec. The fixture loads the compiled `handsontable/styles/*.min.css` and a `dist/` bundle that injects the core stylesheet again at init, so after an SCSS edit run the full `npm --prefix handsontable run build` before trusting a spec run; `build:styles` and `build:styles.min` alone leave the bundle's copy stale and a reverted guard still passes.

## Adding a new theme token: four layers

For a `--ht-<component>-<property>` variable and its JS token. A rename or removal follows the same playbook plus a legacy-alias path. Group the new entry next to related ones in each file.

### Layer 1: static CSS defaults (6 files)

`handsontable/src/themes/static/css/theme/ht-theme-{main,classic,horizon}{,-no-icons}.css`

Define `--ht-<kebab-case-name>` and its resolved default per theme, usually via `var(...)` of lower-level tokens so overrides keep cascading. All themes declare the same key set. Symptom when missing: the variable is undefined in DevTools while ThemeBuilder tests that skip rendered styles pass.

### Layer 2: token JS runtime defaults (3 files)

`handsontable/src/themes/static/variables/tokens/{main,classic,horizon}.ts`

These drive `ThemeBuilder`. camelCase keys mirror the CSS variable (`paginationButtonBorderColor` for `--ht-pagination-button-border-color`); values use `'tokens.otherTokenName'` strings or primitive arrays like `['colors.palette.100', 'colors.palette.700']`. Symptom when missing: `createTheme()` ignores the token.

### Layer 3: validation allow-list

`handsontable/src/themes/engine/utils/validation.ts`: add the key to the `VALID_TOKEN_KEYS` Set, in the matching semantic section (e.g. `// Pagination`). Symptom when missing: ThemeBuilder logs `[ThemeBuilder] Unknown token key: "xxx"`, and `src/themes/engine/__tests__/builder.unit.js` fails "should not warn for unknown token keys when using built-in tokens in createTheme" (it iterates every `mainTokens` key to catch layer 2/3 drift).

### Layer 4: TypeScript types

`handsontable/src/themes/types.ts`: add the key to the `TokenKey` union. Edit the source; `tmp/themes/types.d.ts` is generated by `build:types`. Symptom when missing: `npm run test:types --prefix handsontable` (`tsc -p ./test/types`) fails with a `TokenKey` assignability error.

### Layer 5 (soft): docs

`docs/content/guides/styling/theme-customization/theme-customization.md`: add the token to the variables reference table (CSS name + JS name, then description).

### Naming

JS camelCase maps to CSS kebab-case with the `--ht-` prefix by convention (no generator): `dialogContentPaddingHorizontal` is `--ht-dialog-content-padding-horizontal`.

### SCSS consumption

Reference the variable from the component SCSS under `src/styles/components/` (e.g. `_pagination.scss`) as `var(--ht-<name>)`. Use the `var(--ht-<name>, <fallback>)` form only for a legacy compatibility fallback, because a fallback masks missing-variable bugs.

### Pre-flight

1. CSS in all 6 theme files.
2. JS token in all 3 runtime files.
3. Key in the `validation.ts` allow-list.
4. Key in `TokenKey`.
5. `npm run test:unit --prefix handsontable --testPathPattern=themes` passes.
6. `npm run test:types --prefix handsontable` passes.
7. Docs table updated.
