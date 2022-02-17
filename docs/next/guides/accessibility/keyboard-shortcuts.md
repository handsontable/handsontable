---
title: Keyboard shortcuts
metaTitle: Keyboard shortcuts - Guide - Handsontable Documentation
permalink: /next/keyboard-shortcuts
canonicalUrl: /keyboard-shortcuts
tags:
- key bindings
- keymap
- shortcut manager
- keyboard navigation
---

# Keyboard shortcuts

Use and manage Handsontable's keyboard shortcuts.

[[toc]]

## About keyboard shortcuts

You can intuitively navigate Handsontable with a keyboard, using the out-of-the-box [default keyboard shortcuts](#default-keyboard-shortcuts).

You can also customize the entire set of keyboard shortcuts and handle assigned actions, by:
- [Removing default keyboard shortcuts](#removing-default-keyboard-shortcuts)
- [Adding custom keyboard shortcuts](#adding-custom-keyboard-shortcuts)
- [Replacing default keyboard shortcuts](#replacing-default-keyboard-shortcuts)
- [Using beforeKeyDown hook](#using-beforekeydown-hook)

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
| <kbd>Tab</kbd> + <kbd>Shift</kbd> | <kbd>Tab</kbd> + <kbd>Shift</kbd>                                                            | Move one cell to the left                    |
| <kbd>Home</kbd>                   | <kbd>Fn</kbd> + <kbd>Left←</kbd>                                                             | Move to the first cell of the current row    |
| <kbd>End</kbd>                    | <kbd>Fn</kbd> + <kbd>Right→</kbd>                                                            | Move to the last cell of the current row     |
| <kbd>Ctrl</kbd> + <kbd>Home</kbd> | <kbd>Ctrl</kbd> + <kbd>Fn</kbd> + <kbd>Left←</kbd><br>or<br><kbd>Cmd</kbd> + <kbd>Home</kbd> | Move to the first cell of the current column |
| <kbd>Ctrl</kbd> + <kbd>End</kbd>  | <kbd>Ctrl</kbd> + <kbd>Fn</kbd> + <kbd>Right→</kbd><br>or<br><kbd>Cmd</kbd> + <kbd>End</kbd> | Move to the last cell of the current column  |

<br>
<br>

#### SELECTION

| Windows                                              | macOS                                                                                                                              | Action                                                                                                    |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| <kbd>Ctrl</kbd> + <kbd>A</kbd>                       | <kbd>Cmd</kbd> + <kbd>A</kbd>                                                                                                      | Select all cells and headers                                                                              |
| <kbd>Shift</kbd> + <kbd>Up↑</kbd>                    | <kbd>Shift</kbd> + <kbd>Up↑</kbd>                                                                                                  | Extend selection by one cell above                                                                        |
| <kbd>Shift</kbd> + <kbd>Down↓</kbd>                  | <kbd>Shift</kbd> + <kbd>Down↓</kbd>                                                                                                | Extend selection by one cell below                                                                        |
| <kbd>Shift</kbd> + <kbd>Right→</kbd>                 | <kbd>Shift</kbd> + <kbd>Right→</kbd>                                                                                               | Extend selection by one cell to the right                                                                 |
| <kbd>Shift</kbd> + <kbd>Left←</kbd>                  | <kbd>Shift</kbd> + <kbd>Left←</kbd>                                                                                                | Extend selection by one cell to the left                                                                  |
| <kbd>Shift</kbd> + <kbd>Home</kbd>                   | <kbd>Shift</kbd> + <kbd>Fn</kbd> + <kbd>Left←</kbd><br>or<br><kbd>Shift</kbd> + <kbd>Home</kbd>                                    | Extend selection to the first cell of the current row                                                     |
| <kbd>Shift</kbd> + <kbd>End</kbd>                    | <kbd>Shift</kbd> + <kbd>Fn</kbd> + <kbd>Right→</kbd><br>or<br><kbd>Shift</kbd> + <kbd>End</kbd>                                    | Extend selection to the last cell of the current row                                                      |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Home</kbd> | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Fn</kbd> + <kbd>Left←</kbd><br>or<br><kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>Home</kbd> | Extend selection to the first cell of the current column                                                  |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>End</kbd>  | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Fn</kbd> + <kbd>Right→</kbd><br>or<br><kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>End</kbd> | Extend selection to the last cell of the current column                                                   |
| <kbd>Ctrl</kbd> + <kbd>M</kbd>                       | <kbd>Cmd</kbd> + <kbd>M</kbd>                                                                                                      | When the [`MergeCells`](@/api/mergeCells.md) plugin is enabled:<br>merge/unmerge currently-selected cells |

<br>
<br>

#### EDITING

| Windows                                                                      | macOS                               | Action                                                                                                |
| ---------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| <kbd>Enter</kbd>                                                             | <kbd>Enter</kbd>                    | Edit the current cell<br><br>When editing:<br>stop editing, save your changes, and move one cell down |
| <kbd>Shift</kbd> + <kbd>Enter</kbd>                                          | <kbd>Shift</kbd> + <kbd>Enter</kbd> | Edit the current cell<br><br>When editing:<br>stop editing, save your changes, and move one cell up   |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd>                                           | <kbd>Ctrl</kbd> + <kbd>Enter</kbd>  | Edit the current cell<br><br>When editing:<br>add a new line inside the cell                          |
| <kbd>F2</kbd>                                                                | <kbd>F2</kbd>                       | Edit the current cell                                                                                 |
| <kbd>Esc</kbd>                                                               | <kbd>Esc</kbd>                      | When editing:<br>stop editing, and cancel your changes                                                |
| <kbd>Backspace</kbd>                                                         | <kbd>Backspace</kbd>                | Clear the cell's contents                                                                             |
| <kbd>Delete</kbd>                                                            | <kbd>Delete</kbd>                   | Clear the cell's contents                                                                             |
| <kbd>Ctrl</kbd> + <kbd>C</kbd><br>or<br><kbd>Ctrl</kbd> + <kbd>Insert</kbd>  | <kbd>Cmd</kbd> + <kbd>C</kbd>       | Copy the cell's contents                                                                              |
| <kbd>Ctrl</kbd> + <kbd>X</kbd>                                               | <kbd>Cmd</kbd> + <kbd>X</kbd>       | Cut the cell's contents                                                                               |
| <kbd>Ctrl</kbd> + <kbd>V</kbd><br>or<br><kbd>Shift</kbd> + <kbd>Insert</kbd> | <kbd>Cmd</kbd> + <kbd>V</kbd>       | Paste into the current cell                                                                           |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd>                                           | <kbd>Cmd</kbd> + <kbd>Enter</kbd>   | When editing:<br>fill all currently-selected cells with the contents of the currently-edited cell     |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd>                                               | <kbd>Cmd</kbd> + <kbd>Z</kbd>       | Undo                                                                                                  |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd>                                               | <kbd>Cmd</kbd> + <kbd>Y</kbd>       | Redo                                                                                                  |

<br>
<br>

#### CONTEXT MENU AND DROP-DOWN MENU

| Windows          | macOS            | Action                                          |
| ---------------- | ---------------- | ----------------------------------------------- |
| <kbd>Down↓</kbd> | <kbd>Cmd</kbd> + <kbd>Enter</kbd> | Move to the next option of the context menu     |

<br>
<br>

#### MERGE CELLS

| Windows          | macOS            | Action                                          |
| ---------------- | ---------------- | ----------------------------------------------- |
| <kbd>Ctrl</kbd> + <kbd>M</kbd> | <kbd>Cmd</kbd> + <kbd>M</kbd> | Merge selected cells     |

## Managing keyboard shortcuts

Please keep in mind that every shortcut is executed in some context. As a context we define an application state.
You can choose only one context at time. For example, opening context menu sets `menu` context as active. Thus, actions such as default `ctrl`+`a` selecting whole Handsontable
won't work for the menu.  Currently, there are three contexts: `grid`, `editor` and `menu`. Please keep in mind that you can get already registered contexts
using `getContext` method and even register new context using `addContext`. To switch to another context use `setActiveContextName` method.

### Removing default keyboard shortcuts
Please keep in mind that below methods are available for previously get context, for example using `getContext` method.  
You can remove already registered shortcuts in two ways:

- using `removeShortcutByNamespace` for removing shortcut registered with predefined namespace,

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.removeShortcutByNamespace('NAMESPACE_ID');
```

- using `removeShortcutByVariants` for removing shortcut registered for particular key variants.

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.removeShortcutByVariants([['enter']]);
```

### Adding custom keyboard shortcuts
You can add **multiple shortcuts** for the same keys in specific context. Simply add it in the end of the shortcuts stack
using below method

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.addShortcut({ namespace: 'NAMESPACE_ID', variants: [['enter']], callback: () => {} });
```

or place it before/after another shortcut.

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.addShortcut({ namespace: 'NAMESPACE_ID', variants: [['enter']], callback: () => {}, position: 'before', relativeToNamespace: 'ANOTHER_NAMESPACE_ID' });
```

Please keep in mind that you can run some actions only for specific conditions. There is an extra `runAction` flag for handling such cases.

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.addShortcut({ namespace: 'NAMESPACE_ID', variants: [['enter']], callback: () => {}, runAction: () => hot.getSelected() !== void 0 });
```

### Replacing default keyboard shortcuts
To replace some keyboards shortcut's action by another one action you have to choose proper context, remove already registered shortcut and register another one.

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.removeShortcutByVariants(['enter']);
gridContext.addShortcut({ namespace: 'NAMESPACE_ID', variants: [['enter']], callback: () => {} });
```

### Using `beforeKeyDown` hook
Please keep im mind that there is an extra possibility to stop shortcut's action execution. You can return `false` in callback
to the hook for doing it.

```js
hot.addHook('beforeKeyDown', () => {
  return false; // Will not execute callback for pressed keys.
});
```
