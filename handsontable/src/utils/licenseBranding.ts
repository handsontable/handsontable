import { _getLicenseState, _createHardStopLicenseBar, _formatUtcDate } from '../helpers/mixed';
import { LICENSE_INFO_CLASS, mountBottomLicenseBar } from './licenseNotification';
import { hasPlugin } from '../plugins/registry';
import { getProductMode, HANDSONTABLE_PRODUCT } from './typedLicenseKey';
import type { LicenseGrants } from './typedLicenseKey';
import type { HotInstance } from '../core/types';
import type { LicenseLifecycleFacet } from '../helpers/mixed';
// Type-only: erased at compile time, so the Dialog plugin never enters a bundle through this module -
// the "no Dialog in the bundle -> fall back to the bar" contract holds.
import type { Dialog } from '../plugins/dialog';

const DIALOG_PLUGIN_KEY = 'dialog';
const SALES_MAILTO = 'mailto:sales@handsontable.com';
const PRICING_URL = 'https://handsontable.com/pricing';
const LICENSE_DOCS_URL = 'https://handsontable.com/docs/license-key/';

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
const LOCK_CLASS = 'ht-license-lock';

/**
 * The badge popover copy per branded lifecycle state - the typed states come from the license spec
 * mockups; the non-typed states (missing key, non-commercial key, expired legacy key) reuse the same
 * badge + popover surface. `body` receives the lifecycle facet so a state can interpolate the days
 * remaining or the expiration date. `dismissible` marks the auto-opening popovers (the stops) that
 * carry a close (X) button; the others are hover/focus tooltips.
 */
const POPOVER_CONTENT: Record<string, {
  title: string;
  body: (lifecycle: LicenseLifecycleFacet) => string;
  linkText: string;
  linkHref: string;
  dismissible: boolean;
}> = {
  trial_active: {
    title: 'Handsontable Trial',
    body: ({ daysRemaining }) =>
      `Your Handsontable license key expires in ${daysRemaining} days. ` +
      'To continue using Handsontable, you need to purchase a commercial license.',
    linkText: 'Contact Sales',
    linkHref: SALES_MAILTO,
    dismissible: false,
  },
  trial_expired: {
    title: 'Expired trial license key',
    body: () =>
      'Your Handsontable license has expired. ' +
      'To continue using Handsontable, you need to purchase a commercial license.',
    linkText: 'Contact Sales',
    linkHref: SALES_MAILTO,
    dismissible: true,
  },
  freemium: {
    title: 'You\'re using the Handsontable Freemium plan.',
    body: () => 'Upgrade to remove the watermark and unlock all features.',
    linkText: 'Learn more',
    linkHref: PRICING_URL,
    dismissible: false,
  },
  missing: {
    title: 'Missing license key',
    body: () =>
      'The license key for Handsontable is missing. Use your purchased key, or pass ' +
      '\'non-commercial-and-evaluation\' for non-commercial use.',
    linkText: 'Learn more',
    linkHref: LICENSE_DOCS_URL,
    dismissible: false,
  },
  invalid: {
    title: 'Invalid license key',
    body: () =>
      'The license key for Handsontable is invalid. Check that you pass the whole key string, ' +
      'exactly as you received it.',
    linkText: 'Learn more',
    linkHref: LICENSE_DOCS_URL,
    dismissible: false,
  },
  legacy_expired: {
    title: 'Expired license key',
    body: ({ expiryTimestamp }) =>
      `Your Handsontable license key expired on ${expiryTimestamp === null ? '' : _formatUtcDate(expiryTimestamp)}. ` +
      'To continue using Handsontable, you need to renew your license.',
    linkText: 'Contact Sales',
    linkHref: SALES_MAILTO,
    dismissible: true,
  },
};

/**
 * The badge-only states: the corner badge renders with an accessible label but WITHOUT any popover.
 * The Non-Commercial and Evaluation License permits the usage, so it gets no tooltip and no
 * upgrade/purchase messaging - the badge itself is the only marker.
 */
const BADGE_ONLY_LABELS: Record<string, string> = {
  non_commercial: 'You\'re using the Non-Commercial and Evaluation License of Handsontable',
};

