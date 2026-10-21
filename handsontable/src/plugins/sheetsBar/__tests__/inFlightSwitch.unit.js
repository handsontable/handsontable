import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { SheetsBar } from '../sheetsBar';
import { SheetsBarMenus } from '../ui/menus';
import { HiddenRows } from '../../hiddenRows/hiddenRows';
import { Comments } from '../../comments/comments';
import { Dialog } from '../../dialog/dialog';

/**
 * Lets queued microtasks run, so core's validator queue reaches a validator that answers later.
 *
 * @returns {Promise<void>}
 */
async function flushMicrotasks() {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve();
  }
}

describe('SheetsBar switch with work still in flight', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(SheetsBar);
    registerPlugin(HiddenRows);
    registerPlugin(Comments);
    registerPlugin(Dialog);
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: () => {} });
  });

  afterAll(() => {
    delete Element.prototype.scrollIntoView;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (hot && !hot.isDestroyed) {
      hot.destroy();
    }

    hot = null;
    container.remove();
    jest.restoreAllMocks();
  });

  describe('a switch that threw before the arriving data loaded', () => {
    const buildWorkbook = () => {
      const sheets = [
        { name: 'Alpha', data: [['a']] },
        { name: 'Beta', data: [['b']], settings: { colWidths: 120 } },
        { name: 'Gamma', data: [['g']] },
      ];

      hot = new Handsontable(container, {
        sheetsBar: { sheets },
        licenseKey: 'non-commercial-and-evaluation',
      });

      let fail = true;

      hot.addHook('afterUpdateSettings', () => {
        if (fail) {
          fail = false;
          throw new Error('listener failed');
        }
      });

      return sheets;
    };

    it('keeps the sheet whose rows the grid holds as the departing sheet', () => {
      const sheets = buildWorkbook();
      const plugin = hot.getPlugin('sheetsBar');

      expect(() => plugin.setActiveSheet('Beta')).toThrow('listener failed');
      expect(plugin.setActiveSheet('Gamma')).toBe(true);
      expect(plugin.setActiveSheet('Beta')).toBe(true);
      expect(hot.getDataAtCell(0, 0)).toBe('b');

      hot.setDataAtCell(0, 0, 'beta edit');

      expect(sheets[0].data).toEqual([['a']]);
      expect(sheets[1].data).toEqual([['beta edit']]);
    });

    it('lets the same switch be retried', () => {
      buildWorkbook();
      const plugin = hot.getPlugin('sheetsBar');

      expect(() => plugin.setActiveSheet('Beta')).toThrow('listener failed');
      expect(plugin.setActiveSheet('Beta')).toBe(true);
      expect(hot.getDataAtCell(0, 0)).toBe('b');
    });
  });

  describe('a listener that destroys the grid', () => {
    it.each([
      'beforeSheetTabChange',
      'afterSheetTabStateCapture',
    ])('stops the switch when %s destroys the grid', (hookName) => {
      const afterChange = jasmine.createSpy('afterSheetTabChange');

      hot = new Handsontable(container, {
        sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
        [hookName]: () => hot.destroy(),
        afterSheetTabChange: afterChange,
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('sheetsBar');
      let result;

      expect(() => {
        result = plugin.setActiveSheet('B');
      }).not.toThrow();
      expect(result).toBe(false);
      expect(hot.isDestroyed).toBe(true);
      expect(afterChange).not.toHaveBeenCalled();
    });
  });

  describe('a workbook change made from beforeSheetTabChange', () => {
    it('refuses a nested switch and keeps the departing sheet\'s selection', () => {
      let nested = null;

      hot = new Handsontable(container, {
        sheetsBar: {
          sheets: [
            { name: 'A', data: [['a1'], ['a2']] },
            { name: 'B', data: [['b1'], ['b2']] },
            { name: 'C', data: [['c1'], ['c2']] },
          ],
        },
        beforeSheetTabChange: (from, to) => {
          if (nested === null && to === 2) {
            nested = hot.getPlugin('sheetsBar').setActiveSheet('C');
          }
        },
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('sheetsBar');

      hot.selectCell(1, 0);

      expect(plugin.setActiveSheet('B')).toBe(true);
      expect(nested).toBe(false);
      expect(hot.getDataAtCell(0, 0)).toBe('b1');
      expect(plugin.setActiveSheet('A')).toBe(true);
      expect(hot.getSelectedLast()).toEqual([1, 0, 1, 0]);
    });

    it('refuses to remove the arriving sheet', () => {
      let removed = null;

      hot = new Handsontable(container, {
        sheetsBar: {
          sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }, { name: 'C', data: [['c']] }],
        },
        beforeSheetTabChange: (from, to) => {
          if (removed === null) {
            removed = hot.getPlugin('sheetsBar').removeSheet(to);
          }
        },
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('sheetsBar');
      let switched;

      expect(() => {
        switched = plugin.setActiveSheet('B');
      }).not.toThrow();
      expect(removed).toBe(false);
      expect(switched).toBe(true);
      expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['A', 'B', 'C']);
      expect(hot.getDataAtCell(0, 0)).toBe('b');
    });
  });

  describe('a change still waiting for its validator', () => {
    it('refuses a switch until the validator answers, and the change lands on its own sheet', async() => {
      const answers = [];
      const sheets = [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }];

      hot = new Handsontable(container, {
        sheetsBar: { sheets },
        validator: (value, callback) => answers.push(callback),
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('sheetsBar');

      hot.setDataAtCell(0, 0, 'typed');

      expect(plugin.setActiveSheet('Beta')).toBe(false);

      await flushMicrotasks();

      expect(plugin.setActiveSheet('Beta')).toBe(false);
      expect(answers.length).toBe(1);

      answers[0](true);

      expect(plugin.setActiveSheet('Beta')).toBe(true);
      expect(sheets[0].data).toEqual([['typed']]);
      expect(sheets[1].data).toEqual([['b']]);
    });

    it.each([
      ['throws', () => {
        throw new Error('validator failed');
      }],
      ['answers with a non-boolean', (value, callback) => callback('yes')],
    ])('lets the sheet switch again after a validator that %s', async(label, validator) => {
      const thrown = [];

      jest.spyOn(window, 'queueMicrotask').mockImplementation(callback => Promise.resolve().then(() => {
        try {
          callback();
        } catch (error) {
          thrown.push(error.message);
        }
      }));

      hot = new Handsontable(container, {
        sheetsBar: { sheets: [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }] },
        validator,
        licenseKey: 'non-commercial-and-evaluation',
      });

      hot.setDataAtCell(0, 0, 'typed');
      await flushMicrotasks();

      expect(thrown.length).toBe(1);
      expect(hot.getPlugin('sheetsBar').setActiveSheet('Beta')).toBe(true);
    });

    it('refuses a switch while the editor\'s own save waits for its validator', async() => {
      const answers = [];
      const sheets = [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }];

      hot = new Handsontable(container, {
        sheetsBar: { sheets },
        validator: (value, callback) => answers.push(callback),
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('sheetsBar');

      hot.selectCell(0, 0);
      hot.getActiveEditor().beginEditing();
      hot.getActiveEditor().setValue('typed');
      hot.getActiveEditor().finishEditing();
      await flushMicrotasks();

      expect(hot.getActiveEditor().isWaiting()).toBe(true);
      expect(plugin.setActiveSheet('Beta')).toBe(false);

      answers.splice(0).forEach(answer => answer(true));

      expect(plugin.setActiveSheet('Beta')).toBe(true);
      expect(sheets[0].data).toEqual([['typed']]);
    });
  });

  describe('a switch refused while a value waits for its validator', () => {
    const buildWaiting = () => {
      const answers = [];

      hot = new Handsontable(container, {
        sheetsBar: { sheets: [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }] },
        validator: (value, callback) => answers.push(callback),
        licenseKey: 'non-commercial-and-evaluation',
      });

      hot.setDataAtCell(0, 0, 'typed');

      return answers;
    };

    it('does not add a sheet from the add button', () => {
      buildWaiting();

      hot.rootWrapperElement.querySelector('.ht-sheets-bar__add')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(hot.getPlugin('sheetsBar').getSheets().map(sheet => sheet.name)).toEqual(['Alpha', 'Beta']);
    });

    it('does not open the tab menu of a sheet it did not switch to', () => {
      buildWaiting();

      const opened = jest.spyOn(SheetsBarMenus.prototype, 'openTabMenu').mockImplementation(() => {});
      const betaId = hot.getPlugin('sheetsBar').getSheets()[1].id;

      hot.rootWrapperElement
        .querySelector(`[data-sheet-id="${betaId}"]`)
        .dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 }));

      expect(hot.getPlugin('sheetsBar').getSheets()[0].isActive).toBe(true);
      expect(opened).not.toHaveBeenCalled();
    });

    it('switches when the same `activeSheet` value is sent again after the validator answered', async() => {
      const sheets = [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }];
      const answers = [];

      jest.spyOn(console, 'warn').mockImplementation(() => {});

      hot = new Handsontable(container, {
        sheetsBar: { sheets, activeSheet: 0 },
        validator: (value, callback) => answers.push(callback),
        licenseKey: 'non-commercial-and-evaluation',
      });

      hot.setDataAtCell(0, 0, 'typed');
      hot.updateSettings({ sheetsBar: { sheets, activeSheet: 1 } });

      expect(hot.getPlugin('sheetsBar').getSheets()[0].isActive).toBe(true);

      await flushMicrotasks();
      answers.splice(0).forEach(answer => answer(true));
      hot.updateSettings({ sheetsBar: { sheets, activeSheet: 1 } });

      expect(hot.getPlugin('sheetsBar').getSheets()[1].isActive).toBe(true);
    });
  });

  describe('a switch that threw', () => {
    it('shows the departing sheet again, with its view state, when it threw before the arriving data loaded', () => {
      const sheets = [
        { name: 'Alpha', data: [['a1'], ['a2'], ['a3']] },
        { name: 'Beta', data: [['b1'], ['b2'], ['b3']] },
        { name: 'Gamma', data: [['g1']] },
      ];
      let fail = false;

      hot = new Handsontable(container, {
        hiddenRows: true,
        sheetsBar: { sheets },
        afterUpdateSettings: () => {
          if (fail) {
            fail = false;
            throw new Error('listener failed');
          }
        },
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('sheetsBar');

      hot.getPlugin('hiddenRows').hideRow(1);
      fail = true;

      expect(() => plugin.setActiveSheet('Beta')).toThrow('listener failed');
      expect(hot.getPlugin('hiddenRows').isHidden(1)).toBe(true);

      expect(plugin.setActiveSheet('Gamma')).toBe(true);
      expect(plugin.setActiveSheet('Alpha')).toBe(true);
      expect(hot.getPlugin('hiddenRows').isHidden(1)).toBe(true);
    });

    it('keeps the arriving sheet when it threw after the arriving data loaded', () => {
      const sheets = [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }];
      let fail = false;

      hot = new Handsontable(container, {
        sheetsBar: { sheets },
        licenseKey: 'non-commercial-and-evaluation',
      });

      hot.addHook('afterLoadData', () => {
        if (fail) {
          fail = false;
          throw new Error('listener failed');
        }
      });

      const plugin = hot.getPlugin('sheetsBar');

      fail = true;

      expect(() => plugin.setActiveSheet('Beta')).toThrow('listener failed');
      expect(plugin.getSheets()[1].isActive).toBe(true);

      hot.setDataAtCell(0, 0, 'beta edit');

      expect(plugin.setActiveSheet('Alpha')).toBe(true);
      expect(sheets[0].data).toEqual([['a']]);
      expect(sheets[1].data).toEqual([['beta edit']]);
    });
  });

  describe('a workbook change made from afterSheetTabStateCapture', () => {
    it('refuses a nested switch and a remove of the arriving sheet', () => {
      const results = [];

      hot = new Handsontable(container, {
        sheetsBar: {
          sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }, { name: 'C', data: [['c']] }],
        },
        afterSheetTabStateCapture: () => {
          if (results.length === 0) {
            const plugin = hot.getPlugin('sheetsBar');

            results.push(plugin.setActiveSheet('C'), plugin.removeSheet(plugin.getSheets()[1].id));
          }
        },
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('sheetsBar');
      let switched;

      expect(() => {
        switched = plugin.setActiveSheet('B');
      }).not.toThrow();
      expect(results).toEqual([false, false]);
      expect(switched).toBe(true);
      expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['A', 'B', 'C']);
      expect(hot.getDataAtCell(0, 0)).toBe('b');
    });
  });

  describe('a workbook change made from afterSheetTabStateRestore', () => {
    it('refuses to remove the departing sheet', () => {
      const changes = [];
      let removed = null;

      hot = new Handsontable(container, {
        sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
        afterSheetTabChange: (from, to) => changes.push([from, to]),
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('sheetsBar');
      const [a, b] = plugin.getSheets().map(sheet => sheet.id);

      plugin.setActiveSheet('B');
      hot.addHook('afterSheetTabStateRestore', () => {
        if (removed === null) {
          removed = plugin.removeSheet(b);
        }
      });

      expect(plugin.setActiveSheet('A')).toBe(true);
      expect(removed).toBe(false);
      expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['A', 'B']);
      expect(changes).toEqual([[a, b], [b, a]]);
    });
  });

  describe('removing the active sheet when a listener switches back to it', () => {
    it('keeps the sheet', () => {
      let switchBack = true;

      hot = new Handsontable(container, {
        sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
        afterSheetTabChange: (from) => {
          if (switchBack) {
            switchBack = false;
            hot.getPlugin('sheetsBar').setActiveSheet(from);
          }
        },
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('sheetsBar');

      expect(plugin.removeSheet(plugin.getSheets()[0].id)).toBe(false);
      expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['A', 'B']);
      expect(hot.getDataAtCell(0, 0)).toBe('a');
    });
  });

  describe('an open dialog', () => {
    it('keeps the selection a dialog opened during the switch stashed', () => {
      hot = new Handsontable(container, {
        dialog: true,
        sheetsBar: { sheets: [{ name: 'A', data: [['a1', 'a2']] }, { name: 'B', data: [['b1', 'b2']] }] },
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('sheetsBar');

      plugin.setActiveSheet('B');
      hot.selectCell(0, 1);
      plugin.setActiveSheet('A');
      hot.addHook('afterSheetTabStateRestore', () => hot.getPlugin('dialog').show({ content: 'Loading' }));
      plugin.setActiveSheet('B');
      hot.getPlugin('dialog').hide();

      expect(hot.getSelectedLast()).toEqual([0, 1, 0, 1]);
    });
  });

  describe('a comment editor the API opened', () => {
    it('writes no comment when it was neither focused nor changed', () => {
      hot = new Handsontable(container, {
        comments: true,
        sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('sheetsBar');

      hot.getPlugin('comments').showAtCell(0, 0);
      plugin.setActiveSheet('B');
      plugin.setActiveSheet('A');

      expect(hot.getCellMeta(0, 0).comment).toBeUndefined();
    });

    it('does not write its text into the cell the API set a comment on', () => {
      hot = new Handsontable(container, {
        comments: true,
        sheetsBar: { sheets: [{ name: 'A', data: [['a1', 'a2']] }, { name: 'B', data: [['b1', 'b2']] }] },
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('sheetsBar');

      hot.getPlugin('comments').showAtCell(0, 0);
      hot.getPlugin('comments').setCommentAtCell(0, 1, 'x');
      plugin.setActiveSheet('B');
      plugin.setActiveSheet('A');

      expect(hot.getPlugin('comments').getCommentAtCell(0, 1)).toBe('x');
      expect(hot.getPlugin('comments').getCommentAtCell(0, 0)).toBeUndefined();
    });
  });

  describe('a change a listener of the switch starts', () => {
    it.each([
      'beforeSheetTabChange',
      'afterSheetTabStateCapture',
    ])('refuses the switch while a validated change made from %s waits for its validator', async(hookName) => {
      const answers = [];
      const sheets = [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }];
      let stamp = true;

      hot = new Handsontable(container, {
        sheetsBar: { sheets },
        validator: (value, callback) => answers.push(callback),
        [hookName]: () => {
          if (stamp) {
            stamp = false;
            hot.setDataAtCell(0, 0, 'left');
          }
        },
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('sheetsBar');

      expect(plugin.setActiveSheet('Beta')).toBe(false);

      await flushMicrotasks();
      answers.splice(0).forEach(answer => answer(true));

      expect(sheets[0].data).toEqual([['left']]);
      expect(sheets[1].data).toEqual([['b']]);
      expect(plugin.setActiveSheet('Beta')).toBe(true);
    });
  });

  describe('a switch asked for from a before-hook listener', () => {
    it('leaves the cell editor open', () => {
      let editorOpenAfterNestedCall = null;

      hot = new Handsontable(container, {
        sheetsBar: {
          sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }, { name: 'C', data: [['c']] }],
        },
        beforeSheetTabChange: () => {
          if (editorOpenAfterNestedCall === null) {
            hot.selectCell(0, 0);
            hot.getActiveEditor().beginEditing();
            hot.getPlugin('sheetsBar').setActiveSheet('C');
            editorOpenAfterNestedCall = hot.getActiveEditor().isOpened();
          }
        },
        licenseKey: 'non-commercial-and-evaluation',
      });

      hot.getPlugin('sheetsBar').setActiveSheet('B');

      expect(editorOpenAfterNestedCall).toBe(true);
    });
  });

  describe('a switch made while saving the editor', () => {
    it('reports the sheet that is shown after the save as the departing sheet', () => {
      const changes = [];
      let jump = true;
      const sheets = [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }, { name: 'C', data: [['c']] }];

      hot = new Handsontable(container, {
        sheetsBar: { sheets },
        afterChange: (rows, source) => {
          if (jump && source === 'edit') {
            jump = false;
            hot.getPlugin('sheetsBar').setActiveSheet('C');
          }
        },
        beforeSheetTabChange: (from, to) => changes.push([from, to]),
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('sheetsBar');
      const [a, b, c] = plugin.getSheets().map(sheet => sheet.id);

      hot.selectCell(0, 0);
      hot.getActiveEditor().beginEditing();
      hot.getActiveEditor().setValue('typed');

      expect(plugin.setActiveSheet('B')).toBe(true);
      expect(changes).toEqual([[a, c], [c, b]]);
      expect(sheets[0].data).toEqual([['typed']]);
      expect(sheets[2].data).toEqual([['c']]);
    });
  });

  describe('the activeSheet setting', () => {
    it('does not ask a canceling listener again when a wrapper sends the same value again', () => {
      const sheets = [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }];
      const listener = jest.fn(() => false);

      hot = new Handsontable(container, {
        sheetsBar: { sheets, activeSheet: 0 },
        beforeSheetTabChange: listener,
        licenseKey: 'non-commercial-and-evaluation',
      });

      hot.updateSettings({ sheetsBar: { sheets, activeSheet: 1 } });
      hot.selectCell(0, 0);
      hot.getActiveEditor().beginEditing();
      hot.updateSettings({ sheetsBar: { sheets, activeSheet: 1 } });
      hot.updateSettings({ sheetsBar: { sheets, activeSheet: 1 } });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(hot.getActiveEditor().isOpened()).toBe(true);
    });

    it('warns when the switch is refused while a value waits for its validator', () => {
      const sheets = [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }];
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      hot = new Handsontable(container, {
        sheetsBar: { sheets, activeSheet: 0 },
        validator: () => {},
        licenseKey: 'non-commercial-and-evaluation',
      });

      hot.setDataAtCell(0, 0, 'typed');
      hot.updateSettings({ sheetsBar: { sheets, activeSheet: 1 } });

      expect(hot.getPlugin('sheetsBar').getSheets()[0].isActive).toBe(true);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('`activeSheet` setting was not applied'));
    });
  });

  describe('the activeSheet setting refused by a change a listener starts', () => {
    it('warns, and switches when the same value is sent again after the validator answered', async() => {
      const sheets = [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }];
      const answers = [];
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      let stamp = true;

      hot = new Handsontable(container, {
        sheetsBar: { sheets, activeSheet: 0 },
        validator: (value, callback) => answers.push(callback),
        beforeSheetTabChange: () => {
          if (stamp) {
            stamp = false;
            hot.setDataAtCell(0, 0, 'left');
          }
        },
        licenseKey: 'non-commercial-and-evaluation',
      });

      hot.updateSettings({ sheetsBar: { sheets, activeSheet: 1 } });

      expect(hot.getPlugin('sheetsBar').getSheets()[0].isActive).toBe(true);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('`activeSheet` setting was not applied'));

      await flushMicrotasks();
      answers.splice(0).forEach(answer => answer(true));
      hot.updateSettings({ sheetsBar: { sheets, activeSheet: 1 } });

      expect(hot.getPlugin('sheetsBar').getSheets()[1].isActive).toBe(true);
      expect(sheets[0].data).toEqual([['left']]);
    });
  });

  describe('the activeSheet setting sent from a listener of a switch', () => {
    it.each([
      'beforeSheetTabChange',
      'afterSheetTabStateCapture',
    ])('warns and records nothing when sent from %s', (hookName) => {
      const sheets = [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }, { name: 'C', data: [['c']] }];
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      let sent = false;

      hot = new Handsontable(container, {
        sheetsBar: { sheets, activeSheet: 0 },
        [hookName]: () => {
          if (!sent) {
            sent = true;
            hot.updateSettings({ sheetsBar: { sheets, activeSheet: 2 } });
          }
        },
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('sheetsBar');

      expect(plugin.setActiveSheet('B')).toBe(true);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('`activeSheet` setting was not applied'));

      hot.updateSettings({ sheetsBar: { sheets, activeSheet: 2 } });

      expect(plugin.getSheets()[2].isActive).toBe(true);
    });
  });

  describe('a validated change made from a beforeValidate listener', () => {
    it('keeps the outer change counted, so the sheet does not switch while it waits', async() => {
      const sheets = [{ name: 'Alpha', data: [['a', 'x']] }, { name: 'Beta', data: [['b', 'y']] }];
      const answers = [];
      let nested = false;

      hot = new Handsontable(container, {
        sheetsBar: { sheets },
        validator: (value, callback) => answers.push({ value, callback }),
        beforeValidate: (value) => {
          if (!nested && value === 'outerVal') {
            nested = true;
            hot.setDataAtCell(0, 1, 'nestedVal');
          }
        },
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('sheetsBar');

      hot.setDataAtCell(0, 0, 'outerVal');
      await flushMicrotasks();

      expect(answers.map(({ value }) => value).sort()).toEqual(['nestedVal', 'outerVal']);

      answers.find(({ value }) => value === 'nestedVal').callback(true);

      expect(plugin.setActiveSheet('Beta')).toBe(false);

      answers.find(({ value }) => value === 'outerVal').callback(true);

      expect(sheets[0].data).toEqual([['outerVal', 'nestedVal']]);
      expect(sheets[1].data).toEqual([['b', 'y']]);
    });
  });

  describe('validations that hold no change', () => {
    it('lets the sheet switch while validateCells() waits for its validators', () => {
      const answers = [];

      hot = new Handsontable(container, {
        sheetsBar: { sheets: [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }] },
        validator: (value, callback) => answers.push(callback),
        licenseKey: 'non-commercial-and-evaluation',
      });

      hot.validateCells();

      expect(hot.getPlugin('sheetsBar').setActiveSheet('Beta')).toBe(true);
    });

    it('lets an afterChange listener of a validated edit switch the sheet', async() => {
      const sheets = [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }];
      let switched = null;

      hot = new Handsontable(container, {
        sheetsBar: { sheets },
        validator: (value, callback) => callback(true),
        afterChange: (changes, source) => {
          if (source === 'edit' && switched === null) {
            switched = hot.getPlugin('sheetsBar').setActiveSheet('Beta');
          }
        },
        licenseKey: 'non-commercial-and-evaluation',
      });

      hot.setDataAtCell(0, 0, 'typed');
      await flushMicrotasks();

      expect(switched).toBe(true);
      expect(sheets[0].data).toEqual([['typed']]);
      expect(sheets[1].data).toEqual([['b']]);
    });
  });

  describe('validator answers', () => {
    it('keeps counting a pending validator when another one answers twice', async() => {
      const answers = [];

      hot = new Handsontable(container, {
        sheetsBar: { sheets: [{ name: 'Alpha', data: [['a', 'x']] }, { name: 'Beta', data: [['b', 'y']] }] },
        validator: (value, callback) => {
          if (value === 'twice') {
            callback(true);
            callback(true);
          } else {
            answers.push(callback);
          }
        },
        licenseKey: 'non-commercial-and-evaluation',
      });

      hot.setDataAtCell(0, 0, 'pending');
      hot.setDataAtCell(0, 1, 'twice');
      await flushMicrotasks();

      expect(answers.length).toBe(1);
      expect(hot.getPlugin('sheetsBar').setActiveSheet('Beta')).toBe(false);
    });

    it('lets the sheet switch again once loadData() replaced the data a validator never answered for', async() => {
      hot = new Handsontable(container, {
        sheetsBar: { sheets: [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }] },
        validator: () => {},
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('sheetsBar');

      hot.setDataAtCell(0, 0, 'typed');
      await flushMicrotasks();

      expect(plugin.setActiveSheet('Beta')).toBe(false);

      hot.loadData([['fresh']]);

      expect(plugin.setActiveSheet('Beta')).toBe(true);
    });
  });

  describe('a switch whose rollback throws too', () => {
    it('rethrows the error of the switch, not of the rollback', () => {
      let failures = 0;

      hot = new Handsontable(container, {
        sheetsBar: { sheets: [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }] },
        licenseKey: 'non-commercial-and-evaluation',
      });

      hot.addHook('afterUpdateSettings', () => {
        if (failures < 2) {
          failures += 1;
          throw new Error(failures === 1 ? 'switch failed' : 'rollback failed');
        }
      });

      expect(() => hot.getPlugin('sheetsBar').setActiveSheet('Beta')).toThrow('switch failed');
    });
  });

  describe('a tap on a tab while the editor is open', () => {
    it('switches on the first tap when the cell has a validator', async() => {
      const sheets = [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }];

      hot = new Handsontable(container, {
        sheetsBar: { sheets },
        validator: (value, callback) => callback(true),
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('sheetsBar');
      const tab = hot.rootWrapperElement.querySelector(`[data-sheet-id="${plugin.getSheets()[1].id}"]`);

      hot.selectCell(0, 0);
      hot.getActiveEditor().beginEditing();
      hot.getActiveEditor().setValue('typed');

      tab.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
      await flushMicrotasks();
      tab.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(plugin.getSheets()[1].isActive).toBe(true);
      expect(sheets[0].data).toEqual([['typed']]);
    });
  });

  describe('an open dialog', () => {
    it('shows no selection on the arriving sheet while it stays open', () => {
      hot = new Handsontable(container, {
        dialog: true,
        sheetsBar: { sheets: [{ name: 'A', data: [['a1', 'a2']] }, { name: 'B', data: [['b1', 'b2']] }] },
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('sheetsBar');

      plugin.setActiveSheet('B');
      hot.selectCell(0, 1);
      plugin.setActiveSheet('A');
      hot.getPlugin('dialog').show({ content: 'Loading' });
      plugin.setActiveSheet('B');

      expect(hot.getSelectedLast()).toBeUndefined();
    });
  });

  describe('an afterLoadData listener that throws', () => {
    it('keeps the arriving sheet when a listener added before the bar was turned on throws', () => {
      const sheets = [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }];
      let fail = false;

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
      });
      hot.addHook('afterLoadData', () => {
        if (fail) {
          fail = false;
          throw new Error('listener failed');
        }
      });
      hot.updateSettings({ sheetsBar: { sheets } });

      const plugin = hot.getPlugin('sheetsBar');

      fail = true;

      expect(() => plugin.setActiveSheet('Beta')).toThrow('listener failed');

      hot.setDataAtCell(0, 0, 'beta edit');

      expect(plugin.setActiveSheet('Alpha')).toBe(true);
      expect(sheets[0].data).toEqual([['a']]);
      expect(sheets[1].data).toEqual([['beta edit']]);
    });
  });
});
