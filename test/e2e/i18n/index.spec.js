describe('i18n', () => {
  const id = 'testContainer';

  beforeEach(function () {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  const POLISH_LANGUAGE_CODE = 'pl-PL';
  const INSERT_COLUMN_LEFT_IN_POLISH_LANGUAGE = 'Wstaw kolumnę po lewej';
  const FILTERS_CONDITIONS_NONE_IN_POLISH_LANGUAGE = 'Brak';
  const FILTERS_VALUES_BLANK_CELLS_IN_POLISH_LANGUAGE = '(Puste komórki)';

  describe('dropdown translation', () => {
    it('should translate dropdownMenu UI when setting existing language at start', async () => {
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
    it('should translate filters condition inside dropdownMenu UI when setting existing language at start #1', async () => {
      handsontable({
        language: POLISH_LANGUAGE_CODE,
        colHeaders: true,
        dropdownMenu: true,
        filters: true
      });

      dropdownMenu(0);

      expect($('.htFiltersMenuCondition .htUISelectCaption').eq(0).text()).toEqual(FILTERS_CONDITIONS_NONE_IN_POLISH_LANGUAGE);
    });

    it('should translate filters condition inside dropdownMenu UI when setting existing language at start #2', async () => {
      const FILTERS_CONDITIONS_EMPTY_IN_POLISH_LANGUAGE = 'Jest pusty';

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

    it('should translate label inside dropdownMenu UI when setting existing language at start', async () => {
      const FILTERS_LABELS_FILTER_BY_CONDITION_IN_POLISH_LANGUAGE = 'Filtruj na podstawie warunku:';

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

    it('should translate button inside dropdownMenu UI when setting existing language at start', async () => {
      const FILTERS_BUTTONS_SELECT_ALL_IN_POLISH_LANGUAGE = 'Wybierz wszystkie';

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

    it('should translate placeholder of button inside dropdownMenu UI when setting existing language at start', async () => {
      const FILTERS_BUTTONS_PLACEHOLDER_SEARCH_IN_POLISH_LANGUAGE = 'Szukaj...';

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

    it('should translate empty value inside values component at start', () => {
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
  });

  describe('contextMenu translation', () => {
    it('should translate item from enabled `nestedRows` plugin when setting existing language code at start', async () => {
      const NESTED_ROWS_INSERT_CHILD_IN_POLISH = 'Wstaw wiersz dziecko';

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

      const $copyMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($copyMenuItem.text()).toEqual(NESTED_ROWS_INSERT_CHILD_IN_POLISH);
    });

    it('should translate item from enabled `hiddenColumns` plugin when setting existing language code at start', async () => {
      const HIDE_COLUMN_IN_POLISH = 'Ukryj kolumnę';

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

      const $copyMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($copyMenuItem.text()).toEqual(HIDE_COLUMN_IN_POLISH);
    });

    it('should translate item from enabled `hiddenRows` plugin when setting existing language code at start', async () => {
      const HIDE_ROW_IN_POLISH = 'Ukryj wiersz';

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

      const $copyMenuItem = $('.htContextMenu tbody td:not(.htSeparator)');

      expect($copyMenuItem.text()).toEqual(HIDE_ROW_IN_POLISH);
    });
  });
});
