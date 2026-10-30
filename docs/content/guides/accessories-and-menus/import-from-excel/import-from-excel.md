---
type: how-to
title: Import from Excel
metaTitle: Import from Excel | Handsontable DataGrid for JavaScript
description: Load an Excel (.xlsx) workbook into your grid - cell types, dropdown lists, formulas, comments, merged cells, and hidden rows and columns come from the file.
permalink: /import-from-excel
canonicalUrl: /import-from-excel
tags:
  - import from file
  - load file
  - xlsx
  - excel
react:
  metaTitle: Import from Excel | Handsontable DataGrid for React
angular:
  metaTitle: Import from Excel | Handsontable DataGrid for Angular
vue:
  metaTitle: Import from Excel | Handsontable DataGrid for Vue
searchCategory: Guides
category: Import and export
menuTag: new
addedIn: "19.0.0"
---

Load an Excel (`.xlsx`) workbook into your grid. The `ImportFile` plugin derives cell types from number formats and applies the layout the workbook carries. It uses the built-in XLSX engine unless you configure ExcelJS - see [XLSX engines](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md).

[[toc]]

## Demo

The grid shows the workbook's data with headers, cell types, dropdown lists, merged cells, hidden columns, a formula, and a comment. The demo passes [`importStyles: true`](#styles), so it also applies the workbook's alignment, fills, and borders. Without it, styling is reported as `cellStyles`. A workbook with hidden rows or frozen panes gets those applied the same way.

Click **Load sample** to import a workbook the export plugin wrote, or **Import XLSX** to pick your own.

::: only-for javascript
::: example #example1 --html 1 --js 2 --ts 3

@[code](@/content/guides/accessories-and-menus/import-from-excel/javascript/example1.html)
@[code](@/content/guides/accessories-and-menus/import-from-excel/javascript/example1.js)
@[code](@/content/guides/accessories-and-menus/import-from-excel/javascript/example1.ts)

:::
:::

::: only-for react
::: example #example1 --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/import-from-excel/react/example1.jsx)
@[code](@/content/guides/accessories-and-menus/import-from-excel/react/example1.tsx)

:::
:::

::: only-for angular
::: example #example1 --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/import-from-excel/angular/example1.ts)
@[code](@/content/guides/accessories-and-menus/import-from-excel/angular/example1.html)

:::
:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/accessories-and-menus/import-from-excel/vue/example1.vue)

:::

:::

## Prerequisites

