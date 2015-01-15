describe('WalkontableSelection', function () {
  var $table
    , $container
    , debug = false;

  beforeEach(function () {
    $container = $('<div></div>').css({'overflow': 'auto'});
    $container.width(100).height(200);
    $table = $('<table></table>'); //create a table that is not attached to document
    $container.append($table).appendTo('body');
    createDataArray();
  });

  afterEach(function () {
    if (!debug) {
      $('.wtHolder').remove();
    }
    $container.remove();
  });

  it("should add/remove class to selection when cell is clicked", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: [
        new WalkontableSelection({
          className: 'current'
        })
      ],
      onCellMouseDown: function (event, coords, TD) {
        wt.selections.current.clear();
        wt.selections.current.add(coords);
        wt.draw();
      }
    });
    shimSelectionProperties(wt);
    wt.draw();

    var $td1 = $table.find('tbody td:eq(0)');
    var $td2 = $table.find('tbody td:eq(1)');
    $td1.simulate('mousedown');
    expect($td1.hasClass('current')).toEqual(true);

    $td2.simulate('mousedown');
    expect($td1.hasClass('current')).toEqual(false);
    expect($td2.hasClass('current')).toEqual(true);
  });

  it("should add class to selection on all overlays", function () {
    $container.width(300).height(300);

    this.data = Handsontable.helper.createSpreadsheetData(10, 10);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: [
        new WalkontableSelection({
          className: 'current'
        }),
        new WalkontableSelection({
          className: 'area'
        })
      ],
      fixedColumnsLeft: 2,
      fixedRowsTop: 2
    });
    shimSelectionProperties(wt);

    wt.selections.area.add(new WalkontableCellCoords(1, 1));
    wt.selections.area.add(new WalkontableCellCoords(1, 2));
    wt.selections.area.add(new WalkontableCellCoords(2, 1));
    wt.selections.area.add(new WalkontableCellCoords(2, 2));

    wt.draw();

    var tds = $container.find('td:contains(B2), td:contains(B3), td:contains(C2), td:contains(C3)');
    expect(tds.length).toBeGreaterThan(4);
    for (var i = 0, ilen = tds.length; i < ilen; i++) {
      expect(tds[i].className).toContain("area");
    }
  });

  it("should not add class to selection until it is rerendered", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: [
        new WalkontableSelection({
          className: 'current'
        })
      ]
    });
    shimSelectionProperties(wt);
    wt.draw();
    wt.selections.current.add(new WalkontableCellCoords(0, 0));

    var $td1 = $table.find('tbody td:eq(0)');
    expect($td1.hasClass('current')).toEqual(false);

    wt.draw();
    expect($td1.hasClass('current')).toEqual(true);
  });

  it("should add/remove border to selection when cell is clicked", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: [
        new WalkontableSelection({
          border: {
            width: 1,
            color: 'red',
            style: 'solid'
          }
        })
      ],
      onCellMouseDown: function (event, coords, TD) {
        wt.selections.current.clear();
        wt.selections.current.add(coords);
        wt.draw();
      }
    });
    shimSelectionProperties(wt);
    wt.draw();

    var $td1 = $table.find('tbody tr:eq(1) td:eq(0)');
    var $td2 = $table.find('tbody tr:eq(2) td:eq(1)');
    var $top = $(wt.selections.current.getBorder(wt).top); //cheat... get border for ht_master
    $td1.simulate('mousedown');
    var pos1 = $top.position();
    expect(pos1.top).toBeGreaterThan(0);
    expect(pos1.left).toBe(0);

    $td2.simulate('mousedown');
    var pos2 = $top.position();
    expect(pos2.top).toBeGreaterThan(pos1.top);
    expect(pos2.left).toBeGreaterThan(pos1.left);
  });

  it("should add a selection that is outside of the viewport", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: [
        new WalkontableSelection({
          border: {
            width: 1,
            color: 'red',
            style: 'solid'
          }
        })
      ]
    });
    shimSelectionProperties(wt);
    wt.draw();

    wt.selections.current.add([20, 0]);
    expect(wt.wtTable.getCoords($table.find('tbody tr:first td:first')[0])).toEqual(new WalkontableCellCoords(0, 0));
  });

  it("should not scroll the viewport after selection is cleared", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: [
        new WalkontableSelection({
          border: {
            width: 1,
            color: 'red',
            style: 'solid'
          }
        })
      ]
    });
    shimSelectionProperties(wt);
    wt.draw();

    wt.selections.current.add(new WalkontableCellCoords(0, 0));
    wt.draw();
    expect(wt.wtTable.getFirstVisibleRow()).toEqual(0);
    wt.scrollVertical(10).draw();
    expect(wt.wtTable.getFirstVisibleRow()).toEqual(10);
    expect(wt.wtTable.getLastVisibleRow()).toEqual(17);
    wt.selections.current.clear();
    expect(wt.wtTable.getFirstVisibleRow()).toEqual(10);
    expect(wt.wtTable.getLastVisibleRow()).toEqual(17);
  });

  it("should clear a selection that has more than one cell", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: [
        new WalkontableSelection({
          border: {
            width: 1,
            color: 'red',
            style: 'solid'
          }
        })
      ]
    });
    shimSelectionProperties(wt);
    wt.draw();

    wt.selections.current.add(new WalkontableCellCoords(0, 0));
    wt.selections.current.add(new WalkontableCellCoords(0, 1));
    wt.selections.current.clear();

    expect(wt.selections.current.cellRange).toEqual(null);
  });

  it("should highlight cells in selected row & column", function () {
    $container.width(300);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: [
        new WalkontableSelection({
          highlightRowClassName: 'highlightRow',
          highlightColumnClassName: 'highlightColumn'
        })
      ]
    });
    shimSelectionProperties(wt);
    wt.draw();

    wt.selections.current.add(new WalkontableCellCoords(0, 0));
    wt.selections.current.add(new WalkontableCellCoords(0, 1));
    wt.draw(true);

    expect($table.find('.highlightRow').length).toEqual(2);
    expect($table.find('.highlightColumn').length).toEqual(wt.wtTable.getRenderedRowsCount() * 2 - 2);
  });

  it("should highlight cells in selected row & column, when same class is shared between 2 selection definitions", function () {
    $container.width(300);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: [
        new WalkontableSelection({
          highlightRowClassName: 'highlightRow',
          highlightColumnClassName: 'highlightColumn'
        }),
        new WalkontableSelection({
          highlightRowClassName: 'highlightRow',
          highlightColumnClassName: 'highlightColumn'
        })
      ]
    });
    shimSelectionProperties(wt);
    wt.draw();

    wt.selections.current.add(new WalkontableCellCoords(0, 0));
    wt.draw(true);

    expect($table.find('.highlightRow').length).toEqual(3);
    expect($table.find('.highlightColumn').length).toEqual(wt.wtTable.getRenderedRowsCount() - 1);
  });

  it("should remove highlight when selection is deselected", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: [
        new WalkontableSelection({
          highlightRowClassName: 'highlightRow',
          highlightColumnClassName: 'highlightColumn'
        })
      ]
    });
    shimSelectionProperties(wt);
    wt.draw();

    wt.selections.current.add(new WalkontableCellCoords(0, 0));
    wt.selections.current.add(new WalkontableCellCoords(0, 1));
    wt.draw();

    wt.selections.current.clear();
    wt.draw();

    expect($table.find('.highlightRow').length).toEqual(0);
    expect($table.find('.highlightColumn').length).toEqual(0);
  });

  it("should add/remove appropriate class to the row/column headers of selected cells", function() {
    $container.width(300);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function (row, TH) {
        TH.innerHTML = row + 1;
      }],
      selections: [
        new WalkontableSelection({
          highlightRowClassName: 'highlightRow',
          highlightColumnClassName: 'highlightColumn'
        })
      ]
    });
    shimSelectionProperties(wt);
    wt.draw();

    wt.selections.current.add(new WalkontableCellCoords(1, 1));
    wt.selections.current.add(new WalkontableCellCoords(2, 2));
    wt.draw();

    // left side:
    // -2 -> because one row is partially visible

    // right side:
    // *2 -> because there are 2 columns selected
    // +2 -> because there are the headers
    // -4 -> because 4 cells are selected = there are overlapping highlightRow class
    expect($table.find('.highlightRow').length).toEqual(wt.wtViewport.columnsVisibleCalculator.count * 2 + 2 - 4);
    expect($table.find('.highlightColumn').length - 2).toEqual(wt.wtViewport.rowsVisibleCalculator.count * 2 + 2 - 4);
    expect($table.find('.highlightColumn').length).toEqual(14);
    expect(getTableTopClone().find('.highlightColumn').length).toEqual(2);
    expect(getTableTopClone().find('.highlightRow').length).toEqual(0);
    expect(getTableLeftClone().find('.highlightColumn').length).toEqual(0);
    expect(getTableLeftClone().find('.highlightRow').length).toEqual(2);

    var $colHeaders = $table.find("thead tr:first-child th"),
        $rowHeaders = $table.find("tbody tr th:first-child");

    expect($colHeaders.eq(2).hasClass('highlightColumn')).toBe(true);
    expect($colHeaders.eq(3).hasClass('highlightColumn')).toBe(true);

    expect($rowHeaders.eq(1).hasClass('highlightRow')).toBe(true);
    expect($rowHeaders.eq(2).hasClass('highlightRow')).toBe(true);

    wt.selections.current.clear();
    wt.draw();

    expect($table.find('.highlightRow').length).toEqual(0);
    expect($table.find('.highlightColumn').length).toEqual(0);
    expect(getTableTopClone().find('.highlightColumn').length).toEqual(0);
    expect(getTableTopClone().find('.highlightRow').length).toEqual(0);
    expect(getTableLeftClone().find('.highlightColumn').length).toEqual(0);
    expect(getTableLeftClone().find('.highlightRow').length).toEqual(0);
  });

  describe("replace", function() {
    it("should replace range from property and return true", function() {
      var wt = new Walkontable({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        selections: [
          new WalkontableSelection({
            border: {
              width: 1,
              color: 'red',
              style: 'solid'
            }
          })
        ]
      });
      shimSelectionProperties(wt);
      wt.selections.current.add(new WalkontableCellCoords(1, 1));
      wt.selections.current.add(new WalkontableCellCoords(3, 3));
      var result = wt.selections.current.replace(new WalkontableCellCoords(3, 3), new WalkontableCellCoords(4, 4));
      expect(result).toBe(true);
      expect(wt.selections.current.getCorners()).toEqual([1, 1, 4, 4]);
    });
  });
});
