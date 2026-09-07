import { DialogUI } from '../ui';
import { DIALOG_CLASS_NAME } from '../constants';

describe('DialogUI', () => {
  /**
   * Builds a UI instance the way the plugin does.
   *
   * @param {HTMLElement|null} overlayContainer The overlays element to install into.
   * @returns {DialogUI} The UI instance.
   */
  function buildUI(overlayContainer) {
    return new DialogUI({
      overlayContainer,
      isRtl: false,
      sanitizer: content => content,
      warnScope: document.createElement('div'),
    });
  }

  describe('without an overlay container', () => {
    // `rootOverlaysElement` is created only for a root instance, so a nested grid - what the
    // `handsontable` cell type creates - passes `null` here. The dialog must stay silent there, not
    // throw: reading `ownerDocument` off the missing container took the whole grid down.
    it('should install without throwing', () => {
      expect(() => buildUI(null)).not.toThrow();
    });

    it('should build the container in the warn scope\'s document', () => {
      const ui = buildUI(null);
      const container = ui.getContainer();

      expect(container.ownerDocument).toBe(document);
      expect(container.classList.contains(DIALOG_CLASS_NAME)).toBe(true);
    });

    it('should append nothing, so the dialog never shows on a nested grid', () => {
      const ui = buildUI(null);
      const container = ui.getContainer();

      // it stays in the fragment it was built in, never reaching a live tree
      expect(container.parentNode.nodeType).toBe(Node.DOCUMENT_FRAGMENT_NODE);
      expect(document.body.contains(container)).toBe(false);
    });

    it('should update the dialog without throwing', () => {
      const ui = buildUI(null);

      ui.useDefaultTemplate();

      expect(() => ui.updateDialog({
        isVisible: true,
        content: 'Nested',
        customClassName: '',
        background: '',
        contentBackground: false,
        animation: false,
        a11y: {},
      })).not.toThrow();
    });
  });

  describe('with an overlay container', () => {
    it('should install into the container it was given', () => {
      const overlayContainer = document.createElement('div');
      const ui = buildUI(overlayContainer);

      expect(ui.getContainer().parentNode).toBe(overlayContainer);
    });
  });
});
