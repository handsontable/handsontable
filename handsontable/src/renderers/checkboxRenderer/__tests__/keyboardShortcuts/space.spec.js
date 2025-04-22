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

  describe('"Space"', () => {
    it('should check single box', () => {
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

      selectCell(0, 0);
      keyDownUp(' ');

      checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(false);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(getData()).toEqual([[false], [true], [true]]);
      expect(afterChangeCallback.calls.count()).toEqual(1);
      expect(afterChangeCallback)
        .toHaveBeenCalledWith([[0, 0, true, false]], 'edit');
    });

    it('should not check single box, if cell is readOnly', () => {
      handsontable({
        data: [[true], [true], [true]],
        columns: [
          { type: 'checkbox', readOnly: true }
        ]
      });

      const afterChangeCallback = jasmine.createSpy('afterChangeCallback');

      addHook('afterChange', afterChangeCallback);

      let checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(getData()).toEqual([[true], [true], [true]]);

      selectCell(0, 0);
      keyDownUp(' ');

      checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(getData()).toEqual([[true], [true], [true]]);
      expect(afterChangeCallback).not.toHaveBeenCalled();
    });

    it('should not check single box, if last column is readOnly (#3562)', () => {
      handsontable({
        data: [[true, true], [false, false], [true, true]],
        columns: [
          { type: 'checkbox' },
          { type: 'checkbox', readOnly: true }
        ]
      });

      selectCell(0, 0);
      keyDownUp(' ');
      selectCell(0, 1);
      keyDownUp(' ');
      selectCell(1, 0);
      keyDownUp(' ');
      selectCell(1, 1);
      keyDownUp(' ');

      const checkboxes = spec().$container.find(':checkbox');

      // column 0
      expect(checkboxes.eq(0).prop('checked')).toBe(false);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(checkboxes.eq(4).prop('checked')).toBe(true);

      // column 1
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(3).prop('checked')).toBe(false);
      expect(checkboxes.eq(5).prop('checked')).toBe(true);
      expect(getData()).toEqual([[false, true], [true, false], [true, true]]);
    });

    it('should not change the box state, if column header is selected', () => {
      handsontable({
        data: [[true], [true], [true]],
        columns: [
          { type: 'checkbox', readOnly: true }
        ],
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      let checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(getData()).toEqual([[true], [true], [true]]);

      selectCell(-1, 0);
      keyDownUp('space');

      checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(getData()).toEqual([[true], [true], [true]]);
    });

    it('should not steal the event when the column header is selected', () => {
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
        keys: [['space']],
        callback,
      }], { group: 'grid' });

      selectCell(-1, 0);
      keyDownUp('space');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should reverse checkboxes state, when multiple cells are selected and all of the cells share the same value', () => {
      handsontable({
        data: [[true], [true], [true]],
        columns: [
          { type: 'checkbox' }
        ]
      });

      const afterChangeCallback1 = jasmine.createSpy('afterChangeCallback');

      addHook('afterChange', afterChangeCallback1);

      let checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(getData()).toEqual([[true], [true], [true]]);

      selectCell(0, 0, 2, 0);
      keyDownUp(' ');

      checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(false);
      expect(checkboxes.eq(1).prop('checked')).toBe(false);
      expect(checkboxes.eq(2).prop('checked')).toBe(false);
      expect(getData()).toEqual([[false], [false], [false]]);
      expect(afterChangeCallback1.calls.count()).toEqual(1);
      expect(afterChangeCallback1).toHaveBeenCalledWith([
        [0, 0, true, false],
        [1, 0, true, false],
        [2, 0, true, false]
      ], 'edit');

      updateData([[false], [false], [false]]);

      const afterChangeCallback2 = jasmine.createSpy('afterChangeCallback');

      addHook('afterChange', afterChangeCallback2);

      expect(checkboxes.eq(0).prop('checked')).toBe(false);
      expect(checkboxes.eq(1).prop('checked')).toBe(false);
      expect(checkboxes.eq(2).prop('checked')).toBe(false);
      expect(getData()).toEqual([[false], [false], [false]]);

      selectCell(0, 0, 2, 0);

      keyDownUp(' ');

      checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(getData()).toEqual([[true], [true], [true]]);
      expect(afterChangeCallback2.calls.count()).toEqual(1);
      expect(afterChangeCallback2).toHaveBeenCalledWith([
        [0, 0, false, true],
        [1, 0, false, true],
        [2, 0, false, true]
      ], 'edit');
    });

    it('should make all checkboxes checked, when multiple cells are selected and they vary in value', () => {
      handsontable({
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

      selectCell(0, 0, 2, 0);
      keyDownUp(' ');

      checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(getData()).toEqual([[true], [true], [true]]);
      expect(afterChangeCallback.calls.count()).toEqual(1);
      expect(afterChangeCallback).toHaveBeenCalledWith([
        [0, 0, true, true],
        [1, 0, false, true],
        [2, 0, true, true]
      ], 'edit');
    });

    it('should reverse checkboxes state, when multiple non-contiguous cells are selected and all of the cells in the entire selection share the same value', () => {
      handsontable({
        data: [[true, true], [true, true]],
        columns: [
          { type: 'checkbox' },
          { type: 'checkbox' },
        ]
      });

      const afterChangeCallback1 = jasmine.createSpy('afterChangeCallback');

      addHook('afterChange', afterChangeCallback1);

      let checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(checkboxes.eq(3).prop('checked')).toBe(true);
      expect(getData()).toEqual([[true, true], [true, true]]);

      selectCells([[0, 0, 0, 1], [1, 0, 1, 1]]);
      keyDownUp(' ');

      checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(false);
      expect(checkboxes.eq(1).prop('checked')).toBe(false);
      expect(checkboxes.eq(2).prop('checked')).toBe(false);
      expect(checkboxes.eq(3).prop('checked')).toBe(false);
      expect(getData()).toEqual([[false, false], [false, false]]);
      expect(afterChangeCallback1.calls.count()).toEqual(2);

      updateData([[false, false], [false, false]]);

      const afterChangeCallback2 = jasmine.createSpy('afterChangeCallback');

      addHook('afterChange', afterChangeCallback2);

      checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(false);
      expect(checkboxes.eq(1).prop('checked')).toBe(false);
      expect(checkboxes.eq(2).prop('checked')).toBe(false);
      expect(checkboxes.eq(3).prop('checked')).toBe(false);
      expect(getData()).toEqual([[false, false], [false, false]]);

      selectCells([[0, 0, 0, 1], [1, 0, 1, 1]]);

      keyDownUp(' ');

      checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(checkboxes.eq(3).prop('checked')).toBe(true);
      expect(getData()).toEqual([[true, true], [true, true]]);
      expect(afterChangeCallback2.calls.count()).toEqual(2);
    });

    it('should check all the checkboxes in the entire selection, when multiple non-contiguous cells are selected and they vary in value', () => {
      handsontable({
        data: [[true, true], [true, false]],
        columns: [
          { type: 'checkbox' },
          { type: 'checkbox' },
        ]
      });

      const afterChangeCallback1 = jasmine.createSpy('afterChangeCallback');

      addHook('afterChange', afterChangeCallback1);

      let checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(checkboxes.eq(3).prop('checked')).toBe(false);
      expect(getData()).toEqual([[true, true], [true, false]]);

      selectCells([[0, 0, 0, 1], [1, 0, 1, 1]]);
      keyDownUp(' ');

      checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(checkboxes.eq(3).prop('checked')).toBe(true);
      expect(getData()).toEqual([[true, true], [true, true]]);
      expect(afterChangeCallback1.calls.count()).toEqual(2);
    });

    it('should reverse checkboxes state, when multiple cells are selected and selStart > selEnd + all the selected checkboxes have the same value', () => {
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

      selectCell(2, 0, 0, 0); // selStart = [2,0], selEnd = [0,0]
      keyDownUp(' ');

      checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(false);
      expect(checkboxes.eq(1).prop('checked')).toBe(false);
      expect(checkboxes.eq(2).prop('checked')).toBe(false);
      expect(getData()).toEqual([[false], [false], [false]]);
      expect(afterChangeCallback.calls.count()).toEqual(1);
      expect(afterChangeCallback).toHaveBeenCalledWith([
        [0, 0, true, false],
        [1, 0, true, false],
        [2, 0, true, false]
      ], 'edit');
    });

    it('should check all of the checkboxes in the selection, when multiple cells are selected and selStart > selEnd + the selected checkboxes differ in values', () => {
      handsontable({
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

      selectCell(2, 0, 0, 0); // selStart = [2,0], selEnd = [0,0]
      keyDownUp(' ');

      checkboxes = spec().$container.find(':checkbox');

      expect(checkboxes.eq(0).prop('checked')).toBe(true);
      expect(checkboxes.eq(1).prop('checked')).toBe(true);
      expect(checkboxes.eq(2).prop('checked')).toBe(true);
      expect(getData()).toEqual([[true], [true], [true]]);
      expect(afterChangeCallback.calls.count()).toEqual(1);
      expect(afterChangeCallback).toHaveBeenCalledWith([
        [0, 0, true, true],
        [1, 0, false, true],
        [2, 0, true, true]
      ], 'edit');
    });
  });
});
