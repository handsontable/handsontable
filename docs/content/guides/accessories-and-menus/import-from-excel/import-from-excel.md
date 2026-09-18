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
---

Load an Excel (`.xlsx`) workbook into your grid. The `ImportFile` plugin reads the file through an engine you provide, derives cell types from number formats, and applies the layout the workbook carries.

[[toc]]

## Prerequisites

- Install [ExcelJS](https://github.com/exceljs/exceljs), the engine that powers XLSX import. The supported version range is **`^4.4.0`**.

  ```shell
  npm install exceljs
  ```

## Engines

XLSX import goes through an engine you inject, the same way the export does. ExcelJS is the only supported engine; the per-feature table in the [export guide](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md#engines) covers both directions.

## Steps

1. Pass the engine to the plugin.

   ::: only-for javascript

   ```javascript
   import ExcelJS from 'exceljs';

   const hot = new Handsontable(container, {
     importFile: { engines: { xlsx: ExcelJS } },
     licenseKey: 'non-commercial-and-evaluation',
   });
   ```

   :::

   ::: only-for react

   ```jsx
   import ExcelJS from 'exceljs';

   <HotTable
     importFile={{ engines: { xlsx: ExcelJS } }}
     licenseKey="non-commercial-and-evaluation"
   />
   ```

   :::

   ::: only-for angular

   ```typescript
   import ExcelJS from 'exceljs';

   readonly hotSettings: GridSettings = {
     importFile: { engines: { xlsx: ExcelJS } },
     licenseKey: 'non-commercial-and-evaluation',
   };
   ```

   :::

   ::: only-for vue

   ```js
   import ExcelJS from 'exceljs';

   const hotSettings = ref({
     importFile: { engines: { xlsx: ExcelJS } },
     licenseKey: 'non-commercial-and-evaluation',
   });
   ```

   :::

2. Import a file picked by the user.

   ```javascript
   fileInput.addEventListener('change', async () => {
     const [file] = fileInput.files;
     const result = await hot.getPlugin('importFile').importFromBlob('xlsx', file, {
       colHeaders: 'firstRow',
     });

     console.log(result.dropped); // features the engine could not recover, for example cellStyles
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
The "exceljs" xlsx engine dropped features it cannot write or read: cellStyles.
```

Expect `cellStyles` on almost any real workbook: Excel assigns a style to most cells you have used, even ones you never formatted yourself, so the plugin sees styling to report whether or not the sheet looks styled.

Three keys on the result carry features that need more than a cell value. Each row says whether the grid applies it:

| Key | What it carries |
|---|---|
| `nestedHeaders` | The promoted header band when `headerRows` is above `1`. It is applied - `updateSettings` both configures and enables the [`NestedHeaders`](@/api/nestedHeaders.md) plugin - and `colHeaders` is absent whenever it is present. A later import that promotes a single header row instead clears a previously applied `nestedHeaders` setting automatically, so the new `colHeaders` renders. |
| `conditionalFormatting` | One entry per rectangle the workbook's rules cover, as `{ rows: [first, last], cols: [first, last], rules }` in zero-based, inclusive grid coordinates. The `rules` are the engine's own rule objects, passed through untouched. Nothing applies them. |
| `layoutDirection` | `'rtl'` or `'ltr'`, the sheet's own direction. Nothing applies it - see below. |

These are the keys the import can report, beyond `cellStyles`:

| Key | What it means |
|---|---|
| `images` | The sheet carries embedded images. The grid has no cell-level home for them. |
| `tables` | The sheet defines one or more Excel tables. Their cell values are imported; the table definition is not. |
| `autoFilter` | The sheet carries an auto-filter range. Configure the [Filters](@/guides/columns/column-filter/column-filter.md) plugin on the target grid instead. |
| `hyperlink` | A cell is a hyperlink. Its display text is imported; the target URL is not. |
| `richText` | A cell mixes formatting inside one string. The text is imported; the per-run formatting is not. |
| `sheetProtection:password` | The sheet is protected with a password. The file carries only a salted hash, so no password can be recovered - `readOnly` cells are still derived from the protection. |
| `merge:overlap` | Two merged ranges overlap. The later one is skipped. |
| `cellStyles:borders` | The workbook carries borders and the `CustomBorders` plugin is not enabled on the target grid. |
| `comments` | The workbook carries cell comments and the `Comments` plugin is not enabled on the target grid. Set `comments: true` on the grid to import them. |
| `layoutDirection` | The sheet's layout direction disagrees with the grid's. Handsontable resolves [`layoutDirection`](@/api/options.md#layoutdirection) at initialization and ignores it afterwards, so construct the grid with `layoutDirection: 'rtl'` to follow a right-to-left workbook. The direction is on `result.layoutDirection` either way. |
| `dataValidation:<type>` | A non-list data validation, which has no grid equivalent. |
| `conditionalFormatting:unparsedRef` | A conditional formatting range the plugin could not parse. The rule's other ranges still apply. |
| `dataValidation:unresolvedList` | A list validation whose source cannot be read - a formula such as `INDIRECT()`, or a range on a sheet the workbook does not contain. An inline list and a range on the same or another sheet become a `dropdown` column. |
| `numFmt:<pattern>` | A number format with no `Intl.NumberFormat` equivalent - scientific notation, a fraction, or more than the 100 fraction digits `Intl.NumberFormat` accepts. |
| `formula:outOfRange` | A formula referencing a cell outside the imported window. Its cached value is imported instead. A reference to another sheet, such as `Rates!A1`, is kept as written. |

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

## Options

Pass these options as the third argument to `importFromArrayBuffer(format, buffer, options)` or `importFromBlob(format, blob, options)`.

| Option | Type | Default | Description |
|---|---|---|---|
| `sheet` | `string \| number` | `0` | Sheet to import, by index among the sheets that are not very hidden - a hidden sheet still counts - or by name. |
| `colHeaders` | `boolean \| 'firstRow'` | `false` | `'firstRow'` promotes the first row to column headers. |
| `headerRows` | `number` | `1` | How many rows the header band spans, with `colHeaders: 'firstRow'`. Above `1`, those rows become [nested headers](@/guides/columns/column-groups/column-groups.md) instead of `colHeaders`, and the data starts after them. Has to be an integer of at least `1` - an invalid value is rejected even when `colHeaders` is not `'firstRow'`. Otherwise ignored unless `colHeaders` is `'firstRow'`. |
| `rowHeaders` | `boolean` | `false` | Drop the first column and enable generated row headers. |
| `range` | `number[]` | whole sheet | `[startRow, startColumn, endRow, endColumn]` in sheet coordinates. |
| `inferCellTypes` | `boolean` | `true` | Derive `numeric`, `date`, `time`, `checkbox`, and `dropdown` types. A `numeric` type carries `Intl.NumberFormat` options, and a `date` or `time` type carries `Intl.DateTimeFormatOptions`, both derived from the cell's number format. The type most cells of a column share becomes the column's type in `columns`; the cells that differ get their own entry in `cellsMeta`. Passing `columns` to the grid replaces any `columns` setting it had and fixes its column count, so the plugin omits it when no column carries a type, a `readOnly` flag, or a class name. When the grid already has a `columns` setting in that case, the plugin sends one empty column setting per imported column instead, so the previous file's types do not survive. |
| `importFormulas` | `boolean` | `true` | Put formulas into the data when the `Formulas` plugin is enabled. |
| `importLayout` | `boolean` | `true` | Merges, hidden rows and columns, frozen panes, widths, and heights. An import describes the whole sheet: merges, hidden rows and columns, frozen panes, custom borders, column widths, and row heights that a previous import left on the grid and this workbook does not carry are reset. The imported lists are merged into an existing `hiddenRows`, `hiddenColumns`, or `mergeCells` options object, so options such as `indicators` survive. |
| `apply` | `boolean` | `true` | Apply the result to the grid. |
| `engine` | `object` | - | Per-call engine override. |
| `importStyles` | `boolean` | `false` | Apply alignment, font, fill, and borders from the workbook. |

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

- **Column headers are escaped.** Handsontable renders `colHeaders` as HTML, so a promoted header row is markup unless something stops it. Every header the plugin promotes is HTML-escaped, which also keeps text such as `5 < 10` whole. If you replace the headers with your own unescaped markup after the import, you own that decision - configure the [`sanitizer`](@/api/options.md#sanitizer) option to police it.
- **Cell values are rendered as text.** They are not projected through any HTML path, so they need no escaping and keep whatever the file wrote.
- **Colors are validated before they reach a stylesheet.** A color that is not a plain hex value is skipped rather than turned into a CSS declaration.
- **Oversized input is refused.** A file above 128 MiB is rejected before the engine parses it. After the parse, a sheet declaring more than 1,048,576 rows, 16,384 columns, or 5,000,000 cells is refused before the plugin allocates anything for it, and a workbook whose sheets together declare more than 10,000,000 cells is refused too. A file can declare a size it does not hold, and reading it at face value exhausts the tab. The parse itself runs inside the engine you inject, so only the byte cap bounds it. The caps are security bounds, not a promise of comfort: a sheet near the 5,000,000-cell cap takes tens of seconds to read and map and several gigabytes of memory, which is more than a browser tab is usually given. Keep imports well below the cap, or split the workbook.
- **References are bounded.** A list validation or conditional formatting range that reaches past the sheet limits is not read, and one that spans a whole column or row is clamped to the cells the sheet holds.

## Hooks

- [`beforeImport(result, format)`](@/api/hooks.md#beforeimport) runs after mapping and before applying. Return `false` to keep the grid untouched. Mutate `result` to change what is applied.
- [`afterImport(result, format)`](@/api/hooks.md#afterimport) runs after the grid was updated.

## Related

- [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md)
- [`ImportFile` plugin API](@/api/importFile.md)
- [`beforeImport`](@/api/hooks.md#beforeimport), [`afterImport`](@/api/hooks.md#afterimport)

---

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
