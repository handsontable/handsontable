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
- Not here yet: a CSV importer and typing on paste. Both are follow-ups.

## Traps

- **The result must be deterministic, so nothing reads the host.** No `new Date(string)` (engines parse
  it differently), and never the browser's default locale: `locale` is explicit, falls back to `en-US`
  (also for a well-formed tag `Intl` does not support, such as `zz`: `Intl.NumberFormat('zz')` silently
  falls back to the HOST locale, so `resolveLocale` checks `supportedLocalesOf`), and separators and
  the day/month order come from `Intl.NumberFormat(locale).formatToParts` /
  `Intl.DateTimeFormat(locale).formatToParts`. The result is the same for the same input in one
  browser; another engine's ICU data can differ for a locale. Sampling is
  the first `sampleSize` rows, dropdown sources are in first-appearance order, and `DETECTORS` order is
  the tie-break (checkbox, numeric, date, time, dropdown, then text).
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
- **A leading-zero integer is never numeric** (`00123`): ZIP codes and IDs would lose their zeros.
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
- **A `+` in front of space-grouped digits is a phone number** (`+48 601 234 567`), so
  `splitNumberParts` rejects it. Without the rule it converted to `48601234567` and rendered grouped.
  A `+` with comma grouping (`+1,234`) is still a number.
- **`Intl` writes U+2212 for a minus under some locales** (`sv-SE`, `fi-FI`); `splitNumberParts`
  normalizes it to `-`.
- **The locale's day/month order is read WITHOUT the year.** With the year, `sv-SE` prints the ISO
  form and reads as month-first, so `12/03/2026` became 3 December. `ja-JP` still answers `MDY`.
- **Each value is split once per detection** (`detectNumeric` builds `SplitValue`s and reads them with
  `readSplitNumber`), and the converter builds one reader per column (`createReader`). Splitting per
  pass cost five `splitNumberParts` calls per value, and a mode object per cell cost 1.3 s on
  50,000 x 100 cells.
- **Accepted, not fixed:** a header row in the data reads as one stray value (a column of prices with
  a `Price` header still infers currency at the 0.9 floor); `Open` and `open` are two dropdown
  options; `1:30` reads as a time; Indian lakh grouping (`1,23,456`) and times with milliseconds stay
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
