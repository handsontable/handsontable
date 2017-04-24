describe('WalkontableEvent', () => {
  var $table,
    debug = false;

  beforeEach(() => {
    $table = $('<table></table>'); // create a table that is not attached to document
    $table.appendTo('body');
    createDataArray();
  });

  afterEach(() => {
    if (!debug) {
      $('.wtHolder').remove();
    }
  });

  it('should call `onCellMouseDown` callback', () => {
    var
      myCoords = null,
      myTD = null,
      wt = new Walkontable.Core({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        onCellMouseDown(event, coords, TD) {
          myCoords = coords;
          myTD = TD;
        }
      });
    wt.draw();

    var $td = $table.find('tbody tr:eq(1) td:eq(1)');
    $td.simulate('mousedown');

    expect(myCoords).toEqual(new Walkontable.CellCoords(1, 1));
    expect(myTD).toEqual($td[0]);
  });

  it('should call `onCellMouseOver` callback', () => {
    var
      myCoords = null,
      myTD = null,
      wt = new Walkontable.Core({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        onCellMouseOver(event, coords, TD) {
          myCoords = coords;
          myTD = TD;
        }
      });
    wt.draw();

    var $td = $table.find('tbody tr:eq(1) td:eq(1)');
    $td.simulate('mouseover');

    expect(myCoords).toEqual(new Walkontable.CellCoords(1, 1));
    expect(myTD).toEqual($td[0]);
  });

  it('should call `onCellMouseOver` callback with correctly passed TD element when cell contains another table', () => {
    var fn = jasmine.createSpy();
    var wt = new Walkontable.Core({
      table: $table[0],
      data: [['<table style="width: 50px;"><tr><td class="test">TEST</td></tr></table>']],
      totalRows: 1,
      totalColumns: 1,
      onCellMouseOver: fn,
      cellRenderer(row, column, TD) {
        TD.innerHTML = wt.wtSettings.getSetting('data', row, column);
      },
    });
    wt.draw();

    var outerTD = $table.find('tbody td:not(td.test)');
    var innerTD = $table.find('tbody td.test');

    innerTD.simulate('mouseover');

    expect(fn.calls.argsFor(0)[2]).toBe(outerTD[0]);
  });

  it('should call `onCellMouseOut` callback', function () {
    var myCoords = null,
      myTD = null,
      wt = new Walkontable.Core({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        onCellMouseOut: function (event, coords, TD) {
          myCoords = coords;
          myTD = TD;
        }
      });
    wt.draw();

    var $td = $table.find('tbody tr:eq(1) td:eq(1)');
    $td.simulate('mouseover');
    $td.simulate('mouseout');

    expect(myCoords).toEqual(new Walkontable.CellCoords(1, 1));
    expect(myTD).toEqual($td[0]);
  });

  it('should call `onCellMouseOut` callback with correctly passed TD element when cell contains another table', function () {
    var fn = jasmine.createSpy();
    var wt = new Walkontable.Core({
      table: $table[0],
      data: [['<table style="width: 50px;"><tr><td class="test">TEST</td></tr></table>']],
      totalRows: 1,
      totalColumns: 1,
      onCellMouseOut: fn,
      cellRenderer: function(row, column, TD) {
        TD.innerHTML = wt.wtSettings.getSetting('data', row, column);
      },
    });
    wt.draw();

    var outerTD = $table.find('tbody td:not(td.test)');
    var innerTD = $table.find('tbody td.test');

    innerTD.simulate('mouseover');
    innerTD.simulate('mouseout');

    expect(fn.calls.argsFor(0)[2]).toBe(outerTD[0]);
  });

  it('should call `onCellDblClick` callback', function () {
    var myCoords = null,
      myTD = null,
      wt = new Walkontable.Core({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        onCellDblClick(event, coords, TD) {
          myCoords = coords;
          myTD = TD;
        }
      });
    wt.draw();

    var $td = $table.find('tbody tr:eq(1) td:eq(1)');
    $td.simulate('mousedown');
    $td.simulate('mouseup');
    $td.simulate('mousedown');
    $td.simulate('mouseup');
    expect(myCoords).toEqual(new Walkontable.CellCoords(1, 1));
    expect(myTD).toEqual($td[0]);
  });

  it('should call `onCellDblClick` callback, even when it is set only after first click', () => {
    var
      myCoords = null,
      myTD = null,
      wt = new Walkontable.Core({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
    wt.draw();

    var $td = $table.find('tbody tr:eq(1) td:eq(1)');
    $td.simulate('mousedown');
    $td.simulate('mouseup');
    $td.simulate('mousedown');
    wt.update('onCellDblClick', (event, coords, TD) => {
      myCoords = coords;
      myTD = TD;
    });
    $td.simulate('mouseup');
    expect(myCoords).toEqual(new Walkontable.CellCoords(1, 1));
    expect(myTD).toEqual($td[0]);
  });

  it('should call `onCellMouseDown` callback when clicked on TH', () => {
    var
      called = false,
      wt = new Walkontable.Core({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [function(col, TH) {
          TH.innerHTML = col + 1;
        }],
        onCellMouseDown(event, coords, TD) {
          called = true;
        }
      });
    wt.draw();

    var $th = $table.find('th:first');

    $th.simulate('mousedown');
    expect(called).toEqual(true);
  });

  it('should not call `onCellMouseDown` callback when clicked on the focusable element (column headers)', () => {
    var opt = ['Maserati', 'Mazda', 'Mercedes', 'Mini', 'Mitsubishi'].map((opt) => `<option value="${opt}">${opt}</option>`).join('');
    var called = false;
    var wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = `#${col}<select>${opt}</select>`;
      }],
      onCellMouseDown(event, coords, TD) {
        called = true;
      }
    });
    wt.draw();

    var select = $table.find('th:first select');

    select.focus();
    select.simulate('mousedown');

    expect(called).toBe(false);
  });

  it('should not call `onCellMouseDown` callback when clicked on the focusable element (cell renderer)', () => {
    var opt = ['Maserati', 'Mazda', 'Mercedes', 'Mini', 'Mitsubishi'].map((opt) => `<option value="${opt}">${opt}</option>`).join('');
    var called = false;
    var wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      cellRenderer(row, column, TD) {
        TD.innerHTML = `<select>${opt}</select>`;
      },
      onCellMouseDown(event, coords, TD) {
        called = true;
      }
    });
    wt.draw();

    var select = $table.find('td:first select');

    select.focus();
    select.simulate('mousedown');

    expect(called).toBe(false);
  });

  it('should call `onCellMouseOver` callback when clicked on TH', () => {
    var
      called = false,
      wt = new Walkontable.Core({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [function(col, TH) {
          TH.innerHTML = col + 1;
        }],
        onCellMouseOver(event, coords, TD) {
          called = coords;
        }
      });
    wt.draw();

    var $th = $table.find('th:first');
    $th.simulate('mouseover');
    expect(called.row).toEqual(-1);
    expect(called.col).toEqual(0);
  });

  it('should call `onCellDblClick` callback when clicked on TH', () => {
    var
      called = false,
      wt = new Walkontable.Core({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [function(col, TH) {
          TH.innerHTML = col + 1;
        }],
        onCellDblClick(event, coords, TD) {
          called = true;
        }
      });
    wt.draw();

    var $th = $table.find('th:first');

    $th.simulate('mousedown');
    $th.simulate('mouseup');
    $th.simulate('mousedown');
    $th.simulate('mouseup');

    expect(called).toEqual(true);
  });

  it('should not call `onCellDblClick` callback when right-clicked', () => {
    var
      called = false,
      wt = new Walkontable.Core({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        onCellDblClick(event, coords, TD) {
          called = true;
        }
      });
    wt.draw();

    var $td = $table.find('tbody tr:first td:first');
    var options = {
      button: 2
    };

    $td.simulate('mousedown', options);
    $td.simulate('mouseup', options);
    $td.simulate('mousedown', options);
    $td.simulate('mouseup', options);

    expect(called).toEqual(false);
  });

  it('should not call `onCellDblClick` when first mouse up came from mouse drag', () => {
    var
      called = false,
      wt = new Walkontable.Core({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        onCellDblClick(event, coords, TD) {
          called = true;
        }
      });
    wt.draw();

    var $td = $table.find('tbody tr:first td:first');
    var $td2 = $table.find('tbody tr:first td:eq(1)');

    $td2.simulate('mousedown');
    $td.simulate('mouseup');
    $td.simulate('mousedown');
    $td.simulate('mouseup');

    expect(called).toEqual(false);
  });

  it('border click should call `onCellMouseDown` callback', () => {
    var
      myCoords = null,
      myTD = null,
      wt = new Walkontable.Core({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        selections: [
          new Walkontable.Selection({
            className: 'current',
            border: {
              width: 1,
              color: 'red',
              style: 'solid'
            }
          })
        ],
        onCellMouseDown(event, coords, TD) {
          myCoords = coords;
          myTD = TD;
        }
      });
    shimSelectionProperties(wt);
    wt.selections.current.add(new Walkontable.CellCoords(1, 1));
    wt.draw();

    var $td = $table.find('tbody tr:eq(1) td:eq(1)');
    var $border = $table.parents('.wtHolder').find('.wtBorder:first');

    $border.simulate('mousedown');

    expect(myCoords).toEqual(new Walkontable.CellCoords(1, 1));
    expect(myTD).toEqual($td[0]);
  });

  it('border click should call `onCellDblClick` callback', () => {
    var
      myCoords = null,
      myTD = null,
      wt = new Walkontable.Core({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        selections: [
          new Walkontable.Selection({
            className: 'current',
            border: {
              width: 1,
              color: 'red',
              style: 'solid'
            }
          })
        ],
        onCellDblClick(event, coords, TD) {
          myCoords = coords;
          myTD = TD;
        }
      });
    shimSelectionProperties(wt);
    wt.selections.current.add(new Walkontable.CellCoords(1, 1));
    wt.draw();

    var $td = $table.find('tbody tr:eq(1) td:eq(1)');
    var $border = $table.parents('.wtHolder').find('.wtBorder:first');

    $border.simulate('mousedown');
    $border.simulate('mouseup');
    $border.simulate('mousedown');
    $border.simulate('mouseup');

    expect(myCoords).toEqual(new Walkontable.CellCoords(1, 1));
    expect(myTD).toEqual($td[0]);
  });

  // corner

  it('should call `onCellCornerMouseDown` callback', () => {
    var
      clicked = false,
      wt = new Walkontable.Core({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        selections: [
          new Walkontable.Selection({
            className: 'current',
            border: {
              width: 1,
              color: 'red',
              style: 'solid'
            }
          })
        ],
        onCellCornerMouseDown(event) {
          clicked = true;
        }
      });
    shimSelectionProperties(wt);
    wt.selections.current.add(new Walkontable.CellCoords(10, 2));
    wt.draw();

    var $td = $table.parents('.wtHolder').find('.current.corner');
    $td.simulate('mousedown');

    expect(clicked).toEqual(true);
  });

  it('should call `onCellCornerDblClick` callback, even when it is set only after first click', () => {
    var
      clicked = false,
      wt = new Walkontable.Core({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        selections: [
          new Walkontable.Selection({
            className: 'current',
            border: {
              width: 1,
              color: 'red',
              style: 'solid'
            }
          })
        ]
      });
    shimSelectionProperties(wt);
    wt.selections.current.add(new Walkontable.CellCoords(10, 2));
    wt.draw();

    var $td = $table.parents('.wtHolder').find('.current.corner');

    $td.simulate('mousedown');
    $td.simulate('mouseup');
    $td.simulate('mousedown');
    wt.update('onCellCornerDblClick', (event) => {
      clicked = true;
    });
    $td.simulate('mouseup');

    expect(clicked).toEqual(true);
  });

  it('should call `onDraw` callback after render', () => {
    var
      count = 0,
      wt = new Walkontable.Core({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        onDraw() {
          count++;
        }
      });
    wt.draw();
    expect(count).toEqual(1);
  });
});
