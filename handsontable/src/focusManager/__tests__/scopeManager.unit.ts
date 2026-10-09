import { createFocusScopeManager } from '../scopeManager';
import type { FocusScopeManager } from '../scopeManager';
import type { HotInstance } from '../../core/types';

/**
 * Builds the smallest instance the scope manager reads: a shortcut manager that remembers the active
 * context, and the document and window the event listener and the focus catchers attach to.
 *
 * @returns {{ manager: FocusScopeManager, container: HTMLElement, getActiveContextName: function(): string }}
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

  return { manager: createFocusScopeManager(hot), container, getActiveContextName: () => activeContextName };
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
    manager.activateScope('grid', 'click');
    manager.activateScope('grid');

    expect(onActivate).toHaveBeenCalledTimes(1);
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

  it('should not call `onDeactivate` and should keep the displaced context on a Tab re-entry', () => {
    const made = makeManager();
    const onDeactivate = jest.fn();

    made.manager.registerScope('plugin', made.container, {
      shortcutsContextName: 'plugin',
      onDeactivate,
    });
    made.manager.activateScope('plugin', 'tab_from_above');
    made.manager.activateScope('plugin', 'tab_from_above');

    expect(onDeactivate).not.toHaveBeenCalled();

    made.manager.deactivateScope('plugin');

    expect(onDeactivate).toHaveBeenCalledTimes(1);
    expect(made.getActiveContextName()).toBe('grid');
    made.manager.destroy();
  });
});
