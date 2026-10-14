---
type: how-to
title: Import from Excel
metaTitle: Import from Excel - JavaScript Data Grid | Handsontable
description: Load an Excel (.xlsx) workbook into your grid with the built-in engine - cell types, dropdown lists, formulas, comments, merged cells, and hidden rows and columns come from the file.
permalink: /import-from-excel
canonicalUrl: /import-from-excel
tags:
  - import from file
  - load file
  - xlsx
  - excel
react:
  metaTitle: Import from Excel - React Data Grid | Handsontable
angular:
  metaTitle: Import from Excel - Angular Data Grid | Handsontable
vue:
  metaTitle: Import from Excel - Vue Data Grid | Handsontable
searchCategory: Guides
category: Data management
menuTag: new
addedIn: "19.0.0"
---

Load an Excel (`.xlsx`) workbook into your grid. The `ImportFile` plugin reads the file with its built-in engine, derives cell types from number formats, and applies the layout the workbook carries.

[[toc]]

## Prerequisites

- The `ImportFile` plugin is part of `registerAllModules()` and is on unless you set `importFile: false`. No other library is needed.
- When you register modules one by one, register the cell types the import derives: `numeric`, `date`, `intl-datetime`, `time`, `checkbox`, and `dropdown`. An unregistered type imports as `text` and is reported as `cellType:<name>`.
- Enable the plugins for what you want applied: [`MergeCells`](@/api/mergeCells.md), [`HiddenRows`](@/api/hiddenRows.md), [`HiddenColumns`](@/api/hiddenColumns.md), [`CustomBorders`](@/api/customBorders.md), [`Comments`](@/api/comments.md), and [`Formulas`](@/api/formulas.md). A missing plugin is reported under its name in `result.dropped`.

## Steps

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

