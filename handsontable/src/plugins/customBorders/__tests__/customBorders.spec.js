describe('CustomBorders', () => {
  const id = 'testContainer';
  const DEFAULT_BORDER = { color: '#000', width: 1 };
  const GREEN_BORDER = { color: 'green', width: 1 };
  const GREEN_THICK_BORDER = { color: 'green', width: 2 };
  const RED_BORDER = { color: 'red', width: 2 };
  const MAGENTA_BORDER = { color: 'magenta', width: 2 };
  const BLUE_BORDER = { color: 'blue', width: 2 };
  const ORANGE_BORDER = { color: 'orange', width: 2 };
  const YELLOW_BORDER = { color: 'yellow', width: 2 };
  const EMPTY = { hide: true };

  const CUSTOM_BORDER_SELECTOR = '.wtBorder:not(.fill, .current, .area)';

  /**
   * Returns number of custom borders in DOM. There are 5 borders per
   * cell (top, left, bottom right, corner), some of which are hidden
   * TODO this seems redundant that we always render borders that are not visible.
   */
  function countCustomBorders() {
    return $(CUSTOM_BORDER_SELECTOR).length;
  }
  /**
   * Returns number of visible custom borders in DOM.
   */
  function countVisibleCustomBorders() {
    return $(`${CUSTOM_BORDER_SELECTOR}:visible`).length;
  }

  /**
   * @param numRows
   */
  function generateCustomBordersForAllRows(numRows) {
    const bordersConfig = [];

    for (let i = 0; i < numRows; i++) {
      const cellBorder = {
        row: i,
        col: 0,
        top: GREEN_BORDER
      };

      bordersConfig.push(cellBorder);
    }

    return bordersConfig;
  }

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    const wrapper = $('<div></div>').css({
      width: 400,
      height: 200,
      overflow: 'scroll'
    });

    this.$wrapper = this.$container.wrap(wrapper).parent();
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
    this.$wrapper.remove();
  });

  describe('enabling/disabling plugin', () => {
    it('should be defined by default', () => {
      const hot = handsontable();

      expect(hot.getPlugin('customBorders')).toBeDefined();
    });

    it('should be defined when disabled by configuration', () => {
      const hot = handsontable({
        customBorders: false
      });

      expect(hot.getPlugin('customBorders')).toBeDefined();
    });

    it('should be defined when enabled by configuration', () => {
      const hot = handsontable({
        customBorders: true
      });

      expect(hot.getPlugin('customBorders')).toBeDefined();
    });

    it('should be disabled by default', () => {
      const hot = handsontable();

      expect(hot.getPlugin('customBorders').isEnabled()).toBe(false);
    });

    it('should disable plugin using updateSettings', () => {
      const hot = handsontable({
        customBorders: true
      });

      hot.updateSettings({
        customBorders: false
      });

      expect(hot.getPlugin('customBorders')).toBeDefined();
      expect(hot.getPlugin('customBorders').isEnabled()).toBe(false);
    });

    it('should enable plugin using updateSettings', () => {
      const hot = handsontable({
        customBorders: false
      });

      hot.updateSettings({
        customBorders: true
      });

      expect(hot.getPlugin('customBorders')).toBeDefined();
      expect(hot.getPlugin('customBorders').isEnabled()).toBe(true);
    });

    it('should NOT disable plugin using disablePlugin', () => {
      const hot = handsontable({
        customBorders: true
      });

      hot.getPlugin('customBorders').disablePlugin();

      expect(hot.getPlugin('customBorders')).toBeDefined();
      expect(hot.getPlugin('customBorders').isEnabled()).toBe(true); // TODO this assertion checks current behavior that looks like a bug. I would expect false
    });

    it('should NOT enable plugin using enablePlugin', () => {
      const hot = handsontable({
        customBorders: false
      });

      hot.getPlugin('customBorders').enablePlugin();

      expect(hot.getPlugin('customBorders')).toBeDefined();
      expect(hot.getPlugin('customBorders').isEnabled()).toBe(false); // TODO this assertion checks current behavior that looks like a bug. I would expect true
    });

    it('should hide borders when disabled using updateSettings', () => {
      const hot = handsontable({
        customBorders: [{
          row: 2,
          col: 2,
          left: RED_BORDER,
          right: RED_BORDER,
          top: GREEN_BORDER
        }]
      });

      hot.updateSettings({
        customBorders: false
      });

      expect(countVisibleCustomBorders()).toBe(0);
      expect(countCustomBorders()).toBe(0);
    });

    it('should hide borders when disabled using disablePlugin', () => {
      const hot = handsontable({
        customBorders: [{
          row: 2,
          col: 2,
          left: RED_BORDER,
          right: RED_BORDER,
          top: GREEN_BORDER
        }]
      });

      hot.getPlugin('customBorders').disablePlugin();

      expect(countVisibleCustomBorders()).toBe(0);
      expect(countCustomBorders()).toBe(0);
    });

    it('should show initial borders when re-enabled using updateSettings', () => {
      const hot = handsontable({
        customBorders: [{
          row: 2,
          col: 2,
          left: RED_BORDER,
          right: RED_BORDER,
          top: GREEN_BORDER
        }]
      });

      hot.updateSettings({
        customBorders: false
      });
      hot.updateSettings({
        customBorders: true
      });

      expect(countVisibleCustomBorders()).toBe(3); // TODO this assertion checks current behavior that looks like a bug. I would expect 0
      expect(countCustomBorders()).toBe(5); // TODO this assertion checks current behavior that looks like a bug. I would expect 0
    });

    it('should show initial borders when re-enabled using disablePlugin', () => {
      const hot = handsontable({
        customBorders: [{
          row: 2,
          col: 2,
          left: RED_BORDER,
          right: RED_BORDER,
          top: GREEN_BORDER
        }]
      });

      hot.getPlugin('customBorders').disablePlugin();
      hot.getPlugin('customBorders').enablePlugin();

      expect(countVisibleCustomBorders()).toBe(0); // TODO this assertion checks current behavior that looks like a bug. I would expect 3
      expect(countCustomBorders()).toBe(0);
    });
  });

  it('should throw an exception `Unsupported selection ranges schema type was provided.` after calling setBorder method without parameter', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: true
    });

    const customBorders = hot.getPlugin('customBorders');
    let errors = 0;

    try {
      customBorders.setBorders();
    } catch (err) {
      errors += 1;
    }

    expect(errors).toEqual(1);
  });

  it('should not draw any custom borders by default', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: true
    });

    expect(countCustomBorders()).toBe(0);
  });

  it('should render specific borders provided in the configuration', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: RED_BORDER,
        right: RED_BORDER,
        top: GREEN_BORDER
      }]
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.left).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.right).toEqual(RED_BORDER);

    expect(getCellMeta(0, 0).borders).toBeUndefined();
    expect(getCellMeta(0, 1).borders).toBeUndefined();
    expect(getCellMeta(0, 2).borders).toBeUndefined();
    expect(getCellMeta(0, 3).borders).toBeUndefined();

    expect(getCellMeta(1, 0).borders).toBeUndefined();
    expect(getCellMeta(1, 1).borders).toBeUndefined();
    expect(getCellMeta(1, 2).borders).toBeUndefined();
    expect(getCellMeta(1, 3).borders).toBeUndefined();

    expect(getCellMeta(2, 0).borders).toBeUndefined();
    expect(getCellMeta(2, 1).borders).toBeUndefined();
    expect(getCellMeta(2, 3).borders).toBeUndefined();

    expect(getCellMeta(3, 0).borders).toBeUndefined();
    expect(getCellMeta(3, 1).borders).toBeUndefined();
    expect(getCellMeta(3, 2).borders).toBeUndefined();
    expect(getCellMeta(3, 3).borders).toBeUndefined();

    expect(countVisibleCustomBorders()).toBe(3);
    expect(countCustomBorders()).toBe(5);
  });

  it('should draw new borders by use setBorders method (while selected)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: true
    });

    const customBorders = hot.getPlugin('customBorders');

    selectCells([[1, 1, 2, 2]]);
    customBorders.setBorders(getSelected(), {
      top: RED_BORDER,
      bottom: RED_BORDER
    });
    deselectCell();

    expect(getCellMeta(1, 1).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(1, 1).borders.left).toEqual(EMPTY);
    expect(getCellMeta(1, 1).borders.bottom).toEqual(RED_BORDER);
    expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);

    expect(getCellMeta(1, 2).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(1, 2).borders.left).toEqual(EMPTY);
    expect(getCellMeta(1, 2).borders.bottom).toEqual(RED_BORDER);
    expect(getCellMeta(1, 2).borders.right).toEqual(EMPTY);

    expect(getCellMeta(2, 1).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(2, 1).borders.left).toEqual(EMPTY);
    expect(getCellMeta(2, 1).borders.bottom).toEqual(RED_BORDER);
    expect(getCellMeta(2, 1).borders.right).toEqual(EMPTY);

    expect(getCellMeta(2, 2).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.left).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.right).toEqual(EMPTY);

    expect(countVisibleCustomBorders()).toBe(8);
    expect(countCustomBorders()).toBe(4 * 5); // there are 4 cells in the provided range
  });

  it('should draw new borders by use setBorders method (while deselected)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: true
    });

    const customBorders = hot.getPlugin('customBorders');

    customBorders.setBorders([[1, 1, 2, 2]], {
      top: RED_BORDER,
      bottom: RED_BORDER
    });

    expect(getCellMeta(1, 1).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(1, 1).borders.left).toEqual(EMPTY);
    expect(getCellMeta(1, 1).borders.bottom).toEqual(RED_BORDER);
    expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);

    expect(getCellMeta(1, 2).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(1, 2).borders.left).toEqual(EMPTY);
    expect(getCellMeta(1, 2).borders.bottom).toEqual(RED_BORDER);
    expect(getCellMeta(1, 2).borders.right).toEqual(EMPTY);

    expect(getCellMeta(2, 1).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(2, 1).borders.left).toEqual(EMPTY);
    expect(getCellMeta(2, 1).borders.bottom).toEqual(RED_BORDER);
    expect(getCellMeta(2, 1).borders.right).toEqual(EMPTY);

    expect(getCellMeta(2, 2).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.left).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.right).toEqual(EMPTY);

    expect(countVisibleCustomBorders()).toBe(8);
    expect(countCustomBorders()).toBe(4 * 5); // there are 4 cells in the provided range
  });

  it('should redraw existing borders by use setBorders method (while selected)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: RED_BORDER,
        right: GREEN_BORDER,
        top: GREEN_THICK_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    selectCell(2, 2);
    customBorders.setBorders(getSelectedRange(), {
      top: RED_BORDER,
      bottom: RED_BORDER
    });
    deselectCell();

    expect(getCellMeta(2, 2).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.left).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.right).toEqual(GREEN_BORDER);
    expect(countVisibleCustomBorders()).toBe(4);
    expect(countCustomBorders()).toBe(5);
  });

  it('should redraw existing borders by use setBorders method (while deselected)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: RED_BORDER,
        right: GREEN_BORDER,
        top: GREEN_THICK_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    customBorders.setBorders([[2, 2]], {
      top: RED_BORDER,
      bottom: RED_BORDER
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.left).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.right).toEqual(GREEN_BORDER);
    expect(countVisibleCustomBorders()).toBe(4);
    expect(countCustomBorders()).toBe(5);
  });

  it('should hide only specific border by use setBorders method with {hide: true} (while selected)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: RED_BORDER,
        right: RED_BORDER,
        top: GREEN_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    selectCell(2, 2);
    customBorders.setBorders(getSelected(), {
      top: EMPTY
    });
    deselectCell();

    expect(getCellMeta(2, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.left).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.right).toEqual(RED_BORDER);
    expect(countVisibleCustomBorders()).toBe(2);
    expect(countCustomBorders()).toBe(5);
  });

  it('should hide only specific border by use setBorders method with {hide: true} (while deselected)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: RED_BORDER,
        right: RED_BORDER,
        top: GREEN_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    customBorders.setBorders([[2, 2]], {
      top: EMPTY
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.left).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.right).toEqual(RED_BORDER);
    expect(countVisibleCustomBorders()).toBe(2);
    expect(countCustomBorders()).toBe(5);
  });

  it('should hide only specific border by use setBorders method with {top: false} (while selected)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: RED_BORDER,
        right: RED_BORDER,
        top: GREEN_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    selectCell(2, 2);
    customBorders.setBorders(getSelected(), {
      top: false
    });
    deselectCell();

    expect(getCellMeta(2, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.left).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.right).toEqual(RED_BORDER);

    expect(getCellMeta(0, 0).borders).toBeUndefined();
    expect(getCellMeta(0, 1).borders).toBeUndefined();
    expect(getCellMeta(0, 2).borders).toBeUndefined();
    expect(getCellMeta(0, 3).borders).toBeUndefined();

    expect(getCellMeta(1, 0).borders).toBeUndefined();
    expect(getCellMeta(1, 1).borders).toBeUndefined();
    expect(getCellMeta(1, 2).borders).toBeUndefined();
    expect(getCellMeta(1, 3).borders).toBeUndefined();

    expect(getCellMeta(2, 0).borders).toBeUndefined();
    expect(getCellMeta(2, 1).borders).toBeUndefined();
    expect(getCellMeta(2, 3).borders).toBeUndefined();

    expect(getCellMeta(3, 0).borders).toBeUndefined();
    expect(getCellMeta(3, 1).borders).toBeUndefined();
    expect(getCellMeta(3, 2).borders).toBeUndefined();
    expect(getCellMeta(3, 3).borders).toBeUndefined();

    expect(countVisibleCustomBorders()).toBe(2);
    expect(countCustomBorders()).toBe(5);
  });

  it('should hide only specific border by use setBorders method with {top: false} (while deselected)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: RED_BORDER,
        right: RED_BORDER,
        top: GREEN_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    customBorders.setBorders([[2, 2]], {
      top: false
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.left).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.right).toEqual(RED_BORDER);

    expect(getCellMeta(0, 0).borders).toBeUndefined();
    expect(getCellMeta(0, 1).borders).toBeUndefined();
    expect(getCellMeta(0, 2).borders).toBeUndefined();
    expect(getCellMeta(0, 3).borders).toBeUndefined();

    expect(getCellMeta(1, 0).borders).toBeUndefined();
    expect(getCellMeta(1, 1).borders).toBeUndefined();
    expect(getCellMeta(1, 2).borders).toBeUndefined();
    expect(getCellMeta(1, 3).borders).toBeUndefined();

    expect(getCellMeta(2, 0).borders).toBeUndefined();
    expect(getCellMeta(2, 1).borders).toBeUndefined();
    expect(getCellMeta(2, 3).borders).toBeUndefined();

    expect(getCellMeta(3, 0).borders).toBeUndefined();
    expect(getCellMeta(3, 1).borders).toBeUndefined();
    expect(getCellMeta(3, 2).borders).toBeUndefined();
    expect(getCellMeta(3, 3).borders).toBeUndefined();

    expect(countVisibleCustomBorders()).toBe(2);
    expect(countCustomBorders()).toBe(5);
  });

  it('should return borders from the selected area by use getBorders method', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: RED_BORDER,
        right: GREEN_BORDER,
        top: GREEN_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    hot.selectCells([[1, 1, 2, 2]]);
    const borders = customBorders.getBorders(getSelected());

    deselectCell();

    expect(borders.length).toEqual(1);
    expect(borders[0].top).toEqual(GREEN_BORDER);
    expect(borders[0].left).toEqual(RED_BORDER);
    expect(borders[0].bottom).toEqual(EMPTY);
    expect(borders[0].right).toEqual(GREEN_BORDER);
    expect(countVisibleCustomBorders()).toBe(3);
    expect(countCustomBorders()).toBe(5);
  });

  it('should return all borders by use getBorders method without parameter', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        range: {
          from: {
            row: 1,
            col: 1
          },
          to: {
            row: 3,
            col: 3
          }
        },
        top: BLUE_BORDER,
        left: ORANGE_BORDER,
        bottom: RED_BORDER,
        right: MAGENTA_BORDER
      },
      {
        row: 2,
        col: 2,
        left: RED_BORDER,
        right: GREEN_BORDER,
        top: GREEN_THICK_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    const borders = customBorders.getBorders();

    expect(borders.length).toEqual(9);
    expect(countVisibleCustomBorders()).toBe(15); // there are 9 cells in the provided range, some of which have 1, 2 or 3 rendered borders
    expect(countCustomBorders()).toBe(9 * 5); // there are 9 cells in the provided range
  });

  it('should clear borders from area by use clearBorders method (while selected)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        range: {
          from: {
            row: 1,
            col: 1
          },
          to: {
            row: 3,
            col: 3
          }
        },
        top: BLUE_BORDER,
        left: ORANGE_BORDER,
        bottom: RED_BORDER,
        right: MAGENTA_BORDER
      },
      {
        row: 2,
        col: 2,
        left: RED_BORDER,
        right: GREEN_BORDER,
        top: GREEN_THICK_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    /*
    Was:
    0000
    0111
    0111
    0111
    */

    selectCells([[0, 0, 2, 2]]);
    customBorders.clearBorders(getSelectedRange());
    deselectCell();

    /*
    Is:
    0000
    0001
    0001
    0111
    */

    expect(getCellMeta(1, 1).borders).toBeUndefined();
    expect(getCellMeta(1, 2).borders).toBeUndefined();
    expect(getCellMeta(2, 1).borders).toBeUndefined();
    expect(getCellMeta(2, 2).borders).toBeUndefined();

    expect(getCellMeta(1, 3).borders.top).toEqual(BLUE_BORDER);
    expect(getCellMeta(1, 3).borders.right).toEqual(MAGENTA_BORDER);
    expect(getCellMeta(2, 3).borders.right).toEqual(MAGENTA_BORDER);
    expect(getCellMeta(3, 1).borders.left).toEqual(ORANGE_BORDER);
    expect(getCellMeta(3, 1).borders.bottom).toEqual(RED_BORDER);
    expect(getCellMeta(3, 2).borders.bottom).toEqual(RED_BORDER);
    expect(getCellMeta(3, 3).borders.right).toEqual(MAGENTA_BORDER);
    expect(getCellMeta(3, 3).borders.bottom).toEqual(RED_BORDER);
    expect(countVisibleCustomBorders()).toBe(8);
    expect(countCustomBorders()).toBe(5 * 5);
  });

  it('should clear borders from area by use clearBorders method (while deselected)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        range: {
          from: {
            row: 1,
            col: 1
          },
          to: {
            row: 3,
            col: 3
          }
        },
        top: BLUE_BORDER,
        left: ORANGE_BORDER,
        bottom: RED_BORDER,
        right: MAGENTA_BORDER
      },
      {
        row: 2,
        col: 2,
        left: RED_BORDER,
        right: GREEN_BORDER,
        top: GREEN_THICK_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    /*
    Was:
    0000
    0111
    0111
    0111
    */

    customBorders.clearBorders([[0, 0, 2, 2]]);

    /*
    Is:
    0000
    0001
    0001
    0111
    */

    expect(getCellMeta(1, 1).borders).toBeUndefined();
    expect(getCellMeta(1, 2).borders).toBeUndefined();
    expect(getCellMeta(2, 1).borders).toBeUndefined();
    expect(getCellMeta(2, 2).borders).toBeUndefined();

    expect(getCellMeta(1, 3).borders.top).toEqual(BLUE_BORDER);
    expect(getCellMeta(1, 3).borders.right).toEqual(MAGENTA_BORDER);
    expect(getCellMeta(2, 3).borders.right).toEqual(MAGENTA_BORDER);
    expect(getCellMeta(3, 1).borders.left).toEqual(ORANGE_BORDER);
    expect(getCellMeta(3, 1).borders.bottom).toEqual(RED_BORDER);
    expect(getCellMeta(3, 2).borders.bottom).toEqual(RED_BORDER);
    expect(getCellMeta(3, 3).borders.right).toEqual(MAGENTA_BORDER);
    expect(getCellMeta(3, 3).borders.bottom).toEqual(RED_BORDER);
    expect(countVisibleCustomBorders()).toBe(8);
    expect(countCustomBorders()).toBe(5 * 5);
  });

  it('should clear all borders by use clearBorders method without parameter', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        range: {
          from: {
            row: 1,
            col: 1
          },
          to: {
            row: 3,
            col: 3
          }
        },
        top: BLUE_BORDER,
        left: ORANGE_BORDER,
        bottom: RED_BORDER,
        right: MAGENTA_BORDER
      },
      {
        row: 2,
        col: 2,
        left: RED_BORDER,
        right: GREEN_BORDER,
        top: GREEN_THICK_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    customBorders.clearBorders();

    expect(getCellMeta(1, 1).borders).toBeUndefined();
    expect(getCellMeta(1, 2).borders).toBeUndefined();
    expect(getCellMeta(2, 1).borders).toBeUndefined();
    expect(getCellMeta(2, 2).borders).toBeUndefined();

    expect(getCellMeta(1, 3).borders).toBeUndefined();
    expect(getCellMeta(2, 3).borders).toBeUndefined();
    expect(getCellMeta(3, 1).borders).toBeUndefined();
    expect(getCellMeta(3, 2).borders).toBeUndefined();
    expect(getCellMeta(3, 3).borders).toBeUndefined();

    expect(countVisibleCustomBorders()).toBe(0);
    expect(countCustomBorders()).toBe(0);
  });

  it('should not throw an error when borders menu is opened through row header', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      rowHeaders: true,
      contextMenu: true,
      customBorders: true,
    });

    await selectContextSubmenuOption('Borders', 'Top', getCell(0, -1));

    deselectCell();

    expect(getCellMeta(0, 0).borders.top).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 1).borders.top).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 2).borders.top).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 3).borders.top).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 0).borders.left).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.right).toEqual(EMPTY);
    expect(countVisibleCustomBorders()).toBe(4);
    expect(countCustomBorders()).toBe(40);
  });

  it('should not throw an error when borders menu is opened through column header', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      colHeaders: true,
      contextMenu: true,
      customBorders: true,
    });

    await selectContextSubmenuOption('Borders', 'Right', getCell(-1, 0));

    deselectCell();

    expect(getCellMeta(0, 0).borders.right).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(1, 0).borders.right).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(2, 0).borders.right).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(3, 0).borders.right).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 0).borders.top).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.left).toEqual(EMPTY);
    expect(countVisibleCustomBorders()).toBe(4);
    expect(countCustomBorders()).toBe(40);
  });

  it('should draw borders from context menu options when was first cleared borders by the clearBorders method', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: [{
        row: 0,
        col: 0,
        left: RED_BORDER,
        right: GREEN_BORDER,
        top: GREEN_THICK_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    selectCell(0, 0);
    customBorders.clearBorders(getSelectedRange());
    deselectCell();

    await selectContextSubmenuOption('Borders', 'Top');
    deselectCell();

    expect(getCellMeta(0, 0).borders.top).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 0).borders.left).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.right).toEqual(EMPTY);
    expect(countVisibleCustomBorders()).toBe(1);
    expect(countCustomBorders()).toBe(5);
  });

  it('should clear all borders when first was cleared borders by the clearBorders method with selections, ' +
     'then draw borders from context menu options, and then was cleared borders by the clearBorders ' +
     'method without selections', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: [{
        row: 0,
        col: 0,
        left: RED_BORDER,
        right: GREEN_BORDER,
        top: GREEN_THICK_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    selectCell(0, 0);
    customBorders.clearBorders(getSelectedRange());
    deselectCell();

    await selectContextSubmenuOption('Borders', 'Top');
    deselectCell();

    customBorders.clearBorders();
    expect(getCellMeta(0, 0).borders).toBeUndefined();
    expect(countVisibleCustomBorders()).toBe(0);
    expect(countCustomBorders()).toBe(0);
  });

  it('should draw top border from context menu options', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    await selectContextSubmenuOption('Borders', 'Top');
    deselectCell();

    // expect(getCellMeta(0,0).borders.hasOwnProperty('top')).toBe(true);
    expect(getCellMeta(0, 0).borders.top).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 0).borders.left).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.right).toEqual(EMPTY);

    expect(countVisibleCustomBorders()).toBe(1);
    expect(countCustomBorders()).toBe(5);
  });

  it('should draw left border from context menu options', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    await selectContextSubmenuOption('Borders', 'Left');
    deselectCell();

    /* eslint-disable no-prototype-builtins */
    expect(getCellMeta(0, 0).borders.hasOwnProperty('left')).toBe(true);
    expect(getCellMeta(0, 0).borders.top).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.left).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.right).toEqual(EMPTY);
    expect(countVisibleCustomBorders()).toBe(1);
    expect(countCustomBorders()).toBe(5);
  });

  it('should draw right border from context menu options', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    await selectContextSubmenuOption('Borders', 'Right');
    deselectCell();

    /* eslint-disable no-prototype-builtins */
    expect(getCellMeta(0, 0).borders.hasOwnProperty('right')).toBe(true); // TODO flaky test. sometimes I get this error on this line: 'Failed: Cannot read property 'hasOwnProperty' of undefined'
    expect(getCellMeta(0, 0).borders.top).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.left).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.right).toEqual(DEFAULT_BORDER);
    expect(countVisibleCustomBorders()).toBe(1);
    expect(countCustomBorders()).toBe(5);
  });

  it('should draw bottom border from context menu options', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    await selectContextSubmenuOption('Borders', 'Bottom');
    deselectCell();

    /* eslint-disable no-prototype-builtins */
    expect(getCellMeta(0, 0).borders.hasOwnProperty('right')).toBe(true);
    expect(getCellMeta(0, 0).borders.top).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.left).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 0).borders.right).toEqual(EMPTY);
    expect(countVisibleCustomBorders()).toBe(1);
    expect(countCustomBorders()).toBe(5);
  });

  it('should remove all bottoms border from context menu options', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: [
        {
          row: 0,
          col: 0,
          left: RED_BORDER,
          right: GREEN_BORDER
        }]
    });
    expect(countVisibleCustomBorders()).toBe(2);
    expect(countCustomBorders()).toBe(5);

    await selectContextSubmenuOption('Borders', 'Remove border');
    deselectCell();

    expect(getCellMeta(0, 0).borders).toBeUndefined();
    expect(countVisibleCustomBorders()).toBe(0);
    expect(countCustomBorders()).toBe(0);
  });

  it('should disable `Borders` context menu item when menu was triggered from corner header', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
      rowHeaders: true,
      colHeaders: true,
      contextMenu: true,
      customBorders: true,
    });

    const corner = $('.ht_clone_top_left_corner .htCore').find('thead').find('th').eq(0);

    simulateClick(corner, 'RMB');
    contextMenu();

    expect($('.htContextMenu tbody td.htDisabled').text()).toBe([
      'Insert column left',
      'Insert column right',
      'Remove columns',
      'Undo',
      'Redo',
      'Read only',
      'Alignment',
      'Borders',
    ].join(''));
  });

  describe('virtual rendering', () => {
    // based on tests in Core_count.spec.js

    it('should render borders only for rendered rows', () => {
      const data = Handsontable.helper.createSpreadsheetData(10, 2);
      const customBorders = generateCustomBordersForAllRows(data.length);
      const instance = handsontable({
        data,
        customBorders,
        height: 100,
        viewportRowRenderingOffset: 0
      });

      expect(instance.countRenderedRows()).toEqual(5);
      expect(countVisibleCustomBorders()).toEqual(5);
      expect(countCustomBorders()).toEqual(10 * 5); // TODO I think this should be 5 * 5
    });

    it('should render borders only for rendered rows, after scrolling', async() => {
      const data = Handsontable.helper.createSpreadsheetData(10, 2);
      const customBorders = generateCustomBordersForAllRows(data.length);
      const instance = handsontable({
        data,
        customBorders,
        height: 100,
        viewportRowRenderingOffset: 0
      });
      const mainHolder = instance.view.wt.wtTable.holder;

      $(mainHolder).scrollTop(400);
      await sleep(300);
      expect(instance.countRenderedRows()).toEqual(5);
      expect(countVisibleCustomBorders()).toEqual(5);
      expect(countCustomBorders()).toEqual(10 * 5); // TODO I think this should be 5 * 5
    });

    it('should render borders only for rendered rows, including rows rendered because of viewportRowRenderingOffset', () => {
      const data = Handsontable.helper.createSpreadsheetData(10, 2);
      const customBorders = generateCustomBordersForAllRows(data.length);
      const instance = handsontable({
        data,
        customBorders,
        height: 100,
        viewportRowRenderingOffset: 20
      });

      expect(instance.countRenderedRows()).toEqual(10);
      expect(countVisibleCustomBorders()).toEqual(10);
      expect(countCustomBorders()).toEqual(10 * 5); // TODO I think this should be 5 * 5
    });

    it('should not render borders when the table is not rendered', async() => {
      spec().$container.remove();
      const data = Handsontable.helper.createSpreadsheetData(10, 2);
      const customBorders = generateCustomBordersForAllRows(data.length);

      handsontable({
        data,
        customBorders,
        width: 100
      });
      expect(countVisibleCustomBorders()).toEqual(0);
      expect(countCustomBorders()).toEqual(0);
    });
  });

  // TODO: Should it work in this way? Probably some warn would be helpful.
  it('should draw borders properly when they end beyond the table boundaries (drawing range)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      customBorders: [{
        range: {
          from: {
            row: 1,
            col: 1
          },
          to: {
            row: 10,
            col: 10
          }
        },
        top: BLUE_BORDER,
        left: ORANGE_BORDER,
        bottom: RED_BORDER,
        right: MAGENTA_BORDER
      }]
    });

    expect(countVisibleCustomBorders()).toEqual(4 + 4); // 4 rows x 4 columns from one side
    // First cell from the top-left position
    expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
    expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
    expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);
    // First cell from the top-right position
    expect(getCellMeta(1, 4).borders.left).toEqual(EMPTY);
    expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
    expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(1, 4).borders.right).toEqual(EMPTY);
    // // First cell from the bottom-left position
    expect(getCellMeta(4, 1).borders.left).toEqual(ORANGE_BORDER);
    expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
    expect(getCellMeta(4, 1).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(4, 1).borders.right).toEqual(EMPTY);
    // // First cell from the bottom-right position
    expect(getCellMeta(4, 4).borders).toBeUndefined();
    // Cell in the middle of area without borders
    expect(getCellMeta(2, 3).borders).toBeUndefined();
  });

  // TODO: Should it work in this way? Probably some warn would be helpful.
  it('should draw borders properly when some of them are beyond the table boundaries (drawing single borders)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      hiddenColumns: {
        columns: [1],
        indicators: true
      },
      customBorders: [{
        row: 0,
        col: 0,
        top: BLUE_BORDER,
        left: ORANGE_BORDER,
        bottom: RED_BORDER,
        right: MAGENTA_BORDER
      }, {
        row: 7,
        col: 7,
        top: BLUE_BORDER,
        left: ORANGE_BORDER,
        bottom: RED_BORDER,
        right: MAGENTA_BORDER
      }]
    });

    expect(countVisibleCustomBorders()).toEqual(4);
    expect(getCellMeta(0, 0).borders.left).toEqual(ORANGE_BORDER);
    expect(getCellMeta(0, 0).borders.top).toEqual(BLUE_BORDER);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(RED_BORDER);
    expect(getCellMeta(0, 0).borders.right).toEqual(MAGENTA_BORDER);
    expect(getCellMeta(2, 2).borders).toBeUndefined();
  });

  describe('should cooperate with the `HiddenColumns` plugin properly', () => {
    it('should display custom borders (drawing range) properly when some columns are hidden ' +
      '(range starts from hidden column)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1],
          indicators: true
        },
        customBorders: [{
          range: {
            from: {
              row: 1,
              col: 1
            },
            to: {
              row: 4,
              col: 4
            }
          },
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + 4); // 4 rows x 3 columns without left border
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.right).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.right).toEqual(MAGENTA_BORDER);
      // Cell in the middle of area without borders
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display custom borders (drawing range) properly when hiding columns that have been visible ' +
      '(hiding column at the start of the range)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: true,
        customBorders: [{
          range: {
            from: {
              row: 1,
              col: 1
            },
            to: {
              row: 4,
              col: 4
            }
          },
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenColumns').hideColumn(1);
      render();

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + 4); // 4 rows x 3 columns without left border
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.right).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.right).toEqual(MAGENTA_BORDER);
      // Cell in the middle of area without borders
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display custom borders (drawing range) properly when showing columns that have been hidden ' +
      '(range starts from hidden column)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1],
          indicators: true
        },
        customBorders: [{
          range: {
            from: {
              row: 1,
              col: 1
            },
            to: {
              row: 4,
              col: 4
            }
          },
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenColumns').showColumn(1);
      render();

      expect(countVisibleCustomBorders()).toEqual(4 * 4); // 4 rows x 4 columns
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.right).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.right).toEqual(MAGENTA_BORDER);
      // Cell in the middle of area without borders
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display custom borders (drawing range) properly when some columns are hidden ' +
      '(range ends at hidden column)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [4],
          indicators: true
        },
        customBorders: [{
          range: {
            from: {
              row: 1,
              col: 1
            },
            to: {
              row: 4,
              col: 4
            }
          },
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + 4); // 4 rows x 3 columns without right border
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.right).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.right).toEqual(MAGENTA_BORDER);
      // Cell in the middle of area without borders
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display custom borders (drawing range) properly when hiding columns that have been visible ' +
      '(hiding column at the end of the range)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: true,
        customBorders: [{
          range: {
            from: {
              row: 1,
              col: 1
            },
            to: {
              row: 4,
              col: 4
            }
          },
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenColumns').hideColumn(4);
      render();

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + 4); // 4 rows x 3 columns without right border
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.right).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.right).toEqual(MAGENTA_BORDER);
      // Cell in the middle of area without borders
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display custom borders (drawing range) properly when showing columns that have been hidden ' +
      '(range ends at hidden column)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [4],
          indicators: true
        },
        customBorders: [{
          range: {
            from: {
              row: 1,
              col: 1
            },
            to: {
              row: 4,
              col: 4
            }
          },
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenColumns').showColumn(4);
      render();

      expect(countVisibleCustomBorders()).toEqual(4 * 4); // 4 rows x 4 columns
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.right).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.right).toEqual(MAGENTA_BORDER);
      // Cell in the middle of area without borders
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display custom borders (drawing range) properly when some columns are hidden ' +
      '(hidden column in the middle of the range)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [2],
          indicators: true
        },
        customBorders: [{
          range: {
            from: {
              row: 1,
              col: 1
            },
            to: {
              row: 4,
              col: 4
            }
          },
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + (4 * 2)); // 4 rows x 3 columns
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.right).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.right).toEqual(MAGENTA_BORDER);
      // Cell in the middle of area without borders
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display custom borders (drawing range) properly when hiding columns that have been visible ' +
      '(hiding column in the middle of the range)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: true,
        customBorders: [{
          range: {
            from: {
              row: 1,
              col: 1
            },
            to: {
              row: 4,
              col: 4
            }
          },
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenColumns').hideColumn(2);
      render();

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + (4 * 2)); // 4 rows x 3 columns
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.right).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.right).toEqual(MAGENTA_BORDER);
      // Cell in the middle of area without borders
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display custom borders (drawing range) properly when showing columns that have been hidden ' +
      '(hidden column in the middle of the range)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [4],
          indicators: true
        },
        customBorders: [{
          range: {
            from: {
              row: 1,
              col: 1
            },
            to: {
              row: 4,
              col: 4
            }
          },
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenColumns').showColumn(4);
      render();

      expect(countVisibleCustomBorders()).toEqual(4 * 4); // 4 rows x 4 columns
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.right).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.right).toEqual(MAGENTA_BORDER);
      // Cell in the middle of area without borders
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display borders properly when hiding cells separating another cells with borders (they will stick together) #1', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: true,
        customBorders: [{
          row: 1,
          col: 0,
          top: GREEN_BORDER,
          left: GREEN_BORDER,
          bottom: GREEN_BORDER,
          right: GREEN_BORDER
        }, {
          row: 1,
          col: 2,
          top: BLUE_BORDER,
          left: BLUE_BORDER,
          bottom: BLUE_BORDER,
          right: BLUE_BORDER
        }, {
          row: 1,
          col: 4,
          top: YELLOW_BORDER,
          left: YELLOW_BORDER,
          bottom: YELLOW_BORDER,
          right: YELLOW_BORDER
        }]
      });

      getPlugin('hiddenColumns').hideColumns([1, 3]);
      render();

      expect(countVisibleCustomBorders()).toEqual(3 * 4); // It isn't ok probably. There is no specification.
      // expect(countVisibleCustomBorders()).toEqual((4 * 2) + 2); // TODO: It should work.
      expect(getCellMeta(1, 0).borders.left).toEqual(GREEN_BORDER);
      expect(getCellMeta(1, 0).borders.top).toEqual(GREEN_BORDER);
      expect(getCellMeta(1, 0).borders.bottom).toEqual(GREEN_BORDER);
      expect(getCellMeta(1, 0).borders.right).toEqual(GREEN_BORDER); // Is it ok?

      expect(getCellMeta(1, 2).borders.left).toEqual(BLUE_BORDER); // Is it ok?
      expect(getCellMeta(1, 2).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 2).borders.bottom).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 2).borders.right).toEqual(BLUE_BORDER); // Is it ok?

      expect(getCellMeta(1, 4).borders.left).toEqual(YELLOW_BORDER); // Is it ok?
      expect(getCellMeta(1, 4).borders.top).toEqual(YELLOW_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(YELLOW_BORDER);
      expect(getCellMeta(1, 4).borders.right).toEqual(YELLOW_BORDER);
    });

    it('should display borders properly when hiding cells separating another cells with borders (they will stick together) #2', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: true,
        customBorders: [{
          row: 1,
          col: 0,
          top: GREEN_BORDER,
          left: GREEN_BORDER,
          bottom: GREEN_BORDER,
          right: GREEN_BORDER
        }, {
          row: 1,
          col: 2,
          top: BLUE_BORDER,
          left: BLUE_BORDER,
          bottom: BLUE_BORDER,
          right: BLUE_BORDER
        }, {
          row: 1,
          col: 4,
          top: YELLOW_BORDER,
          left: YELLOW_BORDER,
          bottom: YELLOW_BORDER,
          right: YELLOW_BORDER
        }]
      });

      getPlugin('hiddenColumns').hideColumns([1, 2, 3]);
      render();

      expect(countVisibleCustomBorders()).toEqual(2 * 4); // It isn't ok probably. There is no specification.
      // expect(countVisibleCustomBorders()).toEqual((4 + 3)); // TODO: It should work.
      expect(getCellMeta(1, 0).borders.left).toEqual(GREEN_BORDER);
      expect(getCellMeta(1, 0).borders.top).toEqual(GREEN_BORDER);
      expect(getCellMeta(1, 0).borders.bottom).toEqual(GREEN_BORDER);
      expect(getCellMeta(1, 0).borders.right).toEqual(GREEN_BORDER); // Is it ok?

      expect(getCellMeta(1, 2).borders.left).toEqual(BLUE_BORDER); // Is it ok?
      expect(getCellMeta(1, 2).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 2).borders.bottom).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 2).borders.right).toEqual(BLUE_BORDER); // Is it ok?

      expect(getCellMeta(1, 4).borders.left).toEqual(YELLOW_BORDER); // Is it ok?
      expect(getCellMeta(1, 4).borders.top).toEqual(YELLOW_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(YELLOW_BORDER);
      expect(getCellMeta(1, 4).borders.right).toEqual(YELLOW_BORDER);
    });

    it('should not display custom border for single cell when it is placed on the hidden column', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1],
          indicators: true
        },
        customBorders: [{
          row: 1,
          col: 1,
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      // Just the meta is defined.
      expect(countVisibleCustomBorders()).toEqual(0);
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(1, 1).borders.right).toEqual(MAGENTA_BORDER);
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display custom borders for single cells properly when one of them is placed on the hidden column', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 3],
          indicators: true
        },
        customBorders: true
      });

      getPlugin('customBorders').setBorders([[1, 1, 3, 3]], {
        top: BLUE_BORDER,
        left: ORANGE_BORDER,
        bottom: RED_BORDER,
        right: MAGENTA_BORDER
      });

      expect(countVisibleCustomBorders()).toEqual(3 * 4); // Just 3 cells (2 columns are hidden), all of them with 4 borders
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(1, 1).borders.right).toEqual(MAGENTA_BORDER);

      expect(getCellMeta(1, 2).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 2).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 2).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(1, 2).borders.right).toEqual(MAGENTA_BORDER);

      expect(getCellMeta(2, 2).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(2, 2).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(2, 2).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(2, 2).borders.right).toEqual(MAGENTA_BORDER);

      expect(getCellMeta(3, 2).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(3, 2).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(3, 2).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(3, 2).borders.right).toEqual(MAGENTA_BORDER);
    });

    it('should not display custom border for single cell when column containing border is hidden by API call', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: true,
        customBorders: [{
          row: 1,
          col: 1,
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenColumns').hideColumn(1);
      render();

      // Just the meta is defined.
      expect(countVisibleCustomBorders()).toEqual(0);
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(1, 1).borders.right).toEqual(MAGENTA_BORDER);
    });

    it('should display custom border for single cell when hidden column containing border has been shown by API call', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1],
          indicators: true
        },
        customBorders: [{
          row: 1,
          col: 1,
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenColumns').showColumn(1);
      render();

      expect(countVisibleCustomBorders()).toEqual(4);
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(1, 1).borders.right).toEqual(MAGENTA_BORDER);
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should draw border from context menu options in proper place when there are some hidden columns before ' +
      'a place where the border is added', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        contextMenu: true,
        customBorders: true,
        hiddenColumns: {
          columns: [0, 1]
        }
      });

      await selectContextSubmenuOption('Borders', 'Top', getCell(0, 2));
      deselectCell();

      expect(getCellMeta(0, 2).borders.top).toEqual(DEFAULT_BORDER);
      expect(getCellMeta(0, 2).borders.left).toEqual(EMPTY);
      expect(getCellMeta(0, 2).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(0, 2).borders.right).toEqual(EMPTY);

      expect(countVisibleCustomBorders()).toBe(1);
      expect(countCustomBorders()).toBe(5);
    });
  });

  describe('should cooperate with the `HiddenRows` plugin properly', () => {
    it('should display custom borders (drawing range) properly when some rows are hidden ' +
      '(range starts from hidden row)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1],
          indicators: true
        },
        customBorders: [{
          range: {
            from: {
              row: 1,
              col: 1
            },
            to: {
              row: 4,
              col: 4
            }
          },
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + 4); // 3 rows x 4 columns without top border
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.right).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.right).toEqual(MAGENTA_BORDER);
      // Cell in the middle of area without borders
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display custom borders (drawing range) properly when hiding rows that have been visible ' +
      '(hiding row at the start of the range)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: true,
        customBorders: [{
          range: {
            from: {
              row: 1,
              col: 1
            },
            to: {
              row: 4,
              col: 4
            }
          },
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenRows').hideRow(1);
      render();

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + 4); // 3 rows x 4 columns without top border
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.right).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.right).toEqual(MAGENTA_BORDER);
      // Cell in the middle of area without borders
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display custom borders (drawing range) properly when showing rows that have been hidden ' +
      '(range starts from hidden row)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1],
          indicators: true
        },
        customBorders: [{
          range: {
            from: {
              row: 1,
              col: 1
            },
            to: {
              row: 4,
              col: 4
            }
          },
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenRows').showRow(1);
      render();

      expect(countVisibleCustomBorders()).toEqual(4 * 4); // 4 rows x 4 columns
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.right).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.right).toEqual(MAGENTA_BORDER);
      // Cell in the middle of area without borders
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display custom borders (drawing range) properly when some rows are hidden ' +
      '(range ends at hidden row)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [4],
          indicators: true
        },
        customBorders: [{
          range: {
            from: {
              row: 1,
              col: 1
            },
            to: {
              row: 4,
              col: 4
            }
          },
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + 4); // 3 rows x 4 columns without bottom border
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.right).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.right).toEqual(MAGENTA_BORDER);
      // Cell in the middle of area without borders
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display custom borders (drawing range) properly when hiding rows that have been visible ' +
      '(hiding row at the end of the range)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: true,
        customBorders: [{
          range: {
            from: {
              row: 1,
              col: 1
            },
            to: {
              row: 4,
              col: 4
            }
          },
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenRows').hideRow(4);
      render();

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + 4); // 3 rows x 4 columns without right border
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.right).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.right).toEqual(MAGENTA_BORDER);
      // Cell in the middle of area without borders
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display custom borders (drawing range) properly when showing rows that have been hidden ' +
      '(range ends at hidden row)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [4],
          indicators: true
        },
        customBorders: [{
          range: {
            from: {
              row: 1,
              col: 1
            },
            to: {
              row: 4,
              col: 4
            }
          },
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenRows').showRow(4);
      render();

      expect(countVisibleCustomBorders()).toEqual(4 * 4); // 4 rows x 4 columns
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.right).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.right).toEqual(MAGENTA_BORDER);
      // Cell in the middle of area without borders
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display custom borders (drawing range) properly when some rows are hidden ' +
      '(hidden row in the middle of the range)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [2],
          indicators: true
        },
        customBorders: [{
          range: {
            from: {
              row: 1,
              col: 1
            },
            to: {
              row: 4,
              col: 4
            }
          },
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + (4 * 2)); // 3 rows x 4 columns
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.right).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.right).toEqual(MAGENTA_BORDER);
      // Cell in the middle of area without borders
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display custom borders (drawing range) properly when hiding rows that have been visible ' +
      '(hiding row in the middle of the range)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: true,
        customBorders: [{
          range: {
            from: {
              row: 1,
              col: 1
            },
            to: {
              row: 4,
              col: 4
            }
          },
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenRows').hideRow(2);
      render();

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + (4 * 2)); // 3 rows x 4 columns
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.right).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.right).toEqual(MAGENTA_BORDER);
      // Cell in the middle of area without borders
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display custom borders (drawing range) properly when showing rows that have been hidden ' +
      '(hidden row in the middle of the range)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [4],
          indicators: true
        },
        customBorders: [{
          range: {
            from: {
              row: 1,
              col: 1
            },
            to: {
              row: 4,
              col: 4
            }
          },
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenRows').showRow(4);
      render();

      expect(countVisibleCustomBorders()).toEqual(4 * 4); // 4 rows x 4 columns
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.right).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.right).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.left).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.right).toEqual(MAGENTA_BORDER);
      // Cell in the middle of area without borders
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display borders properly when hiding cells separating another cells with borders (they will stick together) #1', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: true,
        customBorders: [{
          row: 0,
          col: 1,
          top: GREEN_BORDER,
          left: GREEN_BORDER,
          bottom: GREEN_BORDER,
          right: GREEN_BORDER
        }, {
          row: 2,
          col: 1,
          top: BLUE_BORDER,
          left: BLUE_BORDER,
          bottom: BLUE_BORDER,
          right: BLUE_BORDER
        }, {
          row: 4,
          col: 1,
          top: YELLOW_BORDER,
          left: YELLOW_BORDER,
          bottom: YELLOW_BORDER,
          right: YELLOW_BORDER
        }]
      });

      getPlugin('hiddenRows').hideRows([1, 3]);
      render();

      expect(countVisibleCustomBorders()).toEqual(3 * 4); // It isn't ok probably. There is no specification.
      // expect(countVisibleCustomBorders()).toEqual((4 * 2) + 2); // TODO: It should work.
      expect(getCellMeta(0, 1).borders.left).toEqual(GREEN_BORDER);
      expect(getCellMeta(0, 1).borders.top).toEqual(GREEN_BORDER);
      expect(getCellMeta(0, 1).borders.bottom).toEqual(GREEN_BORDER); // Is it ok?
      expect(getCellMeta(0, 1).borders.right).toEqual(GREEN_BORDER);

      expect(getCellMeta(2, 1).borders.left).toEqual(BLUE_BORDER);
      expect(getCellMeta(2, 1).borders.top).toEqual(BLUE_BORDER); // Is it ok?
      expect(getCellMeta(2, 1).borders.bottom).toEqual(BLUE_BORDER); // Is it ok?
      expect(getCellMeta(2, 1).borders.right).toEqual(BLUE_BORDER);

      expect(getCellMeta(4, 1).borders.left).toEqual(YELLOW_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(YELLOW_BORDER); // Is it ok?
      expect(getCellMeta(4, 1).borders.bottom).toEqual(YELLOW_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(YELLOW_BORDER);
    });

    it('should display borders properly when hiding cells separating another cells with borders (they will stick together) #2', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: true,
        customBorders: [{
          row: 0,
          col: 1,
          top: GREEN_BORDER,
          left: GREEN_BORDER,
          bottom: GREEN_BORDER,
          right: GREEN_BORDER
        }, {
          row: 2,
          col: 1,
          top: BLUE_BORDER,
          left: BLUE_BORDER,
          bottom: BLUE_BORDER,
          right: BLUE_BORDER
        }, {
          row: 4,
          col: 1,
          top: YELLOW_BORDER,
          left: YELLOW_BORDER,
          bottom: YELLOW_BORDER,
          right: YELLOW_BORDER
        }]
      });

      getPlugin('hiddenRows').hideRows([1, 2, 3]);
      render();

      expect(countVisibleCustomBorders()).toEqual(2 * 4); // It isn't ok probably. There is no specification.
      // expect(countVisibleCustomBorders()).toEqual((4 + 3)); // TODO: It should work.
      expect(getCellMeta(0, 1).borders.left).toEqual(GREEN_BORDER);
      expect(getCellMeta(0, 1).borders.top).toEqual(GREEN_BORDER);
      expect(getCellMeta(0, 1).borders.bottom).toEqual(GREEN_BORDER); // Is it ok?
      expect(getCellMeta(0, 1).borders.right).toEqual(GREEN_BORDER);

      expect(getCellMeta(2, 1).borders.left).toEqual(BLUE_BORDER);
      expect(getCellMeta(2, 1).borders.top).toEqual(BLUE_BORDER); // Is it ok?
      expect(getCellMeta(2, 1).borders.bottom).toEqual(BLUE_BORDER); // Is it ok?
      expect(getCellMeta(2, 1).borders.right).toEqual(BLUE_BORDER);

      expect(getCellMeta(4, 1).borders.left).toEqual(YELLOW_BORDER);
      expect(getCellMeta(4, 1).borders.top).toEqual(YELLOW_BORDER); // Is it ok?
      expect(getCellMeta(4, 1).borders.bottom).toEqual(YELLOW_BORDER);
      expect(getCellMeta(4, 1).borders.right).toEqual(YELLOW_BORDER);
    });

    it('should not display custom border for single cell when it is placed on the hidden row', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1],
          indicators: true
        },
        customBorders: [{
          row: 1,
          col: 1,
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      // Just the meta is defined.
      expect(countVisibleCustomBorders()).toEqual(0);
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(1, 1).borders.right).toEqual(MAGENTA_BORDER);
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should display custom borders for single cells properly when one of them is placed on the hidden row', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 3],
          indicators: true
        },
        customBorders: true
      });

      getPlugin('customBorders').setBorders([[1, 1, 3, 3]], {
        top: BLUE_BORDER,
        left: ORANGE_BORDER,
        bottom: RED_BORDER,
        right: MAGENTA_BORDER
      });

      expect(countVisibleCustomBorders()).toEqual(3 * 4); // Just 3 cells (2 rows are hidden), all of them with 4 borders
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(1, 1).borders.right).toEqual(MAGENTA_BORDER);

      expect(getCellMeta(1, 2).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 2).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 2).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(1, 2).borders.right).toEqual(MAGENTA_BORDER);

      expect(getCellMeta(2, 2).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(2, 2).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(2, 2).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(2, 2).borders.right).toEqual(MAGENTA_BORDER);

      expect(getCellMeta(3, 2).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(3, 2).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(3, 2).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(3, 2).borders.right).toEqual(MAGENTA_BORDER);
    });

    it('should not display custom border for single cell when row containing border is hidden by API call', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: true,
        customBorders: [{
          row: 1,
          col: 1,
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenRows').hideRow(1);
      render();

      // Just the meta is defined.
      expect(countVisibleCustomBorders()).toEqual(0);
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(1, 1).borders.right).toEqual(MAGENTA_BORDER);
    });

    it('should display custom border for single cell when hidden row containing border has been shown by API call', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1],
          indicators: true
        },
        customBorders: [{
          row: 1,
          col: 1,
          top: BLUE_BORDER,
          left: ORANGE_BORDER,
          bottom: RED_BORDER,
          right: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenRows').showRow(1);
      render();

      expect(countVisibleCustomBorders()).toEqual(4);
      expect(getCellMeta(1, 1).borders.left).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(1, 1).borders.right).toEqual(MAGENTA_BORDER);
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

    it('should draw border from context menu options in proper place when there are some hidden rows before ' +
      'a place where the border is added', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        contextMenu: true,
        customBorders: true,
        hiddenRows: {
          rows: [0, 1]
        }
      });

      await selectContextSubmenuOption('Borders', 'Top', getCell(2, 0));
      deselectCell();

      expect(getCellMeta(2, 0).borders.top).toEqual(DEFAULT_BORDER);
      expect(getCellMeta(2, 0).borders.left).toEqual(EMPTY);
      expect(getCellMeta(2, 0).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(2, 0).borders.right).toEqual(EMPTY);

      expect(countVisibleCustomBorders()).toBe(1);
      expect(countCustomBorders()).toBe(5);
    });
  });
});
