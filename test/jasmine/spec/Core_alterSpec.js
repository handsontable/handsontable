describe('Core_alter', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
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

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(getDataAtCell(1, 1)).toEqual('Joan'); //Joan should be moved up
      expect(getData().length).toEqual(5); //new row should be added by keepEmptyRows
    });
  });

  it('should not remove rows below minRows', function () {
    handsontable({
      startRows: 5,
      minRows: 4
    });
    alter('remove_row', 1);
    alter('remove_row', 1);
    alter('remove_row', 1);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countRows()).toEqual(4);
    });
  });

  it('should not remove cols below minCols', function () {
    handsontable({
      startCols: 5,
      minCols: 4
    });
    alter('remove_col', 1);
    alter('remove_col', 1);
    alter('remove_col', 1);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countCols()).toEqual(4);
    });
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

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countRows()).toEqual(4);
      expect(this.$container.find('tr:eq(0) td:eq(0)').html()).toEqual('a1');
      expect(this.$container.find('tr:eq(1) td:eq(1)').html()).toEqual('c2');
    });
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

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countRows()).toEqual(2);
      expect(this.$container.find('tr:eq(0) td:eq(0)').html()).toEqual('a1');
      expect(this.$container.find('tr:eq(1) td:eq(1)').html()).toEqual('e2');
    });
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

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countRows()).toEqual(1);
      expect(this.$container.find('tr:last td:last').html()).toEqual('a3');
    });
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

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countRows()).toEqual(4);
      expect(this.$container.find('tr:last td:eq(0)').html()).toEqual('d1');
    });
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

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countRows()).toEqual(2);
      expect(this.$container.find('tr:last td:eq(0)').html()).toEqual('b1');
    });
  });

  it('should remove one column if amount parameter is empty', function () {
    handsontable({
      data: [
        ["a", "b", "c", "d", "e", "f", "g", "h"],
        ["a", "b", "c", "d", "e", "f", "g", "h"]
      ]
    });
    alter('remove_col', 1);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countCols()).toEqual(7);
      expect(this.$container.find('tr:eq(0) td:eq(0)').html()).toEqual('a');
      expect(this.$container.find('tr:eq(1) td:eq(1)').html()).toEqual('c');
    });
  });

  it('should remove as many columns as given in the amount parameter', function () {
    handsontable({
      data: [
        ["a", "b", "c", "d", "e", "f", "g", "h"],
        ["a", "b", "c", "d", "e", "f", "g", "h"]
      ]
    });
    alter('remove_col', 1, 3);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countCols()).toEqual(5);
      expect(this.$container.find('tr:eq(0) td:eq(0)').html()).toEqual('a');
      expect(this.$container.find('tr:eq(1) td:eq(1)').html()).toEqual('e');
    });
  });

  it('should not remove more columns that exist', function () {
    handsontable({
      data: [
        ["a", "b", "c", "d", "e", "f", "g", "h"],
        ["a", "b", "c", "d", "e", "f", "g", "h"]
      ]
    });
    alter('remove_col', 6, 3);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countCols()).toEqual(6);
      expect(this.$container.find('tr:eq(1) td:last').html()).toEqual('f');
    });
  });

  it('should remove one column from end if no parameters are given', function () {
    handsontable({
      data: [
        ["a", "b", "c", "d", "e", "f", "g", "h"],
        ["a", "b", "c", "d", "e", "f", "g", "h"]
      ]
    });
    alter('remove_col');

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countCols()).toEqual(7);
      expect(this.$container.find('tr:eq(1) td:last').html()).toEqual('g');
    });
  });

  it('should remove amount of columns from end if index parameter is not given', function () {
    handsontable({
      data: [
        ["a", "b", "c", "d", "e", "f", "g", "h"],
        ["a", "b", "c", "d", "e", "f", "g", "h"]
      ]
    });
    alter('remove_col', null, 3);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countCols()).toEqual(5);
      expect(this.$container.find('tr:eq(1) td:last').html()).toEqual('e');
    });
  });

  /*insert_row*/

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

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countRows()).toEqual(6);
      expect(this.$container.find('tr:eq(2) td:eq(0)').html()).toEqual('b1');
    });
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

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countRows()).toEqual(6);
      expect(this.$container.find('tr:eq(4) td:eq(0)').html()).toEqual('e1');
      expect(this.$container.find('tr:last td:eq(0)').html()).toEqual('');
    });
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

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countRows()).toEqual(8);
      expect(this.$container.find('tr:eq(1) td:eq(0)').html()).toEqual('');
      expect(this.$container.find('tr:eq(4) td:eq(0)').html()).toEqual('b1');
    });
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

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countRows()).toEqual(8);
      expect(this.$container.find('tr:eq(4) td:eq(0)').html()).toEqual('e1');
      expect(this.$container.find('tr:eq(5) td:eq(0)').html()).toEqual('');
      expect(this.$container.find('tr:eq(6) td:eq(0)').html()).toEqual('');
      expect(this.$container.find('tr:eq(7) td:eq(0)').html()).toEqual('');
    });
  });

  it('should insert not more rows than maxRows', function () {
    handsontable({
      startRows: 5,
      maxRows: 7
    });
    alter('insert_row', 1);
    alter('insert_row', 1);
    alter('insert_row', 1);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countRows()).toEqual(7);
    });
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

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countRows()).toEqual(10);
      expect(this.$container.find('tr:eq(6) td:eq(0)').html()).toEqual('b1');
    });
  });

  /*insert_col*/

  it('should insert column at given index', function () {
    handsontable({
      data: [
        ["a", "b", "c", "d", "e", "f", "g", "h"],
        ["a", "b", "c", "d", "e", "f", "g", "h"]
      ]
    });
    alter('insert_col', 1);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countCols()).toEqual(9);
      expect(this.$container.find('tr:eq(1) td:eq(2)').html()).toEqual('b');
    });
  });

  it('should insert column at the end if index is not given', function () {
    handsontable({
      data: [
        ["a", "b", "c", "d", "e", "f", "g", "h"],
        ["a", "b", "c", "d", "e", "f", "g", "h"]
      ]
    });
    alter('insert_col');

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countCols()).toEqual(9);
      expect(this.$container.find('tr:eq(1) td:eq(7)').html()).toEqual('h');
    });
  });

  it('should insert the amount of columns at given index', function () {
    handsontable({
      data: [
        ["a", "b", "c", "d", "e", "f", "g", "h"],
        ["a", "b", "c", "d", "e", "f", "g", "h"]
      ]
    });
    alter('insert_col', 1, 3);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countCols()).toEqual(11);
      expect(this.$container.find('tr:eq(1) td:eq(4)').html()).toEqual('b');
    });
  });

  it('should insert the amount of columns at the end if index is not given', function () {
    handsontable({
      data: [
        ["a", "b", "c", "d", "e", "f", "g", "h"],
        ["a", "b", "c", "d", "e", "f", "g", "h"]
      ]
    });
    alter('insert_col', null, 3);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countCols()).toEqual(11);
      expect(this.$container.find('tr:eq(1) td:eq(7)').html()).toEqual('h');
      expect(this.$container.find('tr:eq(1) td:eq(8)').html()).toEqual('');
      expect(this.$container.find('tr:eq(1) td:eq(9)').html()).toEqual('');
      expect(this.$container.find('tr:eq(1) td:eq(10)').html()).toEqual('');
    });
  });

  it('should insert not more cols than maxCols', function () {
    handsontable({
      startCols: 5,
      maxCols: 7
    });
    alter('insert_col', 1);
    alter('insert_col', 1);
    alter('insert_col', 1);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countCols()).toEqual(7);
    });
  });

  it('when amount parameter is used, should not insert more columns than allowed by maxCols', function () {
    handsontable({
      data: [
        ["a", "b", "c", "d", "e", "f", "g", "h"],
        ["a", "b", "c", "d", "e", "f", "g", "h"]
      ],
      maxCols: 10
    });
    alter('insert_col', 1, 10);

    waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      expect(countCols()).toEqual(10);
      expect(this.$container.find('tr:eq(1) td:eq(1)').html()).toEqual('');
      expect(this.$container.find('tr:eq(1) td:eq(2)').html()).toEqual('');
      expect(this.$container.find('tr:eq(1) td:eq(3)').html()).toEqual('b');
    });
  });
});