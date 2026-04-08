---
name: theme-css-dev
description: Use when working with Handsontable themes, CSS custom properties, SCSS files, or visual styling - covers theme architecture, CSS variable API, and the strict CSS/JS separation rule
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
