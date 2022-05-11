---
title: Keyboard shortcuts
metaTitle: Keyboard shortcuts - Guide - Handsontable Documentation
permalink: /next/keyboard-shortcuts
canonicalUrl: /keyboard-shortcuts
tags:
- key bindings
- keymap
- key mapping
- shortcut manager
- keyboard navigation
- hotkey
- accessibility
- function key
- commands

---

# Keyboard shortcuts

Use and manage Handsontable's keyboard shortcuts.

[[toc]]

## Overview

You can navigate Handsontable similarly to Google Sheets or Microsoft Excel, using the [default](#default-keyboard-shortcuts) keyboard shortcuts.

You can also completely [customize](#custom-keyboard-shortcuts) your keyboard shortcuts, using the [`ShortcutManager`](@/api/shortcutManager.md) API:
- [Add custom keyboard shortcuts](#adding-a-custom-keyboard-shortcut)
- [Remove keyboard shortcuts](#removing-a-keyboard-shortcut)
- [Replace keyboard shortcuts](#replacing-a-keyboard-shortcut)
- [Block keyboard shortcuts' actions](#blocking-a-keyboard-shortcut-s-actions)

## Default keyboard shortcuts

By default, Handsontable features the keyboard shortcuts listed below.

- [Navigation keyboard shortcuts](#navigation-keyboard-shortcuts)
- [Selection keyboard shortcuts](#selection-keyboard-shortcuts)
- [Edition keyboard shortcuts](#edition-keyboard-shortcuts)
- [Plugin keyboard shortcuts](#plugin-keyboard-shortcuts)

You can easily check if a keyboard shortcut's action is compatible with Microsoft Excel or Google Sheets:
- Compatible: &check;
- Not compatible: &cross;

::: tip
Handsontable doesn't detect data series (doesn't differentiate between blank cells and non-blank cells).
For this reason, some keyboard shortcuts (e.g., <kbd>**Cmd**</kbd> + Arrow keys) may behave differently
than in Microsoft Excel or Google Sheets in certain situations.
:::

### Navigation keyboard shortcuts

These keyboard shortcuts work when you navigate the grid. They come from Handsontable's [`Core`](@/api/core.md), so they work out of the box, with no need for additional plugins.

| Windows                                     | macOS                                       | Action                                                                                         |  Excel  | Sheets  |
| ------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------- | :-----: | :-----: |
| Arrow keys                                  | Arrow keys                                  | Move one cell up, down, left, or right                                                         | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**↑**</kbd>      | <kbd>**Cmd**</kbd> + <kbd>**↑**</kbd>       | Move to the first cell of the current column                                                   | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**↓**</kbd>      | <kbd>**Cmd**</kbd> + <kbd>**↓**</kbd>       | Move to the last cell of the current column                                                    | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**←**</kbd>      | <kbd>**Cmd**</kbd> + <kbd>**←**</kbd>       | Move to the leftmost cell of the current row                                                   | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**→**</kbd>      | <kbd>**Cmd**</kbd> + <kbd>**→**</kbd>       | Move to the rightmost cell of the current row                                                  | &check; | &check; |
| <kbd>**Enter**</kbd>                        | <kbd>**Enter**</kbd>                        | Enter the editing mode of the active cell                                                      | &cross; | &check; |
| <kbd>**Shift**</kbd> + <kbd>**Enter**</kbd> | <kbd>**Shift**</kbd> + <kbd>**Enter**</kbd> | Enter the editing mode of the active cell                                                      | &cross; | &check; |
| <kbd>**F2**</kbd>                           | <kbd>**F2**</kbd>                           | Enter the editing mode of the active cell                                                      | &check; | &check; |
| Alphanumeric keys                           | Alphanumeric keys                           | Enter the editing mode of the active cell, and enter the pressed key's value into the cell     | &check; | &check; |
| <kbd>**Tab**</kbd>                          | <kbd>**Tab**</kbd>                          | Move to the next cell<sup>*</sup> (if there's only one column available, move one cell down)   | &check; | &check; |
| <kbd>**Shift**</kbd> + <kbd>**Tab**</kbd>   | <kbd>**Shift**</kbd> + <kbd>**Tab**</kbd>   | Move to the previous cell<sup>*</sup> (if there's only one column available, move one cell up) | &check; | &check; |
| <kbd>**Home**</kbd>                         | <kbd>**Home**</kbd>                         | Move to the first non-frozen cell of the current row<sup>*</sup>                               | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**Home**</kbd>   | <kbd>**Cmd**</kbd> + <kbd>**Home**</kbd>    | Move to the first non-frozen cell of the grid<sup>*</sup>                                      | &cross; | &check; |
| <kbd>**End**</kbd>                          | <kbd>**End**</kbd>                          | Move to the last non-frozen cell of the current row<sup>*</sup>                                | &cross; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**End**</kbd>    | <kbd>**Cmd**</kbd> + <kbd>**End**</kbd>     | Move to the last non-frozen cell of the grid<sup>*</sup>                                       | &cross; | &check; |
| <kbd>**Page Up**</kbd>                      | <kbd>**Page Up**</kbd>                      | Move one screen up                                                                             | &check; | &check; |
| <kbd>**Page Down**</kbd>                    | <kbd>**Page Down**</kbd>                    | Move one screen down                                                                           | &check; | &check; |

<sup>*</sup> This action depends on your layout direction.

### Selection keyboard shortcuts

These keyboard shortcuts help you select cells. They come from Handsontable's [`Core`](@/api/core.md), so they work out of the box, with no need for additional plugins.

| Windows                                                       | macOS                                                        | Action                                                                           |  Excel  | Sheets  |
| ------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd> + <kbd>**A**</kbd>                        | <kbd>**Cmd**</kbd> + <kbd>**A**</kbd>                        | Select all cells and headers                                                     | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + <kbd>**↑**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**↑**</kbd> | Extend the selection to the first cell of the current column<sup>**</sup>        | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + <kbd>**↓**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**↓**</kbd> | Extend the selection to the last cell of the current column<sup>**</sup>         | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + <kbd>**←**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**←**</kbd> | Extend the selection to the leftmost cell of the current row<sup>**</sup>        | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + <kbd>**→**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**→**</kbd> | Extend the selection to the rightmost cell of the current row<sup>**</sup>       | &check; | &check; |
| <kbd>**Shift**</kbd> + Arrow keys                             | <kbd>**Shift**</kbd> + Arrow keys                            | Extend the selection by one cell                                                 | &check; | &check; |
| <kbd>**Shift**</kbd> + <kbd>**Home**</kbd>                    | <kbd>**Shift**</kbd> + <kbd>**Home**</kbd>                   | Extend the selection to the first non-frozen cell of the current row<sup>*</sup> | &check; | &cross; |
| <kbd>**Shift**</kbd> + <kbd>**End**</kbd>                     | <kbd>**Shift**</kbd> + <kbd>**End**</kbd>                    | Extend the selection to the last non-frozen cell of the current row<sup>*</sup>  | &cross; | &cross; |
| <kbd>**Shift**</kbd> + <kbd>**Page Up**</kbd>                 | <kbd>**Shift**</kbd> + <kbd>**Page Up**</kbd>                | Extend the selection by one screen up                                            | &check; | &check; |
| <kbd>**Shift**</kbd> + <kbd>**Page Down**</kbd>               | <kbd>**Shift**</kbd> + <kbd>**Page Down**</kbd>              | Extend the selection by one screen down                                          | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**Enter**</kbd>                    | <kbd>**Cmd**</kbd> + <kbd>**Enter**</kbd>                    | Fill the selected range of cells with the value of the active cell               | &cross; | &check; |
| <kbd>**Delete**</kbd>                                         | <kbd>**Delete**</kbd>                                        | Clear the contents of the selected cells                                         | &check; | &check; |
| <kbd>**Backspace**</kbd>                                      | <kbd>**Backspace**</kbd>                                     | Clear the contents of the selected cells                                         | &check; | &check; |

<sup>*</sup> This action depends on your layout direction.<br>
<sup>**</sup> In case of multiple selection layers, only the last selection layer gets extended.

### Edition keyboard shortcuts

These keyboard shortcuts work when you're editing a cell's contents. They come from Handsontable's [`Core`](@/api/core.md), so they work out of the box, with no need for additional plugins.

| Windows                                                 | macOS                                                           | Action                                                            |  Excel  | Sheets  |
| ------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------- | :-----: | :-----: |
| Arrow keys                                              | Arrow keys                                                      | Move the cursor through the text                                  | &check; | &check; |
| Alphanumeric keys                                       | Alphanumeric keys                                               | Enter the pressed key's value into the cell                       | &check; | &check; |
| <kbd>**Enter**</kbd>                                    | <kbd>**Enter**</kbd>                                            | Complete the cell entry and move to the cell below                | &check; | &check; |
| <kbd>**Shift**</kbd> + <kbd>**Enter**</kbd>             | <kbd>**Shift**</kbd> + <kbd>**Enter**</kbd>                     | Complete the cell entry and move to the cell above                | &check; | &check; |
| <kbd>**Tab**</kbd>                                      | <kbd>**Tab**</kbd>                                              | Complete the cell entry and move to the next cell<sup>*</sup>     | &check; | &check; |
| <kbd>**Shift**</kbd> + <kbd>**Tab**</kbd>               | <kbd>**Shift**</kbd> + <kbd>**Tab**</kbd>                       | Complete the cell entry and move to the previous cell<sup>*</sup> | &check; | &check; |
| <kbd>**Delete**</kbd>                                   | <kbd>**Delete**</kbd>                                           | Delete one character after the cursor<sup>*</sup>                 | &check; | &check; |
| <kbd>**Backspace**</kbd>                                | <kbd>**Backspace**</kbd>                                        | Delete one character before the cursor<sup>*</sup>                | &check; | &check; |
| <kbd>**Home**</kbd>                                     | <kbd>**Home**</kbd>                                             | Move the cursor to the beginning of the text<sup>*</sup>          | &check; | &check; |
| <kbd>**End**</kbd>                                      | <kbd>**End**</kbd>                                              | Move the cursor to the end of the text<sup>*</sup>                | &check; | &check; |
| <kbd>**Ctrl**</kbd> + Arrow keys                        | <kbd>**Cmd**</kbd> + Arrow keys                                 | Move the cursor to the beginning or to the end of the text        | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + Arrow keys | <kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + Arrow keys          | Extend the selection to the beginning or to the end of the text   | &check; | &check; |
| <kbd>**Page Up**</kbd>                                  | <kbd>**Page Up**</kbd>                                          | Complete the cell entry and move one screen up                    | &check; | &check; |
| <kbd>**Page Down**</kbd>                                | <kbd>**Page Down**</kbd>                                        | Complete the cell entry and move one screen down                  | &check; | &check; |
| <kbd>**Alt**</kbd> + <kbd>**Enter**</kbd>               | <kbd>**Option**</kbd> + <kbd>**Enter**</kbd>                    | Insert a line break                                               | &cross; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**Enter**</kbd>              | <kbd>**Ctrl**</kbd> / <kbd>**Cmd**</kbd> + <kbd>**Enter**</kbd> | Insert a line break                                               | &cross; | &check; |
| <kbd>**Escape**</kbd>                                   | <kbd>**Escape**</kbd>                                           | Cancel the cell entry and exit the editing mode                   | &check; | &check; |

<sup>*</sup> This action depends on your layout direction.

#### Checkbox editor keyboard shortcuts

These keyboard shortcuts work in the [`checkbox`](@/guides/cell-types/checkbox-cell-type.md) cell editor.

| Windows                  | macOS                    | Action                        |  Excel  | Sheets  |
| ------------------------ | ------------------------ | ----------------------------- | :-----: | :-----: |
| <kbd>**Space**</kbd>     | <kbd>**Space**</kbd>     | Check or uncheck the checkbox | &cross; | &check; |
| <kbd>**Enter**</kbd>     | <kbd>**Enter**</kbd>     | Check or uncheck the checkbox | &cross; | &check; |
| <kbd>**Delete**</kbd>    | <kbd>**Delete**</kbd>    | Uncheck the checkbox          | &cross; | &check; |
| <kbd>**Backspace**</kbd> | <kbd>**Backspace**</kbd> | Uncheck the checkbox          | &cross; | &check; |

#### `handsontable` editor keyboard shortcuts

These keyboard shortcuts work in the [`handsontable`](@/guides/cell-types/handsontable-cell-type.md) cell editor.

| Windows          | macOS            | Action                                 |  Excel  | Sheets  |
| ---------------- | ---------------- | -------------------------------------- | :-----: | :-----: |
| <kbd>**↑**</kbd> | <kbd>**↑**</kbd> | Move to the cell above the active cell | &cross; | &cross; |
| <kbd>**↓**</kbd> | <kbd>**↓**</kbd> | Move to the cell below the active cell | &cross; | &cross; |

### Plugin keyboard shortcuts

These keyboard shortcuts work with particular plugins.

#### Clipboard keyboard shortcuts

These keyboard shortcuts work when the [`CopyPaste`](@/api/copyPaste.md) plugin is enabled.

| Windows                                | macOS                                 | Action                                                          |  Excel  | Sheets  |
| -------------------------------------- | ------------------------------------- | --------------------------------------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd> + <kbd>**X**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**X**</kbd> | Cut the contents of the selected cells to the system clipboard  | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**C**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**C**</kbd> | Copy the contents of the selected cells to the system clipboard | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**V**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**V**</kbd> | Paste from the system clipboard                                 | &check; | &check; |

#### Cell merging keyboard shortcuts

These keyboard shortcuts work when the [`MergeCells`](@/api/mergeCells.md) plugin is enabled.

| Windows                                | macOS                                  | Action                              |  Excel  | Sheets  |
| -------------------------------------- | -------------------------------------- | ----------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd> + <kbd>**M**</kbd> | <kbd>**Ctrl**</kbd> + <kbd>**M**</kbd> | Merge or unmerge the selected cells | &cross; | &cross; |

#### Undo and redo keyboard shortcuts

These keyboard shortcuts work when the [`UndoRedo`](@/api/undoRedo.md) plugin is enabled.

| Windows                                                       | macOS                                                        | Action               |  Excel  | Sheets  |
| ------------------------------------------------------------- | ------------------------------------------------------------ | -------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd> + <kbd>**Z**</kbd>                        | <kbd>**Cmd**</kbd> + <kbd>**Z**</kbd>                        | Undo the last action | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**Y**</kbd>                        | <kbd>**Cmd**</kbd> + <kbd>**Y**</kbd>                        | Redo the last action | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + <kbd>**Z**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**Z**</kbd> | Redo the last action | &check; | &check; |

#### Context menu keyboard shortcuts

These keyboard shortcuts work in context menus. To activate them, enable the [`ContextMenu`](@/api/contextMenu.md) plugin.

| Windows                  | macOS                    | Action                                                        |  Excel  | Sheets  |
| ------------------------ | ------------------------ | ------------------------------------------------------------- | :-----: | :-----: |
| Arrow keys               | Arrow keys               | Move one available menu item up, down, left, or right         | &check; | &check; |
| <kbd>**Page Up**</kbd>   | <kbd>**Page Up**</kbd>   | Move to the first visible item of the context menu or submenu | &check; | &cross; |
| <kbd>**Page Down**</kbd> | <kbd>**Page Down**</kbd> | Move to the last visible item of the context menu or submenu  | &check; | &cross; |
| <kbd>**Escape**</kbd>    | <kbd>**Escape**</kbd>    | Close the context menu or submenu                             | &check; | &check; |
| <kbd>**Enter**</kbd>     | <kbd>**Enter**</kbd>     | Run the action of the selected menu item                      | &check; | &cross; |

## Custom keyboard shortcuts

You can customize your keyboard shortcuts, using the [`ShortcutManager`](@/api/shortcutManager.md) API.

1. Access the [`ShortcutManager`](@/api/shortcutManager.md) API:
    ```js
    hot.getShortcutManager()
    ```
2. Select a keyboard shortcut [context](#keyboard-shortcut-contexts), for example:
    ```js
    const gridContext = hot.getShortcutManager().getContext('grid');
    ```
3. Use the selected context's [methods](@/api/shortcutContext.md). 
    For example, to use the [`addShortcut()`](@/api/shortcutContext.md#addshortcut) method in the `grid` context:
    ```js
    const gridContext = hot.getShortcutManager().getContext('grid');

    gridContext.addShortcut({
      group: 'group_ID',
      keys: [['enter']],
      callback: () => {},
    });
    ```

### Keyboard shortcut contexts

Every keyboard action is registered in a particular context:

| Context  | Description                                                       | Type     |
| -------- | ----------------------------------------------------------------- | -------- |
| `grid`   | Activates when the user navigates the data grid (initial context) | Built-in |
| `editor` | Activates when the user opens a cell editor                       | Built-in |
| `menu`   | Activates when the user opens a cell's context menu               | Built-in |
| Custom   | Your [custom context](#managing-keyboard-shortcut-contexts)       | Custom   |

When the user interacts with the keyboard, only actions registered for the currently-active context are executed.

Only one context is active at a time.

#### Managing keyboard shortcut contexts

Using the [`ShortcutManager`](@/api/shortcutManager.md) API methods, you can:

- Get the name of the currently-active context: [`getActiveContextName()`](@/api/shortcutManager.md#getactivecontextname)
- Switch to a different context: [`setActiveContextName()`](@/api/shortcutManager.md#setactivecontextname)
- Get an already-registered context: [`getContext()`](@/api/shortcutManager.md#getcontext)
- Create and register a new context: [`addContext()`](@/api/shortcutManager.md#addcontext)

For example: if you're using a complex [custom editor](@/guides/cell-functions/cell-editor.md#how-to-create-a-custom-editor), 
you can create a new shortcut context to navigate your editor's UI with the arrow keys (normally, the arrow keys would navigate the grid instead).

### Adding a custom keyboard shortcut

To add a custom keyboard shortcut:
1. Select a [context](#keyboard-shortcut-contexts) in which you want to add a shortcut, for example:
    ```js
    const gridContext = hot.getShortcutManager().getContext('grid');
    ```
2. Using the selected context's [`addShortcut()`](@/api/shortcutContext.md#addshortcut) method, add your keyboard shortcut:
    ```js
    const gridContext = hot.getShortcutManager().getContext('grid');

    gridContext.addShortcut({
      group: 'group_ID',
      keys: [['enter']],
      callback: () => {},
    });
    ```
    The [`keys`](@/api/shortcutContext.md#addshortcut) parameter:
    - Accepts all the [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values) key names.
    - Accepts key names in both lowercase and uppercase (e.g., both `Enter` and `enter` work)
    - Handles key-name discrepancies between browsers (e.g., both `'Spacebar'` and `' '` work)
    - Accepts key names in any order (e.g., both `[['control', 'a']]` and `[['a', 'control']]`) work)
    ::: tip
    **Using the <kbd>**Alt**</kbd> (<kbd>**Option ⌥**</kbd>) modifier key**
    
    <kbd>**Alt**</kbd> (<kbd>**Option ⌥**</kbd>) is often used for typing special characters (e.g., letters wich diacritical marks),
    and its behavior may vary depending on the user's language and keyboard settings.
    
    To properly use <kbd>**Alt**</kbd> (<kbd>**Option ⌥**</kbd>) in your shortcut, you may need to pass language-specific signs (such as `à` or `ś`) to the [`keys`](@/api/shortcutContext.md#addshortcut) parameter.
    :::

#### Adding a conditional keyboard action

To make a keyboard action run on a certain condition, set the [`runOnlyIf`](@/api/shortcutContext.md#addshortcut) parameter to a function:

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.addShortcut({
  group: 'group_ID',
  runOnlyIf: () => hot.getSelected() !== void 0,
  keys: [['enter']],
  callback: () => {},
});
```

#### Setting the order of keyboard actions

You can assign multiple actions to a single keyboard shortcut.

By default, when you assign a new action, it runs after any other actions that were assigned previously. To set your own order of actions, use the [`position`](@/api/shortcutContext.md#addshortcut) and [`relativeToGroup`](@/api/shortcutContext.md#addshortcut) parameters of the [`addShortcut()`](@/api/shortcutContext.md#addshortcut) method:

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.addShortcut({
  group: 'customNumericEditor',
  position: 'before',
  relativeToGroup: 'editorManager.handlingEditor',
  runOnlyIf: () => { hot.getSelected() !== void 0 },
  keys: [['F2']],
  callback: () => {
    if (hot.getActiveEditor().cellProperties.type === 'numeric') {
      return false; // the `F2` shortcut won't work for `numeric` cells
    }
    
    // another action
  },
});
```

### Removing a keyboard shortcut

To remove a keyboard shortcut (e.g., one of the [default](#default-keyboard-shortcuts) keyboard shortcuts):
1. Select a [context](#keyboard-shortcut-contexts) in which you want to remove a keyboard shortcut.
2. Use the selected context's [`removeShortcutsByKeys()`](@/api/shortcutContext.md#removeshortcutsbykeys) method.
```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.removeShortcutsByKeys(['enter']);
```

To remove all keyboard shortcuts registered in a certain group:
1. Select a [context](#keyboard-shortcut-contexts).
2. Use the selected context's [`removeShortcutsByGroup()`](@/api/shortcutContext.md#removeshortcutsbygroup) method.
```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.removeShortcutsByGroup('group_ID');
```

### Replacing a keyboard shortcut

To replace a keyboard shortcut:
1. Select a [context](#keyboard-shortcut-contexts) in which you want to replace a keyboard shortcut.
2. Get the old keyboard shortcut, using the selected context's [`getShortcuts()`](@/api/shortcutContext.md#getshortcuts) method.
3. Remove the old keyboard shortcut, using the selected context's [`removeShortcutsByKeys()`](@/api/shortcutContext.md#removeshortcutsbykeys) method.
4. Replace the `keys` property of the old keyboard shortcut with your new array of keys.
5. Add your new keyboard shortcut, using the selected context's [`addShortcuts()`](@/api/shortcutContext.md#addshortcuts) method.
```js
const gridContext = hot.getShortcutManager().getContext('grid');
const undoShortcut = gridContext.getShortcuts(['meta', 'z']);

gridContext.removeShortcutsByKeys(['meta', 'z']);

undoShortcut.map((shortcut) => {
  shortcut.keys = [['shift', 'meta', 'z']];
});

gridContext.addShortcuts(undoShortcut);
```

### Blocking a keyboard shortcut's actions

To block a keyboard shortcut's actions, return `false` in the [`beforeKeyDown`](@/api/hooks.md#beforekeydown) hook's callback:

```js
hot.addHook('beforeKeyDown', (event) => {
  // the `Enter` shortcut won't work
  if (event.key === 'enter') {
    return false;
  }
});
```

## Related articles

#### Related blog articles

- [Handsontable 12.0.0: RTL support, and a new keyboard shortcuts API](https://handsontable.com/blog/handsontable-12.0.0-data-grid-rtl-support-and-a-new-keyboard-shortcuts-api)

#### Related API reference

- APIs:
  - [`ShortcutContext`](@/api/shortcutContext.md)
  - [`ShortcutManager`](@/api/shortcutManager.md)
- Configuration options:
  - [`enterBeginsEditing`](@/api/options.md#enterbeginsediting)
  - [`enterMoves`](@/api/options.md#entermoves)
  - [`tabMoves`](@/api/options.md#tabmoves)
- Core methods:
  - [`getShortcutManager()`](@/api/core.md#getshortcutmanager)
  - [`isListening()`](@/api/core.md#islistening)
  - [`listen()`](@/api/core.md#listen)
  - [`unlisten()`](@/api/core.md#unlisten)
- Hooks:
  - [`afterDocumentKeyDown`](@/api/hooks.md#afterdocumentkeydown)
  - [`beforeKeyDown`](@/api/hooks.md#beforekeydown)