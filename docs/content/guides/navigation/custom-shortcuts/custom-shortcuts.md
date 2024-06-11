---
id: g7139vli
title: Custom shortcuts
metaTitle: Custom shortcuts - JavaScript Data Grid | Handsontable
description: Customize Handsontable's keyboard shortcuts.
permalink: /custom-shortcuts
canonicalUrl: /custom-shortcuts
tags:
  - key bindings
  - keymap
  - key mapping
  - keyboard navigation
  - hotkey
  - accessibility
  - function key
  - commands
  - custom shortcuts
  - shortcut keys
react:
  id: d5ay8gj1
  metaTitle: Custom shortcuts - React Data Grid | Handsontable
searchCategory: Guides
category: Navigation
---

# Custom shortcuts

Customize Handsontable's keyboard shortcuts.

[[toc]]

## Overview

You can completely customize your keyboard shortcuts, using the [`ShortcutManager`](@/api/shortcutManager.md) API:

::: only-for react

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.

:::

:::

1. Access the [`ShortcutManager`](@/api/shortcutManager.md) API:
   ```js
   hot.getShortcutManager();
   ```
2. Select a keyboard shortcut [context](#keyboard-shortcut-contexts), for example:
   ```js
   const gridContext = hot.getShortcutManager().getContext('grid');
   ```
3. Use the selected context's [methods](@/api/shortcutContext.md). For example, to use the [`addShortcut()`](@/api/shortcutContext.md#addshortcut) method in the
   `grid` context:

   ```js
   const gridContext = hot.getShortcutManager().getContext('grid');

   gridContext.addShortcut({
     group: 'group_ID', // a string value; the user can decide on its name. 
     // Each shortcut should be assigned to the group.
     keys: [['enter']],
     callback: () => {},
   });
   ```

## Keyboard shortcut contexts

Every keyboard action is registered in a particular context:

| Context  | Description                                                       | Type     |
| -------- | ----------------------------------------------------------------- | -------- |
| `grid`   | Activates when the user navigates the data grid (initial context) | Built-in |
| `editor` | Activates when the user opens a cell editor                       | Built-in |
| `menu`   | Activates when the user opens a cell's context menu               | Built-in |
| Custom   | Your [custom context](#manage-keyboard-shortcut-contexts)         | Custom   |

When the user interacts with the keyboard, only actions registered for the currently-active context are executed.

Only one context is active at a time.

### Manage keyboard shortcut contexts

Using the [`ShortcutManager`](@/api/shortcutManager.md) API methods, you can:

- Get the name of the currently-active context: [`getActiveContextName()`](@/api/shortcutManager.md#getactivecontextname)
- Switch to a different context: [`setActiveContextName()`](@/api/shortcutManager.md#setactivecontextname)
- Get an already-registered context: [`getContext()`](@/api/shortcutManager.md#getcontext)
- Create and register a new context: [`addContext()`](@/api/shortcutManager.md#addcontext)

For example: if you're using a complex [custom editor](@/guides/cell-functions/cell-editor/cell-editor.md#how-to-create-a-custom-editor), you can create a new shortcut context to navigate your editor's UI with the arrow keys (normally, the arrow keys would navigate the grid instead).

## Add a custom keyboard shortcut

To add a custom keyboard shortcut:

1. Select a [context](#keyboard-shortcut-contexts) in which you want to add a shortcut, for example:
   ```js
   const gridContext = hot.getShortcutManager().getContext('grid');
   ```
2. Using the selected context's [`addShortcut()`](@/api/shortcutContext.md#addshortcut) method, add your keyboard shortcut:

   ```js
   const gridContext = hot.getShortcutManager().getContext('grid');

   gridContext.addShortcut({
     group: 'group_ID', // a string value; the user can decide on its name. 
     // Each shortcut should be assigned to the group.
     keys: [['enter']],
     callback: () => {},
   });
   ```

   The [`keys`](@/api/shortcutContext.md#addshortcut) parameter:

   - Accepts all the [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values) key names.
   - Accepts key names in both lowercase and uppercase (e.g., both `Enter` and `enter` work)
   - Handles key-name discrepancies between browsers (e.g., both `'Spacebar'` and `' '` work)
   - Accepts key names in any order (e.g., both `[['control', 'a']]` and `[['a', 'control']]`) work)

### Add a conditional keyboard action

To make a keyboard action run on a certain condition, set the [`runOnlyIf`](@/api/shortcutContext.md#addshortcut) parameter to a function:

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.addShortcut({
  group: 'group_ID', // a string value; the user can decide on its name. 
     // Each shortcut should be assigned to the group.
  runOnlyIf: () => hot.getSelected() !== void 0,
  keys: [['enter']],
  callback: () => {},
});
```

### Set the order of keyboard actions

You can assign multiple actions to a single keyboard shortcut.

By default, when you assign a new action, it runs after any other actions that were assigned previously. To set your own order of actions, use the [`position`](@/api/shortcutContext.md#addshortcut) and [`relativeToGroup`](@/api/shortcutContext.md#addshortcut) parameters of the [`addShortcut()`](@/api/shortcutContext.md#addshortcut) method:

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.addShortcut({
  group: 'customNumericEditor',
  position: 'before',
  relativeToGroup: 'editorManager.handlingEditor',
  runOnlyIf: () => {
    hot.getSelected() !== void 0;
  },
  keys: [['F2']],
  callback: () => {
    if (hot.getActiveEditor().cellProperties.type === 'numeric') {
      return false; // the `F2` shortcut won't work for `numeric` cells
    }

    // another action
  },
});
```

## Remove a keyboard shortcut

To remove a keyboard shortcut (e.g., one of the [default](#default-custom-shortcuts) keyboard shortcuts):

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

## Replace a keyboard shortcut

To replace a keyboard shortcut:

1. Select a [context](#keyboard-shortcut-contexts) in which you want to replace a keyboard shortcut.
2. Get the old keyboard shortcut, using the selected context's [`getShortcuts()`](@/api/shortcutContext.md#getshortcuts) method.
3. Remove the old keyboard shortcut, using the selected context's [`removeShortcutsByKeys()`](@/api/shortcutContext.md#removeshortcutsbykeys) method.
4. Replace the `keys` property of the old keyboard shortcut with your new array of keys.
5. Add your new keyboard shortcut, using the selected context's [`addShortcuts()`](@/api/shortcutContext.md#addshortcuts) method.

```js
const gridContext = hot.getShortcutManager().getContext('grid');
const undoShortcut = gridContext.getShortcuts(['control/meta', 'z']);

gridContext.removeShortcutsByKeys(['control/meta', 'z']);

undoShortcut.map((shortcut) => {
  shortcut.keys = [['shift', 'control/meta', 'z']];
});

gridContext.addShortcuts(undoShortcut);
```

## Block a keyboard shortcut's actions

To block a keyboard shortcut's actions, return `false` in the [`beforeKeyDown`](@/api/hooks.md#beforekeydown) hook's callback:

::: only-for javascript

```js
hot.addHook('beforeKeyDown', (event) => {
  // the `Enter` shortcut won't work
  if (event.key === 'enter') {
    return false;
  }
});
```

:::

::: only-for react

```jsx
<HotTable
  beforeKeyDown={(event) => {
    // the `Enter` shortcut won't work
    if (event.key === 'enter') {
      return false;
    }
  }}
/>
```

:::

## API reference

For the list of [options](@/guides/getting-started/configuration-options/configuration-options.md), methods, and [Handsontable hooks](@/guides/getting-started/events-and-hooks/events-and-hooks.md) related to keyboard navigation, see the following API reference pages:

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

## Troubleshooting

Didn't find what you need? Try this:

<div class="boxes-list gray">

- [View related topics](https://github.com/handsontable/handsontable/issues) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Ask a question](https://stackoverflow.com/questions/tagged/handsontable) on Stack Overflow
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help

</div>