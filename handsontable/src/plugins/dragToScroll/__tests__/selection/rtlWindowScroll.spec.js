describe('DragToScroll selection — RTL scroll directions', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should extend the selection leftward (to higher col indexes) when dragging past the left edge', async() => {
    // Drag from a rightmost-visible cell past the LEFT edge. In RTL the left side
    // contains higher-indexed columns so the selection end index must increase.
    handsontable({
      data: createSpreadsheetData(5, 30),
      width: 250,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
      layoutDirection: 'rtl',
    });

    // Scroll so col 15 is at the left edge — there are cols 16-29 off-screen to the left.
    await scrollViewportTo({
      row: 0,
      col: 15,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    const anchorCol = getFirstFullyVisibleColumn();
    const $anchorCell = $(getCell(0, anchorCol, true));
    const tableRect = getMaster()[0].getBoundingClientRect();

    $anchorCell.simulate('mousedown', {
      clientX: $anchorCell.offset().left + 2,
      clientY: $anchorCell.offset().top + 2,
    });

    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.left - 20,
        clientY: tableRect.top + 20,
      });

    await sleep(400);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    // Anchor column must be unchanged.
    expect(selectedAfter[1]).toBe(anchorCol);
    // In RTL, dragging LEFT extends selection to higher column indexes (further left visually).
    expect(selectedAfter[3]).toBeGreaterThan(anchorCol);
  });

  it('should track the leftmost visible column on each auto-scroll tick when dragging left', async() => {
    handsontable({
      data: createSpreadsheetData(5, 30),
      width: 250,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
      layoutDirection: 'rtl',
    });

    await scrollViewportTo({
      row: 0,
      col: 10,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    const anchorCol = getFirstFullyVisibleColumn();
    const $anchorCell = $(getCell(0, anchorCol, true));
    const tableRect = getMaster()[0].getBoundingClientRect();

    $anchorCell.simulate('mousedown', {
      clientX: $anchorCell.offset().left + 2,
      clientY: $anchorCell.offset().top + 2,
    });

    // Collect per-tick data to verify that each scroll step advances the selection end
    // to the newly revealed leftmost column (which in RTL has a higher index).
    const tickData = [];

    hot().addHook('afterScroll', () => {
      tickData.push({
        toCol: getSelectedLast()?.[3],
        lastFully: getLastFullyVisibleColumn(),
      });
    });

    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.left - 20,
        clientY: tableRect.top + 20,
      });

    await sleep(500);

    $(document.body).simulate('mouseup');

    // Every tick after the first must advance the selection end to match the
    // newly visible column. Verify at least a few ticks happened and each one
    // extended the selection in the correct direction.
    expect(tickData.length).toBeGreaterThan(0);

    const badTicks = tickData.filter(t => t.toCol !== null && t.lastFully !== null && t.toCol < anchorCol);

    // Selection end must never go BELOW anchorCol (must only grow upward in RTL).
    expect(badTicks.length).toBe(0);
    expect(getSelectedLast()[3]).toBeGreaterThan(anchorCol);
  });

  it('should extend the selection rightward (to lower col indexes) when dragging past the right edge', async() => {
    // Drag from a leftmost-visible cell past the RIGHT edge. In RTL the right side
    // contains lower-indexed columns so the selection end index must decrease.
    handsontable({
      data: createSpreadsheetData(5, 30),
      width: 250,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
      layoutDirection: 'rtl',
    });

    // Scroll so col 20 (a high index) is visible on the left, meaning cols 0-some
    // are off to the right.
    await scrollViewportTo({
      row: 0,
      col: 20,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    // Anchor at the last fully visible column (leftmost in RTL = highest index).
    const anchorCol = getLastFullyVisibleColumn();
    const $anchorCell = $(getCell(0, anchorCol, true));
    const tableRect = getMaster()[0].getBoundingClientRect();

    $anchorCell.simulate('mousedown', {
      clientX: $anchorCell.offset().left + 2,
      clientY: $anchorCell.offset().top + 2,
    });

    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.right + 20,
        clientY: tableRect.top + 20,
      });

    await sleep(400);

    $(document.body).simulate('mouseup');

    const selectedAfter = getSelectedLast();

    // Anchor column must be unchanged.
    expect(selectedAfter[1]).toBe(anchorCol);
    // In RTL, dragging RIGHT extends selection to lower column indexes (further right visually).
    expect(selectedAfter[3]).toBeLessThan(anchorCol);
  });

  it('should track the rightmost visible column on each auto-scroll tick when dragging right', async() => {
    handsontable({
      data: createSpreadsheetData(5, 30),
      width: 250,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
      layoutDirection: 'rtl',
    });

    await scrollViewportTo({
      row: 0,
      col: 25,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    const anchorCol = getLastFullyVisibleColumn();
    const $anchorCell = $(getCell(0, anchorCol, true));
    const tableRect = getMaster()[0].getBoundingClientRect();

    $anchorCell.simulate('mousedown', {
      clientX: $anchorCell.offset().left + 2,
      clientY: $anchorCell.offset().top + 2,
    });

    const tickData = [];

    hot().addHook('afterScroll', () => {
      tickData.push({
        toCol: getSelectedLast()?.[3],
        firstFully: getFirstFullyVisibleColumn(),
      });
    });

    $(document.body)
      .simulate('mouseover')
      .simulate('mousemove', {
        clientX: tableRect.right + 20,
        clientY: tableRect.top + 20,
      });

    await sleep(500);

    $(document.body).simulate('mouseup');

    expect(tickData.length).toBeGreaterThan(0);

    const badTicks = tickData.filter(t => t.toCol !== null && t.firstFully !== null && t.toCol > anchorCol);

    // Selection end must never go ABOVE anchorCol (must only shrink down in RTL).
    expect(badTicks.length).toBe(0);
    expect(getSelectedLast()[3]).toBeLessThan(anchorCol);
  });

  it('should correctly select an adjacent column during a short drag at max-left scroll in RTL', async() => {
    // Regression: at max-left RTL scroll, tableOffset.left > window.innerWidth caused
    // clamp(mouseX, min, max) with min > max to always return min, making isOutside=true
    // for all viewport positions and firing onCellMouseOverOutside with the wrong column.
    handsontable({
      data: createSpreadsheetData(5, 30),
      width: 250,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      dragToScroll: true,
      layoutDirection: 'rtl',
    });

    // Scroll to max-left (the highest-indexed columns visible on the left side).
    await scrollViewportTo({
      row: 0,
      col: countCols() - 1,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    const anchorCol = countCols() - 2;
    const $anchorCell = $(getCell(0, anchorCol, true));

    $anchorCell.simulate('mousedown', {
      clientX: $anchorCell.offset().left + 2,
      clientY: $anchorCell.offset().top + 2,
    });

    // Move to the immediately adjacent cell (one column toward lower index = right in RTL).
    const adjacentCol = anchorCol - 1;
    const $adjacentCell = $(getCell(0, adjacentCol, true));

    $adjacentCell.simulate('mouseover', {
      clientX: $adjacentCell.offset().left + 2,
      clientY: $adjacentCell.offset().top + 2,
    });

    $(document.body).simulate('mouseup');

    expect(getSelectedRangeLast()).toEqualCellRange(
      `highlight: 0,${anchorCol} from: 0,${anchorCol} to: 0,${adjacentCol}`
    );
  });
});
