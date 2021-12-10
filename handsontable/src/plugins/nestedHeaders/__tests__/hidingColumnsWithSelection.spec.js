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

  describe('hiding columns', () => {
    describe('with selection', () => {
      it('should highlight column headers for selected cells', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 13),
          colHeaders: true,
          nestedHeaders: [
            ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
            ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
            ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
            ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
              { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ],
        });

        const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
        hidingMap.setValueAtIndex(4, true); // Hide column that contains cells E{n}
        hidingMap.setValueAtIndex(8, true); // Hide column that contains cells I{n}
        hidingMap.setValueAtIndex(10, true); // Hide column that contains cells K{n}
        hot.render();

        selectCells([
          [2, 2, 2, 2], // C3
          [2, 5, 2, 5], // F3
          [2, 11, 2, 11], // L3
        ]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J1</th>
              <th class="" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J2</th>
              <th class="" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J3</th>
              <th class="" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="ht__highlight">B4</th>
              <th class="">D4</th>
              <th class="ht__highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="">H4</th>
              <th class="">J4</th>
              <th class="ht__highlight" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        hidingMap.setValueAtIndex(5, true); // Hide column that contains cells F{n}
        hidingMap.setValueAtIndex(9, true); // Hide column that contains cells J{n}
        hot.render();

        expect(getSelected()).toEqual([
          [2, 2, 2, 2], // C3
          [2, 5, 2, 5], // F3
          [2, 11, 2, 11], // L3
        ]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="4">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="4">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="2">F3</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="ht__highlight">B4</th>
              <th class="">D4</th>
              <th class="">F4</th>
              <th class="">H4</th>
              <th class="ht__highlight" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        // Show all columns
        hot.columnIndexMapper.unregisterMap('my-hiding-map');
        hot.render();

        expect(getSelected()).toEqual([
          [2, 2, 2, 2], // C3
          [2, 5, 2, 5], // F3
          [2, 11, 2, 11], // L3
        ]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
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
              <th class="" colspan="3">K1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="8">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J2</th>
              <th class="" colspan="3">K2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="4">B3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="4">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J3</th>
              <th class="" colspan="3">K3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="ht__highlight" colspan="2">B4</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="2">D4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="2">H4</th>
              <th class="hiddenHeader"></th>
              <th class="">J4</th>
              <th class="">K4</th>
              <th class="ht__highlight" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);
      });

      it('should highlight column headers for selected cells in-between nested headers', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 13),
          colHeaders: true,
          nestedHeaders: [
            ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
            ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
            ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
            ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
              { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ],
        });

        const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
        hidingMap.setValueAtIndex(4, true); // Hide column that contains cells E{n}
        hidingMap.setValueAtIndex(8, true); // Hide column that contains cells I{n}
        hidingMap.setValueAtIndex(10, true); // Hide column that contains cells K{n}
        hot.render();

        selectCells([
          [2, 0, 2, 2], // A3 to C3
          [4, 3, 4, 5], // D4 to F4
          [5, 7, 5, 9], // H5 to J5
        ]);

        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J1</th>
              <th class="" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J2</th>
              <th class="" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J3</th>
              <th class="" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__highlight">A4</th>
              <th class="ht__highlight">B4</th>
              <th class="ht__highlight">D4</th>
              <th class="ht__highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight">H4</th>
              <th class="ht__highlight">J4</th>
              <th class="" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);
      });

      it('should active highlight column headers correctly', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 13),
          colHeaders: true,
          nestedHeaders: [
            ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
            ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
            ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
            ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
              { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ],
        });

        const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
        hidingMap.setValueAtIndex(4, true); // Hide column that contains cells E{n}
        hidingMap.setValueAtIndex(8, true); // Hide column that contains cells I{n}
        hidingMap.setValueAtIndex(10, true); // Hide column that contains cells K{n}
        hot.render();

        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(1)')); // select column B4
        keyDown('ctrl');
        simulateClick(getTopClone().find('thead tr:eq(2) th:eq(3)')); // select column F3
        simulateClick(getTopClone().find('thead tr:eq(1) th:eq(7)')); // select column K2
        keyUp('ctrl');

        expect(getSelected()).toEqual([
          [-1, 1, 9, 2], // B4 column
          [-2, 5, 9, 8], // F3 column
          [-3, 10, 9, 12], // K2 column
        ]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J1</th>
              <th class="ht__active_highlight" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J2</th>
              <th class="ht__active_highlight" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J3</th>
              <th class="ht__active_highlight" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="ht__highlight ht__active_highlight">B4</th>
              <th class="">D4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight ht__active_highlight">H4</th>
              <th class="">J4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        hidingMap.setValueAtIndex(5, true); // Hide column that contains cells F{n}
        hidingMap.setValueAtIndex(11, true); // Hide column that contains cells L{n}
        hidingMap.setValueAtIndex(0, true); // Hide column that contains cells A{n}
        hot.render();

        expect(getSelected()).toEqual([
          [-1, 1, 9, 2], // B4 column
          [-2, 5, 9, 8], // F3 column
          [-3, 10, 9, 12], // K2 column
        ]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="" colspan="4">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J1</th>
              <th class="ht__active_highlight">K1</th>
            </tr>
            <tr>
              <th class="" colspan="4">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J2</th>
              <th class="ht__active_highlight">K2</th>
            </tr>
            <tr>
              <th class="" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight" colspan="2">F3</th>
              <th class="hiddenHeader"></th>
              <th class="">J3</th>
              <th class="ht__active_highlight">K3</th>
            </tr>
            <tr>
              <th class="ht__highlight ht__active_highlight">B4</th>
              <th class="">D4</th>
              <th class="ht__highlight ht__active_highlight">F4</th>
              <th class="ht__highlight ht__active_highlight">H4</th>
              <th class="">J4</th>
              <th class="ht__highlight ht__active_highlight">L4</th>
            </tr>
          </thead>
          `);

        hot.columnIndexMapper.unregisterMap('my-hiding-map');
        hot.render();

        expect(getSelected()).toEqual([
          [-1, 1, 9, 2], // B4 column
          [-2, 5, 9, 8], // F3 column
          [-3, 10, 9, 12], // K2 column
        ]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
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
              <th class="ht__active_highlight" colspan="3">K1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="8">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J2</th>
              <th class="ht__active_highlight" colspan="3">K2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="4">B3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight" colspan="4">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J3</th>
              <th class="ht__active_highlight" colspan="3">K3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">B4</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="2">D4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight ht__active_highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight ht__active_highlight" colspan="2">H4</th>
              <th class="hiddenHeader"></th>
              <th class="">J4</th>
              <th class="ht__highlight ht__active_highlight">K4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);
      });

      it('should select every column header under the nested headers, when changing the selection by dragging ' +
         'the cursor from the left to the right', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 13),
          colHeaders: true,
          nestedHeaders: [
            ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
            ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
            ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
            ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
              { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ],
        });

        const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
        hidingMap.setValueAtIndex(4, true); // Hide column that contains cells E{n}
        hidingMap.setValueAtIndex(8, true); // Hide column that contains cells I{n}
        hidingMap.setValueAtIndex(10, true); // Hide column that contains cells K{n}
        hot.render();

        getTopClone().find('thead tr:eq(3) th:eq(0)')
          .simulate('mousedown'); // Select column A4
        getTopClone().find('thead tr:eq(3) th:eq(0)')
          .simulate('mouseover'); // Mouse over column A4

        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="ht__active_highlight">A1</th>
              <th class="" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J1</th>
              <th class="" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__active_highlight">A2</th>
              <th class="" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J2</th>
              <th class="" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__active_highlight">A3</th>
              <th class="" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J3</th>
              <th class="" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__highlight ht__active_highlight">A4</th>
              <th class="">B4</th>
              <th class="">D4</th>
              <th class="" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="">H4</th>
              <th class="">J4</th>
              <th class="" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        getTopClone().find('thead tr:eq(3) th:eq(1)')
          .simulate('mouseover'); // Mouse over column B4

        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="ht__active_highlight">A1</th>
              <th class="" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J1</th>
              <th class="" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__active_highlight">A2</th>
              <th class="" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J2</th>
              <th class="" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__active_highlight">A3</th>
              <th class="" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J3</th>
              <th class="" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__highlight ht__active_highlight">A4</th>
              <th class="ht__highlight ht__active_highlight">B4</th>
              <th class="">D4</th>
              <th class="" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="">H4</th>
              <th class="">J4</th>
              <th class="" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        getTopClone().find('thead tr:eq(3) th:eq(2)')
          .simulate('mouseover'); // Mouse over column D4

        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="ht__active_highlight">A1</th>
              <th class="" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J1</th>
              <th class="" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__active_highlight">A2</th>
              <th class="" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J2</th>
              <th class="" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__active_highlight">A3</th>
              <th class="ht__active_highlight" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J3</th>
              <th class="" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__highlight ht__active_highlight">A4</th>
              <th class="ht__highlight ht__active_highlight">B4</th>
              <th class="ht__highlight ht__active_highlight">D4</th>
              <th class="" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="">H4</th>
              <th class="">J4</th>
              <th class="" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        getTopClone().find('thead tr:eq(3) th:eq(3)')
          .simulate('mouseover'); // Mouse over column F4

        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="ht__active_highlight">A1</th>
              <th class="" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J1</th>
              <th class="" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__active_highlight">A2</th>
              <th class="" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J2</th>
              <th class="" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__active_highlight">A3</th>
              <th class="ht__active_highlight" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J3</th>
              <th class="" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__highlight ht__active_highlight">A4</th>
              <th class="ht__highlight ht__active_highlight">B4</th>
              <th class="ht__highlight ht__active_highlight">D4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="">H4</th>
              <th class="">J4</th>
              <th class="" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        getTopClone().find('thead tr:eq(3) th:eq(5)')
          .simulate('mouseover'); // Mouse over column H4

        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="ht__active_highlight">A1</th>
              <th class="ht__active_highlight" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J1</th>
              <th class="" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__active_highlight">A2</th>
              <th class="ht__active_highlight" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J2</th>
              <th class="" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__active_highlight">A3</th>
              <th class="ht__active_highlight" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J3</th>
              <th class="" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__highlight ht__active_highlight">A4</th>
              <th class="ht__highlight ht__active_highlight">B4</th>
              <th class="ht__highlight ht__active_highlight">D4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight ht__active_highlight">H4</th>
              <th class="">J4</th>
              <th class="" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        getTopClone().find('thead tr:eq(3) th:eq(6)')
          .simulate('mouseover'); // Mouse over column J4

        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="ht__active_highlight">A1</th>
              <th class="ht__active_highlight" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J1</th>
              <th class="" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__active_highlight">A2</th>
              <th class="ht__active_highlight" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J2</th>
              <th class="" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__active_highlight">A3</th>
              <th class="ht__active_highlight" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J3</th>
              <th class="" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__highlight ht__active_highlight">A4</th>
              <th class="ht__highlight ht__active_highlight">B4</th>
              <th class="ht__highlight ht__active_highlight">D4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight ht__active_highlight">H4</th>
              <th class="ht__highlight ht__active_highlight">J4</th>
              <th class="" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        getTopClone().find('thead tr:eq(3) th:eq(7)')
          .simulate('mouseover'); // Mouse over column L4

        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="ht__active_highlight">A1</th>
              <th class="ht__active_highlight" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J1</th>
              <th class="ht__active_highlight" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__active_highlight">A2</th>
              <th class="ht__active_highlight" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J2</th>
              <th class="ht__active_highlight" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__active_highlight">A3</th>
              <th class="ht__active_highlight" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J3</th>
              <th class="ht__active_highlight" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__highlight ht__active_highlight">A4</th>
              <th class="ht__highlight ht__active_highlight">B4</th>
              <th class="ht__highlight ht__active_highlight">D4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight ht__active_highlight">H4</th>
              <th class="ht__highlight ht__active_highlight">J4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);
      });

      it('should select every column header under the nested headers, when changing the selection by dragging ' +
         'the cursor from the right to the left', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 13),
          colHeaders: true,
          nestedHeaders: [
            ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
            ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
            ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
            ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
              { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ],
        });

        const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
        hidingMap.setValueAtIndex(4, true); // Hide column that contains cells E{n}
        hidingMap.setValueAtIndex(8, true); // Hide column that contains cells I{n}
        hidingMap.setValueAtIndex(10, true); // Hide column that contains cells K{n}
        hot.render();

        getTopClone().find('thead tr:eq(3) th:eq(7)')
          .simulate('mousedown'); // Select column L4
        getTopClone().find('thead tr:eq(3) th:eq(7)')
          .simulate('mouseover'); // Mouse over column L4

        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J1</th>
              <th class="ht__active_highlight" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J2</th>
              <th class="ht__active_highlight" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J3</th>
              <th class="ht__active_highlight" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="">B4</th>
              <th class="">D4</th>
              <th class="" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="">H4</th>
              <th class="">J4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        getTopClone().find('thead tr:eq(3) th:eq(5)')
          .simulate('mouseover'); // Mouse over column H4

        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J1</th>
              <th class="ht__active_highlight" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J2</th>
              <th class="ht__active_highlight" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J3</th>
              <th class="ht__active_highlight" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="">B4</th>
              <th class="">D4</th>
              <th class="" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight ht__active_highlight">H4</th>
              <th class="ht__highlight ht__active_highlight">J4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        getTopClone().find('thead tr:eq(3) th:eq(3)')
          .simulate('mouseover'); // Mouse over column F4

        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J1</th>
              <th class="ht__active_highlight" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J2</th>
              <th class="ht__active_highlight" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J3</th>
              <th class="ht__active_highlight" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="">B4</th>
              <th class="">D4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight ht__active_highlight">H4</th>
              <th class="ht__highlight ht__active_highlight">J4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        getTopClone().find('thead tr:eq(3) th:eq(2)')
          .simulate('mouseover'); // Mouse over column D4

        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J1</th>
              <th class="ht__active_highlight" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J2</th>
              <th class="ht__active_highlight" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J3</th>
              <th class="ht__active_highlight" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="">B4</th>
              <th class="ht__highlight ht__active_highlight">D4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight ht__active_highlight">H4</th>
              <th class="ht__highlight ht__active_highlight">J4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        getTopClone().find('thead tr:eq(3) th:eq(1)')
          .simulate('mouseover'); // Mouse over column B4

        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="ht__active_highlight" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J1</th>
              <th class="ht__active_highlight" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="ht__active_highlight" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J2</th>
              <th class="ht__active_highlight" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="ht__active_highlight" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J3</th>
              <th class="ht__active_highlight" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="ht__highlight ht__active_highlight">B4</th>
              <th class="ht__highlight ht__active_highlight">D4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight ht__active_highlight">H4</th>
              <th class="ht__highlight ht__active_highlight">J4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        getTopClone().find('thead tr:eq(3) th:eq(0)')
          .simulate('mouseover'); // Mouse over column A4

        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="ht__active_highlight">A1</th>
              <th class="ht__active_highlight" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J1</th>
              <th class="ht__active_highlight" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__active_highlight">A2</th>
              <th class="ht__active_highlight" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J2</th>
              <th class="ht__active_highlight" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__active_highlight">A3</th>
              <th class="ht__active_highlight" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J3</th>
              <th class="ht__active_highlight" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="ht__highlight ht__active_highlight">A4</th>
              <th class="ht__highlight ht__active_highlight">B4</th>
              <th class="ht__highlight ht__active_highlight">D4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight ht__active_highlight">H4</th>
              <th class="ht__highlight ht__active_highlight">J4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);
      });

      it('should be possible to back to the single column selection, when it was modified by the SHIFT key', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 13),
          colHeaders: true,
          nestedHeaders: [
            ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
            ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
            ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
            ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
              { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ],
        });

        const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
        hidingMap.setValueAtIndex(4, true); // Hide column that contains cells E{n}
        hidingMap.setValueAtIndex(8, true); // Hide column that contains cells I{n}
        hidingMap.setValueAtIndex(10, true); // Hide column that contains cells K{n}
        hot.render();

        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(3)')); // select column F4
        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(7)'), 'LMB', {
          shiftKey: true
        }); // select column L4

        expect(getSelected()).toEqual([[-1, 5, 9, 12]]);

        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(3)'), 'LMB', {
          shiftKey: true
        }); // Back to column F4

        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J1</th>
              <th class="" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J2</th>
              <th class="" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J3</th>
              <th class="" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="">B4</th>
              <th class="">D4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="">H4</th>
              <th class="">J4</th>
              <th class="" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);
        expect(getSelected()).toEqual([[-1, 5, 9, 6]]);
      });

      it('should select every column header under the nested headers, when changing the selection using the SHIFT key ' +
         '(expanding the column selection from the left to the right)', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 13),
          colHeaders: true,
          nestedHeaders: [
            ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
            ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
            ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
            ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
              { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ],
        });

        const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
        hidingMap.setValueAtIndex(4, true); // Hide column that contains cells E{n}
        hidingMap.setValueAtIndex(8, true); // Hide column that contains cells I{n}
        hidingMap.setValueAtIndex(10, true); // Hide column that contains cells K{n}
        hot.render();

        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(1)')); // select column B4
        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(2)'), 'LMB', {
          shiftKey: true
        }); // select column D4

        expect(getSelected()).toEqual([[-1, 1, 9, 4]]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J1</th>
              <th class="" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J2</th>
              <th class="" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="ht__active_highlight" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J3</th>
              <th class="" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="ht__highlight ht__active_highlight">B4</th>
              <th class="ht__highlight ht__active_highlight">D4</th>
              <th class="" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="">H4</th>
              <th class="">J4</th>
              <th class="" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(3)'), 'LMB', {
          shiftKey: true
        }); // select column F4

        expect(getSelected()).toEqual([[-1, 1, 9, 6]]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J1</th>
              <th class="" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J2</th>
              <th class="" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="ht__active_highlight" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J3</th>
              <th class="" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="ht__highlight ht__active_highlight">B4</th>
              <th class="ht__highlight ht__active_highlight">D4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="">H4</th>
              <th class="">J4</th>
              <th class="" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(5)'), 'LMB', {
          shiftKey: true
        }); // select column H4

        expect(getSelected()).toEqual([[-1, 1, 9, 8]]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="ht__active_highlight" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J1</th>
              <th class="" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="ht__active_highlight" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J2</th>
              <th class="" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="ht__active_highlight" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="">J3</th>
              <th class="" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="ht__highlight ht__active_highlight">B4</th>
              <th class="ht__highlight ht__active_highlight">D4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight ht__active_highlight">H4</th>
              <th class="">J4</th>
              <th class="" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);
      });

      it('should select every column header under the nested headers, when changing the selection using the SHIFT key ' +
         '(expanding the column selection from the right to the left)', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 13),
          colHeaders: true,
          nestedHeaders: [
            ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
            ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
            ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
            ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
              { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ],
        });

        const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

        hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
        hidingMap.setValueAtIndex(4, true); // Hide column that contains cells E{n}
        hidingMap.setValueAtIndex(8, true); // Hide column that contains cells I{n}
        hidingMap.setValueAtIndex(10, true); // Hide column that contains cells K{n}
        hot.render();

        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(7)')); // select column L4
        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(6)'), 'LMB', {
          shiftKey: true
        }); // select column J4

        expect(getSelected()).toEqual([[-1, 12, 9, 9]]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J1</th>
              <th class="ht__active_highlight" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J2</th>
              <th class="ht__active_highlight" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J3</th>
              <th class="ht__active_highlight" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="">B4</th>
              <th class="">D4</th>
              <th class="" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="">H4</th>
              <th class="ht__highlight ht__active_highlight">J4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(5)'), 'LMB', {
          shiftKey: true
        }); // select column H4

        expect(getSelected()).toEqual([[-1, 12, 9, 7]]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J1</th>
              <th class="ht__active_highlight" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J2</th>
              <th class="ht__active_highlight" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J3</th>
              <th class="ht__active_highlight" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="">B4</th>
              <th class="">D4</th>
              <th class="" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight ht__active_highlight">H4</th>
              <th class="ht__highlight ht__active_highlight">J4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(3)'), 'LMB', {
          shiftKey: true
        }); // select column F4

        expect(getSelected()).toEqual([[-1, 12, 9, 5]]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J1</th>
              <th class="ht__active_highlight" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J2</th>
              <th class="ht__active_highlight" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J3</th>
              <th class="ht__active_highlight" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="">B4</th>
              <th class="">D4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight ht__active_highlight">H4</th>
              <th class="ht__highlight ht__active_highlight">J4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(2)'), 'LMB', {
          shiftKey: true
        }); // select column D4

        expect(getSelected()).toEqual([[-1, 12, 9, 3]]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J1</th>
              <th class="ht__active_highlight" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J2</th>
              <th class="ht__active_highlight" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J3</th>
              <th class="ht__active_highlight" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="">B4</th>
              <th class="ht__highlight ht__active_highlight">D4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight ht__active_highlight">H4</th>
              <th class="ht__highlight ht__active_highlight">J4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);

        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(1)'), 'LMB', {
          shiftKey: true
        }); // select column B4

        expect(getSelected()).toEqual([[-1, 12, 9, 1]]);
        expect(extractDOMStructure(getTopClone())).toMatchHTML(`
          <thead>
            <tr>
              <th class="">A1</th>
              <th class="ht__active_highlight" colspan="5">B1</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J1</th>
              <th class="ht__active_highlight" colspan="2">K1</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A2</th>
              <th class="ht__active_highlight" colspan="5">B2</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J2</th>
              <th class="ht__active_highlight" colspan="2">K2</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A3</th>
              <th class="ht__active_highlight" colspan="2">B3</th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight" colspan="3">F3</th>
              <th class="hiddenHeader"></th>
              <th class="hiddenHeader"></th>
              <th class="ht__active_highlight">J3</th>
              <th class="ht__active_highlight" colspan="2">K3</th>
              <th class="hiddenHeader"></th>
            </tr>
            <tr>
              <th class="">A4</th>
              <th class="ht__highlight ht__active_highlight">B4</th>
              <th class="ht__highlight ht__active_highlight">D4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">F4</th>
              <th class="hiddenHeader"></th>
              <th class="ht__highlight ht__active_highlight">H4</th>
              <th class="ht__highlight ht__active_highlight">J4</th>
              <th class="ht__highlight ht__active_highlight" colspan="2">L4</th>
              <th class="hiddenHeader"></th>
            </tr>
          </thead>
          `);
      });
    });
  });
});
