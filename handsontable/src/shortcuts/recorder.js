import { createKeyStore } from './keyStore';
import { normalizeEventKey } from './utils';

/**
 * @param {EventTarget} frame
 * @param {Function} invokeClbck
 * @returns {Function}
 */
export function useRecorder(frame, invokeClbck) {
  const keyStore = createKeyStore();

  /**
   * @private
   * @param {KeyboardEvent} event
   */
  const onkeydown = (event) => {
    if (event.key === void 0) {
      return;
    }

    keyStore.press(normalizeEventKey(event.key));

    const nextCombination = keyStore.getPressed().sort().join('+');

    invokeClbck(event, nextCombination);
  };

  /**
   * @private
   * @param {KeyboardEvent} event
   */
  const onkeyup = (event) => {
    if (event.key === void 0) {
      return;
    }

    keyStore.release(normalizeEventKey(event.key));
  };

  /**
   * @private
   */
  const onblur = () => {
    keyStore.releaseAll();
  };

  /**
   *
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
   *
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
    getPressed: () => keyStore.getPressed(),
    isPressed: key => keyStore.isPressed(key),
  };
}