- The `ImportFile` plugin is part of `registerAllModules()` and is on unless you set `importFile: false`. No other library is needed.
- When you register modules one by one, register the `ImportFile` plugin itself (`registerPlugin(ImportFile)`), the plugins listed below, and the cell types the import derives: `numeric`, `date`, `intl-datetime`, `time`, `checkbox`, and `dropdown`. An unregistered type is applied as `text` and reported as `cellType:<name>`. A preview with `apply: false` returns the type the file asked for.
- Enable the plugins for what you want applied: [`CustomBorders`](@/api/customBorders.md), [`Comments`](@/api/comments.md), and [`Formulas`](@/api/formulas.md). [`MergeCells`](@/api/mergeCells.md), [`HiddenRows`](@/api/hiddenRows.md), and [`HiddenColumns`](@/api/hiddenColumns.md) only need to be registered, because the import turns them on. A missing `Comments` plugin is reported as `comments`, a missing `CustomBorders` plugin as `cellStyles:borders` (with `importStyles: true`), and an unregistered `MergeCells`, `HiddenRows`, or `HiddenColumns` plugin under its own name. Without `Formulas`, formulas import as their cached values and are listed in `result.formulas`, not in `result.dropped`. A formula with no cached value imports empty and is reported as `formula:noCachedValue`.
- To run the import in Jest or Vitest, set up the test environment as [Testing](@/guides/tools-and-building/testing/testing.md#test-import-and-export-in-jest-or-vitest) describes.

## Example

### 1. Turn the plugin on

::: only-for javascript

```javascript
const hot = new Handsontable(container, {
  importFile: true,
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

::: only-for react

```jsx
<HotTable
  importFile={true}
  licenseKey="non-commercial-and-evaluation"
/>
```

:::

::: only-for angular

```typescript
readonly hotSettings: GridSettings = {
  importFile: true,
  licenseKey: 'non-commercial-and-evaluation',
};
```

:::

::: only-for vue

```javascript
const hotSettings = ref({
  importFile: true,
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

### 2. Import a file the user picked

```javascript
fileInput.addEventListener('change', async () => {
  const [file] = fileInput.files;

  try {
    const result = await hot.getPlugin('importFile').importFromBlob('xlsx', file, {
      colHeaders: 'firstRow',
    });

    console.log(result.dropped); // what the file carried and the grid did not take
  } catch (error) {
    status.textContent = error.message; // a refused file says what to do, and the grid keeps its data
  } finally {
    fileInput.value = ''; // lets the user pick the same file again
  }
});
```

### 3. Read what was dropped

`result.dropped` lists what the file carried and the grid did not take, and the plugin prints the same list in one console warning per import. An import that a newer import replaced while its file was being read, or that the plugin was disabled during, prints none. The [Dropped features reference](@/guides/import-and-export/dropped-features/dropped-features.md#dropped-on-import) explains every key.

### 4. Preview before you apply

For a large file, or one from an untrusted source, read the result first and apply it only when it passes your checks.

```javascript
const preview = await hot.getPlugin('importFile').importFromArrayBuffer('xlsx', buffer, { apply: false });

if (preview.data.length <= 10000) {
  await hot.getPlugin('importFile').importFromArrayBuffer('xlsx', buffer);
}
```

### Security

The plugin treats every workbook as untrusted input:

- Promoted column headers are HTML-escaped, and cell values render as text.
- A text value that starts with `=` stays text. Only a cell the file declares as a formula imports as one.
- Files above the size, cell, and sheet limits are refused before they reach the grid. Macros are never run.

For a file from an untrusted source, import it with `apply: false` first or with the Formulas plugin off: a few bytes of formula can reference every cell of a sheet and crash the tab. The full rules, the limits, and the risks of each engine are in [XLSX engines](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md#security).

### Formulas, arrays, and defined names

With the `Formulas` plugin on and `importFormulas` left at `true`, formulas import live:

- **Dynamic arrays** (`=SEQUENCE(3)`, `=FILTER(...)`) import live and spill over the cells below them. The cells the array covers import empty, so the spill does not collide with their cached values.
- **Legacy (CSE) arrays** import as `=ARRAYFORMULA(...)`. The [ExcelJS engine](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md#known-differences) cannot tell the two kinds apart, so it imports every array this way.
- **Defined names** are added to the Formulas plugin's engine as named expressions, and `result.namedExpressions` lists them. A formula such as `=SUM(Sales)` stays live. A name HyperFormula cannot take, or one that points at a sheet it does not hold, is reported as `definedNames:unsupported`. The formulas over it import their cached values and are reported as `formula:definedName`.
- **`TRUE` and `FALSE`** written without parentheses become `TRUE()` and `FALSE()` in the live formula, because HyperFormula reads the bare words as names. `result.formulas` keeps the text from the file.

When the engine already defines a name, the import keeps that definition if it matches the file's. If the definition differs, as in a second import of a changed file, the import does not replace it. The formulas over that name import their cached values, and the import reports `formula:definedName` and `definedNames:unsupported`. To take the file's definition, remove the name first with HyperFormula's `removeNamedExpression()`.

### Re-importing an export

A workbook you exported from Handsontable DataGrid carries its nested headers and row headers as sheet content. Import it with `headerRows` set to the header depth and `rowHeaders: true`, or the second header row lands in the data and the row numbers become a column.

```javascript
await hot.getPlugin('importFile').importFromBlob('xlsx', file, {
  colHeaders: 'firstRow', headerRows: 2, rowHeaders: true,
});
```

A grid with a [`columnSummary`](@/guides/columns/column-summary/column-summary.md) exports the computed total, and the import loads that total back as data, so a summary over the whole column then shows double. Set the summary's `ranges` to stop above the summary row. Before an import with more rows, turn the summary off with `updateSettings({ columnSummary: false })`, and pass your endpoints again after the import. Otherwise the summary keeps writing to the row it computed for the previous data, over an imported value.

Imported headers are HTML-escaped, so `R&D` is stored as `R&amp;D`. Set the grid's [`textExtractor`](@/api/options.md#textextractor) option to `true` to re-export them as the text the workbook held.

::: only-for react

### Keep the imported sheet through a re-render

`HotTable` calls `updateSettings` with its props on every render. A re-render of the component that renders `HotTable` sends its props again (`columns`, `colWidths`, and a few others are skipped when unchanged). Your original `data` and `colHeaders` replace the imported sheet, and props such as `mergeCells={true}` and `hiddenColumns={true}` clear its merges and hidden columns. React Compiler can hide this in one component and not in the next, so do not rely on it.

- Keep import state, such as a status text, in a sibling component, as the demo's `ImportControls` does.
- Render `HotTable` in a `React.memo` component with stable props, so a parent's re-render does not reach it:

  ```jsx
  const Grid = React.memo(({ rows, hotRef }) => (
    <HotTable ref={hotRef} data={rows} importFile={true} licenseKey="non-commercial-and-evaluation" />
  ));
  ```

- A grid fed by a server prop must keep the first value, because each router response sends a new array: `const [firstRows] = useState(rows);` and then `<Grid rows={firstRows} hotRef={hotRef} />`.

Unmounting the grid, or hiding it with `<Activity mode="hidden">`, destroys the instance and its imported sheet. Keep the file in state and import it again when the grid is back.

:::

::: only-for angular

### Keep the imported sheet through a settings change

The `hot-table` component passes every key of a new `[settings]` object to `updateSettings`. Keep the settings in one object that nothing replaces, as the demo does. A settings object you bind after an import must leave out `colHeaders`, `columns`, and the layout options the import set (`mergeCells`, `hiddenRows`, `hiddenColumns`, `customBorders`, `fixedRowsTop`, `fixedColumnsStart`, `colWidths`, `rowHeights`). Otherwise they replace the imported headers, column types, and layout.

### Import outside the Angular zone

The import awaits many times while it reads the file, and each await ends a Zone.js turn and runs change detection. Start the import with `NgZone.runOutsideAngular()` and report its status through a signal, as the demo does:

```typescript
private readonly zone = inject(NgZone);

importFile(file: File): void {
  this.zone.runOutsideAngular(async() => {
    const importPlugin = this.hotTable.hotInstance!.getPlugin('importFile');

    try {
      const result = await importPlugin.importFromBlob('xlsx', file, { colHeaders: 'firstRow' });

      this.status.set(`Imported ${file.name}`);
    } catch (error) {
      this.status.set((error as Error).message);
    }
  });
}
```

:::

::: only-for vue

### Keep the imported sheet through a settings change

The `HotTable` component watches the settings you pass to it. A later change sends the keys that differ to `updateSettings` again. The imported rows stay, because array-of-arrays `data` is not resent, unless the settings hold `columns` and the import changed the column count. Your original `colHeaders`, `columns`, and layout options such as `mergeCells: true` and `hiddenColumns: true` do come back, over the imported headers, types, merges, and hidden columns. Keep the settings in one stable `ref`, as the demo does, and do not change them after an import.

:::

### Import into a sheets bar workbook

With the [sheets bar](@/guides/accessories-and-menus/sheets-bar/sheets-bar.md#import-and-export), an import changes the active sheet only, and the framework sections above don't apply: a re-render doesn't replace the imported layout.

## Options

Pass these options as the third argument of `importFromArrayBuffer(format, buffer, options)` or `importFromBlob(format, blob, options)`. `importFromArrayBuffer()` also accepts a view over a buffer, such as a `Uint8Array`.

| Option | Type | Default | Description |
|---|---|---|---|
| `sheet` | `string \| number` | `0` | Sheet to import, by name or by index. The index counts the sheets that are not very hidden and skips the `_HotValidation` sheet an export writes for its dropdown lists. |
| `colHeaders` | `boolean \| 'firstRow'` | `false` | `'firstRow'` promotes the first row to column headers. `true` behaves like `false`: the grid keeps its current `colHeaders`. |
| `headerRows` | `number` | `1` | How many rows the header band spans, with `colHeaders: 'firstRow'`. Above `1`, those rows become [nested headers](@/guides/columns/column-groups/column-groups.md) and the data starts after them. Has to be an integer of at least `1`. |
| `rowHeaders` | `boolean` | `false` | Drop the first column and turn generated row headers on. |
| `range` | `number[]` | whole sheet | `[startRow, startColumn, endRow, endColumn]` in 0-based sheet coordinates, each start at or before its end. An end past the sheet is clamped; a start past the sheet rejects the call. |
| `inferCellTypes` | `boolean` | `true` | Derive `numeric`, `date`, `intl-datetime`, `time`, `checkbox`, and `dropdown` types from the cells' number formats and values. The type most cells of a column share becomes the column's type in `result.columns`; cells that differ get their own `result.cellsMeta` entry. `false` turns dropdowns off too, and dates import as raw serials. Details: [number formats](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md#dates-times-and-number-formats). |
| `importFormulas` | `boolean` | `true` | Put formulas into the data when the `Formulas` plugin is on. The `_xlfn.`, `_xlws.`, and `_xlpm.` prefixes Excel writes are removed, and an export writes them back. A function HyperFormula lacks, such as `SORT` or `LET`, imports live and shows an error; set `importFormulas: false` to import the cached values instead. See [Formulas, arrays, and defined names](#formulas-arrays-and-defined-names). |
| `importLayout` | `boolean` | `true` | Apply merges, hidden rows and columns, frozen panes, column widths, and row heights. An import describes the whole sheet: each of these, and `customBorders`, that the grid has and the result does not carry is reset, including one you set yourself. Borders themselves come from `importStyles`, so with `importStyles` off an import clears the grid's custom borders. The lists merge into an existing `hiddenRows`, `hiddenColumns`, or `mergeCells` options object, so options such as `indicators` survive. Independently of `importLayout`, a grid that already has a `columns` setting gets one empty column setting per imported column when the result carries no `columns`, so the previous file's column types do not survive. |
| `importStyles` | `boolean` | `false` | Apply alignment, font, fill, and borders from the workbook. See [Styles](#styles). |
| `apply` | `boolean` | `true` | Apply the result to the grid. With `false`, the result comes back and nothing changes, neither hook fires, and the dropped-features warning still prints. Its `dropped` leaves out the names that come from applying (`cellType:<name>`, `mergeCells`, `hiddenRows`, `hiddenColumns`, and `layoutDirection`), so a preview's list can be shorter than the real import's. |
| `engine` | `object \| null` | - | Engine for this call only. See [Choose the engine](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md#choose-the-engine). |

### Styles

By default, the plugin reads cell styling from the workbook and reports it as `cellStyles` in `result.dropped` instead of applying it. Set `importStyles: true` to apply it:

```javascript
await hot.getPlugin('importFile').importFromBlob('xlsx', file, {
  colHeaders: 'firstRow',
  importStyles: true,
});
```

| Workbook style | Grid result |
|---|---|
| Horizontal and vertical alignment | A class name (`htLeft`, `htCenter`, `htRight`, `htJustify`, `htTop`, `htMiddle`, `htBottom`). |
| Bold, italic, underline, and font color | A generated class name, with its CSS declarations in `result.styles`. |
| Background fill | The same generated class name and declaration. |
| Borders | An entry in `result.customBorders`, in the shape the [`CustomBorders`](@/api/customBorders.md) option takes. |

A class name goes on `result.columns[].className` when every cell of a column shares it, and on `result.cellsMeta[].meta.className` otherwise. The plugin installs `result.styles` in one `<style>` element owned by the grid, replaces it on the next import, and removes it when the grid is destroyed.

With `importStyles: true`, borders pass to the `CustomBorders` plugin through `updateSettings`, so an import replaces the borders the grid had, whatever `importLayout` is. When the result carries no borders - the workbook has none, or `importStyles` is off - `importLayout` clears the grid's custom borders. Font size and font name are not imported. Conditional formatting is returned on `result.conditionalFormatting`, in the shape the export's `conditionalFormatting` option takes, and never applied.

## Methods

Each import method takes the format first (`'xlsx'`), the file second, and an options object third.

- [`importFromBlob(format, blob, options)`](@/api/importFile.md#importfromblob) - imports a `Blob` or a `File`, such as one from an `<input type="file">`. Returns a `Promise` of the result.
- [`importFromArrayBuffer(format, buffer, options)`](@/api/importFile.md#importfromarraybuffer) - imports an `ArrayBuffer`, or a view over one such as a `Uint8Array`. Returns a `Promise` of the result.
- [`supportsImportFormat(format)`](@/api/importFile.md#supportsimportformat) - `true` when the format can be read.

To type data that doesn't come from a workbook, such as CSV rows, pasted text, or API values, use [`inferColumnTypes()`](@/api/importFile.md#infercolumntypes). See [Infer column types](@/guides/import-and-export/infer-column-types/infer-column-types.md).

## Hooks

- [`beforeImport(result, format)`](@/api/hooks.md#beforeimport) runs after mapping and before applying. Return `false` to leave the grid untouched; the promise still resolves with the result. Mutate `result` to change what is applied. The dropped-features warning is already printed by then.
- [`afterImport(result, format)`](@/api/hooks.md#afterimport) runs after the grid was updated.
- Neither hook runs for `apply: false`, or for an import that a newer import replaced (see [Concurrent imports](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md#concurrent-imports)).

## Related articles

**Related guides**

<div class="boxes-list">

- [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md)
- [Export to CSV](@/guides/accessories-and-menus/export-to-csv/export-to-csv.md)
- [XLSX engines](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md)
- [Dropped features reference](@/guides/import-and-export/dropped-features/dropped-features.md)
- [Infer column types](@/guides/import-and-export/infer-column-types/infer-column-types.md)
- [Import from CSV or Excel](@/recipes/import-export/import-csv-excel/import-csv-excel.md)

</div>

## Related API reference

**Configuration options**

<div class="boxes-list">

- [importFile](@/api/options.md#importfile)

</div>

**Plugins**

<div class="boxes-list">

- [ImportFile](@/api/importFile.md)

</div>

**Hooks**

<div class="boxes-list">

- [beforeImport](@/api/hooks.md#beforeimport)
- [afterImport](@/api/hooks.md#afterimport)

</div>

---

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
