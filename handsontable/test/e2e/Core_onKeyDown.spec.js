describe('Core_onKeyDown', () => {
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

  it('should advance to next cell when TAB is pressed', async() => {
    // https://github.com/handsontable/handsontable/issues/151
    handsontable();

    await selectCell(0, 0);
    await keyDownUp('tab');

    expect(getSelected()).toEqual([[0, 1, 0, 1]]);
  });

  it('should advance to previous cell when shift+TAB is pressed', async() => {
    handsontable();

    await selectCell(1, 1);
    await keyDownUp(['shift', 'tab']);

    expect(getSelected()).toEqual([[1, 0, 1, 0]]);
  });

  describe('while editing (quick edit mode)', () => {
    it('should finish editing and advance to next cell when TAB is pressed', async() => {
      // https://github.com/handsontable/handsontable/issues/215
      handsontable();

      await selectCell(1, 1);
      await keyDownUp('x'); // value to cell trigger quick edit mode

      keyProxy().val('Ted');

      await keyDownUp('tab');

      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[1, 2, 1, 2]]);
    });

    it('should finish editing and advance to lower cell when enter is pressed', async() => {
      // https://github.com/handsontable/handsontable/issues/215
      handsontable();

      await selectCell(1, 1);
      await keyDownUp('x'); // value to cell trigger quick edit mode

      keyProxy().val('Ted');

      await keyDownUp('enter');

      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[2, 1, 2, 1]]);
    });

    it('should finish editing and advance to higher cell when shift+enter is pressed', async() => {
      // https://github.com/handsontable/handsontable/issues/215
      handsontable();

      await selectCell(1, 1);
      await keyDownUp('x'); // trigger quick edit mode

      keyProxy().val('Ted');

      await keyDownUp(['shift', 'enter']);

      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[0, 1, 0, 1]]);
    });

    it('should finish editing and advance to lower cell when down arrow is pressed', async() => {
      handsontable();

      await selectCell(1, 1);
      await keyDownUp('x');

      keyProxy().val('Ted');

      await keyDownUp('arrowdown');

      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[2, 1, 2, 1]]);
    });

    it('should finish editing and advance to higher cell when up arrow is pressed', async() => {
      handsontable();

      await selectCell(1, 1);
      await keyDownUp('x');

      keyProxy().val('Ted');

      await keyDownUp('arrowup');

      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[0, 1, 0, 1]]);
    });

    it('should finish editing and advance to right cell when right arrow is pressed', async() => {
      handsontable();

      await selectCell(1, 1);
      await keyDownUp('x');

      keyProxy().val('Ted');

      await keyDownUp('arrowright');
      await keyDownUp('arrowright');
      await keyDownUp('arrowright');
      await keyDownUp('arrowright');

      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[1, 4, 1, 4]]);
    });

    it('should finish editing and advance to left cell when left arrow is pressed', async() => {
      handsontable();

      await selectCell(1, 1);
      await keyDownUp('x');

      keyProxy().val('Ted');
      Handsontable.dom.setCaretPosition(keyProxy()[0], 0, 0);

      await keyDownUp('arrowleft');
      await keyDownUp('arrowleft');
      await keyDownUp('arrowleft');
      await keyDownUp('arrowleft');
      await keyDownUp('arrowleft');

      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[1, 0, 1, 0]]);
    });

    it('should finish editing and advance to lower cell when enter is pressed (with sync validator)', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        validator(val, cb) {
          cb(true);
        },
        afterValidate: onAfterValidate
      });

      await selectCell(1, 1);
      await keyDownUp('x');

      keyProxy().val('Ted');

      onAfterValidate.calls.reset();

      await keyDownUp('enter');
      await sleep(50); // wait for async validator

      expect(onAfterValidate).toHaveBeenCalled();
      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[2, 1, 2, 1]]);
    });

    it('should finish editing and advance to lower cell when enter is pressed (with async validator)', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        validator(val, cb) {
          setTimeout(() => {
            cb(true);
          }, 10);
        },
        afterValidate: onAfterValidate
      });

      await selectCell(1, 1);
      await keyDownUp('x');

      keyProxy().val('Ted');

      onAfterValidate.calls.reset();

      await keyDownUp('enter');
      await sleep(50); // wait for async validator

      expect(onAfterValidate).toHaveBeenCalled();
      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[2, 1, 2, 1]]);
    });
  });

  describe('while editing (full edit mode)', () => {
    it('should finish editing and advance to next cell when TAB is pressed', async() => {
      // https://github.com/handsontable/handsontable/issues/215
      handsontable();

      await selectCell(1, 1);
      await keyDownUp('enter');

      keyProxy().val('Ted');

      await keyDownUp('tab');

      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[1, 2, 1, 2]]);
    });

    it('should finish editing and advance to lower cell when enter is pressed', async() => {
      // https://github.com/handsontable/handsontable/issues/215
      handsontable();

      await selectCell(1, 1);
      await keyDownUp('enter');

      keyProxy().val('Ted');

      await keyDownUp('enter');

      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[2, 1, 2, 1]]);
    });

    it('should finish editing and advance to higher cell when shift+enter is pressed', async() => {
      // https://github.com/handsontable/handsontable/issues/215
      handsontable();

      await selectCell(1, 1);
      await keyDownUp('enter');

      keyProxy().val('Ted');

      await keyDownUp(['shift', 'enter']);

      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[0, 1, 0, 1]]);
    });

    it('shouldn\'t finish editing and advance to lower cell when down arrow is pressed', async() => {
      handsontable();

      await selectCell(1, 1);
      await keyDownUp('enter');

      keyProxy().val('Ted');

      await keyDownUp('arrowdown');

      expect(getData()[1][1]).toEqual(null);
      expect(getSelected()).toEqual([[1, 1, 1, 1]]);
    });

    it('shouldn\'t finish editing and advance to higher cell when up arrow is pressed', async() => {
      handsontable();

      await selectCell(1, 1);
      await keyDownUp('enter');

      keyProxy().val('Ted');

      await keyDownUp('arrowup');

      expect(getData()[1][1]).toEqual(null);
      expect(getSelected()).toEqual([[1, 1, 1, 1]]);
    });

    it('shouldn\'t finish editing and advance to right cell when right arrow is pressed', async() => {
      handsontable();

      await selectCell(1, 1);
      await keyDownUp('enter');

      keyProxy().val('Ted');

      await keyDownUp('arrowright');
      await keyDownUp('arrowright');
      await keyDownUp('arrowright');
      await keyDownUp('arrowright');

      expect(getData()[1][1]).toEqual(null);
      expect(getSelected()).toEqual([[1, 1, 1, 1]]);
    });

    it('shouldn\'t finish editing and advance to left cell when left arrow is pressed', async() => {
      handsontable();

      await selectCell(1, 1);
      await keyDownUp('enter');

      keyProxy().val('Ted');

      await keyDownUp('arrowleft');
      await keyDownUp('arrowleft');
      await keyDownUp('arrowleft');
      await keyDownUp('arrowleft');

      expect(getData()[1][1]).toEqual(null);
      expect(getSelected()).toEqual([[1, 1, 1, 1]]);
    });

    it('should finish editing and advance to lower cell when enter is pressed (with sync validator)', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        validator(val, cb) {
          cb(true);
        },
        afterValidate: onAfterValidate
      });

      await selectCell(1, 1);
      await keyDownUp('enter');

      keyProxy().val('Ted');

      onAfterValidate.calls.reset();

      await keyDownUp('enter');
      await sleep(50); // wait for async validator

      expect(onAfterValidate).toHaveBeenCalled();
      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[2, 1, 2, 1]]);
    });

    it('should finish editing and advance to lower cell when enter is pressed (with async validator)', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        validator(val, cb) {
          setTimeout(() => {
            cb(true);
          }, 10);
        },
        afterValidate: onAfterValidate
      });

      await selectCell(1, 1);
      await keyDownUp('enter');

      keyProxy().val('Ted');

      onAfterValidate.calls.reset();

      await keyDownUp('enter');
      await sleep(50); // wait for async validator

      expect(onAfterValidate).toHaveBeenCalled();
      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[2, 1, 2, 1]]);
    });
  });
});
