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
      // splittable: true opts into the split model - a torn group renders as same-label banners
      // (the default is now cohesive: a moved-out column is released, see the 'splittable option' tests).
      nestedHeaders: [
        [{ label: 'Address', colspan: 2, splittable: true }, { label: 'Finance', colspan: 2, splittable: true }],
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
      nestedHeaders: [ // splittable: true opts into the split model (default is now cohesive)
        [{ label: 'Address', colspan: 2, splittable: true }, { label: 'Finance', colspan: 2, splittable: true }],
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
      nestedHeaders: [ // splittable: true opts into the split model (default is now cohesive)
        [{ label: 'A', colspan: 2, splittable: true }, { label: 'B', colspan: 2, splittable: true }],
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

  describe('splittable option', () => {
    it('should adopt a column moved into a cohesive (default) group as a child (#4150)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 4),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }], // default splittable: false
          ['Street', 'City', 'Revenue', 'Profit'],
        ],
        manualColumnMove: true,
      });

      getPlugin('manualColumnMove').moveColumn(2, 1); // "Revenue" into Address, between Street and City
      await render();

      // Address stays one banner, now spanning 3 columns (it adopted Revenue); Finance covers the last.
      expect(getCell(-2, 0).textContent).toBe('Address');
      expect(getCell(-2, 0).colSpan).toBe(3);
      expect(getCell(-2, 3).textContent).toBe('Finance');
      // The leaf labels follow the data.
      expect(getCell(-1, 0).textContent).toBe('Street');
      expect(getCell(-1, 1).textContent).toBe('Revenue');
      expect(getCell(-1, 2).textContent).toBe('City');
      expect(getCell(-1, 3).textContent).toBe('Profit');
    });

    it('should split a cohesive group and carry its label when a member is moved out (#4150)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 4),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }],
          ['Street', 'City', 'Revenue', 'Profit'],
        ],
        manualColumnMove: true,
      });

      getPlugin('manualColumnMove').moveColumn(0, 3); // "Street" out to the end, past Finance
      await render();

      // A moved-out column keeps its own ancestor label, so Address splits into two same-label banners:
      // one over the remaining City, one over Street at its new position (it is NOT left blank).
      expect(getCell(-1, 3).textContent).toBe('Street'); // leaf follows the data
      expect(getCell(-2, 3).textContent).toBe('Address'); // label travels with the column
      expect(getCell(-2, 0).textContent).toBe('Address'); // over the remaining member, City
      expect(getCell(-2, 0).colSpan).toBe(1);
      expect(getCell(-1, 0).textContent).toBe('City');
    });

    it('should re-parent a column dropped strictly inside another cohesive group (#4150)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 4),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }],
          ['Street', 'City', 'Revenue', 'Profit'],
        ],
        manualColumnMove: true,
      });

      getPlugin('manualColumnMove').moveColumn(0, 2); // "Street" into Finance, between Revenue and Profit
      await render();

      // Street joined Finance (now spans 3); Address shrank to City.
      expect(getCell(-2, 0).textContent).toBe('Address');
      expect(getCell(-2, 0).colSpan).toBe(1);
      expect(getCell(-2, 1).textContent).toBe('Finance');
      expect(getCell(-2, 1).colSpan).toBe(3);
      expect(getCell(-1, 2).textContent).toBe('Street');
    });

    it('should split a `splittable: true` group when a column is moved out (#4150)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 4),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'Address', colspan: 2, splittable: true }, { label: 'Finance', colspan: 2 }],
          ['Street', 'City', 'Revenue', 'Profit'],
        ],
        manualColumnMove: true,
      });

      getPlugin('manualColumnMove').moveColumn(0, 3); // "Street" out to the end
      await render();

      // Address keeps its identity and renders as two same-label banners (the opt-in split behavior).
      expect(getCell(-2, 0).textContent).toBe('Address'); // over City
      expect(getCell(-2, 3).textContent).toBe('Address'); // over Street (the split banner)
      expect(getCell(-1, 3).textContent).toBe('Street');
    });

    it('should keep a whole cohesive group intact when all its columns move together (#4150)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 4),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }],
          ['Street', 'City', 'Revenue', 'Profit'],
        ],
        manualColumnMove: true,
      });

      getPlugin('manualColumnMove').moveColumns([0, 1], 2); // move the whole Address group to the end
      await render();

      expect(getCell(-2, 0).textContent).toBe('Finance');
      expect(getCell(-2, 2).textContent).toBe('Address');
      expect(getCell(-2, 2).colSpan).toBe(2); // stays one intact banner
      expect(getCell(-1, 2).textContent).toBe('Street');
      expect(getCell(-1, 3).textContent).toBe('City');
    });

    it('should restore group membership when a cohesive move is undone and redone (#4150)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 4),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }],
          ['Street', 'City', 'Revenue', 'Profit'],
        ],
        manualColumnMove: true,
      });

      getPlugin('manualColumnMove').moveColumn(2, 1); // Revenue adopted into Address -> Address spans 3
      await render();

      expect(getCell(-2, 0).colSpan).toBe(3);

      getPlugin('undoRedo').undo();
      await render();

      // Undo restores the original membership: Address and Finance each span two columns again.
      expect(getCell(-2, 0).textContent).toBe('Address');
      expect(getCell(-2, 0).colSpan).toBe(2);
      expect(getCell(-2, 2).textContent).toBe('Finance');
      expect(getCell(-2, 2).colSpan).toBe(2);
      expect(getCell(-1, 0).textContent).toBe('Street');

      getPlugin('undoRedo').redo();
      await render();

      // Redo re-applies the adoption.
      expect(getCell(-2, 0).colSpan).toBe(3);
      expect(getCell(-1, 1).textContent).toBe('Revenue');
    });

    it('should adopt a column into an inner cohesive group while the outer group stays whole (3-level, #4150)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 4),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'Top', colspan: 4 }],
          [{ label: 'L', colspan: 2 }, { label: 'R', colspan: 2 }],
          ['a', 'b', 'c', 'd'],
        ],
        manualColumnMove: true,
      });

      getPlugin('manualColumnMove').moveColumn(2, 1); // "c" (under R) into L, between a and b
      await render();

      // The outer group stays one cohesive banner over all four columns.
      expect(getCell(-3, 0).textContent).toBe('Top');
      expect(getCell(-3, 0).colSpan).toBe(4);
      // The inner group L adopted c (spans 3); R shrank to its remaining column.
      expect(getCell(-2, 0).textContent).toBe('L');
      expect(getCell(-2, 0).colSpan).toBe(3);
      expect(getCell(-2, 3).textContent).toBe('R');
      expect(getCell(-2, 3).colSpan).toBe(1);
      // Leaves follow the data.
      expect(getCell(-1, 0).textContent).toBe('a');
      expect(getCell(-1, 1).textContent).toBe('c');
      expect(getCell(-1, 2).textContent).toBe('b');
      expect(getCell(-1, 3).textContent).toBe('d');
    });

    it('should split an inner group carrying its label while the outer group stays whole (3-level, #4150)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 4),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'Top', colspan: 4 }],
          [{ label: 'L', colspan: 2 }, { label: 'R', colspan: 2 }],
          ['a', 'b', 'c', 'd'],
        ],
        manualColumnMove: true,
      });

      getPlugin('manualColumnMove').moveColumn(0, 3); // "a" (under L) out to the end, still inside Top
      await render();

      // Top still covers all four columns - the outer cohesive group is never torn by an inner move.
      expect(getCell(-3, 0).textContent).toBe('Top');
      expect(getCell(-3, 0).colSpan).toBe(4);
      // L splits into two same-label banners; the moved "a" keeps the L label at its new position.
      expect(getCell(-2, 0).textContent).toBe('L');
      expect(getCell(-2, 0).colSpan).toBe(1);
      expect(getCell(-2, 3).textContent).toBe('L'); // label travels with the column, not blank
      expect(getCell(-1, 0).textContent).toBe('b');
      expect(getCell(-1, 3).textContent).toBe('a');
    });

    it('should adopt into a cohesive inner group and grow its splittable outer group, not crash (3-level, #4150)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 6),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'P', colspan: 3, splittable: true }, { label: 'Q', colspan: 3, splittable: true }],
          [{ label: 'Pg', colspan: 2 }, 'Ps', 'Qs', { label: 'Qg', colspan: 2 }],
          ['a', 'b', 'c', 'd', 'e', 'f'],
        ],
        manualColumnMove: true,
      });

      // "f" (authored under Qg/Q) dropped strictly inside the cohesive inner group Pg. Pg adopts it,
      // and the splittable outer group P grows to contain it - the inner run never straddles the P|Q
      // boundary (which previously crashed buildTree).
      getPlugin('manualColumnMove').moveColumn(5, 1);
      await render();

      expect(getCell(-1, 1).textContent).toBe('f'); // leaf follows the data
      expect(getCell(-2, 0).textContent).toBe('Pg'); // adopted into the cohesive inner group
      expect(getCell(-2, 0).colSpan).toBe(3); // Pg grew to span a, f, b
      expect(getCell(-3, 0).textContent).toBe('P'); // the splittable outer group contains it
      expect(getCell(-3, 0).colSpan).toBe(4); // P grew to span a, f, b, c
    });

    it('should restore a single-column group label after its column is adopted then moved out (#4150)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 6),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'Personal', colspan: 3 }, { label: 'Work', colspan: 3, splittable: true }],
          [{ label: 'Name', colspan: 2 }, 'Age', { label: 'Company', colspan: 2 }, 'Role'],
          ['First', 'Last', 'Age', 'Org', 'Dept', 'Title'],
        ],
        manualColumnMove: true,
      });

      // 1) "Title" (the sole column of the single-column group "Role") is dropped strictly inside the
      //    cohesive "Company" group, between Org and Dept - Company adopts it and spans three columns.
      getPlugin('manualColumnMove').moveColumn(5, 4);
      await render();

      expect(getCell(-2, 3).textContent).toBe('Company');
      expect(getCell(-2, 3).colSpan).toBe(3);

      // 2) Now move "Title" back out, between Age and Org (not inside any cohesive group). Its authored
      //    home "Role" is a single-column label, so the label travels with the column instead of being
      //    left as a blank standalone header - the regression being guarded.
      getPlugin('manualColumnMove').moveColumn(4, 3);
      await render();

      expect(getCell(-1, 3).textContent).toBe('Title'); // leaf follows the data
      expect(getCell(-2, 3).textContent).toBe('Role'); // label restored, NOT an empty standalone
      expect(getCell(-2, 3).colSpan).toBe(1);
      // Company shrank back to its two original columns; the outer Work group covers the released column.
      expect(getCell(-2, 4).textContent).toBe('Company');
      expect(getCell(-2, 4).colSpan).toBe(2);
      expect(getCell(-3, 3).textContent).toBe('Work');
      expect(getCell(-3, 3).colSpan).toBe(3);
    });

    it('should drop a column past a collapsed group\'s hidden columns when released at the visible end (#4150)', async() => {
      let capturedDropIndex;

      handsontable({
        data: createSpreadsheetData(2, 6),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'Personal', colspan: 3 }, { label: 'Work', colspan: 3, splittable: true }],
          [{ label: 'Name', colspan: 2 }, 'Age', { label: 'Company', colspan: 2 }, 'Role'],
          ['First', 'Last', 'Age', 'Org', 'Dept', 'Title'],
        ],
        collapsibleColumns: true,
        manualColumnMove: true,
        afterColumnMove(columns, finalIndex, dropIndex) {
          capturedDropIndex = dropIndex;
        },
      });

      // Put "Title" (the single-column group "Role") before "Company", then collapse Company so its
      // second column "Dept" is hidden. The visible end of the table is now "Org" (Company's first
      // column), with the hidden "Dept" sitting right after it.
      getPlugin('manualColumnMove').moveColumn(5, 3);
      await render();
      getPlugin('collapsibleColumns').toggleCollapsibleSection([{ row: -2, col: 4 }], 'collapse');
      await render();

      expect(getPlugin('collapsibleColumns').getCollapsedColumns()).toEqual([4]); // "Dept" (physical 4) hidden

      // Drag "Title" (visual 3) and release at the right edge of "Org" (visual 4) - the visible end.
      const $title = $(getCell(-1, 3));
      const $org = $(getCell(-1, 4));

      $title.simulate('mousedown');
      $title.simulate('mouseup');
      $title.simulate('mousedown');
      $org.simulate('mouseover');
      $org.simulate('mousemove', {
        clientX: $org.offset().left + $org.width(),
      });
      $org.simulate('mouseup');
      await render();

      // The drop skips the hidden "Dept" and lands after the whole group (index 6, the end), instead
      // of between Org and the hidden Dept (index 5) which would wedge Title into Company and split it.
      // The drop skips the hidden "Dept" and lands after the whole group (index 6, the end), instead
      // of between Org and the hidden Dept (index 5) which would wedge Title into Company and split it.
      expect(capturedDropIndex).toBe(6);
      // "Title" is back at the end; Company's two columns stay adjacent (intact, not split).
      expect(hot().columnIndexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it('should adopt a whole group moved as a block into another cohesive group (#4150)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 6),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'Personal', colspan: 3 }, { label: 'Work', colspan: 3 }],
          [{ label: 'Name', colspan: 2 }, 'Age', { label: 'Company', colspan: 2 }, 'Role'],
          ['First', 'Last', 'Age', 'Org', 'Dept', 'Title'],
        ],
        manualColumnMove: true,
      });

      // Move the whole Company group (Org + Dept) into Personal, between Name and Age. Each moved
      // column's neighbor toward the block is its fellow moved column, so the block must be judged
      // against the columns flanking it - Personal adopts the entire block rather than splitting.
      getPlugin('manualColumnMove').moveColumns([3, 4], 2);
      await render();

      // Personal adopts the Company block (spans First, Last, Org, Dept, Age); Work shrinks to Title.
      expect(getCell(-3, 0).textContent).toBe('Personal');
      expect(getCell(-3, 0).colSpan).toBe(5);
      expect(getCell(-3, 5).textContent).toBe('Work');
      expect(getCell(-3, 5).colSpan).toBe(1);
      // Company stays one intact banner (a sub-group) inside Personal.
      expect(getCell(-2, 2).textContent).toBe('Company');
      expect(getCell(-2, 2).colSpan).toBe(2);
      expect(getCell(-1, 2).textContent).toBe('Org');
      expect(getCell(-1, 3).textContent).toBe('Dept');
    });

    it('should keep an adopted column adopted after a no-op move of its group (#4150)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 6),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'Personal', colspan: 3 }, { label: 'Work', colspan: 3 }],
          [{ label: 'Name', colspan: 2 }, 'Age', { label: 'Company', colspan: 2 }, 'Role'],
          ['First', 'Last', 'Age', 'Org', 'Dept', 'Title'],
        ],
        manualColumnMove: true,
      });

      getPlugin('manualColumnMove').moveColumn(5, 4); // "Title" adopted into Company (now spans 3)
      await render();

      expect(getCell(-2, 3).textContent).toBe('Company');
      expect(getCell(-2, 3).colSpan).toBe(3);

      // A no-op move of the whole (now 3-wide) Company group to its own position - what clicking the
      // selected group header triggers - must not recompute membership and drop the adoption.
      getPlugin('manualColumnMove').moveColumns([3, 4, 5], 3);
      await render();

      expect(getCell(-2, 3).textContent).toBe('Company'); // still one banner, not split
      expect(getCell(-2, 3).colSpan).toBe(3); // Title still adopted
      expect(getCell(-1, 4).textContent).toBe('Title');
    });

    it('should hide a column adopted into a cohesive group when that group is collapsed (#4150)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 5),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'Address', colspan: 2, collapsible: true }, { label: 'Finance', colspan: 2 }, 'Extra'],
          ['Street', 'City', 'Revenue', 'Profit', 'Extra'],
        ],
        collapsibleColumns: true,
        manualColumnMove: true,
      });

      getPlugin('manualColumnMove').moveColumn(4, 1); // "Extra" adopted into Address (between Street, City)
      await render();

      expect(getCell(-2, 0).colSpan).toBe(3); // Address adopted Extra

      getPlugin('collapsibleColumns').toggleCollapsibleSection([{ row: -2, col: 0 }], 'collapse');
      await render();

      // Collapsing Address hides its non-first columns - City (physical 1) AND the adopted Extra
      // (physical 4). That the adopted column collapses with the group proves it is a real member.
      expect(getPlugin('collapsibleColumns').getCollapsedColumns().slice().sort((a, b) => a - b)).toEqual([1, 4]);
      expect(hot().columnIndexMapper.getRenderableIndexesLength()).toBe(3);
    });
  });
});
