describe('header-related a11y config', () => {
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

        const countElementsWithTabindex = (overlay) => {
          return filterElementsByAttribute(
            overlay.get(0),
            'th',
            'tabindex',
            '-1'
          ).length;
        };

        expect(countElementsWithTabindex(getMaster())).toBe(101);

        expect(countElementsWithTabindex(getInlineStartClone())).toBe(53);

        expect(countElementsWithTabindex(getTopClone())).toBe(53);

        expect(countElementsWithTabindex(getTopInlineStartClone())).toBe(5);

        expect(countElementsWithTabindex(getBottomInlineStartClone())).toBe(2);

        expect(countElementsWithTabindex(getBottomClone())).toBe(2);
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

          const countElementsWithAriaRowHeader = (overlay) => {
            return filterElementsByAttribute(
              overlay.get(0),
              'tbody th',
              'role',
              'rowheader'
            ).length;
          };

          expect(countElementsWithAriaRowHeader(getMaster())).toBe(50);

          expect(countElementsWithAriaRowHeader(getInlineStartClone())).toBe(50);

          expect(countElementsWithAriaRowHeader(getTopClone())).toBe(2);

          expect(countElementsWithAriaRowHeader(getTopInlineStartClone())).toBe(2);

          expect(countElementsWithAriaRowHeader(getBottomInlineStartClone())).toBe(2);

          expect(countElementsWithAriaRowHeader(getBottomClone())).toBe(2);
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

          const countElementsWithAriaScopeRow = (overlay) => {
            return filterElementsByAttribute(
              overlay.get(0),
              'tbody th',
              'scope',
              'row'
            ).length;
          };

          expect(countElementsWithAriaScopeRow(getMaster())).toBe(50);

          expect(countElementsWithAriaScopeRow(getInlineStartClone())).toBe(50);

          expect(countElementsWithAriaScopeRow(getTopClone())).toBe(2);

          expect(countElementsWithAriaScopeRow(getTopInlineStartClone())).toBe(2);

          expect(countElementsWithAriaScopeRow(getBottomInlineStartClone())).toBe(2);

          expect(countElementsWithAriaScopeRow(getBottomClone())).toBe(2);
        });
      });

      describe('column headers', () => {
        it('should add the `role=columnheader` aria tag to every row headers in the table (except the corner header)', () => {
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

          const countElementsWithAriaColumnHeader = (overlay) => {
            return filterElementsByAttribute(
              overlay.get(0),
              'thead th',
              'role',
              'columnheader'
            ).length;
          };

          expect(countElementsWithAriaColumnHeader(getMaster())).toBe(50);
          expect(countElementsWithAriaColumnHeader(getInlineStartClone())).toBe(2);
          expect(countElementsWithAriaColumnHeader(getTopClone())).toBe(50);
          expect(countElementsWithAriaColumnHeader(getTopInlineStartClone())).toBe(2);
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

          const countElementsWithAriaScopeCol = (overlay) => {
            return filterElementsByAttribute(
              overlay.get(0),
              'thead th',
              'scope',
              'col'
            ).length;
          };

          expect(countElementsWithAriaScopeCol(getMaster())).toBe(50);

          expect(countElementsWithAriaScopeCol(getInlineStartClone())).toBe(2);

          expect(countElementsWithAriaScopeCol(getTopClone())).toBe(50);

          expect(countElementsWithAriaScopeCol(getTopInlineStartClone())).toBe(2);
        });
      });

      describe('corner headers', () => {
        // handsontable/dev-handsontable#1602
        // handsontable/dev-handsontable#1574
        it('should add the `role=row` aria tag to the corner headers', () => {
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
          ).toBe('row');

          expect(
            getMaster().get(0).querySelector('thead th:first-of-type').getAttribute('role')
          ).toBe('row');

          expect(
            getInlineStartClone().get(0).querySelector('thead th:first-of-type').getAttribute('role')
          ).toBe('row');

          expect(
            getTopClone().get(0).querySelector('thead th:first-of-type').getAttribute('role')
          ).toBe('row');
        });
      });
    });
  });
});
