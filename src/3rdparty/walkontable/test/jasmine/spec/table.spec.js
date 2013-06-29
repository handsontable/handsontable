describe('WalkontableTable', function () {
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

  it("should create as many rows as in `height`", function () {
    var rowHeight = 23; //measured in real life with walkontable.css
    var height = 200;

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: height,
      width: 100
    });
    wt.draw();
    expect($table.find('tbody tr').length).toBe(Math.ceil(height / rowHeight));
  });

  it("should create as many rows as in `totalRows` if it is smaller than `height`", function () {
    this.data.splice(5, this.data.length - 5);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 200,
      width: 100
    });
    wt.draw();
    expect($table.find('tbody tr').length).toBe(5);
  });

  it("first row should have as many columns as in THEAD", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function (col, TH) {
        TH.innerHTML = col + 1;
      }],
      offsetRow: 0,
      height: 200,
      width: 100
    });
    wt.draw();
    expect($table.find('tbody tr:first td').length).toBe($table.find('thead th').length);
  });

  it("should use columnHeaders function to generate column headers", function () {
    var headers = ["Description", 2012, 2013, 2014, 2015];
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 200,
      width: 100,
      columnHeaders: [function (column, TH) {
        TH.innerHTML = headers[column];
      }]
    });
    wt.draw();
    expect($table.find('thead tr:first th').length).toBe(2);
    expect($table.find('thead tr:first th:last')[0].innerHTML).toBe('2012');
  });

  it("should use rowHeaders function to generate row headers", function () {
    var rowHeight = 23; //measured in real life with walkontable.css
    var height = 200;
    var potentialRowCount = Math.ceil(height / rowHeight);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: height,
      width: 120,
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();
    expect($table.find('tbody td').length).toBe(potentialRowCount * 2); //9*2=18 displayed cells
    expect($table.find('tbody th').length).toBe(potentialRowCount); //9*1=9 displayed row headers
    expect($table.find('tbody tr:first th').length).toBe(1); //only one th per row
    expect($table.find('tbody tr:first th')[0].innerHTML).toBe('1'); //this should be the first row header
  });

  it("should put a blank cell in the corner if both rowHeaders and colHeaders are set", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 200,
      width: 120,
      columnHeaders: [function (col, TH) {
        TH.innerHTML = 'Column';
      }],
      rowHeaders: [function (row, TH) {
        if (row > -1) {
          TH.innerHTML = 'Row';
        }
      }]
    });
    wt.draw();
    expect($table.find('thead tr:first th').length).toBe(3); //2 columns in THEAD
    expect($table.find('thead tr:first th:eq(0)')[0].innerHTML.replace(/&nbsp;/, '')).toBe(''); //corner row is empty (or contains only &nbsp;)
    expect($table.find('thead tr:first th:eq(1)')[0].innerHTML).toBe('Column');
    expect($table.find('tbody tr:first th:eq(0)')[0].innerHTML).toBe('Row');
  });

  it("rowHeaders and colHeaders should respect the offset", function () {
    function plusOne(i) {
      return i + 1;
    }

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 1,
      offsetColumn: 1,
      height: 200,
      width: 100,
      columnHeaders: [function (col, TH) {
        TH.innerHTML = plusOne(col);
      }],
      rowHeaders: [function (row, TH) {
        TH.innerHTML = plusOne(row);
      }]
    });
    wt.draw();
    expect($table.find('tr:eq(0) th:eq(1)')[0].innerHTML).toBe('2');
    expect($table.find('tr:eq(1) th:eq(0)')[0].innerHTML).toBe('2');
  });

  it("getCell should only return cells from visible rows", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 10,
      offsetColumn: 0,
      height: 200,
      width: 100
    });
    wt.draw();

    var $td1 = $table.find('tbody tr:first td:first');
    var $td2 = $table.find('tbody tr:last td:first');
    expect(wt.wtTable.getCell([9, 0])).toBe(-1); //exit code
    expect(wt.wtTable.getCell([10, 0])).toBe($td1[0]);
    expect(wt.wtTable.getCell([18, 0])).toBe($td2[0]);
    expect(wt.wtTable.getCell([19, 0])).toBe(-2); //exit code
    expect(wt.wtTable.getCell([20, 0])).toBe(-2); //exit code
  });

  it("getCell should only return cells from visible columns", function () {
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
    wt.draw();

    wt.update('offsetColumn', 1).draw();

    var $td1 = $table.find('tbody tr:eq(0) td:eq(0)');
    var $td2 = $table.find('tbody tr:eq(0) td:eq(1)');
    expect(wt.wtTable.getCell([0, 0])).toBe(-3); //exit code
    expect(wt.wtTable.getCell([0, 1])).toBe($td1[0]);
    expect(wt.wtTable.getCell([0, 2])).toBe($td2[0]);
    expect(wt.wtTable.getCell([0, 3])).toBe(-4); //exit code
  });

  it("getCell should only return cells from visible columns (with row header)", function () {
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
      width: 130,
      rowHeaders: [function (row, TH) {
        TH.innerHTML = plusOne(row);
      }]
    });
    wt.draw();

    wt.update('offsetColumn', 1).draw();

    var $td1 = $table.find('tbody tr:first td:eq(0)');
    var $td2 = $table.find('tbody tr:first td:eq(1)');
    expect(wt.wtTable.getCell([0, 0])).toBe(-3); //exit code
    expect(wt.wtTable.getCell([0, 1])).toBe($td1[0]);
    expect(wt.wtTable.getCell([0, 2])).toBe($td2[0]);
    expect(wt.wtTable.getCell([0, 3])).toBe(-4); //exit code
  });

  it("getCoords should return coords of TD", function () {
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
    wt.draw();

    wt.update({
      offsetRow: 1,
      offsetColumn: 1
    }).draw();

    var $td2 = $table.find('tbody tr:eq(1) td:eq(1)');
    expect(wt.wtTable.getCoords($td2[0])).toEqual([2, 2]);
  });

  it("getCoords should return coords of TD (with row header)", function () {
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
      rowHeaders: [function (row, TH) {
        TH.innerHTML = plusOne(row);
      }]
    });
    wt.draw();

    wt.update({
      offsetRow: 1,
      offsetColumn: 1
    }).draw();

    var $td2 = $table.find('tbody tr:eq(1) td:eq(0)');
    expect(wt.wtTable.getCoords($td2[0])).toEqual([2, 1]);
  });

  it("should use custom cell renderer if provided", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 200,
      width: 100,
      cellRenderer: function (row, column, TD) {
        var cellData = getData(row, column);
        if (cellData !== void 0) {
          TD.innerHTML = cellData;
        }
        else {
          TD.innerHTML = '';
        }
        TD.className = '';
        TD.style.backgroundColor = 'yellow';
      }
    });
    wt.draw();
    expect($table.find('td:first')[0].style.backgroundColor).toBe('yellow');
  });

  it("should reset cell style when table is scrolled horizontally", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 200,
      width: 100,
      cellRenderer: function (row, column, TD) {
        var cellData = getData(row, column);
        if (cellData !== void 0) {
          TD.innerHTML = cellData + column;
        }
        else {
          TD.innerHTML = '';
        }
        TD.className = '';
        if (column === 0) {
          TD.style.backgroundColor = 'yellow';
        }
      }
    });
    wt.draw();
    expect($table.find('td:first')[0].style.backgroundColor).toBe('yellow');
    wt.scrollViewport([0, 2]).draw();
    expect($table.find('td:first')[0].style.backgroundColor).not.toBe('yellow');
  });

  it("should remove rows if they were removed in data source", function () {
    this.data.splice(8, this.data.length - 8); //second param is required by IE8

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 200,
      width: 100
    });
    wt.draw();
    expect($table.find('tbody tr').length).toBe(8);

    this.data.splice(7, this.data.length - 7); //second param is required by IE8
    wt.draw();
    expect($table.find('tbody tr').length).toBe(7);
  });

  it("should add columns when width is increased", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 200,
      width: 100
    });
    wt.draw();
    expect($table.find('tbody tr:first td').length).toBe(2);

    wt.update('width', 150).draw();
    expect($table.find('tbody tr:first td').length).toBe(3);
  });

  it("should remove columns when width is decreased", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 200,
      width: 150
    });
    wt.draw();
    expect($table.find('tbody tr:first td').length).toBe(3);

    wt.update('width', 100).draw();
    expect($table.find('tbody tr:first td').length).toBe(2);
  });

  it("should remove columns when width is decreased (with column header)", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 200,
      width: 150,
      columnHeaders: [function (col, TH) {
        TH.innerHTML = col + 1;
      }]
    });
    wt.draw();
    expect($table.find('thead tr:first th').length).toBe(3);
    expect($table.find('tbody tr:first td').length).toBe(3);

    wt.update('width', 100).draw();
    expect($table.find('thead tr:first th').length).toBe(2);
    expect($table.find('tbody tr:first td').length).toBe(2);
  });

  it("should render all rows if height is null", function () {
    this.data.splice(20, this.data.length - 20); //second param is required by IE8

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      width: 150,
      offsetRow: 0,
      offsetColumn: 0
    });
    wt.draw();
    expect($table.find('tbody tr').length).toBe(20);
  });

  it("should render all columns if width is null", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      height: 200,
      offsetRow: 0,
      offsetColumn: 0,
      columnHeaders: [function (col, TH) {
        TH.innerHTML = col + 1;
      }]
    });
    wt.draw();
    expect($table.find('thead tr:first').children().length).toBe(4);
    expect($table.find('tbody tr:first').children().length).toBe(4);
  });

  it("should render all columns if width is null (with row header)", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      height: 200,
      offsetRow: 0,
      offsetColumn: 0,
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function (col, TH) {
        TH.innerHTML = col + 1;
      }]
    });
    wt.draw();
    expect($table.find('thead tr:first').children().length).toBe(5);
    expect($table.find('tbody tr:first').children().length).toBe(5);
  });

  it("row header column should have 'rowHeader' class", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      height: 200,
      offsetRow: 0,
      offsetColumn: 0,
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function (col, TH) {
        TH.innerHTML = col + 1;
      }]
    });
    wt.draw();
    expect($table.find('col:first').hasClass('rowHeader')).toBe(true);
  });

  it("should use column width function to get column width", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      height: 200,
      offsetRow: 0,
      offsetColumn: 0,
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function (col, TH) {
        TH.innerHTML = col + 1;
      }],
      columnWidth: function (column) {
        return (column + 1) * 50
      }
    });
    wt.draw();
    expect($table.find('tbody tr:first td:eq(0)').outerWidth()).toBe(50);
    expect($table.find('tbody tr:first td:eq(1)').outerWidth()).toBe(100);
    expect($table.find('tbody tr:first td:eq(2)').outerWidth()).toBe(150);
    expect($table.find('tbody tr:first td:eq(3)').outerWidth()).toBe(200);
  });

  it("should use column width array to get column width", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      height: 200,
      offsetRow: 0,
      offsetColumn: 0,
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function (col, TH) {
        TH.innerHTML = col + 1;
      }],
      columnWidth: [50, 100, 150, 200]
    });
    wt.draw();
    expect($table.find('tbody tr:first td:eq(0)').outerWidth()).toBe(50);
    expect($table.find('tbody tr:first td:eq(1)').outerWidth()).toBe(100);
    expect($table.find('tbody tr:first td:eq(2)').outerWidth()).toBe(150);
    expect($table.find('tbody tr:first td:eq(3)').outerWidth()).toBe(200);
  });

  it("should use column width integer to get column width", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      height: 200,
      offsetRow: 0,
      offsetColumn: 0,
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function (col, TH) {
        TH.innerHTML = col + 1;
      }],
      columnWidth: 100
    });
    wt.draw();
    expect($table.find('tbody tr:first td:eq(0)').outerWidth()).toBe(100);
    expect($table.find('tbody tr:first td:eq(1)').outerWidth()).toBe(100);
    expect($table.find('tbody tr:first td:eq(2)').outerWidth()).toBe(100);
    expect($table.find('tbody tr:first td:eq(3)').outerWidth()).toBe(100);
  });

  it("should use column width also when there are no rows", function () {
    this.data.length = 0;

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: 4,
      height: 200,
      offsetRow: 0,
      offsetColumn: 0,
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function (col, TH) {
        TH.innerHTML = col + 1;
      }],
      columnWidth: 100
    });
    wt.draw();
    //start from eq(1) because eq(0) is corner header
    expect($table.find('thead tr:first th:eq(1)').outerWidth()).toBe(100);
    expect($table.find('thead tr:first th:eq(2)').outerWidth()).toBe(100);
    expect($table.find('thead tr:first th:eq(3)').outerWidth()).toBe(100);
    expect($table.find('thead tr:first th:eq(4)').outerWidth()).toBe(100);
  });

  it("should not render a cell that is outside of the viewport horizontally", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      width: 190,
      height: 100,
      offsetRow: 0,
      offsetColumn: 0,
      columnWidth: 100
    });
    wt.draw();
    $table.find('tbody td').html('');
    wt.draw();
    expect($table.find('tbody tr:first td').length).toBe(2);
    expect($table.find('tbody tr:first td:eq(1)').html()).not.toBe('');
  });

  it("should not render a cell that is outside of the viewport, when width (height) is not dividable by 50 (20)", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      width: 191,
      height: 101,
      offsetRow: 0,
      offsetColumn: 0,
      columnWidth: 100
    });
    wt.draw();
    $table.find('tbody td').html('');
    wt.draw();
    expect($table.find('tbody tr:first td').length).toBe(2); //there are more columns though there won't be rendered
    expect($table.find('tbody tr:first td:eq(1)').html()).not.toBe('');
  });

  it("should not render a cell when selectionsOnly == true", function () {
    var count = 0
      , wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        width: 200,
        height: 100,
        offsetRow: 0,
        offsetColumn: 0,
        columnWidth: 100,
        cellRenderer: function (row, column, TD) {
          count++;
          return wt.wtSettings.defaults.cellRenderer(row, column, TD);
        }
      });
    wt.draw();
    var oldCount = count;
    wt.draw(true);
    expect(count).toBe(oldCount);
  });

  it("should ignore selectionsOnly == true when grid was scrolled", function () {
    var count = 0
      , wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        width: 200,
        height: 100,
        offsetRow: 0,
        offsetColumn: 0,
        columnWidth: 100,
        cellRenderer: function (row, column, TD) {
          count++;
          return wt.wtSettings.defaults.cellRenderer(row, column, TD);
        }
      });
    wt.draw();
    var oldCount = count;
    wt.scrollVertical(1);
    wt.draw(true);
    expect(count).toBeGreaterThan(oldCount);
  });

  /**
   * stretchH
   */
  it("should strech all visible columns when stretchH equals 'all'", function () {
    createDataArray(20, 2);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      width: 301,
      height: 200,
      scrollH: 'scroll',
      scrollV: 'scroll',
      stretchH: 'all',
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();

    var wtHider = $table.parents('.wtHider');
    expect(wtHider.outerWidth()).toBe(getTableWidth($table));
    expect(wtHider.find('col:eq(1)').width()).toBe(wtHider.find('col:eq(2)').width() - 1); //first is 106, last is 107 due to remaining part
  });

  it("should strech all visible columns when stretchH equals 'all' (when rows are of variable height)", function () {
    createDataArray(20, 2);

    for(var i= 0, ilen=this.data.length; i<ilen; i++) {
      if(i % 2) {
        this.data[i][0] += " this is a cell that contains a lot of text, which will make it multi-line"
      }
    }

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      width: 301,
      height: 200,
      scrollH: 'scroll',
      scrollV: 'scroll',
      stretchH: 'all'
    });
    wt.draw();

    var wtHider = $table.parents('.wtHider');
    expect(wtHider.find('col:eq(0)').width()).toBe(145);
    expect(wtHider.find('col:eq(1)').width()).toBe(146); //+1 more because of the remaining part
    expect(wtHider.find('tr').length).toBe(4); //4 rows should be rendered
  });

  it("should strech last visible column when stretchH equals 'last'", function () {
    createDataArray(20, 2);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      width: 300,
      height: 200,
      scrollH: 'scroll',
      scrollV: 'scroll',
      stretchH: 'last',
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();

    var wtHider = $table.parents('.wtHider');
    expect(wtHider.outerWidth()).toBe(getTableWidth($table));
    expect(wtHider.find('col:eq(1)').width()).toBeLessThan(wtHider.find('col:eq(2)').width());
  });

  it("should strech last visible column when stretchH equals 'last' (and no vertical scroll)", function () {
    createDataArray(2, 2);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      width: 300,
      height: 200,
      scrollH: 'auto',
      scrollV: 'auto',
      stretchH: 'last',
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();

    var wtHider = $table.parents('.wtHider');
    expect(wtHider.outerWidth()).toBe(getTableWidth($table));
    expect(wtHider.find('col:eq(1)').width()).toBeLessThan(wtHider.find('col:eq(2)').width());
  });

  it("should not strech when stretchH equals 'none'", function () {
    createDataArray(20, 2);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      width: 300,
      height: 200,
      scrollH: 'scroll',
      scrollV: 'scroll',
      stretchH: 'none',
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();

    var wtHider = $table.parents('.wtHider');
    expect(wtHider.width()).toBeGreaterThan(getTableWidth($table));
    expect(wtHider.find('col:eq(1)').width()).toBe(wtHider.find('col:eq(2)').width());
  });

  it("should strech last visible column when stretchH equals 'hybrid', but only if horizontal scroll is visible", function () {
    createDataArray(2, 2);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      width: 311,
      height: 200,
      scrollH: 'auto',
      scrollV: 'auto',
      stretchH: 'hybrid',
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }]
    });
    wt.draw();

    var wtHider = $table.parents('.wtHider');
    expect(wtHider.outerWidth()).toBeGreaterThan(getTableWidth($table));
    expect(wtHider.find('tr:first td:last').width()).toEqual(wtHider.find('tr:first td:last').prev().width());

    createDataArray(2, 20);
    wt.scrollHorizontal(40);
    wt.draw();
    expect(wtHider.outerWidth()).toEqual(getTableWidth($table));
    expect(wtHider.find('tr:first td:last').width()).toBeGreaterThan(wtHider.find('tr:first td:last').prev().width());

    createDataArray(2, 4);
    wt.draw();
    expect(wtHider.outerWidth()).toBeGreaterThan(getTableWidth($table));
    expect(wtHider.find('tr:first td:last').width()).toEqual(wtHider.find('tr:first td:last').prev().width());
  });

  describe('isLastRowFullyVisible', function () {
    it('should be false because it is only partially visible', function () {
      createDataArray(8, 4);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        width: 185,
        height: 185,
        scrollH: 'auto',
        scrollV: 'auto',
        stretchH: 'hybrid'
      });
      wt.draw();

      expect(wt.wtTable.isLastRowFullyVisible()).toEqual(false);
    });

    it('should be true because it is fully visible', function () {
      createDataArray(8, 4);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        width: 185,
        height: 185,
        scrollH: 'auto',
        scrollV: 'auto',
        stretchH: 'hybrid'
      });
      wt.draw();
      wt.scrollVertical(1);
      wt.draw();

      expect(wt.wtTable.isLastRowFullyVisible()).toEqual(true);
    });
  });

  describe('isLastColumnFullyVisible', function () {
    it('should be false because it is only partially visible', function () {
      createDataArray(18, 4);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        width: 209,
        height: 185,
        scrollH: 'auto',
        scrollV: 'auto',
        stretchH: 'hybrid'
      });
      wt.draw();

      expect(wt.wtTable.isLastColumnFullyVisible()).toEqual(false); //few pixels are obstacled by scrollbar
    });

    it('should be true because it is fully visible', function () {
      createDataArray(18, 4);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        width: 205,
        height: 185,
        scrollH: 'auto',
        scrollV: 'auto',
        stretchH: 'hybrid'
      });
      wt.draw();
      wt.scrollHorizontal(1);
      wt.draw();

      expect(wt.wtTable.isLastColumnFullyVisible()).toEqual(true);
    });
  });
});