# columnTypeInference - column types from raw values

Infers a cell type and format per column from untyped values (parsed CSV rows, pasted cells, API
data) and converts the values to what each type stores. Read this before touching `index.ts`,
`detectors.ts`, `values.ts`, or `locale.ts`.

## What it owns and what it does not

- Owns: the detection rules, the value grammar, the locale lookups, and the converter. It is pure:
  no grid, no DOM, no hooks.
- Does not own: the public entry points. `ImportFile#inferColumnTypes` and
  `ImportFile#convertToInferredTypes` (`../../plugins/importFile/importFile.ts`) default `locale` to the
  grid's, and the plugin barrel re-exports the functions for grid-less use. It lives in `utils/`, not in
  the plugin, so the planned paste and CSV paths can use it without importing from a plugin.
- Not here yet: a CSV importer, typing on paste, date-time values as `intl-datetime`, `Date` objects,
  and month names or two-digit years in `dateFormats`. All are additive.

## Traps

- **The result must be deterministic, so nothing reads the host.** No `new Date(string)` (engines parse
  it differently), and never the browser's default locale: `locale` is explicit, falls back to `en-US`
  (also for a well-formed tag `Intl` does not support, such as `zz`: `Intl.NumberFormat('zz')` silently
  falls back to the HOST locale, so `resolveLocale` checks `supportedLocalesOf`), and separators and
  the day/month order come from `Intl.NumberFormat(locale).formatToParts` /
  `Intl.DateTimeFormat(locale).formatToParts`. The result is the same for the same input in one
  browser; another engine's ICU data can differ for a locale. Sampling is
  the first `sampleSize` rows, or with `sampling: 'spread'` evenly spaced rows picked by integer
  arithmetic and kept in row order (`pickSampleRows`); dropdown sources are in first-appearance order,
  and the detector order is the tie-break (checkbox, numeric, date, time, dropdown, then text; date
  moves ahead of numeric when `dateFormats` lists a format, see below).
- **The column decides before the locale.** A value only one separator can read (`0,5`, `1,234.56`)
  votes, and only a tie falls back to the locale; same for a year-last date with a part above 12. A
  date column settled by the locale scores `0.95` of its share, so `confidence` shows the guess; the
  `minConfidence` floor is checked against the share BEFORE that discount, or a 9-in-10 ambiguous
  column (and any column under `minConfidence: 1`) fell to text. `dateOrder` is recorded on every date
  column, even one whose sample is all ISO, because rows past `sampleSize` may be year-last and the
  converter has no locale to ask. Percent and currency are settled by MAJORITY (first appearance breaks
  a tie), never by the first value, or one stray leading `0` turned a percent column to text.
- **A grouped value never starts with `0`** (`[1-9]` in the first group of both body regexes). With
  `\d{1,3}` there, `0.123` read under both separators, cast no vote, and a `de-DE` locale turned it
  into 123. One grouping character per value (a backreference), so `1,234 567` is not a number.
- **The currency and percent reading is the combination that reads the MOST values**
  (`resolveNumberMode`), and a currency mode also reads bare numbers. A majority vote broke on order
  (`['$5','5','5','$5']` was a dropdown or USD depending on which value reached the top count first) and
  rejected `['$1,000','250','300']`. A tie goes to the first symbol in the column, and to plain over
  percent. An ISO code in the value (`12.00 USD`) is its own symbol, but only from the fixed list in
  `isCurrencyCode` and only with a space before the digits: every code `Intl` knows includes English words
  (`TOP`, `ALL`, `MAD`, `TRY`, `PEN`), so `TOP 10` read as ten of a currency, and `PLN1` is no amount.
- **A value that underflows to zero is unread** (`1.5E-400`): `Number` returns `0`, which passes
  `isFinite`, and a nonzero value silently became zero. Overflow (`1E999`) is caught by `isFinite`.
- **Accounting parentheses make a value negative, and an exponent moves the point** (`1.23E+15`, and the
  fraction digits are counted after the shift). Real numbers set only the MAXIMUM fraction digits; text
  values set the minimum too, so one computed float (`1 / 3`) cannot pad `1` to `1.000000000000000`.
- **A dot separator is a day-first vote** for a year-last date (`12.03.2026`), unless a part says month
  first. It is the one separator that carries evidence without a part above 12.
