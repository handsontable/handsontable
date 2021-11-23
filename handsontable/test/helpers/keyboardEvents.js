const { KEY_CODES } = Handsontable.helper;
const KEYCODES_MAP = new Map([
  ['a', KEY_CODES.A],
  ['alt', KEY_CODES.ALT],
  ['arrowdown', KEY_CODES.ARROW_DOWN],
  ['arrowleft', KEY_CODES.ARROW_LEFT],
  ['arrowright', KEY_CODES.ARROW_RIGHT],
  ['arrowup', KEY_CODES.ARROW_UP],
  ['audiodown', KEY_CODES.AUDIO_DOWN],
  ['audiomute', KEY_CODES.AUDIO_MUTE],
  ['audioup', KEY_CODES.AUDIO_UP],
  ['backspace', KEY_CODES.BACKSPACE],
  ['c', KEY_CODES.C],
  ['capslock', KEY_CODES.CAPS_LOCK],
  ['ctrl', window.navigator.platform.includes('Mac') ? KEY_CODES.COMMAND_LEFT : KEY_CODES.CONTROL],
  ['control', KEY_CODES.CONTROL],
  ['meta', KEY_CODES.COMMAND_LEFT],
  ['delete', KEY_CODES.DELETE],
  ['end', KEY_CODES.END],
  ['enter', KEY_CODES.ENTER],
  ['esc', KEY_CODES.ESCAPE],
  ['escape', KEY_CODES.ESCAPE],
  ['f1', KEY_CODES.F1],
  ['f2', KEY_CODES.F2],
  ['f3', KEY_CODES.F3],
  ['f4', KEY_CODES.F4],
  ['f5', KEY_CODES.F5],
  ['f6', KEY_CODES.F6],
  ['f7', KEY_CODES.F7],
  ['f8', KEY_CODES.F8],
  ['f9', KEY_CODES.F9],
  ['f10', KEY_CODES.F10],
  ['f11', KEY_CODES.F11],
  ['f12', KEY_CODES.F12],
  ['f13', KEY_CODES.F13],
  ['f14', KEY_CODES.F14],
  ['f15', KEY_CODES.F15],
  ['f16', KEY_CODES.F16],
  ['f17', KEY_CODES.F17],
  ['f18', KEY_CODES.F18],
  ['f19', KEY_CODES.F19],
  ['home', KEY_CODES.HOME],
  ['insert', KEY_CODES.INSERT],
  ['medianext', KEY_CODES.MEDIA_NEXT],
  ['mediaplaypause', KEY_CODES.MEDIA_PLAY_PAUSE],
  ['mediaprev', KEY_CODES.MEDIA_PREV],
  ['mediastop', KEY_CODES.MEDIA_STOP],
  ['null', KEY_CODES.NULL],
  ['numlock', KEY_CODES.NUM_LOCK],
  ['pagedown', KEY_CODES.PAGE_DOWN],
  ['pageup', KEY_CODES.PAGE_UP],
  ['pause', KEY_CODES.PAUSE],
  ['scrolllock', KEY_CODES.SCROLL_LOCK],
  ['shift', KEY_CODES.SHIFT],
  ['space', KEY_CODES.SPACE],
  ['tab', KEY_CODES.TAB],
  ['v', KEY_CODES.V],
  ['x', KEY_CODES.X],
  ['y', KEY_CODES.Y],
  ['z', KEY_CODES.Z],
]);

/**
 * Returns a function that triggers a key event.
 *
 * @param {string} type Event type.
 * @param target
 * @returns {Function}
 */
export function handsontableKeyTriggerFactory(type, target) {
  return function(key, extend) {
    const ev = {};

    ev.keyCode = KEYCODES_MAP.has(key) ? KEYCODES_MAP.get(key) : key.codePointAt(0);
    ev.key = key;

    $.extend(ev, extend);
    $(target).simulate(type, ev);
  };
}

export const keyDown = triggerKeys('keydown');
export const keyUp = triggerKeys('keyup');

/**
 * @param {string} type Event type.
 * @returns {Function}
 */
function triggerKeys(type) {
  return function(keys, extend = {}, target = document.activeElement) {
    keys.forEach((key) => {

      extend.ctrlKey = keys.includes('control');
      extend.metaKey = keys.includes('control');
      extend.shiftKey = keys.includes('shift');

      handsontableKeyTriggerFactory(type, target)(key, extend);
    });
  };
}

/**
 * Presses keyDown, then keyUp.
 *
 * @param {Array} keys The keys `key` which will be associated with the event.
 * @param {object} extend Additional options which extends the event.
 * @param target
 */
export function keyDownUp(keys, extend, target) {
  keyDown(keys, extend, target);
  keyUp(keys, extend, target);
}

/**
 * Returns current value of the keyboard proxy textarea.
 *
 * @returns {string}
 */
export function keyProxy() {
  return spec().$container.find('textarea.handsontableInput');
}
