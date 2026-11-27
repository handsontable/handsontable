import { createFocusScopeManager, refreshFocusCatchers } from '../scopeManager';
import type { FocusScopeManager } from '../scopeManager';
import type { HotInstance } from '../../core/types';

/**
 * Builds the smallest instance the scope manager reads: a shortcut manager that remembers the active
 * context, and the document and window the event listener and the focus catchers attach to.
 *
 * The grid's root element is built too, but it is not placed in the container: a test that wants the
 * grid scope's layout appends it there before it registers the scope.
 *
 * @returns {{ manager: FocusScopeManager, container: HTMLElement, root: HTMLElement,
 * getActiveContextName: function(): string, setActiveContextName: function(string): void }}
 */
function makeManager() {
  const wrapper = document.createElement('div');
  const container = document.createElement('div');
  const root = document.createElement('div');

  const portal = document.createElement('div');

  root.className = 'ht-wrapper handsontable';
  root.setAttribute('role', 'treegrid');
  wrapper.appendChild(container);
  document.body.appendChild(wrapper);
  document.body.appendChild(portal);

  let activeContextName = 'grid';
  const context = { setFallbackContext: jest.fn() };
  const hot = {
    rootDocument: document,
    rootWindow: window,
    rootElement: root,
    rootWrapperElement: wrapper,
    rootPortalElement: portal,
    getShortcutManager: () => ({
      getOrCreateContext: () => context,
      getContext: () => context,
      getActiveContextName: () => activeContextName,
      setActiveContextName: (name: string) => {
        activeContextName = name;
      },
    }),
    listen: jest.fn(),
    unlisten: jest.fn(),
  } as unknown as HotInstance;

  return {
    hot,
    portal,
    root,
    manager: createFocusScopeManager(hot),
    container,
    getActiveContextName: () => activeContextName,
    setActiveContextName: (name: string) => {
      activeContextName = name;
    },
  };
}

