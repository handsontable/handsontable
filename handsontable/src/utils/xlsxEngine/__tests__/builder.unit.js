import { SheetBuilder } from '../builder';

describe('SheetBuilder', () => {
  it('should autovivify cells at 1-based coordinates into 0-based rows', () => {
    const builder = new SheetBuilder('Sheet1');
    const cell = builder.cell(2, 3);

    cell.value = 'x';

    const sheet = builder.toSnapshot();

    expect(sheet.rows.length).toBe(2);
    expect(sheet.rows[0]).toEqual([]);
    expect(sheet.rows[1][2].value).toBe('x');
    expect(sheet.rows[1][0]).toBeNull();
    expect(sheet.rows[1][1]).toBeNull();
    expect(builder.cell(2, 3)).toBe(cell);
  });

  it('should record row heights, hidden rows, column widths and hidden columns', () => {
    const builder = new SheetBuilder('Sheet1');

    builder.setRowHeight(3, 18.75);
    builder.hideRow(2);
    builder.setColWidth(2, 12.5);
    builder.hideCol(4);

    const sheet = builder.toSnapshot();

    expect(sheet.rowHeights).toEqual([null, null, 18.75]);
    expect(sheet.hiddenRows).toEqual([1]);
    expect(sheet.colWidths).toEqual([null, 12.5]);
    expect(sheet.hiddenCols).toEqual([3]);
  });

  it('should record merges, freeze, rtl, state, protection and conditional formatting', () => {
    const builder = new SheetBuilder('Sheet1');

    builder.merge(1, 1, 2, 3);
    builder.freeze(1, 2);
    builder.setRtl(true);
    builder.setState('veryHidden');
    builder.protect('', { sort: true });
    builder.addConditionalFormatting('B2:E7', [{ type: 'cellIs' }]);

    const sheet = builder.toSnapshot();

    expect(sheet.merges).toEqual([{ row: 0, col: 0, rowspan: 2, colspan: 3 }]);
    expect(sheet.freeze).toEqual({ rows: 2, cols: 1 });
    expect(sheet.rtl).toBe(true);
    expect(sheet.state).toBe('veryHidden');
    expect(sheet.protection).toEqual({ enabled: true, password: null, options: { sort: true } });
    expect(sheet.conditionalFormatting).toEqual([{ ref: 'B2:E7', rules: [{ type: 'cellIs' }] }]);
  });

  it('should treat freeze(0, 0) as no freeze', () => {
    const builder = new SheetBuilder('Sheet1');

    builder.freeze(0, 0);

    expect(builder.toSnapshot().freeze).toBeNull();
  });
});
