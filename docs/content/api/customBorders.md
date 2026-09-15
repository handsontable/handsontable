---
title: CustomBorders
metaTitle: CustomBorders - JavaScript Data Grid | Handsontable
permalink: /api/custom-borders
canonicalUrl: /api/custom-borders
searchCategory: API Reference
hotPlugin: false
editLink: false
id: gxm1a98b
description: Use the CustomBorders plugin with its API options, members, and methods to set up custom borders for your cells, programmatically or using the context menu.
react:
  id: 93acldzf
  metaTitle: CustomBorders - React Data Grid | Handsontable
angular:
  id: n6g3p2st
  metaTitle: CustomBorders - Angular Data Grid | Handsontable
---

[[toc]]
## Options

### customBorders

::: ask-about-api customBorders|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1589

:::

_customBorders.customBorders : boolean | Array&lt;object&gt;_

The `customBorders` option configures the `CustomBorders` plugin.

To enable the `CustomBorders` plugin
(and add its menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)),
set the `customBorders` option to `true`.

To enable the `CustomBorders` plugin
and add a predefined border around a particular cell,
set the `customBorders` option to an array of objects.
Each object represents a border configuration for one cell, and has the following properties:

| Property | Sub-properties                | Types                                                 | Description                                                       |
| -------- | ----------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| `row`    | -                             | `row`: Number                                         | The cell's row coordinate.                                        |
| `col`    | -                             | `col`: Number                                         | The cell's column coordinate.                                     |
| `start`  | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default): `start` sets the width (`width`), color (`color`) and style (`style`) of the left-hand border.<br><br>If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL: `start` sets the width (`width`), color (`color`) and style (`style`) of the right-hand border. |
| `end`    | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default): `end` sets the width (`width`), color (`color`) and style (`style`) of the right-hand border.<br><br>If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL: `end` sets the width (`width`), color (`color`) and style (`style`) of the left-hand border. |
| `top`    | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | Sets the width (`width`), color (`color`) and style (`style`) of the top border. |
| `bottom` | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | Sets the width (`width`), color (`color`) and style (`style`) of the bottom border. |

To enable the `CustomBorders` plugin
and add a predefined border around a range of cells,
set the `customBorders` option to an array of objects.
Each object represents a border configuration for a single range of cells, and has the following properties:

| Property | Sub-properties                               | Types                                                            | Description                                                                                  |
| -------- | -------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `range`  | `from` {`row`, `col`}<br>`to` {`row`, `col`} | `from`: Object<br>`to`: Object<br>`row`: Number<br>`col`: Number | If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default):<br>- `from` selects the range's top-left corner.<br>- `to` selects the range's bottom-right corner.<br><br>If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL: <br>- `from` selects the range's top-right corner.<br>- `to` selects the range's bottom-left corner. |
| `start`  | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default): `start` sets the width (`width`), color (`color`) and style (`style`) of the left-hand border.<br><br>If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL: `start` sets the width (`width`), color (`color`) and style (`style`) of the right-hand border. |
| `end`    | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is LTR (default): `end` sets the width (`width`), color (`color`) and style (`style`) of the right-hand border.<br><br>If the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is RTL: `end` sets the width (`width`), color (`color`) and style (`style`) of the left-hand border. |
| `top`    | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | Sets the width (`width`), color (`color`) and style (`style`) of the top border. |
| `bottom` | `width`<br>`color`<br>`style` | `width`: Number<br>`color`: String<br>`style`: String | Sets the width (`width`), color (`color`) and style (`style`) of the bottom border. |

