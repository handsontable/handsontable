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
    it('should display conditional filter component under dropdown menu', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);

      expect(dropdownMenuRootElement().querySelector('.htFiltersMenuCondition .htFiltersMenuLabel').textContent).toBe('Filter by condition:');
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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');

      expect(document.querySelector('.htFiltersConditionsMenu.handsontable table')).not.toBeNull();
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

      expect(rect.top).toBeGreaterThan(500);
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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');

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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');

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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');

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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');

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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');

      // is empty
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(3) td')).simulate('mousedown');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK')).simulate('click');

      dropdownMenu(3);
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');

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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');

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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');

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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');

      expect(document.querySelector('.htFiltersConditionsMenu.handsontable table')).not.toBeNull();

      $(dropdownMenuRootElement().querySelector('tbody :nth-child(6) td')).simulate('mousedown');

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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      $(conditionMenuRootElements().first).find('tbody td:contains("Is equal to")').simulate('mousedown');

      setTimeout(() => {
        keyDownUp('esc');

        expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
        expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
        done();
      }, 200);
    });

    it('should disappear dropdown menu after hitting ESC key in conditional component ' +
      'which don\'t show other input and focus is loosen #86', (done) => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      $(conditionMenuRootElements().first).find('tbody td:contains("Is empty")').simulate('mousedown');

      setTimeout(() => {
        keyDownUp('esc');

        expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
        expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
        done();
      }, 200);
    });

    it('should disappear dropdown menu after hitting ESC key, next to closing SelectUI #149', (done) => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');

      setTimeout(() => {
        keyDownUp('esc');
        keyDownUp('esc');
        expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
        expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
        done();
      }, 200);
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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(3) td')).simulate('mousedown');

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
        $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
        $(conditionMenuRootElements().first).find('tbody td:contains("Begins with")').simulate('mousedown');

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
        $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
        $(conditionMenuRootElements().first).find('tbody td:contains("None")').simulate('mousedown');

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
        $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
        $(conditionMenuRootElements().first).find('tbody td:contains("Is equal to")').simulate('mousedown');

        $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
        $(conditionMenuRootElements().first).find('tbody td:contains("None")').simulate('mousedown');

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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // menu separator click
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(2) td')).simulate('mousedown');

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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // eq
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(6) td')).simulate('mousedown');

      await sleep(200);

      // Is equal to '5'
      document.activeElement.value = '5';
      $(document.activeElement).simulate('keyup');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      dropdownMenu(0);

      expect(dropdownMenuRootElement().querySelector('.htUISelectCaption').textContent).toBe('Is equal to');

      let inputs = dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput input');

      expect($(inputs[0]).is(':visible')).toBe(true);
      expect(inputs[0].value).toBe('5');
      expect($(inputs[1]).is(':visible')).toBe(false);

      dropdownMenu(3);
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // between
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(11) td')).simulate('mousedown');

      await sleep(200);

      // Is equal to '5'
      document.activeElement.value = '5';
      $(document.activeElement).simulate('keyup');
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
        expect(dropdownMenuRootElement().querySelector('.htUISelectCaption').textContent).toBe('Greater than or equal to');

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
      const th = hot.view.wt.wtTable.getColumnHeader(1);
      const filterButton = $(th).find('button');

      plugin.addCondition(1, 'begins_with', ['a', 'b', 'c', 'd']);

      $(filterButton).simulate('click');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('"by value" component', () => {
    it('should appear under dropdown menu', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);

      expect(byValueMultipleSelect().element.parentNode.querySelector('.htFiltersMenuLabel').textContent).toBe('Filter by value:');
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
      data[3].name = void 0;

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

    it('shouldn\'t break "by value" items in the next filter stacks', (done) => {
      const data = getDataForFilters();
      data[3].name = void 0;

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
        keyDownUp('esc');

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
        byValueMultipleSelect().itemsBox.listen();
        keyDownUp('esc');
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

        $(byValueBoxRootElement()).find('tr:nth-child(1) :checkbox').simulate('click');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
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

        $(byValueBoxRootElement()).find('tr:nth-child(1) :checkbox').simulate('click');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

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

        $(byValueBoxRootElement()).find('tr:nth-child(1) :checkbox').simulate('click');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

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

        $(byValueBoxRootElement()).find('tr:nth-child(1) :checkbox').simulate('click');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

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

        $(byValueBoxRootElement()).find('tr:nth-child(1) :checkbox').simulate('click');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        setDataAtCell(0, 2, 'AAA City');

        dropdownMenu(2);
        expect($(byValueBoxRootElement()).find('tr:nth-child(1)').text()).toEqual('AAA City');
      });
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

      $(byValueBoxRootElement()).find('tr:nth-child(1) :checkbox').simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      // moving column

      manualColumnMove.moveColumn(0, 2);
      hot.render();

      // filtering first value of column (deselecting checkbox)

      dropdownMenu(2);

      $(byValueBoxRootElement()).find('tr:nth-child(1) :checkbox').simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toEqual(2);
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

      $(byValueBoxRootElement()).find('tr:nth-child(1) :checkbox').simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      // moving column

      manualColumnMove.moveColumn(0, 2);
      hot.render();

      // filtering second value of column (deselecting checkbox)

      dropdownMenu(1);

      $(byValueBoxRootElement()).find('tr:nth-child(2) :checkbox').simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toEqual(2);
    });
  });

  it('should deselect all values in "Filter by value" after clicking "Clear" link', (done) => {
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
      $(dropdownMenuRootElement().querySelector('.htUIClearAll a')).simulate('click');

      expect(byValueMultipleSelect().items.map(o => o.checked).indexOf(true)).toBe(-1);
      done();
    }, 100);
  });

  it('should select all values in "Filter by value" after clicking "Select all" link', (done) => {
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
      $(dropdownMenuRootElement().querySelector('.htUIClearAll a')).simulate('click');

      expect(byValueMultipleSelect().items.map(o => o.checked).indexOf(true)).toBe(-1);

      $(dropdownMenuRootElement().querySelector('.htUISelectAll a')).simulate('click');

      expect(byValueMultipleSelect().items.map(o => o.checked).indexOf(false)).toBe(-1);
      done();
    }, 100);
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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // is empty
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(3) td')).simulate('mousedown');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toBe(0);

      dropdownMenu(0);
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // none
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(1) td')).simulate('mousedown');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // gt
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(9) td')).simulate('mousedown');

      setTimeout(() => {
        // Greater than 12
        document.activeElement.value = '12';
        $(document.activeElement).simulate('keyup');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toEqual(27);
        expect(getData()[0][0]).toBe(13);
        expect(getData()[0][1]).toBe('Dina Randolph');
        expect(getData()[0][2]).toBe('Henrietta');
        expect(getData()[0][3]).toBe('2014-04-29');
        expect(getData()[0][4]).toBe('blue');
        expect(getData()[0][5]).toBe(3827.99);
        expect(getDataAtCol(0).join()).toBe('13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39');
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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // contains
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(12) td')).simulate('mousedown');

      setTimeout(() => {
        // Contains ej
        document.activeElement.value = 'ej';
        $(document.activeElement).simulate('keyup');
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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // contains
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(15) td')).simulate('mousedown');
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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // contains
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(6) td')).simulate('mousedown');

      setTimeout(() => {
        // Is equal to 'true'
        document.activeElement.value = 'true';
        $(document.activeElement).simulate('keyup');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toEqual(18);
        expect(getData()[0][0]).toBe(1);
        expect(getData()[0][1]).toBe('Nannie Patel');
        expect(getData()[0][2]).toBe('Jenkinsville');
        expect(getData()[0][3]).toBe('2014-01-29');
        expect(getData()[0][4]).toBe('green');
        expect(getData()[0][5]).toBe(1261.60);
        expect(getData()[0][6]).toBe(true);
        expect(getDataAtCol(6).join()).toBe('true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true');
        done();
      }, 200);
    });

    it('should filter values using "by value" method', (done) => {
      handsontable({
        data: getDataForFilters().slice(0, 15),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(2);

      setTimeout(() => {
        // disable first 5 records
        $(byValueBoxRootElement()).find('tr:nth-child(1) :checkbox').simulate('click');
        $(byValueBoxRootElement()).find('tr:nth-child(2) :checkbox').simulate('click');
        $(byValueBoxRootElement()).find('tr:nth-child(3) :checkbox').simulate('click');
        $(byValueBoxRootElement()).find('tr:nth-child(4) :checkbox').simulate('click');
        $(byValueBoxRootElement()).find('tr:nth-child(5) :checkbox').simulate('click');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toEqual(10);
        expect(getDataAtCol(2).join()).toBe('Jenkinsville,Gardiner,Saranap,Soham,Needmore,Wakarusa,Yukon,Layhill,Henrietta,Wildwood');
        done();
      }, 200);
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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // eq
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(6) td')).simulate('mousedown');

      await sleep(200);

      // Is equal to '5'
      document.activeElement.value = '5';
      $(document.activeElement).simulate('keyup');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toEqual(1);

      dropdownMenu(0);
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // lt
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(11) td')).simulate('mousedown');

      await sleep(200);

      // Less than
      document.activeElement.value = '8';
      $(document.activeElement).simulate('keyup');
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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // lt
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(11) td')).simulate('mousedown');

      await sleep(200);

      // Less than
      document.activeElement.value = '8';
      $(document.activeElement).simulate('keyup');
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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // gt
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(9) td')).simulate('mousedown');

      await sleep(100);

      // Greater than 12
      document.activeElement.value = '12';
      $(document.activeElement).simulate('keyup');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      dropdownMenu(2);
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // begins_with
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(9) td')).simulate('mousedown');

      await sleep(100);

      document.activeElement.value = 'b';
      $(document.activeElement).simulate('keyup');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      dropdownMenu(4);
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // eq
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(6) td')).simulate('mousedown');

      await sleep(100);

      document.activeElement.value = 'green';
      $(document.activeElement).simulate('keyup');
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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // gt
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(9) td')).simulate('mousedown');

      await sleep(200);

      // Greater than 12
      document.activeElement.value = '12';
      $(document.activeElement).simulate('keyup');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      dropdownMenu(2);
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // begins_with
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(9) td')).simulate('mousedown');

      await sleep(200);

      document.activeElement.value = 'b';
      $(document.activeElement).simulate('keyup');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      dropdownMenu(4);
      // uncheck first record
      $(byValueBoxRootElement()).find('tr:nth-child(1) :checkbox').simulate('click');

      await sleep(200);
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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // gt
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(9) td')).simulate('mousedown');

      await sleep(200);
      // Greater than 12
      document.activeElement.value = '12';
      $(document.activeElement).simulate('keyup');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      dropdownMenu(2);
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // begins_with
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(9) td')).simulate('mousedown');

      await sleep(200);
      document.activeElement.value = 'b';
      $(document.activeElement).simulate('keyup');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      // Change first added filter condition. First added condition is responsible for defining data root chain.
      dropdownMenu(0);
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // between
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(13) td')).simulate('mousedown');

      await sleep(200);
      const inputs = dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition input');

      inputs[0].value = '1';
      inputs[1].value = '15';
      $(inputs[0]).simulate('keyup');
      $(inputs[1]).simulate('keyup');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

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

    it('should apply filtered values to the next "by value" component defined after edited conditions', (done) => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(0);
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // gt
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(9) td')).simulate('mousedown');

      setTimeout(() => {
        // Greater than 25
        document.activeElement.value = '25';
        $(document.activeElement).simulate('keyup');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        dropdownMenu(2);
      }, 200);

      setTimeout(() => {
        // uncheck
        $(byValueBoxRootElement()).find('tr:nth-child(1) :checkbox').simulate('click');
        $(byValueBoxRootElement()).find('tr:nth-child(3) :checkbox').simulate('click');
        $(byValueBoxRootElement()).find('tr:nth-child(4) :checkbox').simulate('click');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        dropdownMenu(1);
      }, 400);

      setTimeout(() => {
        // uncheck
        $(byValueBoxRootElement()).find('tr:nth-child(1) :checkbox').simulate('click');
        $(byValueBoxRootElement()).find('tr:nth-child(2) :checkbox').simulate('click');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(byValueMultipleSelect().getItems().length).toBe(11);
        expect(byValueMultipleSelect().getValue().length).toBe(9);

        dropdownMenu(4);
      }, 600);

      setTimeout(() => {
        // uncheck
        $(byValueBoxRootElement()).find('tr:nth-child(1) :checkbox').simulate('click');
        $(byValueBoxRootElement()).find('tr:nth-child(2) :checkbox').simulate('click');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(byValueMultipleSelect().getItems().length).toBe(3);
        expect(byValueMultipleSelect().getValue().length).toBe(1);

        dropdownMenu(2);
      }, 800);

      setTimeout(() => {
        // check again (disable filter)
        $(byValueBoxRootElement()).find('tr:nth-child(1) :checkbox').simulate('click');
        $(byValueBoxRootElement()).find('tr:nth-child(3) :checkbox').simulate('click');
        $(byValueBoxRootElement()).find('tr:nth-child(4) :checkbox').simulate('click');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        dropdownMenu(1);
      }, 1000);

      setTimeout(() => {
        expect(byValueMultipleSelect().getItems().length).toBe(14);
        expect(byValueMultipleSelect().getValue().length).toBe(9);

        dropdownMenu(4);
      }, 1200);

      setTimeout(() => {
        // unchanged state for condition behind second condition
        expect(byValueMultipleSelect().getItems().length).toBe(3);
        expect(byValueMultipleSelect().getValue().length).toBe(1);
        done();
      }, 1500);
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

      $(conditionSelectRootElements().first).simulate('click');
      $(conditionMenuRootElements().first).find('tbody td:contains("Begins with")').simulate('mousedown');

      setTimeout(() => {
        document.activeElement.value = 'm';
        $(document.activeElement).simulate('keyup');
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
      $(conditionSelectRootElements().first).simulate('click');
      $(conditionMenuRootElements().first).find('tbody td:contains("Begins with")').simulate('mousedown');

      setTimeout(() => {
        document.activeElement.value = 'm';
        $(document.activeElement).simulate('keyup');

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

    it('should filter data properly after changing operator ' +
      '(`conjunction` <-> `disjunction` operation)', (done) => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);

      $(conditionSelectRootElements().first).simulate('click');
      $(conditionMenuRootElements().first).find('tbody td:contains("Begins with")').simulate('mousedown');

      setTimeout(() => {
        document.activeElement.value = 'm';
        $(document.activeElement).simulate('keyup');

        $(conditionSelectRootElements().second).simulate('click');
        $(conditionMenuRootElements().second).find('tbody td:contains("Ends with")').simulate('mousedown');
      }, 300);

      setTimeout(() => {
        document.activeElement.value = 'e';
        $(document.activeElement).simulate('keyup');

        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
        expect(getData().length).toBe(3);
        dropdownMenu(1);
      }, 600);

      setTimeout(() => {
        // disjunction
        $(conditionRadioInput(1).element).find('input[type="radio"]').simulate('click');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
        expect(getData().length).toBe(7);
        dropdownMenu(1);
      }, 900);

      setTimeout(() => {
        // conjunction
        $(conditionRadioInput(0).element).find('input[type="radio"]').simulate('click');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
        expect(getData().length).toBe(3);
        done();
      }, 1200);
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

      $(conditionSelectRootElements().first).simulate('click');
      $(conditionMenuRootElements().first).find('tbody td:contains("Begins with")').simulate('mousedown');

      setTimeout(() => {
        document.activeElement.value = 'm';
        $(document.activeElement).simulate('keyup');

        $(conditionSelectRootElements().second).simulate('click');
        $(conditionMenuRootElements().second).find('tbody td:contains("Ends with")').simulate('mousedown');
      }, 300);

      setTimeout(() => {
        document.activeElement.value = 'e';
        $(document.activeElement).simulate('keyup');

        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
      }, 600);

      setTimeout(() => {
        dropdownMenu(1);
      }, 900);

      setTimeout(() => {
        document.activeElement.value = '';
        $(document.activeElement).simulate('keyup');
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

      $(conditionSelectRootElements().first).simulate('click');
      $(conditionMenuRootElements().first).find('tbody td:contains("Begins with")').simulate('mousedown');

      setTimeout(() => {
        document.activeElement.value = 'm';
        $(document.activeElement).simulate('keyup');

        $(conditionSelectRootElements().second).simulate('click');
        $(conditionMenuRootElements().second).find('tbody td:contains("Ends with")').simulate('mousedown');
      }, 300);

      setTimeout(() => {
        document.activeElement.value = 'e';
        $(document.activeElement).simulate('keyup');

        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
      }, 600);

      setTimeout(() => {
        dropdownMenu(1);
      }, 900);

      setTimeout(() => {
        $(conditionSelectRootElements().second).simulate('click');
        $(conditionMenuRootElements().second).find('tbody td:contains("None")').simulate('mousedown');
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

      $(conditionSelectRootElements().first).simulate('click');
      $(conditionMenuRootElements().first).find('tbody td:contains("Begins with")').simulate('mousedown');

      await sleep(200);

      document.activeElement.value = 'm';
      $(document.activeElement).simulate('keyup');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

      expect(getData().length).toBe(5);
      dropdownMenu(1);

      await sleep(200);

      const $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));
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

      $(conditionSelectRootElements().first).simulate('click');
      $(conditionMenuRootElements().first).find('tbody td:contains("Begins with")').simulate('mousedown');

      await sleep(200);

      document.activeElement.value = 'm';
      $(document.activeElement).simulate('keyup');

      $(conditionSelectRootElements().second).simulate('click');
      $(conditionMenuRootElements().second).find('tbody td:contains("Ends with")').simulate('mousedown');

      await sleep(200);

      document.activeElement.value = 'e';
      $(document.activeElement).simulate('keyup');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
      dropdownMenu(1);

      await sleep(200);

      const $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));
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

      $(conditionSelectRootElements().first).simulate('click');
      $(conditionMenuRootElements().first).find('tbody td:contains("Begins with")').simulate('mousedown');

      await sleep(200);

      document.activeElement.value = 'm';
      $(document.activeElement).simulate('keyup');

      $(conditionSelectRootElements().second).simulate('click');
      $(conditionMenuRootElements().second).find('tbody td:contains("Ends with")').simulate('mousedown');

      await sleep(200);

      document.activeElement.value = 'e';
      $(document.activeElement).simulate('keyup');
      const $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));

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

      $(conditionSelectRootElements().first).simulate('click');
      $(conditionMenuRootElements().first).find('tbody td:contains("Begins with")').simulate('mousedown');

      await sleep(200);

      document.activeElement.value = 'm';
      $(document.activeElement).simulate('keyup');

      $(conditionSelectRootElements().second).simulate('click');
      $(conditionMenuRootElements().second).find('tbody td:contains("Ends with")').simulate('mousedown');

      await sleep(200);
      document.activeElement.value = 'e';
      $(document.activeElement).simulate('keyup');

      let $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));
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
        const $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));
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
        const $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));
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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // gt
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(9) td')).simulate('mousedown');

      await sleep(200);

      // Greater than 12
      document.activeElement.value = '12';
      $(document.activeElement).simulate('keyup');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      // sort
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('click');

      dropdownMenu(2);
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // begins_with
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(9) td')).simulate('mousedown');

      await sleep(200);

      // Begins with 'b'
      document.activeElement.value = 'b';
      $(document.activeElement).simulate('keyup');
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
        $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
        // gt
        $(conditionMenuRootElements().first.querySelector('tbody :nth-child(9) td')).simulate('mousedown');
      }, 300);

      setTimeout(() => {
        // Greater than 12

        $(conditionSelectRootElements().first).next().find('input')[0].focus();

        document.activeElement.value = '12';
        $(document.activeElement).simulate('keyup');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        // sort
        getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
        getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
        getHtCore().find('th span.columnSorting:eq(2)').simulate('click');
        alter('remove_row', 1, 5);

        dropdownMenu(2);
        $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
        // ends_with
        $(conditionMenuRootElements().first.querySelector('tbody :nth-child(10) td')).simulate('mousedown');
      }, 600);

      setTimeout(() => {
        // Ends with 'e'

        $(conditionSelectRootElements().first).next().find('input')[0].focus();

        document.activeElement.value = 'e';
        $(document.activeElement).simulate('keyup');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toEqual(7);
        expect(getDataAtCol(0).join()).toBe('24,16,23,32,26,28,21');

        alter('remove_row', 1, 5);

        expect(getData().length).toEqual(2);
        expect(getDataAtCol(0).join()).toBe('24,21');

        dropdownMenu(0);
        $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
        // none
        $(conditionMenuRootElements().first.querySelector('tbody :nth-child(1) td')).simulate('mousedown');
      }, 900);

      setTimeout(() => {
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toEqual(5);
        expect(getDataAtCol(0).join()).toBe('24,10,1,6,21');
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
        $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
        // gt
        $(conditionMenuRootElements().first.querySelector('tbody :nth-child(9) td')).simulate('mousedown');
      }, 300);

      setTimeout(() => {
        // Greater than 12

        $(conditionSelectRootElements().first).next().find('input')[0].focus();

        document.activeElement.value = '12';
        $(document.activeElement).simulate('keyup');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        // sort
        getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
        getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
        getHtCore().find('th span.columnSorting:eq(2)').simulate('click');
        alter('insert_row', 1, 5);

        dropdownMenu(2);
        $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
        // ends_with
        $(conditionMenuRootElements().first.querySelector('tbody :nth-child(10) td')).simulate('mousedown');
      }, 600);

      setTimeout(() => {
        // Ends with 'e'

        $(conditionSelectRootElements().first).next().find('input')[0].focus();

        document.activeElement.value = 'e';
        $(document.activeElement).simulate('keyup');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toBe(9);
        expect(getDataAtCol(0).join()).toBe('24,17,14,16,23,32,26,28,21');

        alter('insert_row', 1, 1);

        expect(getData().length).toBe(10);
        expect(getDataAtCol(0).join()).toBe('24,,17,14,16,23,32,26,28,21');

        dropdownMenu(0);
        $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
        // is empty
        $(conditionMenuRootElements().first.querySelector('tbody :nth-child(3) td')).simulate('mousedown');
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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // gt
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(9) td')).simulate('mousedown');

      await sleep(200);

      // Greater than 12
      document.activeElement.value = '12';
      $(document.activeElement).simulate('keyup');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      // sort
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('click');

      dropdownMenu(2);
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      // begins_with
      $(conditionMenuRootElements().first.querySelector('tbody :nth-child(9) td')).simulate('mousedown');

      await sleep(200);

      // Begins with 'b'
      document.activeElement.value = 'b';
      $(document.activeElement).simulate('keyup');
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
        $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
        // gt
        $(conditionMenuRootElements().first.querySelector('tbody :nth-child(9) td')).simulate('mousedown');
      }, 300);

      setTimeout(() => {
        // Greater than 12

        $(conditionSelectRootElements().first).next().find('input')[0].focus();

        document.activeElement.value = '12';
        $(document.activeElement).simulate('keyup');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        // sort
        getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
        getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
        getHtCore().find('th span.columnSorting:eq(2)').simulate('click');
        alter('remove_row', 1, 5);

        dropdownMenu(2);
        $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
        // ends_with
        $(conditionMenuRootElements().first.querySelector('tbody :nth-child(10) td')).simulate('mousedown');
      }, 600);

      setTimeout(() => {
        // Ends with 'e'

        $(conditionSelectRootElements().first).next().find('input')[0].focus();

        document.activeElement.value = 'e';
        $(document.activeElement).simulate('keyup');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toEqual(7);
        expect(getDataAtCol(0).join()).toBe('24,16,23,32,26,28,21');

        alter('remove_row', 1, 5);

        expect(getData().length).toEqual(2);
        expect(getDataAtCol(0).join()).toBe('24,21');

        dropdownMenu(0);
        $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
        // none
        $(conditionMenuRootElements().first.querySelector('tbody :nth-child(1) td')).simulate('mousedown');
      }, 900);

      setTimeout(() => {
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toEqual(5);
        expect(getDataAtCol(0).join()).toBe('24,10,1,6,21');
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
        $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
        // gt
        $(conditionMenuRootElements().first.querySelector('tbody :nth-child(9) td')).simulate('mousedown');
      }, 300);

      setTimeout(() => {
        // Greater than 12

        $(conditionSelectRootElements().first).next().find('input')[0].focus();

        document.activeElement.value = '12';
        $(document.activeElement).simulate('keyup');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        // sort
        getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
        getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
        getHtCore().find('th span.columnSorting:eq(2)').simulate('click');
        alter('insert_row', 1, 5);

        dropdownMenu(2);
        $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
        // ends_with
        $(conditionMenuRootElements().first.querySelector('tbody :nth-child(10) td')).simulate('mousedown');
      }, 600);

      setTimeout(() => {
        // Ends with 'e'

        $(conditionSelectRootElements().first).next().find('input')[0].focus();

        document.activeElement.value = 'e';
        $(document.activeElement).simulate('keyup');
        $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

        expect(getData().length).toBe(9);
        expect(getDataAtCol(0).join()).toBe('24,17,14,16,23,32,26,28,21');

        alter('insert_row', 1, 1);

        expect(getData().length).toBe(10);
        expect(getDataAtCol(0).join()).toBe('24,,17,14,16,23,32,26,28,21');

        dropdownMenu(0);
        $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
        // is empty
        $(conditionMenuRootElements().first.querySelector('tbody :nth-child(3) td')).simulate('mousedown');
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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      $(conditionMenuRootElements().first).find('tbody td:contains("Begins with")').simulate('mousedown');

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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      $(conditionMenuRootElements().first).find('tbody td:contains("None")').simulate('mousedown');

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
      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      $(conditionMenuRootElements().first).find('tbody td:contains("Is equal to")').simulate('mousedown');

      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      $(conditionMenuRootElements().first).find('tbody td:contains("None")').simulate('mousedown');

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

      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      $(conditionMenuRootElements().first).find('tbody td:contains("Begins with")').simulate('mousedown');

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

      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      $(conditionMenuRootElements().first).find('tbody td:contains("Begins with")').simulate('mousedown');

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

      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
      $(conditionMenuRootElements().first).find('tbody td:contains("Begins with")').simulate('mousedown');

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

      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');

      await sleep(300);

      const $conditionalMenu = $('.htFiltersConditionsMenu');
      const firstWidth = $conditionalMenu.find('.wtHider').width();

      hot.updateSettings({ language: 'en-US' });

      dropdownMenu(0);

      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');

      await sleep(300);

      const nextWidth = $conditionalMenu.find('.wtHider').width();

      expect(nextWidth).toBeLessThan(firstWidth);
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

      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');

      await sleep(300);

      const $conditionalMenu = $('.htFiltersConditionsMenu');
      const $conditionalMenuItems = $conditionalMenu.find('tbody td:not(.htSeparator)');

      $conditionalMenuItems.eq(1).simulate('mousedown');

      const nextWidth = $menu.find('.wtHider').width();

      expect(nextWidth).toBe(firstWidth);
    });
  });
});
