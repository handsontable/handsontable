describe('NestedHeaders cooperation with ManualColumnMove', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  // hotfix for #dev-2038
  it('should set up the selection correctly for moving column', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      colHeaders: true,
      nestedHeaders: [
        ['a', 'b', 'c', 'd'],
        ['a', 'b', 'c', 'd']
      ],
      manualColumnMove: true,
    });

    await selectColumns(1);

    $(getCell(-1, 1)).simulate('mousedown');
    $(getCell(-1, 2)).simulate('mouseover');
    $(getCell(-1, 3)).simulate('mouseover');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 9,1']);
  });

  it('should make the nested header labels follow the data when a leaf column is moved (#4150)', async() => {
    handsontable({
      data: createSpreadsheetData(2, 4),
      colHeaders: true,
      nestedHeaders: [
        [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }],
        ['Street', 'City', 'Revenue', 'Profit'],
      ],
      manualColumnMove: true,
    });

    getPlugin('manualColumnMove').moveColumn(0, 3); // move "Street" (and its data) to the end
    await render();

    // The leaf labels follow the data to their new visual positions.
    expect(getCell(-1, 0).textContent).toBe('City');
    expect(getCell(-1, 1).textContent).toBe('Revenue');
    expect(getCell(-1, 2).textContent).toBe('Profit');
    expect(getCell(-1, 3).textContent).toBe('Street');

    // The "Address" group is split into two banners (its columns are no longer adjacent); "Finance"
    // stays a single banner over its two columns.
    expect(getCell(-2, 0).textContent).toBe('Address');
    expect(getCell(-2, 1).textContent).toBe('Finance');
    expect(getCell(-2, 3).textContent).toBe('Address');
  });

  it('should move a whole group label as a unit when its columns stay adjacent (#4150)', async() => {
    handsontable({
      data: createSpreadsheetData(2, 4),
      colHeaders: true,
      nestedHeaders: [
        [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }],
        ['Street', 'City', 'Revenue', 'Profit'],
      ],
      manualColumnMove: true,
    });

    getPlugin('manualColumnMove').moveColumns([0, 1], 2); // move the whole "Address" group to the end
    await render();

    // "Finance" now leads; "Address" follows its two columns, staying a single intact banner.
    expect(getCell(-2, 0).textContent).toBe('Finance');
    expect(getCell(-2, 2).textContent).toBe('Address');
    expect(getCell(-1, 0).textContent).toBe('Revenue');
    expect(getCell(-1, 1).textContent).toBe('Profit');
    expect(getCell(-1, 2).textContent).toBe('Street');
    expect(getCell(-1, 3).textContent).toBe('City');
  });

  it('should make the nested header labels follow the data for a move run inside a batch (#4150)', async() => {
    handsontable({
      data: createSpreadsheetData(2, 4),
      colHeaders: true,
      nestedHeaders: [
        [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }],
        ['Street', 'City', 'Revenue', 'Profit'],
      ],
      manualColumnMove: true,
    });

    // A batched/suspended move emits its cache update on resume, after the index mapper cleared the
    // 'move' change source - the afterColumnMove backstop must still re-derive the structure.
    hot().batch(() => {
      hot().getPlugin('manualColumnMove').moveColumn(0, 3);
    });
    await render();

    expect(getCell(-1, 0).textContent).toBe('City');
    expect(getCell(-1, 3).textContent).toBe('Street');
    expect(getCell(-2, 0).textContent).toBe('Address');
    expect(getCell(-2, 3).textContent).toBe('Address');
  });

  it('should keep a group collapsed and follow it when an unrelated column is moved (#4150)', async() => {
    handsontable({
      data: [['a1', 'a2', 'b1', 'b2', 'cc'], ['a1', 'a2', 'b1', 'b2', 'cc']],
      colHeaders: true,
      nestedHeaders: [
        [{ label: 'GA', colspan: 2 }, { label: 'GB', colspan: 2 }, 'C'],
        ['a1', 'a2', 'b1', 'b2', 'cc'],
      ],
      collapsibleColumns: true,
      manualColumnMove: true,
    });

    getPlugin('collapsibleColumns').toggleCollapsibleSection([{ row: -2, col: 0 }], 'collapse');
    await render();

    // Group GA collapsed: its second column (physical 1) is hidden.
    expect(getPlugin('collapsibleColumns').getCollapsedColumns()).toEqual([1]);

    // Move "C" to the front - GA's columns stay adjacent (it stays intact).
    getPlugin('manualColumnMove').moveColumn(4, 0);
    await render();

    // The data followed, and GA stays collapsed (physical column 1 still hidden) at its new position.
    expect(getDataAtCell(0, 0)).toBe('cc');
    expect(getPlugin('collapsibleColumns').getCollapsedColumns()).toEqual([1]);
    // The "+" is the collapsed-group indicator - GA is still collapsed, now at its new position.
    expect(getCell(-2, 1).textContent).toBe('GA+');
  });

  it('should auto-expand a `visibleWhen` group when a move splits it (#4150)', async() => {
    handsontable({
      data: [['a', 'b', 'c', 'd', 'e'], ['a', 'b', 'c', 'd', 'e']],
      colHeaders: true,
      nestedHeaders: [
        ['A', { label: 'G', colspan: 3 }, 'E'],
        ['A',
          { label: 'B', visibleWhen: 'always' },
          { label: 'C', visibleWhen: 'expanded' },
          { label: 'D', visibleWhen: 'expanded' },
          'E'],
      ],
      collapsibleColumns: true,
      manualColumnMove: true,
    });

    getPlugin('collapsibleColumns').toggleCollapsibleSection([{ row: -2, col: 1 }], 'collapse');
    await render();

    // Collapsed: C and D hide (visibleWhen 'expanded'), leaving 3 visible columns.
    expect(hot().columnIndexMapper.getRenderableIndexesLength()).toBe(3);

    // Move "B" out of the group - it splits, so the group auto-expands and C/D are released.
    getPlugin('manualColumnMove').moveColumn(1, 4);
    await render();

    expect(hot().columnIndexMapper.getRenderableIndexesLength()).toBe(5);
  });

  it('should auto-expand a legacy collapsed group when a move splits it, releasing its columns (#4150)', async() => {
    handsontable({
      data: [['a1', 'a2', 'b1', 'b2', 'cc'], ['a1', 'a2', 'b1', 'b2', 'cc']],
      colHeaders: true,
      nestedHeaders: [
        [{ label: 'GA', colspan: 2 }, { label: 'GB', colspan: 2 }, 'C'],
        ['a1', 'a2', 'b1', 'b2', 'cc'],
      ],
      collapsibleColumns: true,
      manualColumnMove: true,
    });

    getPlugin('collapsibleColumns').toggleCollapsibleSection([{ row: -2, col: 0 }], 'collapse');
    await render();

    // GA collapsed: its second column is hidden (4 visible).
    expect(hot().columnIndexMapper.getRenderableIndexesLength()).toBe(4);

    // Move GA's hidden column out of the group - it would split, so GA auto-expands first. Without
    // this the column would stay hidden with no indicator left to expand it (unrecoverable).
    getPlugin('manualColumnMove').moveColumn(1, 4);
    await render();

    expect(hot().columnIndexMapper.getRenderableIndexesLength()).toBe(5);
    expect(getPlugin('collapsibleColumns').getCollapsedColumns()).toEqual([]);
  });
});
