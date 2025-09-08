import localHooks from '../../mixins/localHooks';
import { mixin } from '../../helpers/object';
import { Modal } from './modal';

/**
 * Manages multiple modal instances within a Handsontable instance, providing a centralized
 * registry for creating, tracking, and controlling modal dialogs. The manager handles modal
 * lifecycle events including show/hide operations, focus management, and selection state
 * preservation. It supports registering multiple named modals that can be independently
 * controlled.
 *
 * @class ModalManager
 * @private
 */
export class ModalManager {
  /**
   * Handsontable instance.
   *
   * @type {Handsontable}
   */
  #hot;
  /**
   * Map of modal instances.
   *
   * @type {Map<string, Modal>}
   */
  #modals = new Map();
  /**
   * Selection state.
   *
   * @type {SelectionState | null}
   */
  #selectionState = null;

  constructor(hot) {
    this.#hot = hot;

    this.#hot.addHook('afterViewRender', () => this.#onAfterRender());
    this.#hot.addHook('modifyFocusOnTabNavigation', (...args) => this.#onFocusTabNavigation(...args), 1);
    this.#hot.addHook('afterListen', () => this.#onAfterListen());
    this.#hot.addHook('afterUnlisten', () => this.#onAfterUnlisten());
  }

  /**
   * Registers a new modal instance.
   *
   * @param {string} name Name of the modal.
   * @returns {Modal} The modal instance.
   */
  registerModal(name) {
    if (this.#modals.has(name)) {
      throw new Error(`Modal with name ${name} already registered`);
    }

    const modal = new Modal(this.#hot, {
      rootGridElement: this.#hot.rootGridElement,
      isRtl: this.#hot.isRtl(),
    });

    modal
      .addLocalHook('clickModalElement', () => this.#onClickModalElement(modal))
      .addLocalHook('beforeModalShow', () => this.#onBeforeModalShow(modal))
      .addLocalHook('afterModalShow', () => this.#onAfterModalShow(modal))
      .addLocalHook('beforeModalHide', () => this.#onBeforeModalHide(modal))
      .addLocalHook('afterModalHide', () => this.#onAfterModalHide(modal));


    this.#modals.set(name, modal);

    return modal;
  }

  /**
   * Called when the focus is modified on the tab navigation.
   *
   * @param {string} from The direction of the focus.
   */
  #onFocusTabNavigation(from) {
    let proceedDefaultTabAction = true;

    this.#modals.forEach(modal => {
      if (modal.isVisible()) {
        modal._focusDetector(from);
        proceedDefaultTabAction = false;
      }
    });

    return proceedDefaultTabAction;
  }

  /**
   * Called after the listening is completed.
   */
  #onAfterListen() {
    this.#modals.forEach(modal => modal._deactivate());
  }

  /**
   * Called after the unlistening is completed.
   */
  #onAfterUnlisten() {
    this.#modals.forEach(modal => modal._activate());
  }

  /**
   * Called after the rendering of the table is completed. It updates the width and
   * height of the dialog container to the same size as the table.
   */
  #onAfterRender() {
    const { view, rootWrapperElement, rootWindow } = this.#hot;
    const width = view.isHorizontallyScrollableByWindow()
      ? view.getTotalTableWidth() : view.getWorkspaceWidth();

    this.#modals.forEach(modal => modal.updateWidth(width));

    if (rootWrapperElement) {
      const dialogInfo = rootWrapperElement.querySelector('.hot-display-license-info');

      if (dialogInfo) {
        const height = dialogInfo.offsetHeight;
        const marginTop = parseFloat(rootWindow.getComputedStyle(dialogInfo).marginTop);

        this.#modals.forEach(modal => modal.updateHeight(height + marginTop));
      }
    }
  }

  /**
   * Called when the modal element is clicked.
   *
   * @param {Modal} modal The modal instance.
   */
  #onClickModalElement(modal) {
    if (modal.isVisible() && !this.#hot.isListening()) {
      this.runLocalHooks('afterModalFocus', modal, 'click');
    }

    this.#hot.listen();
  }

  /**
   * Called before the modal is shown.
   *
   * @param {Modal} modal The modal instance.
   */
  #onBeforeModalShow(modal) {
    this.runLocalHooks('beforeModalShow', modal);
  }

  /**
   * Called after the modal is shown.
   *
   * @param {Modal} modal The modal instance.
   */
  #onAfterModalShow(modal) {
    this.#selectionState = this.#hot.selection.exportSelection();
    this.#hot.deselectCell();

    this.runLocalHooks('afterModalShow', modal);

    const { activeElement } = this.#hot.rootDocument;

    if (this.#hot.rootWrapperElement.contains(activeElement) || this.#hot.rootPortalElement.contains(activeElement)) {
      this.#hot.unlisten();
      this.#hot.listen();
      modal.focus();
      this.runLocalHooks('afterModalFocus', modal, 'show');
    }
  }

  /**
   * Called before the modal is hidden.
   *
   * @param {Modal} modal The modal instance.
   */
  #onBeforeModalHide(modal) {
    this.runLocalHooks('beforeModalHide', modal);
  }

  /**
   * Called after the modal is hidden.
   *
   * @param {Modal} modal The modal instance.
   */
  #onAfterModalHide(modal) {
    this.runLocalHooks('afterModalHide', modal);
    this.#hot.getShortcutManager().setActiveContextName('grid');

    if (this.#selectionState) {
      this.#hot.selection.importSelection(this.#selectionState);
      this.#hot.view.render();
      this.#selectionState = null;
    } else {
      this.#hot.selectCell(0, 0);
    }
  }

  /**
   * Destroy modal manager.
   */
  destroy() {
    this.#modals.forEach(modal => modal.destroy());
    this.#modals.clear();
    this.#modals = null;
    this.#selectionState = null;
    this.#hot = null;
  }
}

mixin(ModalManager, localHooks);