- **The TYPED detector that reads the largest share wins**, an earlier one keeps a tie (`runDetectors`).
  First over the floor was wrong: with `minConfidence: 0.4`, four `true` and six numbers became a checkbox
  and left the numbers as strings. It still stops at a detector that reads every value. **`dropdown` is a
  fallback (`Detection.fallback`) and never competes on share**: it reads every string, so it always has
  the larger share, and `1`..`3` repeated plus one `n/a` became a dropdown that sorts as text. It wins
  only when no typed detector reaches the floor.
- **Only numeric, date, time and checkbox columns count as header evidence** (`HEADER_EVIDENCE_TYPES`).
  The dropdown reader returns the trimmed string for any string, header text included, so counting it
  made every table with a dropdown column read row 0 as data, and the guide's own example lost its
  header. The guide's lead example is pinned by the `the guide example` tests.
- **A dropdown compares and converts TRIMMED values**, like every other reader. Untrimmed, `Open` and
  `Open ` were two options (`source` listed `Open` twice while `stats.distinctCount` said 2), and one
  more padded value pushed the column over `maxOptions` to text. The reader for `dropdown` returns the
  trimmed string, or the strict validator would reject `Open `.
- **A dropdown needs two options and six values.** A single repeated value is no choice, and four rows
  repeat by chance; a strict dropdown then rejects everything it has not seen.
- **The input types accept read-only arrays and interface-typed rows**
  (`ReadonlyArray<ReadonlyArray<unknown>> | ReadonlyArray<object>`). `Record<string, unknown>[]`
  rejected an `Order[]`, which is the usual shape of typed API data. A flat key with a dot is fine:
  `DataMap#get` reads an own key before it walks a path, pinned by the `in a grid` test.
- **Shared symbols resolve by region** (`resolveCurrencyCode` in `locale.ts`): `$` is CAD under
  `en-CA`, `kr` is NOK under `nb-NO`, but only for the regions `REGIONAL_CURRENCY_CODES` lists; any
  other region takes the symbol's default code (`$` is USD). Add a region there, never a second table.
  `inputFormat.currencySymbol` carries the SYMBOL to the converter, because the converter has no locale
  to turn a code back into a symbol.
- **Inference without conversion is a trap.** The `date` and `time` cell types validate source data as
  ISO only, so `12/03/2026` loaded raw is flagged on every cell. `convertToInferredTypes` rewrites
  values to the stored shape (number, `YYYY-MM-DD`, `HH:mm:ss`, boolean) and reads them with the same
  functions the detectors count with (`values.ts`), so a value the detector accepted always converts.
  Keep it that way: a converter with its own parsing drifts from what `confidence` promised.
- **`getParsedNumber` (`helpers/number.ts`) is deliberately NOT used.** It falls back to
  `parseFloat`, so `12 apples` reads as `12`, and it cannot read a comma-grouped float (`1,234.56`
  becomes `1.234`). The value grammar is strict regexes in `values.ts` instead.
- **A leading-zero integer rules the whole COLUMN out of numeric** (`00123`, `02134`): ZIP codes and IDs
  would lose their zeros. Per value alone, 95 plain ZIPs and 3 zero-led ones read 97% numeric, passed the
  floor, and rendered `02134` as `2134`. `detectNumeric` returns `null` when any value is zero-led.
  Neither is a value with more than 15 significant digits (a card number), which a double rounds.
  Fraction digits are capped at 20 (`Intl.NumberFormat` throws above 100, inside the renderer) and a
  JS number is counted at 15 significant digits, so `0.1 + 0.2` does not ask for 17 decimals.
  `1`/`0` stay numeric, not checkbox. Date-time values stay `text`, because the `date` validator
  accepts date-only values; mapping them to `intl-datetime` is a follow-up.
- **A percent column divides by moving the exponent** (`'7.25' + 'e-2'`), not by `/ 100`, which keeps
  `7.25%` exactly `0.0725`.
- **The currency table is shared** with `../../plugins/importFile/inference.ts` through
  `../currencySymbols.ts`. Every symbol there is a `\u` escape (see the ASCII rule in
  `handsontable/AGENTS.md`): a raw `z\u0142` key breaks the non-minified bundle on a non-UTF-8 page,
  and a raw `\u20ac` string decodes wrongly there, so a euro column would infer as text.
