import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { SheetsBar } from '../sheetsBar';

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
  });
});
