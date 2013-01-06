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

  it('should add not more rows than maxRows', function () {
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

  it('should add not more cols than maxCols', function () {
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
});