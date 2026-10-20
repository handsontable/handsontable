---
type: how-to
title: Import from Excel
metaTitle: Import from Excel | Handsontable DataGrid for JavaScript
description: Load an Excel (.xlsx) workbook into your grid, with cell types, dropdown sources, formulas, merged cells, hidden rows and columns, and frozen panes derived from the file.
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
category: Accessories and menus
menuTag: new
addedIn: "19.0.0"
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
| `layoutDirection` | The sheet's layout direction disagrees with the grid's. Handsontable DataGrid resolves [`layoutDirection`](@/api/options.md#layoutdirection) at initialization and ignores it afterwards, so construct the grid with `layoutDirection: 'rtl'` to follow a right-to-left workbook. The direction is on `result.layoutDirection` either way. |
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
| `inputFormat` | How the raw values were written (the decimal separator, a percent sign, the currency symbol, the day and month order, the listed date format, the listed boolean words). `convertToInferredTypes()` reads it. |
| `title` | The column's header. Set with a header row, and for rows of objects, where it is the property name. |
| `stats` | A description of the sampled values. Set with the [`stats`](#column-statistics) option. |

Before you load the data, convert it with `convertToInferredTypes(rows, result)`. Each cell type stores its values in a fixed form: a number for `numeric`, `YYYY-MM-DD` for `date`, `HH:mm:ss` for `time`, and a boolean for `checkbox`. If you skip the conversion, the cells keep the raw strings, and `date` and `time` cells reject them. The conversion returns a copy, leaves your rows unchanged, and leaves out the header row, which is in `title`.

Inference works this way:

- **Types.** The method infers `numeric`, `date`, `time`, `checkbox` (`true` and `false` in any case, plus the words you list in [`booleanValues`](#date-formats-and-boolean-words)), `dropdown`, and `text`. When two types read values, the one that reads more of them wins. On a tie the order is `checkbox`, `numeric`, `date`, `time`, and `dropdown` is tried last. Two exceptions apply. A `dropdown` reads every string, so it is tried only when no other type reaches `minConfidence`. And when you list a [`dateFormats`](#date-formats-and-boolean-words) entry that a number can also match, such as `YYYYMMDD`, `date` comes before `numeric`. A numeric column with one `n/a` stays numeric. Date-time values such as `2026-03-12 14:30` and JavaScript `Date` objects stay `text`.
- **Dropdowns.** A column becomes a `dropdown` when it has at least six values, between two and ten distinct ones (see `dropdown`), and each value repeats at least twice on average. Values are compared trimmed, so `Open` and `Open ` are one option, and the conversion writes the trimmed value. A short list of names that repeat can pass that test. Set `dropdown: false` when it is wrong for your data.
- **Numbers.** A numeric value may carry a sign, accounting parentheses (`(1,234.00)`), a currency symbol on either side (`$1,234.50`, `12,5 zł`), a common ISO code set apart by a space (`12.00 USD`, `SEK 7.50`), an exponent (`1.23E+15`), or a trailing percent sign (`12.5%`, converted to `0.125`). A column with a currency reads its bare numbers as that currency. Text values set the fraction digits of the format, so `1.50` and `2.00` print with two. Real numbers don't pad the column: one computed float only raises the maximum. Digits may be grouped with a comma, a dot, or a space of any width. With a dot decimal, an apostrophe works too (`1'234.50`). A symbol that several currencies share takes the currency of the locale's region for the common cases: `$` is `CAD` under `en-CA` and `ARS` under `es-AR`, and `kr` is `NOK` under `nb-NO`. Any other region gets the symbol's default currency: `USD` for `$`, `SEK` for `kr`.
- **Confidence.** A column whose share of readable values is below `minConfidence` falls back to `text`. Blank values don't count. A value the type can't read, such as a `Total` row, keeps its raw form after the conversion, so the cell's validator marks it.
- **Ambiguous values.** The column decides first: `0,5` in a column makes `1.234` mean 1234, and `25/03/2026` makes `12/03/2026` mean 12 March. A date written with dots (`12.03.2026`) reads as day first. When nothing in the column decides, the `locale` option does. It defaults to the grid's [`locale`](@/api/options.md#locale). A date column whose order came from the locale reports `0.95` times its share as its confidence. To read dates in a format you know, list it in [`dateFormats`](#date-formats-and-boolean-words).
- **Codes stay text.** Some values look like numbers but are codes. One value with a leading zero (`02134`) keeps the whole column text, so a ZIP column doesn't lose its zeros. A number with more than 15 significant digits (a card number), and a phone number such as `+48 601 234 567` or `601 234 567` (digits grouped by plain spaces, nine or more, with no currency), also stay text. Converting them to numbers would lose digits. A large amount grouped the way `Intl` writes it, with a no-break space or with a currency (`1 234 567 890 €`), is still a number.
- **Sampling.** The method reads only `sampleSize` data rows: the first ones by default, or rows spaced evenly from the first to the last with `sampling: 'spread'`. Use `'spread'` for sorted data, where the first rows don't show the rest. A `dropdown` column lists only the options found in the sampled rows, so a row with another option is marked invalid. Raise `sampleSize`, or set `sampling: 'spread'`, if your data needs it. For rows of objects, every key the sampled rows carry becomes a column.
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

### Date formats and boolean words

Set `dateFormats` to read dates written in formats you know, and `booleanValues` to read your own words as checkbox values.

```javascript
const rows = [
  ['Employee', 'Hired', 'Remote'],
  ['Ana García', '14/03/2022', 'yes'],
  ['James Okafor', '02/11/2023', 'no'],
  ['Li Wei', '20/06/2021', 'Yes'],
];

const result = importFile.inferColumnTypes(rows, {
  headerRow: true,
  dateFormats: ['DD/MM/YYYY'],
  booleanValues: { true: ['yes'], false: ['no'] },
});

console.log(importFile.convertToInferredTypes(rows, result));
// [
//   ['Ana García', '2022-03-14', true],
//   ['James Okafor', '2023-11-02', false],
//   ['Li Wei', '2021-06-20', true],
// ]
```

A date format uses these tokens. Every other character is matched as it is:

| Token | Matches |
|---|---|
| `YYYY` | A four-digit year. |
| `MM`, `DD` | A two-digit month or day (`03`). |
| `M`, `D` | A month or day of one or two digits (`3`, `03`). |

For example, `DD/MM/YYYY`, `D.M.YYYY`, `YYYY/DD/MM`, and `YYYYMMDD` are all valid. A format needs exactly one year, one month, and one day token. A format is ignored when it has any other letter, such as `MMM` or `YY`, or an `M` or `D` token right next to another token, such as `YYYYMD`, which can't tell `2026111` as 1 November from 11 January. The listed formats replace the built-in reading of year-last dates, so the column doesn't depend on the `locale`. A value that no listed format matches is still read as an ISO date, but only in the form `2026-03-12`, with dashes and two digits for the month and day. A format that is ignored prints one console warning that names it, so a spelling such as `dd/MM/yyyy` doesn't fail silently. A column takes the format that reads the most of its values, and the earlier format in the list wins a tie. The format a date column uses is in its `inputFormat`, so `convertToInferredTypes()` reads the rows past the sample the same way. A column of digits that a listed format reads, such as `20260312` with `YYYYMMDD`, becomes a `date`, not a `numeric` column. Numbers work too. A number that lost its leading zeros is padded back to the width of a fixed-width format, so `1032026` reads as `01032026` for `DDMMYYYY`. A number whose year is below 1000 isn't read, so `101` stays a quantity and not the year 1. A format with a separator or with `M` or `D` can't be padded, so it reads strings only.

The words in `booleanValues` are read in addition to `true` and `false`. They are compared trimmed and in any case, and the Turkish dotted and dotless `i` count as one letter, so `HAYIR` matches a listed `hayır`. An option that isn't an array prints one console warning and is ignored. A word listed on both sides reads as neither. If you list `1` and `0`, a column of them becomes a `checkbox` instead of a `numeric` column, whether the values are strings or numbers.

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `sampleSize` | `number` | `1000` | How many data rows to read. `Infinity` reads every row. |
| `sampling` | `'head' \| 'spread'` | `'head'` | Which rows `sampleSize` picks: the first ones, or rows spaced evenly from the first to the last. |
| `locale` | `string` | the grid's `locale` | Settles a column whose values don't decide the decimal separator or the day and month order. |
| `minConfidence` | `number` | `0.9` | The share of non-blank values a type has to read, from `0` to `1`. |
| `dropdown` | `boolean \| { maxOptions?: number }` | `true` | Whether a column of repeated strings becomes a `dropdown`, and how many distinct values it may have (`10` by default, `0` turns it off). |
| `headerRow` | `boolean \| 'auto'` | `false` | Whether the first row of array data is a header. See [Header row](#header-row). |
| `stats` | `boolean \| { examples?: number }` | `false` | Whether to describe the sampled values of each column. See [Column statistics](#column-statistics). |
| `dateFormats` | `string[]` | none | Date formats to read instead of the built-in year-last dates. See [Date formats and boolean words](#date-formats-and-boolean-words). |
| `booleanValues` | `{ true?: string[], false?: string[] }` | none | Words a `checkbox` column reads as `true` and `false`. See [Date formats and boolean words](#date-formats-and-boolean-words). |

To infer types without a grid, import the same functions from the plugin module: `import { inferColumnTypes, convertToInferredTypes } from 'handsontable/plugins/importFile';`. Without a grid, `locale` defaults to `'en-US'`. A bundler drops the rest of the plugin from your build when you use only these two functions.

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
