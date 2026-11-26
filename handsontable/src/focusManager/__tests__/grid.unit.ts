import { FocusGridManager } from '../grid';
import type { HotInstance } from '../../core/types';
import { Hooks } from '../../core/hooks';
import { registerAsRootInstance } from '../../utils/rootInstance';
import { hasCellChangedSinceAnnounced } from '../../helpers/a11y';

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

type HookCallback = (...args: unknown[]) => unknown;

/**
 * Builds a manager over a minimal instance whose hooks are the real `Hooks` list, so the registration
 * and removal rules of `addHookOnce` and `removeHook` are the product's own. The highlighted cell is
 * not rendered until the test says so.
 *
 * @returns {object} The manager, the fake instance's controls and a `td` standing for the rendered cell.
 */
function makeDeferredFocusGrid(settings: { imeFastEdit?: boolean, root?: boolean } = {}) {
  const root = document.createElement('div');
  const td = document.createElement('td');
  const hooks = Hooks.getSingleton();
  const state = {
    highlight: { row: 50, col: 0 } as { row: number | null, col: number | null } | null,
    rendered: false,
    destroyed: false,
    requested: [] as Array<[number, number]>,
    replacement: null as HTMLElement | null,
  };

  root.className = 'handsontable';
  document.body.append(root);
  root.append(td);
  jest.spyOn(td, 'focus');

  const hot = {
    rootElement: root,
    rootWrapperElement: null,
    rootPortalElement: null,
    rootDocument: document,
    get isDestroyed() {
      return state.destroyed;
    },
    selection: { isCellVisible: () => true },
    getSettings: () => ({ imeFastEdit: settings.imeFastEdit ?? false }),
    getSelectedRangeActive: () => {
      if (state.destroyed) {
        throw new Error('The "getSelectedRangeActive" method cannot be called on a destroyed instance');
      }

      return state.highlight ? { highlight: state.highlight } : undefined;
    },
    getActiveEditor: () => undefined,
    getCell: (row: number, col: number) => {
      state.requested.push([row, col]);

      return state.rendered ? td : null;
    },
    runHooks: (key: string, row: number, col: number, element: HTMLElement | null) => (
      key === 'modifyFocusedElement' && state.replacement ? state.replacement : element
    ),
    addHook: (key: string, callback: HookCallback) => hooks.add(key, callback, hot as never),
    addHookOnce: (key: string, callback: HookCallback) => hooks.once(key, callback, hot as never),
    removeHook: (key: string, callback: HookCallback) => {
      if (state.destroyed) {
        throw new Error('The "removeHook" method cannot be called on a destroyed instance');
      }

      return hooks.remove(key, callback, hot as never);
    },
  } as unknown as HotInstance;

  if (settings.root !== false) {
    registerAsRootInstance(hot);
  }

  const manager = new FocusGridManager(hot);

  manager.init();

  return {
    manager,
    root,
    td,
    state,
    count: (key: string) => hooks.getBucket(hot as never).getHooks(key).length,
    addFirst: (key: string, callback: HookCallback) => hooks.add(key, callback, hot as never, -1),
    run: (key: string) => {
      hooks.run(hot as never, key);
    },
  };
}

