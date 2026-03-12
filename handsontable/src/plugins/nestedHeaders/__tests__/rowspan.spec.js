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
  });
});
