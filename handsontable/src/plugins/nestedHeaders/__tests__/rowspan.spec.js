describe('NestedHeaders', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    this.matchersConfig = {
      toMatchHTML: {
        keepAttributes: ['class', 'colspan', 'rowspan']
      }
    };
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('rowspan', () => {
    it('should render headers with rowspan attribute when rowspan is set', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        colHeaders: true,
        rowHeaders: true,
        nestedHeaders: [
          [{ label: 'A1', rowspan: 2 }, { label: 'B1', colspan: 2 }],
          ['', 'C1', 'D1'],
        ],
      });

      const thead = getTopClone().find('thead')[0];
      const firstRowThs = thead.querySelectorAll('tr:first-child th');

      const rowspanTH = Array.from(firstRowThs).find(th => th.getAttribute('rowspan') === '2');

      expect(rowspanTH).toBeDefined();
      expect(rowspanTH.textContent).toContain('A1');
    });

    it('should hide cells covered by rowspan', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        colHeaders: true,
        rowHeaders: true,
        nestedHeaders: [
          [{ label: 'A1', rowspan: 2 }, { label: 'B1', colspan: 2 }],
          ['', 'C1', 'D1'],
        ],
      });

      const thead = getTopClone().find('thead')[0];
      const secondRowThs = thead.querySelectorAll('tr:nth-child(2) th');

      const firstColumnTH = secondRowThs[1];

      expect(firstColumnTH.style.display).toBe('none');
    });

    it('should correctly render a complex header with both rowspan and colspan', async() => {
      handsontable({
        data: createSpreadsheetData(5, 6),
        colHeaders: true,
        rowHeaders: true,
        nestedHeaders: [
          [{ label: 'A1', rowspan: 2 }, { label: 'B1', colspan: 5 }],
          ['', { label: 'C1', colspan: 2 }, { label: 'D1', colspan: 2 }, 'E1'],
          ['F1', 'G1', 'H1', 'I1', 'J1', 'K1'],
        ],
      });

      const thead = getTopClone().find('thead')[0];

      const firstRowThs = thead.querySelectorAll('tr:first-child th');
      const a1Header = firstRowThs[1];

      expect(a1Header.getAttribute('rowspan')).toBe('2');
      expect(a1Header.textContent).toContain('A1');

      const b1Header = firstRowThs[2];

      expect(b1Header.getAttribute('colspan')).toBe('5');
      expect(b1Header.textContent).toContain('B1');

      const secondRowThs = thead.querySelectorAll('tr:nth-child(2) th');

      expect(secondRowThs[1].style.display).toBe('none');

      const c1Header = secondRowThs[2];

      expect(c1Header.getAttribute('colspan')).toBe('2');
      expect(c1Header.textContent).toContain('C1');

      const thirdRowThs = thead.querySelectorAll('tr:nth-child(3) th');

      expect(thirdRowThs[1].textContent).toContain('F1');
      expect(thirdRowThs[2].textContent).toContain('G1');
    });

    it('should handle multiple rowspan headers in different columns', async() => {
      handsontable({
        data: createSpreadsheetData(5, 4),
        colHeaders: true,
        rowHeaders: true,
        nestedHeaders: [
          [{ label: 'A1', rowspan: 2 }, { label: 'B1', colspan: 2 }, { label: 'C1', rowspan: 2 }],
          ['', 'D1', 'E1', ''],
        ],
      });

      const thead = getTopClone().find('thead')[0];
      const firstRowThs = thead.querySelectorAll('tr:first-child th');

      expect(firstRowThs[1].getAttribute('rowspan')).toBe('2');
      expect(firstRowThs[1].textContent).toContain('A1');

      expect(firstRowThs[4].getAttribute('rowspan')).toBe('2');
      expect(firstRowThs[4].textContent).toContain('C1');

      const secondRowThs = thead.querySelectorAll('tr:nth-child(2) th');

      expect(secondRowThs[1].style.display).toBe('none');

      expect(secondRowThs[2].textContent).toContain('D1');
      expect(secondRowThs[3].textContent).toContain('E1');

      expect(secondRowThs[4].style.display).toBe('none');
    });

    it('should render header spanning all rows with rowspan', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        colHeaders: true,
        rowHeaders: true,
        nestedHeaders: [
          [{ label: 'A1', rowspan: 3 }, { label: 'B1', colspan: 2 }],
          ['', 'C1', 'D1'],
          ['', 'E1', 'F1'],
        ],
      });

      const thead = getTopClone().find('thead')[0];
      const firstRowThs = thead.querySelectorAll('tr:first-child th');

      expect(firstRowThs[1].getAttribute('rowspan')).toBe('3');
      expect(firstRowThs[1].textContent).toContain('A1');

      const secondRowThs = thead.querySelectorAll('tr:nth-child(2) th');

      expect(secondRowThs[1].style.display).toBe('none');

      const thirdRowThs = thead.querySelectorAll('tr:nth-child(3) th');

      expect(thirdRowThs[1].style.display).toBe('none');
      expect(thirdRowThs[2].textContent).toContain('E1');
      expect(thirdRowThs[3].textContent).toContain('F1');
    });

    it('should work with updateSettings', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 3),
        colHeaders: true,
        rowHeaders: true,
        nestedHeaders: [
          ['A1', 'B1', 'C1'],
          ['D1', 'E1', 'F1'],
        ],
      });

      hot.updateSettings({
        nestedHeaders: [
          [{ label: 'X1', rowspan: 2 }, 'Y1', 'Z1'],
          ['', 'Y2', 'Z2'],
        ],
      });

      const thead = getTopClone().find('thead')[0];
      const firstRowThs = thead.querySelectorAll('tr:first-child th');

      expect(firstRowThs[1].getAttribute('rowspan')).toBe('2');
      expect(firstRowThs[1].textContent).toContain('X1');

      const secondRowThs = thead.querySelectorAll('tr:nth-child(2) th');

      expect(secondRowThs[1].style.display).toBe('none');
    });

    it('should add the rowspan-scoping class only when rowspan headers exist', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 3),
        colHeaders: true,
        rowHeaders: true,
        nestedHeaders: [
          ['A1', 'B1', 'C1'],
          ['D1', 'E1', 'F1'],
        ],
      });

      expect(hot.rootElement.classList.contains('htHasRowspanHeaders')).toBe(false);

      await updateSettings({
        nestedHeaders: [
          [{ label: 'X1', rowspan: 2 }, 'Y1', 'Z1'],
          ['', 'Y2', 'Z2'],
        ],
      });

      expect(hot.rootElement.classList.contains('htHasRowspanHeaders')).toBe(true);

      await updateSettings({
        nestedHeaders: [
          ['A1', 'B1', 'C1'],
          ['D1', 'E1', 'F1'],
        ],
      });

      expect(hot.rootElement.classList.contains('htHasRowspanHeaders')).toBe(false);
    });

    it('should not set rowspan attribute when rowspan is 1 (default)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        colHeaders: true,
        rowHeaders: true,
        nestedHeaders: [
          ['A1', 'B1', 'C1'],
          ['D1', 'E1', 'F1'],
        ],
      });

      const thead = getTopClone().find('thead')[0];
      const firstRowThs = thead.querySelectorAll('tr:first-child th');

      expect(firstRowThs[1].getAttribute('rowspan')).toBeNull();
    });

    it('should handle combined colspan and rowspan on same cell', async() => {
      handsontable({
        data: createSpreadsheetData(5, 4),
        colHeaders: true,
        rowHeaders: true,
        nestedHeaders: [
          [{ label: 'A1', colspan: 3, rowspan: 2 }, 'B1'],
          ['', '', '', 'C1'],
        ],
      });

      const thead = getTopClone().find('thead')[0];
      const firstRowThs = thead.querySelectorAll('tr:first-child th');

      expect(firstRowThs[1].getAttribute('colspan')).toBe('3');
      expect(firstRowThs[1].getAttribute('rowspan')).toBe('2');
      expect(firstRowThs[1].textContent).toContain('A1');

      const secondRowThs = thead.querySelectorAll('tr:nth-child(2) th');

      expect(secondRowThs[1].style.display).toBe('none');
      expect(secondRowThs[2].style.display).toBe('none');
      expect(secondRowThs[3].style.display).toBe('none');

      expect(secondRowThs[4].textContent).toContain('C1');
    });

    it('should render omitted rowspan placeholders in correct columns and keep consistent borders', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        colHeaders: true,
        rowHeaders: true,
        nestedHeaders: [
          [{ label: 'This is a very long header title', rowspan: 2 }, 'B', 'C'],
          ['B2', 'C2'],
        ],
      });

      expect(getCell(-1, 0).style.display).toBe('none');
      expect(getCell(-1, 1).textContent).toContain('B2');
      expect(getCell(-1, 2).textContent).toContain('C2');

      const headerRows = getTopClone().find('thead tr');
      const firstRowHeight = headerRows[0].getBoundingClientRect().height;
      const secondRowHeight = headerRows[1].getBoundingClientRect().height;

      expect(Math.abs(firstRowHeight - secondRowHeight)).toBeLessThan(1.5);

      const cornerCell = getTopInlineStartClone().find('thead tr:last-child th:first-child')[0];
      const cornerRadius = cornerCell ? parseFloat(getComputedStyle(cornerCell).borderBottomLeftRadius) : NaN;

      expect(cornerRadius).toBe(0);

      const firstRowHeaderCell = getInlineStartClone().find('tbody tr:first-child th:first-child')[0];
      const rowHeaderTopLeftRadius = firstRowHeaderCell ?
        parseFloat(getComputedStyle(firstRowHeaderCell).borderTopLeftRadius) :
        NaN;

      expect(rowHeaderTopLeftRadius).toBe(0);

      const firstRowThs = getTopClone().find('thead tr:first-child th');
      const rowspanHeader = firstRowThs[1];
      const adjacentHeader = firstRowThs[2];

      expect(rowspanHeader).toBeDefined();
      expect(adjacentHeader).toBeDefined();

      const rightBorderWidth = parseFloat(getComputedStyle(rowspanHeader).borderRightWidth);
      const leftBorderWidth = parseFloat(getComputedStyle(adjacentHeader).borderLeftWidth);

      expect(rightBorderWidth + leftBorderWidth).toBeLessThan(1.5);
    });

    it('should navigate to a visible rowspanned header when moving up from the first data row', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          [{ label: 'This is a very long header title', rowspan: 2 }, 'B', 'C'],
          ['B2', 'C2'],
        ],
      });

      await selectCell(0, 0);
      await keyDownUp('arrowup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,0 from: -2,0 to: -2,0']);
    });

    it('should keep the header row context when navigating horizontally through a rowspanned header', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          [{ label: 'This is a very long header title', rowspan: 2 }, 'B', 'C'],
          ['B2', 'C2'],
        ],
      });

      await selectCell(-1, 1);
      await keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,0 from: -2,0 to: -2,0']);

      await keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: -1,1']);

      await selectCell(-2, 1);
      await keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,0 from: -2,0 to: -2,0']);

      await keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -2,1 to: -2,1']);
    });

    it('should keep rowspan header row context when neighbour header uses colspan', async() => {
      handsontable({
        data: createSpreadsheetData(5, 4),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          [{ label: 'RS', rowspan: 2 }, { label: 'BC', colspan: 2 }, 'E'],
          ['', 'B2', 'C2', 'D2'],
        ],
      });

      await selectCell(-2, 0);
      await keyDownUp('arrowright');

      let [{ highlight: bcHighlight }] = getSelectedRange();

      expect(bcHighlight.row).toBe(-2);
      expect(bcHighlight.col).toBeGreaterThanOrEqual(1);
      expect(bcHighlight.col).toBeLessThanOrEqual(2);

      await keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,0 from: -2,0 to: -2,0']);

      await selectCell(-2, bcHighlight.col);
      await keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,3 from: -2,3 to: -2,3']);

      await keyDownUp('arrowleft');

      [{ highlight: bcHighlight }] = getSelectedRange();

      expect(bcHighlight.row).toBe(-2);
      expect(bcHighlight.col).toBeGreaterThanOrEqual(1);
      expect(bcHighlight.col).toBeLessThanOrEqual(2);
    });

    it('should reset rowspan navigation context after updating nested headers settings', async() => {
      const prevOnError = window.onerror;
      const onErrorSpy = jasmine.createSpy('onErrorSpy');

      window.onerror = function() {
        onErrorSpy();

        return true;
      };

      try {
        handsontable({
          data: createSpreadsheetData(5, 3),
          colHeaders: true,
          rowHeaders: true,
          navigableHeaders: true,
          nestedHeaders: [
            [{ label: 'This is a very long header title', rowspan: 2 }, 'B', 'C'],
            ['B2', 'C2'],
          ],
        });

        await selectCell(-1, 1);
        await keyDownUp('arrowleft');

        await updateSettings({
          nestedHeaders: [['A', 'B', 'C']],
        });

        await selectCell(-1, 1);
        await keyDownUp('arrowleft');

        const [{ highlight }] = getSelectedRange();

        expect(highlight.row).toBe(-1);
        expect(onErrorSpy).not.toHaveBeenCalled();
      } finally {
        window.onerror = prevOnError;
      }
    });

    it('should move from middle-level H through I/J to the third-level corner cell when moving right', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        colHeaders: true,
        rowHeaders: true,
        height: 'auto',
        autoWrapRow: true,
        autoWrapCol: true,
        collapsibleColumns: true,
        filters: true,
        columnSorting: true,
        dropdownMenu: true,
        navigableHeaders: true,
        manualColumnMove: true,
        manualRowMove: true,
        manualColumnResize: true,
        manualRowResize: true,
        nestedHeaders: [
          [{ label: 'Header title', colspan: 8 }, { label: 'I/J', rowspan: 2, colspan: 2 }],
          [
            { label: 'This is a very long header title', rowspan: 2 },
            'B',
            'C',
            { label: 'D/E', rowspan: 2, colspan: 2 },
            'F',
            'G',
            'H',
          ],
          ['B2', 'C2', 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
      });

      await selectCell(-2, 7);
      await keyDownUp('arrowright');

      let [{ highlight }] = getSelectedRange();

      expect(getColHeader(8, -3)).toBe('I/J');
      expect(highlight.row).toBe(-2);
      expect(highlight.col).toBe(8);

      await keyDownUp('arrowright');

      [{ highlight }] = getSelectedRange();

      expect(highlight.row).toBe(-1);
      expect(highlight.col).toBe(-1);
    });

    it.skip('should move through all header levels in correct order when wrapping horizontally ' +
      'around rowspans', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        colHeaders: true,
        rowHeaders: true,
        height: 'auto',
        autoWrapRow: true,
        autoWrapCol: true,
        collapsibleColumns: true,
        navigableHeaders: true,
        filters: true,
        columnSorting: true,
        dropdownMenu: true,
        manualColumnMove: true,
        manualRowMove: true,
        manualColumnResize: true,
        manualRowResize: true,
        nestedHeaders: [
          [{ label: 'Header title', colspan: 8 }, { label: 'I/J', rowspan: 2, colspan: 2 }],
          [
            { label: 'This is a very long header title', rowspan: 2 },
            'B',
            'C',
            { label: 'D/E', rowspan: 2, colspan: 2 },
            'F',
            'G',
            'H',
          ],
          ['B2', 'C2', 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
      });

      const readHighlightSemanticState = () => {
        const [{ highlight }] = getSelectedRange();
        const highlightedLabel = highlight.row < 0 && highlight.col >= 0 ?
          getColHeader(highlight.col, highlight.row) :
          '';

        return {
          row: highlight.row,
          label: highlightedLabel || '',
        };
      };
      const assertSemanticHighlight = (expectedRow, expectedLabel) => {
        const {
          row,
          label,
        } = readHighlightSemanticState();

        expect(row).toBe(expectedRow);
        expect(label).toBe(expectedLabel);
      };
      const expectedArrowLeftSequence = [
        { row: -1, label: 'J2' },
        { row: -1, label: 'I2' },
        { row: -1, label: 'H2' },
        { row: -1, label: 'G2' },
        { row: -1, label: 'F2' },
        { row: -2, label: 'D/E' },
        { row: -1, label: 'C2' },
        { row: -1, label: 'B2' },
        { row: -2, label: 'This is a very long header title' },
        { row: -1, label: '' },
        { row: -2, label: 'I/J' },
        { row: -2, label: 'H' },
        { row: -2, label: 'G' },
        { row: -2, label: 'F' },
        { row: -2, label: 'D/E' },
        { row: -2, label: 'C' },
        { row: -2, label: 'B' },
        { row: -2, label: 'This is a very long header title' },
        { row: -2, label: '' },
        { row: -3, label: 'I/J' },
        { row: -3, label: 'Header title' },
        { row: -3, label: '' },
      ];
      const expectedArrowRightSequence = expectedArrowLeftSequence.slice().reverse();

      await selectCell(-1, 9);

      for (let index = 0; index < expectedArrowLeftSequence.length; index++) {
        const {
          row,
          label,
        } = expectedArrowLeftSequence[index];

        assertSemanticHighlight(row, label);

        if (index < expectedArrowLeftSequence.length - 1) {
          await keyDownUp('arrowleft');
        }
      }

      for (let index = 1; index < expectedArrowRightSequence.length; index++) {
        const {
          row,
          label,
        } = expectedArrowRightSequence[index];

        await keyDownUp('arrowright');
        assertSemanticHighlight(row, label);
      }
    });

    it('should not ellipsize rowspanned bottom-most header with dropdown menu and filters enabled', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        colHeaders: true,
        rowHeaders: true,
        dropdownMenu: true,
        filters: true,
        nestedHeaders: [
          [{ label: 'This is a very long header title', rowspan: 2 }, 'B', 'C'],
          ['B2', 'C2'],
        ],
      });

      const headerLabel = getCell(-2, 0).querySelector('.colHeader');
      const headerLabelStyles = getComputedStyle(headerLabel);
      const textWidthProbe = document.createElement('canvas');
      const textWidthContext = textWidthProbe.getContext('2d');

      expect(headerLabel).not.toBeNull();

      textWidthContext.font = `${headerLabelStyles.fontStyle} ${headerLabelStyles.fontWeight} ` +
        `${headerLabelStyles.fontSize} ${headerLabelStyles.fontFamily}`;

      const renderedTextWidth = textWidthContext.measureText(headerLabel.textContent.trim()).width;

      expect(headerLabel.clientWidth).toBeGreaterThan(renderedTextWidth);
    });

    it('should allow sorting and filtering interactions on a rowspanned bottom-most header', async() => {
      handsontable({
        data: [
          ['Tagcat', 'Classic Vest', '11/10/2020'],
          ['Zoomzone', 'Cycling Cap', '03/05/2020'],
          ['Meeveo', 'Full-Finger Gloves', '27/03/2020'],
          ['Buzzdog', 'HL Mountain Frame', '29/08/2020'],
          ['Katz', 'Half-Finger Gloves', '02/10/2020'],
        ],
        colHeaders: true,
        rowHeaders: true,
        columnSorting: true,
        dropdownMenu: true,
        filters: true,
        nestedHeaders: [
          [{ label: 'This is a very long header title', rowspan: 2 }, 'B', 'C'],
          ['B2', 'C2'],
        ],
      });

      const rowspanHeader = getCell(-2, 0);
      const sortingIndicator = rowspanHeader.querySelector('.columnSorting');
      const dropdownButton = rowspanHeader.querySelector('.changeType');

      expect(sortingIndicator).not.toBeNull();
      expect(dropdownButton).not.toBeNull();

      $(sortingIndicator).simulate('mousedown');
      $(sortingIndicator).simulate('mouseup');
      $(sortingIndicator).simulate('click');

      expect(getDataAtCell(0, 0)).toBe('Buzzdog');

      getPlugin('filters').addCondition(0, 'contains', ['z']);
      getPlugin('filters').filter();

      expect(getCell(-2, 0).classList.contains('htFiltersActive')).toBe(true);
    });

    it('should display bottom border for a rowspanned bottom header only after vertical scroll', async() => {
      handsontable({
        data: createSpreadsheetData(50, 3),
        colHeaders: true,
        rowHeaders: true,
        height: 180,
        nestedHeaders: [
          [{ label: 'This is a very long header title', rowspan: 2 }, 'B', 'C'],
          ['B2', 'C2'],
        ],
      });

      const getRowspannedHeader = () => getTopClone().find('thead tr:first-child th:eq(1)')[0];
      const getBottomBorderWidth = () => parseFloat(getComputedStyle(getRowspannedHeader()).borderBottomWidth);

      expect(getBottomBorderWidth()).toBe(0);

      await scrollViewportTo(10, 0);

      expect(getBottomBorderWidth()).toBeGreaterThan(0);
    });

    it('should keep consistent active border color and bottom-align labels for rowspanned headers', async() => {
      handsontable({
        data: [
          ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
          ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
          ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'],
        ],
        colHeaders: true,
        rowHeaders: true,
        height: 'auto',
        autoWrapRow: true,
        autoWrapCol: true,
        collapsibleColumns: true,
        nestedHeaders: [
          [
            { label: 'This is a very long header title', colspan: 8 },
            { label: 'I/J', rowspan: 2, colspan: 2 },
          ],
          [
            { label: 'This is a very long header title', rowspan: 2 },
            'B',
            'C',
            { label: 'D/E', rowspan: 2, colspan: 2 },
            'F',
            'G',
            'H',
          ],
          ['B2', 'C2', 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
        filters: true,
        columnSorting: true,
        dropdownMenu: true,
        navigableHeaders: true,
        manualColumnMove: true,
        manualRowMove: true,
        manualColumnResize: true,
        manualRowResize: true,
      });

      const longRowspanHeaderLabel = getCell(-2, 0).querySelector('.colHeader');
      const deRowspanHeader = getCell(-2, 3);
      const deRowspanHeaderLabel = deRowspanHeader.querySelector('.colHeader');
      const b2HeaderLabel = getCell(-1, 1).querySelector('.colHeader');
      const c2HeaderLabel = getCell(-1, 2).querySelector('.colHeader');

      expect(longRowspanHeaderLabel).not.toBeNull();
      expect(deRowspanHeaderLabel).not.toBeNull();
      expect(b2HeaderLabel).not.toBeNull();
      expect(c2HeaderLabel).not.toBeNull();

      const longBottom = longRowspanHeaderLabel.getBoundingClientRect().bottom;
      const deBottom = deRowspanHeaderLabel.getBoundingClientRect().bottom;
      const b2Bottom = b2HeaderLabel.getBoundingClientRect().bottom;
      const c2Bottom = c2HeaderLabel.getBoundingClientRect().bottom;

      expect(Math.abs(longBottom - b2Bottom)).toBeLessThan(1.5);
      expect(Math.abs(longBottom - c2Bottom)).toBeLessThan(1.5);
      expect(Math.abs(deBottom - b2Bottom)).toBeLessThan(1.5);
      expect(Math.abs(deBottom - c2Bottom)).toBeLessThan(1.5);

      await simulateClick(deRowspanHeader);

      const deStyles = getComputedStyle(deRowspanHeader);

      expect(deRowspanHeader.classList.contains('ht__active_highlight')).toBe(true);
      expect(parseFloat(deStyles.borderLeftWidth)).toBeGreaterThan(0);
      expect(deStyles.borderLeftColor).toBe(deStyles.borderRightColor);
    });

    it('should keep D/E controls in one line and fully visible after collapsing columns', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        colHeaders: true,
        rowHeaders: true,
        height: 'auto',
        autoWrapRow: true,
        autoWrapCol: true,
        collapsibleColumns: true,
        dropdownMenu: true,
        filters: true,
        columnSorting: true,
        navigableHeaders: true,
        manualColumnMove: true,
        manualRowMove: true,
        manualColumnResize: true,
        manualRowResize: true,
        nestedHeaders: [
          [{ label: 'Header title', colspan: 8 }, { label: 'I/J', rowspan: 2, colspan: 2 }],
          [
            { label: 'This is a very long header title', rowspan: 2 },
            'B',
            'C',
            { label: 'D/E', rowspan: 2, colspan: 2 },
            'F',
            'G',
            'H',
          ],
          ['B2', 'C2', 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
      });

      const deRowspanHeader = getCell(-2, 3);
      const getDropdownButton = () => deRowspanHeader.querySelector('.changeType');
      const getCollapseButton = () => deRowspanHeader.querySelector('.collapsibleIndicator, .ht_nestingButton');
      const isButtonVisibleAtEdge = (button) => {
        const { bottom, right } = button.getBoundingClientRect();
        const edgeElement = document.elementFromPoint(right - 2, bottom - 2);

        return edgeElement === button || button.contains(edgeElement);
      };
      const isInSingleLine = (header, label, collapseButton, dropdownButton) => {
        const headerRect = header.getBoundingClientRect();
        const labelRect = label.getBoundingClientRect();
        const collapseRect = collapseButton.getBoundingClientRect();
        const dropdownRect = dropdownButton.getBoundingClientRect();
        const maxControlsTop = Math.max(collapseRect.top, dropdownRect.top);
        const minControlsBottom = Math.min(collapseRect.bottom, dropdownRect.bottom);

        return labelRect.top >= headerRect.top &&
          labelRect.bottom <= headerRect.bottom &&
          maxControlsTop <= minControlsBottom &&
          Math.abs(labelRect.top - collapseRect.top) < 8 &&
          Math.abs(labelRect.top - dropdownRect.top) < 8;
      };
      const getHeaderLabel = () => deRowspanHeader.querySelector('.colHeader');
      let collapseButton = getCollapseButton();
      let dropdownButton = getDropdownButton();
      let headerLabel = getHeaderLabel();

      expect(collapseButton).not.toBeNull();
      expect(dropdownButton).not.toBeNull();
      expect(headerLabel).not.toBeNull();
      expect(getComputedStyle(deRowspanHeader).overflow).toBe('visible');
      expect(isButtonVisibleAtEdge(collapseButton)).toBe(true);
      expect(isButtonVisibleAtEdge(dropdownButton)).toBe(true);
      expect(isInSingleLine(deRowspanHeader, headerLabel, collapseButton, dropdownButton)).toBe(true);

      await simulateClick(collapseButton);

      collapseButton = getCollapseButton();
      dropdownButton = getDropdownButton();
      headerLabel = getHeaderLabel();

      expect(collapseButton).not.toBeNull();
      expect(dropdownButton).not.toBeNull();
      expect(headerLabel).not.toBeNull();
      expect(getComputedStyle(deRowspanHeader).overflow).toBe('visible');
      expect(isButtonVisibleAtEdge(collapseButton)).toBe(true);
      expect(isButtonVisibleAtEdge(dropdownButton)).toBe(true);
      expect(isInSingleLine(deRowspanHeader, headerLabel, collapseButton, dropdownButton)).toBe(true);
    });

    it.skip('should keep header level order when navigating left and right across mixed rowspans', async() => {
      handsontable({
        data: [
          ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
          ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
          ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'],
        ],
        colHeaders: true,
        rowHeaders: true,
        autoWrapRow: true,
        autoWrapCol: true,
        navigableHeaders: true,
        nestedHeaders: [
          [
            { label: 'Header title', colspan: 8 },
            { label: 'I/J', rowspan: 2, colspan: 2 },
          ],
          [
            { label: 'This is a very long header title', rowspan: 2 },
            'B',
            'C',
            { label: 'D/E', rowspan: 2, colspan: 2 },
            'F',
            'G',
            'H',
          ],
          ['B2', 'C2', 'F2', 'G2', 'H2', 'I2', 'J2'],
        ],
      });

      const plugin = getPlugin('nestedHeaders');
      const normalizeHeaderRow = (headerRow, visualColumn) => {
        let normalizedRow = headerRow;

        while (normalizedRow >= -plugin.getLayersCount()) {
          const {
            isRowspanPlaceholder,
          } = plugin.getHeaderSettings(normalizedRow, visualColumn) ?? {};

          if (!isRowspanPlaceholder) {
            return normalizedRow;
          }

          normalizedRow -= 1;
        }

        return headerRow;
      };
      const getSelectionMarker = () => {
        const selection = hot().getSelectedRangeLast();
        const {
          row: highlightRow,
          col: highlightCol,
        } = selection.highlight;

        if (highlightCol < 0) {
          return `corner:${highlightRow}`;
        }

        const normalizedRow = normalizeHeaderRow(highlightRow, highlightCol);
        const headerRootColumn = plugin.getStateManager().findLeftMostColumnIndex(normalizedRow, highlightCol);
        const headerCell = getCell(normalizedRow, headerRootColumn);
        const headerLabel = headerCell?.querySelector('.colHeader')?.textContent?.trim();

        return `${highlightRow}:${headerLabel ?? ''}`;
      };
      const collectMarkers = async(direction, steps) => {
        const markers = [getSelectionMarker()];

        for (let i = 0; i < steps; i++) {
          await keyDownUp(direction);
          markers.push(getSelectionMarker());
        }

        return markers;
      };
      const leftTraversalOrder = [
        '-1:J2',
        '-1:I2',
        '-1:H2',
        '-1:G2',
        '-1:F2',
        '-2:D/E',
        '-1:C2',
        '-1:B2',
        '-2:This is a very long header title',
        'corner:-1',
        '-2:I/J',
        '-2:H',
        '-2:G',
        '-2:F',
        '-2:D/E',
        '-2:C',
        '-2:B',
        '-2:This is a very long header title',
        'corner:-2',
        '-3:I/J',
        '-3:Header title',
        'corner:-3',
      ];
      const rightTraversalOrder = [...leftTraversalOrder].reverse();

      await selectCell(-1, 9);

      const leftMarkers = await collectMarkers('arrowleft', leftTraversalOrder.length - 1);

      expect(leftMarkers).toEqual(leftTraversalOrder);

      const rightMarkers = await collectMarkers('arrowright', rightTraversalOrder.length - 1);

      expect(rightMarkers).toEqual(rightTraversalOrder);
    });
  });
});
