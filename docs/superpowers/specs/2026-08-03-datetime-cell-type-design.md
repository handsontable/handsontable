# Design: `datetime` + `intl-datetime` cell types (DEV-1463 / #12366)

## Problem

`intl-date` (and the classic `date`) cell types are date-only. Their `dateFormat` option
accepts time-related `Intl.DateTimeFormat` options (`hour`, `minute`, `second`, `timeStyle`,
`hour12`, `hourCycle`, `fractionalSecondDigits`), so users configure them, see `00:00:00`
rendered, and expect full datetime support that does not exist. Reported in
[#12366](https://github.com/handsontable/handsontable/issues/12366).

## Goals

1. **Docs clarification (action item 1):** note in the `dateFormat` JSDoc (`metaSchema.ts`) and
   the date cell type guide that time-related options only affect display and always render
   midnight for date-only source data.
2. **New cell types (action item 2):** add official `datetime` + `intl-datetime` cell types with
   a native `datetime-local` editor, zero dependencies, as first-class members of the
   `date`/`intl-date` and `time`/`intl-time` family (render, edit, validate, sort, filter,
   export).

## Non-goals

- No new third-party dependency (native HTML input only).
- No change to any existing default setting value.
- Filters `today`/`tomorrow`/`yesterday` conditions (not meaningful for a datetime instant).

## Approach

Mirror the existing `time`/`intl-time` family exactly. The modern `date`/`time`/`intl-date`/
`intl-time` types already use native HTML inputs (`<input type="date">`, `<input type="time">`;
Pikaday was removed) plus `Intl.DateTimeFormat` in the renderer and ISO validation. The recipe in
#12366 (native `<input type="datetime-local">`) aligns with that architecture.

The classic `datetime` is the base implementation; `intl-datetime` is a thin wrapper exposing its
own `EDITOR_TYPE`/`RENDERER_TYPE`/`VALIDATOR_TYPE`/`CELL_TYPE` identifier and delegating to the
base — identical to the `date`→`intl-date` split.

## Data contract

- **Canonical source value:** ISO 8601 `YYYY-MM-DDTHH:mm:ss` (T separator, seconds included). It
  sorts lexicographically and round-trips through `<input type="datetime-local" step="1">`.
- **Lenient parsing** so #12366's mixed reporter data works — renderer, validator, and sort accept:
  - date-only `YYYY-MM-DD` (treated as midnight),
  - space separator `YYYY-MM-DD HH:mm[:ss]`,
  - T separator `YYYY-MM-DDTHH:mm[:ss[.SSS]]`.
- **Editor** normalizes on the way in (`space`→`T`, pad date-only to `T00:00:00`, pad `HH:mm` to
  `HH:mm:ss`) and canonicalizes on the way out to `YYYY-MM-DDTHH:mm:ss`.
- **New option `dateTimeFormat`** (`Intl.DateTimeFormatOptions`), default
  `{ year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }`.
  A new option, so no breaking-change concern. The renderer reads `dateTimeFormat` (not `dateFormat`).

## Components (new, mirroring `intl-time`)

| Area | Files |
|---|---|
| Helpers | `helpers/dateTime.ts` — add `ISO_DATETIME_REGEX`, `parseToLocalDateTime`, `isValidISODateTime` |
| Editors | `editors/datetimeEditor/{datetimeEditor.ts,index.ts}` (native `datetime-local`, `step=1`, setValue/getValue normalization); `editors/intlDatetimeEditor/{intlDatetimeEditor.ts,index.ts}` (extends base) |
| Renderers | `renderers/datetimeRenderer/{datetimeRenderer.ts,index.ts}` (Intl formatting via `dateTimeFormat` + `valueFormatter`); `renderers/intlDatetimeRenderer/{intlDatetimeRenderer.ts,index.ts}` (delegates) |
| Validators | `validators/datetimeValidator/{datetimeValidator.ts,index.ts}` (`isValidISODateTime`, `sourceDataValidator`, `SOURCE_DATA_WARNING_MESSAGE`); `validators/intlDatetimeValidator/{intlDatetimeValidator.ts,index.ts}` (delegates) |
| Cell types | `cellTypes/datetimeType/`, `cellTypes/intlDatetimeType/`; register + export + extend `CellType` union in `cellTypes/index.ts`; register in editor/renderer/validator barrels |

## Plugin integration (full parity)

- **Column sorting:** `plugins/columnSorting/sortFunction/datetime.ts` + `intlDatetime.ts`;
  `createDateTimeCompareFunction` / `createIntlDateTimeCompareFunction` in `utils.ts` (reusing the
  memoized `createParsingCompareFunction` around `parseToLocalDateTime`); register both in
  `sortService/registry.ts`.
- **Filters:** one shared datetime condition set under `condition/intlDatetime/`
  (`before`/`beforeOrEqual`/`after`/`afterOrEqual`/`between`, `inputType: 'datetime-local'`,
  parsing via `parseToLocalDateTime`). Add `TYPE_DATETIME` + `TYPE_INTL_DATETIME` and their
  options-list entries in `filters/constants.ts`; both map to the same set. Reuses existing
  `FILTERS_CONDITIONS_*` i18n constants — no new i18n (same as `intl-time`).
- **XLSX export:** `plugins/exportFile/types/xlsx/date-utils.ts` — add
  `parseIsoDateTimeStringToSerial` + a datetime `numFmt`; branch for `datetime`/`intl-datetime` in
  `xlsx.ts`.

## metaSchema (`dataMap/metaManager/metaSchema.ts`)

- Add the `dateTimeFormat` option with multiline JSDoc + default.
- Add `datetime` / `intl-datetime` to the documented `type` values.
- **Action item 1:** add a clarifying note to the existing `dateFormat` JSDoc that time-related
  options only affect display and render midnight for date-only source data, pointing users to the
  new datetime types for real datetime support.

## Docs

- New guide `docs/content/guides/cell-types/datetime-cell-type/` (mirror `time-cell-type`),
  registered in the sidebar.
- **Action item 1:** same clarifying note added to the date cell type guide.

## Testing (machine-enforced presence gate)

- **Unit (`*.unit.js`):** `helpers/dateTime` datetime cases (regex, parse, validity incl. leniency
  and calendar bounds); `datetimeType`/`intlDatetimeType`; renderer/validator/editor.
- **E2E (new = Playwright `tests/e2e/*.spec.ts`):** render, edit through the native picker,
  validation of bad values, column sorting, filtering, xlsx export.
- **TS types regression:** `CellType` union accepts `'datetime'`/`'intl-datetime'`.
- **Changelog:** an `added` entry for the new cell types + `dateTimeFormat` option.

## Risks / notes

- **Breaking changes:** none. Only additive (new types, new option, new docs). No default changed.
- Native `datetime-local` timezone: values are wall-clock/local, consistent with `date`/`time`.
- Lexicographic sort of canonical ISO is correct; the dedicated parse-based sort function also
  handles the lenient/mixed inputs.
