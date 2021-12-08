import { createKeysController } from './keyController';
import { normalizeEventKey } from './utils';

/**
 * Keys recorder tracking key events.
 *
 * @param {EventTarget} frame The starting frame element.
 * @param {Function} invokeClbck The KeyEvent's listener callback.
 * @returns {object}
 */
export function useRecorder(frame, invokeClbck) {
  const keysController = createKeysController();

  /**
   * Get every pressed key (including meta keys) from performed KeyboardEvent.
   *
   * @private
   * @param {KeyboardEvent} event The event object.
   * @returns {Array}
   */
  const getEveryPressedKey = (event) => {
    const pressedKey = normalizeEventKey(event.key);
    const isMetaKey = ['meta', 'control', 'alt', 'shift'].includes(pressedKey);
    const pressedKeys = [pressedKey];

    if (isMetaKey === false) {
      if (event.altKey) {
        pressedKeys.push('alt');
      }

      if (event.ctrlKey) {
        pressedKeys.push('control');
      }

      if (event.metaKey) {
        pressedKeys.push('meta');
      }

      if (event.shiftKey) {
        pressedKeys.push('shift');
      }
    }

    return pressedKeys;
  };

  /**
   * KeyboardEvent's callback.
   *
   * @private
   * @param {KeyboardEvent} event The event object.
   */
  const onkeydown = (event) => {
    if (event.key === void 0) {
      return;
    }

    const pressedKeys = getEveryPressedKey(event);
    const nextCombination = pressedKeys.sort().join('+');

    invokeClbck(event, nextCombination);
  };

  /**
   * KeyboardEvent's callback.
   *
   * @private
   * @param {KeyboardEvent} event The event object.
   */
  const onkeyup = (event) => {
    if (event.key === void 0) {
      return;
    }

    keysController.release(normalizeEventKey(event.key));
  };

  /**
   * FocusEvent's callback.
   *
   * @private
   */
  const onblur = () => {
    keysController.releaseAll();
  };

  /**
   * Add event listeners to the starting frame and its parents' frames.
   */
  const mount = () => {
    let eventTarget = frame;

    while (eventTarget) {
      eventTarget.addEventListener('keydown', onkeydown);
      eventTarget.addEventListener('keyup', onkeyup);
      eventTarget.addEventListener('blur', onblur);

      eventTarget = eventTarget.frameElement;
    }
  };

  /**
   * Remove event listeners from the starting frame and its parents' frames.
   */
  const unmount = () => {
    let eventTarget = frame;

    while (eventTarget) {
      eventTarget.removeEventListener('keydown', onkeydown);
      eventTarget.removeEventListener('keyup', onkeyup);
      eventTarget.removeEventListener('blur', onblur);

      eventTarget = eventTarget.frameElement;
    }
  };

  return {
    mount,
    unmount,
    getPressed: () => keysController.getPressed(),
    isPressed: key => keysController.isPressed(key),
  };
}
