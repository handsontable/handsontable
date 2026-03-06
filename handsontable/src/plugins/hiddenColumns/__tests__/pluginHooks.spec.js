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
      it('should fire the `beforeHideColumns` hook before hiding a single column by plugin API', async() => {
        const beforeHideColumnsHookCallback = jasmine.createSpy('beforeHideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0],
          },
          beforeHideColumns: beforeHideColumnsHookCallback
        });

        getPlugin('hiddenColumns').hideColumn(2);

        expect(beforeHideColumnsHookCallback).toHaveBeenCalledWith([0], [0, 2], true);
      });

      it('should fire the `beforeHideColumns` hook before hiding multiple columns by plugin API', async() => {
        const beforeHideColumnsHookCallback = jasmine.createSpy('beforeHideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0],
          },
          beforeHideColumns: beforeHideColumnsHookCallback
        });

        getPlugin('hiddenColumns').hideColumns([2, 3, 4]);

        expect(beforeHideColumnsHookCallback).toHaveBeenCalledWith([0], [0, 2, 3, 4], true);
      });

      it('should be possible to cancel the hiding action by returning `false` from the `beforeHideColumns` hook', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: true,
          beforeHideColumns: () => false
        });

        getPlugin('hiddenColumns').hideColumn(2);

        expect(getPlugin('hiddenColumns').isHidden(2)).toBeFalsy();
      });

      it('should not perform hiding and return `false` as the third parameter of the `beforeHideColumns` hook' +
        ' if any of the provided columns is out of scope of the table', async() => {
        const beforeHideColumnsHookCallback = jasmine.createSpy('beforeHideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: true,
          beforeHideColumns: beforeHideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');

        plugin.hideColumns([0, 5, 10, 15]);

        expect(beforeHideColumnsHookCallback).toHaveBeenCalledWith([], [], false);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
        expect(plugin.isHidden(10)).toBeFalsy();
      });

      it('should not perform hiding and return `false` as the third parameter of the `beforeHideColumns` hook' +
        ' if any of the provided columns is not integer', async() => {
        const beforeHideColumnsHookCallback = jasmine.createSpy('beforeHideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: true,
          beforeHideColumns: beforeHideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');

        plugin.hideColumns([0, 5, 1.1]);

        expect(beforeHideColumnsHookCallback).toHaveBeenCalledWith([], [], false);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
      });
    });

    describe('afterHideColumns', () => {
      it('should fire the `afterHideColumns` hook after hiding a single column by plugin API', async() => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: true,
          afterHideColumns: afterHideColumnsHookCallback
        });

        getPlugin('hiddenColumns').hideColumn(2);

        expect(afterHideColumnsHookCallback).toHaveBeenCalledWith([], [2], true, true);
      });

      it('should fire the `afterHideColumns` hook after hiding multiple columns by plugin API', async() => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: true,
          afterHideColumns: afterHideColumnsHookCallback
        });

        getPlugin('hiddenColumns').hideColumns([2, 3, 4]);

        expect(afterHideColumnsHookCallback).toHaveBeenCalledWith([], [2, 3, 4], true, true);
      });

      it('it should NOT fire the `afterHideColumns` hook, if the `beforeHideColumns` hook returned false', async() => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: true,
          beforeHideColumns: () => false,
          afterHideColumns: afterHideColumnsHookCallback
        });

        getPlugin('hiddenColumns').hideColumns([2, 3, 4]);

        expect(afterHideColumnsHookCallback).not.toHaveBeenCalled();
      });

      it('should return `false` as the fourth parameter, if the hiding action did not change the state of the hiddenColumns plugin', async() => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0, 5]
          },
          afterHideColumns: afterHideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');

        plugin.hideColumns([0, 5]);

        expect(afterHideColumnsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], true, false);
      });

      it('should return `true` as the third and fourth parameter, if the hiding action changed the state of the hiddenColumns plugin', async() => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0, 5]
          },
          afterHideColumns: afterHideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');

        plugin.hideColumns([0, 5, 6]);

        expect(afterHideColumnsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5, 6], true, true);
      });

      it('should not perform hiding and return `false` as the third and fourth parameter of the `afterHideColumns` hook' +
        ' if any of the provided columns is out of scope of the table', async() => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: true,
          afterHideColumns: afterHideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');

        plugin.hideColumns([0, 5, 10, 15]);

        expect(afterHideColumnsHookCallback).toHaveBeenCalledWith([], [], false, false);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
        expect(plugin.isHidden(10)).toBeFalsy();
      });

      it('should not perform hiding and return `false` as the third and fourth parameter of the `afterHideColumns` hook' +
        ' if any of the provided columns is not integer', async() => {
        const afterHideColumnsHookCallback = jasmine.createSpy('afterHideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: true,
          afterHideColumns: afterHideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');

        plugin.hideColumns([0, 5, 1.1]);

        expect(afterHideColumnsHookCallback).toHaveBeenCalledWith([], [], false, false);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
      });
    });

    describe('beforeUnhideColumns', () => {
      it('should fire the `beforeUnhideColumns` hook before unhiding a single, previously hidden column', async() => {
        const beforeUnhideColumnsHookCallback = jasmine.createSpy('beforeUnhideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0, 2]
          },
          beforeUnhideColumns: beforeUnhideColumnsHookCallback
        });

        getPlugin('hiddenColumns').showColumn(2);

        expect(beforeUnhideColumnsHookCallback).toHaveBeenCalledWith([0, 2], [0], true);
      });

      it('should fire the `beforeUnhideColumns` hook before unhiding the multiple, previously hidden columns ', async() => {
        const beforeUnhideColumnsHookCallback = jasmine.createSpy('beforeUnhideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0, 2, 3, 4]
          },
          beforeUnhideColumns: beforeUnhideColumnsHookCallback
        });

        getPlugin('hiddenColumns').showColumns([2, 3, 4]);

        expect(beforeUnhideColumnsHookCallback).toHaveBeenCalledWith([0, 2, 3, 4], [0], true);
      });

      it('should be possible to cancel the unhiding action by returning `false` from the `beforeUnhideColumns` hook', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [2, 3, 4]
          },
          beforeUnhideColumns: () => false
        });

        getPlugin('hiddenColumns').showColumn(2);

        expect(getPlugin('hiddenColumns').isHidden(2)).toBeTruthy();
      });

      it('should not perform unhiding and return `false` as the third parameter of the `beforeUnhideColumns` hook' +
        ' if any of the provided columns is out of scope of the table', async() => {
        const beforeUnhideColumnsHookCallback = jasmine.createSpy('beforeUnhideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0, 5]
          },
          beforeUnhideColumns: beforeUnhideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');

        plugin.showColumns([0, 5, 10, 15]);

        expect(beforeUnhideColumnsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], false);
        expect(plugin.isHidden(0)).toBeTruthy();
        expect(plugin.isHidden(5)).toBeTruthy();
      });

      it('should not perform unhiding and return `false` as the third parameter of the `beforeUnhideColumns` hook' +
        ' if any of the provided columns is out of scope of the table', async() => {
        const beforeUnhideColumnsHookCallback = jasmine.createSpy('beforeUnhideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0, 5]
          },
          beforeUnhideColumns: beforeUnhideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');

        plugin.showColumns([0, 5, 10, 15]);

        expect(beforeUnhideColumnsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], false);
        expect(plugin.isHidden(0)).toBeTruthy();
        expect(plugin.isHidden(5)).toBeTruthy();
      });
    });

    describe('afterUnhideColumns', () => {
      it('should fire the `afterUnhideColumns` hook after unhiding a previously hidden single column', async() => {
        const afterUnhideColumnsHookCallback = jasmine.createSpy('afterUnhideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [2]
          },
          afterUnhideColumns: afterUnhideColumnsHookCallback
        });

        getPlugin('hiddenColumns').showColumn(2);

        expect(afterUnhideColumnsHookCallback).toHaveBeenCalledWith([2], [], true, true);
      });

      it('should fire the `afterUnhideColumns` hook after unhiding a multiple, previously hidden columns', async() => {
        const afterUnhideColumnsHookCallback = jasmine.createSpy('afterUnhideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [2, 3, 4]
          },
          afterUnhideColumns: afterUnhideColumnsHookCallback
        });

        getPlugin('hiddenColumns').showColumns([2, 3, 4]);

        expect(afterUnhideColumnsHookCallback).toHaveBeenCalledWith([2, 3, 4], [], true, true);
      });

      it('it should NOT fire the `afterUnhideColumns` hook, if the `beforeUnhideColumns` hook returned false', async() => {
        const afterUnhideColumnsHookCallback = jasmine.createSpy('afterUnhideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: true,
          beforeUnhideColumns: () => false,
          afterUnhideColumns: afterUnhideColumnsHookCallback
        });

        getPlugin('hiddenColumns').showColumns([2, 3, 4]);

        expect(afterUnhideColumnsHookCallback).not.toHaveBeenCalled();
      });

      it('should return `false` as the fourth parameter, if the unhiding action did not change the state of the hiddenColumns plugin', async() => {
        const afterUnhideColumnsHookCallback = jasmine.createSpy('afterUnhideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: true,
          afterUnhideColumns: afterUnhideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');

        plugin.showColumns([0, 5]);

        expect(afterUnhideColumnsHookCallback).toHaveBeenCalledWith([], [], true, false);
      });

      it('should return `true` as the fourth parameter, if the unhiding action changed the state of the hiddenColumns plugin', async() => {
        const afterUnhideColumnsHookCallback = jasmine.createSpy('afterUnhideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 10),
          hiddenColumns: {
            columns: [0, 5]
          },
          afterUnhideColumns: afterUnhideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');

        plugin.showColumns([0, 5, 6]);

        expect(afterUnhideColumnsHookCallback).toHaveBeenCalledWith([0, 5], [], true, true);
      });

      it('should not perform hiding and return `false` as the third and fourth parameter of the `afterUnhideColumns` hook' +
        ' if any of the provided columns is not integer', async() => {
        const afterUnhideColumnsHookCallback = jasmine.createSpy('afterUnhideColumnsHookCallback');

        handsontable({
          data: createSpreadsheetData(10, 7),
          hiddenColumns: {
            columns: [0, 5]
          },
          afterUnhideColumns: afterUnhideColumnsHookCallback
        });

        const plugin = getPlugin('hiddenColumns');

        plugin.showColumns([0, 5, 1.1]);

        expect(afterUnhideColumnsHookCallback).toHaveBeenCalledWith([0, 5], [0, 5], false, false);
        expect(plugin.isHidden(0)).toBeTruthy();
        expect(plugin.isHidden(5)).toBeTruthy();
      });
    });
  });
});
