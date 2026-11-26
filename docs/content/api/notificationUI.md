---
title: NotificationUI
metaTitle: NotificationUI API reference | Handsontable DataGrid for JavaScript
permalink: /api/notification-ui
canonicalUrl: /api/notification-ui
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description


## Methods

### createToastElement

::: ask-about-api createToastElement|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/notification/ui.ts#L200

:::

_notificationUI.createToastElement(options, closeLabel, animation) ⇒ Object_

Builds a toast element from normalized options.


| Param | Type | Description |
| --- | --- | --- |
| options | `object` | Normalized notification options (id, variant, title, message, closable, actions). |
| closeLabel | `string` | Translated label for the close control. |
| animation | `boolean` | Whether enter animation is enabled. |



### destroy

::: ask-about-api destroy|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/notification/ui.ts#L314

:::

_notificationUI.destroy()_

Detaches the host from the DOM and clears internal stack references.



### fitToGrid

::: ask-about-api fitToGrid|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/notification/ui.ts#L110

:::

_notificationUI.fitToGrid(gridRoot)_

Fits the host to the grid root, so the corner stacks anchor to the grid and not to the wider
root wrapper (which also holds the top and bottom slots). Physical offsets are written with
`right` and `bottom` reset, because the stylesheet's `inset: 0` would overconstrain the box.


| Param | Type | Description |
| --- | --- | --- |
| gridRoot | `HTMLElement` | The grid root element the toasts are anchored to. |



### getFocusables

::: ask-about-api getFocusables|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/notification/ui.ts#L279

:::

_NotificationUI.getFocusables(toastEl) ⇒ Array&lt;HTMLElement&gt;_


| Param | Type | Description |
| --- | --- | --- |
| toastEl | `HTMLElement` | Toast root element. |



### getHost

::: ask-about-api getHost|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/notification/ui.ts#L153

:::

_notificationUI.getHost() ⇒ HTMLElement | null_



### getStack

::: ask-about-api getStack|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/notification/ui.ts#L159

:::

_notificationUI.getStack(position) ⇒ HTMLElement | undefined_


| Param | Type | Description |
| --- | --- | --- |
| position | `string` | Stack key. |



### install

::: ask-about-api install|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/notification/ui.ts#L84

:::

_notificationUI.install()_

Creates the notification host and four corner stack elements inside the overlays layer (`ht-overlay`).



### refreshIcons

::: ask-about-api refreshIcons|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/notification/ui.ts#L185

:::

_notificationUI.refreshIcons()_

Rebuilds the close icon of every currently-open toast after a theme change. A toast is built
once, on `showMessage`, and not re-rendered afterward - so unlike a persistent UI (pagination,
sheets bar), nothing else would ever pick up a class-list or renderer icon change for a toast
already on screen. Safe to call repeatedly: `syncIcon()` keeps exactly one icon per button and
leaves one whose mapping did not move untouched.



### setRtl

::: ask-about-api setRtl|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/notification/ui.ts#L166

:::

_notificationUI.setRtl(isRtl)_

Updates RTL direction on the host.


| Param | Type | Description |
| --- | --- | --- |
| isRtl | `boolean` | Whether the grid uses RTL layout. |



### setSanitizer

::: ask-about-api setSanitizer|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/notification/ui.ts#L176

:::

_notificationUI.setSanitizer(sanitizer)_

Updates the HTML sanitizer used for string notification messages.


| Param | Type | Description |
| --- | --- | --- |
| sanitizer | `boolean` <br/> `function` | Sanitizer resolved from the grid settings. |



### setSequentialFocusWithinHost

::: ask-about-api setSequentialFocusWithinHost|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/notification/ui.ts#L294

:::

_NotificationUI.setSequentialFocusWithinHost(host, enabled)_

Enables or disables sequential keyboard focus for notification controls. When disabled, controls stay
out of the tab order so opening a toast does not move focus; screen readers still receive `aria-live` updates.


| Param | Type | Description |
| --- | --- | --- |
| host | `HTMLElement` <br/> `null` | Notification plugin host element. |
| enabled | `boolean` | Whether controls participate in tab navigation. |


