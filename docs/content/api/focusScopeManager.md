---
title: FocusScopeManager
metaTitle: FocusScopeManager | Handsontable DataGrid for JavaScript
permalink: /api/focus-scope-manager
canonicalUrl: /api/focus-scope-manager
searchCategory: API Reference
hotPlugin: false
editLink: false
id: yqlpna1z
description: Options, members, and methods of Handsontable DataGrid's FocusScopeManager API.
react:
  id: 1jvf0v47
  metaTitle: FocusScopeManager | Handsontable DataGrid for React
angular:
  id: 0zo4k7a5
  metaTitle: FocusScopeManager | Handsontable DataGrid for Angular
---

[[toc]]
## Methods

### activateScope

::: ask-about-api activateScope|FocusScopeManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/focusManager/scopeManager.ts#L174

:::

_focusScopeManager.activateScope(scopeId, [focusSource])_

Activates a focus scope by its ID.

Activating a scope that is already active does nothing, except for the `tab_from_above` and `tab_from_below`
sources, which run its `onActivate` callback again: the focus came back into the scope through its focus
catcher.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| scopeId | `string` |  | The ID of the scope to activate. |
| [focusSource] | `'unknown'` <br/> `'click'` <br/> `'tab_from_above'` <br/> `'tab_from_below'` | <code>&#x27;unknown&#x27;</code> | `optional` Passed to the scope's `onActivate` callback (same values as document `htFocusSource`). |



### deactivateScope

::: ask-about-api deactivateScope|FocusScopeManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/focusManager/scopeManager.ts#L187

:::

_focusScopeManager.deactivateScope(scopeId)_

Deactivates a scope by its ID.


| Param | Type | Description |
| --- | --- | --- |
| scopeId | `string` | The ID of the scope to deactivate. |



### getActiveScopeId

::: ask-about-api getActiveScopeId|FocusScopeManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/focusManager/scopeManager.ts#L28

:::

_focusScopeManager.getActiveScopeId() ⇒ string | null_

Returns the ID of the active scope.


**Returns**: `string` | `null` - The ID of the active scope.  

### isGridBodyCovered

::: ask-about-api isGridBodyCovered|FocusScopeManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/focusManager/scopeManager.ts#L43

:::

_focusScopeManager.isGridBodyCovered() ⇒ boolean_

Whether any enabled scope currently covers the grid body.

Asked of every registered scope rather than only the active one: an overlay is on screen whether or
not it holds the keyboard, and that is what puts the cells underneath out of reach. Shortcuts that
act on cell content consult this through `canAccessCellContent()` in `../shortcuts/guards.ts`.



### registerScope

::: ask-about-api registerScope|FocusScopeManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/focusManager/scopeManager.ts#L101

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
| [options.fallbackShortcutsContextName] | `string` |  | `optional` The name of a shortcuts context consulted for keys the scope's own context does not define. Pass `'grid'` for a scope that covers the grid without replacing it. It must differ from `shortcutsContextName`, which defaults to `'grid'`. |
| [options.coversGridBody] | `boolean` | <code>false</code> | `optional` Whether the scope covers the grid body while it is showing, so the cells underneath are drawn but out of reach. Covering and inheriting are separate questions: a pagination bar may inherit without covering. |
| [options.type] | `'modal'` <br/> `'inline'` | <code>&#x27;inline&#x27;</code> | `optional` The type of the scope:<br/>   - `modal`: The scope is modal and blocks the rest of the grid from receiving focus.<br/>   - `inline`: The scope is inline and allows the rest of the grid to receive focus in the order of the rendered elements in the DOM. |
| [options.runOnlyIf] | `function` |  | `optional` Whether the scope is enabled or not depends on the custom logic. |
| [options.contains] | `function` |  | `optional` Whether the target element is within the scope. If the option is not  provided, the scope will be activated if the target element is within the container element. |
| [options.onActivate] | `function` |  | `optional` Callback function to be called when the scope is activated. The first argument is the source of the activation:<br/>   - `unknown`: The scope is activated by an unknown source.<br/>   - `click`: The scope is activated by a click event.<br/>   - `tab_from_above`: The scope is activated by a tab key press.<br/>   - `tab_from_below`: The scope is activated by a shift+tab key press.<br/> The callback runs again when the focus comes back into the scope that is already active through its focus catcher (a `tab_from_above` or `tab_from_below` source), so it must be safe to run more than once. |
| [options.onDeactivate] | `function` |  | `optional` Callback function to be called when the scope is deactivated. |



### unregisterScope

::: ask-about-api unregisterScope|FocusScopeManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/focusManager/scopeManager.ts#L146

:::

_focusScopeManager.unregisterScope(scopeId)_

Unregisters a scope completely.


| Param | Type | Description |
| --- | --- | --- |
| scopeId | `string` | The scope to remove. |


