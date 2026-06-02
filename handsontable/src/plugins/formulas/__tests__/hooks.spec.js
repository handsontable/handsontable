import HyperFormula from 'hyperformula';

describe('Formulas general', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
    this.hfInstance = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }

    this.hfInstance.destroy();
  });

  describe('Engine-related hooks', () => {
    describe('afterNamedExpressionAdded', () => {
      it('should run the `afterNamedExpressionAdded` hook when there were new named expressions added to the engine' +
        ' instance', async() => {
        const afterNamedExpressionAdded = jasmine.createSpy('afterNamedExpressionAdded');

        handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: spec().hfInstance
          },
          afterNamedExpressionAdded,
        });

        spec().hfInstance.addNamedExpression('testExprerssion', '=Sheet1!$A$1+100');

        expect(afterNamedExpressionAdded.calls.count()).toEqual(1);
        expect(afterNamedExpressionAdded.calls.mostRecent().args[0]).toEqual('testExprerssion');
      });
    });

    describe('afterNamedExpressionRemoved', () => {
      it('should run the `afterNamedExpressionRemoved` hook when there were new named expressions removed from the engine' +
        ' instance', async() => {
        const afterNamedExpressionRemoved = jasmine.createSpy('afterNamedExpressionRemoved');

        spec().hfInstance.addNamedExpression('testExprerssion', '=Sheet1!$A$1+100');

        handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: spec().hfInstance
          },
          afterNamedExpressionRemoved,
        });

        spec().hfInstance.removeNamedExpression('testExprerssion');

        expect(afterNamedExpressionRemoved.calls.count()).toEqual(1);
        expect(afterNamedExpressionRemoved.calls.mostRecent().args[0]).toEqual('testExprerssion');
      });
    });

    describe('afterSheetAdded', () => {
      it('should run the `afterSheetAdded` hook when there was a new sheet added to the engine\'s instance', async() => {
        const afterSheetAdded = jasmine.createSpy('afterSheetAdded');

        handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: spec().hfInstance
          },
          afterSheetAdded,
        });

        spec().hfInstance.addSheet('Test Sheet');

        expect(afterSheetAdded.calls.count()).toEqual(2);
        expect(afterSheetAdded.calls.first().args[0]).toEqual(getPlugin('formulas').sheetName);
        expect(afterSheetAdded.calls.mostRecent().args[0]).toEqual('Test Sheet');
      });
    });

    describe('afterSheetRemoved', () => {
      it('should run the `afterSheetRemoved` hook when there was a sheet removed from the engine\'s instance', async() => {
        const afterSheetRemoved = jasmine.createSpy('afterSheetRemoved');

        spec().hfInstance.addSheet('Test Sheet');

        handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: spec().hfInstance
          },
          afterSheetRemoved,
        });

        spec().hfInstance.removeSheet(0);

        expect(afterSheetRemoved.calls.count()).toEqual(1);
        expect(afterSheetRemoved.calls.mostRecent().args[0]).toEqual('Test Sheet');
      });
    });

    describe('afterSheetRenamed', () => {
      it('should run the `afterSheetRenamed` hook when there was a new sheet renamed in the engine\'s instance', async() => {
        const afterSheetRenamed = jasmine.createSpy('afterSheetRenamed');

        spec().hfInstance.addSheet('Test Sheet');

        handsontable({
          data: getDataSimpleExampleFormulas(),
          formulas: {
            engine: spec().hfInstance
          },
          afterSheetRenamed,
        });

        spec().hfInstance.renameSheet(spec().hfInstance.getSheetId('Test Sheet'), 'New Name');

        expect(afterSheetRenamed.calls.count()).toEqual(1);
        expect(afterSheetRenamed.calls.mostRecent().args[0]).toEqual('Test Sheet', 'New Name');
      });
    });

    describe('afterFormulasValuesUpdate', () => {
      it('should run the `afterFormulasValuesUpdate` hook when there was a value updated in the engine\'s instance', async() => {
        const afterFormulasValuesUpdate = jasmine.createSpy('afterFormulasValuesUpdate');

        handsontable({
          data: [
            ['A', '=A1']
          ],
          formulas: {
            engine: spec().hfInstance
          },
          afterFormulasValuesUpdate,
        });

        await setDataAtCell(0, 0, 'test');

        // First one is from filling the sheet with data
        expect(afterFormulasValuesUpdate.calls.count()).toEqual(2);
        expect(afterFormulasValuesUpdate.calls.mostRecent().args[0][0].newValue).toEqual('test');
      });

      it('should pass a formatted time string (not a raw HF time fraction) as `newValue` for cells with' +
        ' `type: \'time\'`', async() => {
        const afterFormulasValuesUpdate = jasmine.createSpy('afterFormulasValuesUpdate');

        handsontable({
          data: [
            ['16:00', '=A1']
          ],
          columns: [
            { type: 'time', timeFormat: 'HH:mm' },
            { type: 'time', timeFormat: 'HH:mm' },
          ],
          formulas: {
            engine: spec().hfInstance
          },
          afterFormulasValuesUpdate,
        });

        await setDataAtCell(0, 0, '18:00');

        const lastChanges = afterFormulasValuesUpdate.calls.mostRecent().args[0];
        const b1Change = lastChanges.find(change => change.address &&
          change.address.row === 0 && change.address.col === 1);

        expect(typeof b1Change.newValue).toBe('string');
        expect(b1Change.newValue).toBe('18:00');
      });

      it('should pass a formatted date string (not a raw HF date number) as `newValue` for cells with' +
        ' `type: \'date\'`', async() => {
        const afterFormulasValuesUpdate = jasmine.createSpy('afterFormulasValuesUpdate');

        handsontable({
          data: [
            ['2020-03-01', '=A1']
          ],
          columns: [
            { type: 'date' },
            { type: 'date' },
          ],
          formulas: {
            engine: spec().hfInstance
          },
          afterFormulasValuesUpdate,
        });

        await setDataAtCell(0, 0, '2021-02-04');

        const lastChanges = afterFormulasValuesUpdate.calls.mostRecent().args[0];
        const b1Change = lastChanges.find(change => change.address &&
          change.address.row === 0 && change.address.col === 1);

        expect(typeof b1Change.newValue).toBe('string');
        expect(b1Change.newValue).toBe('2021-02-04');
      });

      it('should return a formatted time string (not a raw HF time fraction) from `getDataAtCell` for a formula' +
        ' cell of `type: \'time\'`', async() => {
        handsontable({
          data: [
            ['16:00', '=A1']
          ],
          columns: [
            { type: 'time', timeFormat: 'HH:mm' },
            { type: 'time', timeFormat: 'HH:mm' },
          ],
          formulas: {
            engine: spec().hfInstance
          },
        });

        expect(getDataAtCell(0, 1)).toBe('16:00');

        await setDataAtCell(0, 0, '18:00');

        expect(getDataAtCell(0, 1)).toBe('18:00');
      });
    });
  });
});
