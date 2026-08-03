# `datetime` + `intl-datetime` Cell Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add official `datetime` and `intl-datetime` cell types (native zero-dependency `datetime-local` editor, `Intl.DateTimeFormat` renderer, ISO validation) as first-class members of the date/time cell-type family, plus a docs clarification that `intl-date`'s time options only affect display (DEV-1463 / #12366).

**Architecture:** Mirror the existing `time`/`intl-time` family exactly. `datetime` is the base implementation; `intl-datetime` is a thin wrapper delegating to it with its own type identifier. Canonical source value is ISO 8601 `YYYY-MM-DDTHH:mm:ss`; parsing is lenient (accepts date-only, space separator, optional seconds/millis) so #12366's mixed data works. A new `dateTimeFormat` option (`Intl.DateTimeFormatOptions`) drives display. Full plugin parity: column sorting, filters, and xlsx export.

**Tech Stack:** TypeScript (core `handsontable/src`), Jest (`*.unit.js/ts`), Playwright (`tests/e2e/*.spec.ts`), Astro docs site.

**Branch:** `feature/issue-12366` (already created).

**Conventions (read `handsontable/CLAUDE.md`):** multiline JSDoc only; no `throw new Error` (use `throwWithCause`); no barrel imports from `*/index`; `#`-private fields; cognitive complexity ≤ 15. Run targeted unit tests with `npm --prefix handsontable run test:unit -- --testPathPattern=<regex>`. Rebuild (`npm --prefix handsontable run build`) before E2E.

---

## Reference implementations (read before starting)

The `intl-time` family is the exact template. Open these side-by-side:
- `handsontable/src/helpers/dateTime.ts` (TIME_REGEX, parseToLocalTime, isValidTime)
- `handsontable/src/editors/timeEditor/timeEditor.ts` + `intlTimeEditor/intlTimeEditor.ts`
- `handsontable/src/renderers/timeRenderer/timeRenderer.ts` + `intlTimeRenderer/`
- `handsontable/src/validators/timeValidator/timeValidator.ts` + `intlTimeValidator/`
- `handsontable/src/cellTypes/timeType/` + `intlTimeType/`
- `handsontable/src/plugins/columnSorting/sortFunction/{time,intlTime}.ts` + `utils.ts` + `sortService/registry.ts`
- `handsontable/src/plugins/filters/condition/intlTime/*` + `constants.ts`
- `handsontable/src/plugins/exportFile/types/xlsx/date-utils.ts` + `xlsx.ts`

---

## Task 1: `dateTime.ts` helpers — regex, parse, validity

**Files:**
- Modify: `handsontable/src/helpers/dateTime.ts`
- Test: `handsontable/src/helpers/__tests__/dateTime.unit.js` (create if absent; otherwise append)

- [ ] **Step 1: Write the failing test**

Create/append `handsontable/src/helpers/__tests__/dateTime.unit.js`:

```js
import {
  ISO_DATETIME_REGEX,
  parseToLocalDateTime,
  isValidISODateTime,
} from '../dateTime';

describe('dateTime datetime helpers', () => {
  describe('ISO_DATETIME_REGEX', () => {
    it('accepts date-only, T-separated, and space-separated values', () => {
      expect(ISO_DATETIME_REGEX.test('2024-03-15')).toBe(true);
      expect(ISO_DATETIME_REGEX.test('2024-03-17T23:59:59')).toBe(true);
      expect(ISO_DATETIME_REGEX.test('2024-03-16 09:00:00')).toBe(true);
      expect(ISO_DATETIME_REGEX.test('2024-03-16T09:00')).toBe(true);
      expect(ISO_DATETIME_REGEX.test('2024-03-16T09:00:00.500')).toBe(true);
    });

    it('rejects malformed values', () => {
      expect(ISO_DATETIME_REGEX.test('2024-13-01')).toBe(false);
      expect(ISO_DATETIME_REGEX.test('2024-03-15T24:00')).toBe(false);
      expect(ISO_DATETIME_REGEX.test('not-a-date')).toBe(false);
    });
  });

  describe('parseToLocalDateTime', () => {
    it('parses a full datetime to a local Date', () => {
      const d = parseToLocalDateTime('2024-12-25T14:30:00');

      expect(d).toBeInstanceOf(Date);
      expect(d.getFullYear()).toBe(2024);
      expect(d.getMonth()).toBe(11);
      expect(d.getDate()).toBe(25);
      expect(d.getHours()).toBe(14);
      expect(d.getMinutes()).toBe(30);
    });

    it('parses date-only as local midnight', () => {
      const d = parseToLocalDateTime('2024-06-01');

      expect(d.getHours()).toBe(0);
      expect(d.getMinutes()).toBe(0);
    });

    it('returns null for empty and invalid input', () => {
      expect(parseToLocalDateTime('')).toBe(null);
      expect(parseToLocalDateTime(null)).toBe(null);
      expect(parseToLocalDateTime('nope')).toBe(null);
    });
  });

  describe('isValidISODateTime', () => {
    it('is true for valid datetimes and enforces calendar bounds', () => {
      expect(isValidISODateTime('2024-03-15')).toBe(true);
      expect(isValidISODateTime('2024-02-29T10:00:00')).toBe(true); // leap year
      expect(isValidISODateTime('2023-02-29T10:00:00')).toBe(false); // non-leap
      expect(isValidISODateTime('2024-04-31')).toBe(false); // April has 30 days
    });

    it('is false for non-strings', () => {
      expect(isValidISODateTime(20240315)).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=helpers/__tests__/dateTime.unit`
Expected: FAIL — `ISO_DATETIME_REGEX`/`parseToLocalDateTime`/`isValidISODateTime` not exported.

- [ ] **Step 3: Implement the helpers**

In `handsontable/src/helpers/dateTime.ts`, after the `isValidTime` function (around line 107), add. Note `DAYS_IN_MONTH` and `isLeapYear` already exist in this file — reuse them.

```ts
/**
 * ISO 8601 date-time pattern. The date part is required; the time part is optional and may use a
 * `T` or space separator, with optional seconds and fractional seconds (`YYYY-MM-DD`,
 * `YYYY-MM-DDTHH:mm`, `YYYY-MM-DDTHH:mm:ss`, `YYYY-MM-DD HH:mm:ss.SSS`).
 */
export const ISO_DATETIME_REGEX =
  /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?:[T ]([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.(\d{1,3}))?)?)?$/;

/**
 * Parses an ISO 8601 date-time string to a local Date. Date-only values become local midnight.
 */
export function parseToLocalDateTime(value: unknown): Date | null {
  if (isEmpty(value)) {
    return null;
  }
  if (typeof value !== 'string') {
    return null;
  }

  const match = ISO_DATETIME_REGEX.exec(value);

  if (!match) {
    return null;
  }

  const [datePart] = value.split(/[T ]/);
  const [year, month, day] = datePart.split('-').map(Number);
  const hours = match[3] !== undefined ? Number(match[3]) : 0;
  const minutes = match[4] !== undefined ? Number(match[4]) : 0;
  const seconds = match[5] !== undefined ? Number(match[5]) : 0;
  const milliseconds = match[6] !== undefined
    ? Number(match[6].padEnd(3, '0').slice(0, 3))
    : 0;

  return new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
}

/**
 * Checks if a string is a valid ISO 8601 date-time, enforcing the day-of-month calendar bound.
 */
export function isValidISODateTime(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const match = ISO_DATETIME_REGEX.exec(value);

  if (!match) {
    return false;
  }

  const year = +value.slice(0, 4);
  const month = +match[1];
  const day = +match[2];
  const maxDay = month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];

  return day <= maxDay;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=helpers/__tests__/dateTime.unit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add handsontable/src/helpers/dateTime.ts handsontable/src/helpers/__tests__/dateTime.unit.js
git commit -m "DEV-1463: Add ISO datetime helpers (regex, parse, validity)"
```

---

## Task 2: `datetimeRenderer` + `intlDatetimeRenderer`

