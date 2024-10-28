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

  describe('cooperation with the `HiddenRows` plugin', () => {
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + 4); // 3 rows x 4 columns without top border
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenRows').hideRow(1);
      render();

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + 4); // 3 rows x 4 columns without top border
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenRows').showRow(1);
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + 4); // 3 rows x 4 columns without bottom border
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenRows').hideRow(4);
      render();

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + 4); // 3 rows x 4 columns without right border
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenRows').showRow(4);
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + (4 * 2)); // 3 rows x 4 columns
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenRows').hideRow(2);
      render();

      expect(countVisibleCustomBorders()).toEqual((3 * 2) + (4 * 2)); // 3 rows x 4 columns
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenRows').showRow(4);
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
        hiddenRows: true,
        customBorders: [{
          row: 0,
          col: 1,
          top: GREEN_BORDER,
          start: GREEN_BORDER,
          bottom: GREEN_BORDER,
          end: GREEN_BORDER
        }, {
          row: 2,
          col: 1,
          top: BLUE_BORDER,
          start: BLUE_BORDER,
          bottom: BLUE_BORDER,
          end: BLUE_BORDER
        }, {
          row: 4,
          col: 1,
          top: YELLOW_BORDER,
          start: YELLOW_BORDER,
          bottom: YELLOW_BORDER,
          end: YELLOW_BORDER
        }]
      });

      getPlugin('hiddenRows').hideRows([1, 3]);
      render();

      expect(countVisibleCustomBorders()).toEqual(3 * 4); // It isn't ok probably. There is no specification.
      // expect(countVisibleCustomBorders()).toEqual((4 * 2) + 2); // TODO: It should work.
      expect(getCellMeta(0, 1).borders.top).toEqual(GREEN_BORDER);
      expect(getCellMeta(0, 1).borders.bottom).toEqual(GREEN_BORDER); // Is it ok?
      expect(getCellMeta(0, 1).borders.start).toEqual(GREEN_BORDER);
      expect(getCellMeta(0, 1).borders.end).toEqual(GREEN_BORDER);

      expect(getCellMeta(2, 1).borders.top).toEqual(BLUE_BORDER); // Is it ok?
      expect(getCellMeta(2, 1).borders.bottom).toEqual(BLUE_BORDER); // Is it ok?
      expect(getCellMeta(2, 1).borders.start).toEqual(BLUE_BORDER);
      expect(getCellMeta(2, 1).borders.end).toEqual(BLUE_BORDER);

      expect(getCellMeta(4, 1).borders.top).toEqual(YELLOW_BORDER); // Is it ok?
      expect(getCellMeta(4, 1).borders.bottom).toEqual(YELLOW_BORDER);
      expect(getCellMeta(4, 1).borders.start).toEqual(YELLOW_BORDER);
      expect(getCellMeta(4, 1).borders.end).toEqual(YELLOW_BORDER);
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
          start: GREEN_BORDER,
          bottom: GREEN_BORDER,
          end: GREEN_BORDER
        }, {
          row: 2,
          col: 1,
          top: BLUE_BORDER,
          start: BLUE_BORDER,
          bottom: BLUE_BORDER,
          end: BLUE_BORDER
        }, {
          row: 4,
          col: 1,
          top: YELLOW_BORDER,
          start: YELLOW_BORDER,
          bottom: YELLOW_BORDER,
          end: YELLOW_BORDER
        }]
      });

      getPlugin('hiddenRows').hideRows([1, 2, 3]);
      render();

      expect(countVisibleCustomBorders()).toEqual(2 * 4); // It isn't ok probably. There is no specification.
      // expect(countVisibleCustomBorders()).toEqual((4 + 3)); // TODO: It should work.
      expect(getCellMeta(0, 1).borders.top).toEqual(GREEN_BORDER);
      expect(getCellMeta(0, 1).borders.bottom).toEqual(GREEN_BORDER); // Is it ok?
      expect(getCellMeta(0, 1).borders.start).toEqual(GREEN_BORDER);
      expect(getCellMeta(0, 1).borders.end).toEqual(GREEN_BORDER);

      expect(getCellMeta(2, 1).borders.top).toEqual(BLUE_BORDER); // Is it ok?
      expect(getCellMeta(2, 1).borders.bottom).toEqual(BLUE_BORDER); // Is it ok?
      expect(getCellMeta(2, 1).borders.start).toEqual(BLUE_BORDER);
      expect(getCellMeta(2, 1).borders.end).toEqual(BLUE_BORDER);

      expect(getCellMeta(4, 1).borders.top).toEqual(YELLOW_BORDER); // Is it ok?
      expect(getCellMeta(4, 1).borders.bottom).toEqual(YELLOW_BORDER);
      expect(getCellMeta(4, 1).borders.start).toEqual(YELLOW_BORDER);
      expect(getCellMeta(4, 1).borders.end).toEqual(YELLOW_BORDER);
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
        start: ORANGE_BORDER,
        bottom: RED_BORDER,
        end: MAGENTA_BORDER
      });

      expect(countVisibleCustomBorders()).toEqual(3 * 4); // Just 3 cells (2 rows are hidden), all of them with 4 borders
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenRows').hideRow(1);
      render();

      // Just the meta is defined.
      expect(countVisibleCustomBorders()).toEqual(0);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(1, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.end).toEqual(MAGENTA_BORDER);
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
          start: ORANGE_BORDER,
          bottom: RED_BORDER,
          end: MAGENTA_BORDER
        }]
      });

      getPlugin('hiddenRows').showRow(1);
      render();

      expect(countVisibleCustomBorders()).toEqual(4);
      expect(getCellMeta(1, 1).borders.top).toEqual(BLUE_BORDER);
      expect(getCellMeta(1, 1).borders.bottom).toEqual(RED_BORDER);
      expect(getCellMeta(1, 1).borders.start).toEqual(ORANGE_BORDER);
      expect(getCellMeta(1, 1).borders.end).toEqual(MAGENTA_BORDER);
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

      expect(getCellMeta(2, 0).borders.start).toEqual(EMPTY);
      expect(getCellMeta(2, 0).borders.bottom).toEqual(EMPTY);
      expect(getCellMeta(2, 0).borders.top).toEqual(DEFAULT_BORDER);
      expect(getCellMeta(2, 0).borders.end).toEqual(EMPTY);

      expect(countVisibleCustomBorders()).toBe(1);
      expect(countCustomBorders()).toBe(5);
    });
  });
});
