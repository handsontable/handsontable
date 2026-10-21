import { clampFixedColumnsEnd } from '../../../src/settings/fixedColumnsEnd';
import Settings from '../../../src/settings';

describe('clampFixedColumnsEnd', () => {
  it.each([
    // requestedEnd, fixedColumnsStart, totalColumns, expected
    [0, 0, 10, 0],
    [2, 0, 10, 2],
    [3, 2, 10, 3],
    // The start band has priority: the end band keeps only the columns that remain after it.
    [5, 8, 10, 2],
    [5, 10, 10, 0],
    [5, 12, 10, 0],
    // More end columns than the grid has.
    [20, 0, 10, 10],
    [Infinity, 4, 10, 6],
    // An empty grid.
    [3, 0, 0, 0],
    // Garbage in, no end band out.
    [-1, 0, 10, 0],
    [NaN, 0, 10, 0],
    [undefined, 0, 10, 0],
    [null, 0, 10, 0],
    // The count is a whole number of columns.
    [2.7, 0, 10, 2],
  ])('should clamp %p end columns (start %p, total %p) to %p', (requestedEnd, start, total, expected) => {
    expect(clampFixedColumnsEnd(requestedEnd, start, total)).toBe(expected);
  });

  it('should keep the requested count when the total is not known yet', () => {
    expect(clampFixedColumnsEnd(3, 1, undefined)).toBe(3);
  });
});

describe('Settings#getSetting("fixedColumnsEnd")', () => {
  /**
   * Builds the settings with only the keys the clamp reads.
   *
   * @param {object} values The setting values (a value may be a function, as the host passes them).
   * @returns {Settings}
   */
  function createSettings(values: Record<string, unknown>) {
    return new Settings({
      facade: () => {},
      data: () => '',
      table: {},
      totalRows: () => 5,
      totalColumns: () => 10,
      ...values,
    });
  }

  it('should default to 0, and keep the end overlay off', () => {
    const settings = createSettings({});

    expect(settings.getSetting('fixedColumnsEnd')).toBe(0);
    expect(settings.getSetting('shouldRenderInlineEndOverlay')).toBe(false);
  });

  it('should read the host thunk and cut it down by the start band', () => {
    const settings = createSettings({
      fixedColumnsStart: () => 8,
      fixedColumnsEnd: () => 5,
    });

    expect(settings.getSetting('fixedColumnsEnd')).toBe(2);
    expect(settings.getSetting('shouldRenderInlineEndOverlay')).toBe(true);
  });

  it('should not render the end overlay when the start band covers every column', () => {
    const settings = createSettings({
      fixedColumnsStart: () => 10,
      fixedColumnsEnd: () => 3,
    });

    expect(settings.getSetting('fixedColumnsEnd')).toBe(0);
    expect(settings.getSetting('shouldRenderInlineEndOverlay')).toBe(false);
  });

  it('should follow the live column count, not a value captured once', () => {
    let totalColumns = 10;
    const settings = createSettings({
      totalColumns: () => totalColumns,
      fixedColumnsEnd: 4,
    });

    expect(settings.getSetting('fixedColumnsEnd')).toBe(4);

    totalColumns = 3;

    expect(settings.getSetting('fixedColumnsEnd')).toBe(3);
  });

  it('should accept a plain number', () => {
    const settings = createSettings({ fixedColumnsEnd: 2 });

    expect(settings.getSetting('fixedColumnsEnd')).toBe(2);
  });

  it('should return 0 without reading the start band or the column count when none is requested', () => {
    const fixedColumnsStart = jest.fn(() => 3);
    const totalColumns = jest.fn(() => 10);
    const settings = createSettings({ fixedColumnsStart, totalColumns, fixedColumnsEnd: 0 });

    expect(settings.getSetting('fixedColumnsEnd')).toBe(0);
    expect(settings.getSetting('fixedColumnsEnd')).toBe(0);
    expect(fixedColumnsStart).not.toHaveBeenCalled();
    expect(totalColumns).not.toHaveBeenCalled();
  });

  it('should return 0 without reading the other thunks for garbage requests', () => {
    [undefined, null, NaN, -2, 0.4].forEach((requested) => {
      const fixedColumnsStart = jest.fn(() => 3);
      const totalColumns = jest.fn(() => 10);
      const settings = createSettings({ fixedColumnsStart, totalColumns, fixedColumnsEnd: () => requested });

      expect(settings.getSetting('fixedColumnsEnd')).toBe(0);
      expect(fixedColumnsStart).not.toHaveBeenCalled();
      expect(totalColumns).not.toHaveBeenCalled();
    });
  });

  it('should still read the start band and the column count, and clamp, for a positive request', () => {
    const fixedColumnsStart = jest.fn(() => 8);
    const totalColumns = jest.fn(() => 10);
    const settings = createSettings({ fixedColumnsStart, totalColumns, fixedColumnsEnd: 5 });

    expect(settings.getSetting('fixedColumnsEnd')).toBe(2);
    expect(fixedColumnsStart).toHaveBeenCalled();
    expect(totalColumns).toHaveBeenCalled();
  });
});
