describe('MergeCells cooperation with hidden columns', () => {
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

  using('DOM virtualization as', [false, true], (virtualized) => {
    it('should display properly merged cells based on the settings', () => {
      handsontable({
        data: createSpreadsheetObjectData(5, 5),
        mergeCells: {
          virtualized,
          cells: [
            { row: 0, col: 0, rowspan: 2, colspan: 3 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(1, true);
      render();
      selectCell(0, 0);

      expect(getData()).toEqual([
        ['A1', null, null, 'D1', 'E1'],
        [null, null, null, 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
      ]);
      expect(`
        | #     :   :   |
        |       :   :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
      `).toBeMatchToSelectionPattern();

      columnMapper.setValueAtIndex(1, false);
      render();

      expect(`
        | #         :   :   |
        |           :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      columnMapper.setValueAtIndex(1, true);
      render();

      expect(`
        | #     :   :   |
        |       :   :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should display properly merged cells containing hidden columns (merge area from visible cell to visible cell)', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized
        }
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      getPlugin('mergeCells').merge(0, 1, 0, 3);

      // Merged from visual column index 1 (visible) to visual column index 3 (visible).
      //                                |     merge     |
      expect(getData()).toEqual([['A1', 'B1', null, null, 'E1']]);
      expect(getHtCore().find('td:first').text()).toBe('B1');

      expect(`
        |       |
      `).toBeMatchToSelectionPattern();

      columnMapper.setValueAtIndex(2, false);
      render();

      expect(`
        |           |
      `).toBeMatchToSelectionPattern();

      columnMapper.setValueAtIndex(2, true);
      render();

      expect(`
        |       |
      `).toBeMatchToSelectionPattern();

      columnMapper.setValueAtIndex(0, false);
      columnMapper.setValueAtIndex(2, false);
      columnMapper.setValueAtIndex(4, false);
      render();

      expect(`
        |   :           :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should display properly merged cells containing hidden columns (merge area from invisible cell to visible cell)', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized
        }
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      getPlugin('mergeCells').merge(0, 0, 0, 3);

      // Merged from visual column index 0 (invisible) to visual column index 3 (visible).
      //                         |        merge         |
      expect(getData()).toEqual([['A1', null, null, null, 'E1']]);

      expect(`
        |       |
      `).toBeMatchToSelectionPattern();

      columnMapper.setValueAtIndex(0, false);
      render();

      expect(getHtCore().find('td:first').text()).toBe('A1');
      expect(`
        |           |
      `).toBeMatchToSelectionPattern();

      columnMapper.setValueAtIndex(2, false);
      render();

      expect(`
        |               |
      `).toBeMatchToSelectionPattern();

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      render();

      expect(`
        |       |
      `).toBeMatchToSelectionPattern();

      columnMapper.setValueAtIndex(0, false);
      columnMapper.setValueAtIndex(2, false);
      columnMapper.setValueAtIndex(4, false);
      render();

      expect(`
        |               :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should display properly merged cells containing hidden columns (merge area from visible cell to invisible cell)', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized
        }
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      getPlugin('mergeCells').merge(0, 1, 0, 4);

      // Merged from visual column index 1 (visible) to visual column index 4 (invisible).
      //                                |        merge        |
      expect(getData()).toEqual([['A1', 'B1', null, null, null]]);
      expect(getHtCore().find('td:first').text()).toBe('B1');
      expect(`
        |       |
      `).toBeMatchToSelectionPattern();

      columnMapper.setValueAtIndex(2, false);
      render();

      expect(`
        |           |
      `).toBeMatchToSelectionPattern();

      columnMapper.setValueAtIndex(4, false);
      render();

      expect(`
        |               |
      `).toBeMatchToSelectionPattern();

      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      expect(`
        |       |
      `).toBeMatchToSelectionPattern();

      columnMapper.setValueAtIndex(0, false);
      columnMapper.setValueAtIndex(2, false);
      columnMapper.setValueAtIndex(4, false);
      render();

      expect(`
        |   :               |
      `).toBeMatchToSelectionPattern();
    });

    it('should display properly merged cells containing hidden columns (merge area from invisible cell to invisible cell)', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized
        }
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      getPlugin('mergeCells').merge(0, 0, 0, 4);

      // Merged from visual column index 0 (invisible) to visual column index 4 (invisible).
      //                          |           merge           |
      expect(getData()).toEqual([['A1', null, null, null, null]]);

      expect(`
        |       |
      `).toBeMatchToSelectionPattern();

      columnMapper.setValueAtIndex(0, false);
      render();

      expect(getHtCore().find('td:first').text()).toBe('A1');
      expect(`
        |           |
      `).toBeMatchToSelectionPattern();

      columnMapper.setValueAtIndex(2, false);
      render();

      expect(`
        |               |
      `).toBeMatchToSelectionPattern();

      columnMapper.setValueAtIndex(4, false);
      render();

      expect(`
        |                   |
      `).toBeMatchToSelectionPattern();

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      expect(`
        |       |
      `).toBeMatchToSelectionPattern();

      columnMapper.setValueAtIndex(0, false);
      columnMapper.setValueAtIndex(2, false);
      columnMapper.setValueAtIndex(4, false);
      render();

      expect(`
        |                   |
      `).toBeMatchToSelectionPattern();
    });

    it('should return proper values from the `getCell` function', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized
        }
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      getPlugin('mergeCells').merge(0, 1, 0, 3);

      expect(getCell(0, 0)).toBe(null);
      expect(getCell(0, 1)).toBe(getHtCore().find('td')[0]);
      expect(getCell(0, 2)).toBe(null);
      expect(getCell(0, 3)).toBe(getHtCore().find('td')[0]);
      expect(getCell(0, 4)).toBe(null);

      columnMapper.setValueAtIndex(2, false);
      render();

      expect(getCell(0, 0)).toBe(null);
      expect(getCell(0, 1)).toBe(getHtCore().find('td')[0]);
      expect(getCell(0, 2)).toBe(getHtCore().find('td')[0]);
      expect(getCell(0, 3)).toBe(getHtCore().find('td')[0]);
      expect(getCell(0, 4)).toBe(null);
    });

    it('should translate column indexes properly - regression check', () => {
      // An error have been thrown and too many columns have been drawn in the specific case. There haven't been done
      // index translation (from renderable to visual columns indexes and the other way around).
      handsontable({
        data: createSpreadsheetData(1, 7),
        mergeCells: {
          virtualized
        }
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      render();

      getPlugin('mergeCells').merge(0, 3, 0, 5);

      // The same as at the start.
      expect(getHtCore().find('td').length).toBe(5);
      expect(`
        |   :           :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select proper cells when calling the `selectCell` within area of merge ' +
      '(contains few hidden columns)', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized,
          cells: [
            { row: 0, col: 1, rowspan: 1, colspan: 4 }
          ]
        }
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      render();

      // First visible cell (merged area).
      const $mergeArea = spec().$container.find('tr:eq(0) td:eq(0)');

      selectCell(0, 1);

      // Second and third columns are not displayed (CSS - display: none).
      expect(`
        | #         |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,4']);
      expect($mergeArea.hasClass('area')).toBeFalse();
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
      selectCell(0, 2);

      // Second and third columns are not displayed (CSS - display: none).
      expect(`
        | #         |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,4']);
      expect($mergeArea.hasClass('area')).toBeFalse();
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
      selectCell(0, 3);

      // Second and third columns are not displayed (CSS - display: none).
      expect(`
      | #         |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,4']);
      expect($mergeArea.hasClass('area')).toBeFalse();
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
      selectCell(0, 4);

      expect(`
      | #         |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,4']);
      expect($mergeArea.hasClass('area')).toBeFalse();
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

    it('should select proper cells when calling the `selectCell` within area of merge ' +
      '(contains just one hidden and one not hidden column)', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized,
          cells: [
            { row: 0, col: 0, rowspan: 1, colspan: 2 }
          ]
        }
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      render();

      // First visible cell (merged area).
      const $mergeArea = spec().$container.find('tr:eq(0) td:eq(0)');

      selectCell(0, 0);

      expect(`
        | # :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,0 to: 0,1']);
      expect($mergeArea.hasClass('area')).toBeFalse();
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
      selectCell(0, 1);

      expect(`
        | # :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,0 to: 0,1']);
      expect($mergeArea.hasClass('area')).toBeFalse();
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
      '(contains just one hidden and one not hidden column) + singe cell', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized,
          cells: [
            { row: 0, col: 0, rowspan: 1, colspan: 2 }
          ]
        }
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      render();

      // First visible cell (merged area).
      const $mergeArea = spec().$container.find('tr:eq(0) td:eq(0)');

      selectCells([[0, 1], [0, 4]]);

      expect(`
        | 0 :   :   : A |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,1 from: 0,0 to: 0,1',
        'highlight: 0,4 from: 0,4 to: 0,4',
      ]);
      expect($mergeArea.hasClass('area')).toBeTrue();
      expect($mergeArea.hasClass('fullySelectedMergedCell')).toBeFalse();
      expect($mergeArea.hasClass('fullySelectedMergedCell-multiple')).toBeFalse();
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

    it('should open properly merged cells containing hidden columns (merge area from visible cell to visible cell)', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized,
        }
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      getPlugin('mergeCells').merge(0, 1, 0, 3);

      selectCell(0, 1);
      keyDownUp('F2');

      let editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('B1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(0, 2);
      keyDownUp('F2');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('B1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(0, 3);
      keyDownUp('F2');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('B1');

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
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('B1');
    });

    it('should open properly merged cells containing hidden columns (merge area from invisible cell to visible cell)', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized,
        }
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      getPlugin('mergeCells').merge(0, 0, 0, 3);

      selectCell(0, 0);
      keyDownUp('F2');

      let editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(0, 1);
      keyDownUp('F2');

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(0, 2);
      keyDownUp('F2');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(0, 3);
      keyDownUp('F2');

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

    it('should open properly merged cells containing hidden columns (merge area from visible cell to invisible cell)', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized,
        }
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      getPlugin('mergeCells').merge(0, 1, 0, 4);

      selectCell(0, 1);
      keyDownUp('F2');

      let editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('B1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(0, 2);
      keyDownUp('F2');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('B1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(0, 3);
      keyDownUp('F2');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('B1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(0, 4);
      keyDownUp('F2');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('B1');

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
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('B1');
    });

    it('should open properly merged cells containing hidden columns (merge area from invisible cell to invisible cell)', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized,
        }
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      getPlugin('mergeCells').merge(0, 0, 0, 4);

      selectCell(0, 0);
      keyDownUp('F2');

      let editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(0, 1);
      keyDownUp('F2');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(0, 2);
      keyDownUp('F2');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(0, 3);
      keyDownUp('F2');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      selectCell(0, 4);
      keyDownUp('F2');

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
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized,
          cells: [
            { row: 0, col: 1, rowspan: 1, colspan: 3 }
          ]
        }
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      const textarea = spec().$container.find('.handsontableInputHolder textarea')[0];

      textarea.value = 'Edited value';

      // Closing the editor.
      keyDownUp('enter');

      expect(getData()).toEqual([['A1', 'Edited value', null, null, 'E1']]);
    });

    it('should edit merged cells properly (merge area from invisible cell to visible cell)', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized,
          cells: [
            { row: 0, col: 0, rowspan: 1, colspan: 4 }
          ]
        }
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      const textarea = spec().$container.find('.handsontableInputHolder textarea')[0];

      textarea.value = 'Edited value';

      // Closing the editor.
      keyDownUp('enter');

      expect(getData()).toEqual([['Edited value', null, null, null, 'E1']]);
    });

    it('should edit merged cells properly (merge area from visible cell to invisible cell)', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized,
          cells: [
            { row: 0, col: 1, rowspan: 1, colspan: 4 }
          ]
        }
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      const textarea = spec().$container.find('.handsontableInputHolder textarea')[0];

      textarea.value = 'Edited value';

      // Closing the editor.
      keyDownUp('enter');

      expect(getData()).toEqual([['A1', 'Edited value', null, null, null]]);
    });

    it('should edit merged cells properly (merge area from invisible cell to invisible cell)', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized,
          cells: [
            { row: 0, col: 0, rowspan: 1, colspan: 5 }
          ]
        }
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      const textarea = spec().$container.find('.handsontableInputHolder textarea')[0];

      textarea.value = 'Edited value';

      // Closing the editor.
      keyDownUp('enter');

      expect(getData()).toEqual([['Edited value', null, null, null, null]]);
    });

    it('should work properly when hidden column is read only', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized,
          cells: [
            { row: 0, col: 0, rowspan: 1, colspan: 5 }
          ]
        },
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

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      let editor = getActiveEditor();

      expect(editor).toBeUndefined();

      // Try of opening the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor).toBeUndefined();
    });

    it('should work properly when editor is set to `false` for hidden column', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized,
          cells: [
            { row: 0, col: 0, rowspan: 1, colspan: 5 }
          ]
        },
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

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

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
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized,
          cells: [
            { row: 0, col: 1, rowspan: 1, colspan: 3 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      const textarea = spec().$container.find('.handsontableInputHolder textarea')[0];

      textarea.value = 'Edited value';

      // Closing the editor.
      keyDownUp('enter');

      expect(getData()).toEqual([['A1', 'Edited value', null, null, 'E1']]);
    });

    it('should edit merged cells properly (merge area from invisible cell to visible cell)', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized,
          cells: [
            { row: 0, col: 0, rowspan: 1, colspan: 4 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      const textarea = spec().$container.find('.handsontableInputHolder textarea')[0];

      textarea.value = 'Edited value';

      // Closing the editor.
      keyDownUp('enter');

      expect(getData()).toEqual([['Edited value', null, null, null, 'E1']]);
    });

    it('should edit merged cells properly (merge area from visible cell to invisible cell)', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized,
          cells: [
            { row: 0, col: 1, rowspan: 1, colspan: 4 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      const textarea = spec().$container.find('.handsontableInputHolder textarea')[0];

      textarea.value = 'Edited value';

      // Closing the editor.
      keyDownUp('enter');

      expect(getData()).toEqual([['A1', 'Edited value', null, null, null]]);
    });

    it('should edit merged cells properly (merge area from invisible cell to invisible cell)', () => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        mergeCells: {
          virtualized,
          cells: [
            { row: 0, col: 0, rowspan: 1, colspan: 5 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      // Double click on the first visible cell (merged area).
      mouseDoubleClick(spec().$container.find('tr:eq(0) td:eq(0)'));

      const textarea = spec().$container.find('.handsontableInputHolder textarea')[0];

      textarea.value = 'Edited value';

      // Closing the editor.
      keyDownUp('enter');

      expect(getData()).toEqual([['Edited value', null, null, null, null]]);
    });

    it('should populate merged cells properly (merge area from visible cell to visible cell)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: {
          virtualized,
          cells: [
            { row: 0, col: 1, rowspan: 1, colspan: 3 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      // Click on the first visible cell (merged area).
      simulateClick(spec().$container.find('tr:eq(0) td:eq(0)'));
      spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
      spec().$container.find('tbody tr:eq(4) td:eq(1)').simulate('mouseover').simulate('mouseup');

      // TODO Empty strings should be equal to the `null` probably.
      expect(getData()).toEqual([
        ['A1', 'B1', null, null, 'E1'],
        ['A2', 'B1', '', '', 'E2'],
        ['A3', 'B1', '', '', 'E3'],
        ['A4', 'B1', '', '', 'E4'],
        ['A5', 'B1', '', '', 'E5'],
      ]);
    });

    it('should populate merged cells properly (merge area from invisible cell to visible cell)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: {
          virtualized,
          cells: [
            { row: 0, col: 0, rowspan: 1, colspan: 4 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      // Click on the first visible cell (merged area).
      simulateClick(spec().$container.find('tr:eq(0) td:eq(0)'));
      spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
      spec().$container.find('tbody tr:eq(4) td:eq(1)').simulate('mouseover').simulate('mouseup');

      // TODO Empty strings should be equal to the `null` probably.
      expect(getData()).toEqual([
        ['A1', null, null, null, 'E1'],
        ['A1', '', '', '', 'E2'],
        ['A1', '', '', '', 'E3'],
        ['A1', '', '', '', 'E4'],
        ['A1', '', '', '', 'E5'],
      ]);
    });

    it('should populate merged cells properly (merge area from visible cell to invisible cell)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: {
          virtualized,
          cells: [
            { row: 0, col: 1, rowspan: 1, colspan: 4 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      // Click on the first visible cell (merged area).
      simulateClick(spec().$container.find('tr:eq(0) td:eq(0)'));
      spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
      spec().$container.find('tbody tr:eq(4) td:eq(1)').simulate('mouseover').simulate('mouseup');

      // TODO Empty strings should be equal to the `null` probably.
      expect(getData()).toEqual([
        ['A1', 'B1', null, null, null],
        ['A2', 'B1', '', '', ''],
        ['A3', 'B1', '', '', ''],
        ['A4', 'B1', '', '', ''],
        ['A5', 'B1', '', '', ''],
      ]);
    });

    it('should populate merged cells properly (merge area from invisible cell to invisible cell)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: {
          virtualized,
          cells: [
            { row: 0, col: 0, rowspan: 1, colspan: 5 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(2, true);
      columnMapper.setValueAtIndex(4, true);
      render();

      // Click on the first visible cell (merged area).
      simulateClick(spec().$container.find('tr:eq(0) td:eq(0)'));
      spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
      spec().$container.find('tbody tr:eq(4) td:eq(1)').simulate('mouseover').simulate('mouseup');

      // TODO Empty strings should be equal to the `null` probably.
      expect(getData()).toEqual([
        ['A1', null, null, null, null],
        ['A1', '', '', '', ''],
        ['A1', '', '', '', ''],
        ['A1', '', '', '', ''],
        ['A1', '', '', '', ''],
      ]);
    });

    it('should select single merged area properly when it starts with hidden column', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: {
          virtualized,
          cells: [
            { row: 1, col: 1, rowspan: 3, colspan: 3 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(1, true);
      render();

      const mergedCell = spec().$container.find('tr:eq(2) td:eq(1)');

      simulateClick(mergedCell);

      // Third column is not displayed (CSS - display: none).
      expect(`
      |   ║   : - : - :   |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      | - ║   : #     :   |
      | - ║   :       :   |
      | - ║   :       :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,1 to: 3,3']);
      expect($(mergedCell).hasClass('area')).toBeFalse();
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
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        mergeCells: {
          virtualized,
          cells: [
            { row: 1, col: 1, rowspan: 1, colspan: 3 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(1, true);
      render();

      const dragStart = spec().$container.find('tr:eq(2) td:eq(0)');
      const dragEnd = spec().$container.find('tr:eq(2) td:eq(1)'); // Merged cell.

      mouseDown(dragStart);
      mouseOver(dragEnd);
      mouseUp(dragEnd);

      // Third column is not displayed (CSS - display: none).
      expect(`
      |   ║ - : - : - :   |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      | - ║ A : 0     :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,3']);
      expect($(dragEnd).hasClass('area')).toBeTrue();
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
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        mergeCells: {
          virtualized,
          cells: [
            { row: 1, col: 1, rowspan: 1, colspan: 3 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(1, true);
      render();

      const dragStart = spec().$container.find('tr:eq(1) td:eq(1)');
      const dragEnd = spec().$container.find('tr:eq(2) td:eq(1)'); // Merged cell.

      mouseDown(dragStart);
      mouseOver(dragEnd);
      mouseUp(dragEnd);

      // Third column is not displayed (CSS - display: none).
      expect(`
      |   ║   : - : - :   |
      |===:===:===:===:===|
      | - ║   : A : 0 :   |
      | - ║   : 0     :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,1 to: 1,3']);
      expect($(dragEnd).hasClass('area')).toBeTrue();
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
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        mergeCells: {
          virtualized,
          cells: [
            { row: 1, col: 1, rowspan: 1, colspan: 3 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(1, true);
      render();

      // There is one `TD` element with `display: none`, just before the cell.
      const dragStart = spec().$container.find('tr:eq(2) td:eq(3)');
      const dragEnd = spec().$container.find('tr:eq(2) td:eq(1)'); // Merged cell.

      mouseDown(dragStart);
      mouseOver(dragEnd);
      mouseUp(dragEnd);

      // Third column is not displayed (CSS - display: none).
      expect(`
      |   ║   : - : - : - |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      | - ║   : 0     : A |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,4 from: 1,4 to: 1,1']);
      expect($(dragEnd).hasClass('area')).toBeTrue();
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
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        mergeCells: {
          virtualized,
          cells: [
            { row: 1, col: 1, rowspan: 1, colspan: 3 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(1, true);
      render();

      // There is one `TD` element with `display: none`, just before the cell.
      const dragStart = spec().$container.find('tr:eq(3) td:eq(1)');
      const dragEnd = spec().$container.find('tr:eq(2) td:eq(1)'); // Merged cell.

      mouseDown(dragStart);
      mouseOver(dragEnd);
      mouseUp(dragEnd);

      // Third column is not displayed (CSS - display: none).
      expect(`
      |   ║   : - : - :   |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      | - ║   : 0     :   |
      | - ║   : A : 0 :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,3 to: 1,1']);
      expect($(dragEnd).hasClass('area')).toBeTrue();
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
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        mergeCells: {
          virtualized,
          cells: [
            { row: 1, col: 1, rowspan: 1, colspan: 3 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(1, true);
      render();

      const dragStart = spec().$container.find('tr:eq(2) td:eq(1)'); // Merged cell.
      // There is one `TD` element with `display: none`, just before the cell.
      const dragEnd = spec().$container.find('tr:eq(2) td:eq(3)');

      mouseDown(dragStart);
      mouseOver(dragEnd);
      mouseUp(dragEnd);

      // Third column is not displayed (CSS - display: none).
      expect(`
      |   ║   : - : - : - |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      | - ║   : A     : 0 |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,1 to: 1,4']);
      expect($(dragStart).hasClass('area')).toBeTrue();
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
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        mergeCells: {
          virtualized,
          cells: [
            { row: 1, col: 1, rowspan: 1, colspan: 3 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(1, true);
      render();

      const dragStart = spec().$container.find('tr:eq(2) td:eq(1)'); // Merged cell.
      // There is one `TD` element with `display: none`, just before the cell.
      const dragEnd = spec().$container.find('tr:eq(3) td:eq(1)');

      mouseDown(dragStart);
      mouseOver(dragEnd);
      mouseUp(dragEnd);

      // Third column is not displayed (CSS - display: none).
      expect(`
      |   ║   : - : - :   |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      | - ║   : A     :   |
      | - ║   : 0 : 0 :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,1 to: 2,3']);
      expect($(dragStart).hasClass('area')).toBeTrue();
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
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        mergeCells: {
          virtualized,
          cells: [
            { row: 1, col: 1, rowspan: 1, colspan: 3 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(1, true);
      render();

      const dragStart = spec().$container.find('tr:eq(2) td:eq(1)'); // Merged cell.
      const dragEnd = spec().$container.find('tr:eq(2) td:eq(0)');

      mouseDown(dragStart);
      mouseOver(dragEnd);
      mouseUp(dragEnd);

      // Third column is not displayed (CSS - display: none).
      expect(`
      |   ║ - : - : - :   |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      | - ║ 0 : A     :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,0']);
      expect($(dragStart).hasClass('area')).toBeTrue();
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
      '(selecting from the merged cell to non-merged cell; from the bottom to the top)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        mergeCells: {
          virtualized,
          cells: [
            { row: 1, col: 1, rowspan: 1, colspan: 3 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(1, true);
      render();

      const dragStart = spec().$container.find('tr:eq(2) td:eq(1)'); // Merged cell.
      const dragEnd = spec().$container.find('tr:eq(1) td:eq(1)');

      mouseDown(dragStart);
      mouseOver(dragEnd);
      mouseUp(dragEnd);

      // Third column is not displayed (CSS - display: none).
      expect(`
      |   ║   : - : - :   |
      |===:===:===:===:===|
      | - ║   : 0 : 0 :   |
      | - ║   : A     :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,1 to: 0,3']);
      expect($(dragStart).hasClass('area')).toBeTrue();
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
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        mergeCells: {
          virtualized,
          cells: [
            { row: 1, col: 1, rowspan: 1, colspan: 3 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(1, true);
      render();

      const mergeArea = spec().$container.find('tr:eq(2) td:eq(1)');

      selectColumns(2, 3);

      expect(`
      |   ║   : * : * :   |
      |===:===:===:===:===|
      | - ║   : A : 0 :   |
      | - ║   :       :   |
      | - ║   : 0 : 0 :   |
      | - ║   : 0 : 0 :   |
      | - ║   : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 4,3']);
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

      selectColumns(1, 3);

      expect(`
      |   ║   : * : * :   |
      |===:===:===:===:===|
      | - ║   : A : 0 :   |
      | - ║   : 0     :   |
      | - ║   : 0 : 0 :   |
      | - ║   : 0 : 0 :   |
      | - ║   : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,1 to: 4,3']);
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
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        mergeCells: {
          virtualized,
          cells: [
            { row: 1, col: 1, rowspan: 1, colspan: 3 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(1, true);
      render();

      const mergeArea = spec().$container.find('tr:eq(2) td:eq(1)');

      // Selected 3 ranges containing merged area.
      selectCells([[0, 1, 4, 3], [0, 1, 4, 3], [0, 1, 4, 3]]);

      expect(`
      |   ║   : - : - :   |
      |===:===:===:===:===|
      | - ║   : C : 2 :   |
      | - ║   : 2     :   |
      | - ║   : 2 : 2 :   |
      | - ║   : 2 : 2 :   |
      | - ║   : 2 : 2 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,2 from: 0,1 to: 4,3',
        'highlight: 0,2 from: 0,1 to: 4,3',
        'highlight: 0,2 from: 0,1 to: 4,3',
      ]);
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
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        mergeCells: {
          virtualized,
          cells: [
            { row: 1, col: 1, rowspan: 1, colspan: 3 }
          ]
        },
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(1, true);
      render();

      const mergeArea = spec().$container.find('tr:eq(2) td:eq(1)');

      // After changes introduced in Handsontable 12.0.0 we handle shortcuts only by listening Handsontable.
      // Please keep in mind that selectColumns/selectRows doesn't set instance to listening (see #7290).
      listen();

      // Selected 2 ranges containing together merged area.
      selectColumns(1);

      keyDown('control/meta');

      selectColumns(3);
      selectColumns(2);

      keyUp('control/meta');

      expect(`
      |   ║   : * : * :   |
      |===:===:===:===:===|
      | - ║   : A : 0 :   |
      | - ║   : 0     :   |
      | - ║   : 0 : 0 :   |
      | - ║   : 0 : 0 :   |
      | - ║   : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,1 from: -1,1 to: 4,1',
        'highlight: 0,3 from: -1,3 to: 4,3',
        'highlight: 0,2 from: -1,2 to: 4,2',
      ]);
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

  it('should display properly wide merged cell containing hidden columns', () => {
    handsontable({
      data: createSpreadsheetData(3, 30),
      width: 200,
      height: 200,
      viewportColumnRenderingOffset: 0,
      mergeCells: true,
    });

    const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    columnMapper.setValueAtIndex(0, true);
    columnMapper.setValueAtIndex(1, true);
    columnMapper.setValueAtIndex(2, true);
    columnMapper.setValueAtIndex(5, true);
    render();

    getPlugin('mergeCells').merge(0, 0, 0, 20);
    selectCell(0, 0);

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('A1');
    expect(`
      | #                                                                 |
      |   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   |
      |   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    scrollViewportTo({ row: 0, col: 22 });
    render();

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('W1');
    expect(`
      | #                                                                 :   :   |
      |   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   |
      |   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    scrollViewportTo({ row: 0, col: 25 });
    render();

    expect(getHtCore().find('tr:first td:first').text()).toBe('W1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('Z1');
    expect(`
      |   :   :   :   |
      |   :   :   :   |
      |   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should display properly wide merged cell containing hidden columns (virtualized)', () => {
    handsontable({
      data: createSpreadsheetData(3, 30),
      width: 200,
      height: 200,
      viewportColumnRenderingOffset: 0,
      mergeCells: {
        virtualized: true,
      },
    });

    const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    columnMapper.setValueAtIndex(0, true);
    columnMapper.setValueAtIndex(1, true);
    columnMapper.setValueAtIndex(2, true);
    columnMapper.setValueAtIndex(5, true);
    render();

    getPlugin('mergeCells').merge(0, 0, 0, 20);
    selectCell(0, 0);

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('A1');
    expect(`
      | #             |
      |   :   :   :   |
      |   :   :   :   |
    `).toBeMatchToSelectionPattern();

    scrollViewportTo({ row: 0, col: 22 });
    render();

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('W1');
    expect(`
      | #     :   :   |
      |   :   :   :   |
      |   :   :   :   |
    `).toBeMatchToSelectionPattern();

    scrollViewportTo({ row: 0, col: 25 });
    render();

    expect(getHtCore().find('tr:first td:first').text()).toBe('W1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('Z1');
    expect(`
      |   :   :   :   |
      |   :   :   :   |
      |   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  describe('Hooks', () => {
    it('should trigger the `beforeOnCellMouseDown` hook with proper coords', () => {
      let rowOnCellMouseDown;
      let columnOnCellMouseDown;
      let coordsOnCellMouseDown;

      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 4 }],
        beforeOnCellMouseDown(_, coords) {
          coordsOnCellMouseDown = coords;
          rowOnCellMouseDown = coords.row;
          columnOnCellMouseDown = coords.col;
        }
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(1, true);
      render();

      // Click on the first visible cell (merged area).
      simulateClick(spec().$container.find('tr:eq(1) td:eq(0)'));

      expect(rowOnCellMouseDown).toEqual(0);
      expect(columnOnCellMouseDown).toEqual(2);
      expect(coordsOnCellMouseDown).toEqual(jasmine.objectContaining({ row: 0, col: 2 }));
    });

    it('should trigger the `afterOnCellMouseDown` hook with proper coords', () => {
      let rowOnCellMouseDown;
      let columnOnCellMouseDown;
      let coordsOnCellMouseDown;

      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 4 }],
        afterOnCellMouseDown(_, coords) {
          coordsOnCellMouseDown = coords;
          rowOnCellMouseDown = coords.row;
          columnOnCellMouseDown = coords.col;
        }
      });

      const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      columnMapper.setValueAtIndex(0, true);
      columnMapper.setValueAtIndex(1, true);
      render();

      // Click on the first visible cell (merged area).
      simulateClick(spec().$container.find('tr:eq(1) td:eq(0)'));

      expect(rowOnCellMouseDown).toEqual(0);
      expect(columnOnCellMouseDown).toEqual(2);
      expect(coordsOnCellMouseDown).toEqual(jasmine.objectContaining({ row: 0, col: 2 }));
    });
  });
});
