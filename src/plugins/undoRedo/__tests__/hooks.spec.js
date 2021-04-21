describe('UndoRedo', () => {
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

  describe('Hooks', () => {
    it('should fire a `beforeUndo` hook after the undo process begins', (done) => {
      const beforeUndoSpy = jasmine.createSpy('beforeUndo');
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
      });
      let hookData = null;

      hot.addHook('beforeUndo', beforeUndoSpy);
      hot.addHook('beforeUndo', (data) => {
        hookData = data;
      });

      alter('remove_row', 1);

      setTimeout(() => {
        hot.undo();
      }, 10);

      setTimeout(() => {
        expect(beforeUndoSpy.calls.count()).toEqual(1);
        expect(hookData).not.toBe(null);
        expect(hookData.actionType).toEqual('remove_row');
        expect(hookData.data).toEqual([['A2', 'B2']]);
        done();
      }, 100);
    });

    it('should fire a `beforeUndoStackChange` and `afterUndoStackChange` hooks after ' +
      'performing an action which may be undone', () => {
      const beforeUndoStackChangeSpy = jasmine.createSpy('beforeUndoStackChange');
      const afterUndoStackChangeSpy = jasmine.createSpy('afterUndoStackChange');
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
      });

      hot.addHook('beforeUndoStackChange', beforeUndoStackChangeSpy);
      hot.addHook('afterUndoStackChange', afterUndoStackChangeSpy);

      alter('remove_row', 1);

      expect(beforeUndoStackChangeSpy).toHaveBeenCalled();
      expect(afterUndoStackChangeSpy).toHaveBeenCalled();
    });

    it('should not add action to undo stack while `beforeUndoStackChange` return `false` value', () => {
      const afterUndoStackChangeSpy = jasmine.createSpy('afterUndoStackChange');
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
      });

      hot.addHook('beforeUndoStackChange', () => false);
      hot.addHook('afterUndoStackChange', afterUndoStackChangeSpy);

      alter('remove_row', 1);

      expect(afterUndoStackChangeSpy).not.toHaveBeenCalled();
      expect(hot.undoRedo.isUndoAvailable()).toBe(false);
      expect(hot.undoRedo.isRedoAvailable()).toBe(false);
    });

    it('should fire a `beforeUndoStackChange`, `afterUndoStackChange`, `beforeRedoStackChange` and ' +
      '`afterRedoStackChange` hooks after undoing action', () => {
      const beforeUndoStackChangeSpy = jasmine.createSpy('beforeUndoStackChange');
      const afterUndoStackChangeSpy = jasmine.createSpy('afterUndoStackChange');
      const beforeRedoStackChangeSpy = jasmine.createSpy('beforeRedoStackChange');
      const afterRedoStackChangeSpy = jasmine.createSpy('afterRedoStackChange');
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
      });

      alter('remove_row', 1);

      hot.addHook('beforeUndoStackChange', beforeUndoStackChangeSpy);
      hot.addHook('afterUndoStackChange', afterUndoStackChangeSpy);
      hot.addHook('beforeRedoStackChange', beforeRedoStackChangeSpy);
      hot.addHook('afterRedoStackChange', afterRedoStackChangeSpy);
      hot.undo();

      expect(beforeUndoStackChangeSpy).toHaveBeenCalled();
      expect(afterUndoStackChangeSpy).toHaveBeenCalled();
      expect(beforeRedoStackChangeSpy).toHaveBeenCalled();
      expect(afterRedoStackChangeSpy).toHaveBeenCalled();
    });

    it('should fire a `beforeUndoStackChange`, `afterUndoStackChange`, `beforeRedoStackChange` and ' +
      '`afterRedoStackChange` hooks after redoing action', () => {
      const beforeUndoStackChangeSpy = jasmine.createSpy('beforeUndoStackChange');
      const afterUndoStackChangeSpy = jasmine.createSpy('afterUndoStackChange');
      const beforeRedoStackChangeSpy = jasmine.createSpy('beforeRedoStackChange');
      const afterRedoStackChangeSpy = jasmine.createSpy('afterRedoStackChange');
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
      });

      alter('remove_row', 1);

      hot.undo();

      hot.addHook('beforeUndoStackChange', beforeUndoStackChangeSpy);
      hot.addHook('afterUndoStackChange', afterUndoStackChangeSpy);
      hot.addHook('beforeRedoStackChange', beforeRedoStackChangeSpy);
      hot.addHook('afterRedoStackChange', afterRedoStackChangeSpy);
      hot.redo();

      expect(beforeUndoStackChangeSpy).toHaveBeenCalled();
      expect(afterUndoStackChangeSpy).toHaveBeenCalled();
      expect(beforeRedoStackChangeSpy).toHaveBeenCalled();
      expect(afterRedoStackChangeSpy).toHaveBeenCalled();
    });

    it('should fire a `beforeRedo` hook before the redo process begins', (done) => {
      const beforeRedoSpy = jasmine.createSpy('beforeRedo');
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
      });
      let hookData = null;

      hot.addHook('beforeRedo', beforeRedoSpy);
      hot.addHook('beforeRedo', (data) => {
        hookData = data;
      });

      alter('remove_row', 1);

      setTimeout(() => {
        hot.undo();
        hot.redo();
      }, 10);

      setTimeout(() => {
        expect(beforeRedoSpy.calls.count()).toEqual(1);
        expect(hookData).not.toBe(null);
        expect(hookData.actionType).toEqual('remove_row');
        expect(hookData.data).toEqual([['A2', 'B2']]);
        done();
      }, 100);
    });

    it('should fire a `afterRedo` hook after the redo process begins', (done) => {
      const afterRedoSpy = jasmine.createSpy('afterRedo');
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
      });
      let hookData = null;

      hot.addHook('beforeRedo', afterRedoSpy);
      hot.addHook('beforeRedo', (data) => {
        hookData = data;
      });

      alter('remove_row', 1);

      setTimeout(() => {
        hot.undo();
        hot.redo();
      }, 10);

      setTimeout(() => {
        expect(afterRedoSpy.calls.count()).toEqual(1);
        expect(hookData).not.toBe(null);
        expect(hookData.actionType).toEqual('remove_row');
        expect(hookData.data).toEqual([['A2', 'B2']]);
        done();
      }, 100);
    });
  });
});
