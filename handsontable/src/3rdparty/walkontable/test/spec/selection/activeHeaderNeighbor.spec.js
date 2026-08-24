/**
 * Regression coverage for the active-header NEIGHBOUR classes tagged by `SelectionManager`
 * (`#markActiveHeaderNeighbors`): the TH directly before an active header carries
 * `ht__active_highlight-prev` (its inline-end border draws the active header's inline-start accent)
 * and every TH of the TBODY row directly above an active row header carries
 * `ht__active_highlight-prev-row` (its bottom border draws the active row header's top accent).
 *
 * These stamped classes replace the former `th:has(+ th.ht__active_highlight)` and
 * `tr:has(+ tr > th.ht__active_highlight) th` theme rules. With the active class inside a `:has()`
 * argument, every toggle of it (the selection pass re-applies it on each draw, and it moves between
 * the recycled header nodes while scrolling) forced a style invalidation scaled to the whole host
 * page - the scroll-with-selection jank.
 */
describe('Active header neighbour classes', () => {
  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$container = $('<div></div>');
    this.$wrapper.width(300).height(300);
    this.$table = $('<table></table>').addClass('htCore');
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(20, 8);
  });

  afterEach(function() {
    $('.wtHolder').remove();
    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  const PREV = 'ht__active_highlight-prev';
  const PREV_ROW = 'ht__active_highlight-prev-row';

  const headerFactory =
    count => Array.from({ length: count }, () => (index, TH) => { TH.innerHTML = index + 1; });

  function build({ rowHeaderLevels = 1, columnHeaderLevels = 1 } = {}) {
    const selections = createSelectionController();
    const wt = walkontable({
      data: getData,
      totalRows: 8,
      totalColumns: 8,
      rowHeaders: headerFactory(rowHeaderLevels),
      columnHeaders: headerFactory(columnHeaderLevels),
      selections,
    });

    wt.draw();

    return { wt, selections };
  }

  it('tags the previous column header with the `-prev` class, never the active header itself', async() => {
    const { wt, selections } = build();

    selections.getActiveHeader().add(new Walkontable.CellCoords(-1, 3));
    wt.draw();

    const previousHeader = wt.wtTable.getColumnHeader(2);
    const activeHeader = wt.wtTable.getColumnHeader(3);

    expect(previousHeader.classList.contains(PREV)).toBe(true);
    expect(previousHeader.classList.contains('ht__active_highlight')).toBe(false);
    expect(activeHeader.classList.contains('ht__active_highlight')).toBe(true);
    expect(activeHeader.classList.contains(PREV)).toBe(false);
  });

  it('tags the `-prev` class on every column-header level covered by the selection', async() => {
    const { wt, selections } = build({ columnHeaderLevels: 2 });
    const activeHeader = selections.getActiveHeader();

    // Span both header levels (level -2 and -1) of column 3, like a column selection with
    // navigable headers does.
    activeHeader.add(new Walkontable.CellCoords(-2, 3));
    activeHeader.add(new Walkontable.CellCoords(-1, 3));
    wt.draw();

    expect(wt.wtTable.getColumnHeader(2, 0).classList.contains(PREV)).toBe(true);
    expect(wt.wtTable.getColumnHeader(2, 1).classList.contains(PREV)).toBe(true);
  });

  // The row-header THs of the master table's TBODY row, asserted through the DOM directly.
  function masterRowHeaderThs(wt, visualRowIndex) {
    return $(wt.wtTable.TBODY).children('tr').eq(visualRowIndex).children('th').toArray();
  }

  it('tags every TH of the row above an active row header with the `-prev-row` class', async() => {
    const { wt, selections } = build({ rowHeaderLevels: 2 });

    selections.getActiveHeader().add(new Walkontable.CellCoords(3, -1));
    wt.draw();

    const rowAboveThs = masterRowHeaderThs(wt, 2);
    const activeRowThs = masterRowHeaderThs(wt, 3);

    expect(rowAboveThs.length).toBe(2);
    rowAboveThs.forEach((th) => {
      expect(th.classList.contains(PREV_ROW)).toBe(true);
    });
    activeRowThs.forEach((th) => {
      expect(th.classList.contains(PREV_ROW)).toBe(false);
    });
  });

  it('does not tag the `-prev-row` class when the active row header is the first row', async() => {
    const { wt, selections } = build();

    selections.getActiveHeader().add(new Walkontable.CellCoords(0, -1));
    wt.draw();

    expect(spec().$wrapper.find(`.${PREV_ROW}`).length).toBe(0);
  });

  it('does not tag the `-prev` class when the active column header has no header before it', async() => {
    // No row headers: the first column header has no preceding TH (not even a corner header).
    const { wt, selections } = build({ rowHeaderLevels: 0 });

    selections.getActiveHeader().add(new Walkontable.CellCoords(-1, 0));
    wt.draw();

    expect(spec().$wrapper.find(`.${PREV}`).length).toBe(0);
  });

  it('moves the neighbour classes when the active header selection moves', async() => {
    const { wt, selections } = build();
    const activeHeader = selections.getActiveHeader();

    activeHeader.add(new Walkontable.CellCoords(3, -1));
    wt.draw();

    expect(masterRowHeaderThs(wt, 2)[0].classList.contains(PREV_ROW)).toBe(true);

    activeHeader.clear();
    activeHeader.add(new Walkontable.CellCoords(5, -1));
    wt.draw(false);

    expect(masterRowHeaderThs(wt, 2)[0].classList.contains(PREV_ROW)).toBe(false);
    expect(masterRowHeaderThs(wt, 4)[0].classList.contains(PREV_ROW)).toBe(true);
  });
});
