describe('NestedHeaders cooperation with ManualColumnMove - columnDropMode: \'split\'', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should split a group in split mode when a column is moved out (#4150)', async() => {
    handsontable({
      data: createSpreadsheetData(2, 4),
      colHeaders: true,
      nestedHeaders: [
        [{ label: 'Address', colspan: 2, columnDropMode: 'split' }, { label: 'Finance', colspan: 2 }],
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

  it('should adopt into a cohesive inner group and grow its splitting outer group, not crash (3-level, #4150)', async() => {
    handsontable({
      data: createSpreadsheetData(2, 6),
      colHeaders: true,
      nestedHeaders: [
        [{ label: 'P', colspan: 3, columnDropMode: 'split' }, { label: 'Q', colspan: 3, columnDropMode: 'split' }],
        [{ label: 'Pg', colspan: 2 }, 'Ps', 'Qs', { label: 'Qg', colspan: 2 }],
        ['a', 'b', 'c', 'd', 'e', 'f'],
      ],
      manualColumnMove: true,
    });

    // "f" (authored under Qg/Q) dropped strictly inside the cohesive inner group Pg. Pg adopts it,
    // and the splitting outer group P grows to contain it - the inner run never straddles the P|Q
    // boundary (which previously crashed buildTree).
    getPlugin('manualColumnMove').moveColumn(5, 1);
    await render();

    expect(getCell(-1, 1).textContent).toBe('f'); // leaf follows the data
    expect(getCell(-2, 0).textContent).toBe('Pg'); // adopted into the cohesive inner group
    expect(getCell(-2, 0).colSpan).toBe(3); // Pg grew to span a, f, b
    expect(getCell(-3, 0).textContent).toBe('P'); // the splitting outer group contains it
    expect(getCell(-3, 0).colSpan).toBe(4); // P grew to span a, f, b, c
  });

  it('should restore a single-column group label after its column is adopted then moved out (#4150)', async() => {
    handsontable({
      data: createSpreadsheetData(2, 6),
      colHeaders: true,
      nestedHeaders: [
        [{ label: 'Personal', colspan: 3 }, { label: 'Work', colspan: 3, columnDropMode: 'split' }],
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
        [{ label: 'Personal', colspan: 3 }, { label: 'Work', colspan: 3, columnDropMode: 'split' }],
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
    expect(capturedDropIndex).toBe(6);
    // "Title" is back at the end; Company's two columns stay adjacent (intact, not split).
    expect(hot().columnIndexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4, 5]);
  });
});
