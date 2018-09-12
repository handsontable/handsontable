describe('i18n', () => {
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

  const POLISH_LANGUAGE_CODE = 'pl-PL';
  const INSERT_COLUMN_LEFT_IN_POLISH_LANGUAGE = 'Wstaw kolumnę z lewej';
  const FILTERS_CONDITIONS_NONE_IN_POLISH_LANGUAGE = 'Brak';
  const FILTERS_CONDITIONS_EMPTY_IN_POLISH_LANGUAGE = 'Komórka jest pusta';

  describe('dropdown translation', () => {
    it('should translate dropdownMenu UI when setting existing language at start', () => {
      handsontable({
        language: POLISH_LANGUAGE_CODE,
        colHeaders: true,
        dropdownMenu: true
      });

      dropdownMenu(0);

      expect($('.htDropdownMenu tbody td:not(.htSeparator)').eq(0).text()).toEqual(INSERT_COLUMN_LEFT_IN_POLISH_LANGUAGE);
    });
  });

  describe('filters translation', () => {
    describe('should translate filters condition inside dropdownMenu UI', () => {
      describe('when setting existing language at start', () => {
        it('name visible inside the main drop-down menu', () => {
          handsontable({
            language: POLISH_LANGUAGE_CODE,
            colHeaders: true,
            dropdownMenu: true,
            filters: true
          });

          dropdownMenu(0);

          expect($('.htFiltersMenuCondition .htUISelectCaption').eq(0).text()).toEqual(FILTERS_CONDITIONS_NONE_IN_POLISH_LANGUAGE);
        });

        it('name visible inside condition selection drop-down menu', () => {
          handsontable({
            language: POLISH_LANGUAGE_CODE,
            colHeaders: true,
            dropdownMenu: true,
            filters: true
          });

          dropdownMenu(0);

          $('.htUISelect').eq(0).simulate('click');

          const $contextMenuItems = $('.htFiltersConditionsMenu tbody td:not(.htSeparator)');

          expect($contextMenuItems.eq(0).text()).toEqual(FILTERS_CONDITIONS_NONE_IN_POLISH_LANGUAGE);
          expect($contextMenuItems.eq(1).text()).toEqual(FILTERS_CONDITIONS_EMPTY_IN_POLISH_LANGUAGE);
        });
      });

      describe('when changing language by updateSettings', () => {
        it('name visible inside the main drop-down menu', () => {
          const hot = handsontable({
            colHeaders: true,
            dropdownMenu: true,
            filters: true
          });

          dropdownMenu(0);

          $('.htUISelect').eq(0).simulate('click');

          const $contextMenuItems = $('.htFiltersConditionsMenu tbody td:not(.htSeparator)');

          $contextMenuItems.eq(1).simulate('mousedown');
          $('.htUIButton.htUIButtonOK input').simulate('click');

          hot.updateSettings({ language: POLISH_LANGUAGE_CODE });

          dropdownMenu(0);

          expect($('.htFiltersMenuCondition .htUISelectCaption').eq(0).text()).toEqual(FILTERS_CONDITIONS_EMPTY_IN_POLISH_LANGUAGE);
        });

        it('name visible inside condition selection drop-down menu', () => {
          const hot = handsontable({
            colHeaders: true,
            dropdownMenu: true,
            filters: true
          });

          dropdownMenu(0);

          $('.htUISelect').eq(0).simulate('click');

          let $contextMenuItems = $('.htFiltersConditionsMenu tbody td:not(.htSeparator)');

          $contextMenuItems.eq(1).simulate('mousedown');
          $('.htUIButton.htUIButtonOK input').simulate('click');

          hot.updateSettings({ language: POLISH_LANGUAGE_CODE });

          dropdownMenu(0);

          $('.htUISelect').eq(0).simulate('click');

          $contextMenuItems = $('.htFiltersConditionsMenu tbody td:not(.htSeparator)');

          expect($contextMenuItems.eq(0).text()).toEqual(FILTERS_CONDITIONS_NONE_IN_POLISH_LANGUAGE);
          expect($contextMenuItems.eq(1).text()).toEqual(FILTERS_CONDITIONS_EMPTY_IN_POLISH_LANGUAGE);
        });
      });
    });

    describe('should translate div inside dropdownMenu UI', () => {
      const FILTERS_LABELS_FILTER_BY_CONDITION_IN_POLISH_LANGUAGE = 'Filtruj wg warunku:';

      it('when setting existing language at start', () => {
        handsontable({
          language: POLISH_LANGUAGE_CODE,
          colHeaders: true,
          dropdownMenu: true,
          filters: true
        });

        dropdownMenu(0);

        const $filterByConditionLabel = $('.htFiltersMenuLabel').eq(0);

        expect($filterByConditionLabel.text()).toEqual(FILTERS_LABELS_FILTER_BY_CONDITION_IN_POLISH_LANGUAGE);
      });

      it('when changing language by updateSettings', () => {
        const hot = handsontable({
          colHeaders: true,
          dropdownMenu: true,
          filters: true
        });

        // creating DOM elements
        dropdownMenu(0);

        hot.updateSettings({ language: POLISH_LANGUAGE_CODE });

        dropdownMenu(0);

        const $filterByConditionLabel = $('.htFiltersMenuLabel').eq(0);

        expect($filterByConditionLabel.text()).toEqual(FILTERS_LABELS_FILTER_BY_CONDITION_IN_POLISH_LANGUAGE);
      });
    });

    describe('should translate button inside dropdownMenu UI', () => {
      const FILTERS_BUTTONS_SELECT_ALL_IN_POLISH_LANGUAGE = 'Zaznacz wszystko';

      it('when setting existing language at start', () => {
        handsontable({
          language: POLISH_LANGUAGE_CODE,
          colHeaders: true,
          dropdownMenu: true,
          filters: true
        });

        dropdownMenu(0);

        const $selectAllButton = $('.htUISelectAll').eq(0);

        expect($selectAllButton.text()).toEqual(FILTERS_BUTTONS_SELECT_ALL_IN_POLISH_LANGUAGE);
      });

      it('when changing language by updateSettings', () => {
        const hot = handsontable({
          colHeaders: true,
          dropdownMenu: true,
          filters: true
        });

        // creating DOM elements
        dropdownMenu(0);

        hot.updateSettings({ language: POLISH_LANGUAGE_CODE });

        dropdownMenu(0);

        const $selectAllButton = $('.htUISelectAll').eq(0);

        expect($selectAllButton.text()).toEqual(FILTERS_BUTTONS_SELECT_ALL_IN_POLISH_LANGUAGE);
      });
    });

    describe('should translate placeholder of button inside dropdownMenu UI', () => {
      const FILTERS_BUTTONS_PLACEHOLDER_SEARCH_IN_POLISH_LANGUAGE = 'Szukaj';

      it('when setting existing language at start', () => {
        handsontable({
          language: POLISH_LANGUAGE_CODE,
          colHeaders: true,
          dropdownMenu: true,
          filters: true
        });

        dropdownMenu(0);

        const $searchInputPlaceholder = $('.htUIMultipleSelectSearch.htUIInput input').eq(0);

        expect($searchInputPlaceholder.attr('placeholder')).toEqual(FILTERS_BUTTONS_PLACEHOLDER_SEARCH_IN_POLISH_LANGUAGE);
      });

      it('when changing language by updateSettings', () => {
        const hot = handsontable({
          colHeaders: true,
          dropdownMenu: true,
          filters: true
        });

        // creating DOM elements
        dropdownMenu(0);

        hot.updateSettings({ language: POLISH_LANGUAGE_CODE });

        dropdownMenu(0);

        const $searchInputPlaceholder = $('.htUIMultipleSelectSearch.htUIInput input').eq(0);

        expect($searchInputPlaceholder.attr('placeholder')).toEqual(FILTERS_BUTTONS_PLACEHOLDER_SEARCH_IN_POLISH_LANGUAGE);
      });
    });

    describe('should translate radio input\'s label inside dropdownMenu UI', () => {
      const FILTERS_LABELS_CONJUNCTION_IN_POLISH_LANGUAGE = 'Oraz';

      it('when setting existing language at start', () => {
        handsontable({
          language: POLISH_LANGUAGE_CODE,
          colHeaders: true,
          dropdownMenu: true,
          filters: true
        });

        dropdownMenu(0);

        const $label = $('.htUIRadio label').eq(0);

        expect($label.text()).toEqual(FILTERS_LABELS_CONJUNCTION_IN_POLISH_LANGUAGE);
      });

      it('when changing language by updateSettings', () => {
        const hot = handsontable({
          colHeaders: true,
          dropdownMenu: true,
          filters: true
        });

        // creating DOM elements
        dropdownMenu(0);

        hot.updateSettings({ language: POLISH_LANGUAGE_CODE });

        dropdownMenu(0);

        const $label = $('.htUIRadio label').eq(0);

        expect($label.text()).toEqual(FILTERS_LABELS_CONJUNCTION_IN_POLISH_LANGUAGE);
      });
    });

    describe('should translate empty value inside values component', () => {
      const FILTERS_VALUES_BLANK_CELLS_IN_POLISH_LANGUAGE = '(Puste miejsca)';

      it('when setting existing language code at start', () => {
        const data = getDataForFilters();
        data[0].name = '';

        handsontable({
          language: POLISH_LANGUAGE_CODE,
          data,
          columns: getColumnsForFilters(),
          filters: true,
          dropdownMenu: true
        });

        dropdownMenu(1);

        expect(byValueMultipleSelect().element.querySelector('.htCore td').textContent).toBe(FILTERS_VALUES_BLANK_CELLS_IN_POLISH_LANGUAGE);
      });

      it('when changing language by updateSettings', () => {
        const data = getDataForFilters();
        data[0].name = '';

        const hot = handsontable({
          data,
          columns: getColumnsForFilters(),
          filters: true,
          dropdownMenu: true
        });

        // creating DOM elements
        dropdownMenu(1);

        hot.updateSettings({ language: POLISH_LANGUAGE_CODE });

        dropdownMenu(1);

        expect(byValueMultipleSelect().element.querySelector('.htCore td').textContent).toBe(FILTERS_VALUES_BLANK_CELLS_IN_POLISH_LANGUAGE);
      });
    });
  });

  describe('contextMenu translation', () => {
    it('should translate item from enabled `nestedRows` plugin when setting existing language code at start', () => {
      const NESTED_ROWS_INSERT_CHILD_IN_POLISH = 'Wstaw wiersz podrzędny';

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 1),
        language: POLISH_LANGUAGE_CODE,
        contextMenu: ['add_child'],
        rowHeaders: true,
        colHeaders: true,
        nestedRows: true
      });

      selectCell(0, 0);

      contextMenu();

      const $showRowItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($showRowItem.text()).toEqual(NESTED_ROWS_INSERT_CHILD_IN_POLISH);
    });

    describe('hiddenRows plugin enabled', () => {
      const HIDE_ROW_SINGULAR_IN_POLISH = 'Ukryj wiersz';
      const HIDE_ROW_PLURAL_IN_POLISH = 'Ukryj wiersze';

      const SHOW_ROW_SINGULAR_IN_POLISH = 'Pokaż wiersz';
      const SHOW_ROW_PLURAL_IN_POLISH = 'Pokaż wiersze';

      it('should show singular form of phrase when choosing from `Hide row / Hide rows` options in the specific situation (selected one row)', () => {
        handsontable({
          language: POLISH_LANGUAGE_CODE,
          contextMenu: ['hidden_rows_hide'],
          rowHeaders: true,
          hiddenRows: true
        });

        const rowHeader = $('.ht_clone_left tr:eq(0) th:eq(0)');

        rowHeader.simulate('mousedown');
        rowHeader.simulate('mouseup');

        contextMenu();

        const $hideRowItem = $('.htContextMenu tbody td:not(.htSeparator)');

        expect($hideRowItem.text()).toEqual(HIDE_ROW_SINGULAR_IN_POLISH);
      });

      describe('should show plural form of phrase when choosing from `Hide row / Hide rows` options in the specific situation (selected few rows)', () => {
        it('selection started from lower to higher row index', () => {
          handsontable({
            language: POLISH_LANGUAGE_CODE,
            contextMenu: ['hidden_rows_hide'],
            rowHeaders: true,
            hiddenRows: true
          });

          const rowHeader1 = $('.ht_clone_left tr:eq(1) th:eq(0)');
          const rowHeader2 = $('.ht_clone_left tr:eq(2) th:eq(0)');

          rowHeader1.simulate('mousedown');
          rowHeader1.simulate('mouseup');

          rowHeader2.simulate('mousedown', { shiftKey: true });
          rowHeader2.simulate('mouseup');

          contextMenu();

          const $hideRowItem = $('.htContextMenu tbody td:not(.htSeparator)');

          expect($hideRowItem.text()).toEqual(HIDE_ROW_PLURAL_IN_POLISH);
        });

        it('selection started from higher to lower row index', () => {
          handsontable({
            language: POLISH_LANGUAGE_CODE,
            contextMenu: ['hidden_rows_hide'],
            rowHeaders: true,
            hiddenRows: true
          });

          const rowHeader1 = $('.ht_clone_left tr:eq(1) th:eq(0)');
          const rowHeader2 = $('.ht_clone_left tr:eq(2) th:eq(0)');

          rowHeader2.simulate('mousedown');
          rowHeader2.simulate('mouseup');

          rowHeader1.simulate('mousedown', { shiftKey: true });
          rowHeader1.simulate('mouseup');

          contextMenu();

          const $hideRowItem = $('.htContextMenu tbody td:not(.htSeparator)');

          expect($hideRowItem.text()).toEqual(HIDE_ROW_PLURAL_IN_POLISH);
        });
      });

      it('should show singular form of phrase when choosing from `Show row / Show rows` options in the specific situation (hidden first row)', () => {
        handsontable({
          language: POLISH_LANGUAGE_CODE,
          contextMenu: ['hidden_rows_show'],
          rowHeaders: true,
          hiddenRows: {
            rows: [0]
          }
        });

        const $rowHeader = $('.ht_clone_left tr:eq(0) th:eq(0)');

        $rowHeader.simulate('mousedown');
        $rowHeader.simulate('mouseup');

        contextMenu();

        const $showRowItem = $('.htContextMenu tbody td:not(.htSeparator)');

        expect($showRowItem.text()).toEqual(SHOW_ROW_SINGULAR_IN_POLISH);
      });

      it('should show singular form of phrase when choosing from `Show row / Show rows` options in the specific situation (hidden last row)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          language: POLISH_LANGUAGE_CODE,
          contextMenu: ['hidden_rows_show'],
          rowHeaders: true,
          hiddenRows: {
            rows: [4]
          }
        });

        const $rowHeader = $('.ht_clone_left tr:eq(3) th:eq(0)');

        $rowHeader.simulate('mousedown');
        $rowHeader.simulate('mouseup');

        contextMenu();

        const $showRowItem = $('.htContextMenu tbody td:not(.htSeparator)');

        expect($showRowItem.text()).toEqual(SHOW_ROW_SINGULAR_IN_POLISH);
      });

      it('should show singular form of phrase when choosing from `Show row / Show rows` options in the specific situation (hidden row from the middle)', () => {
        handsontable({
          startRows: 6,
          startCols: 6,
          language: POLISH_LANGUAGE_CODE,
          contextMenu: ['hidden_rows_show'],
          rowHeaders: true,
          hiddenRows: {
            rows: [2]
          }
        });

        const rowHeader1 = $('.ht_clone_left tr:eq(1) th:eq(0)');
        const rowHeader2 = $('.ht_clone_left tr:eq(2) th:eq(0)');

        rowHeader1.simulate('mousedown');
        rowHeader1.simulate('mouseup');

        rowHeader2.simulate('mousedown', { shiftKey: true });
        rowHeader2.simulate('mouseup');

        contextMenu();

        const $showRowItem = $('.htContextMenu tbody td:not(.htSeparator)');

        expect($showRowItem.text()).toEqual(SHOW_ROW_SINGULAR_IN_POLISH);
      });

      it('should show plural form of phrase when choosing from `Show row / Show rows` options in the specific situation (hidden first rows)', () => {
        handsontable({
          language: POLISH_LANGUAGE_CODE,
          contextMenu: ['hidden_rows_show'],
          rowHeaders: true,
          hiddenRows: {
            rows: [0, 1]
          }
        });

        const $rowHeader = $('.ht_clone_left tr:eq(0) th:eq(0)');

        $rowHeader.simulate('mousedown');
        $rowHeader.simulate('mouseup');

        contextMenu();

        const $showRowItem = $('.htContextMenu tbody td:not(.htSeparator)');

        expect($showRowItem.text()).toEqual(SHOW_ROW_PLURAL_IN_POLISH);
      });

      it('should show plural form of phrase when choosing from `Show row / Show rows` options in the specific situation (hidden last rows)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          language: POLISH_LANGUAGE_CODE,
          contextMenu: ['hidden_rows_show'],
          rowHeaders: true,
          hiddenRows: {
            rows: [3, 4]
          }
        });

        const $rowHeader = $('.ht_clone_left tr:eq(2) th:eq(0)');

        $rowHeader.simulate('mousedown');
        $rowHeader.simulate('mouseup');

        contextMenu();

        const $showRowItem = $('.htContextMenu tbody td:not(.htSeparator)');

        expect($showRowItem.text()).toEqual(SHOW_ROW_PLURAL_IN_POLISH);
      });

      describe('should show plural form of phrase when choosing from `Show row / Show rows` options in the specific situation (hidden row from the middle)', () => {
        it('selection started from lower to higher row index', () => {
          handsontable({
            startRows: 6,
            startCols: 6,
            language: POLISH_LANGUAGE_CODE,
            contextMenu: ['hidden_rows_show'],
            rowHeaders: true,
            hiddenRows: {
              rows: [2, 3]
            }
          });

          const rowHeader1 = $('.ht_clone_left tr:eq(1) th:eq(0)');
          const rowHeader2 = $('.ht_clone_left tr:eq(4) th:eq(0)');

          rowHeader1.simulate('mousedown');
          rowHeader1.simulate('mouseup');

          rowHeader2.simulate('mousedown', { shiftKey: true });
          rowHeader2.simulate('mouseup');

          contextMenu();

          const $showRowItem = $('.htContextMenu tbody td:not(.htSeparator)');

          expect($showRowItem.text()).toEqual(SHOW_ROW_PLURAL_IN_POLISH);
        });

        it('selection started from higher to lower row index', () => {
          handsontable({
            startRows: 6,
            startCols: 6,
            language: POLISH_LANGUAGE_CODE,
            contextMenu: ['hidden_rows_show'],
            rowHeaders: true,
            hiddenRows: {
              rows: [2, 3]
            }
          });

          const rowHeader1 = $('.ht_clone_left tr:eq(1) th:eq(0)');
          const rowHeader2 = $('.ht_clone_left tr:eq(4) th:eq(0)');

          rowHeader2.simulate('mousedown');
          rowHeader2.simulate('mouseup');

          rowHeader1.simulate('mousedown', { shiftKey: true });
          rowHeader1.simulate('mouseup');

          contextMenu();

          const $showRowItem = $('.htContextMenu tbody td:not(.htSeparator)');

          expect($showRowItem.text()).toEqual(SHOW_ROW_PLURAL_IN_POLISH);
        });
      });
    });

    describe('hiddenColumns plugin enabled', () => {
      const HIDE_COLUMN_SINGULAR_IN_POLISH = 'Ukryj kolumnę';
      const HIDE_COLUMN_PLURAL_IN_POLISH = 'Ukryj kolumny';

      const SHOW_COLUMN_SINGULAR_IN_POLISH = 'Pokaż kolumnę';
      const SHOW_COLUMN_PLURAL_IN_POLISH = 'Pokaż kolumny';

      it('should show singular form of phrase when choosing from `Hide column / Hide columns` options in the specific situation (selected one column)', () => {
        handsontable({
          language: POLISH_LANGUAGE_CODE,
          contextMenu: ['hidden_columns_hide'],
          colHeaders: true,
          hiddenColumns: true
        });

        const columnHeader = $('.ht_clone_top tr:eq(0) th:eq(0)');

        columnHeader.simulate('mousedown');
        columnHeader.simulate('mouseup');

        contextMenu();

        const $hideColumnItem = $('.htContextMenu tbody td:not(.htSeparator)');

        expect($hideColumnItem.text()).toEqual(HIDE_COLUMN_SINGULAR_IN_POLISH);
      });

      describe('should show plural form of phrase when choosing from `Hide column / Hide columns` options in the specific situation (selected few columns)', () => {
        it('selection started from lower to higher column index', () => {
          handsontable({
            language: POLISH_LANGUAGE_CODE,
            contextMenu: ['hidden_columns_hide'],
            colHeaders: true,
            hiddenColumns: true
          });

          const $columnHeader1 = $('.ht_clone_top tr:eq(0) th:eq(1)');
          const $columnHeader2 = $('.ht_clone_top tr:eq(0) th:eq(2)');

          $columnHeader1.simulate('mousedown');
          $columnHeader1.simulate('mouseup');

          $columnHeader2.simulate('mousedown', { shiftKey: true });
          $columnHeader2.simulate('mouseup');

          contextMenu();

          const $hideColumnItem = $('.htContextMenu tbody td:not(.htSeparator)');

          expect($hideColumnItem.text()).toEqual(HIDE_COLUMN_PLURAL_IN_POLISH);
        });

        it('selection started from higher to lower column index', () => {
          handsontable({
            language: POLISH_LANGUAGE_CODE,
            contextMenu: ['hidden_columns_hide'],
            colHeaders: true,
            hiddenColumns: true
          });

          const $columnHeader1 = $('.ht_clone_top tr:eq(0) th:eq(1)');
          const $columnHeader2 = $('.ht_clone_top tr:eq(0) th:eq(2)');

          $columnHeader2.simulate('mousedown');
          $columnHeader2.simulate('mouseup');

          $columnHeader1.simulate('mousedown', { shiftKey: true });
          $columnHeader1.simulate('mouseup');

          contextMenu();

          const $hideColumnItem = $('.htContextMenu tbody td:not(.htSeparator)');

          expect($hideColumnItem.text()).toEqual(HIDE_COLUMN_PLURAL_IN_POLISH);
        });
      });

      it('should show singular form of phrase when choosing from `Show column / Show columns` options in the specific situation (hidden first column)', () => {
        handsontable({
          language: POLISH_LANGUAGE_CODE,
          contextMenu: ['hidden_columns_show'],
          colHeaders: true,
          hiddenColumns: {
            columns: [0]
          }
        });

        const columnHeader = $('.ht_clone_top tr:eq(0) th:eq(0)');

        columnHeader.simulate('mousedown');
        columnHeader.simulate('mouseup');

        contextMenu();

        const $showColumnItem = $('.htContextMenu tbody td:not(.htSeparator)');

        expect($showColumnItem.text()).toEqual(SHOW_COLUMN_SINGULAR_IN_POLISH);
      });

      it('should show singular form of phrase when choosing from `Show column / Show columns` options in the specific situation (hidden last column)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          language: POLISH_LANGUAGE_CODE,
          contextMenu: ['hidden_columns_show'],
          colHeaders: true,
          hiddenColumns: {
            columns: [4]
          }
        });

        const $columnHeader = $('.ht_clone_top tr:eq(0) th:eq(3)');

        $columnHeader.simulate('mousedown');
        $columnHeader.simulate('mouseup');

        contextMenu();

        const $showColumnItem = $('.htContextMenu tbody td:not(.htSeparator)');

        expect($showColumnItem.text()).toEqual(SHOW_COLUMN_SINGULAR_IN_POLISH);
      });

      it('should show singular form of phrase when choosing from `Show column / Show columns` options in the specific situation (hidden column from the middle)', () => {
        handsontable({
          startRows: 6,
          startCols: 6,
          language: POLISH_LANGUAGE_CODE,
          contextMenu: ['hidden_columns_show'],
          colHeaders: true,
          hiddenColumns: {
            columns: [2]
          }
        });

        const $columnHeader1 = $('.ht_clone_top tr:eq(0) th:eq(1)');
        const $columnHeader2 = $('.ht_clone_top tr:eq(0) th:eq(2)');

        $columnHeader1.simulate('mousedown');
        $columnHeader1.simulate('mouseup');

        $columnHeader2.simulate('mousedown', { shiftKey: true });
        $columnHeader2.simulate('mouseup');

        contextMenu();

        const $showColumnItem = $('.htContextMenu tbody td:not(.htSeparator)');

        expect($showColumnItem.text()).toEqual(SHOW_COLUMN_SINGULAR_IN_POLISH);
      });

      it('should show plural form of phrase when choosing from `Show column / Show columns` options in the specific situation (hidden first columns)', () => {
        handsontable({
          language: POLISH_LANGUAGE_CODE,
          contextMenu: ['hidden_columns_show'],
          colHeaders: true,
          hiddenColumns: {
            columns: [0, 1]
          }
        });

        const $columnHeader = $('.ht_clone_top tr:eq(0) th:eq(0)');

        $columnHeader.simulate('mousedown');
        $columnHeader.simulate('mouseup');

        contextMenu();

        const $showColumnItem = $('.htContextMenu tbody td:not(.htSeparator)');

        expect($showColumnItem.text()).toEqual(SHOW_COLUMN_PLURAL_IN_POLISH);
      });

      it('should show plural form of phrase when choosing from `Show column / Show columns` options in the specific situation (hidden last columns)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          language: POLISH_LANGUAGE_CODE,
          contextMenu: ['hidden_columns_show'],
          colHeaders: true,
          hiddenColumns: {
            columns: [3, 4]
          }
        });

        const $columnHeader = $('.ht_clone_top tr:eq(0) th:eq(2)');

        $columnHeader.simulate('mousedown');
        $columnHeader.simulate('mouseup');

        contextMenu();

        const $showColumnItem = $('.htContextMenu tbody td:not(.htSeparator)');

        expect($showColumnItem.text()).toEqual(SHOW_COLUMN_PLURAL_IN_POLISH);
      });

      describe('should show plural form of phrase when choosing from `Show column / Show columns` options in the specific situation ' +
        '(hidden column from the middle)', () => {
        it('selection started from lower to higher column index', () => {
          handsontable({
            startRows: 6,
            startCols: 6,
            language: POLISH_LANGUAGE_CODE,
            contextMenu: ['hidden_columns_show'],
            colHeaders: true,
            hiddenColumns: {
              columns: [2, 3]
            }
          });

          const $columnHeader1 = $('.ht_clone_top tr:eq(0) th:eq(1)');
          const $columnHeader2 = $('.ht_clone_top tr:eq(0) th:eq(4)');

          $columnHeader1.simulate('mousedown');
          $columnHeader1.simulate('mouseup');

          $columnHeader2.simulate('mousedown', { shiftKey: true });
          $columnHeader2.simulate('mouseup');

          contextMenu();

          const $showColumnItem = $('.htContextMenu tbody td:not(.htSeparator)');

          expect($showColumnItem.text()).toEqual(SHOW_COLUMN_PLURAL_IN_POLISH);
        });

        it('selection started from higher to lower column index', () => {
          handsontable({
            startRows: 6,
            startCols: 6,
            language: POLISH_LANGUAGE_CODE,
            contextMenu: ['hidden_columns_show'],
            colHeaders: true,
            hiddenColumns: {
              columns: [2, 3]
            }
          });

          const $columnHeader1 = $('.ht_clone_top tr:eq(0) th:eq(1)');
          const $columnHeader2 = $('.ht_clone_top tr:eq(0) th:eq(4)');

          $columnHeader2.simulate('mousedown');
          $columnHeader2.simulate('mouseup');

          $columnHeader1.simulate('mousedown', { shiftKey: true });
          $columnHeader1.simulate('mouseup');

          contextMenu();

          const $showColumnItem = $('.htContextMenu tbody td:not(.htSeparator)');

          expect($showColumnItem.text()).toEqual(SHOW_COLUMN_PLURAL_IN_POLISH);
        });
      });
    });
  });
});