/**
 * The blocking-dialog copy per hard-stopped lifecycle state. The trial lock is not closable - the
 * evaluation has definitively ended. The subscription lock (shown for Internal deployments only,
 * see `mountSubscriptionHardStop`) is closable per the license spec: the end user can dismiss it
 * and keep working while the licensee renews.
 */
const HARD_STOP_DIALOGS: Record<string, { title: string; description: string; closable: boolean }> = {
  trial_expired_hard: {
    title: 'Your Handsontable license has expired.',
    description: 'To continue using Handsontable, you need to purchase a commercial license.',
    closable: false,
  },
  sub_expired_hard: {
    title: 'Your Handsontable subscription has expired.',
    description: 'To continue using Handsontable, you need to renew your license.',
    closable: true,
  },
};

/**
 * Shows (or re-shows) the blocking hard-stop dialog through the Dialog plugin. Enables the plugin on
 * demand when it is bundled but not turned on by the user, and is idempotent: it does nothing when the
 * dialog is already visible, so it can be called again after every settings update without flicker or
 * a render loop. The `ht-license-lock` custom class lets the theme render the "H." badge in the
 * dialog's top strip (the greyed logomark in the hard-stop mockup). A closable lock gets an explicit
 * Close button (and `closable: true` arms the dialog's own Escape shortcut); `onUserDismiss` is called
 * when that button is used, so the caller can record an unambiguous, user-initiated dismissal.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @param {object} content The dialog copy and closability for the hard-stopped state.
 * @param {Function} [onUserDismiss] Called when the user dismisses the dialog with the Close button.
 * @returns {void}
 */
function assertHardStopDialog(
  hotInstance: HotInstance,
  content: { title: string; description: string; closable: boolean },
  onUserDismiss?: () => void,
): void {
  const dialog = hotInstance.getPlugin(DIALOG_PLUGIN_KEY) as Dialog | undefined;

  if (!dialog) {
    return;
  }

  // The Dialog plugin is a no-op until enabled (its `show` returns early otherwise). Enable it on
  // demand so the lock works even when the user never set `dialog: true`.
  if (!dialog.enabled) {
    dialog.enablePlugin();
  }

  if (dialog.isVisible()) {
    return;
  }

  const buttons: Array<{ text: string; type: string; callback: () => void }> = [
    {
      text: 'Contact Sales',
      type: 'primary',
      callback: () => {
        hotInstance.rootWindow.open(SALES_MAILTO, '_blank', 'noopener');
      },
    },
  ];

  if (content.closable) {
    buttons.push({
      text: 'Close',
      type: 'secondary',
      callback: () => {
        onUserDismiss?.();
        dialog.hide();
      },
    });
  }

  dialog.show({
    template: {
      type: 'confirm',
      title: content.title,
      description: content.description,
      buttons,
    },
    customClassName: LOCK_CLASS,
    background: 'solid',
    closable: content.closable,
  });
}

/**
 * Builds a memoized "is this instance still hard-stopped" check for the re-assert hooks. It re-reads
 * the license key from the CURRENT settings, so fixing the key at runtime
 * (`updateSettings({ licenseKey })`) releases the lock - without this, a customer who buys a license
 * would stay locked out until they rebuilt the whole instance. Memoized on the key string: resolving
 * the state checksums the whole key (SHA-512), too heavy to re-run on every settings update, and the
 * key almost never changes.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @param {Function} isHardStopped Reads the resolved state descriptor and tells whether the lock still applies.
 * @returns {Function} The memoized check.
 */
function createHardStopRecheck(
  hotInstance: HotInstance,
  isHardStopped: (descriptor: ReturnType<typeof _getLicenseState>) => boolean,
): () => boolean {
  // Seeded with the mount-time key: the caller only creates the check for an instance it already
  // resolved as hard-stopped, so the unchanged-key path never re-hashes.
  let lastKey = hotInstance.getSettings().licenseKey;
  let lastResult = true;

  return () => {
    const key = hotInstance.getSettings().licenseKey;

    if (key !== lastKey) {
      // Bare on purpose - see the matching comment in `initLicenseBranding`.
      const releaseDate = process.env.HOT_RELEASE_DATE || '';

      lastKey = key;
      lastResult = isHardStopped(_getLicenseState(key, releaseDate));
    }

    return lastResult;
  };
}

