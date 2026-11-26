---
title: Dialog
metaTitle: Dialog | Handsontable DataGrid for JavaScript
permalink: /api/dialog
canonicalUrl: /api/dialog
searchCategory: API Reference
hotPlugin: false
editLink: false
id: fk91r7t
description: Options, members, and methods of Handsontable DataGrid's Dialog API.
react:
  id: 5j79k2r2
  metaTitle: Dialog | Handsontable DataGrid for React
angular:
  id: c5v4e21x
  metaTitle: Dialog | Handsontable DataGrid for Angular
---

[[toc]]

See the [Dialog](@/guides/dialog/dialog/dialog.md) guide for examples and configuration details.

## Options

### dialog
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api dialog|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2867

:::

_dialog.dialog : boolean | object_

The `dialog` option configures the `Dialog` plugin.

You can set the `dialog` option to one of the following:

| Setting   | Description                                                                 |
| --------- | --------------------------------------------------------------------------- |
| `false`   | Disable the `Dialog` plugin                              |
| `true`    | Enable the `Dialog` plugin with default options          |

##### dialog: Additional options

| Option                   | Possible settings                                                                                                               | Description                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------|
| `template`               | Object with the template configuration (default: `null`).                                                                       | The template of the dialog allows to use prebuild templates |
| `template.type`          | The type of the template ('confirm')                                                                                            | The type of the template                |
| `template.title`         | The title of the template                                                                                                       | The title of the template               |
| `template.description`   | The description of the template                                                                                                 | The description of the template         |
| `template.buttons`       | Array of objects with the buttons configuration (default: `[]`)                                                                 | The buttons of the template             |
| `template.buttons.text`  | The text of the button                                                                                                          | The text of the button                  |
| `template.buttons.type`  | The type of the button (`'primary'` \| `'secondary'`)                                                                           | The type of the button                  |
| `template.buttons.callback` | The callback function to trigger when the button is clicked                                                                  | The callback function to trigger when the button is clicked |
| `content`                | A string, HTMLElement or DocumentFragment (default: `''`)                                                                       | The content of the dialog               |
| `customClassName`        | A string (default: `''`)                                                                                                        | The custom class name of the dialog     |
| `background`             | One of the options: `'solid'` or `'semi-transparent'` (default: `'solid'`)                                                      | The background of the dialog            |
| `contentBackground`      | Boolean (default: `false`)                                                                                                      | Whether to show the content background  |
| `animation`              | Boolean (default: `true`)                                                                                                       | Whether to show the animation           |
| `closable`               | Boolean (default: `false`)                                                                                                      | Whether to make the dialog closable     |
| `a11y`                   | Object with accessibility options (default: `{ role: 'dialog', ariaLabel: 'Dialog', ariaLabelledby: '', ariaDescribedby: '' }`) | Accessibility options for the dialog    |
| `a11y.role`              | The role of the dialog (`'dialog'` \| `'alertdialog'`)                                                                          | The role of the dialog                  |
| `a11y.ariaLabel`         | The label of the dialog                                                                                                         | The label of the dialog                 |
| `a11y.ariaLabelledby`    | The ID of the element that labels the dialog                                                                                    | The ID of the element that labels the dialog |
| `a11y.ariaDescribedby`   | The ID of the element that describes the dialog                                                                                 | The ID of the element that describes the dialog |

Read more:

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

The dialog is available on the main grid only. In a grid nested in a cell, that is a cell of the
[`handsontable`](@/guides/cell-types/handsontable-cell-type/handsontable-cell-type.md),
[`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md), or
[`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) cell type, this
option has no effect.

**Default**: <code>false</code>  
**Since**: 16.1.0  
**Example**  
::: only-for javascript
```js
// enable the Dialog plugin with default option
dialog: true,

// enable the Dialog plugin with custom configuration
dialog: {
  content: 'Dialog content',
  customClassName: 'custom-dialog',
  background: 'semi-transparent',
  contentBackground: false,
  animation: false,
  closable: true,
  a11y: {
    role: 'dialog',
    ariaLabel: 'Dialog',
    ariaLabelledby: 'titleID',
    ariaDescribedby: 'descriptionID',
  }
}

// enable the Dialog plugin using a template
dialog: {
  template: {
    type: 'confirm',
    title: 'Confirm',
    description: 'Do you want change the value?',
    buttons: [
      {
        text: 'Ok',
        type: 'primary',
        callback: () => {
          console.log('Ok');
        }
      },
    ],
  },
}
```
:::

::: only-for react
```jsx
// enable the Dialog plugin with default option
<HotTable
  dialog={true}
/>

// enable the Dialog plugin with custom configuration
<HotTable
  dialog={{
    content: 'Dialog content',
    customClassName: 'custom-dialog',
    background: 'semi-transparent',
    contentBackground: false,
    animation: false,
    closable: true,
    a11y: {
      role: 'dialog',
      ariaLabel: 'Dialog',
      ariaLabelledby: 'titleID',
      ariaDescribedby: 'descriptionID',
    }
  }
  }}
/>

// enable the Dialog plugin using a template
<HotTable
  dialog={{
    template: {
      type: 'confirm',
      title: 'Confirm',
      description: 'Do you want change the value?',
    }
  }}
/>
```
:::

::: only-for angular
```ts
settings = {
  dialog: {
    content: 'Dialog content',
    customClassName: 'custom-dialog',
    background: 'semi-transparent',
    contentBackground: false,
    animation: false,
    closable: true,
    a11y: {
      role: 'dialog',
      ariaLabel: 'Dialog',
      ariaLabelledby: 'titleID',
      ariaDescribedby: 'descriptionID',
    }
  }
};

// enable the Dialog plugin using a template
settings = {
  dialog: {
    template: {
      type: 'confirm',
      title: 'Confirm',
      description: 'Do you want change the value?',
    }
  }
};
```