`result.dropped` lists what the file carried and the grid did not take, and the plugin prints the same list in one console warning per import. The [reference](@/guides/accessories-and-menus/excel-import-export-reference/excel-import-export-reference.md#dropped-features-on-import) explains every key.

### 4. Preview before you apply

For a large file, or one from an untrusted source, read the result first and apply it only when it passes your checks.

```javascript
const preview = await hot.getPlugin('importFile').importFromArrayBuffer('xlsx', buffer, { apply: false });

if (preview.data.length <= 10000) {
  await hot.getPlugin('importFile').importFromArrayBuffer('xlsx', buffer);
}
```

## Result

The grid shows the workbook's data with headers, cell types, dropdown lists, merged cells, hidden rows and columns, frozen panes, formulas, and comments. Styling is read but applied only with [`importStyles: true`](#styles); otherwise it is reported as `cellStyles`.

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

## Options

Pass these options as the third argument of `importFromArrayBuffer(format, buffer, options)` or `importFromBlob(format, blob, options)`. `importFromArrayBuffer()` also accepts a view over a buffer, such as a `Uint8Array`.

| Option | Type | Default | Description |
|---|---|---|---|
| `sheet` | `string \| number` | `0` | Sheet to import, by name or by index. The index counts the sheets that are not very hidden and skips the `_HotValidation` sheet an export writes for its dropdown lists. |
| `colHeaders` | `boolean \| 'firstRow'` | `false` | `'firstRow'` promotes the first row to column headers. `true` behaves like `false`: the grid keeps its current `colHeaders`. |
| `headerRows` | `number` | `1` | How many rows the header band spans, with `colHeaders: 'firstRow'`. Above `1`, those rows become [nested headers](@/guides/columns/column-groups/column-groups.md) and the data starts after them. Has to be an integer of at least `1`. |
| `rowHeaders` | `boolean` | `false` | Drop the first column and turn generated row headers on. |
| `range` | `number[]` | whole sheet | `[startRow, startColumn, endRow, endColumn]` in sheet coordinates. An end past the sheet is clamped. |
| `inferCellTypes` | `boolean` | `true` | Derive `numeric`, `date`, `intl-datetime`, `time`, `checkbox`, and `dropdown` types from the cells' number formats and values. The type most cells of a column share becomes the column's type in `result.columns`; cells that differ get their own `result.cellsMeta` entry. `false` turns dropdowns off too, and dates import as raw serials. Details: [number formats](@/guides/accessories-and-menus/excel-import-export-reference/excel-import-export-reference.md#dates-times-and-number-formats). |
| `importFormulas` | `boolean` | `true` | Put formulas into the data when the `Formulas` plugin is on. The `_xlfn.` prefixes Excel writes are removed. A function HyperFormula lacks, such as `SORT` or `LET`, imports live and shows an error; set `importFormulas: false` to import the cached values instead. |
| `importLayout` | `boolean` | `true` | Apply merges, hidden rows and columns, frozen panes, column widths, row heights, and borders. An import describes the whole sheet: a layout setting the grid has and the workbook does not carry is reset, including one you set yourself. The lists merge into an existing `hiddenRows`, `hiddenColumns`, or `mergeCells` options object, so options such as `indicators` survive. |
| `importStyles` | `boolean` | `false` | Apply alignment, font, fill, and borders from the workbook. See [Styles](#styles). |
| `apply` | `boolean` | `true` | Apply the result to the grid. With `false`, the result comes back and nothing changes, and neither hook fires. |
| `engine` | `object \| null` | - | Engine for this call only. `null`, or no key, means the engine from the `engines` setting, or the built-in one. See the [reference](@/guides/accessories-and-menus/excel-import-export-reference/excel-import-export-reference.md#engines). |

## Styles

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

Borders pass to the `CustomBorders` plugin through `updateSettings`, so an import replaces the borders the grid had. A workbook with no borders clears them too, because `importLayout` resets every layout setting the file does not carry. Font size and font name are not imported. Conditional formatting is returned on `result.conditionalFormatting`, in the shape the export's `conditionalFormatting` option takes, and never applied.

## Re-importing an export

A workbook you exported from Handsontable carries its nested headers and row headers as sheet content. Import it with `headerRows` set to the header depth and `rowHeaders: true`, or the second header row lands in the data and the row numbers become a column.

```javascript
await hot.getPlugin('importFile').importFromBlob('xlsx', file, {
  colHeaders: 'firstRow', headerRows: 2, rowHeaders: true,
});
```

A grid with a [`columnSummary`](@/guides/columns/column-summary/column-summary.md) exports the computed total, and the import loads that total back as data, so a summary over the whole column then shows double. Set the summary's `ranges` to stop above the summary row, and pass your endpoints to `updateSettings()` again after an import with more rows.

Imported headers are HTML-escaped, so `R&D` is stored as `R&amp;D`. Set the grid's [`textExtractor`](@/api/options.md#textextractor) option to `true` to re-export them as the text the workbook held.

::: only-for react

## Keep the imported sheet through a re-render

`HotTable` calls `updateSettings` with its props on every render. A re-render of the component that renders `HotTable` sends your original `data` and `colHeaders` again, which replaces the imported sheet and clears its merges and hidden rows. React Compiler can hide this in one component and not in the next, so do not rely on it.

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

## Keep the imported sheet through a settings change

The `hot-table` component passes every key of a new `[settings]` object to `updateSettings`. Keep the settings in one object that nothing replaces, as the demo does. A settings object you bind after an import must leave out `colHeaders` and `columns`, or they replace the imported headers and column types.

## Import outside the Angular zone

The built-in engine awaits once per archive slice, and each await ends a Zone.js turn and runs change detection. Start the import with `NgZone.runOutsideAngular()` and report its status through a signal, as the demo does:

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

## Keep the imported sheet through a settings change

The `HotTable` component watches the settings you pass to it. A later change sends the keys that differ to `updateSettings` again. The imported rows stay, because array `data` is not resent, but your original `colHeaders` and `columns` come back over them. Keep the settings in one stable `ref`, as the demo does, and do not change them after an import.

:::

## Hooks

- [`beforeImport(result, format)`](@/api/hooks.md#beforeimport) runs after mapping and before applying. Return `false` to leave the grid untouched; the promise still resolves with the result. Mutate `result` to change what is applied. The dropped-features warning is already printed by then.
- [`afterImport(result, format)`](@/api/hooks.md#afterimport) runs after the grid was updated.
- Neither hook runs for `apply: false`, or for an import that a newer import replaced (see [Concurrent imports](@/guides/accessories-and-menus/excel-import-export-reference/excel-import-export-reference.md#concurrent-imports)).

## Related

- [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md)
- [Export to CSV](@/guides/accessories-and-menus/export-to-csv/export-to-csv.md)
- [Excel import and export reference](@/guides/accessories-and-menus/excel-import-export-reference/excel-import-export-reference.md) - engines, limits, dropped-feature keys, security, test environments
- [Import from CSV or Excel](@/recipes/import-export/import-csv-excel/import-csv-excel.md) - a drop zone that routes CSV and XLSX files
- [`ImportFile` plugin API](@/api/importFile.md), [`beforeImport`](@/api/hooks.md#beforeimport), [`afterImport`](@/api/hooks.md#afterimport)

---

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
