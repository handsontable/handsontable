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
  });
});
