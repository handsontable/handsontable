---
title: ExportFile
metaTitle: ExportFile - Plugin - Handsontable Documentation
permalink: /10.0/api/export-file
canonicalUrl: /api/export-file
hotPlugin: true
editLink: false
---

# ExportFile

[[toc]]

## Description

The plugin enables exporting table data to file. It allows to export data as a string, blob or a downloadable file in
CSV format.

See [the export file demo](@/guides/accessories-and-menus/export-to-csv.md) for examples.

**Example**  
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

## Members

### ExportOptions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/exportFile/exportFile.js#L67

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/exportFile/exportFile.js#L107

:::

_exportFile.downloadFile(format, options)_

Exports table data as a downloadable file.


| Param | Type | Description |
| --- | --- | --- |
| format | `string` | Export format type eq. `'csv'`. |
| options | `ExportOptions` | Export options. |



### exportAsBlob
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/exportFile/exportFile.js#L97

:::

_exportFile.exportAsBlob(format, options) ⇒ Blob_

Exports table data as a blob object.


| Param | Type | Description |
| --- | --- | --- |
| format | `string` | Export format type eq. `'csv'`. |
| options | `ExportOptions` | Export options. |



### exportAsString
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/exportFile/exportFile.js#L86

:::

_exportFile.exportAsString(format, options) ⇒ string_

Exports table data as a string.


| Param | Type | Description |
| --- | --- | --- |
| format | `string` | Export format type eq. `'csv'`. |
| options | `ExportOptions` | Export options. |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/exportFile/exportFile.js#L63

:::

_exportFile.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [ExportFile#enablePlugin](@/api/exportFile.md#enableplugin) method is called.


