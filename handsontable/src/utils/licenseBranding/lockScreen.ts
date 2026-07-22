import { html } from '../../helpers/templateLiteralTag';
import { SALES_MAILTO } from './content';
import type { LockContent } from './content';
import type { HotInstance } from '../../core/types';

// The lock reuses the confirm Dialog's CSS by wearing its class names. The stylesheet ships in full
// regardless of which JS plugins are bundled, so borrowing the classes inherits the dialog's whole
// look and sizing for free - while the JS below is a minimal, self-contained copy that never
// imports the (optional) Dialog plugin. Keep these names in sync with `plugins/dialog/constants.ts`
// and the confirm template.
const DIALOG_CLASS = 'ht-dialog';
const LOCK_CLASS = 'ht-license-lock';
const SCOPE_ID = 'licenseLock';
const SHORTCUTS_CONTEXT_NAME = `plugin:${SCOPE_ID}`;
const SHORTCUTS_GROUP = SCOPE_ID;

/**
 * Mounts the license lock screen: a blocking, non-dismissable hard-stop overlay covering the grid.
 * It looks and sizes itself exactly like a confirm Dialog by wearing the dialog's own CSS class
 * names (the stylesheet is always shipped in full, so the styling is inherited without duplicating
 * it), but it is a self-contained Core-owned element - it never touches the Dialog PLUGIN, which is
 * optional (it may be absent from a bundle) and, being a single shared surface an app uses for its
 * own dialogs, could not tell its own lifecycle apart from the lock's. This lock owns its element,
 * so showing it is unambiguous.
 *
 * Only the copy and behavior differ from a confirm dialog: it cannot be dismissed (no Close button,
 * no Escape shortcut - the hard stop is final), and it sits above app dialogs. Its width is pinned
 * to the table's workspace width on every render (the `.ht-dialog` box is otherwise `width: 100%`,
 * which would span the whole root wrapper, not the grid - a minimal copy of the plugin's own
 * sizing); its height is the grid box. It integrates with the focus manager as a modal scope and
 * routes its Tab focus trap through the shortcut manager, exactly like the Dialog plugin.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @param {LockContent} content The lock copy.
 * @returns {void}
 */
export function mountLicenseLock(hotInstance: HotInstance, content: LockContent): void {
  const host = hotInstance.rootOverlaysElement;

  if (!host) {
    return;
  }

  const focusScopeManager = hotInstance.getFocusScopeManager();
  const shortcutManager = hotInstance.getShortcutManager();
  const isRtl = hotInstance.isRtl();
  const titleId = `${hotInstance.guid}-license-lock-title`;
  const descriptionId = `${hotInstance.guid}-license-lock-description`;
  // The exact class set the plugin's confirm dialog carries when shown, plus `ht-license-lock`.
  const lockClassName = `${DIALOG_CLASS} ${DIALOG_CLASS}--confirm handsontable ${LOCK_CLASS} ` +
    `${DIALOG_CLASS}--background-solid ${DIALOG_CLASS}--show`;

  // The confirm-dialog DOM, rebuilt with the dialog's class names (`ht-dialog--confirm`,
  // `__content-wrapper`, `__content`, `__title`, `__description`, `__buttons`, `ht-button`) plus the
  // `handsontable` class the dialog carries (the `.ht-button` base rules are scoped under it). The
  // copy is assigned through `textContent` below, never interpolated into the markup.
  const { refs } = html`
    <div data-ref="lock" class="${lockClassName}"
      role="alertdialog" aria-modal="true"
      aria-labelledby="${titleId}" aria-describedby="${descriptionId}"
      tabindex="-1" dir="${isRtl ? 'rtl' : 'ltr'}" style="display: block;">
      <div class="${DIALOG_CLASS}__content-wrapper">
        <div data-ref="inner" tabindex="-1" class="${DIALOG_CLASS}__content-wrapper-inner">
          <div class="${DIALOG_CLASS}__content">
            <h2 data-ref="title" id="${titleId}" class="${DIALOG_CLASS}__title"></h2>
            <p data-ref="description" id="${descriptionId}" class="${DIALOG_CLASS}__description"></p>
          </div>
          <div class="${DIALOG_CLASS}__buttons">
            <button data-ref="contactButton" type="button" class="ht-button ht-button--primary">Contact Sales</button>
          </div>
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

  const getFocusableControls = () => Array.from(lock.querySelectorAll<HTMLElement>('a[href], button'));

  // Match the dialog's sizing: the `.ht-dialog` box is `width: 100%` of the root wrapper, so it is
  // pinned to the table's workspace width on every render (a minimal copy of the plugin's
  // `#onAfterViewRender`); the height is the grid box via the CSS `height: 100%`.
  const syncWidth = () => {
    const { view } = hotInstance;
    const width = view.isHorizontallyScrollableByWindow()
      ? view.getTotalTableWidth() : view.getWorkspaceWidth();

    lock.style.width = `${width}px`;
  };

  hotInstance.addHook('afterViewRender', syncWidth);

  const shortcutsContext = shortcutManager.getContext(SHORTCUTS_CONTEXT_NAME) ??
    shortcutManager.addContext(SHORTCUTS_CONTEXT_NAME);

  // The modal focus trap: Tab cycles through the lock's own controls and never leaves. The focus
  // scope switches the manager to this context while focus is inside the lock, so these shortcuts
  // never fire for the grid and the grid's shortcuts never fire under the lock.
  shortcutsContext.addShortcut({
    keys: [['Tab'], ['Shift', 'Tab']],
    callback: (event: KeyboardEvent) => {
      const controls = getFocusableControls();
      const index = controls.indexOf(hotInstance.rootDocument.activeElement as HTMLElement);
      const delta = event.shiftKey ? -1 : 1;

      controls[(index + delta + controls.length) % controls.length]?.focus();
    },
    group: SHORTCUTS_GROUP,
  });

  focusScopeManager.registerScope(SCOPE_ID, lock, {
    shortcutsContextName: SHORTCUTS_CONTEXT_NAME,
    type: 'modal',
    onActivate: (focusSource: string) => {
      const controls = getFocusableControls();

      if (focusSource === 'tab_from_below') {
        controls[controls.length - 1]?.focus();
      } else {
        controls[0]?.focus();
      }
    },
  });

  host.appendChild(lock);

  // The lock mounts during `init()`, before the grid's first render, so moving focus into it waits
  // for `afterInit`.
  hotInstance.addHookOnce('afterInit', () => {
    syncWidth();
    hotInstance.deselectCell();
    // The lock takes over the whole grid surface, so it claims the keyboard explicitly: the shortcut
    // pipeline only processes non-global events while the instance is listening, and a freshly
    // initialized grid is not listening until the user interacts with it.
    hotInstance.listen();
    focusScopeManager.activateScope(SCOPE_ID);
  });
}
