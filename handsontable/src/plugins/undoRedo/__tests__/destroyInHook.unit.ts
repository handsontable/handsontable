import Handsontable from '../../../index';
import { registerCellType, TextCellType } from '../../../cellTypes';
import { registerPlugin } from '../../registry';
import { UndoRedo } from '../undoRedo';
import { ManualRowMove } from '../../manualRowMove/manualRowMove';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerCellType(TextCellType);
registerPlugin(UndoRedo);
registerPlugin(ManualRowMove);

type UndoRedoPlugin = {
  undo(): void,
  redo(): void,
  isUndoAvailable(): boolean,
  done(action: () => object): void,
};
type Registration = 'settings' | 'addHook' | 'addHookFirst';
type Trigger = 'api' | 'key';
type Direction = 'undo' | 'redo';
type Scenario = 'edit' | 'structural' | 'custom' | 'rowMove';

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
 * @param {string} [options.scenario] The step on top of the stack: a cell edit, a row removal, a row move
 * made with a row selection, or a custom action registered through `done()`.
 * @param {object} [options.settings] Other grid settings.
 * @param {string} [options.veto] For a custom action: the direction in which it reports it could not
 * restore, which sends its step back to the stack it came from.
 * @returns {object} The grid, and a function that arms the listener. The listener destroys the grid
 * on the call after the first `skip` ones.
 */