describe('FocusScopeManager#activateScope', () => {
  let manager: FocusScopeManager;
  let onActivate: jest.Mock;

  beforeEach(() => {
    const made = makeManager();

    manager = made.manager;
    onActivate = jest.fn();

    manager.registerScope('grid', made.container, { onActivate });
  });

  afterEach(() => {
    manager.destroy();
    document.body.replaceChildren();
  });

  it('should call `onActivate` once when the scope is activated twice from an unknown source', () => {
    manager.activateScope('grid');
    manager.activateScope('grid');

    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('should call `onActivate` once when the scope is activated twice by a click', () => {
    manager.activateScope('grid', 'click');
    manager.activateScope('grid', 'click');

    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('should call `onActivate` again for a scope already active when the focus returns through the top catcher', () => {
    manager.activateScope('grid', 'tab_from_above');
    manager.activateScope('grid', 'tab_from_above');

    expect(onActivate).toHaveBeenCalledTimes(2);
    expect(onActivate).toHaveBeenLastCalledWith('tab_from_above');
    expect(manager.getActiveScopeId()).toBe('grid');
  });

  it('should call `onActivate` again for a scope already active when the focus returns through the bottom catcher', () => {
    manager.activateScope('grid', 'tab_from_below');
    manager.activateScope('grid', 'tab_from_below');

    expect(onActivate).toHaveBeenCalledTimes(2);
    expect(onActivate).toHaveBeenLastCalledWith('tab_from_below');
  });

  it('should keep ignoring repeated `click` and `unknown` activations after a Tab re-entry', () => {
    manager.activateScope('grid', 'tab_from_above');
    manager.activateScope('grid', 'tab_from_above');
    manager.activateScope('grid', 'click');
    manager.activateScope('grid');

    expect(onActivate).toHaveBeenCalledTimes(2);
  });

  it('should deactivate the previously active scope when another scope is entered through a catcher', () => {
    const otherContainer = document.createElement('div');
    const onDeactivate = jest.fn();
    const onActivateOther = jest.fn();

    document.body.appendChild(otherContainer);
    manager.registerScope('other', otherContainer, { onActivate: onActivateOther, onDeactivate });
    manager.activateScope('other');
    manager.activateScope('grid', 'tab_from_above');

    expect(onDeactivate).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(manager.getActiveScopeId()).toBe('grid');
  });

  it('should leave the shortcuts context alone on a Tab re-entry and keep the displaced name', () => {
    const made = makeManager();
    const onDeactivate = jest.fn();

    try {
      made.manager.registerScope('plugin', made.container, {
        shortcutsContextName: 'plugin',
        onDeactivate,
      });
      made.manager.activateScope('plugin', 'tab_from_above');

      // Something else takes the keyboard while the focus is away, an editor left open for example.
      made.setActiveContextName('editor');
      made.manager.activateScope('plugin', 'tab_from_above');

      expect(made.getActiveContextName()).toBe('editor');
      expect(onDeactivate).not.toHaveBeenCalled();

      made.setActiveContextName('plugin');
      made.manager.deactivateScope('plugin');

      expect(onDeactivate).toHaveBeenCalledTimes(1);
      expect(made.getActiveContextName()).toBe('grid');
    } finally {
      made.manager.destroy();
    }
  });
});

describe('FocusScopeManager focus catchers', () => {
  let manager: FocusScopeManager;
  let container: HTMLElement;
  let portal: HTMLElement;
  let hot: HotInstance;

  const catchers = () => Array.from(document.querySelectorAll<HTMLElement>('.htFocusCatcher'));
  const focusIn = (parent: HTMLElement, host: HTMLElement) => {
    const target = document.createElement('div');

    target.tabIndex = -1;
    parent.appendChild(target);
    host.appendChild(parent);
    target.focus();

    return target;
  };
  const makeMenu = () => {
    const menu = document.createElement('div');

    menu.className = 'htMenu';

    return menu;
  };

  beforeEach(() => {
    const made = makeManager();

    manager = made.manager;
    container = made.container;
    portal = made.portal;
    hot = made.hot;
    manager.registerScope('grid', container);
    manager.activateScope('grid');
  });

  afterEach(() => {
    manager.destroy();
    document.body.replaceChildren();
  });

  it('should arm the catchers while the focus is outside the active scope (control)', () => {
    focusIn(document.createElement('div'), document.body);
    manager.deactivateScope('grid');

    expect(catchers()).toHaveLength(2);
    expect(catchers().map(catcher => catcher.tabIndex)).toEqual([0, 0]);
  });

  it('should keep the catchers out of the Tab order while a menu of the instance holds the focus', () => {
    focusIn(makeMenu(), portal);
    manager.deactivateScope('grid');

    expect(catchers().map(catcher => catcher.tabIndex)).toEqual([-1, -1]);
  });

  it('should keep them armed while a menu of another instance holds the focus', () => {
    focusIn(makeMenu(), document.body);
    manager.deactivateScope('grid');

    expect(catchers().map(catcher => catcher.tabIndex)).toEqual([0, 0]);
  });

  it('should arm them again when the menu is gone and the focus fell outside every scope', () => {
    const target = focusIn(makeMenu(), portal);

    manager.deactivateScope('grid');
    expect(catchers().map(catcher => catcher.tabIndex)).toEqual([-1, -1]);

    target.parentElement!.remove();
    refreshFocusCatchers(hot);

    expect(catchers().map(catcher => catcher.tabIndex)).toEqual([0, 0]);
  });

  it('should leave an instance with no scope manager alone', () => {
    expect(() => refreshFocusCatchers({} as HotInstance)).not.toThrow();
  });
});

describe('FocusScopeManager with the grid root as the Tab entry from above', () => {
  let manager: FocusScopeManager;
  let container: HTMLElement;
  let portal: HTMLElement;
  let root: HTMLElement;
  let onActivate: jest.Mock;

  const topCatcher = () => container.firstElementChild as HTMLElement;
  const bottomCatcher = () => container.lastElementChild as HTMLElement;
  const focusOutside = () => {
    const outside = document.createElement('button');

    document.body.appendChild(outside);
    outside.focus();

    return outside;
  };
  const focusCell = () => {
    const cell = document.createElement('div');

    cell.tabIndex = -1;
    root.appendChild(cell);
    cell.focus();

    return cell;
  };

  beforeEach(() => {
    const made = makeManager();

    manager = made.manager;
    container = made.container;
    portal = made.portal;
    root = made.root;
    onActivate = jest.fn();
    container.appendChild(root);
    manager.registerScope('grid', container, { onActivate });
  });

  afterEach(() => {
    manager.destroy();
    document.body.replaceChildren();
  });

  it('should arm the root, not the top catcher, while the focus is outside the grid', () => {
    manager.activateScope('grid');
    focusOutside();
    manager.deactivateScope('grid');

    expect(topCatcher().hasAttribute('tabindex')).toBe(false);
    expect(root.getAttribute('tabindex')).toBe('0');
    expect(root.dataset.htFocusSource).toBe('tab_from_above');
    expect(bottomCatcher().tabIndex).toBe(0);
  });

  it('should take the root out of the Tab order when Tab is pressed with the focus inside the grid', () => {
    manager.activateScope('grid');
    focusOutside();
    manager.deactivateScope('grid');
    focusCell();
    document.documentElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));

    expect(topCatcher().hasAttribute('tabindex')).toBe(false);
    expect(root.hasAttribute('tabindex')).toBe(false);
    expect(root.hasAttribute('data-ht-focus-source')).toBe(false);
    expect(bottomCatcher().tabIndex).toBe(-1);
  });

  it('should activate the grid scope with the `tab_from_above` source when the armed root takes the focus', () => {
    manager.activateScope('grid');
    focusOutside();
    manager.deactivateScope('grid');
    onActivate.mockClear();

    root.focus();

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenCalledWith('tab_from_above');
  });

  it('should re-enter the active scope when the armed root takes the focus', () => {
    manager.activateScope('grid');
    focusOutside();
    manager.activateScope('grid', 'click');
    onActivate.mockClear();
    focusOutside();
    document.documentElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

    root.focus();

    expect(onActivate).toHaveBeenCalledWith('tab_from_above');
  });

  it('should not read a pointer press that focuses the root as a Tab entry', () => {
    manager.activateScope('grid');
    focusOutside();
    manager.deactivateScope('grid');
    onActivate.mockClear();

    root.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    root.focus();
    root.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    root.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenCalledWith('click');
  });

  it('should keep the root out of the Tab order while a menu of the instance holds the focus', () => {
    const menu = document.createElement('div');
    const item = document.createElement('div');

    menu.className = 'htMenu';
    item.tabIndex = -1;
    menu.appendChild(item);
    portal.appendChild(menu);
    manager.activateScope('grid');
    item.focus();
    manager.deactivateScope('grid');

    expect(root.hasAttribute('tabindex')).toBe(false);
    expect(root.hasAttribute('data-ht-focus-source')).toBe(false);
    expect(topCatcher().hasAttribute('tabindex')).toBe(false);
  });

  it('should give the root back with no tabindex and no focus source when the scope is unregistered', () => {
    manager.activateScope('grid');
    focusOutside();
    manager.deactivateScope('grid');
    manager.unregisterScope('grid');

    expect(root.hasAttribute('tabindex')).toBe(false);
    expect(root.hasAttribute('data-ht-focus-source')).toBe(false);
    expect(container.querySelectorAll('.htFocusCatcher')).toHaveLength(0);
  });
});
