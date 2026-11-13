import Xlsx from '../types/xlsx';
import ExportDataProvider from '../dataProvider';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';
import * as consoleHelpers from '../../../helpers/console';
import { resetTierKeys, tierKeyWithout } from '../../../utils/entitlementLicenseKey/__tests__/tierKeys';

// A small sheet with one read-only cell. The tests swap `cellsMeta` and `columnSummaries` to drop the
// read-only cell or to add a ColumnSummary destination. Read lazily by the mock below (jest hoists the
// factory, so the name must be `mock`-prefixed).
const READ_ONLY_META = [
  [{ readOnly: true }, {}],
  [{}, {}],
];
const mockState = {
  data: [
    ['locked', 1],
    ['open', 2],
  ],
  cellsMeta: READ_ONLY_META,
  columnSummaries: [],
};

jest.mock('../dataProvider', () => ({
  __esModule: true,
  default: class DataProviderMock {
    constructor(hot) {
      this.hot = hot;
    }

    setOptions() {}

    getData() {
      return mockState.data;
    }

    getCellsMeta() {
      return mockState.cellsMeta;
    }

    getCellElements() {
      return mockState.cellsMeta.map(row => row.map(() => null));
    }

    getColumnHeaders() {
      return [];
    }

    getColumnHeadersClassNames() {
      return [];
    }

    getRowHeaders() {
      return [];
    }

    getColumnsWidths() {
      return [];
    }

    getRowsHeights() {
      return [];
    }

    getMergeCells() {
      return [];
    }

    getFrozenRows() {
      return 0;
    }

    getFrozenColumns() {
      return 0;
    }

    getNestedColumnHeaders() {
      return null;
    }

    getLayoutDirection() {
      return 'ltr';
    }

    getColumnSummaries() {
      return mockState.columnSummaries;
    }

    getSourceData() {
      return mockState.data;
    }

    getEngineCellFacts() {
      return mockState.data.map(row => row.map(() => null));
    }

    getFormulasSeparator() {
      return ',';
    }

    getFormulasDecimalSeparator() {
      return '.';
    }

    getNamedExpressions() {
      return [];
    }

    getFormulasBinding() {
      return null;
    }

    getExcludedHiddenRows() {
      return null;
    }

    getExcludedHiddenColumns() {
      return null;
    }

    getHiddenRowDataIndices() {
      return [];
    }

    getHiddenColumnDataIndices() {
      return [];
    }
  },
}));

// A made-up password. Assertions compare it with `===` inside `expect(...).toBe(true)`, so a failure
// never prints it; it never goes into a test title or an `expect` message either.
const PASSWORD = 'q4-budget';

/**
 * A stand-in for a Handsontable instance carrying a license key.
 *
 * @param {string} licenseKey The license key.
 * @returns {object}
 */
function createInstance(licenseKey) {
  return { rootDocument: document, rootWindow: window, getSettings: () => ({ licenseKey }) };
}

