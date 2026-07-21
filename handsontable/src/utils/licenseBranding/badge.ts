import { POPOVER_CONTENT, BADGE_ONLY_LABELS } from './content';
import type { HotInstance } from '../../core/types';
import type { LicenseLifecycleFacet } from '../../helpers/mixed';

const SCOPE_ID = 'licenseBranding';
const SHORTCUTS_CONTEXT_NAME = `plugin:${SCOPE_ID}`;

const BADGE_WRAPPER_CLASS = 'ht-license-badge-wrapper';
const BADGE_CLASS = 'ht-license-badge';
const BADGE_ON_CLASS = 'ht-license-badge-on';
const POPOVER_CLASS = 'ht-license-popover';
const POPOVER_OPEN_CLASS = 'is-open';
const POPOVER_DISMISSED_CLASS = 'is-dismissed';
const CORNER_HOVER_CLASS = 'is-corner-hover';
const CORNERLESS_CLASS = 'is-cornerless';
const CORNER_CLONE_SELECTOR = '.ht_clone_top_inline_start_corner';

/**
 * Wires the corner-hover detection for the click-through badge. The badge and its wrapper render with
 * `pointer-events: none`, so the corner header cell underneath keeps its native behavior: the
 * select-all click, the right-click context menu, drag selection, and touch. Hovering is detected by
 * delegation instead: a `mouseover` listener on the root element stamps the `is-corner-hover` class on
 * the wrapper whenever the pointer roams over the corner clone's HEADER area (the clone also holds
 * frozen data cells, which must never pop the license tooltip), and the popover CSS opens on that
 * class. Every roam also gives the dismissed soft-stop popover a chance to re-arm.
 *
 * Returns the listener cleanup for the badge unmount.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @param {HTMLElement} wrapper The badge wrapper element.
 * @param {Function} onPointerRoam Called after every pointer roam (used to re-arm the dismissed popover).
 * @returns {Function} The cleanup removing the listeners.
 */
function wireCornerHoverDetection(
  hotInstance: HotInstance,
  wrapper: HTMLElement,
  onPointerRoam: () => void,
): () => void {
  const rootElement = hotInstance.rootElement;

  if (!rootElement) {
    return () => {};
  }

  const onMouseOver = (event: MouseEvent) => {
    // Checked against the grid's OWN realm: for an iframe-hosted grid, the loading window's
    // `Element` does not match nodes from the iframe's document, and the bare `instanceof Element`
    // would silently kill hover detection there.
    const target = event.target instanceof hotInstance.rootWindow.Element ? event.target : null;
    // Only the corner HEADER area (the clone's `thead`) triggers the popover: the corner clone
    // also holds frozen data cells (`fixedRowsTop` + `fixedColumnsStart`), and hovering the user's
    // own data must never pop the license tooltip. Without a corner cell (`is-cornerless`) there
    // is no badge to point at, so hover never triggers - only the auto-open popovers show there.
    const overCornerHeader = !wrapper.classList.contains(CORNERLESS_CLASS) &&
      !!target?.closest(`${CORNER_CLONE_SELECTOR} thead`);

    wrapper.classList.toggle(CORNER_HOVER_CLASS, overCornerHeader);
    onPointerRoam();
  };
  const onMouseLeave = () => {
    wrapper.classList.remove(CORNER_HOVER_CLASS);
    onPointerRoam();
  };

  rootElement.addEventListener('mouseover', onMouseOver);
  rootElement.addEventListener('mouseleave', onMouseLeave);

  return () => {
    rootElement.removeEventListener('mouseover', onMouseOver);
    rootElement.removeEventListener('mouseleave', onMouseLeave);
  };
}

/**
 * Builds the corner badge + popover for a branded, non-blocking state and mounts it into the
 * overlays layer. The VISUAL glyph is pure CSS inside the corner header cell (gated by the
 * `ht-license-badge-on` root class - see `_license-branding.scss`), so it can never overflow or
 * drift out of the corner. The badge button itself is screen-reader-only: it carries the accessible
 * name, the popover wiring, and the keyboard entry point. The soft-stop popovers additionally
 * auto-open via the `is-open` class until dismissed with the close (X) button or Escape; dismissal
 * stamps `is-dismissed` on the wrapper (which gates every CSS open rule, so the popover closes even
 * while the pointer still hovers it) and re-arms once both the pointer and the focus have left.
 *
 * Returns the unmount function (or `null` for the unbranded states) - the caller unmounts when a
 * runtime key change resolves to a different license state.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @param {LicenseLifecycleFacet} lifecycle The resolved lifecycle facet (state + days remaining).
 * @returns {Function|null} The unmount function, or `null` when the state renders no badge.
 */
