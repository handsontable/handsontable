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
      }).toThrowWithCause('The "left"/"right" and "start"/"end" options should not be used together. ' +
                      'Please use only the option "start"/"end".', { handsontable: true });
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
        // eslint-disable-next-line handsontable/require-await
        updateSettings({
          customBorders: [{
            row: 2,
            col: 2,
            start: RED_BORDER,
            right: RED_BORDER,
          }]
        });
      }).toThrowWithCause('The "left"/"right" and "start"/"end" options should not be used together. ' +
                      'Please use only the option "start"/"end".', { handsontable: true });
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
    await deselectCell();

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
    await deselectCell();

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
    await deselectCell();

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
    await deselectCell();

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

    await selectCells([[1, 1, 2, 2]]);

    const borders = customBorders.getBorders(getSelected());

    await deselectCell();

    expect(borders.length).toEqual(1);
    expect(borders[0].top).toEqual(GREEN_BORDER);
    expect(borders[0].bottom).toEqual(EMPTY);
    expect(borders[0].start).toEqual(RED_BORDER);
    expect(borders[0].end).toEqual(GREEN_BORDER);
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

  it('should not throw an error when borders menu is opened through row header', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      rowHeaders: true,
      contextMenu: true,
      customBorders: true,
    });

    await selectContextSubmenuOption('Borders', 'Top', getCell(0, -1));

    await deselectCell();

    expect(getCellMeta(0, 0).borders.top).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 1).borders.top).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 2).borders.top).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 3).borders.top).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 0).borders.start).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.end).toEqual(EMPTY);
    expect(countVisibleCustomBorders()).toBe(4);
    // Border DOM is virtualized: only the 4 bordered cells in the master overlay carry border
    // elements (4 × 5 divs); the header overlay no longer materializes redundant copies.
    expect(countCustomBorders()).toBe(20);
  });

  it('should not throw an error when borders menu is opened through column header', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      colHeaders: true,
      contextMenu: true,
      customBorders: true,
    });

    await selectContextSubmenuOption('Borders', 'Right', getCell(-1, 0));

    await deselectCell();

    expect(getCellMeta(0, 0).borders.end).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(1, 0).borders.end).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(2, 0).borders.end).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(3, 0).borders.end).toEqual(DEFAULT_BORDER);
    expect(getCellMeta(0, 0).borders.top).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.start).toEqual(EMPTY);
    expect(countVisibleCustomBorders()).toBe(4);
    // Border DOM is virtualized: only the 4 bordered cells in the master overlay carry border
    // elements (4 × 5 divs); the header overlay no longer materializes redundant copies.
    expect(countCustomBorders()).toBe(20);
  });

  it('should draw borders from context menu options when was first cleared borders by the clearBorders method', async() => {
    handsontable({
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

    const customBorders = getPlugin('customBorders');

    await selectCell(0, 0);
    customBorders.clearBorders(getSelectedRange());
    await deselectCell();

    await selectContextSubmenuOption('Borders', 'Top');
    await deselectCell();

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
    handsontable({
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

    const customBorders = getPlugin('customBorders');

    await selectCell(0, 0);
    customBorders.clearBorders(getSelectedRange());
    await deselectCell();

    await selectContextSubmenuOption('Borders', 'Top');
    await deselectCell();

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
    await deselectCell();

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
    await deselectCell();

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
    await deselectCell();

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
    await deselectCell();

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
    await deselectCell();

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

    it('should render borders only for rendered rows', async() => {
      const data = createSpreadsheetData(10, 2);
      const customBorders = generateCustomBordersForAllRows(data.length);
      const containerHeight = containerHeightForRows(5, 0);
      const instance = handsontable({
        data,
        customBorders,
        height: containerHeight,
        viewportRowRenderingOffset: 0
      });

      const renderedRows = instance.countRenderedRows();

      // Container was sized to fit 5 fully visible rows; rendered rows include a partial
      // row below (see Core_count.spec.js), so the count is exactly `expectedVisibleRows + 1`.
      expect(renderedRows).toBe(expectedVisibleRows(containerHeight, 0) + 1);
      expect(countVisibleCustomBorders()).toEqual(renderedRows);
      // Border DOM is virtualized: only the rendered rows carry border elements (5 divs each),
      // not all 10 rows. This is the guarantee that lets large bordered grids stay cheap.
      expect(countCustomBorders()).toEqual(renderedRows * 5);
    });

    it('should render borders only for rendered rows, after scrolling', async() => {
      const data = createSpreadsheetData(10, 2);
      const customBorders = generateCustomBordersForAllRows(data.length);
      const containerHeight = containerHeightForRows(5, 0);
      const instance = handsontable({
        data,
        customBorders,
        height: containerHeight,
        viewportRowRenderingOffset: 0
      });

      await scrollViewportVertically(400);

      const renderedRows = instance.countRenderedRows();
      const expectedVisible = expectedVisibleRows(containerHeight, 0);

      // Container was sized to fit `expectedVisible` fully visible rows. After scrolling, the
      // count is `expectedVisible + 1` (partial row at bottom) and at most `expectedVisible + 2`
      // when a partial row is also exposed at the top due to sub-pixel scroll offsets.
      expect(renderedRows).toBeGreaterThanOrEqual(expectedVisible + 1);
      expect(renderedRows).toBeLessThanOrEqual(expectedVisible + 2);
      expect(countVisibleCustomBorders()).toEqual(renderedRows);
      // Border DOM is virtualized and tracks the viewport: after scrolling, only the rendered rows
      // carry border elements (5 divs each), so off-screen rows' border DOM is released.
      expect(countCustomBorders()).toEqual(renderedRows * 5);
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

  describe('structural changes (issues #11031, #6063, #3296)', () => {
    it('should move a border down when a row is inserted above it', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }]
      });

      expect(getCellMeta(3, 0).borders.top).toEqual(GREEN_BORDER);

      await alter('insert_row_above', 1, 1);

      // The border follows the cell it was applied to: the plugin's own bookkeeping and the
      // cell meta agree that it now lives on row 4 (getBorders() drives the rendered selection).
      const borders = getPlugin('customBorders').getBorders();

      expect(borders.length).toBe(1);
      expect(borders[0].row).toBe(4);
      expect(borders[0].col).toBe(0);
      expect(getCellMeta(4, 0).borders.top).toEqual(GREEN_BORDER);
      expect(getCellMeta(3, 0).borders).toBeUndefined();
      expect(countVisibleCustomBorders()).toBe(1);
    });

    it('should move a border down by the inserted amount for a multi-row insert', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }]
      });

      await alter('insert_row_above', 1, 3);

      const borders = getPlugin('customBorders').getBorders();

      expect(borders[0].row).toBe(6);
      expect(getCellMeta(6, 0).borders.top).toEqual(GREEN_BORDER);
      expect(countVisibleCustomBorders()).toBe(1);
    });

    it('should move a border up when a row above it is removed', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }]
      });

      await alter('remove_row', 1, 1);

      const borders = getPlugin('customBorders').getBorders();

      expect(borders[0].row).toBe(2);
      expect(getCellMeta(2, 0).borders.top).toEqual(GREEN_BORDER);
      expect(countVisibleCustomBorders()).toBe(1);
    });

    it('should drop a border when its own row is removed', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }]
      });

      await alter('remove_row', 3, 1);

      expect(getPlugin('customBorders').getBorders().length).toBe(0);
      expect(getCellMeta(3, 0).borders).toBeUndefined();
      expect(countVisibleCustomBorders()).toBe(0);
      expect(countCustomBorders()).toBe(0);
    });

    it('should move a border right when a column is inserted before it', async() => {
      handsontable({
        data: createSpreadsheetData(3, 5),
        customBorders: [{ row: 0, col: 3, start: RED_BORDER }]
      });

      await alter('insert_col_start', 1, 1);

      const borders = getPlugin('customBorders').getBorders();

      expect(borders[0].col).toBe(4);
      expect(getCellMeta(0, 4).borders.start).toEqual(RED_BORDER);
      expect(getCellMeta(0, 3).borders).toBeUndefined();
      expect(countVisibleCustomBorders()).toBe(1);
    });

    it('should drop a border when its own column is removed', async() => {
      handsontable({
        data: createSpreadsheetData(3, 5),
        customBorders: [{ row: 0, col: 3, start: RED_BORDER }]
      });

      await alter('remove_col', 3, 1);

      expect(getPlugin('customBorders').getBorders().length).toBe(0);
      expect(getCellMeta(0, 3).borders).toBeUndefined();
      expect(countVisibleCustomBorders()).toBe(0);
      expect(countCustomBorders()).toBe(0);
    });

    it('should let the context menu remove a border after it was shifted by a row insert (orphaned id)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        contextMenu: true,
        customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }]
      });

      await alter('insert_row_above', 1, 1);

      // The border now lives on row 4. Before the fix its id still encoded row 3, so removing it
      // from the cell it visually belongs to left the rendered border orphaned.
      await selectCell(4, 0);
      await selectContextSubmenuOption('Borders', 'Remove border');
      await deselectCell();

      expect(getCellMeta(4, 0).borders).toBeUndefined();
      expect(getPlugin('customBorders').getBorders().length).toBe(0);
      expect(countVisibleCustomBorders()).toBe(0);
      expect(countCustomBorders()).toBe(0);
    });

    it('should keep a border on its cell when the row is moved with manualRowMove', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        manualRowMove: true,
        customBorders: [{ row: 1, col: 0, top: GREEN_BORDER }]
      });

      getPlugin('manualRowMove').moveRow(1, 3);
      await render();

      const borders = getPlugin('customBorders').getBorders();

      expect(borders[0].row).toBe(3);
      expect(getCellMeta(3, 0).borders.top).toEqual(GREEN_BORDER);
      expect(countVisibleCustomBorders()).toBe(1);
    });

    it('should keep a border on its cell when the column is moved with manualColumnMove', async() => {
      handsontable({
        data: createSpreadsheetData(3, 5),
        manualColumnMove: true,
        customBorders: [{ row: 0, col: 1, start: RED_BORDER }]
      });

      getPlugin('manualColumnMove').moveColumn(1, 3);
      await render();

      const borders = getPlugin('customBorders').getBorders();

      expect(borders[0].col).toBe(3);
      expect(getCellMeta(0, 3).borders.start).toEqual(RED_BORDER);
      expect(countVisibleCustomBorders()).toBe(1);
    });

    it('should keep the range border edges aligned across corner and middle cells after an insert', async() => {
      handsontable({
        data: createSpreadsheetData(10, 6),
        customBorders: [{
          range: { from: { row: 3, col: 1 }, to: { row: 6, col: 4 } },
          border: { width: 2, color: '#548235' },
          top: {},
          bottom: {},
          start: {},
          end: {},
        }],
      });

      await alter('insert_row_above', 1, 1); // the range shifts down to rows 4-7

      // The top edge must stay one straight line: the horizontal border over the top-left corner
      // cell and over a top middle cell must sit at the same Y. Regression for an id collision that
      // destroyed the freshly shifted corner selections, dropping their horizontal edge.
      const horizontalBorderTopIn = (row, col) => {
        const cell = getCell(row, col).getBoundingClientRect();

        const overlapsCell = (r) => {
          const centerX = r.left + (r.width / 2);

          return r.width > r.height && centerX >= cell.left && centerX <= cell.right;
        };

        return $('.wtBorder:not(.fill, .current, .area, .corner)').toArray()
          .filter(el => el.offsetParent && el.style.backgroundColor === 'rgb(84, 130, 53)')
          .map(el => el.getBoundingClientRect())
          .filter(overlapsCell)
          .map(r => r.top)
          .sort((a, b) => Math.abs(a - cell.top) - Math.abs(b - cell.top))[0];
      };

      const cornerCell = getCell(4, 1).getBoundingClientRect();
      const cornerTop = horizontalBorderTopIn(4, 1); // top-left corner of the shifted range
      const middleTop = horizontalBorderTopIn(4, 2); // adjacent top middle cell

      // The corner's top border sits at the corner cell's top edge...
      expect(Math.abs(cornerTop - cornerCell.top)).toBeLessThanOrEqual(2);
      // ...and it is level with the middle cell's top border (one continuous line).
      expect(Math.abs(cornerTop - middleTop)).toBeLessThanOrEqual(1);
    });

    it('should keep a border on its data cell when a row is inserted with trimmed rows active', async() => {
      handsontable({
        data: createSpreadsheetData(6, 3),
        trimRows: [2], // a trimmed physical row sits next to the insertion point
        customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }]
      });

      // Identify the bordered cell by its data, so the assertion holds regardless of the
      // non-contiguous visual/physical mapping that trimming introduces.
      const borderedValue = getDataAtCell(3, 0);

      await alter('insert_row_above', 2, 1);

      const newRow = getPlugin('customBorders').getBorders()[0].row;

      // The border still marks the same underlying data cell - the shift did not drift away from it.
      expect(getDataAtCell(newRow, 0)).toBe(borderedValue);
      expect(getCellMeta(newRow, 0).borders.top).toEqual(GREEN_BORDER);
      expect(countVisibleCustomBorders()).toBe(1);
    });

    it('should keep a border on its data cell when a row is removed with trimmed rows active', async() => {
      handsontable({
        data: createSpreadsheetData(6, 3),
        trimRows: [1],
        customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }]
      });

      const borderedValue = getDataAtCell(3, 0);

      await alter('remove_row', 1, 1);

      const newRow = getPlugin('customBorders').getBorders()[0].row;

      expect(getDataAtCell(newRow, 0)).toBe(borderedValue);
      expect(getCellMeta(newRow, 0).borders.top).toEqual(GREEN_BORDER);
      expect(countVisibleCustomBorders()).toBe(1);
    });

    it('should keep a border on its data cell when a row is inserted with hidden rows active', async() => {
      handsontable({
        data: createSpreadsheetData(6, 3),
        hiddenRows: { rows: [2] },
        customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }]
      });

      const borderedValue = getDataAtCell(3, 0);

      await alter('insert_row_above', 1, 1);

      const newRow = getPlugin('customBorders').getBorders()[0].row;

      expect(getDataAtCell(newRow, 0)).toBe(borderedValue);
      expect(getCellMeta(newRow, 0).borders.top).toEqual(GREEN_BORDER);
    });
  });

  describe('range with a `border` object (issue #6679)', () => {
    const VISIBLE_BORDER_SELECTOR = '.wtBorder:not(.fill, .current, .area, .corner)';

    it('should apply the range-level `border` style to empty sides instead of the default', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        customBorders: [{
          range: {
            from: { row: 1, col: 1 },
            to: { row: 3, col: 3 },
          },
          border: { width: 2, color: '#548235' },
          top: {},
          bottom: {},
          start: {},
          end: {},
        }],
      });

      // The empty `{}` sides inherit the range-level `border` width and color, not the 1px black default.
      expect(getCellMeta(1, 1).borders.top).toEqual({ width: 2, color: '#548235' });
      expect(getCellMeta(1, 1).borders.start).toEqual({ width: 2, color: '#548235' });
      expect(getCellMeta(3, 3).borders.bottom).toEqual({ width: 2, color: '#548235' });
      expect(getCellMeta(3, 3).borders.end).toEqual({ width: 2, color: '#548235' });

      // The border renders with the configured color instead of the default black.
      const bgColors = $(VISIBLE_BORDER_SELECTOR).filter(':visible').toArray()
        .map(el => el.style.backgroundColor);

      expect(bgColors).toContain('rgb(84, 130, 53)');
      expect(bgColors).not.toContain('rgb(0, 0, 0)');
    });

    it('should keep the borders from both ranges where two ranges overlap', async() => {
      handsontable({
        data: createSpreadsheetData(6, 6),
        customBorders: [
          {
            range: { from: { row: 1, col: 1 }, to: { row: 2, col: 3 } },
            border: { width: 2, color: '#C6E0B4' },
            top: {},
            bottom: {},
            start: {},
            end: {},
          },
          {
            range: { from: { row: 2, col: 1 }, to: { row: 3, col: 3 } },
            border: { width: 2, color: '#548235' },
            top: {},
            bottom: {},
            start: {},
            end: {},
          },
        ],
      });

      // Cell (2, 2) is the bottom edge of the first range and the top edge of the second range.
      // Both sides must survive, each carrying its own range color.
      const borders = getCellMeta(2, 2).borders;

      expect(borders.top).toEqual({ width: 2, color: '#548235' });
      expect(borders.bottom).toEqual({ width: 2, color: '#C6E0B4' });

      // Both range colors render, so the overlapping range is not swallowed by the topmost one.
      const bgColors = $(VISIBLE_BORDER_SELECTOR).filter(':visible').toArray()
        .map(el => el.style.backgroundColor);

      expect(bgColors).toContain('rgb(198, 224, 180)'); // #C6E0B4 - first range
      expect(bgColors).toContain('rgb(84, 130, 53)'); // #548235 - second range
    });

    it('should align edges and stack deterministically where ranges of different widths overlap', async() => {
      handsontable({
        data: createSpreadsheetData(8, 8),
        customBorders: [
          {
            range: { from: { row: 1, col: 1 }, to: { row: 3, col: 5 } },
            border: { width: 2, color: '#C6E0B4' }, // thin light range
            top: {},
            bottom: {},
            start: {},
            end: {},
          },
          {
            range: { from: { row: 3, col: 3 }, to: { row: 5, col: 7 } },
            border: { width: 3, color: '#548235' }, // thick dark range, overlaps at (3, 3..5)
            top: {},
            bottom: {},
            start: {},
            end: {},
          },
        ],
      });

      // The light range's bottom edge (row 3) runs across cells that are, at col 3, also the dark
      // range's left edge. The horizontal light line must stay level: the crossing cell must not be
      // nudged 1px by the thicker range's width (regression for the shared-delta positioning).
      const lightBottomTopAt = (col) => {
        const cell = getCell(3, col).getBoundingClientRect();

        return $('.wtBorder:not(.fill, .current, .area, .corner)').toArray()
          .filter(el => el.offsetParent && el.style.backgroundColor === 'rgb(198, 224, 180)')
          .map(el => el.getBoundingClientRect())
          .filter((r) => {
            const centerX = r.left + (r.width / 2);

            return r.width > r.height && centerX >= cell.left && centerX <= cell.right;
          })
          .map(r => r.top)
          .sort((a, b) => Math.abs(a - cell.bottom) - Math.abs(b - cell.bottom))[0];
      };

      expect(Math.round(lightBottomTopAt(3))).toBe(Math.round(lightBottomTopAt(2)));

      // The thicker (dark) edge stacks above the thinner (light) one, so overlaps are consistent
      // regardless of creation order. Stacking is per edge element (by its own width), so a single
      // visual line keeps one z-index even where it crosses a shared cell.
      const zIndexOfColor = (color) => {
        const el = $('.wtBorder').toArray()
          .find(e => e.offsetParent && e.style.backgroundColor === color);

        return el ? parseInt(el.style.zIndex, 10) : NaN;
      };

      expect(zIndexOfColor('rgb(84, 130, 53)')).toBeGreaterThan(zIndexOfColor('rgb(198, 224, 180)'));

      // At the corner (3, 5) the dark range's thick top edge meets the light range's thinner right
      // edge. The horizontal edge must reach, but not overshoot, the vertical one - its length is
      // extended by the perpendicular edge's width, not its own.
      const cornerCell = getCell(3, 5).getBoundingClientRect();
      const outerRightOf = (color, wantHorizontal) => {
        return $('.wtBorder:not(.fill, .current, .area, .corner)').toArray()
          .filter(el => el.offsetParent && el.style.backgroundColor === color)
          .map(el => el.getBoundingClientRect())
          .filter((r) => {
            const centerX = r.left + (r.width / 2);
            const centerY = r.top + (r.height / 2);

            return (r.width > r.height) === wantHorizontal &&
              centerX >= cornerCell.left - 3 && centerX <= cornerCell.right + 3 &&
              centerY >= cornerCell.top - 3 && centerY <= cornerCell.bottom + 3;
          })
          .map(r => r.right)
          .sort((a, b) => b - a)[0];
      };

      expect(Math.round(outerRightOf('rgb(84, 130, 53)', true)))
        .toBeLessThanOrEqual(Math.round(outerRightOf('rgb(198, 224, 180)', false)));
    });

    it('should not leave a border edge sticking out into a column inserted inside a range', async() => {
      handsontable({
        data: createSpreadsheetData(8, 10),
        customBorders: [{
          range: { from: { row: 2, col: 2 }, to: { row: 5, col: 6 } },
          border: { width: 3, color: '#548235' },
          top: {},
          bottom: {},
          start: {},
          end: {},
        }],
      });

      // Insert a new, border-less column inside the range - it splits the range's horizontal edges.
      await alter('insert_col_start', 4, 1);

      // The cell just left of the new column (col 3) has no right border there (its `end` is hidden),
      // so its bottom edge must stay within the cell and not extend into the empty inserted column.
      const leftCell = getCell(5, 3).getBoundingClientRect();
      const bottomEdgeRight = $('.wtBorder:not(.fill, .current, .area, .corner)').toArray()
        .filter(el => el.offsetParent && el.style.backgroundColor === 'rgb(84, 130, 53)')
        .map(el => el.getBoundingClientRect())
        .filter((r) => {
          const centerX = r.left + (r.width / 2);

          return r.width > r.height && centerX >= leftCell.left && centerX <= leftCell.right &&
            Math.abs((r.top + (r.height / 2)) - leftCell.bottom) < 5;
        })
        .map(r => r.right)
        .sort((a, b) => b - a)[0];

      expect(Math.round(bottomEdgeRight)).toBeLessThanOrEqual(Math.round(leftCell.right));
    });
  });

  describe('progressive application (customBordersProgressive)', () => {
    it('should fire afterCustomBordersUpdate synchronously when progressive is disabled (default)', async() => {
      let fired = 0;

      handsontable({
        data: createSpreadsheetData(4, 4),
        customBorders: [{ row: 1, col: 1, top: GREEN_BORDER }],
        afterCustomBordersUpdate: () => {
          fired += 1;
        }
      });

      // Default (synchronous) path: borders are applied and the hook has fired by the time init returns.
      expect(fired).toBeGreaterThanOrEqual(1);
      expect(getPlugin('customBorders').getBorders().length).toBe(1);
      expect(getCellMeta(1, 1).borders.top).toEqual(GREEN_BORDER);
    });

    it('should defer border application and apply it in the background when enabled', async() => {
      const config = [];

      for (let row = 0; row < 20; row++) {
        config.push({ row, col: 0, top: GREEN_BORDER });
      }

      let resolveDone;
      const done = new Promise((resolve) => {
        resolveDone = resolve;
      });

      handsontable({
        data: createSpreadsheetData(20, 4),
        customBorders: config,
        customBordersProgressive: { chunkSize: 5 },
        afterCustomBordersUpdate: () => resolveDone(),
      });

      // Right after init the grid is rendered but the borders have NOT been applied yet - they are
      // queued for background batches, so init did not block on building them.
      expect(countRenderedRows()).toBeGreaterThan(0);
      expect(getPlugin('customBorders').getBorders().length).toBe(0);

      await done;

      // Once the queue drains, the full configuration is applied - identical to the synchronous path.
      expect(getPlugin('customBorders').getBorders().length).toBe(config.length);
      expect(getCellMeta(0, 0).borders.top).toEqual(GREEN_BORDER);
      expect(getCellMeta(19, 0).borders.top).toEqual(GREEN_BORDER);
      expect(countVisibleCustomBorders()).toBeGreaterThan(0);
    });

    it('should cancel an in-flight progressive load when the configuration is replaced', async() => {
      const config = [];

      for (let row = 0; row < 20; row++) {
        config.push({ row, col: 0, top: GREEN_BORDER });
      }

      handsontable({
        data: createSpreadsheetData(20, 4),
        customBorders: config,
        customBordersProgressive: { chunkSize: 2 },
      });

      // Replace the configuration while the progressive load is still in flight. The pending batches
      // must be cancelled and only the new (synchronous) configuration should remain.
      let resolveDone;
      const done = new Promise((resolve) => {
        resolveDone = resolve;
      });

      await updateSettings({
        customBorders: [{ row: 5, col: 1, top: RED_BORDER }],
        customBordersProgressive: false,
        afterCustomBordersUpdate: () => resolveDone(),
      });

      await done;

      const borders = getPlugin('customBorders').getBorders();

      expect(borders.length).toBe(1);
      expect(getCellMeta(5, 1).borders.top).toEqual(RED_BORDER);
      // No stray borders left over from the cancelled progressive configuration.
      expect(getCellMeta(0, 0).borders).toBeUndefined();
      expect(getCellMeta(19, 0).borders).toBeUndefined();
    });
  });
});
