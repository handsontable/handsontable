import Handsontable from 'handsontable/base';

/**
 * `TableView` answers the engine's `heightFollowsContent` setting from the root's inline height,
 * which `core/rootSize.ts` writes as `auto` only for `height: 'auto'`. The engine reads it to keep
 * the holder at `auto` inside a scroll container with no height of its own, where sizing the holder
 * to that container collapsed the grid to 0px (DEV-3062).
 */
describe('The `heightFollowsContent` engine setting', () => {
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
  function heightFollowsContent() {
    return core.view._wt.wtSettings.getSetting('heightFollowsContent');
  }

  it('should be `true` for `height: \'auto\'`', () => {
    createGrid({ height: 'auto' });

    expect(heightFollowsContent()).toBe(true);
  });

  it('should be `false` for an unset height', () => {
    createGrid({});

    expect(heightFollowsContent()).toBe(false);
  });

  it('should be `false` for a sized height', () => {
    createGrid({ height: 300 });

    expect(heightFollowsContent()).toBe(false);

    core.updateSettings({ height: '50vh' });

    expect(heightFollowsContent()).toBe(false);
  });

  it('should follow `updateSettings()` both ways', () => {
    createGrid({ height: 300 });

    core.updateSettings({ height: 'auto' });

    expect(heightFollowsContent()).toBe(true);

    core.updateSettings({ height: 300 });

    expect(heightFollowsContent()).toBe(false);

    core.updateSettings({ height: 'auto' });
    core.updateSettings({ height: null });

    expect(heightFollowsContent()).toBe(false);
  });
});
