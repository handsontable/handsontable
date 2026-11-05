import Core from 'handsontable/core';
import { registerCellType, TextCellType } from 'handsontable/cellTypes';
import { registerRenderer, baseRenderer, textRenderer } from 'handsontable/renderers';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

registerCellType(TextCellType);
registerRenderer(baseRenderer);
registerRenderer(textRenderer);

/**
 * @param {HTMLElement} container Host element.
 * @param {object} settings Handsontable settings.
 * @returns {Core} An initialized Core instance.
 */
function createHot(container, settings) {
  const core = new Core(container, {
    theme: 'ht-theme-main',
    licenseKey: TEST_LICENSE_KEY,
    ...settings,
  });

  core.init();

  return core;
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
          const listener = jest.fn(() => core.destroy());

          core = createHot(container, { data: [['a', 'b'], ['c', 'd']], ...validationSettings });

          if (selectsCell) {
            core.selectCell(0, 0);
          }

          // Added after the selection, which renders, so that only the write's own hook run destroys.
          core.addHook(hookName, listener);

          expect(() => core.setDataAtCell(0, 0, 'x')).not.toThrow();

          await flush();

          expect(listener).toHaveBeenCalledTimes(1);
          expect(core.isDestroyed).toBe(true);
          expect(uncaughtErrors).toEqual([]);
        });
      });

      ['beforeChange', 'afterSetDataAtRowProp', 'beforeChangeRender', 'afterChange'].forEach((hookName) => {
        it(`should end setDataAtRowProp() quietly when ${hookName} destroys the grid`, async() => {
          const listener = jest.fn(() => core.destroy());

          core = createHot(container, { data: [['a', 'b'], ['c', 'd']], ...validationSettings });
          core.addHook(hookName, listener);
          core.selectCell(0, 0);

          expect(() => core.setDataAtRowProp(0, 0, 'x')).not.toThrow();

          await flush();

          expect(listener).toHaveBeenCalledTimes(1);
          expect(core.isDestroyed).toBe(true);
          expect(uncaughtErrors).toEqual([]);
        });
      });
    });
  });

  [
    ['beforeChange', {}],
    ['beforeValidate', { validator: (value, callback) => callback(true) }],
  ].forEach(([hookName, settings]) => {
    ['Enter', 'Tab', 'ArrowDown'].forEach((key) => {
      it(`should end a keyboard save by ${key} quietly when ${hookName} destroys the grid`, async() => {
        const listener = jest.fn(() => core.destroy());

        core = createHot(container, { data: [['a', 'b'], ['c', 'd']], ...settings });
        core.addHook(hookName, listener);
        core.selectCell(0, 0);
        core.listen();

        const editor = core.getActiveEditor();

        editor.beginEditing();
        editor.setValue('x');

        expect(() => pressKey(key)).not.toThrow();

        await flush();

        expect(listener).toHaveBeenCalledTimes(1);
        expect(core.isDestroyed).toBe(true);
        expect(uncaughtErrors).toEqual([]);
      });
    });
  });
});
