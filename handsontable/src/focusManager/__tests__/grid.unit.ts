import { FocusGridManager } from '../grid';
import type { HotInstance } from '../../core/types';

/**
 * Builds the DOM shape the grid renders: a root wrapper hosting layout slots and
 * the grid's root element (which carries the `handsontable` class).
 *
 * @returns {{ manager: FocusGridManager, wrapper: HTMLElement, root: HTMLElement, slotEl: HTMLElement }}
 */
function makeManager() {
  const wrapper = document.createElement('div');
  const slotEl = document.createElement('div');
  const root = document.createElement('div');

  root.className = 'handsontable';
  wrapper.append(slotEl, root);
  document.body.appendChild(wrapper);

  const hot = {
    rootElement: root,
    rootWrapperElement: wrapper,
    rootPortalElement: null,
    rootDocument: document,
  } as unknown as HotInstance;

  return { manager: new FocusGridManager(hot), wrapper, root, slotEl };
}

describe('FocusGridManager.isForeignFocusTarget', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('treats an element inside the root element as internal', () => {
    const { manager, root } = makeManager();
    const cell = document.createElement('td');

    root.appendChild(cell);

    expect(manager.isForeignFocusTarget(cell)).toBe(false);
  });

  it('treats layout-slot UI (inside the wrapper, outside the root element) as internal', () => {
    const { manager, slotEl } = makeManager();
    const barInput = document.createElement('textarea');

    slotEl.appendChild(barInput);

    expect(manager.isForeignFocusTarget(barInput)).toBe(false);
  });

  it('treats an element outside the wrapper as foreign', () => {
    const { manager } = makeManager();
    const outside = document.createElement('input');

    document.body.appendChild(outside);

    expect(manager.isForeignFocusTarget(outside)).toBe(true);
  });

  it('keeps a nested grid inside a cell counting as foreign', () => {
    const { manager, root } = makeManager();
    const cell = document.createElement('td');
    const nestedGridContainer = document.createElement('div');
    const nestedCell = document.createElement('td');

    nestedGridContainer.className = 'handsontable';
    nestedGridContainer.appendChild(nestedCell);
    cell.appendChild(nestedGridContainer);
    root.appendChild(cell);

    expect(manager.isForeignFocusTarget(nestedCell)).toBe(true);
  });

  it('never marks the document body or a null element as foreign', () => {
    const { manager } = makeManager();

    expect(manager.isForeignFocusTarget(null)).toBe(false);
    expect(manager.isForeignFocusTarget(document.body)).toBe(false);
  });
});

describe('FocusGridManager outside-click exemption registry', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('exempts no path while nothing is registered', () => {
    const { manager, slotEl } = makeManager();

    expect(manager.isPathOutsideClickExempt([slotEl, document.body])).toBe(false);
  });

  it('exempts a path through a registered element and stops after it is unregistered', () => {
    const { manager, slotEl, wrapper } = makeManager();
    const bar = document.createElement('div');
    const tab = document.createElement('button');

    bar.appendChild(tab);
    slotEl.appendChild(bar);
    manager.registerOutsideClickExemptElement(bar);

    expect(manager.isPathOutsideClickExempt([tab, bar, slotEl, wrapper])).toBe(true);
    expect(manager.isPathOutsideClickExempt([slotEl, wrapper])).toBe(false);

    manager.unregisterOutsideClickExemptElement(bar);

    expect(manager.isPathOutsideClickExempt([tab, bar, slotEl, wrapper])).toBe(false);
  });

  it('ignores non-element entries of the path', () => {
    const { manager, slotEl } = makeManager();

    manager.registerOutsideClickExemptElement(slotEl);

    expect(manager.isPathOutsideClickExempt([document, window])).toBe(false);
  });
});