- **A `+` in front of space-grouped integers is a phone number** (`+48 601 234 567`), so
  `splitNumberParts` rejects it, and so does it for an integer of nine digits or more grouped by PLAIN
  spaces (`601 234 567`) with no currency and no percent sign. The rule lives in `splitNumberParts`, not
  `isNumberBody`, because only there is the currency known: `Intl` writes fr-FR and pl-PL amounts with
  U+202F and U+00A0 (`1 234 567 890 €`), and a value from 100 million up must stay a number. A decimal part
  (`+1 234,5`) says it is a quantity, and a `+` with comma grouping (`+1,234`) is still a number.
- **`Intl` writes U+2212 for a minus under some locales** (`sv-SE`, `fi-FI`); `splitNumberParts`
  normalizes it to `-`.
- **The locale's day/month order is read WITHOUT the year.** With the year, `sv-SE` prints the ISO
  form and reads as month-first, so `12/03/2026` became 3 December. `ja-JP` still answers `MDY`.
- **Each value is split once per detection** (`detectNumeric` builds `SplitValue`s and reads them with
  `readSplitNumber`), and the converter builds one reader per column (`createReader`). Splitting per
  pass cost five `splitNumberParts` calls per value, and a mode object per cell cost 1.3 s on
  50,000 x 100 cells.
- **The result is `{ columns, headerRow }`, and a column keeps `settings` apart from the rest.**
  `settings` is exactly the grid's column options (`type`, a format, `source`, `data`), so it goes to
  `columns` untouched; `confidence`, `inputFormat`, `title` and `stats` describe the inference and must
  never be spread into it. They were mixed in once, and the guide had to tell users to strip them.
  `headerRow` is on the result and not only an option because `'auto'` decides it: the converter has no
  other way to know whether to drop row 0. The result is the converter's input
  (`convertToInferredTypes(data, result)`), not `result.columns`.
- **`headerRow: 'auto'` needs evidence, and a table of text has none.** Row 0 is a header only when
  every cell is a non-blank string across the full width, none of them a missing-value word
  (`MISSING_VALUE_WORDS`: `n/a`, `-`, `null`...), AND there is a typed column below it (numeric, date,
  time, checkbox) with EVERY typed column rejecting its cell. "Some typed column rejects" was too weak:
  `['Alice', 'n/a']` over a numeric column read as a header, and `convertToInferredTypes` then dropped
  the Alice record without a word. A placeholder written another way still fools it; the guide says so. `Name, City / Alice, Paris` stays data, and so does `1, 2 /
  3, 4`. Do not loosen it to "all strings": that turns every text table's first record into titles. The
  data rows are inferred WITHOUT the header, so a title is never counted as a stray value, and
  `sampleSize` counts data rows. In `'auto'`, a table that is not a header is inferred a second time
  as data.
- **`stats` costs a full detector pass, so it is opt-in.** Without it `inferColumn` stops at the first
  detector that reaches the floor; with it, every detector runs so `runnerUpType` can name the next
  best type (ties keep the `getDetectors()` order). `min`/`max` exist only for numeric, date and time:
  a checkbox's booleans compare, and a text column has no order worth reporting. `examples: 0` is a
  valid limit, so "stats off" is `null` in `toExampleLimit`, never `0`.
- **A `Date` is described by its ISO string** (`toText`), because its own text follows the host time
  zone and the stats must not.
- **Tree-shaking was measured, not assumed.** Bundling `inferColumnTypes` through the plugin barrel
  (`plugins/importFile`) and straight from `utils/columnTypeInference` with rspack production gave the
  same 7,672 bytes and no plugin, engine or `BasePlugin` code. Re-measured after the `sampling`,
  `dateFormats` and `booleanValues` options, with a minimal rspack production config on the util alone
  (`swc` target `es2022`, `concatenateModules`): 12,336 bytes on the commit before, 15,300 after (gzip
  5,023 and 6,194), still no plugin, engine, `BasePlugin` or `Hooks.register` code. The only new
  import is `helpers/console` (`warnOnce`), which adds a `WeakMap` and `console.warn`. The two figures
  come from different configs, so compare only within one. It holds because `package.json`
  `sideEffects` lists only CSS, languages and two Filters folders, and `importFile` registers nothing
  at module level. A module-level `Hooks.register()` or a new `sideEffects` entry for `importFile`
  would change that: re-measure first. The CommonJS build is not shakeable, as for every plugin.
- **The `dateFormats` and `booleanValues` options travel in `inputFormat`, because the converter has no
  options.** `convertToInferredTypes(data, result)` sees only the result, so a date column records the
  ONE format it picked (`inputFormat.dateFormat`, the pattern string, recompiled by `createReader`) and
  a checkbox column records the whole word lists (`inputFormat.booleanValues`), not only the words it
  saw: a row past the sample may hold any listed word. Both are plain strings, so the result stays
  JSON-serializable. A checkbox column without the option has no `inputFormat`, as before.
