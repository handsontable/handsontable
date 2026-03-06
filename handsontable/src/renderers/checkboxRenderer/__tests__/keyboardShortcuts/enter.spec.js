describe('CheckboxRenderer keyboard shortcut', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer" style="width: 300px; height: 200px;"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('"Enter"', () => {
    it('should reverse checkboxes state, when multiple non-contiguous cells are selected and they share the same value', async() => {
      handsontable({
        data: [[true], [true], [true]],
        columns: [
          { type: 'checkbox' }
        ]
      });

      const afterChangeCallback = jasmine.createSpy('afterChangeCallback');

      addHook('afterChange', afterChangeCallback);

      let checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(getData()).toEqual([[true], [true], [true]]);

      await selectCells([[0, 0], [2, 0]]);

      await keyDownUp('enter');

      checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(false);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(false);
      expect(getData()).toEqual([[false], [true], [false]]);
      expect(afterChangeCallback.calls.count()).toEqual(2);
    });

    it('should be possible to change the state of the cell in the active selection layer', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
        data: [
          [true], [true], [true], [true], [true], [true],
        ],
        columns: [
          { type: 'checkbox' }
        ]
      });

      await simulateClick(getCell(1, 0));
      await keyDown('control/meta');
      await simulateClick(getCell(3, -1));
      await keyDownUp('control/meta');
      await keyDownUp(['shift', 'tab']); // select the previous selection layer

      await keyDownUp('enter');

      expect(getData()).toEqual([
        [true], [false], [true], [false], [true], [true],
      ]);
    });

    it('should not change the checkboxes state, when multiple cells are selected', async() => {
      handsontable({
        data: [[true], [true], [true]],
        columns: [
          { type: 'checkbox' }
        ]
      });

      const afterChangeCallback = jasmine.createSpy('afterChangeCallback');

      addHook('afterChange', afterChangeCallback);

      let checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(getData()).toEqual([[true], [true], [true]]);

      await selectCell(0, 0, 2, 0);
      await keyDownUp('enter');

      checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(getData()).toEqual([[true], [true], [true]]);
      expect(afterChangeCallback.calls.count()).toEqual(0);
    });

    it('should not steal the event when the column header is selected', async() => {
      handsontable({
        data: [[true], [true], [true]],
        columns: [
          { type: 'checkbox' }
        ],
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      const callback = jasmine.createSpy('callback');

      getShortcutManager().getContext('grid').addShortcuts([{
        keys: [['enter']],
        callback,
      }], { group: 'grid' });

      await selectCell(-1, 0);
      await keyDownUp('enter');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should change checkbox state from checked to unchecked', async() => {
      handsontable({
        data: [[true], [true], [true]],
        columns: [
          { type: 'checkbox' }
        ]
      });

      const afterChangeCallback = jasmine.createSpy('afterChangeCallback');

      addHook('afterChange', afterChangeCallback);

      let checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(getData()).toEqual([[true], [true], [true]]);

      await selectCell(0, 0);

      await keyDownUp('enter');

      checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(false);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(getData()).toEqual([[false], [true], [true]]);
      expect(afterChangeCallback.calls.count()).toEqual(1);
      expect(afterChangeCallback)
        .toHaveBeenCalledWith([[0, 0, true, false]], 'edit');
    });

    it('should change checkbox state from checked to unchecked for merged cell', async() => {
      handsontable({
        data: [
          [true, null, null],
          [null, null, null],
          [null, null, null],
        ],
        type: 'checkbox',
        mergeCells: [
          { row: 0, col: 0, rowspan: 3, colspan: 3 },
        ],
      });

      const afterChangeCallback = jasmine.createSpy('afterChangeCallback');

      addHook('afterChange', afterChangeCallback);

      let checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(getData()).toEqual([
        [true, null, null],
        [null, null, null],
        [null, null, null],
      ]);

      await selectCell(0, 0);
      await keyDownUp('enter');

      checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(false);
      expect(getData()).toEqual([
        [false, null, null],
        [null, null, null],
        [null, null, null],
      ]);
      expect(afterChangeCallback.calls.count()).toEqual(1);
      expect(afterChangeCallback)
        .toHaveBeenCalledWith([[0, 0, true, false]], 'edit');
    });

    it('should move down without changing checkbox state when enterBeginsEditing equals false', async() => {
      handsontable({
        enterBeginsEditing: false,
        data: [[true], [false], [true]],
        columns: [
          { type: 'checkbox' }
        ]
      });

      const afterChangeCallback = jasmine.createSpy('afterChangeCallback');

      addHook('afterChange', afterChangeCallback);

      let checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(false);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(getData()).toEqual([[true], [false], [true]]);

      await selectCell(0, 0);

      await keyDownUp('enter');

      checkboxes = spec().$container.find(':checkbox');
      const selection = getSelected();

      expect(selection).toEqual([[1, 0, 1, 0]]);
      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(false);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(getData()).toEqual([[true], [false], [true]]);
      expect(afterChangeCallback.calls.count()).toEqual(0);
    });

    it('should begin editing and changing checkbox state when enterBeginsEditing equals true', async() => {
      handsontable({
        enterBeginsEditing: true,
        data: [[true], [false], [true]],
        columns: [
          { type: 'checkbox' }
        ]
      });

      const afterChangeCallback = jasmine.createSpy('afterChangeCallback');

      addHook('afterChange', afterChangeCallback);

      let checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(false);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(getData()).toEqual([[true], [false], [true]]);

      await selectCell(0, 0);

      await keyDownUp('enter');

      checkboxes = spec().$container.find(':checkbox');
      const selection = getSelected();

      expect(selection).toEqual([[0, 0, 0, 0]]);
      expect(checkboxes.eq(0).prop('checked')).toBe(false);
      expect(checkboxes.eq(1).prop('checked')).toBe(false);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(getData()).toEqual([[false], [false], [true]]);
      expect(afterChangeCallback.calls.count()).toEqual(1);
    });

    it('should change checkbox state from checked to unchecked using custom check/uncheck templates', async() => {
      handsontable({
        data: [['yes'], ['yes'], ['no']],
        columns: [
          {
            type: 'checkbox',
            checkedTemplate: 'yes',
            uncheckedTemplate: 'no'
          }
        ]
      });

      const afterChangeCallback = jasmine.createSpy('afterChangeCallback');

      addHook('afterChange', afterChangeCallback);

      let checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(false);
      expect(getData()).toEqual([['yes'], ['yes'], ['no']]);

      await selectCell(0, 0);

      await keyDownUp('enter');

      checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(false);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(false);
      expect(getData()).toEqual([['no'], ['yes'], ['no']]);
      expect(afterChangeCallback.calls.count()).toEqual(1);
      expect(afterChangeCallback)
        .toHaveBeenCalledWith([[0, 0, 'yes', 'no']], 'edit');
    });

    it('should change checkbox state from checked to unchecked using custom check/uncheck templates in numeric format', async() => {
      handsontable({
        data: [[1], [1], [0]],
        columns: [
          {
            type: 'checkbox',
            checkedTemplate: 1,
            uncheckedTemplate: 0
          }
        ]
      });

      const afterChangeCallback = jasmine.createSpy('afterChangeCallback');

      addHook('afterChange', afterChangeCallback);

      let checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(false);
      expect(getData()).toEqual([[1], [1], [0]]);

      await selectCell(0, 0);

      await keyDownUp('enter');

      checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(false);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(false);
      expect(getData()).toEqual([[0], [1], [0]]);
      expect(afterChangeCallback.calls.count()).toEqual(1);
      expect(afterChangeCallback)
        .toHaveBeenCalledWith([[0, 0, 1, 0]], 'edit');
    });
  });
});
