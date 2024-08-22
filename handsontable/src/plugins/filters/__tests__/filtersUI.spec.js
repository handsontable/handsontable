describe('Filters UI', () => {
  const id = 'testContainer';

  beforeAll(() => {
    // Note: please keep in mind that this language will be registered for all e2e tests!
    // It's stored globally for already loaded Handsontable library.
    Handsontable.languages.registerLanguageDictionary({
      languageCode: 'longerForTests',
      'Filters:conditions.isEmpty': 'This is very long text for conditional menu item'
    });
  });

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('Conditional component', () => {
    it('should display conditional filter component under dropdown menu', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);

      expect(dropdownMenuRootElement().querySelector('.htFiltersMenuCondition .htFiltersMenuLabel').textContent)
        .toBe('Filter by condition:');
      expect(dropdownMenuRootElement().querySelector('.htFiltersMenuCondition .htUISelect')).not.toBeNull();
      expect(dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput').length).toBe(2);

      await sleep(300);

      // The filter components should be intact after some time. These expectations check whether the GhostTable
      // does not steal the components' element while recalculating column width (PR #5555).
      expect(dropdownMenuRootElement().querySelector('.htFiltersMenuCondition .htFiltersMenuLabel').textContent)
        .toBe('Filter by condition:');
      expect(dropdownMenuRootElement().querySelector('.htFiltersMenuCondition .htUISelect')).not.toBeNull();
      expect(dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput').length).toBe(2);
    });

    it('should appear conditional options menu after UISelect element click', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      expect(document.querySelector('.htFiltersConditionsMenu.handsontable table')).toBeNull();

      dropdownMenu(1);
      openDropdownByConditionMenu();

      expect(document.querySelector('.htFiltersConditionsMenu.handsontable table')).not.toBeNull();
    });

    it('should have no rendered overlays visible', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();

      const conditionalMenu = $(conditionMenuRootElements().first);

      expect(conditionalMenu.find('.ht_clone_top:visible').length).toBe(0);
      expect(conditionalMenu.find('.ht_clone_bottom:visible').length).toBe(0);
      expect(conditionalMenu.find('.ht_clone_inline_start:visible').length).toBe(0);
      expect(conditionalMenu.find('.ht_clone_top_inline_start_corner:visible').length).toBe(0);
      expect(conditionalMenu.find('.ht_clone_bottom_inline_start_corner:visible').length).toBe(0);
    });

    it('should appear conditional options menu in the proper place after UISelect element click', () => {
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      hot.rootElement.style.marginTop = '1000px';

      dropdownMenu(1);
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');

      const rect = document.querySelector('.htFiltersConditionsMenu.handsontable table').getBoundingClientRect();

      expect(window.scrollY + rect.top).toBe(914);
      hot.rootElement.style.marginTop = '';
    });

    it('should appear specified conditional options menu for text cell types', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();

      const menuItems = $(conditionMenuRootElements().first).find('.htCore tr').map(function() {
        return this.textContent;
      }).toArray();

      expect(menuItems).toEqual([
        'None',
        '',
        'Is empty',
        'Is not empty',
        '',
        'Is equal to',
        'Is not equal to',
        '',
        'Begins with',
        'Ends with',
        '',
        'Contains',
        'Does not contain',
      ]);
    });

    it('should appear specified conditional options menu for numeric cell types', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(5);
      openDropdownByConditionMenu();

      const menuItems = $(conditionMenuRootElements().first).find('.htCore tr').map(function() {
        return this.textContent;
      }).toArray();

      expect(menuItems).toEqual([
        'None',
        '',
        'Is empty',
        'Is not empty',
        '',
        'Is equal to',
        'Is not equal to',
        '',
        'Greater than',
        'Greater than or equal to',
        'Less than',
        'Less than or equal to',
        'Is between',
        'Is not between'
      ]);
    });

    it('should appear specified conditional options menu for date cell types', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(3);
      openDropdownByConditionMenu();

      const menuItems = $(conditionMenuRootElements().first).find('.htCore tr').map(function() {
        return this.textContent;
      }).toArray();

      expect(menuItems).toEqual([
        'None',
        '',
        'Is empty',
        'Is not empty',
        '',
        'Is equal to',
        'Is not equal to',
        '',
        'Before',
        'After',
        'Is between',
        '',
        'Tomorrow',
        'Today',
        'Yesterday',
      ]);
    });

    it('should appear general conditional options menu for mixed cell types', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300,
        cells(row, col) {
          if (col === 3 && row === 2) {
            this.type = 'text';
          }
        }
      });

      dropdownMenu(3);
      openDropdownByConditionMenu();

      const menuItems = $(conditionMenuRootElements().first).find('.htCore tr').map(function() {
        return this.textContent;
      }).toArray();

      expect(menuItems).toEqual([
        'None',
        '',
        'Is empty',
        'Is not empty',
        '',
        'Is equal to',
        'Is not equal to',
        '',
        'Begins with',
        'Ends with',
        '',
        'Contains',
        'Does not contain',
      ]);
    });

    it('should appear an empty conditional options menu when the dropdown is opened using API and ' +
       'the table has no selection', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      getPlugin('dropdownMenu').open({
        top: 100,
        left: 100,
      });
      openDropdownByConditionMenu();

      const menuItems = $(conditionMenuRootElements().first).find('.htCore tr').map(function() {
        return this.textContent;
      }).toArray();

      expect(menuItems).toEqual([
        'None',
      ]);
    });

    it('should appear conditional options menu based on the selection highlight when the dropdown is opened ' +
       'using API and the table has non-contiguous selection', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      // the highlight cell points to the 6, 3 (the selected column is 3)
      selectCells([
        [1, 0, 2, 1],
        [4, 2, 4, 4],
        [6, 3, 6, 1],
      ]);
      getPlugin('dropdownMenu').open({
        top: 100,
        left: 100,
      });
      openDropdownByConditionMenu();

      const menuItems = $(conditionMenuRootElements().first).find('.htCore tr').map(function() {
        return this.textContent;
      }).toArray();

      expect(menuItems).toEqual([
        'None',
        '',
        'Is empty',
        'Is not empty',
        '',
        'Is equal to',
        'Is not equal to',
        '',
        'Before',
        'After',
        'Is between',
        '',
        'Tomorrow',
        'Today',
        'Yesterday',
      ]);
    });

    it('should not select dropdown menu item while pressing arrow up key when filter\'s input component is focused (#6506)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300,
      });

      dropdownMenu(2);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Is equal to');

      await sleep(100); // Wait for autofocus of the filter input element

      document.activeElement.value = '123';

      keyDownUp('arrowup');
      keyDownUp('arrowup');
      keyDownUp('arrowup');

      // The menu item is frozen on the lastly selected item
      expect(getPlugin('dropdownMenu').menu.getSelectedItem().key).toBe('filter_by_condition');
    });

    it('should appear specified conditional options menu depends on cell types when table has all filtered rows', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(3);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Is empty');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK')).simulate('click');

      dropdownMenu(3);
      openDropdownByConditionMenu();

      const menuItems = $(conditionMenuRootElements().first).find('.htCore tr').map(function() {
        return this.textContent;
      }).toArray();

      expect(menuItems).toEqual([
        'None',
        '',
        'Is empty',
        'Is not empty',
        '',
        'Is equal to',
        'Is not equal to',
        '',
        'Before',
        'After',
        'Is between',
        '',
        'Tomorrow',
        'Today',
        'Yesterday',
      ]);
    });

    it('should disappear conditional options menu after outside the table click', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();

      expect(document.querySelector('.htFiltersConditionsMenu.handsontable table')).not.toBeNull();

      $(document.body).simulate('mousedown');

      expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
    });

    it('should disappear conditional options menu after click inside main menu', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();

      expect(document.querySelector('.htFiltersConditionsMenu.handsontable table')).not.toBeNull();

      $(document.querySelector('.htDropdownMenu.handsontable table tr td')).simulate('mousedown');

      expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
      expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);
    });

    it('should disappear conditional options menu after dropdown action click', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();

      expect(document.querySelector('.htFiltersConditionsMenu.handsontable table')).not.toBeNull();

      selectDropdownMenuOption('Clear column');

      expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
    });

    it('should disappear dropdown menu after hitting ESC key in conditional component ' +
      'which show other input and focus the element', (done) => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Is equal to');

      setTimeout(() => {
        keyDownUp('escape');

        expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
        expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
        done();
      }, 200);
    });

    it('should disappear dropdown menu after hitting ESC key in conditional component ' +
      'which don\'t show other input and focus is loosen #86', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      const button = hot().view._wt.wtTable.getColumnHeader(1).querySelector('.changeType');

      $(button).simulate('mousedown');

      // This sleep emulates more realistic user behavior. The `mouseup` event in all cases is not
      // triggered directly after the `mousedown` event. First of all, a user is not able to
      // click so fast. Secondly, there can be a device lag between `mousedown` and `mouseup`
      // events. This fixes an issue related to failing test, which works on browser under
      // user control but fails while automatic tests.
      await sleep(0);

      $(button).simulate('mouseup');
      $(button).simulate('click');

      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Is empty');

      await sleep(200);
      keyDownUp('escape');

      expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
      expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
    });

    it('should disappear dropdown menu after hitting ESC key, next to closing SelectUI #149', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      const button = hot().view._wt.wtTable.getColumnHeader(1).querySelector('.changeType');

      $(button).simulate('mousedown');

      // This sleep emulates more realistic user behavior. The `mouseup` event in all cases is not
      // triggered directly after the `mousedown` event. First of all, a user is not able to
      // click so fast. Secondly, there can be a device lag between `mousedown` and `mouseup`
      // events. This fixes an issue related to failing test, which works on browser under
      // user control but fails while automatic tests.
      await sleep(0);

      $(button).simulate('mouseup');
      $(button).simulate('click');

      openDropdownByConditionMenu();

      await sleep(200);

      keyDownUp('escape');
      keyDownUp('escape');

      expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
      expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
    });

    it('should focus dropdown menu after closing select component', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      // is empty (test for condition which doesn't have input elements to provide filtered values)
      selectDropdownByConditionMenuOption('Is empty');

      expect(getPlugin('dropdownMenu').menu.hotMenu.isListening()).toBe(true);

      // is equal to (test for condition which has input elements to provide filtered values, that focusable elements
      // can cause the menu focus)
      selectDropdownByConditionMenuOption('Is equal to');

      expect(getPlugin('dropdownMenu').menu.hotMenu.isListening()).toBe(true);
    });

    it('should not blur filter component\'s input element when it is clicked', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Is equal to');

      await sleep(50);

      const inputElement = dropdownMenuRootElement().querySelector('.htUIInput input');

      $(inputElement)
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(document.activeElement).toBe(inputElement);
    });

    it('shouldn\'t disappear dropdown menu after conditional options menu click', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Is empty');

      expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);
      expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
    });

    describe('should display extra conditional component inside filters dropdownMenu properly #160', () => {
      it('should not display extra condition element at start', () => {
        handsontable({
          data: getDataForFilters(),
          columns: getColumnsForFilters(),
          filters: true,
          dropdownMenu: true,
          width: 500,
          height: 300
        });

        dropdownMenu(1);
        expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
      });

      it('should show extra condition element after specific conditional options menu click', () => {
        handsontable({
          data: getDataForFilters(),
          columns: getColumnsForFilters(),
          filters: true,
          dropdownMenu: true,
          width: 500,
          height: 300
        });

        dropdownMenu(1);
        openDropdownByConditionMenu();
        selectDropdownByConditionMenuOption('Begins with');

        expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);
        expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
        expect($(conditionSelectRootElements().second).is(':visible')).toBe(true);
      });

      it('should not show extra condition element after specific conditional options menu click', () => {
        handsontable({
          data: getDataForFilters(),
          columns: getColumnsForFilters(),
          filters: true,
          dropdownMenu: true,
          width: 500,
          height: 300
        });

        dropdownMenu(1);
        openDropdownByConditionMenu();
        selectDropdownByConditionMenuOption('None');

        expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);
        expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
        expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
      });

      it('should hide extra condition element after specific conditional options menu click', () => {
        handsontable({
          data: getDataForFilters(),
          columns: getColumnsForFilters(),
          filters: true,
          dropdownMenu: true,
          width: 500,
          height: 300
        });

        dropdownMenu(1);
        openDropdownByConditionMenu();
        selectDropdownByConditionMenuOption('Is equal to');

        openDropdownByConditionMenu();
        selectDropdownByConditionMenuOption('None');

        expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);
        expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
        expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
      });

      it('should not show extra condition elements after changing value of cell when conditions wasn\'t set' +
        '(`conditionUpdateObserver` triggers hook)', () => {
        handsontable({
          data: getDataForFilters(),
          columns: getColumnsForFilters(),
          filters: true,
          dropdownMenu: true,
          width: 500,
          height: 300
        });

        selectCell(3, 0);
        keyDownUp('enter');
        document.activeElement.value = '99';
        keyDownUp('enter');

        dropdownMenu(1);

        expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
        expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(false);
      });

      it('should show proper condition elements after changing value of cell when condition was set' +
        '(`conditionUpdateObserver` triggers hook)', () => {
        const hot = handsontable({
          data: getDataForFilters(),
          columns: getColumnsForFilters(),
          filters: true,
          dropdownMenu: true,
          width: 500,
          height: 300
        });

        const filters = hot.getPlugin('filters');

        filters.addCondition(1, 'gte', [10]);
        filters.filter();

        selectCell(3, 0);
        keyDownUp('enter');
        document.activeElement.value = '99';
        keyDownUp('enter');

        dropdownMenu(1);

        expect($(conditionSelectRootElements().first).is(':visible')).toBe(true);
        expect($(conditionSelectRootElements().second).is(':visible')).toBe(true);
        expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(true);
      });
    });

    it('should not select separator from conditional menu', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      // menu separator click
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(2) td'))
        .simulate('mouseenter')
        .simulate('mousedown')
        .simulate('mouseup');

      expect($(conditionSelectRootElements().first).find('.htUISelectCaption').text()).toBe('None');
    });

    it('should save state of applied filter for specified column', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(0);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Is equal to');

      await sleep(200);

      // Is equal to '5'
      document.activeElement.value = '5';
      keyUp('5');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      dropdownMenu(0);

      expect(dropdownMenuRootElement().querySelector('.htUISelectCaption').textContent).toBe('Is equal to');

      let inputs = dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput input');

      expect($(inputs[0]).is(':visible')).toBe(true);
      expect(inputs[0].value).toBe('5');
      expect($(inputs[1]).is(':visible')).toBe(false);

      dropdownMenu(3);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Is between');

      await sleep(200);

      // Is equal to '5'
      document.activeElement.value = '5';
      keyUp('5');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      dropdownMenu(3);

      expect(dropdownMenuRootElement().querySelector('.htUISelectCaption').textContent).toBe('Is between');

      inputs = dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput input');

      expect($(inputs[0]).is(':visible')).toBe(true);
      expect(inputs[0].value).toBe('5');
      expect($(inputs[1]).is(':visible')).toBe(true);
      expect(inputs[1].value).toBe('');
    });

    it('should save state of applied filter for specified column when conditions was added from API', (done) => {
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'gte', [10]);
      filters.filter();

      dropdownMenu(1);

      setTimeout(() => {
        expect(dropdownMenuRootElement().querySelector('.htUISelectCaption').textContent)
          .toBe('Greater than or equal to');

        const inputs = dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput input');

        expect($(inputs[0]).is(':visible')).toBe(true);
        expect(inputs[0].value).toBe('10');
        expect($(inputs[1]).is(':visible')).toBe(false);

        filters.clearConditions(1);
        filters.filter();

        dropdownMenu(1);
      }, 200);

      setTimeout(() => {
        expect(dropdownMenuRootElement().querySelector('.htUISelectCaption').textContent).toBe('None');

        const inputs = dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput input');

        expect($(inputs[0]).is(':visible')).toBe(false);
        expect($(inputs[1]).is(':visible')).toBe(false);
        done();
      }, 400);
    });

    it('should work properly when user added condition with too many arguments #179', async() => {
      const spy = spyOn(window, 'onerror');
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      const plugin = hot.getPlugin('filters');
      const th = hot.view._wt.wtTable.getColumnHeader(1);
      const filterButton = $(th).find('button');

      plugin.addCondition(1, 'begins_with', ['a', 'b', 'c', 'd']);

      $(filterButton).simulate('click');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('"by value" component', () => {
    it('should appear under dropdown menu', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);

      expect(dropdownMenuRootElement().querySelector('.htFiltersMenuValue .htFiltersMenuLabel').textContent)
        .toBe('Filter by value:');
      expect(dropdownMenuRootElement().querySelector('.htFiltersMenuValue .htUIMultipleSelect')).not.toBeNull();

      await sleep(300);

      // The filter components should be intact after some time. These expectations check whether the GhostTable
      // does not steal the components' element while recalculating column width (PR #5555).
      expect(dropdownMenuRootElement().querySelector('.htFiltersMenuValue .htFiltersMenuLabel').textContent)
        .toBe('Filter by value:');
      expect(dropdownMenuRootElement().querySelector('.htFiltersMenuValue .htUIMultipleSelect')).not.toBeNull();
    });

    it('should appear an empty list when the dropdown is opened using API and the table has no selection', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      getPlugin('dropdownMenu').open({
        top: 100,
        left: 100,
      });

      expect(byValueMultipleSelect().element.querySelectorAll('.htCore td').length).toBe(0);
    });

    it('should appear a list from the column selected by the selection highlight when the dropdown is opened ' +
       'using API and the table has non-contiguous selection', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      // the highlight cell points to the 6, 3 (the selected column is 3)
      selectCells([
        [1, 0, 2, 1],
        [4, 2, 4, 4],
        [6, 3, 6, 1],
      ]);
      getPlugin('dropdownMenu').open({
        top: 100,
        left: 100,
      });

      expect(byValueMultipleSelect().element.querySelectorAll('.htCore td').length).toBe(7);
      expect(byValueMultipleSelect().element.querySelector('.htCore td').textContent).toBe('2014-01-08');
    });

    it('should not scroll the view after selecting the item (test for checking if the event bubbling is not blocked, #6497)', async() => {
      handsontable({
        data: getDataForFilters().slice(0, 15),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(2);

      await sleep(200);

      $(byValueBoxRootElement()).find('tr:nth-child(1) :checkbox')
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect($(byValueBoxRootElement()).find('.ht_master .wtHolder').scrollTop()).toBe(0);

      $(byValueBoxRootElement()).find('tr:nth-child(5) :checkbox').simulate('mouseover');
      $(byValueBoxRootElement()).find('tr:nth-child(6) :checkbox').simulate('mouseover');
      $(byValueBoxRootElement()).find('tr:nth-child(7) :checkbox').simulate('mouseover');

      await sleep(200);

      expect($(byValueBoxRootElement()).find('.ht_master .wtHolder').scrollTop()).toBe(0);
    });

    it('should display empty values as "(Blank cells)"', () => {
      const data = getDataForFilters();

      data[3].name = '';

      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);

      expect(byValueMultipleSelect().element.querySelector('.htCore td').textContent).toBe('Alice Blake');

      loadData(data);
      dropdownMenu(1);

      expect(byValueMultipleSelect().element.querySelector('.htCore td').textContent).toBe('(Blank cells)');
    });

    it('should display `null` values as "(Blank cells)"', () => {
      const data = getDataForFilters();

      data[3].name = null;

      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);

      expect(byValueMultipleSelect().element.querySelector('.htCore td').textContent).toBe('Alice Blake');

      loadData(data);
      dropdownMenu(1);

      expect(byValueMultipleSelect().element.querySelector('.htCore td').textContent).toBe('(Blank cells)');
    });

    it('should display `undefined` values as "(Blank cells)"', () => {
      const data = getDataForFilters();

      data[3].name = undefined;

      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);

      expect(byValueMultipleSelect().element.querySelector('.htCore td').textContent).toBe('Alice Blake');

      loadData(data);
      dropdownMenu(1);

      expect(byValueMultipleSelect().element.querySelector('.htCore td').textContent).toBe('(Blank cells)');
    });

    it('should utilize the `modifyFiltersMultiSelectValue` hook to display the cell value', () => {
      const columnsSetting = getColumnsForFilters();

      handsontable({
        data: getDataForFilters(),
        columns: columnsSetting,
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300,
        modifyFiltersMultiSelectValue: (value) => {
          return `Pre ${value}`;
        },
      });

      dropdownMenu(1);

      const unifiedColDataSample = [
        'Alice Blake', 'Alyssa Francis', 'Becky Ross', 'Bridges Sawyer', 'Burt Cash', 'Carissa Villarreal'
      ];

      for (let i = 0; i < unifiedColDataSample.length; i++) {
        expect(
          byValueMultipleSelect().element.querySelectorAll('.htCore td')[i].textContent
        ).toBe(`Pre ${unifiedColDataSample[i]}`);
      }
      expect(unifiedColDataSample.length).toBe(6);
    });

    it('should display the formatted renderer output in the multi-selection component if the column being filtered ' +
      'is numeric-typed', () => {
      handsontable({
        data: [
          [1, 6],
          [2, 7],
          [3, 8],
          [4, 9],
          [5, 10],
        ],
        colHeaders: true,
        dropdownMenu: true,
        filters: true,
        columns: [
          {},
          {
            type: 'numeric',
            numericFormat: {
              pattern: '$0,0.00',
            }
          }
        ]
      });

      dropdownMenu(1);

      for (let i = 0; i < countRows(); i++) {
        expect(
          byValueMultipleSelect().element.querySelectorAll('.htCore td')[i].textContent
        ).toBe(`$${getDataAtCell(i, 1)}.00`);
      }
    });

    it('shouldn\'t break "by value" items in the next filter stacks', (done) => {
      const data = getDataForFilters();

      data[3].name = undefined;

      handsontable({
        data,
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);

      setTimeout(() => {
        // deselect "(Blank cells)"
        $(byValueMultipleSelect().element.querySelector('.htUIMultipleSelectHot td input')).simulate('click');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
        dropdownMenu(2);
      }, 200);

      setTimeout(() => {
        // deselect "Alamo"
        $(byValueMultipleSelect().element.querySelector('.htUIMultipleSelectHot td input')).simulate('click');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
        dropdownMenu(1);
      }, 400);

      setTimeout(() => {
        // select "(Blank cells)"
        $(byValueMultipleSelect().element.querySelector('.htUIMultipleSelectHot td input')).simulate('click');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
        dropdownMenu(2);
      }, 600);

      setTimeout(() => {
        expect(byValueMultipleSelect().element.querySelector('.htCore td').textContent).toBe('Alamo');
        done();
      }, 800);
    });

    it('should disappear after hitting ESC key (focused search input)', (done) => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      byValueMultipleSelect().element.querySelector('input').focus();

      setTimeout(() => {
        keyDownUp('escape');

        expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
        expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
        done();
      }, 200);
    });

    it('should disappear after hitting ESC key (focused items box)', (done) => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);

      setTimeout(() => {
        byValueMultipleSelect().focus();
        keyDownUp('escape');
        expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
        expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
        done();
      }, 100);
    });

    describe('Updating "by value" component cache #87', () => {
      it('should update component view after applying filtering and changing cell value', () => {
        handsontable({
          data: [
            {
              id: 1,
              name: 'Nannie Patel',
              address: 'AAA City'
            },
            {
              id: 2,
              name: 'Leanne Ware',
              address: 'BBB City'
            },
            {
              id: 3,
              name: 'Mathis Boone',
              address: 'CCC City'
            },
          ],
          columns: [
            { data: 'id', type: 'numeric', title: 'ID' },
            { data: 'name', type: 'text', title: 'Full name' },
            { data: 'address', type: 'text', title: 'Address' }
          ],
          dropdownMenu: true,
          filters: true,
          width: 500,
          height: 300
        });

        dropdownMenu(2);

        simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
        simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));
        setDataAtCell(0, 2, 'BBB City - modified');

        dropdownMenu(2);
        expect($(byValueBoxRootElement()).find('tr:contains("BBB City - modified")').length).toEqual(1);

        const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
        const checkedArray = checkboxes.map(element => element.checked);

        expect(checkedArray).toEqual([false, true, true]);
      });

      it('should not modify checkboxes if the user changed values in another column', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 2),
          dropdownMenu: true,
          colHeaders: true,
          filters: true,
        });

        const filters = hot.getPlugin('Filters');

        filters.addCondition(0, 'by_value', [['A2', 'A3', 'A4', 'A5']]);
        filters.filter();
        hot.selectCell(0, 1);
        hot.emptySelectedCells();

        dropdownMenu(0);

        const checkboxes = $(byValueBoxRootElement()).find(':checkbox');

        expect(checkboxes[0].checked).toBe(false);
        expect(checkboxes[1].checked).toBe(true);
        expect(checkboxes[2].checked).toBe(true);
        expect(checkboxes[3].checked).toBe(true);
        expect(checkboxes[4].checked).toBe(true);
      });

      it('should show proper number of values after refreshing cache ' +
        '(should remove the value from component), case nr 1 (changing value to match unfiltered value)', () => {
        handsontable({
          data: [
            {
              id: 1,
              name: 'Nannie Patel',
              address: 'AAA City'
            },
            {
              id: 2,
              name: 'Leanne Ware',
              address: 'BBB City'
            },
            {
              id: 3,
              name: 'Mathis Boone',
              address: 'CCC City'
            },
            {
              id: 4,
              name: 'Heather Mcdaniel',
              address: 'DDD City'
            }
          ],
          columns: getColumnsForFilters(),
          dropdownMenu: true,
          filters: true,
          width: 500,
          height: 300
        });

        dropdownMenu(2);

        simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
        simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

        setDataAtCell(0, 2, 'CCC City'); // BBB City -> CCC City
        dropdownMenu(2);

        const elements = $(byValueBoxRootElement()).find('label').toArray();
        const text = elements.map(element => $(element).text());

        expect(text).toEqual(['AAA City', 'CCC City', 'DDD City']);

        const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
        const checkedArray = checkboxes.map(element => element.checked);

        expect(checkedArray).toEqual([false, true, true]);
      });

      it('should show proper number of values after refreshing cache ' +
        '(should remove the value from component), case nr 2 (changing value to match filtered value)', (done) => {
        handsontable({
          data: [
            {
              id: 1,
              name: 'Nannie Patel',
              address: 'AAA City'
            },
            {
              id: 2,
              name: 'Leanne Ware',
              address: 'AAAA City'
            },
            {
              id: 3,
              name: 'Mathis Boone',
              address: 'CCC City'
            },
            {
              id: 4,
              name: 'Heather Mcdaniel',
              address: 'DDD City'
            }
          ],
          columns: [
            { data: 'id', type: 'numeric', title: 'ID' },
            { data: 'name', type: 'text', title: 'Full name' },
            { data: 'address', type: 'text', title: 'Address' }
          ],
          dropdownMenu: true,
          filters: true,
          width: 500,
          height: 300
        });

        dropdownMenu(2);

        simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
        simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

        setDataAtCell(0, 2, 'AAA City'); // AAAA City -> AAA City

        dropdownMenu(2);
        const elements = $(byValueBoxRootElement()).find('label').toArray();
        const text = elements.map(element => $(element).text());

        expect(text).toEqual(['AAA City', 'CCC City', 'DDD City']);
        done();
      });

      it('should show proper number of values after refreshing cache (should add new value to component)', () => {
        handsontable({
          data: [
            {
              id: 1,
              name: 'Nannie Patel',
              address: 'AAA City'
            },
            {
              id: 2,
              name: 'Leanne Ware',
              address: 'BBB City'
            },
            {
              id: 3,
              name: 'Mathis Boone',
              address: 'BBB City'
            },
            {
              id: 4,
              name: 'Heather Mcdaniel',
              address: 'DDD City'
            }
          ],
          columns: [
            { data: 'id', type: 'numeric', title: 'ID' },
            { data: 'name', type: 'text', title: 'Full name' },
            { data: 'address', type: 'text', title: 'Address' }
          ],
          dropdownMenu: true,
          filters: true,
          width: 500,
          height: 300
        });

        dropdownMenu(2);

        simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
        simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

        setDataAtCell(1, 2, 'CCC City');
        dropdownMenu(2);

        const elements = $(byValueBoxRootElement()).find('label').toArray();
        const text = elements.map(element => $(element).text());

        expect(text).toEqual(['AAA City', 'BBB City', 'CCC City', 'DDD City']);

        const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
        const checkedArray = checkboxes.map(element => element.checked);

        expect(checkedArray).toEqual([false, true, true, true]);
      });

      it('should sort updated values', () => {
        handsontable({
          data: [
            {
              id: 1,
              name: 'Nannie Patel',
              address: 'BBB City'
            },
            {
              id: 2,
              name: 'Leanne Ware',
              address: 'ZZZ City'
            },
            {
              id: 3,
              name: 'Mathis Boone',
              address: 'CCC City'
            },
            {
              id: 4,
              name: 'Heather Mcdaniel',
              address: 'DDD City'
            }
          ],
          columns: [
            { data: 'id', type: 'numeric', title: 'ID' },
            { data: 'name', type: 'text', title: 'Full name' },
            { data: 'address', type: 'text', title: 'Address' }
          ],
          dropdownMenu: true,
          filters: true,
          width: 500,
          height: 300
        });

        dropdownMenu(2);

        simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
        simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

        setDataAtCell(0, 2, 'AAA City');

        dropdownMenu(2);
        expect($(byValueBoxRootElement()).find('tr:nth-child(1)').text()).toEqual('AAA City');
      });
    });
  });

  describe('"action_bar" (buttons bar) component', () => {
    it('should appear under dropdown menu', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);

      expect(dropdownMenuRootElement().querySelector('.htFiltersMenuActionBar .htUIButtonOK input').value)
        .toBe('OK');
      expect(dropdownMenuRootElement().querySelector('.htFiltersMenuActionBar .htUIButtonCancel input').value)
        .toBe('Cancel');

      await sleep(300);

      // The filter components should be intact after some time. These expectations check whether the GhostTable
      // does not steal the components' element while recalculating column width (PR #5555).
      expect(dropdownMenuRootElement().querySelector('.htFiltersMenuActionBar .htUIButtonOK input').value)
        .toBe('OK');
      expect(dropdownMenuRootElement().querySelector('.htFiltersMenuActionBar .htUIButtonCancel input').value)
        .toBe('Cancel');
    });

    it('should close the menu after clicking the "OK" button when the dropdown is opened using API and ' +
       'the table has no selection', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      getPlugin('dropdownMenu').open({
        top: 100,
        left: 100,
      });

      expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);

      mouseClick(dropdownMenuRootElement().querySelector('.htFiltersMenuActionBar .htUIButtonOK input'));

      expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
    });

    it('should close the menu after clicking the "OK" button when the dropdown is opened using API and ' +
       'the table has non-contiguous selection', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      // the highlight cell points to the 6, 3 (the selected column is 3)
      selectCells([
        [1, 0, 2, 1],
        [4, 2, 4, 4],
        [6, 3, 6, 1],
      ]);
      getPlugin('dropdownMenu').open({
        top: 100,
        left: 100,
      });

      expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);

      mouseClick(dropdownMenuRootElement().querySelector('.htFiltersMenuActionBar .htUIButtonOK input'));

      expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
    });
  });

  describe('Cooperation with Manual Column Move plugin #32', () => {
    it('should work as expected after actions sequence: filtering column by value -> moving the column -> ' +
      'filtering any other column by value', () => {
      const hot = handsontable({
        data: [
          {
            id: 1,
            name: 'Nannie Patel',
            address: 'BBB City'
          },
          {
            id: 2,
            name: 'Leanne Ware',
            address: 'ZZZ City'
          },
          {
            id: 3,
            name: 'Mathis Boone',
            address: 'CCC City'
          },
          {
            id: 4,
            name: 'Heather Mcdaniel',
            address: 'DDD City'
          }
        ],
        columns: [
          { data: 'id', type: 'numeric', title: 'ID' },
          { data: 'name', type: 'text', title: 'Full name' },
          { data: 'address', type: 'text', title: 'Address' }
        ],
        dropdownMenu: true,
        manualColumnMove: true,
        filters: true,
        width: 500,
        height: 300
      });

      const manualColumnMove = hot.getPlugin('manualColumnMove');

      // filtering first value of column (deselecting checkbox)
      dropdownMenu(0);

      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      // moving column
      manualColumnMove.moveColumn(0, 1);
      hot.render();

      // filtering first value of column (deselecting checkbox)
      dropdownMenu(2);

      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      expect(getData().length).toBe(2);
    });

    it('should work as expected after actions sequence: filtering column by value -> moving the column -> ' +
      'filtering the column by value ', () => {
      const hot = handsontable({
        data: [
          {
            id: 1,
            name: 'Nannie Patel',
            address: 'BBB City'
          },
          {
            id: 2,
            name: 'Leanne Ware',
            address: 'ZZZ City'
          },
          {
            id: 3,
            name: 'Mathis Boone',
            address: 'CCC City'
          },
          {
            id: 4,
            name: 'Heather Mcdaniel',
            address: 'DDD City'
          }
        ],
        columns: [
          { data: 'id', type: 'numeric', title: 'ID' },
          { data: 'name', type: 'text', title: 'Full name' },
          { data: 'address', type: 'text', title: 'Address' }
        ],
        dropdownMenu: true,
        manualColumnMove: true,
        filters: true,
        width: 500,
        height: 300
      });

      const manualColumnMove = hot.getPlugin('manualColumnMove');

      // filtering first value of column (deselecting checkbox)
      dropdownMenu(0);

      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      // moving column
      manualColumnMove.moveColumn(0, 1);
      hot.render();

      // filtering second value of column (deselecting checkbox)
      dropdownMenu(1);

      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(2) [type=checkbox]'));
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      expect(getData().length).toEqual(2);
    });
  });

  it('should deselect all values in "Filter by value" after clicking "Clear" link', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);

    await sleep(100);

    $(dropdownMenuRootElement().querySelector('.htUIClearAll a')).simulate('click');

    expect(byValueMultipleSelect().getItems().map(o => o.checked).indexOf(true)).toBe(-1);
  });

  it('should select all values in "Filter by value" after clicking "Select all" link', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);

    await sleep(100);

    $(dropdownMenuRootElement().querySelector('.htUIClearAll a')).simulate('click');

    expect(byValueMultipleSelect().getItems().map(o => o.checked).indexOf(true)).toBe(-1);

    $(dropdownMenuRootElement().querySelector('.htUISelectAll a')).simulate('click');

    expect(byValueMultipleSelect().getItems().map(o => o.checked).indexOf(false)).toBe(-1);
  });

  it('should not reset the selection status of the "Filter by value" section after scrolling the table outside of' +
    ' the viewport', async() => {
    spec().$container.css({
      marginBottom: 10000,
      marginRight: 10000
    });

    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
    });

    dropdownMenu(1);

    const multipleSelectElement = byValueMultipleSelect().element;

    await sleep(100);

    $(dropdownMenuRootElement().querySelector('.htUIClearAll a')).simulate('click');

    await sleep(200);

    expect(byValueMultipleSelect().getItems().map(o => o.checked).indexOf(true)).toBe(-1);

    window.scrollBy(0, 9500);

    await sleep(200);

    window.scrollBy(0, -9500);

    await sleep(200);

    multipleSelectElement.querySelector('.handsontable .wtHolder').scrollBy(0, 10);

    await sleep(200);

    expect(byValueMultipleSelect().getItems().map(o => o.checked).indexOf(true)).toBe(-1);
  });

  it('should open dropdown menu properly, when there are multiple Handsontable instances present', () => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    const hot2Container = document.createElement('DIV');

    document.body.appendChild(hot2Container);
    const hot2 = new Handsontable(hot2Container, {
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    expect(document.querySelectorAll('.htDropdownMenu').length).toBe(2);

    dropdownMenu(1);

    expect(getPlugin('dropdownMenu').menu.container.style.display).toBe('block');
    expect(getPlugin('dropdownMenu').menu.container.parentElement).not.toBe(null);
    expect(hot2.getPlugin('dropdownMenu').menu.container.style.display).not.toBe('block');
    expect(hot2.getPlugin('dropdownMenu').menu.container.parentElement).not.toBe(null);

    $(document.body).simulate('mousedown');
    $(document.body).simulate('mouseup');
    $(document.body).simulate('click');

    expect(getPlugin('dropdownMenu').menu.container.style.display).not.toBe('block');
    expect(getPlugin('dropdownMenu').menu.container.parentElement).not.toBe(null);
    expect(hot2.getPlugin('dropdownMenu').menu.container.style.display).not.toBe('block');
    expect(hot2.getPlugin('dropdownMenu').menu.container.parentElement).not.toBe(null);

    const th = hot2.view._wt.wtTable.getColumnHeader(1);
    const button = th.querySelector('.changeType');

    $(button).simulate('mousedown');
    $(button).simulate('mouseup');
    $(button).simulate('click');

    expect(getPlugin('dropdownMenu').menu.container.style.display).not.toBe('block');
    expect(getPlugin('dropdownMenu').menu.container.parentElement).not.toBe(null);
    expect(hot2.getPlugin('dropdownMenu').menu.container.style.display).toBe('block');
    expect(hot2.getPlugin('dropdownMenu').menu.container.parentElement).not.toBe(null);

    dropdownMenu(1);

    expect(getPlugin('dropdownMenu').menu.container.style.display).toBe('block');
    expect(getPlugin('dropdownMenu').menu.container.parentElement).not.toBe(null);
    expect(hot2.getPlugin('dropdownMenu').menu.container.style.display).not.toBe('block');
    expect(hot2.getPlugin('dropdownMenu').menu.container.parentElement).not.toBe(null);

    hot2.destroy();
    hot2Container.parentElement.removeChild(hot2Container);
  });

  it('should display data and filter\'s box properly when there was the `clearConditions` call and the `loadData` call #5244', () => {
    const hot = handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      colHeaders: true,
      rowHeaders: true,
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    const plugin = hot.getPlugin('filters');

    plugin.addCondition(1, 'begins_with', ['m']);
    plugin.filter();
    plugin.clearConditions();

    hot.loadData([{
      id: 1,
      name: 'Nannie Patel',
      address: 'Jenkinsville',
      registered: '2014-01-29',
      eyeColor: { color: 'green' },
      balance: 1261.6,
      active: true,
    }, {
      id: 2,
      name: 'Mcintyre Clarke',
      address: 'Wakarusa',
      registered: '2014-06-28',
      eyeColor: { color: 'green' },
      balance: 3012.56,
      active: true,
    }]);

    dropdownMenu(1);

    const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
    const checkedArray = checkboxes.map(element => element.checked);
    const labels = $(byValueBoxRootElement()).find('label').toArray();
    const texts = labels.map(element => $(element).text());

    expect(texts).toEqual(['Mcintyre Clarke', 'Nannie Patel']);
    expect(checkedArray).toEqual([true, true]);
    expect(checkboxes.length).toBe(2);
  });

  it('should restore correct components\' state after altering columns', async() => {
    handsontable({
      data: [
        [1, 'Nannie Patel', 'Jenkinsville'],
        [2, 'Leanne Ware', 'Gardiner'],
        [3, 'Mathis Boone', 'Saranap'],
        [4, 'Cruz Benjamin', 'Cascades'],
        [5, 'Reese David', 'Soham'],
        [6, 'Ernestine Wiggins', 'Needmore'],
        [7, 'Chelsea Solomon', 'Alamo'],
      ],
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    dropdownMenu(0);
    simulateClick(dropdownMenuRootElement().querySelectorAll('.htUISelect')[0]);
    selectDropdownByConditionMenuOption('Contains');

    await sleep(200);

    // Contains '2'
    document.activeElement.value = '2';
    keyUp('2');

    simulateClick(dropdownMenuRootElement().querySelectorAll('.htUISelect')[1]);
    selectDropdownByConditionMenuOption('Contains', 'second');

    await sleep(200);

    // Contains '5'
    document.activeElement.value = '5';
    keyUp('5');

    // Select "OR"
    simulateClick(conditionRadioInput(1).element.querySelector('input'));
    simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

    dropdownMenu(2);

    // uncheck the second record
    simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(2) [type=checkbox]'));
    simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

    hot().alter('insert_col_start', 0);
    hot().alter('remove_col', 2);

    {
      dropdownMenu(0);

      const inputs = dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput input');

      expect($(inputs[0]).is(':visible')).toBe(false);
      expect(inputs[0].value).toBe('');
      expect($(inputs[1]).is(':visible')).toBe(false);
      expect(inputs[1].value).toBe('');
      expect(conditionSelectRootElements().first.textContent).toBe('None');
      expect(conditionSelectRootElements().second.textContent).toBe('None');
      expect(byValueMultipleSelect().getItems().length).toBe(1);
      expect(byValueMultipleSelect().getValue().length).toBe(1);
    }
    {
      dropdownMenu(1);

      const inputs = dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput input');

      expect($(inputs[0]).is(':visible')).toBe(true);
      expect(inputs[0].value).toBe('2');
      expect($(inputs[1]).is(':visible')).toBe(false);
      expect(inputs[1].value).toBe('');
      expect($(inputs[2]).is(':visible')).toBe(true);
      expect(inputs[2].value).toBe('5');
      expect(conditionSelectRootElements().first.textContent).toBe('Contains');
      expect(conditionSelectRootElements().second.textContent).toBe('Contains');
      expect(byValueMultipleSelect().getItems().length).toBe(1);
      expect(byValueMultipleSelect().getValue().length).toBe(1);
    }
    {
      dropdownMenu(2);

      const inputs = dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput input');

      expect($(inputs[0]).is(':visible')).toBe(false);
      expect(inputs[0].value).toBe('');
      expect($(inputs[1]).is(':visible')).toBe(false);
      expect(inputs[1].value).toBe('');
      expect(conditionSelectRootElements().first.textContent).toBe('None');
      expect(conditionSelectRootElements().second.textContent).toBe('None');
      expect(byValueMultipleSelect().getItems().length).toBe(2);
      expect(byValueMultipleSelect().getValue().length).toBe(1);
    }
  });

  it('should select the first visible row after filtering (navigableHeaders: false)', () => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      navigableHeaders: false,
      width: 500,
      height: 300
    });

    dropdownMenu(2);
    openDropdownByConditionMenu();
    selectDropdownByConditionMenuOption('Is empty');

    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'))
      .simulate('click');

    expect(getSelectedRange()).toBeUndefined();

    dropdownMenu(2);
    openDropdownByConditionMenu();
    selectDropdownByConditionMenuOption('None');
    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'))
      .simulate('click');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
  });

  it('should select the column header after filtering (navigableHeaders: true)', () => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      navigableHeaders: true,
      width: 500,
      height: 300
    });

    dropdownMenu(2);
    openDropdownByConditionMenu();
    selectDropdownByConditionMenuOption('Is empty');

    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'))
      .simulate('click');

    expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);

    dropdownMenu(2);
    openDropdownByConditionMenu();
    selectDropdownByConditionMenuOption('None');
    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'))
      .simulate('click');

    expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);
  });

  describe('Simple filtering (one column)', () => {
    it('should filter empty values and revert back after removing filter', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(0);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Is empty');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'))
        .simulate('click');

      expect(getData().length).toBe(0);

      dropdownMenu(0);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('None');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'))
        .simulate('click');

      expect(getData().length).toBe(39);
    });

    it('should filter numeric value (greater than)', (done) => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(0);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Greater than');

      setTimeout(() => {
        // Greater than 12
        document.activeElement.value = '12';
        keyUp('2');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toEqual(27);
        expect(getData()[0][0]).toBe(13);
        expect(getData()[0][1]).toBe('Dina Randolph');
        expect(getData()[0][2]).toBe('Henrietta');
        expect(getData()[0][3]).toBe('2014-04-29');
        expect(getData()[0][4]).toBe('blue');
        expect(getData()[0][5]).toBe(3827.99);
        expect(getDataAtCol(0).join())
          .toBe('13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39');
        done();
      }, 200);
    });

    it('should filter text value (contains)', (done) => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Contains');

      setTimeout(() => {
        // Contains ej
        document.activeElement.value = 'ej';
        keyUp('j');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toEqual(1);
        expect(getData()[0][0]).toBe(23);
        expect(getData()[0][1]).toBe('Mejia Osborne');
        expect(getData()[0][2]).toBe('Fowlerville');
        expect(getData()[0][3]).toBe('2014-05-24');
        expect(getData()[0][4]).toBe('blue');
        expect(getData()[0][5]).toBe(1852.34);
        expect(getData()[0][6]).toBe(false);
        expect(getDataAtCol(1).join()).toBe('Mejia Osborne');
        done();
      }, 200);
    });

    it('should filter date value (yesterday)', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(3);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Yesterday');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toEqual(3);
      expect(getData()[0][0]).toBe(26);
      expect(getData()[0][1]).toBe('Stanton Britt');
      expect(getData()[0][2]).toBe('Nipinnawasee');
      expect(getData()[0][3]).toBe(moment().add(-1, 'days').format(FILTERS_DATE_FORMAT));
      expect(getData()[0][4]).toBe('green');
      expect(getData()[0][5]).toBe(3592.18);
      expect(getData()[0][6]).toBe(false);
      expect(getDataAtCol(3).join()).toBe([
        moment().add(-1, 'days').format(FILTERS_DATE_FORMAT),
        moment().add(-1, 'days').format(FILTERS_DATE_FORMAT),
        moment().add(-1, 'days').format(FILTERS_DATE_FORMAT),
      ].join());
    });

    it('should filter boolean value (true)', (done) => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(6);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Contains');

      setTimeout(() => {
        // Is equal to 'true'
        document.activeElement.value = 'true';
        keyUp('t');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toEqual(18);
        expect(getData()[0][0]).toBe(1);
        expect(getData()[0][1]).toBe('Nannie Patel');
        expect(getData()[0][2]).toBe('Jenkinsville');
        expect(getData()[0][3]).toBe('2014-01-29');
        expect(getData()[0][4]).toBe('green');
        expect(getData()[0][5]).toBe(1261.60);
        expect(getData()[0][6]).toBe(true);
        expect(getDataAtCol(6).join())
          .toBe('true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true');
        done();
      }, 200);
    });

    it('should filter values using "by value" method (by changing checkbox states)', async() => {
      handsontable({
        data: getDataForFilters().slice(0, 15),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(2);

      await sleep(200);

      // disable first 5 records
      $(byValueBoxRootElement()).find('tr:nth-child(1) :checkbox').simulate('click');
      $(byValueBoxRootElement()).find('tr:nth-child(2) :checkbox').simulate('click');
      $(byValueBoxRootElement()).find('tr:nth-child(3) :checkbox').simulate('click');
      $(byValueBoxRootElement()).find('tr:nth-child(4) :checkbox').simulate('click');
      $(byValueBoxRootElement()).find('tr:nth-child(5) :checkbox').simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toBe(10);
      expect(getDataAtCol(2).join())
        .toBe('Jenkinsville,Gardiner,Saranap,Soham,Needmore,Wakarusa,Yukon,Layhill,Henrietta,Wildwood');
    });

    it('should overwrite condition filter when at specified column filter was already applied', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(0);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Is equal to');

      await sleep(200);

      // Is equal to '5'
      document.activeElement.value = '5';
      keyUp('5');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toEqual(1);

      dropdownMenu(0);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Less than');

      await sleep(200);

      // Less than
      document.activeElement.value = '8';
      keyUp('8');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

      expect(getData().length).toEqual(7);
    });

    it('should filter values again when data was changed', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(0);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Less than');

      await sleep(200);

      // Less than
      document.activeElement.value = '8';
      keyUp('8');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toBe(7);

      selectCell(3, 0);
      keyDownUp('enter');
      document.activeElement.value = '99';
      keyDownUp('enter');

      await sleep(200);

      dropdownMenu(0);
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

      expect(getData().length).toBe(6);
    });

    it('should filter values again when data was changed (filter by value)', (done) => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(2);

      setTimeout(() => {
        byValueMultipleSelect().setValue(['Bowie', 'Coral']);
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        dropdownMenu(2);
      }, 200);

      setTimeout(() => {
        byValueMultipleSelect().setValue(['Alamo', 'Coral', 'Canby']);
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getDataAtCol(2).join()).toBe('Alamo,Canby,Coral');
        done();
      }, 400);
    });
  });

  describe('Advanced filtering (multiple columns)', () => {
    it('should filter values from 3 columns', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(0);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Greater than');

      await sleep(100);

      // Greater than 12
      document.activeElement.value = '12';
      keyUp('2');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      dropdownMenu(2);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Begins with');

      await sleep(100);

      document.activeElement.value = 'b';
      keyUp('b');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      // this condition needs extra time to apply filters
      await sleep(10);

      dropdownMenu(4);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Is equal to');

      await sleep(100);

      document.activeElement.value = 'green';
      keyUp('n');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

      expect(getData().length).toEqual(2);
      expect(getData()[0][0]).toBe(17);
      expect(getData()[0][1]).toBe('Bridges Sawyer');
      expect(getData()[0][2]).toBe('Bowie');
      expect(getData()[0][3]).toBe('2015-06-28');
      expect(getData()[0][4]).toBe('green');
      expect(getData()[0][5]).toBe(1792.36);
      expect(getData()[0][6]).toBe(false);
      expect(getData()[1][0]).toBe(24);
      expect(getData()[1][1]).toBe('Greta Patterson');
      expect(getData()[1][2]).toBe('Bartonsville');
      expect(getData()[1][3]).toBe(moment().add(-2, 'days').format(FILTERS_DATE_FORMAT));
      expect(getData()[1][4]).toBe('green');
      expect(getData()[1][5]).toBe(2437.58);
      expect(getData()[1][6]).toBe(false);
    });

    it('should filter values from 3 columns (2 conditional and 1 by value)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(0);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Greater than');

      await sleep(200);

      // Greater than 12
      document.activeElement.value = '12';
      keyUp('2');
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      dropdownMenu(2);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Begins with');

      await sleep(200);

      document.activeElement.value = 'b';
      keyUp('b');
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      dropdownMenu(4);
      // uncheck first record
      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));

      await sleep(200);
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await sleep(10);

      expect(getData().length).toEqual(2);
      expect(getData()[0][0]).toBe(17);
      expect(getData()[0][1]).toBe('Bridges Sawyer');
      expect(getData()[0][2]).toBe('Bowie');
      expect(getData()[0][3]).toBe('2015-06-28');
      expect(getData()[0][4]).toBe('green');
      expect(getData()[0][5]).toBe(1792.36);
      expect(getData()[0][6]).toBe(false);
      expect(getData()[1][0]).toBe(24);
      expect(getData()[1][1]).toBe('Greta Patterson');
      expect(getData()[1][2]).toBe('Bartonsville');
      expect(getData()[1][3]).toBe(moment().add(-2, 'days').format(FILTERS_DATE_FORMAT));
      expect(getData()[1][4]).toBe('green');
      expect(getData()[1][5]).toBe(2437.58);
      expect(getData()[1][6]).toBe(false);
    });

    it('should filter values from few columns (after change first column condition)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(0);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Greater than');

      await sleep(200);
      // Greater than 12
      document.activeElement.value = '12';
      keyUp('2');
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      dropdownMenu(2);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Begins with');

      await sleep(200);
      document.activeElement.value = 'b';
      keyUp('b');
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      // Change first added filter condition. First added condition is responsible for defining data root chain.
      dropdownMenu(0);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Is between');

      await sleep(200);
      const inputs = dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition input');

      inputs[0].value = '1';
      inputs[1].value = '15';
      keyUp('1', { target: inputs[0] });
      keyUp('5', { target: inputs[1] });
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await sleep(10);

      expect(getData().length).toEqual(1);
      expect(getData()[0][0]).toBe(14);
      expect(getData()[0][1]).toBe('Helga Mathis');
      expect(getData()[0][2]).toBe('Brownsville');
      expect(getData()[0][3]).toBe('2015-03-22');
      expect(getData()[0][4]).toBe('brown');
      expect(getData()[0][5]).toBe(3917.34);
      expect(getData()[0][6]).toBe(true);
    });

    it('should apply filtered values to the next "by value" component defined after edited conditions', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(0);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Greater than');

      await sleep(200);

      // Greater than 25
      document.activeElement.value = '25';
      keyUp('5');
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      dropdownMenu(2);

      await sleep(200);

      // uncheck
      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(3) [type=checkbox]'));
      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(4) [type=checkbox]'));
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      dropdownMenu(1);

      await sleep(200);

      // uncheck
      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(2) [type=checkbox]'));
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      expect(byValueMultipleSelect().getItems().length).toBe(11);
      expect(byValueMultipleSelect().getValue().length).toBe(9);

      dropdownMenu(4);

      await sleep(200);

      // uncheck
      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(2) [type=checkbox]'));
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      expect(byValueMultipleSelect().getItems().length).toBe(3);
      expect(byValueMultipleSelect().getValue().length).toBe(1);

      dropdownMenu(2);

      await sleep(200);

      // check again (disable filter)
      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(3) [type=checkbox]'));
      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(4) [type=checkbox]'));
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      dropdownMenu(1);

      await sleep(200);

      expect(byValueMultipleSelect().getItems().length).toBe(14);
      expect(byValueMultipleSelect().getValue().length).toBe(9);

      dropdownMenu(4);

      await sleep(200);

      // unchanged state for condition behind second condition
      expect(byValueMultipleSelect().getItems().length).toBe(3);
      expect(byValueMultipleSelect().getValue().length).toBe(1);
    });

    // The test checks if the IndexMap isn't accidentally unregistered in the ConditionCollection
    // class after opening the menu. It causes the column indication misalignment.
    it('should update filtering state within column header after removing column on the left', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: true,
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        filters: true,
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await sleep(200);

      alter('remove_col', 0);

      expect(getData()).toEqual([
        ['B2', 'C2'],
        ['B3', 'C3'],
      ]);
      expect(spec().$container.find('th:eq(0)').hasClass('htFiltersActive')).toEqual(true);
      expect(spec().$container.find('th:eq(1)').hasClass('htFiltersActive')).toEqual(false);
    });

    it('should update conditions properly - execution queue for conditions should not be lost after using ' +
      'UI of drop-down menu', async() => {
      handsontable({
        data: [
          { id: 1, name: 'Ted Right', address: 'A001' },
          { id: 2, name: 'Frank Honest', address: 'A002' },
          { id: 3, name: 'Joan Well', address: 'B001' },
          { id: 4, name: 'Gail Polite', address: 'B002' },
          { id: 5, name: 'Michael Fair', address: 'C001' },
          { id: 6, name: 'Mark Malcovich', address: 'C002' },
        ],
        columns: [
          { data: 'id' },
          { data: 'name' },
          { data: 'address' }
        ],
        filters: true,
        dropdownMenu: true,
        colHeaders: true
      });

      const filtersPlugin = getPlugin('filters');

      filtersPlugin.addCondition(1, 'by_value', [['Ted Right', 'Joan Well', 'Gail Polite', 'Michael Fair']]);
      filtersPlugin.addCondition(0, 'by_value', [[3, 5]]);
      filtersPlugin.addCondition(2, 'by_value', [['C001']]);
      filtersPlugin.filter();

      dropdownMenu(1);

      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(4) [type=checkbox]'));
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await sleep(300);

      dropdownMenu(0);
      expect(byValueMultipleSelect().getItems().length).toBe(5);
      expect(byValueMultipleSelect().getValue().length).toBe(2);
      expect(byValueMultipleSelect().getItems()[4]).toEqual({ checked: false, value: 6, visualValue: 6 });
    });
  });

  describe('Advanced filtering (conditions and operations combination #160)', () => {
    it('should filter data properly when `disjunction` operation was chosen and ' +
      'only one conditional was selected', (done) => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Begins with');

      setTimeout(() => {
        document.activeElement.value = 'm';
        keyUp('m');
        // disjunction
        $(conditionRadioInput(1).element).find('input[type="radio"]').simulate('click');

        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
        expect(getData().length).toBe(5);
        done();
      }, 300);
    });

    it('should not change data when operation was changed from `disjunction` to `conjunction` ' +
      'after filtering data by only one condition', (done) => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Begins with');

      setTimeout(() => {
        document.activeElement.value = 'm';
        keyUp('m');

        // conjunction
        $(conditionRadioInput(1).element).find('input[type="radio"]').simulate('click');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        dropdownMenu(1);
      }, 300);

      setTimeout(() => {
        expect(getData().length).toBe(5);

        // disjunction
        $(conditionRadioInput(0).element).find('input[type="radio"]').simulate('click');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
      }, 600);

      setTimeout(() => {
        expect(getData().length).toBe(5);
        done();
      }, 900);
    });

    it('should filter data properly after changing operator (`conjunction` <-> `disjunction` operation)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Begins with');

      await sleep(300);
      document.activeElement.value = 'm';
      keyUp('m');

      openDropdownByConditionMenu('second');
      selectDropdownByConditionMenuOption('Ends with', 'second');

      await sleep(300);
      document.activeElement.value = 'e';
      keyUp('e');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
      expect(getData().length).toBe(3);
      dropdownMenu(1);

      await sleep(300);
      // disjunction
      $(conditionRadioInput(1).element).find('input[type="radio"]').simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
      expect(getData().length).toBe(7);
      dropdownMenu(1);

      await sleep(300);
      // conjunction
      $(conditionRadioInput(0).element).find('input[type="radio"]').simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
      expect(getData().length).toBe(3);
    });

    it('should filter data properly after clearing second input', (done) => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Begins with');

      setTimeout(() => {
        document.activeElement.value = 'm';
        keyUp('m');

        openDropdownByConditionMenu('second');
        selectDropdownByConditionMenuOption('Ends with', 'second');
      }, 300);

      setTimeout(() => {
        document.activeElement.value = 'e';
        keyUp('e');

        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
      }, 600);

      setTimeout(() => {
        dropdownMenu(1);
      }, 900);

      setTimeout(() => {
        document.activeElement.value = '';
        keyUp('Backspace');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
      }, 1200);

      setTimeout(() => {
        expect(getData().length).toBe(5);
        done();
      }, 1500);
    });

    it('should filter data properly after resetting second condition `SelectUI` (value set to `None`)', (done) => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Begins with');

      setTimeout(() => {
        document.activeElement.value = 'm';
        keyUp('m');

        openDropdownByConditionMenu('second');
        selectDropdownByConditionMenuOption('Ends with', 'second');
      }, 300);

      setTimeout(() => {
        document.activeElement.value = 'e';
        keyUp('e');

        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
      }, 600);

      setTimeout(() => {
        dropdownMenu(1);
      }, 900);

      setTimeout(() => {
        openDropdownByConditionMenu('second');
        selectDropdownByConditionMenuOption('None', 'second');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
      }, 1200);

      setTimeout(() => {
        expect(getData().length).toBe(5);
        expect($(conditionSelectRootElements().second).text()).toEqual('None');
        done();
      }, 1500);
    });
  });

  describe('Advanced filtering (conditions, operations and "by value" component #160)', () => {
    it('First conditional chosen -> filter operation -> unchecked first value from multiple select -> selected `disjunction` operation -> filter operation', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Begins with');

      await sleep(200);

      document.activeElement.value = 'm';
      keyUp('m');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

      expect(getData().length).toBe(5);
      dropdownMenu(1);

      await sleep(200);

      const $multipleSelectElements = $(byValueMultipleSelect().element
        .querySelectorAll('.htUIMultipleSelectHot td input'));

      $multipleSelectElements.eq(0).simulate('click');
      // disjunction
      $(conditionRadioInput(1).element).find('input[type="radio"]').simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

      expect(getData().length).toBe(4);
    });

    it('Two conditionals chosen -> filter operation -> unchecked first value from multiple select -> filter operation', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Begins with');

      await sleep(200);

      document.activeElement.value = 'm';
      keyUp('m');

      openDropdownByConditionMenu('second');
      selectDropdownByConditionMenuOption('Ends with', 'second');

      await sleep(200);

      document.activeElement.value = 'e';
      keyUp('e');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
      dropdownMenu(1);

      await sleep(200);

      const $multipleSelectElements = $(byValueMultipleSelect().element
        .querySelectorAll('.htUIMultipleSelectHot td input'));

      $multipleSelectElements.eq(0).simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

      expect(getData().length).toBe(2);
    });

    it('Two conditionals chosen & unchecked value which will be filtered by conditions -> filter operation', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Begins with');

      await sleep(200);

      document.activeElement.value = 'm';
      keyUp('m');

      openDropdownByConditionMenu('second');
      selectDropdownByConditionMenuOption('Ends with', 'second');

      await sleep(200);

      document.activeElement.value = 'e';
      keyUp('e');
      const $multipleSelectElements = $(byValueMultipleSelect().element
        .querySelectorAll('.htUIMultipleSelectHot td input'));

      // Alice Blake
      $multipleSelectElements.eq(0).simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

      expect(getData().length).toBe(3);
    });

    it('Two conditionals chosen & unchecked value which won\'t be filtered by conditions -> filter operation', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Begins with');

      await sleep(200);

      document.activeElement.value = 'm';
      keyUp('m');

      openDropdownByConditionMenu('second');
      selectDropdownByConditionMenuOption('Ends with', 'second');

      await sleep(200);
      document.activeElement.value = 'e';
      keyUp('e');

      let $multipleSelectElements = $(byValueMultipleSelect().element
        .querySelectorAll('.htUIMultipleSelectHot td input'));

      $multipleSelectElements.get(4).scrollIntoView();

      $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));
      $multipleSelectElements.get(8).scrollIntoView();

      $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));
      $multipleSelectElements.get(12).scrollIntoView();

      $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));
      $multipleSelectElements.get(13).scrollIntoView();

      $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));

      // Mathis Boone, 23th element
      $multipleSelectElements.eq(9).simulate('click');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

      expect(getData().length).toBe(2);
    });
  });

  describe('API + UI #116', () => {
    it('should change state of components by plugin function calls', (done) => {
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = hot.getPlugin('filters');

      plugin.addCondition(1, 'begins_with', ['m'], 'conjunction');
      plugin.addCondition(1, 'ends_with', ['e'], 'conjunction');
      plugin.filter();

      dropdownMenu(1);

      setTimeout(() => {
        expect($(conditionSelectRootElements().first).text()).toEqual('Begins with');
        expect($(conditionSelectRootElements().second).text()).toEqual('Ends with');
        expect($(conditionRadioInput(0).element).parent().find(':checked').parent().text()).toEqual('And');
        done();
      }, 200);
    });

    it('should not change state of components and data after clicking `OK` button', (done) => {
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = hot.getPlugin('filters');

      plugin.addCondition(1, 'begins_with', ['m'], 'disjunction');
      plugin.addCondition(1, 'ends_with', ['e'], 'disjunction');
      plugin.filter();

      const dataLength = getData().length;

      dropdownMenu(1);

      setTimeout(() => {
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
        dropdownMenu(1);
      }, 200);

      setTimeout(() => {
        expect(getData().length).toEqual(dataLength);
        expect($(conditionSelectRootElements().first).text()).toEqual('Begins with');
        expect($(conditionSelectRootElements().second).text()).toEqual('Ends with');
        expect($(conditionRadioInput(0).element).parent().find(':checked').parent().text()).toEqual('Or');
        done();
      }, 400);
    });

    it('should allow to perform changes on conditions by UI, when they were added by API before #1', (done) => {
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = hot.getPlugin('filters');

      plugin.addCondition(1, 'begins_with', ['m'], 'disjunction');
      plugin.filter();

      const dateLength = getData().length;

      dropdownMenu(1);

      setTimeout(() => {
        const $multipleSelectElements = $(byValueMultipleSelect().element
          .querySelectorAll('.htUIMultipleSelectHot td input'));

        $multipleSelectElements.eq(0).simulate('click');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
        dropdownMenu(1);
      }, 200);

      setTimeout(() => {
        expect($(conditionSelectRootElements().first).text()).toEqual('Begins with');
        expect($(conditionSelectRootElements().second).text()).toEqual('None');

        // original state (now performing `conjunction` operation)
        expect($(conditionRadioInput(0).element).parent().find(':checked').parent().text()).toEqual('Or');
        expect(getData().length).toEqual(dateLength - 1);
        done();
      }, 400);
    });

    it('should allow to perform changes on conditions by UI, when they were added by API before #1', (done) => {
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = hot.getPlugin('filters');

      plugin.addCondition(1, 'begins_with', ['m'], 'disjunction');
      plugin.addCondition(1, 'ends_with', ['e'], 'disjunction');
      plugin.filter();

      const dateLength = getData().length;

      dropdownMenu(1);

      setTimeout(() => {
        const $multipleSelectElements = $(byValueMultipleSelect().element
          .querySelectorAll('.htUIMultipleSelectHot td input'));

        $multipleSelectElements.eq(0).simulate('click');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
        dropdownMenu(1);
      }, 200);

      setTimeout(() => {
        expect($(conditionSelectRootElements().first).text()).toEqual('Begins with');
        expect($(conditionSelectRootElements().second).text()).toEqual('Ends with');

        // original state (now performing `disjunctionWithExtraCondition` operation)
        expect($(conditionRadioInput(0).element).parent().find(':checked').parent().text()).toEqual('Or');
        expect(getData().length).toEqual(dateLength - 1);
        done();
      }, 400);
    });
  });

  describe('Sorting', () => {
    it('should filter values when sorting is applied', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        columnSorting: true,
        width: 500,
        height: 300
      });

      dropdownMenu(0);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Greater than');

      await sleep(200);

      // Greater than 12
      document.activeElement.value = '12';
      keyUp('2');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      // sort
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('click');

      dropdownMenu(2);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Begins with');

      await sleep(200);

      // Begins with 'b'
      document.activeElement.value = 'b';
      keyUp('b');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

      expect(getData().length).toEqual(3);
      expect(getData()[0][0]).toBe(24);
      expect(getData()[1][0]).toBe(17);
      expect(getData()[2][0]).toBe(14);
    });

    it('should correctly remove rows from filtered values when sorting is applied', (done) => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        columnSorting: true,
        width: 500,
        height: 300
      });

      setTimeout(() => {
        dropdownMenu(0);
        openDropdownByConditionMenu();
        selectDropdownByConditionMenuOption('Greater than');
      }, 300);

      setTimeout(() => {
        // Greater than 12

        $(conditionSelectRootElements().first).next().find('input')[0].focus();

        document.activeElement.value = '12';
        keyUp('2');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        // sort
        getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
        getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
        getHtCore().find('th span.columnSorting:eq(2)').simulate('click');
        alter('remove_row', 1, 5);

        dropdownMenu(2);
        openDropdownByConditionMenu();
        selectDropdownByConditionMenuOption('Ends with');
      }, 600);

      setTimeout(() => {
        // Ends with 'e'

        $(conditionSelectRootElements().first).next().find('input')[0].focus();

        document.activeElement.value = 'e';
        keyUp('e');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toEqual(7);
        expect(getDataAtCol(0).join()).toBe('24,16,23,32,26,28,21');

        alter('remove_row', 1, 5);

        expect(getData().length).toEqual(2);
        expect(getDataAtCol(0).join()).toBe('24,21');

        dropdownMenu(0);
        openDropdownByConditionMenu();
        selectDropdownByConditionMenuOption('None');
      }, 900);

      setTimeout(() => {
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toEqual(5);
        expect(getDataAtCol(0).join()).toBe('1,6,10,24,21'); // Elements 1, 6, 10 haven't been sorted.
        done();
      }, 1200);
    });

    it('should correctly insert rows into filtered values when sorting is applied', (done) => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        columnSorting: true,
        width: 500,
        height: 300
      });

      setTimeout(() => {
        dropdownMenu(0);
        openDropdownByConditionMenu();
        selectDropdownByConditionMenuOption('Greater than');
      }, 300);

      setTimeout(() => {
        // Greater than 12

        $(conditionSelectRootElements().first).next().find('input')[0].focus();

        document.activeElement.value = '12';
        keyUp('2');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        // sort
        getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
        getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
        getHtCore().find('th span.columnSorting:eq(2)').simulate('click');
        alter('insert_row_above', 1, 5);

        dropdownMenu(2);
        openDropdownByConditionMenu();
        selectDropdownByConditionMenuOption('Ends with');
      }, 600);

      setTimeout(() => {
        // Ends with 'e'

        $(conditionSelectRootElements().first).next().find('input')[0].focus();

        document.activeElement.value = 'e';
        keyUp('e');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toBe(9);
        expect(getDataAtCol(0).join()).toBe('24,17,14,16,23,32,26,28,21');

        alter('insert_row_above', 1, 1);

        expect(getData().length).toBe(10);
        expect(getDataAtCol(0).join()).toBe('24,,17,14,16,23,32,26,28,21');

        dropdownMenu(0);
        openDropdownByConditionMenu();
        selectDropdownByConditionMenuOption('Is empty');
      }, 900);

      setTimeout(() => {
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toBe(0);
        done();
      }, 1200);
    });
  });

  describe('Multi-column sorting', () => {
    it('should filter values when sorting is applied', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        multiColumnSorting: true,
        width: 500,
        height: 300
      });

      dropdownMenu(0);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Greater than');

      await sleep(200);

      // Greater than 12
      document.activeElement.value = '12';
      keyUp('2');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      // sort
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('click');

      dropdownMenu(2);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Begins with');

      await sleep(200);

      // Begins with 'b'
      document.activeElement.value = 'b';
      keyUp('b');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

      expect(getData().length).toEqual(3);
      expect(getData()[0][0]).toBe(24);
      expect(getData()[1][0]).toBe(17);
      expect(getData()[2][0]).toBe(14);
    });

    it('should correctly remove rows from filtered values when sorting is applied', (done) => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        multiColumnSorting: true,
        width: 500,
        height: 300
      });

      setTimeout(() => {
        dropdownMenu(0);
        openDropdownByConditionMenu();
        selectDropdownByConditionMenuOption('Greater than');
      }, 300);

      setTimeout(() => {
        // Greater than 12

        $(conditionSelectRootElements().first).next().find('input')[0].focus();

        document.activeElement.value = '12';
        keyUp('2');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        // sort
        getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown').simulate('mouseup');
        getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
        getHtCore().find('th span.columnSorting:eq(2)').simulate('click');
        alter('remove_row', 1, 5);

        dropdownMenu(2);
        openDropdownByConditionMenu();
        selectDropdownByConditionMenuOption('Ends with');
      }, 600);

      setTimeout(() => {
        // Ends with 'e'

        $(conditionSelectRootElements().first).next().find('input')[0].focus();

        document.activeElement.value = 'e';
        keyUp('e');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toEqual(7);
        expect(getDataAtCol(0).join()).toBe('24,16,23,32,26,28,21');

        alter('remove_row', 1, 5);

        expect(getData().length).toEqual(2);
        expect(getDataAtCol(0).join()).toBe('24,21');

        dropdownMenu(0);
        openDropdownByConditionMenu();
        selectDropdownByConditionMenuOption('None');
      }, 900);

      setTimeout(() => {
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toEqual(5);
        expect(getDataAtCol(0).join()).toBe('1,6,10,24,21'); // Elements 1, 6, 10 haven't been sorted.
        done();
      }, 1200);
    });

    it('should correctly insert rows into filtered values when sorting is applied', (done) => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        multiColumnSorting: true,
        width: 500,
        height: 300
      });

      setTimeout(() => {
        dropdownMenu(0);
        openDropdownByConditionMenu();
        selectDropdownByConditionMenuOption('Greater than');
      }, 300);

      setTimeout(() => {
        // Greater than 12

        $(conditionSelectRootElements().first).next().find('input')[0].focus();

        document.activeElement.value = '12';
        keyUp('2');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        // sort
        getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
        getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
        getHtCore().find('th span.columnSorting:eq(2)').simulate('click');
        alter('insert_row_above', 1, 5);

        dropdownMenu(2);
        openDropdownByConditionMenu();
        selectDropdownByConditionMenuOption('Ends with');
      }, 600);

      setTimeout(() => {
        // Ends with 'e'

        $(conditionSelectRootElements().first).next().find('input')[0].focus();

        document.activeElement.value = 'e';
        keyUp('e');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toBe(9);
        expect(getDataAtCol(0).join()).toBe('24,17,14,16,23,32,26,28,21');

        alter('insert_row_above', 1, 1);

        expect(getData().length).toBe(10);
        expect(getDataAtCol(0).join()).toBe('24,,17,14,16,23,32,26,28,21');

        dropdownMenu(0);
        openDropdownByConditionMenu();
        selectDropdownByConditionMenuOption('Is empty');
      }, 900);

      setTimeout(() => {
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toBe(0);
        done();
      }, 1200);
    });
  });

  describe('should display components inside filters dropdownMenu properly', () => {
    it('should not display extra condition element at start', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
    });

    it('should show extra condition element after specific conditional options menu click', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Begins with');

      expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);
      expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
      expect($(conditionSelectRootElements().second).is(':visible')).toBe(true);
    });

    it('should not show extra condition element after specific conditional options menu click', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('None');

      expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);
      expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
      expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
    });

    it('should hide extra condition element after specific conditional options menu click', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Is equal to');

      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('None');

      expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);
      expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
      expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
    });

    it('should not show extra condition elements after changing value of cell when conditions wasn\'t set' +
      '(`conditionUpdateObserver` triggers hook)', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      selectCell(3, 0);
      keyDownUp('enter');
      document.activeElement.value = '99';
      keyDownUp('enter');

      dropdownMenu(1);

      expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
      expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(false);
    });

    it('should show proper condition elements after changing value of cell when condition was set' +
      '(`conditionUpdateObserver` triggers hook)', () => {
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'gte', [10]);
      filters.filter();

      selectCell(3, 0);
      keyDownUp('enter');
      document.activeElement.value = '99';
      keyDownUp('enter');

      dropdownMenu(1);

      expect($(conditionSelectRootElements().first).is(':visible')).toBe(true);
      expect($(conditionSelectRootElements().second).is(':visible')).toBe(true);
      expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(true);
    });

    it('should update components properly after API action #1', () => {
      const hot = handsontable({
        data: [
          {
            id: 2,
            name: 'Leanne Ware',
            address: 'AAA City'
          },
          {
            id: 3,
            name: 'Mathis Boone',
            address: 'BBB City'
          },
          {
            id: 1,
            name: 'Nannie Patel',
            address: 'CCC City'
          }
        ],
        columns: [
          { data: 'id', type: 'numeric', title: 'ID' },
          { data: 'name', type: 'text', title: 'Full name' },
          { data: 'address', type: 'text', title: 'Address' }
        ],
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'by_value', [['Nannie Patel', 'Leanne Ware']]);
      filters.addCondition(1, 'contains', ['a']);
      filters.addCondition(1, 'not_contains', ['z']);
      filters.filter();

      dropdownMenu(1);

      const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
      const checkedArray = checkboxes.map(element => element.checked);

      expect(checkedArray).toEqual([true, false, true]);
      expect($(conditionSelectRootElements().first).text()).toEqual('Contains');
      expect($(conditionSelectRootElements().second).text()).toEqual('Does not contain');

      expect($(conditionSelectRootElements().first).is(':visible')).toBe(true);
      expect($(conditionSelectRootElements().second).is(':visible')).toBe(true);
      expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(true);
    });

    it('should update components properly after API action #2', () => {
      const hot = handsontable({
        data: [
          {
            id: 2,
            name: 'Leanne Ware',
            address: 'AAA City'
          },
          {
            id: 3,
            name: 'Mathis Boone',
            address: 'BBB City'
          },
          {
            id: 1,
            name: 'Nannie Patel',
            address: 'CCC City'
          }
        ],
        columns: [
          { data: 'id', type: 'numeric', title: 'ID' },
          { data: 'name', type: 'text', title: 'Full name' },
          { data: 'address', type: 'text', title: 'Address' }
        ],
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'contains', ['a']);
      filters.addCondition(1, 'not_contains', ['z']);
      filters.addCondition(1, 'by_value', [['Nannie Patel', 'Leanne Ware']]);
      filters.filter();

      dropdownMenu(1);

      const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
      const checkedArray = checkboxes.map(element => element.checked);

      expect(checkedArray).toEqual([true, false, true]);
      expect($(conditionSelectRootElements().first).text()).toEqual('Contains');
      expect($(conditionSelectRootElements().second).text()).toEqual('Does not contain');

      expect($(conditionSelectRootElements().first).is(':visible')).toBe(true);
      expect($(conditionSelectRootElements().second).is(':visible')).toBe(true);
      expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(true);
    });

    it('should update components properly after API action #3', () => {
      const hot = handsontable({
        data: [
          {
            id: 2,
            name: 'Leanne Ware',
            address: 'AAA City'
          },
          {
            id: 3,
            name: 'Mathis Boone',
            address: 'BBB City'
          },
          {
            id: 1,
            name: 'Nannie Patel',
            address: 'CCC City'
          }
        ],
        columns: [
          { data: 'id', type: 'numeric', title: 'ID' },
          { data: 'name', type: 'text', title: 'Full name' },
          { data: 'address', type: 'text', title: 'Address' }
        ],
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'contains', ['a']);
      filters.addCondition(1, 'by_value', [['Nannie Patel', 'Leanne Ware']]);
      filters.addCondition(1, 'not_contains', ['z']);
      filters.filter();

      dropdownMenu(1);

      const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
      const checkedArray = checkboxes.map(element => element.checked);

      expect(checkedArray).toEqual([true, false, true]);
      expect($(conditionSelectRootElements().first).text()).toEqual('Contains');
      expect($(conditionSelectRootElements().second).text()).toEqual('Does not contain');

      expect($(conditionSelectRootElements().first).is(':visible')).toBe(true);
      expect($(conditionSelectRootElements().second).is(':visible')).toBe(true);
      expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(true);
    });

    it('should update components properly after API action #4', () => {
      const hot = handsontable({
        data: [
          {
            id: 2,
            name: 'Leanne Ware',
            address: 'AAA City'
          },
          {
            id: 3,
            name: 'Mathis Boone',
            address: 'BBB City'
          },
          {
            id: 1,
            name: 'Nannie Patel',
            address: 'CCC City'
          }
        ],
        columns: [
          { data: 'id', type: 'numeric', title: 'ID' },
          { data: 'name', type: 'text', title: 'Full name' },
          { data: 'address', type: 'text', title: 'Address' }
        ],
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'by_value', [['Nannie Patel', 'Leanne Ware']]);
      filters.addCondition(1, 'contains', ['a']);
      filters.filter();

      dropdownMenu(1);

      const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
      const checkedArray = checkboxes.map(element => element.checked);

      expect(checkedArray).toEqual([true, false, true]);
      expect($(conditionSelectRootElements().first).text()).toEqual('Contains');
      expect($(conditionSelectRootElements().second).text()).toEqual('None');

      expect($(conditionSelectRootElements().first).is(':visible')).toBe(true);
      expect($(conditionSelectRootElements().second).is(':visible')).toBe(true);
      expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(true);
    });

    it('should update components properly after API action #5', () => {
      const hot = handsontable({
        data: [
          {
            id: 2,
            name: 'Leanne Ware',
            address: 'AAA City'
          },
          {
            id: 3,
            name: 'Mathis Boone',
            address: 'BBB City'
          },
          {
            id: 1,
            name: 'Nannie Patel',
            address: 'CCC City'
          }
        ],
        columns: [
          { data: 'id', type: 'numeric', title: 'ID' },
          { data: 'name', type: 'text', title: 'Full name' },
          { data: 'address', type: 'text', title: 'Address' }
        ],
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'by_value', [['Nannie Patel', 'Leanne Ware']]);
      filters.filter();

      dropdownMenu(1);

      const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
      const checkedArray = checkboxes.map(element => element.checked);

      expect(checkedArray).toEqual([true, false, true]);
      expect($(conditionSelectRootElements().first).text()).toEqual('None');
      expect($(conditionSelectRootElements().second).text()).toEqual('None');

      expect($(conditionSelectRootElements().first).is(':visible')).toBe(true);
      expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
      expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(false);
    });

    it('should show last operation which was added from API and can be shown inside `dropdownMenu` #1', () => {
      const hot = handsontable({
        data: [
          {
            id: 2,
            name: 'Leanne Ware',
            address: 'AAA City'
          },
          {
            id: 3,
            name: 'Mathis Boone',
            address: 'BBB City'
          },
          {
            id: 1,
            name: 'Nannie Patel',
            address: 'CCC City'
          }
        ],
        columns: [
          { data: 'id', type: 'numeric', title: 'ID' },
          { data: 'name', type: 'text', title: 'Full name' },
          { data: 'address', type: 'text', title: 'Address' }
        ],
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'contains', ['e']);
      filters.addCondition(1, 'not_contains', ['z']);
      filters.addCondition(1, 'not_empty', []);
      filters.addCondition(1, 'by_value', [['Nannie Patel', 'Leanne Ware']]);
      filters.filter();

      dropdownMenu(1);

      const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
      const checkedArray = checkboxes.map(element => element.checked);

      // Watch out! Filters build values inside `by_value` (checkbox inputs) component basing on all applied filters
      expect(checkedArray).toEqual([true, true]);
      expect($(conditionSelectRootElements().first).text()).toEqual('Contains');
      expect($(conditionSelectRootElements().second).text()).toEqual('Does not contain');

      expect($(conditionSelectRootElements().first).is(':visible')).toBe(true);
      expect($(conditionSelectRootElements().second).is(':visible')).toBe(true);
      expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(true);
    });

    it('should show last operation which was added from API and can be shown inside `dropdownMenu` #2', () => {
      const hot = handsontable({
        data: [
          {
            id: 2,
            name: 'Leanne Ware',
            address: 'AAA City'
          },
          {
            id: 3,
            name: 'Mathis Boone',
            address: 'BBB City'
          },
          {
            id: 1,
            name: 'Nannie Patel',
            address: 'CCC City'
          }
        ],
        columns: [
          { data: 'id', type: 'numeric', title: 'ID' },
          { data: 'name', type: 'text', title: 'Full name' },
          { data: 'address', type: 'text', title: 'Address' }
        ],
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'by_value', [['Nannie Patel', 'Leanne Ware']]);
      filters.addCondition(1, 'by_value', [['Mathis Boone']]);
      filters.filter();

      dropdownMenu(1);

      const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
      const checkedArray = checkboxes.map(element => element.checked);

      expect(checkedArray).toEqual([true, false, true]);
      expect($(conditionSelectRootElements().first).text()).toEqual('None');
      expect($(conditionSelectRootElements().second).text()).toEqual('None');

      expect($(conditionSelectRootElements().first).is(':visible')).toBe(true);
      expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
      expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(false);
    });
  });

  it('should not inherit font family and size from body', () => {
    handsontable({
      data: getDataForFilters(),
      colHeaders: true,
      filters: true,
      dropdownMenu: true
    });

    const body = document.body;
    const bodyStyle = body.style;
    const fontFamily = bodyStyle.fontFamily;
    const fontSize = bodyStyle.fontSize;

    bodyStyle.fontFamily = 'Helvetica';
    bodyStyle.fontSize = '24px';

    dropdownMenu(0);

    const htItemWrapper = document.querySelector('.htItemWrapper');
    const compStyleHtItemWrapper = Handsontable.dom.getComputedStyle(htItemWrapper);

    const htFiltersMenuLabel = document.querySelector('.htFiltersMenuLabel');
    const compStyleHtFiltersMenuLabel = Handsontable.dom.getComputedStyle(htFiltersMenuLabel);

    const htUISelectCaption = document.querySelector('.htUISelectCaption');
    const compStyleHtUISelectCaption = Handsontable.dom.getComputedStyle(htUISelectCaption);

    expect(compStyleHtItemWrapper.fontFamily).not.toBe('Helvetica');
    expect(compStyleHtFiltersMenuLabel.fontFamily).not.toBe('Helvetica');
    expect(compStyleHtUISelectCaption.fontFamily).not.toBe('Helvetica');

    bodyStyle.fontFamily = fontFamily;
    bodyStyle.fontSize = fontSize;
  });

  describe('Dimensions of filter\'s elements inside drop-down menu', () => {
    it('should scale text input showed after condition selection (pixel perfect)', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        colHeaders: true,
        dropdownMenu: {
          items: {
            custom: {
              name: 'This is very long text which should expand the drop-down menu...'
            },
            filter_by_condition: {},
            filter_operators: {},
            filter_by_condition2: {},
            filter_by_value: {}
          }
        },
        filters: true
      });

      dropdownMenu(1);

      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Begins with');

      const widthOfMenu = $(dropdownMenuRootElement()).find('table.htCore').width();
      const widthOfInput = $(dropdownMenuRootElement()).find('input').width();
      const bothInputBorders = 2;
      const bothInputPaddings = 8;
      const bothWrapperMargins = 20;
      const bothCustomRendererPaddings = 12;
      const parentsPaddings = bothInputBorders + bothInputPaddings + bothWrapperMargins + bothCustomRendererPaddings;

      expect(widthOfInput).toEqual(widthOfMenu - parentsPaddings);
    });

    it('should scale a condition select (pixel perfect)', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        colHeaders: true,
        dropdownMenu: {
          items: {
            custom: {
              name: 'This is very long text which should expand the drop-down menu...'
            },
            filter_by_condition: {},
            filter_operators: {},
            filter_by_condition2: {},
            filter_by_value: {}
          }
        },
        filters: true
      });

      dropdownMenu(1);

      const widthOfMenu = $(dropdownMenuRootElement()).find('table.htCore').width();
      const widthOfSelect = $(conditionSelectRootElements().first).width();
      const bothWrapperMargins = 20;
      const bothCustomRendererPaddings = 12;
      const parentsPaddings = bothWrapperMargins + bothCustomRendererPaddings;

      expect(widthOfSelect).toEqual(widthOfMenu - parentsPaddings);
    });

    it('should scale search input of the value box (pixel perfect)', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        colHeaders: true,
        dropdownMenu: {
          items: {
            custom: {
              name: 'This is very long text which should expand the drop-down menu...'
            },
            filter_by_condition: {},
            filter_operators: {},
            filter_by_condition2: {},
            filter_by_value: {}
          }
        },
        filters: true
      });

      dropdownMenu(1);

      const widthOfMenu = $(dropdownMenuRootElement()).find('table.htCore').width();
      const widthOfInput = $(dropdownMenuRootElement()).find('.htUIMultipleSelectSearch input').width();
      const bothInputBorders = 2;
      const bothInputPaddings = 8;
      const bothWrapperMargins = 20;
      const bothCustomRendererPaddings = 12;
      const parentsPaddings = bothInputBorders + bothInputPaddings + bothWrapperMargins + bothCustomRendererPaddings;

      expect(widthOfInput).toEqual(widthOfMenu - parentsPaddings);
    });

    it('should scale the value box element (pixel perfect)', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        colHeaders: true,
        dropdownMenu: {
          items: {
            custom: {
              name: 'This is very long text which should expand the drop-down menu...'
            },
            filter_by_condition: {},
            filter_operators: {},
            filter_by_condition2: {},
            filter_by_value: {}
          }
        },
        filters: true
      });

      dropdownMenu(1);

      openDropdownByConditionMenu();
      $(conditionMenuRootElements().first).find('tbody td:contains("Begins with")')
        .simulate('mousedown')
        .simulate('mouseup');

      const widthOfMenu = $(dropdownMenuRootElement()).find('table.htCore').width();
      const widthOfValueBox = $(byValueBoxRootElement()).width();
      const bothWrapperMargins = 20;
      const bothCustomRendererPaddings = 12;

      const parentsPaddings = bothWrapperMargins + bothCustomRendererPaddings;

      expect(widthOfValueBox).toEqual(widthOfMenu - parentsPaddings);
    });

    it('should fit the single value to the value box element (pixel perfect)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        colHeaders: true,
        dropdownMenu: {
          items: {
            custom: {
              name: 'This is very long text which should expand the drop-down menu...'
            },
            filter_by_condition: {},
            filter_operators: {},
            filter_by_condition2: {},
            filter_by_value: {}
          }
        },
        filters: true
      });

      dropdownMenu(1);

      openDropdownByConditionMenu();
      $(conditionMenuRootElements().first).find('tbody td:contains("Begins with")')
        .simulate('mousedown')
        .simulate('mouseup');

      const widthOfValueBoxWithoutScroll = $(byValueBoxRootElement()).find('.wtHolder')[0].scrollWidth;
      const widthOfSingleValue = $(byValueBoxRootElement()).find('table.htCore tr:eq(0)').width();

      expect(widthOfSingleValue).toEqual(widthOfValueBoxWithoutScroll);
    });

    it('should display proper width of value box after change of another elements width to lower ' +
      '(bug: once rendered `MultipleSelectUI` has elbowed the table created by AutoColumnSize plugin)', async() => {
      const hot = handsontable({
        colHeaders: true,
        dropdownMenu: {
          items: {
            custom: {
              name: 'This is very long text which should expand the drop-down menu...'
            },
            filter_by_condition: {},
            filter_operators: {},
            filter_by_condition2: {},
            filter_by_value: {},
            filter_action_bar: {}
          }
        },
        filters: true
      });

      const $menu = $('.htDropdownMenu');

      dropdownMenu(0);

      await sleep(300);

      const firstWidth = $menu.find('.wtHider').width();

      hot.updateSettings({ dropdownMenu: true });

      dropdownMenu(0);

      await sleep(300);

      const nextWidth = $menu.find('.wtHider').width();

      expect(nextWidth).toBeLessThan(firstWidth);
    });

    it('should display proper width of the menu after second render (bug: effect of resizing menu by the 3px) - ' +
      'AutoColumnSize counts also border added to drop-down menu', async function() {
      handsontable({
        colHeaders: true,
        dropdownMenu: true,
        filters: true
      });

      const $menu = $('.htDropdownMenu');

      dropdownMenu(0);

      await sleep(300);

      const firstWidth = $menu.find('.wtHider').width();

      mouseDown(this.$container);

      dropdownMenu(0);

      await sleep(300);

      const nextWidth = $menu.find('.wtHider').width();

      expect(nextWidth).toEqual(firstWidth);
    });

    it('should display proper width of conditional select', async() => {
      const hot = handsontable({
        colHeaders: true,
        dropdownMenu: true,
        filters: true,
        language: 'longerForTests'
      });

      dropdownMenu(0);

      openDropdownByConditionMenu();

      await sleep(300);

      const $conditionalMenu = $('.htFiltersConditionsMenu');
      const firstWidth = $conditionalMenu.find('.wtHider').width();

      hot.updateSettings({ language: 'en-US' });

      dropdownMenu(0);

      openDropdownByConditionMenu();

      await sleep(300);

      const nextWidth = $conditionalMenu.find('.wtHider').width();

      expect(nextWidth).toBeLessThanOrEqual(firstWidth);
    });

    it('should display proper width of htUIMultipleSelectHot container #151', async() => {
      handsontable({
        data: [
          [3, 'D'],
          [2, 'C'],
          [1, 'B'],
          [0, 'A this is very looooong text should expand the drop-down menu'],
          [3, 'f'],
          [2, '6'],
          [1, '!'],
          [0, 'A this']
        ],
        colHeaders: true,
        rowHeaders: true,
        dropdownMenu: true,
        filters: true
      });

      dropdownMenu(0);

      await sleep(300);

      const $multipleSelect = $('.htUIMultipleSelectHot');
      const wtHolderWidth = $multipleSelect.find('.wtHolder').width();
      const wtHiderWidth = $multipleSelect.find('.wtHider').width();

      expect(wtHiderWidth).toBeLessThan(wtHolderWidth);
    });

    it('should not expand the drop-down menu after selecting longer value inside the conditional select', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: true,
        filters: true,
        language: 'longerForTests'
      });

      const $menu = $('.htDropdownMenu');

      dropdownMenu(0);

      const firstWidth = $menu.find('.wtHider').width();

      openDropdownByConditionMenu();

      await sleep(300);

      const $conditionalMenu = $('.htFiltersConditionsMenu');
      const $conditionalMenuItems = $conditionalMenu.find('tbody td:not(.htSeparator)');

      $conditionalMenuItems.eq(1).simulate('mousedown').simulate('mouseup');

      const nextWidth = $menu.find('.wtHider').width();

      expect(nextWidth).toBe(firstWidth);
    });
  });

  describe('cooperation with the HiddenColumns plugins', () => {
    it('should display proper values after opening dropdown menu', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        dropdownMenu: true,
        filters: true,
        hiddenColumns: {
          columns: [0],
        },
        colHeaders: true,
        rowHeaders: true
      });

      dropdownMenu(0);

      await sleep(200);

      const elements = $(byValueBoxRootElement()).find('label').toArray();
      const text = elements.map(element => $(element).text());

      expect(text).toEqual(['B1', 'B2', 'B3', 'B4', 'B5']);

      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Begins with');

      await sleep(200);

      // Begins with 'b'
      document.activeElement.value = 'b';
      keyUp('b');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(spec().$container.find('th:eq(1)').hasClass('htFiltersActive')).toEqual(true);
    });
  });

  it('should handle locales properly while using search input for Filter by value component', async() => {
    handsontable({
      data: [
        ['Abdulhamit Akkaya'],
        ['Abubekir Kılıç'],
        ['Furkan İnanç'],
        ['Halil İbrahim Öztürk'],
        ['Kaan Yerli'],
        ['Ömer Emin Sarıkoç'],
      ],
      colHeaders: true,
      filters: true,
      dropdownMenu: true,
      locale: 'tr-TR',
    });

    dropdownMenu(0);

    await sleep(200);

    const inputElement = dropdownMenuRootElement().querySelector('.htUIMultipleSelectSearch input');
    const event = new Event('input', {
      bubbles: true,
      cancelable: true,
    });

    $(inputElement).simulate('mousedown').simulate('mouseup').simulate('click');
    $(inputElement).focus();

    await sleep(200);

    document.activeElement.value = 'inanç';
    document.activeElement.dispatchEvent(event);

    let elements = $(byValueBoxRootElement()).find('label').toArray();
    let text = elements.map(element => $(element).text());

    expect(text).toEqual(['Furkan İnanç']);

    document.activeElement.value = 'İnanç';
    document.activeElement.dispatchEvent(event);

    elements = $(byValueBoxRootElement()).find('label').toArray();
    text = elements.map(element => $(element).text());

    expect(text).toEqual(['Furkan İnanç']);
  });

  it('should handle selection in value box properly', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      colHeaders: true,
      filters: true,
      dropdownMenu: true
    });

    dropdownMenu(0);

    await sleep(200);

    const inputElement = dropdownMenuRootElement().querySelector('.htUIMultipleSelectSearch input');

    $(inputElement).simulate('mousedown').simulate('mouseup').simulate('click');
    $(inputElement).focus();

    await sleep(200);

    keyDownUp('arrowdown');

    expect(byValueMultipleSelect().getItemsBox().getSelected()).toEqual([[0, 0, 0, 0]]);

    keyDownUp('arrowdown');

    expect(byValueMultipleSelect().getItemsBox().getSelected()).toEqual([[1, 0, 1, 0]]);

    keyDownUp('arrowup');

    expect(byValueMultipleSelect().getItemsBox().getSelected()).toEqual([[0, 0, 0, 0]]);

    $(inputElement).simulate('mousedown').simulate('mouseup').simulate('click');
    $(inputElement).focus();

    expect(byValueMultipleSelect().getItemsBox().getSelected()).toBeUndefined();

    $(inputElement).simulate('mousedown').simulate('mouseup').simulate('click');
    $(inputElement).focus();

    keyDownUp('tab');

    expect(byValueMultipleSelect().getItemsBox().getSelected()).toBeUndefined();

    $(inputElement).simulate('mousedown').simulate('mouseup').simulate('click');
    $(inputElement).focus();

    keyDownUp(['shift', 'tab']);

    expect(byValueMultipleSelect().getItemsBox().getSelected()).toBeUndefined();
  });

  it('should inherit the actual layout direction option from the root Handsontable instance to the multiple ' +
    'select component', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      colHeaders: true,
      filters: true,
      dropdownMenu: true,
      layoutDirection: 'inherit',
    });

    dropdownMenu(0);

    expect(byValueMultipleSelect().getItemsBox().getSettings().layoutDirection).toBe('ltr');
  });

  it('should not throw an error after filtering the dataset when the UI is limited (#dev-1629)', () => {
    const onErrorSpy = spyOn(window, 'onerror').and.returnValue(true);

    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: ['filter_by_condition', 'filter_by_value', 'filter_action_bar'],
      filters: true,
      width: 500,
      height: 300
    });

    dropdownMenu(0);
    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'))
      .simulate('click');

    expect(onErrorSpy).not.toHaveBeenCalled();
  });
});
