describe('Filters keyboard shortcut', () => {
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

  describe('"Alt" + "A"', () => {
    it('should remove filters condition from all columns (without any selection)', () => {
      handsontable({
        data: getDataForFilters().splice(0, 10),
        rowHeaders: true,
        colHeaders: true,
        filters: true,
        dropdownMenu: true,
      });

      const plugin = getPlugin('filters');

      plugin.addCondition(1, 'contains', ['a'], 'conjunction');
      plugin.addCondition(2, 'contains', ['a'], 'conjunction');
      plugin.addCondition(4, 'begins_with', ['green'], 'conjunction');
      plugin.filter();

      listen();
      keyDownUp(['alt', 'a']);

      expect(plugin.conditionCollection.getFilteredColumns().length).toBe(0);
      expect(getSelected()).toBeUndefined();
    });

    it('should remove filters condition from all columns (cell is selected)', () => {
      handsontable({
        data: getDataForFilters().splice(0, 10),
        rowHeaders: true,
        colHeaders: true,
        filters: true,
        dropdownMenu: true,
      });

      const plugin = getPlugin('filters');

      plugin.addCondition(1, 'contains', ['a'], 'conjunction');
      plugin.addCondition(2, 'contains', ['a'], 'conjunction');
      plugin.addCondition(4, 'begins_with', ['green'], 'conjunction');
      plugin.filter();

      selectCell(1, 3);
      keyDownUp(['alt', 'a']);

      expect(plugin.conditionCollection.getFilteredColumns().length).toBe(0);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,3']);
    });

    it('should remove filters condition from all columns (column header is selected)', () => {
      handsontable({
        data: getDataForFilters().splice(0, 10),
        rowHeaders: true,
        colHeaders: true,
        filters: true,
        dropdownMenu: true,
        navigableHeaders: true,
      });

      const plugin = getPlugin('filters');

      plugin.addCondition(1, 'contains', ['a'], 'conjunction');
      plugin.addCondition(2, 'contains', ['a'], 'conjunction');
      plugin.addCondition(4, 'begins_with', ['green'], 'conjunction');
      plugin.filter();

      selectCell(-1, 3);
      keyDownUp(['alt', 'a']);

      expect(plugin.conditionCollection.getFilteredColumns().length).toBe(0);
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,3 from: -1,3 to: -1,3']);
    });

    it('should remove filters condition from all columns (row header is selected)', () => {
      handsontable({
        data: getDataForFilters().splice(0, 10),
        rowHeaders: true,
        colHeaders: true,
        filters: true,
        dropdownMenu: true,
        navigableHeaders: true,
      });

      const plugin = getPlugin('filters');

      plugin.addCondition(1, 'contains', ['a'], 'conjunction');
      plugin.addCondition(2, 'contains', ['a'], 'conjunction');
      plugin.addCondition(4, 'begins_with', ['green'], 'conjunction');
      plugin.filter();

      selectCell(3, -1);
      keyDownUp(['alt', 'a']);

      expect(plugin.conditionCollection.getFilteredColumns().length).toBe(0);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,-1 from: 3,-1 to: 3,-1']);
    });

    it('should remove filters condition from all columns (corner is selected)', () => {
      handsontable({
        data: getDataForFilters().splice(0, 10),
        rowHeaders: true,
        colHeaders: true,
        filters: true,
        dropdownMenu: true,
        navigableHeaders: true,
      });

      const plugin = getPlugin('filters');

      plugin.addCondition(1, 'contains', ['a'], 'conjunction');
      plugin.addCondition(2, 'contains', ['a'], 'conjunction');
      plugin.addCondition(4, 'begins_with', ['green'], 'conjunction');
      plugin.filter();

      selectCell(-1, -1);
      keyDownUp(['alt', 'a']);

      expect(plugin.conditionCollection.getFilteredColumns().length).toBe(0);
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);
    });
  });

  describe('"Control/Meta" + "A"', () => {
    it('should not close the dropdown menu, nor select all cells in the main table when pressing cmd/ctrl + a on an' +
      ' opened select component', async() => {
      handsontable({
        data: getDataForFilters().splice(0, 10),
        rowHeaders: true,
        colHeaders: true,
        filters: true,
        dropdownMenu: true,
        navigableHeaders: true,
      });

      dropdownMenu(1);
      const initialSelectionState = getSelectedRange();

      $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');

      await sleep(10);

      keyDownUp(['Control/Meta', 'A']);

      expect(getPlugin('dropdownMenu').menu.isOpened()).toBe(true);
      expect(getPlugin('filters').components.get('filter_by_condition').elements[0].getMenu().isOpened()).toBe(true);
      expect(getSelectedRange()).toEqual(initialSelectionState);
      expect(isListening()).toBe(false);
    });
  });

  describe('LinkUI buttons', () => {
    it.forTheme('classic')('should react to both `Enter` and `Space`', async() => {
      const countCheckedCheckboxes = () => {
        return Array.from(
          document.querySelectorAll('.htUIMultipleSelectHot input[type=checkbox]')
        ).filter(el => el.checked).length;
      };

      handsontable({
        data: getDataForFilters().splice(0, 10),
        rowHeaders: true,
        colHeaders: true,
        filters: true,
        dropdownMenu: true,
        navigableHeaders: true,
      });

      dropdownMenu(1);

      document.querySelector('.htUIClearAll a').focus();

      keyDownUp('enter');
      await sleep(15);
      expect(countCheckedCheckboxes()).toEqual(0);

      document.querySelector('.htUISelectAll a').focus();

      keyDownUp('enter');
      await sleep(15);
      expect(countCheckedCheckboxes()).toEqual(10);

      document.querySelector('.htUIClearAll a').focus();

      keyDownUp('space');
      await sleep(15);
      expect(countCheckedCheckboxes()).toEqual(0);

      document.querySelector('.htUISelectAll a').focus();

      keyDownUp('space');
      await sleep(15);
      expect(countCheckedCheckboxes()).toEqual(10);
    });

    it.forTheme('main')('should react to both `Enter` and `Space`', async() => {
      const countCheckedCheckboxes = () => {
        return Array.from(
          document.querySelectorAll('.htUIMultipleSelectHot input[type=checkbox]')
        ).filter(el => el.checked).length;
      };

      handsontable({
        data: getDataForFilters().splice(0, 10),
        rowHeaders: true,
        colHeaders: true,
        filters: true,
        dropdownMenu: true,
        navigableHeaders: true,
      });

      dropdownMenu(1);

      document.querySelector('.htUIClearAll a').focus();

      keyDownUp('enter');
      await sleep(15);
      expect(countCheckedCheckboxes()).toEqual(0);

      document.querySelector('.htUISelectAll a').focus();

      keyDownUp('enter');
      await sleep(15);
      expect(countCheckedCheckboxes()).toEqual(8);

      document.querySelector('.htUIClearAll a').focus();

      keyDownUp('space');
      await sleep(15);
      expect(countCheckedCheckboxes()).toEqual(0);

      document.querySelector('.htUISelectAll a').focus();

      keyDownUp('space');
      await sleep(15);
      expect(countCheckedCheckboxes()).toEqual(8);
    });
  });
});
