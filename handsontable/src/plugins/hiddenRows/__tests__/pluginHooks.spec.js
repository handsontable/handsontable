describe('HiddenRows', () => {
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
    describe('beforeHideRows', () => {
      it('should fire the `beforeHideRows` hook before hiding a single row by plugin API', () => {
        const beforeHideRows = jasmine.createSpy('beforeHideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [0],
          },
          beforeHideRows,
        });

        getPlugin('hiddenRows').hideRow(2);

        expect(beforeHideRows).toHaveBeenCalledWith([0], [0, 2], true);
      });

      it('should fire the `beforeHideRows` hook before hiding multiple rows by plugin API', () => {
        const beforeHideRows = jasmine.createSpy('beforeHideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [0],
          },
          beforeHideRows,
        });

        getPlugin('hiddenRows').hideRows([2, 3, 4]);

        expect(beforeHideRows).toHaveBeenCalledWith([0], [0, 2, 3, 4], true);
      });

      it('should be possible to cancel the hiding action by returning `false` from the `beforeHideRows` hook', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          beforeHideRows: () => false
        });

        getPlugin('hiddenRows').hideRow(2);

        expect(getPlugin('hiddenRows').isHidden(2)).toBeFalsy();
      });

      it('should not perform hiding and return `false` as the third parameter of the `beforeHideRows` hook' +
        ' if any of the provided rows is out of scope of the table', () => {
        const beforeHideRows = jasmine.createSpy('beforeHideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          beforeHideRows,
        });

        const plugin = getPlugin('hiddenRows');

        plugin.hideRows([0, 5, 10, 15]);

        expect(beforeHideRows).toHaveBeenCalledWith([], [], false);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
        expect(plugin.isHidden(10)).toBeFalsy();
      });

      it('should not perform hiding and return `false` as the third parameter of the `beforeHideRows` hook' +
        ' if any of the provided rows is not integer', () => {
        const beforeHideRows = jasmine.createSpy('beforeHideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          beforeHideRows,
        });

        const plugin = getPlugin('hiddenRows');

        plugin.hideRows([0, 5, 1.1]);

        expect(beforeHideRows).toHaveBeenCalledWith([], [], false);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
      });
    });

    describe('afterHideRows', () => {
      it('should fire the `afterHideRows` hook after hiding a single row by plugin API', () => {
        const afterHideRows = jasmine.createSpy('afterHideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          afterHideRows,
        });

        getPlugin('hiddenRows').hideRow(2);

        expect(afterHideRows).toHaveBeenCalledWith([], [2], true, true);
      });

      it('should fire the `afterHideRows` hook after hiding multiple columns by plugin API', () => {
        const afterHideRows = jasmine.createSpy('afterHideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          afterHideRows,
        });

        getPlugin('hiddenRows').hideRows([2, 3, 4]);

        expect(afterHideRows).toHaveBeenCalledWith([], [2, 3, 4], true, true);
      });

      it('it should NOT fire the `afterHideRows` hook, if the `beforeHideRows` hook returned false', () => {
        const afterHideRows = jasmine.createSpy('afterHideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          beforeHideRows: () => false,
          afterHideRows,
        });

        getPlugin('hiddenRows').hideRows([2, 3, 4]);

        expect(afterHideRows).not.toHaveBeenCalled();
      });

      it('should return `false` as the fourth parameter, if the hiding action did not change the state of the hiddenRows plugin', () => {
        const afterHideRows = jasmine.createSpy('afterHideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [0, 5]
          },
          afterHideRows,
        });

        getPlugin('hiddenRows').hideRows([0, 5]);

        expect(afterHideRows).toHaveBeenCalledWith([0, 5], [0, 5], true, false);
      });

      it('should return `true` as the third and fourth parameter, if the hiding action changed the state of the hiddenRows plugin', () => {
        const afterHideRows = jasmine.createSpy('afterHideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [0, 5]
          },
          afterHideRows,
        });

        getPlugin('hiddenRows').hideRows([0, 5, 6]);

        expect(afterHideRows).toHaveBeenCalledWith([0, 5], [0, 5, 6], true, true);
      });

      it('should not perform hiding and return `false` as the third and fourth parameter of the `afterHideRows` hook' +
        ' if any of the provided rows is out of scope of the table', () => {
        const afterHideRows = jasmine.createSpy('afterHideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          afterHideRows,
        });

        const plugin = getPlugin('hiddenRows');

        plugin.hideRows([0, 5, 10, 15]);

        expect(afterHideRows).toHaveBeenCalledWith([], [], false, false);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
        expect(plugin.isHidden(10)).toBeFalsy();
      });

      it('should not perform hiding and return `false` as the third and fourth parameter of the `afterHideRows` hook' +
        ' if any of the provided rows is not integer', () => {
        const afterHideRows = jasmine.createSpy('afterHideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          afterHideRows,
        });

        const plugin = getPlugin('hiddenRows');

        plugin.hideRows([0, 5, 1.1]);

        expect(afterHideRows).toHaveBeenCalledWith([], [], false, false);
        expect(plugin.isHidden(0)).toBeFalsy();
        expect(plugin.isHidden(5)).toBeFalsy();
      });
    });

    describe('beforeUnhideRows', () => {
      it('should fire the `beforeUnhideRows` hook before unhiding a single, previously hidden column', () => {
        const beforeUnhideRows = jasmine.createSpy('beforeUnhideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [0, 2]
          },
          beforeUnhideRows,
        });

        getPlugin('hiddenRows').showRow(2);

        expect(beforeUnhideRows).toHaveBeenCalledWith([0, 2], [0], true);
      });

      it('should fire the `beforeUnhideRows` hook before unhiding the multiple, previously hidden rows ', () => {
        const beforeUnhideRows = jasmine.createSpy('beforeUnhideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [0, 2, 3, 4]
          },
          beforeUnhideRows,
        });

        getPlugin('hiddenRows').showRows([2, 3, 4]);

        expect(beforeUnhideRows).toHaveBeenCalledWith([0, 2, 3, 4], [0], true);
      });

      it('should be possible to cancel the unhiding action by returning `false` from the `beforeUnhideRows` hook', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [2, 3, 4]
          },
          beforeUnhideRows: () => false
        });

        getPlugin('hiddenRows').showRow(2);

        expect(getPlugin('hiddenRows').isHidden(2)).toBeTruthy();
      });

      it('should not perform unhiding and return `false` as the third parameter of the `beforeUnhideRows` hook' +
        ' if any of the provided rows is out of scope of the table', () => {
        const beforeUnhideRows = jasmine.createSpy('beforeUnhideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [0, 5]
          },
          beforeUnhideRows,
        });

        const plugin = getPlugin('hiddenRows');

        plugin.showRows([0, 5, 10, 15]);

        expect(beforeUnhideRows).toHaveBeenCalledWith([0, 5], [0, 5], false);
        expect(plugin.isHidden(0)).toBeTruthy();
        expect(plugin.isHidden(5)).toBeTruthy();
      });

      it('should not perform unhiding and return `false` as the third parameter of the `beforeUnhideRows` hook' +
        ' if any of the provided rows is out of scope of the table', () => {
        const beforeUnhideRows = jasmine.createSpy('beforeUnhideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [0, 5]
          },
          beforeUnhideRows,
        });

        const plugin = getPlugin('hiddenRows');

        plugin.showRows([0, 5, 10, 15]);

        expect(beforeUnhideRows).toHaveBeenCalledWith([0, 5], [0, 5], false);
        expect(plugin.isHidden(0)).toBeTruthy();
        expect(plugin.isHidden(5)).toBeTruthy();
      });
    });

    describe('afterUnhideRows', () => {
      it('should fire the `afterUnhideRows` hook after unhiding a previously hidden single row', () => {
        const afterUnhideRows = jasmine.createSpy('afterUnhideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [2]
          },
          afterUnhideRows,
        });

        getPlugin('hiddenRows').showRow(2);

        expect(afterUnhideRows).toHaveBeenCalledWith([2], [], true, true);
      });

      it('should fire the `afterUnhideRows` hook after unhiding a multiple, previously hidden rows', () => {
        const afterUnhideRows = jasmine.createSpy('afterUnhideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [2, 3, 4]
          },
          afterUnhideRows,
        });

        getPlugin('hiddenRows').showRows([2, 3, 4]);

        expect(afterUnhideRows).toHaveBeenCalledWith([2, 3, 4], [], true, true);
      });

      it('it should NOT fire the `afterUnhideRows` hook, if the `beforeUnhideRows` hook returned false', () => {
        const afterUnhideRows = jasmine.createSpy('afterUnhideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          beforeUnhideRows: () => false,
          afterUnhideRows,
        });

        getPlugin('hiddenRows').showRows([2, 3, 4]);

        expect(afterUnhideRows).not.toHaveBeenCalled();
      });

      it('should return `false` as the fourth parameter, if the unhiding action did not change the state of the hiddenRows plugin', () => {
        const afterUnhideRows = jasmine.createSpy('afterUnhideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: true,
          afterUnhideRows,
        });

        getPlugin('hiddenRows').showRows([0, 5]);

        expect(afterUnhideRows).toHaveBeenCalledWith([], [], true, false);
      });

      it('should return `true` as the fourth parameter, if the unhiding action changed the state of the hiddenRows plugin', () => {
        const afterUnhideRows = jasmine.createSpy('afterUnhideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          hiddenRows: {
            rows: [0, 5]
          },
          afterUnhideRows,
        });

        getPlugin('hiddenRows').showRows([0, 5, 6]);

        expect(afterUnhideRows).toHaveBeenCalledWith([0, 5], [], true, true);
      });

      it('should not perform hiding and return `false` as the third and fourth parameter of the `afterUnhideRows` hook' +
        ' if any of the provided rows is not integer', () => {
        const afterUnhideRows = jasmine.createSpy('afterUnhideRows');

        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 7),
          hiddenRows: {
            rows: [0, 5]
          },
          afterUnhideRows,
        });

        const plugin = getPlugin('hiddenRows');

        plugin.showRows([0, 5, 1.1]);

        expect(afterUnhideRows).toHaveBeenCalledWith([0, 5], [0, 5], false, false);
        expect(plugin.isHidden(0)).toBeTruthy();
        expect(plugin.isHidden(5)).toBeTruthy();
      });
    });
  });
});
