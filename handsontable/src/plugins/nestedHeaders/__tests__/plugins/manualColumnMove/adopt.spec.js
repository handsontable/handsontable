describe('NestedHeaders cooperation with ManualColumnMove - columnDropMode: \'adopt\' (cohesive, the default)', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should adopt a column moved into a cohesive (default) group as a child (#4150)', async() => {
    handsontable({
      data: createSpreadsheetData(2, 4),
      colHeaders: true,
      nestedHeaders: [
        [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }], // default columnDropMode: 'adopt'
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
