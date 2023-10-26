describe('Cells-related a11y configuration', () => {
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

      const countElementsWithGridcell = (overlay) => {
        return filterElementsByAttribute(
          overlay.get(0),
          'tbody td',
          'role',
          'gridcell'
        ).length;
      };

      expect(countElementsWithGridcell(getMaster())).toEqual(2500);

      expect(countElementsWithGridcell(getTopClone())).toEqual(100);

      expect(countElementsWithGridcell(getBottomClone())).toEqual(100);

      expect(countElementsWithGridcell(getInlineStartClone())).toEqual(100);

      expect(countElementsWithGridcell(getTopInlineStartClone())).toEqual(4);

      expect(countElementsWithGridcell(getBottomInlineStartClone())).toEqual(4);
    }, 'should add the `role=gridcell` aria tag to every cell in the table');

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
      const verifyGatheredIndexes = (indexes, rowCount, colRange) => {
        expect(indexes.length).toBe(rowCount);

        indexes.forEach((row) => {
          expect(row).toEqual(consecutiveNumbers.slice(...colRange));
        });
      };
      const indexes = [];

      gatherIndexes(getMaster().get(0), indexes);
      verifyGatheredIndexes(indexes, 50, [1, 51]);

      gatherIndexes(getTopClone().get(0), indexes);
      verifyGatheredIndexes(indexes, 2, [1, 51]);

      gatherIndexes(getBottomClone().get(0), indexes);
      verifyGatheredIndexes(indexes, 2, [1, 51]);

      gatherIndexes(getInlineStartClone().get(0), indexes);
      verifyGatheredIndexes(indexes, 50, [1, 3]);

      gatherIndexes(getTopInlineStartClone().get(0), indexes);
      verifyGatheredIndexes(indexes, 2, [1, 3]);

      gatherIndexes(getBottomInlineStartClone().get(0), indexes);
      verifyGatheredIndexes(indexes, 2, [1, 3]);
    });

    it('should have the `aria-colindex` attribute set, taken the headers into account (headers and cells share the' +
      ' column indexes) - WITH VIRTUAL SCROLLING', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(50, 50),
        rowHeaders: true,
        colHeaders: true,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsStart: 2,
        width: 300,
        height: 300,
        viewportRowRenderingOffset: 0,
        viewportColumnRenderingOffset: 0
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
      const verifyGatheredIndexes = (indexes, rowCount, colRange) => {
        expect(indexes.length).toBe(rowCount);

        indexes.forEach((row) => {
          expect(row).toEqual(consecutiveNumbers.slice(...colRange));
        });
      };
      const indexes = [];

      gatherIndexes(getMaster().get(0), indexes);
      verifyGatheredIndexes(indexes, countRenderedRows(), [3, 3 + countRenderedCols()]);

      gatherIndexes(getTopClone().get(0), indexes);
      verifyGatheredIndexes(indexes, 2, [3, 3 + countRenderedCols()]);

      gatherIndexes(getBottomClone().get(0), indexes);
      verifyGatheredIndexes(indexes, 2, [3, 3 + countRenderedCols()]);

      gatherIndexes(getInlineStartClone().get(0), indexes);
      verifyGatheredIndexes(indexes, countRenderedRows(), [1, 3]);

      gatherIndexes(getTopInlineStartClone().get(0), indexes);
      verifyGatheredIndexes(indexes, 2, [1, 3]);

      gatherIndexes(getBottomInlineStartClone().get(0), indexes);
      verifyGatheredIndexes(indexes, 2, [1, 3]);

      scrollViewportTo({
        row: 49,
        col: 49
      });

      await sleep(100);

      gatherIndexes(getMaster().get(0), indexes);
      verifyGatheredIndexes(indexes, countRenderedRows(), [51 - countRenderedCols(), 51]);

      gatherIndexes(getTopClone().get(0), indexes);
      verifyGatheredIndexes(indexes, 2, [51 - countRenderedCols(), 51]);

      gatherIndexes(getBottomClone().get(0), indexes);
      verifyGatheredIndexes(indexes, 2, [51 - countRenderedCols(), 51]);

      gatherIndexes(getInlineStartClone().get(0), indexes);
      verifyGatheredIndexes(indexes, countRenderedRows(), [1, 3]);

      gatherIndexes(getTopInlineStartClone().get(0), indexes);
      verifyGatheredIndexes(indexes, 2, [1, 3]);

      gatherIndexes(getBottomInlineStartClone().get(0), indexes);
      verifyGatheredIndexes(indexes, 2, [1, 3]);
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

      const countElementsWithTabindex = (overlay) => {
        return filterElementsByAttribute(
          overlay.get(0),
          'tbody td',
          'tabindex',
          '-1'
        ).length;
      };

      expect(countElementsWithTabindex(getMaster())).toEqual(2500);

      expect(countElementsWithTabindex(getTopClone())).toEqual(100);

      expect(countElementsWithTabindex(getBottomClone())).toEqual(100);

      expect(countElementsWithTabindex(getInlineStartClone())).toEqual(100);

      expect(countElementsWithTabindex(getTopInlineStartClone())).toEqual(4);

      expect(countElementsWithTabindex(getBottomInlineStartClone())).toEqual(4);
    });

    it('should clear the aria-tags every time a cell is re-rendered', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(50, 50),
        rowHeaders: true,
        colHeaders: true,
        width: 300,
        height: 300,
        columns(index) {
          return {
            readOnly: index === 0
          };
        },
        viewportRowRenderingOffset: 2,
        viewportColumnRenderingOffset: 2
      });

      const countElementsWithAriaReadOnly = (overlay) => {
        return filterElementsByAttribute(
          overlay.get(0),
          'tbody td',
          'aria-readonly',
          'true'
        ).length;
      };

      expect(countElementsWithAriaReadOnly(getMaster())).toEqual(countRenderedRows());

      scrollViewportTo({
        row: 49,
        col: 49
      });

      await sleep(100);

      expect(countElementsWithAriaReadOnly(getMaster())).toEqual(0);

      scrollViewportTo({
        row: 49,
        col: 0
      });

      await sleep(100);

      expect(countElementsWithAriaReadOnly(getMaster())).toEqual(countRenderedRows());
    });
  });
});
