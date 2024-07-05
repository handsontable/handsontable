---
id: gcdt3pns
title: Layout direction
metaTitle: Layout direction - JavaScript Data Grid | Handsontable
description: Set the layout direction for right-to-left languages. Automatically inherit your HTML file's "dir" property, or set the layout direction manually.
permalink: /layout-direction
canonicalUrl: /layout-direction
tags:
  - rtl
  - right-to-left
  - arabic
  - hebrew
  - persian
  - farsi
  - internationalization
  - localization
  - L10n
  - i18n
react:
  id: g4mu790t
  metaTitle: Layout direction - React Data Grid | Handsontable
searchCategory: Guides
category: Internationalization
---

# Layout direction

Set the layout direction for right-to-left languages. Automatically inherit your HTML file's `dir` property, or set the layout direction manually.

[[toc]]

## Overview

To properly display Handsontable's UI and data in LTR languages (such as English, Chinese, or Russian) and RTL languages (such as Arabic, Persian, or Hebrew), configure your grid's layout direction.

By default, Handsontable's layout direction is set automatically, based on on the value of your HTML document's `dir` attribute.

You can:
- [Set the layout direction automatically](#set-the-layout-direction-automatically)
- [Set the layout direction to RTL](#set-the-layout-direction-to-rtl)
- [Set the layout direction to LTR](#set-the-layout-direction-to-ltr)

### RTL support

If your app uses an RTL language, we recommend [setting Handsontable's layout direction to RTL](#set-the-layout-direction-to-rtl).

For Arabic, use Handsontable's built-in [Arabic translation](@/guides/internationalization/language/language.md#list-of-available-languages). For any other RTL language, [add your own translation](@/guides/internationalization/language/language.md#create-custom-languages).

#### RTL demo

To try out Handsontable's RTL support, check out the demo below:

::: only-for javascript

::: example #example1 :hot-lang --js 1 --ts 2

@[code](@/content/guides/internationalization/layout-direction/javascript/example1.js)
@[code](@/content/guides/internationalization/layout-direction/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react-languages  --js 1 --ts 2

@[code](@/content/guides/internationalization/layout-direction/react/example1.jsx)
@[code](@/content/guides/internationalization/layout-direction/react/example1.tsx)

:::

:::

### Elements affected by layout direction

Setting a different layout direction affects the behavior of the following areas of Handsontable:

| Element                                                                                                            | LTR layout direction                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | RTL layout direction                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Starting edge                                                                                                      | The left-hand edge is treated as the starting edge of the grid.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | The right-hand edge is treated as the starting edge of the grid.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Ending edge                                                                                                        | The right-hand edge is treated as the ending edge of the grid.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | The left-hand edge is treated as the ending edge of the grid.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Order of columns on the screen                                                                                     | Cell rendering flows from the left-hand side of the screen to right-hand side.<br><br>Cell (0, 0) is rendered in the grid's top-left corner.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Cell rendering flows from the right-hand side of the screen to left-hand side.<br><br>Cell (0, 0) is rendered in the grid's top-right corner.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Text direction in cells                                                                                            | All cells inherit the LTR direction from the container element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | All cells inherit the RTL direction from the container element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Position of row headers                                                                                            | Row headers are rendered on the left-hand edge of the grid.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Row headers are rendered on the right-hand edge of the grid.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Position of [frozen columns](@/guides/columns/column-freezing/column-freezing.md)                                                  | Columns are frozen at the left-hand edge of the grid.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Columns are frozen at the right-hand edge of the grid.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Position of the [fill handle](@/api/options.md#fillHandle)                                                         | The fill handle displays in the bottom-right corner of the selection border.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | The fill handle displays in the bottom-left corner of the selection border.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Position of the [selection](@/guides/cell-features/selection/selection.md) handles, on mobile devices                        | On mobile devices, the selection handles display in the top-left and bottom-right corners of the selection border.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | On mobile devices, the selection handles display in the top-right and bottom-left corners of the selection border.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| [Custom borders](@/guides/cell-features/formatting-cells/formatting-cells.md#custom-cell-borders)                                   | In the [`customBorders`](@/api/options.md#customborders) option:<br><br>- The left-hand border is treated as the starting border.<br>- The right-hand border is treated as the ending border.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | In the [`customBorders`](@/api/options.md#customborders) option:<br><br>- The right-hand border is treated as the starting border.<br>- The left-hand border is treated as the ending border.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md) and [column menus](@/guides/columns/column-menu/column-menu.md) | Menus' layout direction is left-to-right.<br><br>Submenus expand to the right.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Menus' layout direction is right-to-left.<br><br>Submenus expand to the left.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| [Keyboard navigation](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md)                                        | <kbd>**Tab**</kbd> moves one cell to the right.<br><br><kbd>**Shift**</kbd>+<kbd>**Tab**</kbd> moves one cell to the left.<br><br><kbd>**Home**</kbd> moves to the leftmost non-frozen cell of the current row.<br><br><kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**Home**</kbd> moves to the top-left non-frozen cell of the grid.<br><br><kbd>**Shift**</kbd>+<kbd>**Home**</kbd> extends the selection to the leftmost non-frozen cell of the current row.<br><br><kbd>**End**</kbd> moves to the rightmost non-frozen cell of the current row.<br><br><kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**End**</kbd> moves to the bottom-right non-frozen cell of the grid.<br><br><kbd>**Shift**</kbd>+<kbd>**End**</kbd> extends the selection to the rightmost non-frozen cell of the current row.<br><br><kbd>**Delete**</kbd> deletes one character to the right of the cursor.<br><br><kbd>**Backspace**</kbd> deletes one character to the left of the cursor. | <kbd>**Tab**</kbd> moves one cell to the left.<br><br><kbd>**Shift**</kbd>+<kbd>**Tab**</kbd> moves one cell to the right.<br><br><kbd>**Home**</kbd> moves to the rightmost non-frozen cell of the current row.<br><br><kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**Home**</kbd> moves to the top-right non-frozen cell of the grid.<br><br><kbd>**Shift**</kbd>+<kbd>**Home**</kbd> extends the selection to the rightmost non-frozen cell of the current row.<br><br><kbd>**End**</kbd> moves to the leftmost non-frozen cell of the current row.<br><br><kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**End**</kbd> moves to the bottom-left non-frozen cell of the grid.<br><br><kbd>**Shift**</kbd>+<kbd>**End**</kbd> extends the selection to the leftmost non-frozen cell of the current row.<br><br><kbd>**Delete**</kbd> deletes one character to the left of the cursor.<br><br><kbd>**Backspace**</kbd> deletes one character to the right of the cursor. |

The list above is not exhaustive. Setting a different layout direction might affect other areas of Handsontable as well.

## Set the layout direction

You can set the layout direction only at Handsontable's initialization. Any change of the [`layoutDirection`](@/api/options.md#layoutdirection) option after the initialization (e.g. using the [`updateSettings()`](@/api/core.md#updatesettings) method) is ignored.

### Set the layout direction automatically

You can set Handsontable's layout direction automatically,
based on on the value of your HTML document's `dir` attribute.
This is the default setting.

At Handsontable's initialization,
add [`layoutDirection`](@/api/options.md#layoutdirection) as a top-level grid option,
and set it to `'inherit'`. As this is the default setting, you can also skip setting the `layoutDirection` option altogether.

In the example below, the RTL layout direction is inherited from a `dir` attribute up in the DOM tree:

::: only-for javascript

::: example #example2 --html 1 --js 2 --ts 3

@[code](@/content/guides/internationalization/layout-direction/javascript/example2.html)
@[code](@/content/guides/internationalization/layout-direction/javascript/example2.js)
@[code](@/content/guides/internationalization/layout-direction/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/internationalization/layout-direction/react/example2.jsx)
@[code](@/content/guides/internationalization/layout-direction/react/example2.tsx)

:::

:::

### Set the layout direction to RTL

You can render Handsontable from the right to the left, regardless of your HTML document's `dir` attribute.

At Handsontable's initialization, add [`layoutDirection`](@/api/options.md#layoutdirection) as a top-level grid option,
and set it to `'rtl'`:

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/internationalization/layout-direction/javascript/example3.js)
@[code](@/content/guides/internationalization/layout-direction/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/internationalization/layout-direction/react/example3.jsx)
@[code](@/content/guides/internationalization/layout-direction/react/example3.tsx)

:::

:::

### Set the layout direction to LTR

You can render Handsontable from the left to the right, regardless of your HTML document's `dir` attribute.

At Handsontable's initialization, add [`layoutDirection`](@/api/options.md#layoutdirection) as a top-level grid option,
and set it to `'ltr'`:

::: only-for javascript

::: example #example4 --js 1 --ts 2

@[code](@/content/guides/internationalization/layout-direction/javascript/example4.js)
@[code](@/content/guides/internationalization/layout-direction/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/internationalization/layout-direction/react/example4.jsx)
@[code](@/content/guides/internationalization/layout-direction/react/example4.tsx)

:::

:::

## Set the horizontal text alignment

You can apply different horizontal [text alignment](@/guides/cell-features/text-alignment/text-alignment.md) settings, overwriting the horizontal text alignment resulting from your grid's layout direction.

In the example below, some columns are explicitly aligned to the left, center, or right:

::: only-for javascript

::: example #example5 --js 1 --ts 2

@[code](@/content/guides/internationalization/layout-direction/javascript/example5.js)
@[code](@/content/guides/internationalization/layout-direction/javascript/example5.ts)

:::

:::

::: only-for react

::: example #example5 :react --js 1 --ts 2

@[code](@/content/guides/internationalization/layout-direction/react/example5.jsx)
@[code](@/content/guides/internationalization/layout-direction/react/example5.tsx)

:::

:::

You can apply the horizontal text alignment settings to:
- [The entire grid](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options), by setting [`className`](@/api/options.md#classname) on the global level
- [Individual columns](@/guides/getting-started/configuration-options/configuration-options.md#set-column-options), by setting [`className`](@/api/options.md#classname) on the column level
- [Individual rows](@/guides/getting-started/configuration-options/configuration-options.md#set-row-options), by setting [`className`](@/api/options.md#classname) using the [`cells`](@/api/options.md#cells) option's callback
- [Individual cells](@/guides/getting-started/configuration-options/configuration-options.md#set-cell-options), by setting [`className`](@/api/options.md#classname) on the cell level
- [Individual grid elements, based on any logic you implement](@/guides/getting-started/configuration-options/configuration-options.md#implement-custom-logic), by setting [`className`](@/api/options.md#classname) using the [`cells`](@/api/options.md#cells) option's callback

## Related articles

### Related guides

<div class="boxes-list gray">

- [Language](@/guides/internationalization/language/language.md)
- [Locale](@/guides/internationalization/locale/locale.md)
- [IME support](@/guides/internationalization/ime-support/ime-support.md)

</div>

### Related API reference

- Configuration options:
  - [`language`](@/api/options.md#language)
  - [`layoutDirection`](@/api/options.md#layoutdirection)
  - [`locale`](@/api/options.md#locale)
- Core methods:
  - [`getDirectionFactor()`](@/api/core.md#getdirectionfactor)
  - [`getTranslatedPhrase()`](@/api/core.md#gettranslatedphrase)
  - [`isLtr()`](@/api/core.md#isltr)
  - [`isRtl()`](@/api/core.md#isrtl)
- Hooks:
  - [`afterLanguageChange`](@/api/hooks.md#afterlanguagechange)
  - [`beforeLanguageChange`](@/api/hooks.md#beforelanguagechange)
