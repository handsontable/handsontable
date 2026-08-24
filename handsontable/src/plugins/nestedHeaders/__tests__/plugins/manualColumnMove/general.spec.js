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
      // columnDropMode: 'split' opts into the split model - a torn group renders as same-label banners
      // (the default is now cohesive: a moved-out column is released, see the 'columnDropMode option' tests).
      nestedHeaders: [
        [
          { label: 'Address', colspan: 2, columnDropMode: 'split' },
          { label: 'Finance', colspan: 2, columnDropMode: 'split' },
        ],
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
      nestedHeaders: [ // columnDropMode: 'split' opts into the split model (default is now cohesive)
        [
          { label: 'Address', colspan: 2, columnDropMode: 'split' },
          { label: 'Finance', colspan: 2, columnDropMode: 'split' },
        ],
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

  it('should keep nested header labels aligned with the data when a column is removed after a move (#4150)', async() => {
    handsontable({
      data: [['a1', 'a2', 'b1', 'b2'], ['a1', 'a2', 'b1', 'b2']],
      colHeaders: true,
      nestedHeaders: [ // columnDropMode: 'split' opts into the split model (default is now cohesive)
        [{ label: 'A', colspan: 2, columnDropMode: 'split' }, { label: 'B', colspan: 2, columnDropMode: 'split' }],
        ['a1', 'a2', 'b1', 'b2'],
      ],
      manualColumnMove: true,
    });

    getPlugin('manualColumnMove').moveColumn(0, 3); // visual order: a2, b1, b2, a1
    await render();

    await alter('remove_col', 0, 1); // remove visual column 0 (physically a2)

    // The remaining data keeps its visual order.
    expect(getDataAtCell(0, 0)).toBe('b1');
    expect(getDataAtCell(0, 1)).toBe('b2');
    expect(getDataAtCell(0, 2)).toBe('a1');

    // The leaf labels stay over their data - the bug left 'a2' here instead of dropping it.
    expect(getCell(-1, 0).textContent).toBe('b1');
    expect(getCell(-1, 1).textContent).toBe('b2');
    expect(getCell(-1, 2).textContent).toBe('a1');

    // "B" spans the first two columns; "A" survives as a standalone header over the last column.
    expect(getCell(-2, 0).textContent).toBe('B');
    expect(getCell(-2, 2).textContent).toBe('A');
  });

  it('should keep nested header labels aligned with the data when a column is inserted after a move (#4150)', async() => {
    handsontable({
      data: [['a1', 'a2', 'b1', 'b2'], ['a1', 'a2', 'b1', 'b2']],
      colHeaders: true,
      nestedHeaders: [
        [{ label: 'A', colspan: 2 }, { label: 'B', colspan: 2 }],
        ['a1', 'a2', 'b1', 'b2'],
      ],
      manualColumnMove: true,
    });

    getPlugin('manualColumnMove').moveColumn(0, 3); // visual order: a2, b1, b2, a1
    await render();

    await alter('insert_col_start', 0, 1); // insert a blank column at visual 0

    // The existing columns keep their data; the blank lands at visual 0.
    expect(getDataAtCell(0, 0)).toBe(null);
    expect(getDataAtCell(0, 1)).toBe('a2');
    expect(getDataAtCell(0, 4)).toBe('a1');

    // The existing leaf labels stay over their data - the bug stranded 'a1' and left visual 4 empty.
    expect(getCell(-1, 1).textContent).toBe('a2');
    expect(getCell(-1, 4).textContent).toBe('a1');
  });

  it('should not misapply a stale adoption override after a column is inserted (#4150)', async() => {
    handsontable({
      data: createSpreadsheetData(2, 4),
      colHeaders: true,
      nestedHeaders: [
        [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }], // cohesive (default)
        ['Street', 'City', 'Revenue', 'Profit'],
      ],
      manualColumnMove: true,
    });

    // Move "Revenue" into Address - cohesive Address adopts it, recording a membership override keyed
    // by Revenue's physical column and Address's authored owner index.
    getPlugin('manualColumnMove').moveColumn(2, 1);
    await render();
    expect(getCell(-2, 0).colSpan).toBe(3); // adoption recorded: Address spans Street, Revenue, City

    // Insert a column at the front. This shifts every physical column index and the authored owner
    // indices, so the override (still keyed by the old physical column) would misapply to the wrong
    // column. The override must be reset on this structural change.
    await alter('insert_col_start', 0, 1);

    // Visual order is now: <blank>, Street, Revenue, City, Profit. With the override reset, the
    // adoption is gone - Revenue reverts to its authored Finance group, so no header spans more than
    // one column (Address's two members are no longer adjacent) and labels follow the data.
    expect(getCell(-1, 1).textContent).toBe('Street');
    expect(getCell(-1, 2).textContent).toBe('Revenue');
    expect(getCell(-1, 3).textContent).toBe('City');
    expect(getCell(-2, 1).textContent).toBe('Address'); // over Street
    expect(getCell(-2, 1).colSpan).toBe(1);
    expect(getCell(-2, 2).textContent).toBe('Finance'); // over Revenue - NOT adopted into Address
    expect(getCell(-2, 2).colSpan).toBe(1);
    expect(getCell(-2, 3).textContent).toBe('Address'); // over City
  });

  it('should keep labels aligned for an insert run inside a batch after a move (#4150)', async() => {
    handsontable({
      data: [['a1', 'a2', 'b1', 'b2'], ['a1', 'a2', 'b1', 'b2']],
      colHeaders: true,
      nestedHeaders: [
        [{ label: 'A', colspan: 2 }, { label: 'B', colspan: 2 }],
        ['a1', 'a2', 'b1', 'b2'],
      ],
      manualColumnMove: true,
    });

    getPlugin('manualColumnMove').moveColumn(0, 3); // visual order: a2, b1, b2, a1
    await render();

    // A batched insert emits its cache update on resume; the physical index read at afterCreateCol
    // time must still translate correctly so the header stays over its data.
    hot().batch(() => {
      hot().alter('insert_col_start', 0, 1);
    });
    await render();

    expect(getDataAtCell(0, 1)).toBe('a2');
    expect(getDataAtCell(0, 4)).toBe('a1');
    expect(getCell(-1, 4).textContent).toBe('a1');
  });

  it('should keep a moved collapsed group coherent when an unrelated column is removed (#4150)', async() => {
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

    expect(getPlugin('collapsibleColumns').getCollapsedColumns()).toEqual([1]); // GA collapsed, physical a2 hidden

    getPlugin('manualColumnMove').moveColumn(4, 0); // move "C" to the front; GA stays intact + collapsed
    await render();

    expect(getDataAtCell(0, 0)).toBe('cc');
    expect(getPlugin('collapsibleColumns').getCollapsedColumns()).toEqual([1]);

    await alter('remove_col', 0, 1); // remove the (front) unrelated "C" column

    // GA stays collapsed (physical a2 still hidden) and its label sits over its data at the new front.
    expect(getDataAtCell(0, 0)).toBe('a1');
    expect(getPlugin('collapsibleColumns').getCollapsedColumns()).toEqual([1]);
    expect(getCell(-2, 0).textContent).toBe('GA+');
  });

  it('should release a collapsed group when an unrelated column is moved into the middle of its span (#4150)', async() => {
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

    expect(hot().columnIndexMapper.getRenderableIndexesLength()).toBe(4); // GA collapsed: a2 hidden

    // Move "C" into the middle of collapsed GA (between a1 and a2). The move splits GA by insertion;
    // without the pre-expand, a2 would stay hidden with no indicator left to restore it (unrecoverable).
    getPlugin('manualColumnMove').moveColumn(4, 1);
    await render();

    expect(hot().columnIndexMapper.getRenderableIndexesLength()).toBe(5);
    expect(getPlugin('collapsibleColumns').getCollapsedColumns()).toEqual([]);
  });

  it('should still adopt a column dropped into a collapsed cohesive group after the auto-expand (#4150)', async() => {
    handsontable({
      data: [['a1', 'a2', 'b1', 'b2', 'cc'], ['a1', 'a2', 'b1', 'b2', 'cc']],
      colHeaders: true,
      nestedHeaders: [
        [{ label: 'GA', colspan: 2 }, { label: 'GB', colspan: 2 }, 'C'], // GA/GB default to cohesive
        ['a1', 'a2', 'b1', 'b2', 'cc'],
      ],
      collapsibleColumns: true,
      manualColumnMove: true,
    });

    getPlugin('collapsibleColumns').toggleCollapsibleSection([{ row: -2, col: 0 }], 'collapse');
    await render();

    expect(getPlugin('collapsibleColumns').getCollapsedColumns()).toEqual([1]); // GA collapsed: a2 hidden

    // Move "C" into the middle of the collapsed cohesive GA (between a1 and a2). The insertion splits GA,
    // so CollapsibleColumns auto-expands it from its own beforeColumnMove handler - that expansion fires a
    // synchronous (hidden-only) cacheUpdated before the move runs. NestedHeaders must not drop the captured
    // move on that intermediate update, or the adoption is silently lost and GA splits instead.
    getPlugin('manualColumnMove').moveColumn(4, 1);
    await render();

    // Precondition: the auto-expand fired (otherwise this test would not exercise the collision at all).
    expect(getPlugin('collapsibleColumns').getCollapsedColumns()).toEqual([]);

    // Outcome: GA adopted "C" and stays a single banner spanning three columns; GB is untouched.
    // (Collapsible group headers append an expand/collapse indicator, so match the label with `toContain`;
    // the colspan is the discriminating membership check - the lost-adoption bug splits GA to colspan 1.)
    expect(getCell(-2, 0).textContent).toContain('GA');
    expect(getCell(-2, 0).colSpan).toBe(3);
    expect(getCell(-2, 3).textContent).toContain('GB');
    expect(getCell(-2, 3).colSpan).toBe(2);
    // The leaf labels follow the data: a1, cc (C's leaf), a2, then GB's members.
    expect(getCell(-1, 0).textContent).toBe('a1');
    expect(getCell(-1, 1).textContent).toBe('cc');
    expect(getCell(-1, 2).textContent).toBe('a2');
  });

  it('should not re-parent a stale move capture when a freeze reorders columns after a vetoed move (#4150)', async() => {
    handsontable({
      data: createSpreadsheetData(2, 3),
      colHeaders: true,
      nestedHeaders: [
        ['X', { label: 'G', colspan: 2 }], // G is cohesive (default)
        ['x', 'g1', 'g2'],
      ],
      manualColumnMove: true,
      manualColumnFreeze: true,
      // A handler that vetoes every move - this captures the moved columns in NestedHeaders but never
      // performs the move, leaving the capture stale.
      beforeColumnMove: () => false,
    });

    // Attempt to move "x" (physical 0) into G. The veto aborts the move, but the capture is set.
    getPlugin('manualColumnMove').moveColumn(0, 2);
    await render();

    // A freeze calls moveIndexes directly (it skips beforeColumnMove). Freezing "g2" moves it to the
    // front, so "x" lands between the two G columns. A stale-capture re-parent would wrongly adopt "x"
    // into G; the capture must be rejected because it does not explain this reordering.
    getPlugin('manualColumnFreeze').freezeColumn(2);
    await render();

    // Visual order is now g2, x, g1. "x" stays standalone - G renders as two separate "G" banners.
    expect(getCell(-1, 1).textContent).toBe('x');
    expect(getCell(-2, 1).textContent).toBe('X');
    expect(getCell(-2, 1).colSpan).toBe(1);
    expect(getCell(-2, 0).textContent).toBe('G');
    expect(getCell(-2, 0).colSpan).toBe(1);
  });

  it('should preserve the column move and apply it to a new nestedHeaders config set via updateSettings (#4150)', async() => {
    handsontable({
      data: createSpreadsheetData(2, 4), // row 0: A1, B1, C1, D1
      colHeaders: true,
      rowHeaders: true,
      nestedHeaders: [
        [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }],
        ['Street', 'City', 'Revenue', 'Profit'],
      ],
      manualColumnMove: true,
    });

    getPlugin('manualColumnMove').moveColumn(0, 3); // visual data order: B1, C1, D1, A1
    await render();

    expect(getCell(-1, 3).textContent).toBe('Street');

    // updateSettings with an UNRELATED setting (rowHeaders) AND a brand-new nestedHeaders config.
    await updateSettings({
      rowHeaders: false,
      nestedHeaders: [
        [{ label: 'Group1', colspan: 2 }, { label: 'Group2', colspan: 2 }],
        ['Aaa', 'Bbb', 'Ccc', 'Ddd'],
      ],
    });

    // The move is preserved: the data column order is unchanged after updateSettings.
    expect(getDataAtCell(0, 0)).toBe('B1');
    expect(getDataAtCell(0, 3)).toBe('A1');

    // The new leaf labels follow the moved data (authored 'Aaa' is physical col 0, now at visual 3).
    expect(getCell(-1, 0).textContent).toBe('Bbb');
    expect(getCell(-1, 3).textContent).toBe('Aaa');

    // The new "Group1" (authored cols 0-1) is split by the move; "Group2" (authored cols 2-3) stays intact.
    expect(getCell(-2, 0).textContent).toBe('Group1');
    expect(getCell(-2, 1).textContent).toBe('Group2');
    expect(getCell(-2, 3).textContent).toBe('Group1');
  });

  it('should show the grab cursor on a selected nested group header, not only the leaf (#4150)', async() => {
    handsontable({
      data: createSpreadsheetData(3, 4),
      colHeaders: true,
      nestedHeaders: [
        [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }],
        ['Street', 'City', 'Revenue', 'Profit'],
      ],
      manualColumnMove: true,
    });

    const groupHeader = getCell(-2, 0); // "Address" group, spanning columns 0-1

    $(groupHeader).simulate('mousedown');
    $(groupHeader).simulate('mouseup');
    $(groupHeader).simulate('mouseover');

    // The group moves as a unit, so its whole header band shows the grab cursor - not just the leaf row.
    expect($(groupHeader).css('cursor')).toEqual('grab');
    expect($(getCell(-1, 0)).css('cursor')).toEqual('grab'); // leaf under the selected group

    // A header outside the selection keeps the default cursor.
    expect($(getCell(-2, 2)).css('cursor')).toEqual('default'); // "Finance" group
  });
});
