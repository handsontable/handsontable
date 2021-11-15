import { createKeyStore } from './keyStore';
import { normalizeEventKey } from './utils';

/**
 * @param {EventTarget} frame
 * @param {Function} invokeClbck
 * @returns {Function}
 */
export function useRecorder(frame, invokeClbck) {
  const keyStore = createKeyStore();
  let eventTarget = frame;

  while (eventTarget) {
    eventTarget.addEventListener('keydown', onkeydown);
    eventTarget.addEventListener('keyup', onkeyup);
    eventTarget.addEventListener('blur', onblur);

    eventTarget = eventTarget.frameElement;
  }

  /**
   * @param {KeyboardEvent} event
   */
  function onkeydown(event) {
    keyStore.press(normalizeEventKey(event.key));

    const nextCombination = keyStore.getPressed().sort().join('+');

    invokeClbck(event, nextCombination);
  }

  /**
   * @param {KeyboardEvent} event
   */
  function onkeyup(event) {
    keyStore.release(normalizeEventKey(event.key));
  }

  /**
   *
   */
  function onblur() {
    keyStore.releaseAll();
  }

  return () => {
    eventTarget = frame;

    while (eventTarget) {
      eventTarget.removeEventListener('keydown', onkeydown);
      eventTarget.removeEventListener('keyup', onkeyup);
      eventTarget.removeEventListener('blur', onblur);

      eventTarget = eventTarget.frameElement;
    }
  };
}
