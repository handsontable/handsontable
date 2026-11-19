import Core from 'handsontable/core';
import { rootInstanceSymbol } from 'handsontable/utils/rootInstance';
import { registerCellType, TextCellType } from 'handsontable/cellTypes';
import { registerRenderer, baseRenderer, textRenderer } from 'handsontable/renderers';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

registerCellType(TextCellType);
registerRenderer(baseRenderer);
registerRenderer(textRenderer);

/**
 * Builds a root instance, the kind `new Handsontable()` and the wrappers build, so the listeners core
 * adds for a root instance only (the edge slots' width sync) run too.
 *
 * @param {HTMLElement} container Host element.
 * @param {object} settings Handsontable settings.
 * @returns {Core} An initialized Core instance.
 */
function createHot(container, settings) {
  const core = new Core(container, {
    theme: 'ht-theme-main',
    licenseKey: TEST_LICENSE_KEY,
    ...settings,
  }, rootInstanceSymbol);

  core.init();

  return core;
}

/**
 * Builds a grid whose `hookName` listener destroys it once armed. A listener passed in the settings
 * runs before the listeners core adds itself, and one added with `addHook()` after the grid is built
 * runs after them, so both registrations are tested.
 *
 * @param {HTMLElement} container Host element.
 * @param {string} hookName The hook whose listener destroys the grid.
 * @param {string} registration `'settings'` or `'addHook'`.
 * @param {object} settings Other Handsontable settings.
 * @returns {{ core: Core, arm: Function }} The grid, and a function that arms the listener.
 */
