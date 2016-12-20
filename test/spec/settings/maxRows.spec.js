describe('settings', function () {
  describe('maxRows', function () {
    var id = 'testContainer';

    beforeEach(function () {
      this.$container = $('<div id="' + id + '"></div>').appendTo('body');
    });

    afterEach(function () {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe('works on init', function () {
      var trimmingTest = function (config, result) {
        it('should show data properly when maxRows is set to ' + (config.desc || config.maxRows), function () {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(config.rows, config.columns),
            maxRows: config.maxRows
          });

          expect(getSourceData().length).toEqual(result.expectedSourceRows);
          expect(getData().length).toEqual(result.expectedDataRows);
        });
      };

      // Can be tested when config will parsed // wszymanski, 19.12.2016

      // trimmingTest({rows: 10, columns: 10, maxRows: undefined}, {expectedSourceRows: 10, expectedDataRows: 10});
      // trimmingTest({rows: 10, columns: 10, maxRows: null}, {expectedSourceRows: 10, expectedDataRows: 10});
      // trimmingTest({rows: 10, columns: 10, maxRows: NaN}, {expectedSourceRows: 10, expectedDataRows: 10});
      // trimmingTest({rows: 10, columns: 10, maxRows: -Infinity}, {expectedSourceRows: 10, expectedDataRows: 0});
      // trimmingTest({desc: '< 0', rows: 10, columns: 10, maxRows: -1}, {expectedSourceRows: 10, expectedDataRows: 0});
      trimmingTest({rows: 10, columns: 10, maxRows: 0}, {expectedSourceRows: 10, expectedDataRows: 0});
      trimmingTest({desc: '> 0', rows: 10, columns: 10, maxRows: 5}, {expectedSourceRows: 10, expectedDataRows: 5});
      trimmingTest({rows: 10, columns: 10, maxRows: Infinity}, {expectedSourceRows: 10, expectedDataRows: 10});
    });

    describe('update settings works', function () {
      var trimmingTest = function (config, maxRowsToExpectedRows) {
        it(config.desc, function () {

          handsontable({
            data: Handsontable.helper.createSpreadsheetData(config.rows, config.columns)
          });

          expect(getData().length).toEqual(getSourceData().length);

          for (var i = 0; i < maxRowsToExpectedRows.length; i += 1) {
            updateSettings({
              maxRows: maxRowsToExpectedRows[i][0]
            });

            expect(getData().length).toEqual(maxRowsToExpectedRows[i][1]);
          }
        });
      };

      var rows = 10, columns = 10;

      trimmingTest({ desc: 'should show data properly after maxRows is updated to numerical values', rows: rows, columns: columns },
        [
          // [-Infinity, 0],
          // [-2, 0],
          [0, 0],
          [2, 2],
          [Infinity, rows]
        ]
      );

      // Can be tested when config will parsed // wszymanski, 19.12.2016

      // trimmingTest({ desc: 'should show data properly after maxRows is updated to non-numerical values', rows: rows, columns: columns},
      //   [
      //     [undefined, rows],
      //     [null, rows],
      //     [NaN, rows]
      //   ]
      // );
    });
  });
});
