---
id: cdahp04c
title: Focus scopes
metaTitle: Focus scopes - JavaScript Data Grid | Handsontable
description: Manage focus boundaries and keyboard shortcuts contexts with focus scopes.
permalink: /focus-scopes
canonicalUrl: /focus-scopes
tags:
  - focus management
  - focus scopes
  - keyboard navigation
  - accessibility
  - focus boundaries
  - shortcuts context
  - tab navigation
react:
  id: lx9qi7uu
  metaTitle: Focus scopes - React Data Grid | Handsontable
angular:
  id: xat52y9g
  metaTitle: Focus scopes - Angular Data Grid | Handsontable
searchCategory: Guides
category: Navigation
menuTag: new
---

# Focus scopes

Manage focus boundaries and keyboard shortcuts contexts with focus scopes.

[[toc]]

## Overview

Focus scopes allow you to create isolated focus boundaries within your Handsontable instance, enabling seamless focus switching between the grid and your custom UI elements. They automatically manage keyboard shortcuts contexts and provide fine-grained control over which elements can receive focus and which shortcuts are active.

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

1. Access the [`FocusScopeManager`](@/api/focusScopeManager.md) API:
  ```js
  hot.getFocusScopeManager();
  ```
2. Register a focus scope with a container element:
  ```js
  const focusScopeManager = hot.getFocusScopeManager();

  focusScopeManager.registerScope('customScope', containerElement, {
    shortcutsContextName: 'plugin:customScope',
    onActivate: (focusSource) => {
      // Focus the first focusable element in your plugin's UI
      // container
    },
  });
  ```

## Focus scope types

Focus scopes come in two types, each with different behavior:

| Type     | Description                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| `inline` (default) | The scope is inline and allows the rest of the component to receive focus in the order of the rendered elements in the DOM. |
| `modal`  | The scope is modal and blocks the rest of the component from receiving focus. Only elements within the scope can be focused. |

### Inline scopes

Inline scopes allow natural tab navigation through the DOM. Users can  navigate to other parts of the grid using the <kbd>Tab</kbd> or <kbd>Shift</kbd>+<kbd>Tab</kbd> keys.

```js
const focusScopeManager = hot.getFocusScopeManager();

focusScopeManager.registerScope('pagination', paginationContainer, {
  type: 'inline',
  shortcutsContextName: 'plugin:pagination',
});
```

The example below demonstrates how the inline focus scope works using the pagination plugin as an example.
Let's focus on the top text input and press the <kbd>Tab</kbd> key through the grid to see how the focus moves
to the bottom text input and how the internal state changes.

::: only-for javascript
::: example #example1 --html 1 --css 2 --js 3 --ts 4

@[code](@/content/guides/navigation/focus-scopes/javascript/example1.html)
@[code](@/content/guides/navigation/focus-scopes/javascript/example1.css)
@[code](@/content/guides/navigation/focus-scopes/javascript/example1.js)
@[code](@/content/guides/navigation/focus-scopes/javascript/example1.ts)

:::
:::

::: only-for react
::: example #example1 :react --js 1 --css 2 --ts 3

@[code](@/content/guides/navigation/focus-scopes/react/example1.jsx)
@[code](@/content/guides/navigation/focus-scopes/react/example1.css)
@[code](@/content/guides/navigation/focus-scopes/react/example1.tsx)

:::
:::

::: only-for angular
::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/navigation/focus-scopes/angular/example1.ts)
@[code](@/content/guides/navigation/focus-scopes/angular/example1.html)

:::
:::

### Modal scopes

Modal scopes have a priority over inline scopes. If a modal scope is active, the inline scopes will not be activated. This is useful for dialogs, popups, or any UI that may overlap other inline scopes and need to be activated first.

```js
const focusScopeManager = hot.getFocusScopeManager();

focusScopeManager.registerScope('dialog', dialogContainerElement, {
  type: 'modal',
  shortcutsContextName: 'plugin:dialog',
  // Only activate the scope if the dialog is open
  runOnlyIf: () => isDialogOpen(),
});
```

The example below demonstrates how the modal focus scope works using the dialog plugin as an example. The dialog scope
takes over focus management for all inline scopes (`grid` and `pagination`) automatically, even when the dialog element
appears after the inline scope elements in the DOM.

::: only-for javascript
::: example #example2 --html 1 --css 2 --js 3 --ts 4

@[code](@/content/guides/navigation/focus-scopes/javascript/example2.html)
@[code](@/content/guides/navigation/focus-scopes/javascript/example2.css)
@[code](@/content/guides/navigation/focus-scopes/javascript/example2.js)
@[code](@/content/guides/navigation/focus-scopes/javascript/example2.ts)

:::
:::

::: only-for react
::: example #example2 :react --js 1 --css 2 --ts 3

@[code](@/content/guides/navigation/focus-scopes/react/example2.jsx)
@[code](@/content/guides/navigation/focus-scopes/react/example2.css)
@[code](@/content/guides/navigation/focus-scopes/react/example2.tsx)

:::
:::

::: only-for angular
::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/navigation/focus-scopes/angular/example2.ts)
@[code](@/content/guides/navigation/focus-scopes/angular/example2.html)

:::
:::

## Register a focus scope

To register a focus scope:

1. Access the [`FocusScopeManager`](@/api/focusScopeManager.md) API:
  ```js
  const focusScopeManager = hot.getFocusScopeManager();
  ```
2. Use the [`registerScope()`](@/api/focusScopeManager.md#registerscope) method:

  ```js
  focusScopeManager.registerScope('customScope', containerElement);
  ```

### Connect a scope with a shortcuts context

To connect a scope with a shortcuts context, use the `shortcutsContextName` option. When the scope is activated, the shortcuts context automatically switches to the scope's specified context name. This allows you to define custom shortcuts that work only within that scope. For more information, see the [Custom shortcuts](@/guides/navigation/custom-shortcuts/custom-shortcuts.md) page. If no context name is specified, the scope uses the `grid` context name by default.

```js
const focusScopeManager = hot.getFocusScopeManager();
const shortcutManager = hot.getShortcutManager();

focusScopeManager.registerScope('customScope', containerElement, {
  shortcutsContextName: 'plugin:customScope',
});

// Add shortcuts to the customScope context
const customScopeContext = shortcutManager.getContext('plugin:customScope');

customScopeContext.addShortcut({
  group: 'customScope',
  keys: [['enter']],
  callback: () => {
    console.log('Enter pressed within the customScope scope');
  },
});
```

### Add conditional scope activation

To add conditional scope activation, use the `runOnlyIf` option. This allows you to enable or disable the scope based on custom logic. The option is useful for situations where your UI depends on whether it has any focusable elements, or when you want to prevent the scope from activating for a particular part of the UI. For cases where focus should bypass the scope activation after <kbd>Tab</kbd> or <kbd>Shift</kbd>+<kbd>Tab</kbd> key presses, the logic should return `false`.

```js
const focusScopeManager = hot.getFocusScopeManager();

focusScopeManager.registerScope('customScope', containerElement, {
  runOnlyIf: () => isPluginActive(),
});
```

### Custom focus detection

By default, a scope is considered active if the focused element is within the scope's container element. However, there are cases where you need to provide custom logic to determine if the scope should be active. You can provide custom logic using the `contains` option.

```js
const focusScopeManager = hot.getFocusScopeManager();

focusScopeManager.registerScope('myPlugin', containerElement, {
  contains: (target) => {
    // check if the target is within the scope's container element or
    // if its parent has the 'my-plugin' class
    return containerElement.contains(target) || target.closest('.my-plugin');
  },
  onActivate: (focusSource) => {
    console.log('MyPlugin scope activated');
  },
});
```

### Scope callbacks

You can provide a callback function to be called when the scope is activated using the `onActivate` option. The callback function is called with the source of the activation as the first argument. You can also provide a callback function to be called when the scope is deactivated using the `onDeactivate` option.

The `focusSource` argument can be one of the following values:
- `unknown`: The scope is activated by an unknown source.
- `click`: The scope is activated by a click event.
- `tab_from_above`: The scope is activated by a <kbd>Tab</kbd> key press.
- `tab_from_below`: The scope is activated by a <kbd>Shift</kbd>+<kbd>Tab</kbd> key press.

```js
const focusScopeManager = hot.getFocusScopeManager();

focusScopeManager.registerScope('customScope', containerElement, {
  onActivate: (focusSource) => {
    console.log('Custom scope activated');
  },
  onDeactivate: () => {
    console.log('Custom scope deactivated');
  },
});
```

## Manage focus scopes

### Get the active scope

To get the currently active scope ID:

```js
const focusScopeManager = hot.getFocusScopeManager();
const activeScopeId = focusScopeManager.getActiveScopeId();

if (activeScopeId) {
  console.log(`Active scope: ${activeScopeId}`);
} else {
  console.log('No active scope');
}
```

### Activate a scope

The focus manager automatically tries to activate the appropriate scope based on the focused element. However, there are cases where you need to manually activate a scope. For example, you might need to activate a scope after programmatically triggering an action. An example is the [Dialog](@/guides/dialog/dialog/dialog.md) plugin: when the [`show()`](@/api/dialog.md#show) method is called, it manually activates its focus scope as there is no event triggered that would activate the scope.

```js
const focusScopeManager = hot.getFocusScopeManager();

focusScopeManager.activateScope('myPlugin');
```

### Deactivate a scope

To manually deactivate a scope by its ID:

```js
const focusScopeManager = hot.getFocusScopeManager();

focusScopeManager.deactivateScope('myPlugin');
```

### Unregister a scope

To remove a scope from the collection:

```js
const focusScopeManager = hot.getFocusScopeManager();

focusScopeManager.unregisterScope('myPlugin');
```

## Automatic focus management

The focus scope manager automatically:

- Listens to document events and activates the appropriate scope based on the focused element
- Updates the [`Core#isListening`](@/api/core.md#islistening) state based on scope activity
- Switches the shortcuts context to the scope's specified context name when the scope is activated
- Handles tab navigation between scopes

## API reference

For the complete API reference, see the following pages:

- APIs:
  - [`FocusScopeManager`](@/api/focusScopeManager.md)
- Configuration options:
  - [`tabMoves`](@/api/options.md#tabmoves)
  - [`tabNavigation`](@/api/options.md#tabnavigation)
  - [`navigableHeaders`](@/api/options.md#navigableheaders)
- Core methods:
  - [`getFocusScopeManager()`](@/api/core.md#getfocusscopemanager)
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
