import Handsontable from '../../../index';
import { registerCellType, TextCellType } from '../../../cellTypes';
import { registerPlugin } from '../../registry';
import { CopyPaste } from '../copyPaste';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerCellType(TextCellType);
registerPlugin(CopyPaste);

type MicrotaskHost = { _registerMicrotask: (callback: () => void) => void };
type CopyPastePlugin = {
  onCopy(e: unknown): void,
  onCut(e: unknown): void,
  onPaste(e: unknown): void,
  paste(text: string): void,
};
type Registration = 'settings' | 'addHook' | 'addHookFirst';

const containers: HTMLElement[] = [];

/**
 * Builds a mounted, listening grid whose `hookName` listener destroys it once armed. A listener
 * passed in the settings runs before the listeners the plugins add themselves, one added with
 * `addHook()` after the grid is built runs after them, and one added with an order index below the
 * default runs ahead of them, so all three registrations are covered.
 *
 * @param {string} hookName The hook whose listener destroys the grid.
 * @param {string} registration `'settings'`, `'addHook'` or `'addHookFirst'`.
 * @param {object} [settings] Other grid settings.
 * @returns {object} The grid, and a function that arms the listener.
 */
function createGridDestroyedBy(hookName: string, registration: Registration, settings: Record<string, unknown> = {}) {
  let armed = false;
  let hot: Handsontable;
  const listener = () => {
    if (armed) {
      armed = false;
      hot.destroy();
    }
  };
  const container = document.createElement('div');

  document.body.appendChild(container);
  containers.push(container);

  hot = new Handsontable(container, {
    data: [['A1', 'B1', 'C1'], ['A2', 'B2', 'C2'], ['A3', 'B3', 'C3']],
    licenseKey: TEST_LICENSE_KEY,
    copyPaste: true,
    ...settings,
    ...(registration === 'settings' ? { [hookName]: listener } : {}),
  });

  if (registration === 'addHook') {
    hot.addHook(hookName as 'afterChange', listener);
  } else if (registration === 'addHookFirst') {
    // Ordered before the listeners the plugins add, so the plugins' own listeners of the same run
    // see the grid already destroyed.
    hot.addHook(hookName as 'afterChange', listener, -1);
  }

  hot.listen();

  return {
    hot,
    arm: () => {
      armed = true;
    },
  };
}

/**
 * Builds a native-shaped clipboard event.
 *
 * @param {object} [flavors] The flavors the clipboard carries.
 * @returns {object} The event.
 */
function createClipboardEvent(flavors: Record<string, string> = {}) {
  return {
    clipboardData: {
      types: Object.keys(flavors),
      getData: (type: string) => flavors[type] ?? '',
      setData() {},
    },
    target: document.body,
    defaultPrevented: false,
    preventDefault() {},
    composedPath: () => [],
  };
}

/**
 * Lets the validator microtasks, and what their answers queue, run.
 */
async function flush() {
  for (let i = 0; i < 20; i++) {
    await Promise.resolve();
  }
}

