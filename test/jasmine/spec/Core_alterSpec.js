describe('Core_alter', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  var arrayOfNestedObjects = function () {
    return [
      {id: 1, name: {
        first: "Ted",
        last: "Right"
      }, address: "Street Name", zip: "80410", city: "City Name"},
      {id: 2, name: {
        first: "Frank",
        last: "Honest"
      }, address: "Street Name", zip: "80410", city: "City Name"},
      {id: 3, name: {
        first: "Joan",
        last: "Well"
      }, address: "Street Name", zip: "80410", city: "City Name"}
    ]
  };

  var arrayOfArrays = function () {
    return [
      ["", "Kia", "Nissan", "Toyota", "Honda"],
      ["2008", 10, 11, 12, 13],
      ["2009", 20, 11, 14, 13],
      ["2010", 30, 15, 12, 13]
    ];
  };

  describe("remove row", function () {
    it('should remove row', function () {
      handsontable({
        minRows: 5,
        data: arrayOfNestedObjects(),
        columns: [
          {data: "id"},
          {data: "name.first"}
        ]
      });
      alter('remove_row', 1);

      expect(getDataAtCell(1, 1)).toEqual('Joan'); //Joan should be moved up
      expect(getData().length).toEqual(5); //new row should be added by keepEmptyRows
    });

    it('should fire beforeRemoveRow event before removing row', function () {
      var onBeforeRemoveRow = jasmine.createSpy('onBeforeRemoveRow');

      var hot = handsontable({
        data: arrayOfNestedObjects(),
        columns: [
          {data: "id"},
          {data: "name.first"}
        ],
        beforeRemoveRow: onBeforeRemoveRow
      });
      alter('remove_row');

      expect(onBeforeRemoveRow).toHaveBeenCalledWith(countRows(), 1, undefined, undefined, undefined, undefined);
    });

    it('should not remove row if removing has been canceled by beforeRemoveRow event handler', function () {
      var onBeforeRemoveRow = jasmine.createSpy('onBeforeRemoveRow');
      onBeforeRemoveRow.plan = function () {
        return false;
      };

      var hot = handsontable({
        data: arrayOfNestedObjects(),
        columns: [
          {data: "id"},
          {data: "name.first"}
        ],
        beforeRemoveRow: onBeforeRemoveRow
      });

      expect(countRows()).toEqual(3);

      alter('remove_row');

      expect(countRows()).toEqual(3);
    });

    it('should not remove rows below minRows', function () {
      handsontable({
        startRows: 5,
        minRows: 4
      });
      alter('remove_row', 1);
      alter('remove_row', 1);
      alter('remove_row', 1);

      expect(countRows()).toEqual(4);
    });

    it('should not remove cols below minCols', function () {
      handsontable({
        startCols: 5,
        minCols: 4
      });
      alter('remove_col', 1);
      alter('remove_col', 1);
      alter('remove_col', 1);

      expect(countCols()).toEqual(4);
    });

    it('should remove one row if amount parameter is empty', function () {
      handsontable({
        data: [
          ["a1", "a2", "a3"],
          ["b1", "b2", "b3"],
          ["c1", "c2", "c3"],
          ["d1", "d2", "d3"],
          ["e1", "e2", "e3"]
        ]
      });
      alter('remove_row', 1);

      expect(countRows()).toEqual(4);
      expect(this.$container.find('tr:eq(0) td:eq(0)').html()).toEqual('a1');
      expect(this.$container.find('tr:eq(1) td:eq(1)').html()).toEqual('c2');
    });

    it('should remove as many rows as given in the amount parameter', function () {
      handsontable({
        data: [
          ["a1", "a2", "a3"],
          ["b1", "b2", "b3"],
          ["c1", "c2", "c3"],
          ["d1", "d2", "d3"],
          ["e1", "e2", "e3"]
        ]
      });
      alter('remove_row', 1, 3);

      expect(countRows()).toEqual(2);
      expect(this.$container.find('tr:eq(0) td:eq(0)').html()).toEqual('a1');
      expect(this.$container.find('tr:eq(1) td:eq(1)').html()).toEqual('e2');
    });

    it('should not remove more rows that exist', function () {
      handsontable({
        data: [
          ["a1", "a2", "a3"],
          ["b1", "b2", "b3"],
          ["c1", "c2", "c3"],
          ["d1", "d2", "d3"],
          ["e1", "e2", "e3"]
        ]
      });
      alter('remove_row', 1, 10);

      expect(countRows()).toEqual(1);
      expect(getHtCore().find('tr:last td:last').html()).toEqual('a3');
    });

    it('should remove one row from end if no parameters are given', function () {
      handsontable({
        data: [
          ["a1", "a2", "a3"],
          ["b1", "b2", "b3"],
          ["c1", "c2", "c3"],
          ["d1", "d2", "d3"],
          ["e1", "e2", "e3"]
        ]
      });
      alter('remove_row');

      expect(countRows()).toEqual(4);
      expect(getHtCore().find('tr:last td:eq(0)').html()).toEqual('d1');
    });

    it('should remove amount of rows from end if index parameter is not given', function () {
      handsontable({
        data: [
          ["a1", "a2", "a3"],
          ["b1", "b2", "b3"],
          ["c1", "c2", "c3"],
          ["d1", "d2", "d3"],
          ["e1", "e2", "e3"]
        ]
      });
      alter('remove_row', null, 3);

      expect(countRows()).toEqual(2);
      expect(getHtCore().find('tr:last td:eq(0)').html()).toEqual('b1');
    });

    it("should remove rows from table with fixedRows", function () {
      handsontable({
        data: [
          ["a1", "a2", "a3"],
          ["b1", "b2", "b3"]
        ],
        fixedRowsTop: 1,
        minSpareRows: 0
      });

      alter('remove_row', 1);

      expect(countRows()).toEqual(1);

    });

    it("should remove all rows from table with fixedRows", function () {
      handsontable({
        data: [
          ["a1", "a2", "a3"],
          ["b1", "b2", "b3"]
        ],
        fixedRowsTop: 1,
        minSpareRows: 0
      });

      alter('remove_row', 1);
      alter('remove_row', 1);

      expect(countRows()).toEqual(0);

    });

    it("should remove row's cellProperties", function () {
      handsontable({
        startCols: 1,
        startRows: 3
      });

      getCellMeta(0, 0).someValue = [0, 0];
      getCellMeta(1, 0).someValue = [1, 0];
      getCellMeta(2, 0).someValue = [2, 0];

      alter('remove_row', 0);

      expect(getCellMeta(0, 0).someValue).toEqual([1, 0]);
      expect(getCellMeta(1, 0).someValue).toEqual([2, 0]);


    });

    it('should fire callback on remove row', function () {
      var output;
      handsontable({
        minRows: 5,
        data: arrayOfNestedObjects(),
        columns: [
          {data: "id"},
          {data: "name.first"}
        ],
        afterRemoveRow: function (index, amount) {
          output = [index, amount];
        }
      });
      alter('remove_row', 1, 2);

      expect(output).toEqual([1, 2]);
    });

    it("should decrement the number of fixed rows, if a fix row is removed", function () {
      var hot = handsontable({
        startCols: 1,
        startRows: 3,
        fixedRowsTop: 4
      });

      alter('remove_row', 1, 1);
      expect(hot.getSettings().fixedRowsTop).toEqual(3);
      alter('remove_row', 1, 2);
      expect(hot.getSettings().fixedRowsTop).toEqual(1);
    });

  });

  describe("remove column", function () {
    it('should remove one column if amount parameter is empty', function () {
      handsontable({
        data: [
          ["a", "b", "c", "d", "e", "f", "g", "h"],
          ["a", "b", "c", "d", "e", "f", "g", "h"]
        ]
      });
      alter('remove_col', 1);

      expect(countCols()).toEqual(7);
      expect(this.$container.find('tr:eq(0) td:eq(0)').html()).toEqual('a');
      expect(this.$container.find('tr:eq(1) td:eq(1)').html()).toEqual('c');
    });

    it('should remove as many columns as given in the amount parameter', function () {
      handsontable({
        data: [
          ["a", "b", "c", "d", "e", "f", "g", "h"],
          ["a", "b", "c", "d", "e", "f", "g", "h"]
        ]
      });
      alter('remove_col', 1, 3);

      expect(countCols()).toEqual(5);
      expect(this.$container.find('tr:eq(0) td:eq(0)').html()).toEqual('a');
      expect(this.$container.find('tr:eq(1) td:eq(1)').html()).toEqual('e');
    });

    it('should not remove more columns that exist', function () {
      handsontable({
        data: [
          ["a", "b", "c", "d", "e", "f", "g", "h"],
          ["a", "b", "c", "d", "e", "f", "g", "h"]
        ]
      });
      alter('remove_col', 6, 3);

      expect(countCols()).toEqual(6);
      expect(this.$container.find('tr:eq(1) td:last').html()).toEqual('f');
    });

    it('should remove one column from end if no parameters are given', function () {
      handsontable({
        data: [
          ["a", "b", "c", "d", "e", "f", "g", "h"],
          ["a", "b", "c", "d", "e", "f", "g", "h"]
        ]
      });
      alter('remove_col');

      expect(countCols()).toEqual(7);
      expect(this.$container.find('tr:eq(1) td:last').html()).toEqual('g');
    });

    it('should remove amount of columns from end if index parameter is not given', function () {
      handsontable({
        data: [
          ["a", "b", "c", "d", "e", "f", "g", "h"],
          ["a", "b", "c", "d", "e", "f", "g", "h"]
        ]
      });
      alter('remove_col', null, 3);

      expect(countCols()).toEqual(5);
      expect(this.$container.find('tr:eq(1) td:last').html()).toEqual('e');
    });

    it('should fire beforeRemoveCol event before removing col', function () {
      var onBeforeRemoveCol = jasmine.createSpy('onBeforeRemoveCol');

      var hot = handsontable({
        beforeRemoveCol: onBeforeRemoveCol
      });
      alter('remove_col');

      expect(onBeforeRemoveCol).toHaveBeenCalledWith(countCols(), 1, undefined, undefined, undefined, undefined);
    });

    it('should not remove column if removing has been canceled by beforeRemoveCol event handler', function () {
      var onBeforeRemoveCol = jasmine.createSpy('onBeforeRemoveCol');
      onBeforeRemoveCol.plan = function () {
        return false;
      };

      var hot = handsontable({
        beforeRemoveCol: onBeforeRemoveCol
      });

      expect(countCols()).toEqual(5);

      alter('remove_col');

      expect(countCols()).toEqual(5);
    });

    it('should fire callback on remove col', function () {
      var output;
      handsontable({
        minRows: 5,
        data: arrayOfArrays(),
        afterRemoveCol: function (index, amount) {
          output = [index, amount];
        }
      });
      alter('remove_col', 1);

      expect(output).toEqual([1, 1]);
    });

    it("should remove column's properties", function () {
      handsontable({
        startCols: 3,
        startRows: 1
      });

      getCellMeta(0, 0).someValue = [0, 0];
      getCellMeta(0, 1).someValue = [0, 1];
      getCellMeta(0, 2).someValue = [0, 2];

      alter('remove_col', 0);

      expect(getCellMeta(0, 0).someValue).toEqual([0, 1]);
      expect(getCellMeta(0, 1).someValue).toEqual([0, 2]);
    });

    it("should remove column when not all rows are visible in the viewport", function () {
      this.$container.css({
        height: '100',
        overflow: 'auto'
      });

      handsontable({
        startCols: 3,
        startRows: 20
      });

      expect(getHtCore().find('tbody tr').length).toBeLessThan(20);
      expect(countCols()).toEqual(3);

      alter('remove_col', 0);

      expect(countCols()).toEqual(2);
    });

    it("should not remove column header together with the column, if headers were NOT specified explicitly", function () {

      handsontable({
        startCols: 3,
        startRows: 2,
        colHeaders: true
      });

      expect(getColHeader()).toEqual(['A', 'B', 'C']);

      expect(countCols()).toEqual(3);

      alter('remove_col', 1);

      expect(countCols()).toEqual(2);

      expect(getColHeader()).toEqual(['A', 'B']);

    });

    it("should remove column header together with the column, if headers were specified explicitly", function () {

      handsontable({
        startCols: 3,
        startRows: 2,
        colHeaders: ['Header0', 'Header1', 'Header2']
      });

      expect(getColHeader()).toEqual(['Header0', 'Header1', 'Header2']);

      expect(countCols()).toEqual(3);

      alter('remove_col', 1);

      expect(countCols()).toEqual(2);

      expect(getColHeader()).toEqual(['Header0', 'Header2']);

    });

    it("should decrement the number of fixed columns, if a fix column is removed", function () {
      var hot = handsontable({
        startCols: 1,
        startRows: 3,
        fixedColumnsLeft: 4
      });

      alter('remove_col', 1, 1);
      expect(hot.getSettings().fixedColumnsLeft).toEqual(3);
      alter('remove_col', 1, 2);
      expect(hot.getSettings().fixedColumnsLeft).toEqual(1);
    });

  });

  describe("insert row", function () {
    it('should insert row at given index', function () {
      handsontable({
        data: [
          ["a1", "a2", "a3"],
          ["b1", "b2", "b3"],
          ["c1", "c2", "c3"],
          ["d1", "d2", "d3"],
          ["e1", "e2", "e3"]
        ]
      });
      alter('insert_row', 1);

      expect(countRows()).toEqual(6);
      expect(this.$container.find('tr:eq(2) td:eq(0)').html()).toEqual('b1');
    });

    it('should insert row at the end if index is not given', function () {
      handsontable({
        data: [
          ["a1", "a2", "a3"],
          ["b1", "b2", "b3"],
          ["c1", "c2", "c3"],
          ["d1", "d2", "d3"],
          ["e1", "e2", "e3"]
        ]
      });
      alter('insert_row');

      expect(countRows()).toEqual(6);
      expect(getHtCore().find('tr:eq(4) td:eq(0)').html()).toEqual('e1');

      expect(getHtCore().find('tr:last td:eq(0)').html()).toEqual('');
    });

    it('should insert the amount of rows at given index', function () {
      handsontable({
        data: [
          ["a1", "a2", "a3"],
          ["b1", "b2", "b3"],
          ["c1", "c2", "c3"],
          ["d1", "d2", "d3"],
          ["e1", "e2", "e3"]
        ]
      });
      alter('insert_row', 1, 3);

      expect(countRows()).toEqual(8);

      expect(this.$container.find('tr:eq(1) td:eq(0)').html()).toEqual('');

      expect(this.$container.find('tr:eq(4) td:eq(0)').html()).toEqual('b1');
    });

    it('should insert the amount of rows at the end if index is not given', function () {
      handsontable({
        data: [
          ["a1", "a2", "a3"],
          ["b1", "b2", "b3"],
          ["c1", "c2", "c3"],
          ["d1", "d2", "d3"],
          ["e1", "e2", "e3"]
        ]
      });
      alter('insert_row', null, 3);

      expect(countRows()).toEqual(8);
      expect(getHtCore().find('tr:eq(4) td:eq(0)').html()).toEqual('e1');

      expect(getHtCore().find('tr:eq(5) td:eq(0)').html()).toEqual('');
      expect(getHtCore().find('tr:eq(6) td:eq(0)').html()).toEqual('');
      expect(getHtCore().find('tr:eq(7) td:eq(0)').html()).toEqual('');
    });

    it('should insert not more rows than maxRows', function () {
      handsontable({
        startRows: 5,
        maxRows: 7
      });
      alter('insert_row', 1);
      alter('insert_row', 1);
      alter('insert_row', 1);

      expect(countRows()).toEqual(7);
    });

    it('when amount parameter is used, should not insert more rows than allowed by maxRows', function () {
      handsontable({
        data: [
          ["a1", "a2", "a3"],
          ["b1", "b2", "b3"],
          ["c1", "c2", "c3"],
          ["d1", "d2", "d3"],
          ["e1", "e2", "e3"]
        ],
        maxRows: 10
      });
      alter('insert_row', 1, 10);

      expect(countRows()).toEqual(10);
      expect(this.$container.find('tr:eq(6) td:eq(0)').html()).toEqual('b1');
    });

    it('should fire callback on create row', function () {
      var output;
      handsontable({
        minRows: 5,
        data: arrayOfNestedObjects(),
        columns: [
          {data: "id"},
          {data: "name.first"}
        ],
        afterCreateRow: function (index, amount) {
          output = index;
        }
      });
      alter('insert_row', 3);

      expect(output).toEqual(3);
    });

    it("should keep the single-cell selection in the same position as before inserting the row", function () {
      handsontable({
        minRows: 5,
        data: [
          ["a", "b", "c", "d", "e", "f", "g", "h"],
          ["a", "b", "c", "d", "e", "f", "g", "h"],
          ["a", "b", "c", "d", "e", "f", "g", "h"]
        ]
      });

      selectCell(2,2);
      alter('insert_row', 2);

      var selected = getSelected();
      expect(selected[0]).toEqual(3);
      expect(selected[2]).toEqual(3);
    });

  });

  describe("insert column", function () {
    it('should insert column at given index', function () {
      handsontable({
        data: [
          ["a", "b", "c", "d", "e", "f", "g", "h"],
          ["a", "b", "c", "d", "e", "f", "g", "h"]
        ]
      });
      alter('insert_col', 1);

      expect(countCols()).toEqual(9);
      expect(this.$container.find('tr:eq(1) td:eq(2)').html()).toEqual('b');
    });

    it('should insert column at the end if index is not given', function () {
      handsontable({
        data: [
          ["a", "b", "c", "d", "e", "f", "g", "h"],
          ["a", "b", "c", "d", "e", "f", "g", "h"]
        ]
      });
      alter('insert_col');

      expect(countCols()).toEqual(9);
      expect(this.$container.find('tr:eq(1) td:eq(7)').html()).toEqual('h');
    });

    it('should insert the amount of columns at given index', function () {
      handsontable({
        data: [
          ["a", "b", "c", "d", "e", "f", "g", "h"],
          ["a", "b", "c", "d", "e", "f", "g", "h"]
        ]
      });
      alter('insert_col', 1, 3);

      expect(countCols()).toEqual(11);
      expect(this.$container.find('tr:eq(1) td:eq(4)').html()).toEqual('b');
    });

    it('should insert the amount of columns at the end if index is not given', function () {
      handsontable({
        data: [
          ["a", "b", "c", "d", "e", "f", "g", "h"],
          ["a", "b", "c", "d", "e", "f", "g", "h"]
        ]
      });
      alter('insert_col', null, 3);

      expect(countCols()).toEqual(11);
      expect(this.$container.find('tr:eq(1) td:eq(7)').html()).toEqual('h');

      expect(this.$container.find('tr:eq(1) td:eq(8)').html()).toEqual('');
      expect(this.$container.find('tr:eq(1) td:eq(9)').html()).toEqual('');
      expect(this.$container.find('tr:eq(1) td:eq(10)').html()).toEqual('');
    });

    it('should insert not more cols than maxCols', function () {
      handsontable({
        startCols: 5,
        maxCols: 7
      });
      alter('insert_col', 1);
      alter('insert_col', 1);
      alter('insert_col', 1);

      expect(countCols()).toEqual(7);
    });

    it('should not insert more columns than allowed by maxCols, when amount parameter is used', function () {
      handsontable({
        data: [
          ["a", "b", "c", "d", "e", "f", "g", "h"],
          ["a", "b", "c", "d", "e", "f", "g", "h"]
        ],
        maxCols: 10
      });
      alter('insert_col', 1, 10);

      expect(countCols()).toEqual(10);
      expect(this.$container.find('tr:eq(1) td:eq(1)').html()).toEqual('');
      expect(this.$container.find('tr:eq(1) td:eq(2)').html()).toEqual('');
      expect(this.$container.find('tr:eq(1) td:eq(3)').html()).toEqual('b');
    });

    it('should fire callback on create col', function () {
      var output;
      handsontable({
        minRows: 5,
        data: arrayOfArrays(),
        afterCreateCol: function (index) {
          output = index;
        }
      });
      alter('insert_col', 2);

      expect(output).toEqual(2);
    });

    it("should not create column header together with the column, if headers were NOT specified explicitly", function () {

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

    it("should create column header together with the column, if headers were specified explicitly", function () {

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

    it("should stretch the table after adding another column (if stretching is set to 'all')", function () {
      this.$container.css({
        "width": 500
      });

      var hot = handsontable({
        startCols: 5,
        startRows: 10,
        stretchH: 'all'
      });

      expect(Handsontable.Dom.outerWidth(hot.view.TBODY)).toEqual(500);
      alter('insert_col', null, 1);
      expect(Handsontable.Dom.outerWidth(hot.view.TBODY)).toEqual(500);
      alter('insert_col', null, 1);
      expect(Handsontable.Dom.outerWidth(hot.view.TBODY)).toEqual(500);
    });

  });

});
