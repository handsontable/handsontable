---
title: FocusScopeManager
metaTitle: FocusScopeManager - JavaScript Data Grid | Handsontable
permalink: /api/focus-scope-manager
canonicalUrl: /api/focus-scope-manager
searchCategory: API Reference
hotPlugin: false
editLink: false
id: yqlpna1z
description: Options, members, and methods of Handsontable's ShortcutManager API.
react:
  id: 1jvf0v47
  metaTitle: FocusScopeManager - React Data Grid | Handsontable
angular:
  id: 0zo4k7a5
  metaTitle: FocusScopeManager - Angular Data Grid | Handsontable
---

# Plugin: FocusScopeManager

[[toc]]

## Description

Creates a focus scope manager for a Handsontable instance. The manager handles focus
scopes by listening to keydown, focusin, and click events on the document. Based on
the currently focused element, it activates or deactivates the appropriate scope.
Focus scope contains its own boundaries and logic that once activated allows to focus
specific focusable element within the scope container element and/or switch to specific
shortcuts context.

The manager also automatically updates the [Core#isListening](@/api/core.md#islistening) state of the Handsontable
instance based on the current state of the scopes.


## Methods

### activateScope
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/focusManager/scopeManager.js#L138

:::

_focusScopeManager.activateScope(scopeId)_

Activates a focus scope by its ID.


| Param | Type | Description |
| --- | --- | --- |
| scopeId | `string` | The ID of the scope to activate. |



### deactivateScope
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/focusManager/scopeManager.js#L153

:::

_focusScopeManager.deactivateScope(scopeId)_

Deactivates a scope by its ID.


| Param | Type | Description |
| --- | --- | --- |
| scopeId | `string` | The ID of the scope to deactivate. |



### getActiveScopeId
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/focusManager/scopeManager.js#L46

:::

_focusScopeManager.getActiveScopeId() ⇒ string | null_

Returns the ID of the active scope.


**Returns**: `string` | `null` - The ID of the active scope.  

### registerScope
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/focusManager/scopeManager.js#L102

:::

_focusScopeManager.registerScope(scopeId, container, [options])_

Registers a new focus scope.

**Example**  
For regular element (inline scope)

```js
hot.getFocusScopeManager().registerScope('myPluginName', containerElement, {
  shortcutsContextName: 'plugin:myPluginName',
  onActivate: (focusSource) => {
    // Focus the internal focusable element within the plugin UI element
  },
});
```

or for modal scope

```js
hot.getFocusScopeManager().registerScope('myPluginName', containerElement, {
  shortcutsContextName: 'plugin:myPluginName',
  type: 'modal',
  runOnlyIf: () => isDialogOpened(),
  onActivate: (focusSource) => {
    // Focus the internal focusable element within the plugin UI element
  },
});
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| scopeId | `string` |  | Unique identifier for the scope. |
| container | `HTMLElement` |  | Container element for the scope. |
| [options] | `object` |  | `optional` Configuration options. |
| [options.shortcutsContextName] | `string` | <code>"grid"</code> | `optional` The name of the shortcuts context to switch to when the scope is activated. |
| [options.type] | `'modal'` <br/> `'inline'` | <code>&#x27;inline&#x27;</code> | `optional` The type of the scope:<br/>   - `modal`: The scope is modal and blocks the rest of the grid from receiving focus.<br/>   - `inline`: The scope is inline and allows the rest of the grid to receive focus in the order of the rendered elements in the DOM. |
| [options.runOnlyIf] | `function` |  | `optional` Whether the scope is enabled or not depends on the custom logic. |
| [options.contains] | `function` |  | `optional` Whether the target element is within the scope. If the option is not  provided, the scope will be activated if the target element is within the container element. |
| [options.onActivate] | `function` |  | `optional` Callback function to be called when the scope is activated. The first argument is the source of the activation:<br/>   - `unknown`: The scope is activated by an unknown source.<br/>   - `click`: The scope is activated by a click event.<br/>   - `tab_from_above`: The scope is activated by a tab key press.<br/>   - `tab_from_below`: The scope is activated by a shift+tab key press. |
| [options.onDeactivate] | `function` |  | `optional` Callback function to be called when the scope is deactivated. |



### unregisterScope
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/focusManager/scopeManager.js#L120

:::

_focusScopeManager.unregisterScope(scopeId)_

Unregisters a scope completely.


| Param | Type | Description |
| --- | --- | --- |
| scopeId | `string` | The scope to remove. |


