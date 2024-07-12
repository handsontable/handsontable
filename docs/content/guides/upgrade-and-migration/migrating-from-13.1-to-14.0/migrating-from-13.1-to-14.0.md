---
id: migrating-13.1-to-14.0
title: Migrating from 13.1 to 14.0
metaTitle: Migrating from 13.1 to 14.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 13.1 to Handsontable 14.0, released on November 30th, 2023.
permalink: /migration-from-13.1-to-14.0
canonicalUrl: /migration-from-13.1-to-14.0
pageClass: migration-guide
react:
  id: migrating-13.1-to-14.0-react
  metaTitle: Migrate from 13.1 to 14.0 - React Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

# Migrate from 13.1 to 14.0

Migrate from Handsontable 13.1 to Handsontable 14.0, released on November 30th, 2023.

[[toc]]

### Changes to IME
With the release of Handsontable 14.0, we change the way we manage the browser focus. Now the focus will be assigned to the cell/header elements, not an underlying `TEXTAREA` element, as it used to be in versions <=13.1.0. The change was introduced to allow screen readers to recognize the table contents correctly.
However, this makes the IME editor not compatible with our "fast edit" functionality (the ability to start editing a cell without opening the editor first).

To maintain the IME functionalities, we introduce the [`imeFastEdit`](@/api/options.md#imefastedit) option that swaps the browser focus to the editor's editable element after a small, configurable delay.

To utilize it in your implementation, set the [`imeFastEdit`](@/api/options.md#imefastedit) option to `true` in your settings object.

### Adjust your application to the modified keyboard shortcuts
The new Handsontable version comes with an updated set of keyboard shortcuts. Most of them are new additions, but there have been some changes in the already-existing ones. Make sure to adjust your application to the current specification.

##### <kbd>Ctrl/Cmd</kbd> + <kbd>A</kbd>

| Before  | After  |
| ------------ | ------------ |
| Selects all cells and headers  | Selects all cells _without_ headers  |
| Selection highlight moves to the top-left cell of the selection  | Focused cell does not move  |

##### <kbd>TAB</kbd> in the Filtering menu

| Before  | After  |
| ------------ | ------------ |
| Iterates through the content list  | Iterates through the menu items. When focused on the search input, the arrow keys allow iterating through the content list  |

More information: [Keyboard Shortcuts page in the documentation](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md)

### Check if your template looks fine with the updated colors
To make the table more accessible, this release changes the color of the invalid cells and some of the cell icons. Make sure it looks good with your application template.

| Before  | After  |
| ------------ | ------------ |
| Cell background: `#ff4c42`  | Cell background: `#ffbeba`  |
| Autocomplete-typed cells arrow: `#eeeeee`  | Autocomplete-typed cells arrow: `#bbbbbb`   |
| Invalid autocomplete-typed cells arrow: `#eeeeee`  | Invalid autocomplete-typed cells arrow: `#555555`   |
| Invalid autocomplete-typed cells arrow on hover: `#777777`   | Invalid autocomplete-typed cells arrow on hover: `#1a1a1a`    |