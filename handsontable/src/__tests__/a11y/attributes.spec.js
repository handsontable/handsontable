describe('a11y DOM attributes (ARIA tags)', () => {
  const id = 'testContainer';

  const filterElementsByAttribute = (rootElement, elementSelector, attributeName, attributeValue, negation = false) => {
    return [...rootElement.querySelectorAll(elementSelector || '*')].filter((el) => {
      return [...el.getAttributeNames()].filter(
        (attr) => {
          return negation ?
            (attr !== attributeName || el.getAttribute(attr) !== attributeValue) :
            (attr === attributeName && el.getAttribute(attr) === attributeValue);
        }
      ).length > 0;
    });
  };

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

      it('should the `aria-rowcount` and `aria-colcount` aria tags to the root element of the table', () => {
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
      });
    });

    describe('cell elements', () => {
      it('should add the `role=gridcell` aria tag to every cell in the table', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(50, 50),
          rowHeaders: true,
          colHeaders: true,
          fixedRowsTop: 2,
          fixedRowsBottom: 2,
          fixedColumnsStart: 2,
          viewportRowRenderingOffset: Infinity,
          viewportColumnRenderingOffset: Infinity
        });

        expect(filterElementsByAttribute(
          getMaster().get(0),
          'tbody td',
          'role',
          'gridcell'
        ).length).toEqual(2500);

        expect(filterElementsByAttribute(
          getTopClone().get(0),
          'tbody td',
          'role',
          'gridcell'
        ).length).toEqual(100);

        expect(filterElementsByAttribute(
          getBottomClone().get(0),
          'tbody td',
          'role',
          'gridcell'
        ).length).toEqual(100);

        expect(filterElementsByAttribute(
          getInlineStartClone().get(0),
          'tbody td',
          'role',
          'gridcell'
        ).length).toEqual(100);

        expect(filterElementsByAttribute(
          getTopInlineStartClone().get(0),
          'tbody td',
          'role',
          'gridcell'
        ).length).toEqual(4);

        expect(filterElementsByAttribute(
          getBottomInlineStartClone().get(0),
          'tbody td',
          'role',
          'gridcell'
        ).length).toEqual(4);
      });

      it('should have the `aria-colindex` attribute set, taken the headers into account (headers and cells share the' +
        ' column indexes)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(50, 50),
          rowHeaders: true,
          colHeaders: true,
          fixedRowsTop: 2,
          fixedRowsBottom: 2,
          fixedColumnsStart: 2,
          viewportRowRenderingOffset: Infinity,
          viewportColumnRenderingOffset: Infinity
        });

        const gatherIndexes = function(rootElement, indexesArray) {
          indexesArray.length = 0;

          [...rootElement.querySelectorAll('tbody tr')].forEach((trElem, i) => {
            indexesArray.push([]);

            [...trElem.querySelectorAll('td')].forEach((tdElem) => {
              indexesArray[i].push(tdElem.getAttribute('aria-colindex'));
            });
          });
        };
        const consecutiveNumbers = Array.from({ length: 51 }, (_, i) => `${i + 1}`);
        const indexes = [];

        gatherIndexes(getMaster().get(0), indexes);

        indexes.forEach((row) => {
          expect(row).toEqual(consecutiveNumbers.slice(1, 51));
        });

        gatherIndexes(getTopClone().get(0), indexes);

        indexes.forEach((row) => {
          expect(row).toEqual(consecutiveNumbers.slice(1, 51));
        });

        gatherIndexes(getBottomClone().get(0), indexes);

        indexes.forEach((row) => {
          expect(row).toEqual(consecutiveNumbers.slice(1, 51));
        });

        gatherIndexes(getInlineStartClone().get(0), indexes);

        indexes.forEach((row) => {
          expect(row).toEqual(consecutiveNumbers.slice(1, 3));
        });

        gatherIndexes(getTopInlineStartClone().get(0), indexes);

        indexes.forEach((row) => {
          expect(row).toEqual(consecutiveNumbers.slice(1, 3));
        });

        gatherIndexes(getBottomInlineStartClone().get(0), indexes);

        indexes.forEach((row) => {
          expect(row).toEqual(consecutiveNumbers.slice(1, 3));
        });
      });

      it('should add the `tabindex=-1` aria tag to every cell in the table', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(50, 50),
          rowHeaders: true,
          colHeaders: true,
          fixedRowsTop: 2,
          fixedRowsBottom: 2,
          fixedColumnsStart: 2,
          viewportRowRenderingOffset: Infinity,
          viewportColumnRenderingOffset: Infinity
        });

        expect(filterElementsByAttribute(
          getMaster().get(0),
          'tbody td',
          'tabindex',
          '-1'
        ).length).toEqual(2500);

        expect(filterElementsByAttribute(
          getTopClone().get(0),
          'tbody td',
          'tabindex',
          '-1'
        ).length).toEqual(100);

        expect(filterElementsByAttribute(
          getBottomClone().get(0),
          'tbody td',
          'tabindex',
          '-1'
        ).length).toEqual(100);

        expect(filterElementsByAttribute(
          getInlineStartClone().get(0),
          'tbody td',
          'tabindex',
          '-1'
        ).length).toEqual(100);

        expect(filterElementsByAttribute(
          getTopInlineStartClone().get(0),
          'tbody td',
          'tabindex',
          '-1'
        ).length).toEqual(4);

        expect(filterElementsByAttribute(
          getBottomInlineStartClone().get(0),
          'tbody td',
          'tabindex',
          '-1'
        ).length).toEqual(4);
      });
    });

    describe('rows', () => {
      it('should have the `role=row` attribute set', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(50, 15),
          rowHeaders: true,
          colHeaders: true,
          fixedRowsTop: 2,
          fixedRowsBottom: 2,
          fixedColumnsStart: 2,
          viewportRowRenderingOffset: Infinity,
          viewportColumnRenderingOffset: Infinity
        });

        expect(filterElementsByAttribute(
          getMaster().get(0),
          'tr',
          'role',
          'row'
        ).length).toEqual(51);

        expect(filterElementsByAttribute(
          getTopClone().get(0),
          'tr',
          'role',
          'row'
        ).length).toEqual(3);

        expect(filterElementsByAttribute(
          getBottomClone().get(0),
          'tr',
          'role',
          'row'
        ).length).toEqual(2);

        expect(filterElementsByAttribute(
          getInlineStartClone().get(0),
          'tr',
          'role',
          'row'
        ).length).toEqual(51);

        expect(filterElementsByAttribute(
          getTopInlineStartClone().get(0),
          'tr',
          'role',
          'row'
        ).length).toEqual(3);

        expect(filterElementsByAttribute(
          getBottomInlineStartClone().get(0),
          'tr',
          'role',
          'row'
        ).length).toEqual(2);
      });

      it('should have the `aria-rowindex` attribute set, taken the headers into account (headers and cells share the' +
        ' row indexes)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(50, 15),
          rowHeaders: true,
          colHeaders: true,
          fixedRowsTop: 2,
          fixedRowsBottom: 2,
          fixedColumnsStart: 2,
          viewportRowRenderingOffset: Infinity,
          viewportColumnRenderingOffset: Infinity
        });

        const gatherIndexes = function(rootElement, indexesArray) {
          indexesArray.length = 0;

          [...rootElement.querySelectorAll('tr')].forEach((trElem) => {
            indexesArray.push(trElem.getAttribute('aria-rowindex'));
          });
        };
        const consecutiveNumbers = Array.from({ length: 51 }, (_, i) => `${i + 1}`);
        const indexes = [];

        gatherIndexes(getMaster().get(0), indexes);

        expect(indexes).toEqual(consecutiveNumbers);

        gatherIndexes(getTopClone().get(0), indexes);

        expect(indexes).toEqual(consecutiveNumbers.slice(0, 3));

        gatherIndexes(getBottomClone().get(0), indexes);

        expect(indexes).toEqual(consecutiveNumbers.slice(49, 51));

        gatherIndexes(getInlineStartClone().get(0), indexes);

        expect(indexes).toEqual(consecutiveNumbers);

        gatherIndexes(getTopInlineStartClone().get(0), indexes);

        expect(indexes).toEqual(consecutiveNumbers.slice(0, 3));

        gatherIndexes(getBottomInlineStartClone().get(0), indexes);

        expect(indexes).toEqual(consecutiveNumbers.slice(49, 51));
      });
    });

    describe('headers', () => {
      it('should have the `tabindex=-1` attribute set', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(50, 50),
          rowHeaders: true,
          colHeaders: true,
          fixedRowsTop: 2,
          fixedRowsBottom: 2,
          fixedColumnsStart: 2,
          viewportRowRenderingOffset: Infinity,
          viewportColumnRenderingOffset: Infinity
        });

        expect(filterElementsByAttribute(
          getMaster().get(0),
          'th',
          'tabindex',
          '-1'
        ).length).toEqual(101);

        expect(filterElementsByAttribute(
          getInlineStartClone().get(0),
          'th',
          'tabindex',
          '-1'
        ).length).toEqual(53);

        expect(filterElementsByAttribute(
          getTopClone().get(0),
          'th',
          'tabindex',
          '-1'
        ).length).toEqual(53);

        expect(filterElementsByAttribute(
          getTopInlineStartClone().get(0),
          'th',
          'tabindex',
          '-1'
        ).length).toEqual(5);

        expect(filterElementsByAttribute(
          getBottomInlineStartClone().get(0),
          'th',
          'tabindex',
          '-1'
        ).length).toEqual(2);

        expect(filterElementsByAttribute(
          getBottomClone().get(0),
          'th',
          'tabindex',
          '-1'
        ).length).toEqual(2);
      });

      describe('row headers', () => {
        it('should add the `role=rowheader` aria tag to every row headers in the table', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(50, 15),
            rowHeaders: true,
            colHeaders: true,
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            fixedColumnsStart: 2,
            viewportRowRenderingOffset: Infinity,
            viewportColumnRenderingOffset: Infinity
          });

          expect(filterElementsByAttribute(
            getMaster().get(0),
            'tbody th',
            'role',
            'rowheader'
          ).length).toEqual(50);

          expect(filterElementsByAttribute(
            getInlineStartClone().get(0),
            'tbody th',
            'role',
            'rowheader'
          ).length).toEqual(50);

          expect(filterElementsByAttribute(
            getTopClone().get(0),
            'tbody th',
            'role',
            'rowheader'
          ).length).toEqual(2);

          expect(filterElementsByAttribute(
            getTopInlineStartClone().get(0),
            'tbody th',
            'role',
            'rowheader'
          ).length).toEqual(2);

          expect(filterElementsByAttribute(
            getBottomInlineStartClone().get(0),
            'tbody th',
            'role',
            'rowheader'
          ).length).toEqual(2);

          expect(filterElementsByAttribute(
            getBottomClone().get(0),
            'tbody th',
            'role',
            'rowheader'
          ).length).toEqual(2);
        });

        it('should add the `scope=row` aria tag to every row headers in the table', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(50, 15),
            rowHeaders: true,
            colHeaders: true,
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            fixedColumnsStart: 2,
            viewportRowRenderingOffset: Infinity,
            viewportColumnRenderingOffset: Infinity
          });

          expect(filterElementsByAttribute(
            getMaster().get(0),
            'tbody th',
            'scope',
            'row'
          ).length).toEqual(50);

          expect(filterElementsByAttribute(
            getInlineStartClone().get(0),
            'tbody th',
            'scope',
            'row'
          ).length).toEqual(50);

          expect(filterElementsByAttribute(
            getTopClone().get(0),
            'tbody th',
            'scope',
            'row'
          ).length).toEqual(2);

          expect(filterElementsByAttribute(
            getTopInlineStartClone().get(0),
            'tbody th',
            'scope',
            'row'
          ).length).toEqual(2);

          expect(filterElementsByAttribute(
            getBottomInlineStartClone().get(0),
            'tbody th',
            'scope',
            'row'
          ).length).toEqual(2);

          expect(filterElementsByAttribute(
            getBottomClone().get(0),
            'tbody th',
            'scope',
            'row'
          ).length).toEqual(2);
        });
      });

      describe('column headers', () => {
        it('should add the `role=columnheader` aria tag to every row headers in the table', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(50, 50),
            rowHeaders: true,
            colHeaders: true,
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            fixedColumnsStart: 2,
            viewportRowRenderingOffset: Infinity,
            viewportColumnRenderingOffset: Infinity
          });

          expect(filterElementsByAttribute(
            getMaster().get(0),
            'thead th',
            'role',
            'columnheader'
          ).length).toEqual(50);

          expect(filterElementsByAttribute(
            getInlineStartClone().get(0),
            'thead th',
            'role',
            'columnheader'
          ).length).toEqual(2);

          expect(filterElementsByAttribute(
            getTopClone().get(0),
            'thead th',
            'role',
            'columnheader'
          ).length).toEqual(50);

          expect(filterElementsByAttribute(
            getTopInlineStartClone().get(0),
            'thead th',
            'role',
            'columnheader'
          ).length).toEqual(2);
        });

        it('should add the `scope=col` aria tag to every row headers in the table', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(50, 50),
            rowHeaders: true,
            colHeaders: true,
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            fixedColumnsStart: 2,
            viewportRowRenderingOffset: Infinity,
            viewportColumnRenderingOffset: Infinity
          });

          expect(filterElementsByAttribute(
            getMaster().get(0),
            'thead th',
            'scope',
            'col'
          ).length).toEqual(50);

          expect(filterElementsByAttribute(
            getInlineStartClone().get(0),
            'thead th',
            'scope',
            'col'
          ).length).toEqual(2);

          expect(filterElementsByAttribute(
            getTopClone().get(0),
            'thead th',
            'scope',
            'col'
          ).length).toEqual(50);

          expect(filterElementsByAttribute(
            getTopInlineStartClone().get(0),
            'thead th',
            'scope',
            'col'
          ).length).toEqual(2);
        });
      });

      describe('corner headers', () => {
        it('should add the `role=presentation` aria tag to the corner headers', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(50, 15),
            rowHeaders: true,
            colHeaders: true,
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            fixedColumnsStart: 2,
            viewportRowRenderingOffset: Infinity,
            viewportColumnRenderingOffset: Infinity
          });

          expect(
            getTopInlineStartClone().get(0).querySelector('thead th:first-of-type').getAttribute('role')
          ).toEqual('presentation');

          expect(
            getMaster().get(0).querySelector('thead th:first-of-type').getAttribute('role')
          ).toEqual('presentation');

          expect(
            getInlineStartClone().get(0).querySelector('thead th:first-of-type').getAttribute('role')
          ).toEqual('presentation');

          expect(
            getTopClone().get(0).querySelector('thead th:first-of-type').getAttribute('role')
          ).toEqual('presentation');
        });
      });
    });
  });

  describe('cell states', () => {
    it('should add a `aria-selection` attribute to the currently selected cell', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(15, 15),
        rowHeaders: true,
        colHeaders: true,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsStart: 2,
        navigableHeaders: true,
        viewportRowRenderingOffset: Infinity,
        viewportColumnRenderingOffset: Infinity
      });

      selectCell(0, 0);

      expect(filterElementsByAttribute(
        getMaster().get(0),
        'td',
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getMaster().get(0),
        'th',
        'aria-selected',
        'true'
      ).length).toEqual(2);

      expect(filterElementsByAttribute(
        getTopClone().get(0),
        'td',
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getTopClone().get(0),
        'th',
        'aria-selected',
        'true'
      ).length).toEqual(2);

      expect(filterElementsByAttribute(
        getInlineStartClone().get(0),
        'td',
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getInlineStartClone().get(0),
        'th',
        'aria-selected',
        'true'
      ).length).toEqual(2);

      expect(filterElementsByAttribute(
        getTopInlineStartClone().get(0),
        'td',
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getTopInlineStartClone().get(0),
        'th',
        'aria-selected',
        'true'
      ).length).toEqual(2);

      expect(getCell(0, 0).getAttribute('aria-selected')).toEqual('true');

      selectCell(5, 5);

      expect(filterElementsByAttribute(
        getMaster().get(0),
        'td',
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getMaster().get(0),
        'th',
        'aria-selected',
        'true'
      ).length).toEqual(2);

      expect(filterElementsByAttribute(
        getTopClone().get(0),
        'td',
        'aria-selected',
        'true'
      ).length).toEqual(0);

      expect(filterElementsByAttribute(
        getTopClone().get(0),
        'th',
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getInlineStartClone().get(0),
        'td',
        'aria-selected',
        'true'
      ).length).toEqual(0);

      expect(filterElementsByAttribute(
        getInlineStartClone().get(0),
        'th',
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getTopInlineStartClone().get(0),
        'td',
        'aria-selected',
        'true'
      ).length).toEqual(0);

      expect(filterElementsByAttribute(
        getTopInlineStartClone().get(0),
        'th',
        'aria-selected',
        'true'
      ).length).toEqual(0);

      expect(getCell(5, 5).getAttribute('aria-selected')).toEqual('true');

      selectCell(-1, 1);

      expect(filterElementsByAttribute(
        getMaster().get(0),
        null,
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getTopClone().get(0),
        null,
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getInlineStartClone().get(0),
        null,
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(filterElementsByAttribute(
        getTopInlineStartClone().get(0),
        null,
        'aria-selected',
        'true'
      ).length).toEqual(1);

      expect(getCell(-1, 1).getAttribute('aria-selected')).toEqual('true');
    });

    it('should add a `aria-readonly` attribute to the read-only cells', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
      });

      setCellMeta(1, 1, 'readOnly', true);
      setCellMeta(2, 2, 'readOnly', true);

      render();

      expect(getCell(1, 1).getAttribute('aria-readonly')).toEqual('true');
      expect(getCell(2, 2).getAttribute('aria-readonly')).toEqual('true');

      setCellMeta(1, 1, 'readOnly', false);
      setCellMeta(2, 2, 'readOnly', false);

      render();

      expect(getCell(1, 1).getAttribute('aria-readonly')).toEqual(null);
      expect(getCell(2, 2).getAttribute('aria-readonly')).toEqual(null);
    });
  });
});
