describe('CollapsibleColumns', () => {
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

  describe('navigation in headers (navigableHeaders on)', () => {
    it('should be possible to move the focus around the headers when some columns are collapsed (autoWrap off)', async() => {
      handsontable({
        data: createSpreadsheetData(1, 10),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          [{ label: 'A1', colspan: 10 }],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, { label: 'F3', colspan: 2 },
            { label: 'H3', colspan: 2 }, 'J3'],
        ],
        collapsibleColumns: true,
      });

      $(getCell(-1, 3).querySelector('.collapsibleIndicator')) // Collapse header "D3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-2, 1).querySelector('.collapsibleIndicator')) // Collapse header "B2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-1, 5).querySelector('.collapsibleIndicator')) // Collapse header "F3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      await selectCell(0, 9);

      await keyDownUp('arrowup');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   :       : # |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,9 from: -1,9 to: -1,9']);

      await keyDownUp('arrowup');

      expect(`
        |   ║                           |
        |   ║   :       :           : # |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,9 from: -2,9 to: -2,9']);

      await keyDownUp('arrowup');
      await keyDownUp('arrowup'); // the movement should be ignored
      await keyDownUp('arrowup'); // the movement should be ignored

      expect(`
        |   ║ #   #   #   #   #   #   # |
        |   ║   :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,9 from: -3,9 to: -3,9']);

      await keyDownUp('arrowleft');
      await keyDownUp('arrowleft'); // the movement should be ignored
      await keyDownUp('arrowleft'); // the movement should be ignored

      expect(`
        | # ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,-1 from: -3,-1 to: -3,-1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        | # ║   :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,-1 from: -2,-1 to: -2,-1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║ # :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,0 from: -2,0 to: -2,0']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   : #   # :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -2,1 to: -2,1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       : #   #   # :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,5 from: -2,5 to: -2,5']);

      await keyDownUp('arrowright');
      await keyDownUp('arrowright'); // the movement should be ignored
      await keyDownUp('arrowright'); // the movement should be ignored

      expect(`
        |   ║                           |
        |   ║   :       :           : # |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,9 from: -2,9 to: -2,9']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   :       : # |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,9 from: -1,9 to: -1,9']);

      await keyDownUp('arrowleft');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   : #   # :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,8 from: -1,8 to: -1,8']);

      await keyDownUp('arrowleft');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       : # :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,5 from: -1,5 to: -1,5']);

      await keyDownUp('arrowleft');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   : #   # :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);

      await keyDownUp('arrowleft');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║ # :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);

      await keyDownUp('arrowleft');
      await keyDownUp('arrowleft'); // the movement should be ignored
      await keyDownUp('arrowleft'); // the movement should be ignored

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        | # ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        | # ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║ - :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        | - ║ # :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   : -   - :   :       :   |
        |===:===:===:===:===:===:===:===|
        | - ║   : # :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   : -   - :   :       :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   : # :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       : - :       :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   : # :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,5 from: 0,5 to: 0,5']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   : -   - :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   :   : # :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,7 from: 0,7 to: 0,7']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   : -   - :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   :   :   : # :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,8 from: 0,8 to: 0,8']);

      await keyDownUp('arrowright');
      await keyDownUp('arrowright'); // the movement should be ignored
      await keyDownUp('arrowright'); // the movement should be ignored
      await keyDownUp('arrowdown'); // the movement should be ignored

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   :       : - |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   :   :   :   : # |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,9 from: 0,9 to: 0,9']);
    });

    it('should be possible to move the focus around the headers when all columns are collapsed (autoWrap off)', async() => {
      handsontable({
        data: createSpreadsheetData(1, 10),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        nestedHeaders: [
          [{ label: 'A1', colspan: 10 }],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, { label: 'F3', colspan: 2 },
            { label: 'H3', colspan: 2 }, 'J3'],
        ],
        collapsibleColumns: true,
      });

      $(getCell(-3, 0).querySelector('.collapsibleIndicator')) // Collapse header "A1"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      await selectCell(0, 0);
      await keyDownUp('arrowup');

      expect(`
        |   ║   |
        |   ║   |
        |   ║ # |
        |===:===|
        |   ║   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);

      await keyDownUp('arrowup');

      expect(`
        |   ║   |
        |   ║ # |
        |   ║   |
        |===:===|
        |   ║   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,0 from: -2,0 to: -2,0']);

      await keyDownUp('arrowup');
      await keyDownUp('arrowup'); // the movement should be ignored
      await keyDownUp('arrowup'); // the movement should be ignored

      expect(`
        |   ║ # |
        |   ║   |
        |   ║   |
        |===:===|
        |   ║   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,0 from: -3,0 to: -3,0']);

      await keyDownUp('arrowleft');
      await keyDownUp('arrowleft'); // the movement should be ignored
      await keyDownUp('arrowleft'); // the movement should be ignored

      expect(`
        | # ║   |
        |   ║   |
        |   ║   |
        |===:===|
        |   ║   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,-1 from: -3,-1 to: -3,-1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   |
        | # ║   |
        |   ║   |
        |===:===|
        |   ║   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,-1 from: -2,-1 to: -2,-1']);

      await keyDownUp('arrowright');
      await keyDownUp('arrowright'); // the movement should be ignored
      await keyDownUp('arrowright'); // the movement should be ignored

      expect(`
        |   ║   |
        |   ║ # |
        |   ║   |
        |===:===|
        |   ║   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,0 from: -2,0 to: -2,0']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║   |
        |   ║   |
        |   ║ # |
        |===:===|
        |   ║   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);

      await keyDownUp('arrowleft');
      await keyDownUp('arrowleft'); // the movement should be ignored
      await keyDownUp('arrowleft'); // the movement should be ignored

      expect(`
        |   ║   |
        |   ║   |
        | # ║   |
        |===:===|
        |   ║   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);

      await keyDownUp('arrowdown');
      await keyDownUp('arrowdown'); // the movement should be ignored
      await keyDownUp('arrowdown'); // the movement should be ignored

      expect(`
        |   ║   |
        |   ║   |
        |   ║   |
        |===:===|
        | # ║   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);

      await keyDownUp('arrowright');
      await keyDownUp('arrowright'); // the movement should be ignored
      await keyDownUp('arrowright'); // the movement should be ignored

      expect(`
        |   ║   |
        |   ║   |
        |   ║ - |
        |===:===|
        | - ║ # |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
    });

    it('should be possible to move the focus vertically when some columns are collapsed (autoWrap on)', async() => {
      handsontable({
        data: createSpreadsheetData(1, 10),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        autoWrapCol: true,
        autoWrapRow: true,
        nestedHeaders: [
          [{ label: 'A1', colspan: 10 }],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, { label: 'F3', colspan: 2 },
            { label: 'H3', colspan: 2 }, 'J3'],
        ],
        collapsibleColumns: true,
      });

      $(getCell(-1, 3).querySelector('.collapsibleIndicator')) // Collapse header "D3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-2, 1).querySelector('.collapsibleIndicator')) // Collapse header "B2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-1, 5).querySelector('.collapsibleIndicator')) // Collapse header "F3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      await selectCell(-3, -1);
      await keyDownUp('arrowright');

      expect(`
        |   ║ #   #   #   #   #   #   # |
        |   ║   :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,0 from: -3,0 to: -3,0']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        | # ║   :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,-1 from: -2,-1 to: -2,-1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║ # :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,0 from: -2,0 to: -2,0']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   : #   # :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -2,1 to: -2,1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       : #   #   # :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,5 from: -2,5 to: -2,5']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           : # |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,9 from: -2,9 to: -2,9']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        | # ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║ # :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   : #   # :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: -1,1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       : # :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,5 from: -1,5 to: -1,5']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   : #   # :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,7 from: -1,7 to: -1,7']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   :       : # |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,9 from: -1,9 to: -1,9']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        | # ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║ - :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        | - ║ # :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   : -   - :   :       :   |
        |===:===:===:===:===:===:===:===|
        | - ║   : # :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   : -   - :   :       :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   : # :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       : - :       :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   : # :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,5 from: 0,5 to: 0,5']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   : -   - :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   :   : # :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,7 from: 0,7 to: 0,7']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   : -   - :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   :   :   : # :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,8 from: 0,8 to: 0,8']);

      await keyDownUp('arrowright');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   :       : - |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   :   :   :   : # |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,9 from: 0,9 to: 0,9']);

      await keyDownUp('arrowright');

      expect(`
        | # ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,-1 from: -3,-1 to: -3,-1']);
    });

    it('should be possible to move the focus horizontally when some columns are collapsed (autoWrap on)', async() => {
      handsontable({
        data: createSpreadsheetData(1, 10),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        autoWrapCol: true,
        autoWrapRow: true,
        nestedHeaders: [
          [{ label: 'A1', colspan: 10 }],
          ['A2', { label: 'B2', colspan: 4 }, { label: 'F2', colspan: 4 }, 'J2'],
          ['A3', { label: 'B3', colspan: 2 }, { label: 'D3', colspan: 2 }, { label: 'F3', colspan: 2 },
            { label: 'H3', colspan: 2 }, 'J3'],
        ],
        collapsibleColumns: true,
      });

      $(getCell(-1, 3).querySelector('.collapsibleIndicator')) // Collapse header "D3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-2, 1).querySelector('.collapsibleIndicator')) // Collapse header "B2"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');
      $(getCell(-1, 5).querySelector('.collapsibleIndicator')) // Collapse header "F3"
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      await selectCell(-3, -1);
      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        | # ║   :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,-1 from: -2,-1 to: -2,-1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        | # ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        | # ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║ #   #   #   #   #   #   # |
        |   ║   :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,0 from: -3,0 to: -3,0']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║ # :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,0 from: -2,0 to: -2,0']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║ # :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║ - :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        | - ║ # :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║ #   #   #   #   #   #   # |
        |   ║   :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,1 from: -3,1 to: -3,1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   : #   # :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -2,1 to: -2,1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   : #   # :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: -1,1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   : -   - :   :       :   |
        |===:===:===:===:===:===:===:===|
        | - ║   : # :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║ #   #   #   #   #   #   # |
        |   ║   :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,2 from: -3,2 to: -3,2']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   : #   # :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,2 from: -2,2 to: -2,2']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   : #   # :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   : -   - :   :       :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   : # :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║ #   #   #   #   #   #   # |
        |   ║   :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,5 from: -3,5 to: -3,5']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       : #   #   # :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,5 from: -2,5 to: -2,5']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       : # :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,5 from: -1,5 to: -1,5']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       : - :       :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   : # :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,5 from: 0,5 to: 0,5']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║ #   #   #   #   #   #   # |
        |   ║   :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,7 from: -3,7 to: -3,7']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       : #   #   # :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,7 from: -2,7 to: -2,7']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   : #   # :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,7 from: -1,7 to: -1,7']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   : -   - :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   :   : # :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,7 from: 0,7 to: 0,7']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║ #   #   #   #   #   #   # |
        |   ║   :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,8 from: -3,8 to: -3,8']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       : #   #   # :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,8 from: -2,8 to: -2,8']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   : #   # :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,8 from: -1,8 to: -1,8']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   : -   - :   |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   :   :   : # :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,8 from: 0,8 to: 0,8']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║ #   #   #   #   #   #   # |
        |   ║   :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,9 from: -3,9 to: -3,9']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       :           : # |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,9 from: -2,9 to: -2,9']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   :       : # |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,9 from: -1,9 to: -1,9']);

      await keyDownUp('arrowdown');

      expect(`
        |   ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   :       : - |
        |===:===:===:===:===:===:===:===|
        | - ║   :   :   :   :   :   : # |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,9 from: 0,9 to: 0,9']);

      await keyDownUp('arrowdown');

      expect(`
        | # ║                           |
        |   ║   :       :           :   |
        |   ║   :       :   :       :   |
        |===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,-1 from: -3,-1 to: -3,-1']);
    });
  });
});
