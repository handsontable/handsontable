---
title: NotificationUI
metaTitle: NotificationUI API reference – JavaScript Data Grid | Handsontable
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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/ui.ts#L122

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/ui.ts#L235

:::

_notificationUI.destroy()_

Detaches the host from the DOM and clears internal stack references.



### getFocusables

::: ask-about-api getFocusables|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/ui.ts#L200

:::

_NotificationUI.getFocusables(toastEl) ⇒ Array&lt;HTMLElement&gt;_


| Param | Type | Description |
| --- | --- | --- |
| toastEl | `HTMLElement` | Toast root element. |



### getHost

::: ask-about-api getHost|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/ui.ts#L89

:::

_notificationUI.getHost() ⇒ HTMLElement | null_



### getStack

::: ask-about-api getStack|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/ui.ts#L95

:::

_notificationUI.getStack(position) ⇒ HTMLElement | undefined_


| Param | Type | Description |
| --- | --- | --- |
| position | `string` | Stack key. |



### install

::: ask-about-api install|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/ui.ts#L68

:::

_notificationUI.install()_

Creates the notification host and four corner stack elements inside the overlays layer (`ht-overlay`).



### setRtl

::: ask-about-api setRtl|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/ui.ts#L102

:::

_notificationUI.setRtl(isRtl)_

Updates RTL direction on the host.


| Param | Type | Description |
| --- | --- | --- |
| isRtl | `boolean` | Whether the grid uses RTL layout. |



### setSanitizer

::: ask-about-api setSanitizer|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/ui.ts#L112

:::

_notificationUI.setSanitizer(sanitizer)_

Updates the HTML sanitizer used for string notification messages.


| Param | Type | Description |
| --- | --- | --- |
| sanitizer | `function` | Sanitizer from Handsontable settings, if any. |



### setSequentialFocusWithinHost

::: ask-about-api setSequentialFocusWithinHost|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/ui.ts#L215

:::

_NotificationUI.setSequentialFocusWithinHost(host, enabled)_

Enables or disables sequential keyboard focus for notification controls. When disabled, controls stay
out of the tab order so opening a toast does not move focus; screen readers still receive `aria-live` updates.


| Param | Type | Description |
| --- | --- | --- |
| host | `HTMLElement` <br/> `null` | Notification plugin host element. |
| enabled | `boolean` | Whether controls participate in tab navigation. |


