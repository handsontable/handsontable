import Core from 'handsontable/core';
import { registerCellType, TextCellType } from 'handsontable/cellTypes';
import { registerRenderer, baseRenderer, textRenderer } from 'handsontable/renderers';
import { registerValidator, numericValidator } from 'handsontable/validators';

registerCellType(TextCellType);
registerRenderer(baseRenderer);
registerRenderer(textRenderer);
registerValidator(numericValidator);

/**
 * @param {HTMLElement} container Host element.
 * @param {object} settings Handsontable settings.
 * @returns {Core} An initialized Core instance.
 */
function createHot(container, settings) {
  const core = new Core(container, {
    theme: 'ht-theme-main',
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });

  core.init();

  return core;
}

/**
 * @param {Core} core Handsontable instance.
 * @returns {Promise<boolean>} Resolves with the `validateCells` callback result.
 */
function validateCells(core) {
  return new Promise((resolve) => {
    core.validateCells(resolve);
  });
}

/**
 * Flushes the microtasks that defer the validation behind a `setDataAtCell()` call.
 */
async function settle() {
  for (let i = 0; i < 20; i++) {
    await Promise.resolve();
  }
}

describe('Core `maxLength` option', () => {
  let container;
  let core;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    core = null;
  });

  afterEach(() => {
    if (core) {
      core.destroy();
    }

    container.remove();
  });

  describe('when `maxLength` is not set', () => {
    it('should return the configured validator untouched', () => {
      const myValidator = (value, callback) => callback(true);

      core = createHot(container, { data: [['a']], validator: myValidator });

      expect(core.getCellValidator(0, 0)).toBe(myValidator);
    });

    it('should return the configured validator untouched when `maxLength` is `Infinity`', () => {
      const myValidator = (value, callback) => callback(true);

      core = createHot(container, { data: [['a']], validator: myValidator, maxLength: Infinity });

      expect(core.getCellValidator(0, 0)).toBe(myValidator);
    });

    it('should return the same regular expression the user configured', () => {
      const expression = /^\d+$/;

      core = createHot(container, { data: [['1']], validator: expression });

      expect(core.getCellValidator(0, 0)).toBe(expression);
    });

    it('should not run `beforeValidate` and `afterValidate` for a cell without a validator', async() => {
      const beforeValidate = jest.fn();
      const afterValidate = jest.fn();

      core = createHot(container, { data: [['a very long text']], beforeValidate, afterValidate });

      await validateCells(core);

      expect(core.getCellValidator(0, 0)).toBeUndefined();
      expect(beforeValidate).not.toHaveBeenCalled();
      expect(afterValidate).not.toHaveBeenCalled();
    });
  });

  describe('when `maxLength` is set', () => {
    it('should return a validator for a cell that had none', () => {
      core = createHot(container, { data: [['a']], maxLength: 3 });

      expect(typeof core.getCellValidator(0, 0)).toBe('function');
    });

    it('should return a validator for a cell whose `maxLength` is `0`', () => {
      core = createHot(container, { data: [['a']], maxLength: 0 });

      expect(typeof core.getCellValidator(0, 0)).toBe('function');
    });

    it('should accept the cell meta object, like the row and column form', () => {
      core = createHot(container, { data: [['a']], maxLength: 3 });

      expect(typeof core.getCellValidator(core.getCellMeta(0, 0))).toBe('function');
    });

    it('should keep checking the length when the cell turns its validator off with `validator: false`', async() => {
      core = createHot(container, {
        data: [['abc', 'abcd'], [12345, 'x']],
        columns: [
          { validator: false, maxLength: 3 },
          { validator: false, maxLength: 3 },
        ],
      });

      expect(typeof core.getCellValidator(0, 0)).toBe('function');
      expect(typeof core.getCellValidator(0, 1)).toBe('function');
      // the cell in the second row holds a number, which the length check never measures
      expect(await validateCells(core)).toBe(false);
      expect(core.getCellMeta(0, 0).valid).toBe(true);
      expect(core.getCellMeta(1, 0).valid).toBe(true);
      expect(core.getCellMeta(0, 1).valid).toBe(false);
      expect(core.getCellMeta(1, 1).valid).toBe(true);
    });

    it('should still return `false` for a disabled validator when there is no `maxLength`', () => {
      core = createHot(container, { data: [['a']], validator: false });

      expect(core.getCellValidator(0, 0)).toBe(false);
    });

    it('should not return a validator when `maxLength` is not a finite number', () => {
      core = createHot(container, { data: [['a']], maxLength: NaN });

      expect(core.getCellValidator(0, 0)).toBeUndefined();
    });

    it('should mark a value that is too long as invalid and keep it, when `allowInvalid` is `true`', async() => {
      const afterValidate = jest.fn();

      core = createHot(container, {
        data: [['abc', 'abcd']],
        maxLength: 3,
        allowInvalid: true,
        afterValidate,
      });

      expect(await validateCells(core)).toBe(false);
      expect(core.getCellMeta(0, 0).valid).toBe(true);
      expect(core.getCellMeta(0, 1).valid).toBe(false);
      expect(core.getDataAtCell(0, 1)).toBe('abcd');
      expect(afterValidate).toHaveBeenCalledTimes(2);
    });

    it('should reject a change that makes the value too long, when `allowInvalid` is `false`', async() => {
      core = createHot(container, {
        data: [['abc', 'abc']],
        maxLength: 3,
        allowInvalid: false,
      });

      core.setDataAtCell(0, 0, 'abcd');
      core.setDataAtCell(0, 1, 'xyz');
      await settle();

      expect(core.getDataAtCell(0, 0)).toBe('abc');
      expect(core.getDataAtCell(0, 1)).toBe('xyz');
    });

    it('should mark a value written with `setDataAtCell` as invalid, when `allowInvalid` is `true`', async() => {
      core = createHot(container, { data: [['a']], maxLength: 3, allowInvalid: true });

      core.setDataAtCell(0, 0, 'abcd');
      await settle();

      expect(core.getDataAtCell(0, 0)).toBe('abcd');
      expect(core.getCellMeta(0, 0).valid).toBe(false);

      core.setDataAtCell(0, 0, 'abc');
      await settle();

      expect(core.getCellMeta(0, 0).valid).toBe(true);
    });

    it('should count an emoji as one character', async() => {
      core = createHot(container, { data: [['😀😀😀', '😀😀😀😀']], maxLength: 3 });

      expect(await validateCells(core)).toBe(false);
      expect(core.getCellMeta(0, 0).valid).toBe(true);
      expect(core.getCellMeta(0, 1).valid).toBe(false);
    });

    it('should count a flag, a skin-tone emoji and a family emoji as one character each', async() => {
      const flag = '🇵🇱';
      const thumb = '👍🏽';
      const family = '👨‍👩‍👧';

      core = createHot(container, {
        data: [[`${flag}${thumb}${family}`, `${flag}${thumb}${family}${flag}`]],
        maxLength: 3,
      });

      expect(await validateCells(core)).toBe(false);
      expect(core.getCellMeta(0, 0).valid).toBe(true);
      expect(core.getCellMeta(0, 1).valid).toBe(false);
    });

    it('should leave a value that is not a string alone', async() => {
      core = createHot(container, { data: [[123456789, null]], maxLength: 3 });

      expect(await validateCells(core)).toBe(true);
    });

    it('should run the configured function validator only for a value that fits', async() => {
      const myValidator = jest.fn((value, callback) => callback(value !== 'bad'));

      core = createHot(container, {
        data: [['ok', 'bad', 'toolong']],
        maxLength: 3,
        validator: myValidator,
      });

      expect(await validateCells(core)).toBe(false);
      expect(core.getCellMeta(0, 0).valid).toBe(true);
      expect(core.getCellMeta(0, 1).valid).toBe(false);
      expect(core.getCellMeta(0, 2).valid).toBe(false);
      // `toolong` is rejected by the length, so the custom validator never saw it.
      expect(myValidator.mock.calls.map(call => call[0]).sort()).toEqual(['bad', 'ok']);
    });

    it('should combine with a regular expression validator', async() => {
      core = createHot(container, {
        data: [['123', '12a', '1234']],
        maxLength: 3,
        validator: /^\d+$/g,
      });

      expect(await validateCells(core)).toBe(false);
      expect(core.getCellMeta(0, 0).valid).toBe(true);
      expect(core.getCellMeta(0, 1).valid).toBe(false);
      expect(core.getCellMeta(0, 2).valid).toBe(false);
      // A second run gives the same answers: the global expression is reset for every cell.
      expect(await validateCells(core)).toBe(false);
      expect(core.getCellMeta(0, 0).valid).toBe(true);
    });

    it('should combine with a validator given by its registered name', async() => {
      core = createHot(container, {
        data: [['123', 'abc', '12345']],
        maxLength: 3,
        validator: 'numeric',
      });

      expect(await validateCells(core)).toBe(false);
      expect(core.getCellMeta(0, 0).valid).toBe(true);
      // Fits the length, fails `numeric`.
      expect(core.getCellMeta(0, 1).valid).toBe(false);
      // Passes `numeric`, fails the length.
      expect(core.getCellMeta(0, 2).valid).toBe(false);
    });
  });

  describe('cascading', () => {
    it('should let the column level override the grid level, and the cell level override the column level', async() => {
      core = createHot(container, {
        data: [['12345', '12345', '12345'], ['12345', '12345', '12345']],
        maxLength: 3,
        columns: [
          {},
          { maxLength: 5 },
          { maxLength: 4 },
        ],
        cell: [
          { row: 1, col: 1, maxLength: 2 },
        ],
      });

      expect(await validateCells(core)).toBe(false);
      // Grid level: 3.
      expect(core.getCellMeta(0, 0).valid).toBe(false);
      // Column level: 5.
      expect(core.getCellMeta(0, 1).valid).toBe(true);
      // Column level: 4.
      expect(core.getCellMeta(0, 2).valid).toBe(false);
      // Cell level (2) beats the column level (5).
      expect(core.getCellMeta(1, 1).valid).toBe(false);
    });

    it('should validate only the columns that have a limit, leaving the hooks silent for the rest', async() => {
      const validated = [];

      core = createHot(container, {
        data: [['a very long text', 'a very long text']],
        columns: [{}, { maxLength: 3 }],
        afterValidate(valid, value, row, prop) {
          validated.push({ valid, prop });
        },
      });

      await validateCells(core);

      expect(validated).toEqual([{ valid: false, prop: 1 }]);
    });
  });
});