describe('Xlsx export `protection` option', () => {
  let warnSpy;
  let writeSpy;
  // A key that unlocks every feature.
  let fullKey;

  beforeEach(() => {
    fullKey = tierKeyWithout([]);
    mockState.cellsMeta = READ_ONLY_META;
    mockState.columnSummaries = [];
    warnSpy = jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});
    // The snapshot is all these tests read; skipping the real write also skips the 100 000-spin hash.
    writeSpy = jest.spyOn(nativeAdapter, 'write').mockResolvedValue(new Uint8Array());
  });

  afterEach(() => {
    warnSpy.mockRestore();
    writeSpy.mockRestore();
    resetTierKeys();
  });

  /**
   * Exports the mock sheet under `licenseKey` and returns the workbook snapshot the engine was handed.
   *
   * @param {string} licenseKey The license key of the exporting instance.
   * @param {object} [options] Extra export options.
   * @returns {Promise<object>}
   */
  async function exportSnapshot(licenseKey, options = {}) {
    const xlsx = new Xlsx(new ExportDataProvider(createInstance(licenseKey)), options);

    writeSpy.mockClear();
    await xlsx.export();

    return writeSpy.mock.calls[0][0];
  }

  const lockedCell = sheet => sheet.rows[0][0];
  const passwordReachedAWarning = () => warnSpy.mock.calls.flat().some(arg => String(arg).includes(PASSWORD));

  it('protects with no password by default', async() => {
    const sheet = (await exportSnapshot(fullKey)).sheets[0];

    expect(sheet.protection.enabled).toBe(true);
    expect(sheet.protection.password).toBeNull();
    expect(lockedCell(sheet).locked).toBe(true);
  });

  it('protects with no password for an explicit `undefined`', async() => {
    const sheet = (await exportSnapshot(fullKey, { protection: undefined })).sheets[0];

    expect(sheet.protection.enabled).toBe(true);
    expect(sheet.protection.password).toBeNull();
  });

  it('passes the password to the sheet protection', async() => {
    const sheet = (await exportSnapshot(fullKey, { protection: { password: PASSWORD } })).sheets[0];

    expect(sheet.protection.enabled).toBe(true);
    expect(sheet.protection.password === PASSWORD).toBe(true);
    // The permissions the export always granted stay the same with a password.
    expect(sheet.protection.options).toEqual({
      selectLockedCells: true,
      selectUnlockedCells: true,
      formatColumns: true,
      formatRows: true,
      sort: true,
      autoFilter: true,
    });
    expect(lockedCell(sheet).locked).toBe(true);
    expect(passwordReachedAWarning()).toBe(false);
  });

  it('treats an empty password as none', async() => {
    const empty = (await exportSnapshot(fullKey, { protection: { password: '' } })).sheets[0];
    const noKey = (await exportSnapshot(fullKey, { protection: {} })).sheets[0];

    expect(empty.protection.enabled).toBe(true);
    expect(empty.protection.password).toBeNull();
    expect(noKey.protection.enabled).toBe(true);
    expect(noKey.protection.password).toBeNull();
  });

  it('writes no protection and no locked cell for protection: null', async() => {
    const sheet = (await exportSnapshot(fullKey, { protection: null })).sheets[0];

    expect(sheet.protection).toBeNull();
    expect(sheet.rows.flat().filter(Boolean).every(cell => cell.locked === null)).toBe(true);
  });

  it('writes nothing for a password when no cell is read-only', async() => {
    mockState.cellsMeta = [[{}, {}], [{}, {}]];

    const sheet = (await exportSnapshot(fullKey, { protection: { password: PASSWORD } })).sheets[0];

    expect(sheet.protection).toBeNull();
    expect(sheet.rows.flat().filter(Boolean).every(cell => cell.locked === null)).toBe(true);
  });

  it('keeps the ColumnSummary exception with a password', async() => {
    mockState.columnSummaries = [{ destRow: 1, destCol: 1, type: 'sum', result: 3 }];

    const sheet = (await exportSnapshot(fullKey, { protection: { password: PASSWORD } })).sheets[0];

    expect(sheet.protection).toBeNull();
  });

  it('protects every sheet that has read-only cells with the same password', async() => {
    const own = createInstance(fullKey);
    const xlsx = new Xlsx(new ExportDataProvider(own), {
      protection: { password: PASSWORD },
      sheets: [{ instance: own, name: 'One' }, { instance: createInstance(fullKey), name: 'Two' }],
    });

    writeSpy.mockClear();
    await xlsx.export();

    const { sheets } = writeSpy.mock.calls[0][0];

    expect(sheets.map(sheet => sheet.name)).toEqual(['One', 'Two']);
    expect(sheets.every(sheet => sheet.protection?.enabled === true)).toBe(true);
    expect(sheets.every(sheet => sheet.protection.password === PASSWORD)).toBe(true);
  });

  it.each([
    ['a valid per-sheet password', { password: 'other-sheet-password' }],
    ['an invalid per-sheet password', { password: 1234 }],
    ['a per-sheet protection: null', null],
    ['an invalid per-sheet protection', true],
  ])('ignores %s and applies the top-level password to every sheet', async(_, sheetProtection) => {
    const own = createInstance(fullKey);
    const xlsx = new Xlsx(new ExportDataProvider(own), {
      protection: { password: PASSWORD },
      sheets: [
        { instance: own, name: 'One', protection: sheetProtection },
        { instance: createInstance(fullKey), name: 'Two' },
      ],
    });

    writeSpy.mockClear();

    const error = await xlsx.export().then(() => null, reason => reason);

    expect(error).toBeNull();

    const { sheets } = writeSpy.mock.calls[0][0];

    expect(sheets.every(sheet => sheet.protection?.enabled === true)).toBe(true);
    expect(sheets.every(sheet => sheet.protection.password === PASSWORD)).toBe(true);
    expect(sheets.every(sheet => lockedCell(sheet).locked === true)).toBe(true);
  });

  const PER_SHEET_WARNING = 'ExportFile: the "protection" option applies to the whole workbook; '
    + 'the value set on a sheet entry was ignored.';

  it('warns once, without the value, when sheet entries carry a protection key', async() => {
    const own = createInstance(fullKey);
    const xlsx = new Xlsx(new ExportDataProvider(own), {
      protection: { password: PASSWORD },
      sheets: [
        { instance: own, name: 'One', protection: { password: 'other-sheet-password' } },
        { instance: createInstance(fullKey), name: 'Two', protection: null },
      ],
    });

    await xlsx.export();

    expect(warnSpy.mock.calls.map(call => call[0])).toEqual([PER_SHEET_WARNING]);
    expect(warnSpy.mock.calls.flat().some(arg => String(arg).includes('other-sheet-password'))).toBe(false);
    expect(passwordReachedAWarning()).toBe(false);
  });

  it('does not warn about a per-sheet protection when no sheet entry carries one', async() => {
    const own = createInstance(fullKey);
    const xlsx = new Xlsx(new ExportDataProvider(own), {
      protection: { password: PASSWORD },
      sheets: [{ instance: own, name: 'One' }, { instance: createInstance(fullKey), name: 'Two' }],
    });

    await xlsx.export();

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('ignores the option and names only the token without xlsx:protection', async() => {
    const key = tierKeyWithout(['xlsx:protection']);
    const sheet = (await exportSnapshot(key, { protection: { password: PASSWORD } })).sheets[0];

    expect(sheet.protection).toBeNull();
    expect(sheet.rows.flat().filter(Boolean).every(cell => cell.locked === null)).toBe(true);
    expect(warnSpy.mock.calls.map(call => call[0])).toEqual([
      'The xlsx export skipped features your license does not unlock: xlsx:protection.',
    ]);
    expect(passwordReachedAWarning()).toBe(false);
  });

  const PASSWORD_REFUSAL = 'ExportFile: the "protection.password" option has to be a string.';
  const PROTECTION_REFUSAL = 'ExportFile: the "protection" option has to be an object or null.';

  /**
   * Runs an export that must be refused and returns the error.
   *
   * @param {string} licenseKey The license key of the exporting instance.
   * @param {object} options The export options.
   * @returns {Promise<Error>}
   */
  async function refusal(licenseKey, options) {
    const xlsx = new Xlsx(new ExportDataProvider(createInstance(licenseKey)), options);

    writeSpy.mockClear();

    return xlsx.export().then(() => null, error => error);
  }

  it.each([
    ['a number', 1234],
    ['an object', { secret: 'q4' }],
    ['a boolean', true],
  ])('refuses %s as the password, without naming the value', async(_, password) => {
    const error = await refusal(fullKey, { protection: { password } });

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(PASSWORD_REFUSAL);
    expect(error.message.includes('1234') || error.message.includes('q4')).toBe(false);
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('refuses a non-string password even without xlsx:protection', async() => {
    const key = tierKeyWithout(['xlsx:protection']);
    const error = await refusal(key, { protection: { password: 1234 } });

    expect(error?.message).toBe(PASSWORD_REFUSAL);
    expect(writeSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('refuses a protection value that is neither an object nor null', async() => {
    for (const protection of [true, 'q4-budget', 1, ['q4-budget']]) {
      // eslint-disable-next-line no-await-in-loop
      const error = await refusal(fullKey, { protection });

      expect(error?.message).toBe(PROTECTION_REFUSAL);
      expect(error.message.includes(PASSWORD)).toBe(false);
    }

    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('accepts a password of 255 characters and refuses one of 256, without naming the value', async() => {
    const longest = `${'q'.repeat(254)}Z`;
    const sheet = (await exportSnapshot(fullKey, { protection: { password: longest } })).sheets[0];

    expect(sheet.protection.password === longest).toBe(true);

    const tooLong = `${'q'.repeat(255)}Z`;
    const error = await refusal(fullKey, { protection: { password: tooLong } });

    expect(error?.message).toBe('ExportFile: the "protection.password" option has to be at most 255 characters long.');
    expect(error.message.includes('qqq')).toBe(false);
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('accepts a null password as no password', async() => {
    const sheet = (await exportSnapshot(fullKey, { protection: { password: null } })).sheets[0];

    expect(sheet.protection.enabled).toBe(true);
    expect(sheet.protection.password).toBeNull();
  });

  it('leaves the default output unchanged for a key with no xlsx restriction', async() => {
    const legacy = await exportSnapshot('non-commercial-and-evaluation');
    const explicit = await exportSnapshot('non-commercial-and-evaluation', { protection: undefined });

    expect(explicit).toEqual(legacy);
  });
});