/**
 * Handles the hard-stopped subscription (Cases 3a/3b of the license spec). The deployment mode
 * stamped in the key payload selects the surface:
 *   - `internal` (Case 3a) - the grid runs in the licensee's own tools, so the people who see the
 *     screen can act on the license: a blocking-but-closable dialog;
 *   - `saas` (Case 3b), or any unknown future mode - the grid is embedded in a product sold to the
 *     licensee's end users, who are not the licensee and cannot fix the license: every signal stays
 *     in the console (already emitted by `initLicenseNotification`). No dialog, no bar, no badge.
 *
 * There is no bottom-bar fallback when the Dialog plugin is not bundled - the bar is never a
 * subscription surface per the spec.
 *
 * The dialog is dismissible, so a user's close must stick. But a settings update tears the (often
 * on-demand-enabled) Dialog plugin down and hides the dialog on the way, and THAT hide is not a
 * dismissal - the lock has to come back. The two are told apart by timing: a teardown hide is always
 * followed by `afterUpdateSettings` in the same task, a user close (Escape) never is. A hide only
 * becomes a dismissal when it survives to the end of its task (the microtask below);
 * `afterUpdateSettings` cancels the pending one before that and re-asserts the lock. The Close
 * button needs no timing inference - it reports the dismissal directly.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @param {LicenseGrants} grants The resolved license grants (carrying the deployment mode).
 * @returns {void}
 */
function mountSubscriptionHardStop(hotInstance: HotInstance, grants: LicenseGrants): void {
  if (getProductMode(grants, HANDSONTABLE_PRODUCT) !== 'internal' || !hasPlugin(DIALOG_PLUGIN_KEY)) {
    return;
  }

  const content = HARD_STOP_DIALOGS.sub_expired_hard;
  const stillHardStopped = createHardStopRecheck(hotInstance, ({ lifecycle, grants: currentGrants }) =>
    lifecycle.state === 'sub_expired_hard' &&
    getProductMode(currentGrants, HANDSONTABLE_PRODUCT) === 'internal');
  let dismissedByUser = false;
  let dismissPending = false;

  const markDismissed = () => {
    dismissedByUser = true;
    dismissPending = false;
  };

  hotInstance.addHook('afterDialogHide', () => {
    dismissPending = true;
    hotInstance.rootWindow.queueMicrotask(() => {
      if (dismissPending) {
        markDismissed();
      }
    });
  });
  hotInstance.addHook('afterUpdateSettings', () => {
    dismissPending = false;

    if (!dismissedByUser && stillHardStopped()) {
      assertHardStopDialog(hotInstance, content, markDismissed);
    }
  });
  // Defer the first show: the grid has not rendered yet at this point in `init()` (see the trial
  // hard-stop branch in `initLicenseBranding`).
  hotInstance.addHookOnce('afterInit', () => assertHardStopDialog(hotInstance, content, markDismissed));
}

/**
 * Wires the corner-hover detection for the click-through badge. The badge and its wrapper render with
 * `pointer-events: none`, so the corner header cell underneath keeps its native behavior: the
 * select-all click, the right-click context menu, drag selection, and touch. Hovering is detected by
 * delegation instead: a `mouseover` listener on the root element stamps the `is-corner-hover` class on
 * the wrapper whenever the pointer roams over the corner overlay clone, and the popover CSS opens on
 * that class. Every roam also gives the dismissed soft-stop popover a chance to re-arm. The listeners
 * die with the root element on `destroy()`.
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
    // Only the corner HEADER area (the clone's `thead`) triggers the popover: the corner clone
    // also holds frozen data cells (`fixedRowsTop` + `fixedColumnsStart`), and hovering the user's
    // own data must never pop the license tooltip. Without a corner cell (`is-cornerless`) there
    // is no badge to point at, so hover never triggers - only the auto-open popovers show there.
    const overCornerHeader = !wrapper.classList.contains(CORNERLESS_CLASS) &&
      !!target?.closest(`${CORNER_CLONE_SELECTOR} thead`);

    wrapper.classList.toggle(CORNER_HOVER_CLASS, overCornerHeader);
    onPointerRoam();
  });
  rootElement.addEventListener('mouseleave', () => {
    wrapper.classList.remove(CORNER_HOVER_CLASS);
    onPointerRoam();
  });
}

/**
 * Builds the corner badge + popover for a branded, non-blocking state (trial active, trial soft-stop,
 * freemium) and mounts it into the overlays layer. The badge is click-through (`pointer-events: none`)
 * so the corner cell keeps its native select-all behavior; hovering the corner is detected by
 * delegation (see `wireCornerHoverDetection`) and opens the popover via the `is-corner-hover` class.
 * The soft-stop popover additionally auto-opens via the `is-open` class until the user dismisses it
 * with the close (X) button or Escape; dismissal stamps `is-dismissed` on the wrapper (which gates
 * every CSS open rule, so the popover closes even while the pointer still hovers it) and re-arms once
 * both the pointer and the focus have left, so hovering the corner later reopens it as a plain
 * tooltip. The badge is a button so keyboard users reach the popover links; a `licenseBranding` focus
 * scope keeps it in the grid's Tab order.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @param {LicenseLifecycleFacet} lifecycle The resolved lifecycle facet (state + days remaining).
 * @returns {void}
 */
