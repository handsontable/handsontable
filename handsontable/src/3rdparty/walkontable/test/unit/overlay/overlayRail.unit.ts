import { OverlayRail, railCarriesAxis } from '../../../src/overlay/overlayRail';
import { OVERLAY_RAIL_CLASS_NAME } from '../../../src/overlay/constants';

/**
 * Makes the rail's DOM moves behave like an engine that blurs a detached element at once. jsdom, like
 * Chromium, keeps the focus on an element through a synchronous detach and re-attach, so without this
 * the restore never runs and a focus test proves nothing.
 */
function emulateEagerBlur(): void {
  const { appendChild } = Node.prototype;
  const { replaceWith } = Element.prototype;
  const blurDetached = (node: Node | string) => {
    const active = document.activeElement;

    if (typeof node !== 'string' && active instanceof HTMLElement && node.contains(active)) {
      active.blur();
    }
  };

  jest.spyOn(Node.prototype, 'appendChild').mockImplementation(function<T extends Node>(this: Node, node: T): T {
    blurDetached(node);

    return appendChild.call(this, node) as T;
  });
  jest.spyOn(Element.prototype, 'replaceWith').mockImplementation(function(this: Element, ...nodes: (Node | string)[]) {
    nodes.forEach(blurDetached);
    replaceWith.apply(this, nodes);
  });
}