Read more:
- [Formatting cells: Custom cell borders](@/guides/cell-features/formatting-cells/formatting-cells.md#custom-cell-borders)
- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
- [Layout direction](@/guides/internationalization/layout-direction/layout-direction.md)
- [`layoutDirection`](@/api/options.md#layoutdirection)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>false</code>  
**Example**  
```js
// enable the `CustomBorders` plugin
customBorders: true,

// enable the `CustomBorders` plugin
// and add a predefined border for a particular cell
customBorders: [
  // add an object with a border configuration for one cell
  {
    // set the cell's row coordinate
    row: 2,
    // set the cell's column coordinate
    col: 2,
    // set the left/right border's width and color
    start: {
      width: 2,
      color: 'red'
    },
    // set the right/left border's width, color and style
    end: {
      width: 1,
      color: 'green',
      style: 'dashed'
    },
    // set the top border's width and color
    top: '',
    // set the bottom border's width and color
    bottom: ''
  }
],

// enable the `CustomBorders` plugin
// and add a predefined border for a range of cells
customBorders: [
  // add an object with a border configuration for one range of cells
  {
    // select a range of cells
    range: {
      // set the range's top-left corner
      from: {
        row: 1,
        col: 1
      },
      // set the range's bottom-right corner
      to: {
        row: 3,
        col: 4
      }
    },
    // set the left/right border's width, color and style
    start: {
      width: 2,
      color: 'red',
      style: 'dashed'
    },
    // set the right/left border's width and color
    end: {},
    // set the top border's width and color
    top: {},
    // set the bottom border's width and color
    bottom: {}
  }
],
```


### customBordersProgressive

::: ask-about-api customBordersProgressive|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1621

:::

_customBorders.customBordersProgressive : boolean | object_

The `customBordersProgressive` option controls how a large [`customBorders`](@/api/options.md#customborders)
configuration is applied at initialization.

By default (`false`), all custom borders are built synchronously before the first render, which
can block the initial paint when the configuration contains a very large number of borders.

Set it to `true` to apply the borders in background batches after the grid has rendered: the
grid becomes interactive immediately and the borders fill in progressively. Pass an object to
tune the batch size, for example `{ chunkSize: 5000 }`.

When enabled, `getBorders()` and the borders' cell meta
are populated incrementally, so they may be incomplete until the
[`afterCustomBordersUpdate`](@/api/hooks.md#aftercustombordersupdate) hook fires.

**Default**: <code>false</code>  
**Since**: 18.1.0  
**Example**  
```js
// apply a large custom-borders config in background batches
customBorders: [ / * ...many borders... * / ],
customBordersProgressive: true,

// tune the batch size
customBordersProgressive: { chunkSize: 5000 },
```

## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/customBorders/customBorders.ts#L520

:::

_CustomBorders.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/customBorders/customBorders.ts#L525

:::

_CustomBorders.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/customBorders/customBorders.ts#L533

:::

_CustomBorders.SETTING\_KEYS_

Returns the settings keys that trigger the plugin update on `updateSettings()`. Beside the
plugin key itself this covers `customBordersProgressive`, which changes how the very same
configuration is applied - without it, switching only that option would stay inert until some
unrelated `customBorders` update happened to come along.


## Methods

### clearBorders

::: ask-about-api clearBorders|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/customBorders/customBorders.ts#L704

:::

_customBorders.clearBorders(selectionRanges)_

Clear custom borders.

**Example**  
```js
const customBordersPlugin = hot.getPlugin('customBorders');

// Using an array of arrays (produced by `.getSelected()` method).
customBordersPlugin.clearBorders([[1, 1, 2, 2], [6, 2, 0, 2]]);
// Using an array of CellRange objects (produced by `.getSelectedRange()` method).
customBordersPlugin.clearBorders(hot.getSelectedRange());
// Using without param - clear all customBorders.
customBordersPlugin.clearBorders();
```

| Param | Type | Description |
| --- | --- | --- |
| selectionRanges | `Array<Array>` <br/> `Array<CellRange>` | Array of selection ranges. |



### destroy

::: ask-about-api destroy|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/customBorders/customBorders.ts#L1075

:::

_customBorders.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/customBorders/customBorders.ts#L574

:::

_customBorders.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/customBorders/customBorders.ts#L549

:::

_customBorders.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getBorders

::: ask-about-api getBorders|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/customBorders/customBorders.ts#L666

:::

_customBorders.getBorders(selectionRanges) ⇒ Array&lt;object&gt;_

Get custom borders.

**Example**  
```js
const customBordersPlugin = hot.getPlugin('customBorders');

// Using an array of arrays (produced by `.getSelected()` method).
customBordersPlugin.getBorders([[1, 1, 2, 2], [6, 2, 0, 2]]);
// Using an array of CellRange objects (produced by `.getSelectedRange()` method).
customBordersPlugin.getBorders(hot.getSelectedRange());
// Using without param - return all customBorders.
customBordersPlugin.getBorders();
```

| Param | Type | Description |
| --- | --- | --- |
| selectionRanges | `Array<Array>` <br/> `Array<CellRange>` | Array of selection ranges. |


**Returns**: `Array<object>` - Returns array of border objects.  

### isEnabled

::: ask-about-api isEnabled|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/customBorders/customBorders.ts#L544

:::

_customBorders.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [CustomBorders#enablePlugin](@/api/customBorders.md#enableplugin) method is called.



### setBorders

::: ask-about-api setBorders|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/customBorders/customBorders.ts#L614

:::

_customBorders.setBorders(selectionRanges, borderObject)_

Set custom borders.

**Example**  
```js
const customBordersPlugin = hot.getPlugin('customBorders');

// Using an array of arrays (produced by `.getSelected()` method).
customBordersPlugin.setBorders([[1, 1, 2, 2], [6, 2, 0, 2]], {start: {width: 2, color: 'blue'}});

// Using an array of CellRange objects (produced by `.getSelectedRange()` method).
//  Selecting a cell range.
hot.selectCell(0, 0, 2, 2);
// Returning selected cells' range with the getSelectedRange method.
customBordersPlugin.setBorders(hot.getSelectedRange(), {start: {hide: false, width: 2, color: 'blue'}});
```

| Param | Type | Description |
| --- | --- | --- |
| selectionRanges | `Array<Array>` <br/> `Array<CellRange>` | Array of selection ranges. |
| borderObject | `object` | Object with `top`, `bottom`, `start`, and `end` properties. Each side object can include: - `width` (`number`) Border width in pixels (default: `1`). - `color` (`string`) CSS border color value (default: `'#000'`). - `hide` (`boolean`) Hides a border side when set to `true`. Legacy aliases `left` and `right` are also supported and are normalized to `start` and `end`. |



### updatePlugin

::: ask-about-api updatePlugin|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/customBorders/customBorders.ts#L584

:::

_customBorders.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`customBorders`](@/api/options.md#customborders)


