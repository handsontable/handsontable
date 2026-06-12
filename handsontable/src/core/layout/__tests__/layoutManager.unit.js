import { LayoutManager } from '../layoutManager';

describe('LayoutManager', () => {
  function setup() {
    const beforeGrid = document.createElement('div');
    const afterGrid = document.createElement('div');
    const overlays = document.createElement('div');
    const manager = new LayoutManager({ beforeGrid, afterGrid, overlays });

    return { manager, beforeGrid, afterGrid, overlays };
  }

  const ids = parent => Array.from(parent.children).map(c => c.dataset.id);
  const make = (id) => {
    const el = document.createElement('div');

    el.dataset.id = id;

    return el;
  };

  it('exposes a DomSlot per slot name bound to the right element', () => {
    const { manager, afterGrid } = setup();

    expect(manager.getSlot('afterGrid').getElement()).toBe(afterGrid);
  });

  it('throws for an unknown slot name', () => {
    const { manager } = setup();

    expect(() => manager.getSlot('nope')).toThrow();
  });

  it('applies per-slot order from a layout config', () => {
    const { manager, afterGrid } = setup();

    manager.getSlot('afterGrid').add('pagination', make('pagination'), 100);
    manager.getSlot('afterGrid').add('licenseNotification', make('licenseNotification'), 200);

    manager.applyConfig({ afterGrid: ['licenseNotification', 'pagination'] });

    expect(ids(afterGrid)).toEqual(['licenseNotification', 'pagination']);
  });

  it('falls back to weight order when config omits the slot', () => {
    const { manager, afterGrid } = setup();

    manager.getSlot('afterGrid').add('pagination', make('pagination'), 100);
    manager.getSlot('afterGrid').add('licenseNotification', make('licenseNotification'), 200);

    manager.applyConfig({});

    expect(ids(afterGrid)).toEqual(['pagination', 'licenseNotification']);
  });

  it('register places the element into the edge slot named by side and applies the weight', () => {
    const { manager, beforeGrid, afterGrid } = setup();

    manager.register('a', make('a'), { side: 'before' });
    manager.register('b', make('b'), { side: 'after' });

    expect(ids(beforeGrid)).toEqual(['a']);
    expect(ids(afterGrid)).toEqual(['b']);
  });

  it('register does not target the overlays slot (overlays use getSlot directly)', () => {
    const { manager, overlays } = setup();

    // `overlays` is not a `LayoutSide`; register falls through to an undefined slot and throws.
    expect(() => manager.register('c', make('c'), { side: 'overlays' })).toThrow();
    expect(ids(overlays)).toEqual([]);
  });

  it('register orders by weight within a side and the layout config overrides it', () => {
    const { manager, afterGrid } = setup();

    manager.register('pagination', make('pagination'), { side: 'after', weight: 100 });
    manager.register('licenseNotification', make('licenseNotification'), { side: 'after', weight: 200 });

    expect(ids(afterGrid)).toEqual(['pagination', 'licenseNotification']);

    manager.applyConfig({ afterGrid: ['licenseNotification', 'pagination'] });

    expect(ids(afterGrid)).toEqual(['licenseNotification', 'pagination']);
  });

  it('register defaults the weight to 0 when omitted', () => {
    const { manager, afterGrid } = setup();

    manager.register('first', make('first'), { side: 'after' });
    manager.register('second', make('second'), { side: 'after', weight: -1 });

    // `second` has a lower weight, so it comes first despite registering later.
    expect(ids(afterGrid)).toEqual(['second', 'first']);
  });

  it('re-registering under the same key replaces the previous element', () => {
    const { manager, afterGrid } = setup();

    manager.register('x', make('x1'), { side: 'after' });
    manager.register('x', make('x2'), { side: 'after' });

    expect(afterGrid.children.length).toBe(1);
    expect(ids(afterGrid)).toEqual(['x2']);
  });

  it('unregister detaches the element from the slot named by side', () => {
    const { manager, afterGrid } = setup();

    manager.register('a', make('a'), { side: 'after' });
    manager.register('b', make('b'), { side: 'after' });

    manager.unregister('a', 'after');

    expect(ids(afterGrid)).toEqual(['b']);
  });

  it('unregister is a no-op for an unknown key', () => {
    const { manager, afterGrid } = setup();

    manager.register('a', make('a'), { side: 'after' });

    expect(() => manager.unregister('missing', 'after')).not.toThrow();
    expect(ids(afterGrid)).toEqual(['a']);
  });

  it('clears all slots on destroy', () => {
    const { manager, beforeGrid } = setup();

    manager.getSlot('beforeGrid').add('x', make('x'));
    manager.destroy();

    expect(beforeGrid.children.length).toBe(0);
  });
});