**Files:**
- Create: `handsontable/src/renderers/datetimeRenderer/datetimeRenderer.ts`, `index.ts`
- Create: `handsontable/src/renderers/intlDatetimeRenderer/intlDatetimeRenderer.ts`, `index.ts`
- Modify: `handsontable/src/renderers/index.ts`
- Test: `handsontable/src/renderers/datetimeRenderer/__tests__/datetimeRenderer.unit.js`

- [ ] **Step 1: Write the failing test**

Create `handsontable/src/renderers/datetimeRenderer/__tests__/datetimeRenderer.unit.js`:

```js
import { valueFormatter } from '../datetimeRenderer';
import { BAD_VALUE_TEXT } from '../../../helpers/constants';

describe('datetimeRenderer valueFormatter', () => {
  it('formats a datetime via Intl using dateTimeFormat', () => {
    const out = valueFormatter('2024-12-25T14:30:00', {
      dateTimeFormat: { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false },
      locale: 'en-GB',
    });

    expect(out).toContain('2024');
    expect(out).toContain('14:30');
  });

  it('formats a date-only value at midnight', () => {
    const out = valueFormatter('2024-06-01', {
      dateTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
      locale: 'en-GB',
    });

    expect(out).toContain('00:00');
  });

  it('returns the bad-value placeholder for invalid input', () => {
    expect(valueFormatter('not-a-date', {})).toBe(BAD_VALUE_TEXT);
  });

  it('returns empty value when allowEmpty is true', () => {
    expect(valueFormatter('', { allowEmpty: true })).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=datetimeRenderer.unit`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the renderer**

Create `handsontable/src/renderers/datetimeRenderer/datetimeRenderer.ts`:

```ts
import { textRenderer } from '../textRenderer';
import { isEmpty } from '../../helpers/mixed';
import { isObject } from '../../helpers/object';
import { BAD_VALUE_TEXT } from '../../helpers/constants';
import { parseToLocalDateTime } from '../../helpers/dateTime';
import { warn } from '../../helpers/console';

export const RENDERER_TYPE: 'datetime' = 'datetime';

const DEFAULT_INTL_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
};

const stringFormatWarnShown = new WeakSet<object>();

type CellProperties = Record<string, unknown> & {
  dateTimeFormat?: Intl.DateTimeFormatOptions; locale?: string; allowEmpty?: boolean;
  instance?: object;
};

/**
 * Formats a date-time value using Intl.DateTimeFormat.
 *
 * @param {unknown} value The raw ISO date-time value.
 * @param {CellProperties} cellProperties The cell meta object.
 * @returns {unknown} The formatted date-time string, or a placeholder for empty/invalid values.
 */
export function valueFormatter(value: unknown, cellProperties: CellProperties): unknown {
  const { dateTimeFormat, locale, allowEmpty, instance } = cellProperties;

  if (isEmpty(value)) {
    return allowEmpty ? value : BAD_VALUE_TEXT;
  }

  const date = parseToLocalDateTime(value);

  if (date === null) {
    return BAD_VALUE_TEXT;
  }

  if (typeof dateTimeFormat === 'string' && instance && !stringFormatWarnShown.has(instance)) {
    stringFormatWarnShown.add(instance);
    warn(
      'The dateTimeFormat option as a string is not supported. Use an Intl.DateTimeFormatOptions object instead.'
    );
  }

  const intlFormat = isObject(dateTimeFormat) ? dateTimeFormat as Intl.DateTimeFormatOptions : DEFAULT_INTL_FORMAT;

  return new Intl.DateTimeFormat(locale, intlFormat).format(date);
}

type HotInstance = Record<string, unknown>;

export interface DatetimeRendererFn {
  (this: unknown, hotInstance: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
    prop: string | number, value: unknown, cellProperties: CellProperties): void;
  RENDERER_TYPE: string;
  valueFormatter: typeof valueFormatter;
}

/**
 * Default date-time renderer.
 *
 * @private
 * @param {Core} hotInstance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property.
 * @param {*} value The rendered value.
 * @param {object} cellProperties The cell meta object.
 */
function _datetimeRenderer(
  this: unknown,
  hotInstance: HotInstance,
  TD: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: unknown,
  cellProperties: CellProperties
): void {
  (textRenderer as (...args: unknown[]) => void).apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);
}

(_datetimeRenderer as DatetimeRendererFn).valueFormatter = valueFormatter;
(_datetimeRenderer as DatetimeRendererFn).RENDERER_TYPE = RENDERER_TYPE;

export const datetimeRenderer = _datetimeRenderer as DatetimeRendererFn;
```

Create `handsontable/src/renderers/datetimeRenderer/index.ts`:

```ts
export {
  RENDERER_TYPE,
  datetimeRenderer,
  valueFormatter,
} from './datetimeRenderer';
```

Create `handsontable/src/renderers/intlDatetimeRenderer/intlDatetimeRenderer.ts`:

```ts
import { datetimeRenderer, valueFormatter } from '../datetimeRenderer/datetimeRenderer';

export const RENDERER_TYPE = 'intl-datetime';

export { valueFormatter };

type HotInstance = Record<string, unknown>;

type CellProperties = Record<string, unknown> & {
  dateTimeFormat?: Intl.DateTimeFormatOptions; locale?: string; allowEmpty?: boolean;
};

export interface IntlDatetimeRendererFn {
  (this: unknown, hotInstance: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
    prop: string | number, value: unknown, cellProperties: CellProperties): void;
  RENDERER_TYPE: string;
  valueFormatter: typeof valueFormatter;
}

/**
 *
 */
function _intlDatetimeRenderer(
  this: unknown,
  hotInstance: HotInstance,
  TD: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: unknown,
  cellProperties: CellProperties
): void {
  (datetimeRenderer as (...args: unknown[]) => void).apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);
}

(_intlDatetimeRenderer as IntlDatetimeRendererFn).valueFormatter = valueFormatter;
(_intlDatetimeRenderer as IntlDatetimeRendererFn).RENDERER_TYPE = RENDERER_TYPE;

export const intlDatetimeRenderer = _intlDatetimeRenderer as IntlDatetimeRendererFn;
```

Create `handsontable/src/renderers/intlDatetimeRenderer/index.ts`:

```ts
export {
  RENDERER_TYPE,
  intlDatetimeRenderer,
  valueFormatter,
} from './intlDatetimeRenderer';
```

- [ ] **Step 4: Register in the renderers barrel**

In `handsontable/src/renderers/index.ts`: add imports near the other date/time renderer imports, add `registerRenderer(datetimeRenderer);` and `registerRenderer(intlDatetimeRenderer);` in `registerAllRenderers()`, and add both to the `export { ... }` block. Match the existing `intlTimeRenderer, INTL_TIME_RENDERER,` pattern:

```ts
import { datetimeRenderer, RENDERER_TYPE as DATETIME_RENDERER } from './datetimeRenderer';
import { intlDatetimeRenderer, RENDERER_TYPE as INTL_DATETIME_RENDERER } from './intlDatetimeRenderer';
// ...in registerAllRenderers():
registerRenderer(datetimeRenderer);
registerRenderer(intlDatetimeRenderer);
// ...in the export block:
datetimeRenderer, DATETIME_RENDERER,
intlDatetimeRenderer, INTL_DATETIME_RENDERER,
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=datetimeRenderer.unit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add handsontable/src/renderers/datetimeRenderer handsontable/src/renderers/intlDatetimeRenderer handsontable/src/renderers/index.ts
git commit -m "DEV-1463: Add datetime and intl-datetime renderers"
```

---

## Task 3: `datetimeValidator` + `intlDatetimeValidator`

**Files:**
- Create: `handsontable/src/validators/datetimeValidator/datetimeValidator.ts`, `index.ts`
- Create: `handsontable/src/validators/intlDatetimeValidator/intlDatetimeValidator.ts`, `index.ts`
- Modify: `handsontable/src/validators/index.ts`
- Test: `handsontable/src/validators/datetimeValidator/__tests__/datetimeValidator.unit.js`

- [ ] **Step 1: Write the failing test**

Create `handsontable/src/validators/datetimeValidator/__tests__/datetimeValidator.unit.js`:

```js
import { datetimeValidator, sourceDataValidator } from '../datetimeValidator';

describe('datetimeValidator', () => {
  it('accepts valid datetimes and date-only values', (done) => {
    const results = [];
    const push = v => results.push(v);

    datetimeValidator.call({}, '2024-12-25T14:30:00', push);
    datetimeValidator.call({}, '2024-06-01', push);
    datetimeValidator.call({}, '2024-03-16 09:00:00', push);
    datetimeValidator.call({}, 'not-a-date', push);

    setTimeout(() => {
      expect(results).toEqual([true, true, true, false]);
      done();
    }, 0);
  });

  it('accepts empty when allowEmpty', (done) => {
    datetimeValidator.call({ allowEmpty: true }, '', (v) => {
      expect(v).toBe(true);
      done();
    });
  });

  it('sourceDataValidator passes formula strings through', () => {
    expect(sourceDataValidator('=A1', {})).toBe(true);
    expect(sourceDataValidator('2024-12-25T14:30:00', {})).toBe(true);
    expect(sourceDataValidator('garbage', {})).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=datetimeValidator.unit`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the validator**

Create `handsontable/src/validators/datetimeValidator/datetimeValidator.ts`:

```ts
import { isValidISODateTime } from '../../helpers/dateTime';
import { isEmpty } from '../../helpers/mixed';

export const VALIDATOR_TYPE: 'datetime' = 'datetime';
export const SOURCE_DATA_WARNING_MESSAGE = 'Source data warning ([itemsCount]). ' +
  'Invalid value for "datetime" cell type.\n\n' +
  '[affectedCells]\n\n' +
  'Expected a value compatible with the ISO 8601 date-time format ("YYYY-MM-DDTHH:mm:ss").';

type CellMeta = Record<string, unknown> & { allowEmpty?: boolean };

/**
 * Validates a date-time value against the source data format.
 *
 * @param {unknown} value The value to validate.
 * @param {CellMeta} cellMeta The cell meta object.
 * @returns {boolean} True if valid.
 */
export function sourceDataValidator(value: unknown, cellMeta: CellMeta): boolean {
  if (cellMeta.allowEmpty && isEmpty(value)) {
    return true;
  }

  // Formula expressions are handled by the Formulas plugin — skip source-data validation for them.
  if (typeof value === 'string' && value.startsWith('=')) {
    return true;
  }

  return isValidISODateTime(value);
}

// Marks the validator as row-independent: its result depends only on the value and column/global-level
// meta (`allowEmpty`), never on per-row meta.
sourceDataValidator.rowIndependent = true;

/**
 * The DateTime cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function datetimeValidator(this: CellMeta, value: unknown, callback: (valid: boolean) => void): void {
  if (this.allowEmpty && isEmpty(value)) {
    callback(true);

    return;
  }

  callback(isValidISODateTime(value));
}

datetimeValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;
```

Create `handsontable/src/validators/datetimeValidator/index.ts`:

```ts
export {
  VALIDATOR_TYPE,
  SOURCE_DATA_WARNING_MESSAGE,
  datetimeValidator,
  sourceDataValidator,
} from './datetimeValidator';
```

Create `handsontable/src/validators/intlDatetimeValidator/intlDatetimeValidator.ts`:

```ts
import { datetimeValidator } from '../datetimeValidator/datetimeValidator';

export const VALIDATOR_TYPE = 'intl-datetime';
export const SOURCE_DATA_WARNING_MESSAGE = 'Source data warning ([itemsCount]). ' +
  'Invalid value for "intl-datetime" cell type.\n\n' +
  '[affectedCells]\n\n' +
  'Expected a value compatible with the ISO 8601 date-time format ("YYYY-MM-DDTHH:mm:ss").';

export { sourceDataValidator } from '../datetimeValidator/datetimeValidator';

type CellMeta = Record<string, unknown> & { allowEmpty?: boolean };

/**
 * The IntlDateTime cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function intlDatetimeValidator(this: CellMeta, value: unknown, callback: (valid: boolean) => void): void {
  datetimeValidator.call(this, value, callback);
}

intlDatetimeValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;
```

Create `handsontable/src/validators/intlDatetimeValidator/index.ts`:

```ts
export {
  VALIDATOR_TYPE,
  SOURCE_DATA_WARNING_MESSAGE,
  intlDatetimeValidator,
  sourceDataValidator,
} from './intlDatetimeValidator';
```

- [ ] **Step 4: Register in the validators barrel**

In `handsontable/src/validators/index.ts`: add imports, `registerValidator(datetimeValidator);` and `registerValidator(intlDatetimeValidator);`, and add both to the export block, mirroring `intlTimeValidator, INTL_TIME_VALIDATOR,`:

```ts
import { datetimeValidator, VALIDATOR_TYPE as DATETIME_VALIDATOR } from './datetimeValidator';
import { intlDatetimeValidator, VALIDATOR_TYPE as INTL_DATETIME_VALIDATOR } from './intlDatetimeValidator';
// ...in registerAllValidators():
registerValidator(datetimeValidator);
registerValidator(intlDatetimeValidator);
// ...in the export block:
datetimeValidator, DATETIME_VALIDATOR,
intlDatetimeValidator, INTL_DATETIME_VALIDATOR,
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=datetimeValidator.unit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add handsontable/src/validators/datetimeValidator handsontable/src/validators/intlDatetimeValidator handsontable/src/validators/index.ts
git commit -m "DEV-1463: Add datetime and intl-datetime validators"
```

---

## Task 4: `datetimeEditor` + `intlDatetimeEditor`

**Files:**
- Create: `handsontable/src/editors/datetimeEditor/datetimeEditor.ts`, `index.ts`
- Create: `handsontable/src/editors/intlDatetimeEditor/intlDatetimeEditor.ts`, `index.ts`
- Modify: `handsontable/src/editors/index.ts`
- Test: `handsontable/src/editors/datetimeEditor/__tests__/datetimeEditor.unit.js`

- [ ] **Step 1: Write the failing test**

The editor extends `TextEditor` and needs the DOM/`hot` instance, so unit-test only the pure normalization by exercising `setValue`/`getValue` against a stubbed super. Create `handsontable/src/editors/datetimeEditor/__tests__/datetimeEditor.unit.js`:

```js
import { DatetimeEditor } from '../datetimeEditor';

describe('DatetimeEditor value normalization', () => {
  const makeEditor = () => {
    const editor = Object.create(DatetimeEditor.prototype);

    editor._value = '';
    // Stub the TextEditor super methods used by setValue/getValue.
    Object.defineProperty(editor, 'TEXTAREA', { value: { value: '' }, writable: true });
    editor.cellProperties = {};

    return editor;
  };

  it('exposes the datetime EDITOR_TYPE', () => {
    expect(DatetimeEditor.EDITOR_TYPE).toBe('datetime');
  });

  it('getValue pads HH:mm to HH:mm:ss', () => {
    const editor = makeEditor();

    editor.TEXTAREA.value = '2024-03-16T09:00';
    expect(editor.getValue()).toBe('2024-03-16T09:00:00');

    editor.TEXTAREA.value = '2024-03-16T09:00:30';
    expect(editor.getValue()).toBe('2024-03-16T09:00:30');
  });
});
```

Note: `getValue` in `TextEditor` returns `this.TEXTAREA.value` — the stub above satisfies it. `setValue` writes to the DOM and is covered by the E2E test in Task 11.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=datetimeEditor.unit`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the editor**

Create `handsontable/src/editors/datetimeEditor/datetimeEditor.ts`:

```ts
import type { CellProperties } from '../../settings';
import { TextEditor } from '../textEditor';
import { isValidISODateTime } from '../../helpers/dateTime';
import { warn } from '../../helpers/console';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { isEmpty } from '../../helpers/mixed';

export const EDITOR_TYPE = 'datetime';

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const NO_SECONDS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/**
 * @private
 * @class DatetimeEditor
 */
export class DatetimeEditor extends TextEditor {
  /**
   * Returns the unique editor type identifier for the datetime editor.
   */
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  /**
   * Initializes the editor and registers an afterSetTheme hook to close on theme changes.
   */
  init(): void {
    super.init();

    this.hot.addHook('afterSetTheme', (themeName: string, firstRun: boolean) => {
      if (!firstRun) {
        this.close();
      }
    });
  }

