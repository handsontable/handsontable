describe('Core_splice', () => {
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

  describe('spliceCol', () => {
    it('should remove data from specified col', () => {
      handsontable({
        data: arrayOfArrays(),
        minSpareRows: 1
      });

      expect(spliceCol(1, 0, 2)).toEqual(['Kia', 10]);
      expect(getData(0, 1, 3, 1)).toEqual([[20], [30], [null], [null]]);
    });

    it('should insert data into specified col', () => {
      handsontable({
        data: arrayOfArrays(),
        minSpareRows: 1
      });

      expect(spliceCol(1, 1, 0, 'test', 'test', 'test')).toEqual([]);
      expect(getData(0, 1, 6, 1)).toEqual([['Kia'], ['test'], ['test'], ['test'], [10], [20], [30]]);
    });

    it('should remove and insert data into specified col', () => {
      handsontable({
        data: arrayOfArrays(),
        minSpareRows: 1
      });

      expect(spliceCol(1, 0, 2, 'test', 'test', 'test')).toEqual(['Kia', 10]);
      expect(getData(0, 1, 4, 1)).toEqual([['test'], ['test'], ['test'], [20], [30]]);
    });
  });

  describe('spliceRow', () => {
    it('should remove data from specified row', () => {
      handsontable({
        data: arrayOfArrays(),
        minSpareCols: 1
      });

      expect(spliceRow(0, 0, 3)).toEqual(['', 'Kia', 'Nissan']);
      expect(getData(0, 0, 0, 4)).toEqual([['Toyota', 'Honda', null, null, null]]);
    });

    it('should insert data into specified row', () => {
      handsontable({
        data: arrayOfArrays(),
        minSpareCols: 1
      });

      expect(spliceRow(0, 0, 0, 'test', 'test', 'test')).toEqual([]);
      expect(getData(0, 0, 0, 7)).toEqual([['test', 'test', 'test', '', 'Kia', 'Nissan', 'Toyota', 'Honda']]);
    });

    it('should remove and insert data into specified row', () => {
      handsontable({
        data: arrayOfArrays(),
        minSpareCols: 1
      });

      expect(spliceRow(0, 0, 2, 'test', 'test', 'test')).toEqual(['', 'Kia']);
      expect(getData(0, 0, 0, 5)).toEqual([['test', 'test', 'test', 'Nissan', 'Toyota', 'Honda']]);
    });
  });
});