describe('FocusGridManager deferred focus', () => {
  afterEach(() => {
    document.body.replaceChildren();
    jest.restoreAllMocks();
  });

  it('keeps one afterScroll listener however often the same unrendered cell is asked for', () => {
    const grid = makeDeferredFocusGrid();

    for (let i = 0; i < 20; i++) {
      grid.manager.focusOnHighlightedCell();
    }

    expect(grid.count('afterScroll')).toBe(1);
  });

  it('replaces the listener when the highlight moves to another unrendered cell', () => {
    const grid = makeDeferredFocusGrid();

    for (let row = 50; row < 70; row++) {
      grid.state.highlight = { row, col: 0 };
      grid.manager.focusOnHighlightedCell();
    }

    expect(grid.count('afterScroll')).toBe(1);

    grid.state.rendered = true;
    grid.state.requested.length = 0;
    grid.run('afterScroll');

    expect(grid.state.requested).toEqual([[69, 0]]);
    expect(grid.td.focus).toHaveBeenCalledTimes(1);
  });

  it('focuses the cell after the scroll when the highlight is still on it', () => {
    const grid = makeDeferredFocusGrid();

    grid.manager.focusOnHighlightedCell();
    grid.state.rendered = true;
    grid.run('afterScroll');

    expect(grid.td.focus).toHaveBeenCalledTimes(1);
    expect(grid.count('afterScroll')).toBe(0);
  });

  it('runs nothing after the scroll when the highlight moved to another cell', () => {
    const grid = makeDeferredFocusGrid();

    grid.manager.focusOnHighlightedCell();
    grid.state.highlight = { row: 0, col: 0 };
    grid.state.rendered = true;
    grid.run('afterScroll');

    expect(grid.td.focus).not.toHaveBeenCalled();
  });

  it.each(['afterSelection', 'afterSelectionFocusSet'])(
    'removes the listener when %s reports a highlight on another cell',
    (hookName) => {
      const grid = makeDeferredFocusGrid();

      grid.manager.focusOnHighlightedCell();
      grid.state.highlight = { row: 0, col: 0 };
      grid.run(hookName);

      expect(grid.count('afterScroll')).toBe(0);
    },
  );

  it.each(['afterSelection', 'afterSelectionFocusSet'])(
    'keeps the listener when %s reports the highlight on the same cell',
    (hookName) => {
      const grid = makeDeferredFocusGrid();

      grid.manager.focusOnHighlightedCell();
      grid.run(hookName);

      expect(grid.count('afterScroll')).toBe(1);
    },
  );

  it('runs a repeated ask of the same caller once, with its latest callback', () => {
    const grid = makeDeferredFocusGrid();

    grid.manager.focusOnHighlightedCell();
    grid.manager.focusOnHighlightedCell();
    grid.manager.focusOnHighlightedCell();
    grid.state.rendered = true;
    grid.run('afterScroll');

    expect(grid.td.focus).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['the cell focus is asked for before the editor refocus', ['afterRender', 'afterSelectionEnd']],
    ['the editor refocus is asked for before the cell focus', ['afterSelectionEnd', 'afterRender']],
  ])('keeps both the cell focus and the editor refocus when %s', (name, hookOrder) => {
    const grid = makeDeferredFocusGrid({ imeFastEdit: true });
    const refocus = jest.spyOn(grid.manager, 'refocusToEditorTextarea').mockImplementation(() => {});

    grid.run('afterSelection');
    hookOrder.forEach(hookName => grid.run(hookName));

    expect(grid.count('afterScroll')).toBe(1);
    expect(grid.td.focus).not.toHaveBeenCalled();
    expect(refocus).not.toHaveBeenCalled();

    grid.state.rendered = true;
    grid.run('afterScroll');

    expect(grid.td.focus).toHaveBeenCalledTimes(1);
    expect(refocus).toHaveBeenCalledTimes(1);
  });

  it('removes the listener when the selection is cleared', () => {
    const grid = makeDeferredFocusGrid();

    grid.manager.focusOnHighlightedCell();
    grid.state.highlight = null;
    grid.run('afterDeselect');

    expect(grid.count('afterScroll')).toBe(0);
  });

  it.each(['afterSelection', 'afterSelectionFocusSet', 'afterSelectionEnd', 'afterDeselect'])(
    'does not throw when a listener that ran before %s destroyed the grid',
    (hookName) => {
      const grid = makeDeferredFocusGrid();

      grid.manager.focusOnHighlightedCell();
      grid.addFirst(hookName, () => {
        grid.state.destroyed = true;
      });

      expect(() => grid.run(hookName)).not.toThrow();
    },
  );

  it('runs nothing after the grid was destroyed', () => {
    const grid = makeDeferredFocusGrid();

    grid.manager.focusOnHighlightedCell();
    grid.state.rendered = true;
    grid.state.destroyed = true;
    grid.run('afterScroll');

    expect(grid.td.focus).not.toHaveBeenCalled();
  });
});

