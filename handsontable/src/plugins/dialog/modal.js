import { DialogUI } from './ui';
import localHooks from '../../mixins/localHooks';
import { mixin } from '../../helpers/object';
import { installFocusDetector } from '../../utils/focusDetector';

/**
 * Represents a single modal dialog instance that can be displayed over a Handsontable grid.
 * The modal manages its own UI state, visibility, and user interactions while providing
 * a clean API for showing, hiding, and updating dialog content. It handles focus management,
 * selection state preservation, and accessibility features to ensure proper user experience.
 *
 * @class Modal
 */
export class Modal {
  /**
   * UI instance of the dialog plugin.
   *
   * @type {DialogUI}
   */
  #ui = null;
  /**
   * Flag indicating if dialog is currently visible.
   *
   * @type {boolean}
   */
  #isVisible = false;

  #focusDetector = null;

  constructor(hot, { rootGridElement, isRtl }) {
    this.#ui = new DialogUI({
      rootElement: rootGridElement,
      isRtl,
    });

    this.#focusDetector = installFocusDetector(hot, this.#ui.getContainerElement(), {
      onFocus: (from) => {
        this.runLocalHooks('afterModalFocus', `tab_${from}`);
      }
    });

    this.#ui.addLocalHook('clickDialogElement', () => this.runLocalHooks('clickModalElement'));
  }

  /**
   * Gets the container element of the modal.
   *
   * @returns {HTMLElement} The container element of the modal.
   */
  getContainerElement() {
    return this.#ui.getContainerElement();
  }

  /**
   * Check if the dialog is currently visible.
   *
   * @returns {boolean} True if the dialog is visible, false otherwise.
   */
  isVisible() {
    return this.#isVisible;
  }

  /**
   * Checks if the given element is inside the modal container.
   *
   * @param {HTMLElement} element The element to check.
   * @returns {boolean} Returns `true` if the element is inside the modal container, `false` otherwise.
   */
  contains(element) {
    return this.#ui.getContainerElement().contains(element);
  }

  /**
   * Updates the width of the modal.
   *
   * @param {number} width The width of the modal.
   */
  updateWidth(width) {
    this.#ui.updateWidth(width);
  }

  /**
   * Updates the height of the modal.
   *
   * @param {number} height The height of the modal.
   */
  updateHeight(height) {
    this.#ui.updateHeight(height);
  }

  /**
   * Show modal with given configuration.
   * Displays the modal with the specified content and options.
   *
   * @param {object} options Modal configuration object containing content and display options.
   * @param {string|HTMLElement|DocumentFragment} options.content The content to display in the modal. Can be a string, HTMLElement, or DocumentFragment. Default: ''
   * @param {string} options.customClassName Custom CSS class name to apply to the modal container. Default: ''
   * @param {'solid'|'semi-transparent'} options.background Modal background variant. Default: 'solid'.
   * @param {boolean} options.contentBackground Whether to show content background. Default: false.
   * @param {boolean} options.animation Whether to enable animations when showing/hiding the modal. Default: true.
   * @param {boolean} options.closable Whether the modal can be closed by user interaction. Default: false.
   * @param {object} options.a11y Object with accessibility options.
   * @param {string} options.a11y.role The role of the modal.
   * @param {string} options.a11y.ariaLabel The label of the modal.
   * @param {string} options.a11y.ariaLabelledby The ID of the element that labels the modal.
   * @param {string} options.a11y.ariaDescribedby The ID of the element that describes the modal.
   */
  show(options = {}) {
    if (this.isVisible()) {
      this.update(options);

      return;
    }

    this.runLocalHooks('beforeModalShow');

    this.update(options);
    this.#ui.show(options.animation);
    this.#isVisible = true;

    this.runLocalHooks('afterModalShow');
  }

  /**
   * Hide the currently open modal.
   */
  hide(animation) {
    if (!this.isVisible()) {
      return;
    }

    this.runLocalHooks('beforeModalHide');

    this.#ui.hide(animation);
    this.#isVisible = false;

    this.runLocalHooks('afterModalHide');
  }

  /**
   * Update the modal configuration.
   *
   * @param {object} options Dialog configuration object containing content and display options.
   * @param {string|HTMLElement|DocumentFragment} options.content The content to display in the dialog. Can be a string, HTMLElement, or DocumentFragment. Default: ''
   * @param {string} options.customClassName Custom CSS class name to apply to the modal container. Default: ''
   * @param {'solid'|'semi-transparent'} options.background Modal background variant. Default: 'solid'.
   * @param {boolean} options.contentBackground Whether to show content background. Default: false.
   * @param {boolean} options.animation Whether to enable animations when showing/hiding the modal. Default: true.
   * @param {boolean} options.closable Whether the modal can be closed by user interaction. Default: false.
   * @param {object} options.a11y Object with accessibility options.
   * @param {string} options.a11y.role The role of the modal.
   * @param {string} options.a11y.ariaLabel The label of the modal.
   * @param {string} options.a11y.ariaLabelledby The ID of the element that labels the modal.
   * @param {string} options.a11y.ariaDescribedby The ID of the element that describes the modal.
   */
  update(options) {
    this.#ui.updateState(options);
  }

  /**
   * Focus the modal.
   */
  focus() {
    this.#ui.focus();
  }

  /**
   * Deactivate the focus detector (temporary solution).
   *
   * @private
   */
  _deactivate() {
    this.#focusDetector.deactivate();
  }

  /**
   * Activate the focus detector (temporary solution).
   *
   * @private
   */
  _activate() {
    this.#focusDetector.activate();
  }

  _focusDetector(focusDirection) {
    this.#focusDetector.focus(focusDirection);
  }

  /**
   * Destroy modal and reset plugin state.
   */
  destroy() {
    this.#ui?.destroy();
    this.#ui = null;
    this.#isVisible = false;
    this.#focusDetector = null;
  }
}

mixin(Modal, localHooks);
