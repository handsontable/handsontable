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

  it('should remove remove row', function () {
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
});