describe('CustomBorders (using backward compatible "left"/"right" options)', () => {
  const id = 'testContainer';

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
    it('should hide borders when disabled using updateSettings', async() => {
      handsontable({
        customBorders: [{
          row: 2,
          col: 2,
          left: RED_BORDER,
          right: RED_BORDER,
          top: GREEN_BORDER
        }]
      });

      await updateSettings({
        customBorders: false
      });

      expect(countVisibleCustomBorders()).toBe(0);
      expect(countCustomBorders()).toBe(0);
    });

    it('should hide borders when disabled using disablePlugin', async() => {
      handsontable({
        customBorders: [{
          row: 2,
          col: 2,
          left: RED_BORDER,
          right: RED_BORDER,
          top: GREEN_BORDER
        }]
      });

      getPlugin('customBorders').disablePlugin();

      expect(countVisibleCustomBorders()).toBe(0);
      expect(countCustomBorders()).toBe(0);
    });

    it('should show initial borders when re-enabled using updateSettings', async() => {
      handsontable({
        customBorders: [{
          row: 2,
          col: 2,
          left: RED_BORDER,
          right: RED_BORDER,
          top: GREEN_BORDER
        }]
      });

      await updateSettings({
        customBorders: false
      });
      await updateSettings({
        customBorders: true
      });

      expect(countVisibleCustomBorders()).toBe(3); // TODO this assertion checks current behavior that looks like a bug. I would expect 0
      expect(countCustomBorders()).toBe(5); // TODO this assertion checks current behavior that looks like a bug. I would expect 0
    });

    it('should show initial borders when re-enabled using disablePlugin', async() => {
      handsontable({
        customBorders: [{
          row: 2,
          col: 2,
          left: RED_BORDER,
          right: RED_BORDER,
          top: GREEN_BORDER
        }]
      });

      getPlugin('customBorders').disablePlugin();
      getPlugin('customBorders').enablePlugin();

      expect(countVisibleCustomBorders()).toBe(0); // TODO this assertion checks current behavior that looks like a bug. I would expect 3
      expect(countCustomBorders()).toBe(0);
    });

    it('should not throw an error when the same borders object is passed by reference', async() => {
      const customBorders = [{
        row: 2,
        col: 2,
        left: RED_BORDER,
        right: GREEN_BORDER,
      }];

      handsontable({
        customBorders,
      });

      expect(() => {
        customBorders.push({
          row: 2,
          col: 2,
          left: RED_BORDER,
          right: GREEN_BORDER,
        });

        // eslint-disable-next-line handsontable/require-await
        updateSettings({ customBorders });
      }).not.toThrow();
    });
  });

  it('should translate borders declared using new "start"/"end" API to backward compatible format', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        start: RED_BORDER,
        end: RED_BORDER,
        top: GREEN_BORDER
      }]
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.start).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.left).toEqual(RED_BORDER); // The same as "start"
    expect(getCellMeta(2, 2).borders.end).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.right).toEqual(RED_BORDER); // The same as "end"

    expect(countVisibleCustomBorders()).toBe(3);
    expect(countCustomBorders()).toBe(5);
  });

  it('should render specific borders provided in the configuration', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
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

  it('should draw new borders by use setBorders method (while selected)', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: true
    });

    const customBorders = getPlugin('customBorders');

    await selectCells([[1, 1, 2, 2]]);
    customBorders.setBorders(getSelected(), {
      left: GREEN_BORDER,
      right: RED_BORDER
    });
    await deselectCell();

    expect(getCellMeta(1, 1).borders.top).toEqual(EMPTY);
    expect(getCellMeta(1, 1).borders.left).toEqual(GREEN_BORDER);
    expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(1, 1).borders.right).toEqual(RED_BORDER);

    expect(getCellMeta(1, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(1, 2).borders.left).toEqual(GREEN_BORDER);
    expect(getCellMeta(1, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(1, 2).borders.right).toEqual(RED_BORDER);

    expect(getCellMeta(2, 1).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 1).borders.left).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 1).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 1).borders.right).toEqual(RED_BORDER);

    expect(getCellMeta(2, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.left).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.right).toEqual(RED_BORDER);

    expect(countVisibleCustomBorders()).toBe(8);
    expect(countCustomBorders()).toBe(4 * 5); // there are 4 cells in the provided range
  });

  it('should draw new borders by use setBorders method (while deselected)', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: true
    });

    const customBorders = getPlugin('customBorders');

    customBorders.setBorders([[1, 1, 2, 2]], {
      left: GREEN_BORDER,
      right: RED_BORDER
    });

    expect(getCellMeta(1, 1).borders.top).toEqual(EMPTY);
    expect(getCellMeta(1, 1).borders.left).toEqual(GREEN_BORDER);
    expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(1, 1).borders.right).toEqual(RED_BORDER);

    expect(getCellMeta(1, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(1, 2).borders.left).toEqual(GREEN_BORDER);
    expect(getCellMeta(1, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(1, 2).borders.right).toEqual(RED_BORDER);

    expect(getCellMeta(2, 1).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 1).borders.left).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 1).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 1).borders.right).toEqual(RED_BORDER);

    expect(getCellMeta(2, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.left).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.right).toEqual(RED_BORDER);

    expect(countVisibleCustomBorders()).toBe(8);
    expect(countCustomBorders()).toBe(4 * 5); // there are 4 cells in the provided range
  });

  it('should redraw existing borders by use setBorders method (while selected)', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: RED_BORDER,
        top: GREEN_BORDER,
        bottom: GREEN_BORDER,
      }]
    });

    const customBorders = getPlugin('customBorders');

    await selectCell(2, 2);
    customBorders.setBorders(getSelectedRange(), {
      left: GREEN_BORDER,
      right: RED_BORDER
    });
    await deselectCell();

    expect(getCellMeta(2, 2).borders.top).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.left).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.right).toEqual(RED_BORDER);
    expect(countVisibleCustomBorders()).toBe(4);
    expect(countCustomBorders()).toBe(5);
  });

  it('should redraw existing borders by use setBorders method (while deselected)', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: RED_BORDER,
        top: GREEN_BORDER,
        bottom: GREEN_BORDER,
      }]
    });

    const customBorders = getPlugin('customBorders');

    customBorders.setBorders([[2, 2]], {
      left: GREEN_BORDER,
      right: RED_BORDER
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.left).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.right).toEqual(RED_BORDER);
    expect(countVisibleCustomBorders()).toBe(4);
    expect(countCustomBorders()).toBe(5);
  });

  it('should hide only specific border by use setBorders method with {hide: true} (while selected)', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: RED_BORDER,
        right: RED_BORDER,
        top: GREEN_BORDER
      }]
    });

    const customBorders = getPlugin('customBorders');

    await selectCell(2, 2);
    customBorders.setBorders(getSelected(), {
      right: EMPTY
    });
    await deselectCell();

    expect(getCellMeta(2, 2).borders.top).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.left).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.right).toEqual(EMPTY);
    expect(countVisibleCustomBorders()).toBe(2);
    expect(countCustomBorders()).toBe(5);
  });

  it('should hide only specific border by use setBorders method with {hide: true} (while deselected)', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: RED_BORDER,
        right: RED_BORDER,
        top: GREEN_BORDER
      }]
    });

    const customBorders = getPlugin('customBorders');

    customBorders.setBorders([[2, 2]], {
      right: EMPTY
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.left).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.right).toEqual(EMPTY);
    expect(countVisibleCustomBorders()).toBe(2);
    expect(countCustomBorders()).toBe(5);
  });

  it('should hide only specific border by use setBorders method with {right: false} (while selected)', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: RED_BORDER,
        right: RED_BORDER,
        top: GREEN_BORDER
      }]
    });

    const customBorders = getPlugin('customBorders');

    await selectCell(2, 2);
    customBorders.setBorders(getSelected(), {
      right: false
    });
    await deselectCell();

    expect(getCellMeta(2, 2).borders.top).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.left).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.right).toEqual(EMPTY);

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

  it('should hide only specific border by use setBorders method with {right: false} (while deselected)', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: RED_BORDER,
        right: RED_BORDER,
        top: GREEN_BORDER
      }]
    });

    const customBorders = getPlugin('customBorders');

    customBorders.setBorders([[2, 2]], {
      right: false
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.left).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.right).toEqual(EMPTY);

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

  it('should return borders from the selected area by use getBorders method', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: RED_BORDER,
        right: GREEN_BORDER,
        top: GREEN_BORDER
      }]
    });

    const customBorders = getPlugin('customBorders');

    await selectCells([[1, 1, 2, 2]]);

    const borders = customBorders.getBorders(getSelected());

    await deselectCell();

    expect(borders.length).toEqual(1);
    expect(borders[0].top).toEqual(GREEN_BORDER);
    expect(borders[0].bottom).toEqual(EMPTY);
    expect(borders[0].left).toEqual(RED_BORDER);
    expect(borders[0].right).toEqual(GREEN_BORDER);
    expect(countVisibleCustomBorders()).toBe(3);
    expect(countCustomBorders()).toBe(5);
  });

  it('should return all borders by use getBorders method without parameter', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
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

    const customBorders = getPlugin('customBorders');

    const borders = customBorders.getBorders();

    expect(borders.length).toEqual(9);
    expect(countVisibleCustomBorders()).toBe(15); // there are 9 cells in the provided range, some of which have 1, 2 or 3 rendered borders
    expect(countCustomBorders()).toBe(9 * 5); // there are 9 cells in the provided range
  });

  it('should clear borders from area by use clearBorders method (while selected)', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
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

    const customBorders = getPlugin('customBorders');

    /*
    Was:
    0000
    0111
    0111
    0111
    */

    await selectCells([[0, 0, 2, 2]]);
    customBorders.clearBorders(getSelectedRange());
    await deselectCell();

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

  it('should clear borders from area by use clearBorders method (while deselected)', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
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

    const customBorders = getPlugin('customBorders');

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

  it('should clear all borders by use clearBorders method without parameter', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
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

    const customBorders = getPlugin('customBorders');

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

  it('should draw top border from context menu options', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    await selectContextSubmenuOption('Borders', 'Top');
    await deselectCell();

    expect(getCellMeta(0, 0).borders.top).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 0).borders.left).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.right).toEqual(EMPTY);

    expect(countVisibleCustomBorders()).toBe(1);
    expect(countCustomBorders()).toBe(5);
  });

  it('should draw left border from context menu options', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    await selectContextSubmenuOption('Borders', 'Left');
    await deselectCell();

    expect(getCellMeta(0, 0).borders.top).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.left).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.right).toEqual(EMPTY);
    expect(countVisibleCustomBorders()).toBe(1);
    expect(countCustomBorders()).toBe(5);
  });

  it('should draw right border from context menu options', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    await selectContextSubmenuOption('Borders', 'Right');
    await deselectCell();

    expect(getCellMeta(0, 0).borders.top).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.left).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.right).toEqual(DEFAULT_BORDER);
    expect(countVisibleCustomBorders()).toBe(1);
    expect(countCustomBorders()).toBe(5);
  });

  it('should draw bottom border from context menu options', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    await selectContextSubmenuOption('Borders', 'Bottom');
    await deselectCell();

    expect(getCellMeta(0, 0).borders.top).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.left).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 0).borders.right).toEqual(EMPTY);
    expect(countVisibleCustomBorders()).toBe(1);
    expect(countCustomBorders()).toBe(5);
  });

  it('should remove all bottoms border from context menu options', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
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
    await deselectCell();

    expect(getCellMeta(0, 0).borders).toBeUndefined();
    expect(countVisibleCustomBorders()).toBe(0);
    expect(countCustomBorders()).toBe(0);
  });
});
