describe('CollapsibleColumns (RTL)', () => {
  using('configuration object', [
    { htmlDir: 'rtl', layoutDirection: 'inherit' },
    { htmlDir: 'ltr', layoutDirection: 'rtl' },
  ], ({ htmlDir, layoutDirection }) => {
    const id = 'testContainer';

    beforeEach(function() {
      $('html').attr('dir', htmlDir);

      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      $('html').attr('dir', 'ltr');

      if (this.$container) {
        destroy();
        $('body').find(`#${id}`).remove();
      }
      if (this.$wrapper) {
        this.$wrapper.remove();
      }
    });

    describe('collapsible button', () => {
      it.forTheme('classic')('should be placed in correct place', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(10, 10),
          nestedHeaders: [
            ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
            ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
          ],
          collapsibleColumns: true
        });

        expect(window.getComputedStyle(getCell(-1, 3).querySelector('.collapsibleIndicator'))
          .getPropertyValue('left')).toEqual('5px');
      });

      it.forTheme('main')('should be placed in correct place', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(10, 10),
          nestedHeaders: [
            ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
            ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
          ],
          collapsibleColumns: true
        });

        const indicatorComputedStyle = window.getComputedStyle(getCell(-1, 3).querySelector('.collapsibleIndicator'));

        expect(indicatorComputedStyle.marginInlineStart).toEqual('4px');
        expect(indicatorComputedStyle.position).toEqual('relative');
        expect(indicatorComputedStyle.float).toEqual('left');
      });

      it.forTheme('horizon')('should be placed in correct place', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(10, 10),
          nestedHeaders: [
            ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
            ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
          ],
          collapsibleColumns: true
        });

        const indicatorComputedStyle = window.getComputedStyle(getCell(-1, 3).querySelector('.collapsibleIndicator'));

        expect(indicatorComputedStyle.marginInlineStart).toEqual('6px');
        expect(indicatorComputedStyle.position).toEqual('relative');
        expect(indicatorComputedStyle.float).toEqual('left');
      });
    });
  });
});
