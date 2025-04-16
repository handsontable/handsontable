describe('CustomBorders', () => {
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
    it('should be defined by default', async() => {
      handsontable();

      expect(getPlugin('customBorders')).toBeDefined();
    });

    it('should be defined when disabled by configuration', async() => {
      handsontable({
        customBorders: false
      });

      expect(getPlugin('customBorders')).toBeDefined();
    });

    it('should be defined when enabled by configuration', async() => {
      handsontable({
        customBorders: true
      });

      expect(getPlugin('customBorders')).toBeDefined();
    });

    it('should be disabled by default', async() => {
      handsontable();

      expect(getPlugin('customBorders').isEnabled()).toBe(false);
    });

    it('should disable plugin using updateSettings', async() => {
      handsontable({
        customBorders: true
      });

      await updateSettings({
        customBorders: false
      });

      expect(getPlugin('customBorders')).toBeDefined();
      expect(getPlugin('customBorders').isEnabled()).toBe(false);
    });

    it('should enable plugin using updateSettings', async() => {
      handsontable({
        customBorders: false
      });

      await updateSettings({
        customBorders: true
      });

      expect(getPlugin('customBorders')).toBeDefined();
      expect(getPlugin('customBorders').isEnabled()).toBe(true);
    });

    it('should NOT disable plugin using disablePlugin', async() => {
      handsontable({
        customBorders: true
      });

      getPlugin('customBorders').disablePlugin();

      expect(getPlugin('customBorders')).toBeDefined();
      expect(getPlugin('customBorders').isEnabled()).toBe(true); // TODO this assertion checks current behavior that looks like a bug. I would expect false
    });

    it('should NOT enable plugin using enablePlugin', async() => {
      handsontable({
        customBorders: false
      });

      getPlugin('customBorders').enablePlugin();

      expect(getPlugin('customBorders')).toBeDefined();
      expect(getPlugin('customBorders').isEnabled()).toBe(false); // TODO this assertion checks current behavior that looks like a bug. I would expect true
    });

    it('should hide borders when disabled using updateSettings', async() => {
      handsontable({
        customBorders: [{
          row: 2,
          col: 2,
          start: RED_BORDER,
          end: RED_BORDER,
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
          start: RED_BORDER,
          end: RED_BORDER,
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
          start: RED_BORDER,
          end: RED_BORDER,
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
          start: RED_BORDER,
          end: RED_BORDER,
          top: GREEN_BORDER
        }]
      });

      getPlugin('customBorders').disablePlugin();
      getPlugin('customBorders').enablePlugin();

      expect(countVisibleCustomBorders()).toBe(0); // TODO this assertion checks current behavior that looks like a bug. I would expect 3
      expect(countCustomBorders()).toBe(0);
    });

    it('should throw an error while initialization if the mixed API is used ("start"/"end" and "left"/"right")', async() => {
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
      }).toThrowError('The "left"/"right" and "start"/"end" options should not be used together. ' +
                      'Please use only the option "start"/"end".');
    });

    it('should throw an error while calling the `updateSettings` method when the mixed API is used ("start"/"end" and "left"/"right")', async() => {
      handsontable({
        customBorders: [{
          row: 2,
          col: 2,
          start: RED_BORDER,
          top: GREEN_BORDER
        }]
      });

      expect(() => {
        updateSettings({
          customBorders: [{
            row: 2,
            col: 2,
            start: RED_BORDER,
            right: RED_BORDER,
          }]
        });
      }).toThrowError('The "left"/"right" and "start"/"end" options should not be used together. ' +
                      'Please use only the option "start"/"end".');
    });

    it('should create a deep clone of the borders object configuration', async() => {
      const customBorders = [{
        row: 2,
        col: 2,
        left: RED_BORDER,
        right: GREEN_BORDER,
      }];

      handsontable({
        customBorders,
      });

      expect(customBorders).toEqual([
        {
          row: 2,
          col: 2,
          left: RED_BORDER,
          right: GREEN_BORDER,
        }
      ]);
      expect(getPlugin('customBorders').savedBorders).not.toBe(customBorders);

      await updateSettings({ customBorders });

      expect(customBorders).toEqual([
        {
          row: 2,
          col: 2,
          left: RED_BORDER,
          right: GREEN_BORDER,
        }
      ]);
      expect(getPlugin('customBorders').savedBorders).not.toBe(customBorders);
    });

    it('should be possible to update borders using backward compatible API ("left"/"right") even when Handsontable was initialized using new API ("start"/"end")', async() => {
      handsontable({
        customBorders: [{
          row: 2,
          col: 2,
          start: RED_BORDER,
          top: GREEN_BORDER
        }]
      });

      await updateSettings({
        customBorders: [{
          row: 2,
          col: 2,
          left: RED_BORDER,
          right: RED_BORDER,
        }]
      });

      expect(countVisibleCustomBorders()).toBe(2);
      expect(countCustomBorders()).toBe(5);
    });

    it('should be possible to update borders using new API ("start"/"end") even when Handsontable was initialized using backward compatible API ("left"/"right")', async() => {
      handsontable({
        customBorders: [{
          row: 2,
          col: 2,
          left: RED_BORDER,
          top: GREEN_BORDER
        }]
      });

      await updateSettings({
        customBorders: [{
          row: 2,
          col: 2,
          start: RED_BORDER,
          end: RED_BORDER,
        }]
      });

      expect(countVisibleCustomBorders()).toBe(2);
      expect(countCustomBorders()).toBe(5);
    });
  });

  it('should throw an exception `Unsupported selection ranges schema type was provided.` after calling setBorder method without parameter', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: true
    });

    const customBorders = getPlugin('customBorders');
    let errors = 0;

    try {
      customBorders.setBorders();
    } catch (err) {
      errors += 1;
    }

    expect(errors).toEqual(1);
  });

  it('should not draw any custom borders by default', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: true
    });

    expect(countCustomBorders()).toBe(0);
  });

  it('should render specific borders provided in the configuration', async() => {
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

  it('should draw new borders by use setBorders method (while selected)', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: true
    });

    const customBorders = getPlugin('customBorders');

    await selectCells([[1, 1, 2, 2]]);
    customBorders.setBorders(getSelected(), {
      top: RED_BORDER,
      end: RED_BORDER
    });
    deselectCell();

    expect(getCellMeta(1, 1).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(1, 1).borders.start).toEqual(EMPTY);
    expect(getCellMeta(1, 1).borders.end).toEqual(RED_BORDER);

    expect(getCellMeta(1, 2).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(1, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(1, 2).borders.start).toEqual(EMPTY);
    expect(getCellMeta(1, 2).borders.end).toEqual(RED_BORDER);

    expect(getCellMeta(2, 1).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(2, 1).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 1).borders.start).toEqual(EMPTY);
    expect(getCellMeta(2, 1).borders.end).toEqual(RED_BORDER);

    expect(getCellMeta(2, 2).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.start).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.end).toEqual(RED_BORDER);

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
      top: RED_BORDER,
      end: RED_BORDER
    });

    expect(getCellMeta(1, 1).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(1, 1).borders.start).toEqual(EMPTY);
    expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(1, 1).borders.end).toEqual(RED_BORDER);

    expect(getCellMeta(1, 2).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(1, 2).borders.start).toEqual(EMPTY);
    expect(getCellMeta(1, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(1, 2).borders.end).toEqual(RED_BORDER);

    expect(getCellMeta(2, 1).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(2, 1).borders.start).toEqual(EMPTY);
    expect(getCellMeta(2, 1).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 1).borders.end).toEqual(RED_BORDER);

    expect(getCellMeta(2, 2).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.start).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.end).toEqual(RED_BORDER);

    expect(countVisibleCustomBorders()).toBe(8);
    expect(countCustomBorders()).toBe(4 * 5); // there are 4 cells in the provided range
  });

  it('should redraw existing borders by use setBorders method (while selected)', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        start: RED_BORDER,
        end: GREEN_BORDER,
        top: GREEN_THICK_BORDER
      }]
    });

    const customBorders = getPlugin('customBorders');

    await selectCell(2, 2);

    customBorders.setBorders(getSelectedRange(), {
      top: RED_BORDER,
      bottom: GREEN_BORDER,
      end: RED_BORDER
    });
    deselectCell();

    expect(getCellMeta(2, 2).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.start).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.end).toEqual(RED_BORDER);
    expect(countVisibleCustomBorders()).toBe(4);
    expect(countCustomBorders()).toBe(5);
  });

  it('should redraw existing borders by use setBorders method (while deselected)', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        start: RED_BORDER,
        end: GREEN_BORDER,
        top: GREEN_THICK_BORDER
      }]
    });

    const customBorders = getPlugin('customBorders');

    customBorders.setBorders([[2, 2]], {
      top: RED_BORDER,
      bottom: GREEN_BORDER,
      end: RED_BORDER
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.start).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.end).toEqual(RED_BORDER);
    expect(countVisibleCustomBorders()).toBe(4);
    expect(countCustomBorders()).toBe(5);
  });

  it('should hide only specific border by use setBorders method with {hide: true} (while selected)', async() => {
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

    await selectCell(2, 2);

    customBorders.setBorders(getSelected(), {
      top: EMPTY,
      end: EMPTY,
    });
    deselectCell();

    expect(getCellMeta(2, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.start).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.end).toEqual(EMPTY);
    expect(countVisibleCustomBorders()).toBe(1);
    expect(countCustomBorders()).toBe(5);
  });

  it('should hide only specific border by use setBorders method with {hide: true} (while deselected)', async() => {
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
      top: EMPTY,
      end: EMPTY,
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.start).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.end).toEqual(EMPTY);
    expect(countVisibleCustomBorders()).toBe(1);
    expect(countCustomBorders()).toBe(5);
  });

  it('should hide only specific border by use setBorders method with {top: false} (while selected)', async() => {
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

    await selectCell(2, 2);

    customBorders.setBorders(getSelected(), {
      top: false,
      end: false,
    });
    deselectCell();

    expect(getCellMeta(2, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.start).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
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

    expect(countVisibleCustomBorders()).toBe(1);
    expect(countCustomBorders()).toBe(5);
  });

  it('should hide only specific border by use setBorders method with {top: false} (while deselected)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        start: RED_BORDER,
        end: RED_BORDER,
        top: GREEN_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    customBorders.setBorders([[2, 2]], {
      top: false,
      end: false,
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.start).toEqual(RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
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

    expect(countVisibleCustomBorders()).toBe(1);
    expect(countCustomBorders()).toBe(5);
  });

  it('should return borders from the selected area by use getBorders method', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        start: RED_BORDER,
        end: GREEN_BORDER,
        top: GREEN_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    hot.selectCells([[1, 1, 2, 2]]);
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

  it('should return all borders by use getBorders method without parameter', async() => {
    const hot = handsontable({
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

    const customBorders = hot.getPlugin('customBorders');

    const borders = customBorders.getBorders();

    expect(borders.length).toEqual(9);
    expect(countVisibleCustomBorders()).toBe(15); // there are 9 cells in the provided range, some of which have 1, 2 or 3 rendered borders
    expect(countCustomBorders()).toBe(9 * 5); // there are 9 cells in the provided range
  });

  it('should clear borders from area by use clearBorders method (while selected)', async() => {
    const hot = handsontable({
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

    const customBorders = hot.getPlugin('customBorders');

    /*
    Was:
    0000
    0111
    0111
    0111
    */

    await selectCells([[0, 0, 2, 2]]);
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

  it('should clear borders from area by use clearBorders method (while deselected)', async() => {
    const hot = handsontable({
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

  it('should clear all borders by use clearBorders method without parameter', async() => {
    const hot = handsontable({
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
      data: createSpreadsheetData(4, 4),
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
    expect(getCellMeta(0, 0).borders.start).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.end).toEqual(EMPTY);
    expect(countVisibleCustomBorders()).toBe(4);
    expect(countCustomBorders()).toBe(40);
  });

  it('should not throw an error when borders menu is opened through column header', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      colHeaders: true,
      contextMenu: true,
      customBorders: true,
    });

    await selectContextSubmenuOption('Borders', 'Right', getCell(-1, 0));

    deselectCell();

    expect(getCellMeta(0, 0).borders.end).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(1, 0).borders.end).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(2, 0).borders.end).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(3, 0).borders.end).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 0).borders.top).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.start).toEqual(EMPTY);
    expect(countVisibleCustomBorders()).toBe(4);
    expect(countCustomBorders()).toBe(40);
  });

  it('should draw borders from context menu options when was first cleared borders by the clearBorders method', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: [{
        row: 0,
        col: 0,
        start: RED_BORDER,
        end: GREEN_BORDER,
        top: GREEN_THICK_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    await selectCell(0, 0);
    customBorders.clearBorders(getSelectedRange());
    deselectCell();

    await selectContextSubmenuOption('Borders', 'Top');
    deselectCell();

    expect(getCellMeta(0, 0).borders.top).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.start).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.end).toEqual(EMPTY);
    expect(countVisibleCustomBorders()).toBe(1);
    expect(countCustomBorders()).toBe(5);
  });

  it('should clear all borders when first was cleared borders by the clearBorders method with selections, ' +
     'then draw borders from context menu options, and then was cleared borders by the clearBorders ' +
     'method without selections', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: [{
        row: 0,
        col: 0,
        start: RED_BORDER,
        end: GREEN_BORDER,
        top: GREEN_THICK_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    await selectCell(0, 0);
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

    /* eslint-disable no-prototype-builtins */
    expect(getCellMeta(0, 0).borders.hasOwnProperty('left')).toBe(true);
    expect(getCellMeta(0, 0).borders.top).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.start).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 0).borders.end).toEqual(EMPTY);
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

    /* eslint-disable no-prototype-builtins */
    expect(getCellMeta(0, 0).borders.hasOwnProperty('right')).toBe(true); // TODO flaky test. sometimes I get this error on this line: 'Failed: Cannot read property 'hasOwnProperty' of undefined'
    expect(getCellMeta(0, 0).borders.top).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.start).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.end).toEqual(DEFAULT_BORDER);
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

    /* eslint-disable no-prototype-builtins */
    expect(getCellMeta(0, 0).borders.hasOwnProperty('right')).toBe(true);
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

  it('should disable `Borders` context menu item when menu was triggered from corner header', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
      rowHeaders: true,
      colHeaders: true,
      contextMenu: true,
      customBorders: true,
    });

    const corner = $('.ht_clone_top_inline_start_corner .htCore').find('thead').find('th').eq(0);

    await simulateClick(corner, 'RMB');
    await contextMenu();

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

    it.forTheme('classic')('should render borders only for rendered rows', async() => {
      const data = createSpreadsheetData(10, 2);
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

    it.forTheme('main')('should render borders only for rendered rows', async() => {
      const data = createSpreadsheetData(10, 2);
      const customBorders = generateCustomBordersForAllRows(data.length);
      const instance = handsontable({
        data,
        customBorders,
        height: 125,
        viewportRowRenderingOffset: 0
      });

      expect(instance.countRenderedRows()).toEqual(5);
      expect(countVisibleCustomBorders()).toEqual(5);
      expect(countCustomBorders()).toEqual(10 * 5); // TODO I think this should be 5 * 5
    });

    it.forTheme('horizon')('should render borders only for rendered rows', async() => {
      const data = createSpreadsheetData(10, 2);
      const customBorders = generateCustomBordersForAllRows(data.length);
      const instance = handsontable({
        data,
        customBorders,
        height: 159,
        viewportRowRenderingOffset: 0
      });

      expect(instance.countRenderedRows()).toEqual(5);
      expect(countVisibleCustomBorders()).toEqual(5);
      expect(countCustomBorders()).toEqual(10 * 5); // TODO I think this should be 5 * 5
    });

    it.forTheme('classic')('should render borders only for rendered rows, after scrolling', async() => {
      const data = createSpreadsheetData(10, 2);
      const customBorders = generateCustomBordersForAllRows(data.length);
      const instance = handsontable({
        data,
        customBorders,
        height: 100,
        viewportRowRenderingOffset: 0
      });
      const mainHolder = instance.view._wt.wtTable.holder;

      $(mainHolder).scrollTop(400);
      await sleep(300);
      expect(instance.countRenderedRows()).toEqual(5);
      expect(countVisibleCustomBorders()).toEqual(5);
      expect(countCustomBorders()).toEqual(10 * 5); // TODO I think this should be 5 * 5
    });

    it.forTheme('main')('should render borders only for rendered rows, after scrolling', async() => {
      const data = createSpreadsheetData(10, 2);
      const customBorders = generateCustomBordersForAllRows(data.length);
      const instance = handsontable({
        data,
        customBorders,
        height: 125,
        viewportRowRenderingOffset: 0
      });
      const mainHolder = instance.view._wt.wtTable.holder;

      $(mainHolder).scrollTop(400);
      await sleep(300);
      expect(instance.countRenderedRows()).toEqual(5);
      expect(countVisibleCustomBorders()).toEqual(5);
      expect(countCustomBorders()).toEqual(10 * 5); // TODO I think this should be 5 * 5
    });

    it.forTheme('horizon')('should render borders only for rendered rows, after scrolling', async() => {
      const data = createSpreadsheetData(10, 2);
      const customBorders = generateCustomBordersForAllRows(data.length);
      const instance = handsontable({
        data,
        customBorders,
        height: 159,
        viewportRowRenderingOffset: 0
      });
      const mainHolder = instance.view._wt.wtTable.holder;

      $(mainHolder).scrollTop(400);
      await sleep(300);
      expect(instance.countRenderedRows()).toEqual(5);
      expect(countVisibleCustomBorders()).toEqual(5);
      expect(countCustomBorders()).toEqual(10 * 5); // TODO I think this should be 5 * 5
    });

    it('should render borders only for rendered rows, including rows rendered because of viewportRowRenderingOffset', async() => {
      const data = createSpreadsheetData(10, 2);
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
      const data = createSpreadsheetData(10, 2);
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
  it('should draw borders properly when they end beyond the table boundaries (drawing range)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
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
        start: ORANGE_BORDER,
        bottom: RED_BORDER,
        end: MAGENTA_BORDER
      }]
    });

    expect(countVisibleCustomBorders()).toEqual(4 + 4); // 4 rows x 4 columns from one side
    // First cell from the top-left position
    expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
    expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(1, 1).borders.start).toEqual(ORANGE_BORDER);
    expect(getCellMeta(1, 1).borders.end).toEqual(EMPTY);
    // First cell from the top-right position
    expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
    expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(1, 4).borders.start).toEqual(EMPTY);
    expect(getCellMeta(1, 4).borders.end).toEqual(EMPTY);
    // // First cell from the bottom-left position
    expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
    expect(getCellMeta(4, 1).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(4, 1).borders.start).toEqual(ORANGE_BORDER);
    expect(getCellMeta(4, 1).borders.end).toEqual(EMPTY);
    // // First cell from the bottom-right position
    expect(getCellMeta(4, 4).borders).toBeUndefined();
    // Cell in the middle of area without borders
    expect(getCellMeta(2, 3).borders).toBeUndefined();
  });
});
