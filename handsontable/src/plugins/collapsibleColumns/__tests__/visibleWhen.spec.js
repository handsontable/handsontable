describe('CollapsibleColumns visibleWhen option', () => {
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

  // The label of every header in the bottom (cell-adjacent) header row that is actually rendered.
  function bottomHeaderLabels() {
    const thead = spec().$container.find('.ht_clone_top thead')[0];
    const rows = thead.querySelectorAll('tr');
    const lastRow = rows[rows.length - 1];

    return Array.from(lastRow.querySelectorAll('th'))
      .map((th) => {
        const colHeader = th.querySelector('.colHeader');

        return colHeader ? colHeader.textContent.trim() : '';
      })
      .filter(label => label !== '');
  }

  // Number of columns that are not hidden by any source (collapse, visibleWhen, HiddenColumns).
  function visibleColumnsCount() {
    let count = 0;

    for (let column = 0; column < countCols(); column++) {
      if (!columnIndexMapper().isHidden(hot().toPhysicalColumn(column))) {
        count += 1;
      }
    }

    return count;
  }

  function collapseGroupB() {
    getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 1 });
  }

  function expandGroupB() {
    getPlugin('collapsibleColumns').expandSection({ row: -2, col: 1 });
  }

  function hasCollapsedIndicator() {
    return spec().$container.find('.ht_clone_top thead .collapsibleIndicator.collapsed').length > 0;
  }

  it('should hide a `visibleWhen: "collapsed"` column while the group is expanded', async() => {
    handsontable({
      data: createSpreadsheetData(3, 6),
      colHeaders: true,
      rowHeaders: true,
      nestedHeaders: [
        ['A', { label: 'Group B', colspan: 4 }, 'C'],
        ['A',
          { label: 'B1', visibleWhen: 'expanded' },
          { label: 'B2', visibleWhen: 'expanded' },
          { label: 'B3', visibleWhen: 'expanded' },
          { label: 'Total', visibleWhen: 'collapsed' },
          'C'],
      ],
      collapsibleColumns: true,
    });

    // The group starts expanded, so the collapsed-only "Total" column is hidden.
    expect(bottomHeaderLabels()).toEqual(['A', 'B1', 'B2', 'B3', 'C']);
    expect(visibleColumnsCount()).toBe(5);
  });

  it('should show only the columns visible when collapsed (the chosen column), then restore on expand', async() => {
    handsontable({
      data: createSpreadsheetData(3, 6),
      colHeaders: true,
      rowHeaders: true,
      nestedHeaders: [
        ['A', { label: 'Group B', colspan: 4 }, 'C'],
        ['A',
          { label: 'B1', visibleWhen: 'expanded' },
          { label: 'B2', visibleWhen: 'expanded' },
          { label: 'B3', visibleWhen: 'always' }, // the chosen column to keep when collapsed
          { label: 'B4', visibleWhen: 'expanded' },
          'C'],
      ],
      collapsibleColumns: true,
    });

    expect(bottomHeaderLabels()).toEqual(['A', 'B1', 'B2', 'B3', 'B4', 'C']);
    expect(visibleColumnsCount()).toBe(6);

    collapseGroupB();
    await render();

    // Only the chosen `always` column (B3) stays visible under Group B.
    expect(bottomHeaderLabels()).toEqual(['A', 'B3', 'C']);
    expect(visibleColumnsCount()).toBe(3);
    expect(hasCollapsedIndicator()).toBe(true);

    expandGroupB();
    await render();

    expect(bottomHeaderLabels()).toEqual(['A', 'B1', 'B2', 'B3', 'B4', 'C']);
    expect(visibleColumnsCount()).toBe(6);
  });

  it('should show a `visibleWhen: "collapsed"` summary column only while collapsed', async() => {
    handsontable({
      data: createSpreadsheetData(3, 6),
      colHeaders: true,
      rowHeaders: true,
      nestedHeaders: [
        ['A', { label: 'Group B', colspan: 4 }, 'C'],
        ['A',
          { label: 'B1', visibleWhen: 'expanded' },
          { label: 'B2', visibleWhen: 'expanded' },
          { label: 'B3', visibleWhen: 'expanded' },
          { label: 'Total', visibleWhen: 'collapsed' },
          'C'],
      ],
      collapsibleColumns: true,
    });

    expect(bottomHeaderLabels()).toEqual(['A', 'B1', 'B2', 'B3', 'C']);

    collapseGroupB();
    await render();

    // The expanded-only columns collapse away and the summary column appears.
    expect(bottomHeaderLabels()).toEqual(['A', 'Total', 'C']);
    expect(visibleColumnsCount()).toBe(3);

    expandGroupB();
    await render();

    expect(bottomHeaderLabels()).toEqual(['A', 'B1', 'B2', 'B3', 'C']);
  });

  it('should stay stable across repeated collapse/expand cycles', async() => {
    handsontable({
      data: createSpreadsheetData(3, 6),
      colHeaders: true,
      rowHeaders: true,
      nestedHeaders: [
        ['A', { label: 'Group B', colspan: 4 }, 'C'],
        ['A',
          { label: 'B1', visibleWhen: 'expanded' },
          { label: 'B2', visibleWhen: 'expanded' },
          { label: 'B3', visibleWhen: 'always' },
          { label: 'B4', visibleWhen: 'expanded' },
          'C'],
      ],
      collapsibleColumns: true,
    });

    for (let cycle = 0; cycle < 3; cycle++) {
      collapseGroupB();
      await render(); // eslint-disable-line no-await-in-loop

      expect(bottomHeaderLabels()).toEqual(['A', 'B3', 'C']);

      expandGroupB();
      await render(); // eslint-disable-line no-await-in-loop

      expect(bottomHeaderLabels()).toEqual(['A', 'B1', 'B2', 'B3', 'B4', 'C']);
    }
  });

  it('should treat an invalid `visibleWhen` value as unset (hidden on collapse, the default)', async() => {
    handsontable({
      data: createSpreadsheetData(3, 6),
      colHeaders: true,
      rowHeaders: true,
      nestedHeaders: [
        ['A', { label: 'Group B', colspan: 4 }, 'C'],
        ['A',
          { label: 'B1', visibleWhen: 'always' },
          { label: 'B2', visibleWhen: 'nonsense' }, // invalid -> unset -> default 'expanded'
          'B3',
          { label: 'B4', visibleWhen: 'expanded' },
          'C'],
      ],
      collapsibleColumns: true,
    });

    collapseGroupB();
    await render();

    // B2's invalid value is ignored (treated as the default 'expanded'), so it hides on collapse
    // like the unset B3 and the explicit B4; only the `always` column (B1) stays.
    expect(bottomHeaderLabels()).toEqual(['A', 'B1', 'C']);
  });

  it('should hide unmarked siblings on collapse and keep the single `always` column', async() => {
    handsontable({
      data: createSpreadsheetData(3, 6),
      colHeaders: true,
      rowHeaders: true,
      nestedHeaders: [
        ['A', { label: 'Group B', colspan: 4 }, 'C'],
        // Only B3 is marked; B1, B2, B4 are unmarked and default to 'expanded' (hidden on collapse).
        ['A', 'B1', 'B2', { label: 'B3', visibleWhen: 'always' }, 'B4', 'C'],
      ],
      collapsibleColumns: true,
    });

    expect(bottomHeaderLabels()).toEqual(['A', 'B1', 'B2', 'B3', 'B4', 'C']);

    collapseGroupB();
    await render();

    // A single `always` marker is enough: the unmarked siblings collapse away, leaving only B3.
    expect(bottomHeaderLabels()).toEqual(['A', 'B3', 'C']);
    expect(hasCollapsedIndicator()).toBe(true);

    expandGroupB();
    await render();

    expect(bottomHeaderLabels()).toEqual(['A', 'B1', 'B2', 'B3', 'B4', 'C']);
  });

  it('should keep the first column (and its collapse button) visible when every column would hide', async() => {
    handsontable({
      data: createSpreadsheetData(3, 6),
      colHeaders: true,
      rowHeaders: true,
      nestedHeaders: [
        ['A', { label: 'Group B', colspan: 4 }, 'C'],
        ['A',
          { label: 'B1', visibleWhen: 'expanded' },
          { label: 'B2', visibleWhen: 'expanded' },
          { label: 'B3', visibleWhen: 'expanded' },
          { label: 'B4', visibleWhen: 'expanded' },
          'C'],
      ],
      collapsibleColumns: true,
    });

    collapseGroupB();
    await render();

    // Every child is `expanded` (hidden on collapse); the guard keeps the first one so the group
    // never blanks out and stays expandable.
    expect(bottomHeaderLabels()).toEqual(['A', 'B1', 'C']);
    expect(hasCollapsedIndicator()).toBe(true);

    // The kept indicator can still expand the group back.
    expandGroupB();
    await render();

    expect(bottomHeaderLabels()).toEqual(['A', 'B1', 'B2', 'B3', 'B4', 'C']);
  });

  it('should keep the legacy first-child collapse for a group without any `visibleWhen` markers', async() => {
    handsontable({
      data: createSpreadsheetData(3, 6),
      colHeaders: true,
      rowHeaders: true,
      nestedHeaders: [
        ['A', { label: 'Group B', colspan: 4 }, 'C'],
        ['A', 'B1', 'B2', 'B3', 'B4', 'C'],
      ],
      collapsibleColumns: true,
    });

    collapseGroupB();
    await render();

    // No markers -> the first child (B1) stays, exactly as before this feature.
    expect(bottomHeaderLabels()).toEqual(['A', 'B1', 'C']);
  });

  it('should union the `visibleWhen` hidden set with HiddenColumns', async() => {
    handsontable({
      data: createSpreadsheetData(3, 6),
      colHeaders: true,
      rowHeaders: true,
      nestedHeaders: [
        ['A', { label: 'Group B', colspan: 4 }, 'C'],
        ['A',
          { label: 'B1', visibleWhen: 'expanded' },
          { label: 'B2', visibleWhen: 'always' },
          { label: 'B3', visibleWhen: 'always' },
          { label: 'B4', visibleWhen: 'expanded' },
          'C'],
      ],
      collapsibleColumns: true,
      hiddenColumns: { columns: [2] }, // hide B2 externally
    });

    collapseGroupB();
    await render();

    // B1/B4 hidden by collapse, B2 hidden by HiddenColumns, only B3 remains.
    expect(bottomHeaderLabels()).toEqual(['A', 'B3', 'C']);
  });

  it('should preserve a declarative collapse when columns are inserted nearby', async() => {
    handsontable({
      data: createSpreadsheetData(3, 6),
      colHeaders: true,
      rowHeaders: true,
      nestedHeaders: [
        ['A', { label: 'Group B', colspan: 4 }, 'C'],
        ['A',
          { label: 'B1', visibleWhen: 'expanded' },
          { label: 'B2', visibleWhen: 'expanded' },
          { label: 'B3', visibleWhen: 'always' },
          { label: 'B4', visibleWhen: 'expanded' },
          'C'],
      ],
      collapsibleColumns: true,
    });

    collapseGroupB();
    await render();
    expect(bottomHeaderLabels()).toEqual(['A', 'B3', 'C']);

    // Insert a column to the left of the group; the declarative collapse must survive the rebuild.
    await alter('insert_col_start', 0, 1);

    expect(getPlugin('nestedHeaders').getStateManager().getHeaderTreeNodeData(-2, 2).isCollapsed).toBe(true);
    expect(bottomHeaderLabels()).toEqual(['A', 'B3', 'C']);
  });

  it('should preserve a declarative collapse across an unrelated updateSettings call', async() => {
    handsontable({
      data: createSpreadsheetData(3, 6),
      colHeaders: true,
      rowHeaders: true,
      nestedHeaders: [
        ['A', { label: 'Group B', colspan: 4 }, 'C'],
        ['A',
          { label: 'B1', visibleWhen: 'expanded' },
          { label: 'B2', visibleWhen: 'expanded' },
          { label: 'B3', visibleWhen: 'always' },
          { label: 'B4', visibleWhen: 'expanded' },
          'C'],
      ],
      collapsibleColumns: true,
    });

    collapseGroupB();
    await render();
    expect(bottomHeaderLabels()).toEqual(['A', 'B3', 'C']);

    await updateSettings({ collapsibleColumns: true });

    // The collapse (driven by the persisted `isCollapsed`) survives the settings rebuild.
    expect(bottomHeaderLabels()).toEqual(['A', 'B3', 'C']);
  });

  it('should apply `visibleWhen` markers introduced by updateSettings', async() => {
    handsontable({
      data: createSpreadsheetData(3, 6),
      colHeaders: true,
      rowHeaders: true,
      nestedHeaders: [
        ['A', { label: 'Group B', colspan: 4 }, 'C'],
        ['A', 'B1', 'B2', 'B3', 'B4', 'C'],
      ],
      collapsibleColumns: true,
    });

    // Without markers the legacy first-child rule applies.
    collapseGroupB();
    await render();
    expect(bottomHeaderLabels()).toEqual(['A', 'B1', 'C']);

    expandGroupB();
    await render();

    // Add `visibleWhen` markers at runtime.
    await updateSettings({
      nestedHeaders: [
        ['A', { label: 'Group B', colspan: 4 }, 'C'],
        ['A',
          { label: 'B1', visibleWhen: 'expanded' },
          { label: 'B2', visibleWhen: 'expanded' },
          { label: 'B3', visibleWhen: 'always' },
          { label: 'B4', visibleWhen: 'expanded' },
          'C'],
      ],
    });

    collapseGroupB();
    await render();

    // Now the declarative rule keeps the chosen column (B3) instead of the first child.
    expect(bottomHeaderLabels()).toEqual(['A', 'B3', 'C']);
  });

  it('should react to changed `visibleWhen` markers set by updateSettings', async() => {
    handsontable({
      data: createSpreadsheetData(3, 6),
      colHeaders: true,
      rowHeaders: true,
      nestedHeaders: [
        ['A', { label: 'Group B', colspan: 4 }, 'C'],
        ['A',
          { label: 'B1', visibleWhen: 'expanded' },
          { label: 'B2', visibleWhen: 'expanded' },
          { label: 'B3', visibleWhen: 'always' },
          { label: 'B4', visibleWhen: 'expanded' },
          'C'],
      ],
      collapsibleColumns: true,
    });

    collapseGroupB();
    await render();
    expect(bottomHeaderLabels()).toEqual(['A', 'B3', 'C']);

    // Move the chosen column from B3 to B2 via updateSettings. Replacing `nestedHeaders` rebuilds
    // the header structure from scratch, so the group reopens; collapsing again applies the new
    // markers.
    await updateSettings({
      nestedHeaders: [
        ['A', { label: 'Group B', colspan: 4 }, 'C'],
        ['A',
          { label: 'B1', visibleWhen: 'expanded' },
          { label: 'B2', visibleWhen: 'always' },
          { label: 'B3', visibleWhen: 'expanded' },
          { label: 'B4', visibleWhen: 'expanded' },
          'C'],
      ],
    });

    expect(bottomHeaderLabels()).toEqual(['A', 'B1', 'B2', 'B3', 'B4', 'C']);

    collapseGroupB();
    await render();

    // Now the collapse keeps B2 (the new `always` column) instead of B3.
    expect(bottomHeaderLabels()).toEqual(['A', 'B2', 'C']);
  });

  it('should move the selection off a `visibleWhen: "collapsed"` column when the group expands', async() => {
    handsontable({
      data: createSpreadsheetData(3, 6),
      colHeaders: true,
      rowHeaders: true,
      nestedHeaders: [
        ['A', { label: 'Group B', colspan: 4 }, 'C'],
        ['A',
          { label: 'B1', visibleWhen: 'expanded' },
          { label: 'B2', visibleWhen: 'expanded' },
          { label: 'B3', visibleWhen: 'expanded' },
          { label: 'Total', visibleWhen: 'collapsed' },
          'C'],
      ],
      collapsibleColumns: true,
    });

    collapseGroupB();
    await render();
    expect(bottomHeaderLabels()).toEqual(['A', 'Total', 'C']);

    // Select a cell under the summary "Total" column (visual column 4) - visible only while collapsed.
    await selectCell(0, 4);
    expect(getSelectedLast()).toEqual([0, 4, 0, 4]);

    expandGroupB();
    await render();

    // Expanding hides "Total" again; the selection must not linger on the now-hidden column - it
    // moves to the nearest visible column to the right (C, visual column 5).
    expect(columnIndexMapper().isHidden(hot().toPhysicalColumn(4))).toBe(true);
    expect(getSelectedLast()).toEqual([0, 5, 0, 5]);
  });

  it('should resolve a non-anchor in-span column to its owning group (collapse and expand)', async() => {
    handsontable({
      data: createSpreadsheetData(3, 6),
      colHeaders: true,
      rowHeaders: true,
      nestedHeaders: [
        ['A', { label: 'Group B', colspan: 4 }, 'C'],
        ['A',
          { label: 'B1', visibleWhen: 'expanded' },
          { label: 'B2', visibleWhen: 'expanded' },
          { label: 'B3', visibleWhen: 'expanded' },
          { label: 'Total', visibleWhen: 'collapsed' },
          'C'],
      ],
      collapsibleColumns: true,
    });

    // Collapsing through a non-anchor in-span column (B3, visual column 3) collapses the whole group.
    getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 3 });
    await render();
    expect(bottomHeaderLabels()).toEqual(['A', 'Total', 'C']);
    expect(hasCollapsedIndicator()).toBe(true);

    // While collapsed the group's anchor (B1, column 1) is hidden, so the indicator renders on the
    // visible representative ("Total", column 4). Expanding through that non-anchor column restores
    // the group - this mirrors clicking the relocated indicator.
    getPlugin('collapsibleColumns').expandSection({ row: -2, col: 4 });
    await render();
    expect(bottomHeaderLabels()).toEqual(['A', 'B1', 'B2', 'B3', 'C']);
  });
});
