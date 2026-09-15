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
## Options

### dialog

::: ask-about-api dialog|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2235

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

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dialog/dialog.ts#L162

:::

_Dialog.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dialog/dialog.ts#L152

:::

_Dialog.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dialog/dialog.ts#L157

:::

_Dialog.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTINGS_VALIDATORS

::: ask-about-api SETTINGS_VALIDATORS|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dialog/dialog.ts#L181

:::

_Dialog.SETTINGS\_VALIDATORS_

Returns validator functions for each plugin setting to verify their values are valid before applying them.


## Methods

### destroy

::: ask-about-api destroy|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dialog/dialog.ts#L456

:::

_dialog.destroy()_

Destroy dialog and reset plugin state.



### disablePlugin

::: ask-about-api disablePlugin|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dialog/dialog.ts#L240

:::

_dialog.disablePlugin()_

Disable plugin for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dialog/dialog.ts#L211

:::

_dialog.enablePlugin()_

Enable plugin for this Handsontable instance.



### focus

::: ask-about-api focus|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dialog/dialog.ts#L451

:::

_dialog.focus()_

Focus the dialog.



### hide

::: ask-about-api hide|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dialog/dialog.ts#L302

:::

_dialog.hide()_

Hide the currently open dialog.
Closes the dialog and restores the focus to the table.



### isEnabled

::: ask-about-api isEnabled|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dialog/dialog.ts#L206

:::

_dialog.isEnabled() ⇒ boolean_

Check if the plugin is enabled in the handsontable settings.



### isVisible

::: ask-about-api isVisible|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dialog/dialog.ts#L254

:::

_dialog.isVisible() ⇒ boolean_

Check if the dialog is currently visible.


**Returns**: `boolean` - True if the dialog is visible, false otherwise.  

### show

::: ask-about-api show|Dialog

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dialog/dialog.ts#L282

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dialog/dialog.ts#L391

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dialog/dialog.ts#L421

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dialog/dialog.ts#L352

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dialog/dialog.ts#L233

:::

_dialog.updatePlugin()_

Update plugin state after Handsontable settings update.


