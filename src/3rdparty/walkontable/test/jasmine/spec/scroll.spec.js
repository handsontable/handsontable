describe('WalkontableScroll', function () {
  var $table,
    $container
    , debug = false;

  beforeEach(function () {
    $container = $('<div></div>').css({'overflow': 'auto'});
    $table = $('<table></table>'); //create a table that is not attached to document
    $container.append($table).appendTo('body');
    createDataArray(100, 4);
  });

  afterEach(function () {
    if (!debug) {
      $('.wtHolder').remove();
    }

    $container.remove();
  });

  describe("scroll", function () {
    it("should scroll to last column when rowHeaders is not in use", function () {
      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
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

    it("scroll not scroll the viewport if all rows are visible", function () {
      this.data.splice(5);

      $container.height(201).width(100);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.wtTable.getVisibleRowsCount()).toEqual(5);

      wt.scrollVertical(999).draw();
      expect(wt.wtTable.getCoords($table.find('tbody tr:eq(0) td:eq(0)')[0])).toEqual(new WalkontableCellCoords(0, 0));
    });

    it("scroll horizontal should take totalColumns if it is smaller than width", function () {
      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw().scrollHorizontal(999).draw();
      expect(wt.wtTable.getCoords($table.find('tbody tr:eq(0) td:eq(0)')[0])).toEqual(new WalkontableCellCoords(0, 0));
    });

    it("scroll vertical should scroll to first row if given number smaller than 0", function () {
      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw().scrollVertical(-1).draw();
      expect(wt.wtTable.getCoords($table.find('tbody tr:first td:first')[0])).toEqual(new WalkontableCellCoords(0, 0));
    });

    it("scroll vertical should scroll to last row if given number bigger than totalRows", function () {
      this.data.splice(20, this.data.length - 20);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw().scrollVertical(999).draw();
      expect(wt.wtTable.getCoords($table.find('tbody tr:last td:first')[0])).toEqual(new WalkontableCellCoords(19, 0));
    });

    it("scroll horizontal should scroll to first row if given number smaller than 0", function () {

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw().scrollHorizontal(-1).draw();
      expect(wt.wtTable.getCoords($table.find('tbody tr:first td:first')[0])).toEqual(new WalkontableCellCoords(0, 0));
    });

    it("scroll horizontal should scroll to last row if given number bigger than totalRows", function () {
      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw().scrollHorizontal(999).draw();
      expect(wt.wtTable.getCoords($table.find('tbody tr:first td:last')[0])).toEqual(new WalkontableCellCoords(0, 3));
    });

    it("scroll viewport to a cell that is visible should do nothing", function () {

      $container.height(201).width(120);
      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();
      var tmp = wt.getViewport();
      wt.scrollViewport(new WalkontableCellCoords(0, 1)).draw();
      expect(wt.getViewport()).toEqual(tmp);
    });

    it("scroll viewport to a cell on far right should make it visible on right edge", function () {


      $container.width(125).height(201);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();
      var height = $container[0].clientHeight;
      var visibleRowCount = Math.floor(height/23);
      wt.scrollViewport(new WalkontableCellCoords(0, 2)).draw();
      expect(wt.getViewport()).toEqual([0, 1, visibleRowCount - 1, 2]);
    });

    it("scroll viewport to a cell on far left should make it visible on left edge", function () {

      $container.width(100).height(201);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();
      var height = $container[0].clientHeight;
      var visibleRowCount = Math.floor(height/23);
      wt.scrollViewport(new WalkontableCellCoords(0, 3)).draw();
      expect(wt.getViewport()).toEqual([0, 3, visibleRowCount - 1, 3]);


      wt.scrollViewport(new WalkontableCellCoords(0, 1)).draw();
      expect(wt.getViewport()).toEqual([0, 1, visibleRowCount - 1, 1]);
    });

    it("scroll viewport to a cell on far left should make it visible on left edge (with row header)", function () {
      $container.width(140).height(201);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [function (row, TH) {
          TH.innerHTML = row + 1;
        }]
      });
      wt.draw();

      var height = $container[0].clientHeight;
      var visibleRowCount = Math.floor(height/23);

      wt.scrollViewport(new WalkontableCellCoords(0, 3)).draw();
      expect(wt.getViewport()).toEqual([0, 3, visibleRowCount - 1, 3]);
      wt.scrollViewport(new WalkontableCellCoords(0, 1)).draw();
      expect(wt.wtTable.getFirstVisibleColumn()).toEqual(1);
    });

    it("scroll viewport to a cell on far right should make it visible on right edge (with row header)", function () {
      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [function (row, TH) {
          TH.innerHTML = row + 1;
        }]
      });
      wt.draw().scrollViewport(new WalkontableCellCoords(0, 2)).draw();
      expect(wt.wtTable.getCoords($table.find('tbody tr:first td:last')[0])).toEqual(new WalkontableCellCoords(0, 3));
    });

    it("scroll viewport to a cell on far bottom should make it visible on bottom edge", function () {
      $container.width(125).height(201);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();

      wt.scrollViewport(new WalkontableCellCoords(12, 0)).draw();
      expect(wt.getViewport()).toEqual([5, 0, 12, 1]);
    });

    it("scroll viewport to a cell on far top should make it visible on top edge", function () {
      $container.width(100).height(201);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();
      wt.scrollViewport(new WalkontableCellCoords(20, 0)).draw();
      wt.scrollViewport(new WalkontableCellCoords(12, 0)).draw();

      expect(wt.wtTable.getCoords($table.find('tbody tr:first td:first')[0])).toEqual(new WalkontableCellCoords(12, 0));
    });

    it("scroll viewport to a cell that does not exist (vertically) should throw an error", function () {
      this.data.splice(20, this.data.length - 20);

      expect(function () {
        $container.width(100).height(201);
        var wt = new Walkontable({
          table: $table[0],
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns
        });
        wt.draw();
        wt.scrollViewport(new WalkontableCellCoords(40, 0)).draw();
      }).toThrow()

    });

    it("scroll viewport to a cell that does not exist (horizontally) should throw an error", function () {
      expect(function () {
        $container.width(100).height(201);
        var wt = new Walkontable({
          table: $table[0],
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns
        });
        wt.draw();
        wt.scrollViewport(new WalkontableCellCoords(0, 40)).draw();
      }).toThrow()
    });

    it("remove row from the last scroll page should scroll viewport a row up if needed", function () {

      $container.width(100).height(210);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw().scrollViewport(new WalkontableCellCoords(getTotalRows() - 1, 0)).draw();

      var originalViewportStartRow = wt.getViewport()[0];

      this.data.splice(getTotalRows() - 4, 1); //remove row at index 96
      wt.draw();

      expect(originalViewportStartRow - 1).toEqual(wt.getViewport()[0]);
    });

    it("should scroll to last row if smaller data source is loaded that does not have currently displayed row", function () {
      $container.width(100).height(260);
      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();
      wt.scrollVertical(50).draw();
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
        totalColumns: getTotalColumns
      });
      wt.draw().scrollHorizontal(50).draw();
      createDataArray(100, 30);
      wt.draw();
      expect($table.find('tbody tr:first td').length).toBeGreaterThan(3);
    });

    xit("should scroll to last row with very high rows", function () {
      createDataArray(20, 100);

      for (var i = 0, ilen = this.data.length; i < ilen; i++) {
        this.data[i][0] += '\n this \nis \na \nmultiline \ncell';
      }

      $container.width(260).height(201);
      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();
      wt.scrollVertical(20).draw();
      expect($table.find('tbody tr:last td:first')[0]).toBe(wt.wtTable.getCell(new WalkontableCellCoords(this.data.length - 1, 0))); //last rendered row should be last data row
    });

    xit("should scroll to last row with very high rows (respecting fixedRows)", function () {
      createDataArray(20, 100);

      for (var i = 0, ilen = this.data.length; i < ilen; i++) {
        this.data[i][0] += '\n this \nis \na \nmultiline \ncell';
      }

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2
      });
      wt.draw().scrollVertical(Infinity).draw();
      expect($table.find('tbody tr:eq(0) td:first')[0]).toBe(wt.wtTable.getCell(new WalkontableCellCoords(0, 0))); //first rendered row should fixed row 0
      expect($table.find('tbody tr:eq(1) td:first')[0]).toBe(wt.wtTable.getCell(new WalkontableCellCoords(1, 0))); //second rendered row should fixed row 1
      expect($table.find('tbody tr:eq(2) td:first')[0]).toBe(wt.wtTable.getCell(new WalkontableCellCoords(16, 0))); //third rendered row should fixed row 1
      expect($table.find('tbody tr:last td:first')[0]).toBe(wt.wtTable.getCell(new WalkontableCellCoords(this.data.length - 1, 0))); //last rendered row should be last data row
    });

    it("should scroll to last column with very wide cells", function () {
      createDataArray(20, 100);
      $container.width(260).height(201);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw().scrollHorizontal(50).draw();
      createDataArray(100, 30);
      wt.draw();
      expect($table.find('tbody tr:first td').length).toBeGreaterThan(3);
    });

    it("should scroll the desired cell to the bottom edge even if it's located in a fixed column", function () {
      createDataArray(20, 100);
      $container.width(260).height(201);
      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsLeft: 2
      });

      wt.draw().scrollViewport(new WalkontableCellCoords(8,1)).draw();
      waits(20);
      runs(function() {
        expect(wt.wtTable.getLastVisibleRow()).toBe(8);
      });

    });

  });

  describe('scrollViewport - horizontally', function () {

    beforeEach(function () {
      $container.width(201).height(201);
    });

    it("should scroll to last column on the right", function () {
      this.data = Handsontable.helper.createSpreadsheetData(10, 10);

      $container.width(201).height(201);
      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 50
      });
      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(2);
      wt.scrollViewport(new WalkontableCellCoords(0, 9)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(9);
    });

    it("should not scroll back to a column that is in viewport", function () {
      this.data = Handsontable.helper.createSpreadsheetData(10, 10);


      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 50
      });
      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(2);
      wt.scrollViewport(new WalkontableCellCoords(0, 9)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(9);

      wt.scrollViewport(new WalkontableCellCoords(0, 9)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(9); //nothing changed

      wt.scrollViewport(new WalkontableCellCoords(0, 8)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(9); //nothing changed

      wt.scrollViewport(new WalkontableCellCoords(0, 7)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(9); //nothing changed
    });

    it("should scroll back to a column that is before viewport", function () {
      this.data = Handsontable.helper.createSpreadsheetData(10, 10);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 50
      });
      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(2);
      wt.scrollViewport(new WalkontableCellCoords(0, 9)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(9);

      wt.draw().scrollViewport(new WalkontableCellCoords(0, 3)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(5);

      wt.draw().scrollViewport(new WalkontableCellCoords(0, 4)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(5);//nothing changed

      wt.scrollViewport(new WalkontableCellCoords(0, 9)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(9);
    });

    it("should scroll to a column that is after viewport", function () {
      this.data = Handsontable.helper.createSpreadsheetData(10, 10);

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 50
      });
      wt.draw();
      wt.scrollViewport(new WalkontableCellCoords(0, 2)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(2);

      wt.draw().scrollViewport(new WalkontableCellCoords(0, 4)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(4);
    });

    it("should scroll to a wide column that is after viewport", function () {
      this.data = Handsontable.helper.createSpreadsheetData(10, 10);

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
        }
      });

      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(2);
      expect(wt.wtTable.getFirstVisibleColumn()).toEqual(0);
      wt.scrollViewport(new WalkontableCellCoords(0, 3)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(3);
      expect(wt.wtTable.getFirstVisibleColumn()).toEqual(2);
    });

    xit("should scroll to a very wide column that is after viewport", function () {
      this.data = Handsontable.helper.createSpreadsheetData(10, 10);

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
        }
      });

      wt.draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(3);
      expect(wt.wtTable.getFirstVisibleColumn()).toEqual(0);

      wt.scrollViewport(new WalkontableCellCoords(0, 3)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(3);
      expect(wt.wtTable.getFirstVisibleColumn()).toEqual(3);

      wt.scrollViewport(new WalkontableCellCoords(0, 2)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(3);
      expect(wt.wtTable.getFirstVisibleColumn()).toEqual(2);

      wt.scrollViewport(new WalkontableCellCoords(0, 3)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(3);
      expect(wt.wtTable.getFirstVisibleColumn()).toEqual(3);

      wt.scrollViewport(new WalkontableCellCoords(0, 4)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(4);
      expect(wt.wtTable.getFirstVisibleColumn()).toEqual(3);

    });

    xit("should scroll to a very wide column that is after viewport (with fixedColumnsLeft)", function () {
      this.data = Handsontable.helper.createSpreadsheetData(1, 10);

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
        fixedColumnsLeft: 2
      });

      wt.draw();
      wt.scrollViewport(new WalkontableCellCoords(0, 3)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(3);

      wt.draw().scrollViewport(new WalkontableCellCoords(0, 2)).draw();
      expect(wt.wtTable.getFirstVisibleColumn()).toBeGreaterThan(2);
      expect(wt.wtTable.getLastVisibleColumn()).toBeGreaterThan(2);


      wt.draw().scrollViewport(new WalkontableCellCoords(0, 3)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(3);

      wt.draw().scrollViewport(new WalkontableCellCoords(0, 4)).draw();
      expect(wt.wtTable.getLastVisibleColumn()).toEqual(4);
    });
  });

  describe('scrollViewport - vertically', function () {

    beforeEach(function () {
      $container.width(201).height(201);
    });

    xit("should scroll to a very high row that is after viewport", function () {
      this.data = Handsontable.helper.createSpreadsheetData(20, 1);

      var txt = 'Very very very very very very very very very very very very very very very very very long text.';
      this.data[4][0] = txt;

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      expect(wt.wtTable.getFirstVisibleRow()).toEqual(0);

      wt.scrollViewport(new WalkontableCellCoords(4, 0)).draw();
      expect(wt.wtTable.getLastVisibleRow()).toEqual(4);

      wt.draw().scrollViewport(new WalkontableCellCoords(5, 0)).draw();
      expect(wt.wtTable.getLastVisibleRow()).toEqual(5);

      wt.draw().scrollViewport(new WalkontableCellCoords(4, 0)).draw();
      expect(wt.wtTable.getFirstVisibleRow()).toEqual(4);

      wt.draw().scrollViewport(new WalkontableCellCoords(3, 0)).draw();
      expect(wt.wtTable.getFirstVisibleRow()).toEqual(3);
    });

    xit("should scroll to a very high row that is after viewport (at the end)", function () {
      this.data = Handsontable.helper.createSpreadsheetData(20, 1);

      var txt = 'Very very very very very very very very very very very very very very very very very long text.';
      this.data[19][0] = txt;

      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw().scrollViewport(new WalkontableCellCoords(18, 0)).draw();
      expect($table.find('tbody tr').length).toBe(2);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('A18');
      expect($table.find('tbody tr:eq(1) td:eq(0)').html()).toBe(txt);

      wt.draw().scrollViewport(new WalkontableCellCoords(19, 0)).draw();
      expect($table.find('tbody tr').length).toBe(1);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe(txt); //scrolled down

      wt.draw().scrollViewport(new WalkontableCellCoords(18, 0)).draw();
      expect($table.find('tbody tr').length).toBe(2);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('A18'); //scrolled up
      expect($table.find('tbody tr:eq(1) td:eq(0)').html()).toBe(txt);

      wt.draw().scrollViewport(new WalkontableCellCoords(17, 0)).draw();
      expect($table.find('tbody tr').length).toBe(3);
      expect($table.find('tbody tr:eq(0) td:eq(0)').html()).toBe('A17'); //scrolled up
      expect($table.find('tbody tr:eq(1) td:eq(0)').html()).toBe('A18');
      expect($table.find('tbody tr:eq(2) td:eq(0)').html()).toBe(txt);
    });
  });
});
