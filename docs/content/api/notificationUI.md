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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/notification/ui.ts#L128

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/notification/ui.ts#L241

:::

_notificationUI.destroy()_

Detaches the host from the DOM and clears internal stack references.



### getFocusables

::: ask-about-api getFocusables|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/notification/ui.ts#L206

:::

_NotificationUI.getFocusables(toastEl) ⇒ Array&lt;HTMLElement&gt;_


| Param | Type | Description |
| --- | --- | --- |
| toastEl | `HTMLElement` | Toast root element. |



### getHost

::: ask-about-api getHost|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/notification/ui.ts#L95

:::

_notificationUI.getHost() ⇒ HTMLElement | null_



### getStack

::: ask-about-api getStack|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/notification/ui.ts#L101

:::

_notificationUI.getStack(position) ⇒ HTMLElement | undefined_


| Param | Type | Description |
| --- | --- | --- |
| position | `string` | Stack key. |



### install

::: ask-about-api install|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/notification/ui.ts#L74

:::

_notificationUI.install()_

Creates the notification host and four corner stack elements inside the overlays layer (`ht-overlay`).



### setRtl

::: ask-about-api setRtl|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/notification/ui.ts#L108

:::

_notificationUI.setRtl(isRtl)_

Updates RTL direction on the host.


| Param | Type | Description |
| --- | --- | --- |
| isRtl | `boolean` | Whether the grid uses RTL layout. |



### setSanitizer

::: ask-about-api setSanitizer|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/notification/ui.ts#L118

:::

_notificationUI.setSanitizer(sanitizer)_

Updates the HTML sanitizer used for string notification messages.


| Param | Type | Description |
| --- | --- | --- |
| sanitizer | `boolean` <br/> `function` | Sanitizer resolved from the grid settings. |



### setSequentialFocusWithinHost

::: ask-about-api setSequentialFocusWithinHost|NotificationUI

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/notification/ui.ts#L221

:::

_NotificationUI.setSequentialFocusWithinHost(host, enabled)_

Enables or disables sequential keyboard focus for notification controls. When disabled, controls stay
out of the tab order so opening a toast does not move focus; screen readers still receive `aria-live` updates.


| Param | Type | Description |
| --- | --- | --- |
| host | `HTMLElement` <br/> `null` | Notification plugin host element. |
| enabled | `boolean` | Whether controls participate in tab navigation. |