```html
<hot-table [settings]="settings" />
```
:::

## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dialog/dialog.ts#L292

:::

_Dialog.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### LICENSE

::: ask-about-api LICENSE|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dialog/dialog.ts#L287

:::

_Dialog.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dialog/dialog.ts#L276

:::

_Dialog.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dialog/dialog.ts#L281

:::

_Dialog.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTINGS_VALIDATORS

::: ask-about-api SETTINGS_VALIDATORS|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dialog/dialog.ts#L311

:::

_Dialog.SETTINGS\_VALIDATORS_

Returns validator functions for each plugin setting to verify their values are valid before applying them.


## Methods

### destroy

::: ask-about-api destroy|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dialog/dialog.ts#L680

:::

_dialog.destroy()_

Destroy dialog and reset plugin state.



### disablePlugin

::: ask-about-api disablePlugin|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dialog/dialog.ts#L399

:::

_dialog.disablePlugin()_

Disable plugin for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dialog/dialog.ts#L350

:::

_dialog.enablePlugin()_

Enable plugin for this Handsontable instance.



### focus

::: ask-about-api focus|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dialog/dialog.ts#L675

:::

_dialog.focus()_

Focus the dialog.



### hide

::: ask-about-api hide|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dialog/dialog.ts#L537

:::

_dialog.hide()_

Hide the currently open dialog.
Closes the dialog and restores the focus to the table.



### isEnabled

::: ask-about-api isEnabled|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dialog/dialog.ts#L345

:::

_dialog.isEnabled() ⇒ boolean_

Check if the plugin is enabled in the handsontable settings.

The dialog renders into the `ht-overlay` element and registers a modal focus scope, and both
belong to the main Handsontable instance. In a nested grid (the one the `handsontable`,
`autocomplete`, and `dropdown` cell types create) neither exists, so the plugin stays disabled
there.

The plugin is also enabled while another plugin requires it (the Loading plugin does, while it is
enabled), even when the `dialog` option is off.



### isVisible

::: ask-about-api isVisible|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dialog/dialog.ts#L414

:::

_dialog.isVisible() ⇒ boolean_

Check if the dialog is currently visible.


**Returns**: `boolean` - True if the dialog is visible, false otherwise.  

### show

::: ask-about-api show|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dialog/dialog.ts#L449

:::

_dialog.show(options)_

Show dialog with given configuration.
Displays the dialog with the specified content and options.

A dialog visible already is updated with the options, or, when they name `content` or `template`, replaced by the
dialog they describe. A call made after the dialog hid shows a new dialog. When its options name `content` or
`template`, it starts from the [Options#dialog](@/api/options.md#dialog) options alone. Otherwise, it shows the last dialog again
with the options applied on top.


| Param | Type | Description |
| --- | --- | --- |
| options | `object` | Dialog configuration object containing content and display options. |
| options.template | `object` | The template to use for the dialog (default: `null`). An error is thrown when one call (together with the `update()` calls for the same dialog), or the [Options#dialog](@/api/options.md#dialog) option alone, sets both `template` and `content`. A `content` passed to this call replaces a `template` set in [Options#dialog](@/api/options.md#dialog), and the other way around. |
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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dialog/dialog.ts#L614

:::

_dialog.showAlert(message, [callback])_

Displays the alert dialog with the specified content.


| Param | Type | Description |
| --- | --- | --- |
| message | `string` <br/> `Object` | The message to display in the dialog. Can be a string or an object with `title` and `description` properties. |
| [callback] | `function` | `optional` The callback to trigger when the button is clicked. The dialog stays open until you call [Dialog#hide](@/api/dialog.md#hide), usually from this callback. |



### showConfirm

::: ask-about-api showConfirm|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dialog/dialog.ts#L645

:::

_dialog.showConfirm(message, [onOk], [onCancel])_

Displays the confirm dialog with the specified content and options.


| Param | Type | Description |
| --- | --- | --- |
| message | `string` <br/> `Object` | The message to display in the dialog. Can be a string or an object with `title` and `description` properties. |
| [onOk] | `function` | `optional` The callback to trigger when the OK button is clicked. |
| [onCancel] | `function` | `optional` The callback to trigger when the Cancel button is clicked. The dialog stays open until you call [Dialog#hide](@/api/dialog.md#hide), usually from these callbacks. |



### update

::: ask-about-api update|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dialog/dialog.ts#L583

:::

_dialog.update(options)_

Update the dialog configuration.

The first call after the dialog hid prepares a new dialog: when its options name `content` or `template`, it
starts from the [Options#dialog](@/api/options.md#dialog) options alone. Later calls add to that dialog.


| Param | Type | Description |
| --- | --- | --- |
| options | `object` | Dialog configuration object containing content and display options. |
| options.template | `object` | The template to use for the dialog (default: `null`). An error is thrown when one dialog's own options (its `show()` and `update()` calls), or the [Options#dialog](@/api/options.md#dialog) option alone, set both `template` and `content`. A `content` passed here replaces a `template` set in [Options#dialog](@/api/options.md#dialog), and the other way around. |
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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dialog/dialog.ts#L376

:::

_dialog.updatePlugin()_

Update plugin state after Handsontable settings update. The plugin stays enabled, so a dialog on
screen stays there and shows the new `dialog` options under the options it was shown with, and no
`beforeDialogHide` or `afterDialogHide` fires for it. A dialog whose description did not change is
not rendered again, and one that did keeps the focus on the same control. Turning the option off goes
through `disablePlugin()` instead, which hides the dialog.


