import { html } from '../../helpers/templateLiteralTag';
import { CLONE_TOP_INLINE_START_CORNER } from '../../3rdparty/walkontable/src/overlay/constants';
import { POPOVER_CONTENT } from './content';
import type { HotInstance } from '../../core/types';
import type { Overlay } from '../../3rdparty/walkontable/src/overlay/regions/_base';
import type { LicenseLifecycleFacet } from '../../helpers/mixed';

const BADGE_WRAPPER_CLASS = 'ht-license-badge-wrapper';
const BADGE_CLASS = 'ht-license-badge';
const BADGE_ON_CLASS = 'ht-license-badge-on';
const POPOVER_CLASS = 'ht-license-popover';
const POPOVER_OPEN_CLASS = 'is-open';
const POPOVER_DISMISSED_CLASS = 'is-dismissed';
const CORNER_HOVER_CLASS = 'is-corner-hover';
const CORNERLESS_CLASS = 'is-cornerless';
const CORNER_MARKER_CLASS = 'ht-license-badge-corner';

/**
 * The corner-header clone's table and its header section, read through the TableView's public overlay
 * accessor (`getOverlayByName`, the same entry the MergeCells plugin uses) rather than reaching into
 * `_wt.wtOverlays`. This is THIS grid's own corner, never a nested grid's: a grid rendered inside a
 * cell (the `handsontable` cell type) has its own corner clone earlier in document order, so a CSS
 * selector on the root subtree could match the inner one and make the badge measure - and pop over -
 * the wrong corner. The overlay reference sidesteps that entirely. `getOverlayByName` is typed as a
 * broad union (any overlay or the master table), so it is narrowed to `Overlay` here - a corner name
 * never resolves to the master instance. Returns `null` before the first render (the overlay/clone is
 * not built yet) or when there is no corner.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @returns {{ table: HTMLElement, thead: HTMLElement|null }|null}
 */
function getCornerClone(hotInstance: HotInstance): { table: HTMLElement; thead: HTMLElement | null } | null {
  const cornerOverlay =
    hotInstance.view?.getOverlayByName(CLONE_TOP_INLINE_START_CORNER) as unknown as Overlay | null;
  const wtTable = cornerOverlay?.clone?.wtTable;

  if (!wtTable?.TABLE) {
    return null;
  }

  return { table: wtTable.TABLE, thead: wtTable.THEAD ?? null };
}

/**
 * Wires the corner-hover detection for the click-through badge. The badge and its wrapper render with
 * `pointer-events: none`, so the corner header cell underneath keeps its native behavior: the
 * select-all click, the right-click context menu, drag selection, and touch. Hovering is detected by
 * delegation instead: a `mouseover` listener on the root element stamps the `is-corner-hover` class on
 * the wrapper whenever the pointer roams over the corner clone's HEADER area (the clone also holds
 * frozen data cells, which must never pop the license tooltip), and the popover CSS opens on that
 * class. Every roam also gives the dismissed soft-stop popover a chance to re-arm. The listeners
 * die with the root element on destroy.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @param {HTMLElement} wrapper The badge wrapper element.
 * @param {Function} onPointerRoam Called after every pointer roam (used to re-arm the dismissed popover).
 * @returns {void}
 */
function wireCornerHoverDetection(
  hotInstance: HotInstance,
  wrapper: HTMLElement,
  onPointerRoam: () => void,
): void {
  const rootElement = hotInstance.rootElement;

  if (!rootElement) {
    return;
  }

  rootElement.addEventListener('mouseover', (event: MouseEvent) => {
    // Checked against the grid's OWN realm: for an iframe-hosted grid, the loading window's
    // `Element` does not match nodes from the iframe's document, and the bare `instanceof Element`
    // would silently kill hover detection there.
    const target = event.target instanceof hotInstance.rootWindow.Element ? event.target : null;
    // Only the corner HEADER area (the clone's `thead`, read from the overlay - THIS grid's, never a
    // nested grid's) triggers the popover: the corner clone also holds frozen data cells
    // (`fixedRowsTop` + `fixedColumnsStart`), and hovering the user's own data must never pop the
    // license tooltip. Without a corner cell (`is-cornerless`) there is no badge to point at, so
    // hover never triggers - only the auto-open popovers show there.
    const cornerThead = getCornerClone(hotInstance)?.thead ?? null;
    const overCornerHeader = !wrapper.classList.contains(CORNERLESS_CLASS) &&
      target !== null && cornerThead !== null && cornerThead.contains(target);

    wrapper.classList.toggle(CORNER_HOVER_CLASS, overCornerHeader);
    onPointerRoam();
  });
  rootElement.addEventListener('mouseleave', () => {
    wrapper.classList.remove(CORNER_HOVER_CLASS);
    onPointerRoam();
  });
}

