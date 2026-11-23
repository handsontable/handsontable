describe('Row-related a11y config', () => {
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
    it('should have the `role=row` attribute set', async() => {
      handsontable({
        data: createSpreadsheetData(50, 15),
        rowHeaders: true,
        colHeaders: true,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsStart: 2,
        viewportRowRenderingOffset: Infinity,
        viewportColumnRenderingOffset: Infinity
      });

      const countElementsWithAriaRow = (overlay) => {
        return filterElementsByAttribute(
          overlay.get(0),
          'tr',
          'role',
          'row'
        ).length;
      };

      // A grid row is a `row` in one table only: the one that holds the row's first cells (its row header).
      // The other tables' cells of the row are joined to it (`aria-owns`).
      expect(countElementsWithAriaRow(getMaster())).toEqual(0);

      expect(countElementsWithAriaRow(getTopClone())).toEqual(0);

      expect(countElementsWithAriaRow(getBottomClone())).toEqual(0);

      // The rows between the frozen top and bottom rows.
      expect(countElementsWithAriaRow(getInlineStartClone())).toEqual(46);

      // The head row and the two frozen top rows.
      expect(countElementsWithAriaRow(getTopInlineStartClone())).toEqual(3);

      expect(countElementsWithAriaRow(getBottomInlineStartClone())).toEqual(2);

      // 51 grid rows, each a `row` once.
      expect(countElementsWithAriaRow(spec().$container)).toEqual(51);
    });

    it('should have the `aria-rowindex` attribute set, taken the headers into account (headers and cells share the' +
      ' row indexes)', async() => {
      handsontable({
        data: createSpreadsheetData(50, 15),
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

      const withoutIndex = length => Array.from({ length }, () => null);

      // The row index is carried by the table row that stands for the grid row (see the test above): the
      // rows of the master and of the top and bottom clones carry none.
      gatherIndexes(getMaster().get(0), indexes);

      expect(indexes).toEqual(withoutIndex(51));

      gatherIndexes(getTopClone().get(0), indexes);

      expect(indexes).toEqual(withoutIndex(3));

      gatherIndexes(getBottomClone().get(0), indexes);

      expect(indexes).toEqual(withoutIndex(2));

      gatherIndexes(getInlineStartClone().get(0), indexes);

      // Its head row and its copies of the frozen top and bottom rows belong to the corners.
      expect(indexes).toEqual([...withoutIndex(3), ...consecutiveNumbers.slice(3, 49), ...withoutIndex(2)]);

      gatherIndexes(getTopInlineStartClone().get(0), indexes);

      expect(indexes).toEqual(consecutiveNumbers.slice(0, 3));

      gatherIndexes(getBottomInlineStartClone().get(0), indexes);

      expect(indexes).toEqual(consecutiveNumbers.slice(49, 51));
    });
  });
});
