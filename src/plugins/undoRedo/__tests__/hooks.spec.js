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
    it('should fire a `beforeUndo` hook after the undo process begins', async() => {
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

      await sleep(10);

      hot.undo();

      await sleep(100);

      expect(beforeUndoSpy.calls.count()).toEqual(1);
      expect(hookData).not.toBe(null);
      expect(hookData.actionType).toEqual('remove_row');
      expect(hookData.data).toEqual([['A2', 'B2']]);
    });

    it('should fire a `beforeUndoStackChange` and `afterUndoStackChange` hooks after ' +
      'performing an action which may be undone', () => {
      const beforeUndoStackChangeSpy = jasmine.createSpy('beforeUndoStackChange');
      const afterUndoStackChangeSpy = jasmine.createSpy('afterUndoStackChange');
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
      });
      let hookBeforeArg1;
      let hookBeforeArg2;
      let hookAfterArg1;
      let hookAfterArg2;

      hot.addHook('beforeUndoStackChange', beforeUndoStackChangeSpy);
      hot.addHook('afterUndoStackChange', afterUndoStackChangeSpy);
      hot.addHook('beforeUndoStackChange', (doneActions, source) => {
        hookBeforeArg1 = doneActions.slice();
        hookBeforeArg2 = source;
      });
      hot.addHook('afterUndoStackChange', (doneActionsBefore, doneActionsAfter) => {
        hookAfterArg1 = doneActionsBefore.slice();
        hookAfterArg2 = doneActionsAfter.slice();
      });

      alter('remove_row', 1);

      expect(hookBeforeArg1).toEqual([]);
      expect(hookBeforeArg2).toEqual(void 0);
      expect(hookAfterArg1).toEqual([]);
      expect(hookAfterArg2).toEqual(getPlugin('undoRedo').doneActions);
      expect(beforeUndoStackChangeSpy.calls.count()).toEqual(1);
      expect(afterUndoStackChangeSpy.calls.count()).toEqual(1);
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
      let hookUndoBeforeArg1;
      let hookUndoBeforeArg2;
      let hookUndoAfterArg1;
      let hookUndoAfterArg2;
      let hookRedoBeforeArg1;
      let hookRedoAfterArg1;
      let hookRedoAfterArg2;

      alter('remove_row', 1);

      hot.addHook('beforeUndoStackChange', beforeUndoStackChangeSpy);
      hot.addHook('afterUndoStackChange', afterUndoStackChangeSpy);
      hot.addHook('beforeRedoStackChange', beforeRedoStackChangeSpy);
      hot.addHook('afterRedoStackChange', afterRedoStackChangeSpy);
      hot.addHook('beforeUndoStackChange', (doneActions, source) => {
        hookUndoBeforeArg1 = doneActions.slice();
        hookUndoBeforeArg2 = source;
      });
      hot.addHook('afterUndoStackChange', (doneActionsBefore, doneActionsAfter) => {
        hookUndoAfterArg1 = doneActionsBefore.slice();
        hookUndoAfterArg2 = doneActionsAfter.slice();
      });
      hot.addHook('beforeRedoStackChange', (undoneActions) => {
        hookRedoBeforeArg1 = undoneActions.slice();
      });
      hot.addHook('afterRedoStackChange', (undoneActionsBefore, undoneActionsAfter) => {
        hookRedoAfterArg1 = undoneActionsBefore.slice();
        hookRedoAfterArg2 = undoneActionsAfter.slice();
      });

      const doneActionsCopy = getPlugin('undoRedo').doneActions.slice();

      hot.undo();

      expect(hookUndoBeforeArg1).toEqual(doneActionsCopy);
      expect(hookUndoBeforeArg2).toEqual(void 0);
      expect(hookUndoAfterArg1).toEqual(doneActionsCopy);
      expect(hookUndoAfterArg2).toEqual([]);

      expect(hookRedoBeforeArg1).toEqual([]);
      expect(hookRedoAfterArg1).toEqual([]);
      expect(hookRedoAfterArg2).toEqual(doneActionsCopy);

      expect(beforeUndoStackChangeSpy.calls.count()).toEqual(1);
      expect(afterUndoStackChangeSpy.calls.count()).toEqual(1);
      expect(beforeRedoStackChangeSpy.calls.count()).toEqual(1);
      expect(afterRedoStackChangeSpy.calls.count()).toEqual(1);
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
      let hookUndoBeforeArg1;
      let hookUndoBeforeArg2;
      let hookUndoAfterArg1;
      let hookUndoAfterArg2;
      let hookRedoBeforeArg1;
      let hookRedoAfterArg1;
      let hookRedoAfterArg2;

      alter('remove_row', 1);

      hot.undo();

      hot.addHook('beforeUndoStackChange', beforeUndoStackChangeSpy);
      hot.addHook('afterUndoStackChange', afterUndoStackChangeSpy);
      hot.addHook('beforeRedoStackChange', beforeRedoStackChangeSpy);
      hot.addHook('afterRedoStackChange', afterRedoStackChangeSpy);
      hot.addHook('beforeUndoStackChange', (doneActions, source) => {
        hookUndoBeforeArg1 = doneActions.slice();
        hookUndoBeforeArg2 = source;
      });
      hot.addHook('afterUndoStackChange', (doneActionsBefore, doneActionsAfter) => {
        hookUndoAfterArg1 = doneActionsBefore.slice();
        hookUndoAfterArg2 = doneActionsAfter.slice();
      });
      hot.addHook('beforeRedoStackChange', (undoneActions) => {
        hookRedoBeforeArg1 = undoneActions.slice();
      });
      hot.addHook('afterRedoStackChange', (undoneActionsBefore, undoneActionsAfter) => {
        hookRedoAfterArg1 = undoneActionsBefore.slice();
        hookRedoAfterArg2 = undoneActionsAfter.slice();
      });

      const undoneActionsCopy = getPlugin('undoRedo').undoneActions.slice();

      hot.redo();

      expect(hookUndoBeforeArg1).toEqual([]);
      expect(hookUndoBeforeArg2).toEqual(void 0);
      expect(hookUndoAfterArg1).toEqual([]);
      expect(hookUndoAfterArg2).toEqual(undoneActionsCopy);

      expect(hookRedoBeforeArg1).toEqual(undoneActionsCopy);
      expect(hookRedoAfterArg1).toEqual(undoneActionsCopy);
      expect(hookRedoAfterArg2).toEqual([]);

      expect(beforeUndoStackChangeSpy.calls.count()).toEqual(1);
      expect(afterUndoStackChangeSpy.calls.count()).toEqual(1);
      expect(beforeRedoStackChangeSpy.calls.count()).toEqual(1);
      expect(afterRedoStackChangeSpy.calls.count()).toEqual(1);
    });

    it('should fire a `beforeRedo` hook before the redo process begins', async() => {
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

      await sleep(10);

      hot.undo();
      hot.redo();

      await sleep(100);

      expect(beforeRedoSpy.calls.count()).toEqual(1);
      expect(hookData).not.toBe(null);
      expect(hookData.actionType).toEqual('remove_row');
      expect(hookData.data).toEqual([['A2', 'B2']]);
    });

    it('should fire a `afterRedo` hook after the redo process begins', async() => {
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

      await sleep(10);

      hot.undo();
      hot.redo();

      await sleep(100);

      expect(afterRedoSpy.calls.count()).toEqual(1);
      expect(hookData).not.toBe(null);
      expect(hookData.actionType).toEqual('remove_row');
      expect(hookData.data).toEqual([['A2', 'B2']]);
    });
  });
});
