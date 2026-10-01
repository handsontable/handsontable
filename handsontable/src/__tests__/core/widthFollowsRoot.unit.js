import Handsontable from 'handsontable/base';

/**
 * `TableView` answers the engine's `widthFollowsRoot` setting from the root's inline height, the
 * same answer as `heightFollowsContent`: `core/rootSize.ts` writes `auto` there only for
 * `height: 'auto'`. The engine then bounds the holder by the grid's root element inside an ancestor
 * that owns the horizontal axis, so an ancestor wider than the grid (its padding, a padded wrapper, a
 * relative `width`) no longer pushes the columns past the grid's inline-end edge (DEV-3107). An unset
 * height keeps the ancestor's box, as it did in 18.1.
 */
describe('The `widthFollowsRoot` engine setting', () => {
  let container;
  let core;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    core?.destroy();
    core = null;
    container.remove();
  });

  /**
   * Builds a grid in the shared container.
   *
   * @param {object} settings Grid settings.
   * @returns {Handsontable}
   */
  function createGrid(settings) {
    core = new Handsontable(container, {
      data: [['a']],
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return core;
  }

  /**
   * Reads the setting the engine sees.
   *
   * @returns {boolean}
   */
  function widthFollowsRoot() {
    return core.view._wt.wtSettings.getSetting('widthFollowsRoot');
  }

  it('should be `true` for `height: \'auto\'`, whatever the width', () => {
    createGrid({ height: 'auto' });

    expect(widthFollowsRoot()).toBe(true);

    core.updateSettings({ width: '50%' });

    expect(widthFollowsRoot()).toBe(true);

    core.updateSettings({ width: 'auto' });

    expect(widthFollowsRoot()).toBe(true);
  });

  it('should be `false` for an unset height', () => {
    createGrid({ width: '100%' });

    expect(widthFollowsRoot()).toBe(false);
  });

  it('should be `false` for a sized height', () => {
    createGrid({ height: 300 });

    expect(widthFollowsRoot()).toBe(false);

    core.updateSettings({ height: '50vh' });

    expect(widthFollowsRoot()).toBe(false);
  });

  it('should follow `updateSettings()` both ways', () => {
    createGrid({ height: 300 });

    core.updateSettings({ height: 'auto' });

    expect(widthFollowsRoot()).toBe(true);

    core.updateSettings({ height: 300 });

    expect(widthFollowsRoot()).toBe(false);

    core.updateSettings({ height: 'auto' });
    core.updateSettings({ height: null });

    expect(widthFollowsRoot()).toBe(false);
  });
});
