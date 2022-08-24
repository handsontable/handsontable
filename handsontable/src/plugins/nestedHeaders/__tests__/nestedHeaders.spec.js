describe('NestedHeaders', () => {
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

  describe('basic functionality', () => {
    it('should add as many header levels as the \'colHeaders\' property suggests', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', 'b', 'c', 'd'],
          ['a', 'b', 'c', 'd']
        ]
      });

      expect(hot.view._wt.wtTable.THEAD.querySelectorAll('tr').length).toEqual(2);
    });

    it('should adjust headers widths', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', { label: 'b', colspan: 2 }, 'c', 'd'],
          ['a', 'Long column header', 'c', 'd']
        ]
      });

      const headers = hot.view._wt.wtTable.THEAD.querySelectorAll('tr:first-of-type th');

      expect(hot.getColWidth(1)).toBeGreaterThan(50);
      expect(headers[1].offsetWidth).toBeGreaterThan(100);
    });

    it('should correctly render headers when loaded dataset is shorter (less columns) than nested headers settings', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: generateComplexSetup(4, 100, true),
        width: 400,
        height: 300,
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="8">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="4">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">F2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">J2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="" colspan="2">B3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">D3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">F3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">H3</th>
            <th class="hiddenHeader"></th>
            <th class="">J3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">B4</th>
            <th class="">C4</th>
            <th class="">D4</th>
            <th class="">E4</th>
            <th class="">F4</th>
            <th class="">G4</th>
            <th class="">H4</th>
            <th class="">I4</th>
            <th class="">J4</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
            <td class="">J1</td>
          </tr>
        </tbody>
        `);

      hot.loadData(Handsontable.helper.createSpreadsheetData(5, 5));

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="4">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="4">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="" colspan="2">B3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">D3</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">B4</th>
            <th class="">C4</th>
            <th class="">D4</th>
            <th class="">E4</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
          </tr>
        </tbody>
        `);

      hot.loadData(Handsontable.helper.createSpreadsheetData(5, 2));

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="">B1</th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="">B3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">B4</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
          </tr>
        </tbody>
        `);

      hot.loadData(Handsontable.helper.createSpreadsheetData(5, 6));

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="5">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="" colspan="4">B2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">F2</th>
          </tr>
          <tr>
            <th class="">A3</th>
            <th class="" colspan="2">B3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">D3</th>
            <th class="hiddenHeader"></th>
            <th class="">F3</th>
          </tr>
          <tr>
            <th class="">A4</th>
            <th class="">B4</th>
            <th class="">C4</th>
            <th class="">D4</th>
            <th class="">E4</th>
            <th class="">F4</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
          </tr>
        </tbody>
        `);
    });
  });

  describe('The \'colspan\' property', () => {
    it('should allow creating a more complex nested setup when fixedColumnsStart option is enabled', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        fixedColumnsStart: 2,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1'],
          ['A2', { label: 'B2', colspan: 2 }, { label: 'D2', colspan: 2 }, 'F2', 'G2']
        ],
      });

      {
        const htmlPattern = `
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="">B1</th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="">B2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="">A1</td>
              <td class="">B1</td>
            </tr>
          </tbody>
          `;

        expect(extractDOMStructure(getTopInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
        expect(extractDOMStructure(getInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
      }

      updateSettings({ fixedColumnsStart: 3 });

      {
        const htmlPattern = `
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="2">B1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="2">B2</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="">A1</td>
              <td class="">B1</td>
              <td class="">C1</td>
            </tr>
          </tbody>
          `;

        expect(extractDOMStructure(getTopInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
        expect(extractDOMStructure(getInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
      }

      updateSettings({ fixedColumnsStart: 6 });

      {
        const htmlPattern = `
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="4">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">F1</th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="2">B2</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="2">D2</th>
              <th class="hiddenHeader"></th>
              <th class="">F2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="">A1</td>
              <td class="">B1</td>
              <td class="">C1</td>
              <td class="">D1</td>
              <td class="">E1</td>
              <td class="">F1</td>
            </tr>
          </tbody>
          `;

        expect(extractDOMStructure(getTopInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
        expect(extractDOMStructure(getInlineStartClone(), getInlineStartClone())).toMatchHTML(htmlPattern);
      }
    });

    it('should return a relevant nested header element in hot.getCell()', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 90),
        colHeaders: true,
        nestedHeaders: generateComplexSetup(4, 70, true),
        width: 400,
        height: 300,
        viewportColumnRenderingOffset: 15
      });

      const allTHs = function allTHs(row) {
        const headerRows = hot.view._wt.wtTable.THEAD.querySelectorAll('tr');

        return headerRows[row].querySelectorAll('th');
      };
      const levels = [nonHiddenTHs(hot, 0), nonHiddenTHs(hot, 1), nonHiddenTHs(hot, 2), nonHiddenTHs(hot, 3)];

      expect(levels[0][0]).toEqual(getCell(-4, 0));
      expect(levels[0][1]).toEqual(getCell(-4, 1));
      expect(allTHs(0)[2]).toEqual(getCell(-4, 2));
      expect(allTHs(0)[3]).toEqual(getCell(-4, 3));
      expect(levels[0][2]).toEqual(getCell(-4, 9));
      expect(levels[0][3]).toEqual(getCell(-4, 10));
      expect(levels[0][4]).toEqual(getCell(-4, 18));
      expect(levels[0][5]).toEqual(getCell(-4, 19));

      expect(levels[1][0]).toEqual(getCell(-3, 0));
      expect(levels[1][1]).toEqual(getCell(-3, 1));
      expect(levels[1][2]).toEqual(getCell(-3, 5));
      expect(levels[1][3]).toEqual(getCell(-3, 9));

      expect(levels[2][0]).toEqual(getCell(-2, 0));
      expect(levels[2][1]).toEqual(getCell(-2, 1));
      expect(levels[2][2]).toEqual(getCell(-2, 3));
      expect(levels[2][3]).toEqual(getCell(-2, 5));

      expect(levels[3][0]).toEqual(getCell(-1, 0));
      expect(levels[3][1]).toEqual(getCell(-1, 1));
      expect(levels[3][2]).toEqual(getCell(-1, 2));
      expect(levels[3][3]).toEqual(getCell(-1, 3));
    });
  });

  describe('onCellMouseDown', () => {
    it('should correctly point cell coords for nested corners', () => {
      const afterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');

      handsontable({
        colHeaders: true,
        rowHeaders: true,
        nestedHeaders: [
          [''],
          [''],
          [''],
          [''],
        ],
        afterOnCellMouseDown,
      });

      const corner = getCell(-4, -1);

      $(corner).simulate('mousedown');

      expect(afterOnCellMouseDown).toHaveBeenCalled();
      expect(afterOnCellMouseDown.calls.argsFor(0)[0]).toBeInstanceOf(MouseEvent);
      expect(afterOnCellMouseDown.calls.argsFor(0)[1]).toEqual(jasmine.objectContaining({ row: -4, col: -1 }));
      expect(afterOnCellMouseDown.calls.argsFor(0)[2]).toBe(corner);
    });
  });

  describe('cooperation with drop-down menu element', () => {
    it('should close drop-down menu after click on header which sorts a column', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 11),
        colHeaders: true,
        rowHeaders: true,
        columnSorting: true,
        dropdownMenu: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
        ],
      });

      const $firstHeader = spec().$container.find('.ht_master table.htCore thead th span.columnSorting');

      dropdownMenu(0);

      $firstHeader.simulate('mousedown');
      $firstHeader.simulate('mouseup');
      $firstHeader.simulate('click');

      expect(getPlugin('dropdownMenu').menu.container.style.display).not.toBe('block');
    });
  });
});
