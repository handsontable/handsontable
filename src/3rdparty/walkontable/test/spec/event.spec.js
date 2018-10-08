describe('WalkontableEvent', () => {
  let $table;
  const debug = false;

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
    let myCoords = null;
    let myTD = null;
    const wt = new Walkontable.Core({
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

    const $td = $table.find('tbody tr:eq(1) td:eq(1)');

    $td.simulate('mousedown');

    expect(myCoords).toEqual(new Walkontable.CellCoords(1, 1));
    expect(myTD).toEqual($td[0]);
  });

  it('should call `onCellContextMenu` callback', () => {
    let myCoords = null;
    let myTD = null;
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      onCellContextMenu(event, coords, TD) {
        myCoords = coords;
        myTD = TD;
      }
    });

    wt.draw();

    const $td = $table.find('tbody tr:eq(1) td:eq(1)');

    $td.simulate('contextmenu');

    expect(myCoords).toEqual(new Walkontable.CellCoords(1, 1));
    expect(myTD).toEqual($td[0]);
  });

  it('should call `onCellMouseOver` callback', () => {
    let myCoords = null;
    let myTD = null;
    const wt = new Walkontable.Core({
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

    const $td = $table.find('tbody tr:eq(1) td:eq(1)');

    $td.simulate('mouseover');

    expect(myCoords).toEqual(new Walkontable.CellCoords(1, 1));
    expect(myTD).toEqual($td[0]);
  });

  it('should call `onCellMouseOver` callback with correctly passed TD element when cell contains another table', () => {
    const fn = jasmine.createSpy();
    const wt = new Walkontable.Core({
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

    const outerTD = $table.find('tbody td:not(td.test)');
    const innerTD = $table.find('tbody td.test');

    innerTD.simulate('mouseover');

    expect(fn.calls.argsFor(0)[2]).toBe(outerTD[0]);
  });

  it('should call `onCellMouseOut` callback', () => {
    let myCoords = null;
    let myTD = null;
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      onCellMouseOut(event, coords, TD) {
        myCoords = coords;
        myTD = TD;
      }
    });

    wt.draw();

    const $td = $table.find('tbody tr:eq(1) td:eq(1)');

    $td.simulate('mouseover')
      .simulate('mouseout');

    expect(myCoords).toEqual(new Walkontable.CellCoords(1, 1));
    expect(myTD).toEqual($td[0]);
  });

  it('should call `onCellMouseOut` callback with correctly passed TD element when cell contains another table', () => {
    const fn = jasmine.createSpy();
    const wt = new Walkontable.Core({
      table: $table[0],
      data: [['<table style="width: 50px;"><tr><td class="test">TEST</td></tr></table>']],
      totalRows: 1,
      totalColumns: 1,
      onCellMouseOut: fn,
      cellRenderer(row, column, TD) {
        TD.innerHTML = wt.wtSettings.getSetting('data', row, column);
      },
    });

    wt.draw();

    const outerTD = $table.find('tbody td:not(td.test)');

    $table.find('tbody td.test')
      .simulate('mouseover')
      .simulate('mouseout');

    expect(fn.calls.argsFor(0)[2]).toBe(outerTD[0]);
  });

  it('should call `onCellDblClick` callback', () => {
    let myCoords = null;
    let myTD = null;
    const wt = new Walkontable.Core({
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

    const $td = $table.find('tbody tr:eq(1) td:eq(1)');

    $td.simulate('mousedown')
      .simulate('mouseup')
      .simulate('mousedown')
      .simulate('mouseup');

    expect(myCoords).toEqual(new Walkontable.CellCoords(1, 1));
    expect(myTD).toEqual($td[0]);
  });

  it('should call `onCellDblClick` callback, even when it is set only after first click', () => {
    let myCoords = null;
    let myTD = null;
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();

    const $td = $table.find('tbody tr:eq(1) td:eq(1)');

    $td.simulate('mousedown')
      .simulate('mouseup')
      .simulate('mousedown');
    wt.update('onCellDblClick', (event, coords, TD) => {
      myCoords = coords;
      myTD = TD;
    });
    $td.simulate('mouseup');

    expect(myCoords).toEqual(new Walkontable.CellCoords(1, 1));
    expect(myTD).toEqual($td[0]);
  });

  it('should call `onCellMouseDown` callback when clicked on TH', () => {
    let called = false;
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = col + 1;
      }],
      onCellMouseDown() {
        called = true;
      }
    });

    wt.draw();

    $table.find('th:first').simulate('mousedown');

    expect(called).toEqual(true);
  });

  it('should not call `onCellMouseDown` callback when clicked on the focusable element (column headers)', () => {
    const opt = ['Maserati', 'Mazda', 'Mercedes', 'Mini', 'Mitsubishi'].map(value => `<option value="${value}">${value}</option>`).join('');
    let called = false;
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = `#${col}<select>${opt}</select>`;
      }],
      onCellMouseDown() {
        called = true;
      }
    });

    wt.draw();

    $table.find('th:first select')
      .focus()
      .simulate('mousedown');

    expect(called).toBe(false);
  });

  it('should not call `onCellMouseDown` callback when clicked on the focusable element (cell renderer)', () => {
    const opt = ['Maserati', 'Mazda', 'Mercedes', 'Mini', 'Mitsubishi'].map(value => `<option value="${value}">${value}</option>`).join('');
    let called = false;
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      cellRenderer(row, column, TD) {
        TD.innerHTML = `<select>${opt}</select>`;
      },
      onCellMouseDown() {
        called = true;
      }
    });

    wt.draw();

    $table.find('td:first select')
      .focus()
      .simulate('mousedown');

    expect(called).toBe(false);
  });

  it('should call `onCellMouseOver` callback when clicked on TH', () => {
    let called = false;
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = col + 1;
      }],
      onCellMouseOver(event, coords) {
        called = coords;
      }
    });

    wt.draw();

    $table.find('th:first').simulate('mouseover');

    expect(called.row).toEqual(-1);
    expect(called.col).toEqual(0);
  });

  it('should call `onCellDblClick` callback when clicked on TH', () => {
    let called = false;
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = col + 1;
      }],
      onCellDblClick() {
        called = true;
      }
    });

    wt.draw();

    $table.find('th:first')
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('mousedown')
      .simulate('mouseup');

    expect(called).toEqual(true);
  });

  it('should not call `onCellDblClick` callback when right-clicked', () => {
    let called = false;
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      onCellDblClick() {
        called = true;
      }
    });

    wt.draw();

    const options = {
      button: 2
    };

    $table.find('tbody tr:first td:first')
      .simulate('mousedown', options)
      .simulate('mouseup', options)
      .simulate('mousedown', options)
      .simulate('mouseup', options);

    expect(called).toEqual(false);
  });

  it('should not call `onCellDblClick` when first mouse up came from mouse drag', () => {
    let called = false;
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      onCellDblClick() {
        called = true;
      }
    });

    wt.draw();

    $table.find('tbody tr:first td:eq(1)').simulate('mousedown');
    $table.find('tbody tr:first td:first')
      .simulate('mouseup')
      .simulate('mousedown')
      .simulate('mouseup');

    expect(called).toEqual(false);
  });

  it('border click should call `onCellMouseDown` callback', () => {
    let myCoords = null;
    let myTD = null;
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController({
        current: new Walkontable.Selection({
          className: 'current',
          border: {
            width: 1,
            color: 'red',
            style: 'solid'
          }
        })
      }),
      onCellMouseDown(event, coords, TD) {
        myCoords = coords;
        myTD = TD;
      }
    });

    wt.selections.getCell().add(new Walkontable.CellCoords(1, 1));
    wt.draw();

    const $td = $table.find('tbody tr:eq(1) td:eq(1)');

    $table.parents('.wtHolder')
      .find('.current:first')
      .simulate('mousedown');

    expect(myCoords).toEqual(new Walkontable.CellCoords(1, 1));
    expect(myTD).toEqual($td[0]);
  });

  it('border click should call `onCellDblClick` callback', () => {
    let myCoords = null;
    let myTD = null;
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController({
        current: new Walkontable.Selection({
          className: 'current',
          border: {
            width: 1,
            color: 'red',
            style: 'solid'
          }
        })
      }),
      onCellDblClick(event, coords, TD) {
        myCoords = coords;
        myTD = TD;
      }
    });

    wt.selections.getCell().add(new Walkontable.CellCoords(1, 1));
    wt.draw();

    const $td = $table.find('tbody tr:eq(1) td:eq(1)');

    $table.parents('.wtHolder')
      .find('.current:first')
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('mousedown')
      .simulate('mouseup');

    expect(myCoords).toEqual(new Walkontable.CellCoords(1, 1));
    expect(myTD).toEqual($td[0]);
  });

  // corner
  it('should call `onCellCornerMouseDown` callback', () => {
    let clicked = false;
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController({
        current: new Walkontable.Selection({
          className: 'current',
          border: {
            width: 1,
            color: 'red',
            style: 'solid'
          }
        })
      }),
      onCellCornerMouseDown() {
        clicked = true;
      }
    });

    wt.selections.getCell().add(new Walkontable.CellCoords(10, 2));
    wt.draw();

    $table.parents('.wtHolder')
      .find('.current.corner')
      .simulate('mousedown');

    expect(clicked).toEqual(true);
  });

  it('should call `onCellCornerDblClick` callback, even when it is set only after first click', () => {
    let clicked = false;
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController({
        current: new Walkontable.Selection({
          className: 'current',
          border: {
            width: 1,
            color: 'red',
            style: 'solid'
          }
        })
      }),
    });

    wt.selections.getCell().add(new Walkontable.CellCoords(10, 2));
    wt.draw();

    const $td = $table.parents('.wtHolder').find('.current.corner');

    $td.simulate('mousedown')
      .simulate('mouseup')
      .simulate('mousedown');
    wt.update('onCellCornerDblClick', () => {
      clicked = true;
    });
    $td.simulate('mouseup');

    expect(clicked).toEqual(true);
  });

  it('should call `onDraw` callback after render', () => {
    let count = 0;
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      onDraw() {
        count += 1;
      }
    });

    wt.draw();

    expect(count).toEqual(1);
  });
});
