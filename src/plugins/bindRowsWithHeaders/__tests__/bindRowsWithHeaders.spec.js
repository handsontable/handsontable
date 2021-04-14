describe('BindRowsWithHeaders', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should call rowHeader function with correct index as argument (strict mode)', () => {
    const callback = jasmine.createSpy();

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 10),
      rowHeaders: callback,
      bindRowsWithHeaders: 'strict',
      width: 500,
      height: 300
    });

    expect(callback.calls.argsFor(0)).toEqual([0]);
    expect(callback.calls.argsFor(1)).toEqual([1]);
    expect(callback.calls.argsFor(2)).toEqual([2]);
    expect(callback.calls.argsFor(3)).toEqual([3]);
    expect(callback.calls.argsFor(4)).toEqual([4]);

    alter('remove_row', 1, 3);

    expect(callback.calls.argsFor(10)).toEqual([0]);
    expect(callback.calls.argsFor(11)).toEqual([4]);
    expect(callback.calls.argsFor(12)).toEqual([0]);
    expect(callback.calls.argsFor(13)).toEqual([4]);

    alter('insert_row', 1, 1);

    expect(callback.calls.argsFor(14)).toEqual([0]);
    expect(callback.calls.argsFor(15)).toEqual([5]);
    expect(callback.calls.argsFor(16)).toEqual([4]);
  });

  it('should correct bind rows with headers after re-load data calling loadData method (strict mode)', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      rowHeaders: true,
      bindRowsWithHeaders: 'strict',
      width: 500,
      height: 300
    });

    alter('remove_row', 1, 4);

    await sleep(100);

    hot.loadData(Handsontable.helper.createSpreadsheetData(5, 5));

    expect(getRowHeader()).toEqual([1, 2, 3, 4, 5]);
  });

  it('should correct bind rows with headers when row was removed (strict mode)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      rowHeaders: true,
      bindRowsWithHeaders: 'strict',
      width: 500,
      height: 300
    });

    alter('remove_row', 1, 4);

    expect(getRowHeader()).toEqual([1, 6, 7, 8, 9, 10]);
  });

  it('should correct bind rows with headers when row was inserted (strict mode)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 10),
      rowHeaders: true,
      bindRowsWithHeaders: 'strict',
      width: 500,
      height: 300
    });

    alter('insert_row', 1, 4);

    expect(getRowHeader()).toEqual([1, 5, 6, 7, 8, 2, 3, 4]);
  });

  it('should correct bind rows with headers when row was inserted and removed in mixed way (strict mode)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 10),
      rowHeaders: true,
      bindRowsWithHeaders: 'strict',
      width: 500,
      height: 300
    });

    alter('insert_row', 1, 4);
    alter('remove_row', 0, 3);
    alter('insert_row', 3, 1);

    expect(getRowHeader()).toEqual([7, 8, 2, 9, 3, 4]);
  });

  describe('column sorting', () => {
    it('should correct bind rows with headers when row was removed after sorting (strict mode)', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        columnSorting: true,
        rowHeaders: true,
        colHeaders: true,
        bindRowsWithHeaders: 'strict',
        width: 500,
        height: 300
      });

      await sleep(100);

      getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('click');
      alter('remove_row', 4, 1);

      expect(getRowHeader()).toEqual([1, 10, 2, 3, 5, 6, 7, 8, 9]);

      alter('remove_row', 0, 5);

      expect(getRowHeader()).toEqual([6, 7, 8, 9]);
    });

    it('should correct bind rows with headers when row was inserted after sorting (strict mode)', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        columnSorting: true,
        rowHeaders: true,
        colHeaders: true,
        bindRowsWithHeaders: 'strict',
        width: 500,
        height: 300
      });

      await sleep(100);

      getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('click');
      alter('insert_row', 4, 1);

      expect(getRowHeader()).toEqual([1, 10, 2, 3, 11, 4, 5, 6, 7, 8, 9]);

      alter('insert_row', 0, 5);

      expect(getRowHeader()).toEqual([12, 13, 14, 15, 16, 1, 10, 2, 3, 11, 4, 5, 6, 7, 8, 9]);
    });

    it('should correct bind rows with headers when row was inserted and removed in mixed way (strict mode)', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        columnSorting: true,
        rowHeaders: true,
        colHeaders: true,
        bindRowsWithHeaders: 'strict',
        width: 500,
        height: 300
      });

      await sleep(100);

      getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('click');
      alter('insert_row', 4, 1);
      alter('remove_row', 0, 5);
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('click');

      expect(getRowHeader()).toEqual([9, 8, 7, 6, 5, 4]);
    });
  });
});
