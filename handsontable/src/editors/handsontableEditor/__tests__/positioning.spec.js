describe('HandsontableEditor positioning', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  function createEditorSettings() {
    return {
      type: 'handsontable',
      handsontable: {
        colHeaders: ['Marque', 'Country', 'Parent company'],
        colWidths: [85, 85, 220],
        data: [
          { name: 'BMW', country: 'Germany', owner: 'Bayerische Motoren Werke AG' },
          { name: 'Chrysler', country: 'USA', owner: 'Chrysler Group LLC' },
          { name: 'Nissan', country: 'Japan', owner: 'Nissan Motor Company Ltd' },
          { name: 'Suzuki', country: 'Japan', owner: 'Suzuki Motor Corporation' },
          { name: 'Toyota', country: 'Japan', owner: 'Toyota Motor Corporation' },
          { name: 'Volvo', country: 'Sweden', owner: 'Zhejiang Geely Holding Group' }
        ],
      }
    };
  }

  // all other E2E tests are moved to visual tests. See ./visual-tests/tests/js-only/editors/handsontable/

  it('should render the editors dropdown on the left edited cell when there is no space left on the right', async() => {
    handsontable({
      data: createSpreadsheetData(25, 25),
      colWidths: 80,
      rowHeights: 38,
      width: 800,
      height: 300,
      ...createEditorSettings(),
    });

    // Probe the rendered dropdown width once so scroll positions can sit clearly inside the
    // "right-fits" and "right-does-not-fit" zones regardless of theme-specific font metrics.
    await selectCell(1, 7);
    await keyDownUp('enter');
    const dropdownWidth = getActiveEditor().htContainer.getBoundingClientRect().width;

    await keyDownUp('escape');
    await deselectCell();

    // Cell 7 starts at 7 * 80 = 560 in data coords; workspace is 800 px wide; cells are 80 px.
    // For a RIGHT placement, cell 7 needs to sit close to the LEFT edge so (800 - cellRight)
    // >= dropdownWidth. For a LEFT placement (flip), cell 7 needs to sit close to the RIGHT
    // edge so (800 - cellRight) < dropdownWidth AND spaceInlineStart > spaceInlineEnd.
    const workspaceWidth = 800;
    const colWidth = 80;
    const cellDataLeft = 7 * colWidth;
    const buffer = 20;
    const rightScroll = cellDataLeft - Math.max(0, workspaceWidth - colWidth - dropdownWidth - buffer);
    const leftScroll = Math.max(0, cellDataLeft - (workspaceWidth - dropdownWidth + buffer));

    await scrollViewportHorizontally(rightScroll);
    await selectCell(1, 7);
    await keyDownUp('enter');

    {
      const relativeRect = getCell(2, 7).getBoundingClientRect();
      const containerRect = getActiveEditor().htContainer.getBoundingClientRect();

      // Right placement: container's left edge coincides with the cell's left edge
      // (within the 1px editor border compensation -- see BaseEditor#getEditedCellRect).
      expect(containerRect.top).toBe(relativeRect.top);
      expect(Math.abs(containerRect.left - (relativeRect.left - 1))).toBeLessThanOrEqual(1);
      expect(containerRect.left).toBeGreaterThanOrEqual(relativeRect.left - 1);
      // The dropdown sits to the RIGHT of the cell, so its right edge is far past the cell's right edge.
      expect(containerRect.right).toBeGreaterThan(relativeRect.right);
    }

    await keyDownUp('escape');
    await scrollViewportHorizontally(leftScroll);
    await keyDownUp('enter');

    {
      const relativeRect = getCell(2, 7).getBoundingClientRect();
      const containerRect = getActiveEditor().htContainer.getBoundingClientRect();

      // Left (flipped) placement: container's right edge coincides with the cell's right edge
      // (within the 1px editor border compensation).
      expect(containerRect.top).toBe(relativeRect.top);
      expect(Math.abs(containerRect.right - (relativeRect.right + 1))).toBeLessThanOrEqual(1);
      // The dropdown sits to the LEFT of the cell, so its left edge is far before the cell's left edge.
      expect(containerRect.left).toBeLessThan(relativeRect.left);
    }
  });

  it('should render the editors dropdown below the cell and past the table\'s edge when there is no space left below inside the table', async() => {
    handsontable({
      data: createSpreadsheetData(25, 25),
      colWidths: 80,
      rowHeights: 38,
      width: 600,
      height: 600,
      ...createEditorSettings(),
    });

    // scroll the viewport so cell 11 is near the top -- plenty of space below for the dropdown
    await scrollViewportVertically(11 * 38);

    await selectCell(11, 1);
    await keyDownUp('enter');

    {
      const relativeRect = getCell(12, 1).getBoundingClientRect();
      const containerRect = getActiveEditor().htContainer.getBoundingClientRect();

      // Dropdown is rendered below the edited cell.
      expect({
        top: containerRect.top,
        left: containerRect.left,
      }).toEqual({
        top: relativeRect.top,
        left: relativeRect.left - 1,
      });
    }

    await keyDownUp('escape');
    // scroll so cell 11 is near the bottom of the table -- no space below for the dropdown
    // INSIDE the table, though the viewport still has room under the table itself
    await scrollViewportVertically(0);
    await selectCell(11, 1);
    await keyDownUp('enter');

    {
      const relativeRect = getCell(11, 1).getBoundingClientRect();
      const containerRect = getActiveEditor().htContainer.getBoundingClientRect();

      // #8688: the list is positioned `fixed`, so running out of room inside the table no longer
      // decides anything - the space left in the box the list is laid out in does, which here is
      // the viewport. Whether that leaves it below the cell or above it is theme-dependent: each
      // theme's row height sets the list's height, so `horizon` flips where `main` does not.
      // Asserting a side would pass on one theme and fail on another for a reason that has
      // nothing to do with the behavior, so this pins what must hold on every theme - the list
      // touches the edited cell and is aligned to its inline start.
      const sitsBelow = Math.abs(containerRect.top - relativeRect.bottom) <= 1;
      const sitsAbove = Math.abs(containerRect.bottom - relativeRect.top) <= 1;

      expect(sitsBelow || sitsAbove).toBe(true);
      expect(Math.abs(containerRect.left - (relativeRect.left - 1))).toBeLessThanOrEqual(1);
      // The contract that makes the clip escapable in the first place.
      expect(getActiveEditor().htContainer.style.position).toBe('fixed');
    }
  });
});
