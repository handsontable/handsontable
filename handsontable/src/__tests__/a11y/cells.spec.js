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
    it('should add the `role=gridcell` aria tag to every cell in the table', async() => {
      handsontable({
        data: createSpreadsheetData(50, 50),
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
      ' column indexes)', async() => {
      handsontable({
        data: createSpreadsheetData(50, 50),
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
        data: createSpreadsheetData(50, 50),
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

      await scrollViewportTo({
        row: 49,
        col: 49
      });

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

    it('should add the `tabindex=-1` aria tag to every cell in the table', async() => {
      handsontable({
        data: createSpreadsheetData(50, 50),
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
        data: createSpreadsheetData(50, 50),
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

      await scrollViewportTo({
        row: 49,
        col: 49
      });

      expect(countElementsWithAriaReadOnly(getMaster())).toEqual(0);

      await scrollViewportTo({
        row: 49,
        col: 0
      });

      expect(countElementsWithAriaReadOnly(getMaster())).toEqual(countRenderedRows());
    });
  });

  describe('column header association (`aria-describedby`)', () => {
    it('should point a data cell at its column header, and the id should resolve to that header (DEV-29)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: ['ID', 'Name', 'Position', 'Country', 'Score'],
        rowHeaders: true,
      });

      const describedBy = getCell(0, 2).getAttribute('aria-describedby');

      expect(describedBy).toBeTruthy();

      const header = document.getElementById(describedBy);

      expect(header).not.toBe(null);
      expect(header.tagName).toBe('TH');
      expect(header.textContent).toBe('Position');
      // The referenced id is unique in the document - overlay clones must not duplicate it.
      expect(document.querySelectorAll(`[id="${describedBy}"]`).length).toBe(1);
    });

    it('should give every rendered data cell an `aria-describedby` that resolves to exactly one header,' +
      ' across all overlays and scroll positions (DEV-29)', async() => {
      handsontable({
        data: createSpreadsheetData(50, 50),
        colHeaders: true,
        rowHeaders: true,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsStart: 2,
        width: 320,
        height: 320,
      });

      // Every rendered data cell (every overlay) must reference a header, and that id must be unique
      // in the document - one header owns it, whether the column is frozen (inline-start overlay) or
      // scrolling (master).
      const assertInvariant = () => {
        const cells = [...spec().$container.get(0).querySelectorAll('td[role="gridcell"]')];

        expect(cells.length).toBeGreaterThan(0);

        cells.forEach((td) => {
          const ref = td.getAttribute('aria-describedby');

          expect(ref).toBeTruthy();
          expect(document.querySelectorAll(`[id="${ref}"]`).length).toBe(1);
        });
      };

      assertInvariant();

      await scrollViewportTo({ row: 25, col: 30 });
      assertInvariant();

      // Flipping `fixedColumnsStart` moves columns between the master and inline-start overlays on
      // pooled nodes - the id must still resolve to exactly one header afterwards.
      await scrollViewportTo({ row: 0, col: 0 });
      await updateSettings({ fixedColumnsStart: 4 });
      assertInvariant();
    });

    it('should not set `aria-describedby` on cells when the grid has no column headers (DEV-29)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: false,
        rowHeaders: true,
      });

      const described = [...getMaster().get(0).querySelectorAll('tbody td')]
        .filter(td => td.hasAttribute('aria-describedby'));

      expect(described.length).toBe(0);
    });

    it('should not set `aria-describedby` on cells when `ariaTags` is disabled (DEV-29)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        ariaTags: false,
      });

      const described = [...getMaster().get(0).querySelectorAll('tbody td')]
        .filter(td => td.hasAttribute('aria-describedby'));

      expect(described.length).toBe(0);
    });

    it('should keep every cell `aria-describedby` resolving to exactly one header with a colspan on the' +
      ' leaf nested-header row (DEV-29)', async() => {
      // The leaf row is not 1:1 with columns here (`AB` spans two columns). This pins the invariant -
      // exactly one element per id, never a duplicate or a wrong header - so the documented v1 limit
      // (a continuation column's id lands on an empty placeholder header) cannot silently become a
      // duplicate or cross-column reference. See walkontable AGENTS.md.
      handsontable({
        data: createSpreadsheetData(5, 4),
        rowHeaders: true,
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'Group', colspan: 4 }],
          [{ label: 'AB', colspan: 2 }, 'C', 'D'],
        ],
      });

      // Guard against the config silently degrading to plain headers (an overlapping nested config
      // makes NestedHeaders clear its state): the leaf row must actually carry the colspan.
      expect(getMaster().get(0).querySelector('thead tr:last-child th[colspan="2"]')).not.toBe(null);

      const cells = [...spec().$container.get(0).querySelectorAll('td[role="gridcell"]')];

      expect(cells.length).toBeGreaterThan(0);

      cells.forEach((td) => {
        const ref = td.getAttribute('aria-describedby');

        expect(ref).toBeTruthy();
        expect(document.querySelectorAll(`[id="${ref}"]`).length).toBe(1);
      });
    });
  });
});