/**
 * Builds the corner badge + popover and mounts it into the overlays layer. Only the trial states
 * carry `POPOVER_CONTENT`; for every other state this is a no-op (no badge, no popover). The VISUAL glyph is pure CSS inside the corner header cell (gated by the
 * `ht-license-badge-on` root class - see `_license-branding.scss`), so it can never overflow or
 * drift out of the corner. The badge button itself is screen-reader-only: it carries the accessible
 * name, the popover wiring, and the keyboard entry point. The soft-stop popovers additionally
 * auto-open via the `is-open` class until dismissed with the close (X) button or Escape; dismissal
 * stamps `is-dismissed` on the wrapper (which gates every CSS open rule, so the popover closes even
 * while the pointer still hovers it) and re-arms once the pointer has left.
 *
 * Mounts once, for the instance lifetime (the license key is read only at init - see
 * `initLicenseBranding`); its DOM lives in the overlays layer and its hooks are cleared with the
 * grid on destroy.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @param {LicenseLifecycleFacet} lifecycle The resolved lifecycle facet (state + days remaining).
 * @returns {void}
 */
export function mountLicenseBadge(hotInstance: HotInstance, lifecycle: LicenseLifecycleFacet): void {
  const content = POPOVER_CONTENT[lifecycle.state];
  const host = hotInstance.rootOverlaysElement;

  // The badge (and its popover) render ONLY for the trial states in `POPOVER_CONTENT`;
  // every other state returns here with no badge - its console message and any bottom bar come from
  // `initLicenseNotification` instead.
  if (!content || !host) {
    return;
  }

  const popoverId = `${hotInstance.guid}-license-popover`;

  // The badge button is screen-reader-only (the visual glyph is pure CSS inside the corner cell).
  // The copy is assigned through `textContent` below, never interpolated into the markup.
  const { refs } = html`
    <div data-ref="wrapper" class="${BADGE_WRAPPER_CLASS}">
      <button data-ref="badge" type="button" class="${BADGE_CLASS}"
        aria-label="Handsontable license information"></button>
      <div data-ref="popover" id="${popoverId}" class="${POPOVER_CLASS}"
        role="${content.dismissible ? 'dialog' : 'tooltip'}" aria-labelledby="${popoverId}-title">
        <div class="${POPOVER_CLASS}__content">
          <div data-ref="popoverTitle" id="${popoverId}-title" class="${POPOVER_CLASS}__title"></div>
          <p data-ref="popoverBody" class="${POPOVER_CLASS}__body"></p>
          <a data-ref="popoverLink" class="${POPOVER_CLASS}__link" target="_blank" rel="noopener noreferrer"></a>
        </div>
        ${content.dismissible
    ? `<button data-ref="closeButton" type="button" class="${POPOVER_CLASS}__close" aria-label="Close"></button>`
    : ''}
      </div>
    </div>
  `;
  const wrapper = refs.wrapper;
  const badge = refs.badge as HTMLButtonElement;

  // Presence sync: `is-cornerless` on the wrapper re-anchors the popover to the table's
  // inline-start edge (there is no corner cell for a tail to point at), `ht-license-badge-on`
  // on the root element enables the glyph, and `ht-license-badge-corner` marks THIS grid's own
  // corner clone table so the pure-CSS glyph lands only there. The marker is the CSS counterpart of
  // the Walkontable-API corner lookup the rest of this file uses: the glyph selector keys off the
  // marker, not the structural `.ht_clone_top_inline_start_corner` class, which also matches a nested
  // grid's corner (the `handsontable` cell type) inside this root and would paint a stray badge there.
  // Settings/overlay reads only, never layout - safe to run on every render.
  const hasCornerCell = () => hotInstance.hasRowHeaders() && hotInstance.hasColHeaders();

  const syncCornerPresence = () => {
    const hasCorner = hasCornerCell();

    wrapper.classList.toggle(CORNERLESS_CLASS, !hasCorner);
    hotInstance.rootElement?.classList.toggle(BADGE_ON_CLASS, hasCorner);
    getCornerClone(hotInstance)?.table.classList.toggle(CORNER_MARKER_CLASS, hasCorner);
  };

  syncCornerPresence();
  hotInstance.addHook('afterRender', () => syncCornerPresence());

  // Popover anchor: the popover offsets from the corner's inline-end edge, so it needs the corner
  // WIDTH - the only measured value left (the glyph itself is CSS-anchored inside the corner cell
  // and needs no measurement). Badge-only states return above and skip this entirely.
  let lastAnchorWidth = 0;

  const measurePopoverAnchor = () => {
    const corner = getCornerClone(hotInstance);

    if (!corner || !hasCornerCell()) {
      return;
    }

    const width = corner.table.offsetWidth;

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
    let observedTable: HTMLElement | null = null;

    const observeCorner = () => {
      const table = getCornerClone(hotInstance)?.table ?? null;

      if (table === observedTable) {
        return;
      }

      observer.disconnect();
      observedTable = table;

      if (table) {
        observer.observe(table);
      }
      // No synchronous measure here: `observe()` delivers an initial entry after the next layout.
    };

    observeCorner();
    hotInstance.addHook('afterRender', () => observeCorner());
    hotInstance.addHook('afterDestroy', () => observer.disconnect());
  } else {
    // No ResizeObserver (jsdom): fall back to measuring per render.
    measurePopoverAnchor();
    hotInstance.addHook('afterRender', () => measurePopoverAnchor());
  }

  // The popover is a purely visual floating element - it is never focusable and never enters the Tab
  // order (its links/close are mouse-only, and the same information is in the console and the bottom
  // bar). So the badge is out of the Tab order too, and there is no focus scope, no shortcut, and no
  // focus outline to manage.
  badge.tabIndex = -1;

  // A non-modal informational popover (already in the template): `dialog` for the dismissible
  // soft-stop (it has a close button), `tooltip` for the hover-only variants.
  const popover = refs.popover;

  refs.popoverTitle.textContent = content.title;
  refs.popoverBody.textContent = content.body(lifecycle);
  (refs.popoverLink as HTMLAnchorElement).href = content.linkHref;
  refs.popoverLink.textContent = content.linkText;
  // Mouse-only: keep the popover out of the Tab order entirely (its link and close button stay
  // clickable, and the same information is duplicated in the console and the bottom bar).
  refs.popoverLink.tabIndex = -1;

  // The wrapper is click-through, so `:hover` never matches on it directly; the popover re-enables
  // pointer events for its links, and this flag tracks whether the pointer is inside it.
  let pointerOverPopover = false;

  const rearmIfIdle = () => {
    const pointerInside = pointerOverPopover || wrapper.classList.contains(CORNER_HOVER_CLASS);

    if (!pointerInside) {
      wrapper.classList.remove(POPOVER_DISMISSED_CLASS);
    }
  };

  popover.addEventListener('mouseenter', () => {
    pointerOverPopover = true;
  });
  popover.addEventListener('mouseleave', () => {
    pointerOverPopover = false;
    // Deliberately NOT re-arming here. Dismissing the popover hides it under the pointer, and the
    // browser answers that with a `mouseleave` on the very element that was just dismissed - so
    // re-arming from this handler would drop `is-dismissed` in the same tick, the hover rule would
    // show the popover again, and the close button would do nothing while the pointer stayed put.
    // Re-arming belongs to the pointer ROAM path below, which fires once the pointer actually moves
    // somewhere else.
  });
  wireCornerHoverDetection(hotInstance, wrapper, rearmIfIdle);

  if (content.dismissible) {
    // Auto-open the soft-stop popover. Dismissal (the close button) stamps `is-dismissed` on the
    // wrapper: removing `is-open` alone is not enough, because at click time the pointer still hovers
    // the popover, so the hover CSS rule would keep it visible. The class gates every open rule and
    // re-arms once the pointer leaves the popover and the corner, so a later corner hover reopens it
    // as a plain tooltip.
    popover.classList.add(POPOVER_OPEN_CLASS);
    refs.closeButton.tabIndex = -1;
    refs.closeButton.addEventListener('click', () => {
      popover.classList.remove(POPOVER_OPEN_CLASS);
      wrapper.classList.add(POPOVER_DISMISSED_CLASS);
    });
  }

  host.appendChild(wrapper);
}
