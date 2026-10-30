import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Comments, META_COMMENT_VALUE, META_READONLY } from '../comments';
import DisplaySwitch from '../displaySwitch';

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

  it('registers the display switch listeners once, however many times it is enabled', () => {
    const addLocalHook = jest.spyOn(DisplaySwitch.prototype, 'addLocalHook');

    hot = new Handsontable(container, {
      data: [['a']],
      comments: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.updateSettings({ comments: false });
    hot.updateSettings({ comments: true });
    hot.updateSettings({ comments: false });
    hot.updateSettings({ comments: true });

    const keys = addLocalHook.mock.calls.map(([key]) => key);

    expect(keys.filter(key => key === 'hide')).toHaveLength(1);
    expect(keys.filter(key => key === 'show')).toHaveLength(1);

    addLocalHook.mockRestore();
  });

  it('keeps hiding the editor on theme changes after a disable/enable round trip', () => {
    hot = new Handsontable(container, {
      data: [['a']],
      comments: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.updateSettings({ comments: false });
    hot.updateSettings({ comments: true });

    const hide = jest.spyOn(hot.getPlugin('comments'), 'hide');

    hot.runHooks('afterSetTheme', 'ht-theme-main', false);

    expect(hide).toHaveBeenCalledTimes(1);
  });

  describe('reading comments at header coordinates', () => {
    beforeEach(() => {
      hot = new Handsontable(container, {
        data: [['a', 'b'], ['c', 'd']],
        comments: true,
        cell: [{ row: 0, col: 0, comment: { value: 'Foo' } }],
        licenseKey: 'non-commercial-and-evaluation',
      });
    });

    it('returns undefined from getCommentAtCell() for a negative row or column', () => {
      const plugin = hot.getPlugin('comments');

      expect(() => plugin.getCommentAtCell(-1, 0)).not.toThrow();
      expect(plugin.getCommentAtCell(-1, 0)).toBeUndefined();
      expect(plugin.getCommentAtCell(0, -1)).toBeUndefined();
      expect(plugin.getCommentAtCell(-1, -1)).toBeUndefined();
    });

    it('returns undefined from getCommentMeta() for a negative row or column', () => {
      const plugin = hot.getPlugin('comments');

      expect(plugin.getCommentMeta(-1, 0, META_COMMENT_VALUE)).toBeUndefined();
      expect(plugin.getCommentMeta(0, -1, META_READONLY)).toBeUndefined();
    });

    it('returns undefined from getComment() when the range points at a header', () => {
      const plugin = hot.getPlugin('comments');

      plugin.setRange({ from: hot._createCellCoords(-1, 0) });

      expect(plugin.getComment()).toBeUndefined();

      plugin.setRange({ from: hot._createCellCoords(0, -1) });

      expect(plugin.getComment()).toBeUndefined();
    });

    it('keeps throwing from the write side for a header', () => {
      const plugin = hot.getPlugin('comments');

      expect(() => plugin.setCommentAtCell(-1, 0, 'x')).toThrow();
      expect(() => plugin.updateCommentMeta(0, -1, { [META_READONLY]: true })).toThrow();
      expect(() => plugin.removeCommentAtCell(-1, -1)).toThrow();
    });

    it('does not switch the shortcut context when the editor is focused on a header range', () => {
      const plugin = hot.getPlugin('comments');

      plugin.setRange({ from: hot._createCellCoords(-1, 0) });
      plugin.getEditorInputElement().dispatchEvent(new Event('focus'));

      expect(hot.getShortcutManager().getActiveContextName()).toBe('grid');
    });

    it('hides the open editor on undo when the range points at a header', () => {
      const plugin = hot.getPlugin('comments');

      plugin.showAtCell(0, 0);
      plugin.setRange({ from: hot._createCellCoords(-1, 0) });

      expect(() => hot.runHooks('afterUndo', {})).not.toThrow();
      expect(plugin.getEditorInputElement().parentNode.style.display).toBe('none');
    });

    it('still returns the comment of a regular cell', () => {
      expect(hot.getPlugin('comments').getCommentAtCell(0, 0)).toBe('Foo');
    });
  });
});
