/**
 * autoResize - resizes a DOM element to the width and height of another DOM element
 *
 * Copyright 2014, Marcin Warpechowski
 * Licensed under the MIT license
 */
/**
 * Attaches an event listener to the given element.
 *
 * @param {HTMLElement} element The element to observe.
 * @param {string} eventName The name of the event to listen for.
 * @param {Function} handler The function to call when the event is triggered.
 */
function observe(element: HTMLElement, eventName: string, handler: EventListenerOrEventListenerObject) {
  element.addEventListener(eventName, handler, false);
}

/**
 * Removes an event listener from an element.
 *
 * @param {HTMLElement} element The element to remove the event listener from.
 * @param {string} eventName The name of the event to remove.
 * @param {Function} handler The function to remove as a listener.
 */
function unObserve(element: HTMLElement, eventName: string, handler: EventListenerOrEventListenerObject) {
  element.removeEventListener(eventName, handler, false);
}

/**
 * Returns the computed style of an element.
 *
 * @param {Element} element The element to get the computed style from.
 * @returns {CSSStyleDeclaration} The computed style of the element.
 */
function getComputedStyle(element: HTMLElement) {
  return element.ownerDocument.defaultView!.getComputedStyle(element);
}

/**
 * @typedef InputElementResizerConfig
 * @property {number} [minWidth] The minimum width of the element.
 * @property {number} [maxWidth] The maximum width of the element.
 * @property {number} [minHeight] The minimum height of the element.
 * @property {number} [maxHeight] The maximum height of the element.
 * @property {function(HTMLElement): string} [textContent] The function that returns the text content to measure.
 */
/**
 * @typedef InputElementResizer
 * @property {function(HTMLElement, InputElementResizerConfig, boolean): void} init Initializes the resizer.
 * @property {function(): void} resize Resizes the element.
 * @property {function(): void} unObserve Removes the event listeners.
 */
/**
 * Creates an input element resizer.
 *
 * @param {Document} ownerDocument The document to create the resizer for.
 * @param {InputElementResizerConfig} initialOptions The configuration to extend the defaults with.
 * @returns {InputElementResizer}
 */
export function createInputElementResizer(ownerDocument: Document, initialOptions: Record<string, unknown> = {}) {
  const defaults = {
    minHeight: 200,
    maxHeight: 300,
    minWidth: 100,
    maxWidth: 300,
    textContent: (element: HTMLElement) => (element as HTMLTextAreaElement).value,
    ...initialOptions,
  };
  const body = ownerDocument.body;
  const textHolder = ownerDocument.createTextNode('');
  const textContainer = ownerDocument.createElement('span');
  let observedElement: HTMLElement;

  /**
   * Resizes the element.
   */
  function resize() {
    textHolder.textContent = (defaults.textContent as (el: HTMLElement) => string)(observedElement);
    // Won't expand the element size for displaying body as for example, `grid`, `inline-grid` or `flex` with
    // `flex-direction` set as `column`.
    textContainer.style.position = 'absolute';
    textContainer.style.fontSize = getComputedStyle(observedElement).fontSize;
    textContainer.style.fontFamily = getComputedStyle(observedElement).fontFamily;
    textContainer.style.whiteSpace = 'pre';

    body.appendChild(textContainer);

    const paddingStart = Number.parseInt(getComputedStyle(observedElement)?.paddingInlineStart || '0', 10);
    const paddingEnd = Number.parseInt(getComputedStyle(observedElement)?.paddingInlineEnd || '0', 10);

    const width = textContainer.clientWidth + paddingStart + paddingEnd + 1;

    body.removeChild(textContainer);

    const elementStyle = observedElement.style;

    elementStyle.height = `${defaults.minHeight}px`;

    if (defaults.minWidth > width) {
      elementStyle.width = `${defaults.minWidth}px`;

    } else if (width > defaults.maxWidth) {
      elementStyle.width = `${defaults.maxWidth}px`;

    } else {
      elementStyle.width = `${width}px`;
    }

    const scrollHeight = observedElement.scrollHeight ? observedElement.scrollHeight - 1 : 0;

    if (defaults.minHeight > scrollHeight) {
      elementStyle.height = `${defaults.minHeight}px`;

    } else if (defaults.maxHeight < scrollHeight) {
      elementStyle.height = `${defaults.maxHeight}px`;
      elementStyle.overflowY = 'visible';

    } else {
      elementStyle.height = `${scrollHeight}px`;
    }
  }

  /**
   * Resizes the element after a delay.
   */
  function delayedResize() {
    ownerDocument.defaultView!.setTimeout(resize, 0);
  }

  /**
   * Extends the default configuration.
   *
   * @param {InputElementResizerConfig} config The configuration to extend the defaults with.
   */
  function extendDefaults(config: Record<string, unknown>) {
    if (config && config.minHeight) {
      if (config.minHeight === 'inherit') {
        defaults.minHeight = observedElement.clientHeight;
      } else {
        const minHeight = Number.parseInt(String(config.minHeight), 10);

        if (!isNaN(minHeight)) {
          defaults.minHeight = minHeight;
        }
      }
    }

    if (config && config.maxHeight) {
      if (config.maxHeight === 'inherit') {
        defaults.maxHeight = observedElement.clientHeight;
      } else {
        const maxHeight = Number.parseInt(String(config.maxHeight), 10);

        if (!isNaN(maxHeight)) {
          defaults.maxHeight = maxHeight;
        }
      }
    }

    if (config && config.minWidth) {
      if (config.minWidth === 'inherit') {
        defaults.minWidth = observedElement.clientWidth;
      } else {
        const minWidth = Number.parseInt(String(config.minWidth), 10);

        if (!isNaN(minWidth)) {
          defaults.minWidth = minWidth;
        }
      }
    }

    if (config && config.maxWidth) {
      if (config.maxWidth === 'inherit') {
        defaults.maxWidth = observedElement.clientWidth;
      } else {
        const maxWidth = Number.parseInt(String(config.maxWidth), 10);

        if (!isNaN(maxWidth)) {
          defaults.maxWidth = maxWidth;
        }
      }
    }

    if (!textContainer.firstChild) {
      textContainer.className = 'autoResize';
      textContainer.style.display = 'inline-block';
      textContainer.appendChild(textHolder);
    }
  }

  /**
   * Initializes the resizer.
   *
   * @param {HTMLElement} elementToObserve The element to observe.
   * @param {InputElementResizerConfig} config The configuration to extend the defaults with.
   * @param {boolean} [doObserve=false] Whether to observe the element and resize it on every input change.
   */
  function init(elementToObserve: HTMLElement, config: Record<string, unknown>, doObserve = false) {
    observedElement = elementToObserve;

    extendDefaults(config);

    if (observedElement.nodeName === 'TEXTAREA') {
      observedElement.style.resize = 'none';
      observedElement.style.height = `${defaults.minHeight}px`;
      observedElement.style.minWidth = `${defaults.minWidth}px`;
      observedElement.style.maxWidth = `${defaults.maxWidth}px`;
      observedElement.style.overflowY = 'hidden';
    }

    if (doObserve) {
      observe(observedElement, 'input', resize);
      // the keydown event is necessary for undo stack to work properly
      observe(observedElement, 'keydown', delayedResize);
    }

    resize();
  }

  return {
    init,
    resize,
    unObserve() {
      unObserve(observedElement, 'input', resize);
      unObserve(observedElement, 'keydown', delayedResize);
    },
  };
}
