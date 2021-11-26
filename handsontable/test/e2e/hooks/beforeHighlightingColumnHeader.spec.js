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
      classNames: _classNames = [],
      columnCursor: _columnCursor,
      selectionWidth: _selectionWidth,
      selectionType: _selectionType,
    } = initialValues;

    return ({ classNames, columnCursor, selectionWidth, selectionType } = {}) => {
      return {
        classNames: classNames ?? _classNames,
        columnCursor: columnCursor ?? _columnCursor,
        selectionWidth: selectionWidth ?? _selectionWidth,
        selectionType: selectionType ?? _selectionType,
      };
    };
  }

  describe('beforeHighlightingColumnHeader', () => {
    it('should be fired when the header selection is caused by selected cells', () => {
      const spy = jasmine.createSpy();

      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        beforeHighlightingColumnHeader: spy,
      });

      selectCells([[2, 2, 2, 4]]);

      const createHighlightMeta = highlightMetaFactory({
        classNames: ['ht__highlight'],
        selectionType: 'header',
        selectionWidth: 3,
      });

      expect(spy.calls.allArgs()).toEqual([
        [2, 0, createHighlightMeta({ columnCursor: 0 })],
        [3, 0, createHighlightMeta({ columnCursor: 1 })],
        [4, 0, createHighlightMeta({ columnCursor: 2 })],
        [2, 0, createHighlightMeta({ columnCursor: 0 })],
        [3, 0, createHighlightMeta({ columnCursor: 1 })],
        [4, 0, createHighlightMeta({ columnCursor: 2 })],
      ]);
    });

    it('should be fired when the header selection is caused by selected column headers', () => {
      const spy = jasmine.createSpy();

      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        beforeHighlightingColumnHeader: spy,
      });

      selectColumns(2, 5);

      const createHighlightMeta = highlightMetaFactory({
        classNames: ['ht__highlight'],
        selectionType: 'header',
        selectionWidth: 4,
      });
      const createActiveHighlightMeta = highlightMetaFactory({
        classNames: ['ht__active_highlight'],
        selectionType: 'active-header',
        selectionWidth: 4,
      });

      expect(spy.calls.allArgs()).toEqual([
        [2, 0, createHighlightMeta({ columnCursor: 0 })],
        [3, 0, createHighlightMeta({ columnCursor: 1 })],
        [4, 0, createHighlightMeta({ columnCursor: 2 })],
        [5, 0, createHighlightMeta({ columnCursor: 3 })],
        [2, 0, createActiveHighlightMeta({ columnCursor: 0 })],
        [3, 0, createActiveHighlightMeta({ columnCursor: 1 })],
        [4, 0, createActiveHighlightMeta({ columnCursor: 2 })],
        [5, 0, createActiveHighlightMeta({ columnCursor: 3 })],
        [2, 0, createHighlightMeta({ columnCursor: 0 })],
        [3, 0, createHighlightMeta({ columnCursor: 1 })],
        [4, 0, createHighlightMeta({ columnCursor: 2 })],
        [5, 0, createHighlightMeta({ columnCursor: 3 })],
        [2, 0, createActiveHighlightMeta({ columnCursor: 0 })],
        [3, 0, createActiveHighlightMeta({ columnCursor: 1 })],
        [4, 0, createActiveHighlightMeta({ columnCursor: 2 })],
        [5, 0, createActiveHighlightMeta({ columnCursor: 3 })],
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
        colHeaders: true,
        afterGetColumnHeaderRenderers(array) {
          array.push(headerRendererFactory());
          array.push(headerRendererFactory());

          return array;
        },
        beforeHighlightingColumnHeader(columnIndex) {
          return columnIndex + 2;
        }
      });

      selectCell(2, 4);

      expect(getTopClone().find('thead tr:nth(2) th:nth(4)').hasClass('ht__highlight')).toBeFalse();
      expect(getTopClone().find('thead tr:nth(2) th:nth(6)').hasClass('ht__highlight')).toBeTrue();

      selectColumns(3, 4);

      expect(getTopClone().find('thead tr:nth(2) th:nth(3)').hasClass('ht__active_highlight')).toBeFalse();
      expect(getTopClone().find('thead tr:nth(2) th:nth(4)').hasClass('ht__active_highlight')).toBeFalse();
      expect(getTopClone().find('thead tr:nth(2) th:nth(5)').hasClass('ht__active_highlight')).toBeTrue();
      expect(getTopClone().find('thead tr:nth(2) th:nth(6)').hasClass('ht__active_highlight')).toBeTrue();
    });
  });
});
