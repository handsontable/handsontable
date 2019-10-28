import EventManager from './../../eventManager';
import localHooks from './../../mixins/localHooks';
import { mixin } from './../../helpers/object';
import { isMobileBrowser } from './../../helpers/browser';
import { selectElementIfAllowed } from './../../helpers/dom/element';

/**
 * @class FocusableWrapper
 *
 * @plugin CopyPaste
 */
class FocusableWrapper {
  constructor(container) {
    this.rootDocument = container.defaultView ? container : container.ownerDocument;
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
    /**
     * Parent for an focusable element.
     *
     * @type {HTMLElement}
     */
    this.container = container;
  }

  /**
   * Switch to the secondary focusable element. Used when no any main focusable element is provided.
   */
  useSecondaryElement() {
    const el = createOrGetSecondaryElement(this.container);

    if (!this.listenersCount.has(el)) {
      this.listenersCount.add(el);
      forwardEventsToLocalHooks(this.eventManager, el, this);
    }

    this.mainElement = el;
  }

  /**
   * Switch to the main focusable element.
   *
   * @param {HTMLElement} element
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
   * @returns {HTMLElement}
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
      selectElementIfAllowed(this.mainElement);
    }
  }
}

mixin(FocusableWrapper, localHooks);

const refCounter = new WeakMap();

/**
 * Create and return the FocusableWrapper instance.
 *
 * @param {HTMLElement} container
 * @returns {FocusableWrapper}
 */
function createElement(container) {
  const focusableWrapper = new FocusableWrapper(container);

  let counter = refCounter.get(container);
  counter = isNaN(counter) ? 0 : counter;

  refCounter.set(container, counter + 1);

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

const secondaryElements = new WeakMap();

/**
 * Create and attach newly created focusable element to the DOM.
 *
 * @param {HTMLElement} container
 * @returns {HTMLElement}
 */
function createOrGetSecondaryElement(container) {
  const secondaryElement = secondaryElements.get(container);

  if (secondaryElement) {
    if (!secondaryElement.parentElement) {
      container.appendChild(secondaryElement);
    }

    return secondaryElement;
  }

  const doc = container.defaultView ? container : container.ownerDocument;
  const element = doc.createElement('textarea');

  secondaryElements.set(container, element);
  element.className = 'HandsontableCopyPaste';
  element.tabIndex = -1;
  element.autocomplete = 'off';
  element.wrap = 'hard';
  element.value = ' ';

  container.appendChild(element);

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

  let counter = refCounter.get(wrapper.container);
  counter = isNaN(counter) ? 0 : counter;

  if (counter > 0) {
    counter -= 1;
  }

  deactivateElement(wrapper);

  if (counter <= 0) {
    counter = 0;

    // Detach secondary element from the DOM.
    const secondaryElement = secondaryElements.get(wrapper.container);

    if (secondaryElement && secondaryElement.parentNode) {
      secondaryElement.parentNode.removeChild(secondaryElement);
      secondaryElements.delete(wrapper.container);
    }

    wrapper.mainElement = null;
  }

  refCounter.set(wrapper.container, counter);
}

export { createElement, deactivateElement, destroyElement };
