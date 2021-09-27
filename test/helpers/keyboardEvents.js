const { KEY_CODES } = Handsontable.helper;
const KEYS_MAP = new Map([
  ['a', KEY_CODES.A],
  ['alt', KEY_CODES.ALT],
  ['arrow_down', KEY_CODES.ARROW_DOWN],
  ['arrow_left', KEY_CODES.ARROW_LEFT],
  ['arrow_right', KEY_CODES.ARROW_RIGHT],
  ['arrow_up', KEY_CODES.ARROW_UP],
  ['audio_down', KEY_CODES.AUDIO_DOWN],
  ['audio_mute', KEY_CODES.AUDIO_MUTE],
  ['audio_up', KEY_CODES.AUDIO_UP],
  ['backspace', KEY_CODES.BACKSPACE],
  ['c', KEY_CODES.C],
  ['caps_lock', KEY_CODES.CAPS_LOCK],
  ['ctrl', window.navigator.platform.includes('Mac') ? KEY_CODES.COMMAND_LEFT : KEY_CODES.CONTROL],
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
  ['media_next', KEY_CODES.MEDIA_NEXT],
  ['media_play_pause', KEY_CODES.MEDIA_PLAY_PAUSE],
  ['media_prev', KEY_CODES.MEDIA_PREV],
  ['media_stop', KEY_CODES.MEDIA_STOP],
  ['null', KEY_CODES.NULL],
  ['num_lock', KEY_CODES.NUM_LOCK],
  ['page_down', KEY_CODES.PAGE_DOWN],
  ['page_up', KEY_CODES.PAGE_UP],
  ['pause', KEY_CODES.PAUSE],
  ['scroll_lock', KEY_CODES.SCROLL_LOCK],
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
 * @returns {Function}
 */
export function handsontableKeyTriggerFactory(type) {
  return function(key, extend) {
    const ev = {};
    let keyToTrigger = key;

    if (typeof keyToTrigger === 'string') {
      if (keyToTrigger.includes('ctrl+')) {
        keyToTrigger = keyToTrigger.replace('ctrl+', '');
        ev.ctrlKey = true;
        ev.metaKey = true;
      }

      if (keyToTrigger.includes('shift+')) {
        keyToTrigger = keyToTrigger.replace('shift+', '');
        ev.shiftKey = true;
      }

      if (!KEYS_MAP.has(keyToTrigger)) {
        throw new Error(`Unrecognised key name: ${keyToTrigger}`);
      }

      ev.keyCode = KEYS_MAP.get(keyToTrigger);

    } else if (typeof keyToTrigger === 'number') {
      ev.keyCode = keyToTrigger;
    }

    $.extend(ev, extend);
    $(document.activeElement).simulate(type, ev);
  };
}

export const keyDown = handsontableKeyTriggerFactory('keydown');
export const keyUp = handsontableKeyTriggerFactory('keyup');

/**
 * Presses keyDown, then keyUp.
 *
 * @param {string|number} key The key code which will be associated with the event.
 * @param {object} extend Additional options which extends the event.
 */
export function keyDownUp(key, extend) {
  if (typeof key === 'string' && key.includes('shift+')) {
    keyDown('shift');
  }

  keyDown(key, extend);
  keyUp(key, extend);

  if (typeof key === 'string' && key.includes('shift+')) {
    keyUp('shift');
  }
}

/**
 * Returns current value of the keyboard proxy textarea.
 *
 * @returns {string}
 */
export function keyProxy() {
  return spec().$container.find('textarea.handsontableInput');
}
