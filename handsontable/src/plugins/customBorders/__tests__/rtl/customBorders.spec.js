describe('CustomBorders (RTL mode)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    const wrapper = $('<div></div>').css({
      width: 400,
      height: 200,
      overflow: 'scroll'
    });

    this.$wrapper = this.$container.wrap(wrapper).parent();
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
    this.$wrapper.remove();
  });

  describe('enabling/disabling plugin', () => {
    it('should throw an error while initialization if the mixed API is used ("start"/"end" and "left"/"right")', () => {
      expect(() => {
        handsontable({
          customBorders: [{
            row: 2,
            col: 2,
            start: RED_BORDER,
            right: RED_BORDER,
            top: GREEN_BORDER
          }]
        });
      }).toThrowError('The "left"/"right" and "start"/"end" options should not be used together. Please use only the option "start"/"end".');
    });

    it('should not be possible to use backward compatible API ("left"/"right") in RTL mode (initialization)', () => {
      expect(() => {
        handsontable({
          customBorders: [{
            row: 2,
            col: 2,
            right: RED_BORDER,
          }]
        });
      }).toThrowError('The "left"/"right" properties are not supported for RTL. Please use option "start"/"end".');
    });

    it('should not be possible to use backward compatible API ("left"/"right") in RTL mode (updateSettings call)', () => {
      handsontable({
        customBorders: [{
          row: 2,
          col: 2,
          start: RED_BORDER,
        }]
      });

      expect(() => {
        updateSettings({
          customBorders: [{
            row: 2,
            col: 2,
            right: RED_BORDER,
          }]
        });
      }).toThrowError('The "left"/"right" properties are not supported for RTL. Please use option "start"/"end".');
    });
  });

  it('should render specific borders provided in the configuration', () => {
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
    expect(getCellMeta(2, 2).borders.end).toEqual(RED_BORDER);

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

  it('should throw an error when the "left"/"right" options are passed to the setBorders method', () => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: true
    });

    const customBorders = getPlugin('customBorders');

    expect(() => {
      customBorders.setBorders([1, 1, 2, 2], {
        left: GREEN_BORDER,
      });
    }).toThrowError('The "left"/"right" properties are not supported for RTL. Please use option "start"/"end".');
  });

  it('should draw new borders by use setBorders method (while selected)', () => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: true
    });

    const customBorders = getPlugin('customBorders');

    selectCells([[1, 1, 2, 2]]);
    customBorders.setBorders(getSelected(), {
      start: GREEN_BORDER,
      end: RED_BORDER
    });
    deselectCell();

    expect(getCellMeta(1, 1).borders.top).toEqual(EMPTY);
    expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(1, 1).borders.start).toEqual(GREEN_BORDER);
    expect(getCellMeta(1, 1).borders.end).toEqual(RED_BORDER);

    expect(getCellMeta(1, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(1, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(1, 2).borders.start).toEqual(GREEN_BORDER);
    expect(getCellMeta(1, 2).borders.end).toEqual(RED_BORDER);

    expect(getCellMeta(2, 1).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 1).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 1).borders.start).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 1).borders.end).toEqual(RED_BORDER);

    expect(getCellMeta(2, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.start).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.end).toEqual(RED_BORDER);

    expect(countVisibleCustomBorders()).toBe(8);
    expect(countCustomBorders()).toBe(4 * 5); // there are 4 cells in the provided range
  });

  it('should draw new borders by use setBorders method (while deselected)', () => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: true
    });

    const customBorders = getPlugin('customBorders');

    customBorders.setBorders([[1, 1, 2, 2]], {
      start: GREEN_BORDER,
      end: RED_BORDER
    });

    expect(getCellMeta(1, 1).borders.top).toEqual(EMPTY);
    expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(1, 1).borders.start).toEqual(GREEN_BORDER);
    expect(getCellMeta(1, 1).borders.end).toEqual(RED_BORDER);

    expect(getCellMeta(1, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(1, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(1, 2).borders.start).toEqual(GREEN_BORDER);
    expect(getCellMeta(1, 2).borders.end).toEqual(RED_BORDER);

    expect(getCellMeta(2, 1).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 1).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 1).borders.start).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 1).borders.end).toEqual(RED_BORDER);

    expect(getCellMeta(2, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.start).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.end).toEqual(RED_BORDER);

    expect(countVisibleCustomBorders()).toBe(8);
    expect(countCustomBorders()).toBe(4 * 5); // there are 4 cells in the provided range
  });

  it('should redraw existing borders by use setBorders method (while selected)', () => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        start: RED_BORDER,
        top: GREEN_BORDER,
        bottom: GREEN_BORDER,
      }]
    });

    const customBorders = getPlugin('customBorders');

    selectCell(2, 2);
    customBorders.setBorders(getSelectedRange(), {
      start: GREEN_BORDER,
      end: RED_BORDER
    });
    deselectCell();

    expect(getCellMeta(2, 2).borders.top).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.start).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.end).toEqual(RED_BORDER);
    expect(countVisibleCustomBorders()).toBe(4);
    expect(countCustomBorders()).toBe(5);
  });

  it('should redraw existing borders by use setBorders method (while deselected)', () => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        start: RED_BORDER,
        top: GREEN_BORDER,
        bottom: GREEN_BORDER,
      }]
    });

    const customBorders = getPlugin('customBorders');

    customBorders.setBorders([[2, 2]], {
      start: GREEN_BORDER,
      end: RED_BORDER
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.start).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.end).toEqual(RED_BORDER);
    expect(countVisibleCustomBorders()).toBe(4);
    expect(countCustomBorders()).toBe(5);
  });

  it('should hide only specific border by use setBorders method with {hide: true} (while selected)', () => {
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

    const customBorders = getPlugin('customBorders');

    selectCell(2, 2);
    customBorders.setBorders(getSelected(), {
      end: EMPTY
    });
    deselectCell();

    expect(getCellMeta(2, 2).borders.top).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.start).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.end).toEqual(EMPTY);
    expect(countVisibleCustomBorders()).toBe(2);
    expect(countCustomBorders()).toBe(5);
  });

  it('should hide only specific border by use setBorders method with {hide: true} (while deselected)', () => {
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

    const customBorders = getPlugin('customBorders');

    customBorders.setBorders([[2, 2]], {
      end: EMPTY
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.start).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.end).toEqual(EMPTY);
    expect(countVisibleCustomBorders()).toBe(2);
    expect(countCustomBorders()).toBe(5);
  });

  it('should hide only specific border by use setBorders method with {end: false} (while selected)', () => {
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

    const customBorders = getPlugin('customBorders');

    selectCell(2, 2);
    customBorders.setBorders(getSelected(), {
      end: false
    });
    deselectCell();

    expect(getCellMeta(2, 2).borders.top).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.start).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.end).toEqual(EMPTY);

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

  it('should hide only specific border by use setBorders method with {end: false} (while deselected)', () => {
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

    const customBorders = getPlugin('customBorders');

    customBorders.setBorders([[2, 2]], {
      end: false
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.start).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.end).toEqual(EMPTY);

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
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        start: RED_BORDER,
        end: GREEN_BORDER,
        top: GREEN_BORDER
      }]
    });

    const customBorders = getPlugin('customBorders');

    selectCells([[1, 1, 2, 2]]);
    const borders = customBorders.getBorders(getSelected());

    deselectCell();

    expect(borders.length).toEqual(1);
    expect(borders[0].top).toEqual(GREEN_BORDER);
    expect(borders[0].bottom).toEqual(EMPTY);
    expect(borders[0].start).toEqual(RED_BORDER);
    expect(borders[0].end).toEqual(GREEN_BORDER);
    expect(countVisibleCustomBorders()).toBe(3);
    expect(countCustomBorders()).toBe(5);
  });

  it('should return all borders by use getBorders method without parameter', () => {
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
        start: ORANGE_BORDER,
        bottom: RED_BORDER,
        end: MAGENTA_BORDER
      },
      {
        row: 2,
        col: 2,
        start: RED_BORDER,
        end: GREEN_BORDER,
        top: GREEN_THICK_BORDER
      }]
    });

    const customBorders = getPlugin('customBorders');

    const borders = customBorders.getBorders();

    expect(borders.length).toEqual(9);
    expect(countVisibleCustomBorders()).toBe(15); // there are 9 cells in the provided range, some of which have 1, 2 or 3 rendered borders
    expect(countCustomBorders()).toBe(9 * 5); // there are 9 cells in the provided range
  });

  it('should clear borders from area by use clearBorders method (while selected)', () => {
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
        start: ORANGE_BORDER,
        bottom: RED_BORDER,
        end: MAGENTA_BORDER
      },
      {
        row: 2,
        col: 2,
        start: RED_BORDER,
        end: GREEN_BORDER,
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
    expect(getCellMeta(1, 3).borders.end).toEqual(MAGENTA_BORDER);
    expect(getCellMeta(2, 3).borders.end).toEqual(MAGENTA_BORDER);
    expect(getCellMeta(3, 1).borders.start).toEqual(ORANGE_BORDER);
    expect(getCellMeta(3, 1).borders.bottom).toEqual(RED_BORDER);
    expect(getCellMeta(3, 2).borders.bottom).toEqual(RED_BORDER);
    expect(getCellMeta(3, 3).borders.end).toEqual(MAGENTA_BORDER);
    expect(getCellMeta(3, 3).borders.bottom).toEqual(RED_BORDER);
    expect(countVisibleCustomBorders()).toBe(8);
    expect(countCustomBorders()).toBe(5 * 5);
  });

  it('should clear borders from area by use clearBorders method (while deselected)', () => {
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
        start: ORANGE_BORDER,
        bottom: RED_BORDER,
        end: MAGENTA_BORDER
      },
      {
        row: 2,
        col: 2,
        start: RED_BORDER,
        end: GREEN_BORDER,
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
    expect(getCellMeta(1, 3).borders.end).toEqual(MAGENTA_BORDER);
    expect(getCellMeta(2, 3).borders.end).toEqual(MAGENTA_BORDER);
    expect(getCellMeta(3, 1).borders.start).toEqual(ORANGE_BORDER);
    expect(getCellMeta(3, 1).borders.bottom).toEqual(RED_BORDER);
    expect(getCellMeta(3, 2).borders.bottom).toEqual(RED_BORDER);
    expect(getCellMeta(3, 3).borders.end).toEqual(MAGENTA_BORDER);
    expect(getCellMeta(3, 3).borders.bottom).toEqual(RED_BORDER);
    expect(countVisibleCustomBorders()).toBe(8);
    expect(countCustomBorders()).toBe(5 * 5);
  });

  it('should clear all borders by use clearBorders method without parameter', () => {
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
        start: ORANGE_BORDER,
        bottom: RED_BORDER,
        end: MAGENTA_BORDER
      },
      {
        row: 2,
        col: 2,
        start: RED_BORDER,
        end: GREEN_BORDER,
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
    deselectCell();

    expect(getCellMeta(0, 0).borders.top).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.start).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.end).toEqual(EMPTY);

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
    deselectCell();

    expect(getCellMeta(0, 0).borders.top).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.start).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.end).toEqual(DEFAULT_BORDER);
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
    deselectCell();

    expect(getCellMeta(0, 0).borders.top).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.start).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 0).borders.end).toEqual(EMPTY);
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
    deselectCell();

    expect(getCellMeta(0, 0).borders.top).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 0).borders.start).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.end).toEqual(EMPTY);
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
          start: RED_BORDER,
          end: GREEN_BORDER
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
});