  /**
   * Prepares the editor, replacing the display value with the raw ISO source data for the native input.
   */
  prepare(row: number, col: number, prop: string | number, td: HTMLTableCellElement,
          value: unknown, cellProperties: CellProperties): void {
    super.prepare(row, col, prop, td, value, cellProperties);

    // The value passed to prepare() is the formatted display value. Replace originalValue with the
    // raw source data so the native datetime-local input receives an ISO string.
    const physicalRow = this.hot.toPhysicalRow(row);

    this.originalValue = this.hot.getSourceDataAtCell(physicalRow, col);
  }

  /**
   * Creates the editor's element as a native datetime-local input that shows seconds.
   */
  createElements(type?: string): void {
    super.createElements('input');

    this.TEXTAREA.setAttribute('type', 'datetime-local');
    this.TEXTAREA.setAttribute('step', '1');
    this.TEXTAREA.setAttribute('dir', 'ltr');
  }

  /**
   * Sets the editor value, normalizing to the `YYYY-MM-DDTHH:mm:ss` form the native input expects,
   * and warns if the value is not a valid ISO date-time string.
   */
  setValue(value?: unknown): void {
    if (isEmpty(value)) {
      super.setValue('');

      return;
    }

    if (!isValidISODateTime(value)) {
      warn(toSingleLine`DatetimeEditor: value must be in ISO date-time format ("YYYY-MM-DDTHH:mm:ss")\x20
        required by the native datetime-local input. Received:`, value);

      super.setValue('');

      return;
    }

    let normalized = String(value).replace(' ', 'T');

    if (DATE_ONLY_RE.test(normalized)) {
      normalized += 'T00:00:00';
    } else if (NO_SECONDS_RE.test(normalized)) {
      normalized += ':00';
    }

    super.setValue(normalized);
  }

  /**
   * Returns the editor value, canonicalizing to `YYYY-MM-DDTHH:mm:ss` (native input may omit seconds).
   */
  getValue(): string {
    const value = super.getValue();

    if (value && NO_SECONDS_RE.test(value)) {
      return `${value}:00`;
    }

    return value;
  }

  /**
   * Selects all text in the input element when the editor receives focus.
   */
  focus(): void {
    this.TEXTAREA.select();
  }

  /**
   * Opens the editor and programmatically invokes the native picker via showPicker().
   */
  open(): void {
    super.open();

    try {
      (this.TEXTAREA as HTMLInputElement).showPicker();
    } catch {
      // Prevents showPicker() user-gesture errors in tests
    }
  }
}
```

Create `handsontable/src/editors/datetimeEditor/index.ts`:

```ts
export {
  EDITOR_TYPE,
  DatetimeEditor,
} from './datetimeEditor';
```

Create `handsontable/src/editors/intlDatetimeEditor/intlDatetimeEditor.ts`:

```ts
import { DatetimeEditor } from '../datetimeEditor';

export const EDITOR_TYPE = 'intl-datetime';

/**
 * @private
 * @class IntlDatetimeEditor
 */
export class IntlDatetimeEditor extends DatetimeEditor {
  /**
   * Returns the unique editor type identifier for the intl-datetime editor.
   */
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }
}
```

Create `handsontable/src/editors/intlDatetimeEditor/index.ts`:

```ts
export {
  EDITOR_TYPE,
  IntlDatetimeEditor,
} from './intlDatetimeEditor';
```

- [ ] **Step 4: Register in the editors barrel**

In `handsontable/src/editors/index.ts`: add imports, `registerEditor(DatetimeEditor);` and `registerEditor(IntlDatetimeEditor);` in `registerAllEditors()`, and add both to the export block, mirroring `IntlTimeEditor, INTL_TIME_EDITOR,`:

```ts
import { DatetimeEditor, EDITOR_TYPE as DATETIME_EDITOR } from './datetimeEditor';
import { IntlDatetimeEditor, EDITOR_TYPE as INTL_DATETIME_EDITOR } from './intlDatetimeEditor';
// ...in registerAllEditors():
registerEditor(DatetimeEditor);
registerEditor(IntlDatetimeEditor);
// ...in the export block:
DatetimeEditor, DATETIME_EDITOR,
IntlDatetimeEditor, INTL_DATETIME_EDITOR,
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=datetimeEditor.unit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add handsontable/src/editors/datetimeEditor handsontable/src/editors/intlDatetimeEditor handsontable/src/editors/index.ts
git commit -m "DEV-1463: Add datetime and intl-datetime editors"
```

---

## Task 5: `datetimeType` + `intlDatetimeType` cell types

**Files:**
- Create: `handsontable/src/cellTypes/datetimeType/datetimeType.ts`, `index.ts`
- Create: `handsontable/src/cellTypes/intlDatetimeType/intlDatetimeType.ts`, `index.ts`
- Modify: `handsontable/src/cellTypes/index.ts`
- Test: `handsontable/src/cellTypes/datetimeType/__tests__/datetimeType.unit.ts`, `handsontable/src/cellTypes/intlDatetimeType/__tests__/intlDatetimeType.unit.js`

- [ ] **Step 1: Write the failing tests**

Create `handsontable/src/cellTypes/datetimeType/__tests__/datetimeType.unit.ts` (mirror `timeType.unit.ts`):

```ts
import { CELL_TYPE, DatetimeCellType } from '../';
import {
  getCellType,
  getRegisteredCellTypeNames,
  registerCellType,
} from '../../registry';
import { getEditor, getRegisteredEditorNames } from '../../../editors';
import { getRegisteredRendererNames, getRenderer } from '../../../renderers';
import { getRegisteredValidatorNames, getValidator } from '../../../validators';

describe('DatetimeCellType', () => {
  describe('registering', () => {
    it('should register cell type', () => {
      registerCellType(CELL_TYPE, DatetimeCellType);

      expect(getRegisteredEditorNames()).toEqual(['datetime']);
      expect(getEditor('datetime')).toBeInstanceOf(Function);
      expect(getRegisteredRendererNames()).toEqual(['datetime']);
      expect(getRenderer('datetime')).toBeInstanceOf(Function);
      expect(getRegisteredValidatorNames()).toEqual(['datetime']);
      expect(getValidator('datetime')).toBeInstanceOf(Function);
      expect(getRegisteredCellTypeNames()).toEqual(['datetime']);
      expect(getCellType('datetime')).toEqual({
        CELL_TYPE,
        editor: getEditor('datetime'),
        renderer: getRenderer('datetime'),
        validator: getValidator('datetime'),
        sourceDataValidator: expect.any(Function),
        sourceDataWarningMessage: expect.any(String),
        valueFormatter: expect.any(Function),
      });
    });
  });
});
```

Create `handsontable/src/cellTypes/intlDatetimeType/__tests__/intlDatetimeType.unit.js` (mirror `intlTimeType.unit.js`):

```js
import { CELL_TYPE, IntlDatetimeCellType } from '../';
import { CELL_TYPE as DATETIME_CELL_TYPE, DatetimeCellType } from '../../datetimeType';
import { getCellType, getRegisteredCellTypeNames, registerCellType } from '../../registry';
import { getEditor } from '../../../editors';
import { getValidator } from '../../../validators';

