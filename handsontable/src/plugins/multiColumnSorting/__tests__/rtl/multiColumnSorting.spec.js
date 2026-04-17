describe('MultiColumnSorting (RTL)', () => {
  using('configuration object', [
    { htmlDir: 'rtl', layoutDirection: 'inherit' },
    { htmlDir: 'ltr', layoutDirection: 'rtl' },
  ], ({ htmlDir, layoutDirection }) => {
    const id = 'testContainer';

    beforeEach(function() {
      $('html').attr('dir', htmlDir);
      this.$container = $(`<div id="${id}" style="overflow: auto; width: 300px; height: 200px;"></div>`)
        .appendTo('body');
    });

    afterEach(function() {
      $('html').attr('dir', 'ltr');

      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe('Numbers presenting sorting sequence', () => {
      it('should position the sorting sequence number when multiple columns are sorted', async() => {
        spec().$container[0].style.width = 'auto';
        spec().$container[0].style.height = 'auto';

        handsontable({
          layoutDirection,
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          multiColumnSorting: {
            indicator: true,
            initialConfig: [{
              column: 1,
              sortOrder: 'asc'
            }, {
              column: 0,
              sortOrder: 'asc'
            }, {
              column: 2,
              sortOrder: 'asc'
            }, {
              column: 3,
              sortOrder: 'asc'
            }, {
              column: 4,
              sortOrder: 'asc'
            }, {
              column: 5,
              sortOrder: 'asc'
            }, {
              column: 6,
              sortOrder: 'asc'
            }, {
              column: 7,
              sortOrder: 'asc'
            }, {
              column: 8,
              sortOrder: 'asc'
            }, {
              column: 9,
              sortOrder: 'asc'
            }]
          }
        });

        const computedStyle = window.getComputedStyle(spec().$container.find('th span.columnSorting')[0], ':after');

        expect(parseInt(computedStyle.getPropertyValue('margin-top'), 10)).toBeGreaterThanOrEqual(0);
        expect(parseInt(computedStyle.getPropertyValue('top'), 10)).toBeGreaterThanOrEqual(0);

        if (htmlDir === 'rtl' || layoutDirection === 'rtl') {
          expect(parseInt(computedStyle.getPropertyValue('left'), 10)).toBeGreaterThanOrEqual(0);

        } else {
          expect(parseInt(computedStyle.getPropertyValue('right'), 10)).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });
});
