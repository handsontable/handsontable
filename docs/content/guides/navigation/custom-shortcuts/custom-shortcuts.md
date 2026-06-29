---
type: how-to
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
  metaTitle: Custom shortcuts - React Data Grid | Handsontable
angular:
  metaTitle: Custom shortcuts - Angular Data Grid | Handsontable
vue:
  metaTitle: Custom shortcuts - Vue Data Grid | Handsontable
searchCategory: Guides
category: Navigation
---
Use the [`ShortcutManager`](@/api/shortcutManager.md) API to add, remove, replace, or block keyboard shortcuts in Handsontable.

[[toc]]

::: only-for react

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.

:::

:::

::: only-for angular

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance access](@/guides/getting-started/angular-hot-instance/angular-hot-instance.md) page.

:::

:::

::: only-for vue

::: tip

To use the Handsontable API, use a template ref on `HotTable` and read `hotRef.value.hotInstance`.

For more information, see [Referencing the Handsontable instance in Vue 3](@/guides/getting-started/vue3-hot-reference/vue3-hot-reference.md).

:::

:::

<ol class="sl-steps">
<li>

**Access the [`ShortcutManager`](@/api/shortcutManager.md) API:**

```js
hot.getShortcutManager();
```

</li>
<li>

**Select a keyboard shortcut context, for example:**

```js
const gridContext = hot.getShortcutManager().getContext('grid');
```

</li>
<li>

**Use the selected context's [methods](@/api/shortcutContext.md).** For example, to use the [`addShortcut()`](@/api/shortcutContext.md#addshortcut) method in the `grid` context:

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.addShortcut({
  group: 'group_ID', // a string value; the user can decide on its name.
  // Each shortcut should be assigned to the group.
  keys: [['enter']],
  callback: () => {},
});
```

</li>
</ol>

## Add a custom keyboard shortcut

To add a custom keyboard shortcut:

<ol class="sl-steps">
<li>

**Select a [context](#keyboard-shortcut-contexts) in which you want to add a shortcut, for example:**

```js
const gridContext = hot.getShortcutManager().getContext('grid');
```

</li>
<li>

**Using the selected context's [`addShortcut()`](@/api/shortcutContext.md#addshortcut) method, add your keyboard shortcut:**

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.addShortcut({
  group: 'group_ID', // a string value; the user can decide on its name.
  // Each shortcut should be assigned to the group.
  keys: [['enter']],
  callback: () => {},
});
```

</li>
</ol>

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

<ol class="sl-steps">
<li>

