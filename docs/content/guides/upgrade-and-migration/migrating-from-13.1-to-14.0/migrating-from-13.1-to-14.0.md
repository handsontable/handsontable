---
type: how-to
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
angular:
  id: rxlauyd8-13.1-to-14.0-react
  metaTitle: Migrate from 13.1 to 14.0 - Angular Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---
Migrate from Handsontable 13.1 to Handsontable 14.0, released on November 30th, 2023.

More information about this release can be found in the [`14.0.0` release blog post](https://handsontable.com/blog/whats-new-in-handsontable-14-improvements-to-accessibility).<br/>
For a detailed list of changes in this release, see the [Changelog](@/guides/upgrade-and-migration/changelog/changelog.md#_14-0-0).

[[toc]]

### Changes to IME
Handsontable 14.0 changes how it manages browser focus. The focus now goes to the cell/header elements, not an underlying `TEXTAREA` element as in versions <=13.1.0. This change allows screen readers to recognize the table contents correctly.
However, this makes the IME editor not compatible with our "fast edit" functionality (the ability to start editing a cell without opening the editor first).

To maintain the IME functionalities, Handsontable 14.0 introduces the [`imeFastEdit`](@/api/options.md#imefastedit) option that swaps the browser focus to the editor's editable element after a small, configurable delay.

To utilize it in your implementation, set the [`imeFastEdit`](@/api/options.md#imefastedit) option to `true` in your settings object.

### Adjust your application to the modified keyboard shortcuts
The new Handsontable version comes with an updated set of keyboard shortcuts. Most of them are new additions, but some existing shortcuts also change. Make sure to adjust your application to the current specification.

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
### Update `ContextMenu.open()` and `DropdownMenu.open()` calls

Handsontable 14.0 refactors the internal positioning logic for context menus and dropdown menus. The `open()` method now uses `instanceof Event` to distinguish between a native browser event and a literal position object.

If you pass a native `Event` (e.g., a `MouseEvent` from a `contextmenu` listener), the menu reads `pageX` and `pageY` from it automatically. This works the same as before.

If you pass a plain object, it **must** use `{ top, left }` properties -- not `{ pageX, pageY }`. In versions prior to 14.0, passing `{ pageX, pageY }` as a plain object worked because the internal code translated those properties. Starting with 14.0, a plain object with `pageX`/`pageY` falls through to the literal positioning path, which reads `top`/`left` and results in `NaN` coordinates.

| Before (13.x and earlier) | After (14.0+) |
| --- | --- |
| `menu.open({ pageX: 200, pageY: 300 })` | `menu.open({ left: 200, top: 300 })` |
| `menu.open(event)` (native `Event`) | `menu.open(event)` (unchanged) |

## Result

Your application now runs on Handsontable 14.0.
