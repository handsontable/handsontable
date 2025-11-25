---
title: ExportFile
metaTitle: DropdownMenu - JavaScript Data Grid | Handsontable
permalink: /api/export-file
canonicalUrl: /api/export-file
searchCategory: API Reference
hotPlugin: true
editLink: false
id: 4j5eqkhw
description: Export your grid's data to the CSV format, as a downloadable file, a blob, or a string. Customize your export using Handsontable's configuration options.
react:
  id: qsmpym52
  metaTitle: ExportFile - React Data Grid | Handsontable
angular:
  id: q3j6s4yz
  metaTitle: ExportFile - Angular Data Grid | Handsontable
---

# Plugin: ExportFile

[[toc]]

## Description

The `ExportFile` plugin lets you export table data as a string, blob, or downloadable CSV file.

See [the export file demo](@/guides/accessories-and-menus/export-to-csv/export-to-csv.md) for examples.

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

::: only-for angular
```ts
import { AfterViewInit, Component, ViewChild } from "@angular/core";
import {
  GridSettings,
  HotTableModule,
  HotTableComponent,
} from "@handsontable/angular-wrapper";

`@Component`({
  selector: "app-example",
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table themeName="ht-theme-main" [settings]="gridSettings" />
  </div>`,
})
export class ExampleComponent implements AfterViewInit {
  `@ViewChild`(HotTableComponent, { static: false })
  readonly hotTable!: HotTableComponent;

  readonly gridSettings = <GridSettings>{
    data: this.getData(),
  };

  ngAfterViewInit(): void {
    // Access to plugin instance:
    const hot = this.hotTable.hotInstance;
    // Access to exportFile plugin instance
    const exportPlugin = hot.getPlugin("exportFile");

    // Export as a string
    exportPlugin.exportAsString("csv");

    // Export as a blob object
    exportPlugin.exportAsBlob("csv");

    // Export to downloadable file (named: MyFile.csv)
    exportPlugin.downloadFile("csv", { filename: "MyFile" });

    // Export as a string (with specified data range):
    exportPlugin.exportAsString("csv", {
      exportHiddenRows: true, // default false
      exportHiddenColumns: true, // default false
      columnHeaders: true, // default false
      rowHeaders: true, // default false
      columnDelimiter: ";", // default ','
      range: [1, 1, 6, 6], // [startRow, endRow, startColumn, endColumn]
    });
  }

  private getData(): any[] {
    // get some data
  }
}
```
:::

## Members

### ExportOptions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/exportFile/exportFile.js#L162

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
| [sanitizeValues] | <code>boolean</code> \| <code>RegExp</code> \| <code>function</code> | <code>false</code> | Controls the sanitization of cell value. |

## Methods

### downloadFile
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/exportFile/exportFile.js#L203

:::

_exportFile.downloadFile(format, options)_

Exports table data as a downloadable file.


| Param | Type | Description |
| --- | --- | --- |
| format | `string` | Export format type eg. `'csv'`. |
| options | `ExportOptions` | Export options. |



### exportAsBlob
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/exportFile/exportFile.js#L193

:::

_exportFile.exportAsBlob(format, options) ⇒ Blob_

Exports table data as a blob object.


| Param | Type | Description |
| --- | --- | --- |
| format | `string` | Export format type eq. `'csv'`. |
| options | `ExportOptions` | Export options. |



### exportAsString
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/exportFile/exportFile.js#L182

:::

_exportFile.exportAsString(format, options) ⇒ string_

Exports table data as a string.


| Param | Type | Description |
| --- | --- | --- |
| format | `string` | Export format type eq. `'csv'`. |
| options | `ExportOptions` | Export options. |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/exportFile/exportFile.js#L158

:::

_exportFile.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ExportFile#enablePlugin](@/api/exportFile.md#enableplugin) method is called.


