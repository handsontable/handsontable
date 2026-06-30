---
title: Dialog
metaTitle: Dialog - JavaScript Data Grid | Handsontable
permalink: /api/dialog
canonicalUrl: /api/dialog
searchCategory: API Reference
hotPlugin: false
editLink: false
id: fk91r7t
description: Options, members, and methods of Handsontable's Dialog API.
react:
  id: 5j79k2r2
  metaTitle: Dialog - React Data Grid | Handsontable
angular:
  id: c5v4e21x
  metaTitle: Dialog - Angular Data Grid | Handsontable
---

[[toc]]
## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/dialog.ts#L160

:::

_Dialog.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/dialog.ts#L150

:::

_Dialog.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/dialog.ts#L155

:::

_Dialog.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTINGS_VALIDATORS

::: ask-about-api SETTINGS_VALIDATORS|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/dialog.ts#L179

:::

_Dialog.SETTINGS\_VALIDATORS_

Returns validator functions for each plugin setting to verify their values are valid before applying them.


## Methods

### destroy

::: ask-about-api destroy|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/dialog.ts#L451

:::

_dialog.destroy()_

Destroy dialog and reset plugin state.



### disablePlugin

::: ask-about-api disablePlugin|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/dialog.ts#L240

:::

_dialog.disablePlugin()_

Disable plugin for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/dialog.ts#L212

:::

_dialog.enablePlugin()_

Enable plugin for this Handsontable instance.



### focus

::: ask-about-api focus|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/dialog.ts#L446

:::

_dialog.focus()_

Focus the dialog.



### hide

::: ask-about-api hide|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/dialog.ts#L302

:::

_dialog.hide()_

Hide the currently open dialog.
Closes the dialog and restores the focus to the table.



### isEnabled

::: ask-about-api isEnabled|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/dialog.ts#L207

:::

_dialog.isEnabled() ⇒ boolean_

Check if the plugin is enabled in the handsontable settings.



### isVisible

::: ask-about-api isVisible|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/dialog.ts#L254

:::

_dialog.isVisible() ⇒ boolean_

Check if the dialog is currently visible.


**Returns**: `boolean` - True if the dialog is visible, false otherwise.  

### show

::: ask-about-api show|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/dialog.ts#L282

:::

_dialog.show(options)_

Show dialog with given configuration.
Displays the dialog with the specified content and options.


| Param | Type | Description |
| --- | --- | --- |
| options | `object` | Dialog configuration object containing content and display options. |
| options.template | `object` | The template to use for the dialog (default: `null`). The error will be thrown when the template is provided together with the `content` option. |
| options.template.type | `'confirm'` | The type of the template ('confirm'). |
| options.template.title | `string` | The title of the dialog. |
| options.template.description | `string` | The description of the dialog. Default: ''. |
| options.template.buttons | `Array<object>` | The buttons to display in the dialog. Default: []. |
| options.template.buttons.text | `string` | The text of the button. |
| options.template.buttons.type | `'primary'` <br/> `'secondary'` | The type of the button. |
| options.template.buttons.callback | `function` | The callback to trigger when the button is clicked. |
| options.content | `string` <br/> `HTMLElement` <br/> `DocumentFragment` | The content to display in the dialog. Can be a string, HTMLElement, or DocumentFragment. Default: '' |
| options.customClassName | `string` | Custom CSS class name to apply to the dialog container. Default: '' |
| options.background | `'solid'` <br/> `'semi-transparent'` | Dialog background variant. Default: 'solid'. |
| options.contentBackground | `boolean` | Whether to show content background. Default: false. |
| options.animation | `boolean` | Whether to enable animations when showing/hiding the dialog. Default: true. |
| options.closable | `boolean` | Whether the dialog can be closed by user interaction. Default: false. |
| options.a11y | `object` | Object with accessibility options. |
| options.a11y.role | `string` | The role of the dialog. Default: 'dialog'. |
| options.a11y.ariaLabel | `string` | The label of the dialog. Default: 'Dialog'. |
| options.a11y.ariaLabelledby | `string` | The ID of the element that labels the dialog. Default: ''. |
| options.a11y.ariaDescribedby | `string` | The ID of the element that describes the dialog. Default: ''. |



### showAlert

::: ask-about-api showAlert|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/dialog.ts#L386

:::

_dialog.showAlert(message, [callback])_

Displays the alert dialog with the specified content.


| Param | Type | Description |
| --- | --- | --- |
| message | `string` <br/> `Object` | The message to display in the dialog. Can be a string or an object with `title` and `description` properties. |
| [callback] | `function` | `optional` The callback to trigger when the button is clicked. |



### showConfirm

::: ask-about-api showConfirm|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/dialog.ts#L416

:::

_dialog.showConfirm(message, [onOk], [onCancel])_

Displays the confirm dialog with the specified content and options.


| Param | Type | Description |
| --- | --- | --- |
| message | `string` <br/> `Object` | The message to display in the dialog. Can be a string or an object with `title` and `description` properties. |
| [onOk] | `function` | `optional` The callback to trigger when the OK button is clicked. |
| [onCancel] | `function` | `optional` The callback to trigger when the Cancel button is clicked. |



### update

::: ask-about-api update|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/dialog.ts#L352

:::

_dialog.update(options)_

Update the dialog configuration.


| Param | Type | Description |
| --- | --- | --- |
| options | `object` | Dialog configuration object containing content and display options. |
| options.template | `object` | The template to use for the dialog (default: `null`). The error will be thrown when the template is provided together with the `content` option. |
| options.template.type | `'confirm'` | The type of the template ('confirm'). |
| options.template.title | `string` | The title of the dialog. |
| options.template.description | `string` | The description of the dialog. Default: ''. |
| options.template.buttons | `Array<object>` | The buttons to display in the dialog. Default: []. |
| options.template.buttons.text | `string` | The text of the button. |
| options.template.buttons.type | `'primary'` <br/> `'secondary'` | The type of the button. |
| options.template.buttons.callback | `function` | The callback to trigger when the button is clicked. |
| options.content | `string` <br/> `HTMLElement` <br/> `DocumentFragment` | The content to display in the dialog. Can be a string, HTMLElement, or DocumentFragment. Default: '' |
| options.customClassName | `string` | Custom CSS class name to apply to the dialog container. Default: '' |
| options.background | `'solid'` <br/> `'semi-transparent'` | Dialog background variant. Default: 'solid'. |
| options.contentBackground | `boolean` | Whether to show content background. Default: false. |
| options.animation | `boolean` | Whether to enable animations when showing/hiding the dialog. Default: true. |
| options.closable | `boolean` | Whether the dialog can be closed by user interaction. Default: false. |
| options.a11y | `object` | Object with accessibility options. |
| options.a11y.role | `string` | The role of the dialog. Default: 'dialog'. |
| options.a11y.ariaLabel | `string` | The label of the dialog. Default: 'Dialog'. |
| options.a11y.ariaLabelledby | `string` | The ID of the element that labels the dialog. Default: ''. |
| options.a11y.ariaDescribedby | `string` | The ID of the element that describes the dialog. Default: ''. |



### updatePlugin

::: ask-about-api updatePlugin|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dialog/dialog.ts#L233

:::

_dialog.updatePlugin()_

Update plugin state after Handsontable settings update.


