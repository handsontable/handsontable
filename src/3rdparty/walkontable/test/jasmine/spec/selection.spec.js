describe('WalkontableSelection', function () {
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

  it("should add/remove class to selection when cell is clicked", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 100,
      selections: {
        current: {
          className: 'current'
        }
      },
      onCellMouseDown: function (event, coords, TD) {
        wt.selections.current.clear();
        wt.selections.current.add(coords);
        wt.draw();
      }
    });
    wt.draw();

    var $td1 = $table.find('tbody td:eq(0)');
    var $td2 = $table.find('tbody td:eq(1)');
    $td1.mousedown();
    expect($td1.hasClass('current')).toEqual(true);

    $td2.mousedown();
    expect($td1.hasClass('current')).toEqual(false);
    expect($td2.hasClass('current')).toEqual(true);
  });

  it("should not add class to selection until it is rerendered", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 100,
      selections: {
        current: {
          className: 'current'
        }
      }
    });
    wt.draw();
    wt.selections.current.add([0, 0]);

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
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 100,
      selections: {
        current: {
          border: {
            width: 1,
            color: 'red',
            style: 'solid'
          }
        }
      },
      onCellMouseDown: function (event, coords, TD) {
        wt.selections.current.clear();
        wt.selections.current.add(coords);
        wt.draw();
      }
    });
    wt.draw();

    var $td1 = $table.find('tbody tr:eq(1) td:eq(0)');
    var $td2 = $table.find('tbody tr:eq(2) td:eq(1)');
    var $top = $(wt.selections.current.border.top);
    $td1.mousedown();
    var pos1 = $top.position();
    expect(pos1.top).toBeGreaterThan(0);
    expect(pos1.left).toBe(0);

    $td2.mousedown();
    var pos2 = $top.position();
    expect(pos2.top).toBeGreaterThan(pos1.top);
    expect(pos2.left).toBeGreaterThan(pos1.left);
  });

  it("should move the selection when table is scrolled vertically", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      selections: {
        current: {
          className: 'current',
          border: {
            width: 1,
            color: 'red',
            style: 'solid'
          }
        }
      },
      onCellMouseDown: function (event, coords, TD) {
        wt.selections.current.clear();
        wt.selections.current.add(coords);
        wt.draw();
      }
    });
    wt.draw();

    var $td1 = $table.find('tbody tr:eq(2) td:eq(0)');
    $td1.mousedown();

    wt.update({
      offsetRow: 20
    });
    wt.draw();

    expect(wt.selections.current.border.bottom.style.display).toBe('none');
    expect($table.find('td.current').length).toBe(0);
  });

  it("should move the selection when table is scrolled horizontally", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      width: 100,
      selections: {
        current: {
          className: 'current',
          border: {
            width: 1,
            color: 'red',
            style: 'solid'
          }
        }
      },
      onCellMouseDown: function (event, coords, TD) {
        wt.selections.current.clear();
        wt.selections.current.add(coords);
        wt.draw();
      }
    });
    wt.draw();

    var $td1 = $table.find('tbody tr:eq(2) td:eq(0)');
    $td1.mousedown();

    wt.update({
      offsetColumn: 3
    });
    wt.draw();

    expect(wt.selections.current.border.right.style.display).toBe('none');
    expect($table.find('td.current').length).toBe(0);
  });

  it("should add a selection that is outside of the viewport", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 150,
      selections: {
        current: {
          border: {
            width: 1,
            color: 'red',
            style: 'solid'
          }
        }
      }
    });
    wt.draw();

    wt.selections.current.add([20, 0]);
    expect(wt.wtTable.getCoords($table.find('tbody tr:first td:first')[0])).toEqual([0, 0]);
  });

  it("should clear a selection that is outside of the viewport", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 150,
      selections: {
        current: {
          border: {
            width: 1,
            color: 'red',
            style: 'solid'
          }
        }
      }
    });
    wt.draw();

    wt.selections.current.add([0, 0]);
    wt.scrollVertical(10).draw();
    wt.selections.current.clear();
    expect(wt.wtTable.getCoords($table.find('tbody tr:first td:first')[0])).toEqual([10, 0]);
  });

  it("should clear a selection that has more than one cell", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 150,
      selections: {
        current: {
          border: {
            width: 1,
            color: 'red',
            style: 'solid'
          }
        }
      }
    });
    wt.draw();

    wt.selections.current.add([0, 0]);
    wt.selections.current.add([0, 1]);
    wt.selections.current.clear();

    expect(wt.selections.current.selected.length).toEqual(0);
  });

  it("should highlight cells in selected row & column", function () {
    var rowHeight = 23; //measured in real life with walkontable.css
    var height = 200;
    var potentialRowCount = Math.ceil(height / rowHeight);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 300,
      selections: {
        area: {
          highlightRowClassName: 'highlightRow',
          highlightColumnClassName: 'highlightColumn'
        }
      }
    });
    wt.draw();

    wt.selections.area.add([0, 0]);
    wt.selections.area.add([0, 1]);
    wt.draw(true);

    expect($table.find('.highlightRow').length).toEqual(2);
    expect($table.find('.highlightColumn').length).toEqual((potentialRowCount - 1) * 2);
  });

  it("should highlight cells in selected row & column, when same class is shared between 2 selection definitions", function () {
    var rowHeight = 23; //measured in real life with walkontable.css
    var height = 200;
    var potentialRowCount = Math.ceil(height / rowHeight);

    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 300,
      selections: {
        current: {
          highlightRowClassName: 'highlightRow',
          highlightColumnClassName: 'highlightColumn'
        },
        area: {
          highlightRowClassName: 'highlightRow',
          highlightColumnClassName: 'highlightColumn'
        }
      }
    });
    wt.draw();

    wt.selections.current.add([0, 0]);
    wt.draw(true);

    expect($table.find('.highlightRow').length).toEqual(3);
    expect($table.find('.highlightColumn').length).toEqual(potentialRowCount - 1);
  });

  it("should remove highlight when selection is deselected", function () {
    var wt = new Walkontable({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      offsetRow: 0,
      offsetColumn: 0,
      height: 200,
      width: 300,
      selections: {
        area: {
          highlightRowClassName: 'highlightRow',
          highlightColumnClassName: 'highlightColumn'
        }
      }
    });
    wt.draw();

    wt.selections.area.add([0, 0]);
    wt.selections.area.add([0, 1]);
    wt.draw();

    wt.selections.area.clear();
    wt.draw();

    expect($table.find('.highlightRow').length).toEqual(0);
    expect($table.find('.highlightColumn').length).toEqual(0);
  });
});