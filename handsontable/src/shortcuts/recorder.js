import { createKeyStore } from './keyStore';
import { normalizeKeyCode } from './utils';

/**
 * @param {EventTarget} frame
 * @param invokeClbck
 */
export function useRecorder(frame, invokeClbck) {
  const keyStore = createKeyStore();
  const eventTarget = frame;

  while (eventTarget.defaultView) {
    eventTarget.addEventListener('keydown', onkeydown);
    eventTarget.addEventListener('keyup', onkeyup);
    eventTarget.addEventListener('blur', onblur);
    eventTarget.addEventListener('unload', onunload);
  }

  /**
   * @param event
   */
  function onkeydown(event) {
    keyStore.press(normalizeKeyCode(event.code));

    const nextCombination = keyStore.getPressed().join('+');

    invokeClbck(nextCombination.split('+'), event);
  }

  /**
   * @param event
   */
  function onkeyup(event) {
    keyStore.release(normalizeKeyCode(event.code));

    const nextCombination = keyStore.getPressed().join('+');

    if (nextCombination.length) {
      invokeClbck(nextCombination.split('+'), event);
    }
  }

  /**
   * @param event
   */
  function onblur() {
    keyStore.releaseAll();
  }
}
