describe('CollapsibleColumns (RTL mode)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
    if (this.$wrapper) {
      this.$wrapper.remove();
    }
  });

  describe('selection', () => {
    it('should move focus to the nearest left column after collapsing (single cell selection)', () => {
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
        |   :   :   :   :           :   |
        |   :   :   :   :   :       :   |
        |   :   :   :   : - :   :   :   |
        |===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   :   |
        |   :   :   :   : # :   :   :   |
        |   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,5 from: 1,5 to: 1,5']);

      $(getCell(-1, 2).querySelector('.collapsibleIndicator')) // Expand header "C3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(`
        |   :   :   :   :                   :   |
        |   :   :   :   :   :               :   |
        |   :   :   :   : - :           :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   :   :   :   :   :   :   :   :   :   |
        |   :   :   :   : # :   :   :   :   :   |
        |   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,5 from: 1,5 to: 1,5']);
    });

    it('should move focus to the nearest right column when there is no column visible on the left after collapsing', () => {
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
        | - :   |
        |===:===|
        |   :   |
        | # :   |
        |   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);

      $(getCell(-3, 1).querySelector('.collapsibleIndicator')) // Expand header "B1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(`
        |                   :   |
        |                   :   |
        |               : - :   |
        |===:===:===:===:===:===|
        |   :   :   :   :   :   |
        |   :   :   :   : # :   |
        |   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    });
  });
});
