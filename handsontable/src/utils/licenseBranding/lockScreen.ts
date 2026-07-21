import { SALES_MAILTO } from './content';
import type { LockContent } from './content';
import type { HotInstance } from '../../core/types';

const LOCK_CLASS = 'ht-license-lock';
const SCOPE_ID = 'licenseLock';
const SHORTCUTS_CONTEXT_NAME = `plugin:${SCOPE_ID}`;

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
  const lock = doc.createElement('div');

  lock.className = LOCK_CLASS;
  // `alertdialog` for the non-closable trial lock (it interrupts and offers no way back), plain
  // `dialog` for the closable subscription lock.
  lock.setAttribute('role', content.closable ? 'dialog' : 'alertdialog');
  lock.setAttribute('aria-modal', 'true');
  lock.setAttribute('aria-labelledby', `${lockId}-title`);
  lock.setAttribute('aria-describedby', `${lockId}-description`);
  lock.tabIndex = -1;

  const panel = doc.createElement('div');

  panel.className = `${LOCK_CLASS}__panel`;

  const title = doc.createElement('div');

  title.id = `${lockId}-title`;
  title.className = `${LOCK_CLASS}__title`;
  title.textContent = content.title;

  const description = doc.createElement('p');

  description.id = `${lockId}-description`;
  description.className = `${LOCK_CLASS}__description`;
  description.textContent = content.description;

  const buttons = doc.createElement('div');

  buttons.className = `${LOCK_CLASS}__buttons`;

  const contactButton = doc.createElement('button');

  contactButton.type = 'button';
  contactButton.className = 'ht-button ht-button--primary';
  contactButton.textContent = 'Contact Sales';
  contactButton.addEventListener('click', () => {
    hotInstance.rootWindow.open(SALES_MAILTO, '_blank', 'noopener');
  });
  buttons.appendChild(contactButton);

  panel.appendChild(title);
  panel.appendChild(description);
  panel.appendChild(buttons);
  lock.appendChild(panel);

  const focusScopeManager = hotInstance.getFocusScopeManager();

  const unmount = () => {
    if (!host.contains(lock)) {
      return;
    }

    lock.remove();
    focusScopeManager.deactivateScope(SCOPE_ID);
    focusScopeManager.unregisterScope(SCOPE_ID);
  };

  if (content.closable) {
    const closeButton = doc.createElement('button');

    closeButton.type = 'button';
    closeButton.className = 'ht-button ht-button--secondary';
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', () => unmount());
    buttons.appendChild(closeButton);
  }

  lock.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && content.closable) {
      event.stopPropagation();
      unmount();

      return;
    }

    // The modal focus trap: Tab cycles through the lock's own controls and never leaves.
    if (event.key === 'Tab') {
      const controls = getFocusableControls(lock);
      const first = controls[0];
      const last = controls[controls.length - 1];
      const active = doc.activeElement;

      if (event.shiftKey && (active === first || active === lock)) {
        event.preventDefault();
        last?.focus();

      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  });

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
    focusScopeManager.activateScope(SCOPE_ID);
  };

  if (options.deferActivation) {
    hotInstance.addHookOnce('afterInit', () => activate());
  } else {
    activate();
  }

  return unmount;
}
