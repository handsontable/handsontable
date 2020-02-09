describe('Walkontable.Selection', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(100).height(200);
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

    Walkontable.setBrowserMeta(); // reset to original value from the current browser
  });

  it('should add/remove class to selection when cell is clicked', () => {
    const wt = walkontable({
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

    const $td1 = spec().$table.find('tbody td:eq(0)');
    const $td2 = spec().$table.find('tbody td:eq(1)');

    expect($td1.hasClass('current')).toEqual(false);

    $td1.simulate('mousedown');

    expect($td1.hasClass('current')).toEqual(true);

    $td2.simulate('mousedown');

    expect($td1.hasClass('current')).toEqual(false);
    expect($td2.hasClass('current')).toEqual(true);
  });

  it('should add class to selection on all overlays', function() {
    spec().$wrapper.width(300).height(300);

    this.data = createSpreadsheetData(10, 10);

    const wt = walkontable({
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

    const tds = spec().$wrapper.find('td:contains(B2), td:contains(B3), td:contains(C2), td:contains(C3)');
    expect(tds.length).toBeGreaterThan(4);
    for (let i = 0, ilen = tds.length; i < ilen; i++) {
      expect(tds[i].className).toContain('area');
    }
  });

  it('should draw border on top, left, top-left-corner overlays if they are overlapping (scrollable viewport)', function() {
    spec().$wrapper.width(300).height(300);

    this.data = createSpreadsheetData(40, 20);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController(),
      fixedColumnsLeft: 1,
      fixedRowsTop: 1
    });

    wt.selections.createOrGetArea().add(new Walkontable.CellCoords(0, 0));
    wt.selections.createOrGetArea().add(new Walkontable.CellCoords(0, 1));
    wt.selections.createOrGetArea().add(new Walkontable.CellCoords(1, 0));
    wt.selections.createOrGetArea().add(new Walkontable.CellCoords(1, 1));

    wt.draw();

    const paths = spec().$wrapper.find('svg path');
    expect(paths.length).toBe(4);

    expect(getRenderedBorderPaths(spec().$wrapper.find('.ht_master')[0])).withContext('ht_master')
      .toEqual(['M 50.5 0 50.5 24 M 0 23.5 51 23.5']);
    expect(getRenderedBorderPaths(spec().$wrapper.find('.ht_clone_top')[0])).withContext('ht_clone_top')
      .toEqual(['M 0 0.5 51 0.5 M 50.5 0 50.5 48 M 0 47.5 51 47.5']);
    expect(getRenderedBorderPaths(spec().$wrapper.find('.ht_clone_left')[0])).withContext('ht_clone_left')
      .toEqual(['M 101.5 0 101.5 24 M 0 23.5 102 23.5 M 0.5 0 0.5 24']);
    expect(spec().$wrapper.find('.ht_clone_bottom_left_corner').length).withContext('ht_clone_top_left_corner')
      .toEqual(0);
    expect(getRenderedBorderPaths(spec().$wrapper.find('.ht_clone_bottom')[0])).withContext('ht_clone_bottom')
      .toEqual([]);
    expect(spec().$wrapper.find('.ht_clone_bottom_left_corner').length).withContext('ht_clone_bottom_left_corner')
      .toEqual(0);
  });

  it('should draw border on bottom, left, bottom-left-corner overlays if they are overlapping (scrollable viewport)', function() {
    spec().$wrapper.width(300).height(300);

    this.data = createSpreadsheetData(40, 20);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController(),
      fixedColumnsLeft: 1,
      fixedRowsBottom: 1
    });

    wt.selections.createOrGetArea().add(new Walkontable.CellCoords(38, 0));
    wt.selections.createOrGetArea().add(new Walkontable.CellCoords(38, 1));
    wt.selections.createOrGetArea().add(new Walkontable.CellCoords(39, 0));
    wt.selections.createOrGetArea().add(new Walkontable.CellCoords(39, 1));
    wt.draw();
    wt.scrollViewport(new Walkontable.CellCoords(38, 0));
    wt.draw();

    const paths = spec().$wrapper.find('svg path');
    expect(paths.length).toBe(4);

    expect(getRenderedBorderPaths(spec().$wrapper.find('.ht_master')[0])).withContext('ht_master')
      .toEqual(['M 0 253.5 51 253.5 M 50.5 253 50.5 300 M 0 299.5 51 299.5']);
    expect(getRenderedBorderPaths(spec().$wrapper.find('.ht_clone_top')[0])).withContext('ht_clone_top')
      .toEqual([]);
    expect(getRenderedBorderPaths(spec().$wrapper.find('.ht_clone_left')[0])).withContext('ht_clone_left')
      .toEqual(['M 0 253.5 102 253.5 M 101.5 253 101.5 300 M 0 299.5 102 299.5 M 0.5 253 0.5 300']);
    expect(getRenderedBorderPaths(spec().$wrapper.find('.ht_clone_top_left_corner')[0])).withContext('ht_clone_top_left_corner')
      .toEqual(null);
    expect(getRenderedBorderPaths(spec().$wrapper.find('.ht_clone_bottom')[0])).withContext('ht_clone_bottom')
      .toEqual(['M 0 -23.5 51 -23.5 M 50.5 -24 50.5 24 M 0 23.5 51 23.5']);
    expect(getRenderedBorderPaths(spec().$wrapper.find('.ht_clone_bottom_left_corner')[0])).withContext('ht_clone_bottom_left_corner')
      .toEqual(['M 0 -23.5 102 -23.5 M 101.5 -24 101.5 24 M 0 23.5 102 23.5 M 0.5 -24 0.5 24']);
  });

  it('should not add class to selection until it is rerendered', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController(),
    });
    wt.draw();
    wt.selections.getCell().add(new Walkontable.CellCoords(0, 0));

    const $td1 = spec().$table.find('tbody td:eq(0)');
    expect($td1.hasClass('current')).toEqual(false);

    wt.draw();
    expect($td1.hasClass('current')).toEqual(true);
  });

  it('should add/remove border to selection when cell is clicked', async() => {
    const wt = walkontable({
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

    await sleep(1500);
    const $td1 = spec().$table.find('tbody tr:eq(1) td:eq(0)');
    const $td2 = spec().$table.find('tbody tr:eq(2) td:eq(1)');
    const $corner = $(wt.selections.getCell().getSelectionHandle(wt).corner); // cheat... get border for ht_master
    $td1.simulate('mousedown');

    const pos1 = $corner.position();
    expect(pos1.top).toBeGreaterThan(0);
    expect(pos1.left).toBe(46);

    $td2.simulate('mousedown');
    const pos2 = $corner.position();

    expect(pos2.top).toBeGreaterThan(pos1.top);
    expect(pos2.left).toBeGreaterThan(pos1.left);
  });

  it('should add a selection that is outside of the viewport', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController(),
    });
    wt.draw();

    wt.selections.getCell().add([20, 0]);
    expect(wt.wtTable.getCoords(spec().$table.find('tbody tr:first td:first')[0])).toEqual(new Walkontable.CellCoords(0, 0));
  });

  it('should not scroll the viewport after selection is cleared', () => {
    const scrollbarWidth = getScrollbarWidth(); // normalize viewport size disregarding of the scrollbar size on any OS
    spec().$wrapper.width(100 + scrollbarWidth).height(200 + scrollbarWidth);

    const wt = walkontable({
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

    const expectedFirstVisibleRow = 10;

    expect(wt.wtTable.getFirstVisibleRow()).toEqual(expectedFirstVisibleRow);
    expect(wt.wtTable.getLastVisibleRow()).toBeAroundValue(17);

    wt.selections.getCell().clear();
    expect(wt.wtTable.getFirstVisibleRow()).toEqual(expectedFirstVisibleRow);
    expect(wt.wtTable.getLastVisibleRow()).toBeAroundValue(17);
  });

  it('should clear a selection that has more than one cell', () => {
    const wt = walkontable({
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
    spec().$wrapper.width(300);

    const customSelection = new Walkontable.Selection({
      highlightRowClassName: 'highlightRow',
      highlightColumnClassName: 'highlightColumn'
    });
    customSelection.add(new Walkontable.CellCoords(0, 0));
    customSelection.add(new Walkontable.CellCoords(0, 1));

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController({
        custom: [customSelection],
      }),
    });
    wt.draw();

    expect(spec().$table.find('.highlightRow').length).toEqual(2);
    expect(spec().$table.find('.highlightColumn').length).toEqual((wt.wtTable.getRenderedRowsCount() * 2) - 2);
  });

  it('should highlight cells in selected row & column, when same class is shared between 2 selection definitions', () => {
    spec().$wrapper.width(300);

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

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController({
        custom: [customSelection1, customSelection2],
      }),
    });
    wt.draw();

    expect(spec().$table.find('.highlightRow').length).toEqual(3);
    expect(spec().$table.find('.highlightColumn').length).toEqual(wt.wtTable.getRenderedRowsCount() - 1);
  });

  it('should remove highlight when selection is deselected', () => {
    const wt = walkontable({
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

    expect(spec().$table.find('.highlightRow').length).toEqual(0);
    expect(spec().$table.find('.highlightColumn').length).toEqual(0);
  });

  it('should add/remove appropriate class to the row/column headers of selected cells', () => {
    spec().$wrapper.width(300);

    const wt = walkontable({
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
    expect(spec().$table.find('.highlightRow').length).toEqual((wt.wtViewport.columnsVisibleCalculator.count * 2) + 2 - 4);
    expect(spec().$table.find('.highlightColumn').length - 2).toEqual((wt.wtViewport.rowsVisibleCalculator.count * 2) + 2 - 4);
    expect(spec().$table.find('.highlightColumn').length).toEqual(14);
    expect(getTableTopClone().find('.highlightColumn').length).toEqual(2);
    expect(getTableTopClone().find('.highlightRow').length).toEqual(0);
    expect(getTableLeftClone().find('.highlightColumn').length).toEqual(0);
    expect(getTableLeftClone().find('.highlightRow').length).toEqual(2);

    const $colHeaders = spec().$table.find('thead tr:first-child th');
    const $rowHeaders = spec().$table.find('tbody tr th:first-child');

    expect($colHeaders.eq(2).hasClass('highlightColumn')).toBe(true);
    expect($colHeaders.eq(3).hasClass('highlightColumn')).toBe(true);

    expect($rowHeaders.eq(1).hasClass('highlightRow')).toBe(true);
    expect($rowHeaders.eq(2).hasClass('highlightRow')).toBe(true);

    wt.selections.getCell().clear();
    wt.draw();

    expect(spec().$table.find('.highlightRow').length).toEqual(0);
    expect(spec().$table.find('.highlightColumn').length).toEqual(0);
    expect(getTableTopClone().find('.highlightColumn').length).toEqual(0);
    expect(getTableTopClone().find('.highlightRow').length).toEqual(0);
    expect(getTableLeftClone().find('.highlightColumn').length).toEqual(0);
    expect(getTableLeftClone().find('.highlightRow').length).toEqual(0);
  });

  it('should apply changed settings of a highlight (desktop browser)', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController({
        current: new Walkontable.Selection({
          className: 'current',
          border: {
            width: 1,
            color: 'rgb(255, 0, 0)',
            style: 'solid',
            cornerVisible() {
              return true;
            },
            strokeAlignment: 'inside'
          }
        })
      }),
    });
    wt.draw();

    wt.selections.getCell().add(new Walkontable.CellCoords(0, 0));
    wt.draw();

    expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 0 0.5 51 0.5 M 50.5 0 50.5 24 M 0 23.5 51 23.5 M 0.5 0 0.5 24']);
    expect(getRenderedBorderStyles(spec().$wrapper[0])).toEqual(['1px solid rgb(255, 0, 0)']);
    expect($('.wtBorder.current.corner').css('background-color')).toEqual('rgb(255, 0, 0)');

    wt.selections.getCell().settings.border.color = 'rgb(127, 124, 0)';
    wt.selections.getCell().settings.border.width = 2;
    wt.draw();

    expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['', 'M 1 1 51 1 M 50 0 50 24 M 1 23 51 23 M 1 0 1 24']);
    expect(getRenderedBorderStyles(spec().$wrapper[0])).toEqual(['1px solid rgb(255, 0, 0)', '2px solid rgb(127, 124, 0)']);
    expect($('.wtBorder.current.corner').css('background-color')).toEqual('rgb(127, 124, 0)');
  });

  it('should apply changed settings of a highlight (mobile browser)', () => {
    Walkontable.setBrowserMeta({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B411 Safari/600.1.4'
    });

    const redColor = 'rgb(255, 0, 0)';
    const greenColor = 'rgb(127, 124, 0)';
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: createSelectionController({
        current: new Walkontable.Selection({
          className: 'current',
          border: {
            width: 1,
            color: redColor,
            style: 'solid',
            cornerVisible() {
              return true;
            },
            strokeAlignment: 'inside'
          }
        })
      }),
    });
    wt.draw();

    wt.selections.getCell().add(new Walkontable.CellCoords(0, 0));
    wt.draw();

    const topLeftComputedStyle = window.getComputedStyle(document.querySelector('.topLeftSelectionHandle'));
    const bottomRightComputedStyle = window.getComputedStyle(document.querySelector('.bottomRightSelectionHandle'));

    expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 0 0.5 51 0.5 M 50.5 0 50.5 24 M 0 23.5 51 23.5 M 0.5 0 0.5 24']);
    expect(getRenderedBorderStyles(spec().$wrapper[0])).toEqual(['1px solid rgb(255, 0, 0)']);

    expect(topLeftComputedStyle.borderTopColor).toEqual(redColor);
    expect(topLeftComputedStyle.borderLeftColor).toEqual(redColor);
    expect(topLeftComputedStyle.borderBottomColor).toEqual(redColor);
    expect(topLeftComputedStyle.borderRightColor).toEqual(redColor);
    expect(bottomRightComputedStyle.borderTopColor).toEqual(redColor);
    expect(bottomRightComputedStyle.borderLeftColor).toEqual(redColor);
    expect(bottomRightComputedStyle.borderBottomColor).toEqual(redColor);
    expect(bottomRightComputedStyle.borderRightColor).toEqual(redColor);

    wt.selections.getCell().settings.border.color = greenColor;
    wt.selections.getCell().settings.border.width = 2;
    wt.draw();

    expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['', 'M 1 1 51 1 M 50 0 50 24 M 1 23 51 23 M 1 0 1 24']);
    expect(getRenderedBorderStyles(spec().$wrapper[0])).toEqual(['1px solid rgb(255, 0, 0)', '2px solid rgb(127, 124, 0)']);

    expect(topLeftComputedStyle.borderTopColor).toEqual(greenColor);
    expect(topLeftComputedStyle.borderLeftColor).toEqual(greenColor);
    expect(topLeftComputedStyle.borderBottomColor).toEqual(greenColor);
    expect(topLeftComputedStyle.borderRightColor).toEqual(greenColor);
    expect(bottomRightComputedStyle.borderTopColor).toEqual(greenColor);
    expect(bottomRightComputedStyle.borderLeftColor).toEqual(greenColor);
    expect(bottomRightComputedStyle.borderBottomColor).toEqual(greenColor);
    expect(bottomRightComputedStyle.borderRightColor).toEqual(greenColor);
  });

  describe('replace', () => {
    it('should replace range from property and return true', () => {
      const wt = walkontable({
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
