describe('Core_loadData', function () {
  var $container,
    id = 'testContainer';

  beforeEach(function () {
    $container = $('<div id="' + id + '"></div>');
  });

  afterEach(function () {
    $('#' + id).remove();
  });

  var arrayOfArrays = [
    ["", "Kia", "Nissan", "Toyota", "Honda"],
    ["2008", 10, 11, 12, 13],
    ["2009", 20, 11, 14, 13],
    ["2010", 30, 15, 12, 13]
  ];

  var arrayOfObjects = [
    {id: 1, name: "Ted", lastName: "Right"},
    {id: 2, name: "Frank", lastName: "Honest"},
    {id: 3, name: "Joan", lastName: "Well"}
  ];

  var arrayOfNestedObjects = [
    {id: 1, name: {
      first: "Ted",
      last: "Right"
    }},
    {id: 2, name: {
      first: "Frank",
      last: "Honest"
    }},
    {id: 3, name: {
      first: "Joan",
      last: "Well"
    }}
  ];

  it('should allow array of arrays', function () {
    $container.handsontable();
    $container.handsontable('loadData', arrayOfArrays);
    var output = $container.handsontable('getDataAtCell', 0, 2);
    expect(output).toEqual("Nissan");
  });

  it('should allow array of objects', function () {
    $container.handsontable({
      columns: [
        {data: "id"},
        {data: "lastName"},
        {data: "name"}
      ]
    });
    $container.handsontable('loadData', arrayOfObjects);
    var output = $container.handsontable('getDataAtCell', 0, 2);
    expect(output).toEqual("Ted");
  });

  it('should allow array of nested objects', function () {
    $container.handsontable({
      columns: [
        {data: "id"},
        {data: "name.last"},
        {data: "name.first"}
      ]
    });
    $container.handsontable('loadData', arrayOfNestedObjects);
    var output = $container.handsontable('getDataAtCell', 0, 2);
    expect(output).toEqual("Ted");
  });
});