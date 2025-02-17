describe('NestedHeaders', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    // Matchers configuration.
    this.matchersConfig = {
      toMatchHTML: {
        keepAttributes: ['class', 'colspan']
      }
    };
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('general functionality', () => {
    it('should add `htColumnHeaders` to the table when nested headers are defined', () => {
      const hot = handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', 'b', 'c', 'd'],
          ['a', 'b', 'c', 'd']
        ]
      });

      expect(hot.rootElement.className).toContain('htColumnHeaders');
    });

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
          <tr class="ht__row_odd">
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
          <tr class="ht__row_odd">
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
          <tr class="ht__row_odd">
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
          <tr class="ht__row_odd">
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

    it('should render headers till the virtual dataset limit ("columns" array defines more columns than dataset)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        // "columns" extends virtually the dataset to 8th columns.
        columns: [{}, {}, {}, {}, {}, {}, {}, {}],
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 3 }, 'E1', 'F1', 'G1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2']
        ],
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="3">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E1</th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class=""></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
            <th class="">C2</th>
            <th class="">D2</th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class=""></th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class=""></td>
            <td class=""></td>
            <td class=""></td>
            <td class=""></td>
            <td class=""></td>
          </tr>
        </tbody>
        `);
    });

    it('should render headers till the virtual dataset limit (only "columns" array is defined)', () => {
      handsontable({
        columns: [{}, {}, {}, {}, {}, {}, {}, {}],
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 3 }, 'E1', 'F1', 'G1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2']
        ],
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="3">B1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">E1</th>
            <th class="">F1</th>
            <th class="">G1</th>
            <th class=""></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
            <th class="">C2</th>
            <th class="">D2</th>
            <th class="">E2</th>
            <th class="">F2</th>
            <th class="">G2</th>
            <th class=""></th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class=""></td>
            <td class=""></td>
            <td class=""></td>
            <td class=""></td>
            <td class=""></td>
            <td class=""></td>
            <td class=""></td>
            <td class=""></td>
          </tr>
        </tbody>
        `);
    });

    it('should render headers till the virtual dataset limit (limit defined by the "startCols" option)', () => {
      handsontable({
        startCols: 3,
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 3 }, 'E1', 'F1', 'G1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2']
        ],
      });

      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A1</th>
            <th class="" colspan="2">B1</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">A2</th>
            <th class="">B2</th>
            <th class="">C2</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class=""></td>
            <td class=""></td>
            <td class=""></td>
          </tr>
        </tbody>
        `);
    });

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
            <tr class="ht__row_odd">
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
            <tr class="ht__row_odd">
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
            <tr class="ht__row_odd">
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

    it('should render the setup properly after the table being scrolled', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 90),
        colHeaders: true,
        nestedHeaders: generateComplexSetup(4, 70, true),
        width: 400,
        height: 300,
      });

      // not scrolled
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
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">A1</td>
            <td class="">B1</td>
            <td class="">C1</td>
            <td class="">D1</td>
            <td class="">E1</td>
            <td class="">F1</td>
            <td class="">G1</td>
            <td class="">H1</td>
            <td class="">I1</td>
          </tr>
        </tbody>
        `);

      scrollViewportTo({
        col: 40,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });
      render();

      // scrolled
      expect(extractDOMStructure(getTopClone(), getMaster())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">AK1</th>
            <th class="" colspan="8">AL1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">AT1</th>
            <th class="" colspan="8">AU1</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">AK2</th>
            <th class="" colspan="4">AL2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">AP2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">AT2</th>
            <th class="" colspan="4">AU2</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">AY2</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">AK3</th>
            <th class="" colspan="2">AL3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AN3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AP3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AR3</th>
            <th class="hiddenHeader"></th>
            <th class="">AT3</th>
            <th class="" colspan="2">AU3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AW3</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">AY3</th>
            <th class="hiddenHeader"></th>
          </tr>
          <tr>
            <th class="">AK4</th>
            <th class="">AL4</th>
            <th class="">AM4</th>
            <th class="">AN4</th>
            <th class="">AO4</th>
            <th class="">AP4</th>
            <th class="">AQ4</th>
            <th class="">AR4</th>
            <th class="">AS4</th>
            <th class="">AT4</th>
            <th class="">AU4</th>
            <th class="">AV4</th>
            <th class="">AW4</th>
            <th class="">AX4</th>
            <th class="">AY4</th>
            <th class="">AZ4</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ht__row_odd">
            <td class="">AK1</td>
            <td class="">AL1</td>
            <td class="">AM1</td>
            <td class="">AN1</td>
            <td class="">AO1</td>
            <td class="">AP1</td>
            <td class="">AQ1</td>
            <td class="">AR1</td>
            <td class="">AS1</td>
            <td class="">AT1</td>
            <td class="">AU1</td>
            <td class="">AV1</td>
            <td class="">AW1</td>
            <td class="">AX1</td>
            <td class="">AY1</td>
            <td class="">AZ1</td>
          </tr>
        </tbody>
        `);
    });

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

    describe('`afterGetColHeader` hook', () => {
      it('should be fired for all displayed columns on init', () => {
        const afterGetColHeader = jasmine.createSpy('afterGetColHeader');

        handsontable({
          startRows: 2,
          startCols: 4,
          colHeaders: true,
          autoRowSize: false,
          autoColumnSize: false,
          nestedHeaders: [
            ['a', { label: 'b', colspan: 3 }],
            ['a', { label: 'b', colspan: 2 }, 'c'],
            ['a', 'Long column header', 'c', 'd']
          ],
          afterGetColHeader,
        });

        expect(afterGetColHeader.calls.count()).toBe(24);

        const calls = afterGetColHeader.calls;

        // initial render
        expect(calls.argsFor(0)).toEqual([0, getCell(-3, 0), 0]);
        expect(calls.argsFor(1)).toEqual([1, getCell(-3, 1), 0]);
        expect(calls.argsFor(2)).toEqual([2, getCell(-3, 2), 0]);
        expect(calls.argsFor(3)).toEqual([3, getCell(-3, 3), 0]);
        expect(calls.argsFor(4)).toEqual([0, getCell(-2, 0), 1]);
        expect(calls.argsFor(5)).toEqual([1, getCell(-2, 1), 1]);
        expect(calls.argsFor(6)).toEqual([2, getCell(-2, 2), 1]);
        expect(calls.argsFor(7)).toEqual([3, getCell(-2, 3), 1]);
        expect(calls.argsFor(8)).toEqual([0, getCell(-1, 0), 2]);
        expect(calls.argsFor(9)).toEqual([1, getCell(-1, 1), 2]);
        expect(calls.argsFor(10)).toEqual([2, getCell(-1, 2), 2]);
        expect(calls.argsFor(11)).toEqual([3, getCell(-1, 3), 2]);

        // the second render triggered by some other module
        expect(calls.argsFor(12)).toEqual([0, getCell(-3, 0), 0]);
        expect(calls.argsFor(13)).toEqual([1, getCell(-3, 1), 0]);
        expect(calls.argsFor(14)).toEqual([2, getCell(-3, 2), 0]);
        expect(calls.argsFor(15)).toEqual([3, getCell(-3, 3), 0]);
        expect(calls.argsFor(16)).toEqual([0, getCell(-2, 0), 1]);
        expect(calls.argsFor(17)).toEqual([1, getCell(-2, 1), 1]);
        expect(calls.argsFor(18)).toEqual([2, getCell(-2, 2), 1]);
        expect(calls.argsFor(19)).toEqual([3, getCell(-2, 3), 1]);
        expect(calls.argsFor(20)).toEqual([0, getCell(-1, 0), 2]);
        expect(calls.argsFor(21)).toEqual([1, getCell(-1, 1), 2]);
        expect(calls.argsFor(22)).toEqual([2, getCell(-1, 2), 2]);
        expect(calls.argsFor(23)).toEqual([3, getCell(-1, 3), 2]);
      });
    });
  });
});
