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

  describe('showing columns', () => {
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

        const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

        hidingMap.setValueAtIndex(2, false); // Show column that contains cells C{n}
        hidingMap.setValueAtIndex(5, false); // Show column that contains cells F{n}
        hot.render();

        selectCells([
          [2, 2, 2, 2], // C3
          [2, 5, 2, 5], // F3
          [2, 11, 2, 11], // L3
        ]);

        expect(`
          |       |
          |       |
          |   :   |
          | - : - |
          |===:===|
          |   :   |
          |   :   |
          | 0 : 0 |
        `).toBeMatchToSelectionPattern();

        hidingMap.setValueAtIndex(6, false); // Show column that contains cells G{n}
        hidingMap.setValueAtIndex(11, false); // Show column that contains cells L{n}
        hot.render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 2,2 from: 2,2 to: 2,2', // C3
          'highlight: 2,5 from: 2,5 to: 2,5', // F3
          'highlight: 2,11 from: 2,11 to: 2,11', // L3
        ]);
        expect(`
          |           :   |
          |           :   |
          |   :       :   |
          | - : -   - : - |
          |===:===:===:===|
          |   :   :   :   |
          |   :   :   :   |
          | 0 : 0 :   : A |
        `).toBeMatchToSelectionPattern();

        hidingMap.setValueAtIndex(0, false); // Show column that contains cells A{n}
        hidingMap.setValueAtIndex(1, false); // Show column that contains cells B{n}
        hidingMap.setValueAtIndex(4, false); // Show column that contains cells E{n}
        hidingMap.setValueAtIndex(7, false); // Show column that contains cells H{n}
        hidingMap.setValueAtIndex(8, false); // Show column that contains cells I{n}
        hidingMap.setValueAtIndex(11, false); // Show column that contains cells L{n}
        hidingMap.setValueAtIndex(12, false); // Show column that contains cells M{n}
        hot.render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 2,2 from: 2,2 to: 2,2', // C3
          'highlight: 2,5 from: 2,5 to: 2,5', // F3
          'highlight: 2,11 from: 2,11 to: 2,11', // L3
        ]);
        expect(`
          |   :                           :       |
          |   :                           :       |
          |   :           :               :       |
          |   : -   - :   : -   - :       : -   - |
          |===:===:===:===:===:===:===:===:===:===|
          |   :   :   :   :   :   :   :   :   :   |
          |   :   :   :   :   :   :   :   :   :   |
          |   :   : 0 :   : 0 :   :   :   : A :   |
        `).toBeMatchToSelectionPattern();

        // Reset map to initial values (all columns hidden)
        hidingMap.setDefaultValues();
        hidingMap.setValueAtIndex(5, false); // Show column that contains cells F{n}
        hot.render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 2,2 from: 2,2 to: 2,2', // C3
          'highlight: 2,5 from: 2,5 to: 2,5', // F3
          'highlight: 2,11 from: 2,11 to: 2,11', // L3
        ]);
        expect(`
          |   |
          |   |
          |   |
          | - |
          |===|
          |   |
          |   |
          | 0 |
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

        const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

        hidingMap.setValueAtIndex(1, false); // Show column that contains cells B{n}
        hidingMap.setValueAtIndex(4, false); // Show column that contains cells E{n}
        hidingMap.setValueAtIndex(8, false); // Show column that contains cells I{n}
        hidingMap.setValueAtIndex(10, false); // Show column that contains cells K{n}
        hot.render();

        simulateClick(getTopClone().find('thead tr:eq(2) th:eq(2)')); // select column F3

        keyDown('control/meta');

        simulateClick(getTopClone().find('thead tr:eq(1) th:eq(3)')); // select column K2
        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(0)')); // select column B4

        keyUp('control/meta');

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 0,8 from: -2,5 to: 2,8', // F3
          'highlight: 0,10 from: -3,10 to: 2,12', // K2
          'highlight: 0,1 from: -1,1 to: 2,2', // B4
        ]);
        expect(`
          |           : * |
          |           : * |
          |       : * : * |
          | * :   : * : * |
          |===:===:===:===|
          | A :   : 0 : 0 |
          | 0 :   : 0 : 0 |
          | 0 :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();

        hidingMap.setValueAtIndex(5, false); // Show column that contains cells F{n}
        hidingMap.setValueAtIndex(11, false); // Show column that contains cells L{n}
        hidingMap.setValueAtIndex(0, false); // Show column that contains cells A{n}
        hot.render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 0,8 from: -2,5 to: 2,8', // F3
          'highlight: 0,10 from: -3,10 to: 2,12', // K2
          'highlight: 0,1 from: -1,1 to: 2,2', // B4
        ]);
        expect(`
          |   :               : *   * |
          |   :               : *   * |
          |   :       : *   * : *   * |
          |   : * :   : * : * : * : * |
          |===:===:===:===:===:===:===|
          |   : A :   : 0 : 0 : 0 : 0 |
          |   : 0 :   : 0 : 0 : 0 : 0 |
          |   : 0 :   : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();

        hidingMap.setValueAtIndex(2, false); // Show column that contains cells C{n}
        hidingMap.setValueAtIndex(6, false); // Show column that contains cells G{n}
        hidingMap.setValueAtIndex(7, false); // Show column that contains cells H{n}
        hidingMap.setValueAtIndex(9, false); // Show column that contains cells J{n}
        hot.render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 0,8 from: -2,5 to: 2,8', // F3
          'highlight: 0,10 from: -3,10 to: 2,12', // K2
          'highlight: 0,1 from: -1,1 to: 2,2', // B4
        ]);
        expect(`
          |   :                           :   : *   * |
          |   :                           :   : *   * |
          |   :           : *   *   *   * :   : *   * |
          |   : *   * :   : *   * : *   * :   : * : * |
          |===:===:===:===:===:===:===:===:===:===:===|
          |   : A : 0 :   : 0 : 0 : 0 : 0 :   : 0 : 0 |
          |   : 0 : 0 :   : 0 : 0 : 0 : 0 :   : 0 : 0 |
          |   : 0 : 0 :   : 0 : 0 : 0 : 0 :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();

        // Reset map to initial values (all columns hidden)
        hidingMap.setDefaultValues();
        hidingMap.setValueAtIndex(5, false); // Show column that contains cells F{n}
        hot.render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 0,8 from: -2,5 to: 2,8', // F3
          'highlight: 0,10 from: -3,10 to: 2,12', // K2
          'highlight: 0,1 from: -1,1 to: 2,2', // B4
        ]);
        expect(`
          | * |
          | * |
          | * |
          | * |
          |===|
          | 0 |
          | 0 |
          | 0 |
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

        const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

        hidingMap.setValueAtIndex(1, false); // Show column that contains cells B{n}
        hidingMap.setValueAtIndex(4, false); // Show column that contains cells E{n}
        hidingMap.setValueAtIndex(8, false); // Show column that contains cells I{n}
        hidingMap.setValueAtIndex(10, false); // Show column that contains cells K{n}
        hot.render();

        simulateClick(getTopClone().find('thead tr:eq(2) th:eq(2)')); // select column F3

        keyDown('control/meta');

        simulateClick(getTopClone().find('thead tr:eq(1) th:eq(3)')); // select column K2
        simulateClick(getTopClone().find('thead tr:eq(3) th:eq(0)')); // select column B4

        keyUp('control/meta');

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: -2,8 from: -2,5 to: 2,8', // F3
          'highlight: -3,10 from: -3,10 to: 2,12', // K2
          'highlight: -1,1 from: -1,1 to: 2,2', // B4
        ]);
        expect(`
          |           : * |
          |           : * |
          |       : * : * |
          | # :   : * : * |
          |===:===:===:===|
          | 0 :   : 0 : 0 |
          | 0 :   : 0 : 0 |
          | 0 :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();

        hidingMap.setValueAtIndex(5, false); // Show column that contains cells F{n}
        hidingMap.setValueAtIndex(11, false); // Show column that contains cells L{n}
        hidingMap.setValueAtIndex(0, false); // Show column that contains cells A{n}
        hot.render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: -2,8 from: -2,5 to: 2,8', // F3
          'highlight: -3,10 from: -3,10 to: 2,12', // K2
          'highlight: -1,1 from: -1,1 to: 2,2', // B4
        ]);
        expect(`
          |   :               : *   * |
          |   :               : *   * |
          |   :       : *   * : *   * |
          |   : # :   : * : * : * : * |
          |===:===:===:===:===:===:===|
          |   : 0 :   : 0 : 0 : 0 : 0 |
          |   : 0 :   : 0 : 0 : 0 : 0 |
          |   : 0 :   : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();

        hidingMap.setValueAtIndex(2, false); // Show column that contains cells C{n}
        hidingMap.setValueAtIndex(6, false); // Show column that contains cells G{n}
        hidingMap.setValueAtIndex(7, false); // Show column that contains cells H{n}
        hidingMap.setValueAtIndex(9, false); // Show column that contains cells J{n}
        hot.render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: -2,8 from: -2,5 to: 2,8', // F3
          'highlight: -3,10 from: -3,10 to: 2,12', // K2
          'highlight: -1,1 from: -1,1 to: 2,2', // B4
        ]);
        expect(`
          |   :                           :   : *   * |
          |   :                           :   : *   * |
          |   :           : *   *   *   * :   : *   * |
          |   : #   # :   : *   * : *   * :   : * : * |
          |===:===:===:===:===:===:===:===:===:===:===|
          |   : 0 : 0 :   : 0 : 0 : 0 : 0 :   : 0 : 0 |
          |   : 0 : 0 :   : 0 : 0 : 0 : 0 :   : 0 : 0 |
          |   : 0 : 0 :   : 0 : 0 : 0 : 0 :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();

        // Reset map to initial values (all columns hidden)
        hidingMap.setDefaultValues();
        hidingMap.setValueAtIndex(5, false); // Show column that contains cells F{n}
        hot.render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: -2,8 from: -2,5 to: 2,8', // F3
          'highlight: -3,10 from: -3,10 to: 2,12', // K2
          'highlight: -1,-1 from: -1,1 to: 2,2', // B4
        ]);
        expect(`
          | * |
          | * |
          | * |
          | * |
          |===|
          | 0 |
          | 0 |
          | 0 |
        `).toBeMatchToSelectionPattern();
      });
    });
  });
});
