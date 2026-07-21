import { html } from '../../helpers/templateLiteralTag';
import { SALES_MAILTO } from './content';
import type { LockContent } from './content';
import type { HotInstance } from '../../core/types';

const LOCK_CLASS = 'ht-license-lock';
const SCOPE_ID = 'licenseLock';
const SHORTCUTS_CONTEXT_NAME = `plugin:${SCOPE_ID}`;
const SHORTCUTS_GROUP = SCOPE_ID;

/**
 * Options of a lock-screen mount.
 */
export interface LockMountOptions {
  /**
   * Defers moving focus into the lock to `afterInit`. Used for the initial mount, which runs during
   * `init()` before the grid has rendered; a remount (a runtime key change) activates immediately.
   */
  deferActivation: boolean;
}

/**
 * Collects the lock's focusable controls, in DOM order.
 *
 * @param {HTMLElement} lock The lock element.
 * @returns {HTMLElement[]}
 */
function getFocusableControls(lock: HTMLElement): HTMLElement[] {
  return Array.from(lock.querySelectorAll<HTMLElement>('a[href], button'));
}

/**
 * Mounts the license lock screen: a Core-owned overlay covering the grid, shown for the
 * hard-stopped states. It is deliberately NOT built on the Dialog plugin - the plugin is a single
 * shared surface that an application legitimately uses for its own dialogs, so a lock based on it
 * cannot tell its own lifecycle apart from the app's (any `show` replaces it, any hide looks like a
 * dismissal, and a `dialog: true` setup never tears it down). This lock owns its element, so
 * showing, dismissing, and unmounting are unambiguous.
 *
 * The lock integrates with the focus manager as a modal scope: `Tab` cycles through its controls,
 * focus moves in when it appears (deferred to `afterInit` on the initial mount - the grid has not
 * rendered yet during `init()`), and the scope dies with the lock. A closable lock (the
 * subscription Case 3a) dismisses through its Close button or `Escape`; the trial lock has no
 * dismiss affordance at all.
 *
 * Returns the unmount function - the caller (see `index.ts`) unmounts when a runtime key change
 * resolves to a different license state, which is what releases a fixed-up grid without a page
 * reload.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @param {LockContent} content The lock copy and closability.
 * @param {LockMountOptions} options The mount options.
 * @returns {Function} The unmount function.
 */
export function mountLicenseLock(
  hotInstance: HotInstance,
  content: LockContent,
  options: LockMountOptions,
): () => void {
  const host = hotInstance.rootOverlaysElement;
  const doc = hotInstance.rootDocument;

  if (!host) {
    return () => {};
  }

  const lockId = `${hotInstance.guid}-license-lock`;

  // `alertdialog` for the non-closable trial lock (it interrupts and offers no way back), plain
  // `dialog` for the closable subscription lock. The copy is assigned through `textContent` below,
  // never interpolated into the markup.
  const { refs } = html`
    <div data-ref="lock" class="${LOCK_CLASS}" role="${content.closable ? 'dialog' : 'alertdialog'}"
      aria-modal="true" aria-labelledby="${lockId}-title" aria-describedby="${lockId}-description"
      tabindex="-1">
      <div class="${LOCK_CLASS}__panel">
        <div data-ref="title" id="${lockId}-title" class="${LOCK_CLASS}__title"></div>
        <p data-ref="description" id="${lockId}-description" class="${LOCK_CLASS}__description"></p>
        <div class="${LOCK_CLASS}__buttons">
          <button data-ref="contactButton" type="button" class="ht-button ht-button--primary">Contact Sales</button>
          ${content.closable
    ? '<button data-ref="closeButton" type="button" class="ht-button ht-button--secondary">Close</button>'
    : ''}
        </div>
      </div>
    </div>
  `;
  const lock = refs.lock;

  refs.title.textContent = content.title;
  refs.description.textContent = content.description;
  refs.contactButton.addEventListener('click', () => {
    hotInstance.rootWindow.open(SALES_MAILTO, '_blank', 'noopener');
  });

  const focusScopeManager = hotInstance.getFocusScopeManager();
  const shortcutManager = hotInstance.getShortcutManager();

  const unmount = () => {
    if (!host.contains(lock)) {
      return;
    }

    lock.remove();
    shortcutManager.getContext(SHORTCUTS_CONTEXT_NAME)?.removeShortcutsByGroup(SHORTCUTS_GROUP);
    focusScopeManager.deactivateScope(SCOPE_ID);
    focusScopeManager.unregisterScope(SCOPE_ID);
  };

  refs.closeButton?.addEventListener('click', () => unmount());

  // The keyboard paths go through the shortcut manager, exactly like the Dialog plugin's: the focus
  // scope switches the manager to this context while focus is inside the lock, so the shortcuts
  // never fire for the grid and the grid's shortcuts never fire under the lock.
  const shortcutsContext = shortcutManager.getContext(SHORTCUTS_CONTEXT_NAME) ??
    shortcutManager.addContext(SHORTCUTS_CONTEXT_NAME);

  // The modal focus trap: Tab cycles through the lock's own controls and never leaves.
  shortcutsContext.addShortcut({
    keys: [['Tab'], ['Shift', 'Tab']],
    callback: (event: KeyboardEvent) => {
      const controls = getFocusableControls(lock);
      const index = controls.indexOf(doc.activeElement as HTMLElement);
      const delta = event.shiftKey ? -1 : 1;

      controls[(index + delta + controls.length) % controls.length]?.focus();
    },
    runOnlyIf: () => host.contains(lock),
    group: SHORTCUTS_GROUP,
  });

  if (content.closable) {
    shortcutsContext.addShortcut({
      keys: [['Escape']],
      callback: () => unmount(),
      runOnlyIf: () => host.contains(lock),
      group: SHORTCUTS_GROUP,
    });
  }

  focusScopeManager.registerScope(SCOPE_ID, lock, {
    shortcutsContextName: SHORTCUTS_CONTEXT_NAME,
    type: 'modal',
    runOnlyIf: () => host.contains(lock),
    onActivate: (focusSource: string) => {
      const controls = getFocusableControls(lock);

      if (focusSource === 'tab_from_below') {
        controls[controls.length - 1]?.focus();
      } else {
        controls[0]?.focus();
      }
    },
  });

  host.appendChild(lock);

  const activate = () => {
    // A runtime key change can unmount the lock before the deferred activation fires.
    if (!host.contains(lock)) {
      return;
    }

    hotInstance.deselectCell();
    // The lock takes over the whole grid surface, so it claims the keyboard explicitly: the
    // shortcut pipeline only processes non-global events while the instance is listening, and a
    // freshly initialized grid is not listening until the user interacts with it.
    hotInstance.listen();
    focusScopeManager.activateScope(SCOPE_ID);
  };

  if (options.deferActivation) {
    hotInstance.addHookOnce('afterInit', () => activate());
  } else {
    activate();
  }

  return unmount;
}
