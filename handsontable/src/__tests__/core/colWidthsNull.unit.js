import Handsontable from 'handsontable';

describe('a `null` column width', () => {
  let hot;

  afterEach(() => {
    hot?.destroy();
    hot = null;
  });

  /**
   * Builds a grid with the given settings and a measured width of 87px in every column.
   *
   * @param {object} settings Grid settings.
   * @returns {object} The Handsontable instance.
   */
  function build(settings) {
    hot = new Handsontable(document.createElement('div'), {
      data: [['a', 'b']],
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });
    jest.spyOn(hot.getPlugin('autoColumnSize').columnWidthsMap, 'getValueAtIndex').mockReturnValue(87);

    return hot;
  }

  it('reads `colWidths: null` as no width, so AutoColumnSize sizes the columns', () => {
    build({ colWidths: null });

    expect(hot._getColWidthFromSettings(0)).toBeUndefined();
    expect(hot.getPlugin('autoColumnSize').enabled).toBe(true);
    expect(hot.getColWidth(0)).toBe(87);
  });

  it('reads a `null` entry of a `colWidths` array as no width', () => {
    build({ colWidths: [120, null] });

    expect(hot._getColWidthFromSettings(0)).toBe(120);
    expect(hot._getColWidthFromSettings(1)).toBeUndefined();
    expect(hot.getColWidth(1)).toBe(50);
  });

  it('reads a `null` returned by a `colWidths` function as no width', () => {
    build({ colWidths: column => (column === 0 ? 120 : null) });

    expect(hot._getColWidthFromSettings(1)).toBeUndefined();
  });

  it('hands `undefined` to `modifyColWidth` for a `null` column width', () => {
    const widths = [];

    build({
      autoColumnSize: false,
      columns: [{ width: null }, {}],
      modifyColWidth(width, column) {
        if (column === 0) {
          widths.push(width);
        }
      },
    });
    widths.length = 0;
    hot.getColWidth(0);

    expect(widths).toEqual([undefined]);
  });
});
