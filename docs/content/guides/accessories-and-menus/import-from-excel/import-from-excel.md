---
type: how-to
title: Import from Excel
metaTitle: Import from Excel | Handsontable DataGrid for JavaScript
description: Load an Excel (.xlsx) workbook into your grid - cell types, dropdown lists, formulas, comments, merged cells, and hidden rows and columns come from the file.
permalink: /import-from-excel
canonicalUrl: /import-from-excel
tags:
  - infer column types
  - csv
  - paste
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

`result.dropped` lists what the file carried and the grid did not take, and the plugin prints the same list in one console warning per import. The [Dropped features reference](@/guides/import-and-export/dropped-features/dropped-features.md#dropped-on-import) explains every key.

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

`HotTable` calls `updateSettings` with its props on every render. A re-render of the component that renders `HotTable` sends every prop again. Your original `data` and `colHeaders` replace the imported sheet, and props such as `mergeCells={true}` and `hiddenColumns={true}` clear its merges and hidden columns. React Compiler can hide this in one component and not in the next, so do not rely on it.

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

The `HotTable` component watches the settings you pass to it. A later change sends the keys that differ to `updateSettings` again. The imported rows stay, because array-of-arrays `data` is not resent. Your original `colHeaders`, `columns`, and layout options such as `mergeCells: true` and `hiddenColumns: true` do come back, over the imported headers, types, merges, and hidden columns. Keep the settings in one stable `ref`, as the demo does, and do not change them after an import.

:::

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
| `importFormulas` | `boolean` | `true` | Put formulas into the data when the `Formulas` plugin is on. The `_xlfn.` prefixes Excel writes are removed. A function HyperFormula lacks, such as `SORT` or `LET`, imports live and shows an error; set `importFormulas: false` to import the cached values instead. |
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

## Infer column types from raw values

Data that doesn't come from a workbook carries no number formats: rows you parsed from a CSV file, text pasted into cells, or values from an API. To type that data, use the plugin's `inferColumnTypes()` method. It reads the values and returns the column settings, with a header for each column and a measure of how sure it is. The method needs no engine.

```javascript
const rows = [
  ['Name', 'Balance', 'Joined', 'Active', 'Status'],
  ['Alice', '1.234,56', '12.03.2026', 'TRUE', 'Open'],
  ['Bob', '12,5', '13.03.2026', 'false', 'Closed'],
  ['Carol', '7', '14.03.2026', 'true', 'Open'],
  ['Dave', '99', '15.03.2026', 'false', 'Open'],
  ['Eve', '3,5', '16.03.2026', 'true', 'Closed'],
  ['Frank', '40', '17.03.2026', 'false', 'Open'],
];

const importFile = hot.getPlugin('importFile');
const result = importFile.inferColumnTypes(rows, { locale: 'de-DE', headerRow: 'auto' });

console.log(result.headerRow);
// true
console.log(result.columns.map(column => [column.title, column.settings.type]));
// [['Name', 'text'], ['Balance', 'numeric'], ['Joined', 'date'], ['Active', 'checkbox'], ['Status', 'dropdown']]

hot.updateSettings({
  columns: result.columns.map(column => column.settings),
  colHeaders: result.columns.map(column => column.title),
  data: importFile.convertToInferredTypes(rows, result),
});
```

The method returns `{ columns, headerRow }`. Each entry of `columns` keeps the grid's column options apart from what describes the inference:

| Key | Holds |
|---|---|
| `settings` | The column options: `type`, the format of that type (`numericFormat`, `dateFormat`, `timeFormat`, or `source`), and `data` for rows of objects. Pass it to [`columns`](@/api/options.md#columns) as it is. |
| `confidence` | The share of non-blank values the type reads, from `0` to `1`. |
| `inputFormat` | How the raw values were written (the decimal separator, a percent sign, the currency symbol, the day and month order). `convertToInferredTypes()` reads it. |
| `title` | The column's header. Set with a header row, and for rows of objects, where it is the property name. |
| `stats` | A description of the sampled values. Set with the [`stats`](#column-statistics) option. |

Before you load the data, convert it with `convertToInferredTypes(rows, result)`. Each cell type stores its values in a fixed form: a number for `numeric`, `YYYY-MM-DD` for `date`, `HH:mm:ss` for `time`, and a boolean for `checkbox`. If you skip the conversion, the cells keep the raw strings, and `date` and `time` cells reject them. The conversion returns a copy, leaves your rows unchanged, and leaves out the header row, which is in `title`.

Inference works this way:

- **Types.** The method infers `numeric`, `date`, `time`, `checkbox` (`true` and `false`, in any case), `dropdown`, and `text`. When two types read values, the one that reads more of them wins, and the earlier one in that list wins a tie. A `dropdown` is the exception: it reads every string, so it is tried only when no other type reaches `minConfidence`. A numeric column with one `n/a` stays numeric. Date-time values such as `2026-03-12 14:30` and JavaScript `Date` objects stay `text`.
- **Dropdowns.** A column becomes a `dropdown` when it has at least six values, between two and ten distinct ones (see `dropdown`), and each value repeats at least twice on average. Values are compared trimmed, so `Open` and `Open ` are one option, and the conversion writes the trimmed value. A short list of names that repeat can pass that test. Set `dropdown: false` when it is wrong for your data.
- **Numbers.** A numeric value may carry a sign, accounting parentheses (`(1,234.00)`), a currency symbol on either side (`$1,234.50`, `12,5 zł`), a common ISO code set apart by a space (`12.00 USD`, `SEK 7.50`), an exponent (`1.23E+15`), or a trailing percent sign (`12.5%`, converted to `0.125`). A column with a currency reads its bare numbers as that currency. Text values set the fraction digits of the format, so `1.50` and `2.00` print with two. Real numbers don't pad the column: one computed float only raises the maximum. Digits may be grouped with a comma, a dot, or a space of any width. With a dot decimal, an apostrophe works too (`1'234.50`). A symbol that several currencies share takes the currency of the locale's region for the common cases: `$` is `CAD` under `en-CA` and `ARS` under `es-AR`, and `kr` is `NOK` under `nb-NO`. Any other region gets the symbol's default currency: `USD` for `$`, `SEK` for `kr`.
- **Confidence.** A column whose share of readable values is below `minConfidence` falls back to `text`. Blank values don't count. A value the type can't read, such as a `Total` row, keeps its raw form after the conversion, so the cell's validator marks it.
- **Ambiguous values.** The column decides first: `0,5` in a column makes `1.234` mean 1234, and `25/03/2026` makes `12/03/2026` mean 12 March. A date written with dots (`12.03.2026`) reads as day first. When nothing in the column decides, the `locale` option does. It defaults to the grid's [`locale`](@/api/options.md#locale). A date column whose order came from the locale reports `0.95` times its share as its confidence.
- **Codes stay text.** Some values look like numbers but are codes. One value with a leading zero (`02134`) keeps the whole column text, so a ZIP column doesn't lose its zeros. A number with more than 15 significant digits (a card number), and a phone number such as `+48 601 234 567` or `601 234 567` (digits grouped by plain spaces, nine or more, with no currency), also stay text. Converting them to numbers would lose digits. A large amount grouped the way `Intl` writes it, with a no-break space or with a currency (`1 234 567 890 €`), is still a number.
- **Sampling.** The method reads only the first `sampleSize` data rows. A `dropdown` column lists only the options found there, so a later row with another option is marked invalid. Raise `sampleSize` if your data needs it. For rows of objects, every key the sampled rows carry becomes a column.
- **Deterministic results.** In a given browser, the same rows and options always give the same result. The method never reads the browser's locale, and an unsupported locale falls back to `'en-US'`. Separators and date order come from the browser's locale data, so two browsers can disagree on a rare locale.

### Header row

Set `headerRow` when the first row of array data holds column names. The header row is left out of the inference, so a name such as `Price` doesn't count as a stray value in a column of prices. Its cells come back as each column's `title`, and `convertToInferredTypes()` drops the row from the data.

| `headerRow` | Effect |
|---|---|
| `false` (default) | The first row is data. |
| `true` | The first row is a header. |
| `'auto'` | The first row is a header when every cell of it is a non-blank string that isn't a missing-value word, there is at least one column below it that reads as a number, a date, a time, or a checkbox, and none of those columns reads its cell of the first row. |

`result.headerRow` tells you what `'auto'` decided. A table of text only has nothing that tells a header from a row, so `'auto'` reads it as data: set `headerRow: true` for such a table. A first row with a missing value written as text (`n/a`, `-`, `null`, `none`, `unknown`) is read as a record. A missing value written another way can still make a record look like a header, and `convertToInferredTypes()` drops that row. Set `headerRow` to `true` or `false` when your first row is known. Rows of objects have no header row, and `title` is the property name.

### Column statistics

Set `stats: true` to add a `stats` object to each column. It describes the sampled values, which is what you want to show a person, or to send to a language model that decides what the column means.

```javascript
const { columns } = importFile.inferColumnTypes(rows, { headerRow: true, stats: true });

console.log(columns[1].stats);
// {
//   count: 6,
//   emptyCount: 0,
//   distinctCount: 6,
//   examples: ['1.234,56', '12,5', '7', '99', '3,5'],
//   min: 3.5,
//   max: 1234.56,
//   runnerUpType: 'text',
// }
```

| Key | Holds |
|---|---|
| `count` | How many sampled values are not blank. |
| `emptyCount` | How many sampled values are blank. |
| `distinctCount` | How many different non-blank values there are, compared as trimmed text. |
| `examples` | The first distinct values, as trimmed text. `stats: { examples: 3 }` sets how many. The default is 5. |
| `min`, `max` | The smallest and largest value of a `numeric` (a number), `date` (`YYYY-MM-DD`), or `time` (`HH:mm:ss`) column, after conversion. |
| `runnerUpType` | The other type that reads the largest share of the values. For a `text` column, the type that came closest to `minConfidence`. A type with no rival gets `'text'`. |

The statistics come from the sampled rows only, in a fixed order, so they are deterministic too.

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `sampleSize` | `number` | `1000` | How many data rows, from the top, to read. `Infinity` reads every row. |
| `locale` | `string` | the grid's `locale` | Settles a column whose values don't decide the decimal separator or the day and month order. |
| `minConfidence` | `number` | `0.9` | The share of non-blank values a type has to read, from `0` to `1`. |
| `dropdown` | `boolean \| { maxOptions?: number }` | `true` | Whether a column of repeated strings becomes a `dropdown`, and how many distinct values it may have (`10` by default, `0` turns it off). |
| `headerRow` | `boolean \| 'auto'` | `false` | Whether the first row of array data is a header. See [Header row](#header-row). |
| `stats` | `boolean \| { examples?: number }` | `false` | Whether to describe the sampled values of each column. See [Column statistics](#column-statistics). |

To infer types without a grid, import the same functions from the plugin module: `import { inferColumnTypes, convertToInferredTypes } from 'handsontable/plugins/importFile';`. Without a grid, `locale` defaults to `'en-US'`. A bundler drops the rest of the plugin from your build when you use only these two functions.

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
