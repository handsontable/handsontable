
const MOUSE_BUTTONS = new Map();

MOUSE_BUTTONS.set('LMB', 1);
MOUSE_BUTTONS.set('MMB', 2);
MOUSE_BUTTONS.set('RMB', 3);

function getMouseButton(key) {
  return MOUSE_BUTTONS.get(key);
}

/**
 * Returns a function that triggers a mouse event
 * @param {String} type Event type
 * @return {Function}
 */
export function handsontableMouseTriggerFactory(type, button) {
  return function(element) {
    let handsontableElement = element;

    if (!(handsontableElement instanceof jQuery)) {
      handsontableElement = $(handsontableElement);
    }
    const ev = $.Event(type);
    ev.which = button || 1; // left click by default

    handsontableElement.simulate(type, ev);
  };
}

export const mouseMove = handsontableMouseTriggerFactory('mousemove');
export const mouseDown = handsontableMouseTriggerFactory('mousedown');
export const mouseOver = handsontableMouseTriggerFactory('mouseover');
export const mouseUp = handsontableMouseTriggerFactory('mouseup');
export const mouseClick = handsontableMouseTriggerFactory('click');

export function simulateClick(element, button) {
  const mouseButton = getMouseButton(button);

  mouseDown(element, mouseButton);
  mouseUp(element, mouseButton);
  mouseClick(element, mouseButton);
}

export function mouseDoubleClick(element) {
  mouseDown(element);
  mouseUp(element);
  mouseDown(element);
  mouseUp(element);
}

export const mouseRightDown = handsontableMouseTriggerFactory('mousedown', getMouseButton('RMB'));
export const mouseRightUp = handsontableMouseTriggerFactory('mouseup', getMouseButton('RMB'));
