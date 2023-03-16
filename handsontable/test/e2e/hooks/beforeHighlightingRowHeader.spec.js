describe('Hook', () => {
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

  function highlightMetaFactory(initialValues = {}) {
    const {
      rowCursor: _rowCursor,
      selectionHeight: _selectionHeight,
      selectionType: _selectionType,
    } = initialValues;

    return ({ rowCursor, selectionHeight, selectionType } = {}) => {
      return {
        rowCursor: rowCursor ?? _rowCursor,
        selectionHeight: selectionHeight ?? _selectionHeight,
        selectionType: selectionType ?? _selectionType,
      };
    };
  }

  describe('beforeHighlightingRowHeader', () => {
    it('should be fired when the header selection is caused by selected cells', () => {
      const spy = jasmine.createSpy();

      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        beforeHighlightingRowHeader: spy,
      });

      selectCells([[2, 2, 4, 2]]);

      const createHighlightMeta = highlightMetaFactory({
        selectionType: 'header',
        selectionHeight: 3,
      });

      expect(spy.calls.allArgs()).toEqual([
        [2, 0, createHighlightMeta({ rowCursor: 0 })],
        [3, 0, createHighlightMeta({ rowCursor: 1 })],
        [4, 0, createHighlightMeta({ rowCursor: 2 })],
        [2, 0, createHighlightMeta({ rowCursor: 0 })],
        [3, 0, createHighlightMeta({ rowCursor: 1 })],
        [4, 0, createHighlightMeta({ rowCursor: 2 })],
      ]);
    });

    it('should be fired when the header selection is caused by selected row headers', () => {
      const spy = jasmine.createSpy();

      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        beforeHighlightingRowHeader: spy,
      });

      selectRows(2, 5);

      const createHighlightMeta = highlightMetaFactory({
        selectionType: 'header',
        selectionHeight: 4,
      });
      const createActiveHighlightMeta = highlightMetaFactory({
        selectionType: 'active-header',
        selectionHeight: 4,
      });

      expect(spy.calls.allArgs()).toEqual([
        [2, 0, createHighlightMeta({ rowCursor: 0 })],
        [3, 0, createHighlightMeta({ rowCursor: 1 })],
        [4, 0, createHighlightMeta({ rowCursor: 2 })],
        [5, 0, createHighlightMeta({ rowCursor: 3 })],
        [2, 0, createActiveHighlightMeta({ rowCursor: 0 })],
        [3, 0, createActiveHighlightMeta({ rowCursor: 1 })],
        [4, 0, createActiveHighlightMeta({ rowCursor: 2 })],
        [5, 0, createActiveHighlightMeta({ rowCursor: 3 })],
        [2, 0, createHighlightMeta({ rowCursor: 0 })],
        [3, 0, createHighlightMeta({ rowCursor: 1 })],
        [4, 0, createHighlightMeta({ rowCursor: 2 })],
        [5, 0, createHighlightMeta({ rowCursor: 3 })],
        [2, 0, createActiveHighlightMeta({ rowCursor: 0 })],
        [3, 0, createActiveHighlightMeta({ rowCursor: 1 })],
        [4, 0, createActiveHighlightMeta({ rowCursor: 2 })],
        [5, 0, createActiveHighlightMeta({ rowCursor: 3 })],
      ]);
    });

    it('should forward the element highlighting to the another header element', () => {
      const headerRendererFactory = () => (index, TH) => {
        TH.innerHTML = '';

        const div = document.createElement('div');
        const span = document.createElement('span');

        div.className = 'relative';
        span.className = 'rowHeader';

        span.innerText = index;

        div.appendChild(span);
        TH.appendChild(div);
      };

      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        afterGetRowHeaderRenderers(array) {
          array.push(headerRendererFactory());
          array.push(headerRendererFactory());

          return array;
        },
        beforeHighlightingRowHeader(rowIndex) {
          return rowIndex + 2;
        }
      });

      selectCell(2, 4);

      expect(getInlineStartClone().find('tbody tr:nth(2) th:nth(2)').hasClass('ht__highlight')).toBeFalse();
      expect(getInlineStartClone().find('tbody tr:nth(4) th:nth(2)').hasClass('ht__highlight')).toBeTrue();

      selectRows(3, 4);

      expect(getInlineStartClone().find('tbody tr:nth(3) th:nth(2)').hasClass('ht__active_highlight')).toBeFalse();
      expect(getInlineStartClone().find('tbody tr:nth(4) th:nth(2)').hasClass('ht__active_highlight')).toBeFalse();
      expect(getInlineStartClone().find('tbody tr:nth(5) th:nth(2)').hasClass('ht__active_highlight')).toBeTrue();
      expect(getInlineStartClone().find('tbody tr:nth(6) th:nth(2)').hasClass('ht__active_highlight')).toBeTrue();
    });
  });
});
