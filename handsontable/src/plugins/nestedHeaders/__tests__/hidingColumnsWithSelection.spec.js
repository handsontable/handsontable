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

  describe('hiding columns', () => {
    describe('with selection', () => {
      it('should highlight column headers for selected cells', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 13),
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

        expect(`
          |   :                   :   :       |
          |   :                   :   :       |
          |   :       :           :   :       |
          |   : - :   : -   - :   :   : -   - |
          |===:===:===:===:===:===:===:===:===|
          |   :   :   :   :   :   :   :   :   |
          |   :   :   :   :   :   :   :   :   |
          |   : 0 :   : 0 :   :   :   : A :   |
        `).toBeMatchToSelectionPattern();

        hidingMap.setValueAtIndex(5, true); // Hide column that contains cells F{n}
        hidingMap.setValueAtIndex(9, true); // Hide column that contains cells J{n}
        hot.render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 2,2 from: 2,2 to: 2,2', // C3
          'highlight: 2,5 from: 2,5 to: 2,5', // F3
          'highlight: 2,11 from: 2,11 to: 2,11', // L3
        ]);
        expect(`
          |   :               :       |
          |   :               :       |
          |   :       :       :       |
          |   : - :   :   :   : -   - |
          |===:===:===:===:===:===:===|
          |   :   :   :   :   :   :   |
          |   :   :   :   :   :   :   |
          |   : 0 :   :   :   : A :   |
        `).toBeMatchToSelectionPattern();

        // Show all columns
        hot.columnIndexMapper.unregisterMap('my-hiding-map');
        hot.render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 2,2 from: 2,2 to: 2,2', // C3
          'highlight: 2,5 from: 2,5 to: 2,5', // F3
          'highlight: 2,11 from: 2,11 to: 2,11', // L3
        ]);
        expect(`
          |   :                               :   :           |
          |   :                               :   :           |
          |   :               :               :   :           |
          |   : -   - :       : -   - :       :   :   : -   - |
          |===:===:===:===:===:===:===:===:===:===:===:===:===|
          |   :   :   :   :   :   :   :   :   :   :   :   :   |
          |   :   :   :   :   :   :   :   :   :   :   :   :   |
          |   :   : 0 :   :   : 0 :   :   :   :   :   : A :   |
        `).toBeMatchToSelectionPattern();
      });

      it('should highlight column headers for selected cells in-between nested headers', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(6, 13),
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

        expect(`
          |   :                   :   :       |
          |   :                   :   :       |
          |   :       :           :   :       |
          | - : - : - : -   - : - : - :       |
          |===:===:===:===:===:===:===:===:===|
          |   :   :   :   :   :   :   :   :   |
          |   :   :   :   :   :   :   :   :   |
          | 0 : 0 :   :   :   :   :   :   :   |
          |   :   :   :   :   :   :   :   :   |
          |   :   : 0 : 0 :   :   :   :   :   |
          |   :   :   :   :   : A : 0 :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('should active highlight column headers correctly', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 13),
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

        keyDown('control/meta');

        simulateClick(getTopClone().find('thead tr:eq(2) th:eq(3)')); // select column F3
        simulateClick(getTopClone().find('thead tr:eq(1) th:eq(7)')); // select column K2

        keyUp('control/meta');

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 0,2 from: -1,1 to: 2,2', // B4
          'highlight: 0,5 from: -2,5 to: 2,8', // F3
          'highlight: 0,11 from: -3,10 to: 2,12', // K2
        ]);
        expect(`
          |   :                   :   : *   * |
          |   :                   :   : *   * |
          |   :       : *   *   * :   : *   * |
          |   : * :   : *   * : * :   : *   * |
          |===:===:===:===:===:===:===:===:===|
          |   : 0 :   : 0 : 0 : 0 :   : A : 0 |
          |   : 0 :   : 0 : 0 : 0 :   : 0 : 0 |
          |   : 0 :   : 0 : 0 : 0 :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();

        hidingMap.setValueAtIndex(5, true); // Hide column that contains cells F{n}
        hidingMap.setValueAtIndex(11, true); // Hide column that contains cells L{n}
        hidingMap.setValueAtIndex(0, true); // Hide column that contains cells A{n}
        hot.render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 0,2 from: -1,1 to: 2,2', // B4
          'highlight: 0,5 from: -2,5 to: 2,8', // F3
          'highlight: 0,12 from: -3,10 to: 2,12', // K2
        ]);
        expect(`
          |               :   : * |
          |               :   : * |
          |       : *   * :   : * |
          | * :   : * : * :   : * |
          |===:===:===:===:===:===|
          | 0 :   : 0 : 0 :   : A |
          | 0 :   : 0 : 0 :   : 0 |
          | 0 :   : 0 : 0 :   : 0 |
        `).toBeMatchToSelectionPattern();

        hot.columnIndexMapper.unregisterMap('my-hiding-map');
        hot.render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 0,2 from: -1,1 to: 2,2', // B4
          'highlight: 0,5 from: -2,5 to: 2,8', // F3
          'highlight: 0,10 from: -3,10 to: 2,12', // K2
        ]);
        expect(`
          |   :                               :   : *   *   * |
          |   :                               :   : *   *   * |
          |   :               : *   *   *   * :   : *   *   * |
          |   : *   * :       : *   * : *   * :   : * : *   * |
          |===:===:===:===:===:===:===:===:===:===:===:===:===|
          |   : 0 : 0 :   :   : 0 : 0 : 0 : 0 :   : A : 0 : 0 |
          |   : 0 : 0 :   :   : 0 : 0 : 0 : 0 :   : 0 : 0 : 0 |
          |   : 0 : 0 :   :   : 0 : 0 : 0 : 0 :   : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      });

      it('should active highlight column headers correctly (navigableHeaders on)', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 13),
          colHeaders: true,
          navigableHeaders: true,
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

        keyDown('control/meta');

        simulateClick(getTopClone().find('thead tr:eq(2) th:eq(3)')); // select column F3
        simulateClick(getTopClone().find('thead tr:eq(1) th:eq(7)')); // select column K2

        keyUp('control/meta');

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: -1,2 from: -1,1 to: 2,2', // B4
          'highlight: -2,5 from: -2,5 to: 2,8', // F3
          'highlight: -3,11 from: -3,10 to: 2,12', // K2
        ]);
        expect(`
          |   :                   :   : *   * |
          |   :                   :   : #   # |
          |   :       : *   *   * :   : *   * |
          |   : * :   : *   * : * :   : *   * |
          |===:===:===:===:===:===:===:===:===|
          |   : 0 :   : 0 : 0 : 0 :   : 0 : 0 |
          |   : 0 :   : 0 : 0 : 0 :   : 0 : 0 |
          |   : 0 :   : 0 : 0 : 0 :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
        window.hidingMap = hidingMap;

        hidingMap.setValueAtIndex(5, true); // Hide column that contains cells F{n}
        hidingMap.setValueAtIndex(11, true); // Hide column that contains cells L{n}
        hidingMap.setValueAtIndex(0, true); // Hide column that contains cells A{n}
        hot.render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: -1,2 from: -1,1 to: 2,2', // B4
          'highlight: -2,5 from: -2,5 to: 2,8', // F3
          'highlight: -3,12 from: -3,10 to: 2,12', // K2
        ]);
        expect(`
          |               :   : * |
          |               :   : # |
          |       : *   * :   : * |
          | * :   : * : * :   : * |
          |===:===:===:===:===:===|
          | 0 :   : 0 : 0 :   : 0 |
          | 0 :   : 0 : 0 :   : 0 |
          | 0 :   : 0 : 0 :   : 0 |
        `).toBeMatchToSelectionPattern();

        hot.columnIndexMapper.unregisterMap('my-hiding-map');
        hot.render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: -1,2 from: -1,1 to: 2,2', // B4
          'highlight: -2,5 from: -2,5 to: 2,8', // F3
          'highlight: -3,12 from: -3,10 to: 2,12', // K2
        ]);
        expect(`
          |   :                               :   : *   *   * |
          |   :                               :   : #   #   # |
          |   :               : *   *   *   * :   : *   *   * |
          |   : *   * :       : *   * : *   * :   : * : *   * |
          |===:===:===:===:===:===:===:===:===:===:===:===:===|
          |   : 0 : 0 :   :   : 0 : 0 : 0 : 0 :   : 0 : 0 : 0 |
          |   : 0 : 0 :   :   : 0 : 0 : 0 : 0 :   : 0 : 0 : 0 |
          |   : 0 : 0 :   :   : 0 : 0 : 0 : 0 :   : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      });

      it('should select every column header under the nested headers, when changing the selection by dragging ' +
         'the cursor from the left to the right', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 13),
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

        expect(`
          | * :                   :   :       |
          | * :                   :   :       |
          | * :       :           :   :       |
          | * :   :   :       :   :   :       |
          |===:===:===:===:===:===:===:===:===|
          | A :   :   :   :   :   :   :   :   |
          | 0 :   :   :   :   :   :   :   :   |
          | 0 :   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getTopClone().find('thead tr:eq(3) th:eq(1)')
          .simulate('mouseover'); // Mouse over column B4

        expect(`
          | * :                   :   :       |
          | * :                   :   :       |
          | * :       :           :   :       |
          | * : * :   :       :   :   :       |
          |===:===:===:===:===:===:===:===:===|
          | A : 0 :   :   :   :   :   :   :   |
          | 0 : 0 :   :   :   :   :   :   :   |
          | 0 : 0 :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getTopClone().find('thead tr:eq(3) th:eq(2)')
          .simulate('mouseover'); // Mouse over column D4

        expect(`
          | * :                   :   :       |
          | * :                   :   :       |
          | * : *   * :           :   :       |
          | * : * : * :       :   :   :       |
          |===:===:===:===:===:===:===:===:===|
          | A : 0 : 0 :   :   :   :   :   :   |
          | 0 : 0 : 0 :   :   :   :   :   :   |
          | 0 : 0 : 0 :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getTopClone().find('thead tr:eq(3) th:eq(3)')
          .simulate('mouseover'); // Mouse over column F4

        expect(`
          | * :                   :   :       |
          | * :                   :   :       |
          | * : *   * :           :   :       |
          | * : * : * : *   * :   :   :       |
          |===:===:===:===:===:===:===:===:===|
          | A : 0 : 0 : 0 : 0 :   :   :   :   |
          | 0 : 0 : 0 : 0 : 0 :   :   :   :   |
          | 0 : 0 : 0 : 0 : 0 :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getTopClone().find('thead tr:eq(3) th:eq(5)')
          .simulate('mouseover'); // Mouse over column H4

        expect(`
          | * : *   *   *   *   * :   :       |
          | * : *   *   *   *   * :   :       |
          | * : *   * : *   *   * :   :       |
          | * : * : * : *   * : * :   :       |
          |===:===:===:===:===:===:===:===:===|
          | A : 0 : 0 : 0 : 0 : 0 :   :   :   |
          | 0 : 0 : 0 : 0 : 0 : 0 :   :   :   |
          | 0 : 0 : 0 : 0 : 0 : 0 :   :   :   |
        `).toBeMatchToSelectionPattern();

        getTopClone().find('thead tr:eq(3) th:eq(6)')
          .simulate('mouseover'); // Mouse over column J4

        expect(`
          | * : *   *   *   *   * : * :       |
          | * : *   *   *   *   * : * :       |
          | * : *   * : *   *   * : * :       |
          | * : * : * : *   * : * : * :       |
          |===:===:===:===:===:===:===:===:===|
          | A : 0 : 0 : 0 : 0 : 0 : 0 :   :   |
          | 0 : 0 : 0 : 0 : 0 : 0 : 0 :   :   |
          | 0 : 0 : 0 : 0 : 0 : 0 : 0 :   :   |
        `).toBeMatchToSelectionPattern();

        getTopClone().find('thead tr:eq(3) th:eq(7)')
          .simulate('mouseover'); // Mouse over column L4

        expect(`
          | * : *   *   *   *   * : * : *   * |
          | * : *   *   *   *   * : * : *   * |
          | * : *   * : *   *   * : * : *   * |
          | * : * : * : *   * : * : * : *   * |
          |===:===:===:===:===:===:===:===:===|
          | A : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
          | 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
          | 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      });

      it('should select every column header under the nested headers, when changing the selection by dragging ' +
         'the cursor from the right to the left', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 13),
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

        expect(`
          |   :                   :   : *   * |
          |   :                   :   : *   * |
          |   :       :           :   : *   * |
          |   :   :   :       :   :   : *   * |
          |===:===:===:===:===:===:===:===:===|
          |   :   :   :   :   :   :   : A : 0 |
          |   :   :   :   :   :   :   : 0 : 0 |
          |   :   :   :   :   :   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();

        getTopClone().find('thead tr:eq(3) th:eq(5)')
          .simulate('mouseover'); // Mouse over column H4

        expect(`
          |   :                   : * : *   * |
          |   :                   : * : *   * |
          |   :       :           : * : *   * |
          |   :   :   :       : * : * : *   * |
          |===:===:===:===:===:===:===:===:===|
          |   :   :   :   :   : 0 : 0 : 0 : A |
          |   :   :   :   :   : 0 : 0 : 0 : 0 |
          |   :   :   :   :   : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();

        getTopClone().find('thead tr:eq(3) th:eq(3)')
          .simulate('mouseover'); // Mouse over column F4

        expect(`
          |   :                   : * : *   * |
          |   :                   : * : *   * |
          |   :       : *   *   * : * : *   * |
          |   :   :   : *   * : * : * : *   * |
          |===:===:===:===:===:===:===:===:===|
          |   :   :   : 0 : 0 : 0 : 0 : 0 : A |
          |   :   :   : 0 : 0 : 0 : 0 : 0 : 0 |
          |   :   :   : 0 : 0 : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();

        getTopClone().find('thead tr:eq(3) th:eq(2)')
          .simulate('mouseover'); // Mouse over column D4

        expect(`
          |   :                   : * : *   * |
          |   :                   : * : *   * |
          |   :       : *   *   * : * : *   * |
          |   :   : * : *   * : * : * : *   * |
          |===:===:===:===:===:===:===:===:===|
          |   :   : 0 : 0 : 0 : 0 : 0 : 0 : A |
          |   :   : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
          |   :   : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();

        getTopClone().find('thead tr:eq(3) th:eq(1)')
          .simulate('mouseover'); // Mouse over column B4

        expect(`
          |   : *   *   *   *   * : * : *   * |
          |   : *   *   *   *   * : * : *   * |
          |   : *   * : *   *   * : * : *   * |
          |   : * : * : *   * : * : * : *   * |
          |===:===:===:===:===:===:===:===:===|
          |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : A |
          |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
          |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();

        getTopClone().find('thead tr:eq(3) th:eq(0)')
          .simulate('mouseover'); // Mouse over column A4

        expect(`
          | * : *   *   *   *   * : * : *   * |
          | * : *   *   *   *   * : * : *   * |
          | * : *   * : *   *   * : * : *   * |
          | * : * : * : *   * : * : * : *   * |
          |===:===:===:===:===:===:===:===:===|
          | 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : A |
          | 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
          | 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      });

      it('should be possible to back to the single column selection, when it was modified by the SHIFT key', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 13),
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

        expect(getSelected()).toEqual([[-1, 5, 2, 12]]);

        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(3)'), 'LMB', {
          shiftKey: true
        }); // Back to column F4

        expect(`
          |   :                   :   :       |
          |   :                   :   :       |
          |   :       :           :   :       |
          |   :   :   : *   * :   :   :       |
          |===:===:===:===:===:===:===:===:===|
          |   :   :   : A : 0 :   :   :   :   |
          |   :   :   : 0 : 0 :   :   :   :   |
          |   :   :   : 0 : 0 :   :   :   :   |
        `).toBeMatchToSelectionPattern();
        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,5 from: -1,5 to: 2,6']);
      });

      it('should select every column header under the nested headers, when changing the selection using the SHIFT key ' +
         '(expanding the column selection from the left to the right)', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 13),
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

        expect(getSelected()).toEqual([[-1, 1, 2, 4]]);
        expect(`
          |   :                   :   :       |
          |   :                   :   :       |
          |   : *   * :           :   :       |
          |   : * : * :       :   :   :       |
          |===:===:===:===:===:===:===:===:===|
          |   : A : 0 :   :   :   :   :   :   |
          |   : 0 : 0 :   :   :   :   :   :   |
          |   : 0 : 0 :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(3)'), 'LMB', {
          shiftKey: true
        }); // select column F4

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,1 to: 2,6']);
        expect(`
          |   :                   :   :       |
          |   :                   :   :       |
          |   : *   * :           :   :       |
          |   : * : * : *   * :   :   :       |
          |===:===:===:===:===:===:===:===:===|
          |   : A : 0 : 0 : 0 :   :   :   :   |
          |   : 0 : 0 : 0 : 0 :   :   :   :   |
          |   : 0 : 0 : 0 : 0 :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(5)'), 'LMB', {
          shiftKey: true
        }); // select column H4

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,1 to: 2,8']);
        expect(`
          |   : *   *   *   *   * :   :       |
          |   : *   *   *   *   * :   :       |
          |   : *   * : *   *   * :   :       |
          |   : * : * : *   * : * :   :       |
          |===:===:===:===:===:===:===:===:===|
          |   : A : 0 : 0 : 0 : 0 :   :   :   |
          |   : 0 : 0 : 0 : 0 : 0 :   :   :   |
          |   : 0 : 0 : 0 : 0 : 0 :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('should select every column header under the nested headers, when changing the selection using the SHIFT key ' +
         '(expanding the column selection from the right to the left)', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 13),
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

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,12 from: -1,12 to: 2,9']);
        expect(`
          |   :                   : * : *   * |
          |   :                   : * : *   * |
          |   :       :           : * : *   * |
          |   :   :   :       :   : * : *   * |
          |===:===:===:===:===:===:===:===:===|
          |   :   :   :   :   :   : 0 : 0 : A |
          |   :   :   :   :   :   : 0 : 0 : 0 |
          |   :   :   :   :   :   : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();

        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(5)'), 'LMB', {
          shiftKey: true
        }); // select column H4

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,12 from: -1,12 to: 2,7']);
        expect(`
          |   :                   : * : *   * |
          |   :                   : * : *   * |
          |   :       :           : * : *   * |
          |   :   :   :       : * : * : *   * |
          |===:===:===:===:===:===:===:===:===|
          |   :   :   :   :   : 0 : 0 : 0 : A |
          |   :   :   :   :   : 0 : 0 : 0 : 0 |
          |   :   :   :   :   : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();

        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(3)'), 'LMB', {
          shiftKey: true
        }); // select column F4

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,12 from: -1,12 to: 2,5']);
        expect(`
          |   :                   : * : *   * |
          |   :                   : * : *   * |
          |   :       : *   *   * : * : *   * |
          |   :   :   : *   * : * : * : *   * |
          |===:===:===:===:===:===:===:===:===|
          |   :   :   : 0 : 0 : 0 : 0 : 0 : A |
          |   :   :   : 0 : 0 : 0 : 0 : 0 : 0 |
          |   :   :   : 0 : 0 : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();

        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(2)'), 'LMB', {
          shiftKey: true
        }); // select column D4

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,12 from: -1,12 to: 2,3']);
        expect(`
          |   :                   : * : *   * |
          |   :                   : * : *   * |
          |   :       : *   *   * : * : *   * |
          |   :   : * : *   * : * : * : *   * |
          |===:===:===:===:===:===:===:===:===|
          |   :   : 0 : 0 : 0 : 0 : 0 : 0 : A |
          |   :   : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
          |   :   : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();

        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(1)'), 'LMB', {
          shiftKey: true
        }); // select column B4

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,12 from: -1,12 to: 2,1']);
        expect(`
          |   : *   *   *   *   * : * : *   * |
          |   : *   *   *   *   * : * : *   * |
          |   : *   * : *   *   * : * : *   * |
          |   : * : * : *   * : * : * : *   * |
          |===:===:===:===:===:===:===:===:===|
          |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : A |
          |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
          |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      });
    });
  });
});