describe('FocusGridManager.keepForeignFocusWhile', () => {
  /**
   * Builds a grid whose highlighted cell is rendered and a focused input outside of it.
   *
   * @returns {object} The grid from `makeDeferredFocusGrid()` and the outside input.
   */
  function makeGridWithOutsideInput() {
    const grid = makeDeferredFocusGrid();
    const input = document.createElement('input');

    grid.state.rendered = true;
    document.body.appendChild(input);
    input.focus();

    return { grid, input };
  }

  afterEach(() => {
    document.body.replaceChildren();
    jest.restoreAllMocks();
  });

  it('keeps the focus on an input outside the grid when the selection is laid again inside the scope', () => {
    const { grid, input } = makeGridWithOutsideInput();
    const blur = jest.spyOn(input, 'blur');

    grid.manager.keepForeignFocusWhile(() => grid.run('afterSelection'));
    grid.run('afterRender');

    expect(document.activeElement).toBe(input);
    expect(blur).not.toHaveBeenCalled();
    expect(grid.td.focus).not.toHaveBeenCalled();
  });

  it('keeps the focus on a button outside the grid, which the suspension does not cover', () => {
    const grid = makeDeferredFocusGrid();
    const button = document.createElement('button');

    grid.state.rendered = true;
    document.body.appendChild(button);
    button.focus();

    grid.manager.keepForeignFocusWhile(() => grid.run('afterSelection'));
    grid.run('afterRender');

    expect(document.activeElement).toBe(button);
    expect(grid.td.focus).not.toHaveBeenCalled();
  });

  it('moves the focus to the cell when the same change is made outside the scope', () => {
    const { grid, input } = makeGridWithOutsideInput();

    grid.run('afterSelection');
    grid.run('afterRender');

    expect(document.activeElement).not.toBe(input);
    expect(grid.td.focus).toHaveBeenCalledTimes(1);
  });

  it('still focuses the cell inside the scope when nothing holds the focus', () => {
    const grid = makeDeferredFocusGrid();

    grid.state.rendered = true;
    (document.activeElement as HTMLElement | null)?.blur();

    grid.manager.keepForeignFocusWhile(() => grid.run('afterSelection'));
    grid.run('afterRender');

    expect(grid.td.focus).toHaveBeenCalledTimes(1);
  });

  it('still focuses the cell inside the scope when the grid held the focus', () => {
    const grid = makeDeferredFocusGrid();
    const inside = document.createElement('input');

    grid.state.rendered = true;
    inside.dataset.hotInput = 'true';
    document.querySelector('.handsontable')?.appendChild(inside);
    inside.focus();

    grid.manager.keepForeignFocusWhile(() => grid.run('afterSelection'));
    grid.run('afterRender');

    expect(grid.td.focus).toHaveBeenCalledTimes(1);
  });

  it('lets a later selection change made outside the scope take the focus', () => {
    const { grid, input } = makeGridWithOutsideInput();

    grid.manager.keepForeignFocusWhile(() => grid.run('afterSelection'));
    grid.run('afterSelection');
    grid.run('afterRender');

    expect(document.activeElement).not.toBe(input);
    expect(grid.td.focus).toHaveBeenCalledTimes(1);
  });

  it('lets an unscoped change that waits for the render keep its right to the focus', () => {
    const { grid, input } = makeGridWithOutsideInput();

    grid.run('afterSelection');
    grid.manager.keepForeignFocusWhile(() => grid.run('afterSelection'));
    grid.run('afterRender');

    expect(document.activeElement).not.toBe(input);
    expect(grid.td.focus).toHaveBeenCalledTimes(1);
  });

  it('keeps the foreign focus when every change that waits for the render is scoped', () => {
    const { grid, input } = makeGridWithOutsideInput();

    grid.manager.keepForeignFocusWhile(() => grid.run('afterSelection'));
    grid.manager.keepForeignFocusWhile(() => grid.run('afterSelection'));
    grid.run('afterRender');

    expect(document.activeElement).toBe(input);
    expect(grid.td.focus).not.toHaveBeenCalled();
  });

  it('applies to the nested scopes and ends with the outermost one', () => {
    const { grid, input } = makeGridWithOutsideInput();

    grid.manager.keepForeignFocusWhile(() => {
      grid.manager.keepForeignFocusWhile(() => {});
      grid.run('afterSelection');
    });
    grid.run('afterRender');

    expect(document.activeElement).toBe(input);

    grid.run('afterSelection');
    grid.run('afterRender');

    expect(grid.td.focus).toHaveBeenCalledTimes(1);
  });

  it('ends the scope when the action throws and returns what the action returns', () => {
    const { grid, input } = makeGridWithOutsideInput();

    expect(grid.manager.keepForeignFocusWhile(() => 42)).toBe(42);
    expect(() => grid.manager.keepForeignFocusWhile(() => {
      throw new Error('boom');
    })).toThrow('boom');

    grid.run('afterSelection');
    grid.run('afterRender');

    expect(document.activeElement).not.toBe(input);
    expect(grid.td.focus).toHaveBeenCalledTimes(1);
  });

  it('leaves the editor input alone in the mixed focus mode while the focus is outside the grid', () => {
    const grid = makeDeferredFocusGrid({ imeFastEdit: true });
    const refocus = jest.spyOn(grid.manager, 'refocusToEditorTextarea').mockImplementation(() => {});
    const input = document.createElement('input');

    grid.state.rendered = true;
    Object.defineProperty(grid.td, 'nodeName', { value: 'TD' });
    document.body.appendChild(input);
    input.focus();

    grid.manager.keepForeignFocusWhile(() => grid.run('afterSelectionEnd'));

    expect(refocus).not.toHaveBeenCalled();

    grid.run('afterSelectionEnd');

    expect(refocus).toHaveBeenCalledTimes(1);
  });
});

