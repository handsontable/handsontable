import Handsontable from '../../index';
import { applyRootSize, getSideSlotsWidth } from '../rootSize';

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

  describe('`width` with filled side slots', () => {
    /**
     * Gives a side slot element a layout width, which jsdom does not compute on its own. A
     * non-zero width also puts one child into the slot, an empty slot counts as no slot.
     *
     * @param {HTMLElement} slot The side slot element.
     * @param {number} width The slot width.
     * @param {boolean} filled Whether the slot holds a child.
     */
    function stubSlot(slot: HTMLElement, width: number, filled: boolean): void {
      Object.defineProperty(slot, 'offsetWidth', { value: width, configurable: true });
      slot.replaceChildren(...(filled ? [document.createElement('div')] : []));
    }

    /**
     * Fills the side slots with one child each and stubs their widths (`0` empties the slot).
     *
     * @param {Handsontable} instance The grid.
     * @param {number} start The `start` slot width.
     * @param {number} end The `end` slot width.
     */
    function stubSideSlotWidths(instance: Handsontable, start: number, end: number): void {
      stubSlot(instance.rootSlotStartElement, start, start > 0);
      stubSlot(instance.rootSlotEndElement, end, end > 0);
    }

    /**
     * The side-panel width warnings printed so far.
     *
     * @returns {string[]}
     */
    function sidePanelWarnings(): string[] {
      return warnSpy.mock.calls
        .map(([message]) => message)
        .filter((message): message is string => typeof message === 'string')
        .filter(message => message.includes('take up the whole `width`'));
    }

    /**
     * Reads the inline widths of the root element and the root wrapper.
     *
     * @param {Handsontable} instance The grid.
     * @returns {object}
     */
    function inlineWidths(instance: Handsontable) {
      return {
        root: instance.rootElement.style.width,
        wrapper: instance.rootWrapperElement.style.width,
      };
    }

    it('should sum both side slot widths in getSideSlotsWidth', () => {
      const grid = buildGrid({});

      expect(getSideSlotsWidth(grid)).toBe(0);

      stubSideSlotWidths(grid, 100, 300);

      expect(getSideSlotsWidth(grid)).toBe(400);
    });

    it('should skip an empty side slot in getSideSlotsWidth', () => {
      const grid = buildGrid({});

      stubSlot(grid.rootSlotStartElement, 100, true);
      stubSlot(grid.rootSlotEndElement, 300, false);

      expect(getSideSlotsWidth(grid)).toBe(100);
    });

    it('should warn once when the side panels take up a whole pixel width', () => {
      const grid = buildGrid({});

      stubSideSlotWidths(grid, 300, 200);
      applyRootSize(grid, { width: 400 }, false);
      applyRootSize(grid, { width: 400 }, false);

      expect(sidePanelWarnings()).toHaveLength(1);
      expect(sidePanelWarnings()[0]).toContain('500px');
    });

    it('should not warn while the side panels leave room for the grid', () => {
      const grid = buildGrid({});

      stubSideSlotWidths(grid, 100, 100);
      applyRootSize(grid, { width: 400 }, false);

      expect(sidePanelWarnings()).toEqual([]);
    });

    it('should keep a root wrapper width the application set', () => {
      const grid = buildGrid({});

      grid.rootWrapperElement.style.width = '800px';
      applyRootSize(grid, { width: 900 }, false);

      expect(inlineWidths(grid)).toEqual({ root: '900px', wrapper: '800px' });

      applyRootSize(grid, { width: null }, false);

      expect(inlineWidths(grid).wrapper).toBe('800px');
    });

    it('should reduce a pixel width by the side slots on the root element', () => {
      const grid = buildGrid({});

      stubSideSlotWidths(grid, 100, 300);
      applyRootSize(grid, { width: 900 }, false);

      expect(inlineWidths(grid).root.replace(/\s+/g, '')).toBe('calc(900px-400px)');
      expect(inlineWidths(grid).wrapper).toBe('');
      expect(grid.rootWrapperElement.classList.contains('ht-grid-fixed-width')).toBe(true);
    });

    it('should move a container-driven width to the root wrapper and fill it with the root', () => {
      const grid = buildGrid({});

      stubSideSlotWidths(grid, 100, 0);
      applyRootSize(grid, { width: '50%' }, false);

      expect(inlineWidths(grid)).toEqual({ root: '100%', wrapper: '50%' });
      expect(grid.rootWrapperElement.classList.contains('ht-grid-fixed-width')).toBe(false);
    });

    it('should write the plain value and clear the wrapper width once the side slots are empty', () => {
      const grid = buildGrid({});

      stubSideSlotWidths(grid, 100, 0);
      applyRootSize(grid, { width: '50%' }, false);
      stubSideSlotWidths(grid, 0, 0);
      applyRootSize(grid, { width: 900 }, false);

      expect(inlineWidths(grid)).toEqual({ root: '900px', wrapper: '' });
    });

    it('should clear both inline widths for `null`', () => {
      const grid = buildGrid({});

      stubSideSlotWidths(grid, 100, 0);
      applyRootSize(grid, { width: '50%' }, false);
      applyRootSize(grid, { width: null }, false);

      expect(inlineWidths(grid)).toEqual({ root: '', wrapper: '' });
    });
  });

  describe('the `ht-grid-fixed-width` wrapper class', () => {
    /**
     * Reads whether the root wrapper carries the fixed-width class.
     *
     * @param {Handsontable} instance The grid.
     * @returns {boolean}
     */
    function hasFixedWidthClass(instance: Handsontable): boolean {
      return instance.rootWrapperElement.classList.contains('ht-grid-fixed-width');
    }

    it('should be set for a pixel number and for fixed CSS lengths', () => {
      expect(hasFixedWidthClass(buildGrid({ width: 400 }))).toBe(true);
      hot?.destroy();
      expect(hasFixedWidthClass(buildGrid({ width: '600px' }))).toBe(true);
      hot?.destroy();
      expect(hasFixedWidthClass(buildGrid({ width: '40em' }))).toBe(true);
    });

    it('should not be set for an unset, `auto`, or container-driven width', () => {
      expect(hasFixedWidthClass(buildGrid({}))).toBe(false);
      hot?.destroy();
      expect(hasFixedWidthClass(buildGrid({ width: 'auto' }))).toBe(false);

      ['100%', '50vw', 'var(--w)', '50cqw'].forEach((width) => {
        hot?.destroy();
        expect(hasFixedWidthClass(buildGrid({ width }))).toBe(false);
      });
    });

    it('should follow the `width` option through updateSettings', () => {
      const grid = buildGrid({ width: 400 });

      grid.updateSettings({ width: '100%' });

      expect(hasFixedWidthClass(grid)).toBe(false);

      grid.updateSettings({ width: 300 });

      expect(hasFixedWidthClass(grid)).toBe(true);

      grid.updateSettings({ width: 'auto' });

      expect(hasFixedWidthClass(grid)).toBe(false);
    });

    it('should keep the class when an unreadable width update is ignored', () => {
      const grid = buildGrid({ width: 400 });

      grid.updateSettings({ width: 'inherit' });

      expect(hasFixedWidthClass(grid)).toBe(true);
    });
  });

  describe('the stored setting', () => {
    it('should keep the previous `height` in the settings when an update is ignored', () => {
      buildGrid({ height: 300 });

      hot!.updateSettings({ height: 'abc' });

      expect(sizeWarnings().length).toBe(1);
      expect(inlineSize(hot!).height).toBe('300px');
      expect(hot!.getSettings().height).toBe(300);
    });

    it('should keep the previous `width` in the settings when an update is ignored', () => {
      buildGrid({ width: 200 });

      hot!.updateSettings({ width: 'min-content' });

      expect(sizeWarnings().length).toBe(1);
      expect(inlineSize(hot!).width).toBe('200px');
      expect(hot!.getSettings().width).toBe(200);
    });

    it('should keep the default in the settings when the initial value is ignored', () => {
      buildGrid({ height: 'abc', width: true });

      expect(sizeWarnings().length).toBe(2);
      expect(hot!.getSettings().height).toBeUndefined();
      expect(hot!.getSettings().width).toBeUndefined();
    });

    it('should store a readable value and a function as passed', () => {
      const heightFn = () => 250;

      buildGrid({ height: 300 });
      hot!.updateSettings({ height: heightFn, width: '50%' });

      expect(hot!.getSettings().height).toBe(heightFn);
      expect(hot!.getSettings().width).toBe('50%');
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

    it('should clip a definite width set in the same call that restores a sized height', () => {
      // A nested grid can start with an inline height. The restore brings the vertical overflow back
      // as it was; the width set alongside it still clips, as it does in a call of its own.
      const grid = buildGrid({ height: 100 });

      grid.rootElement.dataset.initialstyle = 'height: 300px';
      grid.updateSettings({ height: null, width: 200 });

      expect(inlineSize(grid)).toEqual({
        height: '300px', width: '200px', overflowX: 'clip', overflowY: '',
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

  describe('an overflow that is not this module\'s to write', () => {
    // Only two states put a foreign overflow on the root element, because a ROOT instance builds a
    // fresh `<div>` for `rootElement` (`core.ts`) and a container the host page styled inline is its
    // parent, never this element. The two are: a NESTED grid, whose `rootElement` is the container it
    // was handed, and the `height: null` restore, which copies the initial style back onto it. Both
    // are simulated here by writing the inline value the module has to leave alone.

    it('should survive a sized height set through the option', () => {
      // `hidden` clips as well as `clip` does, and unlike `clip` it stays programmatically
      // scrollable - so replacing it takes a capability away for no gain.
      const grid = buildGrid({ height: 300 });

      grid.rootElement.style.overflowY = 'scroll';
      grid.rootElement.style.overflowX = 'hidden';
      grid.updateSettings({ height: 400 });

      expect(inlineSize(grid)).toEqual({
        height: '400px', width: '', overflowX: 'hidden', overflowY: 'scroll',
      });
    });

    it('should be respected per axis, so an axis this module owns is still clipped', () => {
      const grid = buildGrid({ height: 300 });

      grid.rootElement.style.overflowY = 'scroll';
      grid.updateSettings({ height: 400 });

      expect(inlineSize(grid)).toEqual({
        height: '400px', width: '', overflowX: 'clip', overflowY: 'scroll',
      });
    });

    it('should survive the free-height path too, which clips the horizontal axis', () => {
      const grid = buildGrid({ height: 300, width: 200 });

      grid.rootElement.style.overflowX = 'auto';
      grid.updateSettings({ height: 'auto' });

      expect(inlineSize(grid)).toEqual({
        height: 'auto', width: '200px', overflowX: 'auto', overflowY: '',
      });
    });

    it('should be read through the `overflow` shorthand where the longhands are not set', () => {
      // jsdom records `overflow: hidden` on the shorthand alone and leaves both longhands empty,
      // while a browser expands it. Reading the longhand only, the check called the axis unset and
      // wrote `clip` over the user's value - in jsdom, so every unit test agreed with it.
      const grid = buildGrid({ height: 300 });

      grid.rootElement.style.cssText = 'height: 300px; overflow: hidden';
      grid.updateSettings({ width: 250 });

      expect(grid.rootElement.style.overflow).toBe('hidden');
      expect(inlineSize(grid)).toEqual({
        height: '300px', width: '250px', overflowX: '', overflowY: '',
      });
    });

    it('should come back with a `height: null` restore and survive the next sized height', () => {
      // The reachable route on a root instance: the restore copies the initial style back, and the
      // next payload must not undo it. A width-only payload reaches the sized-height path too,
      // which matters because React and Angular re-send unchanged settings on every commit.
      const grid = buildGrid({ height: 300, width: 200 });

      grid.rootElement.dataset.initialstyle = 'overflow: hidden';
      grid.updateSettings({ height: null });

      expect(inlineSize(grid)).toEqual({
        height: '', width: '200px', overflowX: 'hidden', overflowY: 'hidden',
      });

      grid.updateSettings({ width: 250 });

      expect(inlineSize(grid)).toEqual({
        height: '', width: '250px', overflowX: 'hidden', overflowY: 'hidden',
      });

      grid.updateSettings({ height: 400 });

      expect(inlineSize(grid)).toEqual({
        height: '400px', width: '250px', overflowX: 'hidden', overflowY: 'hidden',
      });
    });

    it('should still clip a root element whose overflow this module owns', () => {
      const grid = buildGrid({ height: 300 });

      expect(inlineSize(grid)).toEqual({
        height: '300px', width: '', overflowX: 'clip', overflowY: 'clip',
      });
    });
  });
});
