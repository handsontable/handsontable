import { ColumnStretching } from '../../../src/utils/columnStretching';

describe('ColumnStretching', () => {
  function allColumns20() {
    return 20;
  }

  it('should update stretchAllRatio after refreshStretching call (stretch: all)', () => {
    const columnStretching = new ColumnStretching({
      totalColumns: () => 20,
      stretchMode: () => 'all',
      columnWidthFn: index => allColumns20(index),
    });

    expect(columnStretching.stretchAllRatio).toBe(0);
    expect(columnStretching.stretchLastWidth).toBe(0);

    columnStretching.refreshStretching(414);

    expect(columnStretching.stretchAllRatio).toBe(1.035);
    expect(columnStretching.stretchLastWidth).toBe(0);
  });

  it('should update stretchAllRatio after refreshStretching call (stretch: last)', () => {
    const columnStretching = new ColumnStretching({
      totalColumns: () => 5,
      stretchMode: () => 'last',
      columnWidthFn: index => allColumns20(index),
    });

    expect(columnStretching.stretchAllRatio).toBe(0);
    expect(columnStretching.stretchLastWidth).toBe(0);

    columnStretching.refreshStretching(414);

    expect(columnStretching.stretchAllRatio).toBe(0);
    expect(columnStretching.stretchLastWidth).toBe(334);
  });

  it('should return valid stretched column width (stretch: all)', () => {
    const columnStretching = new ColumnStretching({
      totalColumns: () => 5,
      stretchMode: () => 'all',
      columnWidthFn: index => allColumns20(index),
    });

    expect(columnStretching.getStretchedColumnWidth(0, 50)).toBe(null);
    expect(columnStretching.needVerifyLastColumnWidth).toBe(true);

    columnStretching.refreshStretching(417);

    expect(columnStretching.getStretchedColumnWidth(0, allColumns20())).toBe(83);
    expect(columnStretching.getStretchedColumnWidth(1, allColumns20())).toBe(83);
    expect(columnStretching.getStretchedColumnWidth(2, allColumns20())).toBe(83);
    expect(columnStretching.getStretchedColumnWidth(3, allColumns20())).toBe(83);
    expect(columnStretching.needVerifyLastColumnWidth).toBe(true);
    expect(columnStretching.getStretchedColumnWidth(4, allColumns20())).toBe(85);
    expect(columnStretching.needVerifyLastColumnWidth).toBe(false);
  });

  it('should return valid stretched column width (stretch: last)', () => {
    const columnStretching = new ColumnStretching({
      totalColumns: () => 5,
      stretchMode: () => 'last',
      columnWidthFn: index => allColumns20(index),
    });

    expect(columnStretching.getStretchedColumnWidth(0, 50)).toBe(null);

    columnStretching.refreshStretching(417);

    expect(columnStretching.getStretchedColumnWidth(0, allColumns20())).toBe(null);
    expect(columnStretching.getStretchedColumnWidth(1, allColumns20())).toBe(null);
    expect(columnStretching.getStretchedColumnWidth(2, allColumns20())).toBe(null);
    expect(columnStretching.getStretchedColumnWidth(3, allColumns20())).toBe(null);
    expect(columnStretching.getStretchedColumnWidth(4, allColumns20())).toBe(337);
  });

  it('call refreshStretching should clear stretchAllColumnsWidth and needVerifyLastColumnWidth property', () => {
    const columnStretching = new ColumnStretching({
      totalColumns: () => 5,
      stretchMode: () => 'all',
      columnWidthFn: index => allColumns20(index),
    });

    expect(columnStretching.stretchAllColumnsWidth.length).toBe(0);
    expect(columnStretching.needVerifyLastColumnWidth).toBe(true);

    columnStretching.refreshStretching(417);
    columnStretching.getStretchedColumnWidth(0, allColumns20());
    columnStretching.getStretchedColumnWidth(1, allColumns20());
    columnStretching.getStretchedColumnWidth(2, allColumns20());
    columnStretching.getStretchedColumnWidth(3, allColumns20());
    columnStretching.getStretchedColumnWidth(4, allColumns20());

    expect(columnStretching.stretchAllColumnsWidth.length).toBe(5);
    expect(columnStretching.needVerifyLastColumnWidth).toBe(false);

    columnStretching.refreshStretching(201);

    expect(columnStretching.stretchAllColumnsWidth.length).toBe(0);
    expect(columnStretching.needVerifyLastColumnWidth).toBe(true);
  });
});
