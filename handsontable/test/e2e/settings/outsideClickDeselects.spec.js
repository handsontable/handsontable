describe('settings', () => {
  describe('outsideClickDeselects', () => {
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

    it('should not deselect the currently selected cell after clicking on a scrollbar', async() => {
      handsontable({
        outsideClickDeselects: false,
        minRows: 20,
        minCols: 2,
        width: 400,
        height: 100
      });

      await selectCell(0, 0);

      const holderBoundingBox = tableView()._wt.wtTable.holder.getBoundingClientRect();
      const verticalScrollbarCoords = {
        x: holderBoundingBox.left + holderBoundingBox.width - 3,
        y: holderBoundingBox.top + (holderBoundingBox.height / 2)
      };
      const horizontalScrollbarCoords = {
        x: holderBoundingBox.left + (holderBoundingBox.width / 2),
        y: holderBoundingBox.top + holderBoundingBox.height - 3
      };

      $(tableView()._wt.wtTable.holder).simulate('mousedown', {
        clientX: verticalScrollbarCoords.x,
        clientY: verticalScrollbarCoords.y
      });

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);

      $(tableView()._wt.wtTable.holder).simulate('mousedown', {
        clientX: horizontalScrollbarCoords.x,
        clientY: horizontalScrollbarCoords.y
      });

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    });

    it('should not deselect currently selected cell', async() => {
      handsontable({
        outsideClickDeselects: false
      });

      await selectCell(0, 0);

      $('html').simulate('mousedown');

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    });

    it('should not deselect currently selected cell (outsideClickDeselects as function)', async() => {
      handsontable({
        outsideClickDeselects: () => false
      });

      await selectCell(0, 0);

      $('html').simulate('mousedown');

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    });

    it('should deselect currently selected cell', async() => {
      handsontable({
        outsideClickDeselects: true
      });

      await selectCell(0, 0);

      $('html').simulate('mousedown');

      expect(getSelected()).toBeUndefined();
    });

    it('should deselect currently selected cell (outsideClickDeselects as function)', async() => {
      handsontable({
        outsideClickDeselects: () => true
      });

      await selectCell(0, 0);

      $('html').simulate('mousedown');

      expect(getSelected()).toBeUndefined();
    });

    it('should allow to focus on external input when outsideClickDeselects is set as true', async() => {
      const textarea = $('<input type="text">').prependTo($('body'));

      handsontable({
        outsideClickDeselects: true
      });

      await selectCell(0, 0);

      textarea.simulate('mousedown');
      textarea.focus();

      expect(document.activeElement).toBe(textarea[0]);

      await sleep(50);

      expect(document.activeElement).toBe(textarea[0]);

      textarea.remove();
    });

    it('should allow to focus on external input when outsideClickDeselects is set as true (outsideClickDeselects as function)', async() => {
      const textarea = $('<input type="text">').prependTo($('body'));

      handsontable({
        outsideClickDeselects: () => true
      });

      await selectCell(0, 0);

      textarea.simulate('mousedown');
      textarea.focus();

      expect(document.activeElement).toBe(textarea[0]);

      await sleep(50);

      expect(document.activeElement).toBe(textarea[0]);

      textarea.remove();
    });

    it('should allow to focus on external input when outsideClickDeselects is set as false', async() => {
      const textarea = $('<input type="text">').prependTo($('body'));

      handsontable({
        outsideClickDeselects: false
      });

      await selectCell(0, 0);

      textarea.simulate('mousedown');
      textarea.focus();

      expect(document.activeElement).toBe(textarea[0]);

      await sleep(50);

      expect(document.activeElement).toBe(textarea[0]);

      textarea.remove();
    });

    it('should allow to focus on external input when outsideClickDeselects is set as false (outsideClickDeselects as function)', async() => {
      const textarea = $('<input type="text">').prependTo($('body'));

      handsontable({
        outsideClickDeselects: () => false
      });

      await selectCell(0, 0);

      textarea.simulate('mousedown');
      textarea.focus();

      expect(document.activeElement).toBe(textarea[0]);

      await sleep(50);

      expect(document.activeElement).toBe(textarea[0]);

      textarea.remove();
    });

    it('should allow to type in external input while holding current selection information', async() => {
      const textarea = $('<textarea></textarea>').prependTo($('body'));
      let keyPressed;

      handsontable({
        outsideClickDeselects: false
      });

      await selectCell(0, 0);

      textarea.focus();
      textarea.simulate('mousedown');
      textarea.simulate('mouseup');

      textarea.on('keydown', (event) => {
        keyPressed = event.keyCode;
      });

      const LETTER_A_KEY = 97;

      await keyDownUp('a');

      // textarea should receive the event and be an active element
      expect(keyPressed).toEqual(LETTER_A_KEY);
      expect(document.activeElement).toBe(textarea[0]);

      // should preserve selection, close editor and save changes
      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
      expect(getDataAtCell(0, 0)).toBeNull();

      await keyDownUp('a');

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
      expect(getDataAtCell(0, 0)).toBeNull();

      textarea.remove();
    });

    it('should allow to type in external input while holding current selection information (outsideClickDeselects as function)', async() => {
      const textarea = $('<textarea></textarea>').prependTo($('body'));
      let keyPressed;

      handsontable({
        outsideClickDeselects: () => false
      });

      await selectCell(0, 0);

      textarea.focus();
      textarea.simulate('mousedown');
      textarea.simulate('mouseup');

      textarea.on('keydown', (event) => {
        keyPressed = event.keyCode;
      });

      const LETTER_A_KEY = 97;

      await keyDownUp('a');

      // textarea should receive the event and be an active element
      expect(keyPressed).toEqual(LETTER_A_KEY);
      expect(document.activeElement).toBe(textarea[0]);

      // should preserve selection, close editor and save changes
      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
      expect(getDataAtCell(0, 0)).toBeNull();

      await keyDownUp('a');

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
      expect(getDataAtCell(0, 0)).toBeNull();

      textarea.remove();
    });

    it('should allow to type in external input after opening cell editor', async() => {
      const textarea = $('<textarea></textarea>').prependTo($('body'));
      let keyPressed;

      handsontable({
        outsideClickDeselects: false
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      document.activeElement.value = 'Foo';

      textarea.focus();
      textarea.simulate('mousedown');
      textarea.simulate('mouseup');

      textarea.on('keydown', (event) => {
        keyPressed = event.keyCode;
      });

      const LETTER_A_KEY = 97;

      await keyDownUp('a');

      // textarea should receive the event and be an active element
      expect(keyPressed).toEqual(LETTER_A_KEY);
      expect(document.activeElement).toBe(textarea[0]);

      // should preserve selection, close editor and save changes
      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
      expect(getDataAtCell(0, 0)).toEqual('Foo');

      await keyDownUp('a');

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
      expect(getDataAtCell(0, 0)).toEqual('Foo');

      textarea.remove();
    });

    it('should allow to type in external input after opening cell editor (outsideClickDeselects as function)', async() => {
      const textarea = $('<textarea></textarea>').prependTo($('body'));
      let keyPressed;

      handsontable({
        outsideClickDeselects: () => false
      });

      await selectCell(0, 0);
      await keyDownUp('enter');

      document.activeElement.value = 'Foo';

      textarea.focus();
      textarea.simulate('mousedown');
      textarea.simulate('mouseup');

      textarea.on('keydown', (event) => {
        keyPressed = event.keyCode;
      });

      const LETTER_A_KEY = 97;

      await keyDownUp('a');

      // textarea should receive the event and be an active element
      expect(keyPressed).toEqual(LETTER_A_KEY);
      expect(document.activeElement).toBe(textarea[0]);

      // should preserve selection, close editor and save changes
      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
      expect(getDataAtCell(0, 0)).toEqual('Foo');

      await keyDownUp('a');

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
      expect(getDataAtCell(0, 0)).toEqual('Foo');

      textarea.remove();
    });

    it('should stop listening when focus moves programmatically to an external input (outsideClickDeselects: false)', async() => {
      const input = $('<input type="text">').prependTo($('body'));

      handsontable({
        outsideClickDeselects: false,
        data: createSpreadsheetData(5, 5),
      });

      await selectCell(0, 0);

      expect(isListening()).toBe(true);

      input[0].focus();

      expect(isListening()).toBe(false);
      expect(document.activeElement).toBe(input[0]);
      expect(getSelected()).toEqual([[0, 0, 0, 0]]);

      input.remove();
    });

    it('should not open the cell editor when typing in a programmatically focused external input (outsideClickDeselects: false)', async() => {
      const input = $('<input type="text">').prependTo($('body'));

      handsontable({
        outsideClickDeselects: false,
        data: createSpreadsheetData(5, 5),
      });

      await selectCell(0, 0);

      input[0].focus();

      await keyDownUp('a');
      await keyDownUp('b');

      expect(document.activeElement).toBe(input[0]);
      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
      expect(getDataAtCell(0, 0)).toBe('A1');

      input.remove();
    });

    it('should not open the cell editor when typing in a programmatically focused external textarea (outsideClickDeselects: false)', async() => {
      const textarea = $('<textarea></textarea>').prependTo($('body'));

      handsontable({
        outsideClickDeselects: false,
        data: createSpreadsheetData(5, 5),
      });

      await selectCell(0, 0);

      textarea[0].focus();

      await keyDownUp('a');
      await keyDownUp('b');

      expect(document.activeElement).toBe(textarea[0]);
      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
      expect(getDataAtCell(0, 0)).toBe('A1');

      textarea.remove();
    });

    it('should not open the cell editor when typing in a programmatically focused external input (outsideClickDeselects as function)', async() => {
      const input = $('<input type="text">').prependTo($('body'));

      handsontable({
        outsideClickDeselects: () => false,
        data: createSpreadsheetData(5, 5),
      });

      await selectCell(0, 0);

      input[0].focus();

      await keyDownUp('a');
      await keyDownUp('b');

      expect(document.activeElement).toBe(input[0]);
      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
      expect(getDataAtCell(0, 0)).toBe('A1');

      input.remove();
    });

    it('should resume listening when focus returns to the grid after being on an external input', async() => {
      const input = $('<input type="text">').prependTo($('body'));

      handsontable({
        outsideClickDeselects: false,
        data: createSpreadsheetData(5, 5),
      });

      await selectCell(0, 0);

      input[0].focus();

      expect(isListening()).toBe(false);

      await selectCell(1, 1);

      expect(isListening()).toBe(true);
      expect(getSelected()).toEqual([[1, 1, 1, 1]]);

      input.remove();
    });

    it('should not re-render all the rows when outsideClickDeselects is set as false and the user toggles the visibility' +
    'of the table with an outside button (dev-handsontable#1610)', async() => {
      const onAfterRenderer = jasmine.createSpy('onAfterRenderer');
      const $externalButton = $('<button>test</button>').prependTo('body');

      handsontable({
        data: createSpreadsheetData(50, 1),
        rowHeaders: true,
        colHeaders: true,
        outsideClickDeselects: false,
        width: 600,
        height: 300
      });

      $externalButton.on('click', async() => {
        spec().$container.toggle();
      });

      await selectCell(0, 0);

      $externalButton.simulate('click');

      addHook('afterRenderer', onAfterRenderer);

      $externalButton.simulate('mousedown');
      $externalButton.simulate('mouseup');

      expect(onAfterRenderer).toHaveBeenCalledTimes(0);

      $externalButton.remove();
    });
  });
});
