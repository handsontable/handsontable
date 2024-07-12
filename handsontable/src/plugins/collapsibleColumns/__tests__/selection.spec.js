describe('CollapsibleColumns', () => {
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
    if (this.$wrapper) {
      this.$wrapper.remove();
    }
  });

  describe('selection', () => {
    it('should active highlight column header for collapsed column', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        nestedHeaders: [
          [{ label: 'A1', colspan: 9 }, 'J1'],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 3 }, { label: 'F3', colspan: 2 }, { label: 'H3', colspan: 2 }, 'J3'],
          ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
        ],
        collapsibleColumns: true
      });

      $(getCell(-2, 2)) // Select header "C3"
        .simulate('mousedown')
        .simulate('mouseup');
      $(getCell(-2, 2).querySelector('.collapsibleIndicator')) // Collapse header "C3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(`
        |                           :   |
        |   :       :               :   |
        |   :   : * :       :       :   |
        |   :   : * :   :   :   :   :   |
        |===:===:===:===:===:===:===:===|
        |   :   : A :   :   :   :   :   |
        |   :   : 0 :   :   :   :   :   |
        |   :   : 0 :   :   :   :   :   |
        |   :   : 0 :   :   :   :   :   |
        |   :   : 0 :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,2 from: -2,2 to: 4,4', // C3
      ]);

      $(getCell(-2, 7).querySelector('.collapsibleIndicator')) // Collapse header "H3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-1, 7)) // Select header "H4"
        .simulate('mousedown')
        .simulate('mouseup');

      expect(`
        |                       :   |
        |   :       :           :   |
        |   :   :   :       : * :   |
        |   :   :   :   :   : * :   |
        |===:===:===:===:===:===:===|
        |   :   :   :   :   : A :   |
        |   :   :   :   :   : 0 :   |
        |   :   :   :   :   : 0 :   |
        |   :   :   :   :   : 0 :   |
        |   :   :   :   :   : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,7 from: -1,7 to: 4,7', // H3
      ]);

      $(getCell(-2, 5).querySelector('.collapsibleIndicator')) // Collapse header "F3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-2, 5)) // Select header "F3"
        .simulate('mousedown')
        .simulate('mouseup');

      expect(`
        |                   :   |
        |   :       :       :   |
        |   :   :   : * :   :   |
        |   :   :   : * :   :   |
        |===:===:===:===:===:===|
        |   :   :   : A :   :   |
        |   :   :   : 0 :   :   |
        |   :   :   : 0 :   :   |
        |   :   :   : 0 :   :   |
        |   :   :   : 0 :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,5 from: -2,5 to: 4,6', // F3
      ]);

      $(getCell(-3, 5).querySelector('.collapsibleIndicator')) // Collapse header "F2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(`
        |               :   |
        |   :       : * :   |
        |   :   :   : * :   |
        |   :   :   : * :   |
        |===:===:===:===:===|
        |   :   :   : A :   |
        |   :   :   : 0 :   |
        |   :   :   : 0 :   |
        |   :   :   : 0 :   |
        |   :   :   : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,5 from: -2,5 to: 4,6', // F2
      ]);

      $(getCell(-3, 5).querySelector('.collapsibleIndicator')) // Expand header "F2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-2, 5).querySelector('.collapsibleIndicator')) // Expand header "F3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-2, 7).querySelector('.collapsibleIndicator')) // Expand header "H3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(`
        |                           :   |
        |   :       :               :   |
        |   :   :   : *   * :       :   |
        |   :   :   : * : * :   :   :   |
        |===:===:===:===:===:===:===:===|
        |   :   :   : A : 0 :   :   :   |
        |   :   :   : 0 : 0 :   :   :   |
        |   :   :   : 0 : 0 :   :   :   |
        |   :   :   : 0 : 0 :   :   :   |
        |   :   :   : 0 : 0 :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,5 from: -2,5 to: 4,6', // F2
      ]);
    });

    it('should active highlight column header for non-contiguous selection of the collapsed columns', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 8 }, 'J1', { label: 'K1', colspan: 3 }],
          ['A2', { label: 'B2', colspan: 8 }, 'J2', { label: 'K2', colspan: 3 }],
          ['A3', { label: 'B3', colspan: 4 }, { label: 'F3', colspan: 4 }, 'J3', { label: 'K3', colspan: 3 }],
          ['A4', { label: 'B4', colspan: 2 }, { label: 'D4', colspan: 2 }, { label: 'F4', colspan: 2 },
            { label: 'H4', colspan: 2 }, 'J4', 'K4', { label: 'L4', colspan: 2 }],
          ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5'],
        ],
        collapsibleColumns: true
      });

      simulateClick(getCell(-2, 7)); // Select header "H4"
      simulateClick(getCell(-2, 7).querySelector('.collapsibleIndicator')); // Collapse header "H4"

      keyDown('control/meta');

      simulateClick(getCell(-1, 5)); // Select header "F5"
      simulateClick(getCell(-2, 1).querySelector('.collapsibleIndicator')); // Collapse header "B4"
      simulateClick(getCell(-2, 3)); // Select header "D4"

      keyUp('control/meta');

      expect(`
        |   :                       :   |
        |   :                       :   |
        |   :           :           :   |
        |   :   : *   * :       : * :   |
        |   :   : * : * : * :   : * :   |
        |===:===:===:===:===:===:===:===|
        |   :   : A : 0 : 0 :   : 0 :   |
        |   :   : 0 : 0 : 0 :   : 0 :   |
        |   :   : 0 : 0 : 0 :   : 0 :   |
        |   :   : 0 : 0 : 0 :   : 0 :   |
        |   :   : 0 : 0 : 0 :   : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,7 from: -2,7 to: 4,8', // H4
        'highlight: 0,5 from: -1,5 to: 4,5', // F5
        'highlight: 0,3 from: -2,3 to: 4,4', // D4
      ]);

      simulateClick(getCell(-4, 1).querySelector('.collapsibleIndicator')); // Collapse header "B1"

      expect(`
        |   :           :   |
        |   :           :   |
        |   :           :   |
        |   :   : *   * :   |
        |   :   : * : * :   |
        |===:===:===:===:===|
        |   :   : A : 0 :   |
        |   :   : 0 : 0 :   |
        |   :   : 0 : 0 :   |
        |   :   : 0 : 0 :   |
        |   :   : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,7 from: -2,7 to: 4,8', // H4
        'highlight: 0,5 from: -1,5 to: 4,5', // F5
        'highlight: 0,3 from: -2,3 to: 4,4', // D4
      ]);
    });

    it('should active highlight the column header when the header is collapsed to the same colspan width as its child', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 10),
        nestedHeaders: [
          [{ label: 'A1', colspan: 10 }],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, { label: 'F3', colspan: 2 },
            { label: 'H3', colspan: 2 }, 'J3'],
        ],
        collapsibleColumns: true
      });

      $(getCell(-1, 0)) // Select header "A3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(`
        |                                       |
        | * :               :               :   |
        | * :       :       :       :       :   |
        |===:===:===:===:===:===:===:===:===:===|
        | A :   :   :   :   :   :   :   :   :   |
        | 0 :   :   :   :   :   :   :   :   :   |
        | 0 :   :   :   :   :   :   :   :   :   |
        | 0 :   :   :   :   :   :   :   :   :   |
        | 0 :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: -1,0 to: 4,0', // A4
      ]);

      $(getCell(-3, 0).querySelector('.collapsibleIndicator')) // Collapse header "A1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(`
        | * |
        | * |
        | * |
        |===|
        | A |
        | 0 |
        | 0 |
        | 0 |
        | 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: -1,0 to: 4,0', // A4
      ]);

      $(getCell(-3, 0).querySelector('.collapsibleIndicator')) // Expand header "A1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(`
        |                                       |
        | * :               :               :   |
        | * :       :       :       :       :   |
        |===:===:===:===:===:===:===:===:===:===|
        | A :   :   :   :   :   :   :   :   :   |
        | 0 :   :   :   :   :   :   :   :   :   |
        | 0 :   :   :   :   :   :   :   :   :   |
        | 0 :   :   :   :   :   :   :   :   :   |
        | 0 :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: -1,0 to: 4,0', // A4
      ]);
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
        collapsibleColumns: true,
      });

      selectColumns(2);
      $(getCell(-1, 2).querySelector('.collapsibleIndicator')) // Collapse header "C3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(`
        |   :           :   :   :   :   |
        |   :       :   :   :   :   :   |
        |   :   : * :   :   :   :   :   |
        |===:===:===:===:===:===:===:===|
        |   :   : A :   :   :   :   :   |
        |   :   : 0 :   :   :   :   :   |
        |   :   : 0 :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 2,4']);

      selectColumns(3);

      expect(`
        |   :           :   :   :   :   |
        |   :       :   :   :   :   :   |
        |   :   : * :   :   :   :   :   |
        |===:===:===:===:===:===:===:===|
        |   :   : A :   :   :   :   :   |
        |   :   : 0 :   :   :   :   :   |
        |   :   : 0 :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 2,4']);

      selectColumns(4);

      expect(`
        |   :           :   :   :   :   |
        |   :       :   :   :   :   :   |
        |   :   : * :   :   :   :   :   |
        |===:===:===:===:===:===:===:===|
        |   :   : A :   :   :   :   :   |
        |   :   : 0 :   :   :   :   :   |
        |   :   : 0 :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 2,4']);
    });

    it('should highlight the whole collapsed column when "Ctrl" + "Space" keyboard shortcuts are pressed', () => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 5 }, 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 4 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 3 }, 'F3', 'G3', 'H3', 'I3', 'J3'],
        ],
        collapsibleColumns: true,
      });

      $(getCell(-1, 2).querySelector('.collapsibleIndicator')) // Collapse header "C3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      selectCell(2, 2);
      keyDownUp(['control', 'space']);

      expect(`
        |   :           :   :   :   :   |
        |   :       :   :   :   :   :   |
        |   :   : * :   :   :   :   :   |
        |===:===:===:===:===:===:===:===|
        |   :   : 0 :   :   :   :   :   |
        |   :   : 0 :   :   :   :   :   |
        |   :   : A :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: -1,2 to: 2,4']);
    });

    it('should move focus to the nearest right column after collapsing (single cell selection)', () => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 5 }, 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 4 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 3 }, 'F3', 'G3', 'H3', 'I3', 'J3'],
        ],
        collapsibleColumns: true,
      });

      selectCell(1, 3);
      $(getCell(-1, 2).querySelector('.collapsibleIndicator')) // Collapse header "C3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(`
        |   :           :   :   :   :   |
        |   :       :   :   :   :   :   |
        |   :   :   : - :   :   :   :   |
        |===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   :   |
        |   :   :   : # :   :   :   :   |
        |   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,5 from: 1,5 to: 1,5']);

      $(getCell(-1, 2).querySelector('.collapsibleIndicator')) // Expand header "C3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(`
        |   :                   :   :   :   :   |
        |   :               :   :   :   :   :   |
        |   :   :           : - :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   :   :   :   |
        |   :   :   :   :   : # :   :   :   :   |
        |   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,5 from: 1,5 to: 1,5']);
    });

    it('should move focus to the nearest right column after collapsing (multiple selection)', () => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 5 }, 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 4 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 3 }, 'F3', 'G3', 'H3', 'I3', 'J3'],
        ],
        collapsibleColumns: true,
      });

      selectCell(2, 4, 1, 3);
      $(getCell(-1, 2).querySelector('.collapsibleIndicator')) // Collapse header "C3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(`
        |   :           :   :   :   :   |
        |   :       :   :   :   :   :   |
        |   :   :   : - :   :   :   :   |
        |===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   :   |
        |   :   :   :   :   :   :   :   |
        |   :   :   : # :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,5 from: 2,5 to: 2,5']);

      $(getCell(-1, 2).querySelector('.collapsibleIndicator')) // Expand header "C3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(`
        |   :                   :   :   :   :   |
        |   :               :   :   :   :   :   |
        |   :   :           : - :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   :   :   :   |
        |   :   :   :   :   :   :   :   :   :   |
        |   :   :   :   :   : # :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,5 from: 2,5 to: 2,5']);
    });

    it('should move focus to the nearest right column after collapsing (column header selection)', () => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 5 }, 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 4 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 3 }, 'F3', 'G3', 'H3', 'I3', 'J3'],
        ],
        collapsibleColumns: true,
        navigableHeaders: true,
      });

      selectColumns(2, 2, -1);
      $(getCell(-2, 1).querySelector('.collapsibleIndicator')) // Collapse header "B2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(`
        |   :       :   :   :   :   |
        |   :   :   :   :   :   :   |
        |   :   : # :   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   |
        |   :   :   :   :   :   :   |
        |   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,5 from: -1,5 to: -1,5']);

      $(getCell(-2, 1).querySelector('.collapsibleIndicator')) // Expand header "B2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(`
        |   :                   :   :   :   :   |
        |   :               :   :   :   :   :   |
        |   :   :           : # :   :   :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   :   :   :   |
        |   :   :   :   :   :   :   :   :   :   |
        |   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,5 from: -1,5 to: -1,5']);
    });

    it('should move focus to the nearest left column when there is no column visible on the right after collapsing', () => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 5 }, 'G1', 'H1', 'I1', 'J1'],
          ['A2', { label: 'B2', colspan: 5 }, 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', { label: 'C3', colspan: 4 }, 'F3', 'G3', 'H3', 'I3', 'J3'],
        ],
        collapsibleColumns: true,
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(6, true);
      columnMapper.setValueAtIndex(7, true);
      columnMapper.setValueAtIndex(8, true);
      columnMapper.setValueAtIndex(9, true);

      render();

      selectCell(1, 3, 2, 5);
      $(getCell(-3, 1).querySelector('.collapsibleIndicator')) // Collapse header "B1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(`
        |   :   |
        |   :   |
        |   : - |
        |===:===|
        |   :   |
        |   : # |
        |   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);

      $(getCell(-3, 1).querySelector('.collapsibleIndicator')) // Expand header "B1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(`
        |   :                   |
        |   :                   |
        |   : - :               |
        |===:===:===:===:===:===|
        |   :   :   :   :   :   |
        |   : # :   :   :   :   |
        |   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    });
  });
});
