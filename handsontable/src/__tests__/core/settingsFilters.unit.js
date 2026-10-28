import Handsontable from 'handsontable';

/**
 * `Core#_addSettingsFilter()` keeps a list of functions that read each settings payload before core applies
 * it. More than one caller can add one: the SheetsBar plugin and a framework wrapper.
 */
describe('Core#_addSettingsFilter', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Creates a grid on the test container.
   *
   * @param {object} settings The grid settings.
   * @returns {Handsontable}
   */
  function createGrid(settings) {
    hot = new Handsontable(container, { licenseKey: 'non-commercial-and-evaluation', ...settings });

    return hot;
  }

  /**
   * Returns a filter that renames one key of a payload and records each payload it read.
   *
   * @param {string} from The key to rename.
   * @param {string} to The new name.
   * @param {Array} seen Where to record the payloads.
   * @returns {Function}
   */
  function renamingFilter(from, to, seen) {
    return (settings) => {
      seen.push(settings);

      if (!(from in settings)) {
        return settings;
      }

      const { [from]: value, ...rest } = settings;

      return { ...rest, [to]: value };
    };
  }

  it('runs every filter in the order they were added, each on what the one before returned', () => {
    const seen = [];

    createGrid({ data: [['a']] });
    hot._addSettingsFilter(renamingFilter('first', 'second', seen));
    hot._addSettingsFilter(renamingFilter('second', 'readOnly', seen));
    hot.updateSettings({ first: true });

    expect(seen).toEqual([{ first: true }, { second: true }]);
    expect(hot.getSettings().readOnly).toBe(true);
    expect(hot.getSettings().second).toBeUndefined();
  });

  it('adds a filter once, and removes only the one it is given', () => {
    const seen = [];
    const kept = renamingFilter('first', 'readOnly', seen);
    const removed = renamingFilter('first', 'comments', seen);

    createGrid({ data: [['a']] });
    hot._addSettingsFilter(kept);
    hot._addSettingsFilter(kept);
    hot._addSettingsFilter(removed);
    hot._removeSettingsFilter(removed);
    hot._removeSettingsFilter(() => ({}));
    hot.updateSettings({ first: true });

    expect(seen).toEqual([{ first: true }]);
    expect(hot.getSettings().readOnly).toBe(true);
  });

  it('filters the settings `_applySettingsAndData()` applies', () => {
    createGrid({ data: [['a']] });
    hot._addSettingsFilter(renamingFilter('first', 'readOnly', []));
    hot._applySettingsAndData({ first: true }, [['b']], 'test');

    expect(hot.getSettings().readOnly).toBe(true);
    expect(hot.getDataAtCell(0, 0)).toBe('b');
  });

  it('filters the values `_replaceInitPassSettings()` hands the init settings pass', () => {
    const calls = [];
    const filtered = () => calls.push('filtered');

    hot = new Handsontable.Core(container, { licenseKey: 'non-commercial-and-evaluation', data: [['a']] });
    hot._addSettingsFilter(settings => ({ ...settings, afterSelection: filtered }));
    hot.addHook('beforeInit', () => {
      hot._replaceInitPassSettings({ afterSelection: () => calls.push('raw') });
    });
    hot.init();
    hot.selectCell(0, 0);

    expect(calls).toEqual(['filtered']);
  });

  it('does not filter the settings the grid is created with', () => {
    const seen = [];

    hot = new Handsontable.Core(container, { licenseKey: 'non-commercial-and-evaluation', first: true });
    hot._addSettingsFilter(renamingFilter('first', 'readOnly', seen));
    hot.init();

    expect(seen.some(settings => 'first' in settings)).toBe(false);
    expect(hot.getSettings().readOnly).toBe(false);
  });
});
