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
const shortcut2 = {
  group: 'group2',
  keys: [['control/meta', 'a']],
  callback: () => {},
  runOnlyIf: () => false,
  preventDefault: true,
  stopPropagation: false,
  relativeToGroup: 'group2',
  position: 'before' as const,
};

context.addShortcut(shortcut);
context.addShortcut(shortcut2);
context.addShortcuts([shortcut]);
context.addShortcuts([shortcut2]);
context.getShortcuts();
context.hasShortcut(['control/meta', 'a']);
context.removeShortcutsByKeys(['control/meta', 'a']);
context.removeShortcutsByGroup('group');
