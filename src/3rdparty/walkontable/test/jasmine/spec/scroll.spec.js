describe('WalkontableScroll', function () {
  var $table
    , debug = false;

  beforeEach(function () {
    $table = $('<table></table>'); //create a table that is not attached to document
    $table.appendTo('body');
    createDataArray();
  });

  afterEach(function () {
    if (!debug) {
      $('.wtHolder').remove();
    }
  });

  it("should scroll to last column when rowHeaders is not in use", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 100
    });
    wt.draw().scrollHorizontal(999).draw();
    expect($table.find('tbody tr:eq(0) td:last')[0].innerHTML).toBe('c');
  });

  it("should scroll to last column when rowHeaders is in use", function () {
    function plusOne(i) {
      return i + 1;
    }

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 100,
      columnHeaders: function (col, TH) {
        TH.innerHTML = plusOne(col);
      },
      frozenColumns: [plusOne]
    });
    wt.draw().scrollHorizontal(999).draw();
    expect($table.find('tbody tr:eq(0) td:last')[0].innerHTML).toBe('c');
  });

  it("scroll vertical should take totalRows if it is smaller than height", function () {
    this.data.splice(5, this.data.length - 5);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 100
    });
    wt.draw().scrollVertical(999).draw();
    expect(wt.wtTable.getCoords($table.find('tbody tr:eq(0) td:eq(0)')[0])).toEqual([0, 0]);
  });

  it("scroll horizontal should take totalColumns if it is smaller than width", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 500
    });
    wt.draw().scrollHorizontal(999).draw();
    expect(wt.wtTable.getCoords($table.find('tbody tr:eq(0) td:eq(0)')[0])).toEqual([0, 0]);
  });

  it("scroll vertical should scroll to first row if given number smaller than 0", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 100
    });
    wt.draw().scrollVertical(-1).draw();
    expect(wt.wtTable.getCoords($table.find('tbody tr:first td:first')[0])).toEqual([0, 0]);
  });

  it("scroll vertical should scroll to last row if given number bigger than totalRows", function () {
    this.data.splice(20, this.data.length - 20);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 100
    });
    wt.draw().scrollVertical(999).draw();
    expect(wt.wtTable.getCoords($table.find('tbody tr:last td:first')[0])).toEqual([19, 0]);
  });

  it("scroll horizontal should scroll to first row if given number smaller than 0", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 100
    });
    wt.draw().scrollHorizontal(-1).draw();
    expect(wt.wtTable.getCoords($table.find('tbody tr:first td:first')[0])).toEqual([0, 0]);
  });

  it("scroll horizontal should scroll to last row if given number bigger than totalRows", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 100
    });
    wt.draw().scrollHorizontal(999).draw();
    expect(wt.wtTable.getCoords($table.find('tbody tr:first td:last')[0])).toEqual([0, 3]);
  });

  it("scroll viewport to a cell that is visible should do nothing", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 120
    });
    wt.draw();
    var tmp = wt.getViewport();
    wt.scrollViewport([0, 1]).draw();
    expect(wt.getViewport()).toEqual(tmp);
  });

  it("scroll viewport to a cell on far left should make it visible on left edge", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 2,
      height: 200,
      width: 100
    });
    wt.draw().scrollViewport([0, 1]).draw();
    expect(wt.wtTable.getCoords($table.find('tbody tr:first td:first')[0])).toEqual([0, 1]);
  });

  it("scroll viewport to a cell on far right should make it visible on right edge", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 125
    });
    wt.draw().scrollViewport([0, 2]).draw();
    expect(wt.getViewport()).toEqual([0, 1, 8, 3]);
  });

  it("scroll viewport to a cell on far left should make it visible on left edge (with row header)", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 2,
      height: 200,
      width: 100,
      frozenColumns: [function (row) {
        return row + 1;
      }]
    });
    wt.draw().scrollViewport([0, 1]).draw();
    expect(wt.wtTable.getCoords($table.find('tbody tr:first td:first')[0])).toEqual([0, 1]);
  });

  it("scroll viewport to a cell on far right should make it visible on right edge (with row header)", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 130,
      frozenColumns: [function (row) {
        return row + 1;
      }]
    });
    wt.draw().scrollViewport([0, 2]).draw();
    expect(wt.wtTable.getCoords($table.find('tbody tr:first td:last')[0])).toEqual([0, 3]);
  });

  it("scroll viewport to a cell on far bottom should make it visible on bottom edge", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 125
    });
    wt.draw().scrollViewport([12, 0]).draw();
    expect(wt.getViewport()).toEqual([5, 0, 13, 2]);
  });

  it("scroll viewport to a cell on far top should make it visible on top edge", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 20,
      offsetColumn: 2,
      height: 200,
      width: 100
    });
    wt.draw().scrollViewport([12, 0]).draw();
    expect(wt.wtTable.getCoords($table.find('tbody tr:first td:first')[0])).toEqual([12, 0]);
  });

  it("scroll viewport to a cell that does not exist (vertically) should throw an error", function () {
    this.data.splice(20, this.data.length - 20);

    var err = 0;
    try {
      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        offsetRow: 0,
        offsetColumn: 0,
        height: 200,
        width: 100
      });
      wt.draw().scrollViewport([40, 0]).draw();
    }
    catch (e) {
      err++;
    }

    expect(err).toEqual(1);
  });

  it("scroll viewport to a cell that does not exist (horizontally) should throw an error", function () {
    var err = 0;
    try {
      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        offsetRow: 0,
        offsetColumn: 0,
        height: 200,
        width: 100
      });
      wt.draw().scrollViewport([0, 40]).draw();
    }
    catch (e) {
      err++;
    }

    expect(err).toEqual(1);
  });

  it("remove row from the last scroll page should scroll viewport a row up if needed", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 100
    });
    wt.draw().scrollViewport([getTotalRows() - 1, 0]).draw();
    var originalOffsetRow = wt.getSetting('offsetRow');
    this.data.splice(getTotalRows() - 4, 1); //remove row at index 96
    wt.draw();

    expect(originalOffsetRow).toEqual(wt.getSetting('offsetRow'));
  });

  it("should scroll to last row if smaller data source is loaded that does not have currently displayed row", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 260
    });
    wt.draw().scrollVertical(50).draw();
    this.data.splice(30, this.data.length - 30);
    wt.draw();
    expect($table.find('tbody tr').length).toBeGreaterThan(9);
  });

  it("should scroll to last column if smaller data source is loaded that does not have currently displayed column", function () {
    createDataArray(20, 100);
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      width: 260,
      height: 200
    });
    wt.draw().scrollHorizontal(50).draw();
    createDataArray(100, 30);
    wt.draw();
    expect($table.find('tbody tr:first td').length).toBeGreaterThan(3);
  });
});