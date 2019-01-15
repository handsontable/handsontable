import EventManager from './../../eventManager';
import localHooks from './../../mixins/localHooks';
import { mixin } from './../../helpers/object';
import { isMobileBrowser } from './../../helpers/browser';

/**
 * @class FocusableWrapper
 *
 * @plugin CopyPaste
 */
class FocusableWrapper {
  constructor(rootDocument) {
    this.rootDocument = rootDocument;
    /**
     * The main/operational focusable element.
     *
     * @type {HTMLElement}
     */
    this.mainElement = null;
    /**
     * Instance of EventManager.
     *
     * @type {EventManager}
     */
    this.eventManager = new EventManager(this);
    /**
     * An object for tracking information about event listeners attached to the focusable element.
     *
     * @type {WeakSet}
     */
    this.listenersCount = new WeakSet();
  }

  /**
   * Switch to the secondary focusable element. Used when no any main focusable element is provided.
   */
  useSecondaryElement() {
    const el = createOrGetSecondaryElement(this.rootDocument);

    if (!this.listenersCount.has(el)) {
      this.listenersCount.add(el);
      forwardEventsToLocalHooks(this.eventManager, el, this);
    }

    this.mainElement = el;
  }

  /**
   * Switch to the main focusable element.
   */
  setFocusableElement(element) {
    if (!this.listenersCount.has(element)) {
      this.listenersCount.add(element);
      forwardEventsToLocalHooks(this.eventManager, element, this);
    }

    this.mainElement = element;
  }

  /**
   * Get currently set focusable element.
   *
   * @return {HTMLElement}
   */
  getFocusableElement() {
    return this.mainElement;
  }

  /**
   * Set focus to the focusable element.
   */
  focus() {
    // Add an empty space to texarea. It is necessary for safari to enable "copy" command from menu bar.
    this.mainElement.value = ' ';

    if (!isMobileBrowser()) {
      this.mainElement.select();
    }
  }
}

mixin(FocusableWrapper, localHooks);

let refCounter = 0;

/**
 * Create and return the FocusableWrapper instance.
 *
 * @return {FocusableWrapper}
 */
function createElement(rootDocument) {
  const focusableWrapper = new FocusableWrapper(rootDocument);

  refCounter += 1;

  return focusableWrapper;
}

/**
 * Deactivate the FocusableWrapper instance.
 *
 * @param {FocusableWrapper} wrapper
 */
function deactivateElement(wrapper) {
  wrapper.eventManager.clear();
}

const runLocalHooks = (eventName, subject) => event => subject.runLocalHooks(eventName, event);

/**
 * Register copy/cut/paste events and forward their actions to the subject local hooks system.
 *
 * @param {HTMLElement} element
 * @param {FocusableWrapper} subject
 */
function forwardEventsToLocalHooks(eventManager, element, subject) {
  eventManager.addEventListener(element, 'copy', runLocalHooks('copy', subject));
  eventManager.addEventListener(element, 'cut', runLocalHooks('cut', subject));
  eventManager.addEventListener(element, 'paste', runLocalHooks('paste', subject));
}

const secondaryElements = new Map();

/**
 * Create and attach newly created focusable element to the DOM.
 *
 * @return {HTMLElement}
 */
function createOrGetSecondaryElement(rootDocument) {
  const secondaryElement = secondaryElements.get(rootDocument);

  if (secondaryElement) {
    if (!secondaryElement.parentElement) {
      this.rootDocument.body.appendChild(secondaryElement);
    }

    return secondaryElement;
  }

  const element = rootDocument.createElement('textarea');

  secondaryElements.set(rootDocument, element);
  element.id = 'HandsontableCopyPaste';
  element.className = 'copyPaste';
  element.tabIndex = -1;
  element.autocomplete = 'off';
  element.wrap = 'hard';
  element.value = ' ';

  rootDocument.body.appendChild(element);

  return element;
}

/**
 * Destroy the FocusableWrapper instance.
 *
 * @param {FocusableWrapper} wrapper
 */
function destroyElement(wrapper) {
  if (!(wrapper instanceof FocusableWrapper)) {
    return;
  }

  if (refCounter > 0) {
    refCounter -= 1;
  }

  deactivateElement(wrapper);

  if (refCounter <= 0) {
    refCounter = 0;

    // Detach secondary element from the DOM.
    const secondaryElement = secondaryElements.get(wrapper.rootDocument);

    if (secondaryElement && secondaryElement.parentNode) {
      secondaryElement.parentNode.removeChild(secondaryElement);
      secondaryElements.set(wrapper.rootDocument, null);
    }

    wrapper.mainElement = null;
  }
}

export { createElement, deactivateElement, destroyElement };
