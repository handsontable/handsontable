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

  describe('selection', () => {
    it('should generate class names based on "currentHeaderClassName" and "activeHeaderClassName" settings', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        currentHeaderClassName: 'my-current-header',
        activeHeaderClassName: 'my-active-header',
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      getTopClone().find('thead tr:eq(2) th:eq(1)') // Select columns from O to P
        .simulate('mousedown')
        .simulate('mouseup');

      expect(extractDOMStructure(getTopClone())).toMatchHTML(`
        <thead>
          <tr>
            <th class="">A</th>
            <th class="" colspan="8">B</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">C</th>
          </tr>
          <tr>
            <th class="">D</th>
            <th class="" colspan="4">E</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="4">F</th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="hiddenHeader"></th>
            <th class="">G</th>
          </tr>
          <tr>
            <th class="">H</th>
            <th class="my-active-header" colspan="2">I</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">J</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">K</th>
            <th class="hiddenHeader"></th>
            <th class="" colspan="2">L</th>
            <th class="hiddenHeader"></th>
            <th class="">M</th>
          </tr>
          <tr>
            <th class="">N</th>
            <th class="my-current-header my-active-header">O</th>
            <th class="my-current-header my-active-header">P</th>
            <th class="">Q</th>
            <th class="">R</th>
            <th class="">S</th>
            <th class="">T</th>
            <th class="">U</th>
            <th class="">V</th>
            <th class="">W</th>
          </tr>
        </thead>
        `);
    });

    it('should highlight column header for selected cells', () => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 3 }, 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 2 }, 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
        ],
      });

      selectCells([[0, 1, 0, 1]]); // B1

      expect(`
        |   :               :   :   :   :   :   |
        |   :           :   :   :   :   :   :   |
        |   : - :       :   :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : # :   :   :   :   :   :   :   :   |
        |   :   :   :   :   :   :   :   :   :   |
        |   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectCells([[1, 2, 1, 2]]); // C2

      expect(`
        |   :               :   :   :   :   :   |
        |   :           :   :   :   :   :   :   |
        |   :   : -   - :   :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   :   :   :   |
        |   :   : # :   :   :   :   :   :   :   |
        |   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectCells([[1, 3, 1, 3]]); // D2

      expect(`
        |   :               :   :   :   :   :   |
        |   :           :   :   :   :   :   :   |
        |   :   : -   - :   :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   :   :   :   |
        |   :   :   : # :   :   :   :   :   :   |
        |   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectCells([[1, 4, 1, 6]]); // E2 to G2

      expect(`
        |   :               :   :   :   :   :   |
        |   :           :   :   :   :   :   :   |
        |   :   :       : - : - : - :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   :   :   :   |
        |   :   :   :   : A : 0 : 0 :   :   :   |
        |   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should highlight column header for selected cells in-between nested headers', () => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 3 }, 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 2 }, 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
        ],
      });

      selectCells([[1, 2, 1, 5]]); // C2 to F2

      expect(`
        |   :               :   :   :   :   :   |
        |   :           :   :   :   :   :   :   |
        |   :   : -   - : - : - :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   :   :   :   |
        |   :   : A : 0 : 0 : 0 :   :   :   :   |
        |   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectCells([[1, 3, 1, 6]]); // D2 to G2

      expect(`
        |   :               :   :   :   :   :   |
        |   :           :   :   :   :   :   :   |
        |   :   : -   - : - : - : - :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   :   :   :   |
        |   :   :   : A : 0 : 0 : 0 :   :   :   |
        |   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectCells([[1, 0, 1, 2]]); // A2 to C2

      expect(`
        |   :               :   :   :   :   :   |
        |   :           :   :   :   :   :   :   |
        | - : - : -   - :   :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   :   :   :   |
        | A : 0 : 0 :   :   :   :   :   :   :   |
        |   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should highlight column header for non-contiguous selected cells', () => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 3 }, 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 2 }, 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
        ],
      });

      selectCells([[1, 1, 1, 1], [1, 3, 1, 3], [1, 5, 1, 5]]); // B2, B4, B6

      expect(`
        |   :               :   :   :   :   :   |
        |   :           :   :   :   :   :   :   |
        |   : - : -   - :   : - :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   :   :   :   |
        |   : 0 :   : 0 :   : A :   :   :   :   |
        |   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectCells([[1, 1, 1, 2], [2, 3, 2, 4]]); // B3 to C2, D3 to E3

      expect(`
        |   :               :   :   :   :   :   |
        |   :           :   :   :   :   :   :   |
        |   : - : -   - : - :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   :   :   :   |
        |   : 0 : 0 :   :   :   :   :   :   :   |
        |   :   :   : A : 0 :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should active highlight column header for selected column headers', () => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      $(getCell(-2, 1)) // Header "I"
        .simulate('mousedown')
        .simulate('mouseup');

      expect(`
        |   :                               :   |
        |   :               :               :   |
        |   : *   * :       :       :       :   |
        |   : * : * :   :   :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : A : 0 :   :   :   :   :   :   :   |
        |   : 0 : 0 :   :   :   :   :   :   :   |
        |   : 0 : 0 :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -2,1 to: 2,2']);

      $(getCell(-3, 1)) // Header "E"
        .simulate('mousedown')
        .simulate('mouseup');

      expect(`
        |   :                               :   |
        |   : *   *   *   * :               :   |
        |   : *   * : *   * :       :       :   |
        |   : * : * : * : * :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : A : 0 : 0 : 0 :   :   :   :   :   |
        |   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        |   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -3,1 to: 2,4']);

      $(getCell(-4, 1)) // Header "B"
        .simulate('mousedown')
        .simulate('mouseup');

      expect(`
        |   : *   *   *   *   *   *   *   * :   |
        |   : *   *   *   * : *   *   *   * :   |
        |   : *   * : *   * : *   * : *   * :   |
        |   : * : * : * : * : * : * : * : * :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : A : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -4,1 to: 2,8']);
    });

    it('should active highlight column header for non-contiguous header selection', () => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 3 }, 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 2 }, 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
          ['A4', 'B4', { label: 'C4', colspan: 2 }, 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
        ],
      });

      simulateClick(getCell(-2, 1)); // Header "B3"

      expect(`
        |   :               :   :   :   :   :   |
        |   :           :   :   :   :   :   :   |
        |   : * :       :   :   :   :   :   :   |
        |   : * :       :   :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : A :   :   :   :   :   :   :   :   |
        |   : 0 :   :   :   :   :   :   :   :   |
        |   : 0 :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -2,1 to: 2,1']);

      keyDown('control/meta');

      simulateClick(getCell(-3, 5)); // Header "F2"

      keyUp('control/meta');

      expect(`
        |   :               : * :   :   :   :   |
        |   :           :   : * :   :   :   :   |
        |   : * :       :   : * :   :   :   :   |
        |   : * :       :   : * :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : 0 :   :   :   : A :   :   :   :   |
        |   : 0 :   :   :   : 0 :   :   :   :   |
        |   : 0 :   :   :   : 0 :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,1 from: -2,1 to: 2,1',
        'highlight: 0,5 from: -3,5 to: 2,5',
      ]);

      keyDown('control/meta');

      simulateClick(getCell(-3, 1)); // Header "B2"

      keyUp('control/meta');

      expect(`
        |   :               : * :   :   :   :   |
        |   : *   *   * :   : * :   :   :   :   |
        |   : * : *   * :   : * :   :   :   :   |
        |   : * : *   * :   : * :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : B : 0 : 0 :   : 0 :   :   :   :   |
        |   : 1 : 0 : 0 :   : 0 :   :   :   :   |
        |   : 1 : 0 : 0 :   : 0 :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,1 from: -2,1 to: 2,1',
        'highlight: 0,5 from: -3,5 to: 2,5',
        'highlight: 0,1 from: -3,1 to: 2,3',
      ]);
    });

    it('should select every column header under the nested headers, when changing the selection by dragging the cursor', () => {
      const hot = handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      getTopClone().find('thead tr:eq(2) th:eq(3)')
        .simulate('mousedown');
      getTopClone().find('thead tr:eq(2) th:eq(5)')
        .simulate('mouseover')
        .simulate('mouseup');

      expect(hot.getSelected()).toEqual([[-2, 3, hot.countRows() - 1, 6]]);
      expect(`
        |   :                               :   |
        |   :               :               :   |
        |   :       : *   * : *   * :       :   |
        |   :   :   : * : * : * : * :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   : A : 0 : 0 : 0 :   :   :   |
        |   :   :   : 0 : 0 : 0 : 0 :   :   :   |
        |   :   :   : 0 : 0 : 0 : 0 :   :   :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(2) th:eq(3)')
        .simulate('mousedown');
      getTopClone().find('thead tr:eq(2) th:eq(1)')
        .simulate('mouseover')
        .simulate('mouseup');

      expect(hot.getSelected()).toEqual([[-2, 4, hot.countRows() - 1, 1]]);
      expect(`
        |   :                               :   |
        |   : *   *   *   * :               :   |
        |   : *   * : *   * :       :       :   |
        |   : * : * : * : * :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : 0 : 0 : 0 : A :   :   :   :   :   |
        |   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        |   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(2) th:eq(3)').simulate('mousedown');
      getTopClone().find('thead tr:eq(2) th:eq(1)').simulate('mouseover');
      getTopClone().find('thead tr:eq(2) th:eq(3)').simulate('mouseover');
      getTopClone().find('thead tr:eq(2) th:eq(5)').simulate('mouseover');
      getTopClone().find('thead tr:eq(2) th:eq(5)').simulate('mouseup');

      expect(hot.getSelected()).toEqual([[-2, 3, hot.countRows() - 1, 6]]);
      expect(`
        |   :                               :   |
        |   :               :               :   |
        |   :       : *   * : *   * :       :   |
        |   :   :   : * : * : * : * :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   : A : 0 : 0 : 0 :   :   :   |
        |   :   :   : 0 : 0 : 0 : 0 :   :   :   |
        |   :   :   : 0 : 0 : 0 : 0 :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should not move the focus initial position while expanding the selection up in the tree (all nodes with the same colspan width)', () => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      getTopClone().find('thead tr:eq(2) th:eq(0)') // "H"
        .simulate('mousedown');
      getTopClone().find('thead tr:eq(1) th:eq(0)') // "D"
        .simulate('mouseover')
        .simulate('mouseup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,0 from: -3,0 to: 2,0']);
      expect(`
        | * :                               :   |
        | * :               :               :   |
        | # :       :       :       :       :   |
        | * :   :   :   :   :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        | 0 :   :   :   :   :   :   :   :   :   |
        | 0 :   :   :   :   :   :   :   :   :   |
        | 0 :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(2) th:eq(0)') // "H"
        .simulate('mousedown');
      getTopClone().find('thead tr:eq(3) th:eq(0)') // "N"
        .simulate('mouseover')
        .simulate('mouseup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,0 from: -1,0 to: 2,0']);
      expect(`
        | * :                               :   |
        | * :               :               :   |
        | # :       :       :       :       :   |
        | * :   :   :   :   :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        | 0 :   :   :   :   :   :   :   :   :   |
        | 0 :   :   :   :   :   :   :   :   :   |
        | 0 :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should not move the focus initial position while expanding the selection up in the tree', () => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      getTopClone().find('thead tr:eq(2) th:eq(2)') // "I"
        .simulate('mousedown');
      getTopClone().find('thead tr:eq(1) th:eq(3)') // "E"
        .simulate('mouseover');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,2 from: -3,1 to: 2,4']);
      expect(`
        |   :                               :   |
        |   : *   *   *   * :               :   |
        |   : #   # : *   * :       :       :   |
        |   : * : * : * : * :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        |   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        |   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(0) th:eq(7)') // "B"
        .simulate('mouseover')
        .simulate('mouseup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,2 from: -4,1 to: 2,8']);
      expect(`
        |   : *   *   *   *   *   *   *   * :   |
        |   : *   *   *   * : *   *   *   * :   |
        |   : #   # : *   * : *   * : *   * :   |
        |   : * : * : * : * : * : * : * : * :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(2) th:eq(3)') // "J"
        .simulate('mousedown');
      getTopClone().find('thead tr:eq(1) th:eq(3)') // "E"
        .simulate('mouseover');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,3 from: -3,1 to: 2,4']);
      expect(`
        |   :                               :   |
        |   : *   *   *   * :               :   |
        |   : *   * : #   # :       :       :   |
        |   : * : * : * : * :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        |   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        |   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(0) th:eq(7)') // "B"
        .simulate('mouseover')
        .simulate('mouseup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,3 from: -4,1 to: 2,8']);
      expect(`
        |   : *   *   *   *   *   *   *   * :   |
        |   : *   *   *   * : *   *   *   * :   |
        |   : *   * : #   # : *   * : *   * :   |
        |   : * : * : * : * : * : * : * : * :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(2) th:eq(5)') // "K"
        .simulate('mousedown');
      getTopClone().find('thead tr:eq(1) th:eq(5)') // "F"
        .simulate('mouseover');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,5 from: -3,5 to: 2,8']);
      expect(`
        |   :                               :   |
        |   :               : *   *   *   * :   |
        |   :       :       : #   # : *   * :   |
        |   :   :   :   :   : * : * : * : * :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   : 0 : 0 : 0 : 0 :   |
        |   :   :   :   :   : 0 : 0 : 0 : 0 :   |
        |   :   :   :   :   : 0 : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(0) th:eq(7)') // "B"
        .simulate('mouseover')
        .simulate('mouseup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,5 from: -4,1 to: 2,8']);
      expect(`
        |   : *   *   *   *   *   *   *   * :   |
        |   : *   *   *   * : *   *   *   * :   |
        |   : *   * : *   * : #   # : *   * :   |
        |   : * : * : * : * : * : * : * : * :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(2) th:eq(7)') // "L"
        .simulate('mousedown');
      getTopClone().find('thead tr:eq(1) th:eq(5)') // "F"
        .simulate('mouseover');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,7 from: -3,8 to: 2,5']);
      expect(`
        |   :                               :   |
        |   :               : *   *   *   * :   |
        |   :       :       : *   * : #   # :   |
        |   :   :   :   :   : * : * : * : * :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   : 0 : 0 : 0 : 0 :   |
        |   :   :   :   :   : 0 : 0 : 0 : 0 :   |
        |   :   :   :   :   : 0 : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(0) th:eq(7)') // "B"
        .simulate('mouseover')
        .simulate('mouseup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,7 from: -4,8 to: 2,1']);
      expect(`
        |   : *   *   *   *   *   *   *   * :   |
        |   : *   *   *   * : *   *   *   * :   |
        |   : *   * : *   * : *   * : #   # :   |
        |   : * : * : * : * : * : * : * : * :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should update the focus initial position while changing the selection from right to the left', () => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      getTopClone().find('thead tr:eq(0) th:eq(1)') // "B"
        .simulate('mousedown');
      getTopClone().find('thead tr:eq(1) th:eq(1)') // "E"
        .simulate('mouseover');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,1 from: -3,1 to: 2,4']);
      expect(`
        |   :                               :   |
        |   : #   #   #   # :               :   |
        |   : *   * : *   * :       :       :   |
        |   : * : * : * : * :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        |   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        |   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(2) th:eq(3)') // "J"
        .simulate('mouseover');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,1 from: -2,1 to: 2,4']);
      expect(`
        |   :                               :   |
        |   : #   #   #   # :               :   |
        |   : *   * : *   * :       :       :   |
        |   : * : * : * : * :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        |   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        |   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(3) th:eq(3)') // "Q"
        .simulate('mouseover');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -1,1 to: 2,3']);
      expect(`
        |   :                               :   |
        |   :               :               :   |
        |   : #   # :       :       :       :   |
        |   : * : * : * :   :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : 0 : 0 : 0 :   :   :   :   :   :   |
        |   : 0 : 0 : 0 :   :   :   :   :   :   |
        |   : 0 : 0 : 0 :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(3) th:eq(2)') // "P"
        .simulate('mouseover');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -1,1 to: 2,2']);
      expect(`
        |   :                               :   |
        |   :               :               :   |
        |   : #   # :       :       :       :   |
        |   : * : * :   :   :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : 0 : 0 :   :   :   :   :   :   :   |
        |   : 0 : 0 :   :   :   :   :   :   :   |
        |   : 0 : 0 :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(3) th:eq(1)') // "O"
        .simulate('mouseover');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 2,1']);
      expect(`
        |   :                               :   |
        |   :               :               :   |
        |   :       :       :       :       :   |
        |   : # :   :   :   :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : 0 :   :   :   :   :   :   :   :   |
        |   : 0 :   :   :   :   :   :   :   :   |
        |   : 0 :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(3) th:eq(0)') // "N"
        .simulate('mouseover');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 2,0']);
      expect(`
        | * :                               :   |
        | * :               :               :   |
        | * :       :       :       :       :   |
        | * : # :   :   :   :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        | 0 : 0 :   :   :   :   :   :   :   :   |
        | 0 : 0 :   :   :   :   :   :   :   :   |
        | 0 : 0 :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(3) th:eq(1)') // "O"
        .simulate('mouseover');
      getTopClone().find('thead tr:eq(2) th:eq(1)') // "I"
        .simulate('mouseover');
      getTopClone().find('thead tr:eq(1) th:eq(1)') // "E"
        .simulate('mouseover');
      getTopClone().find('thead tr:eq(0) th:eq(1)') // "B"
        .simulate('mouseover');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -4,1 from: -4,1 to: 2,8']);
      expect(`
        |   : #   #   #   #   #   #   #   # :   |
        |   : *   *   *   * : *   *   *   * :   |
        |   : *   * : *   * : *   * : *   * :   |
        |   : * : * : * : * : * : * : * : * :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should update the focus initial position while changing the selection from left to the right', () => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      getTopClone().find('thead tr:eq(0) th:eq(1)') // "B"
        .simulate('mousedown');
      // select header "A" and back to "B" to trigger the internals that changes the selection to go from left to right
      getTopClone().find('thead tr:eq(0) th:eq(0)') // "A"
        .simulate('mouseover');
      getTopClone().find('thead tr:eq(0) th:eq(1)') // "B"
        .simulate('mouseover');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -4,1 from: -4,8 to: 2,1']);
      expect(`
        |   : #   #   #   #   #   #   #   # :   |
        |   : *   *   *   * : *   *   *   * :   |
        |   : *   * : *   * : *   * : *   * :   |
        |   : * : * : * : * : * : * : * : * :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(1) th:eq(5)') // "F"
        .simulate('mouseover');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,8 from: -3,8 to: 2,5']);
      expect(`
        |   :                               :   |
        |   :               : #   #   #   # :   |
        |   :       :       : *   * : *   * :   |
        |   :   :   :   :   : * : * : * : * :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   : 0 : 0 : 0 : 0 :   |
        |   :   :   :   :   : 0 : 0 : 0 : 0 :   |
        |   :   :   :   :   : 0 : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(2) th:eq(5)') // "K"
        .simulate('mouseover');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,8 from: -2,8 to: 2,5']);
      expect(`
        |   :                               :   |
        |   :               : #   #   #   # :   |
        |   :       :       : *   * : *   * :   |
        |   :   :   :   :   : * : * : * : * :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   : 0 : 0 : 0 : 0 :   |
        |   :   :   :   :   : 0 : 0 : 0 : 0 :   |
        |   :   :   :   :   : 0 : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(3) th:eq(6)') // "T"
        .simulate('mouseover');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,8 from: -1,8 to: 2,6']);
      expect(`
        |   :                               :   |
        |   :               :               :   |
        |   :       :       :       : #   # :   |
        |   :   :   :   :   :   : * : * : * :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   : 0 : 0 : 0 :   |
        |   :   :   :   :   :   : 0 : 0 : 0 :   |
        |   :   :   :   :   :   : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(3) th:eq(7)') // "U"
        .simulate('mouseover');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,8 from: -1,8 to: 2,7']);
      expect(`
        |   :                               :   |
        |   :               :               :   |
        |   :       :       :       : #   # :   |
        |   :   :   :   :   :   :   : * : * :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   : 0 : 0 :   |
        |   :   :   :   :   :   :   : 0 : 0 :   |
        |   :   :   :   :   :   :   : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(3) th:eq(8)') // "V"
        .simulate('mouseover');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,8 from: -1,8 to: 2,8']);
      expect(`
        |   :                               :   |
        |   :               :               :   |
        |   :       :       :       :       :   |
        |   :   :   :   :   :   :   :   : # :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   :   : 0 :   |
        |   :   :   :   :   :   :   :   : 0 :   |
        |   :   :   :   :   :   :   :   : 0 :   |
      `).toBeMatchToSelectionPattern();

      getTopClone().find('thead tr:eq(3) th:eq(9)') // "W"
        .simulate('mouseover');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,8 from: -1,8 to: 2,9']);
      expect(`
        |   :                               : * |
        |   :               :               : * |
        |   :       :       :       :       : * |
        |   :   :   :   :   :   :   :   : # : * |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   :   : 0 : 0 |
        |   :   :   :   :   :   :   :   : 0 : 0 |
        |   :   :   :   :   :   :   :   : 0 : 0 |
      `).toBeMatchToSelectionPattern();

      // back to the initial selection
      getTopClone().find('thead tr:eq(3) th:eq(8)') // "V"
        .simulate('mouseover');
      getTopClone().find('thead tr:eq(2) th:eq(8)') // "L"
        .simulate('mouseover');
      getTopClone().find('thead tr:eq(1) th:eq(8)') // "F"
        .simulate('mouseover');
      getTopClone().find('thead tr:eq(0) th:eq(8)') // "B"
        .simulate('mouseover');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -4,1 from: -4,1 to: 2,8']);
      expect(`
        |   : #   #   #   #   #   #   #   # :   |
        |   : *   *   *   * : *   *   *   * :   |
        |   : *   * : *   * : *   * : *   * :   |
        |   : * : * : * : * : * : * : * : * :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select all column headers (on all levels) after clicking the corner header', function() {
      handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        rowHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      const $cornerHeader = this.$container
        .find('.ht_clone_top_inline_start_corner thead tr:eq(0) th:eq(0)');

      $cornerHeader.simulate('mousedown');
      $cornerHeader.simulate('mouseup');

      expect(`
        |   ║   :                               :   |
        |   ║   :               :               :   |
        |   ║   :       :       :       :       :   |
        |   ║ - : - : - : - : - : - : - : - : - : - |
        |===:===:===:===:===:===:===:===:===:===:===|
        | - ║ A : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should add selection borders in the expected positions, when selecting multi-columned headers', function() {
      handsontable({
        data: createSpreadsheetData(4, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ]
      });

      getTopClone().find('thead tr:eq(2) th:eq(1)')
        .simulate('mousedown')
        .simulate('mouseup');

      const $headerLvl3 = getTopClone().find('thead tr:eq(2) th:eq(1)');
      const $firstRow = this.$container.find('.ht_master tbody tr:eq(0)');
      const $lastRow = this.$container.find('.ht_master tbody tr:eq(3)');
      const $tbody = this.$container.find('.ht_master tbody');

      const $topBorder = this.$container.find('.wtBorder.area').eq(0);
      const $bottomBorder = this.$container.find('.wtBorder.area').eq(2);
      const $leftBorder = this.$container.find('.wtBorder.area').eq(1);
      const $rightBorder = this.$container.find('.wtBorder.area').eq(3);

      expect($topBorder.offset().top).toEqual($firstRow.offset().top);
      expect($bottomBorder.offset().top).toEqual($lastRow.offset().top + $lastRow.height() - 1);
      expect($topBorder.width()).toEqual($headerLvl3.width() + 1);
      expect($bottomBorder.width()).toEqual($headerLvl3.width() + 1);

      expect($leftBorder.offset().left).toEqual($headerLvl3.offset().left - 1);
      expect($rightBorder.offset().left).toEqual($headerLvl3.offset().left + $headerLvl3.width());
      expect($leftBorder.height()).toEqual($tbody.height() - 1);
      expect($rightBorder.height()).toEqual($tbody.height());
    });

    it('should not change the header selection when the header within selection range is clicked using RMB', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
        ]
      });

      // Select headers "I" to "K"
      $(getCell(-1, 1))
        .simulate('mousedown');
      $(getCell(-1, 5))
        .simulate('mouseover')
        .simulate('mouseup');

      simulateClick(getCell(-1, 5), 'RMB'); // Header "K"

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 9,6']);
    });

    it('should be possible to select the column header with RMB when no column is selected', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
        ]
      });

      simulateClick(getCell(-1, 5), 'RMB'); // Header "K"

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,5 from: -1,5 to: 9,6']);
    });

    it('should scroll the viewport to the left edge of the clicked nested header when its right index extends beyond ' +
       'the table\'s viewport and is wider than table width', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 200,
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
        ]
      });

      simulateClick(getCell(-3, 2), 'LMB'); // Header "B"

      expect(inlineStartOverlay().getScrollPosition()).toBe(50);
    });

    it('should scroll the viewport to the right edge of the clicked nested header when its left index extends beyond ' +
       'the table\'s viewport and is wider than table width', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 200,
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
        ]
      });

      scrollViewportTo(0, 9);

      await sleep(20);

      simulateClick(getCell(-3, 7), 'LMB'); // Header "B"

      expect(inlineStartOverlay().getScrollPosition()).toBe(265);
    });

    it('should scroll the viewport to the right edge of the clicked nested header when its right index extends beyond ' +
        'the table\'s viewport and is narrower than the table width', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 200,
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
        ]
      });

      simulateClick(getCell(-1, 3), 'LMB'); // Header "J"

      expect(inlineStartOverlay().getScrollPosition()).toBe(65);
    });

    it('should scroll the viewport to the left edge of the clicked nested header when its left index extends beyond ' +
        'the table\'s viewport and is narrower than the table width', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 200,
        colHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
        ]
      });

      scrollViewportTo(0, 9);

      await sleep(20);

      simulateClick(getCell(-1, 6), 'LMB'); // Header "K"

      expect(inlineStartOverlay().getScrollPosition()).toBe(250);
    });

    it('should scroll the viewport to the left edge of the clicked nested header when its right index extends beyond ' +
       'the table\'s viewport and is wider than table width (navigableHeaders: true)', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 200,
        colHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
        ]
      });

      simulateClick(getCell(-3, 2), 'LMB'); // Header "B"

      expect(inlineStartOverlay().getScrollPosition()).toBe(50);
    });

    it('should scroll the viewport to the right edge of the clicked nested header when its left index extends beyond ' +
       'the table\'s viewport and is wider than table width (navigableHeaders: true)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 200,
        colHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
        ]
      });

      scrollViewportTo(0, 9);

      await sleep(20);

      simulateClick(getCell(-3, 7), 'LMB'); // Header "B"

      expect(inlineStartOverlay().getScrollPosition()).toBe(265);
    });

    it('should scroll the viewport to the right edge of the clicked nested header when its right index extends beyond ' +
        'the table\'s viewport and is narrower than the table width (navigableHeaders: true)', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 200,
        colHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
        ]
      });

      simulateClick(getCell(-1, 3), 'LMB'); // Header "J"

      expect(inlineStartOverlay().getScrollPosition()).toBe(65);
    });

    it('should scroll the viewport to the left edge of the clicked nested header when its left index extends beyond ' +
        'the table\'s viewport and is narrower than the table width (navigableHeaders: true)', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        width: 200,
        height: 200,
        colHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 },
            { label: 'L', colspan: 2 }, 'M'],
        ]
      });

      scrollViewportTo(0, 9);

      await sleep(20);

      simulateClick(getCell(-1, 6), 'LMB'); // Header "K"

      expect(inlineStartOverlay().getScrollPosition()).toBe(250);
    });

    it('should be possible to back to the single column selection, when it was modified by the SHIFT key', () => {
      handsontable({
        data: createSpreadsheetData(3, 13),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
          ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
          ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
          ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
            { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
        ],
      });

      simulateClick(getTopClone().find('thead tr:eq(3) th:eq(1)')); // select column B4
      simulateClick(getTopClone().find('thead tr:eq(3) th:eq(11)'), 'LMB', {
        shiftKey: true
      }); // select column L4

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 2,12']);
      expect(`
        |   : *   *   *   *   *   *   *   * : * : *   *   * |
        |   : *   *   *   *   *   *   *   * : * : *   *   * |
        |   : *   *   *   * : *   *   *   * : * : *   *   * |
        |   : *   * : *   * : *   * : *   * : * : * : *   * |
        |===:===:===:===:===:===:===:===:===:===:===:===:===|
        |   : A : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();

      simulateClick(getTopClone().find('thead tr:eq(3) th:eq(1)'), 'LMB', {
        shiftKey: true
      }); // Back to column B4

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 2,2']);
      expect(`
        |   :                               :   :           |
        |   :                               :   :           |
        |   :               :               :   :           |
        |   : *   * :       :       :       :   :   :       |
        |===:===:===:===:===:===:===:===:===:===:===:===:===|
        |   : A : 0 :   :   :   :   :   :   :   :   :   :   |
        |   : 0 : 0 :   :   :   :   :   :   :   :   :   :   |
        |   : 0 : 0 :   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select every column header under the nested headers, when changing the selection using the SHIFT key ' +
       '(expanding the column selection from the left to the right)', () => {
      handsontable({
        data: createSpreadsheetData(3, 13),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
          ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
          ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
          ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
            { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
        ],
      });

      simulateClick(getTopClone().find('thead tr:eq(3) th:eq(1)')); // select column B4
      simulateClick(getTopClone().find('thead tr:eq(3) th:eq(3)'), 'LMB', {
        shiftKey: true
      }); // select column D4

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 2,4']);
      expect(`
        |   :                               :   :           |
        |   :                               :   :           |
        |   : *   *   *   * :               :   :           |
        |   : *   * : *   * :       :       :   :   :       |
        |===:===:===:===:===:===:===:===:===:===:===:===:===|
        |   : A : 0 : 0 : 0 :   :   :   :   :   :   :   :   |
        |   : 0 : 0 : 0 : 0 :   :   :   :   :   :   :   :   |
        |   : 0 : 0 : 0 : 0 :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      simulateClick(getTopClone().find('thead tr:eq(3) th:eq(5)'), 'LMB', {
        shiftKey: true
      }); // select column F4

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 2,6']);
      expect(`
        |   :                               :   :           |
        |   :                               :   :           |
        |   : *   *   *   * :               :   :           |
        |   : *   * : *   * : *   * :       :   :   :       |
        |===:===:===:===:===:===:===:===:===:===:===:===:===|
        |   : A : 0 : 0 : 0 : 0 : 0 :   :   :   :   :   :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 :   :   :   :   :   :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      simulateClick(getTopClone().find('thead tr:eq(3) th:eq(7)'), 'LMB', {
        shiftKey: true
      }); // select column H4

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 2,8']);
      expect(`
        |   : *   *   *   *   *   *   *   * :   :           |
        |   : *   *   *   *   *   *   *   * :   :           |
        |   : *   *   *   * : *   *   *   * :   :           |
        |   : *   * : *   * : *   * : *   * :   :   :       |
        |===:===:===:===:===:===:===:===:===:===:===:===:===|
        |   : A : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   :   :   :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   :   :   :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      simulateClick(getTopClone().find('thead tr:eq(3) th:eq(10)'), 'LMB', {
        shiftKey: true
      }); // select column K4

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 2,10']);
      expect(`
        |   : *   *   *   *   *   *   *   * : * :           |
        |   : *   *   *   *   *   *   *   * : * :           |
        |   : *   *   *   * : *   *   *   * : * :           |
        |   : *   * : *   * : *   * : *   * : * : * :       |
        |===:===:===:===:===:===:===:===:===:===:===:===:===|
        |   : A : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select every column header under the nested headers, when changing the selection using the SHIFT key ' +
       '(expanding the column selection from the right to the left)', () => {
      handsontable({
        data: createSpreadsheetData(3, 13),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
          ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
          ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
          ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
            { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
        ],
      });

      simulateClick(getTopClone().find('thead tr:eq(3) th:eq(10)')); // select column K4
      simulateClick(getTopClone().find('thead tr:eq(3) th:eq(9)'), 'LMB', {
        shiftKey: true
      }); // select column J4

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,10 from: -1,10 to: 2,9']);
      expect(`
        |   :                               : * :           |
        |   :                               : * :           |
        |   :               :               : * :           |
        |   :       :       :       :       : * : * :       |
        |===:===:===:===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   :   :   : 0 : A :   :   |
        |   :   :   :   :   :   :   :   :   : 0 : 0 :   :   |
        |   :   :   :   :   :   :   :   :   : 0 : 0 :   :   |
      `).toBeMatchToSelectionPattern();

      simulateClick(getTopClone().find('thead tr:eq(3) th:eq(7)'), 'LMB', {
        shiftKey: true
      }); // select column H4

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,10 from: -1,10 to: 2,7']);
      expect(`
        |   :                               : * :           |
        |   :                               : * :           |
        |   :               :               : * :           |
        |   :       :       :       : *   * : * : * :       |
        |===:===:===:===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   : 0 : 0 : 0 : A :   :   |
        |   :   :   :   :   :   :   : 0 : 0 : 0 : 0 :   :   |
        |   :   :   :   :   :   :   : 0 : 0 : 0 : 0 :   :   |
      `).toBeMatchToSelectionPattern();

      simulateClick(getTopClone().find('thead tr:eq(3) th:eq(5)'), 'LMB', {
        shiftKey: true
      }); // select column F4

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,10 from: -1,10 to: 2,5']);
      expect(`
        |   :                               : * :           |
        |   :                               : * :           |
        |   :               : *   *   *   * : * :           |
        |   :       :       : *   * : *   * : * : * :       |
        |===:===:===:===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   : 0 : 0 : 0 : 0 : 0 : A :   :   |
        |   :   :   :   :   : 0 : 0 : 0 : 0 : 0 : 0 :   :   |
        |   :   :   :   :   : 0 : 0 : 0 : 0 : 0 : 0 :   :   |
      `).toBeMatchToSelectionPattern();

      simulateClick(getTopClone().find('thead tr:eq(3) th:eq(3)'), 'LMB', {
        shiftKey: true
      }); // select column D4

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,10 from: -1,10 to: 2,3']);
      expect(`
        |   :                               : * :           |
        |   :                               : * :           |
        |   :               : *   *   *   * : * :           |
        |   :       : *   * : *   * : *   * : * : * :       |
        |===:===:===:===:===:===:===:===:===:===:===:===:===|
        |   :   :   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : A :   :   |
        |   :   :   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   :   |
        |   :   :   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   :   |
      `).toBeMatchToSelectionPattern();

      simulateClick(getTopClone().find('thead tr:eq(3) th:eq(1)'), 'LMB', {
        shiftKey: true
      }); // select column B4

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,10 from: -1,10 to: 2,1']);
      expect(`
        |   : *   *   *   *   *   *   *   * : * :           |
        |   : *   *   *   *   *   *   *   * : * :           |
        |   : *   *   *   * : *   *   *   * : * :           |
        |   : *   * : *   * : *   * : *   * : * : * :       |
        |===:===:===:===:===:===:===:===:===:===:===:===:===|
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : A :   :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   :   |
        |   : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should highlight the whole column when the API is called with indexes that points to the columns ' +
        'in-between the nested header', () => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 5 }, 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 4 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 3 }, 'F3', 'G3', 'H3', 'I3', 'J3'],
        ],
      });

      selectColumns(2);

      expect(`
        |   :                   :   :   :   :   |
        |   :               :   :   :   :   :   |
        |   :   : *   *   * :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   : A : 0 : 0 :   :   :   :   :   |
        |   :   : 0 : 0 : 0 :   :   :   :   :   |
        |   :   : 0 : 0 : 0 :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 2,4']);

      selectColumns(3);

      expect(`
        |   :                   :   :   :   :   |
        |   :               :   :   :   :   :   |
        |   :   : *   *   * :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   : 0 : A : 0 :   :   :   :   :   |
        |   :   : 0 : 0 : 0 :   :   :   :   :   |
        |   :   : 0 : 0 : 0 :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,2 to: 2,4']);

      selectColumns(4);

      expect(`
        |   :                   :   :   :   :   |
        |   :               :   :   :   :   :   |
        |   :   : *   *   * :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   : 0 : 0 : A :   :   :   :   :   |
        |   :   : 0 : 0 : 0 :   :   :   :   :   |
        |   :   : 0 : 0 : 0 :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: -1,2 to: 2,4']);
    });

    it('should highlight the whole nested column when "Ctrl" + "Space" keyboard shortcuts are pressed', () => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 5 }, 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 4 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 3 }, 'F3', 'G3', 'H3', 'I3', 'J3'],
        ],
      });

      selectCell(2, 2);
      keyDownUp(['control', 'space']);

      expect(`
        |   :                   :   :   :   :   |
        |   :               :   :   :   :   :   |
        |   :   : *   *   * :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   : 0 : 0 : 0 :   :   :   :   :   |
        |   :   : 0 : 0 : 0 :   :   :   :   :   |
        |   :   : A : 0 : 0 :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: -1,2 to: 2,4']);

      selectCell(1, 3);
      keyDownUp(['control', 'space']);

      expect(`
        |   :                   :   :   :   :   |
        |   :               :   :   :   :   :   |
        |   :   : *   *   * :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   : 0 : 0 : 0 :   :   :   :   :   |
        |   :   : 0 : A : 0 :   :   :   :   :   |
        |   :   : 0 : 0 : 0 :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: -1,2 to: 2,4']);

      selectCell(2, 4);
      keyDownUp(['control', 'space']);

      expect(`
        |   :                   :   :   :   :   |
        |   :               :   :   :   :   :   |
        |   :   : *   *   * :   :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   : 0 : 0 : 0 :   :   :   :   :   |
        |   :   : 0 : 0 : 0 :   :   :   :   :   |
        |   :   : 0 : 0 : A :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: -1,2 to: 2,4']);
    });
  });
});
