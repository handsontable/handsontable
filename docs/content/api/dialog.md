---
title: Dialog
metaTitle: Dialog - JavaScript Data Grid | Handsontable
permalink: /api/dialog
canonicalUrl: /api/dialog
searchCategory: API Reference
hotPlugin: true
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

# Plugin: Dialog

[[toc]]

## Description

The dialog plugin provides a modal dialog system for Handsontable. It allows you to display custom content in modal dialogs
that overlay the table, providing a way to show notifications, error messages, loading indicators, or any other interactive content.

In order to enable the dialog mechanism, [Options#dialog](@/api/options.md#dialog) option must be set to `true`.

The plugin provides several configuration options to customize the dialog behavior and appearance:
- `content`: The string or HTMLElement content to display in the dialog (default: '')
- `customClassName`: Custom class name to apply to the dialog (default: '')
- `background`: Dialog background variant 'solid' | 'semi-transparent' (default: 'solid')
- `contentBackground`: Whether to show content background (default: false)
- `animation`: Whether to enable animations (default: true)
- `closable`: Whether the dialog can be closed (default: false)
- `a11y`: Object with accessibility options (default object below)
```js
{
  role: 'dialog', // Role of the dialog 'dialog' | 'alertdialog' (default: 'dialog')
  ariaLabel: 'Dialog', // Label for the dialog (default: 'Dialog')
  ariaLabelledby: '', // ID of the element that labels the dialog (default: '')
  ariaDescribedby: '', // ID of the element that describes the dialog (default: ''),
}
```

**Example**  
::: only-for javascript
```js
// Enable dialog plugin with default options
dialog: true,

// Enable dialog plugin with custom configuration
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

// Access to dialog plugin instance:
const dialogPlugin = hot.getPlugin('dialog');

// Show a dialog programmatically:
dialogPlugin.show({
   content: '<h2>Custom Dialog</h2><p>This is a custom dialog content.</p>',
   closable: true,
});

// Hide the dialog programmatically:
dialogPlugin.hide();

// Check if dialog is visible:
const isVisible = dialogPlugin.isVisible();
```
:::

::: only-for react
```jsx
const MyComponent = () => {
  const hotRef = useRef(null);

  useEffect(() => {
    const hot = hotRef.current.hotInstance;
    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: <div>
        <h2>React Dialog</h2>
        <p>Dialog content rendered with React</p>
      </div>,
      closable: true
    });
  }, []);

  return (
    <HotTable
      ref={hotRef}
      settings={{
        data: data,
        dialog: {
          customClassName: 'react-dialog',
          closable: true
        }
      }}
    />
  );
}
```
:::

::: only-for angular
```ts
hotSettings: Handsontable.GridSettings = {
  data: data,
  dialog: {
    customClassName: 'angular-dialog',
    closable: true
  }
}
```

```html
<hot-table
  [settings]="hotSettings">
</hot-table>
```
:::

## Options

### dialog
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/dataMap/metaManager/metaSchema.js#L1953

:::

_dialog.dialog : boolean | object_

The `dialog` option configures the [`Dialog`](@/api/dialog.md) plugin.

You can set the `dialog` option to one of the following:

| Setting   | Description                                                                 |
| --------- | --------------------------------------------------------------------------- |
| `false`   | Disable the [`Dialog`](@/api/dialog.md) plugin                              |
| `true`    | Enable the [`Dialog`](@/api/dialog.md) plugin with default options          |

##### dialog: Additional options

| Option                   | Possible settings                                                                                                               | Description                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------|
| `content`                | A string, HTMLElement or DocumentFragment (default: `''`)                                                                       | The content of the dialog               |
| `customClassName`        | A string (default: `''`)                                                                                                        | The custom class name of the dialog     |
| `background`             | One of the options: `'solid'` or `'semi-transparent'` (default: `'solid'`)                                                      | The background of the dialog            |
| `contentBackground`      | Boolean (default: `false`)                                                                                                      | Whether to show the content background  |
| `animation`              | Boolean (default: `true`)                                                                                                       | Whether to show the animation           |
| `closable`               | Boolean (default: `false`)                                                                                                      | Whether to make the dialog closable     |
| `a11y`                   | Object with accessibility options (default: `{ role: 'dialog', ariaLabel: 'Dialog', ariaLabelledby: '', ariaDescribedby: '' }`) | Accessibility options for the dialog    |

Read more:
- [Plugins: `Dialog`](@/api/dialog.md)

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
```

```html
<hot-table [settings]="settings" />
```
:::

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/dialog/dialog.js#L509

:::

_dialog.destroy()_

Destroy dialog and reset plugin state.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/dialog/dialog.js#L261

:::

_dialog.disablePlugin()_

Disable plugin for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/dialog/dialog.js#L216

:::

_dialog.enablePlugin()_

Enable plugin for this Handsontable instance.



### focus
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/dialog/dialog.js#L441

:::

_dialog.focus()_

Focus the dialog.



### hide
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/dialog/dialog.js#L382

:::

_dialog.hide()_

Hide the currently open dialog.
Closes the dialog and restores the focus to the table.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/dialog/dialog.js#L209

:::

_dialog.isEnabled() ⇒ boolean_

Check if the plugin is enabled in the handsontable settings.



### isVisible
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/dialog/dialog.js#L324

:::

_dialog.isVisible() ⇒ boolean_

Check if the dialog is currently visible.


**Returns**: `boolean` - True if the dialog is visible, false otherwise.  

### show
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/dialog/dialog.js#L345

:::

_dialog.show(options)_

Show dialog with given configuration.
Displays the dialog with the specified content and options.


| Param | Type | Description |
| --- | --- | --- |
| options | `object` | Dialog configuration object containing content and display options. |
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



### update
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/dialog/dialog.js#L420

:::

_dialog.update(options)_

Update the dialog configuration.


| Param | Type | Description |
| --- | --- | --- |
| options | `object` | Dialog configuration object containing content and display options. |
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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/dialog/dialog.js#L251

:::

_dialog.updatePlugin()_

Update plugin state after Handsontable settings update.


