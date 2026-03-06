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
      it('should add the `role=treegrid` aria tag to the root element of the table', async() => {
        const hot = handsontable({});

        expect(hot.rootElement.getAttribute('role')).toEqual('treegrid');
      });

      it('should add the `aria-multiselectable` aria tag to the root element of the table', async() => {
        const hot = handsontable({});

        expect(hot.rootElement.getAttribute('aria-multiselectable')).toEqual('true');
      });

      it('should add the `aria-rowcount` and `aria-colcount` tags to the root element of the table', async() => {
        const hot = handsontable({
          data: createSpreadsheetData(100, 50),
          rowHeaders: true,
        });

        expect(hot.rootElement.getAttribute('aria-rowcount')).toEqual('-1'); // temp value (#10607)
        expect(hot.rootElement.getAttribute('aria-colcount')).toEqual('51'); // Include row headers.
      });

      it('should update the `aria-rowcount` and `aria-colcount` tags after calling `updateSettings`, `loadData` and' +
        ' `updateData`', async() => {
        const hot = handsontable({
          data: createSpreadsheetData(100, 50),
          rowHeaders: true
        });

        expect(hot.rootElement.getAttribute('aria-rowcount')).toEqual('-1'); // temp value (#10607)
        expect(hot.rootElement.getAttribute('aria-colcount')).toEqual('51'); // Include row headers.

        await updateSettings({
          data: createSpreadsheetData(50, 100),
        });

        expect(hot.rootElement.getAttribute('aria-rowcount')).toEqual('-1'); // temp value (#10607)
        expect(hot.rootElement.getAttribute('aria-colcount')).toEqual('101'); // Include row headers.

        await loadData(createSpreadsheetData(12, 21));

        expect(hot.rootElement.getAttribute('aria-rowcount')).toEqual('-1'); // temp value (#10607)
        expect(hot.rootElement.getAttribute('aria-colcount')).toEqual('22'); // Include row headers.

        await updateData(createSpreadsheetData(32, 23));

        expect(hot.rootElement.getAttribute('aria-rowcount')).toEqual('-1'); // temp value (#10607)
        expect(hot.rootElement.getAttribute('aria-colcount')).toEqual('24'); // Include row headers.
      });
    });
  });
});
