import Handsontable from '../../index';

/**
 * The root's inline `height`, `width` and `overflow*` are written by `core/rootSize.ts` only.
 * jsdom reports every element as invisible, so these assert the inline style contract and the
 * warnings, never geometry.
 */
describe('root size options', () => {
  let warnSpy: jest.SpyInstance;
  let hot: Handsontable | null = null;

  /**
   * Builds a grid with the given settings.
   *
   * @param {object} settings The settings to pass, on top of the license key and a dataset.
   * @returns {Handsontable}
   */
  function buildGrid(settings: Record<string, unknown>): Handsontable {
    hot = new Handsontable(document.createElement('div'), {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[1, 2], [3, 4]],
      ...settings,
    });

    return hot;
  }

  /**
   * Reads the inline properties the module owns.
   *
   * @param {Handsontable} instance The grid.
   * @returns {object}
   */
  function inlineSize(instance: Handsontable) {
    const { style } = instance.rootElement;

    return {
      height: style.height,
      width: style.width,
      overflowX: style.overflowX,
      overflowY: style.overflowY,
    };
  }

  /**
   * The size warnings printed so far. jsdom prints an unrelated theme-stylesheet warning per grid,
   * so the raw call count cannot be asserted.
   *
   * @returns {string[]}
   */
  function sizeWarnings(): string[] {
    return warnSpy.mock.calls
      .map(([message]) => message)
      .filter((message): message is string => typeof message === 'string')
      .filter(message => message.includes('cannot be read as a size'));
  }

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    warnSpy.mockRestore();
  });

  describe('`height`', () => {
    it('should write a number as pixels and clip both axes', () => {
      const grid = buildGrid({ height: 300 });

      expect(inlineSize(grid)).toEqual({
        height: '300px', width: '', overflowX: 'clip', overflowY: 'clip',
      });
    });

    it('should write a bare numeric string and a pixel string as pixels', () => {
      expect(inlineSize(buildGrid({ height: '300' })).height).toBe('300px');
      hot?.destroy();
      expect(inlineSize(buildGrid({ height: '300px' })).height).toBe('300px');
    });

    it('should write `auto` as inline `height: auto` and no overflow at all', () => {
      const grid = buildGrid({ height: 'auto' });

      expect(inlineSize(grid)).toEqual({
        height: 'auto', width: '', overflowX: '', overflowY: '',
      });
      expect(sizeWarnings()).toHaveLength(0);
    });

    it('should clip the horizontal axis only for `auto` with a definite width', () => {
      const grid = buildGrid({ height: 'auto', width: 200 });

      expect(inlineSize(grid)).toEqual({
        height: 'auto', width: '200px', overflowX: 'clip', overflowY: '',
      });
    });

    it('should clip nothing for `auto` with a container-driven width', () => {
      const grid = buildGrid({ height: 'auto', width: '100%' });

      expect(inlineSize(grid)).toEqual({
        height: 'auto', width: '100%', overflowX: '', overflowY: '',
      });
    });

    it('should pass a CSS length through as written', () => {
      expect(inlineSize(buildGrid({ height: '50%' })).height).toBe('50%');
      expect(inlineSize(hot as Handsontable).overflowY).toBe('clip');
    });

    it('should call a function value', () => {
      expect(inlineSize(buildGrid({ height: () => 250 })).height).toBe('250px');
    });

    it('should ignore an unreadable value, warn once, and leave the height as it was', () => {
      const grid = buildGrid({ height: 300 });

      grid.updateSettings({ height: 'abc' });
      grid.updateSettings({ height: 'abc' });

      expect(inlineSize(grid)).toEqual({
        height: '300px', width: '', overflowX: 'clip', overflowY: 'clip',
      });
      expect(sizeWarnings()).toHaveLength(1);
      expect(sizeWarnings()[0]).toContain('`height` option');
      expect(sizeWarnings()[0]).toContain('"abc"');
    });

    it('should warn again for a different unreadable value', () => {
      const grid = buildGrid({ height: 300 });

      grid.updateSettings({ height: 'abc' });
      grid.updateSettings({ height: -100 });
      grid.updateSettings({ height: true });
      grid.updateSettings({ height: 'min-content' });

      expect(inlineSize(grid).height).toBe('300px');
      expect(sizeWarnings()).toHaveLength(4);
    });

    it('should leave no stray clip behind an unreadable value on a grid without a height', () => {
      const grid = buildGrid({ height: 'abc' });

      expect(inlineSize(grid)).toEqual({
        height: '', width: '', overflowX: '', overflowY: '',
      });
      expect(sizeWarnings()).toHaveLength(1);
    });

    it('should clear the clip when the height moves from a number to `auto`, and restore it back', () => {
      const grid = buildGrid({ height: 300, width: 200 });

      grid.updateSettings({ height: 'auto' });

      expect(inlineSize(grid)).toEqual({
        height: 'auto', width: '200px', overflowX: 'clip', overflowY: '',
      });

      grid.updateSettings({ height: 300 });

      expect(inlineSize(grid)).toEqual({
        height: '300px', width: '200px', overflowX: 'clip', overflowY: 'clip',
      });
    });

    it('should validate the value the `beforeHeightChange` hook returns', () => {
      const grid = buildGrid({
        height: 300,
        beforeHeightChange: () => 'calc(100% - 40px)',
      });

      expect(inlineSize(grid).height).toBe('calc(100% - 40px)');

      grid.updateSettings({ beforeHeightChange: () => 'abc', height: 200 });

      expect(inlineSize(grid).height).toBe('calc(100% - 40px)');
      expect(sizeWarnings()).toHaveLength(1);
    });
  });

  describe('`width`', () => {
    it('should write a number as pixels and clip the horizontal axis on a grid without a height', () => {
      expect(inlineSize(buildGrid({ width: 200 }))).toEqual({
        height: '', width: '200px', overflowX: 'clip', overflowY: '',
      });
    });

    it('should write `auto` as inline `width: auto` and clip nothing', () => {
      expect(inlineSize(buildGrid({ width: 'auto' }))).toEqual({
        height: '', width: 'auto', overflowX: '', overflowY: '',
      });
    });

    it('should clip nothing for a `var()` or container-query width', () => {
      expect(inlineSize(buildGrid({ width: 'var(--w)' })).overflowX).toBe('');
      hot?.destroy();
      expect(inlineSize(buildGrid({ width: '50cqw' })).overflowX).toBe('');
    });

    it('should ignore an unreadable value and warn once', () => {
      const grid = buildGrid({ width: 200 });

      grid.updateSettings({ width: 'inherit' });
      grid.updateSettings({ width: 'inherit' });

      expect(inlineSize(grid).width).toBe('200px');
      expect(sizeWarnings()).toHaveLength(1);
      expect(sizeWarnings()[0]).toContain('`width` option');
    });
  });

  describe('`null`', () => {
    it('should reset the height only, keeping a width set through the option', () => {
      const grid = buildGrid({ height: 300, width: 200 });

      grid.updateSettings({ height: null });

      expect(inlineSize(grid)).toEqual({
        height: '', width: '200px', overflowX: 'clip', overflowY: '',
      });
    });

    it('should reset the width to an empty value, never to `nullpx`', () => {
      const grid = buildGrid({ height: 300, width: 200 });

      grid.updateSettings({ width: null });

      expect(inlineSize(grid)).toEqual({
        height: '300px', width: '', overflowX: 'clip', overflowY: 'clip',
      });

      grid.updateSettings({ height: null });

      expect(inlineSize(grid)).toEqual({
        height: '', width: '', overflowX: '', overflowY: '',
      });
    });

    it('should restore the initial inline style per property', () => {
      const grid = buildGrid({ height: 300, width: 200 });

      grid.rootElement.dataset.initialstyle = 'height: 50px; overflow: hidden';
      grid.updateSettings({ height: null });

      expect(inlineSize(grid)).toEqual({
        height: '50px', width: '200px', overflowX: 'hidden', overflowY: 'hidden',
      });
    });
  });
});