function createGridDestroyedBy(
  hookName: string,
  registration: Registration,
  { scenario = 'edit', settings = {}, veto = null }: {
    scenario?: Scenario,
    settings?: Record<string, unknown>,
    veto?: Direction | null,
  } = {}
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
  } else if (scenario === 'rowMove') {
    hot.selectRows(0);
    (hot.getPlugin('manualRowMove') as unknown as { moveRow(from: number, to: number): void }).moveRow(0, 2);
  } else {
    hot.setDataAtCell(0, 0, 'edited');
  }

  if (scenario === 'custom') {
    (hot.getPlugin('undoRedo') as unknown as UndoRedoPlugin).done(() => ({
      actionType: 'custom',
      undo: (_hot: Handsontable, done: (result?: object) => void) => done(veto === 'undo' ? { wasUndone: false } : {}),
      redo: (_hot: Handsontable, done: (result?: object) => void) => done(veto === 'redo' ? { wasRedone: false } : {}),
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

  // The listener runs ahead of the plugins' own listeners of the same run. Registered in the settings or
  // after them it fails the same cases, and only this order lets a plugin's listener see the destroyed grid.
  const registrations: Registration[] = ['addHookFirst'];
  const triggers: Trigger[] = ['api', 'key'];
  const directions: Direction[] = ['undo', 'redo'];
  const stackHooks = [
    'beforeUndoStackChange',
    'afterUndoStackChange',
    'beforeRedoStackChange',
    'afterRedoStackChange',
  ];
  const hooks = [
    'afterChange',
    'afterRender',
    'beforeUndo',
    'afterUndo',
    'beforeRedo',
    'afterRedo',
    ...stackHooks,
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

      // Recording a step announces it through the stack-change hooks, whatever the write.
      stackHooks.forEach((hookName) => {
        it(`should end a recorded edit quietly when ${hookName} destroys the grid`, () => {
          const { hot, arm } = createGridDestroyedBy(hookName, registration);

          arm();

          expect(collectErrors(() => hot.setDataAtCell(1, 1, 'second'))).toEqual([]);
          expect(hot.isDestroyed).toBe(true);
        });
      });

      // A change of the index map names makes the history stale, and dropping it runs the same hooks.
      directions.forEach((direction) => {
        stackHooks.forEach((hookName) => {
          it(`should end ${direction === 'undo' ? 'an undo' : 'a redo'} quietly when ${hookName} destroys the grid while the stale history drops`, () => {
            const { hot, arm } = createGridDestroyedBy(hookName, registration);
            const plugin = hot.getPlugin('undoRedo') as unknown as UndoRedoPlugin;

            // One step on each stack, so dropping the history announces both.
            hot.setDataAtCell(1, 1, 'second');
            plugin.undo();
            hot.rowIndexMapper.createAndRegisterIndexMap('probe', 'hiding', false);

            arm();

            expect(collectErrors(() => run(hot, direction, 'api'))).toEqual([]);
            expect(hot.isDestroyed).toBe(true);
          });
        });
      });

      // A step recorded with a row selection puts the selection back by deselecting first.
      directions.forEach((direction) => {
        it(`should end ${direction === 'undo' ? 'an undo' : 'a redo'} of a row move quietly when afterDeselect destroys the grid`, () => {
          const { hot, arm } = createGridDestroyedBy('afterDeselect', registration, {
            scenario: 'rowMove',
            settings: { manualRowMove: true },
          });

          if (direction === 'redo') {
            (hot.getPlugin('undoRedo') as unknown as UndoRedoPlugin).undo();
          }

          arm();

          expect(collectErrors(() => run(hot, direction, 'api'))).toEqual([]);
          expect(hot.isDestroyed).toBe(true);
        });
      });

      // Every restored cell with a validator is validated again, and a `beforeValidate` listener runs
      // inside each of those calls.
      it('should end an undo quietly when beforeValidate destroys the grid on the first re-validated cell', async() => {
        const validator = (_value: unknown, callback: (valid: boolean) => void) => callback(true);
        const { hot, arm } = createGridDestroyedBy('beforeValidate', registration, {
          settings: { columns: [{ validator }, { validator }, {}] },
        });
        const plugin = hot.getPlugin('undoRedo') as unknown as UndoRedoPlugin;

        hot.populateFromArray(0, 0, [['a', 'b']]);

        for (let i = 0; i < 20; i++) {
          await Promise.resolve();
        }

        arm();

        const errors = collectErrors(() => plugin.undo());

        for (let i = 0; i < 20; i++) {
          await Promise.resolve();
        }

        expect(errors).toEqual([]);
        expect(hot.isDestroyed).toBe(true);
      });

      // A listener that vetoes the replay sends the step back through the stack hooks a second time. The
      // first call of the hook takes the step off the stack, the second puts it back.
      [
        { direction: 'undo' as Direction, hooks: ['beforeUndoStackChange', 'afterUndoStackChange'] },
        { direction: 'redo' as Direction, hooks: ['beforeRedoStackChange', 'afterRedoStackChange'] },
      ].forEach(({ direction, hooks: vetoHooks }) => {
        vetoHooks.forEach((hookName) => {
          it(`should end a vetoed ${direction} quietly when ${hookName} destroys the grid as the step goes back`, () => {
            const { hot, arm } = createGridDestroyedBy(hookName, registration);
            const plugin = hot.getPlugin('undoRedo') as unknown as UndoRedoPlugin;

            hot.alter('insert_row_above', 1, 1);

            if (direction === 'undo') {
              hot.addHook('beforeRemoveRow', () => false);
            } else {
              plugin.undo();
              hot.addHook('beforeCreateRow', () => false);
            }

            arm(1);

            expect(collectErrors(() => run(hot, direction, 'api'))).toEqual([]);
            expect(hot.isDestroyed).toBe(true);
          });

          it(`should end a vetoed ${direction} of a custom action quietly when ${hookName} destroys the grid as the step goes back`, () => {
            const { hot, arm } = createGridDestroyedBy(hookName, registration, { scenario: 'custom', veto: direction });
            const plugin = hot.getPlugin('undoRedo') as unknown as UndoRedoPlugin;

            if (direction === 'redo') {
              plugin.undo();
            }

            arm(1);

            expect(collectErrors(() => run(hot, direction, 'api'))).toEqual([]);
            expect(hot.isDestroyed).toBe(true);
          });
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
