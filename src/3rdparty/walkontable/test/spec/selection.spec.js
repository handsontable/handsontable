describe('Walkontable.Selection', () => {
  let $table;
  let $container;
  let $wrapper;
  const debug = false;

  beforeEach(() => {
    $wrapper = $('<div></div>').css({ overflow: 'hidden' });
    $wrapper.width(100).height(200);
    $container = $('<div></div>');
    $table = $('<table></table>'); // create a table that is not attached to document
    $wrapper.append($container);
    $container.append($table);
    $wrapper.appendTo('body');
    createDataArray();
  });

  afterEach(() => {
    if (!debug) {
      $('.wtHolder').remove();
    }
    $wrapper.remove();
  });

  it('should add/remove class to selection when cell is clicked', () => {
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController(),
      onCellMouseDown(event, coords) {
        wt.selections.getCell().clear();
        wt.selections.getCell().add(coords);
        wt.draw();
      }
    });
    wt.draw();

    const $td1 = $table.find('tbody td:eq(0)');
    const $td2 = $table.find('tbody td:eq(1)');
    $td1.simulate('mousedown');
    expect($td1.hasClass('current')).toEqual(true);

    $td2.simulate('mousedown');
    expect($td1.hasClass('current')).toEqual(false);
    expect($td2.hasClass('current')).toEqual(true);
  });

  it('should add class to selection on all overlays', function() {
    $wrapper.width(300).height(300);

    this.data = createSpreadsheetData(10, 10);

    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController(),
      fixedColumnsLeft: 2,
      fixedRowsTop: 2
    });

    wt.selections.createOrGetArea().add(new Walkontable.CellCoords(1, 1));
    wt.selections.createOrGetArea().add(new Walkontable.CellCoords(1, 2));
    wt.selections.createOrGetArea().add(new Walkontable.CellCoords(2, 1));
    wt.selections.createOrGetArea().add(new Walkontable.CellCoords(2, 2));

    wt.draw();

    const tds = $wrapper.find('td:contains(B2), td:contains(B3), td:contains(C2), td:contains(C3)');
    expect(tds.length).toBeGreaterThan(4);
    for (let i = 0, ilen = tds.length; i < ilen; i++) {
      expect(tds[i].className).toContain('area');
    }
  });

  it('should not add class to selection until it is rerendered', () => {
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController(),
    });
    wt.draw();
    wt.selections.getCell().add(new Walkontable.CellCoords(0, 0));

    const $td1 = $table.find('tbody td:eq(0)');
    expect($td1.hasClass('current')).toEqual(false);

    wt.draw();
    expect($td1.hasClass('current')).toEqual(true);
  });

  it('should add/remove border to selection when cell is clicked', (done) => {
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController(),
      onCellMouseDown(event, coords) {
        wt.selections.getCell().clear();
        wt.selections.getCell().add(coords);
        wt.draw();
      }
    });
    wt.draw();

    setTimeout(() => {
      const $td1 = $table.find('tbody tr:eq(1) td:eq(0)');
      const $td2 = $table.find('tbody tr:eq(2) td:eq(1)');
      const $top = $(wt.selections.getCell().getBorder(wt).top); // cheat... get border for ht_master
      $td1.simulate('mousedown');

      const pos1 = $top.position();
      expect(pos1.top).toBeGreaterThan(0);
      expect(pos1.left).toBe(0);

      $td2.simulate('mousedown');
      const pos2 = $top.position();

      expect(pos2.top).toBeGreaterThan(pos1.top);
      expect(pos2.left).toBeGreaterThan(pos1.left);
      done();
    }, 1500);
  });

  it('should add a selection that is outside of the viewport', () => {
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController(),
    });
    wt.draw();

    wt.selections.getCell().add([20, 0]);
    expect(wt.wtTable.getCoords($table.find('tbody tr:first td:first')[0])).toEqual(new Walkontable.CellCoords(0, 0));
  });

  it('should not scroll the viewport after selection is cleared', () => {
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController(),
    });

    wt.draw();

    wt.selections.getCell().add(new Walkontable.CellCoords(0, 0));
    wt.draw();
    expect(wt.wtTable.getFirstVisibleRow()).toEqual(0);

    wt.scrollViewportVertically(17);
    wt.draw();
    expect(wt.wtTable.getFirstVisibleRow()).toEqual(10);
    expect(wt.wtTable.getLastVisibleRow()).toBeAroundValue(17);

    wt.selections.getCell().clear();
    expect(wt.wtTable.getFirstVisibleRow()).toEqual(10);
    expect(wt.wtTable.getLastVisibleRow()).toBeAroundValue(17);
  });

  it('should clear a selection that has more than one cell', () => {
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController(),
    });
    wt.draw();

    wt.selections.getCell().add(new Walkontable.CellCoords(0, 0));
    wt.selections.getCell().add(new Walkontable.CellCoords(0, 1));
    wt.selections.getCell().clear();

    expect(wt.selections.getCell().cellRange).toEqual(null);
  });

  it('should highlight cells in selected row & column', () => {
    $wrapper.width(300);

    const customSelection = new Walkontable.Selection({
      highlightRowClassName: 'highlightRow',
      highlightColumnClassName: 'highlightColumn'
    });
    customSelection.add(new Walkontable.CellCoords(0, 0));
    customSelection.add(new Walkontable.CellCoords(0, 1));

    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController({
        custom: [customSelection],
      }),
    });
    wt.draw();

    expect($table.find('.highlightRow').length).toEqual(2);
    expect($table.find('.highlightColumn').length).toEqual((wt.wtTable.getRenderedRowsCount() * 2) - 2);
  });

  it('should highlight cells in selected row & column, when same class is shared between 2 selection definitions', () => {
    $wrapper.width(300);

    const customSelection1 = new Walkontable.Selection({
      highlightRowClassName: 'highlightRow',
      highlightColumnClassName: 'highlightColumn'
    });

    customSelection1.add(new Walkontable.CellCoords(0, 0));

    const customSelection2 = new Walkontable.Selection({
      highlightRowClassName: 'highlightRow',
      highlightColumnClassName: 'highlightColumn'
    });

    customSelection2.add(new Walkontable.CellCoords(0, 0));

    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController({
        custom: [customSelection1, customSelection2],
      }),
    });
    wt.draw();

    expect($table.find('.highlightRow').length).toEqual(3);
    expect($table.find('.highlightColumn').length).toEqual(wt.wtTable.getRenderedRowsCount() - 1);
  });

  it('should remove highlight when selection is deselected', () => {
    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController({
        current: new Walkontable.Selection({
          highlightRowClassName: 'highlightRow',
          highlightColumnClassName: 'highlightColumn'
        }),
      }),
    });
    wt.draw();

    wt.selections.getCell().add(new Walkontable.CellCoords(0, 0));
    wt.selections.getCell().add(new Walkontable.CellCoords(0, 1));
    wt.draw();

    wt.selections.getCell().clear();
    wt.draw();

    expect($table.find('.highlightRow').length).toEqual(0);
    expect($table.find('.highlightColumn').length).toEqual(0);
  });

  it('should add/remove appropriate class to the row/column headers of selected cells', () => {
    $wrapper.width(300);

    const wt = new Walkontable.Core({
      table: $table[0],
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }],
      selections: createSelectionController({
        current: new Walkontable.Selection({
          highlightRowClassName: 'highlightRow',
          highlightColumnClassName: 'highlightColumn'
        }),
      }),
    });
    wt.draw();

    wt.selections.getCell().add(new Walkontable.CellCoords(1, 1));
    wt.selections.getCell().add(new Walkontable.CellCoords(2, 2));
    wt.draw();

    // left side:
    // -2 -> because one row is partially visible

    // right side:
    // *2 -> because there are 2 columns selected
    // +2 -> because there are the headers
    // -4 -> because 4 cells are selected = there are overlapping highlightRow class
    expect($table.find('.highlightRow').length).toEqual((wt.wtViewport.columnsVisibleCalculator.count * 2) + 2 - 4);
    expect($table.find('.highlightColumn').length - 2).toEqual((wt.wtViewport.rowsVisibleCalculator.count * 2) + 2 - 4);
    expect($table.find('.highlightColumn').length).toEqual(14);
    expect(getTableTopClone().find('.highlightColumn').length).toEqual(2);
    expect(getTableTopClone().find('.highlightRow').length).toEqual(0);
    expect(getTableLeftClone().find('.highlightColumn').length).toEqual(0);
    expect(getTableLeftClone().find('.highlightRow').length).toEqual(2);

    const $colHeaders = $table.find('thead tr:first-child th');
    const $rowHeaders = $table.find('tbody tr th:first-child');

    expect($colHeaders.eq(2).hasClass('highlightColumn')).toBe(true);
    expect($colHeaders.eq(3).hasClass('highlightColumn')).toBe(true);

    expect($rowHeaders.eq(1).hasClass('highlightRow')).toBe(true);
    expect($rowHeaders.eq(2).hasClass('highlightRow')).toBe(true);

    wt.selections.getCell().clear();
    wt.draw();

    expect($table.find('.highlightRow').length).toEqual(0);
    expect($table.find('.highlightColumn').length).toEqual(0);
    expect(getTableTopClone().find('.highlightColumn').length).toEqual(0);
    expect(getTableTopClone().find('.highlightRow').length).toEqual(0);
    expect(getTableLeftClone().find('.highlightColumn').length).toEqual(0);
    expect(getTableLeftClone().find('.highlightRow').length).toEqual(0);
  });

  describe('replace', () => {
    it('should replace range from property and return true', () => {
      const wt = new Walkontable.Core({
        table: $table[0],
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        selections: createSelectionController(),
      });
      wt.selections.getCell().add(new Walkontable.CellCoords(1, 1));
      wt.selections.getCell().add(new Walkontable.CellCoords(3, 3));
      const result = wt.selections.getCell().replace(new Walkontable.CellCoords(3, 3), new Walkontable.CellCoords(4, 4));

      expect(result).toBe(true);
      expect(wt.selections.getCell().getCorners()).toEqual([1, 1, 4, 4]);
    });
  });
});
