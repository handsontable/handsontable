/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * autoResize - resizes a DOM element to the width and height of another DOM element
 *
 * Copyright 2014, Marcin Warpechowski
 * Licensed under the MIT license
 */
/* eslint-enable jsdoc/require-description-complete-sentence */

/**
 * Configuration for the input element resizer.
 */
interface InputElementResizerConfig {
  minWidth?: number | string;
  maxWidth?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;
  textContent?: (element: HTMLElement) => string;
}

/**
 * Interface for the input element resizer.
 */
interface InputElementResizer {
  init(elementToObserve: HTMLElement, config: InputElementResizerConfig, doObserve?: boolean): void;
  resize(): void;
  unObserve(): void;
}

/**
 * Attaches an event listener to the given element.
 *
 * @param {HTMLElement} element The element to observe.
 * @param {string} eventName The name of the event to listen for.
 * @param {Function} handler The function to call when the event is triggered.
 */
function observe(element: HTMLElement, eventName: string, handler: EventListenerOrEventListenerObject): void {
  element.addEventListener(eventName, handler, false);
}

/**
 * Removes an event listener from an element.
 *
 * @param {HTMLElement} element The element to remove the event listener from.
 * @param {string} eventName The name of the event to remove.
 * @param {Function} handler The function to remove as a listener.
 */
function unObserve(element: HTMLElement, eventName: string, handler: EventListenerOrEventListenerObject): void {
  element.removeEventListener(eventName, handler, false);
}

/**
 * Returns the computed style of an element.
 *
 * @param {Element} element The element to get the computed style from.
 * @returns {CSSStyleDeclaration} The computed style of the element.
 */
function getComputedStyle(element: Element): CSSStyleDeclaration {
  return element.ownerDocument.defaultView!.getComputedStyle(element);
}

/**
 * Creates an input element resizer.
 *
 * @param {Document} ownerDocument The document to create the resizer for.
 * @param {InputElementResizerConfig} initialOptions The configuration to extend the defaults with.
 * @returns {InputElementResizer}
 */
export function createInputElementResizer(ownerDocument: Document, initialOptions: InputElementResizerConfig = {}): InputElementResizer {
  const defaults = {
    minHeight: 200,
    maxHeight: 300,
    minWidth: 100,
    maxWidth: 300,
    textContent: (element: HTMLElement) => {
      // Handle element as HTMLInputElement or HTMLTextAreaElement which have 'value' property
      return (element as HTMLInputElement).value;
    },
    ...initialOptions,
  };
  const body = ownerDocument.body;
  const textHolder = ownerDocument.createTextNode('');
  const textContainer = ownerDocument.createElement('span');
  let observedElement: HTMLElement | null = null;
  let delayedResizeTimeout: number | null = null;

  /**
   * Resizes the element.
   */
  function resize(): void {
    if (!observedElement) {
      return;
    }

    textHolder.textContent = defaults.textContent(observedElement);
    // Won't expand the element size for displaying body as for example, `grid`, `inline-grid` or `flex` with
    // `flex-direction` set as `column`.
    textContainer.style.position = 'absolute';
    textContainer.style.fontSize = getComputedStyle(observedElement).fontSize;
    textContainer.style.fontFamily = getComputedStyle(observedElement).fontFamily;
    textContainer.style.whiteSpace = 'pre';

    body.appendChild(textContainer);

    const paddingStart = parseInt(getComputedStyle(observedElement)?.paddingInlineStart || '0', 10);
    const paddingEnd = parseInt(getComputedStyle(observedElement)?.paddingInlineEnd || '0', 10);

    const width = textContainer.clientWidth + paddingStart + paddingEnd + 1;

    body.removeChild(textContainer);

    const elementStyle = observedElement.style;

    elementStyle.height = `${defaults.minHeight}px`;

    if (Number(defaults.minWidth) > width) {
      elementStyle.width = `${defaults.minWidth}px`;

    } else if (width > Number(defaults.maxWidth)) {
      elementStyle.width = `${defaults.maxWidth}px`;

    } else {
      elementStyle.width = `${width}px`;
    }

    const scrollHeight = observedElement.scrollHeight ? observedElement.scrollHeight - 1 : 0;

    if (Number(defaults.minHeight) > scrollHeight) {
      elementStyle.height = `${defaults.minHeight}px`;

    } else if (Number(defaults.maxHeight) < scrollHeight) {
      elementStyle.height = `${defaults.maxHeight}px`;
      elementStyle.overflowY = 'visible';

    } else {
      elementStyle.height = `${scrollHeight}px`;
    }
  }

  /**
   * Resizes the element after a delay.
   */
  function delayedResize(): void {
    if (delayedResizeTimeout) {
      clearTimeout(delayedResizeTimeout);
    }
    delayedResizeTimeout = window.setTimeout(resize, 0);
  }

  /**
   * Extends the default configuration.
   *
   * @param {InputElementResizerConfig} config The configuration to extend the defaults with.
   */
  function extendDefaults(config: InputElementResizerConfig): void {
    if (config && config.minHeight) {
      if (config.minHeight === 'inherit') {
        defaults.minHeight = observedElement?.clientHeight || 0;
      } else {
        const minHeight = parseInt(config.minHeight as string, 10);

        if (!isNaN(minHeight)) {
          defaults.minHeight = minHeight;
        }
      }
    }

    if (config && config.maxHeight) {
      if (config.maxHeight === 'inherit') {
        defaults.maxHeight = observedElement?.clientHeight || 0;
      } else {
        const maxHeight = parseInt(config.maxHeight as string, 10);

        if (!isNaN(maxHeight)) {
          defaults.maxHeight = maxHeight;
        }
      }
    }

    if (config && config.minWidth) {
      if (config.minWidth === 'inherit') {
        defaults.minWidth = observedElement?.clientWidth || 0;
      } else {
        const minWidth = parseInt(config.minWidth as string, 10);

        if (!isNaN(minWidth)) {
          defaults.minWidth = minWidth;
        }
      }
    }

    if (config && config.maxWidth) {
      if (config.maxWidth === 'inherit') {
        defaults.maxWidth = observedElement?.clientWidth || 0;
      } else {
        const maxWidth = parseInt(config.maxWidth as string, 10);

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
  function init(elementToObserve: HTMLElement, config: InputElementResizerConfig, doObserve: boolean = false): void {
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
      if (observedElement) {
        unObserve(observedElement, 'input', resize);
        unObserve(observedElement, 'keydown', delayedResize);
      }
    },
  };
}
