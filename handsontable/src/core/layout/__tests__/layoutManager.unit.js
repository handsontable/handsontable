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

  it('clears all slots on destroy', () => {
    const { manager, beforeGrid } = setup();

    manager.getSlot('beforeGrid').add('x', make('x'));
    manager.destroy();

    expect(beforeGrid.children.length).toBe(0);
  });
});
