import Handsontable from '../../../index';
import { registerCellType, TextCellType } from '../../../cellTypes';
import { registerPlugin } from '../../registry';
import { UndoRedo } from '../undoRedo';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerCellType(TextCellType);
registerPlugin(UndoRedo);

type UndoRedoPlugin = {
  undo(): void,
  redo(): void,
  isUndoAvailable(): boolean,
  done(action: () => object): void,
};
type Registration = 'settings' | 'addHook' | 'addHookFirst';
type Trigger = 'api' | 'key';
type Direction = 'undo' | 'redo';
type Scenario = 'edit' | 'structural' | 'custom';

const containers: HTMLElement[] = [];

/**
 * Builds a mounted, listening grid with one recorded step, and a `hookName` listener that destroys
 * the grid once armed. A listener passed in the settings runs before the listeners the plugins add
 * themselves, one added with `addHook()` after the grid is built runs after them, and one added with
 * an order index below the default runs ahead of them, so all three registrations are covered.
 *
 * @param {string} hookName The hook whose listener destroys the grid.
 * @param {string} registration `'settings'`, `'addHook'` or `'addHookFirst'`.
 * @param {object} [options] Other options.
 * @param {string} [options.scenario] The step on top of the stack: a cell edit, a row removal, or a
 * custom action registered through `done()`.
 * @param {object} [options.settings] Other grid settings.
 * @returns {object} The grid, and a function that arms the listener. The listener destroys the grid
 * on the call after the first `skip` ones.
 */
