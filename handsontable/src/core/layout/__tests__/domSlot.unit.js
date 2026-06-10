import { DomSlot } from '../domSlot';

describe('DomSlot', () => {
  function setup() {
    const parent = document.createElement('div');
    const make = (id) => {
      const el = document.createElement('div');

      el.dataset.id = id;

      return el;
    };

    return { parent, make };
  }

  const ids = parent => Array.from(parent.children).map(c => c.dataset.id);

  it('appends added elements into the parent', () => {
    const { parent, make } = setup();
    const slot = new DomSlot(parent);

    slot.add('a', make('a'));

    expect(parent.children.length).toBe(1);
    expect(slot.has('a')).toBe(true);
    expect(slot.getElement()).toBe(parent);
  });

  it('orders elements by ascending weight', () => {
    const { parent, make } = setup();
    const slot = new DomSlot(parent);

    slot.add('b', make('b'), 200);
    slot.add('a', make('a'), 100);
    slot.add('c', make('c'), 300);

    expect(ids(parent)).toEqual(['a', 'b', 'c']);
  });

  it('breaks weight ties by insertion order', () => {
    const { parent, make } = setup();
    const slot = new DomSlot(parent);

    slot.add('x', make('x'), 100);
    slot.add('y', make('y'), 100);

    expect(ids(parent)).toEqual(['x', 'y']);
  });

  it('places configured keys first in their configured order, others after by weight', () => {
    const { parent, make } = setup();
    const slot = new DomSlot(parent);

    slot.add('a', make('a'), 100);
    slot.add('b', make('b'), 200);
    slot.add('c', make('c'), 300);
    slot.setOrder(['c', 'a']);

    expect(ids(parent)).toEqual(['c', 'a', 'b']);
  });

  it('removes elements and detaches them from the DOM', () => {
    const { parent, make } = setup();
    const slot = new DomSlot(parent);
    const a = make('a');

    slot.add('a', a, 100);
    slot.add('b', make('b'), 200);
    slot.remove('a');

    expect(slot.has('a')).toBe(false);
    expect(a.parentNode).toBe(null);
    expect(ids(parent)).toEqual(['b']);
  });

  it('replaces the element when the same key is added again', () => {
    const { parent, make } = setup();
    const slot = new DomSlot(parent);
    const first = make('a1');
    const second = make('a2');

    slot.add('a', first, 100);
    slot.add('a', second, 100);

    expect(first.parentNode).toBe(null);
    expect(ids(parent)).toEqual(['a2']);
  });

  it('clears all registered elements', () => {
    const { parent, make } = setup();
    const slot = new DomSlot(parent);

    slot.add('a', make('a'));
    slot.add('b', make('b'));
    slot.clear();

    expect(parent.children.length).toBe(0);
    expect(slot.has('a')).toBe(false);
  });

  it('keeps a replaced element in its original position within a weight tie group', () => {
    const { parent, make } = setup();
    const slot = new DomSlot(parent);

    slot.add('a', make('a'), 100);
    slot.add('b', make('b'), 100);
    slot.add('c', make('c'), 100);
    slot.add('b', make('b2'), 100);

    expect(ids(parent)).toEqual(['a', 'b2', 'c']);
  });

  it('returns the resolved key order', () => {
    const { parent, make } = setup();
    const slot = new DomSlot(parent);

    slot.add('a', make('a'), 200);
    slot.add('b', make('b'), 100);

    expect(slot.getOrder()).toEqual(['b', 'a']);
  });

  it('does nothing when removing an unregistered key', () => {
    const { parent, make } = setup();
    const slot = new DomSlot(parent);

    slot.add('a', make('a'));

    expect(() => slot.remove('missing')).not.toThrow();
    expect(slot.has('a')).toBe(true);
  });

  it('adds the itemClass to each element and removes it on remove', () => {
    const { parent, make } = setup();
    const slot = new DomSlot(parent, { itemClass: 'ht-slot-element' });
    const a = make('a');
    const b = make('b');

    slot.add('a', a, 100);
    slot.add('b', b, 200);

    // The elements themselves are the slot items - no wrapper is created.
    expect(parent.children[0]).toBe(a);
    expect(parent.children[1]).toBe(b);
    expect(a.classList.contains('ht-slot-element')).toBe(true);
    expect(b.classList.contains('ht-slot-element')).toBe(true);

    slot.remove('a');

    expect(a.classList.contains('ht-slot-element')).toBe(false);
    expect(a.parentNode).toBe(null);
  });

  it('applies configured order to elements added after setOrder', () => {
    const { parent, make } = setup();
    const slot = new DomSlot(parent);

    slot.setOrder(['b', 'a']);
    slot.add('a', make('a'), 100);
    slot.add('b', make('b'), 200);

    expect(ids(parent)).toEqual(['b', 'a']);
  });

  it('tolerates a non-array order (malformed `layout` setting) and falls back to weight', () => {
    const { parent, make } = setup();
    const slot = new DomSlot(parent);

    slot.add('a', make('a'), 200);
    slot.add('b', make('b'), 100);

    expect(() => slot.setOrder('not-an-array')).not.toThrow();
    expect(ids(parent)).toEqual(['b', 'a']);
  });
});
