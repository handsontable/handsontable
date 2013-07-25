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
      columnHeaders: [function (col, TH) {
        TH.innerHTML = plusOne(col);
      }],
      rowHeaders: [function (row, TH) {
        TH.innerHTML = plusOne(row);
      }]
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
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
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
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
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

  it("should scroll to last row with very high rows", function () {
    createDataArray(20, 100);

    for (var i = 0, ilen = this.data.length; i < ilen; i++) {
      this.data[i][0] += '\n this \nis \na \nmultiline \ncell';
    }

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
    wt.draw().scrollVertical(Infinity).draw();
    expect($table.find('tbody tr:last td:first')[0]).toBe(wt.wtTable.getCell([this.data.length - 1, 0])); //last rendered row should be last data row
  });

  it("should scroll to last row with very high rows (respecting fixedRows)", function () {
    createDataArray(20, 100);

    for (var i = 0, ilen = this.data.length; i < ilen; i++) {
      this.data[i][0] += '\n this \nis \na \nmultiline \ncell';
    }

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      fixedRowsTop: 2,
      width: 260,
      height: 601
    });
    wt.draw().scrollVertical(Infinity).draw();
    expect($table.find('tbody tr:eq(0) td:first')[0]).toBe(wt.wtTable.getCell([0, 0])); //first rendered row should fixed row 0
    expect($table.find('tbody tr:eq(1) td:first')[0]).toBe(wt.wtTable.getCell([1, 0])); //second rendered row should fixed row 1
    expect($table.find('tbody tr:eq(2) td:first')[0]).toBe(wt.wtTable.getCell([16, 0])); //third rendered row should fixed row 1
    expect($table.find('tbody tr:last td:first')[0]).toBe(wt.wtTable.getCell([this.data.length - 1, 0])); //last rendered row should be last data row
  });

  it("should scroll to last column with very wide cells", function () {
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

  describe('scrollViewport - horizontally', function () {
    it("should scroll to last column on the right", function () {
      this.data = createSpreadsheetData(10, 10);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 50,
        offsetRow: 0,
        offsetColumn: 0,
        width: 200,
        height: 200
      });
      wt.draw().scrollViewport([0, 9]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(3);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('H0');
      expect($table.find('tbody tr:eq(0) td:eq(1)').html()).toBe('I0');
      expect($table.find('tbody tr:eq(0) td:eq(2)').html()).toBe('J0');
    });

    it("should not scroll back to a column that is in viewport", function () {
      this.data = createSpreadsheetData(10, 10);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 50,
        offsetRow: 0,
        offsetColumn: 0,
        width: 200,
        height: 200
      });
      wt.draw().scrollViewport([0, 9]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(3);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('H0');
      expect($table.find('tbody tr:eq(0) td:eq(1)').html()).toBe('I0');
      expect($table.find('tbody tr:eq(0) td:eq(2)').html()).toBe('J0');

      wt.draw().scrollViewport([0, 9]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(3);
      expect($table.find('tbody tr:eq(0) td:eq(2)').html()).toBe('J0'); //nothing changed

      wt.draw().scrollViewport([0, 8]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(3);
      expect($table.find('tbody tr:eq(0) td:eq(2)').html()).toBe('J0'); //nothing changed

      wt.draw().scrollViewport([0, 7]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(3);
      expect($table.find('tbody tr:eq(0) td:eq(2)').html()).toBe('J0'); //nothing changed
    });

    it("should scroll back to a column that is before viewport", function () {
      this.data = createSpreadsheetData(10, 10);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 50,
        offsetRow: 0,
        offsetColumn: 0,
        width: 200,
        height: 200
      });
      wt.draw().scrollViewport([0, 9]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(3);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('H0');
      expect($table.find('tbody tr:eq(0) td:eq(1)').html()).toBe('I0');
      expect($table.find('tbody tr:eq(0) td:eq(2)').html()).toBe('J0');

      wt.draw().scrollViewport([0, 6]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(4);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('G0');
      expect($table.find('tbody tr:eq(0) td:eq(1)').html()).toBe('H0');
      expect($table.find('tbody tr:eq(0) td:eq(2)').html()).toBe('I0');
      expect($table.find('tbody tr:eq(0) td:eq(3)').html()).toBe('J0');

      wt.draw().scrollViewport([0, 8]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(4);
      expect($table.find('tbody tr:eq(0) td:eq(3)').html()).toBe('J0'); //nothing changed

      wt.draw().scrollViewport([0, 9]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(3);
      expect($table.find('tbody tr:eq(0) td:eq(2)').html()).toBe('J0'); //scrolled right
    });

    it("should scroll to a column that is after viewport", function () {
      this.data = createSpreadsheetData(10, 10);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 50,
        offsetRow: 0,
        offsetColumn: 0,
        width: 200,
        height: 200
      });
      wt.draw().scrollViewport([0, 2]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(4);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('A0');
      expect($table.find('tbody tr:eq(0) td:eq(1)').html()).toBe('B0');
      expect($table.find('tbody tr:eq(0) td:eq(2)').html()).toBe('C0');
      expect($table.find('tbody tr:eq(0) td:eq(3)').html()).toBe('D0'); //nothing changed

      wt.draw().scrollViewport([0, 3]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(4);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('B0');
      expect($table.find('tbody tr:eq(0) td:eq(1)').html()).toBe('C0');
      expect($table.find('tbody tr:eq(0) td:eq(2)').html()).toBe('D0');
      expect($table.find('tbody tr:eq(0) td:eq(3)').html()).toBe('E0'); //scrolled right
    });

    it("should scroll to a wide column that is after viewport", function () {
      this.data = createSpreadsheetData(10, 10);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: function (col) {
          if (col === 3) {
            return 100
          }
          else {
            return 50
          }
        },
        offsetRow: 0,
        offsetColumn: 0,
        width: 200,
        height: 200
      });

      wt.draw().scrollViewport([0, 3]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(3);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('C0');
      expect($table.find('tbody tr:eq(0) td:eq(1)').html()).toBe('D0');
      expect($table.find('tbody tr:eq(0) td:eq(2)').html()).toBe('E0'); //scrolled right
    });

    it("should scroll to a very wide column that is after viewport", function () {
      this.data = createSpreadsheetData(10, 10);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: function (col) {
          if (col === 3) {
            return 300
          }
          else {
            return 50
          }
        },
        offsetRow: 0,
        offsetColumn: 0,
        width: 200,
        height: 200
      });

      wt.draw().scrollViewport([0, 3]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(1);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('D0'); //scrolled right

      wt.draw().scrollViewport([0, 2]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(2);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('C0'); //scrolled left
      expect($table.find('tbody tr:eq(0) td:eq(1)').html()).toBe('D0');

      wt.draw().scrollViewport([0, 3]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(1);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('D0'); //scrolled right

      wt.draw().scrollViewport([0, 4]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(4);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('E0');
      expect($table.find('tbody tr:eq(0) td:eq(1)').html()).toBe('F0');
      expect($table.find('tbody tr:eq(0) td:eq(2)').html()).toBe('G0');
      expect($table.find('tbody tr:eq(0) td:eq(3)').html()).toBe('H0'); //scrolled right
    });

    it("should scroll to a very wide column that is after viewport (with fixedColumnsLeft)", function () {
      this.data = createSpreadsheetData(1, 10);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: function (col) {
          if (col === 3) {
            return 300
          }
          else {
            return 50
          }
        },
        offsetRow: 0,
        offsetColumn: 0,
        width: 200,
        height: 200,
        fixedColumnsLeft: 2
      });

      wt.draw().scrollViewport([0, 3]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(3);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('A0');
      expect($table.find('tbody tr:eq(0) td:eq(1)').html()).toBe('B0');
      expect($table.find('tbody tr:eq(0) td:eq(2)').html()).toBe('D0'); //scrolled right

      wt.draw().scrollViewport([0, 2]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(4);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('A0');
      expect($table.find('tbody tr:eq(0) td:eq(1)').html()).toBe('B0');
      expect($table.find('tbody tr:eq(0) td:eq(2)').html()).toBe('C0'); //scrolled left
      expect($table.find('tbody tr:eq(0) td:eq(3)').html()).toBe('D0');

      wt.draw().scrollViewport([0, 3]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(3);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('A0');
      expect($table.find('tbody tr:eq(0) td:eq(1)').html()).toBe('B0');
      expect($table.find('tbody tr:eq(0) td:eq(2)').html()).toBe('D0'); //scrolled right

      wt.draw().scrollViewport([0, 4]).draw();
      expect($table.find('tbody tr:eq(0) td').length).toBe(4);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('A0');
      expect($table.find('tbody tr:eq(0) td:eq(1)').html()).toBe('B0');
      expect($table.find('tbody tr:eq(0) td:eq(2)').html()).toBe('E0');
      expect($table.find('tbody tr:eq(0) td:eq(3)').html()).toBe('F0'); //scrolled right
    });
  });

  describe('scrollViewport - vertically', function () {

    it("should scroll to a very high row that is after viewport", function () {
      this.data = createSpreadsheetData(20, 1);

      var txt = 'Very very very very very very very very very very very very very very very very very long text.';
      this.data[4][0] = txt;

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        offsetRow: 0,
        offsetColumn: 0,
        width: 200,
        height: 200
      });

      wt.draw().scrollViewport([4, 0]).draw();
      expect($table.find('tbody tr').length).toBe(1);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe(txt); //scrolled down

      wt.draw().scrollViewport([5, 0]).draw();
      expect($table.find('tbody tr').length).toBe(9);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('A5'); //scrolled down

      wt.draw().scrollViewport([4, 0]).draw();
      expect($table.find('tbody tr').length).toBe(1);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe(txt); //scrolled up

      wt.draw().scrollViewport([3, 0]).draw();
      expect($table.find('tbody tr').length).toBe(2);
      expect($table.find('tbody tr:eq(1) td:eq(0)').html()).toBe(txt); //scrolled up
    });

    it("should scroll to a very high row that is after viewport (at the end)", function () {
      this.data = createSpreadsheetData(20, 1);

      var txt = 'Very very very very very very very very very very very very very very very very very long text.';
      this.data[19][0] = txt;

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        offsetRow: 0,
        offsetColumn: 0,
        width: 200,
        height: 200
      });

      wt.draw().scrollViewport([18, 0]).draw();
      expect($table.find('tbody tr').length).toBe(2);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('A18');
      expect($table.find('tbody tr:eq(1) td:eq(0)').html()).toBe(txt);

      wt.draw().scrollViewport([19, 0]).draw();
      expect($table.find('tbody tr').length).toBe(1);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe(txt); //scrolled down

      wt.draw().scrollViewport([18, 0]).draw();
      expect($table.find('tbody tr').length).toBe(2);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('A18'); //scrolled up
      expect($table.find('tbody tr:eq(1) td:eq(0)').html()).toBe(txt);

      wt.draw().scrollViewport([17, 0]).draw();
      expect($table.find('tbody tr').length).toBe(3);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('A17'); //scrolled up
      expect($table.find('tbody tr:eq(1) td:eq(0)').html()).toBe('A18');
      expect($table.find('tbody tr:eq(2) td:eq(0)').html()).toBe(txt);
    });
  });
});