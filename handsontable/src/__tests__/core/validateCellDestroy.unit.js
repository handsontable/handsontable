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

describe('Core validation when the grid is destroyed from a validation callback', () => {
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

  const validators = {
    'a function validator answering true': (value, callback) => callback(true),
    'a function validator answering false': (value, callback) => callback(false),
  };

  Object.entries(validators).forEach(([name, validator]) => {
    describe(`with ${name}`, () => {
      it('should end validateCells() quietly when its callback destroys the grid', async() => {
        const callback = jest.fn(() => core.destroy());

        core = createHot(container, { data: [['a', 'b'], ['c', 'd']], validator });
        core.validateCells(callback);
        await flush();

        expect(callback).toHaveBeenCalledTimes(1);
        expect(core.isDestroyed).toBe(true);
        expect(uncaughtErrors).toEqual([]);
      });

      it('should end validateRows() quietly when its callback destroys the grid', async() => {
        const callback = jest.fn(() => core.destroy());

        core = createHot(container, { data: [['a', 'b'], ['c', 'd']], validator });
        core.validateRows([0, 1], callback);
        await flush();

        expect(callback).toHaveBeenCalledTimes(1);
        expect(core.isDestroyed).toBe(true);
        expect(uncaughtErrors).toEqual([]);
      });

      it('should end validateColumns() quietly when its callback destroys the grid', async() => {
        const callback = jest.fn(() => core.destroy());

        core = createHot(container, { data: [['a', 'b'], ['c', 'd']], validator });
        core.validateColumns([0, 1], callback);
        await flush();

        expect(callback).toHaveBeenCalledTimes(1);
        expect(core.isDestroyed).toBe(true);
        expect(uncaughtErrors).toEqual([]);
      });

      it('should end validateCell() quietly when its callback destroys the grid', async() => {
        const callback = jest.fn(() => core.destroy());

        core = createHot(container, { data: [['a']], validator });
        core.validateCell('a', core.getCellMeta(0, 0), callback, 'test');
        await flush();

        expect(callback).toHaveBeenCalledTimes(1);
        expect(core.isDestroyed).toBe(true);
        expect(uncaughtErrors).toEqual([]);
      });

      it('should end validateCells() quietly when an afterValidate listener destroys the grid', async() => {
        const callback = jest.fn();
        const afterValidate = jest.fn(() => core.destroy());

        core = createHot(container, { data: [['a']], validator, afterValidate });
        core.validateCells(callback);
        await flush();

        expect(afterValidate).toHaveBeenCalledTimes(1);
        expect(core.isDestroyed).toBe(true);
        expect(callback).not.toHaveBeenCalled();
        expect(uncaughtErrors).toEqual([]);
      });

      it('should end validateCells() quietly when a beforeValidate listener destroys the grid', async() => {
        const callback = jest.fn();
        const beforeValidate = jest.fn(() => core.destroy());

        core = createHot(container, { data: [['a', 'b'], ['c', 'd']], validator, beforeValidate });

        expect(() => core.validateCells(callback)).not.toThrow();

        await flush();

        expect(beforeValidate).toHaveBeenCalledTimes(1);
        expect(core.isDestroyed).toBe(true);
        expect(callback).not.toHaveBeenCalled();
        expect(uncaughtErrors).toEqual([]);
      });

      [
        ['one change', [[0, 0, 'x']]],
        ['two changes', [[0, 0, 'x'], [1, 1, 'y']]],
      ].forEach(([size, changes]) => {
        it(`should end an edit of ${size} quietly when a beforeValidate listener destroys the grid`, async() => {
          const afterChange = jest.fn();
          const beforeValidate = jest.fn(() => core.destroy());

          core = createHot(container, { data: [['a', 'b'], ['c', 'd']], validator, beforeValidate });
          core.addHook('afterChange', afterChange);

          expect(() => core.setDataAtCell(changes)).not.toThrow();

          await flush();

          expect(beforeValidate).toHaveBeenCalledTimes(1);
          expect(core.isDestroyed).toBe(true);
          expect(afterChange).not.toHaveBeenCalled();
          expect(uncaughtErrors).toEqual([]);
        });
      });

      it('should end an editor save quietly when a postAfterValidate listener destroys the grid', async() => {
        const postAfterValidate = jest.fn(() => core.destroy());

        core = createHot(container, { data: [['a', 'b'], ['c', 'd']], validator });
        core.addHook('postAfterValidate', postAfterValidate);
        core.selectCell(0, 0);

        const editor = core.getActiveEditor();

        editor.beginEditing();
        editor.setValue('x');
        editor.finishEditing();
        await flush();

        expect(postAfterValidate).toHaveBeenCalledTimes(1);
        expect(core.isDestroyed).toBe(true);
        expect(uncaughtErrors).toEqual([]);
      });

      [
        ['existing rows', [[0, 0, 'x'], [1, 1, 'y']]],
        ['a row the write creates', [[0, 0, 'x'], [2, 1, 'new']]],
      ].forEach(([target, changes]) => {
        it(`should end an edit of ${target} quietly when an afterChange listener of the validated change destroys the grid (no cell selected)`, async() => {
          const afterChange = jest.fn((afterChanges, source) => {
            if (source === 'edit') {
              core.destroy();
            }
          });

          core = createHot(container, { data: [['a', 'b'], ['c', 'd']], validator, allowInvalid: true });
          core.addHook('afterChange', afterChange);
          core.setDataAtCell(changes, null, null, 'edit');
          await flush();

          expect(afterChange).toHaveBeenCalledTimes(1);
          expect(core.isDestroyed).toBe(true);
          expect(uncaughtErrors).toEqual([]);
        });
      });
    });
  });
});
