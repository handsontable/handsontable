import { createKeyStore } from './keyStore';
import { normalizeKeyCode } from './utils';

/**
 * @param {EventTarget} frame
 * @param invokeClbck
 */
export function useRecorder(frame, invokeClbck) {
  const keyStore = createKeyStore();
  let eventTarget = frame;

  window.keys = keyStore;

  while (eventTarget) {
    eventTarget.addEventListener('keydown', onkeydown);
    eventTarget.addEventListener('keyup', onkeyup);
    eventTarget.addEventListener('blur', onblur);
    eventTarget.addEventListener('unload', onunload);

    eventTarget = eventTarget.frameElement;
  }

  /**
   * @param event
   */
  function onkeydown(event) {
    keyStore.press(normalizeKeyCode(event.code));

    const nextCombination = keyStore.getPressed().sort().join('+');

    invokeClbck(event, nextCombination);
  }

  /**
   * @param event
   */
  function onkeyup(event) {
    keyStore.release(normalizeKeyCode(event.code));
  }

  /**
   * @param event
   */
  function onblur() {
    keyStore.releaseAll();
  }
}
