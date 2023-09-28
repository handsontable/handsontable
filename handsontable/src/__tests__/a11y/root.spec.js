describe('Root element-related a11y configuration', () => {
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

  describe('DOM structure', () => {
    describe('root element', () => {
      it('should add the `role=treegrid` aria tag to the root element of the table', () => {
        const hot = handsontable({});

        expect(hot.rootElement.getAttribute('role')).toEqual('treegrid');
      });

      it('should add the `aria-multiselectable` aria tag to the root element of the table', () => {
        const hot = handsontable({});

        expect(hot.rootElement.getAttribute('aria-multiselectable')).toEqual('true');
      });

      it('should add the `aria-rowcount` and `aria-colcount` tags to the root element of the table', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(100, 50),
        });

        expect(hot.rootElement.getAttribute('aria-rowcount')).toEqual('100');
        expect(hot.rootElement.getAttribute('aria-colcount')).toEqual('50');
      });

      it('should update the `aria-rowcount` and `aria-colcount` tags after calling `updateSettings`, `loadData` and' +
        ' `updateData`', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(100, 50),
        });

        expect(hot.rootElement.getAttribute('aria-rowcount')).toEqual('100');
        expect(hot.rootElement.getAttribute('aria-colcount')).toEqual('50');

        hot.updateSettings({
          data: Handsontable.helper.createSpreadsheetData(50, 100),
        });

        expect(hot.rootElement.getAttribute('aria-rowcount')).toEqual('50');
        expect(hot.rootElement.getAttribute('aria-colcount')).toEqual('100');

        hot.loadData(Handsontable.helper.createSpreadsheetData(12, 21));

        expect(hot.rootElement.getAttribute('aria-rowcount')).toEqual('12');
        expect(hot.rootElement.getAttribute('aria-colcount')).toEqual('21');

        hot.updateData(Handsontable.helper.createSpreadsheetData(32, 23));

        expect(hot.rootElement.getAttribute('aria-rowcount')).toEqual('32');
        expect(hot.rootElement.getAttribute('aria-colcount')).toEqual('23');
      });
    });
  });
});
