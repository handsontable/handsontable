---
title: HeaderTooltips
metaTitle: HeaderTooltips - Plugin - Handsontable Documentation
permalink: /next/api/header-tooltips
canonicalUrl: /api/header-tooltips
editLink: false
---

# HeaderTooltips

[[toc]]

## Description

Allows to add a tooltip to the table headers.

Available options:
* the `rows` property defines if tooltips should be added to row headers,
* the `columns` property defines if tooltips should be added to column headers,
* the `onlyTrimmed` property defines if tooltips should be added only to headers, which content is trimmed by the header itself (the content being wider then the header).

**Example**  
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData(),
  // enable and configure header tooltips
  headerTooltips: {
    rows: true,
    columns: true,
    onlyTrimmed: false
  }
});
```

## Options

### headerTooltips
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/dataMap/metaManager/metaSchema.js#L2798

:::

_headerTooltips.headerTooltips : boolean | object_

***Deprecated***

Allows adding a tooltip to the table headers.

Available options:
* the `rows` property defines if tooltips should be added to row headers,
* the `columns` property defines if tooltips should be added to column headers,
* the `onlyTrimmed` property defines if tooltips should be added only to headers, which content is trimmed by the header itself (the content being wider then the header).

**Default**: <code>undefined</code>  
**Example**  
```js
// enable tooltips for all headers
headerTooltips: true,

// or
headerTooltips: {
  rows: false,
  columns: true,
  onlyTrimmed: true
}
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/headerTooltips/headerTooltips.js#L176

:::

_headerTooltips.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/headerTooltips/headerTooltips.js#L96

:::

_headerTooltips.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/headerTooltips/headerTooltips.js#L73

:::

_headerTooltips.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/headerTooltips/headerTooltips.js#L66

:::

_headerTooltips.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#HeaderTooltips+enablePlugin) method is called.


