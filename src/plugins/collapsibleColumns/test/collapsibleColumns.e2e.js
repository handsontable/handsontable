describe('CollapsibleColumns', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    this.generateComplexSetup = function(rows, cols, obj) {
      const data = [];

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (!data[i]) {
            data[i] = [];
          }

          if (!obj) {
            data[i][j] = `${i}_${j}`;
            /* eslint-disable no-continue */
            continue;
          }

          if (i === 0 && j % 2 !== 0) {
            data[i][j] = {
              label: `${i}_${j}`,
              colspan: 8
            };
          } else if (i === 1 && (j % 3 === 1 || j % 3 === 2)) {
            data[i][j] = {
              label: `${i}_${j}`,
              colspan: 4
            };
          } else if (i === 2 && (j % 5 === 1 || j % 5 === 2 || j % 5 === 3 || j % 5 === 4)) {
            data[i][j] = {
              label: `${i}_${j}`,
              colspan: 2
            };
          } else {
            data[i][j] = `${i}_${j}`;
          }

        }
      }

      return data;
    };

  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('initialization', () => {
    it('should be possible to disable the plugin using the disablePlugin method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', 'b', 'c', 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true
      });

      const collapsibleColumnsPlugin = hot.getPlugin('collapsibleColumns');

      expect($('.collapsibleIndicator').size()).toBeGreaterThan(0);

      collapsibleColumnsPlugin.disablePlugin();
      hot.render();

      expect($('.collapsibleIndicator').size()).toEqual(0);
    });

    it('should be possible to re-enable the plugin using the enablePlugin method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', 'b', 'c', 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true
      });

      const collapsibleColumnsPlugin = hot.getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.disablePlugin();
      hot.render();
      collapsibleColumnsPlugin.enablePlugin();
      hot.render();

      expect($('.collapsibleIndicator').size()).toBeGreaterThan(0);
    });

    it('should be possible to initialize the plugin using the updateSettings method', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', 'b', 'c', 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ]
      });

      hot.updateSettings({
        collapsibleColumns: true
      });

      expect($('.collapsibleIndicator').size()).toBeGreaterThan(0);
    });

  });

  describe('collapsing headers functionality', () => {
    it('should hide all "child" columns except the first one after clicking the "collapse/expand" button/indicator', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', 'b', 'c', 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true
      });

      const button = $('.collapsibleIndicator').first();
      const colgroupArray = $('colgroup col');

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);

      button.simulate('mousedown');

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);
    });

    it('should hide all the "child" columns except the first "child" group, (if a "child group" exists), after clicking the collapse/expand button', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true
      });

      const button = $('.collapsibleIndicator').first();
      const colgroupArray = $('colgroup col');

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);

      button.simulate('mousedown');

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);
    });

    it('should trigger an beforeColumnCollapse and afterColumnCollapse event after collapsed column', () => {
      const beforeColumnCollapseCallback = jasmine.createSpy('beforeColumnCollapseCallback');
      const afterColumnCollapseCallback = jasmine.createSpy('afterColumnCollapseCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnCollapse: beforeColumnCollapseCallback,
        afterColumnCollapse: afterColumnCollapseCallback
      });

      const button = $('.collapsibleIndicator').first();

      button.simulate('mousedown');

      expect(beforeColumnCollapseCallback).toHaveBeenCalledWith([], [3, 4], true, void 0, void 0, void 0);
      expect(afterColumnCollapseCallback).toHaveBeenCalledWith([], [3, 4], true, true, void 0, void 0);
    });

    it('should trigger an beforeColumnCollapse and afterColumnCollapse event after call collapseSection method', () => {
      const beforeColumnCollapseCallback = jasmine.createSpy('beforeColumnCollapseCallback');
      const afterColumnCollapseCallback = jasmine.createSpy('afterColumnCollapseCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnCollapse: beforeColumnCollapseCallback,
        afterColumnCollapse: afterColumnCollapseCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.collapseSection({ row: -2, col: 1 });

      expect(beforeColumnCollapseCallback).toHaveBeenCalledWith([], [3, 4], true, void 0, void 0, void 0);
      expect(afterColumnCollapseCallback).toHaveBeenCalledWith([], [3, 4], true, true, void 0, void 0);
    });

    it('should trigger an beforeColumnCollapse and afterColumnCollapse event after call toggleCollapsibleSection method', () => {
      const beforeColumnCollapseCallback = jasmine.createSpy('beforeColumnCollapseCallback');
      const afterColumnCollapseCallback = jasmine.createSpy('afterColumnCollapseCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnCollapse: beforeColumnCollapseCallback,
        afterColumnCollapse: afterColumnCollapseCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.toggleCollapsibleSection([{ row: -2, col: 1 }], 'collapse');

      expect(beforeColumnCollapseCallback).toHaveBeenCalledWith([], [3, 4], true, void 0, void 0, void 0);
      expect(afterColumnCollapseCallback).toHaveBeenCalledWith([], [3, 4], true, true, void 0, void 0);
    });

    it('should trigger an beforeColumnCollapse and afterColumnCollapse event after call collapseAll method', () => {
      const beforeColumnCollapseCallback = jasmine.createSpy('beforeColumnCollapseCallback');
      const afterColumnCollapseCallback = jasmine.createSpy('afterColumnCollapseCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnCollapse: beforeColumnCollapseCallback,
        afterColumnCollapse: afterColumnCollapseCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.collapseAll();

      expect(beforeColumnCollapseCallback).toHaveBeenCalledWith([], [3, 4, 2], true, void 0, void 0, void 0);
      expect(afterColumnCollapseCallback).toHaveBeenCalledWith([], [3, 4, 2], true, true, void 0, void 0);
    });

    it('should trigger an beforeColumnCollapse and afterColumnCollapse event after call toggleAllCollapsibleSections method', () => {
      const beforeColumnCollapseCallback = jasmine.createSpy('beforeColumnCollapseCallback');
      const afterColumnCollapseCallback = jasmine.createSpy('afterColumnCollapseCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnCollapse: beforeColumnCollapseCallback,
        afterColumnCollapse: afterColumnCollapseCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.toggleAllCollapsibleSections('collapse');

      expect(beforeColumnCollapseCallback).toHaveBeenCalledWith([], [3, 4, 2], true, void 0, void 0, void 0);
      expect(afterColumnCollapseCallback).toHaveBeenCalledWith([], [3, 4, 2], true, true, void 0, void 0);
    });

    it('should returns in afterColumnCollapse hooks `successfullyCollapsed` as false after trying collapsing already collapsed column', () => {
      const afterColumnCollapseCallback = jasmine.createSpy('afterColumnCollapseCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        afterColumnCollapse: afterColumnCollapseCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.collapseSection({ row: -2, col: 1 });
      collapsibleColumnsPlugin.collapseSection({ row: -2, col: 1 });

      expect(afterColumnCollapseCallback).toHaveBeenCalledWith([3, 4], [3, 4], true, false, void 0, void 0);
    });

    it('should returns in beforeColumnCollapse and afterColumnCollapse hooks `collapsePossible` and `successfullyCollapsed` as false when ' +
      'trying collapsing columns which does not have the ability to collapse', () => {
      const beforeColumnCollapseCallback = jasmine.createSpy('beforeColumnCollapseCallback');
      const afterColumnCollapseCallback = jasmine.createSpy('afterColumnCollapseCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ],
        collapsibleColumns: [
          { row: -4, col: 1, collapsible: true },
          { row: -3, col: 1, collapsible: true },
          { row: -2, col: 1, collapsible: true },
          { row: -2, col: 3, collapsible: true }
        ],
        beforeColumnCollapse: beforeColumnCollapseCallback,
        afterColumnCollapse: afterColumnCollapseCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.collapseSection({ row: -1, col: 1 });

      expect(beforeColumnCollapseCallback).toHaveBeenCalledWith([], [], false, void 0, void 0, void 0);
      expect(afterColumnCollapseCallback).toHaveBeenCalledWith([], [], false, false, void 0, void 0);
    });

    it('should not throw error when trying collapsing row which does not have the ability to collapse', () => {
      const beforeColumnCollapseCallback = jasmine.createSpy('beforeColumnCollapseCallback');
      const afterColumnCollapseCallback = jasmine.createSpy('afterColumnCollapseCallback');
      let errors = 0;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ],
        collapsibleColumns: [
          { row: -4, col: 1, collapsible: true },
          { row: -3, col: 1, collapsible: true },
          { row: -2, col: 1, collapsible: true },
          { row: -2, col: 3, collapsible: true }
        ],
        beforeColumnCollapse: beforeColumnCollapseCallback,
        afterColumnCollapse: afterColumnCollapseCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      try {
        collapsibleColumnsPlugin.collapseSection({ row: 0, col: 1 });
      } catch (e) {
        errors += 1;
      }

      expect(errors).toBe(0);
      expect(beforeColumnCollapseCallback).toHaveBeenCalledWith([], [], false, void 0, void 0, void 0);
      expect(afterColumnCollapseCallback).toHaveBeenCalledWith([], [], false, false, void 0, void 0);
    });

    it('should not throw error when trying collapsing column which does not have the ability to collapse', () => {
      const beforeColumnCollapseCallback = jasmine.createSpy('beforeColumnCollapseCallback');
      const afterColumnCollapseCallback = jasmine.createSpy('afterColumnCollapseCallback');
      let errors = 0;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ],
        collapsibleColumns: [
          { row: -4, col: 1, collapsible: true },
          { row: -3, col: 1, collapsible: true },
          { row: -2, col: 1, collapsible: true },
          { row: -2, col: 3, collapsible: true }
        ],
        beforeColumnCollapse: beforeColumnCollapseCallback,
        afterColumnCollapse: afterColumnCollapseCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      try {
        collapsibleColumnsPlugin.collapseSection({ row: 2, col: 2 });
      } catch (e) {
        errors += 1;
      }

      expect(errors).toBe(0);
      expect(beforeColumnCollapseCallback).toHaveBeenCalledWith([], [], false, void 0, void 0, void 0);
      expect(afterColumnCollapseCallback).toHaveBeenCalledWith([], [], false, false, void 0, void 0);
    });

    it('should not trigger an afterColumnCollapse event after try collapse columns when beforeColumnCollapse returns false', () => {
      const afterColumnCollapseCallback = jasmine.createSpy('afterColumnCollapseCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnCollapse: () => false,
        afterColumnCollapse: afterColumnCollapseCallback
      });

      const button = $('.collapsibleIndicator').first();
      const colgroupArray = $('colgroup col');

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);

      button.simulate('mousedown');
      render();

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);

      expect(afterColumnCollapseCallback).not.toHaveBeenCalled();
    });

    it('should not trigger an afterColumnCollapse event after call collapseSection method when beforeColumnCollapse returns false', () => {
      const afterColumnCollapseCallback = jasmine.createSpy('afterColumnCollapseCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnCollapse: () => false,
        afterColumnCollapse: afterColumnCollapseCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.collapseSection({ row: -2, col: 1 });

      $('.collapsibleIndicator').first().simulate('mousedown');
      render();

      expect($('.collapsibleIndicator')[0].className.includes('expanded')).toBe(true);
      expect(afterColumnCollapseCallback).not.toHaveBeenCalled();
    });

    it('should not trigger an afterColumnCollapse event after call toggleCollapsibleSection with `collapse` method when beforeColumnCollapse returns false', () => {
      const afterColumnCollapseCallback = jasmine.createSpy('afterColumnCollapseCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnCollapse: () => false,
        afterColumnCollapse: afterColumnCollapseCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.toggleCollapsibleSection([{ row: -2, col: 1 }], 'collapse');

      $('.collapsibleIndicator').first().simulate('mousedown');
      render();

      expect($('.collapsibleIndicator')[0].className.includes('expanded')).toBe(true);

      expect(afterColumnCollapseCallback).not.toHaveBeenCalled();
    });

    it('should not trigger an afterColumnCollapse event after call collapseAll method when beforeColumnCollapse returns false', () => {
      const afterColumnCollapseCallback = jasmine.createSpy('afterColumnCollapseCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnCollapse: () => false,
        afterColumnCollapse: afterColumnCollapseCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.collapseAll();

      $('.collapsibleIndicator').first().simulate('mousedown');
      render();

      expect($('.collapsibleIndicator')[0].className.includes('expanded')).toBe(true);

      expect(afterColumnCollapseCallback).not.toHaveBeenCalled();
    });

    it('should not trigger an afterColumnCollapse event after call toggleAllCollapsibleSections method when beforeColumnCollapse returns false', () => {
      const afterColumnCollapseCallback = jasmine.createSpy('afterColumnCollapseCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnCollapse: () => false,
        afterColumnCollapse: afterColumnCollapseCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.toggleAllCollapsibleSections('collapse');

      $('.collapsibleIndicator').first().simulate('mousedown');
      render();

      expect($('.collapsibleIndicator')[0].className.includes('expanded')).toBe(true);

      expect(afterColumnCollapseCallback).not.toHaveBeenCalled();
    });

    it('should not break table when beforeColumnCollapse returns false on a specific column', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnCollapse: (currentCollapsedColumns, destinationCollapsedColumns) => {
          if (destinationCollapsedColumns.includes(2)) {
            return false;
          }
        },
      });

      const colgroupArray = $('colgroup col');
      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);

      collapsibleColumnsPlugin.collapseSection({ row: -2, col: 1 });
      render();

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);

      collapsibleColumnsPlugin.collapseSection({ row: -1, col: 1 });
      render();

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);
    });

    xit('should maintain the collapse functionality, when the table has been scrolled', function() {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 90),
        hiddenColumns: true,
        nestedHeaders: this.generateComplexSetup(4, 70, true),
        collapsibleColumns: true,
        width: 400,
        height: 300
      });

      hot.scrollViewportTo(void 0, 37);
      hot.render();

      const button = $('.collapsibleIndicator').eq(0);
      const colgroupArray = $('colgroup col');

      button.simulate('mousedown');

      expect(parseInt(colgroupArray.eq(4).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(7).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(8).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(9).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(10).width(), 10)).toBeGreaterThan(0);
    });
  });

  describe('expand headers functionality', () => {
    it('should expand all the "child" columns of the colspanned header afte clicking the expand button', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true
      });

      const button = $('.collapsibleIndicator').first();
      const colgroupArray = $('colgroup col');
      button.simulate('mousedown');

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);

      $('.collapsibleIndicator').first().simulate('mousedown');

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);

    });

    it('should maintain the expand functionality, when the table has been scrolled', function(done) {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 90),
        hiddenColumns: true,
        nestedHeaders: this.generateComplexSetup(4, 70, true),
        collapsibleColumns: true,
        width: 400,
        height: 300
      });

      setTimeout(() => {
        hot.scrollViewportTo(void 0, 37);
        hot.render();

        let button = $('.collapsibleIndicator').eq(0);
        const colgroupArray = $('colgroup col');

        button.simulate('mousedown');
        button = $('.collapsibleIndicator').eq(0);
        button.simulate('mousedown');

        expect(parseInt(colgroupArray.eq(4).width(), 10)).toBeGreaterThan(0);
        expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
        expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);
        expect(parseInt(colgroupArray.eq(7).width(), 10)).toBeGreaterThan(0);
        expect(parseInt(colgroupArray.eq(8).width(), 10)).toBeGreaterThan(0);
        expect(parseInt(colgroupArray.eq(9).width(), 10)).toBeGreaterThan(0);
        expect(parseInt(colgroupArray.eq(10).width(), 10)).toBeGreaterThan(0);

        done();
      }, 100);

    });

    it('should add an expand/collapse button only to the appropriate headers, if the collapsibleColumns option is set to an array of objects', function() {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 90),
        hiddenColumns: true,
        nestedHeaders: this.generateComplexSetup(4, 70, true),
        collapsibleColumns: [
          { row: -4, col: 1, collapsible: true },
          { row: -3, col: 5, collapsible: true }
        ],
        width: 500,
        height: 300
      });

      const TRs = document.querySelectorAll('.handsontable THEAD TR');

      expect(TRs[0].querySelector('TH:nth-child(2) .collapsibleIndicator')).not.toEqual(null);
      expect(TRs[0].querySelector('TH:nth-child(10) .collapsibleIndicator')).toEqual(null);

      expect(TRs[1].querySelector('TH:nth-child(2) .collapsibleIndicator')).toEqual(null);
      expect(TRs[1].querySelector('TH:nth-child(6) .collapsibleIndicator')).not.toEqual(null);

    });

    it('should expand to master table width after clicking the expand button #105', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        rowHeaders: true,
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true
      });
      const masterWtHider = spec().$container.find('.ht_master .wtHider').first();
      const cloneWtHider = spec().$container.find('.ht_clone_top .wtHider').first();
      const hiderWidthBefore = cloneWtHider.width();

      let button = spec().$container.find('.collapsibleIndicator').first();

      button.simulate('mousedown');
      button.simulate('mouseup');
      button.simulate('click');

      expect(cloneWtHider.width()).toBeLessThan(hiderWidthBefore);
      expect(cloneWtHider.width()).toBe(masterWtHider.width());

      button = spec().$container.find('.collapsibleIndicator').first();

      button.simulate('mousedown');
      button.simulate('mouseup');
      button.simulate('click');

      expect(cloneWtHider.width()).toBe(hiderWidthBefore);
      expect(cloneWtHider.width()).toBe(masterWtHider.width());
    });

    it('should trigger an beforeColumnExpand and afterColumnExpand event after expanded column', () => {
      const beforeColumnExpandCallback = jasmine.createSpy('beforeColumnExpandCallback');
      const afterColumnExpandCallback = jasmine.createSpy('afterColumnExpandCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnExpand: beforeColumnExpandCallback,
        afterColumnExpand: afterColumnExpandCallback
      });

      let button = $('.collapsibleIndicator').first();
      button.simulate('mousedown');

      button = $('.collapsibleIndicator').first();
      button.simulate('mousedown');

      expect(beforeColumnExpandCallback).toHaveBeenCalledWith([3, 4], [], true, void 0, void 0, void 0);
      expect(afterColumnExpandCallback).toHaveBeenCalledWith([3, 4], [], true, true, void 0, void 0);
    });

    it('should trigger an beforeColumnExpand and afterColumnExpand event after call expandSection method', () => {
      const beforeColumnExpandCallback = jasmine.createSpy('beforeColumnExpandCallback');
      const afterColumnExpandCallback = jasmine.createSpy('afterColumnExpandCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnExpand: beforeColumnExpandCallback,
        afterColumnExpand: afterColumnExpandCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.collapseSection({ row: -2, col: 1 });

      collapsibleColumnsPlugin.expandSection({ row: -2, col: 1 });

      expect(beforeColumnExpandCallback).toHaveBeenCalledWith([3, 4], [], true, void 0, void 0, void 0);
      expect(afterColumnExpandCallback).toHaveBeenCalledWith([3, 4], [], true, true, void 0, void 0);
    });

    it('should trigger an beforeColumnExpand and afterColumnExpand event after call toggleCollapsibleSection method', () => {
      const beforeColumnExpandCallback = jasmine.createSpy('beforeColumnExpandCallback');
      const afterColumnExpandCallback = jasmine.createSpy('afterColumnExpandCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnExpand: beforeColumnExpandCallback,
        afterColumnExpand: afterColumnExpandCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.toggleCollapsibleSection([{ row: -2, col: 1 }], 'collapse');

      collapsibleColumnsPlugin.toggleCollapsibleSection([{ row: -2, col: 1 }], 'expand');

      expect(beforeColumnExpandCallback).toHaveBeenCalledWith([3, 4], [], true, void 0, void 0, void 0);
      expect(afterColumnExpandCallback).toHaveBeenCalledWith([3, 4], [], true, true, void 0, void 0);
    });

    it('should trigger an beforeColumnExpand and afterColumnExpand event after call toggleAllCollapsibleSections method', () => {
      const beforeColumnExpandCallback = jasmine.createSpy('beforeColumnExpandCallback');
      const afterColumnExpandCallback = jasmine.createSpy('afterColumnExpandCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnExpand: beforeColumnExpandCallback,
        afterColumnExpand: afterColumnExpandCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.toggleAllCollapsibleSections('collapse');

      collapsibleColumnsPlugin.toggleAllCollapsibleSections('expand');

      expect(beforeColumnExpandCallback).toHaveBeenCalledWith([3, 4, 2], [], true, void 0, void 0, void 0);
      expect(afterColumnExpandCallback).toHaveBeenCalledWith([3, 4, 2], [], true, true, void 0, void 0);
    });

    it('should trigger an beforeColumnExpand and afterColumnExpand event after call expandAll method', () => {
      const beforeColumnExpandCallback = jasmine.createSpy('beforeColumnExpandCallback');
      const afterColumnExpandCallback = jasmine.createSpy('afterColumnExpandCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnExpand: beforeColumnExpandCallback,
        afterColumnExpand: afterColumnExpandCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.collapseAll();

      collapsibleColumnsPlugin.expandAll();

      expect(beforeColumnExpandCallback).toHaveBeenCalledWith([3, 4, 2], [], true, void 0, void 0, void 0);
      expect(afterColumnExpandCallback).toHaveBeenCalledWith([3, 4, 2], [], true, true, void 0, void 0);
    });

    it('should returns in afterColumnExpand hooks `successfullyExpanded` as false after trying expanding already expanded column', () => {
      const afterColumnExpandCallback = jasmine.createSpy('afterColumnExpandCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        afterColumnExpand: afterColumnExpandCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.collapseSection({ row: -2, col: 1 });

      collapsibleColumnsPlugin.expandSection({ row: -2, col: 1 });
      collapsibleColumnsPlugin.expandSection({ row: -2, col: 1 });

      expect(afterColumnExpandCallback).toHaveBeenCalledWith([], [], true, false, void 0, void 0);
    });

    it('should returns in beforeColumnExpand and afterColumnExpand hooks `expandPossible` and `successfullyExpanded` as false when ' +
      'trying expanding columns which does not have the ability to expand', () => {
      const beforeColumnExpandCallback = jasmine.createSpy('beforeColumnExpandCallback');
      const afterColumnExpandCallback = jasmine.createSpy('afterColumnExpandCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 8 }, 'C'],
          ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
          ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
          ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
        ],
        collapsibleColumns: [
          { row: -4, col: 1, collapsible: true },
          { row: -3, col: 1, collapsible: true },
          { row: -2, col: 1, collapsible: true },
          { row: -2, col: 3, collapsible: true }
        ],
        beforeColumnExpand: beforeColumnExpandCallback,
        afterColumnExpand: afterColumnExpandCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.expandSection({ row: -1, col: 1 });

      expect(beforeColumnExpandCallback).toHaveBeenCalledWith([], [], false, void 0, void 0, void 0);
      expect(afterColumnExpandCallback).toHaveBeenCalledWith([], [], false, false, void 0, void 0);
    });

    it('should not trigger an afterColumnExpand event after try expand columns when beforeColumnExpand returns false', () => {
      const afterColumnExpandCallback = jasmine.createSpy('afterColumnExpandCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnExpand: () => false,
        afterColumnExpand: afterColumnExpandCallback
      });

      let button = $('.collapsibleIndicator').first();
      const colgroupArray = $('colgroup col');

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);

      button.simulate('mousedown');

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);

      button = $('.collapsibleIndicator').first();
      button.simulate('mousedown');
      render();

      expect(parseInt(colgroupArray.eq(0).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(1).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(2).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(3).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(4).width(), 10)).toEqual(0);
      expect(parseInt(colgroupArray.eq(5).width(), 10)).toBeGreaterThan(0);
      expect(parseInt(colgroupArray.eq(6).width(), 10)).toBeGreaterThan(0);

      expect(afterColumnExpandCallback).not.toHaveBeenCalled();
    });

    it('should not trigger an afterColumnExpand event after call expandSection method when beforeColumnExpand returns false', () => {
      const afterColumnExpandCallback = jasmine.createSpy('afterColumnExpandCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnExpand: () => false,
        afterColumnExpand: afterColumnExpandCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.collapseSection({ row: -2, col: 1 });

      collapsibleColumnsPlugin.expandSection({ row: -2, col: 1 });

      $('.collapsibleIndicator').first().simulate('mousedown');
      render();

      expect($('.collapsibleIndicator')[0].className.includes('collapsed')).toBe(true);
      expect(afterColumnExpandCallback).not.toHaveBeenCalled();
    });

    it('should not trigger an afterColumnExpand event after call toggleCollapsibleSection with `expand` method when beforeColumnExpand returns false', () => {
      const afterColumnExpandCallback = jasmine.createSpy('afterColumnExpandCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnExpand: () => false,
        afterColumnExpand: afterColumnExpandCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.toggleCollapsibleSection([{ row: -2, col: 1 }], 'collapse');

      collapsibleColumnsPlugin.toggleCollapsibleSection([{ row: -2, col: 1 }], 'expand');

      $('.collapsibleIndicator').first().simulate('mousedown');
      render();

      expect($('.collapsibleIndicator')[0].className.includes('collapsed')).toBe(true);
      expect(afterColumnExpandCallback).not.toHaveBeenCalled();
    });

    it('should not trigger an afterColumnExpand event after call toggleAllCollapsibleSections with `expand` method when beforeColumnExpand returns false', () => {
      const afterColumnExpandCallback = jasmine.createSpy('afterColumnExpandCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnExpand: () => false,
        afterColumnExpand: afterColumnExpandCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.toggleAllCollapsibleSections('collapse');

      collapsibleColumnsPlugin.toggleAllCollapsibleSections('expand');

      $('.collapsibleIndicator').first().simulate('mousedown');
      render();

      expect($('.collapsibleIndicator')[0].className.includes('collapsed')).toBe(true);
      expect(afterColumnExpandCallback).not.toHaveBeenCalled();
    });

    it('should not trigger an afterColumnExpand event after call expandAll method when beforeColumnExpand returns false', () => {
      const afterColumnExpandCallback = jasmine.createSpy('afterColumnExpandCallback');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnExpand: () => false,
        afterColumnExpand: afterColumnExpandCallback
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      collapsibleColumnsPlugin.collapseSection({ row: -2, col: 1 });

      collapsibleColumnsPlugin.expandAll();

      $('.collapsibleIndicator').first().simulate('mousedown');
      render();

      expect($('.collapsibleIndicator')[0].className.includes('collapsed')).toBe(true);
      expect(afterColumnExpandCallback).not.toHaveBeenCalled();
    });

    it('should not change buttons class name when beforeColumnExpand returns false on some column', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        hiddenColumns: true,
        nestedHeaders: [
          ['a', { label: 'd', colspan: 4 }, 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
          ['a', { label: 'b', colspan: 2 }, { label: 'c', colspan: 2 }, 'd', 'e', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
        ],
        collapsibleColumns: true,
        beforeColumnExpand: (currentCollapsedColumns) => {
          if (currentCollapsedColumns.includes(2)) {
            return false;
          }
        },
      });

      const collapsibleColumnsPlugin = getPlugin('collapsibleColumns');

      expect($('.collapsibleIndicator')[0].className.includes('expanded')).toBe(true);
      expect($('.collapsibleIndicator')[1].className.includes('expanded')).toBe(true);
      expect($('.collapsibleIndicator')[2].className.includes('expanded')).toBe(true);

      collapsibleColumnsPlugin.collapseSection({ row: -1, col: 1 });

      expect($('.collapsibleIndicator')[0].className.includes('expanded')).toBe(true);
      expect($('.collapsibleIndicator')[1].className.includes('collapsed')).toBe(true);
      expect($('.collapsibleIndicator')[2].className.includes('expanded')).toBe(true);

      collapsibleColumnsPlugin.expandSection({ row: -1, col: 1 });
      render();

      expect($('.collapsibleIndicator')[0].className.includes('expanded')).toBe(true);
      expect($('.collapsibleIndicator')[1].className.includes('collapsed')).toBe(true);
      expect($('.collapsibleIndicator')[2].className.includes('expanded')).toBe(true);
    });
  });
});
