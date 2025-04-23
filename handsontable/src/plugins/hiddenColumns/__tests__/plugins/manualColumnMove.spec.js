describe('HiddenColumns', () => {
  const id = 'testContainer';

  const CSS_CLASS_BEFORE_HIDDEN_COLUMN = 'beforeHiddenColumn';
  const CSS_CLASS_AFTER_HIDDEN_COLUMN = 'afterHiddenColumn';
  const CONTEXTMENU_ITEM_SHOW = 'hidden_columns_show';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('manualColumnMove', () => {
    it('should properly render hidden ranges after moving action (moving not hidden columns just before the hidden one)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 5),
        colHeaders: true,
        hiddenColumns: {
          columns: [0],
          indicators: true
        },
        manualColumnMove: true
      });

      getPlugin('manualColumnMove').moveColumns([2, 3, 4], 0);
      await render();

      expect(getData()).toEqual([
        ['C1', 'D1', 'E1', 'A1', 'B1'],
        ['C2', 'D2', 'E2', 'A2', 'B2'],
      ]);
      expect(getColWidth(3)).toEqual(0);
      expect(getPlugin('hiddenColumns').isHidden(3)).toBeTruthy();
      expect(getCell(-1, 2)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
      expect(getCell(-1, 3)).toBe(null);
      expect(getCell(-1, 4)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);
      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('D1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('E1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('B1');
    });

    it('should properly render hidden ranges after moving action (moving not hidden columns just after the hidden one)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 5),
        colHeaders: true,
        hiddenColumns: {
          columns: [4],
          indicators: true
        },
        manualColumnMove: true
      });

      getPlugin('manualColumnMove').moveColumns([0, 1, 2], 2);
      await render();

      expect(getData()).toEqual([
        ['D1', 'E1', 'A1', 'B1', 'C1'],
        ['D2', 'E2', 'A2', 'B2', 'C2'],
      ]);
      expect(getColWidth(1)).toEqual(0);
      expect(getPlugin('hiddenColumns').isHidden(1)).toBeTruthy();
      expect(getCell(-1, 0)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
      expect(getCell(-1, 1)).toBe(null);
      expect(getCell(-1, 2)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);
      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('D1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('C1');
    });

    it('should properly render hidden ranges after moving action (moving only hidden column)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 5),
        colHeaders: true,
        hiddenColumns: {
          columns: [4],
          indicators: true
        },
        manualColumnMove: true
      });

      getPlugin('manualColumnMove').moveColumns([4], 1);
      await render();

      expect(getData()).toEqual([
        ['A1', 'E1', 'B1', 'C1', 'D1'],
        ['A2', 'E2', 'B2', 'C2', 'D2'],
      ]);
      expect(getColWidth(1)).toEqual(0);
      expect(getPlugin('hiddenColumns').isHidden(1)).toBeTruthy();
      expect(getCell(-1, 0)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
      expect(getCell(-1, 1)).toBe(null);
      expect(getCell(-1, 2)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);
      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('D1');
    });

    it('should properly render hidden ranges after moving action (moving range of columns containing a hidden column)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 5),
        colHeaders: true,
        hiddenColumns: {
          columns: [3],
          indicators: true
        },
        manualColumnMove: true
      });

      getPlugin('manualColumnMove').moveColumns([2, 3, 4], 1);
      await render();

      expect(getData()).toEqual([
        ['A1', 'C1', 'D1', 'E1', 'B1'],
        ['A2', 'C2', 'D2', 'E2', 'B2'],
      ]);
      expect(getColWidth(2)).toEqual(0);
      expect(getPlugin('hiddenColumns').isHidden(2)).toBeTruthy();
      expect(getCell(-1, 1)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
      expect(getCell(-1, 2)).toBe(null);
      expect(getCell(-1, 3)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);
      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('E1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('B1');
    });

    it('should properly render hidden ranges after moving action (shifts between hidden columns)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 5),
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
          indicators: true
        },
        manualColumnMove: true
      });

      getPlugin('manualColumnMove').moveColumns([3, 1, 2], 1);
      await render();

      expect(getData()).toEqual([
        ['A1', 'D1', 'B1', 'C1', 'E1'],
        ['A2', 'D2', 'B2', 'C2', 'E2'],
      ]);
      expect(getColWidth(2)).toEqual(0);
      expect(getPlugin('hiddenColumns').isHidden(2)).toBeTruthy();
      expect(getCell(-1, 0)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
      expect(getCell(-1, 1)).toBe(null);
      expect(getCell(-1, 2)).toBe(null);
      expect(getCell(-1, 3)).toBe(null);
      expect(getCell(-1, 4)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);
      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('E1');
    });

    it('should properly render hidden ranges after moving action (moving part of hidden columns)', async() => {
      handsontable({
        data: createSpreadsheetData(2, 5),
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 3, 4],
          indicators: true
        },
        manualColumnMove: true
      });

      getPlugin('manualColumnMove').moveColumns([3, 4], 0);
      await render();

      expect(getData()).toEqual([
        ['D1', 'E1', 'A1', 'B1', 'C1'],
        ['D2', 'E2', 'A2', 'B2', 'C2'],
      ]);
      expect(getColWidth(1)).toEqual(0);
      expect(getColWidth(1)).toEqual(0);
      expect(getColWidth(3)).toEqual(0);
      expect(getPlugin('hiddenColumns').isHidden(0)).toBeTruthy();
      expect(getPlugin('hiddenColumns').isHidden(1)).toBeTruthy();
      expect(getPlugin('hiddenColumns').isHidden(3)).toBeTruthy();
      expect(getCell(-1, 0)).toBe(null);
      expect(getCell(-1, 1)).toBe(null);
      expect(getCell(-1, 2)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);
      expect(getCell(-1, 2)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
      expect(getCell(-1, 3)).toBe(null);
      expect(getCell(-1, 4)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);
      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
    });

    describe('selection', () => {
      it('should correctly set the selection of the unhidden column when it\'s placed as a most-left' +
         'table record (caused by moving first visible column on the right of the hidden one)', async() => {
        handsontable({
          data: createSpreadsheetData(2, 5),
          rowHeaders: true,
          colHeaders: true,
          contextMenu: [CONTEXTMENU_ITEM_SHOW],
          hiddenColumns: {
            columns: [1],
          },
          manualColumnMove: true,
        });

        getPlugin('manualColumnMove').moveColumn(0, 2);
        await render();

        await selectColumns(1);

        await contextMenu();
        getPlugin('contextMenu').executeCommand(CONTEXTMENU_ITEM_SHOW);

        expect(spec().$container.find('tr:eq(0) th').length).toBe(6);
        expect(spec().$container.find('tr:eq(1) td').length).toBe(5);
        expect(getCell(0, 0).innerText).toBe('B1');
        expect(getCell(0, 1).innerText).toBe('C1');
        expect(getCell(0, 2).innerText).toBe('A1');
        expect(getCell(0, 3).innerText).toBe('D1');
        expect(getCell(0, 4).innerText).toBe('E1');
        expect(getSelected()).toEqual([[-1, 0, 1, 1]]);
        expect(getSelectedRangeLast().highlight.row).toBe(0);
        expect(getSelectedRangeLast().highlight.col).toBe(0);
        expect(getSelectedRangeLast().from.row).toBe(-1);
        expect(getSelectedRangeLast().from.col).toBe(0);
        expect(getSelectedRangeLast().to.row).toBe(1);
        expect(getSelectedRangeLast().to.col).toBe(1);
        expect(`
        |   ║ * : * :   :   :   |
        |===:===:===:===:===:===|
        | - ║ A : 0 :   :   :   |
        | - ║ 0 : 0 :   :   :   |
        `).toBeMatchToSelectionPattern();
      });
    });

    describe('UI', () => {
      describe('backlight', () => {
        it('should get correct position and size while grabing the column placed after hidden columns', async() => {
          handsontable({
            data: createSpreadsheetData(10, 10),
            colHeaders: true,
            hiddenColumns: {
              columns: [0, 1],
              indicators: true
            },
            manualColumnMove: true,
          });

          const $headerTH = spec().$container.find('thead th:eq(2)'); // header "E"

          $headerTH.simulate('mousedown');
          $headerTH.simulate('mouseup');
          $headerTH.simulate('mousedown'); // Triggers backlight

          const $backlight = spec().$container.find('.ht__manualColumnMove--backlight');

          expect($backlight.offset().left).toBe($headerTH.offset().left);
          expect($backlight.width()).forThemes(({ classic, main, horizon }) => {
            classic.toBe(50);
            main.toBe(50);
            horizon.toBe(51);
          });
        });

        it('should get correct position and size while grabing the multiple columns placed after hidden columns', async() => {
          handsontable({
            data: createSpreadsheetData(10, 10),
            colHeaders: true,
            hiddenColumns: {
              columns: [0, 1],
              indicators: true
            },
            manualColumnMove: true,
          });

          const $firstHeaderTH = spec().$container.find('thead th:eq(2)');

          $firstHeaderTH
            .simulate('mousedown')
          ; // header "E"
          spec().$container.find('thead th:eq(3)')
            .simulate('mouseover')
          ; // header "F"
          spec().$container.find('thead th:eq(4)')
            .simulate('mouseover')
            .simulate('mouseup')
            .simulate('mousedown') // Triggers backlight
          ; // header "G"

          const $backlight = spec().$container.find('.ht__manualColumnMove--backlight');

          expect($backlight.offset().left).toBe($firstHeaderTH.offset().left);
          expect($backlight.width()).forThemes(({ classic, main, horizon }) => {
            classic.toBe(150); // 50 * 3
            main.toBe(150);
            horizon.toBe(155);
          });
        });

        it('should get correct position and size while grabing the column placed before hidden columns', async() => {
          handsontable({
            data: createSpreadsheetData(10, 10),
            colHeaders: true,
            hiddenColumns: {
              columns: [8, 9],
              indicators: true
            },
            manualColumnMove: true,
          });

          const $headerTH = spec().$container.find('thead th:eq(2)'); // header "3"

          $headerTH.simulate('mousedown');
          $headerTH.simulate('mouseup');
          $headerTH.simulate('mousedown');

          const $backlight = spec().$container.find('.ht__manualColumnMove--backlight');

          expect($backlight.offset().left).toBe($headerTH.offset().left);
          expect($backlight.width()).forThemes(({ classic, main, horizon }) => {
            classic.toBe(50);
            main.toBe(50);
            horizon.toBe(52);
          });
        });

        it('should get correct position and size while grabing the multiple columns placed before hidden columns', async() => {
          handsontable({
            data: createSpreadsheetData(10, 10),
            colHeaders: true,
            hiddenColumns: {
              columns: [8, 9],
              indicators: true
            },
            manualColumnMove: true,
          });

          const $firstHeaderTH = spec().$container.find('thead th:eq(2)');

          $firstHeaderTH
            .simulate('mousedown')
          ; // header "3"
          spec().$container.find('thead th:eq(3)')
            .simulate('mouseover')
          ; // header "4"
          spec().$container.find('thead th:eq(4)')
            .simulate('mouseover')
            .simulate('mouseup')
            .simulate('mousedown') // Triggers backlight
          ; // header "E"

          const $backlight = spec().$container.find('.ht__manualColumnMove--backlight');

          expect($backlight.offset().left).toBe($firstHeaderTH.offset().left);
          expect($backlight.width()).forThemes(({ classic, main, horizon }) => {
            classic.toBe(150); // 50 * 3
            main.toBe(150);
            horizon.toBe(155);
          });
        });
      });

      describe('guideline', () => {
        it('should get correct position while grabing the column placed after hidden columns (moving right)', async() => {
          handsontable({
            data: createSpreadsheetData(10, 10),
            colHeaders: true,
            hiddenColumns: {
              columns: [0, 1],
              indicators: true
            },
            manualColumnMove: true,
          });

          const $firstHeaderTH = spec().$container.find('thead th:eq(2)');
          const $secondHeaderTH = spec().$container.find('thead th:eq(3)');

          $firstHeaderTH
            .simulate('mousedown')
            .simulate('mouseup')
            .simulate('mousedown')
          ; // header "E"
          $secondHeaderTH
            .simulate('mouseover')
            .simulate('mousemove', {
              clientX: $secondHeaderTH.offset().left,
            })
          ; // header "F"

          const $guideline = spec().$container.find('.ht__manualColumnMove--guideline');

          expect($guideline.offset().left).forThemes(({ classic, main, horizon }) => {
            classic.toBe($secondHeaderTH.offset().left - 1);
            main.toBe($secondHeaderTH.offset().left - 0.5);
            horizon.toBe($secondHeaderTH.offset().left - 0.5);
          });
        });

        it('should get correct position while grabing the column placed after hidden columns (moving left)', async() => {
          handsontable({
            data: createSpreadsheetData(10, 10),
            colHeaders: true,
            hiddenColumns: {
              columns: [0, 1],
              indicators: true
            },
            manualColumnMove: true,
          });

          const $firstHeaderTH = spec().$container.find('thead th:eq(2)');
          const $secondHeaderTH = spec().$container.find('thead th:eq(3)');

          $secondHeaderTH
            .simulate('mousedown')
            .simulate('mouseup')
            .simulate('mousedown')
          ; // header "F"
          $firstHeaderTH
            .simulate('mouseover')
            .simulate('mousemove', {
              clientX: $firstHeaderTH.offset().left + $firstHeaderTH.width(),
            })
          ; // header "E"

          const $guideline = spec().$container.find('.ht__manualColumnMove--guideline');

          expect($guideline.offset().left).forThemes(({ classic, main, horizon }) => {
            classic.toBe($firstHeaderTH.offset().left + $firstHeaderTH.width());
            main.toBe($firstHeaderTH.offset().left + $firstHeaderTH.width() + 0.5);
            horizon.toBe($firstHeaderTH.offset().left + $firstHeaderTH.width() + 0.5);
          });
        });

        it('should get correct position while grabing the column placed before hidden columns (moving right)', async() => {
          handsontable({
            data: createSpreadsheetData(10, 10),
            colHeaders: true,
            hiddenColumns: {
              columns: [8, 9],
              indicators: true
            },
            manualColumnMove: true,
          });

          const $firstHeaderTH = spec().$container.find('thead th:eq(2)');
          const $secondHeaderTH = spec().$container.find('thead th:eq(3)');

          $firstHeaderTH
            .simulate('mousedown')
            .simulate('mouseup')
            .simulate('mousedown')
          ; // Header "3"
          $secondHeaderTH
            .simulate('mouseover')
            .simulate('mousemove', {
              clientX: $secondHeaderTH.offset().left,
            })
          ; // Header "4"

          const $guideline = spec().$container.find('.ht__manualColumnMove--guideline');

          expect($guideline.offset().left).forThemes(({ classic, main, horizon }) => {
            classic.toBe($secondHeaderTH.offset().left - 1);
            main.toBe($secondHeaderTH.offset().left - 0.5);
            horizon.toBe($secondHeaderTH.offset().left - 0.5);
          });
        });

        it('should get correct position while grabing the column placed before hidden columns (moving left)', async() => {
          handsontable({
            data: createSpreadsheetData(10, 10),
            colHeaders: true,
            hiddenColumns: {
              columns: [8, 9],
              indicators: true
            },
            manualColumnMove: true,
          });

          const $firstHeaderTH = spec().$container.find('thead th:eq(2)');
          const $secondHeaderTH = spec().$container.find('thead th:eq(3)');

          $secondHeaderTH
            .simulate('mousedown')
            .simulate('mouseup')
            .simulate('mousedown')
          ; // Header "4"
          $firstHeaderTH
            .simulate('mouseover')
            .simulate('mousemove', {
              clientX: $firstHeaderTH.offset().left + $firstHeaderTH.width(),
            })
          ; // Header "3"

          const $guideline = spec().$container.find('.ht__manualColumnMove--guideline');

          expect($guideline.offset().left).forThemes(({ classic, main, horizon }) => {
            classic.toBe($firstHeaderTH.offset().left + $firstHeaderTH.width());
            main.toBe($firstHeaderTH.offset().left + $firstHeaderTH.width() + 0.5);
            horizon.toBe($firstHeaderTH.offset().left + $firstHeaderTH.width() + 0.5);
          });
        });
      });
    });
  });
});
