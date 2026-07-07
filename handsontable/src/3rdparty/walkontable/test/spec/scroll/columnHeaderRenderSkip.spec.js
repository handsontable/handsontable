describe('Walkontable column-header render skip on vertical scroll', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(200).height(185);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(100, 50);
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  function firstBodyCellText() {
    return getTableMaster().find('tbody tr:first td:first').text();
  }

  function firstColumnHeaderText() {
    return getTableMaster().find('thead th').eq(1).text();
  }

  it('should not re-render the column headers on a pure vertical scroll (band shift)', async() => {
    const columnHeaders = jasmine.createSpy('columnHeaders').and.callFake((col, TH) => {
      TH.innerHTML = `C${col}`;
    });
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [columnHeaders],
    });

    wt.draw();

    const bodyBefore = firstBodyCellText();
    const headerBefore = firstColumnHeaderText();

    columnHeaders.calls.reset();

    // A real vertical scroll drives the draw through the scroll-sync path, which sets the
    // verticalScrolling flag the header-render skip relies on.
    wt.wtTable.holder.scrollTop = 400;
    wt.wtOverlays.syncScrollPositions();

    // The rendered row band actually moved (otherwise the assertion below would be vacuous) ...
    expect(firstBodyCellText()).not.toBe(bodyBefore);
    // ... but the column-header content factory was NOT invoked again (the THEAD pass was skipped) ...
    expect(columnHeaders).not.toHaveBeenCalled();
    // ... and the header content is unchanged.
    expect(firstColumnHeaderText()).toBe(headerBefore);
  });

  it('should re-render the column headers on a horizontal scroll (column window changed)', async() => {
    const columnHeaders = jasmine.createSpy('columnHeaders').and.callFake((col, TH) => {
      TH.innerHTML = `C${col}`;
    });
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [columnHeaders],
    });

    wt.draw();

    columnHeaders.calls.reset();

    wt.wtTable.holder.scrollLeft = 400;
    wt.wtOverlays.syncScrollPositions();

    // A horizontal scroll changes the visible columns, so the headers must be re-rendered.
    expect(columnHeaders).toHaveBeenCalled();
  });

  it('should re-render the column headers on a non-scroll draw after a vertical scroll', async() => {
    const columnHeaders = jasmine.createSpy('columnHeaders').and.callFake((col, TH) => {
      TH.innerHTML = `C${col}`;
    });
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [columnHeaders],
    });

    wt.draw();

    // Skip the headers on a vertical scroll.
    wt.wtTable.holder.scrollTop = 400;
    wt.wtOverlays.syncScrollPositions();

    columnHeaders.calls.reset();

    // A plain, non-scroll draw is not skip-eligible (the scroll flags are reset), so the header
    // pass must run again - proving the skip is gated to scroll-triggered draws only.
    wt.draw();

    expect(columnHeaders).toHaveBeenCalled();
  });
});
