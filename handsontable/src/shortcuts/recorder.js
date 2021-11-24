import { createKeysController } from './keyStore';
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
   * KeyboardEvent's callback.
   *
   * @private
   * @param {KeyboardEvent} event The event object.
   */
  const onkeydown = (event) => {
    if (event.key === void 0) {
      return;
    }

    keysController.press(normalizeEventKey(event.key));

    const nextCombination = keysController.getPressed().sort().join('+');

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
