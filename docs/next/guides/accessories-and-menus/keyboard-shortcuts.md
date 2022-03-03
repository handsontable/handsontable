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

## About keyboard shortcuts

You can intuitively navigate Handsontable with a keyboard, using the out-of-the-box [default keyboard shortcuts](#default-keyboard-shortcuts).

You can also completely [customize your keyboard shortcuts](#customizing-keyboard-shortcuts), using Handsontable's dedicated [`ShortcutManager` API](@/api/shortcutmanager.md) that lets you:
- [Add custom keyboard shortcuts](#adding-a-custom-keyboard-shortcut)
- [Remove keyboard shortcuts](#removing-a-keyboard-shortcut)
- [Replace keyboard shortcuts](#replacing-a-keyboard-shortcut)
- [Block keyboard shortcuts' actions](#blocking-a-keyboard-shortcut-s-action)

## Default keyboard shortcuts

By default, Handsontable features the following keyboard shortcuts:

#### NAVIGATION

| Windows                           | macOS                                                                                        | Action                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------- |
| <kbd>Up↑</kbd>                    | <kbd>Up↑</kbd>                                                                               | Move one cell up                             |
| <kbd>Down↓</kbd>                  | <kbd>Down↓</kbd>                                                                             | Move one cell down                           |
| <kbd>Right→</kbd>                 | <kbd>Right→</kbd>                                                                            | Move one cell to the right                   |
| <kbd>Left←</kbd>                  | <kbd>Left←</kbd>                                                                             | Move one cell to the left                    |
| <kbd>Tab</kbd>                    | <kbd>Tab</kbd>                                                                               | Move one cell to the right                   |
| <kbd>Shift</kbd> + <kbd>Tab</kbd> | <kbd>Shift</kbd> + <kbd>Tab</kbd>                                                            | Move one cell to the left                    |
| <kbd>Home</kbd>                   | <kbd>Fn</kbd> + <kbd>Left←</kbd>                                                             | Move to the first cell of the current row    |
| <kbd>End</kbd>                    | <kbd>Fn</kbd> + <kbd>Right→</kbd>                                                            | Move to the last cell of the current row     |
| <kbd>Ctrl</kbd> + <kbd>Home</kbd> | <kbd>Ctrl</kbd> + <kbd>Fn</kbd> + <kbd>Left←</kbd><br>or<br><kbd>Cmd</kbd> + <kbd>Home</kbd> | Move to the first cell of the current column |
| <kbd>Ctrl</kbd> + <kbd>End</kbd>  | <kbd>Ctrl</kbd> + <kbd>Fn</kbd> + <kbd>Right→</kbd><br>or<br><kbd>Cmd</kbd> + <kbd>End</kbd> | Move to the last cell of the current column  |

<br>
<br>

#### SELECTION

| Windows                                              | macOS                                                                                                                              | Action                                                   |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| <kbd>Ctrl</kbd> + <kbd>A</kbd>                       | <kbd>Cmd</kbd> + <kbd>A</kbd>                                                                                                      | Select all cells and headers                             |
| <kbd>Shift</kbd> + <kbd>Up↑</kbd>                    | <kbd>Shift</kbd> + <kbd>Up↑</kbd>                                                                                                  | Extend selection by one cell above                       |
| <kbd>Shift</kbd> + <kbd>Down↓</kbd>                  | <kbd>Shift</kbd> + <kbd>Down↓</kbd>                                                                                                | Extend selection by one cell below                       |
| <kbd>Shift</kbd> + <kbd>Right→</kbd>                 | <kbd>Shift</kbd> + <kbd>Right→</kbd>                                                                                               | Extend selection by one cell to the right                |
| <kbd>Shift</kbd> + <kbd>Left←</kbd>                  | <kbd>Shift</kbd> + <kbd>Left←</kbd>                                                                                                | Extend selection by one cell to the left                 |
| <kbd>Shift</kbd> + <kbd>Home</kbd>                   | <kbd>Shift</kbd> + <kbd>Fn</kbd> + <kbd>Left←</kbd><br>or<br><kbd>Shift</kbd> + <kbd>Home</kbd>                                    | Extend selection to the first cell of the current row    |
| <kbd>Shift</kbd> + <kbd>End</kbd>                    | <kbd>Shift</kbd> + <kbd>Fn</kbd> + <kbd>Right→</kbd><br>or<br><kbd>Shift</kbd> + <kbd>End</kbd>                                    | Extend selection to the last cell of the current row     |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Home</kbd> | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Fn</kbd> + <kbd>Left←</kbd><br>or<br><kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>Home</kbd> | Extend selection to the first cell of the current column |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>End</kbd>  | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Fn</kbd> + <kbd>Right→</kbd><br>or<br><kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>End</kbd> | Extend selection to the last cell of the current column  |

<br>
<br>

#### EDITION

| Windows                                                                      | macOS                                           | Action                                                                                                |
| ---------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| <kbd>Enter</kbd>                                                             | <kbd>Enter</kbd>                                | Edit the current cell<br><br>When editing:<br>stop editing, save your changes, and move one cell down |
| <kbd>Shift</kbd> + <kbd>Enter</kbd>                                          | <kbd>Shift</kbd> + <kbd>Enter</kbd>             | Edit the current cell<br><br>When editing:<br>stop editing, save your changes, and move one cell up   |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd>                                           | <kbd>Ctrl</kbd> + <kbd>Enter</kbd>              | Edit the current cell<br><br>When editing:<br>add a new line inside the cell                          |
| <kbd>F2</kbd>                                                                | <kbd>F2</kbd>                                   | Edit the current cell                                                                                 |
| <kbd>Esc</kbd>                                                               | <kbd>Esc</kbd>                                  | When editing:<br>stop editing, and cancel your changes                                                |
| <kbd>Backspace</kbd><br>or<br><kbd>Delete</kbd>                              | <kbd>Backspace</kbd><br>or<br><kbd>Delete</kbd> | Clear the cell's contents                                                                             |
| <kbd>Ctrl</kbd> + <kbd>C</kbd><br>or<br><kbd>Ctrl</kbd> + <kbd>Insert</kbd>  | <kbd>Cmd</kbd> + <kbd>C</kbd>                   | Copy the cell's contents                                                                              |
| <kbd>Ctrl</kbd> + <kbd>X</kbd>                                               | <kbd>Cmd</kbd> + <kbd>X</kbd>                   | Cut the cell's contents                                                                               |
| <kbd>Ctrl</kbd> + <kbd>V</kbd><br>or<br><kbd>Shift</kbd> + <kbd>Insert</kbd> | <kbd>Cmd</kbd> + <kbd>V</kbd>                   | Paste into the current cell                                                                           |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd>                                           | <kbd>Cmd</kbd> + <kbd>Enter</kbd>               | When editing:<br>fill all currently-selected cells with the contents of the currently-edited cell     |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd>                                               | <kbd>Cmd</kbd> + <kbd>Z</kbd>                   | Undo                                                                                                  |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd>                                               | <kbd>Cmd</kbd> + <kbd>Y</kbd>                   | Redo                                                                                                  |

<br>
<br>

#### CONTEXT MENU AND DROPDOWN MENU

| Windows          | macOS                             | Action                                      |
| ---------------- | --------------------------------- | ------------------------------------------- |
| <kbd>Down↓</kbd> | <kbd>Cmd</kbd> + <kbd>Enter</kbd> | Move to the next option of the context menu |

<br>
<br>

#### MERGING CELLS

| Windows                        | macOS                         | Action                         |
| ------------------------------ | ----------------------------- | ------------------------------ |
| <kbd>Ctrl</kbd> + <kbd>M</kbd> | <kbd>Cmd</kbd> + <kbd>M</kbd> | Merge currently-selected cells |

## Customizing keyboard shortcuts

You can customize your keyboard shortcuts, using the [`ShortcutManager` API](@/api/shortcutmanager.md).

1. Access the [`ShortcutManager`](@/api/shortcutmanager.md) API:
    ```js
    hot.getShortcutManager()
    ```
2. Select a [keyboard shortcut context](#keyboard-shortcut-contexts), for example:
    ```js
    const gridContext = hot.getShortcutManager().getContext('grid');
    ```
3. Use the selected context's [methods](@/api/context.md).<br>
    For example, to use the [`addShortcut()`](@/api/context.md#addshortcut) method in the `grid` context:
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

| Context  | Description                                                                                           | Type     |
| -------- | ----------------------------------------------------------------------------------------------------- | -------- |
| `grid`   | Activates when the user navigates the data grid (initial context)                                     | Built-in |
| `editor` | Activates when the user opens a [cell editor](@/guides/cell-functions/cell-editor.md)                 | Built-in |
| `menu`   | Activates when the user opens a cell's [context menu](@/guides/accessories-and-menus/context-menu.md) | Built-in |
| Custom   | Your [custom context](#managing-keyboard-shortcut-contexts)                                       | Custom   |

When the user interacts with the keyboard, only actions registered for the currently-active context are executed.

Only one context is active at a time.

#### Managing keyboard shortcut contexts

Using the [`ShortcutManager`](@/api/shortcutmanager.md) API methods, you can:

- Get the name of the currently-active context: [`getActiveContextName()`](@/api/shortcutmanager.md#getactivecontextname)
- Switch to a different context: [`setActiveContextName(<name>)`](@/api/shortcutmanager.md#setactivecontextname)
- Get an already-registered context: [`getContext(<name>)`](@/api/shortcutmanager.md#getcontext)
- Create and register a new context: [`addContext(<name>)`](@/api/shortcutmanager.md#addcontext)

For example, if you're using a complex [custom editor](@/guides/cell-functions/cell-editor.md##how-to-create-a-custom-editor), 
creating a custom keyboard shortcut context can let you navigate your editor's UI with the arrow keys (normally used for navigating the grid).

### Adding a custom keyboard shortcut

To add a custom keyboard shortcut:
1. Select a [context](#keyboard-shortcut-contexts) in which you want to add a shortcut, for example:
    ```js
    const gridContext = hot.getShortcutManager().getContext('grid');
    ```
2. Using the selected context's [`addShortcut()`](@/api/context.md#addshortcut) method, add your keyboard shortcut:
    ```js
    const gridContext = hot.getShortcutManager().getContext('grid');

    gridContext.addShortcut({
      group: 'group_ID',
      keys: [['enter']],
      callback: () => {},
    });
    ```

#### Setting the order of keyboard actions

You can assign multiple actions to a single keyboard shortcut. By default, when you assign a new action, it runs after any already-assigned actions.

To set your own order of actions, use the `position` and `relativeToGroup` properties:

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.addShortcut({
  group: 'customNumericEditor',
  position: 'before',
  relativeToGroup: 'editorManager.handlingEditor',
  runOnlyIf: () => { hot.getSelected !== void 0 },
  keys: [['F2']],
  callback: () => {
    if (hot.getActiveEditor().cellProperties.type === 'numeric') {
      return false; // the `F2` shortcut won't work for `numeric` cells
    }
    
    // another action
  },
});
```

#### Adding a conditional keyboard action

To make a keyboard action run on a certain condition, provide a function to the `runOnlyIf` property:

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.addShortcut({
  group: 'group_ID',
  runOnlyIf: () => hot.getSelected() !== void 0,
  keys: [['enter']],
  callback: () => {},
});
```

### Removing a keyboard shortcut

To remove a keyboard shortcut (e.g. one of the [default keyboard shortcuts](#default-keyboard-shortcuts)):
1. Select a [context](#keyboard-shortcut-contexts) in which you want to remove a keyboard shortcut.
2. Use the selected context's [`removeShortcutsByKeys()`](@/api/context.md#removeshortcutsbykeys) method.
```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.removeShortcutsByKeys(['enter']);
```

To remove all keyboard shortcuts registered in a certain group:
1. Select a [context](#keyboard-shortcut-contexts).
2. Use the selected context's [`removeShortcutsByGroup()`](@/api/context.md#removeshortcutsbygroup) method.
```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.removeShortcutsByGroup('group_ID');
```

### Replacing a keyboard shortcut

To replace a keyboard shortcut:
1. Select a [context](#keyboard-shortcut-contexts) in which you want to replace a keyboard shortcut.
2. Using the selected context's [`getShortcuts()`](@/api/context.md#getshortcuts) method, get the old keyboard shortcut.
3. Remove the old keyboard shortcut, using the selected context's [`removeShortcutsByKeys()`](@/api/context.md#removeshortcutsbykeys) method.
4. Replace the `keys` property of the old keyboard shortcut with your new array of keys.
5. Add your new keyboard shortcut, using the selected context's [`addShortcuts()`](@/api/context.md#addshortcuts) method.
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