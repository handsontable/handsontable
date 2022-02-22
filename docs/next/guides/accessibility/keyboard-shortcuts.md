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

It is possible to add, change and remove keyboard shortcuts by managing the registered actions programmatically using the [Shortcut Manager](@/api/shortcut-manager) API. The API is accessible through the method `getShortcutManager()` on a Handsontable instance.

Each keyboard shortcut action is registered in a particular context. There are three built-in contexts:

- `grid` - activated when the user is browsing the data grid (initial)
- `editor` - activated when the user opens a cell editor
- `menu` - activated when the user opens the cell's context menu

When the user interacts presses a key or a key combination keyboard, only the actions registered for the active context are executed. Only one context is active at a time.

To manage keyboard shortcuts programmatically, you need to obtain the relevant context object from the API using the `getContext()` and execute one of its methods as explained below.

### Removing keyboard shortcuts
To remove an already registered keyboard shortcut (such as one of the default keyboard shortcuts), you need to search for it in the relevant context and refer to it by:

- Either the key variant
- Or the namespace

Use the context's method `removeShortcutByVariants` to remove all shortcuts registered for given key variants (note that it is possible that there are multiple actions registered for a single keyboard shortcut):

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.removeShortcutByVariants([['enter']]);
```

Use the context's method `removeShortcutByNamespace` to remove all shortcuts registered in a certain namespace:

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.removeShortcutByNamespace('NAMESPACE_ID');
```

### Adding custom keyboard shortcuts

Use the context's `addShortcut` method to register an action for a given keyboard shortcut.

Within a single context, there might be multiple actions registered for the same keyboard shortcut. Your action will be simply added at the end of the stack of already defined actions.

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.addShortcut({ namespace: 'NAMESPACE_ID', variants: [['enter']], callback: () => {} });
```

If your action must run before a certain other action, you can refer to the other action by its namespace:

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.addShortcut({ namespace: 'NAMESPACE_ID', variants: [['enter']], callback: () => {}, position: 'before', relativeToNamespace: 'ANOTHER_NAMESPACE_ID' });
```

If your action must run only if some specific precondition is met, you can check for the precondition using a function provided to the `runAction` property:


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

### Managing contexts

Apart from the possibility of managing the built-in contexts listed above (`grid`, `editor`, `menu`), you are also free to create custom contexts.

The shortcut manager object, obtainable through `getShortcutManager()` exposes the following methods for context management:

- `getContext(<name>)` - get an already registered context object
- `addContext(<name>)` - create a new context object and register it
- `setActiveContextName(<name>)` - switches to a context
- `getActiveContextName()` - get the name of the active context

### Using `beforeKeyDown` hook
Please keep im mind that there is an extra possibility to stop shortcut's action execution. You can return `false` in callback
to the hook for doing it.

```js
hot.addHook('beforeKeyDown', () => {
  return false; // Will not execute callback for pressed keys.
});
```
