---
type: how-to
title: Infer column types
metaTitle: Infer column types | Handsontable DataGrid for JavaScript
description: Detect column types, such as numeric, date, and checkbox, from CSV rows, pasted text, or API data, with Handsontable DataGrid's inferColumnTypes() method.
permalink: /infer-column-types
canonicalUrl: /infer-column-types
tags:
  - infer column types
  - detect column types
  - csv
  - paste
  - api data
  - raw values
  - import from file
react:
  metaTitle: Infer column types | Handsontable DataGrid for React
angular:
  metaTitle: Infer column types | Handsontable DataGrid for Angular
vue:
  metaTitle: Infer column types | Handsontable DataGrid for Vue
searchCategory: Guides
category: Import and export
menuTag: new
addedIn: "19.0.0"
---

Data that doesn't come from a workbook carries no number formats: rows you parsed from a CSV file, text pasted into cells, or values from an API. To type that data, use the [`ImportFile`](@/api/importFile.md) plugin's [`inferColumnTypes()`](@/api/importFile.md#infercolumntypes) method. It reads the values and returns the column settings, with a measure of how sure it is and, when the data has a header row or is rows of objects, a header for each column.

[[toc]]

## Prerequisites

When you register modules one by one, register the `ImportFile` plugin (`registerPlugin(ImportFile)`) and the cell types you expect the method to infer: `numeric`, `date`, `intl-datetime`, `time`, `checkbox`, and `dropdown`. An unregistered type is applied as `text`. The method reads no file, so it needs no XLSX engine.

::: only-for react

Get the plugin from the `hotInstance` of your `HotTable` ref: `hotRef.current?.hotInstance?.getPlugin('importFile')`. See [Instance methods](@/guides/getting-started/react-methods/react-methods.md).

:::

::: only-for angular

Get the plugin from the `hotInstance` of your `HotTableComponent` reference. See [Referencing the Handsontable instance](@/guides/getting-started/angular-hot-instance/angular-hot-instance.md).

:::

::: only-for vue

Get the plugin from the `hotInstance` of your `HotTable` template ref: `hotRef.value?.hotInstance?.getPlugin('importFile')`. See [Referencing the Handsontable instance](@/guides/getting-started/vue3-hot-reference/vue3-hot-reference.md).

:::

## Infer and convert

The examples below call the instance `hot`.

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
| `settings` | The column options: `type`, the format of that type (`numericFormat`, `dateFormat`, `dateTimeFormat`, `timeFormat`, or `source`), and `data` for rows of objects. Pass it to [`columns`](@/api/options.md#columns) as it is. |
| `confidence` | The share of non-blank values the type reads, from `0` to `1`. |
| `inputFormat` | How the raw values were written (the decimal separator, a percent sign, the currency symbol, the day and month order, the listed date format, the listed boolean words). `convertToInferredTypes()` reads it. |
| `title` | The column's header. Set with a header row, and for rows of objects, where it is the property name. |
| `stats` | A description of the sampled values. Set with the [`stats`](#column-statistics) option. |

Before you load the data, convert it with `convertToInferredTypes(rows, result)`. Each cell type stores its values in a fixed form: a number for `numeric`, `YYYY-MM-DD` for `date`, `YYYY-MM-DDTHH:mm:ss` for `intl-datetime`, `HH:mm:ss` for `time`, and a boolean for `checkbox`. If you skip the conversion, the cells keep the raw strings, and `date`, `intl-datetime`, and `time` cells reject them. The conversion returns a copy, leaves your rows unchanged, and leaves out the header row, which is in `title`.

## How inference works

Inference works this way:

- **Types.** The method infers `checkbox` (`true` and `false` in any case, plus the words you list in [`booleanValues`](#date-formats-and-boolean-words)), `numeric`, `date`, `intl-datetime`, `time`, `dropdown`, and `text`. When two types read values, the one that reads more of them wins. On a tie the order is the one in that list, with `dropdown` tried last. Two exceptions apply. A `dropdown` reads every string, so it is tried only when no other type reaches `minConfidence`. And when you list a [`dateFormats`](#date-formats-and-boolean-words) entry that a number can also match, such as `YYYYMMDD`, `date` comes before `numeric`. A numeric column with one `n/a` stays numeric as long as numeric still reads `minConfidence` of the values (90% by default). If you register modules one by one, register each type you expect, `intl-datetime` included.
- **Dates and times.** A date followed by a time (`2026-03-12 14:30`, `2026-03-12T14:30:00`, `12/03/2026 9:05 PM`, `3/12/2026, 2:30 PM`) makes an `intl-datetime` column, and so do JavaScript `Date` objects. A column of dates with even one date-time or `Date` becomes `intl-datetime` too, and its dates convert to midnight. A value with a time zone or an offset (`Z`, `+02:00`) stays text, because the grid reads local time. A value with a nonzero fraction of a second stays text too, because the conversion writes whole seconds. An all-zero fraction (`14:30:00.000`) is read. A `Date` converts to its date and time in the browser's time zone, which is how the grid reads the value, and drops its milliseconds.
- **Dropdowns.** A column becomes a `dropdown` when it has at least six values, between two and ten distinct ones (see `dropdown`), and each distinct value appears at least twice on average. Values are compared trimmed, so `Open` and `Open ` are one option, and the conversion writes the trimmed value. A short list of names that repeat can pass that test. Set `dropdown: false` when it is wrong for your data.
- **Numbers.** A numeric value may carry a sign, accounting parentheses (`(1,234.00)`), a currency symbol on either side (`$1,234.50`, `12,5 zł`), a common ISO code set apart by a space (`12.00 USD`, `SEK 7.50`), an exponent (`1.23E+15`), or a trailing percent sign (`12.5%`, converted to `0.125`). A column with a currency reads its bare numbers as that currency. Text values set the fraction digits of the format, so `1.50` and `2.00` print with two. Real numbers don't pad the column: one computed float only raises the maximum. Digits may be grouped with a comma, a dot, or a space of any width. With a dot decimal, an apostrophe works too (`1'234.50`). A symbol that several currencies share takes the currency of the locale's region for the common cases: `$` is `CAD` under `en-CA` and `ARS` under `es-AR`, and `kr` is `NOK` under `nb-NO`. Any other region gets the symbol's default currency: `USD` for `$`, `SEK` for `kr`.
- **Confidence.** A column whose share of readable values is below `minConfidence` falls back to `text`. Blank values don't count. A value the type can't read, such as a `Total` row, keeps its raw form after the conversion, so the cell's validator marks it.
- **Ambiguous values.** The column decides first: `0,5` in a column makes `1.234` mean 1234, and `25/03/2026` makes `12/03/2026` mean 12 March. A date written with dots (`12.03.2026`) reads as day first. When nothing in the column decides, the `locale` option does. It defaults to the grid's [`locale`](@/api/options.md#locale). A date column whose order came from the locale reports `0.95` times its share as its confidence. To read dates in a format you know, list it in [`dateFormats`](#date-formats-and-boolean-words).
- **Codes stay text.** Some values look like numbers but are codes. One value with a leading zero (`02134`) keeps the whole column text, so a ZIP column doesn't lose its zeros. A number with more than 15 significant digits (a card number), and a phone number such as `+48 601 234 567` or `601 234 567` (digits grouped by plain spaces, nine or more, with no currency), also stay text. Converting them to numbers would lose digits. A large amount grouped the way `Intl` writes it, with a no-break space or with a currency (`1 234 567 890 €`), is still a number.
- **Sampling.** The method reads only `sampleSize` data rows: the first ones by default, or rows spaced evenly from the first to the last with `sampling: 'spread'`. Use `'spread'` for sorted data, where the first rows don't show the rest. A `dropdown` column lists only the options found in the sampled rows, so a row with another option is marked invalid. Raise `sampleSize`, or set `sampling: 'spread'`, if your data needs it. For rows of objects, every key the sampled rows carry becomes a column.
- **Deterministic results.** In a given browser, the same rows and options always give the same result. The method never reads the browser's locale, and an unsupported locale falls back to `'en-US'`. Separators and date order come from the browser's locale data, so two browsers can disagree on a rare locale.

## Header row

Set `headerRow` when the first row of array data holds column names. The header row is left out of the inference, so a name such as `Price` doesn't count as a stray value in a column of prices. Its cells come back as each column's `title`, and `convertToInferredTypes()` drops the row from the data.

| `headerRow` | Effect |
|---|---|
| `false` (default) | The first row is data. |
| `true` | The first row is a header. |
| `'auto'` | The first row is a header when every cell of it is a non-blank string that isn't a missing-value word, there is at least one column below it that reads as a number, a date, a date-time, a time, or a checkbox, and none of those columns reads its cell of the first row. |

`result.headerRow` tells you what `'auto'` decided. A table of text only has nothing that tells a header from a row, so `'auto'` reads it as data: set `headerRow: true` for such a table. A first row with a missing value written as text (`n/a`, `-`, `null`, `none`, `unknown`) is read as a record. A missing value written another way can still make a record look like a header, and `convertToInferredTypes()` drops that row. Set `headerRow` to `true` or `false` when your first row is known. Rows of objects have no header row, and `title` is the property name.

## Column statistics

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
| `min`, `max` | The smallest and largest value of a `numeric` (a number), `date` (`YYYY-MM-DD`), `intl-datetime` (`YYYY-MM-DDTHH:mm:ss`), or `time` (`HH:mm:ss`) column, after conversion. `Date` objects are left out, because their converted value depends on the browser's time zone. |
| `runnerUpType` | The other type that reads the largest share of the values. For a `text` column, the type that came closest to `minConfidence`. A typed column with no rival gets `'text'`; a `text` column with no rival has no `runnerUpType`. |

The statistics come from the sampled rows only, in a fixed order, so they are deterministic too.

## Date formats and boolean words

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

For example, `DD/MM/YYYY`, `D.M.YYYY`, `YYYY/DD/MM`, and `YYYYMMDD` are all valid. A format needs exactly one year, one month, and one day token. A format is ignored when it has any other letter, such as `MMM` or `YY`, or an `M` or `D` token right next to another token, such as `YYYYMD`, which can't tell `2026111` as 1 November from 11 January. The listed formats replace the built-in reading of year-last dates, so the column doesn't depend on the `locale`. They read the date part of a date-time too, so `12/03/2026 14:30` with `DD/MM/YYYY` is 12 March at 14:30. A value that no listed format matches is still read as an ISO date, but only in the form `2026-03-12`, with dashes and two digits for the month and day. A format that is ignored prints one console warning that names it, so a spelling such as `dd/MM/yyyy` doesn't fail silently. A column takes the format that reads the most of its values, and the earlier format in the list wins a tie. The format a date column uses is in its `inputFormat`, so `convertToInferredTypes()` reads the rows past the sample the same way. A column of digits that a listed format reads, such as `20260312` with `YYYYMMDD`, becomes a `date`, not a `numeric` column. Numbers work too. A number that lost its leading zeros is padded back to the width of a fixed-width format, so `1032026` reads as `01032026` for `DDMMYYYY`. A number whose year is below 1000 isn't read, so `101` stays a quantity and not the year 1. A format with a separator or with `M` or `D` can't be padded, so it reads strings only.

The words in `booleanValues` are read in addition to `true` and `false`. They are compared trimmed and in any case, and the Turkish dotted and dotless `i` count as one letter, so `HAYIR` matches a listed `hayır`. An option that isn't an array prints one console warning and is ignored. A word listed on both sides reads as neither. If you list `1` and `0`, a column of them becomes a `checkbox` instead of a `numeric` column, whether the values are strings or numbers.

## Options

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

## Related articles

**Related guides**

<div class="boxes-list">

- [Import from Excel](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md)
- [Import from CSV or Excel](@/recipes/import-export/import-csv-excel/import-csv-excel.md)
- [Import and export](@/guides/import-and-export/import-and-export/import-and-export.md)

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

---

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
