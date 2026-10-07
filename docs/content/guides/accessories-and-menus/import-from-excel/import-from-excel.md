---
type: how-to
title: Import from Excel
metaTitle: Import from Excel - JavaScript Data Grid | Handsontable
description: Load an Excel (.xlsx) workbook into your grid, with cell types, dropdown sources, formulas, merged cells, hidden rows and columns, and frozen panes derived from the file.
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
category: Accessories and menus
menuTag: new
addedIn: "19.0.0"
---

Load an Excel (`.xlsx`) workbook into your grid. The `ImportFile` plugin reads the file with its built-in engine, derives cell types from number formats, and applies the layout the workbook carries.

[[toc]]

## Prerequisites

- Register the `ImportFile` plugin (it is part of `registerAllModules()`). No other library is needed.
- If you register modules one by one, register the cell types the import can derive: `numeric`, `date`, `intl-datetime`, `time`, `checkbox`, and `dropdown`. A column whose type is not registered imports as `text`, and the type is reported as `cellType:<name>` in `result.dropped`.
- Register the [`MergeCells`](@/api/mergeCells.md), [`HiddenRows`](@/api/hiddenRows.md), and [`HiddenColumns`](@/api/hiddenColumns.md) plugins to apply a workbook's merged cells and hidden rows and columns. Without the plugin, the import reports `mergeCells`, `hiddenRows`, or `hiddenColumns` in `result.dropped`.

### Requirements

The built-in engine needs four globals: `CompressionStream`, `DecompressionStream`, `TextEncoder`, and `TextDecoder`. Every browser Handsontable supports provides them. A test environment can lack them - a jsdom environment (in Jest or Vitest), or Jest 27's `node` environment. The import then rejects with a message that names the missing globals. Jest's `node` environment provides all four from Jest 28 on.

To run the built-in engine in such an environment, assign the four globals from Node.js before the test runs, for example in a Jest `setupFiles` module:

```javascript
const { CompressionStream, DecompressionStream } = require('node:stream/web');
const { TextEncoder, TextDecoder } = require('node:util');

Object.assign(globalThis, { CompressionStream, DecompressionStream, TextEncoder, TextDecoder });
```

jsdom's `Blob` has no `arrayBuffer()` method, so `importFromBlob()` fails in a jsdom test with any engine. Read the file into an `ArrayBuffer` and call `importFromArrayBuffer()` instead.

You can also inject ExcelJS through the `engines` option. On Jest 29 with `jest-environment-jsdom`, loading ExcelJS fails with `SyntaxError: Unexpected token 'export'`, because that environment resolves the `browser` export condition. Set `testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] }` in your Jest configuration to load it.

## Engines

