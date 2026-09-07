import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Comments } from '../comments';

describe('Comments plugin lifecycle', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(Comments);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('can be switched off and on again', () => {
    hot = new Handsontable(container, {
      data: [['a']],
      comments: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    // The plugin owns a shortcut context, and the manager has no way to drop one — so a second
    // enable has to reuse the context rather than claim it again.
    expect(() => {
      hot.updateSettings({ comments: false });
      hot.updateSettings({ comments: true });
      hot.updateSettings({ comments: false });
      hot.updateSettings({ comments: true });
    }).not.toThrow();

    expect(hot.getPlugin('comments').enabled).toBe(true);
  });

  it('leaves one copy of its shortcuts behind after a re-enable', () => {
    hot = new Handsontable(container, {
      data: [['a']],
      comments: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const context = () => hot.getShortcutManager().getContext('plugin:comments');
    const before = context().getShortcuts(['Escape']).length;

    hot.updateSettings({ comments: false });
    hot.updateSettings({ comments: true });

    expect(context().getShortcuts(['Escape']).length).toBe(before);
  });

  it('hands the keyboard back to the grid when disabled while its editor has focus', () => {
    hot = new Handsontable(container, {
      data: [['a']],
      comments: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const manager = hot.getShortcutManager();

    hot.getPlugin('comments').showAtCell(0, 0);
    manager.setActiveContextName('plugin:comments');

    hot.updateSettings({ comments: false });

    expect(manager.getActiveContextName()).toBe('grid');
  });
});
