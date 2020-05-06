
const MOUSE_BUTTONS = new Map();

MOUSE_BUTTONS.set('LMB', 1);
MOUSE_BUTTONS.set('MMB', 2);
MOUSE_BUTTONS.set('RMB', 3);

/**
 * Get number describing specific mouse click.
 *
 * @param {number} buttonKey Number representing mouse button key.
 * @returns {V}
 */
function getMouseButton(buttonKey) {
  return MOUSE_BUTTONS.get(buttonKey);
}

/**
 * Returns a function that triggers a mouse event.
 *
 * @param {string} type Event type.
 * @param {number} buttonKey Number representing mouse button key.
 * @returns {Function}
 */
export function handsontableMouseTriggerFactory(type, buttonKey) {
  return function(element) {
    let handsontableElement = element;

    if (!(handsontableElement instanceof jQuery)) {
      handsontableElement = $(handsontableElement);
    }
    const ev = $.Event(type);
    ev.which = buttonKey || getMouseButton('LMB'); // left click by default

    handsontableElement.simulate(type, ev);
  };
}

export const mouseMove = handsontableMouseTriggerFactory('mousemove');
export const mouseDown = handsontableMouseTriggerFactory('mousedown');
export const mouseOver = handsontableMouseTriggerFactory('mouseover');
export const mouseUp = handsontableMouseTriggerFactory('mouseup');
export const mouseClick = handsontableMouseTriggerFactory('click');

/**
 * Simulate click (all mouse events).
 *
 * @param {Element} element An element on which there will be performed mouse events.
 * @param {number} buttonKey Number representing mouse button key.
 */
export function simulateClick(element, buttonKey) {
  const mouseButton = getMouseButton(buttonKey);

  mouseDown(element, mouseButton);
  mouseUp(element, mouseButton);
  mouseClick(element, mouseButton);
}

/**
 * Simulate double click (all mouse events).
 *
 * @param {Element} element An element on which there will be performed mouse events.
 */
export function mouseDoubleClick(element) {
  mouseDown(element);
  mouseUp(element);
  mouseDown(element);
  mouseUp(element);
}

export const mouseRightDown = handsontableMouseTriggerFactory('mousedown', getMouseButton('RMB'));
export const mouseRightUp = handsontableMouseTriggerFactory('mouseup', getMouseButton('RMB'));
