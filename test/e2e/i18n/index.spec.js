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
  const INSERT_COLUMN_LEFT_IN_POLISH_LANGUAGE = 'Umieść kolumnę po lewej';
  const FILTERS_CONDITIONS_NONE_IN_POLISH_LANGUAGE = 'Brak';
  const FILTERS_CONDITIONS_EMPTY_IN_POLISH_LANGUAGE = 'Jest pusty';
  const FILTERS_LABELS_FILTER_BY_CONDITION_IN_POLISH_LANGUAGE = 'Filtruj na podstawie warunku:';
  const FILTERS_BUTTONS_SELECT_ALL_IN_POLISH_LANGUAGE = 'Wybierz wszystkie';
  const FILTERS_BUTTONS_PLACEHOLDER_SEARCH_IN_POLISH_LANGUAGE = 'Szukaj...';

  describe('dropdown translation', () => {
    it('should translate dropdownMenu UI when setting existing language at start', async () => {
      handsontable({
        language: POLISH_LANGUAGE_CODE,
        colHeaders: true,
        dropdownMenu: true
      });

      dropdownMenu(0);

      const $dropdownMenuItem = $('.htDropdownMenu tbody td:not(.htSeparator)').eq(0);

      expect($dropdownMenuItem.text()).toEqual(INSERT_COLUMN_LEFT_IN_POLISH_LANGUAGE);

      await sleep(300);
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

      await sleep(300);

      expect($('.htFiltersMenuCondition .htUISelectCaption').eq(0).text()).toEqual(FILTERS_CONDITIONS_NONE_IN_POLISH_LANGUAGE);
    });

    it('should translate filters condition inside dropdownMenu UI when setting existing language at start #2', async () => {
      handsontable({
        language: POLISH_LANGUAGE_CODE,
        colHeaders: true,
        dropdownMenu: true,
        filters: true
      });

      dropdownMenu(0);

      await sleep(300);

      $('.htUISelect').eq(0).simulate('click');

      await sleep(300);

      const $contextMenuItems = $('.htFiltersConditionsMenu tbody td:not(.htSeparator)');

      expect($contextMenuItems.eq(0).text()).toEqual(FILTERS_CONDITIONS_NONE_IN_POLISH_LANGUAGE);
      expect($contextMenuItems.eq(1).text()).toEqual(FILTERS_CONDITIONS_EMPTY_IN_POLISH_LANGUAGE);
    });


    it('should translate label inside dropdownMenu UI when setting existing language at start', async () => {
      handsontable({
        language: POLISH_LANGUAGE_CODE,
        colHeaders: true,
        dropdownMenu: true,
        filters: true
      });

      dropdownMenu(0);

      await sleep(300);

      const $filterByConditionLabel = $('.htFiltersMenuLabel').eq(0);

      expect($filterByConditionLabel.text()).toEqual(FILTERS_LABELS_FILTER_BY_CONDITION_IN_POLISH_LANGUAGE);
    });

    it('should translate button inside dropdownMenu UI when setting existing language at start', async () => {
      handsontable({
        language: POLISH_LANGUAGE_CODE,
        colHeaders: true,
        dropdownMenu: true,
        filters: true
      });

      dropdownMenu(0);

      await sleep(300);

      const $selectAllButton = $('.htUISelectAll').eq(0);

      expect($selectAllButton.text()).toEqual(FILTERS_BUTTONS_SELECT_ALL_IN_POLISH_LANGUAGE);
    });

    it('should translate placeholder of button inside dropdownMenu UI when setting existing language at start', async () => {
      handsontable({
        language: POLISH_LANGUAGE_CODE,
        colHeaders: true,
        dropdownMenu: true,
        filters: true
      });

      dropdownMenu(0);

      await sleep(300);

      const $searchInputPlaceholder = $('.htUIMultipleSelectSearch.htUIInput input').eq(0);

      expect($searchInputPlaceholder.attr('placeholder')).toEqual(FILTERS_BUTTONS_PLACEHOLDER_SEARCH_IN_POLISH_LANGUAGE);
    });
  });
});
