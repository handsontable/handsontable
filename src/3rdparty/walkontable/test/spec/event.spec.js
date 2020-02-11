describe('WalkontableEvent', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(500).height(201);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(100, 4);
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  it('should call `onCellMouseDown` callback', () => {
    const onCellMouseDown = jasmine.createSpy('onCellMouseDown');
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      onCellMouseDown,
    });

    wt.draw();

    {
      const $td = spec().$table.find('tbody tr:eq(1) td:eq(1)');
      const button = 0;

      $td
        .simulate('mouseover', { button })
        .simulate('mousemove', { button })
        .simulate('mousedown', { button })
        .simulate('mouseup', { button })
        .simulate('click', { button })
      ;

      expect(onCellMouseDown).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(1, 1), $td[0], jasmine.any(wt.constructor));
      expect(onCellMouseDown).toHaveBeenCalledTimes(1);
    }

    {
      const $td = spec().$table.find('tbody tr:eq(2) td:eq(2)');
      const button = 1;

      onCellMouseDown.calls.reset();
      $td
        .simulate('mouseover', { button })
        .simulate('mousemove', { button })
        .simulate('mousedown', { button })
        .simulate('mouseup', { button })
        .simulate('click', { button })
      ;

      expect(onCellMouseDown).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(2, 2), $td[0], jasmine.any(wt.constructor));
      expect(onCellMouseDown).toHaveBeenCalledTimes(1);
    }

    {
      const $td = spec().$table.find('tbody tr:eq(3) td:eq(3)');
      const button = 2;

      onCellMouseDown.calls.reset();
      $td
        .simulate('mouseover', { button })
        .simulate('mousemove', { button })
        .simulate('mousedown', { button })
        .simulate('mouseup', { button })
        .simulate('click', { button })
      ;

      expect(onCellMouseDown).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(3, 3), $td[0], jasmine.any(wt.constructor));
      expect(onCellMouseDown).toHaveBeenCalledTimes(1);
    }
  });

  it('should call `onCellMouseUp` callback', () => {
    const onCellMouseUp = jasmine.createSpy('onCellMouseUp');
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      onCellMouseUp,
    });

    wt.draw();

    {
      const $td = spec().$table.find('tbody tr:eq(1) td:eq(1)');
      const button = 0;

      $td
        .simulate('mouseover', { button })
        .simulate('mousemove', { button })
        .simulate('mousedown', { button })
        .simulate('mouseup', { button })
        .simulate('click', { button })
      ;

      expect(onCellMouseUp).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(1, 1), $td[0], jasmine.any(wt.constructor));
      expect(onCellMouseUp).toHaveBeenCalledTimes(1);
    }

    {
      const $td = spec().$table.find('tbody tr:eq(2) td:eq(2)');
      const button = 1;

      onCellMouseUp.calls.reset();
      $td
        .simulate('mouseover', { button })
        .simulate('mousemove', { button })
        .simulate('mousedown', { button })
        .simulate('mouseup', { button })
        .simulate('click', { button })
      ;

      expect(onCellMouseUp).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(2, 2), $td[0], jasmine.any(wt.constructor));
      expect(onCellMouseUp).toHaveBeenCalledTimes(1);
    }

    {
      const $td = spec().$table.find('tbody tr:eq(3) td:eq(3)');
      const button = 2;

      onCellMouseUp.calls.reset();
      $td
        .simulate('mouseover', { button })
        .simulate('mousemove', { button })
        .simulate('mousedown', { button })
        .simulate('mouseup', { button })
        .simulate('click', { button })
      ;

      expect(onCellMouseUp).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(3, 3), $td[0], jasmine.any(wt.constructor));
      expect(onCellMouseUp).toHaveBeenCalledTimes(1);
    }
  });

  it('should call `onCellContextMenu` callback', () => {
    const onCellContextMenu = jasmine.createSpy('onCellContextMenu');
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      onCellContextMenu,
    });

    wt.draw();

    const $td = spec().$table.find('tbody tr:eq(1) td:eq(1)');

    $td.simulate('contextmenu');

    expect(onCellContextMenu).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(1, 1), $td[0], jasmine.any(wt.constructor));
    expect(onCellContextMenu).toHaveBeenCalledTimes(1);
  });

  it('should call `onCellMouseOver` callback', () => {
    const onCellMouseOver = jasmine.createSpy('onCellMouseOver');
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      onCellMouseOver,
    });

    wt.draw();

    {
      const $td = spec().$table.find('tbody tr:eq(1) td:eq(1)');
      const button = 0;

      $td
        .simulate('mouseover', { button })
        .simulate('mousemove', { button })
        .simulate('mousedown', { button })
        .simulate('mouseup', { button })
        .simulate('click', { button })
      ;

      expect(onCellMouseOver).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(1, 1), $td[0], jasmine.any(wt.constructor));
      expect(onCellMouseOver).toHaveBeenCalledTimes(1);
    }

    {
      const $td = spec().$table.find('tbody tr:eq(2) td:eq(2)');
      const button = 1;

      onCellMouseOver.calls.reset();
      $td
        .simulate('mouseover', { button })
        .simulate('mousemove', { button })
        .simulate('mousedown', { button })
        .simulate('mouseup', { button })
        .simulate('click', { button })
      ;

      expect(onCellMouseOver).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(2, 2), $td[0], jasmine.any(wt.constructor));
      expect(onCellMouseOver).toHaveBeenCalledTimes(1);
    }

    {
      const $td = spec().$table.find('tbody tr:eq(3) td:eq(3)');
      const button = 2;

      onCellMouseOver.calls.reset();
      $td
        .simulate('mouseover', { button })
        .simulate('mousemove', { button })
        .simulate('mousedown', { button })
        .simulate('mouseup', { button })
        .simulate('click', { button })
      ;

      expect(onCellMouseOver).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(3, 3), $td[0], jasmine.any(wt.constructor));
      expect(onCellMouseOver).toHaveBeenCalledTimes(1);
    }
  });

  it('should call `onCellMouseOver` callback with correctly passed TD element when cell contains another table', () => {
    const onCellMouseOver = jasmine.createSpy('onCellMouseOver');
    const wt = walkontable({
      data: [['<table style="width: 50px;"><tr><td class="test">TEST</td></tr></table>']],
      totalRows: 1,
      totalColumns: 1,
      onCellMouseOver,
      cellRenderer(row, column, TD) {
        TD.innerHTML = wt.wtSettings.getSetting('data', row, column);
      },
    });

    wt.draw();

    const outerTD = spec().$table.find('tbody td:not(td.test)');
    const innerTD = spec().$table.find('tbody td.test');

    innerTD.simulate('mouseover');

    expect(onCellMouseOver.calls.argsFor(0)[2]).toBe(outerTD[0]);
  });

  it('should call `onCellMouseOut` callback', () => {
    const onCellMouseOut = jasmine.createSpy('onCellMouseOut');
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      onCellMouseOut,
    });

    wt.draw();

    {
      const $td = spec().$table.find('tbody tr:eq(1) td:eq(1)');
      const button = 0;

      $td
        .simulate('mouseover', { button })
        .simulate('mousemove', { button })
        .simulate('mouseout', { button })
      ;

      expect(onCellMouseOut).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(1, 1), $td[0], jasmine.any(wt.constructor));
      expect(onCellMouseOut).toHaveBeenCalledTimes(1);
    }

    {
      const $td = spec().$table.find('tbody tr:eq(2) td:eq(2)');
      const button = 1;

      onCellMouseOut.calls.reset();
      $td
        .simulate('mouseover', { button })
        .simulate('mousemove', { button })
        .simulate('mouseout', { button })
      ;

      expect(onCellMouseOut).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(2, 2), $td[0], jasmine.any(wt.constructor));
      expect(onCellMouseOut).toHaveBeenCalledTimes(1);
    }

    {
      const $td = spec().$table.find('tbody tr:eq(3) td:eq(3)');
      const button = 2;

      onCellMouseOut.calls.reset();
      $td
        .simulate('mouseover', { button })
        .simulate('mousemove', { button })
        .simulate('mouseout', { button })
      ;

      expect(onCellMouseOut).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(3, 3), $td[0], jasmine.any(wt.constructor));
      expect(onCellMouseOut).toHaveBeenCalledTimes(1);
    }
  });

  it('should call `onCellMouseOut` callback with correctly passed TD element when cell contains another table', () => {
    const onCellMouseOut = jasmine.createSpy('onCellMouseOut');
    const wt = walkontable({
      data: [['<table style="width: 50px;"><tr><td class="test">TEST</td></tr></table>']],
      totalRows: 1,
      totalColumns: 1,
      onCellMouseOut,
      cellRenderer(row, column, TD) {
        TD.innerHTML = wt.wtSettings.getSetting('data', row, column);
      },
    });

    wt.draw();

    const outerTD = spec().$table.find('tbody td:not(td.test)');

    spec().$table.find('tbody td.test')
      .simulate('mouseover')
      .simulate('mousemove')
      .simulate('mouseout')
    ;

    expect(onCellMouseOut.calls.argsFor(0)[2]).toBe(outerTD[0]);
  });

  it('should call `onCellDblClick` callback but only for LMB', () => {
    const onCellDblClick = jasmine.createSpy('onCellDblClick');
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      onCellDblClick,
    });

    wt.draw();

    {
      const $td = spec().$table.find('tbody tr:eq(1) td:eq(1)');
      const button = 0;

      $td
        .simulate('mousemove', { button })
        .simulate('mousedown', { button })
        .simulate('mouseup', { button })
        .simulate('click', { button })
        .simulate('mousedown', { button })
        .simulate('mouseup', { button })
        .simulate('click', { button })
        .simulate('dblclick', { button })
      ;

      expect(onCellDblClick).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(1, 1), $td[0], jasmine.any(wt.constructor));
      expect(onCellDblClick).toHaveBeenCalledTimes(1);
    }

    {
      // Middle button click
      const $td = spec().$table.find('tbody tr:eq(2) td:eq(2)');
      const button = 1;

      onCellDblClick.calls.reset();
      $td
        .simulate('mousemove', { button })
        .simulate('mousedown', { button })
        .simulate('mouseup', { button })
        .simulate('click', { button })
        .simulate('mousedown', { button })
        .simulate('mouseup', { button })
        .simulate('click', { button })
        .simulate('dblclick', { button })
      ;

      expect(onCellDblClick).toHaveBeenCalledTimes(0);
    }

    {
      // Right button click
      const $td = spec().$table.find('tbody tr:eq(3) td:eq(3)');
      const button = 2;

      onCellDblClick.calls.reset();
      $td
        .simulate('mousemove', { button })
        .simulate('mousedown', { button })
        .simulate('mouseup', { button })
        .simulate('click', { button })
        .simulate('mousedown', { button })
        .simulate('mouseup', { button })
        .simulate('click', { button })
        .simulate('dblclick', { button })
      ;

      expect(onCellDblClick).toHaveBeenCalledTimes(0);
    }
  });

  it('should call `onCellDblClick` callback, even when it is set only after first click', () => {
    const onCellDblClick = jasmine.createSpy('onCellDblClick');
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();

    const $td = spec().$table.find('tbody tr:eq(1) td:eq(1)');

    $td
      .simulate('mousemove')
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click')
    ;

    wt.update('onCellDblClick', onCellDblClick);

    $td
      .simulate('mousemove')
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click')
    ;

    expect(onCellDblClick).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(1, 1), $td[0], jasmine.any(wt.constructor));
  });

  it('should call `onCellMouseDown` callback when clicked on TH', () => {
    const onCellMouseDown = jasmine.createSpy('onCellMouseDown');
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = col + 1;
      }],
      onCellMouseDown,
    });

    wt.draw();

    spec().$table.find('th:first')
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click')
    ;

    expect(onCellMouseDown).toHaveBeenCalledTimes(1);
  });

  it('should not call `onCellMouseDown` callback when clicked on the focusable element (column headers)', () => {
    const opt = ['Maserati', 'Mazda', 'Mercedes', 'Mini', 'Mitsubishi'].map(value => `<option value="${value}">${value}</option>`).join('');
    const onCellMouseDown = jasmine.createSpy('onCellMouseDown');
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = `#${col}<select>${opt}</select>`;
      }],
      onCellMouseDown,
    });

    wt.draw();

    spec().$table.find('.ht_clone_top th:first select')
      .focus()
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click')
    ;

    expect(onCellMouseDown).toHaveBeenCalledTimes(0);
  });

  it('should not call `onCellMouseDown` callback when clicked on the focusable element (cell renderer)', () => {
    const opt = ['Maserati', 'Mazda', 'Mercedes', 'Mini', 'Mitsubishi'].map(value => `<option value="${value}">${value}</option>`).join('');
    const onCellMouseDown = jasmine.createSpy('onCellMouseDown');
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      cellRenderer(row, column, TD) {
        TD.innerHTML = `<select>${opt}</select>`;
      },
      onCellMouseDown,
    });

    wt.draw();

    spec().$table.find('td:first select')
      .focus()
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click')
    ;

    expect(onCellMouseDown).toHaveBeenCalledTimes(0);
  });

  it('should call `onCellMouseOver` callback when clicked on TH', () => {
    const onCellMouseOver = jasmine.createSpy('onCellMouseOver');
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = col + 1;
      }],
      onCellMouseOver,
    });

    wt.draw();

    spec().$table.find('th:first')
      .simulate('mouseover')
      .simulate('mousemove')
    ;

    expect(onCellMouseOver).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(-1, 0), jasmine.anything(), jasmine.any(wt.constructor));
  });

  it('should call `onCellDblClick` callback when clicked on TH', () => {
    const onCellDblClick = jasmine.createSpy('onCellDblClick');
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = col + 1;
      }],
      onCellDblClick,
    });

    wt.draw();

    spec().$table.find('th:first')
      .simulate('mousemove')
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click')
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click')
      .simulate('dblclick')
    ;

    expect(onCellDblClick).toHaveBeenCalledTimes(1);
  });

  it('should not call `onCellDblClick` when first mouse up came from mouse drag', () => {
    const onCellDblClick = jasmine.createSpy('onCellDblClick');
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      onCellDblClick,
    });

    wt.draw();

    spec().$table.find('tbody tr:first td:eq(1)')
      .simulate('mousedown')
    ;
    spec().$table.find('tbody tr:first td:first')
      .simulate('mouseup')
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click')
      .simulate('dblclick')
    ;

    expect(onCellDblClick).toHaveBeenCalledTimes(0);
  });

  it('border click should call `onCellDblClick` callback', () => {
    const onCellDblClick = jasmine.createSpy('onCellDblClick');
    const wt = walkontable({
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
      onCellDblClick,
    });

    wt.selections.getCell().add(new Walkontable.CellCoords(1, 1));
    wt.draw();

    const $td = spec().$table.find('tbody tr:eq(1) td:eq(1)');

    spec().$table.parents('.wtHolder')
      .find('.current:first')
      .simulate('mouseover')
      .simulate('mousemove')
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click')
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click')
      .simulate('dblclick')
    ;

    expect(onCellDblClick).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(1, 1), $td[0], jasmine.any(wt.constructor));
    expect(onCellDblClick).toHaveBeenCalledTimes(1);
  });

  it('border click should call `onCellMouseDown` callback', () => {
    const onCellMouseDown = jasmine.createSpy('onCellMouseDown');
    const wt = walkontable({
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
      onCellMouseDown,
    });

    wt.selections.getCell().add(new Walkontable.CellCoords(1, 1));
    wt.draw();

    const $td = spec().$table.find('tbody tr:eq(1) td:eq(1)');

    spec().$table.parents('.wtHolder')
      .find('.current:first')
      .simulate('mouseover')
      .simulate('mousemove')
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click')
    ;

    expect(onCellMouseDown).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(1, 1), $td[0], jasmine.any(wt.constructor));
    expect(onCellMouseDown).toHaveBeenCalledTimes(1);
  });

  it('border click should call `onCellMouseUp` callback', () => {
    const onCellMouseUp = jasmine.createSpy('onCellMouseUp');
    const wt = walkontable({
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
      onCellMouseUp,
    });

    wt.selections.getCell().add(new Walkontable.CellCoords(1, 1));
    wt.draw();

    const $td = spec().$table.find('tbody tr:eq(1) td:eq(1)');

    spec().$table.parents('.wtHolder')
      .find('.current:first')
      .simulate('mouseover')
      .simulate('mousemove')
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click')
    ;

    expect(onCellMouseUp).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(1, 1), $td[0], jasmine.any(wt.constructor));
    expect(onCellMouseUp).toHaveBeenCalledTimes(1);
  });

  // corner
  it('border click should call `onCellCornerMouseDown` callback', () => {
    const onCellCornerMouseDown = jasmine.createSpy('onCellCornerMouseDown');
    const wt = walkontable({
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
      onCellCornerMouseDown,
    });

    wt.selections.getCell().add(new Walkontable.CellCoords(10, 2));
    wt.draw();

    const $el = spec().$table.parents('.wtHolder').find('.current.corner');

    $el
      .simulate('mouseover')
      .simulate('mousemove')
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click')
    ;

    expect(onCellCornerMouseDown).toHaveBeenCalledWith(jasmine.any(MouseEvent), $el[0], void 0, void 0);
    expect(onCellCornerMouseDown).toHaveBeenCalledTimes(1);
  });

  it('border click should call `onCellCornerDblClick` callback, even when it is set only after first click', () => {
    const onCellCornerDblClick = jasmine.createSpy('onCellCornerDblClick');
    const wt = walkontable({
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

    const $td = spec().$table.parents('.wtHolder').find('.current.corner');

    $td
      .simulate('mousemove')
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click')
    ;

    wt.update('onCellCornerDblClick', onCellCornerDblClick);

    $td
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click')
    ;

    expect(onCellCornerDblClick).toHaveBeenCalledWith(jasmine.any(MouseEvent), new Walkontable.CellCoords(10, 2), -2, jasmine.any(wt.constructor));
  });

  it('should call `onDraw` callback after render', () => {
    const onDraw = jasmine.createSpy('onDraw');
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      onDraw,
    });

    wt.draw();

    expect(onDraw).toHaveBeenCalledTimes(1);
  });
});
