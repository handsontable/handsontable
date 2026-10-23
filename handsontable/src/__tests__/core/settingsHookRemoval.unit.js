import Handsontable from 'handsontable';

describe('updateSettings() with a hook set to `null`', () => {
  let hot;

  afterEach(() => {
    hot?.destroy();
    hot = null;
  });

  /**
   * Builds a grid with the given settings.
   *
   * @param {object} settings Grid settings.
   * @returns {object} The Handsontable instance.
   */
  function build(settings = {}) {
    hot = new Handsontable(document.createElement('div'), {
      data: [['a', 'b']],
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });
    jest.clearAllMocks();

    return hot;
  }

  it('removes a callback passed in the initial settings', () => {
    const afterChange = jest.fn();

    build({ afterChange });
    hot.updateSettings({ afterChange: null });
    hot.setDataAtCell(0, 0, 'x');

    expect(afterChange).not.toHaveBeenCalled();
    expect(hot.getSettings().afterChange).toBeNull();
  });

  it('removes a callback passed through an earlier update', () => {
    const afterChange = jest.fn();

    build();
    hot.updateSettings({ afterChange });
    hot.updateSettings({ afterChange: null });
    hot.setDataAtCell(0, 0, 'x');

    expect(afterChange).not.toHaveBeenCalled();
  });

  it('removes every callback of an array passed in the settings', () => {
    const first = jest.fn();
    const second = jest.fn();

    build({ afterChange: [first, second] });
    hot.updateSettings({ afterChange: null });
    hot.setDataAtCell(0, 0, 'x');

    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
  });

  it('removes a callback an earlier settings object passed beside a later array', () => {
    const fromFirstSettings = jest.fn();
    const fromArray = jest.fn();

    build({ afterChange: fromFirstSettings });
    hot.updateSettings({ afterChange: [fromArray] });
    hot.updateSettings({ afterChange: null });
    hot.setDataAtCell(0, 0, 'x');

    expect(fromFirstSettings).not.toHaveBeenCalled();
    expect(fromArray).not.toHaveBeenCalled();
  });

  it('removes the callbacks of every array the settings passed', () => {
    const first = jest.fn();
    const second = jest.fn();
    const third = jest.fn();

    build({ afterChange: [first, second] });
    hot.updateSettings({ afterChange: [third] });
    hot.updateSettings({ afterChange: null });
    hot.setDataAtCell(0, 0, 'x');

    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
    expect(third).not.toHaveBeenCalled();
  });

  it('removes only the hook it is passed for', () => {
    const afterChange = jest.fn();
    const beforeChange = jest.fn();

    build({ afterChange, beforeChange });
    hot.updateSettings({ afterChange: null });
    hot.setDataAtCell(0, 0, 'x');

    expect(afterChange).not.toHaveBeenCalled();
    expect(beforeChange).toHaveBeenCalledTimes(1);
  });

  it('leaves a listener added with `addHook()` registered', () => {
    const fromSettings = jest.fn();
    const added = jest.fn();

    build({ afterChange: fromSettings });
    hot.addHook('afterChange', added);
    hot.updateSettings({ afterChange: null });
    hot.setDataAtCell(0, 0, 'x');

    expect(fromSettings).not.toHaveBeenCalled();
    expect(added).toHaveBeenCalledTimes(1);
  });

  it('leaves a listener added with `addHook()` before the settings passed the same function', () => {
    const afterChange = jest.fn();

    build();
    hot.addHook('afterChange', afterChange);
    hot.updateSettings({ afterChange });
    hot.updateSettings({ afterChange: null });
    hot.setDataAtCell(0, 0, 'x');

    expect(afterChange).toHaveBeenCalledTimes(1);
  });

  it('leaves a listener added with `addHook()` after the settings passed the same function', () => {
    const afterChange = jest.fn();

    build({ afterChange });
    hot.addHook('afterChange', afterChange);
    hot.updateSettings({ afterChange: null });
    hot.setDataAtCell(0, 0, 'x');

    expect(afterChange).toHaveBeenCalledTimes(1);
  });

  it('leaves a listener added with `addHook()` that is also an item of a settings array', () => {
    const shared = jest.fn();
    const settingsOnly = jest.fn();

    build({ afterChange: [shared, settingsOnly] });
    hot.addHook('afterChange', shared);
    hot.updateSettings({ afterChange: null });
    hot.setDataAtCell(0, 0, 'x');

    expect(shared).toHaveBeenCalledTimes(1);
    expect(settingsOnly).not.toHaveBeenCalled();
  });

  it('leaves a listener added with `Hooks#addAsFixed()`', () => {
    const fixed = jest.fn();

    build();
    Handsontable.hooks.addAsFixed('afterChange', fixed, hot);
    hot.updateSettings({ afterChange: fixed });
    hot.updateSettings({ afterChange: null });
    hot.setDataAtCell(0, 0, 'x');

    expect(fixed).toHaveBeenCalledTimes(1);
  });

  it('keeps the callback when the hook is passed as `undefined`', () => {
    const afterChange = jest.fn();

    build({ afterChange });
    hot.updateSettings({ afterChange: undefined });
    hot.setDataAtCell(0, 0, 'x');

    expect(afterChange).toHaveBeenCalledTimes(1);
    expect(hot.getSettings().afterChange).toBe(afterChange);
  });

  it('registers a callback passed after the removal', () => {
    const removed = jest.fn();
    const next = jest.fn();

    build({ afterChange: removed });
    hot.updateSettings({ afterChange: null });
    hot.updateSettings({ afterChange: next });
    hot.setDataAtCell(0, 0, 'x');

    expect(removed).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does nothing when no callback was passed for the hook', () => {
    build();

    expect(() => hot.updateSettings({ afterChange: null })).not.toThrow();
    expect(hot.getSettings().afterChange).toBeNull();
  });
});