describe('FocusGridManager focus on a cell that a reader reads', () => {
  afterEach(() => {
    document.body.replaceChildren();
    jest.restoreAllMocks();
  });

  /**
   * Records what happens to the cell's `role` and when the cell takes the focus.
   *
   * @param {HTMLElement} td The cell.
   * @returns {string[]} The log, filled as the test runs.
   */
  function logRoleAndFocus(td: HTMLElement): string[] {
    const log: string[] = [];

    jest.spyOn(td, 'focus').mockImplementation((options) => {
      log.push('focus');
      HTMLElement.prototype.focus.call(td, options);
    });
    jest.spyOn(td, 'removeAttribute').mockImplementation((name) => {
      log.push(`remove ${name}`);
      Element.prototype.removeAttribute.call(td, name);
    });
    jest.spyOn(td, 'setAttribute').mockImplementation((name, value) => {
      log.push(`set ${name}=${value}`);
      Element.prototype.setAttribute.call(td, name, value);
    });

    return log;
  }

  it('builds a new accessibility object for the cell, then focuses it', () => {
    const grid = makeDeferredFocusGrid();

    grid.td.setAttribute('role', 'gridcell');
    grid.td.tabIndex = -1;
    grid.state.rendered = true;

    const log = logRoleAndFocus(grid.td);

    grid.manager.focusOnHighlightedCell();

    expect(log).toEqual(['remove role', 'set role=gridcell', 'focus']);
  });

  it('leaves a cell that holds the focus already alone', () => {
    const grid = makeDeferredFocusGrid();

    grid.td.setAttribute('role', 'gridcell');
    grid.td.tabIndex = -1;
    grid.td.focus();
    grid.state.rendered = true;

    const log = logRoleAndFocus(grid.td);

    grid.manager.focusOnHighlightedCell();

    expect(log).toEqual(['focus']);
  });

  it('writes no role for a grid that has none (ariaTags: false)', () => {
    const grid = makeDeferredFocusGrid();

    grid.td.tabIndex = -1;
    grid.state.rendered = true;

    const log = logRoleAndFocus(grid.td);

    grid.manager.focusOnHighlightedCell();

    expect(log).toEqual(['focus']);
  });

  it('leaves an element that is not a data cell alone', () => {
    const grid = makeDeferredFocusGrid();
    const th = document.createElement('th');

    th.setAttribute('role', 'columnheader');
    th.tabIndex = -1;
    document.body.append(th);
    grid.state.rendered = true;

    const log = logRoleAndFocus(th);

    grid.manager.focusOnHighlightedCell(th as HTMLTableCellElement);

    expect(log).toEqual(['focus']);
  });

  it('leaves the cell alone when the modifyFocusedElement hook hands the focus to another element', () => {
    const grid = makeDeferredFocusGrid();
    const replacement = document.createElement('div');

    replacement.tabIndex = -1;
    document.body.append(replacement);
    grid.td.setAttribute('role', 'gridcell');
    grid.state.rendered = true;
    grid.state.replacement = replacement;

    const log = logRoleAndFocus(grid.td);

    grid.manager.focusOnHighlightedCell();

    expect(log).toEqual([]);
    expect(document.activeElement).toBe(replacement);
  });

  it('does not rebuild a cell of a grid an editor built, but records it so a change in place is read', () => {
    const grid = makeDeferredFocusGrid({ root: false });

    grid.td.setAttribute('role', 'gridcell');
    grid.td.tabIndex = -1;
    grid.td.innerHTML = '<input type="checkbox">';
    grid.state.rendered = true;

    const log = logRoleAndFocus(grid.td);

    grid.manager.focusOnHighlightedCell();

    expect(log).toEqual(['focus']);

    (grid.td.firstChild as HTMLInputElement).checked = true;

    expect(hasCellChangedSinceAnnounced(grid.td)).toBe(true);
  });

  describe('the focused cell changes while it keeps the focus', () => {
    /**
     * Focuses the highlighted cell, the way the manager does after a selection, so the cell is recorded.
     *
     * @param {object} grid The grid from `makeDeferredFocusGrid()`.
     */
    function focusAndRecord(grid: ReturnType<typeof makeDeferredFocusGrid>) {
      grid.td.setAttribute('role', 'gridcell');
      grid.td.tabIndex = -1;
      grid.td.textContent = 'before';
      grid.state.rendered = true;
      grid.manager.focusOnHighlightedCell();
    }

    it('builds a new accessibility object for a cell that shows something else', () => {
      const grid = makeDeferredFocusGrid();

      focusAndRecord(grid);
      grid.td.textContent = 'after';

      const log = logRoleAndFocus(grid.td);

      grid.run('afterRender');

      expect(log).toEqual(['remove role', 'set role=gridcell']);
    });

    it('builds it once: the next draw of the same state is quiet', () => {
      const grid = makeDeferredFocusGrid();

      focusAndRecord(grid);
      grid.td.textContent = 'after';
      grid.run('afterRender');

      const log = logRoleAndFocus(grid.td);

      grid.run('afterRender');

      expect(log).toEqual([]);
    });

    it('leaves a cell that shows the same thing alone', () => {
      const grid = makeDeferredFocusGrid();

      focusAndRecord(grid);

      const log = logRoleAndFocus(grid.td);

      grid.run('afterRender');

      expect(log).toEqual([]);
    });

    it('builds it for the element the grid drew the selected cell into, which a jump to a new row does', () => {
      const grid = makeDeferredFocusGrid();

      grid.state.highlight = { row: 3, col: 0 };
      focusAndRecord(grid);
      grid.state.highlight = { row: 50, col: 0 };

      const log = logRoleAndFocus(grid.td);

      grid.run('afterRender');

      expect(log).toEqual(['remove role', 'set role=gridcell']);
    });

    it('leaves the element alone when the grid drew a cell into it that is not the selected one', () => {
      const grid = makeDeferredFocusGrid();

      focusAndRecord(grid);
      grid.td.textContent = 'another row';
      grid.state.rendered = false;

      const log = logRoleAndFocus(grid.td);

      grid.run('afterRender');

      expect(log).toEqual([]);
    });

    it('leaves it alone when another element holds the focus', () => {
      const grid = makeDeferredFocusGrid();
      const other = document.createElement('input');

      focusAndRecord(grid);
      grid.td.textContent = 'after';
      document.body.append(other);
      other.focus();

      const log = logRoleAndFocus(grid.td);

      grid.run('afterRender');

      expect(log).toEqual([]);
    });

    it('leaves a cell of a grid nested in one of its cells alone', () => {
      const grid = makeDeferredFocusGrid();
      const nested = document.createElement('div');
      const hostCell = document.createElement('div');

      nested.className = 'handsontable';
      grid.root.append(hostCell);
      hostCell.append(nested);
      nested.append(grid.td);
      focusAndRecord(grid);
      grid.td.textContent = 'after';

      const log = logRoleAndFocus(grid.td);

      grid.run('afterRender');

      expect(log).toEqual([]);
    });

    it('does not depend on the selection class, which a grid with disableVisualSelection never gets', () => {
      const grid = makeDeferredFocusGrid();

      focusAndRecord(grid);
      grid.td.className = '';
      grid.td.textContent = 'after';

      const log = logRoleAndFocus(grid.td);

      grid.run('afterRender');

      expect(log).toEqual(['remove role', 'set role=gridcell']);
    });
  });
});
