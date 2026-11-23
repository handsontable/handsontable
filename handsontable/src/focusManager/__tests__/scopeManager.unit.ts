import { createFocusScopeManager, refreshFocusCatchers } from '../scopeManager';
import type { FocusScopeManager } from '../scopeManager';
import type { HotInstance } from '../../core/types';

/**
 * Builds the smallest instance the scope manager reads: a shortcut manager that remembers the active
 * context, and the document and window the event listener and the focus catchers attach to.
 *
 * @returns {{ manager: FocusScopeManager, container: HTMLElement, getActiveContextName: function(): string,
 * setActiveContextName: function(string): void }}
 */
function makeManager() {
  const wrapper = document.createElement('div');
  const container = document.createElement('div');

  const portal = document.createElement('div');

  wrapper.appendChild(container);
  document.body.appendChild(wrapper);
  document.body.appendChild(portal);

  let activeContextName = 'grid';
  const context = { setFallbackContext: jest.fn() };
  const hot = {
    rootDocument: document,
    rootWindow: window,
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
    listening: false,
    listen: jest.fn(function(this: { listening: boolean }) {
      this.listening = true;
    }),
    unlisten: jest.fn(function(this: { listening: boolean }) {
      this.listening = false;
    }),
    isListening() {
      return this.listening;
    },
  } as unknown as HotInstance;

  return {
    hot,
    portal,
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

describe('FocusScopeManager click outside every scope', () => {
  let manager: FocusScopeManager;
  let container: HTMLElement;
  let hot: HotInstance;
  let pageButton: HTMLButtonElement;
  let insideButton: HTMLButtonElement;

  beforeEach(() => {
    const made = makeManager();

    manager = made.manager;
    container = made.container;
    hot = made.hot;
    insideButton = document.createElement('button');
    container.appendChild(insideButton);
    pageButton = document.createElement('button');
    document.body.appendChild(pageButton);
    manager.registerScope('grid', container);
    manager.activateScope('grid');
  });

  afterEach(() => {
    manager.destroy();
    document.body.replaceChildren();
  });

  it('should deactivate the scope and unlisten when the focus was inside before the click and stayed', () => {
    // A toolbar whose mousedown prevents default, or a synthetic click: the focus never moved.
    insideButton.focus();
    manager.activateScope('grid');
    hot.listen();
    (hot.unlisten as jest.Mock).mockClear();

    pageButton.click();

    expect(manager.getActiveScopeId()).toBeNull();
    expect(hot.unlisten).toHaveBeenCalled();
    expect(hot.isListening()).toBe(false);
  });

  it('should keep the scope and listen when the click\'s own handler moved the focus into the scope', () => {
    // A toolbar button whose handler selects a cell (or opens a dialog that focuses its button).
    pageButton.focus();
    manager.activateScope('grid');
    pageButton.addEventListener('click', () => insideButton.focus());
    (hot.unlisten as jest.Mock).mockClear();

    pageButton.click();

    expect(manager.getActiveScopeId()).toBe('grid');
    expect(hot.unlisten).not.toHaveBeenCalled();
    expect(hot.isListening()).toBe(true);
  });

  it('should keep the scope when the handler made the grid listen with the focus already inside', () => {
    // `selectCell()` on the cell that already holds the focus: the focus did not move, but the grid listens.
    insideButton.focus();
    manager.activateScope('grid');
    hot.unlisten();
    pageButton.addEventListener('click', () => hot.listen());

    pageButton.click();

    expect(manager.getActiveScopeId()).toBe('grid');
    expect(hot.isListening()).toBe(true);
  });

  it('should hand the keyboard to the grid the click landed in when the focus stays in another grid', () => {
    const other = makeManager();
    const otherHot = other.hot;
    const otherArea = document.createElement('div');

    other.container.appendChild(otherArea);
    other.manager.registerScope('grid', other.container);

    insideButton.focus();
    manager.activateScope('grid');
    hot.listen();
    (hot.unlisten as jest.Mock).mockClear();

    // A press on grid B's non-cell area: B's mousedown prevents default, so the focus stays in grid A.
    otherArea.click();

    expect(manager.getActiveScopeId()).toBeNull();
    expect(hot.unlisten).toHaveBeenCalled();
    expect(hot.isListening()).toBe(false);
    expect(other.manager.getActiveScopeId()).toBe('grid');
    expect(otherHot.isListening()).toBe(true);

    other.manager.destroy();
  });
});