**Select a [context](#keyboard-shortcut-contexts) in which you want to remove a keyboard shortcut.**

</li>
<li>

**Use the selected context's [`removeShortcutsByKeys()`](@/api/shortcutContext.md#removeshortcutsbykeys) method.**

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.removeShortcutsByKeys(['enter']);
```

</li>
</ol>

To remove all keyboard shortcuts registered in a certain group:

<ol class="sl-steps">
<li>

**Select a [context](#keyboard-shortcut-contexts).**

</li>
<li>

**Use the selected context's [`removeShortcutsByGroup()`](@/api/shortcutContext.md#removeshortcutsbygroup) method.**

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.removeShortcutsByGroup('group_ID');
```

</li>
</ol>

## Replace a keyboard shortcut

To replace a keyboard shortcut:

<ol class="sl-steps">
<li>

**Select a [context](#keyboard-shortcut-contexts) in which you want to replace a keyboard shortcut.**

</li>
<li>

**Get the old keyboard shortcut, using the selected context's [`getShortcuts()`](@/api/shortcutContext.md#getshortcuts) method.**

</li>
<li>

**Remove the old keyboard shortcut, using the selected context's [`removeShortcutsByKeys()`](@/api/shortcutContext.md#removeshortcutsbykeys) method.**

</li>
<li>

**Replace the `keys` property of the old keyboard shortcut with your new array of keys.**

</li>
<li>

**Add your new keyboard shortcut, using the selected context's [`addShortcuts()`](@/api/shortcutContext.md#addshortcuts) method.**

```js
const gridContext = hot.getShortcutManager().getContext('grid');
const undoShortcut = gridContext.getShortcuts(['control/meta', 'z']);

gridContext.removeShortcutsByKeys(['control/meta', 'z']);

undoShortcut.map((shortcut) => {
  shortcut.keys = [['shift', 'control/meta', 'z']];
});

gridContext.addShortcuts(undoShortcut);
```

</li>
</ol>

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

::: only-for angular

```ts
settings = {
  beforeKeyDown: (event) => {
    // the `Enter` shortcut won't work
    if (event.key === "enter") {
      return false;
    }
  },
};
```

```html
<hot-table [settings]="settings" />
```

:::

::: only-for vue

```js
const hotSettings = ref({
  beforeKeyDown(event) {
    // the `Enter` shortcut won't work
    if (event.key === 'enter') {
      return false;
    }
  },
  // ...other settings
});
```

:::

## Result

After completing these steps, you have custom keyboard shortcuts registered in the target context. The shortcuts trigger your callbacks when the user presses the configured key combination, and only when the specified context is active.

## Reference

### Keyboard shortcut contexts

Every keyboard action is registered in a particular context:

| Context  | Description                                                       | Type     |
| -------- | ----------------------------------------------------------------- | -------- |
| `grid`   | Activates when the user navigates the data grid (initial context) | Built-in |
| `editor` | Activates when the user opens a cell editor                       | Built-in |
| `menu`   | Activates when the user opens a cell's context menu               | Built-in |
| Custom   | Your custom context                                               | Custom   |

When the user interacts with the keyboard, only actions registered for the currently-active context are executed. Only one context is active at a time.

### Manage keyboard shortcut contexts

Using the [`ShortcutManager`](@/api/shortcutManager.md) API methods, you can:

- Get the name of the currently-active context: [`getActiveContextName()`](@/api/shortcutManager.md#getactivecontextname)
- Switch to a different context: [`setActiveContextName()`](@/api/shortcutManager.md#setactivecontextname)
- Get an already-registered context: [`getContext()`](@/api/shortcutManager.md#getcontext)
- Create and register a new context: [`addContext()`](@/api/shortcutManager.md#addcontext)

For example: if you're using a complex [custom editor](@/guides/cell-functions/cell-editor/cell-editor.md#how-to-create-a-custom-editor), you can create a new shortcut context to navigate your editor's UI with the arrow keys (normally, the arrow keys would navigate the grid instead).

### `addShortcut()` parameters

The [`keys`](@/api/shortcutContext.md#addshortcut) parameter:

- Accepts all the [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values) key names.
- Accepts key names in both lowercase and uppercase (e.g., both `Enter` and `enter` work)
- Handles key-name discrepancies between browsers (e.g., both `'Spacebar'` and `' '` work)
- Accepts key names in any order (e.g., both `[['control', 'a']]` and `[['a', 'control']]`) work)

## API reference

For the list of [options](@/guides/getting-started/configuration-options/configuration-options.md), methods, and [Handsontable hooks](@/guides/getting-started/events-and-hooks/events-and-hooks.md) related to keyboard navigation, see the following API reference pages:

**APIs**

<div class="boxes-list">

- [ShortcutContext](@/api/shortcutContext.md)
- [ShortcutManager](@/api/shortcutManager.md)

</div>

**Configuration options**

<div class="boxes-list">

- [enterBeginsEditing](@/api/options.md#enterbeginsediting)
- [enterMoves](@/api/options.md#entermoves)
- [tabMoves](@/api/options.md#tabmoves)

</div>

**Core methods**

<div class="boxes-list">

- [getShortcutManager()](@/api/core.md#getshortcutmanager)
- [isListening()](@/api/core.md#islistening)
- [listen()](@/api/core.md#listen)
- [unlisten()](@/api/core.md#unlisten)

</div>

**Hooks**

<div class="boxes-list">

- [afterDocumentKeyDown](@/api/hooks.md#afterdocumentkeydown)
- [beforeKeyDown](@/api/hooks.md#beforekeydown)

</div>

## Troubleshooting

Didn't find what you need? Try this:

<div class="boxes-list">

- [View related topics](https://github.com/handsontable/handsontable/issues) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help

</div>