function mountLicenseBadge(hotInstance: HotInstance, lifecycle: LicenseLifecycleFacet): void {
  const content = POPOVER_CONTENT[lifecycle.state];
  const badgeOnlyLabel = BADGE_ONLY_LABELS[lifecycle.state];
  const host = hotInstance.rootOverlaysElement;

  if ((!content && !badgeOnlyLabel) || !host) {
    return;
  }

  const doc = hotInstance.rootDocument;
  const popoverId = `${hotInstance.guid}-license-popover`;

  const wrapper = doc.createElement('div');

  wrapper.className = BADGE_WRAPPER_CLASS;

  // Presence sync: `is-cornerless` on the wrapper re-anchors the popover to the table's
  // inline-start edge (there is no corner cell for a tail to point at), and `ht-license-badge-on`
  // on the root element renders the glyph INSIDE the corner header cell - the glyph is pure CSS
  // (see _license-branding.scss), anchored by the cell itself, so it can never overflow or drift
  // out of the corner. Settings reads only, never layout - safe to run on every render.
  const hasCornerCell = () => hotInstance.hasRowHeaders() && hotInstance.hasColHeaders();

  const syncCornerPresence = () => {
    const hasCorner = hasCornerCell();

    wrapper.classList.toggle(CORNERLESS_CLASS, !hasCorner);
    hotInstance.rootElement?.classList.toggle(BADGE_ON_CLASS, hasCorner);
  };

  syncCornerPresence();
  hotInstance.addHook('afterRender', () => syncCornerPresence());

  const badge = doc.createElement('button');

  badge.type = 'button';
  badge.className = BADGE_CLASS;
  badge.setAttribute('aria-label', 'Handsontable license information');

  if (badgeOnlyLabel && !content) {
    // The badge-only states (Non-Commercial and Evaluation License): the badge is the only marker -
    // no popover, no hover behavior, out of the Tab order. The accessible label carries the whole
    // message.
    badge.setAttribute('aria-label', badgeOnlyLabel);
    badge.tabIndex = -1;
    wrapper.appendChild(badge);
    host.appendChild(wrapper);

    return;
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
    hotInstance.addHook('afterRender', () => observeCorner());
    hotInstance.addHook('afterDestroy', () => observer.disconnect());
  } else {
    // No ResizeObserver (jsdom): fall back to measuring per render.
    measurePopoverAnchor();
    hotInstance.addHook('afterRender', () => measurePopoverAnchor());
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
  wireCornerHoverDetection(hotInstance, wrapper, rearmIfIdle);

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

    return;
  }

  // The dismissible (auto-open) popovers are actionable dialogs - their close button and link must be
  // reachable by keyboard: the grid intercepts Tab, so an inline focus scope hands focus to the badge
  // (or the last popover control on shift+Tab). Never unregistered - the badge lives for the instance
  // lifetime and is cleaned up by `getFocusScopeManager().destroy()`.
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
}