- **Listed date formats REPLACE the built-in year-last reading; they do not add to it.** Added, the
  built-in reading would keep winning ties under the locale, and `dateFormats: ['DD/MM/YYYY']` under
  `en-US` would still read `12/03/2026` as 3 December. **The format is tried BEFORE the year-first
  regex**, which also takes `/` and `.` (`YEAR_FIRST_DATE_REGEX`): the other way round, `YYYY/DD/MM`
  read `2026/12/03` as 3 December while `inputFormat` said the listed format was used. **The fallback
  for a value the format does not match is STRICT ISO (`ISO_DATE_REGEX`, dashes and two digits), not the
  loose year-first form**: loose, `2026/12/3` fell through to year, month, day while `2026/12/03` matched
  the format, so a `YYYY/DD/MM` column mixed both and still reported full confidence. Without a listed
  format the loose form is unchanged. A result whose `dateFormat` no longer compiles converts strict ISO
  dates only (`ISO_DATE_FORMAT`), never the built-in MDY guess. The
  column takes the format that reads the most values (the earlier one on a tie, like
  `resolveNumberMode`), and that format is recorded even when no sampled value needed it. With a format
  listed the confidence is never discounted: the user settled the order, not the locale.
- **A listed format moves the date detector ahead of numeric only when a number can read it too**
  (`getDetectors`, `CompiledDateFormat#numberLike`: no literal, or a single `.` or `,`, such as
  `YYYYMMDD` or `YYYY.MMDD`). `YYYYMMDD` values read as numbers too, and the default order gives numeric
  the tie and stops there, since it reads every value. Any other format cannot tie: a grouped number
  needs groups of exactly three digits and no date token is three wide. Moving date first for those too
  made every numeric column run a date pass per format before its early exit. `DATE_FIRST_DETECTORS` is
  built from `DETECTORS`, so a new detector is in both. Checkbox is already first, which is why listed
  `1`/`0` words win over numeric without a rule of their own. Both readers take NUMBER cells too,
  through their text (a whole number for a format, any finite number for a word), because API data
  carries `20260312` and `1` as numbers; the default readers still read strings only, so defaults are
  unchanged. **A number lost its leading zeros, so a fixed-width format pads it back**
  (`CompiledDateFormat#width`, `toDigits`: `1032026` is `01032026` for `DDMMYYYY`); a format with a
  literal or an `M`/`D` token has no width and reads strings only, as `1.3.2026` is no number.
- **The format grammar is numeric on purpose**: `YYYY`, `MM`/`DD` (two digits), `M`/`D` (one or two),
  every non-letter matched literally. A run of any other letter (`MMM`, `YY`, `dd`) drops the whole
  format, because month names depend on the locale and a two-digit year needs a century pivot. So does
  an `M` or `D` right next to another token (`YYYYMD`): `2026111` is 1 November or 11 January. The
  format is trimmed, like the values. Never
  read a format with `new Date()` or a date library: the module must stay deterministic and small.
- **A format that does not compile is warned about, once per format** (`warnOnce` with a module-level
  scope, since this util has no grid): `dd/MM/yyyy` is a common spelling, and dropping it silently makes
  the option a no-op that falls back to the locale order. The warning is a side effect only; the result
  does not depend on it.
- **A boolean word listed on both sides reads as neither**, `true` and `false` included
  (`createBooleanReader`). Words compare as `.trim().toLowerCase()`, never `toLocaleLowerCase`.
- **Accepted, not fixed:** `Open` and `open` are two dropdown options; `1:30` reads as a time; Indian lakh grouping (`1,23,456`) and times with milliseconds stay
  text; a JS `Date` stays text. The guide names the ones a user will meet.

## Where to look next

- `../../plugins/importFile/AGENTS.md` for the XLSX inference, which reads number FORMATS, not values.
- `../../helpers/dateTime.ts` for the ISO validators the converted values must pass.

## Testing

- `npm run test:unit -- --testPathPattern=columnTypeInference`
- `__tests__/columnTypeInference.unit.js` runs every corpus column's converted values through the real
  cell type validators (`converted values`); a new detector needs a corpus row there.
- Locale behavior comes from the engine's ICU data, so a case that names a locale is only as stable
  as Node's ICU. Jest runs on Node with full ICU.
