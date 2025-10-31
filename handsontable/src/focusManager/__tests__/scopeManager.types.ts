import Handsontable from 'handsontable';

const element = document.createElement('div');
const hot = new Handsontable(element, {});
const focusScopeManager = hot.getFocusScopeManager();

const activeScopeId: string | null = focusScopeManager.getActiveScopeId();

focusScopeManager.registerScope('test', element);
focusScopeManager.registerScope('test', element, {
  shortcutsContextName: 'test',
});
focusScopeManager.registerScope('test', element, {
  shortcutsContextName: 'test',
  type: 'modal',
  contains: (target: HTMLElement) => {
    return target === element;
  },
  runOnlyIf: () => {
    return true;
  },
  onActivate: (focusSource: 'unknown' | 'click' | 'tab_from_above' | 'tab_from_below') => {
    const _focusSource = focusSource;
  },
  onDeactivate: () => {},
});

focusScopeManager.registerScope('test', element, {
  shortcutsContextName: 'test',
  type: () => 'inline',
});

focusScopeManager.unregisterScope('test');
focusScopeManager.activateScope('test');
focusScopeManager.deactivateScope('test');
