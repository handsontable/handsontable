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

  describe('"Control/meta" + "Enter"', () => {
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
      selectCell(-1, 1);

      keyDownUp(['control/meta', 'enter']);

      expect(spy.test.calls.count()).toBe(0);

      window.onerror = prevError;
    });

    it('should not be possible to open the dropdown menu (navigableHeaders off)', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: false,
        dropdownMenu: true
      });

      selectCell(0, 1);
      keyDownUp(['control/meta', 'enter']);

      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');

      expect($dropdownMenu.length).toBe(0);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
    });

    it('should be possible to open the dropdown menu in the correct position', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true
      });

      selectCell(-1, 1);
      keyDownUp(['control/meta', 'enter']);

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
      keyDownUp(['control/meta', 'enter']);

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

    it('should highlight first item of the menu after open it (triggered by hotkey)', async() => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true
      });

      selectCell(-1, 1);
      keyDownUp(['control/meta', 'enter']);

      await sleep(100);

      expect(getPlugin('dropdownMenu').menu.hotMenu.getSelected()).toEqual([[0, 0, 0, 0]]);
    });

    it('should not be possible to close already opened the dropdown menu', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true
      });

      selectCell(-1, 1);
      keyDownUp(['control/meta', 'enter']);
      keyDownUp(['control/meta', 'enter']);

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
      keyDownUp(['control/meta', 'enter']);

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
      keyDownUp(['control/meta', 'enter']);

      {
        expect($(document.body).find('.htDropdownMenu:visible').length).toBe(0);
        expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);
      }

      selectCell(1, -1); // row header
      keyDownUp(['control/meta', 'enter']);

      {
        expect($(document.body).find('.htDropdownMenu:visible').length).toBe(0);
        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 1,-1']);
      }

      selectCell(-3, 1); // the first (top) column header
      keyDownUp(['control/meta', 'enter']);

      {
        expect($(document.body).find('.htDropdownMenu:visible').length).toBe(0);
        expect(getSelectedRange()).toEqualCellRange(['highlight: -3,1 from: -3,1 to: -3,1']);
      }

      selectCell(-2, 1); // the second column header
      keyDownUp(['control/meta', 'enter']);

      {
        expect($(document.body).find('.htDropdownMenu:visible').length).toBe(0);
        expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -2,1 to: -2,1']);
      }

      selectCell(-1, 1); // the third (bottom) column header
      keyDownUp(['control/meta', 'enter']);

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
      keyDownUp(['control/meta', 'enter']);

      expect(getActiveEditor()).toBeUndefined();
    });

    describe('cooperation with nested headers', () => {
      it('should be possible to open the dropdown menu in the correct position when the cells in-between nested headers are selected', () => {
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

        selectCell(-1, 2);
        keyDownUp(['control/meta', 'enter']);

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
        expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,1 to: 2,3']);
      });
    });
  });
});