function createHotDestroyedBy(container, hookName, registration, settings) {
  let armed = false;
  const listener = function() {
    if (armed) {
      armed = false;
      this.destroy();
    }
  };
  const core = createHot(container, registration === 'settings' ? { ...settings, [hookName]: listener } : settings);

  if (registration === 'addHook') {
    core.addHook(hookName, listener);
  }

  return {
    core,
    arm: () => {
      armed = true;
    },
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

/**
 * Dispatches a `keydown` the way a browser does, on the document element, where the shortcut
 * manager listens.
 *
 * @param {string} key The `KeyboardEvent.key` value.
 */
function pressKey(key) {
  document.documentElement.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

describe('Core edit path when the grid is destroyed from a hook of the write', () => {
  let container;
  let core;
  let uncaughtErrors;
  const onWindowError = (event) => {
    uncaughtErrors.push(event.error);
    event.preventDefault();
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    core = null;
    uncaughtErrors = [];
    window.addEventListener('error', onWindowError);
  });

  afterEach(() => {
    window.removeEventListener('error', onWindowError);

    if (core && !core.isDestroyed) {
      core.destroy();
    }

    container.remove();
  });

  const validations = {
    'without a validator': {},
    'with a validator': { validator: (value, callback) => callback(true) },
  };
  const data = () => [['a', 'b'], ['c', 'd']];

  ['settings', 'addHook'].forEach((registration) => {
    describe(`with the listener added through ${registration}`, () => {
      Object.entries(validations).forEach(([validationName, validationSettings]) => {
        describe(validationName, () => {
          [
            ['beforeChange', false],
            ['afterSetDataAtCell', false],
            ['beforeChangeRender', false],
            ['afterRender', true],
            ['afterChange', false],
            ['afterChange', true],
          ].forEach(([hookName, selectsCell]) => {
            const selection = selectsCell ? 'a cell selected' : 'no cell selected';

            it(`should end setDataAtCell() quietly when ${hookName} destroys the grid (${selection})`, async() => {
              const grid = createHotDestroyedBy(container, hookName, registration, {
                data: data(),
                ...validationSettings,
              });

              core = grid.core;

              if (selectsCell) {
                core.selectCell(0, 0);
              }

              grid.arm();

              expect(() => core.setDataAtCell(0, 0, 'x')).not.toThrow();

              await flush();

              expect(core.isDestroyed).toBe(true);
              expect(uncaughtErrors).toEqual([]);
            });
          });

          ['beforeChange', 'afterSetDataAtRowProp', 'beforeChangeRender', 'afterChange'].forEach((hookName) => {
            it(`should end setDataAtRowProp() quietly when ${hookName} destroys the grid`, async() => {
              const grid = createHotDestroyedBy(container, hookName, registration, {
                data: data(),
                ...validationSettings,
              });

              core = grid.core;
              core.selectCell(0, 0);
              grid.arm();

              expect(() => core.setDataAtRowProp(0, 0, 'x')).not.toThrow();

              await flush();

              expect(core.isDestroyed).toBe(true);
              expect(uncaughtErrors).toEqual([]);
            });
          });
        });
      });

      // With a validator the save is asynchronous, so the selection moves and renders first, and an
      // `afterRender` destroy lands in that render.
      [
        ['beforeChange', 'without a validator', {}],
        ['beforeValidate', 'with a validator', validations['with a validator']],
        ['afterRender', 'with a validator', validations['with a validator']],
      ].forEach(([hookName, validationName, settings]) => {
        ['Enter', 'Tab', 'ArrowDown'].forEach((key) => {
          it(`should end a keyboard save by ${key} quietly when ${hookName} destroys the grid (${validationName})`, async() => {
            const grid = createHotDestroyedBy(container, hookName, registration, { data: data(), ...settings });

            core = grid.core;
            core.selectCell(0, 0);
            core.listen();

            const editor = core.getActiveEditor();

            editor.beginEditing();
            editor.setValue('x');
            grid.arm();

            expect(() => pressKey(key)).not.toThrow();

            await flush();

            expect(core.isDestroyed).toBe(true);
            expect(uncaughtErrors).toEqual([]);
          });
        });
      });

      ['beforeChange', 'afterChange', 'afterRender'].forEach((hookName) => {
        ['Delete', 'Backspace'].forEach((key) => {
          it(`should end emptying the selected cells by ${key} quietly when ${hookName} destroys the grid`, async() => {
            const grid = createHotDestroyedBy(container, hookName, registration, { data: data() });

            core = grid.core;
            core.selectCell(0, 0);
            core.listen();
            grid.arm();

            expect(() => pressKey(key)).not.toThrow();

            await flush();

            expect(core.isDestroyed).toBe(true);
            expect(uncaughtErrors).toEqual([]);
          });
        });
      });

      // An open editor is saved when the selection moves away from it: a click on another cell, an
      // API selection, a deselection, a focus move inside a multi-cell selection, or `destroyEditor()`.
      const leaveEditorBy = {
        'selectCell() on another cell': () => core.selectCell(1, 1),
        'selectCells() on another cell': () => core.selectCells([[1, 1, 1, 1]]),
        'selectCells() on two ranges': () => core.selectCells([[1, 0, 1, 0], [1, 1, 1, 1]]),
        'selectAll()': () => core.selectAll(),
        'selectRows()': () => core.selectRows(1),
        'selectColumns()': () => core.selectColumns(1),
        'deselectCell()': () => core.deselectCell(),
        'destroyEditor()': () => core.destroyEditor(),
        'a focus move inside the selection': () => core.selection.setRangeFocus(core._createCellCoords(1, 1)),
        'a mousedown on another cell': () => {
          core.getCell(1, 1).dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        },
      };

      // An `afterRender` listener from the settings runs before the focus manager's own listener, which
      // focuses the newly selected cell. With a validator the save is asynchronous, so an `afterRender`
      // destroy lands in the render the selection change makes.
      [
        ['beforeChange', 'without a validator'],
        ['afterChange', 'without a validator'],
        ['afterRender', 'without a validator'],
        ['afterRender', 'with a validator'],
      ].forEach(([hookName, validationName]) => {
        Object.entries(leaveEditorBy).forEach(([leaveName, leave]) => {
          it(`should end an editor save by ${leaveName} quietly when ${hookName} destroys the grid (${validationName})`, async() => {
            const grid = createHotDestroyedBy(container, hookName, registration, {
              data: data(),
              ...validations[validationName],
            });

            core = grid.core;
            core.selectCells([[0, 0, 1, 1]]);
            core.listen();

            const editor = core.getActiveEditor();

            editor.beginEditing();
            editor.setValue('x');
            grid.arm();

            expect(leave).not.toThrow();

            await flush();

            expect(core.isDestroyed).toBe(true);
            expect(uncaughtErrors).toEqual([]);
          });
        });
      });
    });
  });
});