/**
 * Initializes the license branding UI for the branded lifecycle states:
 *   - `trial_active`, `trial_expired`, `freemium` -> the corner "H." badge with its popover (soft-stop
 *     also keeps the Step-2 bottom bar);
 *   - `missing`, `invalid` -> the corner badge with a hover tooltip (missing-key help, or the
 *     invalid-key notice);
 *   - `non_commercial` -> the corner badge alone, no popover (the Non-Commercial and Evaluation
 *     License permits the usage, so there is nothing to warn about);
 *   - `legacy_expired` -> the corner badge with the auto-open, closable expired popover (the legacy
 *     bottom bar and console message stay exactly as they always were);
 *   - `trial_expired_hard` -> a blocking dialog when the Dialog plugin is bundled (with the badge in
 *     its top strip), otherwise a bottom bar fallback;
 *   - `sub_expired_hard` -> a blocking-but-closable dialog, but ONLY for Internal-mode keys (Case 3a
 *     of the license spec); SaaS-mode keys stay console-only (Case 3b) - see
 *     `mountSubscriptionHardStop`.
 *
 * Every other state (valid legacy, running subscription, perpetual) produces no branding here - their
 * console warning and any bottom bar come from `initLicenseNotification`. The `*.handsontable.com`
 * bypass is already resolved by `_getLicenseState`. Runs once for the root instance.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @returns {void}
 */
export function initLicenseBranding(hotInstance: HotInstance): void {
  const licenseKey = hotInstance.getSettings().licenseKey;
  // Bare on purpose - see the matching comment in `initLicenseNotification`: a `typeof process`
  // guard breaks the build-time replacement in browser bundles.
  const releaseDate = process.env.HOT_RELEASE_DATE || '';

  const { lifecycle, grants } = _getLicenseState(licenseKey, releaseDate);

  if (lifecycle.state === 'trial_expired_hard') {
    // The Dialog plugin is optional. When it is bundled, the hard stop is a blocking dialog; when it is
    // not, there is no dialog to reuse, so the expiry falls back to a bottom bar (the console error was
    // already emitted by `initLicenseNotification`).
    if (hasPlugin(DIALOG_PLUGIN_KEY)) {
      const content = HARD_STOP_DIALOGS.trial_expired_hard;
      const stillHardStopped = createHardStopRecheck(hotInstance,
        ({ lifecycle: current }) => current.state === 'trial_expired_hard');

      // Defer the first show: at this point in `init()` the grid has not rendered yet (the first render
      // runs later in init), and `Dialog.show()` reads the selection and triggers a render, so it must
      // wait for the grid to be ready.
      hotInstance.addHookOnce('afterInit', () => assertHardStopDialog(hotInstance, content));

      // A settings update can disable the on-demand-enabled Dialog plugin (and hide the dialog), so
      // re-assert the lock after every update - unless the update FIXED the license key
      // (`updateSettings({ licenseKey })`), which must release the grid. `assertHardStopDialog` is
      // idempotent, so this is a no-op when the dialog is still up.
      hotInstance.addHook('afterUpdateSettings', () => {
        if (stillHardStopped()) {
          assertHardStopDialog(hotInstance, content);
        }
      });

      // The lock is not closable, so ANY hide is external interference: the Dialog plugin is a
      // single shared surface, and an app's own dialog can hide (or, by showing over it, replace)
      // the lock. Re-assert once the task unwinds - the microtask avoids re-entering `show()`
      // inside `hide()`, lands after `afterUpdateSettings` has re-checked a possibly fixed key,
      // and skips the hide that is part of `destroy()`.
      hotInstance.addHook('afterDialogHide', () => {
        hotInstance.rootWindow.queueMicrotask(() => {
          if (!hotInstance.isDestroyed && stillHardStopped()) {
            assertHardStopDialog(hotInstance, content);
          }
        });
      });

      return;
    }

    // No Dialog plugin to reuse: extend the existing license-bar mechanism with the hard-stop copy.
    mountBottomLicenseBar(hotInstance, _createHardStopLicenseBar(LICENSE_INFO_CLASS));

    return;
  }

  if (lifecycle.state === 'sub_expired_hard') {
    mountSubscriptionHardStop(hotInstance, grants);

    return;
  }

  // The branded, non-blocking states get the corner badge + popover.
  mountLicenseBadge(hotInstance, lifecycle);
}
