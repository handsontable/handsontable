import { InlineStartRail, INLINE_START_RAIL_CLASS_NAME } from '../../../src/overlay/inlineStartRail';

describe('InlineStartRail', () => {
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
    wrapper.remove();
  });

  it('should move the clone into a table-wide rail at the place the clone stood', () => {
    const rail = new InlineStartRail(clone, document);

    rail.pin(12050, false, { edge: 'top' });

    const railElement = clone.parentElement!;

    expect(rail.isPinned()).toBe(true);
    expect(railElement.className).toBe(INLINE_START_RAIL_CLASS_NAME);
    expect(railElement.parentElement).toBe(wrapper);
    // Same slot among the siblings, so tree order (and with it the paint order) is unchanged.
    expect([...wrapper.children]).toEqual([master, railElement, nextSibling]);
    expect(railElement.style.position).toBe('absolute');
    expect(railElement.style.width).toBe('12050px');
  });

  it('should give the rail no height, so it covers nothing', () => {
    const rail = new InlineStartRail(clone, document);

    rail.pin(900, false, { edge: 'top' });

    expect(clone.parentElement!.style.height).toBe('0px');
  });

  it('should pin the clone with sticky positioning and no vertical inset', () => {
    // A vertical inset on a sticky box is a sticky constraint too: `top: 0` would pin the row headers
    // to the viewport top as the page scrolls down.
    const rail = new InlineStartRail(clone, document);

    rail.pin(900, false, { edge: 'top' });

    expect(clone.style.position).toBe('sticky');
    expect(clone.style.left).toBe('0px');
    expect(clone.style.right).toBe('');
    expect(clone.style.top).toBe('');
    expect(clone.style.bottom).toBe('');
    expect(clone.parentElement!.style.top).toBe('0px');
    expect(clone.parentElement!.style.left).toBe('0px');
  });

  it('should pin to the right edge in RTL', () => {
    const rail = new InlineStartRail(clone, document);

    rail.pin(900, true, { edge: 'top' });

    const railElement = clone.parentElement!;

    expect(clone.style.right).toBe('0px');
    expect(clone.style.left).toBe('');
    expect(railElement.style.right).toBe('0px');
    expect(railElement.style.left).toBe('');
  });

  it('should hang a bottom-anchored clone so that its bottom edge lands at the offset', () => {
    // The rail has no height, so its bottom edge is the line the clone's TOP hangs from: the clone
    // ends `height` below it, which must be `offset` above the wrapper's bottom.
    const rail = new InlineStartRail(clone, document);

    rail.pin(900, false, { edge: 'bottom', offset: 16, height: 58 });

    const railElement = clone.parentElement!;

    expect(railElement.style.bottom).toBe('74px');
    expect(railElement.style.top).toBe('');
  });

  it('should update the rail in place on a repeated pin', () => {
    const rail = new InlineStartRail(clone, document);

    rail.pin(900, false, { edge: 'bottom', offset: 0, height: 30 });

    const railElement = clone.parentElement!;

    rail.pin(1500, false, { edge: 'top' });

    expect(clone.parentElement).toBe(railElement);
    expect(wrapper.querySelectorAll(`.${INLINE_START_RAIL_CLASS_NAME}`)).toHaveLength(1);
    expect(railElement.style.width).toBe('1500px');
    expect(railElement.style.top).toBe('0px');
    expect(railElement.style.bottom).toBe('');
  });

  it('should put the clone back in the rail\'s slot, positioned as the clone factory made it', () => {
    const rail = new InlineStartRail(clone, document);

    rail.pin(900, false, { edge: 'top' });
    rail.release();

    expect(rail.isPinned()).toBe(false);
    expect([...wrapper.children]).toEqual([master, clone, nextSibling]);
    expect(wrapper.querySelector(`.${INLINE_START_RAIL_CLASS_NAME}`)).toBeNull();
    expect(clone.style.position).toBe('absolute');
    expect(clone.style.top).toBe('0px');
  });

  it('should do nothing on a release while not pinned', () => {
    const rail = new InlineStartRail(clone, document);

    rail.release();

    expect(clone.parentElement).toBe(wrapper);
    expect(clone.style.position).toBe('absolute');
  });

  it('should pin again after a release', () => {
    const rail = new InlineStartRail(clone, document);

    rail.pin(900, false, { edge: 'top' });
    rail.release();
    rail.pin(900, false, { edge: 'top' });

    expect(rail.isPinned()).toBe(true);
    expect(clone.parentElement!.className).toBe(INLINE_START_RAIL_CLASS_NAME);
    expect(wrapper.querySelectorAll(`.${INLINE_START_RAIL_CLASS_NAME}`)).toHaveLength(1);
  });

  it('should not pin a clone that is not in the document tree', () => {
    const detached = document.createElement('div');
    const rail = new InlineStartRail(detached, document);

    rail.pin(900, false, { edge: 'top' });

    expect(rail.isPinned()).toBe(false);
    expect(detached.parentElement).toBeNull();
  });
});
