import { createFocusScopeManager } from '../scopeManager';
import type { FocusScopeManager } from '../scopeManager';
import type { HotInstance } from '../../core/types';

/**
 * Builds the smallest instance the scope manager reads: a shortcut manager that remembers the active
 * context, and the document and window the event listener and the focus catchers attach to.
 *
 * @returns {{ manager: FocusScopeManager, container: HTMLElement }}
 */
function makeManager() {
  const wrapper = document.createElement('div');
  const container = document.createElement('div');

  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  let activeContextName = 'grid';
  const context = { setFallbackContext: jest.fn() };
  const hot = {
    rootDocument: document,
    rootWindow: window,
    rootWrapperElement: wrapper,
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

  return { manager: createFocusScopeManager(hot), container };
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
});
