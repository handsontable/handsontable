describe('Core_loadData', function () {
  var $container,
    id = 'testContainer';

  beforeEach(function () {
    $('#' + id).remove();
    $container = $('<div id="' + id + '"></div>');
  });

  afterEach(function () {

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
      colHeaders: true,
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

  it('should trigger onChange callback', function () {
    var calls = 0;

    runs(function(){
      $container.handsontable({
        onChange: function(changes, source){
          if(source === 'loadData') {
            calls++;
          }
        }
      });
      $container.handsontable('loadData', arrayOfArrays);
      $container.handsontable('loadData', arrayOfObjects);
      $container.handsontable('loadData', arrayOfNestedObjects);
    });

    waitsFor(function () {
      return (calls === 3)
    }, "onChange callback called", 100);

    runs(function () {
      expect(calls).toEqual(3);
    });
  });
});