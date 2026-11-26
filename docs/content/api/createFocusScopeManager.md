---
title: CreateFocusScopeManager
metaTitle: createFocusScopeManager | Handsontable DataGrid for JavaScript
permalink: /api/create-focus-scope-manager
canonicalUrl: /api/create-focus-scope-manager
searchCategory: API Reference
hotPlugin: false
editLink: false
id: s7s2ynzo
description: Options, members, and methods of Handsontable DataGrid's createFocusScopeManager API.
react:
  id: z2jlexbv
  metaTitle: createFocusScopeManager | Handsontable DataGrid for React
angular:
  id: 94anm50w
  metaTitle: createFocusScopeManager | Handsontable DataGrid for Angular
---

[[toc]]
## Methods

### activateScope

::: ask-about-api activateScope|createFocusScopeManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/focusManager/scopeManager.ts#L204

:::

_createFocusScopeManager~activateScope(scope, focusSource)_

Activates a specific scope.


| Param | Type | Description |
| --- | --- | --- |
| scope | `object` | The scope to activate. |
| focusSource | `'unknown'` <br/> `'click'` <br/> `'tab_from_above'` <br/> `'tab_from_below'` | The source of the focus event. |



### deactivateScope

::: ask-about-api deactivateScope|createFocusScopeManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/focusManager/scopeManager.ts#L254

:::

_createFocusScopeManager~deactivateScope(scope, [restoreShortcutsContext])_

Deactivates a scope.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| scope | `object` |  | The scope to deactivate. |
| [restoreShortcutsContext] | `boolean` | <code>true</code> | `optional` Whether to roll the shortcuts context back to the one the scope displaced. False when a focus event moved the user, which means only "the user is elsewhere now" - the displaced name is KEPT there, so a later explicit deactivation can still use it. |



### hasOtherScopeWithSameFallback

::: ask-about-api hasOtherScopeWithSameFallback|createFocusScopeManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/focusManager/scopeManager.ts#L138

:::

_createFocusScopeManager~hasOtherScopeWithSameFallback(scopeToSkip) ⇒ boolean_

Whether a scope other than the one given still declares the same context/fallback pair.

The fallback lives on the shortcuts CONTEXT, which several scopes may share, so unregistering one
of them must not drop a fallback the others still rely on.


| Param | Type | Description |
| --- | --- | --- |
| scopeToSkip | `object` | The scope being unregistered. |



### processScopes

::: ask-about-api processScopes|createFocusScopeManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/focusManager/scopeManager.ts#L350

:::

_createFocusScopeManager~processScopes(target, focusSource)_

Activates or deactivates the appropriate scope based on the target element that was
triggered by the focus or click event.


| Param | Type | Description |
| --- | --- | --- |
| target | `HTMLElement` | The target element. |
| focusSource | `'unknown'` <br/> `'click'` <br/> `'tab_from_above'` <br/> `'tab_from_below'` | The source of the focus event. |



### restoreDisplacedShortcutsContext

::: ask-about-api restoreDisplacedShortcutsContext|createFocusScopeManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/focusManager/scopeManager.ts#L281

:::

_createFocusScopeManager~restoreDisplacedShortcutsContext(scope)_

Rolls the shortcuts context back to whatever the scope displaced when it was activated.

Deactivation used to leave the context alone, so nothing but a later focus or click event reaching
`processScopes()` ever rolled it back. Undoing a full row removal from the context menu fires
neither, so the grid came back full of data, looking completely normal, with every shortcut dead
until the user clicked a cell (DEV-2917).

Only an EXPLICIT `deactivateScope()` restores. A deactivation driven by a focus event leaves the
context alone, because a scope may stand aside while the user is still working inside it: the sheets
bar disables its own scope while its menu is open (`runOnlyIf: () => !menus.isOpened()`) precisely so
that activating it would not hand the keyboard back to the grid, and rolling the context back there
broke every keyboard command in that menu. The stale name that leaves behind is handled where it is
created - `activateScope()` never records a scope's own context as the one it displaced.


| Param | Type | Description |
| --- | --- | --- |
| scope | `object` | The scope being deactivated. |



### scopeContains

::: ask-about-api scopeContains|createFocusScopeManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/focusManager/scopeManager.ts#L338

:::

_createFocusScopeManager~scopeContains(scope, target) ⇒ boolean_

Checks whether the scope contains the target element, looking through the shadow boundaries
the target is rendered behind.

A scope answers containment with `Node.contains()`, which stops at a shadow root, so a target
resolved from inside a shadow tree the scope's container merely hosts (a web component rendered
in a cell) is reported as outside it. Falling back to the target's shadow hosts asks the same
question about the elements the container can actually see.


| Param | Type | Description |
| --- | --- | --- |
| scope | `object` | The focus scope to ask. |
| target | `Element` <br/> `null` | The target element. `getDeepActiveElement()` reports `null` for a document with no body, and no scope contains a target that is not an element to begin with. |


**Returns**: `boolean` - `true` when the target, or one of the hosts it is rendered behind, is within the scope.  

### updateScopesFocusVisibilityState

::: ask-about-api updateScopesFocusVisibilityState|createFocusScopeManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/focusManager/scopeManager.ts#L303

:::

_createFocusScopeManager~updateScopesFocusVisibilityState()_

Updates the focus scopes state by enabling or disabling them or their focus catchers to make sure
that the next native focus move won't be disturbed.