function createGridDestroyedBy(
  hookName: string,
  registration: Registration,
  { scenario = 'edit', settings = {} }: { scenario?: Scenario, settings?: Record<string, unknown> } = {}
) {
  let armed = false;
  let skipped = 0;
  let hot: Handsontable;
  const listener = () => {
    if (!armed) {
      return;
    }

    if (skipped > 0) {
      skipped -= 1;

      return;
    }

    armed = false;
    hot.destroy();
  };
  const container = document.createElement('div');

  document.body.appendChild(container);
  containers.push(container);

  hot = new Handsontable(container, {
    data: [['A1', 'B1', 'C1'], ['A2', 'B2', 'C2'], ['A3', 'B3', 'C3']],
    licenseKey: TEST_LICENSE_KEY,
    undo: true,
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
  hot.selectCell(0, 0);

  if (scenario === 'structural') {
    hot.alter('remove_row', 1);
  } else {
    hot.setDataAtCell(0, 0, 'edited');
  }

  if (scenario === 'custom') {
    (hot.getPlugin('undoRedo') as unknown as UndoRedoPlugin).done(() => ({
      actionType: 'custom',
      undo: (_hot: Handsontable, done: () => void) => done(),
      redo: (_hot: Handsontable, done: () => void) => done(),
    }));
  }

  return {
    hot,
    arm: (skip = 0) => {
      armed = true;
      skipped = skip;
    },
  };
}

/**
 * Dispatches a `keydown` the way a browser does, on the document element, where the shortcut
 * manager listens.
 *
 * @param {string} key The `KeyboardEvent.key` value.
 */
function pressCtrl(key: string) {
  document.documentElement.dispatchEvent(
    new KeyboardEvent('keydown', { key, ctrlKey: true, bubbles: true, cancelable: true })
  );
}

/**
 * Runs `callback` and returns every error it caused: one it threw, and one a listener threw while an
 * event was dispatched, which `dispatchEvent()` reports to the window instead of throwing.
 *
 * @param {Function} callback The code to run.
 * @returns {Array} The errors.
 */
function collectErrors(callback: () => void) {
  const errors: unknown[] = [];
  const onError = (event: ErrorEvent) => {
    errors.push(event.error);
    event.preventDefault();
  };

  window.addEventListener('error', onError);

  try {
    callback();
  } catch (error) {
    errors.push(error);
  } finally {
    window.removeEventListener('error', onError);
  }

  return errors;
}

/**
 * Runs an undo or a redo the way `trigger` says.
 *
 * @param {object} hot The Handsontable instance.
 * @param {string} direction `'undo'` or `'redo'`.
 * @param {string} trigger `'api'` or `'key'`.
 */
function run(hot: Handsontable, direction: Direction, trigger: Trigger) {
  if (trigger === 'api') {
    (hot.getPlugin('undoRedo') as unknown as UndoRedoPlugin)[direction]();
  } else {
    pressCtrl(direction === 'undo' ? 'z' : 'y');
  }
}

describe('UndoRedo when a hook destroys the grid', () => {
  afterEach(() => {
    containers.splice(0).forEach(container => container.remove());
  });

  const registrations: Registration[] = ['settings', 'addHook', 'addHookFirst'];
  const triggers: Trigger[] = ['api', 'key'];
  const directions: Direction[] = ['undo', 'redo'];
  const hooks = [
    'afterChange',
    'afterRender',
    'beforeUndo',
    'afterUndo',
    'beforeRedo',
    'afterRedo',
    'beforeUndoStackChange',
    'afterUndoStackChange',
    'beforeRedoStackChange',
    'afterRedoStackChange',
  ];

  /**
   * Tells whether a hook belongs to the other direction, so a test for this one never fires it.
   *
   * @param {string} direction `'undo'` or `'redo'`.
   * @param {string} hookName The hook name.
   * @returns {boolean}
   */
  const isOtherDirection = (direction: Direction, hookName: string) => (
    direction === 'undo' ? hookName.endsWith('Redo') : hookName.endsWith('Undo')
  );

  registrations.forEach((registration) => {
    describe(`with the listener added through ${registration}`, () => {
      directions.forEach((direction) => {
        const noun = direction === 'undo' ? 'an undo' : 'a redo';

        triggers.forEach((trigger) => {
          hooks.filter(hookName => !isOtherDirection(direction, hookName)).forEach((hookName) => {
            it(`should end ${noun} by ${trigger} quietly when ${hookName} destroys the grid`, () => {
              const { hot, arm } = createGridDestroyedBy(hookName, registration);

              if (direction === 'redo') {
                (hot.getPlugin('undoRedo') as unknown as UndoRedoPlugin).undo();
              }

              arm();

              expect(collectErrors(() => run(hot, direction, trigger))).toEqual([]);
              expect(hot.isDestroyed).toBe(true);
            });
          });
        });

        // A custom action registered through `done()` has a path of its own.
        hooks
          .filter(hookName => !isOtherDirection(direction, hookName))
          .filter(hookName => hookName !== 'afterChange' && hookName !== 'afterRender')
          .forEach((hookName) => {
            it(`should end ${noun} of a custom action quietly when ${hookName} destroys the grid`, () => {
              const { hot, arm } = createGridDestroyedBy(hookName, registration, { scenario: 'custom' });

              if (direction === 'redo') {
                (hot.getPlugin('undoRedo') as unknown as UndoRedoPlugin).undo();
              }

              arm();

              expect(collectErrors(() => run(hot, direction, 'api'))).toEqual([]);
              expect(hot.isDestroyed).toBe(true);
            });
          });

        // The re-validation of an undone row removal renders a second time, after the replay's own
        // render. A redo of the removal has no restored cell left to re-validate, so it renders once.
        (direction === 'undo' ? [0, 1] : [0]).forEach((skip) => {
          it(`should end ${noun} of a row removal quietly when render number ${skip + 1} destroys the grid`, () => {
            const { hot, arm } = createGridDestroyedBy('afterRender', registration, { scenario: 'structural' });

            if (direction === 'redo') {
              (hot.getPlugin('undoRedo') as unknown as UndoRedoPlugin).undo();
            }

            arm(skip);

            expect(collectErrors(() => run(hot, direction, 'api'))).toEqual([]);
            expect(hot.isDestroyed).toBe(true);
          });
        });
      });

      // A listener that vetoes the replay sends the step back through the stack hooks a second time.
      ['beforeUndoStackChange', 'afterUndoStackChange'].forEach((hookName) => {
        it(`should end a vetoed undo quietly when ${hookName} destroys the grid as the step goes back`, () => {
          const { hot, arm } = createGridDestroyedBy(hookName, registration);

          hot.alter('insert_row_above', 1, 1);
          hot.addHook('beforeRemoveRow', () => false);

          // The first call takes the step off the stack, the second puts it back.
          arm(1);

          expect(collectErrors(() => (hot.getPlugin('undoRedo') as unknown as UndoRedoPlugin).undo())).toEqual([]);
          expect(hot.isDestroyed).toBe(true);
        });
      });

      it('should end an undo quietly when afterChange destroys the grid and a validator answers later', async() => {
        const { hot, arm } = createGridDestroyedBy('afterChange', registration, {
          settings: {
            columns: [
              { validator: (_value: unknown, callback: (valid: boolean) => void) => callback(true) },
              {},
              {},
            ],
          },
        });
        const plugin = hot.getPlugin('undoRedo') as unknown as UndoRedoPlugin;

        // The edit waits for its validator, so it is a step only once the validator answered.
        for (let i = 0; i < 20; i++) {
          await Promise.resolve();
        }

        expect(plugin.isUndoAvailable()).toBe(true);

        arm();

        const errors = collectErrors(() => plugin.undo());

        for (let i = 0; i < 20; i++) {
          await Promise.resolve();
        }

        expect(errors).toEqual([]);
        expect(hot.isDestroyed).toBe(true);
      });
    });
  });
});