export function mountLicenseBadge(
  hotInstance: HotInstance,
  lifecycle: LicenseLifecycleFacet,
): (() => void) | null {
  const content = POPOVER_CONTENT[lifecycle.state];
  const badgeOnlyLabel = BADGE_ONLY_LABELS[lifecycle.state];
  const host = hotInstance.rootOverlaysElement;

  if ((!content && !badgeOnlyLabel) || !host) {
    return null;
  }

  const doc = hotInstance.rootDocument;
  const popoverId = `${hotInstance.guid}-license-popover`;
  const cleanups: Array<() => void> = [];

  const addHook = (name: string, callback: (...args: unknown[]) => void) => {
    hotInstance.addHook(name, callback);
    cleanups.push(() => hotInstance.removeHook(name, callback));
  };

  const wrapper = doc.createElement('div');

  wrapper.className = BADGE_WRAPPER_CLASS;
  cleanups.push(() => wrapper.remove());

  // Presence sync: `is-cornerless` on the wrapper re-anchors the popover to the table's
  // inline-start edge (there is no corner cell for a tail to point at), and `ht-license-badge-on`
  // on the root element renders the glyph inside the corner header cell. Settings reads only,
  // never layout - safe to run on every render.
  const hasCornerCell = () => hotInstance.hasRowHeaders() && hotInstance.hasColHeaders();

  const syncCornerPresence = () => {
    const hasCorner = hasCornerCell();

    wrapper.classList.toggle(CORNERLESS_CLASS, !hasCorner);
    hotInstance.rootElement?.classList.toggle(BADGE_ON_CLASS, hasCorner);
  };

  syncCornerPresence();
  addHook('afterRender', () => syncCornerPresence());
  cleanups.push(() => hotInstance.rootElement?.classList.remove(BADGE_ON_CLASS));

  const badge = doc.createElement('button');

  badge.type = 'button';
  badge.className = BADGE_CLASS;
  badge.setAttribute('aria-label', 'Handsontable license information');

  const unmount = () => {
    cleanups.forEach(cleanup => cleanup());
    cleanups.length = 0;
  };

  if (badgeOnlyLabel && !content) {
    // The badge-only states (Non-Commercial and Evaluation License): the badge is the only marker -
    // no popover, no hover behavior, out of the Tab order. The accessible label carries the whole
    // message.
    badge.setAttribute('aria-label', badgeOnlyLabel);
    badge.tabIndex = -1;
    wrapper.appendChild(badge);
    host.appendChild(wrapper);

    return unmount;
  }

  // Popover anchor: the popover offsets from the corner's inline-end edge, so it needs the corner
  // WIDTH - the only measured value left (the glyph itself is CSS-anchored inside the corner cell
  // and needs no measurement). Badge-only states return above and skip this entirely.
  let lastAnchorWidth = 0;

  const getCornerClone = () =>
    hotInstance.rootElement?.querySelector<HTMLElement>(CORNER_CLONE_SELECTOR) ?? null;

  const measurePopoverAnchor = () => {
    const corner = getCornerClone();

    if (!corner || !hasCornerCell()) {
      return;
    }

    const width = corner.offsetWidth;

    // 1px deadband: while horizontally scrolled, walkontable grows the corner clone by 1px (the
    // doubled-border compensation), and copying that flutter into the anchor would nudge the open
    // popover on every scroll. A real corner resize (theme switch, wider row numbers) is always
    // bigger than 1px.
    if (width > 0 && Math.abs(width - lastAnchorWidth) > 1) {
      lastAnchorWidth = width;
      wrapper.style.setProperty('--ht-license-badge-area-width', `${width}px`);
    }
  };

  const win = hotInstance.rootWindow;

  if (typeof win.ResizeObserver === 'function') {
    // Measuring inside an `afterRender` hook would read `offsetWidth` right after the draw's DOM
    // writes - a forced synchronous reflow on EVERY render. A ResizeObserver delivers its entries
    // after layout, when the tree is clean, so the anchor stays fresh at zero per-render layout
    // cost. The clone element persists for the instance lifetime, but the render hook re-attaches
    // defensively when the element identity changed - a DOM query, no layout.
    const observer = new win.ResizeObserver(() => measurePopoverAnchor());
    let observedCorner: HTMLElement | null = null;

    const observeCorner = () => {
      const corner = getCornerClone();

      if (corner === observedCorner) {
        return;
      }

      observer.disconnect();
      observedCorner = corner;

      if (corner) {
        observer.observe(corner);
      }
      // No synchronous measure here: `observe()` delivers an initial entry after the next layout.
    };

    observeCorner();
    addHook('afterRender', () => observeCorner());
    cleanups.push(() => observer.disconnect());
  } else {
    // No ResizeObserver (jsdom): fall back to measuring per render.
    measurePopoverAnchor();
    addHook('afterRender', () => measurePopoverAnchor());
  }

  badge.setAttribute('aria-haspopup', 'dialog');
  badge.setAttribute('aria-controls', popoverId);

  const popover = doc.createElement('div');

  popover.id = popoverId;
  popover.className = POPOVER_CLASS;
  // A non-modal informational popover: `dialog` for the dismissible soft-stop (it has an actionable
  // close), `tooltip` for the hover-only variants.
  popover.setAttribute('role', content.dismissible ? 'dialog' : 'tooltip');
  popover.setAttribute('aria-labelledby', `${popoverId}-title`);

  const title = doc.createElement('div');

  title.id = `${popoverId}-title`;
  title.className = `${POPOVER_CLASS}__title`;
  title.textContent = content.title;

  const body = doc.createElement('p');

  body.className = `${POPOVER_CLASS}__body`;
  body.textContent = content.body(lifecycle);

  const link = doc.createElement('a');

  link.className = `${POPOVER_CLASS}__link`;
  link.href = content.linkHref;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = content.linkText;

  popover.appendChild(title);
  popover.appendChild(body);
  popover.appendChild(link);

  // The wrapper is click-through, so `:hover` never matches on it directly; the popover re-enables
  // pointer events for its links, and this flag tracks whether the pointer is inside it.
  let pointerOverPopover = false;

  const rearmIfIdle = (focusStillInside = wrapper.contains(doc.activeElement)) => {
    const pointerInside = pointerOverPopover || wrapper.classList.contains(CORNER_HOVER_CLASS);

    if (!focusStillInside && !pointerInside) {
      wrapper.classList.remove(POPOVER_DISMISSED_CLASS);
    }
  };

  popover.addEventListener('mouseenter', () => {
    pointerOverPopover = true;
  });
  popover.addEventListener('mouseleave', () => {
    pointerOverPopover = false;
    rearmIfIdle();
  });
  cleanups.push(wireCornerHoverDetection(hotInstance, wrapper, rearmIfIdle));

  if (content.dismissible) {
    // Dismissal stamps `is-dismissed` on the wrapper: removing `is-open` alone is not enough, because
    // at click time the pointer still hovers the popover (and the close button holds focus), so the
    // hover/focus CSS rules would keep it visible. The class gates all of them.
    const dismiss = () => {
      popover.classList.remove(POPOVER_OPEN_CLASS);
      wrapper.classList.add(POPOVER_DISMISSED_CLASS);
      badge.setAttribute('aria-expanded', 'false');
      badge.focus();
    };

    const closeButton = doc.createElement('button');

    closeButton.type = 'button';
    closeButton.className = `${POPOVER_CLASS}__close`;
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.addEventListener('click', () => dismiss());
    popover.appendChild(closeButton);

    // Auto-open the soft-stop popover without stealing focus from the grid: it is shown visually via
    // the `is-open` class; focus only moves when the user tabs to the badge.
    popover.classList.add(POPOVER_OPEN_CLASS);
    badge.setAttribute('aria-expanded', 'true');

    // Escape dismisses the popover when focus is inside it.
    wrapper.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismiss();
      }
    });

    // Dismissal holds while the badge keeps focus (so the popover does not flash back open); once
    // focus leaves the wrapper - and the pointer is outside too - the tooltip re-arms. The realm
    // check mirrors the hover detector: an iframe-hosted grid's nodes are not instances of the
    // loading window's `Node`.
    wrapper.addEventListener('focusout', (event: FocusEvent) => {
      rearmIfIdle(
        event.relatedTarget instanceof hotInstance.rootWindow.Node && wrapper.contains(event.relatedTarget),
      );
    });
  } else {
    badge.setAttribute('aria-expanded', 'false');
  }

  wrapper.appendChild(badge);
  wrapper.appendChild(popover);
  host.appendChild(wrapper);

  if (!content.dismissible) {
    // A hover-only tooltip stays OUT of the Tab order on purpose: the non-commercial and missing-key
    // badges mount on virtually every developer grid, and a focusable badge (plus its focus scope)
    // would insert an extra Tab stop into every keyboard path through the grid. The information is
    // duplicated in the console/bottom-bar messaging, so nothing keyboard-only is lost.
    badge.tabIndex = -1;

    return unmount;
  }

  // The dismissible (auto-open) popovers are actionable dialogs - their close button and link must be
  // reachable by keyboard: the grid intercepts Tab, so an inline focus scope hands focus to the badge
  // (or the last popover control on shift+Tab). Unregistered on unmount (a runtime key change).
  hotInstance.getFocusScopeManager()
    .registerScope(SCOPE_ID, wrapper, {
      shortcutsContextName: SHORTCUTS_CONTEXT_NAME,
      runOnlyIf: () => host.contains(wrapper),
      onActivate: (focusSource) => {
        if (focusSource === 'tab_from_below') {
          const focusable = wrapper.querySelectorAll<HTMLElement>('a[href], button');

          focusable[focusable.length - 1]?.focus();
        } else {
          badge.focus();
        }
      },
    });
  cleanups.push(() => hotInstance.getFocusScopeManager().unregisterScope(SCOPE_ID));

  return unmount;
}
