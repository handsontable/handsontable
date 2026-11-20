import { command } from '../editor/closeWithoutSaving';
import type { HotInstance } from '../../../../core/types';

/**
 * Builds the slice of an instance the command reads, with a real focused element so the active element
 * the command inspects is a real one.
 */
function createHot({ focusMode, hasBrowserFocus, focused }: {
  focusMode: 'cell' | 'mixed',
  hasBrowserFocus: boolean,
  focused: 'textarea' | 'td',
}) {
  const element = document.createElement(focused);

  if (focused === 'td') {
    element.tabIndex = -1;
  }

  document.body.appendChild(element);
  element.focus();

  const editor = { focus: jest.fn() };
  const focusManager = {
    getFocusMode: () => focusMode,
    hasBrowserFocus: () => hasBrowserFocus,
    focusOnHighlightedCell: jest.fn(),
  };
  const editorManager = {
    activeEditor: editor,
    closeEditorAndRestoreOriginalValue: jest.fn(),
  };
  const hot = {
    rootDocument: document,
    _getEditorManager: () => editorManager,
    getFocusManager: () => focusManager,
    getShortcutManager: () => ({ isCtrlPressed: () => false }),
  } as unknown as HotInstance;

  return { hot, editor, focusManager, editorManager, element };
}

describe('editorCloseWithoutSaving', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('closes the editor and restores the original value', () => {
    const { hot, editorManager } = createHot({ focusMode: 'cell', hasBrowserFocus: true, focused: 'textarea' });

    command.callback(hot);

    expect(editorManager.closeEditorAndRestoreOriginalValue).toHaveBeenCalledWith(false);
  });

  it('moves the focus to the highlighted cell when it is still on the editor field (cell focus mode)', () => {
    const { hot, editor, focusManager } = createHot({ focusMode: 'cell', hasBrowserFocus: true, focused: 'textarea' });

    command.callback(hot);

    expect(focusManager.focusOnHighlightedCell).toHaveBeenCalledTimes(1);
    expect(editor.focus).not.toHaveBeenCalled();
  });

  it('leaves the focus alone when it is not on an input', () => {
    const { hot, focusManager } = createHot({ focusMode: 'cell', hasBrowserFocus: true, focused: 'td' });

    command.callback(hot);

    expect(focusManager.focusOnHighlightedCell).not.toHaveBeenCalled();
  });

  it('leaves the focus alone when the browser focus is outside the grid', () => {
    const { hot, focusManager } = createHot({ focusMode: 'cell', hasBrowserFocus: false, focused: 'textarea' });

    command.callback(hot);

    expect(focusManager.focusOnHighlightedCell).not.toHaveBeenCalled();
  });

  it('keeps the focus on the editor field in the mixed focus mode (imeFastEdit)', () => {
    const { hot, editor, focusManager } = createHot({ focusMode: 'mixed', hasBrowserFocus: true, focused: 'textarea' });

    command.callback(hot);

    expect(editor.focus).toHaveBeenCalledTimes(1);
    expect(focusManager.focusOnHighlightedCell).not.toHaveBeenCalled();
  });
});
