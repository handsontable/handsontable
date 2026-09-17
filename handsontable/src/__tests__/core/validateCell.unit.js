import Core from 'handsontable/core';
import { registerCellType, TextCellType } from 'handsontable/cellTypes';
import { registerRenderer, baseRenderer, textRenderer } from 'handsontable/renderers';

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

describe('Core.validateCell RegExp validators', () => {
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

  it('should report the same result on consecutive validateCells() runs when the validator is a global RegExp', async() => {
    const results = [];

    core = createHot(container, {
      data: [['a']],
      validator: /./g,
      afterValidate(valid) {
        results.push(valid);
      },
    });

    const first = await validateCells(core);
    const second = await validateCells(core);
    const third = await validateCells(core);

    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(third).toBe(true);
    expect(results).toEqual([true, true, true]);
  });

  it('should validate every matching cell in one validateCells() pass when they share a global RegExp', async() => {
    const results = [];

    core = createHot(container, {
      data: [['a'], ['b'], ['c']],
      validator: /./g,
      afterValidate(valid, value) {
        results.push({ valid, value });
      },
    });

    expect(await validateCells(core)).toBe(true);
    expect(results).toHaveLength(3);
    expect(results.every(result => result.valid === true)).toBe(true);
    expect(results.map(result => result.value).sort()).toEqual(['a', 'b', 'c']);
  });

  it('should keep non-matching values invalid across validateCells() runs when the validator is a global RegExp', async() => {
    const results = [];

    core = createHot(container, {
      data: [['xyz']],
      validator: /^\d+$/g,
      afterValidate(valid) {
        results.push(valid);
      },
    });

    expect(await validateCells(core)).toBe(false);
    expect(await validateCells(core)).toBe(false);
    expect(results).toEqual([false, false]);
    expect(core.getCellMeta(0, 0).valid).toBe(false);
  });

  it('should still accept a non-global RegExp validator', async() => {
    const results = [];

    core = createHot(container, {
      data: [['12'], ['ab']],
      validator: /^\d+$/,
      afterValidate(valid, value) {
        results.push({ valid, value });
      },
    });

    expect(await validateCells(core)).toBe(false);
    expect(results).toEqual(jasmine.arrayContaining([
      { valid: true, value: '12' },
      { valid: false, value: 'ab' },
    ]));
    expect(results).toHaveLength(2);
  });

  it('should report the same result on consecutive validateCells() runs when the validator is a sticky RegExp', async() => {
    const results = [];

    core = createHot(container, {
      data: [['a']],
      validator: /./y,
      afterValidate(valid) {
        results.push(valid);
      },
    });

    expect(await validateCells(core)).toBe(true);
    expect(await validateCells(core)).toBe(true);
    expect(results).toEqual([true, true]);
  });
});