describe('OverlayRail', () => {
  let wrapper: HTMLElement;
  let master: HTMLElement;
  let clone: HTMLElement;
  let nextSibling: HTMLElement;

  beforeEach(() => {
    // The shape the overlays build: clones are appended to the master's parent, absolutely positioned
    // at its top-left (`Overlay#makeClone`).
    wrapper = document.createElement('div');
    master = document.createElement('div');
    clone = document.createElement('div');
    nextSibling = document.createElement('div');
    clone.style.position = 'absolute';
    clone.style.top = '0';
    clone.style.left = '0';
    wrapper.append(master, clone, nextSibling);
    document.body.appendChild(wrapper);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    wrapper.remove();
  });

  it('should move the clone into a table-wide rail at the place the clone stood', () => {
    const rail = new OverlayRail(clone, document);

    rail.pin({ isRtl: false, width: 12050, height: 4000, inline: true, block: { pinned: false, edge: 'top' } });

    const railElement = clone.parentElement!;

    expect(rail.isPinned()).toBe(true);
    expect(railElement.className).toBe(OVERLAY_RAIL_CLASS_NAME);
    expect(railElement.parentElement).toBe(wrapper);
    // Same slot among the siblings, so tree order (and with it the paint order) is unchanged.
    expect([...wrapper.children]).toEqual([master, railElement, nextSibling]);
    expect(railElement.style.position).toBe('absolute');
    expect(railElement.style.width).toBe('12050px');
  });

  it('should give the rail no height, so it covers nothing', () => {
    const rail = new OverlayRail(clone, document);

    rail.pin({ isRtl: false, width: 900, height: 4000, inline: true, block: { pinned: false, edge: 'top' } });

    expect(clone.parentElement!.style.height).toBe('0px');
  });

  it('should pin the clone with sticky positioning and no vertical inset', () => {
    // A vertical inset on a sticky box is a sticky constraint too: `top: 0` would pin the row headers
    // to the viewport top as the page scrolls down.
    const rail = new OverlayRail(clone, document);

    rail.pin({ isRtl: false, width: 900, height: 4000, inline: true, block: { pinned: false, edge: 'top' } });

    expect(clone.style.position).toBe('sticky');
    expect(clone.style.left).toBe('0px');
    expect(clone.style.right).toBe('');
    expect(clone.style.top).toBe('');
    expect(clone.style.bottom).toBe('');
    expect(clone.parentElement!.style.top).toBe('0px');
    expect(clone.parentElement!.style.left).toBe('0px');
  });

  it('should pin to the right edge in RTL', () => {
    const rail = new OverlayRail(clone, document);

    rail.pin({ isRtl: true, width: 900, height: 4000, inline: true, block: { pinned: false, edge: 'top' } });

    const railElement = clone.parentElement!;

    expect(clone.style.right).toBe('0px');
    expect(clone.style.left).toBe('');
    expect(railElement.style.right).toBe('0px');
    expect(railElement.style.left).toBe('');
  });

  it('should hang a bottom-anchored clone so that its bottom edge lands at the offset', () => {
    // The rail has no height, so its bottom edge is the line the clone's TOP hangs from: the clone
    // ends `height` below it, which must be `offset` above the wrapper's bottom.
    const rail = new OverlayRail(clone, document);

    rail.pin({
      isRtl: false,
      width: 900,
      height: 4000,
      inline: true,
      block: { pinned: false, edge: 'bottom', offset: 16, height: 58 },
    });

    const railElement = clone.parentElement!;

    expect(railElement.style.bottom).toBe('74px');
    expect(railElement.style.top).toBe('');
  });

  it('should update the rail in place on a repeated pin', () => {
    const rail = new OverlayRail(clone, document);

    rail.pin({
      isRtl: false,
      width: 900,
      height: 4000,
      inline: true,
      block: { pinned: false, edge: 'bottom', offset: 0, height: 30 },
    });

    const railElement = clone.parentElement!;

    rail.pin({ isRtl: false, width: 1500, height: 4000, inline: true, block: { pinned: false, edge: 'top' } });

    expect(clone.parentElement).toBe(railElement);
    expect(wrapper.querySelectorAll(`.${OVERLAY_RAIL_CLASS_NAME}`)).toHaveLength(1);
    expect(railElement.style.width).toBe('1500px');
    expect(railElement.style.top).toBe('0px');
    expect(railElement.style.bottom).toBe('');
  });

  it('should put the clone back in the rail\'s slot, positioned as the clone factory made it', () => {
    const rail = new OverlayRail(clone, document);

    rail.pin({ isRtl: false, width: 900, height: 4000, inline: true, block: { pinned: false, edge: 'top' } });
    rail.release();

    expect(rail.isPinned()).toBe(false);
    expect([...wrapper.children]).toEqual([master, clone, nextSibling]);
    expect(wrapper.querySelector(`.${OVERLAY_RAIL_CLASS_NAME}`)).toBeNull();
    expect(clone.style.position).toBe('absolute');
    expect(clone.style.top).toBe('0px');
  });

  it('should do nothing on a release while not pinned', () => {
    const rail = new OverlayRail(clone, document);

    rail.release();

    expect(clone.parentElement).toBe(wrapper);
    expect(clone.style.position).toBe('absolute');
  });

  it('should pin again after a release', () => {
    const rail = new OverlayRail(clone, document);

    rail.pin({ isRtl: false, width: 900, height: 4000, inline: true, block: { pinned: false, edge: 'top' } });
    rail.release();
    rail.pin({ isRtl: false, width: 900, height: 4000, inline: true, block: { pinned: false, edge: 'top' } });

    expect(rail.isPinned()).toBe(true);
    expect(clone.parentElement!.className).toBe(OVERLAY_RAIL_CLASS_NAME);
    expect(wrapper.querySelectorAll(`.${OVERLAY_RAIL_CLASS_NAME}`)).toHaveLength(1);
  });

  describe('focus', () => {
    let cell: HTMLElement;

    beforeEach(() => {
      cell = document.createElement('td');
      cell.tabIndex = -1;
      clone.appendChild(cell);
      cell.focus();
      jest.spyOn(document, 'hasFocus').mockReturnValue(true);
    });

    it('should give the focus back to a cell of the clone on pin, on an eager-blur engine', () => {
      // The focus manager focuses the topmost copy of a cell, so a frozen or header cell it focuses
      // lives in this clone; losing it drops the grid's keyboard focus to the body.
      const rail = new OverlayRail(clone, document);
      const blurSpy = jest.spyOn(cell, 'blur');
      const focusSpy = jest.spyOn(cell, 'focus');

      emulateEagerBlur();
      rail.pin({ isRtl: false, width: 900, height: 4000, inline: true, block: { pinned: false, edge: 'top' } });

      expect(blurSpy).toHaveBeenCalledTimes(1);
      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
      expect(document.activeElement).toBe(cell);
    });

    it('should give the focus back to a cell of the clone on release, on an eager-blur engine', () => {
      const rail = new OverlayRail(clone, document);

      rail.pin({ isRtl: false, width: 900, height: 4000, inline: true, block: { pinned: false, edge: 'top' } });

      const blurSpy = jest.spyOn(cell, 'blur');

      emulateEagerBlur();
      rail.release();

      expect(blurSpy).toHaveBeenCalledTimes(1);
      expect(document.activeElement).toBe(cell);
    });

    it('should leave a focus outside the clone alone', () => {
      const input = document.createElement('input');

      nextSibling.appendChild(input);
      input.focus();

      const focusSpy = jest.spyOn(input, 'focus');
      const rail = new OverlayRail(clone, document);

      emulateEagerBlur();
      rail.pin({ isRtl: false, width: 900, height: 4000, inline: true, block: { pinned: false, edge: 'top' } });
      rail.release();

      expect(focusSpy).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(input);
    });
  });

  describe('the block axis', () => {
    it('should hold a top clone at the viewport top inside a table-tall rail', () => {
      const rail = new OverlayRail(clone, document);

      const placement = { isRtl: false, width: 900, height: 4000, inline: false } as const;

      rail.pin({ ...placement, block: { pinned: true, edge: 'top' } });

      const railElement = clone.parentElement!;

      expect(rail.pinsBlock()).toBe(true);
      expect(rail.pinsInline()).toBe(false);
      expect(railElement.style.height).toBe('4000px');
      expect(railElement.style.top).toBe('0px');
      expect(clone.style.position).toBe('sticky');
      expect(clone.style.top).toBe('0px');
      expect(clone.style.bottom).toBe('');
      // The inline axis is the page's, so the clone takes no inline inset to stick to.
      expect(clone.style.left).toBe('');
    });

    it('should hang a bottom clone from the viewport bottom inside a table-tall rail', () => {
      const rail = new OverlayRail(clone, document);

      rail.pin({
        isRtl: false, width: 900, height: 4000, inline: false, block: { pinned: true, edge: 'bottom' },
      });

      expect(clone.style.bottom).toBe('0px');
      expect(clone.style.top).toBe('');
      expect(clone.parentElement!.style.height).toBe('4000px');
    });

    it('should hold a corner on both axes at once', () => {
      const rail = new OverlayRail(clone, document);

      rail.pin({ isRtl: false, width: 900, height: 4000, inline: true, block: { pinned: true, edge: 'top' } });

      expect(rail.pinsInline()).toBe(true);
      expect(rail.pinsBlock()).toBe(true);
      expect(clone.style.left).toBe('0px');
      expect(clone.style.top).toBe('0px');
    });

    it('should let clicks through a rail that spans the table, and keep them on the clone', () => {
      // A table-tall rail lies over the cells; only the clone inside it may take their clicks.
      const rail = new OverlayRail(clone, document);

      rail.pin({
        isRtl: false, width: 900, height: 4000, inline: false, block: { pinned: true, edge: 'top' },
      });

      expect(clone.parentElement!.style.pointerEvents).toBe('none');
      expect(clone.style.pointerEvents).toBe('auto');
    });

    it('should leave no bottom inset behind on release', () => {
      // The clone gets its `top` back, and an absolutely positioned box carrying BOTH insets is
      // stretched to its container instead of shrinking to its table: a bottom overlay that stops
      // rendering would go on measuring the whole grid.
      clone.style.bottom = '40px';

      const rail = new OverlayRail(clone, document);

      rail.pin({
        isRtl: false, width: 900, height: 4000, inline: false, block: { pinned: true, edge: 'bottom' },
      });
      rail.release();

      expect(clone.style.bottom).toBe('');
      expect(clone.style.top).toBe('0px');
    });

    it('should report no pinned axis once released', () => {
      const rail = new OverlayRail(clone, document);

      rail.pin({ isRtl: false, width: 900, height: 4000, inline: true, block: { pinned: true, edge: 'top' } });
      rail.release();

      expect(rail.pinsInline()).toBe(false);
      expect(rail.pinsBlock()).toBe(false);
      expect(clone.style.pointerEvents).toBe('');
    });

    it('should release a clone that travels on neither axis', () => {
      const rail = new OverlayRail(clone, document);

      rail.pin({ isRtl: false, width: 900, height: 4000, inline: true, block: { pinned: false, edge: 'top' } });
      rail.pin({
        isRtl: false, width: 900, height: 4000, inline: false, block: { pinned: false, edge: 'top' },
      });

      expect(rail.isPinned()).toBe(false);
      expect(clone.parentElement).toBe(wrapper);
    });
  });

  it('should not pin a clone that is not in the document tree', () => {
    const detached = document.createElement('div');
    const rail = new OverlayRail(detached, document);

    rail.pin({ isRtl: false, width: 900, height: 4000, inline: true, block: { pinned: false, edge: 'top' } });

    expect(rail.isPinned()).toBe(false);
    expect(detached.parentElement).toBeNull();
  });

  describe('railCarriesAxis', () => {
    it('should answer for the axis the overlay names, not the other one', () => {
      const rail = new OverlayRail(clone, document);

      rail.pin({ isRtl: false, width: 900, height: 4000, inline: true, block: { pinned: false, edge: 'top' } });

      expect(railCarriesAxis(rail, 'inline')).toBe(true);
      expect(railCarriesAxis(rail, 'block')).toBe(false);

      rail.pin({ isRtl: false, width: 900, height: 4000, inline: false, block: { pinned: true, edge: 'top' } });

      expect(railCarriesAxis(rail, 'inline')).toBe(false);
      expect(railCarriesAxis(rail, 'block')).toBe(true);
    });

    it('should carry no axis for an overlay that names none, whatever the rail holds', () => {
      // The corners travel both axes and name neither. Reading the answer for one of them would tell
      // a caller asking about the whole clone that the layout already carries its offset.
      const rail = new OverlayRail(clone, document);

      rail.pin({ isRtl: false, width: 900, height: 4000, inline: true, block: { pinned: true, edge: 'top' } });

      expect(railCarriesAxis(rail, null)).toBe(false);
    });

    it('should carry no axis without a rail', () => {
      expect(railCarriesAxis(null, 'inline')).toBe(false);
      expect(railCarriesAxis(null, 'block')).toBe(false);
      expect(railCarriesAxis(null, null)).toBe(false);
    });
  });
});
