---
type: how-to
title: Column menu
metaTitle: Column menu - JavaScript Data Grid | Handsontable
description: Display a configurable dropdown menu, triggered by clicking on a button in a column header.
permalink: /column-menu
canonicalUrl: /column-menu
tags:
  - dropdown menu
react:
  metaTitle: Column menu - React Data Grid | Handsontable
angular:
  metaTitle: Column menu - Angular Data Grid | Handsontable
vue:
  metaTitle: Column menu - Vue Data Grid | Handsontable
searchCategory: Guides
category: Accessories and menus
menuTag: updated
---
Display a configurable dropdown menu, triggered by clicking on a button in a column header.

[[toc]]

## Overview

The [`DropdownMenu`](@/api/dropdownMenu.md) plugin enables you to add a configurable dropdown menu to the table's column headers.
The dropdown menu acts like the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md) but is triggered by clicking the button in the header.

## Quick setup

To enable the plugin, set the [`dropdownMenu`](@/api/options.md#dropdownmenu) configuration option to `true` when initializing Handsontable.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/column-menu/javascript/example1.js)
@[code](@/content/guides/accessories-and-menus/column-menu/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/column-menu/react/example1.jsx)
@[code](@/content/guides/accessories-and-menus/column-menu/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/column-menu/angular/example1.ts)
@[code](@/content/guides/accessories-and-menus/column-menu/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/accessories-and-menus/column-menu/vue/example1.vue)

:::

:::

## Plugin configuration

To use the default dropdown contents, set it to `true`, or to customize it by setting it to use a custom list of actions. For the available entry options reference, see the [Context Menu demo](@/guides/accessories-and-menus/context-menu/context-menu.md#page-specific).

Some entries come from other plugins, and work only when their plugin is enabled. The `freeze_column` and `unfreeze_column` entries require the [`ManualColumnFreeze`](@/api/manualColumnFreeze.md) plugin. When you enable it, both entries join the default dropdown contents. Each one shows only when it applies: `freeze_column` on a column that is not frozen, and `unfreeze_column` on a column that is.

The menu builds its item list every time it opens, so entries follow the current configuration. To leave a plugin's entries out, list the items you want instead of setting the option to `true`. To change the list on each open, use the [`beforeDropdownMenuSetItems`](@/api/hooks.md#beforedropdownmenusetitems) hook.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/column-menu/javascript/example2.js)
@[code](@/content/guides/accessories-and-menus/column-menu/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/column-menu/react/example2.jsx)
@[code](@/content/guides/accessories-and-menus/column-menu/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/column-menu/angular/example2.ts)
@[code](@/content/guides/accessories-and-menus/column-menu/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/accessories-and-menus/column-menu/vue/example2.vue)

:::

:::

## Filter menu items

When the [`Filters`](@/api/filters.md) plugin is enabled, it adds the following items to the
dropdown menu. These items build the filtering interface and work only in the dropdown menu, not in
the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md).

| Key                                            | Action                                                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [`filter_by_condition`](@/api/filters.md)      | Add the first filter condition.                                                              |
| [`filter_by_condition2`](@/api/filters.md)     | Add the second filter condition. Required for the second condition's select element.         |
| [`filter_operators`](@/api/filters.md)         | Select the operator (**And** or **Or**) that joins the two conditions.                       |
| [`filter_by_value`](@/api/filters.md)          | Select the values to keep.                                                                   |
| [`filter_action_bar`](@/api/filters.md)        | Apply or cancel the filter with the **OK** and **Cancel** buttons.                           |

For a complete filtering guide, see [Column filter](@/guides/columns/column-filter/column-filter.md).
For filter-menu keyboard and pointer behavior, see [Navigate the filter menu](@/guides/columns/column-filter/column-filter.md#navigate-the-filter-menu).

## Navigate the column menu

Use keyboard shortcuts to navigate the column menu after you open it:

- Press **Arrow up** and **Arrow down** to move between menu items.
- Press **Arrow right** to open a submenu in left-to-right layouts. Press **Arrow left** to close it and return to the parent menu.
- Press **Arrow left** to open a submenu in right-to-left layouts. Press **Arrow right** to close it and return to the parent menu.
- Press **Home**, **Ctrl**+**Arrow up** on Windows, or **Cmd**+**Arrow up** on macOS to move to the first available item.
- Press **End**, **Ctrl**+**Arrow down** on Windows, or **Cmd**+**Arrow down** on macOS to move to the last available item.
- Press **Page Up** and **Page Down** to move by one visible menu page.
- Press **Enter** or **Space** to run the selected menu item or open its submenu.
- Press **Escape** to close the column menu or active submenu.

Filter controls inside the column menu use additional navigation rules. For filter-menu keyboard and pointer behavior, see [Navigate the filter menu](@/guides/columns/column-filter/column-filter.md#navigate-the-filter-menu).

## Related keyboard shortcuts

The <kbd>**Shift**</kbd>+<kbd>**Alt**</kbd>+<kbd>**↓**</kbd> shortcut works from a data cell. The <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd>+<kbd>**Enter**</kbd> shortcut works only when a column header is focused. Enable [`navigableHeaders: true`](@/api/options.md#navigableheaders) to move focus onto headers with the arrow keys. For more details, see [Keyboard navigation](@/guides/accessibility/accessibility/accessibility.md#keyboard-navigation).

| Windows                                                  | macOS                                                       | Action                                                                                                       |  Excel  | Sheets  |
| -------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | :-----: | :-----: |
| <kbd>**Shift**</kbd>+<kbd>**Alt**</kbd>+<kbd>**↓**</kbd> | <kbd>⇧</kbd>+<kbd>⌥</kbd>+<kbd>**↓**</kbd> | Open the column menu. Works in any cell, if the respective column header displays the menu button.           | &cross; | &cross; |
| <kbd>**Ctrl**</kbd>+<kbd>**Enter**</kbd>                 | <kbd>⌘</kbd>+<kbd>**Enter**</kbd>                           | Open the column menu. Works only when a column header with the column menu button is focused.                | &cross; | &cross; |

## Related articles

**Related guides**

<div class="boxes-list">

- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)

</div>

**Configuration options**

<div class="boxes-list">

- [dropdownMenu](@/api/options.md#dropdownmenu)

</div>

**Hooks**

<div class="boxes-list">

- [afterDropdownMenuDefaultOptions](@/api/hooks.md#afterdropdownmenudefaultoptions)
- [afterDropdownMenuHide](@/api/hooks.md#afterdropdownmenuhide)
- [afterDropdownMenuShow](@/api/hooks.md#afterdropdownmenushow)
- [beforeDropdownMenuSetItems](@/api/hooks.md#beforedropdownmenusetitems)
- [beforeDropdownMenuShow](@/api/hooks.md#beforedropdownmenushow)

</div>

**Plugins**

<div class="boxes-list">

- [DropdownMenu](@/api/dropdownMenu.md)

</div>
