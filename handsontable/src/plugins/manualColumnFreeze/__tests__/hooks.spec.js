describe('manualColumnFreeze', () => {
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

  describe('freezeColumn', () => {
    describe('Hooks', () => {
      it('should trigger the `beforeColumnFreeze` and `afterColumnFreeze` hooks with proper ' +
        'parameters (all columns aren\'t fixed)', async() => {
        const beforeColumnFreezeCallback = jasmine.createSpy('beforeColumnFreeze');
        const afterColumnFreezeCallback = jasmine.createSpy('afterColumnFreeze');

        handsontable({
          data: createSpreadsheetData(10, 10),
          rowHeaders: true,
          colHeaders: true,
          manualColumnFreeze: true,
          beforeColumnFreeze: beforeColumnFreezeCallback,
          afterColumnFreeze: afterColumnFreezeCallback,
        });

        getPlugin('manualColumnFreeze').freezeColumn(3);

        expect(beforeColumnFreezeCallback).toHaveBeenCalledWith(3, true);
        expect(afterColumnFreezeCallback).toHaveBeenCalledWith(3, true);
        expect(getDataAtRow(0)).toEqual(['D1', 'A1', 'B1', 'C1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
      });

      it('should trigger the `beforeColumnFreeze` and `afterColumnFreeze` hooks with proper ' +
        'parameters (all columns ARE fixed)', async() => {
        const beforeColumnFreezeCallback = jasmine.createSpy('beforeColumnFreeze');
        const afterColumnFreezeCallback = jasmine.createSpy('afterColumnFreeze');

        handsontable({
          data: createSpreadsheetData(10, 10),
          rowHeaders: true,
          colHeaders: true,
          manualColumnFreeze: true,
          beforeColumnFreeze: beforeColumnFreezeCallback,
          afterColumnFreeze: afterColumnFreezeCallback,
          fixedColumnsStart: 10,
        });

        getPlugin('manualColumnFreeze').freezeColumn(0);

        expect(beforeColumnFreezeCallback).toHaveBeenCalledWith(0, false);
        expect(afterColumnFreezeCallback).toHaveBeenCalledWith(0, false);
        expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
      });

      it('should not freeze and not trigger the `afterColumnFreeze` hook after try of freezing column, when ' +
        '`beforeColumnFreeze` return false', async() => {
        const afterColumnFreezeCallback = jasmine.createSpy('afterColumnFreeze');

        handsontable({
          data: createSpreadsheetData(10, 10),
          rowHeaders: true,
          colHeaders: true,
          manualColumnFreeze: true,
          beforeColumnFreeze() {
            return false;
          },
          afterColumnFreeze: afterColumnFreezeCallback,
        });

        getPlugin('manualColumnFreeze').freezeColumn(5);

        expect(afterColumnFreezeCallback).not.toHaveBeenCalled();
        expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
      });
    });
  });

  describe('unfreezeColumn', () => {
    describe('Hooks', () => {
      it('should trigger the `beforeColumnUnfreeze` and `afterColumnUnfreeze` hooks with proper ' +
        'parameters (some columns are fixed)', async() => {
        const beforeColumnUnfreezeCallback = jasmine.createSpy('beforeColumnUnfreeze');
        const afterColumnUnfreezeCallback = jasmine.createSpy('afterColumnUnfreeze');

        handsontable({
          data: createSpreadsheetData(10, 10),
          rowHeaders: true,
          colHeaders: true,
          manualColumnFreeze: true,
          beforeColumnUnfreeze: beforeColumnUnfreezeCallback,
          afterColumnUnfreeze: afterColumnUnfreezeCallback,
          fixedColumnsStart: 1,
        });

        getPlugin('manualColumnFreeze').unfreezeColumn(0);

        expect(beforeColumnUnfreezeCallback).toHaveBeenCalledWith(0, true);
        expect(afterColumnUnfreezeCallback).toHaveBeenCalledWith(0, true);
        expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
      });

      it('should trigger the `beforeColumnUnfreeze` and `afterColumnUnfreeze` hooks with proper ' +
        'parameters (no columns are fixed)', async() => {
        const beforeColumnUnfreezeCallback = jasmine.createSpy('beforeColumnUnfreeze');
        const afterColumnUnfreezeCallback = jasmine.createSpy('afterColumnUnfreeze');

        handsontable({
          data: createSpreadsheetData(10, 10),
          rowHeaders: true,
          colHeaders: true,
          manualColumnFreeze: true,
          beforeColumnUnfreeze: beforeColumnUnfreezeCallback,
          afterColumnUnfreeze: afterColumnUnfreezeCallback,
        });

        getPlugin('manualColumnFreeze').unfreezeColumn(0);

        expect(beforeColumnUnfreezeCallback).toHaveBeenCalledWith(0, false);
        expect(afterColumnUnfreezeCallback).toHaveBeenCalledWith(0, false);
        expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
      });

      it('should not freeze and not trigger the `afterColumnUnfreeze` hook after try of freezing column, when ' +
        '`beforeColumnUnfreeze` return false', async() => {
        const afterColumnUnfreezeCallback = jasmine.createSpy('afterColumnUnfreeze');

        handsontable({
          data: createSpreadsheetData(10, 10),
          rowHeaders: true,
          colHeaders: true,
          manualColumnFreeze: true,
          beforeColumnUnfreeze() {
            return false;
          },
          afterColumnUnfreeze: afterColumnUnfreezeCallback,
          fixedColumnsStart: 1,
        });

        getPlugin('manualColumnFreeze').unfreezeColumn(0);

        expect(afterColumnUnfreezeCallback).not.toHaveBeenCalled();
        expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
      });
    });
  });
});
