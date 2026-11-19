import { FocusGridManager } from '../grid';
import type { HotInstance } from '../../core/types';
import { Hooks } from '../../core/hooks';

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
function makeDeferredFocusGrid(
  settings: { imeFastEdit?: boolean, wrapper?: HTMLElement, shadowHost?: HTMLElement } = {},
) {
  const root = document.createElement('div');
  const td = document.createElement('td');
  const hooks = Hooks.getSingleton();
  const state = {
    highlight: { row: 50, col: 0 } as { row: number | null, col: number | null } | null,
    rendered: false,
    destroyed: false,
    requested: [] as Array<[number, number]>,
    activeEditor: undefined as unknown,
  };

  root.className = 'handsontable';

  if (settings.wrapper) {
    settings.wrapper.append(root);
    document.body.append(td);

    if (settings.shadowHost) {
      document.body.append(settings.shadowHost);
      settings.shadowHost.attachShadow({ mode: 'open' }).append(settings.wrapper);
    } else {
      document.body.append(settings.wrapper);
    }
  } else {
    document.body.append(root, td);
  }

  jest.spyOn(td, 'focus');

  const hot = {
    rootElement: root,
    rootWrapperElement: settings.wrapper ?? null,
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
    getActiveEditor: () => state.activeEditor,
    getCell: (row: number, col: number) => {
      state.requested.push([row, col]);

      return state.rendered ? td : null;
    },
    runHooks: (key: string, row: number, col: number, element: HTMLElement | null) => element,
    addHook: (key: string, callback: HookCallback) => hooks.add(key, callback, hot as never),
    addHookOnce: (key: string, callback: HookCallback) => hooks.once(key, callback, hot as never),
    removeHook: (key: string, callback: HookCallback) => {
      if (state.destroyed) {
        throw new Error('The "removeHook" method cannot be called on a destroyed instance');
      }

      return hooks.remove(key, callback, hot as never);
    },
  } as unknown as HotInstance;
  const manager = new FocusGridManager(hot);

  manager.init();

  return {
    manager,
    td,
    state,
    count: (key: string) => hooks.getBucket(hot as never).getHooks(key).length,
    addFirst: (key: string, callback: HookCallback) => hooks.add(key, callback, hot as never, -1),
    run: (key: string) => {
      hooks.run(hot as never, key);
    },
    setActiveEditor: (editor: unknown) => {
      state.activeEditor = editor;
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

/**
 * An editor whose commit waits for a validator: open and waiting until the test finishes the edit, which
 * closes it, or reopens it as a rejected value does. Its field sits in the grid's root and holds the focus.
 *
 * @param {HTMLElement} root The grid's root element.
 * @returns {object} The fake editor and the function that finishes its edit.
 */
function makeWaitingEditor(root: HTMLElement) {
  const field = document.createElement('input');
  const listeners = new Set<() => void>();
  const editor = {
    TEXTAREA: field,
    opened: true,
    waiting: true,
    isOpened() {
      return this.opened;
    },
    isWaiting() {
      return this.waiting;
    },
    _addFinishListener: (listener: () => void) => listeners.add(listener),
    _removeFinishListener: (listener: () => void) => listeners.delete(listener),
  };

  root.append(field);
  field.focus();

  return {
    editor,
    field,
    listeners,
    finish(reopened = false) {
      editor.waiting = false;
      editor.opened = reopened;
      [...listeners].forEach(listener => listener());
    },
  };
}

describe('FocusGridManager focus after an editor waiting for its validator', () => {
  /**
   * Builds the deferred-focus grid with a rendered cell and an open editor waiting for its validator.
   *
   * @returns {object} The grid controls and the waiting editor.
   */
  function makeGrid(shadowHost?: HTMLElement, imeFastEdit = false) {
    const wrapper = document.createElement('div');
    const grid = makeDeferredFocusGrid({ wrapper, shadowHost, imeFastEdit });
    const root = wrapper.querySelector('.handsontable') as HTMLElement;
    const waiting = makeWaitingEditor(root);

    grid.state.rendered = true;

    return { grid, waiting, wrapper };
  }

  afterEach(() => {
    document.body.replaceChildren();
    jest.restoreAllMocks();
  });

  it('focuses the highlighted cell once the waiting editor closes', () => {
    const { grid, waiting } = makeGrid();

    grid.setActiveEditor(waiting.editor);
    grid.manager.focusOnHighlightedCell();

    expect(grid.td.focus).not.toHaveBeenCalled();
    expect(waiting.listeners.size).toBe(1);

    waiting.finish();

    expect(grid.td.focus).toHaveBeenCalledTimes(1);
    expect(waiting.listeners.size).toBe(0);
  });

  it('focuses the highlighted cell once the waiting editor closes in a grid inside a shadow root', () => {
    const { grid, waiting } = makeGrid(document.createElement('div'));

    grid.setActiveEditor(waiting.editor);
    grid.manager.focusOnHighlightedCell();
    waiting.finish();

    expect(grid.td.focus).toHaveBeenCalledTimes(1);
  });

  it('adds one finish listener however often the focus is asked for during the wait', () => {
    const { grid, waiting } = makeGrid();

    grid.setActiveEditor(waiting.editor);
    grid.manager.focusOnHighlightedCell();
    grid.manager.focusOnHighlightedCell();

    expect(waiting.listeners.size).toBe(1);

    waiting.finish();

    expect(grid.td.focus).toHaveBeenCalledTimes(1);
  });

  it('leaves the focus on the editor that reopened on a rejected value', () => {
    const { grid, waiting } = makeGrid();

    grid.setActiveEditor(waiting.editor);
    grid.manager.focusOnHighlightedCell();
    waiting.finish(true);

    expect(grid.td.focus).not.toHaveBeenCalled();
    expect(waiting.listeners.size).toBe(0);
  });

  it('leaves the focus on an element outside the grid it moved to during the wait', () => {
    const { grid, waiting } = makeGrid();
    const outside = document.createElement('input');

    document.body.append(outside);
    grid.setActiveEditor(waiting.editor);
    grid.manager.focusOnHighlightedCell();
    outside.focus();
    waiting.finish();

    expect(grid.td.focus).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(outside);
  });

  it('leaves the focus on an element of the root wrapper it moved to during the wait', () => {
    // A side-slot input, a menu in the portal, or the dialog: inside the grid's wrapper, off the editor's field.
    const { grid, waiting, wrapper } = makeGrid();
    const slotInput = document.createElement('input');

    wrapper.prepend(slotInput);
    grid.setActiveEditor(waiting.editor);
    grid.manager.focusOnHighlightedCell();
    slotInput.focus();
    waiting.finish();

    expect(grid.td.focus).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(slotInput);
  });

  it('leaves the focus on another element of the grid it moved to during the wait', () => {
    // An input of a nested grid or a renderer inside the grid's root element, off the editor's field.
    const { grid, waiting, wrapper } = makeGrid();
    const cellInput = document.createElement('input');

    (wrapper.querySelector('.handsontable') as HTMLElement).append(cellInput);
    grid.setActiveEditor(waiting.editor);
    grid.manager.focusOnHighlightedCell();
    cellInput.focus();
    waiting.finish();

    expect(grid.td.focus).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(cellInput);
  });

  it('focuses the highlighted cell once a waiting editor without a TEXTAREA closes (a select editor)', () => {
    const { grid, wrapper } = makeGrid();
    const select = document.createElement('select');
    const listeners = new Set<() => void>();
    const editor = {
      select,
      opened: true,
      waiting: true,
      isOpened() {
        return this.opened;
      },
      isWaiting() {
        return this.waiting;
      },
      _addFinishListener: (listener: () => void) => listeners.add(listener),
      _removeFinishListener: (listener: () => void) => listeners.delete(listener),
    };

    (wrapper.querySelector('.handsontable') as HTMLElement).append(select);
    select.focus();
    grid.setActiveEditor(editor);
    grid.manager.focusOnHighlightedCell();
    editor.waiting = false;
    editor.opened = false;
    [...listeners].forEach(listener => listener());

    expect(grid.td.focus).toHaveBeenCalledTimes(1);
  });

  it('leaves the focus on the body when it was blurred while shown and the editor hid its element at close', () => {
    // A press on a non-focusable part of the page blurs the field during the wait; the close then hides it.
    const { grid, waiting } = makeGrid();

    grid.setActiveEditor(waiting.editor);
    grid.manager.focusOnHighlightedCell();
    waiting.field.blur();
    waiting.field.style.display = 'none';
    waiting.finish();

    expect(grid.td.focus).not.toHaveBeenCalled();
  });

  it('leaves the focus on the body when the editor\'s element is still shown', () => {
    // Nothing hid the element, so something else took the focus off it: a press on the page.
    const { grid, waiting } = makeGrid();

    grid.setActiveEditor(waiting.editor);
    grid.manager.focusOnHighlightedCell();
    waiting.field.blur();
    waiting.finish();

    expect(grid.td.focus).not.toHaveBeenCalled();
  });

  it('compares with the element focused when the wait began, not when the focus was asked for again', () => {
    // A right click selects another cell, which asks for the focus again, and the menu it opens takes it.
    const { grid, waiting, wrapper } = makeGrid();
    const menuItem = document.createElement('button');

    wrapper.append(menuItem);
    grid.setActiveEditor(waiting.editor);
    grid.manager.focusOnHighlightedCell();
    menuItem.focus();
    grid.manager.focusOnHighlightedCell();
    waiting.finish();

    expect(grid.td.focus).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(menuItem);
  });

  it('does not compare a later edit with the element of a finished wait', () => {
    const { grid, waiting, wrapper } = makeGrid();
    const other = document.createElement('input');

    wrapper.append(other);
    grid.setActiveEditor(waiting.editor);
    grid.manager.focusOnHighlightedCell();
    waiting.finish();
    (grid.td.focus as jest.Mock).mockClear();

    // A second wait that starts with the focus on another element.
    other.focus();
    waiting.editor.waiting = true;
    waiting.editor.opened = true;
    grid.manager.focusOnHighlightedCell();
    waiting.field.focus();
    waiting.finish();

    expect(grid.td.focus).not.toHaveBeenCalled();
  });

  it('does not reuse the element of a wait that ended without its finish listeners running', () => {
    const { grid, waiting, wrapper } = makeGrid();
    const other = document.createElement('input');

    wrapper.append(other);
    grid.setActiveEditor(waiting.editor);
    grid.manager.focusOnHighlightedCell();
    // The wait ends without running the finish listeners, and the next edit of the same editor begins.
    waiting.listeners.clear();
    waiting.editor.waiting = false;
    grid.run('afterBeginEditing');

    // The new wait starts, and ends, with the focus on another element of the editor.
    other.focus();
    waiting.editor.waiting = true;
    grid.manager.focusOnHighlightedCell();
    waiting.finish();

    expect(grid.td.focus).toHaveBeenCalledTimes(1);
  });

  it('does not wait for an open editor that is not waiting', () => {
    const { grid, waiting } = makeGrid();

    waiting.editor.waiting = false;
    grid.setActiveEditor(waiting.editor);
    grid.manager.focusOnHighlightedCell();

    expect(waiting.listeners.size).toBe(0);
    expect(grid.td.focus).not.toHaveBeenCalled();
  });

  it('refocuses the editor field with imeFastEdit once the waiting editor closes', () => {
    // The order a commit without a validator produces: the cell focus, then the editor refocus.
    const { grid, waiting } = makeGrid(undefined, true);
    const refocus = jest.spyOn(grid.manager, 'refocusToEditorTextarea').mockImplementation(() => {});

    grid.setActiveEditor(waiting.editor);
    grid.manager.focusOnHighlightedCell();

    expect(refocus).not.toHaveBeenCalled();

    waiting.finish();

    expect(grid.td.focus).toHaveBeenCalledTimes(1);
    expect(refocus).toHaveBeenCalledTimes(1);
    expect((grid.td.focus as jest.Mock).mock.invocationCallOrder[0])
      .toBeLessThan(refocus.mock.invocationCallOrder[0]);
  });

  it('does not refocus the editor field without imeFastEdit once the waiting editor closes', () => {
    const { grid, waiting } = makeGrid();
    const refocus = jest.spyOn(grid.manager, 'refocusToEditorTextarea').mockImplementation(() => {});

    grid.setActiveEditor(waiting.editor);
    grid.manager.focusOnHighlightedCell();
    waiting.finish();

    expect(refocus).not.toHaveBeenCalled();
  });

  it('does not refocus the editor field with imeFastEdit when the focus moved off it during the wait', () => {
    const { grid, waiting, wrapper } = makeGrid(undefined, true);
    const refocus = jest.spyOn(grid.manager, 'refocusToEditorTextarea').mockImplementation(() => {});
    const menuItem = document.createElement('button');

    wrapper.append(menuItem);
    grid.setActiveEditor(waiting.editor);
    grid.manager.focusOnHighlightedCell();
    menuItem.focus();
    waiting.finish();

    expect(refocus).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(menuItem);
  });

  it('refocuses the editor field with imeFastEdit in a grid inside a shadow root', () => {
    const { grid, waiting } = makeGrid(document.createElement('div'), true);
    const refocus = jest.spyOn(grid.manager, 'refocusToEditorTextarea').mockImplementation(() => {});

    grid.setActiveEditor(waiting.editor);
    grid.manager.focusOnHighlightedCell();
    waiting.finish();

    expect(refocus).toHaveBeenCalledTimes(1);
  });

  it('runs nothing when the grid was destroyed during the wait', () => {
    const { grid, waiting } = makeGrid();

    grid.setActiveEditor(waiting.editor);
    grid.manager.focusOnHighlightedCell();
    grid.state.destroyed = true;
    waiting.finish();

    expect(grid.td.focus).not.toHaveBeenCalled();
  });
});
