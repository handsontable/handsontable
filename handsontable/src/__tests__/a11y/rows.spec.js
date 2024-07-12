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

      const countElementsWithAriaRow = (overlay) => {
        return filterElementsByAttribute(
          overlay.get(0),
          'tr',
          'role',
          'row'
        ).length;
      };

      expect(countElementsWithAriaRow(getMaster())).toEqual(51);

      expect(countElementsWithAriaRow(getTopClone())).toEqual(3);

      expect(countElementsWithAriaRow(getBottomClone())).toEqual(2);

      expect(countElementsWithAriaRow(getInlineStartClone())).toEqual(51);

      expect(countElementsWithAriaRow(getTopInlineStartClone())).toEqual(3);

      expect(countElementsWithAriaRow(getBottomInlineStartClone())).toEqual(2);
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
});
