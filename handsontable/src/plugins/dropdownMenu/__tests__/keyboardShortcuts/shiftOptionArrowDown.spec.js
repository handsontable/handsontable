describe('DropdownMenu keyboard shortcut', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  function columnHeader(renderedColumnIndex, TH) {
    const visualColumnsIndex = renderedColumnIndex >= 0 ?
      this.columnIndexMapper.getVisualFromRenderableIndex(renderedColumnIndex) : renderedColumnIndex;

    this.view.appendColHeader(visualColumnsIndex, TH);
  }

  describe('"Shift" + "Alt/Option" + "ArrowDown"', () => {
    it('should not throw an error when triggered on selection that points on the hidden records', () => {
      const spy = jasmine.createSpyObj('error', ['test']);
      const prevError = window.onerror;

      window.onerror = function() {
        spy.test();

        return true;
      };
      handsontable({
        colHeaders: true,
        dropdownMenu: true,
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(0, true);
      hidingMap.setValueAtIndex(1, true);
      hidingMap.setValueAtIndex(2, true);

      render();
      selectCell(1, 1);

      keyDownUp(['shift', 'alt', 'arrowdown']);

      expect(spy.test.calls.count()).toBe(0);

      window.onerror = prevError;
    });

    it('should open a menu after `updateSettings` call', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: true,
      });

      selectCell(1, 1);

      updateSettings({
        dropdownMenu: true,
      });

      const plugin = getPlugin('dropdownMenu');

      spyOn(plugin, 'open').and.callThrough();
      keyDownUp(['shift', 'alt', 'arrowdown']);

      expect(plugin.open).toHaveBeenCalledTimes(1);
    });

    it('should open the menu and select the first item by default', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: true,
      });

      selectCell(1, 1);
      keyDownUp(['shift', 'alt', 'arrowdown']);

      const firstItem = getPlugin('dropdownMenu').menu.hotMenu.getCell(0, 0);

      expect(document.activeElement).toBe(firstItem);
    });

    it('should be possible to open the dropdown menu in the correct position triggered from the single cell', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: false,
        dropdownMenu: true
      });

      selectCell(1, 1);
      keyDownUp(['shift', 'alt', 'arrowdown']);

      const cell = getCell(-1, 1, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const cellOffset = $(cell).offset();
      const buttonOffset = $(cell.querySelector('.changeType')).offset();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).forThemes(({ classic, main }) => {
        classic.toBeCloseTo(cellOffset.top + cell.clientHeight, 0);
        main.toBeCloseTo(cellOffset.top + cell.clientHeight - 1, 0);
      });
      expect(menuOffset.left).toBeCloseTo(buttonOffset.left, 0);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 2,1']);
    });

    it('should be possible to open the dropdown menu on the left position when on the right there is no space left', () => {
      handsontable({
        data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true
      });

      const lastColumn = countCols() - 1;

      selectCell(-1, lastColumn);
      keyDownUp(['shift', 'alt', 'arrowdown']);

      const cell = getCell(-1, lastColumn, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const menuWidth = $dropdownMenu.outerWidth();
      const cellOffset = $(cell).offset();
      const buttonOffset = $(cell.querySelector('.changeType')).offset();
      const buttonWidth = $(cell.querySelector('.changeType')).outerWidth();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).forThemes(({ classic, main }) => {
        classic.toBeCloseTo(cellOffset.top + cell.clientHeight, 0);
        main.toBeCloseTo(cellOffset.top + cell.clientHeight - 1, 0);
      });
      expect(menuOffset.left).toBeCloseTo(buttonOffset.left + buttonWidth - menuWidth, 0);
      expect(getSelectedRange()).toEqualCellRange([
        `highlight: -1,${lastColumn} from: -1,${lastColumn} to: 3,${lastColumn}`
      ]);
    });

    it('should be possible to open the dropdown menu in the correct position triggered from the range of the cells', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: false,
        dropdownMenu: true
      });

      selectCells([[2, 4, 0, 0]]);
      keyDownUp(['shift', 'alt', 'arrowdown']);

      const cell = getCell(-1, 4, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const cellOffset = $(cell).offset();
      const buttonOffset = $(cell.querySelector('.changeType')).offset();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).forThemes(({ classic, main }) => {
        classic.toBeCloseTo(cellOffset.top + cell.clientHeight, 0);
        main.toBeCloseTo(cellOffset.top + cell.clientHeight - 1, 0);
      });
      expect(menuOffset.left).toBeCloseTo(buttonOffset.left, 0);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: -1,4 to: 2,4']);
    });

    it('should be possible to open the dropdown menu in the correct position triggered from the range of non-contiguous selection', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: false,
        dropdownMenu: true
      });

      selectCells([[2, 4, 0, 0], [2, 3, 2, 2]]);
      keyDownUp(['shift', 'alt', 'arrowdown']);

      const cell = getCell(-1, 3, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const cellOffset = $(cell).offset();
      const buttonOffset = $(cell.querySelector('.changeType')).offset();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).forThemes(({ classic, main }) => {
        classic.toBeCloseTo(cellOffset.top + cell.clientHeight, 0);
        main.toBeCloseTo(cellOffset.top + cell.clientHeight - 1, 0);
      });
      expect(menuOffset.left).toBeCloseTo(buttonOffset.left, 0);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,3 to: 2,3']);
    });

    it('should be possible to open the dropdown menu in the correct position triggered from the single cell (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true
      });

      selectCell(1, 1);
      keyDownUp(['shift', 'alt', 'arrowdown']);

      const cell = getCell(-1, 1, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const cellOffset = $(cell).offset();
      const buttonOffset = $(cell.querySelector('.changeType')).offset();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).forThemes(({ classic, main }) => {
        classic.toBeCloseTo(cellOffset.top + cell.clientHeight, 0);
        main.toBeCloseTo(cellOffset.top + cell.clientHeight - 1, 0);
      });
      expect(menuOffset.left).toBeCloseTo(buttonOffset.left, 0);
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 2,1']);
    });

    it('should be possible to open the dropdown menu in the correct position triggered from the range of the cells (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true
      });

      selectCells([[2, 4, 0, 0]]);
      keyDownUp(['shift', 'alt', 'arrowdown']);

      const cell = getCell(-1, 4, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const cellOffset = $(cell).offset();
      const buttonOffset = $(cell.querySelector('.changeType')).offset();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).forThemes(({ classic, main }) => {
        classic.toBeCloseTo(cellOffset.top + cell.clientHeight, 0);
        main.toBeCloseTo(cellOffset.top + cell.clientHeight - 1, 0);
      });
      expect(menuOffset.left).toBeCloseTo(buttonOffset.left, 0);
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,4 from: -1,4 to: 2,4']);
    });

    it('should be possible to open the dropdown menu in the correct position triggered from the range of non-contiguous selection (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true
      });

      selectCells([[2, 4, 0, 0], [2, 3, 2, 2]]);
      keyDownUp(['shift', 'alt', 'arrowdown']);

      const cell = getCell(-1, 3, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const cellOffset = $(cell).offset();
      const buttonOffset = $(cell.querySelector('.changeType')).offset();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).forThemes(({ classic, main }) => {
        classic.toBeCloseTo(cellOffset.top + cell.clientHeight, 0);
        main.toBeCloseTo(cellOffset.top + cell.clientHeight - 1, 0);
      });
      expect(menuOffset.left).toBeCloseTo(buttonOffset.left, 0);
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,3 from: -1,3 to: 2,3']);
    });

    it('should be possible to open the dropdown menu from the focused column when a range of the columns are selected', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true
      });

      selectColumns(1, 4, -1);
      listen();
      keyDownUp(['shift', 'alt', 'arrowdown']);

      const cell = getCell(-1, 1, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const cellOffset = $(cell).offset();
      const buttonOffset = $(cell.querySelector('.changeType')).offset();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).forThemes(({ classic, main }) => {
        classic.toBeCloseTo(cellOffset.top + cell.clientHeight, 0);
        main.toBeCloseTo(cellOffset.top + cell.clientHeight - 1, 0);
      });
      expect(menuOffset.left).toBeCloseTo(buttonOffset.left, 0);
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 2,1']);
    });

    it('should be possible to open the dropdown menu only by triggering the action only from the lowest column header', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
      });

      selectCell(-1, -1); // corner
      keyDownUp(['shift', 'alt', 'arrowdown']);

      {
        expect($(document.body).find('.htDropdownMenu:visible').length).toBe(0);
        expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);
      }

      selectCell(1, -1); // row header
      keyDownUp(['shift', 'alt', 'arrowdown']);

      {
        expect($(document.body).find('.htDropdownMenu:visible').length).toBe(0);
        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 1,-1']);
      }

      selectCell(-3, 1); // the first (top) column header
      keyDownUp(['shift', 'alt', 'arrowdown']);

      {
        expect($(document.body).find('.htDropdownMenu:visible').length).toBe(0);
        expect(getSelectedRange()).toEqualCellRange(['highlight: -3,1 from: -3,1 to: -3,1']);
      }

      selectCell(-2, 1); // the second column header
      keyDownUp(['shift', 'alt', 'arrowdown']);

      {
        expect($(document.body).find('.htDropdownMenu:visible').length).toBe(0);
        expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -2,1 to: -2,1']);
      }

      selectCell(-1, 1); // the third (bottom) column header
      keyDownUp(['shift', 'alt', 'arrowdown']);

      {
        expect($(document.body).find('.htDropdownMenu:visible').length).toBe(1);
        expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 2,1']);
      }
    });

    it('should not trigger the editor to be opened', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true,
      });

      selectCell(-1, 1);
      keyDownUp(['shift', 'alt', 'arrowdown']);

      expect(getActiveEditor()).toBeUndefined();

      selectCell(1, 1);
      keyDownUp(['shift', 'alt', 'arrowdown']);

      // the editor is created and prepared after cell selection but should be still not opened
      expect(getActiveEditor().isOpened()).toBe(false);
    });

    describe('cooperation with nested headers', () => {
      it('should be possible to open the dropdown menu in the correct position when the cells in-between nested headers is selected', () => {
        handsontable({
          data: createSpreadsheetData(3, 8),
          colHeaders: true,
          rowHeaders: true,
          navigableHeaders: true,
          dropdownMenu: true,
          nestedHeaders: [
            ['A', { label: 'B', colspan: 3 }, 'E', 'F', { label: 'G', colspan: 2 }, 'I', 'J'],
          ],
        });

        selectCell(1, 3);
        keyDownUp(['shift', 'alt', 'arrowdown']);

        const cell = getCell(-1, 1, true);
        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuOffset = $dropdownMenu.offset();
        const cellOffset = $(cell).offset();
        const buttonOffset = $(cell.querySelector('.changeType')).offset();

        expect($dropdownMenu.length).toBe(1);
        expect(menuOffset.top).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.top + cell.clientHeight, 0);
          main.toBeCloseTo(cellOffset.top + cell.clientHeight - 1, 0);
        });
        expect(menuOffset.left).toBeCloseTo(buttonOffset.left, 0);
        expect(getSelectedRange()).toEqualCellRange(['highlight: -1,3 from: -1,1 to: 2,3']);
      });
    });
  });
});
