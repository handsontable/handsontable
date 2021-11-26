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

  it('should advance to next cell when TAB is pressed', () => {
    // https://github.com/handsontable/handsontable/issues/151
    handsontable();
    selectCell(0, 0);
    keyDownUp('tab');
    expect(getSelected()).toEqual([[0, 1, 0, 1]]);
  });

  it('should advance to previous cell when shift+TAB is pressed', () => {
    handsontable();
    selectCell(1, 1);
    keyDownUp('shift+tab');
    expect(getSelected()).toEqual([[1, 0, 1, 0]]);
  });

  describe('while editing (quick edit mode)', () => {
    it('should finish editing and advance to next cell when TAB is pressed', () => {
      // https://github.com/handsontable/handsontable/issues/215
      handsontable();
      selectCell(1, 1);

      keyDownUp('x'); // value to cell trigger quick edit mode
      keyProxy().val('Ted');
      keyDownUp('tab');
      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[1, 2, 1, 2]]);
    });

    it('should finish editing and advance to lower cell when enter is pressed', () => {
      // https://github.com/handsontable/handsontable/issues/215
      handsontable();
      selectCell(1, 1);

      keyDownUp('x'); // value to cell trigger quick edit mode
      keyProxy().val('Ted');
      keyDownUp('enter');
      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[2, 1, 2, 1]]);
    });

    it('should finish editing and advance to higher cell when shift+enter is pressed', () => {
      // https://github.com/handsontable/handsontable/issues/215
      handsontable();
      selectCell(1, 1);

      keyDownUp('x'); // trigger quick edit mode
      keyProxy().val('Ted');
      keyDownUp('shift+enter');
      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[0, 1, 0, 1]]);
    });

    it('should finish editing and advance to lower cell when down arrow is pressed', () => {
      handsontable();
      selectCell(1, 1);

      keyDownUp('x');
      keyProxy().val('Ted');
      keyDownUp('arrow_down');
      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[2, 1, 2, 1]]);
    });

    it('should finish editing and advance to higher cell when up arrow is pressed', () => {
      handsontable();
      selectCell(1, 1);

      keyDownUp('x');
      keyProxy().val('Ted');
      keyDownUp('arrow_up');
      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[0, 1, 0, 1]]);
    });

    it('should finish editing and advance to right cell when right arrow is pressed', () => {
      handsontable();
      selectCell(1, 1);

      keyDownUp('x');
      keyProxy().val('Ted');
      keyDownUp('arrow_right');
      keyDownUp('arrow_right');
      keyDownUp('arrow_right');
      keyDownUp('arrow_right');
      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[1, 4, 1, 4]]);
    });

    it('should finish editing and advance to left cell when left arrow is pressed', () => {
      handsontable();
      selectCell(1, 1);

      keyDownUp('x');
      keyProxy().val('Ted');
      Handsontable.dom.setCaretPosition(keyProxy()[0], 0, 0);
      keyDownUp('arrow_left');
      keyDownUp('arrow_left');
      keyDownUp('arrow_left');
      keyDownUp('arrow_left');
      keyDownUp('arrow_left');
      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[1, 0, 1, 0]]);
    });

    it('should finish editing and advance to lower cell when enter is pressed (with sync validator)', (done) => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        validator(val, cb) {
          cb(true);
        },
        afterValidate: onAfterValidate
      });

      selectCell(1, 1);

      keyDownUp('x');
      keyProxy().val('Ted');

      onAfterValidate.calls.reset();
      keyDownUp('enter');

      setTimeout(() => {
        expect(onAfterValidate).toHaveBeenCalled();
        expect(getData()[1][1]).toEqual('Ted');
        expect(getSelected()).toEqual([[2, 1, 2, 1]]);
        done();
      }, 200);
    });

    it('should finish editing and advance to lower cell when enter is pressed (with async validator)', (done) => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        validator(val, cb) {
          setTimeout(() => {
            cb(true);
          }, 10);
        },
        afterValidate: onAfterValidate
      });
      selectCell(1, 1);

      keyDownUp('x');
      keyProxy().val('Ted');

      onAfterValidate.calls.reset();
      keyDownUp('enter');

      setTimeout(() => {
        expect(onAfterValidate).toHaveBeenCalled();
        expect(getData()[1][1]).toEqual('Ted');
        expect(getSelected()).toEqual([[2, 1, 2, 1]]);
        done();
      }, 200);
    });
  });

  describe('while editing (full edit mode)', () => {
    it('should finish editing and advance to next cell when TAB is pressed', () => {
      // https://github.com/handsontable/handsontable/issues/215
      handsontable();
      selectCell(1, 1);

      keyDownUp('enter');
      keyProxy().val('Ted');
      keyDownUp('tab');
      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[1, 2, 1, 2]]);
    });

    it('should finish editing and advance to lower cell when enter is pressed', () => {
      // https://github.com/handsontable/handsontable/issues/215
      handsontable();
      selectCell(1, 1);

      keyDownUp('enter');
      keyProxy().val('Ted');
      keyDownUp('enter');
      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[2, 1, 2, 1]]);
    });

    it('should finish editing and advance to higher cell when shift+enter is pressed', () => {
      // https://github.com/handsontable/handsontable/issues/215
      handsontable();
      selectCell(1, 1);

      keyDownUp('enter');
      keyProxy().val('Ted');
      keyDownUp('shift+enter');
      expect(getData()[1][1]).toEqual('Ted');
      expect(getSelected()).toEqual([[0, 1, 0, 1]]);
    });

    it('shouldn\'t finish editing and advance to lower cell when down arrow is pressed', () => {
      handsontable();
      selectCell(1, 1);

      keyDownUp('enter');
      keyProxy().val('Ted');
      keyDownUp('arrow_down');
      expect(getData()[1][1]).toEqual(null);
      expect(getSelected()).toEqual([[1, 1, 1, 1]]);
    });

    it('shouldn\'t finish editing and advance to higher cell when up arrow is pressed', () => {
      handsontable();
      selectCell(1, 1);

      keyDownUp('enter');
      keyProxy().val('Ted');
      keyDownUp('arrow_up');
      expect(getData()[1][1]).toEqual(null);
      expect(getSelected()).toEqual([[1, 1, 1, 1]]);
    });

    it('shouldn\'t finish editing and advance to right cell when right arrow is pressed', () => {
      handsontable();
      selectCell(1, 1);

      keyDownUp('enter');
      keyProxy().val('Ted');
      keyDownUp('arrow_right');
      keyDownUp('arrow_right');
      keyDownUp('arrow_right');
      keyDownUp('arrow_right');
      expect(getData()[1][1]).toEqual(null);
      expect(getSelected()).toEqual([[1, 1, 1, 1]]);
    });

    it('shouldn\'t finish editing and advance to left cell when left arrow is pressed', () => {
      handsontable();
      selectCell(1, 1);

      keyDownUp('enter');
      keyProxy().val('Ted');
      keyDownUp('arrow_left');
      keyDownUp('arrow_left');
      keyDownUp('arrow_left');
      keyDownUp('arrow_left');
      expect(getData()[1][1]).toEqual(null);
      expect(getSelected()).toEqual([[1, 1, 1, 1]]);
    });

    it('should finish editing and advance to lower cell when enter is pressed (with sync validator)', (done) => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        validator(val, cb) {
          cb(true);
        },
        afterValidate: onAfterValidate
      });

      selectCell(1, 1);

      keyDownUp('enter');
      keyProxy().val('Ted');

      onAfterValidate.calls.reset();
      keyDownUp('enter');

      setTimeout(() => {
        expect(onAfterValidate).toHaveBeenCalled();
        expect(getData()[1][1]).toEqual('Ted');
        expect(getSelected()).toEqual([[2, 1, 2, 1]]);
        done();
      }, 200);
    });

    it('should finish editing and advance to lower cell when enter is pressed (with async validator)', (done) => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        validator(val, cb) {
          setTimeout(() => {
            cb(true);
          }, 10);
        },
        afterValidate: onAfterValidate
      });
      selectCell(1, 1);

      keyDownUp('enter');
      keyProxy().val('Ted');

      onAfterValidate.calls.reset();
      keyDownUp('enter');

      setTimeout(() => {
        expect(onAfterValidate).toHaveBeenCalled();
        expect(getData()[1][1]).toEqual('Ted');
        expect(getSelected()).toEqual([[2, 1, 2, 1]]);
        done();
      }, 200);
    });
  });
});
