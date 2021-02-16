describe('HiddenColumns', () => {
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

  describe('plugin hooks', () => {
    describe('beforeHideColumns', () => {
      it('should fire the `beforeHideColumns` hook before hiding a single column by plugin API', () => {
        const beforeHideColumnsHookCallback = jasmine.createSpy('beforeHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0],
          },
          beforeHideColumns: beforeHideColumnsHookCallback
        });

        getPlugin('hiddenColumns').hideColumn(2);

        expect(beforeHideColumnsHookCallback).toHaveBeenCalledWith([0], [0, 2], true, void 0, void 0, void 0);
      });

      it('should fire the `beforeHideColumns` hook before hiding multiple columns by plugin API', () => {
        const beforeHideColumnsHookCallback = jasmine.createSpy('beforeHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0],
          },
          beforeHideColumns: beforeHideColumnsHookCallback
        });

        getPlugin('hiddenColumns').hideColumns([2, 3, 4]);

        expect(beforeHideColumnsHookCallback).toHaveBeenCalledWith([0], [0, 2, 3, 4], true, void 0, void 0, void 0);
      });

      it('should be possible to cancel the hiding action by returning `false` from the `beforeHideColumns` hook', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          beforeHideColumns: () => false
        });

        getPlugin('hiddenColumns').hideColumn(2);

        expect(getPlugin('hiddenColumns').isHidden(2)).toBeFalsy();
      });

      it('should not perform hiding and return `false` as the third parameter of the `beforeHideColumns` hook' +
        ' if any of the provided columns is out of scope of the table', () => {
        const beforeHideColumnsHookCallback = jasmine.createSpy('beforeHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          beforeHideColumns: beforeHideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.hideColumns([0, 5, 10, 15]);

        expect(beforeHideColumnsHookCallback).toHaveBeenCalledWith([], [], false, void 0, void 0, void 0);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
        expect(plugin.isHidden(10)).toBeFalsy();
      });

      it('should not perform hiding and return `false` as the third parameter of the `beforeHideColumns` hook' +
        ' if any of the provided columns is not integer', () => {
        const beforeHideColumnsHookCallback = jasmine.createSpy('beforeHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          beforeHideColumns: beforeHideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.hideColumns([0, 5, 1.1]);

        expect(beforeHideColumnsHookCallback).toHaveBeenCalledWith([], [], false, void 0, void 0, void 0);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
      });
    });

    describe('afterHideColumns', () => {
      it('should fire the `afterHideColumns` hook after hiding a single column by plugin API', () => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          afterHideColumns: afterHideColumnsHookCallback
        });

        getPlugin('hiddenColumns').hideColumn(2);

        expect(afterHideColumnsHookCallback).toHaveBeenCalledWith([], [2], true, true, void 0, void 0);
      });

      it('should fire the `afterHideColumns` hook after hiding multiple columns by plugin API', () => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          afterHideColumns: afterHideColumnsHookCallback
        });

        getPlugin('hiddenColumns').hideColumns([2, 3, 4]);

        expect(afterHideColumnsHookCallback).toHaveBeenCalledWith([], [2, 3, 4], true, true, void 0, void 0);
      });

      it('it should NOT fire the `afterHideColumns` hook, if the `beforeHideColumns` hook returned false', () => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          beforeHideColumns: () => false,
          afterHideColumns: afterHideColumnsHookCallback
        });

        getPlugin('hiddenColumns').hideColumns([2, 3, 4]);

        expect(afterHideColumnsHookCallback).not.toHaveBeenCalled();
      });

      it('should return `false` as the fourth parameter, if the hiding action did not change the state of the hiddenColumns plugin', () => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0, 5]
          },
          afterHideColumns: afterHideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.hideColumns([0, 5]);

        expect(afterHideColumnsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], true, false, void 0, void 0);
      });

      it('should return `true` as the third and fourth parameter, if the hiding action changed the state of the hiddenColumns plugin', () => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0, 5]
          },
          afterHideColumns: afterHideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.hideColumns([0, 5, 6]);

        expect(afterHideColumnsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5, 6], true, true, void 0, void 0);
      });

      it('should not perform hiding and return `false` as the third and fourth parameter of the `afterHideColumns` hook' +
        ' if any of the provided columns is out of scope of the table', () => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          afterHideColumns: afterHideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.hideColumns([0, 5, 10, 15]);

        expect(afterHideColumnsHookCallback).toHaveBeenCalledWith([], [], false, false, void 0, void 0);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
        expect(plugin.isHidden(10)).toBeFalsy();
      });

      it('should not perform hiding and return `false` as the third and fourth parameter of the `afterHideColumns` hook' +
        ' if any of the provided columns is not integer', () => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          afterHideColumns: afterHideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.hideColumns([0, 5, 1.1]);

        expect(afterHideColumnsHookCallback).toHaveBeenCalledWith([], [], false, false, void 0, void 0);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
      });
    });

    describe('beforeUnhideColumns', () => {
      it('should fire the `beforeUnhideColumns` hook before unhiding a single, previously hidden column', () => {
        const beforeUnhideColumnsHookCallback = jasmine.createSpy('beforeUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0, 2]
          },
          beforeUnhideColumns: beforeUnhideColumnsHookCallback
        });

        getPlugin('hiddenColumns').showColumn(2);

        expect(beforeUnhideColumnsHookCallback).toHaveBeenCalledWith([0, 2], [0], true, void 0, void 0, void 0);
      });

      it('should fire the `beforeUnhideColumns` hook before unhiding the multiple, previously hidden columns ', () => {
        const beforeUnhideColumnsHookCallback = jasmine.createSpy('beforeUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0, 2, 3, 4]
          },
          beforeUnhideColumns: beforeUnhideColumnsHookCallback
        });

        getPlugin('hiddenColumns').showColumns([2, 3, 4]);

        expect(beforeUnhideColumnsHookCallback).toHaveBeenCalledWith([0, 2, 3, 4], [0], true, void 0, void 0, void 0);
      });

      it('should be possible to cancel the unhiding action by returning `false` from the `beforeUnhideColumns` hook', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [2, 3, 4]
          },
          beforeUnhideColumns: () => false
        });

        getPlugin('hiddenColumns').showColumn(2);

        expect(getPlugin('hiddenColumns').isHidden(2)).toBeTruthy();
      });

      it('should not perform unhiding and return `false` as the third parameter of the `beforeUnhideColumns` hook' +
        ' if any of the provided columns is out of scope of the table', () => {
        const beforeUnhideColumnsHookCallback = jasmine.createSpy('beforeUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0, 5]
          },
          beforeUnhideColumns: beforeUnhideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.showColumns([0, 5, 10, 15]);

        expect(beforeUnhideColumnsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], false, void 0, void 0, void 0);
        expect(plugin.isHidden(0)).toBeTruthy();
        expect(plugin.isHidden(5)).toBeTruthy();
      });

      it('should not perform unhiding and return `false` as the third parameter of the `beforeUnhideColumns` hook' +
        ' if any of the provided columns is out of scope of the table', () => {
        const beforeUnhideColumnsHookCallback = jasmine.createSpy('beforeUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0, 5]
          },
          beforeUnhideColumns: beforeUnhideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.showColumns([0, 5, 10, 15]);

        expect(beforeUnhideColumnsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], false, void 0, void 0, void 0);
        expect(plugin.isHidden(0)).toBeTruthy();
        expect(plugin.isHidden(5)).toBeTruthy();
      });
    });

    describe('afterUnhideColumns', () => {
      it('should fire the `afterUnhideColumns` hook after unhiding a previously hidden single column', () => {
        const afterUnhideColumnsHookCallback = jasmine.createSpy('afterUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [2]
          },
          afterUnhideColumns: afterUnhideColumnsHookCallback
        });

        getPlugin('hiddenColumns').showColumn(2);

        expect(afterUnhideColumnsHookCallback).toHaveBeenCalledWith([2], [], true, true, void 0, void 0);
      });

      it('should fire the `afterUnhideColumns` hook after unhiding a multiple, previously hidden columns', () => {
        const afterUnhideColumnsHookCallback = jasmine.createSpy('afterUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [2, 3, 4]
          },
          afterUnhideColumns: afterUnhideColumnsHookCallback
        });

        getPlugin('hiddenColumns').showColumns([2, 3, 4]);

        expect(afterUnhideColumnsHookCallback).toHaveBeenCalledWith([2, 3, 4], [], true, true, void 0, void 0);
      });

      it('it should NOT fire the `afterUnhideColumns` hook, if the `beforeUnhideColumns` hook returned false', () => {
        const afterUnhideColumnsHookCallback = jasmine.createSpy('afterUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          beforeUnhideColumns: () => false,
          afterUnhideColumns: afterUnhideColumnsHookCallback
        });

        getPlugin('hiddenColumns').showColumns([2, 3, 4]);

        expect(afterUnhideColumnsHookCallback).not.toHaveBeenCalled();
      });

      it('should return `false` as the fourth parameter, if the unhiding action did not change the state of the hiddenColumns plugin', () => {
        const afterUnhideColumnsHookCallback = jasmine.createSpy('afterUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: true,
          afterUnhideColumns: afterUnhideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.showColumns([0, 5]);

        expect(afterUnhideColumnsHookCallback).toHaveBeenCalledWith([], [], true, false, void 0, void 0);
      });

      it('should return `true` as the fourth parameter, if the unhiding action changed the state of the hiddenColumns plugin', () => {
        const afterUnhideColumnsHookCallback = jasmine.createSpy('afterUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0, 5]
          },
          afterUnhideColumns: afterUnhideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.showColumns([0, 5, 6]);

        expect(afterUnhideColumnsHookCallback).toHaveBeenCalledWith([0, 5], [], true, true, void 0, void 0);
      });

      it('should not perform hiding and return `false` as the third and fourth parameter of the `afterUnhideColumns` hook' +
        ' if any of the provided columns is not integer', () => {
        const afterUnhideColumnsHookCallback = jasmine.createSpy('afterUnhideColumnsHookCallback');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 7),
          hiddenColumns: {
            columns: [0, 5]
          },
          afterUnhideColumns: afterUnhideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');
        plugin.showColumns([0, 5, 1.1]);

        expect(afterUnhideColumnsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], false, false, void 0, void 0);
        expect(plugin.isHidden(0)).toBeTruthy();
        expect(plugin.isHidden(5)).toBeTruthy();
      });
    });
  });

  describe('cooperation with the AutoColumnSize', () => {
    it('should display proper column width (when indicator is enabled) #1', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        autoColumnSize: true,
        hiddenColumns: {
          columns: [0, 1],
          indicators: true,
        }
      });

      // Default column width + 15 px from the plugin (when `indicators` option is set).
      expect(colWidth(spec().$container, 0)).toBeAroundValue(65, 3);
    });

    it('should display proper column width (when indicator is enabled) #2', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        autoColumnSize: true,
        hiddenColumns: {
          columns: [0, 2],
          indicators: true,
        }
      });

      // Default column width + 15 px from the plugin (when `indicators` option is set).
      expect(colWidth(spec().$container, 0)).toBeAroundValue(65, 3);
    });

    it('should display proper column width (when indicator is enabled) #3', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        autoColumnSize: true,
        hiddenColumns: {
          columns: [1, 2],
          indicators: true,
        }
      });

      // Default column width + 15 px from the plugin (when `indicators` option is set).
      expect(colWidth(spec().$container, 0)).toBeAroundValue(65, 3);
    });

    it('should display proper column width (when indicator is disabled)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        autoColumnSize: true,
        hiddenColumns: {
          columns: [0, 1]
        }
      });

      // Default column width + 15 px from the plugin (when `indicators` option is unset).
      expect(colWidth(spec().$container, 0)).toBeAroundValue(50, 3);
    });

    it('should return proper values from the `getColWidth` function (when indicator is enabled)', () => {
      const hot = handsontable({
        data: [{ id: 'Short', name: 'Somewhat long', lastName: 'The very very very longest one' }],
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1],
          indicators: true,
        },
        columns: [
          { data: 'id', title: 'Identifier' },
          { data: 'name', title: 'Name' },
          { data: 'lastName', title: 'Last Name' },
        ],
        autoColumnSize: true,
      });

      expect(hot.getColWidth(0)).toBe(0);
      expect(hot.getColWidth(1)).toBe(0);
      expect([216 + 15, 229 + 15, 247 + 15, 260 + 15, 261 + 15]).toEqual(jasmine.arrayContaining([hot.getColWidth(2)]));
    });

    it('should return proper values from the `getColWidth` function (when indicator is disabled)', () => {
      const hot = handsontable({
        data: [{ id: 'Short', name: 'Somewhat long', lastName: 'The very very very longest one' }],
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1],
        },
        columns: [
          { data: 'id', title: 'Identifier' },
          { data: 'name', title: 'Name' },
          { data: 'lastName', title: 'Last Name' },
        ],
        autoColumnSize: true,
      });

      expect(hot.getColWidth(0)).toBe(0);
      expect(hot.getColWidth(1)).toBe(0);
      expect([216, 229, 247, 260, 261]).toEqual(jasmine.arrayContaining([hot.getColWidth(2)]));
    });

    it('should return proper values from the `getColWidth` function when the `ManualColumnResize` plugin define sizes for some columns', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2],
        },
        stretchH: 'all',
        manualColumnResize: [10, 11, 12, 13, 14],
      });

      expect(hot.getColWidth(0)).toBe(0);
      expect(hot.getColWidth(1)).toBe(11);
      expect(hot.getColWidth(2)).toBe(0);
      expect(hot.getColWidth(3)).toBe(13);
      expect(hot.getColWidth(4)).toBe(14);
    });

    it('should return proper values from the `getColHeader` function', () => {
      const hot = handsontable({
        data: [{ id: 'Short', name: 'Somewhat long', lastName: 'The very very very longest one' }],
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1],
        },
        columns: [
          { data: 'id', title: 'Identifier' },
          { data: 'name', title: 'Name' },
          { data: 'lastName', title: 'Last Name' },
        ],
        autoColumnSize: true,
      });

      expect(hot.getColHeader(0)).toBe('Identifier');
      expect(hot.getColHeader(1)).toBe('Name');
      expect(hot.getColHeader(2)).toBe('Last Name');
    });
  });

  describe('cooperation with the `stretchH` option', () => {
    it('should stretch all columns to a window size', () => {
      const stretchedColumns = new Set();

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2],
        },
        stretchH: 'all',
        beforeStretchingColumnWidth(width, column) {
          stretchedColumns.add(column);
        }
      });

      expect($(getHtCore()).find('td')[0].offsetWidth).toBeAroundValue(document.documentElement.clientWidth / 3, 2);
      expect($(getHtCore()).find('td')[1].offsetWidth).toBeAroundValue(document.documentElement.clientWidth / 3, 2);
      expect($(getHtCore()).find('td')[2].offsetWidth).toBeAroundValue(document.documentElement.clientWidth / 3, 2);
      expect(Array.from(stretchedColumns.values())).toEqual([1, 3, 4]);
    });

    it('should work properly when the `ManualColumnResize` plugin define sizes for some columns', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2],
        },
        stretchH: 'all',
        manualColumnResize: [10, 11, 12, 13, 14],
      });

      expect(hot.getColWidth(0)).toBe(0);
      // Rendered index: 0, visual index: 1
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(11);
      expect(hot.getColWidth(1)).toBe(11);
      expect(hot.getColWidth(2)).toBe(0);
      // Rendered index: 1, visual index: 3
      expect($(getHtCore()).find('td')[1].offsetWidth).toBe(13);
      expect(hot.getColWidth(3)).toBe(13);
    });
  });

  describe('cooperation with the `MergeCells` plugin', () => {
    it('should display properly merged area basing on the settings', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 3 }
        ],
        hiddenColumns: {
          columns: [1],
        }
      });

      expect(getData()).toEqual([
        ['A1', null, null, 'D1', 'E1'],
        [null, null, null, 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
      ]);

      expect($(getHtCore())[0].offsetWidth).toBe(200);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(100);

      getPlugin('hiddenColumns').showColumns([1]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(250);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(150);

      getPlugin('hiddenColumns').hideColumns([1]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(200);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(100);
    });

    it('should display properly merged area containing hidden columns (start from visible cell, merging to visible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(0, 1, 0, 3);

      // Merged from visual column index 1 (visible) to visual column index 3 (visible).
      //                                     |     merge    |
      expect(getData()).toEqual([['A1', 'B1', null, null, 'E1']]);
      expect($(getHtCore()).find('td')[0].innerText).toBe('B1');
      // Only two columns have been visible from the start.
      expect($(getHtCore())[0].offsetWidth).toBe(100);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(100);

      getPlugin('hiddenColumns').showColumns([2]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(150);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(150);

      getPlugin('hiddenColumns').hideColumns([2]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(100);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(100);

      getPlugin('hiddenColumns').showColumns([0, 2, 4]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(250);
      expect($(getHtCore()).find('td')[1].offsetWidth).toBe(150);
    });

    it('should display properly merged area containing hidden columns (start from invisible cell, merging to visible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(0, 0, 0, 3);

      // Merged from visual column index 0 (invisible) to visual column index 3 (visible).
      //                              |        merge        |
      expect(getData()).toEqual([['A1', null, null, null, 'E1']]);

      // TODO: It should show value from the hidden column?
      // expect($(getHtCore()).find('td')[0].innerText).toBe('A1');

      // Only two columns have been visible from the start.
      expect($(getHtCore())[0].offsetWidth).toBe(100);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(100);

      getPlugin('hiddenColumns').showColumns([0]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(150);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(150);

      getPlugin('hiddenColumns').showColumns([2]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(200);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(200);

      getPlugin('hiddenColumns').hideColumns([0, 2]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(100);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(100);

      getPlugin('hiddenColumns').showColumns([0, 2, 4]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(250);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(200);
    });

    it('should display properly merged area containing hidden columns (start from visible cell, merging to invisible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(0, 1, 0, 4);

      // Merged from visual column index 1 (visible) to visual column index 4 (invisible).
      //                                    |        merge        |
      expect(getData()).toEqual([['A1', 'B1', null, null, null]]);
      expect($(getHtCore()).find('td')[0].innerText).toBe('B1');
      // Only two columns have been visible from the start.
      expect($(getHtCore())[0].offsetWidth).toBe(100);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(100);

      getPlugin('hiddenColumns').showColumns([2]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(150);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(150);

      getPlugin('hiddenColumns').showColumns([4]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(200);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(200);

      getPlugin('hiddenColumns').hideColumns([2, 4]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(100);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(100);

      getPlugin('hiddenColumns').showColumns([0, 2, 4]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(250);
      expect($(getHtCore()).find('td')[1].offsetWidth).toBe(200);
    });

    it('should display properly merged area containing hidden columns (start from invisible cell, merging to invisible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(0, 0, 0, 4);

      // Merged from visual column index 0 (invisible) to visual column index 4 (invisible).
      //                              |           merge           |
      expect(getData()).toEqual([['A1', null, null, null, null]]);

      // TODO: It should show value from the hidden column?
      // expect($(getHtCore()).find('td')[0].innerText).toBe('A1');

      // Only two columns have been visible from the start.
      expect($(getHtCore())[0].offsetWidth).toBe(100);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(100);

      getPlugin('hiddenColumns').showColumns([0]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(150);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(150);

      getPlugin('hiddenColumns').showColumns([2]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(200);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(200);

      getPlugin('hiddenColumns').showColumns([4]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(250);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(250);

      getPlugin('hiddenColumns').hideColumns([0, 2, 4]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(100);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(100);

      getPlugin('hiddenColumns').showColumns([0, 2, 4]);
      render();

      expect($(getHtCore())[0].offsetWidth).toBe(250);
      expect($(getHtCore()).find('td')[0].offsetWidth).toBe(250);
    });

    it('should return proper values from the `getCell` function', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(0, 1, 0, 3);

      expect(getCell(0, 0)).toBe(null);
      expect(getCell(0, 1)).toBe($(getHtCore()).find('td')[0]);
      expect(getCell(0, 2)).toBe(null);
      expect(getCell(0, 3)).toBe($(getHtCore()).find('td')[0]);
      expect(getCell(0, 4)).toBe(null);

      getPlugin('hiddenColumns').showColumns([2]);
      render();

      expect(getCell(0, 0)).toBe(null);
      expect(getCell(0, 1)).toBe($(getHtCore()).find('td')[0]);
      expect(getCell(0, 2)).toBe($(getHtCore()).find('td')[0]);
      expect(getCell(0, 3)).toBe($(getHtCore()).find('td')[0]);
      expect(getCell(0, 4)).toBe(null);
    });

    it('should translate column indexes properly - regression check', () => {
      // An error have been thrown and too many columns have been drawn in the specific case. There haven't been done
      // index translation (from renderable to visual columns indexes and the other way around).

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 7),
        hiddenColumns: {
          columns: [0, 2],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(0, 3, 0, 5);

      // The same as at the start.
      expect($(getHtCore()).find('td').length).toBe(5);
      // Still the same width for the whole table.
      expect($(getHtCore())[0].offsetWidth).toBe(250);
      expect($(getHtCore()).find('td')[1].offsetWidth).toBe(150);
    });

    it('should select proper cell when calling the `selectCell` within area of merge', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 5),
        hiddenColumns: {
          columns: [0, 2],
        },
        mergeCells: [
          { row: 0, col: 1, rowspan: 1, colspan: 4 }
        ]
      });

      selectCell(0, 1);

      // Second and third columns are not displayed (CSS - display: none).
      expect(`
      | # :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[0, 1, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);

      deselectCell();
      selectCell(0, 2);

      // Second and third columns are not displayed (CSS - display: none).
      expect(`
      | # :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[0, 1, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);

      deselectCell();
      selectCell(0, 3);

      // Second and third columns are not displayed (CSS - display: none).
      expect(`
      | # :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[0, 1, 0, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(4);

      // TODO: `selectCell(0, 4)` should give the same effect. There is bug at least from Handsontable 7.
    });
  });

  describe('alter actions', () => {
    it('should update hidden column indexes after columns removal (removing not hidden columns)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        hiddenColumns: true,
        manualColumnMove: [4, 0, 8, 5, 2, 6, 1, 7, 3, 9]
      });

      const plugin = getPlugin('hiddenColumns');

      plugin.hideColumns([6, 7, 8]); // visual column indexes after move (physical indexes: 1, 7, 3)
      alter('remove_col', 2, 3); // visual column index

      expect(plugin.isHidden(3)).toBe(true); // 6 -> 3
      expect(hot.getColWidth(3)).toEqual(0);
      expect(plugin.isHidden(4)).toBe(true); // 7 -> 4
      expect(hot.getColWidth(4)).toEqual(0);
      expect(plugin.isHidden(5)).toBe(true); // 8 -> 5
      expect(hot.getColWidth(5)).toEqual(0);

      expect(plugin.isHidden(6)).toBe(false);
      expect(hot.getColWidth(6)).toEqual(50);
      expect(plugin.isHidden(7)).toBe(false);
      expect(hot.getColWidth(7)).toEqual(50);
      expect(plugin.isHidden(8)).toBe(false);
      expect(hot.getColWidth(8)).toEqual(50);

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('E1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('G1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('J1');
      expect(getDataAtRow(0)).toEqual(['E1', 'A1', 'G1', 'B1', 'H1', 'D1', 'J1']);
    });

    it('should update hidden column indexes after columns removal (removing part of hidden columns)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        colHeaders: true,
        hiddenColumns: {
          indicators: true,
        },
        manualColumnMove: [4, 0, 8, 5, 2, 6, 1, 7, 3, 9]
      });

      const plugin = getPlugin('hiddenColumns');

      plugin.hideColumns([6, 7, 8]); // visual column indexes after move (physical indexes: 1, 7, 3)
      alter('remove_col', 6, 2); // visual column index

      expect(plugin.isHidden(6)).toBe(true); // 8 -> 6
      expect(hot.getColWidth(6)).toEqual(0);

      expect(getCell(-1, 5)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN);
      expect(getCell(-1, 6)).toBe(null);
      expect(getCell(-1, 7)).toHaveClass(CSS_CLASS_AFTER_HIDDEN);

      expect(plugin.isHidden(5)).toBe(false);
      expect(hot.getColWidth(5)).toEqual(65);
      expect(plugin.isHidden(7)).toBe(false);
      expect(hot.getColWidth(7)).toEqual(65);
      expect(plugin.isHidden(8)).toBe(false);
      expect(hot.getColWidth(8)).toEqual(50);

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('E1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('I1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('F1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(4)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(5)').text()).toEqual('G1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(6)').text()).toEqual('J1');
      expect(getDataAtRow(0)).toEqual(['E1', 'A1', 'I1', 'F1', 'C1', 'G1', 'D1', 'J1']);
    });

    it('should update hidden column indexes after columns insertion (inserting columns before already hidden columns)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        hiddenColumns: true,
        manualColumnMove: [4, 0, 8, 5, 2, 6, 1, 7, 3, 9]
      });

      const plugin = getPlugin('hiddenColumns');

      plugin.hideColumns([6, 7, 8]); // visual column indexes after move (physical indexes: 1, 7, 3)
      alter('insert_col', 0, 3); // visual column index

      expect(plugin.isHidden(9)).toBe(true); // 6 -> 9
      expect(hot.getColWidth(9)).toEqual(0);
      expect(plugin.isHidden(10)).toBe(true); // 7 -> 10
      expect(hot.getColWidth(10)).toEqual(0);
      expect(plugin.isHidden(11)).toBe(true); // 8 -> 11
      expect(hot.getColWidth(11)).toEqual(0);

      expect(plugin.isHidden(6)).toBe(false);
      expect(hot.getColWidth(6)).toEqual(50);
      expect(plugin.isHidden(7)).toBe(false);
      expect(hot.getColWidth(7)).toEqual(50);
      expect(plugin.isHidden(8)).toBe(false);
      expect(hot.getColWidth(8)).toEqual(50);

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('E1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(4)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(5)').text()).toEqual('I1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(6)').text()).toEqual('F1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(7)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(8)').text()).toEqual('G1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(9)').text()).toEqual('J1');
      expect(getDataAtRow(0)).toEqual([null, null, null, 'E1', 'A1', 'I1', 'F1', 'C1', 'G1', 'B1', 'H1', 'D1', 'J1']);
    });

    it('should update hidden column indexes after columns insertion (inserting columns between already hidden columns)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        colHeaders: true,
        hiddenColumns: {
          indicators: true,
        },
        manualColumnMove: [4, 0, 8, 5, 2, 6, 1, 7, 3, 9]
      });

      const plugin = getPlugin('hiddenColumns');

      plugin.hideColumns([6, 7, 8]); // visual column indexes after move (physical indexes: 1, 7, 3)
      alter('insert_col', 7, 2); // visual column index

      expect(plugin.isHidden(6)).toBe(true);
      expect(hot.getColWidth(6)).toEqual(0);
      expect(plugin.isHidden(9)).toBe(true); // 7 -> 9
      expect(hot.getColWidth(9)).toEqual(0);
      expect(plugin.isHidden(10)).toBe(true); // 8 -> 10
      expect(hot.getColWidth(10)).toEqual(0);

      expect(getCell(-1, 5)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN);
      expect(getCell(-1, 6)).toBe(null);
      expect(getCell(-1, 7)).toHaveClass(CSS_CLASS_AFTER_HIDDEN);
      expect(getCell(-1, 8)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN);
      expect(getCell(-1, 9)).toBe(null);
      expect(getCell(-1, 10)).toBe(null);
      expect(getCell(-1, 11)).toHaveClass(CSS_CLASS_AFTER_HIDDEN);

      expect(plugin.isHidden(5)).toBe(false);
      expect(hot.getColWidth(5)).toEqual(65);
      expect(plugin.isHidden(7)).toBe(false);
      expect(hot.getColWidth(7)).toEqual(65);
      expect(plugin.isHidden(8)).toBe(false);
      expect(hot.getColWidth(8)).toEqual(65);
      expect(plugin.isHidden(11)).toBe(false);
      expect(hot.getColWidth(11)).toEqual(65);

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('E1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('I1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('F1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(4)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(5)').text()).toEqual('G1');
      // Hidden B1
      expect(spec().$container.find('tbody tr:eq(0) td:eq(6)').text()).toEqual('');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(7)').text()).toEqual('');
      // Hidden H1
      expect(spec().$container.find('tbody tr:eq(0) td:eq(8)').text()).toEqual('J1');
      expect(getDataAtRow(0)).toEqual(['E1', 'A1', 'I1', 'F1', 'C1', 'G1', 'B1', null, null, 'H1', 'D1', 'J1']);
    });
  });
});
