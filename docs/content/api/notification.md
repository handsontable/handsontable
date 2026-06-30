---
title: Notification
metaTitle: Notification - JavaScript Data Grid | Handsontable
permalink: /api/notification
canonicalUrl: /api/notification
searchCategory: API Reference
hotPlugin: false
editLink: false
id: n9t2k4p1
description: Options, members, and methods of Handsontable's Notification API.
react:
  id: r4v8m2q6
  metaTitle: Notification - React Data Grid | Handsontable
angular:
  id: a3w7n5x9
  metaTitle: Notification - Angular Data Grid | Handsontable
---

[[toc]]
## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|Notification

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/notification.ts#L294

:::

_Notification.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|Notification

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/notification.ts#L284

:::

_Notification.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|Notification

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/notification.ts#L289

:::

_Notification.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTINGS_VALIDATORS

::: ask-about-api SETTINGS_VALIDATORS|Notification

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/notification.ts#L302

:::

_Notification.SETTINGS\_VALIDATORS_

Returns an object of validator functions used to type-check each settings property at runtime.


## Methods

### destroy

::: ask-about-api destroy|Notification

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/notification.ts#L465

:::

_notification.destroy()_

Clears queues and toast state, unregisters shortcuts and focus scope, and removes the host from the DOM.



### disablePlugin

::: ask-about-api disablePlugin|Notification

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/notification.ts#L363

:::

_notification.disablePlugin()_

Hides all toasts, removes shortcuts and listeners, and destroys the UI host.

`hideAll()` must run before `super.disablePlugin()` because `BasePlugin.disablePlugin()` clears
`this.enabled` first, and `hideAll()` relies on the plugin still being enabled. The superclass
call then removes hooks and clears the shared `EventManager`.



### enablePlugin

::: ask-about-api enablePlugin|Notification

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/notification.ts#L318

:::

_notification.enablePlugin()_

Installs the notification host, document `focusin` listener (tab order + prior-focus for click paths), shortcuts
(**F6** via grid + global shortcut contexts, Escape, Tab, Shift+Tab), and the focus scope.



### getQueueSize

::: ask-about-api getQueueSize|Notification

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/notification.ts#L460

:::

_notification.getQueueSize() ⇒ number_

Returns how many toasts are waiting in per-position queues.



### hide

::: ask-about-api hide|Notification

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/notification.ts#L408

:::

_notification.hide(id)_

Hides a toast by id.


| Param | Type | Description |
| --- | --- | --- |
| id | `string` | Toast id returned from [Notification#showMessage](@/api/notification.md#showmessage). |



### hideAll

::: ask-about-api hideAll|Notification

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/notification.ts#L433

:::

_notification.hideAll()_

Hides every visible toast and clears all per-position queues.



### isEnabled

::: ask-about-api isEnabled|Notification

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/notification.ts#L312

:::

_notification.isEnabled() ⇒ boolean_

Returns whether the `notification` setting is enabled for this instance.



### isVisible

::: ask-about-api isVisible|Notification

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/notification.ts#L450

:::

_notification.isVisible([id]) ⇒ boolean_

Returns whether a toast is visible, or whether any toast is visible when `id` is omitted.


| Param | Type | Description |
| --- | --- | --- |
| [id] | `string` | `optional` Toast id. |



### showMessage

::: ask-about-api showMessage|Notification

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/notification.ts#L387

:::

_notification.showMessage(options) ⇒ string_

Displays a toast. Returns the toast id, or an empty string when the toast is not shown.

**Throws**:

- <code>Error</code> When `options` is invalid or actions are malformed.


| Param | Type | Description |
| --- | --- | --- |
| options | `object` | Toast options. |
| [options.variant] | `'info'` <br/> `'success'` <br/> `'warning'` <br/> `'error'` | `optional` Visual variant. |
| [options.title] | `string` | `optional` Optional title. |
| options.message | `string` <br/> `HTMLElement` | Main message body. |
| [options.duration] | `number` | `optional` Auto-dismiss delay in ms. `0` keeps the toast until dismissed manually. |
| [options.position] | `'top-start'` <br/> `'top-end'` <br/> `'bottom-start'` <br/> `'bottom-end'` | `optional` Corner stack. |
| [options.closable] | `boolean` | `optional` Whether the close control is shown. |
| [options.actions] | `Array<NotificationActionSpec>` | `optional` Action buttons. |



### updatePlugin

::: ask-about-api updatePlugin|Notification

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/notification/notification.ts#L346

:::

_notification.updatePlugin([newSettings])_

Rebuilds the plugin after settings change when notification options actually change.


| Param | Type | Description |
| --- | --- | --- |
| [newSettings] | `object` | `optional` Settings object passed to `updateSettings` (partial). |


