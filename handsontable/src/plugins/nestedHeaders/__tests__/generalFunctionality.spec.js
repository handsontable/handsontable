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
    it('should add `htColumnHeaders` to the table when nested headers are defined', async() => {
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

    it('should add as many header levels as the \'colHeaders\' property suggests', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', 'b', 'c', 'd'],
          ['a', 'b', 'c', 'd']
        ]
      });

      expect(tableView()._wt.wtTable.THEAD.querySelectorAll('tr').length).toEqual(2);
    });

    it('should adjust headers widths', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['a', { label: 'b', colspan: 2 }, 'c', 'd'],
          ['a', 'Long column header', 'c', 'd']
        ]
      });

      const headers = tableView()._wt.wtTable.THEAD.querySelectorAll('tr:first-of-type th');

      expect(getColWidth(1)).toBeGreaterThan(50);
      expect(headers[1].offsetWidth).toBeGreaterThan(100);
    });

    it('should correctly render headers when loaded dataset is shorter (less columns) than nested headers settings', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
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

      await loadData(createSpreadsheetData(5, 5));

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

      await loadData(createSpreadsheetData(5, 2));

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

      await loadData(createSpreadsheetData(5, 6));

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

    it('should render headers till the virtual dataset limit ("columns" array defines more columns than dataset)', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
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

    it('should render headers till the virtual dataset limit (only "columns" array is defined)', async() => {
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

    it('should render headers till the virtual dataset limit (limit defined by the "startCols" option)', async() => {
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

    it('should allow creating a more complex nested setup when fixedColumnsStart option is enabled', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
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

      await updateSettings({ fixedColumnsStart: 3 });

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

      await updateSettings({ fixedColumnsStart: 6 });

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

    it('should return a relevant nested header element in getCell()', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(10, 90),
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
      const width = 400;

      handsontable({
        data: createSpreadsheetData(10, 90),
        colHeaders: true,
        nestedHeaders: generateComplexSetup(4, 70, true),
        width,
        height: 300,
      });

      // Capture the initial DOM before scrolling -- the structure is theme-dependent
      // because the number of rendered columns varies with auto-sized column widths.
      const htmlInitial = extractDOMStructure(getTopClone(), getMaster());

      // The initial viewport must start with column A
      expect(htmlInitial).toContain('A1');
      expect(htmlInitial).toContain('A4');

      await scrollViewportTo({
        col: 40,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      // After scrolling to column 40, the viewport must show that region.
      // Column 40 (0-based) is AO in the data (AO4 in row 4 headers).
      const htmlScrolled = extractDOMStructure(getTopClone(), getMaster());

      // The scrolled viewport must contain the target column
      expect(htmlScrolled).toContain('AO');

      // The first data cell should be within the AL-AO range (columns near index 40)
      const firstDataCell = getMaster().find('tbody tr:first td:first').text();

      expect(firstDataCell.charAt(0)).toBe('A');

      // Verify the header hierarchy is intact after scrolling:
      // bottom row headers must each span exactly 1 column
      const bottomRowHeaders = getTopClone().find('thead tr:last th').not('.hiddenHeader');

      bottomRowHeaders.each(function() {
        expect($(this).attr('colspan') || '1').toBe('1');
      });

      // Structure check: no columns are hidden here, so the count of visible
      // bottom-row headers must equal the rendered column count, and each label
      // must match `getColHeader(visualCol, lastHeaderLevel)` for the rendered
      // range (mapped from renderable to visual so the check is robust to any
      // hidden-column setup).
      const renderedCols = countRenderedCols();
      const startRenderable = hot().view._wt.wtTable.getFirstRenderedColumn();
      const lastHeaderLevel = hot().view._wt.wtTable.THEAD.querySelectorAll('tr').length - 1;

      expect(bottomRowHeaders.length).toBe(renderedCols);
      const expectedLabels = [];

      for (let i = 0; i < renderedCols; i++) {
        const visualCol = columnIndexMapper().getVisualFromRenderableIndex(startRenderable + i);

        expectedLabels.push(getColHeader(visualCol, lastHeaderLevel));
      }
      const actualLabels = bottomRowHeaders.toArray().map((th) => {
        const colHeader = th.querySelector('.colHeader');

        return colHeader ? colHeader.innerText : $(th).text();
      });

      expect(actualLabels).toEqual(expectedLabels);

      // Each header row must have at least as many visible headers as the bottom row
      const headerRows = getTopClone().find('thead tr');

      headerRows.each(function() {
        const visibleHeaders = $(this).find('th').not('.hiddenHeader');

        expect(visibleHeaders.length).toBeGreaterThan(0);
      });
    });

    it('should correctly point cell coords for nested corners', async() => {
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
      it('should be fired for all displayed columns on init', async() => {
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

    it('should unregister the hooks from the index mappers after the plugin is enabled and disabled several times', async() => {
      handsontable({
        data: createSpreadsheetData(10, 90),
        colHeaders: true,
        nestedHeaders: generateComplexSetup(4, 70, true),
        width: 400,
        height: 300,
      });

      const rowMapperHooks = columnIndexMapper().__localHooks.cacheUpdated.length;
      const columnMapperHooks = columnIndexMapper().__localHooks.cacheUpdated.length;

      await updateSettings({
        nestedHeaders: false,
      });
      await updateSettings({
        nestedHeaders: generateComplexSetup(4, 70, true),
      });

      await updateSettings({
        nestedHeaders: false,
      });
      await updateSettings({
        nestedHeaders: generateComplexSetup(4, 70, true),
      });

      expect(rowMapperHooks).toBe(rowIndexMapper().__localHooks.cacheUpdated.length);
      expect(columnMapperHooks).toBe(columnIndexMapper().__localHooks.cacheUpdated.length);
    });
  });
});
