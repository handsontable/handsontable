describe('HiddenRows', () => {
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

  describe('MergeCells', () => {
    it('should display properly merged cells based on the settings', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
        mergeCells: [
          { row: 0, col: 0, rowspan: 3, colspan: 3 }
        ],
        hiddenRows: {
          rows: [1],
        },
      });

      expect(getData()).toEqual([
        ['A1', null, null, 'D1', 'E1'],
        [null, null, null, 'D2', 'E2'],
        [null, null, null, 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
      ]);

      expect(getHtCore().outerHeight()).toBe(93);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);

      getPlugin('hiddenRows').showRows([1]);
      render();

      expect(getHtCore().outerHeight()).toBe(116);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(70);

      getPlugin('hiddenRows').hideRows([1]);
      render();

      expect(getHtCore().outerHeight()).toBe(93);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);
    });

    it('should display properly merged cells containing hidden rows (merge area from visible cell to visible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        rowHeaders: true, // It has to be enabled due the bug in mergeCells plugin (#4907)
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(1, 0, 3, 0);

      // Merged from visual row index 1 (visible) to visual row index 3 (visible).
      //                                 ↓    merged data     ↓
      expect(getData()).toEqual([['A1'], ['A2'], [null], [null], ['A5']]);
      expect(getHtCore().find('td:eq(0)').text()).toBe('A2');
      expect(getHtCore().outerHeight()).toBe(47);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);

      getPlugin('hiddenRows').showRows([2]);
      render();

      expect(getHtCore().outerHeight()).toBe(70);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(70);

      getPlugin('hiddenRows').hideRows([2]);
      render();

      expect(getHtCore().outerHeight()).toBe(47);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);

      getPlugin('hiddenRows').showRows([0, 2, 4]);
      render();

      expect(getHtCore().outerHeight()).toBe(116);
      expect(getHtCore().find('td:eq(1)').outerHeight()).toBe(69);
    });

    it('should display properly merged cells containing hidden rows (merge area from invisible cell to visible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        rowHeaders: true, // It has to be enabled due the bug in mergeCells plugin (#4907)
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(0, 0, 3, 0);

      // Merged from visual row index 0 (invisible) to visual row index 3 (visible).
      //                         ↓        merged data         ↓
      expect(getData()).toEqual([['A1'], [null], [null], [null], ['A5']]);

      expect(getHtCore().find('td:eq(0)').text()).toBe('A1');

      expect(getHtCore().outerHeight()).toBe(47);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);

      getPlugin('hiddenRows').showRows([0]);
      render();

      expect(getHtCore().outerHeight()).toBe(70);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(70);

      getPlugin('hiddenRows').showRows([2]);
      render();

      expect(getHtCore().outerHeight()).toBe(93);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(93);

      getPlugin('hiddenRows').hideRows([0, 2]);
      render();

      expect(getHtCore().outerHeight()).toBe(47);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);

      getPlugin('hiddenRows').showRows([0, 2, 4]);
      render();

      expect(getHtCore().outerHeight()).toBe(116);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(93);
    });

    it('should display properly merged cells containing hidden rows (merge area from visible cell to invisible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        rowHeaders: true, // It has to be enabled due the bug in mergeCells plugin (#4907)
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(1, 0, 4, 0);

      // Merged from visual row index 1 (visible) to visual row index 4 (invisible).
      //                                 ↓        merged data         ↓
      expect(getData()).toEqual([['A1'], ['A2'], [null], [null], [null]]);
      expect(getHtCore().find('td:eq(0)').text()).toBe('A2');

      expect(getHtCore().outerHeight()).toBe(47);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);

      getPlugin('hiddenRows').showRows([2]);
      render();

      expect(getHtCore().outerHeight()).toBe(70);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(70);

      getPlugin('hiddenRows').showRows([4]);
      render();

      expect(getHtCore().outerHeight()).toBe(93);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(93);

      getPlugin('hiddenRows').hideRows([2, 4]);
      render();

      expect(getHtCore().outerHeight()).toBe(47);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);

      getPlugin('hiddenRows').showRows([0, 2, 4]);
      render();

      expect(getHtCore().outerHeight()).toBe(116);
      expect(getHtCore().find('td:eq(1)').outerHeight()).toBe(92);
    });

    it('should display properly merged cells containing hidden rows (merge area from invisible cell to invisible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        rowHeaders: true, // It has to be enabled due the bug in mergeCells plugin (#4907)
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(0, 0, 4, 0);

      // Merged from visual row index 0 (invisible) to visual row index 4 (invisible).
      //                         ↓           merged data               ↓
      expect(getData()).toEqual([['A1'], [null], [null], [null], [null]]);
      expect(getHtCore().find('td:eq(0)').text()).toBe('A1');

      expect(getHtCore().outerHeight()).toBe(47);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);

      getPlugin('hiddenRows').showRows([0]);
      render();

      expect(getHtCore().outerHeight()).toBe(70);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(70);

      getPlugin('hiddenRows').showRows([2]);
      render();

      expect(getHtCore().outerHeight()).toBe(93);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(93);

      getPlugin('hiddenRows').showRows([4]);
      render();

      expect(getHtCore().outerHeight()).toBe(116);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(116);

      getPlugin('hiddenRows').hideRows([0, 2, 4]);
      render();

      expect(getHtCore().outerHeight()).toBe(47);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);

      getPlugin('hiddenRows').showRows([0, 2, 4]);
      render();

      expect(getHtCore().outerHeight()).toBe(116);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(116);
    });

    it('should return proper values from the `getCell` function', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        rowHeaders: true, // It has to be enabled due the bug in mergeCells plugin (#4907)
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(1, 0, 3, 0);

      expect(getCell(0, 0)).toBe(null);
      expect(getCell(1, 0)).toBe(getHtCore().find('td')[0]);
      expect(getCell(2, 0)).toBe(null);
      expect(getCell(3, 0)).toBe(getHtCore().find('td')[0]);
      expect(getCell(4, 0)).toBe(null);

      getPlugin('hiddenRows').showRows([2]);
      render();

      expect(getCell(0, 0)).toBe(null);
      expect(getCell(1, 0)).toBe(getHtCore().find('td')[0]);
      expect(getCell(2, 0)).toBe(getHtCore().find('td')[0]);
      expect(getCell(3, 0)).toBe(getHtCore().find('td')[0]);
      expect(getCell(4, 0)).toBe(null);
    });

    it('should translate row indexes properly - regression check', () => {
      // An error have been thrown and too many rows have been drawn in the specific case. There haven't been done
      // index translation (from renderable to visual rows indexes and the other way around).
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(7, 1),
        rowHeaders: true, // It has to be enabled due the bug in mergeCells plugin (#4907)
        hiddenRows: {
          rows: [0, 2],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(3, 0, 5, 0);

      // The same as at the start.
      expect($(getHtCore()).find('td').length).toBe(5);
      // Still the same height for the whole table.
      expect(getHtCore().outerHeight()).toBe(116);
      expect(getHtCore().find('td:eq(1)').outerHeight()).toBe(69);
    });

    // Please keep in mind that this test doesn't fulfil checks for all types of renderers. Change code carefully
    // when something is failing.
    it('should show start of the merge area properly also when first row from the area is hidden', () => {
      handsontable({
        data: [
          ['<b>Hello world</b>', 123, 'secret'],
          ['Hello!', 'not numeric', 'secret too']
        ],
        columns: [
          { renderer: 'html' },
          { renderer: 'numeric' },
          { renderer: 'password' },
        ],
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 1 },
          { row: 0, col: 1, rowspan: 2, colspan: 1 },
          { row: 0, col: 2, rowspan: 2, colspan: 1 },
        ],
        hiddenRows: {
          rows: [0]
        }
      });

      expect($(getHtCore()).find('td')[0].innerHTML).toBe('<b>Hello world</b>');
      expect($(getHtCore()).find('td')[1].innerText).toBe('123');
      expect($(getHtCore()).find('td')[2].innerText).toBe('******');
    });

    it('should select proper cells when calling the `selectCell` within area of merge ' +
      '(contains few hidden rows)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        rowHeaders: true, // It has to be enabled due the bug in mergeCells plugin (#4907)
        hiddenRows: {
          rows: [0, 2],
        },
        mergeCells: [
          { row: 1, col: 0, rowspan: 4, colspan: 1 }
        ]
      });

      // First visible cell (merged area).
      const $mergeArea = spec().$container.find('tr:eq(0) td:eq(0)');

      selectCell(1, 0);

      // Second and third rows are not displayed (CSS - display: none).
      expect(getSelected()).toEqual([[1, 0, 4, 0]]);
      expect(getSelectedRangeLast().highlight.row).toBe(1);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(1);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(0);
      expect(`
        | - ║ # |
        | - ║   |
        | - ║   |
      `).toBeMatchToSelectionPattern();
      expect($mergeArea.hasClass('fullySelectedMergedCell')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-multiple')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-0')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-1')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-2')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-3')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-4')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-5')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-6')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-7')).toBeFalse();

      deselectCell();
      selectCell(2, 0);

      // Second and third rows are not displayed (CSS - display: none).
      expect(getSelected()).toEqual([[1, 0, 4, 0]]);
      expect(getSelectedRangeLast().highlight.row).toBe(1);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(1);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(0);
      expect(`
        | - ║ # |
        | - ║   |
        | - ║   |
      `).toBeMatchToSelectionPattern();
      expect($mergeArea.hasClass('fullySelectedMergedCell')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-multiple')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-0')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-1')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-2')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-3')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-4')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-5')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-6')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-7')).toBeFalse();

      deselectCell();
      selectCell(3, 0);

      // Second and third rows are not displayed (CSS - display: none).
      expect(getSelected()).toEqual([[1, 0, 4, 0]]);
      expect(getSelectedRangeLast().highlight.row).toBe(1);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(1);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(0);
      expect(`
        | - ║ # |
        | - ║   |
        | - ║   |
      `).toBeMatchToSelectionPattern();
      expect($mergeArea.hasClass('fullySelectedMergedCell')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-multiple')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-0')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-1')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-2')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-3')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-4')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-5')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-6')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-7')).toBeFalse();

      // TODO: `selectCell(4, 0)` should give the same effect. There is bug at least from Handsontable 7.
    });

    it('should select proper cells when calling the `selectCell` within area of merge ' +
      '(contains just one hidden and one not hidden row)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        rowHeaders: true, // It has to be enabled due the bug in mergeCells plugin (#4907)
        hiddenRows: {
          rows: [0],
        },
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 1 }
        ]
      });

      // First visible cell (merged area).
      const $mergeArea = spec().$container.find('tr:eq(0) td:eq(0)');

      selectCell(0, 0);

      expect(`
      | - ║ # |
      |   ║   |
      |   ║   |
      |   ║   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[0, 0, 1, 0]]);
      expect(getSelectedRangeLast().highlight.row).toBe(1);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(1);
      expect(getSelectedRangeLast().to.col).toBe(0);
      expect($mergeArea.hasClass('fullySelectedMergedCell')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-multiple')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-0')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-1')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-2')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-3')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-4')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-5')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-6')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-7')).toBeFalse();

      deselectCell();
      selectCell(1, 0);

      expect(`
      | - ║ # |
      |   ║   |
      |   ║   |
      |   ║   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[0, 0, 1, 0]]);
      expect(getSelectedRangeLast().highlight.row).toBe(1);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(1);
      expect(getSelectedRangeLast().to.col).toBe(0);
      expect($mergeArea.hasClass('fullySelectedMergedCell')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-multiple')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-0')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-1')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-2')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-3')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-4')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-5')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-6')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-7')).toBeFalse();
    });

    it('should select proper cells when calling the `selectCells` within area of merge ' +
      '(contains just one hidden and one not hidden rows) + singe cell', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        hiddenRows: {
          rows: [0],
        },
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 1 }
        ]
      });

      // First visible cell (merged area).
      const $mergeArea = spec().$container.find('tr:eq(0) td:eq(0)');

      selectCells([[1, 0], [4, 0]]);

      expect(`
      | 0 |
      |   |
      |   |
      | A |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[0, 0, 1, 0], [4, 0, 4, 0]]);
      expect(getSelectedRangeLast().highlight.row).toBe(4);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(4);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(0);
      expect($mergeArea.hasClass('area')).toBeTrue();
      expect($mergeArea.hasClass('fullySelectedMergedCell')).toBeFalse();
      // TODO: Probably it should return `false`.
      expect($mergeArea.hasClass('fullySelectedMergedCell-multiple')).toBeTrue();
      // Probably it should return `true`, changed since 8.0.0.
      expect($mergeArea.hasClass('fullySelectedMergedCell-0')).toBeTrue();
      expect($mergeArea.hasClass('fullySelectedMergedCell-1')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-2')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-3')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-4')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-5')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-6')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-7')).toBeFalse();
    });

    it('should open properly merged cells containing hidden rows (merge area from visible cell to visible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(1, 0, 3, 0);

      selectCell(1, 0);
      keyDownUp('enter');

      let editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A2');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(2, 0);
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A2');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(3, 0);
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A2');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A2');
    });

    it('should open properly merged cells containing hidden rows (merge area from invisible cell to visible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(0, 0, 3, 0);

      selectCell(0, 0);
      keyDownUp('enter');

      let editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(1, 0);
      keyDownUp('enter');

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(2, 0);
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(3, 0);
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');
    });

    it('should open properly merged cells containing hidden rows (merge area from visible cell to invisible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(1, 0, 4, 0);

      selectCell(1, 0);
      keyDownUp('enter');

      let editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A2');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(2, 0);
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A2');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(3, 0);
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A2');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(4, 0);
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A2');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A2');
    });

    it('should open properly merged cells containing hidden rows (merge area from invisible cell to invisible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(0, 0, 4, 0);

      selectCell(0, 0);
      keyDownUp('enter');

      let editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(1, 0);
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(2, 0);
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(3, 0);
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(4, 0);
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');
    });

    it('should edit merged cells properly (merge area from visible cell to visible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: [
          { row: 1, col: 0, rowspan: 3, colspan: 1 }
        ]
      });

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      const textarea = spec().$container.find('.handsontableInputHolder textarea')[0];

      textarea.value = 'Edited value';

      // Closing the editor.
      keyDownUp('enter');

      expect(getData()).toEqual([['A1'], ['Edited value'], [null], [null], ['A5']]);
    });

    it('should edit merged cells properly (merge area from invisible cell to visible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: [
          { row: 0, col: 0, rowspan: 4, colspan: 1 }
        ]
      });

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      const textarea = spec().$container.find('.handsontableInputHolder textarea')[0];

      textarea.value = 'Edited value';

      // Closing the editor.
      keyDownUp('enter');

      expect(getData()).toEqual([['Edited value'], [null], [null], [null], ['A5']]);
    });

    it('should edit merged cells properly (merge area from visible cell to invisible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: [
          { row: 1, col: 0, rowspan: 4, colspan: 1 }
        ],
      });

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      const textarea = spec().$container.find('.handsontableInputHolder textarea')[0];

      textarea.value = 'Edited value';

      // Closing the editor.
      keyDownUp('enter');

      expect(getData()).toEqual([['A1'], ['Edited value'], [null], [null], [null]]);
    });

    it('should edit merged cells properly (merge area from invisible cell to invisible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: [
          { row: 0, col: 0, rowspan: 5, colspan: 1 }
        ],
      });

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      const textarea = spec().$container.find('.handsontableInputHolder textarea')[0];

      textarea.value = 'Edited value';

      // Closing the editor.
      keyDownUp('enter');

      expect(getData()).toEqual([['Edited value'], [null], [null], [null], [null]]);
    });

    it('should work properly when hidden row is read only', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: [
          { row: 0, col: 0, rowspan: 5, colspan: 1 }
        ],
        cells(physicalRow, physicalColumn) {
          const cellProperties = {};
          const visualRowIndex = this.instance.toVisualRow(physicalRow);
          const visualColIndex = this.instance.toVisualColumn(physicalColumn);

          if (visualRowIndex === 0 && visualColIndex === 0) {
            cellProperties.readOnly = true;
          }

          return cellProperties;
        }
      });

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      let editor = getActiveEditor();

      expect(editor).toBeUndefined();

      // Try of opening the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor).toBeUndefined();
    });

    it('should work properly when editor is set to `false` for hidden row', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: [
          { row: 0, col: 0, rowspan: 5, colspan: 1 }
        ],
        cells(physicalRow, physicalColumn) {
          const cellProperties = {};
          const visualRowIndex = this.instance.toVisualRow(physicalRow);
          const visualColIndex = this.instance.toVisualColumn(physicalColumn);

          if (visualRowIndex === 0 && visualColIndex === 0) {
            cellProperties.editor = false;
          }

          return cellProperties;
        }
      });

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      let editor = getActiveEditor();

      expect(editor).toBeUndefined();

      // Try of opening the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor).toBeUndefined();
    });

    it('should edit merged cells properly (merge area from visible cell to visible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: [
          { row: 1, col: 0, rowspan: 3, colspan: 1 }
        ]
      });

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      const textarea = spec().$container.find('.handsontableInputHolder textarea')[0];

      textarea.value = 'Edited value';

      // Closing the editor.
      keyDownUp('enter');

      expect(getData()).toEqual([['A1'], ['Edited value'], [null], [null], ['A5']]);
    });

    it('should edit merged cells properly (merge area from invisible cell to visible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: [
          { row: 0, col: 0, rowspan: 4, colspan: 1 }
        ]
      });

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      const textarea = spec().$container.find('.handsontableInputHolder textarea')[0];

      textarea.value = 'Edited value';

      // Closing the editor.
      keyDownUp('enter');

      expect(getData()).toEqual([['Edited value'], [null], [null], [null], ['A5']]);
    });

    it('should edit merged cells properly (merge area from visible cell to invisible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: [
          { row: 1, col: 0, rowspan: 4, colspan: 1 }
        ],
      });

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      const textarea = spec().$container.find('.handsontableInputHolder textarea')[0];

      textarea.value = 'Edited value';

      // Closing the editor.
      keyDownUp('enter');

      expect(getData()).toEqual([['A1'], ['Edited value'], [null], [null], [null]]);
    });

    it('should edit merged cells properly (merge area from invisible cell to invisible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: [
          { row: 0, col: 0, rowspan: 5, colspan: 1 }
        ],
      });

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      const textarea = spec().$container.find('.handsontableInputHolder textarea')[0];

      textarea.value = 'Edited value';

      // Closing the editor.
      keyDownUp('enter');

      expect(getData()).toEqual([['Edited value'], [null], [null], [null], [null]]);
    });

    it('should populate merged cells properly (merge area from visible cell to visible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: [
          { row: 1, col: 0, rowspan: 3, colspan: 1 }
        ]
      });

      // Click on the first visible cell (merged area).
      simulateClick(spec().$container.find('tr:eq(0) td:eq(0)'));
      spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
      spec().$container.find('tbody tr:eq(1) td:eq(4)').simulate('mouseover').simulate('mouseup');

      // TODO Empty strings should be equal to the `null` probably.
      expect(getData()).toEqual([
        ['A1', 'B1', 'C1', 'D1', 'E1'],
        ['A2', 'A2', 'A2', 'A2', 'A2'],
        [null, '', '', '', ''],
        [null, '', '', '', ''],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
      ]);
    });

    it('should populate merged cells properly (merge area from invisible cell to visible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: [
          { row: 0, col: 0, rowspan: 4, colspan: 1 }
        ]
      });

      // Click on the first visible cell (merged area).
      simulateClick(spec().$container.find('tr:eq(0) td:eq(0)'));
      spec().$container.find('.ht_master .wtBorder.current.corner').simulate('mousedown');
      spec().$container.find('tbody tr:eq(1) td:eq(4)').simulate('mouseover').simulate('mouseup');

      // TODO Empty strings should be equal to the `null` probably.
      expect(getData()).toEqual([
        ['A1', 'A1', 'A1', 'A1', 'A1'],
        [null, '', '', '', ''],
        [null, '', '', '', ''],
        [null, '', '', '', ''],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
      ]);
    });

    it('should populate merged cells properly (merge area from visible cell to invisible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: [
          { row: 1, col: 0, rowspan: 4, colspan: 1 }
        ],
      });

      // Click on the first visible cell (merged area).
      simulateClick(spec().$container.find('tr:eq(0) td:eq(0)'));
      spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
      spec().$container.find('tbody tr:eq(1) td:eq(4)').simulate('mouseover').simulate('mouseup');

      // TODO Empty strings should be equal to the `null` probably.
      expect(getData()).toEqual([
        ['A1', 'B1', 'C1', 'D1', 'E1'],
        ['A2', 'A2', 'A2', 'A2', 'A2'],
        [null, '', '', '', ''],
        [null, '', '', '', ''],
        [null, '', '', '', ''],
      ]);
    });

    it('should populate merged cells properly (merge area from invisible cell to invisible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: [
          { row: 0, col: 0, rowspan: 5, colspan: 1 }
        ],
      });

      // Click on the first visible cell (merged area).
      simulateClick(spec().$container.find('tr:eq(0) td:eq(0)'));
      spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
      spec().$container.find('tbody tr:eq(1) td:eq(4)').simulate('mouseover').simulate('mouseup');

      // TODO Empty strings should be equal to the `null` probably.
      expect(getData()).toEqual([
        ['A1', 'A1', 'A1', 'A1', 'A1'],
        [null, '', '', '', ''],
        [null, '', '', '', ''],
        [null, '', '', '', ''],
        [null, '', '', '', ''],
      ]);
    });

    it('should select single merged area properly when it starts with hidden row', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1],
          indicators: true
        },
        mergeCells: [{ row: 1, col: 1, rowspan: 3, colspan: 3 }]
      });

      const mergedCell = spec().$container.find('tr:eq(2) td:eq(1)');

      simulateClick(mergedCell);

      // Third row is not displayed (CSS - display: none).
      expect(`
      |   ║   : - : - : - :   |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | - ║   : # :   :   :   |
      | - ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 1, 3, 3]]);
      expect(getSelectedRangeLast().highlight.row).toBe(2);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(1);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(3);
      expect(getSelectedRangeLast().to.col).toBe(3);
      expect($(mergedCell).hasClass('fullySelectedMergedCell')).toBeFalse();
      expect($(mergedCell).hasClass('fullySelectedMergedCell-multiple')).toBeFalse();
      expect($(mergedCell).hasClass('fullySelectedMergedCell-0')).toBeFalse();
      expect($(mergedCell).hasClass('fullySelectedMergedCell-1')).toBeFalse();
      expect($(mergedCell).hasClass('fullySelectedMergedCell-2')).toBeFalse();
      expect($(mergedCell).hasClass('fullySelectedMergedCell-3')).toBeFalse();
      expect($(mergedCell).hasClass('fullySelectedMergedCell-4')).toBeFalse();
      expect($(mergedCell).hasClass('fullySelectedMergedCell-5')).toBeFalse();
      expect($(mergedCell).hasClass('fullySelectedMergedCell-6')).toBeFalse();
      expect($(mergedCell).hasClass('fullySelectedMergedCell-7')).toBeFalse();
    });

    it('should select cells properly when there is a merged area within the selection' +
      '(selecting from non-merged cell to the merged cell; from the left to the right)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        hiddenRows: {
          rows: [1],
          indicators: true
        },
        mergeCells: [{ row: 1, col: 1, rowspan: 3, colspan: 1 }]
      });

      const dragStart = spec().$container.find('tr:eq(2) td:eq(0)');
      const dragEnd = spec().$container.find('tr:eq(2) td:eq(1)'); // Merged cell.

      mouseDown(dragStart);
      mouseOver(dragEnd);
      mouseUp(dragEnd);

      // Third row is not displayed (CSS - display: none).
      expect(`
      |   ║ - : - :   :   :   |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | - ║ A : 0 :   :   :   |
      | - ║ 0 :   :   :   :   |
      |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 0, 3, 1]]);
      expect(getSelectedRangeLast().highlight.row).toBe(2);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(1);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(3);
      expect(getSelectedRangeLast().to.col).toBe(1);
      expect($(dragEnd).hasClass('fullySelectedMergedCell')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-multiple')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-0')).toBeTrue();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-1')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-2')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-3')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-4')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-5')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-6')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-7')).toBeFalse();
    });

    it('should select cells properly when there is a merged area within the selection' +
      '(selecting from non-merged cell to the merged cell; from the top to the bottom)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        hiddenRows: {
          rows: [1],
          indicators: true
        },
        mergeCells: [{ row: 1, col: 1, rowspan: 3, colspan: 1 }]
      });

      const dragStart = spec().$container.find('tr:eq(1) td:eq(1)');
      const dragEnd = spec().$container.find('tr:eq(2) td:eq(1)'); // Merged cell.

      mouseDown(dragStart);
      mouseOver(dragEnd);
      mouseUp(dragEnd);

      // Third row is not displayed (CSS - display: none).
      expect(`
      |   ║   : - :   :   :   |
      |===:===:===:===:===:===|
      | - ║   : A :   :   :   |
      | - ║   : 0 :   :   :   |
      | - ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[0, 1, 3, 1]]);
      expect(getSelectedRangeLast().highlight.row).toBe(0);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(0);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(3);
      expect(getSelectedRangeLast().to.col).toBe(1);
      expect($(dragEnd).hasClass('fullySelectedMergedCell')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-multiple')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-0')).toBeTrue();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-1')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-2')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-3')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-4')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-5')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-6')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-7')).toBeFalse();
    });

    it('should select cells properly when there is a merged area within the selection' +
      '(selecting from non-merged cell to the merged cell; from the right to the left)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        hiddenRows: {
          rows: [1],
          indicators: true
        },
        mergeCells: [{ row: 1, col: 1, rowspan: 3, colspan: 1 }]
      });

      const dragStart = spec().$container.find('tr:eq(2) td:eq(2)');
      const dragEnd = spec().$container.find('tr:eq(2) td:eq(1)'); // Merged cell.

      mouseDown(dragStart);
      mouseOver(dragEnd);
      mouseUp(dragEnd);

      // Third row is not displayed (CSS - display: none).
      expect(`
      |   ║   : - : - :   :   |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | - ║   : 0 : A :   :   |
      | - ║   :   : 0 :   :   |
      |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 2, 3, 1]]);
      expect(getSelectedRangeLast().highlight.row).toBe(2);
      expect(getSelectedRangeLast().highlight.col).toBe(2);
      expect(getSelectedRangeLast().from.row).toBe(1);
      expect(getSelectedRangeLast().from.col).toBe(2);
      expect(getSelectedRangeLast().to.row).toBe(3);
      expect(getSelectedRangeLast().to.col).toBe(1);
      expect($(dragEnd).hasClass('fullySelectedMergedCell')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-multiple')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-0')).toBeTrue();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-1')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-2')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-3')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-4')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-5')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-6')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-7')).toBeFalse();
    });

    it('should select cells properly when there is a merged area within the selection' +
      '(selecting from non-merged cell to the merged cell; from the bottom to the top)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        hiddenRows: {
          rows: [1],
          indicators: true
        },
        mergeCells: [{ row: 1, col: 1, rowspan: 3, colspan: 1 }]
      });

      // There is one `TD` element with `display: none`, just before the cell.
      const dragStart = spec().$container.find('tr:eq(4) td:eq(1)');
      const dragEnd = spec().$container.find('tr:eq(2) td:eq(1)'); // Merged cell.

      mouseDown(dragStart);
      mouseOver(dragEnd);
      mouseUp(dragEnd);

      // Third row is not displayed (CSS - display: none).
      expect(`
      |   ║   : - :   :   :   |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | - ║   : 0 :   :   :   |
      | - ║   :   :   :   :   |
      | - ║   : A :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[4, 1, 1, 1]]);
      expect(getSelectedRangeLast().highlight.row).toBe(4);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(4);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(1);
      expect(getSelectedRangeLast().to.col).toBe(1);
      expect($(dragEnd).hasClass('fullySelectedMergedCell')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-multiple')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-0')).toBeTrue();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-1')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-2')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-3')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-4')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-5')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-6')).toBeFalse();
      expect($(dragEnd).hasClass('fullySelectedMergedCell-7')).toBeFalse();
    });

    it('should select cells properly when there is a merged area within the selection' +
      '(selecting from the merged cell to non-merged cell; from the left to the right)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        hiddenRows: {
          rows: [1],
          indicators: true
        },
        mergeCells: [{ row: 1, col: 1, rowspan: 3, colspan: 1 }]
      });

      const dragStart = spec().$container.find('tr:eq(2) td:eq(1)'); // Merged cell.
      const dragEnd = spec().$container.find('tr:eq(2) td:eq(2)');

      mouseDown(dragStart);
      mouseOver(dragEnd);
      mouseUp(dragEnd);

      // Third column is not displayed (CSS - display: none).
      expect(`
      |   ║   : - : - :   :   |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | - ║   : A : 0 :   :   |
      | - ║   :   : 0 :   :   |
      |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 1, 3, 2]]);
      expect(getSelectedRangeLast().highlight.row).toBe(2);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(1);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(3);
      expect(getSelectedRangeLast().to.col).toBe(2);
      expect($(dragStart).hasClass('fullySelectedMergedCell')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-multiple')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-0')).toBeTrue();
      expect($(dragStart).hasClass('fullySelectedMergedCell-1')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-2')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-3')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-4')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-5')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-6')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-7')).toBeFalse();
    });

    it('should select cells properly when there is a merged area within the selection' +
      '(selecting from the merged cell to non-merged cell; from the top to the bottom)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        hiddenRows: {
          rows: [1],
          indicators: true
        },
        mergeCells: [{ row: 1, col: 1, rowspan: 3, colspan: 1 }]
      });

      const dragStart = spec().$container.find('tr:eq(2) td:eq(1)'); // Merged cell.
      const dragEnd = spec().$container.find('tr:eq(4) td:eq(1)');

      mouseDown(dragStart);
      mouseOver(dragEnd);
      mouseUp(dragEnd);

      // Third row is not displayed (CSS - display: none).
      expect(`
      |   ║   : - :   :   :   |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | - ║   : A :   :   :   |
      | - ║   :   :   :   :   |
      | - ║   : 0 :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 1, 4, 1]]);
      expect(getSelectedRangeLast().highlight.row).toBe(2);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(1);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(1);
      expect($(dragStart).hasClass('fullySelectedMergedCell')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-multiple')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-0')).toBeTrue();
      expect($(dragStart).hasClass('fullySelectedMergedCell-1')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-2')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-3')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-4')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-5')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-6')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-7')).toBeFalse();
    });

    it('should select cells properly when there is a merged area within the selection' +
      '(selecting from the merged cell to non-merged cell; from the right to the left)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        hiddenRows: {
          rows: [1],
          indicators: true
        },
        mergeCells: [{ row: 1, col: 1, rowspan: 3, colspan: 1 }]
      });

      const dragStart = spec().$container.find('tr:eq(2) td:eq(1)'); // Merged cell.
      const dragEnd = spec().$container.find('tr:eq(2) td:eq(0)');

      mouseDown(dragStart);
      mouseOver(dragEnd);
      mouseUp(dragEnd);

      // Third row is not displayed (CSS - display: none).
      expect(`
      |   ║ - : - :   :   :   |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | - ║ 0 : A :   :   :   |
      | - ║ 0 :   :   :   :   |
      |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 1, 3, 0]]);
      expect(getSelectedRangeLast().highlight.row).toBe(2);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(1);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(3);
      expect(getSelectedRangeLast().to.col).toBe(0);
      expect($(dragStart).hasClass('fullySelectedMergedCell')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-multiple')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-0')).toBeTrue();
      expect($(dragStart).hasClass('fullySelectedMergedCell-1')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-2')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-3')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-4')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-5')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-6')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-7')).toBeFalse();
    });

    it('should select cells properly when there is a merged area within the selection' +
      '(selecting from the merged cell to non-merged cell; from the bottom to the top', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        hiddenRows: {
          rows: [1],
          indicators: true
        },
        mergeCells: [{ row: 1, col: 1, rowspan: 3, colspan: 1 }]
      });

      const dragStart = spec().$container.find('tr:eq(2) td:eq(1)'); // Merged cell.
      const dragEnd = spec().$container.find('tr:eq(1) td:eq(1)');

      mouseDown(dragStart);
      mouseOver(dragEnd);
      mouseUp(dragEnd);

      // Third row is not displayed (CSS - display: none).
      expect(`
      |   ║   : - :   :   :   |
      |===:===:===:===:===:===|
      | - ║   : 0 :   :   :   |
      | - ║   : A :   :   :   |
      | - ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[3, 1, 0, 1]]);
      expect(getSelectedRangeLast().highlight.row).toBe(3);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(3);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(0);
      expect(getSelectedRangeLast().to.col).toBe(1);
      expect($(dragStart).hasClass('fullySelectedMergedCell')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-multiple')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-0')).toBeTrue();
      expect($(dragStart).hasClass('fullySelectedMergedCell-1')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-2')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-3')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-4')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-5')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-6')).toBeFalse();
      expect($(dragStart).hasClass('fullySelectedMergedCell-7')).toBeFalse();
    });

    it('should add highlight to an area of merged cells only when selected every merged cell', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        hiddenRows: {
          rows: [1],
          indicators: true
        },
        mergeCells: [{ row: 1, col: 1, rowspan: 3, colspan: 1 }]
      });

      const mergeArea = spec().$container.find('tr:eq(2) td:eq(1)');

      selectRows(2, 3);

      expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | * ║ A : 0 : 0 : 0 : 0 |
      | * ║ 0 :   : 0 : 0 : 0 |
      |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[2, -1, 3, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(2);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(2);
      expect(getSelectedRangeLast().from.col).toBe(-1);
      expect(getSelectedRangeLast().to.row).toBe(3);
      expect(getSelectedRangeLast().to.col).toBe(4);
      expect($(mergeArea).hasClass('fullySelectedMergedCell')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-multiple')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-0')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-1')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-2')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-3')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-4')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-5')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-6')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-7')).toBeFalse();

      selectRows(1, 3);

      expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | * ║ A : 0 : 0 : 0 : 0 |
      | * ║ 0 :   : 0 : 0 : 0 |
      |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, -1, 3, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(2);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(1);
      expect(getSelectedRangeLast().from.col).toBe(-1);
      expect(getSelectedRangeLast().to.row).toBe(3);
      expect(getSelectedRangeLast().to.col).toBe(4);
      expect($(mergeArea).hasClass('fullySelectedMergedCell')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-multiple')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-0')).toBeTrue();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-1')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-2')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-3')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-4')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-5')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-6')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-7')).toBeFalse();
    });

    it('should add proper highlight to an area of merged cells when selected every cell ' +
      '(few layers, every layer contain merge area)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        hiddenRows: {
          rows: [1],
          indicators: true
        },
        mergeCells: [{ row: 1, col: 1, rowspan: 3, colspan: 1 }]
      });

      const mergeArea = spec().$container.find('tr:eq(2) td:eq(1)');

      // Selected 3 ranges containing merged area.
      selectCells([[1, 0, 3, 4], [1, 0, 3, 4], [1, 0, 3, 4]]);

      expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | - ║ C : 2 : 2 : 2 : 2 |
      | - ║ 2 :   : 2 : 2 : 2 |
      |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 0, 3, 4], [1, 0, 3, 4], [1, 0, 3, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(2);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(1);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(3);
      expect(getSelectedRangeLast().to.col).toBe(4);
      expect($(mergeArea).hasClass('fullySelectedMergedCell')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-multiple')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-0')).toBeTrue();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-1')).toBeTrue();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-2')).toBeTrue();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-3')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-4')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-5')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-6')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-7')).toBeFalse();
    });

    it('should add proper highlight to an area of merged cells when selected every cell ' +
      '(few layers, every layer contain part of merge area)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        hiddenRows: {
          rows: [1],
          indicators: true
        },
        mergeCells: [{ row: 1, col: 1, rowspan: 3, colspan: 1 }]
      });

      const mergeArea = spec().$container.find('tr:eq(2) td:eq(1)');

      // Selected 2 ranges containing together merged area.
      selectRows(1);
      keyDown('ctrl');
      selectRows(3);
      keyDown('ctrl');
      selectRows(2);

      expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | * ║ A : 1 : 0 : 0 : 0 |
      | * ║ 0 :   : 0 : 0 : 0 |
      |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, -1, 1, 4], [3, -1, 3, 4], [2, -1, 2, 4]]);
      expect(getSelectedRangeLast().highlight.row).toBe(2);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(2);
      expect(getSelectedRangeLast().from.col).toBe(-1);
      expect(getSelectedRangeLast().to.row).toBe(2);
      expect(getSelectedRangeLast().to.col).toBe(4);
      expect($(mergeArea).hasClass('fullySelectedMergedCell')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-multiple')).toBeTrue();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-0')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-1')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-2')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-3')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-4')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-5')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-6')).toBeFalse();
      expect($(mergeArea).hasClass('fullySelectedMergedCell-7')).toBeFalse();
    });
  });
});
