import { buildTemplate } from '../../helpers/dom/template';
import { getDeepActiveElement } from '../../helpers/dom/element';
import { getOverlayLayerWidth } from '../../core/layout/overlayWidth';
import { announce } from '../a11yAnnouncer';
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

/**
 * Mounts the license lock screen: a blocking, non-dismissable overlay covering the grid.
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
 * sizing); its height is the grid box.
 *
 * It covers the grid, not the page, so unlike the Dialog plugin it traps no focus: Tab walks the
 * lock's own links in document order and then leaves for the rest of the page (WCAG 2.1.2). While it
 * is mounted the grid is `inert`, so assistive technology does not read the data behind it and the
 * pointer cannot reach it, and its focus scope covers the grid body, so no shortcut or typed key reads
 * or writes a cell. The clipboard's native `paste` and `cut` listeners are outside that guard by
 * construction. It announces its title once through the grid announcer.
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
  const { refs } = buildTemplate({
    tag: 'div',
    ref: 'lock',
    className: lockClassName,
    attrs: {
      role: 'alertdialog',
      'aria-labelledby': titleId,
      'aria-describedby': descriptionId,
      tabindex: '-1',
      dir: isRtl ? 'rtl' : 'ltr',
      style: 'display: block;',
    },
    children: [{
      tag: 'div',
      className: `${DIALOG_CLASS}__content-wrapper`,
      children: [{
        tag: 'div',
        ref: 'inner',
        className: `${DIALOG_CLASS}__content-wrapper-inner`,
        attrs: { tabindex: '-1' },
        children: [
          {
            tag: 'div',
            className: `${DIALOG_CLASS}__content`,
            children: [
              {
                tag: 'h2', ref: 'title', className: `${DIALOG_CLASS}__title`, attrs: { id: titleId },
              },
              {
                tag: 'p',
                ref: 'description',
                className: `${DIALOG_CLASS}__description`,
                attrs: { id: descriptionId },
              },
            ],
          },
          {
            tag: 'div',
            className: `${DIALOG_CLASS}__buttons`,
            children: [{
              tag: 'a',
              ref: 'contactButton',
              className: 'ht-button ht-button--secondary',
              attrs: { rel: 'noopener' },
            }],
          },
        ],
      }],
    }],
  }, hotInstance.rootDocument);
  const lock = refs.lock;

  refs.title.textContent = content.title;
  refs.description.textContent = content.description;
  // A real ANCHOR wearing the button classes, not a button with a click handler. The action is a
  // `mailto:` address, and neither scripted route is safe for one: `window.open(..., '_blank')`
  // leaves an empty tab behind on Firefox and Safari once the mail client takes over, and assigning
  // `location.href` is treated as a real navigation by several browsers when no mail handler is
  // registered - which would unload the app, or the iframe, from under a lock that cannot be
  // dismissed. A same-window anchor click is the one path browsers special-case, and it is what the
  // bottom bar and the badge popover already use for the same addresses.
  refs.contactButton.textContent = content.action.text;
  // `setAttribute`, because the template's refs are plain `HTMLElement`s - no cast needed for one
  // attribute.
  refs.contactButton.setAttribute('href', content.action.href);

  // Built as nodes, never interpolated: the copy is authored here, but keeping it out of `innerHTML`
  // means no license sentence can ever become markup. The anchor is a plain link, so it joins the
  // browser's Tab order with no help from the lock.
  if (content.docsLink) {
    const link = hotInstance.rootDocument.createElement('a');

    link.href = content.docsLink.href;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = content.docsLink.text;

    refs.description.appendChild(link);
    refs.description.appendChild(hotInstance.rootDocument.createTextNode(content.docsLink.trailingText));
  }

  // Collects the action anchor and the optional documentation link, in document order. Only the scope's
  // `onActivate` needs them: where focus lands when the user reaches the lock.
  const getFocusableControls = () => Array.from(lock.querySelectorAll<HTMLElement>('a[href], button'));

  // Match the dialog's sizing: the `.ht-dialog` box is `width: 100%` of the root wrapper, so it is
  // pinned on every render to the width the plugin's `#onAfterViewRender` uses (the table plus the
  // side slots); the height is the grid box via the CSS `height: 100%`.
  const syncWidth = () => {
    lock.style.width = `${getOverlayLayerWidth(hotInstance)}px`;
  };

  hotInstance.addHook('afterViewRender', syncWidth);

  // An EMPTY context on purpose: the focus scope switches the shortcut manager to it while focus is
  // inside the lock, so no grid shortcut fires under the lock. It registers no Tab shortcut either -
  // the lock traps no focus, so the browser's own Tab order walks its links and leaves.
  if (!shortcutManager.getContext(SHORTCUTS_CONTEXT_NAME)) {
    shortcutManager.addContext(SHORTCUTS_CONTEXT_NAME);
  }

  focusScopeManager.registerScope(SCOPE_ID, lock, {
    shortcutsContextName: SHORTCUTS_CONTEXT_NAME,
    type: 'modal',
    // The lock is painted over the whole grid body. Without this, a shortcut that reads or writes cell
    // content asked only whether cells are drawn - and they are, under the lock.
    coversGridBody: true,
    onActivate: (focusSource: string) => {
      const controls = getFocusableControls();

      // Focus is already on one of the lock's links (Tab walked in, or the user clicked a link): the
      // activation must not pull it onto the action, which would skip the documentation link. A click
      // on the lock's own surface focuses the container, which is not a link, so it still lands on
      // the action.
      if (controls.includes(getDeepActiveElement(hotInstance.rootDocument) as HTMLElement)) {
        return;
      }

      if (focusSource === 'tab_from_below') {
        controls[controls.length - 1]?.focus();
      } else if (focusSource === 'tab_from_above') {
        // Forward Tab from the page above enters at the FIRST control in document order. Where a lock
        // carries a documentation link, that link sits inside the description and so comes before the
        // action: landing on the action would skip it, now that Tab goes on to the page instead of
        // cycling back to it.
        controls[0]?.focus();
      } else {
        // A click, or a focus that came from somewhere else: the ACTION, the one thing the lock asks
        // the user to do.
        refs.contactButton.focus();
      }
    },
  });

  host.appendChild(lock);

  // The lock mounts during `init()`, before the grid's first render, so its width sync waits for
  // `afterInit`.
  //
  // It does NOT take focus here. A grid can initialize while the user is typing somewhere else on the
  // page (a login form above it, another grid), and grabbing the keyboard at construction would pull
  // focus out of that field, scroll the page down to the lock, and - because `listen()` un-listens
  // every other instance - take the keyboard away from a licensed grid too. Two blocked grids would
  // fight over it. The Dialog plugin guards its own focus grab the same way, on whether the grid was
  // already listening.
  //
  // Nothing is lost by waiting: the focus scope manager activates a scope, and calls `listen()`
  // itself, on the first focusin or click inside the scope element. So the lock owns the keyboard the
  // moment the user actually reaches it - by clicking it (it covers the whole grid) or by tabbing in
  // through a focus catcher - and not one moment earlier.
  hotInstance.addHookOnce('afterInit', () => {
    syncWidth();
    // The grid underneath is unusable, so it must not look selected. This moves no focus.
    hotInstance.deselectCell();
    // The lock is painted over the grid, but the data stays in the DOM and in the accessibility
    // tree. `inert` takes it out of both, and out of the Tab order and the pointer's reach. It sits
    // on the grid alone: the "Powered by" bar below it is branding, and the lock is in the overlays
    // layer, outside this subtree. It is behavior, not ARIA, so `ariaTags: false` does not change it.
    hotInstance.rootGridElement.setAttribute('inert', '');
    // The lock mounts without moving focus, so a screen reader would not otherwise say anything. The
    // title alone: the live region is shared by every grid on the page, and the description and the
    // action are reachable by Tab. Not checked with a real screen reader, which can ignore the first
    // update of a region added on the same page load.
    announce(content.title, 'polite');
  });
}
