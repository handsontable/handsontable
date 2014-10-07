describe('WalkontableTable', function () {
  var $table
    , debug = false;

  beforeEach(function () {
    $container = $('<div></div>').css({'overflow': 'auto'});
    $container.width(100).height(201);
    $table = $('<table></table>'); //create a table that is not attached to document
    $container.append($table).appendTo('body');
    createDataArray();
  });

  afterEach(function () {
    if (!debug) {
      $('.wtHolder').remove();
    }

    $container.remove()
  });

  it("should create as many rows as in `height` + maxOuts", function () {
    var rowHeight = 23; //measured in real life with walkontable.css

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 201,
      width: 100
    });
    wt.draw();
    var height = $container[0].clientHeight;
    expect($table.find('tbody tr').length).toBe(Math.ceil(height / rowHeight) + wt.wtTable.rowStrategy.maxOuts);
  });

  it("should create as many rows as in `totalRows` if it is smaller than `height`", function () {
    this.data.splice(5, this.data.length - 5);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 201,
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
      height: 201,
      width: 100
    });
    wt.draw();
    expect($table.find('tbody tr:first td').length).toBe($table.find('thead th').length);
  });

  it("should use columnHeaders function to generate column headers", function () {
    var headers = ["Description", 2012, 2013, 2014];
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 201,
      width: 100,
      columnHeaders: [function (column, TH) {
        TH.innerHTML = headers[column];
      }]
    });
    wt.draw();
    expect($table.find('thead tr:first th').length).toBe(headers.length);
    expect($table.find('thead tr:first th').text()).toEqual(headers.join(''));
  });

  it("should use rowHeaders function to generate row headers", function () {
    var rowHeight = 23; //measured in real life with walkontable.css

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 201,
      width: 120,
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }]
    });

    wt.draw();
    var height = $container[0].clientHeight;
    var potentialRowCount = Math.ceil(height / rowHeight) + wt.wtTable.getRowStrategy().maxOuts;
    expect($table.find('tbody td').length).toBe(potentialRowCount * wt.wtTable.getColumnStrategy().cellCount); //displayed cells
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
      height: 201,
      width: 120,
      columnHeaders: [function (col, TH) {
        if( col > - 1) {
          TH.innerHTML = 'Column';
        }
      }],
      rowHeaders: [function (row, TH) {
        if (row > -1) {
          TH.innerHTML = 'Row';
        }
      }]
    });
    wt.draw();
    expect($table.find('thead tr:first th').length).toBe(wt.wtTable.getColumnStrategy().cellCount + 1); //4 columns in THEAD + 1 empty cell in the corner
    expect($table.find('thead tr:first th:eq(0)')[0].innerHTML.replace(/&nbsp;/, '')).toBe(''); //corner row is empty (or contains only &nbsp;)
    expect($table.find('thead tr:first th:eq(1)')[0].innerHTML).toBe('Column');
    expect($table.find('tbody tr:first th:eq(0)')[0].innerHTML).toBe('Row');
  });

  it("getCell should only return cells from visible rows", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 201,
      width: 100
    });
    wt.draw();

    expect(wt.wtTable.getCell(new WalkontableCellCoords(7, 0)) instanceof HTMLElement).toBe(true);
    expect($table.find('tr:eq(10) td:first-child').text()).toEqual(this.data[10][0].toString())
    expect(wt.wtTable.getCell(new WalkontableCellCoords(10, 0))).toBe(-2); //exit code
    expect(wt.wtTable.getCell(new WalkontableCellCoords(20, 0))).toBe(-2); //exit code
  });

  it("getCoords should return coords of TD", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 201,
      width: 100
    });
    wt.draw();

    var $td2 = $table.find('tbody tr:eq(1) td:eq(1)');
    expect(wt.wtTable.getCoords($td2[0])).toEqual(new WalkontableCellCoords(1, 1));
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
      height: 201,
      width: 100,
      rowHeaders: [function (row, TH) {
        TH.innerHTML = plusOne(row);
      }]
    });
    wt.draw();

    var $td2 = $table.find('tbody tr:eq(1) td:eq(1)');
    expect(wt.wtTable.getCoords($td2[0])).toEqual(new WalkontableCellCoords(1, 1));
  });

  it("should use custom cell renderer if provided", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 201,
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

  it("should remove rows if they were removed in data source", function () {
    this.data.splice(8, this.data.length - 8); //second param is required by IE8

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      height: 201,
      width: 100
    });
    wt.draw();
    expect($table.find('tbody tr').length).toBe(8);

    this.data.splice(7, this.data.length - 7); //second param is required by IE8
    wt.draw();
    expect($table.find('tbody tr').length).toBe(7);
  });

  it("should render all columns if width is null", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      height: 201,
      offsetRow: 0,
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
      height: 201,
      offsetRow: 0,
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
      height: 201,
      offsetRow: 0,
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
      height: 201,
      offsetRow: 0,
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
      height: 201,
      offsetRow: 0,
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function (col, TH) {
        TH.innerHTML = col + 1;
      }],
      columnWidth: [50, 100, 150, 201]
    });
    wt.draw();
    expect($table.find('tbody tr:first td:eq(0)').outerWidth()).toBe(50);
    expect($table.find('tbody tr:first td:eq(1)').outerWidth()).toBe(100);
    expect($table.find('tbody tr:first td:eq(2)').outerWidth()).toBe(150);
    expect($table.find('tbody tr:first td:eq(3)').outerWidth()).toBe(201);
  });

  it("should use column width integer to get column width", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      height: 201,
      offsetRow: 0,
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
      height: 201,
      offsetRow: 0,
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

  it("should render a cell that is outside of the viewport horizontally", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      width: 190,
      height: 100,
      offsetRow: 0,
      columnWidth: 100
    });
    wt.draw();
    $table.find('tbody td').html('');
    wt.draw();
    expect($table.find('tbody tr:first td').length).toBe(4);
  });

  it("should not render a cell when selectionsOnly == true", function () {
    var count = 0
      , wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        width: 201,
        height: 100,
        offsetRow: 0,
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
        width: 201,
        height: 100,
        offsetRow: 0,
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

  describe("stretchH", function () {
    it("should stretch all visible columns when stretchH equals 'all'", function () {
      createDataArray(20, 2);

      $container.width(301).height(201);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        stretchH: 'all',
        rowHeaders: [function (row, TH) {
          TH.innerHTML = row + 1;
        }]
      });
      wt.draw();

      var wtHider = $table.parents('.wtHider');
      expect(wtHider.outerWidth()).toBe($table[0].clientWidth);
      expect(wtHider.find('col:eq(2)').width() - wtHider.find('col:eq(1)').width()).toBeInArray([0, 1]); //fix differences between Mac and Linux PhantomJS
    });

    it("should stretch all visible columns when stretchH equals 'all' and window is resized", function () {
      createDataArray(20, 2);

      $container.width(301).height(201);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        stretchH: 'all',
        rowHeaders: [function (row, TH) {
          TH.innerHTML = row + 1;
        }]
      });
      wt.draw();

      var wtHider = $table.parents('.wtHider');
      var initialTableWidth = wtHider.outerWidth();
      expect(initialTableWidth).toBe($table[0].clientWidth);

      $container.width(401).height(201);

      $(window).trigger('resize');

      runs(function() {
        var currentTableWidth = wtHider.outerWidth();
        expect(currentTableWidth).toBe($table[0].clientWidth);
        expect(currentTableWidth).toBeGreaterThan(initialTableWidth);
      });
    });

    it("should stretch all visible columns when stretchH equals 'all' (when rows are of variable height)", function () {
      createDataArray(20, 2);

      for(var i= 0, ilen=this.data.length; i<ilen; i++) {
        if(i % 2) {
          this.data[i][0] += " this is a cell that contains a lot of text, which will make it multi-line"
        }
      }

      $container.width(301);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        stretchH: 'all'
      });
      wt.draw();

      var expectedColWidth = (301 - wt.getSetting('scrollbarWidth')) / 2;
      expectedColWidth = Math.floor(expectedColWidth);

      var wtHider = $table.parents('.wtHider');
      expect(wtHider.find('col:eq(0)').width()).toBe(expectedColWidth);
      expect(wtHider.find('col:eq(1)').width() - expectedColWidth).toBeInArray([0, 1]); //fix differences between Mac and Linux PhantomJS
    });

    it("should stretch last visible column when stretchH equals 'last'", function () {
      createDataArray(20, 2);

      $container.width(300).height(201);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
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

    it("should stretch last visible column when stretchH equals 'last' (and no vertical scroll)", function () {
      createDataArray(2, 2);

      $container.width(300).height(201);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
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

    it("should not stretch when stretchH equals 'none'", function () {
      createDataArray(20, 2);
      $container.width(300).height(201);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
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

  });

  describe('isLastRowFullyVisible', function () {
    it('should be false because it is only partially visible', function () {
      createDataArray(8, 4);

      $container.width(185).height(185);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        width: 185,
        height: 185
      });
      wt.draw();

      expect(wt.wtTable.isLastRowFullyVisible()).toEqual(false);
    });

    it('should be true because it is fully visible', function () {
      createDataArray(8, 4);

      $container.width(185).height(185);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        width: 185,
        height: 185
      });
      wt.draw();
      wt.scrollVertical(1);

      expect(wt.wtTable.isLastRowFullyVisible()).toEqual(true);
    });
  });

  xdescribe('isLastColumnFullyVisible', function () {
    it('should be false because it is only partially visible', function () {
      createDataArray(18, 4);

      $container.width(209).height(185);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();

      expect(wt.wtTable.isLastColumnFullyVisible()).toEqual(false); //few pixels are obstacled by scrollbar
    });

    it('should be true because it is fully visible', function () {
      createDataArray(18, 4);

      $container.width(180).height(185);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();
      wt.scrollHorizontal(1);

      expect(wt.wtTable.isLastColumnFullyVisible()).toEqual(true);
    });
  });
});
