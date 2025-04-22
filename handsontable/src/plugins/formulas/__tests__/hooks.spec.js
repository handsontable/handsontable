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
        ' instance', () => {
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
        ' instance', () => {
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
      it('should run the `afterSheetAdded` hook when there was a new sheet added to the engine\'s instance', () => {
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
      it('should run the `afterSheetRemoved` hook when there was a sheet removed from the engine\'s instance', () => {
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
      it('should run the `afterSheetRenamed` hook when there was a new sheet renamed in the engine\'s instance', () => {
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
      it('should run the `afterFormulasValuesUpdate` hook when there was a value updated in the engine\'s instance', () => {
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

        setDataAtCell(0, 0, 'test');

        // First one is from filling the sheet with data
        expect(afterFormulasValuesUpdate.calls.count()).toEqual(2);
        expect(afterFormulasValuesUpdate.calls.mostRecent().args[0][0].newValue).toEqual('test');
      });
    });
  });
});