The plugin reads `.xlsx` files with a built-in engine. ExcelJS is an alternative engine, not a requirement. To read through [ExcelJS](https://github.com/exceljs/exceljs) instead - for example when your export already runs on it - install ExcelJS 4.4 or later and pass it through the `engines` option: `importFile: { engines: { xlsx: ExcelJS } }`. The per-feature table in the [export guide](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md#engines) covers both engines and both directions.

`engines` is keyed by format, so a map that names no `xlsx` engine reads `.xlsx` with the built-in engine, the same way `importFile: true` does. Pass a different engine for one call only with the `engine` option in `importFromArrayBuffer(format, buffer, options)` or `importFromBlob(format, blob, options)`. An `engine` of `null`, or no `engine` key at all, means no override: the call keeps the engine `engines` configured, or the built-in engine when `engines` names none for the format. The export direction resolves its own `engine` option the same way.

Read files saved by LibreOffice or SheetJS with the built-in engine. ExcelJS 4.4 reads a boolean attribute only when it is spelled `"1"`, and those applications spell it `"true"`. Through the ExcelJS engine, such a file then imports differently, with nothing in `result.dropped`:

- A protected sheet with no password (`sheet="true"`) imports unprotected, and an unlocked cell (`locked="false"`) is not recognized as unlocked. A password-protected sheet imports protected on both engines.
- A right-to-left sheet (`rightToLeft="true"`) reports `layoutDirection: 'ltr'`.
- A workbook in the 1904 date system (`date1904="true"`) shifts every date back by 1,462 days.
- A SheetJS date cell stored as `t="d"` imports as a wrong date.

The built-in engine reads a `t="d"` date cell only when its value is an ISO 8601 date, such as `2024-01-15` or `2024-01-15T12:00:00`. It imports any other value as an empty cell rather than guess its time zone, and reports it as `cellValue:date`.

Three more differences come from ExcelJS itself, whatever wrote the file. A formula whose cached result is an empty string imports with no value when the Formulas plugin is off. A number format with an escaped percent sign, such as `0.0\%` (a literal `%`, shown as `12.5%` in Excel), reads as a percentage, so a cell holding `12.5` shows `1250.0%`; the built-in engine shows `12.5`. A cell that uses one of the built-in currency or accounting formats (ids 5-8 and 41-44) without a custom number format entry imports with no number format. For example, `1234.5678` under id 7 shows as `1234.5678`, where the built-in engine shows `$1,234.57`.
## Steps

1. Enable the plugin.

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

   ```js
   const hotSettings = ref({
     importFile: true,
     licenseKey: 'non-commercial-and-evaluation',
   });
   ```

   :::

2. Import a file picked by the user.

   ```javascript
   fileInput.addEventListener('change', async () => {
     const [file] = fileInput.files;

     try {
       const result = await hot.getPlugin('importFile').importFromBlob('xlsx', file, {
         colHeaders: 'firstRow',
       });

       console.log(result.dropped); // features the engine could not recover, for example cellStyles
     } catch (error) {
       status.textContent = error.message; // a refused file says what to do, and the grid keeps its data
     } finally {
       fileInput.value = ''; // lets the user pick the same file again
     }
   });
   ```

3. Inspect the result before applying it, for a large file or one from an untrusted source.

   ```javascript
   const preview = await hot.getPlugin('importFile').importFromArrayBuffer('xlsx', buffer, { apply: false });

   if (preview.data.length <= 10000) {
     await hot.getPlugin('importFile').importFromArrayBuffer('xlsx', buffer);
   }
   ```

## Result

The grid shows the workbook's data with headers, types, dropdown sources, layout, formulas (when the [Formulas](@/guides/formulas/formula-calculation/formula-calculation.md) plugin is enabled), and cell comments (when the [Comments](@/guides/cell-features/comments/comments.md) plugin is enabled).

Cell styling is applied only when you set [`importStyles: true`](#styles). Without it, styling is read but not applied, and appears in `result.dropped` as `cellStyles`. Conditional formatting is never applied - the grid has no plugin for it - but it is no longer lost: it comes back on `result.conditionalFormatting`, in grid coordinates and in the shape the export's `conditionalFormatting` option takes. Pass `result.conditionalFormatting` to [`exportFile`](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md)'s `conditionalFormatting` option to carry the rules back into a file.

The plugin also reports every dropped feature in one console warning per import call, naming the engine. With `importStyles` off, a workbook that carries any cell styling reports it this way:

```text
The "native" xlsx engine dropped features it cannot write or read: cellStyles.
```

Expect `cellStyles` on almost any real workbook read through the ExcelJS engine: ExcelJS resolves a cell's default font and fill into a style object whenever the cell carries any format index at all, so it reports styling even on cells you never formatted yourself. The built-in engine reports `cellStyles` only when a cell carries styling that is actually there. It reads the default alignment LibreOffice writes on every cell (`horizontal="general"` with `vertical="bottom"`) as no styling, so a plain LibreOffice-saved file reports no `cellStyles` either.

Three keys on the result carry features that need more than a cell value. Each row says whether the grid applies it:

| Key | What it carries |
|---|---|
| `nestedHeaders` | The promoted header band when `headerRows` is above `1`. It is applied - `updateSettings` both configures and enables the [`NestedHeaders`](@/api/nestedHeaders.md) plugin - and `colHeaders` is absent whenever it is present. A later import that promotes a single header row instead clears a previously applied `nestedHeaders` setting automatically, so the new `colHeaders` renders. |
| `conditionalFormatting` | One entry per rectangle the workbook's rules cover, as `{ rows: [first, last], cols: [first, last], rules }` in zero-based, inclusive grid coordinates. The `rules` are ExcelJS-compatible rule objects (`type`, `operator`, `formulae`, `style`, …), passed through untouched. Nothing applies them. |
| `layoutDirection` | `'rtl'` or `'ltr'`, the sheet's own direction. Nothing applies it - see below. |

These are the keys the import can report, beyond `cellStyles`:

| Key | What it means |
|---|---|
| `images` | The sheet carries embedded images. The grid has no cell-level home for them. The built-in engine reports it only when the sheet's drawing holds a picture or a shape, so the empty drawing Google Sheets writes into every sheet is not reported. |
| `cellValue:date` | Built-in engine only: a date cell stored as `t="d"` whose value is not an ISO 8601 date. The cell imports empty. |
| `definedNames:truncated` | Built-in engine only: the workbook defines more than 65,536 names. The names past that limit are not read, so a formula that uses one of them can show `#NAME?`. |
| `tables` | The sheet defines one or more Excel tables. Their cell values are imported; the table definition is not. |
| `autoFilter` | The sheet carries an auto-filter range. Configure the [Filters](@/guides/columns/column-filter/column-filter.md) plugin on the target grid instead. |
| `hyperlink` | A cell is a hyperlink. Its display text is imported; the target URL is not. |
| `richText` | A cell mixes formatting inside one string. The text is imported; the per-run formatting is not. |
| `sheetProtection:password` | The sheet is protected with a password. The file carries only a salted hash, so no password can be recovered - `readOnly` cells are still derived from the protection. |
| `merge:overlap` | Two merged ranges overlap. The later one is skipped. |
| `cellStyles:borders` | The workbook carries borders and the `CustomBorders` plugin is not enabled on the target grid. |
| `comments` | The workbook carries cell comments and the `Comments` plugin is not enabled on the target grid. Set `comments: true` on the grid to import them. |
| `threadedComments` | The workbook carries threaded comments (Excel 365). Each thread is imported as a cell comment holding the comment and its replies, one per line, without the notice Excel writes in front of it for older applications. Who wrote each entry, and when, is not imported. |
| `comment:unreadable` | ExcelJS engine only: a cell comment stored as plain text, not as formatted text runs. ExcelJS 4.4 reads only the runs, so the comment has no text and is not imported. The built-in engine reads it. |
| `layoutDirection` | The sheet's layout direction disagrees with the grid's. Handsontable resolves [`layoutDirection`](@/api/options.md#layoutdirection) at initialization and ignores it afterwards, so construct the grid with `layoutDirection: 'rtl'` to follow a right-to-left workbook. The direction is on `result.layoutDirection` either way. |
| `dataValidation:<type>` | A non-list data validation, which has no grid equivalent. |
| `chartSheets` | The workbook holds a chart sheet. It is skipped; the other sheets keep their relative order, so a numeric `sheet` index counts worksheets only. |
| `dialogSheets` | The workbook holds a dialog sheet. It is skipped; the other sheets keep their relative order, so a numeric `sheet` index counts worksheets only. |
| `macroSheets` | The workbook holds a macro sheet. It is skipped; the other sheets keep their relative order, so a numeric `sheet` index counts worksheets only. |
| `vbaProject` | The workbook carries macros (a VBA project, as in an `.xlsm` file). The cell data is imported; the macros are never read or run. |
| `conditionalFormatting:unparsedRef` | A conditional formatting range the plugin could not parse. The rule's other ranges still apply. |
| `dataValidation:unresolvedList` | A list validation whose source cannot be read - a formula such as `INDIRECT()`, or a range on a sheet the workbook does not contain. An inline list and a range on the same or another sheet become a `dropdown` column. |
| `numFmt:<pattern>` | A number format with no `Intl.NumberFormat` equivalent - scientific notation, a fraction, more than the 100 fraction digits `Intl.NumberFormat` accepts, an elapsed-time value past what a `time` cell can show, or a format longer than Excel's 255-character limit. Only the first section of a number format and its unquoted tokens are read. A format whose negative section shows something other than a minus sign, such as the parentheses of `#,##0;(#,##0)` or Excel's built-in currency and accounting formats, keeps its positive formatting and is also reported here, because negative numbers show with a minus sign. A format with a condition section, such as `[>=1000]0.0,"K";0`, and a format that scales by a trailing comma, such as `#,##0,`, are not applied: the raw number shows. A condition section is never read as a date, even when the reader drops the escape in front of a letter, as ExcelJS does with LibreOffice's `\M`. A zero-padded format, such as `00000` for a ZIP code, keeps its leading zeros. Quoted text inside a date format, such as `"of"` in `d "of" mmmm yyyy`, is not shown and not reported. |
| `formula:outOfRange` | A formula referencing a cell outside the imported window. Its cached value is imported instead. |
| `formula:otherSheet` | A formula referencing a sheet the Formulas plugin's engine does not hold, such as `Rates!A1`, another workbook (`[1]Sheet1!A1`), or a range of sheets (`Sheet1:Sheet3!A1`). HyperFormula would show `#REF!` for it, so its cached value is imported instead and the formula is listed in `result.formulas`. A reference to a sheet the engine holds stays a live formula. A reference that names the imported sheet itself, such as `=Sheet1!B2*2` in `Sheet1`, is read as a reference to the grid's own cells. |
| `formula:definedName` | A formula using a name the workbook defines, such as `=SUM(Sales)`, that the Formulas plugin's engine does not define. HyperFormula would show `#NAME?` for it, so its cached value is imported instead. To keep the formula live, add the name to the engine before the import. A name over a range, such as `Sales`, goes on a pre-built HyperFormula instance (see [named expressions](@/guides/formulas/formula-calculation/formula-calculation.md#named-expressions)), because the `namedExpressions` setting runs before the sheet exists and gives `#REF!`. Use `namedExpressions` for plain values only, such as `{ name: 'Rate', expression: 0.07 }`. |
| `cellType:<name>` | A column or cell the import gave a cell type that is not registered, such as `cellType:intl-datetime` when you register modules one by one. The cells import as `text`. Register the cell type to keep it. |
| `mergeCells` | The workbook carries merged cells and the `MergeCells` plugin is not registered. |
| `hiddenRows` | The workbook hides rows and the `HiddenRows` plugin is not registered. |
| `hiddenColumns` | The workbook hides columns and the `HiddenColumns` plugin is not registered. |
| `conditionalFormatting:<kind>` | Built-in engine only: a `colorScale`, `dataBar`, or `iconSet` rule. The built-in engine does not read the thresholds these rules need, so it leaves the rule out of `result.conditionalFormatting` rather than return a rule that an export cannot write. The ExcelJS engine reads such rules complete. |
| `formula:tooLong` | A cell's formula is longer than 32,768 characters. The cell keeps its last calculated value; the formula is not imported. |

The two keys that end in a value the file wrote - `dataValidation:<type>` and `numFmt:<pattern>` - are bounded, because the workbook is untrusted input. The value is cut to 64 characters and its control characters are replaced, and after 32 distinct values in one import the rest are reported as `dataValidation:other` or `numFmt:other`. The counts stay complete either way.

Click **Import XLSX** and pick a `.xlsx` file to load it into the grid below.

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

::: only-for react

### Keep the imported sheet through a re-render

`HotTable` calls `updateSettings` with its props on every render. A re-render of the component that renders `HotTable` sends your original `data` and `colHeaders` back to the grid, which replaces the imported sheet. It also clears the merged cells and hidden rows the import set. Any parent state, context, or prop change can cause such a re-render.

To keep the imported sheet:

- Keep import state, such as a status text, out of the component that renders `HotTable`. The example above keeps it in its own `ImportControls` component.
- Render `HotTable` inside a `React.memo` component with stable props, so a re-render of a parent does not reach it:

  ```jsx
  const hotData = [['Ana García', 'Engineering', 98000]];

  const Grid = React.memo(({ hotRef }) => (
    <HotTable
      ref={hotRef}
      data={hotData}
      importFile={true}
      licenseKey="non-commercial-and-evaluation"
    />
  ));
  ```

Keeping only `data` in state is not enough. The next render then shows the file's rows under your original `colHeaders`, so every key the import writes would have to move into state too.

:::

::: only-for vue

### Keep the imported sheet through a settings change

The `HotTable` component watches the settings you pass to it. A later change to those settings sends your original `data`, `colHeaders`, and `columns` (whichever you set) to `updateSettings` again, which replaces the imported sheet. This happens when you replace the settings object, change one of its keys, or bind an option such as `:read-only` that later changes. Keep the settings in one stable `ref`, as the example above does, and do not change them after an import.

:::

## Options

Pass these options as the third argument to `importFromArrayBuffer(format, buffer, options)` or `importFromBlob(format, blob, options)`. `importFromArrayBuffer()` also accepts a view over a buffer, such as a `Uint8Array`.

| Option | Type | Default | Description |
|---|---|---|---|
| `sheet` | `string \| number` | `0` | Sheet to import, by index among the sheets that are not very hidden - a hidden sheet still counts, except the `_HotValidation` sheet an export writes for its dropdown lists - or by name. |
| `colHeaders` | `boolean \| 'firstRow'` | `false` | `'firstRow'` promotes the first row to column headers. |
| `headerRows` | `number` | `1` | How many rows the header band spans, with `colHeaders: 'firstRow'`. Above `1`, those rows become [nested headers](@/guides/columns/column-groups/column-groups.md) instead of `colHeaders`, and the data starts after them. Has to be an integer of at least `1` - an invalid value is rejected even when `colHeaders` is not `'firstRow'`. Otherwise ignored unless `colHeaders` is `'firstRow'`. |
| `rowHeaders` | `boolean` | `false` | Drop the first column and enable generated row headers. |
| `range` | `number[]` | whole sheet | `[startRow, startColumn, endRow, endColumn]` in sheet coordinates. |
| `inferCellTypes` | `boolean` | `true` | Derive `numeric`, `date`, `intl-datetime`, `time`, `checkbox`, and `dropdown` types. A `numeric` type carries `Intl.NumberFormat` options, and a `date`, `intl-datetime`, or `time` type carries `Intl.DateTimeFormatOptions` in `dateFormat`, `dateTimeFormat`, or `timeFormat`, all derived from the cell's number format. A number format with both a date and a time part becomes an `intl-datetime` cell whose value is a `YYYY-MM-DD HH:mm:ss` string. An elapsed-time format, such as `[h]:mm` or `[mm]:ss`, becomes a `time` cell when the value fits what a clock shows: under 24 hours for `[h]`, under an hour for `[m]`, and under a minute for `[s]`. A longer or negative duration, such as `25:30` under `[h]:mm` or 90 minutes under `[mm]:ss`, stays a `numeric` cell holding the Excel serial, with the format reported as `numFmt:<pattern>` in `result.dropped`, because a `time` cell would lose the whole days or hours from the data. A currency symbol in quotes, such as `"$"#,##0.00`, is kept in the `numeric` format. A number under the BOOLEAN format `"TRUE";"TRUE";"FALSE"`, which Excel writes for a cell formatted as TRUE or FALSE, becomes a `checkbox` cell, checked for any value other than 0. The type most cells of a column share becomes the column's type in `columns`; the cells that differ get their own entry in `cellsMeta`. Passing `columns` to the grid replaces any `columns` setting it had and fixes its column count, so the plugin omits it when no column carries a type, a `readOnly` flag, or a class name. When the grid already has a `columns` setting in that case, the plugin sends one empty column setting per imported column instead, so the previous file's types do not survive. |
| `importFormulas` | `boolean` | `true` | Put formulas into the data when the `Formulas` plugin is enabled. Excel stores a function added after Excel 2007 with a prefix, such as `_xlfn.STDEV.S(A1:A3)`. The plugin removes the `_xlfn.`, `_xlws.`, and `_xlpm.` prefixes, so the formula reads `=STDEV.S(A1:A3)`, as in Excel's formula bar. The entries in `result.formulas` carry no prefix either. |
| `importLayout` | `boolean` | `true` | Merges, hidden rows and columns, frozen panes, widths, and heights. An import describes the whole sheet: merges, hidden rows and columns, frozen panes, custom borders, column widths, and row heights that a previous import left on the grid and this workbook does not carry are reset. The imported lists are merged into an existing `hiddenRows`, `hiddenColumns`, or `mergeCells` options object, so options such as `indicators` survive. |
| `apply` | `boolean` | `true` | Apply the result to the grid. |
| `engine` | `object \| null` | - | Per-call engine override. `null` or an absent key means no override: the import uses the `engines` entry, or the built-in engine when there is none. |
| `importStyles` | `boolean` | `false` | Apply alignment, font, fill, and borders from the workbook. |

### Several imports at once

When you start a new import before the previous one finishes, the import you started last wins. The earlier call is not applied: its promise rejects with `a newer import started before this one finished`, and `afterImport` does not fire for it. This holds even when the earlier file finishes reading first, so the grid never shows a file you already replaced. An import with `apply: false` never touches the grid, so it neither cancels another import nor is cancelled by one. A call that is refused before it reads the file, for example for an unsupported format, does not cancel anything either.

### Re-importing an export

A workbook you exported from Handsontable carries its nested headers and its row headers as ordinary sheet content. Import it with `headerRows` set to the header depth and `rowHeaders: true`, or the second header row lands in the data and the row numbers become a column.

```javascript
await hot.getPlugin('importFile').importFromBlob('xlsx', file, {
  colHeaders: 'firstRow', headerRows: 2, rowHeaders: true,
});
```

A grid with a [`columnSummary`](@/guides/columns/column-summary/column-summary.md) exports the computed total into the summary cell, and the import loads that total back as data. By default, the summary range covers the whole column, so the summary then adds its own previous total and shows double. Set the summary's `ranges` to stop above the summary row.

Neither an import nor [`loadData()`](@/api/core.md#loaddata) re-derives the summary's endpoints. An endpoint with `reversedRowCoords: true` keeps the destination row it computed for the previous data, so after you import a file with more rows, the summary overwrites an imported value. Turn the summary off with `updateSettings({ columnSummary: false })` before the import, and pass your endpoints to `updateSettings()` again after it.

Headers you import are HTML-escaped (see [Security](#security)), so `R&D` is stored as `R&amp;D`. To re-export imported headers as the text the workbook held, set the grid's [`textExtractor`](@/api/options.md#textextractor) option to `true`. Without it, the exported file shows `R&amp;D`.

### Dates and times

A `date`, `intl-datetime`, or `time` cell shows its value through the browser's `Intl.DateTimeFormat`, so the text can differ between browsers. For example, with a short month, Chrome and Firefox show `Mar 14, 2024, 13:45`, and Safari shows `Mar 14, 2024 at 13:45`. The stored value is the same in every browser.

An `intl-datetime` cell shows its stored `YYYY-MM-DD HH:mm:ss` text as a time in the viewer's time zone. A time that falls into a daylight saving gap in that zone, such as `2024-03-10 02:30:00` in New York, shows one hour later. The stored value does not change.

## Styles

By default, the plugin reads cell styling from the workbook but doesn't apply it - it reports `cellStyles` in `result.dropped` instead. Set `importStyles: true` to apply alignment, font, fill, and border styling to the imported cells.

```javascript
await hot.getPlugin('importFile').importFromBlob('xlsx', file, {
  colHeaders: 'firstRow',
  importStyles: true,
});
```

Styling maps to the grid this way:

| Workbook style | Grid result |
|---|---|
| Horizontal and vertical alignment | A class name (`htLeft`, `htCenter`, `htRight`, `htJustify`, `htTop`, `htMiddle`, `htBottom`) on `result.cellsMeta[].meta.className` |
| Bold, italic, underline, and font color | A generated class name on `result.cellsMeta[].meta.className`, with the CSS declarations in `result.styles` |
| Background fill | The same generated class name and declaration, added to `result.styles` |
| Borders | An entry in `result.customBorders`, in the shape the [`CustomBorders`](@/api/customBorders.md) plugin's `customBorders` option takes |

The plugin installs `result.styles` for you: it writes one `<style>` element, owned by the grid instance, that holds a rule per generated class name. Destroying the grid removes this element, and an import that carries no styling removes it too, so one import never leaves the previous one's rules behind. Colors that the workbook doesn't write as plain hex are skipped rather than turned into a declaration.

`result.customBorders` passes straight to `updateSettings`, so enable the [`CustomBorders`](@/guides/cell-features/formatting-cells/formatting-cells.md) plugin on the target grid - otherwise borders are dropped and reported as `cellStyles:borders`. Two consequences follow from that passthrough:

- An import that carries any border **replaces** the target grid's existing borders. `updateSettings` restarts the `CustomBorders` plugin with the new setting, so borders you configured before the import are gone.
- A workbook with no borders at all leaves the target grid's borders untouched, because the result then carries no `customBorders` key for `updateSettings` to apply.

Font size and font name aren't imported: the model doesn't carry them today. Conditional formatting is read into `result.conditionalFormatting` and never applied.

## Security

The workbook is untrusted input, and the plugin treats it that way:

- **Column headers are escaped.** Handsontable renders `colHeaders` as HTML, so a promoted header row is markup unless something stops it. Every header the plugin promotes is HTML-escaped, which also keeps text such as `5 < 10` whole. If you replace the headers with your own unescaped markup after the import, you own that decision - configure the [`sanitizer`](@/api/options.md#sanitizer) option to police it. An escaped header that held `&`, `<`, `>`, `"`, or `'` reaches the header's HTML path as an entity, so on a page that enforces Trusted Types, configure `sanitizer` before you import headers. Without it, such an import rejects. A grid that re-exports imported headers needs [`textExtractor: true`](@/api/options.md#textextractor), or the file holds the escaped text, such as `R&amp;D`.
- **Cell values are rendered as text.** They are not projected through any HTML path, so they need no escaping and keep whatever the file wrote.
- **A text value that starts with `=` stays text.** Such a cell is inert in Excel, but the grid hands every `=`-leading string to HyperFormula. When the [Formulas](@/guides/formulas/formula-calculation/formula-calculation.md) plugin is enabled, the plugin writes the value with a leading apostrophe - the formula plugin's own text escape, which the grid renders without the apostrophe - so the file's text cannot become a live formula. A cell the file declares as a formula is imported as one, as before. When the Formulas plugin is off, nothing escapes such text: the grid shows it as text, but an export with `exportFormulas: true` writes every `=`-leading text as a live formula. Keep `exportFormulas` off for a grid that holds imported data and has no Formulas plugin.
- **A text value that starts with `'=` keeps its apostrophe.** The apostrophe followed by `=` is the escape the Formulas plugin strips on read, so a cell whose text really begins that way would lose the character the file carried. When the Formulas plugin is enabled, such a value is escaped too, so the data holds `''=x`. The cell displays the doubled apostrophe, and a re-export writes it, because the Formulas plugin recognizes exactly one escape level. For the same reason a file cell reading `'=x` and one reading `''=x` both come back as `''=x`. A value that starts with an apostrophe followed by anything else is imported unchanged, because the grid does not read it as an escape either.
- **Colors are validated before they reach a stylesheet.** A color that is not a plain hex value is skipped rather than turned into a CSS declaration. The generated stylesheet accepts only the bold, italic, underline, text color, and fill declarations the plugin writes.
- **Layout values are bounded.** A column width that is not a positive number, or that goes beyond 260 width units (Excel's 255-character maximum plus its padding), is skipped. So is a row height that is not a positive number or goes beyond 409.5 points. A frozen pane count is rounded down to a whole number, and a hidden row or column index that is not a whole number is skipped on its own, so the other hidden rows and columns stay hidden.
- **Overlong number formats are not parsed.** A number format longer than 255 characters, Excel's own limit, is reported as `numFmt:<pattern>` in `result.dropped`, and its cells get the `numeric` type with no number format.
- **Only spreadsheet workbooks are read.** The built-in engine reads `.xlsx`, `.xlsm`, `.xltx`, `.xltm`, and `.xlam` files. A macro-enabled file is read like an `.xlsx` file: its macros are never opened or run, and they are reported as `vbaProject` in `result.dropped`. A package that declares its main part as anything else is refused. An Excel Binary Workbook (`.xlsb`) is refused with a message that tells you to save it as `.xlsx`. A legacy Excel 97-2003 file (`.xls`) and a password-protected workbook are refused too, because both are stored in a different container format. Hyperlink targets, external links, and embedded objects are not read.
- **Oversized input is refused.** A file above 128 MiB is rejected before the engine parses it. After the parse, a sheet declaring more than 1,048,576 rows, 16,384 columns, or 5,000,000 cells is refused before the plugin allocates anything for it. A workbook whose sheets together declare more than 10,000,000 cells is refused too. A file can declare a size it does not hold, and reading it at face value exhausts the tab. The built-in engine also bounds its own parse. It stops inflating the archive past 256 MiB in total or 512 MiB for one entry, it refuses a workbook that declares more than 2,048 sheets, and it caps the work it spends translating shared formulas. Because of the 256 MiB total, a re-import of the built-in engine's own export tops out at about 3,000,000 cells, below the cell caps. When you inject ExcelJS through the `engines` option, ExcelJS runs its own parse, so only the byte cap bounds it. ExcelJS 4.4.0 can also be made to change `Object.prototype` in your page by a crafted workbook, such as one with a sheet named `__proto__` and a defined name that points at it. Read files from untrusted sources with the built-in engine. The caps are security bounds, not a promise of comfort: a sheet near the 5,000,000-cell cap takes tens of seconds to read and map and several gigabytes of memory, which is more than a browser tab is usually given. Keep imports well below the cap, or split the workbook.
- **Per-cell settings are bounded.** The plugin applies a setting a whole column shares once, to the column, and gives a cell its own setting only where it differs. A sheet whose per-cell settings would cover more than 1,000,000 cells, or more cells than hold data when that is higher, is refused while it is being read. The bound covers per-cell meta, the style class names a column cannot share, and borders (one `customBorders` entry per bordered cell). Only a file with little data under its settings reaches it: two list validations with different lists that split a million empty rows, or a small file that styles or borders a million empty cells, for example.
- **References are bounded.** A list validation or conditional formatting range that reaches past the sheet limits is not read, and one that spans a whole column or row is clamped to the cells the sheet holds.
- **A sheet part must be a worksheet part.** The built-in engine reads a sheet from a part the package's `[Content_Types].xml` types as a worksheet, through an `<Override>` for that part or a worksheet `<Default>` for its extension. It also reads a part typed only by the generic `<Default Extension="xml" ContentType="application/xml"/>`, which some third-party generators write. A sheet whose part is typed as anything else, or that points at the workbook, styles, or shared strings part, is refused with `the sheet "<name>" has no worksheet part.`

## Hooks

- [`beforeImport(result, format)`](@/api/hooks.md#beforeimport) runs after mapping and before applying. Return `false` to keep the grid untouched. Mutate `result` to change what is applied.
- [`afterImport(result, format)`](@/api/hooks.md#afterimport) runs after the grid was updated. It does not fire for an import that a newer import replaced (see [Several imports at once](#several-imports-at-once)).

## Related

- [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md)
- [`ImportFile` plugin API](@/api/importFile.md)
- [`beforeImport`](@/api/hooks.md#beforeimport), [`afterImport`](@/api/hooks.md#afterimport)

---

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
