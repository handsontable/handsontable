---
title: ExportFile
metaTitle: DropdownMenu - JavaScript Data Grid | Handsontable
permalink: /api/export-file
canonicalUrl: /api/export-file
searchCategory: API Reference
hotPlugin: true
editLink: false
description: Export your grid's data to the CSV format, as a downloadable file, a blob, or a string. Customize your export using Handsontable's configuration options.
react:
  metaTitle: ExportFile - React Data Grid | Handsontable
---

# ExportFile

[[toc]]

## Description

The `ExportFile` plugin lets you export table data as a string, blob, or downloadable CSV file.

See [the export file demo](@/guides/accessories-and-menus/export-to-csv.md) for examples.

**Example**  
::: only-for javascript
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData()
});

// access to exportFile plugin instance
const exportPlugin = hot.getPlugin('exportFile');

// export as a string
exportPlugin.exportAsString('csv');

// export as a blob object
exportPlugin.exportAsBlob('csv');

// export to downloadable file (named: MyFile.csv)
exportPlugin.downloadFile('csv', {filename: 'MyFile'});

// export as a string (with specified data range):
exportPlugin.exportAsString('csv', {
  exportHiddenRows: true,     // default false
  exportHiddenColumns: true,  // default false
  columnHeaders: true,        // default false
  rowHeaders: true,           // default false
  columnDelimiter: ';',       // default ','
  range: [1, 1, 6, 6]         // [startRow, endRow, startColumn, endColumn]
});
```
:::

::: only-for react
```jsx
const hotRef = useRef(null);

...

<HotTable
  ref={hotRef}
  data={getData()}
/>

const hot = hotRef.current.hotInstance;
// access to exportFile plugin instance
const exportPlugin = hot.getPlugin('exportFile');

// export as a string
exportPlugin.exportAsString('csv');

// export as a blob object
exportPlugin.exportAsBlob('csv');

// export to downloadable file (named: MyFile.csv)
exportPlugin.downloadFile('csv', {filename: 'MyFile'});

// export as a string (with specified data range):
exportPlugin.exportAsString('csv', {
  exportHiddenRows: true,     // default false
  exportHiddenColumns: true,  // default false
  columnHeaders: true,        // default false
  rowHeaders: true,           // default false
  columnDelimiter: ';',       // default ','
  range: [1, 1, 6, 6]         // [startRow, endRow, startColumn, endColumn]
});
```
:::

## Members

### ExportOptions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/exportFile/exportFile.js#L104

:::

_ExportFile.ExportOptions : object_


**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| [exportHiddenRows] | <code>boolean</code> | <code>false</code> | Include hidden rows in the exported file. |
| [exportHiddenColumns] | <code>boolean</code> | <code>false</code> | Include hidden columns in the exported file. |
| [columnHeaders] | <code>boolean</code> | <code>false</code> | Include column headers in the exported file. |
| [rowHeaders] | <code>boolean</code> | <code>false</code> | Include row headers in the exported file. |
| [columnDelimiter] | <code>string</code> | <code>","</code> | Column delimiter. |
| [range] | <code>string</code> | <code>&quot;[]&quot;</code> | Cell range that will be exported to file. |

## Methods

### downloadFile
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/exportFile/exportFile.js#L144

:::

_exportFile.downloadFile(format, options)_

Exports table data as a downloadable file.


| Param | Type | Description |
| --- | --- | --- |
| format | `string` | Export format type eq. `'csv'`. |
| options | `ExportOptions` | Export options. |



### exportAsBlob
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/exportFile/exportFile.js#L134

:::

_exportFile.exportAsBlob(format, options) ⇒ Blob_

Exports table data as a blob object.


| Param | Type | Description |
| --- | --- | --- |
| format | `string` | Export format type eq. `'csv'`. |
| options | `ExportOptions` | Export options. |



### exportAsString
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/exportFile/exportFile.js#L123

:::

_exportFile.exportAsString(format, options) ⇒ string_

Exports table data as a string.


| Param | Type | Description |
| --- | --- | --- |
| format | `string` | Export format type eq. `'csv'`. |
| options | `ExportOptions` | Export options. |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/exportFile/exportFile.js#L100

:::

_exportFile.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ExportFile#enablePlugin](@/api/exportFile.md#enableplugin) method is called.


