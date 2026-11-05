import { buildTemplate } from '../../helpers/dom/template';
import { LAYOUT_SLOTS, SLOT_ITEM_CLASS } from '../../core/layout/constants';
import { refreshSlotFilledState } from '../../core/layout/layoutManager';
import { POWERED_BY_CONTENT } from './content';
import type { HotInstance } from '../../core/types';

/**
 * The class of the "Powered by" bar. The license warning bar (`licenseNotification.ts`) is inserted in
 * front of an element with this class, so the branding stays last in the bottom slot.
 */
export const POWERED_BY_CLASS = 'ht-license-powered-by';

const SCOPE_ID = 'licensePoweredBy';
const SHORTCUTS_CONTEXT_NAME = `plugin:${SCOPE_ID}`;

/**
 * Builds the "Powered by Handsontable DataGrid" bar: one native link wrapping the decorative logomark
 * and the text, so the link's accessible name is the visible text.
 *
 * @param {Document} ownerDocument The document to build the nodes in.
 * @returns {{ bar: HTMLElement, link: HTMLElement }}
 */
function buildPoweredByBar(ownerDocument: Document): { bar: HTMLElement; link: HTMLElement } {
  const { refs } = buildTemplate<{ bar: HTMLElement; link: HTMLElement }>({
    tag: 'div',
    ref: 'bar',
    className: `handsontable ${POWERED_BY_CLASS}`,
    children: [{
      tag: 'a',
      ref: 'link',
      className: `${POWERED_BY_CLASS}__link`,
      attrs: {
        href: POWERED_BY_CONTENT.href,
        target: '_blank',
        rel: 'noopener noreferrer',
      },
      children: [
        { tag: 'span', className: `${POWERED_BY_CLASS}__logo`, attrs: { 'aria-hidden': 'true' } },
        { tag: 'span', className: `${POWERED_BY_CLASS}__text`, text: POWERED_BY_CONTENT.text },
      ],
    }],
  }, ownerDocument);

  return refs;
}

/**
 * Mounts the "Powered by Handsontable DataGrid" bar as the last element of the bottom slot, and
 * registers a focus scope so Tab and Shift+Tab move between the grid and its link.
 *
 * Like the license warning bar, it is a foreign node of the slot, NOT registered with the
 * `LayoutManager`: registering it would let the `layout` setting reorder or remove it, and the bar
 * cannot be turned off through configuration. It carries the shared slot-item class and refreshes the
 * slot-filled state by hand, as the layout module documents foreign nodes do. The scope is never
 * unregistered: the bar lives for the whole instance, and `getFocusScopeManager().destroy()` cleans it
 * up on `hot.destroy()`.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @returns {void}
 */
export function mountPoweredByBar(hotInstance: HotInstance): void {
  const container = hotInstance.rootSlotBottomElement;

  if (!container) {
    return;
  }

  const { bar, link } = buildPoweredByBar(container.ownerDocument);

  bar.classList.add(SLOT_ITEM_CLASS);
  container.appendChild(bar);
  refreshSlotFilledState(LAYOUT_SLOTS.BOTTOM, container);

  hotInstance.getFocusScopeManager()
    .registerScope(SCOPE_ID, bar, {
      shortcutsContextName: SHORTCUTS_CONTEXT_NAME,
      runOnlyIf: () => bar.isConnected,
      onActivate: (focusSource: string) => {
        if (focusSource === 'tab_from_above' || focusSource === 'tab_from_below') {
          link.focus();
        }
      },
    });
}
