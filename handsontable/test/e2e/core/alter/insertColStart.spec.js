xdescribe('Core.alter', () => {
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

  const arrayOfArrays = function() {
    return [
      ['', 'Kia', 'Nissan', 'Toyota', 'Honda'],
      ['2008', 10, 11, 12, 13],
      ['2009', 20, 11, 14, 13],
      ['2010', 30, 15, 12, 13]
    ];
  };

  describe('`insert_col_start` action', () => {
    it('should insert column at given index', () => {
      handsontable({
        data: [
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        ]
      });
      alter('insert_col', 1);

      expect(countCols()).toEqual(9);
      expect(spec().$container.find('tr:eq(1) td:eq(2)').html()).toEqual('b');
    });

    it('should insert column at the end if index is not given', () => {
      handsontable({
        data: [
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        ]
      });
      alter('insert_col');

      expect(countCols()).toEqual(9);
      expect(spec().$container.find('tr:eq(1) td:eq(7)').html()).toEqual('h');
    });

    it('should insert the amount of columns at given index', () => {
      handsontable({
        data: [
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        ]
      });
      alter('insert_col', 1, 3);

      expect(countCols()).toEqual(11);
      expect(spec().$container.find('tr:eq(1) td:eq(4)').html()).toEqual('b');
    });

    it('should insert the amount of columns at the end if index is not given', () => {
      handsontable({
        data: [
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        ]
      });
      alter('insert_col', null, 3);

      expect(countCols()).toEqual(11);
      expect(spec().$container.find('tr:eq(1) td:eq(7)').html()).toEqual('h');

      expect(spec().$container.find('tr:eq(1) td:eq(8)').html()).toEqual('');
      expect(spec().$container.find('tr:eq(1) td:eq(9)').html()).toEqual('');
      expect(spec().$container.find('tr:eq(1) td:eq(10)').html()).toEqual('');
    });

    it('should insert not more cols than maxCols', () => {
      handsontable({
        startCols: 5,
        maxCols: 7
      });
      alter('insert_col', 1);
      alter('insert_col', 1);
      alter('insert_col', 1);

      expect(countCols()).toEqual(7);
    });

    it('should not insert more columns than allowed by maxCols, when amount parameter is used', () => {
      handsontable({
        data: [
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        ],
        maxCols: 10
      });
      alter('insert_col', 1, 10);

      expect(countCols()).toEqual(10);
      expect(spec().$container.find('tr:eq(1) td:eq(1)').html()).toEqual('');
      expect(spec().$container.find('tr:eq(1) td:eq(2)').html()).toEqual('');
      expect(spec().$container.find('tr:eq(1) td:eq(3)').html()).toEqual('b');
    });

    it('should fire callback on create col', () => {
      let outputBefore;
      let outputAfter;

      handsontable({
        minRows: 5,
        data: arrayOfArrays(),
        beforeCreateCol(index, amount, source) {
          outputBefore = [index, amount, source];
        },
        afterCreateCol(index, amount, source) {
          outputAfter = [index, amount, source];
        },
      });
      alter('insert_col', 2, 1, 'customSource');

      expect(outputBefore).toEqual([2, 1, 'customSource']);
      expect(outputAfter).toEqual([2, 1, 'customSource']);
    });

    it('should not create columns when beforeCreateCol returns false', () => {
      handsontable({
        data: arrayOfArrays(),
        beforeCreateCol() {
          return false;
        },
      });

      const countedColumns = countCols();

      alter('insert_col', 2, 1, 'customSource');

      expect(countCols()).toBe(countedColumns);
    });

    it('should not create/shift cell meta objects if creating has been canceled by beforeCreateCol hook handler', () => {
      handsontable({
        beforeCreateCol: () => false,
      });

      setCellMeta(2, 0, '_test', 'foo');

      alter('insert_col', 1, 1);

      expect(getCellMeta(0, 0)._test).toBeUndefined();
      expect(getCellMeta(1, 0)._test).toBeUndefined();
      expect(getCellMeta(2, 0)._test).toBe('foo');
      expect(getCellMeta(3, 0)._test).toBeUndefined();
      expect(getCellMeta(4, 0)._test).toBeUndefined();
    });

    it('should not create column header together with the column, if headers were NOT specified explicitly', () => {
      handsontable({
        startCols: 3,
        startRows: 2,
        colHeaders: true
      });

      expect(getColHeader()).toEqual(['A', 'B', 'C']);

      expect(countCols()).toEqual(3);

      alter('insert_col', 1);

      expect(countCols()).toEqual(4);

      expect(getColHeader()).toEqual(['A', 'B', 'C', 'D']);

    });

    it('should create column header together with the column, if headers were specified explicitly', () => {
      handsontable({
        startCols: 3,
        startRows: 2,
        colHeaders: ['Header0', 'Header1', 'Header2']
      });

      expect(getColHeader()).toEqual(['Header0', 'Header1', 'Header2']);

      expect(countCols()).toEqual(3);

      alter('insert_col', 1);

      expect(countCols()).toEqual(4);

      expect(getColHeader()).toEqual(['Header0', 'B', 'Header1', 'Header2']);
    });

    it('should stretch the table after adding another column (if stretching is set to \'all\')', () => {
      spec().$container.css({
        width: 500,
      });

      const hot = handsontable({
        startCols: 5,
        startRows: 10,
        stretchH: 'all'
      });

      expect(Handsontable.dom.outerWidth(hot.view.TBODY)).toEqual(500);
      alter('insert_col', null, 1);
      expect(Handsontable.dom.outerWidth(hot.view.TBODY)).toEqual(500);
      alter('insert_col', null, 1);
      expect(Handsontable.dom.outerWidth(hot.view.TBODY)).toEqual(500);
    });

    it('should shift the cell meta according to the new column layout', () => {
      handsontable({
        startCols: 4,
        startRows: 3
      });

      setCellMeta(1, 2, 'className', 'test');
      alter('insert_col', 1, 1);

      expect(getCellMeta(1, 3).className).toEqual('test');
    });

    it('should shift the cell meta according to the new columns (>1) layout', () => {
      handsontable({
        startCols: 4,
        startRows: 3
      });

      setCellMeta(1, 2, 'className', 'test');
      alter('insert_col', 0, 3);

      expect(getCellMeta(1, 5).className).toEqual('test');
    });

    it('should insert column at proper position when there were some column sequence changes', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5)
      });

      hot.columnIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);

      alter('insert_col', 1, 1);

      expect(getDataAtRow(0)).toEqual(['E1', null, 'D1', 'C1', 'B1', 'A1']);
      expect(getSourceDataAtRow(0)).toEqual(['A1', 'B1', 'C1', null, 'D1', 'E1']);

      alter('insert_col', 0, 1);

      expect(getDataAtRow(0)).toEqual([null, 'E1', null, 'D1', 'C1', 'B1', 'A1']);
      expect(getSourceDataAtRow(0)).toEqual(['A1', 'B1', 'C1', null, 'D1', null, 'E1']);

      alter('insert_col', 7, 1);

      expect(getDataAtRow(0)).toEqual([null, 'E1', null, 'D1', 'C1', 'B1', 'A1', null]);
      expect(getSourceDataAtRow(0)).toEqual(['A1', 'B1', 'C1', null, 'D1', null, 'E1', null]);
    });
  });
});