describe('CopyPaste when a hook destroys the grid', () => {
  afterEach(() => {
    containers.splice(0).forEach(container => container.remove());
  });

  // The listener runs ahead of the plugins' own listeners of the same run. Registered in the settings or
  // after them it fails the same cases, and only this order lets a plugin's listener see the destroyed grid.
  const registrations: Registration[] = ['addHookFirst'];
  const writeHooks = ['beforeChange', 'afterChange', 'afterRender'];

  registrations.forEach((registration) => {
    describe(`with the listener added through ${registration}`, () => {
      writeHooks.forEach((hookName) => {
        it(`should end a paste by the API quietly when ${hookName} destroys the grid`, () => {
          const { hot, arm } = createGridDestroyedBy(hookName, registration);

          hot.selectCell(0, 0);
          arm();

          expect(() => {
            (hot.getPlugin('copyPaste') as unknown as CopyPastePlugin).paste('x\ty');
          }).not.toThrow();
          expect(hot.isDestroyed).toBe(true);
        });

        it(`should end a paste event quietly when ${hookName} destroys the grid`, () => {
          const { hot, arm } = createGridDestroyedBy(hookName, registration);

          hot.selectCell(0, 0);
          arm();

          expect(() => {
            (hot.getPlugin('copyPaste') as unknown as CopyPastePlugin)
              .onPaste(createClipboardEvent({ 'text/plain': 'x\ty' }));
          }).not.toThrow();
          expect(hot.isDestroyed).toBe(true);
        });

        it(`should end a cut event quietly when ${hookName} destroys the grid`, () => {
          const { hot, arm } = createGridDestroyedBy(hookName, registration);

          hot.selectCell(0, 0, 1, 1);
          arm();

          expect(() => {
            (hot.getPlugin('copyPaste') as unknown as CopyPastePlugin).onCut(createClipboardEvent());
          }).not.toThrow();
          expect(hot.isDestroyed).toBe(true);
        });
      });

      ['beforePasteParse', 'beforePaste', 'afterPaste'].forEach((hookName) => {
        it(`should end a paste by the API quietly when ${hookName} destroys the grid`, () => {
          const { hot, arm } = createGridDestroyedBy(hookName, registration);

          hot.selectCell(0, 0);
          arm();

          expect(() => {
            (hot.getPlugin('copyPaste') as unknown as CopyPastePlugin).paste('x\ty');
          }).not.toThrow();
          expect(hot.isDestroyed).toBe(true);
        });

        it(`should end a paste event quietly when ${hookName} destroys the grid`, () => {
          const { hot, arm } = createGridDestroyedBy(hookName, registration);

          hot.selectCell(0, 0);
          arm();

          expect(() => {
            (hot.getPlugin('copyPaste') as unknown as CopyPastePlugin)
              .onPaste(createClipboardEvent({ 'text/plain': 'x\ty' }));
          }).not.toThrow();
          expect(hot.isDestroyed).toBe(true);
        });
      });

      ['modifyCopyableRange', 'afterCopyLimit', 'beforeCopy', 'afterCopy'].forEach((hookName) => {
        it(`should end a copy event quietly when ${hookName} destroys the grid`, () => {
          const { hot, arm } = createGridDestroyedBy(hookName, registration, { copyPaste: { rowsLimit: 1 } });

          hot.selectCell(0, 0, 1, 1);
          arm();

          expect(() => {
            (hot.getPlugin('copyPaste') as unknown as CopyPastePlugin).onCopy(createClipboardEvent());
          }).not.toThrow();
          expect(hot.isDestroyed).toBe(true);
        });
      });

      ['modifyCopyableRange', 'afterCopyLimit', 'beforeCut', 'afterCut'].forEach((hookName) => {
        it(`should end a cut event quietly when ${hookName} destroys the grid`, () => {
          const { hot, arm } = createGridDestroyedBy(hookName, registration, { copyPaste: { rowsLimit: 1 } });

          hot.selectCell(0, 0, 1, 1);
          arm();

          expect(() => {
            (hot.getPlugin('copyPaste') as unknown as CopyPastePlugin).onCut(createClipboardEvent());
          }).not.toThrow();
          expect(hot.isDestroyed).toBe(true);
        });
      });

      it('should end a paste quietly when afterChange destroys the grid after an async validator answered', async() => {
        const { hot, arm } = createGridDestroyedBy('afterChange', registration, {
          columns: [
            { validator: (_value: unknown, callback: (valid: boolean) => void) => callback(true) },
            {},
            {},
          ],
        });
        const errors: unknown[] = [];
        const registerMicrotask = (hot as unknown as MicrotaskHost)._registerMicrotask.bind(hot);

        // A validator answers in a microtask, where a throw is a rejection nothing reports.
        (hot as unknown as MicrotaskHost)._registerMicrotask = (callback) => {
          registerMicrotask(() => {
            try {
              callback();
            } catch (error) {
              errors.push(error);
            }
          });
        };

        hot.selectCell(0, 0);
        arm();

        expect(() => {
          (hot.getPlugin('copyPaste') as unknown as CopyPastePlugin).paste('x\ty');
        }).not.toThrow();

        await flush();

        expect(hot.isDestroyed).toBe(true);
        expect(errors).toEqual([]);
      });
    });
  });
});
