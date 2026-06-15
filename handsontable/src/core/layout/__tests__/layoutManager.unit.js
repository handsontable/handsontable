import { LayoutManager } from '../layoutManager';

describe('LayoutManager', () => {
  function setup() {
    const top = document.createElement('div');
    const bottom = document.createElement('div');
    const manager = new LayoutManager({ top, bottom });

    return { manager, top, bottom };
  }

  const ids = parent => Array.from(parent.children).map(c => c.dataset.id);
  const make = (id) => {
    const el = document.createElement('div');

    el.dataset.id = id;

    return el;
  };

  it('exposes a DomSlot per slot name bound to the right element', () => {
    const { manager, bottom } = setup();

    expect(manager.getSlot('bottom').getElement()).toBe(bottom);
  });

  it('throws for an unknown slot name', () => {
    const { manager } = setup();

    expect(() => manager.getSlot('nope')).toThrow();
  });

  it('applies per-slot order from a layout config', () => {
    const { manager, bottom } = setup();

    manager.getSlot('bottom').add('pagination', make('pagination'), 100);
    manager.getSlot('bottom').add('summary', make('summary'), 200);

    manager.applyConfig({ bottom: ['summary', 'pagination'] });

    expect(ids(bottom)).toEqual(['summary', 'pagination']);
  });

  it('falls back to weight order when config omits the slot', () => {
    const { manager, bottom } = setup();

    manager.getSlot('bottom').add('pagination', make('pagination'), 100);
    manager.getSlot('bottom').add('summary', make('summary'), 200);

    manager.applyConfig({});

    expect(ids(bottom)).toEqual(['pagination', 'summary']);
  });

  it('falls back to weight order when config is null or undefined', () => {
    const { manager, bottom } = setup();

    manager.getSlot('bottom').add('pagination', make('pagination'), 100);
    manager.getSlot('bottom').add('summary', make('summary'), 200);

    expect(() => manager.applyConfig(null)).not.toThrow();
    expect(ids(bottom)).toEqual(['pagination', 'summary']);

    expect(() => manager.applyConfig(undefined)).not.toThrow();
    expect(ids(bottom)).toEqual(['pagination', 'summary']);
  });

  it('register places the element into the slot named by side and applies the weight', () => {
    const { manager, top, bottom } = setup();

    manager.register('a', make('a'), { side: 'top' });
    manager.register('b', make('b'), { side: 'bottom' });

    expect(ids(top)).toEqual(['a']);
    expect(ids(bottom)).toEqual(['b']);
  });

  it('register throws for a non-slot side such as the internal overlays layer', () => {
    const { manager } = setup();

    // `overlays` is not a slot (it renders like the grid), so `getSlot('overlays')` is unknown.
    expect(() => manager.register('c', make('c'), { side: 'overlays' })).toThrow();
  });

  it('register orders by weight within a side and the layout config overrides it', () => {
    const { manager, bottom } = setup();

    manager.register('pagination', make('pagination'), { side: 'bottom', weight: 100 });
    manager.register('comments', make('comments'), { side: 'bottom', weight: 200 });

    expect(ids(bottom)).toEqual(['pagination', 'comments']);

    manager.applyConfig({ bottom: ['comments', 'pagination'] });

    expect(ids(bottom)).toEqual(['comments', 'pagination']);
  });

  it('register defaults the weight to 0 when omitted', () => {
    const { manager, bottom } = setup();

    manager.register('first', make('first'), { side: 'bottom' });
    manager.register('second', make('second'), { side: 'bottom', weight: -1 });

    // `second` has a lower weight, so it comes first despite registering later.
    expect(ids(bottom)).toEqual(['second', 'first']);
  });

  it('re-registering under the same key replaces the previous element', () => {
    const { manager, bottom } = setup();

    manager.register('x', make('x1'), { side: 'bottom' });
    manager.register('x', make('x2'), { side: 'bottom' });

    expect(bottom.children.length).toBe(1);
    expect(ids(bottom)).toEqual(['x2']);
  });

  it('unregister detaches the element from the slot named by side', () => {
    const { manager, bottom } = setup();

    manager.register('a', make('a'), { side: 'bottom' });
    manager.register('b', make('b'), { side: 'bottom' });

    manager.unregister('a', 'bottom');

    expect(ids(bottom)).toEqual(['b']);
  });

  it('unregister is a no-op for an unknown key', () => {
    const { manager, bottom } = setup();

    manager.register('a', make('a'), { side: 'bottom' });

    expect(() => manager.unregister('missing', 'bottom')).not.toThrow();
    expect(ids(bottom)).toEqual(['a']);
  });

  it('keeps an unregistered (foreign) trailing element last as registered items are added', () => {
    const { manager, bottom } = setup();

    // Mimic the license notification: a foreign element appended directly to the slot, never
    // registered with the manager. Registered items must always be inserted before it.
    const license = make('license');

    bottom.appendChild(license);

    manager.register('pagination', make('pagination'), { side: 'bottom', weight: 100 });
    manager.register('toolbar', make('toolbar'), { side: 'bottom', weight: 50 });

    expect(ids(bottom)).toEqual(['toolbar', 'pagination', 'license']);
  });

  it('clears all slots on destroy', () => {
    const { manager, top } = setup();

    manager.getSlot('top').add('x', make('x'));
    manager.destroy();

    expect(top.children.length).toBe(0);
  });
});
