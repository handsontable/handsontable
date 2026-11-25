import Handsontable from '../../../index';
import { registerCellType, TextCellType } from '../../../cellTypes';
import { registerEditor, TextEditor } from '../../../editors';
import { registerPlugin } from '../../registry';
import { CopyPaste } from '../copyPaste';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

jest.mock('../../../helpers/browser', () => ({
  ...jest.requireActual('../../../helpers/browser'),
  isSafari: () => true,
}));

registerCellType(TextCellType);
registerEditor(TextEditor);
registerPlugin(CopyPaste);

describe('CopyPaste Safari `mouseleave` workaround', () => {
  let container: HTMLElement;
  let hot: Handsontable;

  const leaveBody = () => {
    document.body.dispatchEvent(new MouseEvent('mouseleave'));
  };

  const cellIsContentEditable = () => hot.getCell(1, 1)?.hasAttribute('contenteditable');

  /**
   * Appends a control to the grid's portal, the element the comment editor and the cell editors live
   * in, and gives it the focus.
   *
   * @param {string} tagName The tag of the control.
   * @param {string} [type] The `type` of an `input`.
   * @param {string} [holderClassName] A class for a holder element around the control.
   * @returns {HTMLElement}
   */
  const focusControlInPortal = (tagName: string, type?: string, holderClassName?: string) => {
    const control = document.createElement(tagName);
    const holder = document.createElement('div');

    if (type) {
      (control as HTMLInputElement).type = type;
    }

    if (holderClassName) {
      holder.className = holderClassName;
    }

    holder.appendChild(control);
    hot.rootPortalElement.appendChild(holder);
    control.focus();

    return control;
  };

  const createGrid = (settings: Record<string, unknown> = {}) => {
    hot = new Handsontable(container, {
      data: [['A1', 'B1'], ['A2', 'B2']],
      licenseKey: TEST_LICENSE_KEY,
      copyPaste: true,
      ...settings,
    });
    hot.selectCell(1, 1);
    hot.listen();
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot.destroy();
    container.remove();
  });

  it('should make the highlighted cell content editable when the page body reports a mouseleave', () => {
    createGrid();

    expect(hot.isListening()).toBe(true);

    leaveBody();

    expect(cellIsContentEditable()).toBe(true);
  });

  describe('with the focus in a control the user enters a value into', () => {
    it.each([
      ['a text area', 'textarea', undefined],
      ['a text input', 'input', 'text'],
      ['an input with no type', 'input', undefined],
      ['a select', 'select', undefined],
    ])('should not take the focus from %s', (_description, tagName, type) => {
      createGrid();

      const control = focusControlInPortal(tagName, type);

      expect(document.activeElement).toBe(control);
      expect(hot.isListening()).toBe(true);

      leaveBody();

      expect(cellIsContentEditable()).toBe(false);
      expect(document.activeElement).toBe(control);
    });

    it('should not take the focus from the text area of an open cell editor', () => {
      createGrid();
      hot.getActiveEditor()?.beginEditing();

      const { TEXTAREA } = hot.getActiveEditor() as unknown as { TEXTAREA: HTMLTextAreaElement };

      expect(hot.getActiveEditor()?.isOpened()).toBe(true);
      expect(document.activeElement).toBe(TEXTAREA);
      expect(hot.isListening()).toBe(true);

      leaveBody();

      expect(cellIsContentEditable()).toBe(false);
      expect(document.activeElement).toBe(TEXTAREA);
    });
  });

  describe('with the focus in a control the workaround has to keep working beside', () => {
    it.each([
      ['a checkbox', 'checkbox'],
      ['a radio button', 'radio'],
      ['a button', 'button'],
    ])('should still run with the focus in %s', (_description, type) => {
      createGrid();

      const control = focusControlInPortal('input', type);

      expect(document.activeElement).toBe(control);
      expect(hot.isListening()).toBe(true);

      leaveBody();

      expect(cellIsContentEditable()).toBe(true);
    });

    it('should still run when the focus sits in the text area of a closed cell editor', () => {
      createGrid({ imeFastEdit: true });

      const { TEXTAREA } = hot.getActiveEditor() as unknown as { TEXTAREA: HTMLTextAreaElement };

      TEXTAREA.focus();

      expect(hot.getActiveEditor()?.isOpened()).toBe(false);
      expect(TEXTAREA.closest('.ht_editor_hidden')).not.toBeNull();
      expect(document.activeElement).toBe(TEXTAREA);
      expect(hot.isListening()).toBe(true);

      leaveBody();

      expect(cellIsContentEditable()).toBe(true);
    });

    it('should still run when the focus sits in a control inside a hidden editor holder', () => {
      createGrid();

      const control = focusControlInPortal('textarea', undefined, 'ht_editor_hidden');

      expect(document.activeElement).toBe(control);
      expect(hot.isListening()).toBe(true);

      leaveBody();

      expect(cellIsContentEditable()).toBe(true);
    });
  });
  describe('the `aria-hidden` the workaround sets', () => {
    const enterBody = () => {
      document.body.dispatchEvent(new MouseEvent('mouseenter'));
    };

    it('should stay on the highlighted cell after a render', () => {
      createGrid();
      leaveBody();

      expect(hot.getCell(1, 1)?.getAttribute('aria-hidden')).toBe('true');

      hot.render();

      // The positive control: the render left the cell editable, so the workaround is still on.
      expect(cellIsContentEditable()).toBe(true);
      expect(hot.getCell(1, 1)?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should stay on a highlighted column header after a render', () => {
      createGrid({ colHeaders: true, navigableHeaders: true });
      hot.selectCell(-1, 1);
      hot.listen();
      leaveBody();

      expect(hot.getCell(-1, 1, true)?.hasAttribute('contenteditable')).toBe(true);
      expect(hot.getCell(-1, 1, true)?.getAttribute('aria-hidden')).toBe('true');

      hot.render();

      expect(hot.getCell(-1, 1, true)?.hasAttribute('contenteditable')).toBe(true);
      expect(hot.getCell(-1, 1, true)?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should be gone, with a render in between, once the pointer is back in the body', () => {
      createGrid();
      leaveBody();
      hot.render();
      enterBody();

      expect(cellIsContentEditable()).toBe(false);
      expect(hot.getCell(1, 1)?.hasAttribute('aria-hidden')).toBe(false);

      hot.render();

      expect(hot.getCell(1, 1)?.hasAttribute('aria-hidden')).toBe(false);
    });

    it('should not be put on a cell a renderer made editable, which the workaround did not touch', () => {
      createGrid({
        renderer(_hot: unknown, TD: HTMLTableCellElement, row: number, column: number, _prop: unknown, value: string) {
          TD.textContent = value;

          if (row === 0 && column === 0) {
            TD.setAttribute('contenteditable', 'true');
          }
        },
      });
      // The workaround runs on the highlighted cell (1, 1). Cell (0, 0) is editable by its renderer.
      leaveBody();
      hot.render();

      expect(hot.getCell(0, 0)?.hasAttribute('contenteditable')).toBe(true);
      expect(hot.getCell(0, 0)?.hasAttribute('aria-hidden')).toBe(false);
    });

    it('should not be put back on a cell the selection has left', () => {
      createGrid();
      leaveBody();

      const cell = hot.getCell(1, 1);

      hot.selectCell(0, 0);
      hot.render();

      expect(cell?.hasAttribute('aria-hidden')).toBe(false);
    });
  });
});
