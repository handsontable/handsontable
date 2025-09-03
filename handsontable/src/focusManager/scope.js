import { installFocusDetector } from './utils/focusDetector';
import { createFocusableElementsNavigator } from './utils/focusableElementsNavigator';

/**
 * Represents an individual focus scope with its own lifecycle and boundaries.
 */
export class FocusScope {
  #scopeId;
  #container;
  #options;
  #hot;
  #focusCatchers;
  #focusableElementsNavigator;
  #isActive = false;

  constructor(scopeId, hotInstance, container, options = {}) {
    this.#scopeId = scopeId;
    this.#container = container;
    this.#hot = hotInstance;
    this.#options = {
      installFocusDetector: true,
      focusableElements: () => [],
      ...options,
    };

    this.#focusCatchers = this.#options.installFocusDetector
      ? installFocusDetector(this.#hot, this.#container) : null;
    this.#focusableElementsNavigator = createFocusableElementsNavigator(this.#options);
  }

  getScopeId() {
    return this.#scopeId;
  }

  contains(target) {
    return this.#container.contains(target);
  }

  isActive() {
    return this.#isActive;
  }

  /**
   * Activates this focus scope
   */
  activate(activationSource) {
    if (this.#isActive) {
      return;
    }

    console.log('activate', activationSource);

    this.#isActive = true;
    this.#focusCatchers?.deactivate();

    if (activationSource === 'from_above') {
      this.#focusableElementsNavigator.toFirstItem();

    } else if (activationSource === 'from_below') {
      this.#focusableElementsNavigator.toLastItem();
    }

    if (this.#options.onActivation) {
      this.#options.onActivation(activationSource);
    }
  }

  /**
   * Deactivates this focus scope
   */
  deactivate() {
    if (!this.#isActive) {
      return;
    }

    this.#isActive = false;
    this.#focusCatchers?.activate();

    if (this.#options?.onDeactivation) {
      this.#options.onDeactivation();
    }
  }
}
