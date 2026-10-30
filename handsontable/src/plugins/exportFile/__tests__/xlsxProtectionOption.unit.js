import Xlsx from '../types/xlsx';
import ExportDataProvider from '../dataProvider';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';
import * as consoleHelpers from '../../../helpers/console';
import { buildTestKey } from '../../../utils/entitlementLicenseKey/__tests__/buildTestKey';

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

    getFormulaErrorCodes() {
      return mockState.data.map(row => row.map(() => null));
    }

    getFormulasSeparator() {
      return ',';
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

const ALL_XLSX_TOKENS = [
  'xlsx:import',
  'xlsx:export',
  'xlsx:formulas',
  'xlsx:layout',
  'xlsx:number_formats',
  'xlsx:comments',
  'xlsx:styles',
  'xlsx:conditional_formatting',
  'xlsx:data_validation',
  'xlsx:protection',
];

// A made-up password. Assertions compare it with `===` inside `expect(...).toBe(true)`, so a failure
// never prints it; it never goes into a test title or an `expect` message either.
const PASSWORD = 'q4-budget';

/**
 * Builds a current subscription key that unlocks exactly `tokens`: it carries the
 * `listed-capabilities` flag.
 *
 * @param {string[]} tokens The capability tokens besides `core`.
 * @returns {string}
 */
function keyWith(tokens) {
  return buildTestKey({
    products: {
      handsontable: {
        capabilities: ['core', ...tokens],
        usage_until: '2027-08-12',
        notice: 60,
        grace: 90,
        flags: ['listed-capabilities'],
      },
    },
  });
}

/**
 * A stand-in for a Handsontable instance carrying a license key.
 *
 * @param {string} licenseKey The license key.
 * @returns {object}
 */
function createInstance(licenseKey) {
  return { rootDocument: document, rootWindow: window, getSettings: () => ({ licenseKey }) };
}

const FULL_KEY = keyWith(ALL_XLSX_TOKENS);

describe('Xlsx export `protection` option', () => {
  let warnSpy;
  let writeSpy;

  beforeEach(() => {
    mockState.cellsMeta = READ_ONLY_META;
    mockState.columnSummaries = [];
    warnSpy = jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});
    // The snapshot is all these tests read; skipping the real write also skips the 100 000-spin hash.
    writeSpy = jest.spyOn(nativeAdapter, 'write').mockResolvedValue(new Uint8Array());
  });

  afterEach(() => {
    warnSpy.mockRestore();
    writeSpy.mockRestore();
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
    const sheet = (await exportSnapshot(FULL_KEY)).sheets[0];

    expect(sheet.protection.enabled).toBe(true);
    expect(sheet.protection.password).toBeNull();
    expect(lockedCell(sheet).locked).toBe(true);
  });

  it('protects with no password for an explicit `undefined`', async() => {
    const sheet = (await exportSnapshot(FULL_KEY, { protection: undefined })).sheets[0];

    expect(sheet.protection.enabled).toBe(true);
    expect(sheet.protection.password).toBeNull();
  });

  it('passes the password to the sheet protection', async() => {
    const sheet = (await exportSnapshot(FULL_KEY, { protection: { password: PASSWORD } })).sheets[0];

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
    const empty = (await exportSnapshot(FULL_KEY, { protection: { password: '' } })).sheets[0];
    const noKey = (await exportSnapshot(FULL_KEY, { protection: {} })).sheets[0];

    expect(empty.protection.enabled).toBe(true);
    expect(empty.protection.password).toBeNull();
    expect(noKey.protection.enabled).toBe(true);
    expect(noKey.protection.password).toBeNull();
  });

  it('writes no protection and no locked cell for protection: null', async() => {
    const sheet = (await exportSnapshot(FULL_KEY, { protection: null })).sheets[0];

    expect(sheet.protection).toBeNull();
    expect(sheet.rows.flat().filter(Boolean).every(cell => cell.locked === null)).toBe(true);
  });

  it('writes nothing for a password when no cell is read-only', async() => {
    mockState.cellsMeta = [[{}, {}], [{}, {}]];

    const sheet = (await exportSnapshot(FULL_KEY, { protection: { password: PASSWORD } })).sheets[0];

    expect(sheet.protection).toBeNull();
    expect(sheet.rows.flat().filter(Boolean).every(cell => cell.locked === null)).toBe(true);
  });

  it('keeps the ColumnSummary exception with a password', async() => {
    mockState.columnSummaries = [{ destRow: 1, destCol: 1, type: 'sum', result: 3 }];

    const sheet = (await exportSnapshot(FULL_KEY, { protection: { password: PASSWORD } })).sheets[0];

    expect(sheet.protection).toBeNull();
  });

  it('protects every sheet that has read-only cells with the same password', async() => {
    const own = createInstance(FULL_KEY);
    const xlsx = new Xlsx(new ExportDataProvider(own), {
      protection: { password: PASSWORD },
      sheets: [{ instance: own, name: 'One' }, { instance: createInstance(FULL_KEY), name: 'Two' }],
    });

    writeSpy.mockClear();
    await xlsx.export();

    const { sheets } = writeSpy.mock.calls[0][0];

    expect(sheets.map(sheet => sheet.name)).toEqual(['One', 'Two']);
    expect(sheets.every(sheet => sheet.protection?.enabled === true)).toBe(true);
    expect(sheets.every(sheet => sheet.protection.password === PASSWORD)).toBe(true);
  });

  it('ignores the option and names only the token without xlsx:protection', async() => {
    const key = keyWith(ALL_XLSX_TOKENS.filter(id => id !== 'xlsx:protection'));
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
    const error = await refusal(FULL_KEY, { protection: { password } });

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(PASSWORD_REFUSAL);
    expect(error.message.includes('1234') || error.message.includes('q4')).toBe(false);
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('refuses a non-string password even without xlsx:protection', async() => {
    const key = keyWith(ALL_XLSX_TOKENS.filter(id => id !== 'xlsx:protection'));
    const error = await refusal(key, { protection: { password: 1234 } });

    expect(error?.message).toBe(PASSWORD_REFUSAL);
    expect(writeSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('refuses a protection value that is neither an object nor null', async() => {
    for (const protection of [true, 'q4-budget', 1, ['q4-budget']]) {
      // eslint-disable-next-line no-await-in-loop
      const error = await refusal(FULL_KEY, { protection });

      expect(error?.message).toBe(PROTECTION_REFUSAL);
      expect(error.message.includes(PASSWORD)).toBe(false);
    }

    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('accepts a null password as no password', async() => {
    const sheet = (await exportSnapshot(FULL_KEY, { protection: { password: null } })).sheets[0];

    expect(sheet.protection.enabled).toBe(true);
    expect(sheet.protection.password).toBeNull();
  });

  it('leaves the default output unchanged for a key with no xlsx restriction', async() => {
    const legacy = await exportSnapshot('non-commercial-and-evaluation');
    const explicit = await exportSnapshot('non-commercial-and-evaluation', { protection: undefined });

    expect(explicit).toEqual(legacy);
  });
});
