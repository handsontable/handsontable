
const MOUSE_BUTTONS = new Map();

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button#Return_value
MOUSE_BUTTONS.set('LMB', 0);
MOUSE_BUTTONS.set('MMB', 1);
MOUSE_BUTTONS.set('RMB', 2);

/**
 * Get number describing specific mouse click.
 *
 * @param {number} buttonKey Number representing mouse button key.
 * @returns {number}
 */
function getMouseButton(buttonKey) {
  return MOUSE_BUTTONS.get(buttonKey);
}

/**
 * Returns a function that triggers a mouse event.
 *
 * @param {string} type Event type.
 * @param {number} [defaultButtonKey] Number representing default mouse button key for this factory product.
 * @returns {Function}
 */
export function handsontableMouseTriggerFactory(type, defaultButtonKey = getMouseButton('LMB')) {
  return function(element, buttonKey = defaultButtonKey, eventProps = {}) {
    let handsontableElement = element;

    if (!(handsontableElement instanceof jQuery)) {
      handsontableElement = $(handsontableElement);
    }
    const ev = $.Event(type);

    ev.button = buttonKey;

    Object.keys(eventProps).forEach((key) => {
      ev[key] = eventProps[key];
    });

    handsontableElement.simulate(type, ev);
  };
}

export const mouseMove = handsontableMouseTriggerFactory('mousemove');
export const mouseDown = handsontableMouseTriggerFactory('mousedown');
export const mouseOver = handsontableMouseTriggerFactory('mouseover');
export const mouseUp = handsontableMouseTriggerFactory('mouseup');
export const mouseClick = handsontableMouseTriggerFactory('click');
export const contextMenuEvent = handsontableMouseTriggerFactory('contextmenu');

/**
 * Simulate click (all mouse events).
 *
 * @param {Element} element An element on which there will be performed mouse events.
 * @param {number} [buttonKey] Number representing mouse button key.
 * @param {object} [eventProps] Addional object with props to merge with the event.
 */
export function simulateClick(element, buttonKey = 'LMB', eventProps = {}) {
  const mouseButton = getMouseButton(buttonKey);

  mouseDown(element, mouseButton, eventProps);
  mouseUp(element, mouseButton, eventProps);

  // Only left click generates "click" events.
  if (mouseButton === getMouseButton('LMB')) {
    mouseClick(element, mouseButton, eventProps);
  }

  // Only right click generates "contextmenu" events.
  if (mouseButton === getMouseButton('RMB')) {
    contextMenuEvent(element, mouseButton, eventProps);
  }
}

/**
 * Simulate double click (all mouse events).
 *
 * @param {Element} element An element on which there will be performed mouse events.
 * @param {object} [eventProps] Addional object with props to merge with the event.
 */
export function mouseDoubleClick(element, eventProps) {
  mouseDown(element, eventProps);
  mouseUp(element, eventProps);
  mouseDown(element, eventProps);
  mouseUp(element, eventProps);
}

export const mouseRightDown = handsontableMouseTriggerFactory('mousedown', getMouseButton('RMB'));
export const mouseRightUp = handsontableMouseTriggerFactory('mouseup', getMouseButton('RMB'));
