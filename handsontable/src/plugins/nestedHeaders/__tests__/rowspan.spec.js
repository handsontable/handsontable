describe('NestedHeaders', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    // Matchers configuration.
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
    it('should apply the rowspan attribute to a header that spans multiple rows', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'A', rowspan: 2 }, { label: 'B', colspan: 2 }],
          ['C', 'D'],
        ],
      });

      const thead = tableView()._wt.wtTable.THEAD;
      const row0 = thead.querySelectorAll('tr')[0];

      expect(row0.querySelectorAll('th')[0].getAttribute('rowspan')).toBe('2');
      expect(row0.querySelectorAll('th')[0].innerText).toBe('A');
      expect(row0.querySelectorAll('th')[1].getAttribute('colspan')).toBe('2');
    });

    it('should hide cells in rows covered by rowspan with the hiddenHeader CSS class', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'A', rowspan: 2 }, { label: 'B', colspan: 2 }],
          ['C', 'D'],
        ],
      });

      const thead = tableView()._wt.wtTable.THEAD;
      const row1 = thead.querySelectorAll('tr')[1];
      const firstCellInRow1 = row1.querySelectorAll('th')[0];

      expect(firstCellInRow1.classList.contains('hiddenHeader')).toBe(true);
    });

    it('should render the correct number of visible headers when rowspan is used', async() => {
      handsontable({
        data: createSpreadsheetData(5, 4),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'A', rowspan: 2 }, { label: 'B', colspan: 2 }, { label: 'C', rowspan: 2 }],
          ['D', 'E'],
        ],
      });

      const thead = tableView()._wt.wtTable.THEAD;
      const row0 = thead.querySelectorAll('tr')[0];
      const row1 = thead.querySelectorAll('tr')[1];

      const visibleInRow0 = Array.from(row0.querySelectorAll('th'))
        .filter(th => !th.classList.contains('hiddenHeader'));
      const visibleInRow1 = Array.from(row1.querySelectorAll('th'))
        .filter(th => !th.classList.contains('hiddenHeader'));

      // A, B (colspan=2), C — the B colspan-placeholder is not counted (hidden)
      expect(visibleInRow0.length).toBe(3);
      // E and the empty col 2 (A at col 0 and C at col 3 are spanned)
      expect(visibleInRow1.length).toBe(2);
    });

    it('should render the correct DOM structure for a rowspan configuration', async() => {
      handsontable({
        data: createSpreadsheetData(5, 4),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'A', rowspan: 2 }, { label: 'B', colspan: 2 }, { label: 'C', rowspan: 2 }],
          ['D', 'E'],
        ],
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="" rowspan="2">A</th>
            <th class="" colspan="2">B</th>
            <th class="hiddenHeader"></th>
            <th class="" rowspan="2">C</th>
          </tr>
          <tr>
            <th class="hiddenHeader"></th>
            <th class="">E</th>
            <th class=""></th>
            <th class="hiddenHeader"></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
          </tr>
        </tbody>
      `);
    });

    it('should support rowspan spanning all header rows', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'A', rowspan: 3 }, 'B', 'C'],
          ['D', 'E', 'F'],
          ['G', 'H', 'I'],
        ],
      });

      const thead = tableView()._wt.wtTable.THEAD;

      expect(thead.querySelectorAll('tr')[0].querySelectorAll('th')[0].getAttribute('rowspan')).toBe('3');
      expect(thead.querySelectorAll('tr')[1].querySelectorAll('th')[0].classList.contains('hiddenHeader')).toBe(true);
      expect(thead.querySelectorAll('tr')[2].querySelectorAll('th')[0].classList.contains('hiddenHeader')).toBe(true);
    });

    it('should not apply the rowspan attribute when rowspan equals 1', async() => {
      handsontable({
        data: createSpreadsheetData(5, 2),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'A', rowspan: 1 }, 'B'],
          ['C', 'D'],
        ],
      });

      const thead = tableView()._wt.wtTable.THEAD;
      const firstTH = thead.querySelectorAll('tr')[0].querySelectorAll('th')[0];

      expect(firstTH.hasAttribute('rowspan')).toBe(false);
      expect(firstTH.classList.contains('hiddenHeader')).toBe(false);
    });

    it('should remove rowspan attributes when the plugin is disabled', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 3),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'A', rowspan: 2 }, { label: 'B', colspan: 2 }],
          ['C', 'D'],
        ],
      });

      const thead = tableView()._wt.wtTable.THEAD;
      const firstTH = thead.querySelectorAll('tr')[0].querySelectorAll('th')[0];

      expect(firstTH.getAttribute('rowspan')).toBe('2');

      hot.getPlugin('nestedHeaders').disablePlugin();
      hot.render();

      expect(firstTH.hasAttribute('rowspan')).toBe(false);
    });

    it('should support combining rowspan and colspan on the same header', async() => {
      handsontable({
        data: createSpreadsheetData(5, 4),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'AB', rowspan: 2, colspan: 2 }, { label: 'C', rowspan: 2 }, 'D'],
          ['E', 'F', 'G', 'H'],
        ],
      });

      const thead = tableView()._wt.wtTable.THEAD;
      const row0 = thead.querySelectorAll('tr')[0];
      const row1 = thead.querySelectorAll('tr')[1];

      const abHeader = row0.querySelectorAll('th')[0];

      expect(abHeader.getAttribute('rowspan')).toBe('2');
      expect(abHeader.getAttribute('colspan')).toBe('2');

      // Cells at col 0 and col 1 in row 1 are covered by AB's rowspan+colspan
      expect(row1.querySelectorAll('th')[0].classList.contains('hiddenHeader')).toBe(true);
      expect(row1.querySelectorAll('th')[1].classList.contains('hiddenHeader')).toBe(true);
      // Col 2 (C's slot) is also covered by C's rowspan
      expect(row1.querySelectorAll('th')[2].classList.contains('hiddenHeader')).toBe(true);
      // Col 3 (H) is visible
      expect(row1.querySelectorAll('th')[3].classList.contains('hiddenHeader')).toBe(false);
    });

    it('should correctly re-render when settings are updated to include rowspan', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 2 }],
          ['C', 'D', 'E'],
        ],
      });

      await updateSettings({
        nestedHeaders: [
          [{ label: 'A', rowspan: 2 }, { label: 'B', colspan: 2 }],
          ['D', 'E'],
        ],
      });

      const thead = tableView()._wt.wtTable.THEAD;
      const firstTH = thead.querySelectorAll('tr')[0].querySelectorAll('th')[0];
      const hiddenInRow1 = thead.querySelectorAll('tr')[1].querySelectorAll('th')[0];

      expect(firstTH.getAttribute('rowspan')).toBe('2');
      expect(hiddenInRow1.classList.contains('hiddenHeader')).toBe(true);
    });

    it('should correctly re-render when rowspan is removed from settings', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'A', rowspan: 2 }, { label: 'B', colspan: 2 }],
          ['C', 'D'],
        ],
      });

      await updateSettings({
        nestedHeaders: [
          ['A', { label: 'B', colspan: 2 }],
          ['C', 'D', 'E'],
        ],
      });

      const thead = tableView()._wt.wtTable.THEAD;
      const firstTH = thead.querySelectorAll('tr')[0].querySelectorAll('th')[0];
      const firstInRow1 = thead.querySelectorAll('tr')[1].querySelectorAll('th')[0];

      expect(firstTH.hasAttribute('rowspan')).toBe(false);
      expect(firstInRow1.classList.contains('hiddenHeader')).toBe(false);
    });

    it('should return empty string from getColumnHeaderValue for rowspan placeholder cells', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 3),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'A', rowspan: 2 }, { label: 'B', colspan: 2 }],
          ['C', 'D'],
        ],
      });

      const nestedHeaders = hot.getPlugin('nestedHeaders');

      // Row 1, col 0 is a rowspan-placeholder — value should be empty
      expect(nestedHeaders.getColumnHeaderValue(0, 1)).toBe('');
      // Row 1, col 1 has the label 'D' — value should be returned
      expect(nestedHeaders.getColumnHeaderValue(1, 1)).toBe('D');
    });
  });
});
