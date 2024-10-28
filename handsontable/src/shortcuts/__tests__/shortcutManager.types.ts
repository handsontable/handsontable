import Handsontable from 'handsontable';

const elem = document.createElement('div');
const hot = new Handsontable(elem, {});
const shortcutManager = hot.getShortcutManager();
const context = shortcutManager.addContext('contextName');

shortcutManager.setActiveContextName('contextName');
shortcutManager.getActiveContextName();
shortcutManager.getContext('contextName');
shortcutManager.isCtrlPressed();
shortcutManager.destroy();

const shortcut = { group: 'group', keys: [['control/meta', 'a']], callback: () => {} };
const withAllOptions = {
  group: 'group2',
  keys: [['control/meta', 'a']],
  callback: () => {},
  runOnlyIf: () => false,
  captureCtrl: true,
  preventDefault: true,
  stopPropagation: false,
  relativeToGroup: 'group2',
  position: 'before' as const,
  forwardToContext: context,
};
const minimalSetup = {
  group: 'group3',
  keys: [['control/meta', 'z']],
  callback: () => {},
};

context.addShortcut(shortcut);
context.addShortcut(withAllOptions);
context.addShortcut(minimalSetup);
context.addShortcuts([shortcut]);
context.addShortcuts([withAllOptions]);
context.addShortcuts([minimalSetup]);
context.getShortcuts(['control/meta', 'a']);
context.hasShortcut(['control/meta', 'a']);
context.removeShortcutsByKeys(['control/meta', 'a']);
context.removeShortcutsByGroup('group');
