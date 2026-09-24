---
type: how-to
title: Handsontable with Tabler Icons
metaTitle: Handsontable with Tabler Icons - JavaScript Data Grid | Handsontable
description: Replace every built-in Handsontable icon with a Tabler Icons glyph by mapping the icon slots to class lists through the Theme API.
permalink: /recipes/themes/tabler-icons
canonicalUrl: /recipes/themes/tabler-icons
tags:
  - guides
  - tutorial
  - recipes
  - icons
  - icon font
  - Tabler
  - themes
  - Theme API
react:
  metaTitle: Handsontable with Tabler Icons - React Data Grid | Handsontable
angular:
  metaTitle: Handsontable with Tabler Icons - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Themes
menuTag: new
---

This tutorial shows you how to swap all of Handsontable's built-in icons for the [Tabler Icons](https://tabler.io/icons) webfont. You register a theme, map each icon slot to a Tabler class list, and pass the theme to the grid as an object.

::: only-for javascript

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3

@[code](@/content/recipes/themes/tabler-icons/javascript/example1.js)
@[code](@/content/recipes/themes/tabler-icons/javascript/example1.ts)
@[code](@/content/recipes/themes/tabler-icons/javascript/example1.css)

:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3

@[code](@/content/recipes/themes/tabler-icons/react/example1.css)
@[code](@/content/recipes/themes/tabler-icons/react/example1.jsx)
@[code](@/content/recipes/themes/tabler-icons/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --css 3

@[code](@/content/recipes/themes/tabler-icons/angular/example1.ts)
@[code](@/content/recipes/themes/tabler-icons/angular/example1.html)
@[code](@/content/recipes/themes/tabler-icons/angular/example1.css)

:::

:::

## Overview

Every icon in the grid is an `<i class="ht-icon ht-icon-<name>">` element painted from a CSS mask. The theme `icons` parameter lets you replace that mask with something else per icon slot. For an icon font, the value is a class list: Handsontable adds the classes to the element together with `ht-icon--external`, which turns off the built-in mask and sizes the font glyph to the theme's icon size. The font's own stylesheet then draws the glyph.

Tabler Icons ships a webfont whose classes follow the `ti ti-<icon-name>` pattern, so a mapping is one string per slot.

**Difficulty:** Beginner  
**Time:** ~10 minutes  
**Stack:** Handsontable, `@tabler/icons-webfont`

## Prerequisites

- Handsontable 19.0 or later. Earlier versions draw icons as CSS pseudo-elements, which the `icons` parameter cannot replace.
- A build that lets you pass the theme as an object through the `theme` option. See [Requires a theme object](#the-theme-must-be-an-object) below.

## Step 1: Install the Tabler webfont

```shell
npm install @tabler/icons-webfont
```

Import the stylesheet once, before the grid renders:

```typescript
import '@tabler/icons-webfont/dist/tabler-icons.min.css';
```

The live example above adds the same stylesheet from a CDN with a `<link>` element, so it runs without a build step. In your project, prefer the npm import.

## Step 2: Register a theme and map the icon slots

Start from a built-in theme and pass an `icons` object to `params()`. Each key is an icon slot, and each value is the Tabler class list for that slot:

```typescript
import { mainTheme, registerTheme } from 'handsontable/themes';

const tablerTheme = registerTheme(mainTheme);

tablerTheme.params({
  icons: {
    menu: 'ti ti-menu-2',
    selectArrow: 'ti ti-caret-down-filled',
    check: 'ti ti-check',
    // one entry per slot, see the table below
  },
});
```

Slots you leave out keep their built-in glyph, so you can migrate one icon at a time.

## Step 3: Pass the theme as an object

```typescript
new Handsontable(container, {
  theme: tablerTheme,
  // other options
});
```

::: only-for react

With the React wrapper, pass the theme through the `theme` prop of `HotTable`.

:::

::: only-for angular

With the Angular wrapper, set `theme` inside `gridSettings`.

:::

### The theme must be an object

A class-list mapping runs in JavaScript when the grid builds each icon element. That only happens when the grid receives the theme through the `theme` option as a configuration object. Putting a `ht-theme-main` class on the container element, or passing a `themeName` string, applies the theme through the stylesheet alone, and the `icons` mapping does nothing. There is no warning.

## Step 4: Size the hidden-column carets

The grid sizes every `ht-icon--external` element to `--ht-icon-size`, so most Tabler glyphs fit as they are. The hidden-column and hidden-row carets are the exception: their box is a fixed 10px, smaller than the icon size. Give them a matching font size:

```css
.ht-icon.ht-hidden-indicator-start.ht-icon--external,
.ht-icon.ht-hidden-indicator-end.ht-icon--external {
  font-size: 10px;
}
```

The selector carries three classes on purpose. The grid injects its own base stylesheet at runtime, after yours, and its `.ht-icon.ht-icon--external` rule sets the font size with two classes. A rule of equal specificity in your stylesheet loses to it.

Tabler glyphs paint with `currentColor`, so every state color the theme defines (hover, checked, disabled, active header) applies to them unchanged.

## Icon slot reference

| Slot | Where it renders | Tabler class list |
| --- | --- | --- |
| `arrowRight` | Submenu arrow, pagination next | `ti ti-chevron-right` |
| `arrowRightWithBar` | Pagination last page | `ti ti-chevron-right-pipe` |
| `arrowLeft` | Pagination previous, sheets bar | `ti ti-chevron-left` |
| `arrowLeftWithBar` | Pagination first page | `ti ti-chevron-left-pipe` |
| `arrowDown` | Pagination page-size select | `ti ti-chevron-down` |
| `menu` | Column header menu button | `ti ti-menu-2` |
| `selectArrow` | Autocomplete, dropdown, and select arrows, filters condition select, sheets bar tab menu | `ti ti-caret-down-filled` |
| `arrowNarrowUp` | Ascending sort indicator | `ti ti-arrow-narrow-up` |
| `arrowNarrowDown` | Descending sort indicator | `ti ti-arrow-narrow-down` |
| `check` | Menu item check mark | `ti ti-check` |
| `checkbox` | Checkbox cell tick, multi-select list tick | `ti ti-check` |
| `caretHiddenLeft` | Hidden column, on the header before the gap | `ti ti-caret-left-filled` |
| `caretHiddenRight` | Hidden column, on the header after the gap | `ti ti-caret-right-filled` |
| `caretHiddenUp` | Hidden row, on the header above the gap | `ti ti-caret-up-filled` |
| `caretHiddenDown` | Hidden row, on the header below the gap | `ti ti-caret-down-filled` |
| `collapseOff` | Expanded group header, expanded nested row, mixed menu item | `ti ti-minus` |
| `collapseOn` | Collapsed group header, collapsed nested row | `ti ti-plus` |
| `radio` | Filters condition radio dot | `ti ti-point-filled` |
| `chipClose` | Multi-select chip remove, notification close | `ti ti-x` |
| `search` | Multi-select editor search | `ti ti-search` |
| `plus` | Sheets bar add sheet | `ti ti-plus` |
| `menuList` | Sheets bar all sheets | `ti ti-list` |

Pagination arrows, the submenu arrow, and the sheets bar arrows mirror in a right-to-left layout on their own, so the left and right slots take the physical left and right glyphs.

## Limitations

- **Runtime theme changes.** Pagination, the sheets bar, and notifications rebuild their icons when the theme changes. The column header menu button, the filters condition select and radio, and the select editor arrow are built once and reused, so they keep the mapping that was active when the grid was created. Re-create the grid to apply a new mapping to those slots.
- **Class-based theming.** As described in [Step 3](#step-3-pass-the-theme-as-an-object), a class on the container or a `themeName` string ignores the `icons` mapping.
- **Glyph metrics.** Tabler glyphs are drawn on a 24px grid with a 2px stroke. At the default 16px icon size they read slightly lighter than the built-in set. Raise `--ht-icon-size` or pick a heavier Tabler variant if that matters for your design.

## Related

- [Themes: Icons](@/guides/styling/themes/themes.md#icons)
- [Theme customization](@/guides/styling/theme-customization/theme-customization.md)
- [Tabler Icons](https://tabler.io/icons)
