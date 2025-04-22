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
          rowHeaders: true,
        });

        expect(hot.rootElement.getAttribute('aria-rowcount')).toEqual('-1'); // temp value (#10607)
        expect(hot.rootElement.getAttribute('aria-colcount')).toEqual('51'); // Include row headers.
      });

      it('should update the `aria-rowcount` and `aria-colcount` tags after calling `updateSettings`, `loadData` and' +
        ' `updateData`', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(100, 50),
          rowHeaders: true
        });

        expect(hot.rootElement.getAttribute('aria-rowcount')).toEqual('-1'); // temp value (#10607)
        expect(hot.rootElement.getAttribute('aria-colcount')).toEqual('51'); // Include row headers.

        hot.updateSettings({
          data: Handsontable.helper.createSpreadsheetData(50, 100),
        });

        expect(hot.rootElement.getAttribute('aria-rowcount')).toEqual('-1'); // temp value (#10607)
        expect(hot.rootElement.getAttribute('aria-colcount')).toEqual('101'); // Include row headers.

        hot.loadData(Handsontable.helper.createSpreadsheetData(12, 21));

        expect(hot.rootElement.getAttribute('aria-rowcount')).toEqual('-1'); // temp value (#10607)
        expect(hot.rootElement.getAttribute('aria-colcount')).toEqual('22'); // Include row headers.

        hot.updateData(Handsontable.helper.createSpreadsheetData(32, 23));

        expect(hot.rootElement.getAttribute('aria-rowcount')).toEqual('-1'); // temp value (#10607)
        expect(hot.rootElement.getAttribute('aria-colcount')).toEqual('24'); // Include row headers.
      });
    });
  });
});
