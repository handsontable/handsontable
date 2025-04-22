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

  describe('cooperation with the `HiddenColumns` plugin', () => {
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }, {
          row: 7,
          col: 7,
          top: BLUE_BORDER,
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      expect(countVisibleCustomBorders()).toEqual(4);
      expect(getCellMeta(0, 0).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(0, 0).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(0, 0).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(0, 0).borders.end).toEqual(MAGENTA_BORDER);
      expect(getCellMeta(2, 2).borders).toBeUndefined();
    });

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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + 4); // 4 rows x 3 columns without left border
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.end).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.start).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.end).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.end).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.start).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.end).toEqual(MAGENTA_BORDER);
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenColumns').hideColumn(1);
      render();

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + 4); // 4 rows x 3 columns without left border
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.end).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.start).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.end).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.end).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.start).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.end).toEqual(MAGENTA_BORDER);
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenColumns').showColumn(1);
      render();

      expect(countVisibleCustomBorders()).toEqual(4 * 4); // 4 rows x 4 columns
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.end).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.start).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.end).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.end).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.start).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.end).toEqual(MAGENTA_BORDER);
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + 4); // 4 rows x 3 columns without right border
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.end).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.start).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.end).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.end).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.start).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.end).toEqual(MAGENTA_BORDER);
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenColumns').hideColumn(4);
      render();

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + 4); // 4 rows x 3 columns without right border
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.end).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.start).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.end).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.end).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.start).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.end).toEqual(MAGENTA_BORDER);
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenColumns').showColumn(4);
      render();

      expect(countVisibleCustomBorders()).toEqual(4 * 4); // 4 rows x 4 columns
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.end).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.start).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.end).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.end).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.start).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.end).toEqual(MAGENTA_BORDER);
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + (4 * 2)); // 4 rows x 3 columns
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.end).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.start).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.end).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.end).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.start).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.end).toEqual(MAGENTA_BORDER);
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenColumns').hideColumn(2);
      render();

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + (4 * 2)); // 4 rows x 3 columns
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.end).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.start).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.end).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.end).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.start).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.end).toEqual(MAGENTA_BORDER);
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenColumns').showColumn(4);
      render();

      expect(countVisibleCustomBorders()).toEqual(4 * 4); // 4 rows x 4 columns
      // First cell from the top-left position
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.end).toEqual(EMPTY);
      // First cell from the top-right position
      expect(getCellMeta(1, 4).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.start).toEqual(EMPTY);
      expect(getCellMeta(1, 4).borders.end).toEqual(MAGENTA_BORDER);
      // // First cell from the bottom-left position
      expect(getCellMeta(4, 1).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(4, 1).borders.end).toEqual(EMPTY);
      // // First cell from the bottom-right position
      expect(getCellMeta(4, 4).borders.top).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(4, 4).borders.start).toEqual(EMPTY);
      expect(getCellMeta(4, 4).borders.end).toEqual(MAGENTA_BORDER);
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
          start: GREEN_BORDER,
          bottom: GREEN_BORDER,
          end: GREEN_BORDER
        }, {
          row: 1,
          col: 2,
          top: BLUE_BORDER,
          start: BLUE_BORDER,
          bottom: BLUE_BORDER,
          end: BLUE_BORDER
        }, {
          row: 1,
          col: 4,
          top: YELLOW_BORDER,
          start: YELLOW_BORDER,
          bottom: YELLOW_BORDER,
          end: YELLOW_BORDER
        }]
      });

      getPlugin('hiddenColumns').hideColumns([1, 3]);
      render();

      expect(countVisibleCustomBorders()).toEqual(3 * 4); // It isn't ok probably. There is no specification.
      // expect(countVisibleCustomBorders()).toEqual((4 * 2) + 2); // TODO: It should work.
      expect(getCellMeta(1, 0).borders.top).toEqual(GREEN_BORDER);
      expect(getCellMeta(1, 0).borders.bottom).toEqual(GREEN_BORDER);
      expect(getCellMeta(1, 0).borders.start).toEqual(GREEN_BORDER);
      expect(getCellMeta(1, 0).borders.end).toEqual(GREEN_BORDER); // Is it ok?

      expect(getCellMeta(1, 2).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 2).borders.bottom).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 2).borders.start).toEqual(BLUE_BORDER); // Is it ok?
      expect(getCellMeta(1, 2).borders.end).toEqual(BLUE_BORDER); // Is it ok?

      expect(getCellMeta(1, 4).borders.top).toEqual(YELLOW_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(YELLOW_BORDER);
      expect(getCellMeta(1, 4).borders.start).toEqual(YELLOW_BORDER); // Is it ok?
      expect(getCellMeta(1, 4).borders.end).toEqual(YELLOW_BORDER);
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
          start: GREEN_BORDER,
          bottom: GREEN_BORDER,
          end: GREEN_BORDER
        }, {
          row: 1,
          col: 2,
          top: BLUE_BORDER,
          start: BLUE_BORDER,
          bottom: BLUE_BORDER,
          end: BLUE_BORDER
        }, {
          row: 1,
          col: 4,
          top: YELLOW_BORDER,
          start: YELLOW_BORDER,
          bottom: YELLOW_BORDER,
          end: YELLOW_BORDER
        }]
      });

      getPlugin('hiddenColumns').hideColumns([1, 2, 3]);
      render();

      expect(countVisibleCustomBorders()).toEqual(2 * 4); // It isn't ok probably. There is no specification.
      // expect(countVisibleCustomBorders()).toEqual((4 + 3)); // TODO: It should work.
      expect(getCellMeta(1, 0).borders.top).toEqual(GREEN_BORDER);
      expect(getCellMeta(1, 0).borders.bottom).toEqual(GREEN_BORDER);
      expect(getCellMeta(1, 0).borders.start).toEqual(GREEN_BORDER);
      expect(getCellMeta(1, 0).borders.end).toEqual(GREEN_BORDER); // Is it ok?

      expect(getCellMeta(1, 2).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 2).borders.bottom).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 2).borders.start).toEqual(BLUE_BORDER); // Is it ok?
      expect(getCellMeta(1, 2).borders.end).toEqual(BLUE_BORDER); // Is it ok?

      expect(getCellMeta(1, 4).borders.top).toEqual(YELLOW_BORDER);
      expect(getCellMeta(1, 4).borders.bottom).toEqual(YELLOW_BORDER);
      expect(getCellMeta(1, 4).borders.start).toEqual(YELLOW_BORDER); // Is it ok?
      expect(getCellMeta(1, 4).borders.end).toEqual(YELLOW_BORDER);
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      // Just the meta is defined.
      expect(countVisibleCustomBorders()).toEqual(0);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(1, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.end).toEqual(MAGENTA_BORDER);
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
        start: ORANGE_BORDER,
        bottom: RED_BORDER,
        end: MAGENTA_BORDER
      });

      expect(countVisibleCustomBorders()).toEqual(3 * 4); // Just 3 cells (2 columns are hidden), all of them with 4 borders
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(1, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.end).toEqual(MAGENTA_BORDER);

      expect(getCellMeta(1, 2).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 2).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(1, 2).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 2).borders.end).toEqual(MAGENTA_BORDER);

      expect(getCellMeta(2, 2).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(2, 2).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(2, 2).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(2, 2).borders.end).toEqual(MAGENTA_BORDER);

      expect(getCellMeta(3, 2).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(3, 2).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(3, 2).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(3, 2).borders.end).toEqual(MAGENTA_BORDER);
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenColumns').hideColumn(1);
      render();

      // Just the meta is defined.
      expect(countVisibleCustomBorders()).toEqual(0);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(1, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.end).toEqual(MAGENTA_BORDER);
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenColumns').showColumn(1);
      render();

      expect(countVisibleCustomBorders()).toEqual(4);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(1, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.end).toEqual(MAGENTA_BORDER);
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
      expect(getCellMeta(0, 2).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(0, 2).borders.start).toEqual(EMPTY);
      expect(getCellMeta(0, 2).borders.end).toEqual(EMPTY);

      expect(countVisibleCustomBorders()).toBe(1);
      expect(countCustomBorders()).toBe(5);
    });
  });
});