describe('IntlDatetimeCellType', () => {
  it('should register cell type', () => {
    registerCellType(CELL_TYPE, IntlDatetimeCellType);

    expect(getRegisteredCellTypeNames()).toEqual(['intl-datetime']);
    expect(getCellType('intl-datetime')).toEqual(IntlDatetimeCellType);
  });

  it('resolves the intl-datetime editor to the same base implementation as the datetime editor', () => {
    registerCellType(CELL_TYPE, IntlDatetimeCellType);
    registerCellType(DATETIME_CELL_TYPE, DatetimeCellType);

    const intlProto = Object.getPrototypeOf(getEditor('intl-datetime'));

    expect(intlProto).toBe(getEditor('datetime'));
  });

  it('validates the same as datetime', (done) => {
    registerCellType(CELL_TYPE, IntlDatetimeCellType);
    const results = [];
    const push = v => results.push(v);
    const validator = getValidator('intl-datetime');

    validator.call({}, '2024-12-25T14:30:00', push);
    validator.call({}, '25:00', push);

    setTimeout(() => {
      expect(results).toEqual([true, false]);
      done();
    }, 0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern="datetimeType.unit|intlDatetimeType.unit"`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the cell types**

Create `handsontable/src/cellTypes/datetimeType/datetimeType.ts`:

```ts
import { DatetimeEditor } from '../../editors/datetimeEditor';
import { datetimeRenderer, valueFormatter } from '../../renderers/datetimeRenderer';
import {
  SOURCE_DATA_WARNING_MESSAGE,
  datetimeValidator,
  sourceDataValidator,
} from '../../validators/datetimeValidator';

export const CELL_TYPE: 'datetime' = 'datetime';
export const DatetimeCellType = {
  CELL_TYPE,
  editor: DatetimeEditor,
  renderer: datetimeRenderer,
  validator: datetimeValidator,
  sourceDataValidator,
  sourceDataWarningMessage: SOURCE_DATA_WARNING_MESSAGE,
  valueFormatter,
};
```

Create `handsontable/src/cellTypes/datetimeType/index.ts`:

```ts
export {
  CELL_TYPE,
  DatetimeCellType,
} from './datetimeType';
```

Create `handsontable/src/cellTypes/intlDatetimeType/intlDatetimeType.ts`:

```ts
import { IntlDatetimeEditor } from '../../editors/intlDatetimeEditor';
import { intlDatetimeRenderer, valueFormatter } from '../../renderers/intlDatetimeRenderer';
import {
  SOURCE_DATA_WARNING_MESSAGE,
  intlDatetimeValidator,
  sourceDataValidator,
} from '../../validators/intlDatetimeValidator';

export const CELL_TYPE = 'intl-datetime';
export const IntlDatetimeCellType = {
  CELL_TYPE,
  editor: IntlDatetimeEditor,
  renderer: intlDatetimeRenderer,
  validator: intlDatetimeValidator,
  sourceDataValidator,
  sourceDataWarningMessage: SOURCE_DATA_WARNING_MESSAGE,
  valueFormatter,
};
```

Create `handsontable/src/cellTypes/intlDatetimeType/index.ts`:

```ts
export {
  CELL_TYPE,
  IntlDatetimeCellType,
} from './intlDatetimeType';
```

- [ ] **Step 4: Register in the cellTypes barrel**

In `handsontable/src/cellTypes/index.ts`:
- add imports next to the intl-date/intl-time imports:
  ```ts
  import { DatetimeCellType, CELL_TYPE as DATETIME_TYPE } from './datetimeType';
  import { IntlDatetimeCellType, CELL_TYPE as INTL_DATETIME_TYPE } from './intlDatetimeType';
  ```
- in `registerAllCellTypes()` add:
  ```ts
  registerCellType(DatetimeCellType);
  registerCellType(IntlDatetimeCellType);
  ```
- in the `export { ... }` block add:
  ```ts
  DatetimeCellType, DATETIME_TYPE,
  IntlDatetimeCellType, INTL_DATETIME_TYPE,
  ```
- extend the `CellType` union (append before `| string`):
  ```ts
  | typeof DATETIME_TYPE | typeof INTL_DATETIME_TYPE
  ```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern="datetimeType.unit|intlDatetimeType.unit"`
Expected: PASS.

- [ ] **Step 6: Type-check**

Run: `npm --prefix handsontable run test:types`
Expected: PASS (the `CellType` union compiles).

- [ ] **Step 7: Commit**

```bash
git add handsontable/src/cellTypes/datetimeType handsontable/src/cellTypes/intlDatetimeType handsontable/src/cellTypes/index.ts
git commit -m "DEV-1463: Add datetime and intl-datetime cell types"
```

---

## Task 6: `metaSchema` — `dateTimeFormat` option, `type` docs, and the `dateFormat` clarifying note (action item 1)

**Files:**
- Modify: `handsontable/src/dataMap/metaManager/metaSchema.ts`

- [ ] **Step 1: Add the `dateTimeFormat` option**

Insert immediately after the `timeFormat: { hour: '2-digit', minute: '2-digit' },` line (currently ~line 1974):

```ts
    /**
     * Configures the date-time format for `datetime` and `intl-datetime` cells using an
     * [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat)
     * options object. The locale is controlled separately via the [`locale`](@/api/options.md#locale) option.
     *
     * ::: tip Source data format
     * Source data must be in ISO 8601 date-time format (`YYYY-MM-DDTHH:mm:ss`; a date-only
     * `YYYY-MM-DD` value is treated as midnight). Otherwise operations such as sorting and filtering
     * can be unstable or unpredictable. The `dateTimeFormat` object affects only how values are
     * displayed; the underlying value should remain ISO.
     * :::
     *
     * For the full list of supported properties, see
     * [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat).
     *
     * Read more:
     * - [Date-time cell type](@/guides/cell-types/datetime-cell-type/datetime-cell-type.md)
     * - [`locale`](@/api/options.md#locale)
     *
     * @memberof Options#
     * @type {object}
     * @default { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }
     * @category Core
     *
     * @example
     * ```js
     * columns: [
     *   {
     *     type: 'intl-datetime',
     *     locale: 'en-US',
     *     dateTimeFormat: {
     *       dateStyle: 'medium',
     *       timeStyle: 'short'
     *     }
     *   }
     * ]
     * ```
     */
    dateTimeFormat: {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    },
```

- [ ] **Step 2: Add the clarifying note to the `dateFormat` JSDoc (action item 1)**

In the `dateFormat` JSDoc, inside the existing `::: tip Source data format` block (currently ~lines 1846–1850), append this sentence after "…the underlying value should remain ISO.":

```
     *
     * Time-related options (`hour`, `minute`, `second`, `timeStyle`, `hour12`, `hourCycle`,
     * `fractionalSecondDigits`) only affect display and always render midnight (`00:00:00`) for
     * `date`/`intl-date` cells, because their source data is date-only. For editable date *and*
     * time values, use the [`datetime`/`intl-datetime` cell type](@/guides/cell-types/datetime-cell-type/datetime-cell-type.md).
```

- [ ] **Step 3: Document the new types in the `type` option table**

In the `type` option JSDoc table (currently ~lines 6350–6351, after the `'intl-time'` row), add two rows:

```
     * | [`'datetime'`](@/guides/cell-types/datetime-cell-type/datetime-cell-type.md)                 | Renderer: `DatetimeRenderer`<br>Editor: `DatetimeEditor`<br>Validator: `DatetimeValidator`                                                                                                 |
     * | [`'intl-datetime'`](@/guides/cell-types/datetime-cell-type/datetime-cell-type.md)                 | Renderer: `IntlDatetimeRenderer`<br>Editor: `IntlDatetimeEditor`<br>Validator: `IntlDatetimeValidator`                                                                                                 |
```

- [ ] **Step 4: Verify the schema still lints and the default is present**

Run: `npm --prefix handsontable run eslint`
Expected: PASS (no JSDoc violations).

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=metaSchema`
Expected: PASS (if a metaSchema spec exists; otherwise skip).

- [ ] **Step 5: Commit**

```bash
git add handsontable/src/dataMap/metaManager/metaSchema.ts
git commit -m "DEV-1463: Add dateTimeFormat option and clarify intl-date time options in metaSchema"
```

---

## Task 7: Column sorting integration

**Files:**
- Modify: `handsontable/src/plugins/columnSorting/utils.ts`
- Create: `handsontable/src/plugins/columnSorting/sortFunction/datetime.ts`, `intlDatetime.ts`
- Modify: `handsontable/src/plugins/columnSorting/sortService/registry.ts`
- Test: `handsontable/src/plugins/columnSorting/__tests__/datetimeSort.unit.js`

- [ ] **Step 1: Write the failing test**

Create `handsontable/src/plugins/columnSorting/__tests__/datetimeSort.unit.js`:

```js
import { createDateTimeCompareFunction } from '../utils';

describe('createDateTimeCompareFunction', () => {
  it('orders datetimes ascending, including mixed date-only and full values', () => {
    const cmp = createDateTimeCompareFunction('asc', {});
    const values = ['2024-03-17T23:59:59', '2024-03-15', '2024-03-16 09:00:00'];

    values.sort(cmp);

    expect(values).toEqual(['2024-03-15', '2024-03-16 09:00:00', '2024-03-17T23:59:59']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=datetimeSort.unit`
Expected: FAIL — `createDateTimeCompareFunction` not exported.

- [ ] **Step 3: Add the compare-function factory**

In `handsontable/src/plugins/columnSorting/utils.ts`:
- extend the existing import from `../../helpers/dateTime` to also import `parseToLocalDateTime`.
- after `createIntlTimeCompareFunction` (~line 225), add:

```ts
/**
 * Creates a date-time sorting compare function.
 *
 * @param {string} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {object} columnPluginSettings Plugin settings for the column.
 * @returns {Function} The compare function.
 */
export function createDateTimeCompareFunction(
  sortOrder: string,
  columnPluginSettings: Record<string, unknown>
): (value: unknown, nextValue: unknown) => number {
  return createParsingCompareFunction(parseToLocalDateTime, sortOrder, columnPluginSettings);
}
```

- [ ] **Step 4: Create the sort-function modules**

Create `handsontable/src/plugins/columnSorting/sortFunction/datetime.ts`:

```ts
import { createDateTimeCompareFunction } from '../utils';

/**
 * Date-time sorting compare function factory.
 *
 * @param {string} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {object} _columnMeta Column meta object (unused).
 * @param {object} columnPluginSettings Plugin settings for the column.
 * @returns {Function} The compare function.
 */
export function compareFunctionFactory(
  sortOrder: string, _columnMeta: Record<string, unknown>, columnPluginSettings: Record<string, unknown>
) {
  return createDateTimeCompareFunction(sortOrder, columnPluginSettings);
}

export const COLUMN_DATA_TYPE = 'datetime';
```

Create `handsontable/src/plugins/columnSorting/sortFunction/intlDatetime.ts`:

```ts
import { createDateTimeCompareFunction } from '../utils';

/**
 * Intl date-time sorting compare function factory.
 *
 * @param {string} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {object} _columnMeta Column meta object (unused).
 * @param {object} columnPluginSettings Plugin settings for the column.
 * @returns {Function} The compare function.
 */
export function compareFunctionFactory(
  sortOrder: string, _columnMeta: Record<string, unknown>, columnPluginSettings: Record<string, unknown>
) {
  return createDateTimeCompareFunction(sortOrder, columnPluginSettings);
}

export const COLUMN_DATA_TYPE = 'intl-datetime';
```

- [ ] **Step 5: Register the sort functions**

In `handsontable/src/plugins/columnSorting/sortService/registry.ts`:
- add imports after the `intlTime` import:
  ```ts
  import {
    compareFunctionFactory as datetimeSort,
    COLUMN_DATA_TYPE as DATETIME_DATA_TYPE,
  } from '../sortFunction/datetime';
  import {
    compareFunctionFactory as intlDatetimeSort,
    COLUMN_DATA_TYPE as INTL_DATETIME_DATA_TYPE,
  } from '../sortFunction/intlDatetime';
  ```
- add the registrations after `registerCompareFunctionFactory(INTL_TIME_DATA_TYPE, intlTimeSort);`:
  ```ts
  registerCompareFunctionFactory(DATETIME_DATA_TYPE, datetimeSort);
  registerCompareFunctionFactory(INTL_DATETIME_DATA_TYPE, intlDatetimeSort);
  ```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=datetimeSort.unit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add handsontable/src/plugins/columnSorting
git commit -m "DEV-1463: Wire datetime cell types into column sorting"
```

---

## Task 8: Filters integration

**Files:**
- Create: `handsontable/src/plugins/filters/condition/intlDatetime/{before,beforeOrEqual,after,afterOrEqual,between}.ts`
- Modify: `handsontable/src/plugins/filters/constants.ts`
- Modify: `handsontable/src/plugins/filters/sortComparators.ts`
- Test: `handsontable/src/plugins/filters/__tests__/datetimeConditions.unit.js`

- [ ] **Step 1: Write the failing test**

Create `handsontable/src/plugins/filters/__tests__/datetimeConditions.unit.js`:

```js
import { condition as before } from '../condition/intlDatetime/before';
import { condition as between } from '../condition/intlDatetime/between';

const row = value => ({ value, meta: {} });

describe('intl-datetime filter conditions', () => {
  it('before compares chronologically', () => {
    expect(before(row('2024-03-15T09:00:00'), ['2024-03-15T10:00:00'])).toBe(true);
    expect(before(row('2024-03-15T11:00:00'), ['2024-03-15T10:00:00'])).toBe(false);
  });

  it('between is inclusive', () => {
    expect(between(row('2024-03-15T10:00:00'), ['2024-03-15T09:00:00', '2024-03-15T11:00:00'])).toBe(true);
    expect(between(row('2024-03-15T12:00:00'), ['2024-03-15T09:00:00', '2024-03-15T11:00:00'])).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=datetimeConditions.unit`
Expected: FAIL — modules not found.

- [ ] **Step 3: Create the five condition modules**

Each mirrors `condition/intlTime/*` but parses with `parseToLocalDateTime` and uses `inputType: 'datetime-local'`.

`handsontable/src/plugins/filters/condition/intlDatetime/before.ts`:

```ts
import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalDateTime } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_datetime_before';

type DataRow = { value: unknown; meta: Record<string, unknown> };

/**
 * @param dataRow The object which holds and describes the single cell value.
 * @param inputValues [value] The reference date-time.
 * @returns Whether the cell value is before the given date-time.
 */
export function condition(dataRow: DataRow, [value]: unknown[]): boolean {
  const dataDateTime = parseToLocalDateTime(dataRow.value);
  const inputDateTime = parseToLocalDateTime(value);

  if (dataDateTime === null || inputDateTime === null) {
    return false;
  }

  return dataDateTime < inputDateTime;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BEFORE,
  inputsCount: 1,
  showOperators: true,
  inputType: 'datetime-local',
});
```

`handsontable/src/plugins/filters/condition/intlDatetime/beforeOrEqual.ts` — identical but:
`CONDITION_NAME = 'intl_datetime_before_or_equal'`; comparison `dataDateTime <= inputDateTime`;
`name: C.FILTERS_CONDITIONS_BEFORE_OR_EQUAL`.

`handsontable/src/plugins/filters/condition/intlDatetime/after.ts` — 
`CONDITION_NAME = 'intl_datetime_after'`; comparison `dataDateTime > inputDateTime`;
`name: C.FILTERS_CONDITIONS_AFTER`.

`handsontable/src/plugins/filters/condition/intlDatetime/afterOrEqual.ts` — 
`CONDITION_NAME = 'intl_datetime_after_or_equal'`; comparison `dataDateTime >= inputDateTime`;
`name: C.FILTERS_CONDITIONS_AFTER_OR_EQUAL`.

`handsontable/src/plugins/filters/condition/intlDatetime/between.ts`:

```ts
import * as C from '../../../../i18n/constants';
import { registerCondition } from '../../conditionRegisterer';
import { parseToLocalDateTime } from '../../../../helpers/dateTime';

export const CONDITION_NAME = 'intl_datetime_between';

type DataRow = { value: unknown; meta: Record<string, unknown> };

/**
 * @param dataRow The object which holds and describes the single cell value.
 * @param inputValues [from, to] The minimum and maximum date-time of the range.
 * @returns Whether the cell value is between the given date-times.
 */
export function condition(dataRow: DataRow, [from, to]: unknown[]): boolean {
  const dataDateTime = parseToLocalDateTime(dataRow.value);
  const fromDateTime = parseToLocalDateTime(from);
  const toDateTime = parseToLocalDateTime(to);

  if (dataDateTime === null || fromDateTime === null || toDateTime === null) {
    return false;
  }

  return dataDateTime >= fromDateTime && dataDateTime <= toDateTime;
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_BETWEEN,
  inputsCount: 2,
  showOperators: true,
  inputType: 'datetime-local',
});
```

Confirm the i18n constants `FILTERS_CONDITIONS_BEFORE_OR_EQUAL` / `FILTERS_CONDITIONS_AFTER_OR_EQUAL` exist (they are used by `condition/intlTime/*`): `grep -n "FILTERS_CONDITIONS_BEFORE_OR_EQUAL\|FILTERS_CONDITIONS_AFTER_OR_EQUAL" handsontable/src/i18n/constants.ts`.

- [ ] **Step 4: Register the datetime condition sets in `constants.ts`**

In `handsontable/src/plugins/filters/constants.ts`:
- add imports (importing each condition file registers it):
  ```ts
  import { CONDITION_NAME as CONDITION_INTL_DATETIME_BEFORE } from './condition/intlDatetime/before';
  import { CONDITION_NAME as CONDITION_INTL_DATETIME_BEFORE_OR_EQUAL } from './condition/intlDatetime/beforeOrEqual';
  import { CONDITION_NAME as CONDITION_INTL_DATETIME_AFTER } from './condition/intlDatetime/after';
  import { CONDITION_NAME as CONDITION_INTL_DATETIME_AFTER_OR_EQUAL } from './condition/intlDatetime/afterOrEqual';
  import { CONDITION_NAME as CONDITION_INTL_DATETIME_BETWEEN } from './condition/intlDatetime/between';
  ```
- add the type constants next to `TYPE_INTL_TIME`:
  ```ts
  export const TYPE_DATETIME = 'datetime';
  export const TYPE_INTL_DATETIME = 'intl-datetime';
  ```
- add the shared condition list to the `TYPES` map (both keys point to the same array):
  ```ts
  [TYPE_INTL_DATETIME]: [
    CONDITION_NONE,
    SEPARATOR,
    CONDITION_EMPTY,
    CONDITION_NOT_EMPTY,
    SEPARATOR,
    CONDITION_EQUAL,
    CONDITION_NOT_EQUAL,
    SEPARATOR,
    CONDITION_INTL_DATETIME_BEFORE,
    CONDITION_INTL_DATETIME_BEFORE_OR_EQUAL,
    CONDITION_INTL_DATETIME_AFTER,
    CONDITION_INTL_DATETIME_AFTER_OR_EQUAL,
    CONDITION_INTL_DATETIME_BETWEEN,
  ],
  ```
  Then reuse it for the classic `datetime` key by adding, immediately after the `TYPES` object literal is defined, an alias so both column types resolve identically:
  ```ts
  TYPES[TYPE_DATETIME] = TYPES[TYPE_INTL_DATETIME];
  ```

- [ ] **Step 5: Add the filter value-list comparator for parity**

In `handsontable/src/plugins/filters/sortComparators.ts`:
- import: `import { parseToLocalDate, parseToLocalDateTime } from '../../helpers/dateTime';`
- add a comparator factory mirroring `createISODateSortComparator` but using `parseToLocalDateTime`:

```ts
/**
 * Returns a comparator for sorting `datetime`/`intl-datetime` cell values chronologically.
 *
 * @returns {Function}
 */
export function createISODateTimeSortComparator(): (a: unknown, b: unknown) => number {
  return (aVal: unknown, bVal: unknown) => {
    const a = aVal as string;
    const b = bVal as string;

    if (a === '' && b === '') {
      return 0;
    }
    if (a === '') {
      return -1;
    }
    if (b === '') {
      return 1;
    }

    const dateA = parseToLocalDateTime(a);
    const dateB = parseToLocalDateTime(b);

    if (dateA === null && dateB === null) {
      return 0;
    }
    if (dateA === null) {
      return 1;
    }
    if (dateB === null) {
      return -1;
    }

    return (dateA as unknown as number) - (dateB as unknown as number);
  };
}
```

- extend `getSortComparatorForMeta` with a branch before the final `return undefined;`:

```ts
  if (meta.type === 'datetime' || meta.type === 'intl-datetime') {
    return createISODateTimeSortComparator();
  }
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=datetimeConditions.unit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add handsontable/src/plugins/filters
git commit -m "DEV-1463: Wire datetime cell types into filters"
```

---

## Task 9: XLSX export integration

**Files:**
- Modify: `handsontable/src/plugins/exportFile/types/xlsx/date-utils.ts`
- Modify: `handsontable/src/plugins/exportFile/types/xlsx.ts`
- Test: `handsontable/src/plugins/exportFile/__tests__/datetimeExport.unit.js`

- [ ] **Step 1: Write the failing test**

Create `handsontable/src/plugins/exportFile/__tests__/datetimeExport.unit.js`:

```js
import { parseIsoDateTimeStringToSerial, getDateTimeNumFmt } from '../types/xlsx/date-utils';

describe('parseIsoDateTimeStringToSerial', () => {
  it('converts an ISO datetime to an Excel serial with a fractional day', () => {
    // 2024-01-01 is serial 45292; noon adds 0.5.
    const serial = parseIsoDateTimeStringToSerial('2024-01-01T12:00:00');

    expect(Math.floor(serial)).toBe(45292);
    expect(serial - Math.floor(serial)).toBeCloseTo(0.5, 6);
  });

  it('handles date-only values (midnight)', () => {
    const serial = parseIsoDateTimeStringToSerial('2024-01-01');

    expect(serial).toBe(45292);
  });

  it('returns null for invalid input', () => {
    expect(parseIsoDateTimeStringToSerial('garbage')).toBe(null);
  });

  it('exposes a datetime number format', () => {
    expect(typeof getDateTimeNumFmt()).toBe('string');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=datetimeExport.unit`
Expected: FAIL — functions not exported.

- [ ] **Step 3: Add the export helpers**

In `handsontable/src/plugins/exportFile/types/xlsx/date-utils.ts`, append:

```ts
/**
 * Parses an ISO 8601 date-time string to an Excel date serial number with a fractional-day time part.
 *
 * @private
 * @param {*} value Cell value — expected to be an ISO 8601 date-time string.
 * @returns {number|null}
 */
export function parseIsoDateTimeStringToSerial(value: unknown): number | null {
  if (!value) {
    return null;
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/);

  if (!match) {
    return null;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const hours = match[4] ? parseInt(match[4], 10) : 0;
  const minutes = match[5] ? parseInt(match[5], 10) : 0;
  const seconds = match[6] ? parseInt(match[6], 10) : 0;
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const timeSerial = ((hours * 3600) + (minutes * 60) + seconds) / 86400;

  return toExcelDateSerial(date) + timeSerial;
}

/**
 * Returns the Excel `numFmt` string for a date-time cell.
 *
 * @private
 * @returns {string}
 */
export function getDateTimeNumFmt(): string {
  return 'mm-dd-yy h:mm:ss';
}
```

- [ ] **Step 4: Branch the export resolver on the datetime types**

In `handsontable/src/plugins/exportFile/types/xlsx.ts`:
- extend the date-utils import (currently ends `} from './xlsx/date-utils';`) to include `parseIsoDateTimeStringToSerial` and `getDateTimeNumFmt`.
- in `#resolveCellValue`, add this block **before** the existing `if (meta.type === 'date' || meta.type === 'intl-date')` branch (so datetime is matched first):

```ts
    if (meta.type === 'datetime' || meta.type === 'intl-datetime') {
      const serial = parseIsoDateTimeStringToSerial(cellValue);

      if (serial !== null) {
        return { value: serial, numFmt: getDateTimeNumFmt() };
      }
    }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm --prefix handsontable run test:unit -- --testPathPattern=datetimeExport.unit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add handsontable/src/plugins/exportFile
git commit -m "DEV-1463: Export datetime cell types to xlsx as date-time serials"
```

---

## Task 10: Documentation guide + date-guide note (action item 1)

**Files:**
- Create: `docs/content/guides/cell-types/datetime-cell-type/datetime-cell-type.md`
- Modify: `docs/content/guides/sidebar.js`
- Modify: `docs/content/guides/cell-types/date-cell-type/date-cell-type.md`

- [ ] **Step 1: Write the guide**

Create `docs/content/guides/cell-types/datetime-cell-type/datetime-cell-type.md`, mirroring `time-cell-type.md`'s frontmatter and structure. Follow `.ai/DOC-STANDARDS.md` writing rules (short sentences, active voice, American English, no evaluative adjectives). Frontmatter:

```markdown
---
type: how-to
title: Date-time cell type
metaTitle: Date-time cell type - JavaScript Data Grid | Handsontable
description: Display, format, sort, and filter date and time values together by using the datetime cell type.
permalink: /datetime-cell-type
canonicalUrl: /datetime-cell-type
react:
  metaTitle: Date-time cell type - React Data Grid | Handsontable
angular:
  metaTitle: Date-time cell type - Angular Data Grid | Handsontable
vue:
  metaTitle: Date-time cell type - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell types
menuTag: new
---

# Date-time cell type

[[toc]]

## Overview

The `datetime` and `intl-datetime` cell types let you treat cell values as combined dates and
times. They use a native [`<input type="datetime-local">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local)
editor (zero dependencies), format the display with [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
via the [`dateTimeFormat`](@/api/options.md#datetimeformat) option, and validate ISO 8601 source data.

## Source data format

Source data must be in ISO 8601 date-time format (`YYYY-MM-DDTHH:mm:ss`). A date-only value
(`YYYY-MM-DD`) is treated as midnight. The `dateTimeFormat` object affects only how values are
displayed; the stored value stays ISO so sorting, filtering, and export stay correct.

## Basic example

\```js
const container = document.querySelector('#example1');

new Handsontable(container, {
  data: [
    ['2024-03-15'],
    ['2024-03-16 09:00:00'],
    ['2024-03-17T23:59:59'],
    ['2024-12-25T14:30:00'],
  ],
  columns: [{
    type: 'intl-datetime',
    dateTimeFormat: {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    },
  }],
  licenseKey: 'non-commercial-and-evaluation',
});
\```

## Related options

- [`dateTimeFormat`](@/api/options.md#datetimeformat) — display format.
- [`locale`](@/api/options.md#locale) — formatting locale.

## Related guides

- [Date cell type](@/guides/cell-types/date-cell-type/date-cell-type.md)
- [Time cell type](@/guides/cell-types/time-cell-type/time-cell-type.md)
```

(Remove the backslashes before the code fences — they are escaped here only to keep this plan valid Markdown. Optionally add framework example folders like `time-cell-type` has; not required for the guide to build.)

- [ ] **Step 2: Register the guide in the sidebar**

In `docs/content/guides/sidebar.js`, add after the `time-cell-type` entry (line 104):

```js
    { path: 'guides/cell-types/datetime-cell-type/datetime-cell-type' },
```

- [ ] **Step 3: Add the clarifying note to the date cell type guide (action item 1)**

In `docs/content/guides/cell-types/date-cell-type/date-cell-type.md`, add a `::: tip` note in the section that documents `dateFormat` (find it with `grep -n "dateFormat" docs/content/guides/cell-types/date-cell-type/date-cell-type.md`):

```markdown
::: tip
Time-related `dateFormat` options (`hour`, `minute`, `second`, `timeStyle`, `hour12`,
`hourCycle`, `fractionalSecondDigits`) only affect display. Because `date`/`intl-date` source
data is date-only, these options always render midnight (`00:00:00`). To edit and store both a
date and a time, use the [date-time cell type](@/guides/cell-types/datetime-cell-type/datetime-cell-type.md).
:::
```

- [ ] **Step 4: Commit**

```bash
git add docs/content/guides/cell-types/datetime-cell-type docs/content/guides/sidebar.js docs/content/guides/cell-types/date-cell-type/date-cell-type.md
git commit -m "DEV-1463: Document datetime cell type and clarify intl-date time options"
```

---

## Task 11: E2E (Playwright) + build + changelog + full verification

**Files:**
- Create: `handsontable/tests/e2e/cellTypes/datetime.spec.ts` (confirm the exact e2e dir with `ls handsontable/tests/e2e`)
- Create: `.changelogs/<id>.json`

- [ ] **Step 1: Rebuild the core (E2E loads `dist/`)**

Run: `npm --prefix handsontable run build`
Expected: build succeeds; both `handsontable.js` and `handsontable.full.js` emit.

- [ ] **Step 2: Write the Playwright E2E spec**

Use the `handsontable-playwright-e2e` skill for the Page Object Model, `data-testid` hooks, and web-first waits. Create `handsontable/tests/e2e/cellTypes/datetime.spec.ts` covering:
- rendering: a grid with `type: 'intl-datetime'` and `dateTimeFormat` shows a formatted datetime (e.g. contains `14:30`) for `2024-12-25T14:30:00`, and shows a time for a date-only row (`00:00:00`).
- rendering an invalid value shows the bad-value placeholder.
- editing: opening the editor on a cell exposes an `input[type="datetime-local"]`; typing `2024-12-25T08:15:00` and pressing Enter stores `2024-12-25T08:15:00` (assert via `getDataAtCell`).
- sorting a datetime column orders chronologically.

Follow the existing date/time spec (`grep -rl "intl-time\|intl-date" handsontable/tests/e2e`) as the concrete template for imports, fixtures, and assertions.

- [ ] **Step 3: Run the E2E spec**

Run: `cd handsontable/tests && npm test -- --grep datetime` (confirm the exact command from `handsontable-playwright-e2e`).
Expected: PASS, no console exceptions.

- [ ] **Step 4: Add the changelog entry**

Use the `changelog-creation` skill. Create `.changelogs/<id>.json` with an `added` entry, e.g.:

```json
{
  "title": "Added the `datetime` and `intl-datetime` cell types with a native `datetime-local` editor, `Intl.DateTimeFormat` display via the new `dateTimeFormat` option, and full sorting, filtering, and Excel-export support.",
  "type": "added",
  "issuesOrigin": ["#12366"],
  "pullRequests": []
}
```

(Match the exact schema in `.changelogs/README.md`; fill the PR number after opening the PR.)

- [ ] **Step 5: Full verification**

Run the whole gate:

```bash
npm --prefix handsontable run eslint
npm --prefix handsontable run test:types
npm --prefix handsontable run test:unit
npm --prefix handsontable run build
```

Expected: all PASS. Investigate and fix any failure before proceeding.

- [ ] **Step 6: Commit**

```bash
git add handsontable/tests/e2e/cellTypes/datetime.spec.ts .changelogs
git commit -m "DEV-1463: Add datetime cell type E2E tests and changelog entry"
```

---

## Task 12: Wrapper parity check

**Files:** (read-only investigation; changes only if needed)

- [ ] **Step 1: Confirm wrappers need no per-type change**

Cell types are registered in core and consumed by wrappers generically via the `type` string. Verify no wrapper enumerates cell-type names:

Run: `grep -rn "intl-time\|intl-date" wrappers/*/src 2>/dev/null`
Expected: no per-type wiring. If a wrapper hard-codes the cell-type list (unlikely), mirror the `intl-time` addition there and add a wrapper test. Otherwise no change is required.

- [ ] **Step 2: Commit (only if changes were needed)**

```bash
git add wrappers
git commit -m "DEV-1463: Add datetime cell type parity to wrappers"
```

---

## Final: open the PR

Use the `pr-creation` skill (branch `feature/issue-12366`). Fill the GitHub PR template, link #12366 and DEV-1463, and back-fill the changelog `pullRequests` field with the PR number. Do NOT force-push.

---

## Self-review notes (author)

- **Spec coverage:** action item 1 (docs note) → Task 6 Step 2 (JSDoc) + Task 10 Step 3 (guide). action item 2 (cell type) → Tasks 1–5. Full-parity integrations → sorting (Task 7), filters (Task 8), export (Task 9). Docs guide → Task 10. Tests → each task + Task 11.
- **Type consistency:** `dateTimeFormat` is the single option name used by renderer (Task 2), metaSchema (Task 6), and docs (Task 10). `parseToLocalDateTime` / `isValidISODateTime` / `ISO_DATETIME_REGEX` (Task 1) are the single helper names reused everywhere. `COLUMN_DATA_TYPE` values `'datetime'`/`'intl-datetime'` (Task 7) match the cell-type `CELL_TYPE` values (Task 5) and the export/filters type checks (Tasks 8–9).
- **Canonical value** `YYYY-MM-DDTHH:mm:ss` is produced by the editor's `getValue` (Task 4) and accepted leniently by every consumer.
