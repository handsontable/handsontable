describe('Core_keepEmptyRows', function () {
  var $container,
    id = 'testContainer';

  beforeEach(function () {
    $('#' + id).remove();
    $container = $('<div id="' + id + '"></div>');
  });

  afterEach(function () {

  });

  var arrayOfNestedObjects = [
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
  ];

  it('should remove columns if needed', function () {
    $container.handsontable({
      data: arrayOfNestedObjects,
      columns: [
        {data: "id"},
        {data: "name.first"}
      ]
    });
    expect($container.find('tbody tr:first td').length).toEqual(2);
  });

  it('should create columns if needed', function () {
    $container.handsontable({
      data: arrayOfNestedObjects,
      columns: [
        {data: "id"},
        {data: "name.first"},
        {data: "name.last"},
        {data: "address"},
        {data: "zip"},
        {data: "city"}
      ]
    });
    expect($container.find('tbody tr:first td').length).toEqual(6);
  });
});