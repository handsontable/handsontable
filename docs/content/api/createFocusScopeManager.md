---
title: CreateFocusScopeManager
metaTitle: createFocusScopeManager - JavaScript Data Grid | Handsontable
permalink: /api/create-focus-scope-manager
canonicalUrl: /api/create-focus-scope-manager
searchCategory: API Reference
hotPlugin: false
editLink: false
id: s7s2ynzo
description: Options, members, and methods of Handsontable's createFocusScopeManager API.
react:
  id: z2jlexbv
  metaTitle: createFocusScopeManager - React Data Grid | Handsontable
angular:
  id: 94anm50w
  metaTitle: createFocusScopeManager - Angular Data Grid | Handsontable
---

# Plugin: CreateFocusScopeManager

[[toc]]
## Methods

### activateScope
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e5a9f90198476bcda80b36c41c37309d8287e121/handsontable/src/focusManager/scopeManager.js#L168

:::

_createFocusScopeManager~activateScope(scope, focusSource)_

Activates a specific scope.


| Param | Type | Description |
| --- | --- | --- |
| scope | `object` | The scope to activate. |
| focusSource | `'unknown'` <br/> `'click'` <br/> `'tab_from_above'` <br/> `'tab_from_below'` | The source of the focus event. |



### deactivateScope
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e5a9f90198476bcda80b36c41c37309d8287e121/handsontable/src/focusManager/scopeManager.js#L188

:::

_createFocusScopeManager~deactivateScope(scope)_

Deactivates a scope by its ID.


| Param | Type | Description |
| --- | --- | --- |
| scope | `object` | The scope to deactivate. |



### processScopes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e5a9f90198476bcda80b36c41c37309d8287e121/handsontable/src/focusManager/scopeManager.js#L241

:::

_createFocusScopeManager~processScopes(target, focusSource)_

Activates or deactivates the appropriate scope based on the target element that was
triggered by the focus or click event.


| Param | Type | Description |
| --- | --- | --- |
| target | `HTMLElement` | The target element. |
| focusSource | `'unknown'` <br/> `'click'` <br/> `'tab_from_above'` <br/> `'tab_from_below'` | The source of the focus event. |



### updateScopesFocusVisibilityState
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e5a9f90198476bcda80b36c41c37309d8287e121/handsontable/src/focusManager/scopeManager.js#L203

:::

_createFocusScopeManager~updateScopesFocusVisibilityState()_

Updates the focus scopes state by enabling or disabling them or their focus catchers to make sure
that the next native focus move won't be disturbed.


