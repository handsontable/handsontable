describe('CustomBorders', () => {
  const id = 'testContainer';
  const DEFAULT_THIN_BORDER = { color: '#000', width: 1 };
  const THIN_GREEN_BORDER = { color: 'green', width: 1 };
  const MEDIUM_GREEN_BORDER = { color: 'green', width: 2 };
  const MEDIUM_RED_BORDER = { color: 'red', width: 2 };
  const MEDIUM_MAGENTA_BORDER = { color: 'magenta', width: 2 };
  const MEDIUM_BLUE_BORDER = { color: 'blue', width: 2 };
  const MEDIUM_ORANGE_BORDER = { color: 'orange', width: 2 };
  const EMPTY = { hide: true };

  function generateCustomBordersForAllRows(numRows) {
    const bordersConfig = [];

    for (let i = 0; i < numRows; i++) {
      const cellBorder = {
        row: i,
        col: 0,
        top: THIN_GREEN_BORDER
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

    it('should hide borders when added new empty configuration for the plugin', () => {
      const hot = handsontable({
        customBorders: [{
          row: 2,
          col: 2,
          left: MEDIUM_RED_BORDER,
          right: MEDIUM_RED_BORDER,
          top: THIN_GREEN_BORDER
        }]
      });

      hot.updateSettings({
        customBorders: []
      });

      expect(getRenderedBorderPaths(document.body)).toEqual(['', '']);
    });

    it('should hide borders when disabled using updateSettings', () => {
      const hot = handsontable({
        customBorders: [{
          row: 2,
          col: 2,
          left: MEDIUM_RED_BORDER,
          right: MEDIUM_RED_BORDER,
          top: THIN_GREEN_BORDER
        }]
      });

      hot.updateSettings({
        customBorders: false
      });

      expect(getRenderedBorderPaths(document.body)).toEqual(['', '']);
    });

    it('should hide borders when disabled using disablePlugin', () => {
      const hot = handsontable({
        customBorders: [{
          row: 2,
          col: 2,
          left: MEDIUM_RED_BORDER,
          right: MEDIUM_RED_BORDER,
          top: THIN_GREEN_BORDER
        }]
      });

      hot.getPlugin('customBorders').disablePlugin();

      expect(getRenderedBorderPaths(document.body)).toEqual(['', '']);
      expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid green', '2px solid red']);
    });

    it('should show initial borders when re-enabled using updateSettings', () => {
      const hot = handsontable({
        customBorders: [{
          row: 2,
          col: 2,
          left: MEDIUM_RED_BORDER,
          right: MEDIUM_RED_BORDER,
          top: THIN_GREEN_BORDER
        }]
      });

      hot.updateSettings({
        customBorders: false
      });
      hot.updateSettings({
        customBorders: true
      });

      expect(getRenderedBorderPaths(document.body)).not.toEqual(['', '']);
      expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid green', '2px solid red']);
    });

    it('should show initial borders when re-enabled using disablePlugin', () => {
      const hot = handsontable({
        customBorders: [{
          row: 2,
          col: 2,
          left: MEDIUM_RED_BORDER,
          right: MEDIUM_RED_BORDER,
          top: THIN_GREEN_BORDER
        }]
      });

      hot.getPlugin('customBorders').disablePlugin();
      hot.getPlugin('customBorders').enablePlugin();

      expect(getRenderedBorderPaths(document.body)).toEqual(['', '']);
      // TODO the above assertion checks current behavior that looks like a bug. I would expect 3
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

    expect(getRenderedBorderPaths(document.body)).toEqual([]);
  });

  it('should render specific borders provided in the configuration', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        range: {
          from: {
            row: 1,
            col: 1
          },
          to: {
            row: 2,
            col: 2
          }
        },
        left: MEDIUM_RED_BORDER,
        right: MEDIUM_RED_BORDER,
        top: THIN_GREEN_BORDER
      }]
    });

    expect(getCellMeta(1, 1).borders.top).withContext('1,1 top').toEqual(THIN_GREEN_BORDER);
    expect(getCellMeta(1, 1).borders.left).withContext('1,1 left').toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(1, 1).borders.bottom).withContext('1,1 bottom').toEqual(EMPTY);
    expect(getCellMeta(1, 1).borders.right).withContext('1,1 right').toEqual(EMPTY);

    expect(getCellMeta(1, 2).borders.top).withContext('1,2 top').toEqual(THIN_GREEN_BORDER);
    expect(getCellMeta(1, 2).borders.left).withContext('1,2 left').toEqual(EMPTY);
    expect(getCellMeta(1, 2).borders.bottom).withContext('1,2 bottom').toEqual(EMPTY);
    expect(getCellMeta(1, 2).borders.right).withContext('1,2 right').toEqual(MEDIUM_RED_BORDER);

    expect(getCellMeta(2, 1).borders.top).withContext('2,1 top').toEqual(EMPTY);
    expect(getCellMeta(2, 1).borders.left).withContext('1,2 left').toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(2, 1).borders.bottom).withContext('1,2 bottom').toEqual(EMPTY);
    expect(getCellMeta(2, 1).borders.right).withContext('1,2 right').toEqual(EMPTY);

    expect(getCellMeta(2, 2).borders.top).withContext('2,2 top').toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.left).withContext('2,2 left').toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.bottom).withContext('2,2 bottom').toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.right).withContext('2,2 right').toEqual(MEDIUM_RED_BORDER);

    // TODO don't test the actual SVG paths in the line below. Rather, check if Walkontable has the correct selection and trust that it renders properly
    expect(getRenderedBorderPaths(document.body)).toEqual(['M 50 23.5 151 23.5', 'M 50 23 50 70 M 150 23 150 70']);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid green', '2px solid red']);
  });

  it('should draw new borders by use setBorders method (while selected)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: true
    });

    const customBorders = hot.getPlugin('customBorders');

    selectCells([[1, 1, 2, 2]]);
    customBorders.setBorders(getSelected(), {
      left: MEDIUM_RED_BORDER,
      top: THIN_GREEN_BORDER,
      bottom: MEDIUM_RED_BORDER
    });
    deselectCell();

    expect(getCellMeta(1, 1).borders.top).withContext('1,1 top').toEqual(THIN_GREEN_BORDER);
    expect(getCellMeta(1, 1).borders.left).withContext('1,1 left').toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(1, 1).borders.bottom).withContext('1,1 bottom').toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(1, 1).borders.right).withContext('1,1 right').toEqual(EMPTY);

    expect(getCellMeta(1, 2).borders.top).withContext('1,2 top').toEqual(THIN_GREEN_BORDER);
    expect(getCellMeta(1, 2).borders.left).withContext('1,2 left').toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(1, 2).borders.bottom).withContext('1,2 bottom').toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(1, 2).borders.right).withContext('1,2 right').toEqual(EMPTY);

    expect(getCellMeta(2, 1).borders.top).withContext('2,1 top').toEqual(THIN_GREEN_BORDER);
    expect(getCellMeta(2, 1).borders.left).withContext('1,2 left').toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(2, 1).borders.bottom).withContext('1,2 bottom').toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(2, 1).borders.right).withContext('1,2 right').toEqual(EMPTY);

    expect(getCellMeta(2, 2).borders.top).withContext('2,2 top').toEqual(THIN_GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.left).withContext('2,2 left').toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).withContext('2,2 bottom').toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(2, 2).borders.right).withContext('2,2 right').toEqual(EMPTY);

    // TODO don't test the actual SVG paths in the line below. Rather, check if Walkontable has the correct selection and trust that it renders properly
    expect(getRenderedBorderPaths(document.body)).toEqual(['M 50 23.5 151 23.5 M 50 46.5 151 46.5',
      'M 50 46 151 46 M 50 23 50 70 M 100 23 100 70 M 50 69 151 69', '', '']);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid green',
      '2px solid red', '1px solid #4b89ff', '2px solid #4b89ff']);
  });

  it('should draw new borders by use setBorders method (while deselected)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: true
    });

    const customBorders = hot.getPlugin('customBorders');

    customBorders.setBorders([[1, 1, 2, 2]], {
      left: MEDIUM_RED_BORDER,
      top: THIN_GREEN_BORDER,
      bottom: MEDIUM_RED_BORDER
    });

    expect(getCellMeta(1, 1).borders.top).withContext('1,1 top').toEqual(THIN_GREEN_BORDER);
    expect(getCellMeta(1, 1).borders.left).withContext('1,1 left').toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(1, 1).borders.bottom).withContext('1,1 bottom').toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(1, 1).borders.right).withContext('1,1 right').toEqual(EMPTY);

    expect(getCellMeta(1, 2).borders.top).withContext('1,2 top').toEqual(THIN_GREEN_BORDER);
    expect(getCellMeta(1, 2).borders.left).withContext('1,2 left').toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(1, 2).borders.bottom).withContext('1,2 bottom').toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(1, 2).borders.right).withContext('1,2 right').toEqual(EMPTY);

    expect(getCellMeta(2, 1).borders.top).withContext('2,1 top').toEqual(THIN_GREEN_BORDER);
    expect(getCellMeta(2, 1).borders.left).withContext('1,2 left').toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(2, 1).borders.bottom).withContext('1,2 bottom').toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(2, 1).borders.right).withContext('1,2 right').toEqual(EMPTY);

    expect(getCellMeta(2, 2).borders.top).withContext('2,2 top').toEqual(THIN_GREEN_BORDER);
    expect(getCellMeta(2, 2).borders.left).withContext('2,2 left').toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).withContext('2,2 bottom').toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(2, 2).borders.right).withContext('2,2 right').toEqual(EMPTY);

    // TODO don't test the actual SVG paths in the line below. Rather, check if Walkontable has the correct selection and trust that it renders properly
    expect(getRenderedBorderPaths(document.body)).toEqual(['M 50 23.5 151 23.5 M 50 46.5 151 46.5', 'M 50 46 151 46 M 50 23 50 70 M 100 23 100 70 M 50 69 151 69']);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid green', '2px solid red']);
  });

  it('should redraw existing borders by use setBorders method (while selected)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: MEDIUM_RED_BORDER,
        right: THIN_GREEN_BORDER,
        top: MEDIUM_GREEN_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    selectCell(2, 2);
    customBorders.setBorders(getSelectedRange(), {
      top: MEDIUM_ORANGE_BORDER,
      bottom: MEDIUM_ORANGE_BORDER
    });
    deselectCell();

    expect(getCellMeta(2, 2).borders.top).toEqual(MEDIUM_ORANGE_BORDER);
    expect(getCellMeta(2, 2).borders.left).toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(MEDIUM_ORANGE_BORDER);
    expect(getCellMeta(2, 2).borders.right).toEqual(THIN_GREEN_BORDER);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid green',
      '2px solid orange', '2px solid green', '2px solid red', '2px solid #4b89ff']);
  });

  it('should redraw existing borders by use setBorders method (while deselected)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: MEDIUM_RED_BORDER,
        right: THIN_GREEN_BORDER,
        top: MEDIUM_GREEN_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    customBorders.setBorders([[2, 2]], {
      top: MEDIUM_ORANGE_BORDER,
      bottom: MEDIUM_ORANGE_BORDER
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(MEDIUM_ORANGE_BORDER);
    expect(getCellMeta(2, 2).borders.left).toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(MEDIUM_ORANGE_BORDER);
    expect(getCellMeta(2, 2).borders.right).toEqual(THIN_GREEN_BORDER);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid green', '2px solid orange', '2px solid green', '2px solid red']);
  });

  it('should hide only specific border by use setBorders method with {hide: true} (while selected)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: MEDIUM_RED_BORDER,
        right: MEDIUM_RED_BORDER,
        top: THIN_GREEN_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    selectCell(2, 2);
    customBorders.setBorders(getSelected(), {
      top: EMPTY
    });
    deselectCell();

    expect(getCellMeta(2, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.left).toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.right).toEqual(MEDIUM_RED_BORDER);
    expect(getRenderedBorderPathExistence(document.body)).toEqual([false, true, false]);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid green', '2px solid red', '2px solid #4b89ff']);
  });

  it('should hide only specific border by use setBorders method with {hide: true} (while deselected)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: MEDIUM_RED_BORDER,
        right: MEDIUM_RED_BORDER,
        top: THIN_GREEN_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    customBorders.setBorders([[2, 2]], {
      top: EMPTY
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.left).toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.right).toEqual(MEDIUM_RED_BORDER);
    expect(getRenderedBorderPathExistence(document.body)).toEqual([false, true]);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid green', '2px solid red']);
  });

  it('should hide only specific border by use setBorders method with {top: false} (while selected)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: MEDIUM_RED_BORDER,
        right: MEDIUM_RED_BORDER,
        top: THIN_GREEN_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    selectCell(2, 2);
    customBorders.setBorders(getSelected(), {
      top: false
    });
    deselectCell();

    expect(getCellMeta(2, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.left).toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.right).toEqual(MEDIUM_RED_BORDER);

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

    expect(getRenderedBorderPathExistence(document.body)).toEqual([false, true, false]);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid green', '2px solid red', '2px solid #4b89ff']);
  });

  it('should hide only specific border by use setBorders method with {top: false} (while deselected)', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: MEDIUM_RED_BORDER,
        right: MEDIUM_RED_BORDER,
        top: THIN_GREEN_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    customBorders.setBorders([[2, 2]], {
      top: false
    });

    expect(getCellMeta(2, 2).borders.top).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.left).toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(2, 2).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(2, 2).borders.right).toEqual(MEDIUM_RED_BORDER);

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

    expect(getRenderedBorderPathExistence(document.body)).toEqual([false, true]);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid green', '2px solid red']);
  });

  it('should return borders from the selected area by use getBorders method', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      customBorders: [{
        row: 2,
        col: 2,
        left: MEDIUM_RED_BORDER,
        right: THIN_GREEN_BORDER,
        top: THIN_GREEN_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    hot.selectCells([[1, 1, 2, 2]]);
    const borders = customBorders.getBorders(getSelected());
    deselectCell();

    expect(borders.length).toEqual(1);
    expect(borders[0].top).toEqual(THIN_GREEN_BORDER);
    expect(borders[0].left).toEqual(MEDIUM_RED_BORDER);
    expect(borders[0].bottom).toEqual(EMPTY);
    expect(borders[0].right).toEqual(THIN_GREEN_BORDER);
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
        top: MEDIUM_BLUE_BORDER,
        left: MEDIUM_ORANGE_BORDER,
        bottom: MEDIUM_RED_BORDER,
        right: MEDIUM_MAGENTA_BORDER
      },
      {
        row: 2,
        col: 2,
        left: MEDIUM_RED_BORDER,
        right: THIN_GREEN_BORDER,
        top: MEDIUM_GREEN_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    const borders = customBorders.getBorders();

    expect(borders.length).toEqual(9);
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
        top: MEDIUM_BLUE_BORDER,
        left: MEDIUM_ORANGE_BORDER,
        bottom: MEDIUM_RED_BORDER,
        right: MEDIUM_MAGENTA_BORDER
      },
      {
        row: 2,
        col: 2,
        left: MEDIUM_RED_BORDER,
        right: THIN_GREEN_BORDER,
        top: MEDIUM_GREEN_BORDER
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

    expect(getCellMeta(1, 3).borders.top).toEqual(MEDIUM_BLUE_BORDER);
    expect(getCellMeta(1, 3).borders.right).toEqual(MEDIUM_MAGENTA_BORDER);
    expect(getCellMeta(2, 3).borders.right).toEqual(MEDIUM_MAGENTA_BORDER);
    expect(getCellMeta(3, 1).borders.left).toEqual(MEDIUM_ORANGE_BORDER);
    expect(getCellMeta(3, 1).borders.bottom).toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(3, 2).borders.bottom).toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(3, 3).borders.right).toEqual(MEDIUM_MAGENTA_BORDER);
    expect(getCellMeta(3, 3).borders.bottom).toEqual(MEDIUM_RED_BORDER);
    expect(getRenderedBorderPathExistence(document.body)).toEqual([false,
      true, false, true, true, true,
      false, false]);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid green',
      '2px solid orange', '2px solid green', '2px solid magenta', '2px solid red',
      '2px solid blue', '1px solid #4b89ff', '2px solid #4b89ff']);
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
        top: MEDIUM_BLUE_BORDER,
        left: MEDIUM_ORANGE_BORDER,
        bottom: MEDIUM_RED_BORDER,
        right: MEDIUM_MAGENTA_BORDER
      },
      {
        row: 2,
        col: 2,
        left: MEDIUM_RED_BORDER,
        right: THIN_GREEN_BORDER,
        top: MEDIUM_GREEN_BORDER
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

    expect(getCellMeta(1, 3).borders.top).toEqual(MEDIUM_BLUE_BORDER);
    expect(getCellMeta(1, 3).borders.right).toEqual(MEDIUM_MAGENTA_BORDER);
    expect(getCellMeta(2, 3).borders.right).toEqual(MEDIUM_MAGENTA_BORDER);
    expect(getCellMeta(3, 1).borders.left).toEqual(MEDIUM_ORANGE_BORDER);
    expect(getCellMeta(3, 1).borders.bottom).toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(3, 2).borders.bottom).toEqual(MEDIUM_RED_BORDER);
    expect(getCellMeta(3, 3).borders.right).toEqual(MEDIUM_MAGENTA_BORDER);
    expect(getCellMeta(3, 3).borders.bottom).toEqual(MEDIUM_RED_BORDER);
    expect(getRenderedBorderPathExistence(document.body)).toEqual([false,
      true, false, true, true, true]);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid green',
      '2px solid orange', '2px solid green', '2px solid magenta', '2px solid red', '2px solid blue']);
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
        top: MEDIUM_BLUE_BORDER,
        left: MEDIUM_ORANGE_BORDER,
        bottom: MEDIUM_RED_BORDER,
        right: MEDIUM_MAGENTA_BORDER
      },
      {
        row: 2,
        col: 2,
        left: MEDIUM_RED_BORDER,
        right: THIN_GREEN_BORDER,
        top: MEDIUM_GREEN_BORDER
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

    expect(getRenderedBorderPathExistence(document.body)).toEqual([false,
      false, false, false, false, false]);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid green',
      '2px solid orange', '2px solid green', '2px solid magenta', '2px solid red', '2px solid blue']);
  });

  it('should draw borders from context menu options when was first cleared borders by the clearBorders method', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: [{
        row: 0,
        col: 0,
        left: MEDIUM_RED_BORDER,
        right: THIN_GREEN_BORDER,
        top: MEDIUM_GREEN_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    selectCell(0, 0);
    customBorders.clearBorders(getSelectedRange());
    deselectCell();

    await selectContextSubmenuOption('Borders', 'Top');

    expect(getCellMeta(0, 0).borders.top).toEqual(DEFAULT_THIN_BORDER);
    expect(getCellMeta(0, 0).borders.left).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.right).toEqual(EMPTY);
    expect(getRenderedBorderPathExistence(document.body)).toEqual([false,
      true, false, false, true]);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid green',
      '1px solid #000', '2px solid green', '2px solid red', '2px solid #4b89ff']);
  });

  it('should clear all borders when first was cleared borders by the clearBorders method with selections,' +
    'then draw borders from context menu options, and then was cleared borders by the clearBorders method without selections', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: [{
        row: 0,
        col: 0,
        left: MEDIUM_RED_BORDER,
        right: THIN_GREEN_BORDER,
        top: MEDIUM_GREEN_BORDER
      }]
    });

    const customBorders = hot.getPlugin('customBorders');

    selectCell(0, 0);
    customBorders.clearBorders(getSelectedRange());
    deselectCell();

    await selectContextSubmenuOption('Borders', 'Top');

    customBorders.clearBorders();
    expect(getCellMeta(0, 0).borders).toBeUndefined();
    expect(getRenderedBorderPathExistence(document.body)).toEqual([false,
      false, false, false, true]);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid green',
      '1px solid #000', '2px solid green', '2px solid red', '2px solid #4b89ff']);
  });

  it('should draw top border from context menu options', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    await selectContextSubmenuOption('Borders', 'Top');

    // expect(getCellMeta(0,0).borders.hasOwnProperty('top')).toBe(true);
    expect(getCellMeta(0, 0).borders.top).toEqual(DEFAULT_THIN_BORDER);
    expect(getCellMeta(0, 0).borders.left).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.right).toEqual(EMPTY);

    expect(getRenderedBorderPathExistence(document.body)).toEqual([true, true]);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid #000', '2px solid #4b89ff']);
  });

  it('should draw left border from context menu options', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    await selectContextSubmenuOption('Borders', 'Left');

    /* eslint-disable no-prototype-builtins */
    expect(getCellMeta(0, 0).borders.hasOwnProperty('left')).toBe(true);
    expect(getCellMeta(0, 0).borders.top).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.left).toEqual(DEFAULT_THIN_BORDER);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.right).toEqual(EMPTY);
    expect(getRenderedBorderPathExistence(document.body)).toEqual([true, true]);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid #000', '2px solid #4b89ff']);
  });

  it('should draw right border from context menu options', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    await selectContextSubmenuOption('Borders', 'Right');

    /* eslint-disable no-prototype-builtins */
    expect(getCellMeta(0, 0).borders.hasOwnProperty('right')).toBe(true); // TODO flaky test. sometimes I get this error on this line: 'Failed: Cannot read property 'hasOwnProperty' of undefined'
    expect(getCellMeta(0, 0).borders.top).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.left).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.right).toEqual(DEFAULT_THIN_BORDER);
    expect(getRenderedBorderPathExistence(document.body)).toEqual([true, true]);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid #000', '2px solid #4b89ff']);
  });

  it('should draw bottom border from context menu options', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: true
    });

    await selectContextSubmenuOption('Borders', 'Bottom');

    /* eslint-disable no-prototype-builtins */
    expect(getCellMeta(0, 0).borders.hasOwnProperty('right')).toBe(true);
    expect(getCellMeta(0, 0).borders.top).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.left).toEqual(EMPTY);
    expect(getCellMeta(0, 0).borders.bottom).toEqual(DEFAULT_THIN_BORDER);
    expect(getCellMeta(0, 0).borders.right).toEqual(EMPTY);
    expect(getRenderedBorderPathExistence(document.body)).toEqual([true, true]);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid #000', '2px solid #4b89ff']);
  });

  it('should remove all bottoms border from context menu options', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      contextMenu: true,
      customBorders: [
        {
          row: 0,
          col: 0,
          left: MEDIUM_RED_BORDER,
          right: THIN_GREEN_BORDER
        }]
    });
    expect(getRenderedBorderPathExistence(document.body)).toEqual([true, true]);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid green', '2px solid red']);

    await selectContextSubmenuOption('Borders', 'Remove border');

    expect(getCellMeta(0, 0).borders).toBeUndefined();
    expect(getRenderedBorderPathExistence(document.body)).toEqual([false, false, true]);
    expect(getRenderedBorderStyles(document.body)).toEqual(['1px solid green', '2px solid red', '2px solid #4b89ff']);
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
      'Insert row above',
      'Insert row below',
      'Insert column left',
      'Insert column right',
      'Remove rows',
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

    // TODO don't test the actual SVG paths in the line below. Rather, check if Walkontable has the correct selection and trust that it renders properly
    const expectedBorders = ['M 0 0.5 51 0.5 M 0 23.5 51 23.5 M 0 46.5 51 46.5 M 0 69.5 51 69.5 M 0 92.5 51 92.5'];

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
      expect(getRenderedBorderPaths(document.body)).toEqual(expectedBorders);
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
      expect(getRenderedBorderPaths(document.body)).toEqual(expectedBorders);
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
      expect(getRenderedBorderPaths(document.body)).toEqual([`${expectedBorders
      } M 0 115.5 51 115.5 M 0 138.5 51 138.5 M 0 161.5 51 161.5 M 0 184.5 51 184.5 M 0 207.5 51 207.5`]);
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
      expect(getRenderedBorderPaths(document.body)).toEqual([]);
    });
  });
});
