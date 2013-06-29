describe('Core_keepEmptyRows', function () {
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

  it('should remove columns if needed', function () {
    handsontable({
      data: arrayOfNestedObjects(),
      columns: [
        {data: "id"},
        {data: "name.first"}
      ]
    });

    expect(this.$container.find('tbody tr:first td').length).toEqual(2);
  });

  it('should create columns if needed', function () {
    handsontable({
      data: arrayOfNestedObjects(),
      columns: [
        {data: "id"},
        {data: "name.first"},
        {data: "name.last"},
        {data: "address"},
        {data: "zip"},
        {data: "city"}
      ]
    });

    expect(this.$container.find('tbody tr:first td').length).toEqual(6);
  });

  it('should create spare cols and rows on init (array data source)', function () {
    handsontable({
      data: [
        ["one", "two"],
        ["three", "four"]
      ],
      minCols: 4,
      minRows: 4,
      minSpareRows: 4,
      minSpareCols: 4
    });

    expect(countCells()).toEqual(36);
  });

  it('should create spare cols and rows on init (object data source)', function () {
    handsontable({
      data: arrayOfNestedObjects(),
      minRows: 4,
      minSpareRows: 1
    });

    expect(countRows()).toEqual(4);
    expect(countCols()).toEqual(6); //because arrayOfNestedObjects has 6 nested properites and they should be figured out if dataSchema/columns is not given
    expect(this.$container.find('tbody tr:first td:last').text()).toEqual('City Name');
  });

  it('should create new row when last cell in last row is edited', function () {
    var data = [
      ["one", "two"],
      ["three", "four"]
    ];

    handsontable({
      data: data,
      minRows: 4,
      minCols: 4,
      minSpareRows: 1
    });
    setDataAtCell(3, 3, "test");

    expect(data.length).toEqual(5);
  });

  it('should create new col when last cell in last row is edited', function () {
    var data = [
      ["one", "two"],
      ["three", "four"]
    ];

    handsontable({
      data: data,
      minRows: 4,
      minCols: 4,
      minSpareCols: 1
    });
    setDataAtCell(3, 3, "test");

    expect(countCols()).toEqual(5);
  });

  it('should create new row when last cell in last row is edited by autocomplete', function () {
    var data = [
          {id: 1, color: "orange" }
        ];

    handsontable({
      data: data,
      startRows: 5,
      colHeaders: true,
      minSpareRows: 1,
      columns: [
        {data: "id", type: 'text'},
        {data: "color",
          type: 'autocomplete',
          source: ["yellow", "red", "orange"]
        }
      ]
    });

    selectCell(1, 1);

    keyDownUp('enter');
    keyDown('arrow_down');
    keyDownUp('enter');

    expect(data.length).toEqual(3);
  });

  it('should not create more rows that maxRows', function () {
    handsontable({
      startRows: 4,
      maxRows: 6,
      minSpareRows: 1
    });
    setDataAtCell(3, 0, "test");
    setDataAtCell(4, 0, "test");
    setDataAtCell(5, 0, "test");

    expect(countRows()).toEqual(6);
  });

  it('should not create more cols that maxCols', function () {
    handsontable({
      startCols: 4,
      maxCols: 6,
      minSpareCols: 1
    });
    setDataAtCell(0, 3, "test");
    setDataAtCell(0, 4, "test");
    setDataAtCell(0, 5, "test");

    expect(countCols()).toEqual(6);
  });

  it('should ignore minCols if columns is set', function () {
    handsontable({
      startCols: 1,
      minCols: 6,
      columns: [
        {},
        {}
      ]
    });

    expect(countCols()).toEqual(2);
  });

  it('columns should have priority over startCols', function () {
    handsontable({
      startCols: 3,
      minCols: 6,
      columns: [
        {},
        {}
      ]
    });

    expect(countCols()).toEqual(2);
  });
});