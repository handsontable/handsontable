import { mixin } from '../../../helpers/object';
import localHooks from '../../../mixins/localHooks';
import * as C from '../../../i18n/constants';
import {
  setAttribute,
  removeAttribute,
  isHTMLElement,
  addClass,
  removeClass,
  getDeepActiveElement,
} from '../../../helpers/dom/element';
import { A11Y_LABEL } from '../../../helpers/a11y';
import { stopImmediatePropagation } from '../../../helpers/dom/event';
import type EventManager from '../../../eventManager';
import { TabDrag, translationOf } from './tabDrag';
import { truncateSheetName } from '../sheetModel';
import type { SheetDescriptor } from '../sheetModel';
import { entranceElapsedMs } from './switchTiming';
import type { IconSlotSync } from '../../../themes/engine/icons';

/**
 * The `syncIcon()` slot class of the icon inside a tab's menu chevron.
 *
 * @type {string}
 */
const CHEVRON_ICON_SLOT_CLASS = 'ht-sheets-bar__tab-chevron-icon';

/**
 * The class of the temporary element that slides the active tab marker to a new tab.
 *
 * @type {string}
 */
const INDICATOR_CLASS = 'ht-sheets-bar__tab-indicator';

/**
 * The class the strip wears while the marker slides. It hands the active styling to the
 * sliding element for that time.
 *
 * @type {string}
 */
const INDICATOR_MOVING_CLASS = 'ht-sheets-bar__tabs--indicator-moving';

/**
 * The class of a tab the sliding marker passes over. Only those tabs let the marker show
 * through their own background.
 *
 * @type {string}
 */
const INDICATOR_PATH_CLASS = 'ht-sheets-bar__tab--indicator-path';

/**
 * The class a newly created tab wears while it slides into the strip.
 *
 * @type {string}
 */
const ENTERING_CLASS = 'ht-sheets-bar__tab--entering';

/**
 * The class the strip wears while its tabs slide from their old places to new ones after a
 * sheet moved. It switches the tabs' `transform` transition to the slide's easing.
 *
 * @type {string}
 */
const SLIDING_CLASS = 'ht-sheets-bar__tabs--sliding';

/**
 * The class the moved tab wears while the tabs slide, so it passes over the tabs it trades
 * places with rather than under them.
 *
 * @type {string}
 */
const SLIDE_LEAD_CLASS = 'ht-sheets-bar__tab--slide-lead';

/**
 * The custom property, written on the strip, that carries the slide's duration to the tabs'
 * `transform` transition.
 *
 * @type {string}
 */
const SLIDE_DURATION_PROPERTY = '--ht-private-tab-slide-duration';

/**
 * The class of the copy of a removed tab that fades out of the strip after the tab is gone.
 *
 * @type {string}
 */
const GHOST_CLASS = 'ht-sheets-bar__tab-ghost';

/**
 * A copy of a removed tab leaving the strip: the element, when its exit started on the strip
 * window's `performance` clock, how long it runs, both in milliseconds, and the timeout that
 * removes it.
 */
interface LeavingTab {
  /**
   * The copy of the removed tab.
   */
  element: HTMLElement;
  /**
   * The exit's start, on the strip window's `performance` clock, in milliseconds.
   */
  start: number;
  /**
   * The exit's length, in milliseconds.
   */
  duration: number;
  /**
   * The handle of the timeout that removes the copy.
   */
  timeout: number;
}

/**
 * A slide of the tabs to new places: where each tab started, by sheet id, in the strip's
 * unscrolled layout coordinates, the end of the slide on the strip window's `performance` clock,
 * and the sheet whose tab leads it.
 */
export interface TabSlide {
  /**
   * Each tab's left edge before the slide, by sheet id, in pixels.
   */
  from: Map<number, number>;
  /**
   * The end of the slide on the strip window's `performance` clock, in milliseconds.
   */
  endsAt: number;
  /**
   * The sheet whose tab leads the slide, or `-1` for none.
   */
  leadId: number;
}

/**
 * A tab that is sliding into the strip: when its entrance started, how long it runs, and the
 * timeout that ends it.
 */
interface EnteringTab {
  /**
   * The entrance's start, on the strip window's `performance` clock, in milliseconds.
   */
  start: number;
  /**
   * The entrance's length, in milliseconds.
   */
  duration: number;
  /**
   * The handle of the timeout that ends the entrance.
   */
  timeout: number;
}

/**
 * A tab's horizontal box inside the strip, in the strip's unscrolled layout coordinates.
 */
export interface TabBox {
  /**
   * The distance from the strip's left padding edge, in pixels.
   */
  left: number;
  /**
   * The width, in pixels.
   */
  width: number;
}

/**
 * The motion a strip hands over to the strip that replaces it: the running marker slide, and the
 * tabs still sliding in.
 */
export interface TabStripMotion {
  /**
   * The marker's on-screen box and the end of its slide on the strip window's `performance`
   * clock, or `null` when no slide runs.
   */
  indicator: { box: TabBox, endsAt: number } | null;
  /**
   * The tabs sliding in: the sheet id, the entrance's start on the `performance` clock, and its
   * length, both in milliseconds.
   */
  entering: Array<{ id: number, start: number, duration: number }>;
  /**
   * The tabs sliding to new places after a sheet moved, from where they are on screen, or `null`
   * when no slide runs.
   */
  slide: TabSlide | null;
  /**
   * The copies of removed tabs still leaving the strip: the element, the exit's start on the
   * `performance` clock, and its length, both in milliseconds.
   */
  leaving: Array<{ element: HTMLElement, start: number, duration: number }>;
}

/**
 * What the strip needs from the plugin to render.
 */
export interface TabStripOptions {
  /**
   * The strip host element (owned by SheetsBarUI).
   */
  host: HTMLElement;
  /**
   * The bar element, which wears the dragging class for the length of a drag.
   */
  dragRoot: HTMLElement;
  /**
   * The plugin's event manager, for the document-level listeners a drag installs.
   */
  eventManager: EventManager;
  /**
   * Phrase translation callback.
   */
  translate: (key: string, args?: unknown) => string;
  /**
   * Whether the grid emits ARIA attributes (`ariaTags` setting).
   */
  ariaTags: boolean;
  /**
   * Whether the grid runs right-to-left, which mirrors the arrow keys.
   */
  isRtl: boolean;
  /**
   * Keeps one icon slot of a container in step with the theme (`syncIcon()` bound to the grid).
   * Injected so the strip stays decoupled from the theme engine.
   */
  syncIcon: IconSlotSync;
  /**
   * The grid's window, whose `setTimeout()` ends the strip's motion. The strip clears every
   * pending timeout itself (`destroy()` and the `finish*()` methods), so none is registered on
   * the grid, where a cleared handle would stay listed for the grid's whole life.
   */
  rootWindow: Window;
  /**
   * Starts the `id` of each tab label, so the grid can be named after the label of the sheet it
   * shows (`aria-labelledby`). Unique per grid.
   */
  labelIdPrefix: string;
}

/**
 * Where the focus sat inside the strip before a repaint: the sheet, and its tab's position as
 * a fallback for when the sheet is gone.
 */
interface CapturedFocus {
  sheetId: string;
  index: number;
}

/**
 * Renders the sheet tabs and the inline-rename input. Reports interactions through
 * local hooks; holds no sheet state of its own.
 *
 * The keyboard is left to the plugin's shortcut context: this class exposes what a key does
 * ({@link activateFocusedTab}, {@link focusRelativeTab}, {@link abortDrag}) and the plugin
 * binds the keys, the way every other plugin with a focusable UI does.
 */
export class TabStrip {
  /**
   * Registers a callback for a local hook.
   */
  declare addLocalHook: (hookName: string, callback: Function) => TabStrip;
  /**
   * Runs callbacks of a local hook.
   */
  declare runLocalHooks: (...args: unknown[]) => void;
  /**
   * Clears local hooks.
   */
  declare clearLocalHooks: () => void;
  /**
   * The strip host element (owned by SheetsBarUI).
   */
  readonly #host: HTMLElement;
  /**
   * Phrase translation callback.
   */
  readonly #translate: (key: string, args?: unknown) => string;
  /**
   * Whether ARIA attributes are emitted.
   */
  readonly #ariaTags: boolean;
  /**
   * Whether the strip runs right-to-left.
   */
  readonly #isRtl: boolean;
  /**
   * Keeps one icon slot of a container in step with the theme (`syncIcon()` bound to the grid).
   * Injected so the strip stays decoupled from the theme engine.
   *
   * @type {Function}
   */
  readonly #syncIcon: IconSlotSync;
  /**
   * Drags tabs along the strip and reports where they land.
   */
  readonly #drag: TabDrag;
  /**
   * The sheet the strip last scrolled into view. Repaints that leave the active sheet alone —
   * a rename, a paging click, an overflow refresh — must not pull the strip back to it.
   */
  #revealedId = -1;
  /**
   * Ends the rename in progress without committing it, or `null` when none is in progress. A
   * repaint that replaces the tabs would otherwise take the input away silently. The `silent`
   * flag skips the `tabRenameCancel` dispatch for the cancel `render()` itself performs — the
   * hook's handler repaints the strip, and re-entering `render()` from inside a render pass
   * leaves the outer pass restoring focus and scroll against tabs the inner pass has replaced.
   */
  #cancelRename: ((silent?: boolean) => void) | null = null;
  /**
   * The sheet whose tab holds an open rename input, or `null`.
   */
  #renamingId: number | null = null;
  /**
   * Whether the last repaint revealed the active tab and the reveal has not been repeated after
   * the paging arrows settled (`settleReveal()`).
   */
  #isRevealUnsettled = false;
  /**
   * The sheet whose tab holds the strip's one Tab stop while the focus moves along the strip, or
   * `null` when the active tab holds it. The arrow keys move the stop with the focus; once the
   * focus leaves the strip, the stop goes back to the active tab.
   */
  #rovingId: number | null = null;
  /**
   * Starts the `id` of each tab label (`TabStripOptions.labelIdPrefix`).
   */
  readonly #labelIdPrefix: string;
  /**
   * The sheets the tabs show, by id, as the last `render()` received them.
   */
  readonly #sheets = new Map<number, SheetDescriptor>();
  /**
   * The grid's window, which runs the timeouts that end the strip's motion.
   */
  readonly #rootWindow: Window;
  /**
   * The element that slides the active tab marker, or `null` when no slide is running.
   */
  #indicator: HTMLElement | null = null;
  /**
   * The handle of the timeout that ends the running slide, or `null` when none is pending.
   */
  #indicatorTimeout: number | null = null;
  /**
   * The span of the strip the running slide covers, from its start box to its end box, or
   * `null` when no slide is running.
   */
  #indicatorPath: { start: number, end: number } | null = null;
  /**
   * The end of the running slide on the strip window's `performance` clock, in milliseconds.
   */
  #indicatorEndsAt = 0;
  /**
   * The tabs sliding into the strip, by sheet id. A repaint rebuilds every tab, so the entry is
   * what lets the rebuilt tab continue the slide instead of restarting it.
   */
  readonly #entering = new Map<number, EnteringTab>();
  /**
   * The running slide of the tabs to new places, or `null` when none runs.
   */
  #slide: TabSlide | null = null;
  /**
   * The handle of the timeout that ends the running slide of the tabs, or `null` when none is
   * pending.
   */
  #slideTimeout: number | null = null;
  /**
   * The slide duration the strip carries while no slide runs, or `null` for none. The tabs a drag
   * pushes aside read it, so `0ms` makes that displacement instant.
   */
  #restingSlideDuration: string | null = null;
  /**
   * The copies of removed tabs still leaving the strip. A repaint clears the strip, so the entry
   * is what puts each copy back at the point its exit reached.
   */
  #leaving: LeavingTab[] = [];

  /**
   * Binds the strip to its host element.
   */
  constructor(options: TabStripOptions) {
    this.#host = options.host;
    this.#translate = options.translate;
    this.#ariaTags = options.ariaTags;
    this.#isRtl = options.isRtl;
    this.#syncIcon = options.syncIcon;
    this.#rootWindow = options.rootWindow;
    this.#labelIdPrefix = options.labelIdPrefix;
    this.#drag = new TabDrag(
      {
        host: options.host,
        dragRoot: options.dragRoot,
        eventManager: options.eventManager,
        onDragStart: () => {
          this.finishIndicator();
          this.finishEntrances();
          this.finishSlide();
          this.finishLeaving();
        },
      },
      (id, toIndex) => this.runLocalHooks('tabDragCommit', id, toIndex),
    );

    this.#listenToTabs(true);
  }

  /**
   * Brings the tabs in step with the sheet descriptors. A tab whose sheet is still in the strip
   * is kept and updated in place, so a press, a drag or an open rename on it survives a repaint
   * it did not cause; only the tabs of new sheets are built, and a kept tab is moved only when
   * its place changed. An open rename is canceled, silently, only when its sheet is gone. Sheet
   * names render via `textContent` only (XSS-safe).
   *
   * @param {object[]} sheets The sheets in tab order.
   */
  render(sheets: SheetDescriptor[]): void {
    this.#drag.abort();

    if (this.#renamingId !== null && !sheets.some(sheet => sheet.id === this.#renamingId)) {
      this.#cancelRename?.(true);
    }

    const focused = this.#capturedFocus();
    const indicatorBox = this.#indicator === null ? null : this.captureActiveTabBox();
    const slide = this.#takeSlide();
    const previous = new Map(this.#tabs().map(tab => [Number(tab.dataset.sheetId), tab]));

    this.#sheets.clear();
    sheets.forEach(sheet => this.#sheets.set(sheet.id, sheet));

    const tabs = sheets.map((sheet) => {
      const kept = previous.get(sheet.id);

      return kept !== undefined && this.#canReuseTab(kept, sheet)
        ? this.#updateTab(kept, sheet)
        : this.#buildTab(sheet);
    });
    const keep = new Set<Node>(tabs);

    Array.from(this.#host.childNodes).forEach((node) => {
      if (!keep.has(node)) {
        node.parentNode?.removeChild(node);
      }
    });
    tabs.forEach((tab, index) => {
      const current = this.#host.children[index] ?? null;

      if (current !== tab) {
        this.#host.insertBefore(tab, current);
      }
    });

    if (slide !== null) {
      this.#startSlide(slide.from, slide.endsAt - this.#now(), slide.leadId);
    }

    if (indicatorBox !== null) {
      this.#runIndicator(indicatorBox, this.#indicatorEndsAt - this.#now());
    }

    this.#leaving.forEach(entry => this.#placeLeaving(entry));

    this.#restoreFocus(focused);
    this.#revealActiveTab(sheets.find(sheet => sheet.isActive)?.id ?? -1);
  }

  /**
   * Returns the box the active tab marker occupies now: the sliding marker's on-screen position
   * while a slide runs, otherwise the active tab's layout box. `offsetLeft` and `offsetWidth`
   * ignore transforms, so a drag FLIP in flight cannot skew the reading.
   */
  captureActiveTabBox(): TabBox | null {
    if (this.#indicator !== null) {
      const hostRect = this.#host.getBoundingClientRect();
      const rect = this.#indicator.getBoundingClientRect();

      return {
        left: rect.left - hostRect.left - this.#host.clientLeft + this.#host.scrollLeft,
        width: rect.width,
      };
    }

    return this.#activeTabBox();
  }

  /**
   * Slides the active tab marker from a box to the active tab. The element starts at `from`,
   * then transitions to the active tab over `durationMs`, and is removed after that time, when
   * the active tab's own styling takes over.
   */
  slideIndicator(from: TabBox, durationMs: number): void {
    this.finishIndicator();

    if (durationMs <= 0 || this.#activeTabBox() === null) {
      return;
    }

    this.#scheduleIndicatorEnd(durationMs);
    this.#runIndicator(from, durationMs);
  }

  /**
   * Hands the running marker slide and tab entrances over to a strip that replaces this one, and
   * forgets them here without ending them. The marker element goes with this strip's tabs.
   */
  releaseMotion(): TabStripMotion {
    const box = this.#indicator === null ? null : this.captureActiveTabBox();
    const entering = Array.from(this.#entering, ([id, { start, duration }]) => ({ id, start, duration }));
    const slide = this.#takeSlide();
    const leaving = this.#leaving.map(({ element, start, duration }) => ({ element, start, duration }));

    this.#entering.forEach(entry => this.#rootWindow.clearTimeout(entry.timeout));
    this.#entering.clear();
    this.#leaving.forEach(entry => this.#rootWindow.clearTimeout(entry.timeout));
    this.#leaving = [];
    this.finishIndicator();

    return {
      indicator: box === null ? null : { box, endsAt: this.#indicatorEndsAt },
      entering,
      slide,
      leaving,
    };
  }

  /**
   * Continues the motion another strip handed over through `releaseMotion()`: the marker slides
   * on from where it was on screen to the active tab in the time its slide had left, and every
   * tab still sliding in resumes at the point its entrance reached. Called once the tabs are
   * rendered.
   */
  resumeMotion(motion: TabStripMotion): void {
    const now = this.#now();

    motion.entering.forEach(({ id, start, duration }) => {
      if (entranceElapsedMs(start, now, duration) === null) {
        return;
      }

      this.#trackEntrance(id, start, duration, start + duration - now);

      const tab = this.getTab(id);

      if (tab !== null) {
        this.#applyEntrance(tab, id);
      }
    });

    if (motion.indicator !== null) {
      this.slideIndicator(motion.indicator.box, motion.indicator.endsAt - now);
    }

    if (motion.slide !== null) {
      this.#startSlide(motion.slide.from, motion.slide.endsAt - now, motion.slide.leadId);
    }

    motion.leaving.forEach(({ element, start, duration }) => {
      if (entranceElapsedMs(start, now, duration) !== null) {
        this.#trackLeaving(element, start, duration, start + duration - now);
      }
    });
  }

  /**
   * Builds a copy of a sheet's tab as it stands now, at its layout box, for `slideTabOut()` to
   * fade out once the tab is gone. The copy is decoration: hidden from assistive technology,
   * inert, and out of every tab query. Answers `null` when the sheet has no tab.
   */
  captureLeavingTab(id: number): HTMLElement | null {
    const tab = this.getTab(id);

    if (tab === null) {
      return null;
    }

    const ghost = this.#host.ownerDocument.createElement('div');

    ghost.className = GHOST_CLASS;
    ghost.inert = true;
    this.#setAria(ghost, [['aria-hidden', 'true']]);
    ghost.style.setProperty('--ht-private-tab-ghost-x', `${tab.offsetLeft}px`);
    ghost.style.setProperty('--ht-private-tab-ghost-width', `${tab.offsetWidth}px`);
    Array.from(tab.querySelectorAll('.ht-sheets-bar__tab-label, .ht-sheets-bar__tab-chevron'))
      .forEach(part => ghost.appendChild(part.cloneNode(true)));

    return ghost;
  }

  /**
   * Fades a copy `captureLeavingTab()` built out of the strip, toward the inline start, over
   * `durationMs`, and removes it after that time. A zero duration places nothing.
   */
  slideTabOut(ghost: HTMLElement, durationMs: number): void {
    if (durationMs <= 0) {
      return;
    }

    this.#trackLeaving(ghost, this.#now(), durationMs, durationMs);
  }

  /**
   * Removes every copy of a removed tab still leaving the strip at once. A no-op when none is.
   */
  finishLeaving(): void {
    this.#leaving.forEach((entry) => {
      this.#rootWindow.clearTimeout(entry.timeout);
      entry.element.remove();
    });
    this.#leaving = [];
  }

  /**
   * Records a leaving copy, puts it into the strip, and schedules its removal `remainingMs` from
   * now.
   */
  #trackLeaving(element: HTMLElement, start: number, duration: number, remainingMs: number): void {
    const entry: LeavingTab = {
      element,
      start,
      duration,
      timeout: this.#rootWindow.setTimeout(() => {
        this.#leaving = this.#leaving.filter(leaving => leaving !== entry);
        element.remove();
      }, remainingMs),
    };

    this.#leaving.push(entry);
    this.#placeLeaving(entry);
  }

  /**
   * Puts a leaving copy into the strip under the tabs and the marker, at the point its exit has
   * reached, through a negative `animation-delay`.
   */
  #placeLeaving(entry: LeavingTab): void {
    entry.element.style.animationDelay = `${-Math.max(this.#now() - entry.start, 0)}ms`;
    this.#host.insertBefore(entry.element, this.#host.firstChild);
  }

  /**
   * Returns where every tab stands now, by sheet id: its layout left edge, plus the part of a
   * running slide it has not travelled yet. `offsetLeft` ignores transforms, so an entrance or a
   * drag in flight cannot skew the reading.
   */
  captureTabPositions(): Map<number, number> {
    const positions = new Map<number, number>();
    const isSliding = this.#slide !== null;

    this.#tabs().forEach((tab) => {
      positions.set(Number(tab.dataset.sheetId), tab.offsetLeft + (isSliding ? translationOf(tab) : 0));
    });

    return positions;
  }

  /**
   * Slides every tab from the position `captureTabPositions()` recorded before a repaint to its
   * place now, over `durationMs`. The tab of `leadId` passes over the tabs it trades places with,
   * and an active tab carries its own marker along. A zero duration slides nothing.
   */
  slideTabs(from: Map<number, number>, durationMs: number, leadId: number = -1): void {
    this.finishSlide();

    if (durationMs <= 0) {
      return;
    }

    this.finishEntrances();
    this.#startSlide(from, durationMs, leadId);
  }

  /**
   * Sets whether the tabs a drag pushes aside slide to their new places, the way a move slides
   * them. When off, the drag displacement is instant. A running move slide keeps its own
   * duration until it ends.
   */
  setDragSlide(enabled: boolean): void {
    this.#restingSlideDuration = enabled ? null : '0ms';

    if (this.#slide === null) {
      this.#applyRestingSlideDuration();
    }
  }

  /**
   * Writes the resting slide duration onto the strip, or takes the property off when there is
   * none.
   */
  #applyRestingSlideDuration(): void {
    if (this.#restingSlideDuration === null) {
      this.#host.style.removeProperty(SLIDE_DURATION_PROPERTY);
    } else {
      this.#host.style.setProperty(SLIDE_DURATION_PROPERTY, this.#restingSlideDuration);
    }
  }

  /**
   * Ends the running slide of the tabs at once, leaving each tab in its place. A no-op when no
   * slide runs.
   */
  finishSlide(): void {
    if (this.#takeSlide() === null) {
      return;
    }

    const tabs = this.#tabs();

    tabs.forEach((tab) => {
      tab.style.transition = 'none';
    });
    this.#host.getBoundingClientRect();
    tabs.forEach((tab) => {
      tab.style.removeProperty('transition');
      removeClass(tab, SLIDE_LEAD_CLASS);
    });
  }

  /**
   * Forgets the running slide of the tabs, cancels its timeout, and takes its styles off the
   * strip, leaving the tabs untouched. Returns the slide it forgot, with every tab's position
   * read from the screen first, or `null` when none runs.
   */
  #takeSlide(): TabSlide | null {
    if (this.#slide === null) {
      return null;
    }

    const slide = { ...this.#slide, from: this.captureTabPositions() };

    if (this.#slideTimeout !== null) {
      this.#rootWindow.clearTimeout(this.#slideTimeout);
      this.#slideTimeout = null;
    }

    this.#slide = null;
    removeClass(this.#host, SLIDING_CLASS);
    this.#applyRestingSlideDuration();

    return slide;
  }

  /**
   * Puts every tab whose recorded position differs from its place back at that position, then
   * releases it into a `transform` transition of `durationMs` to its place, and schedules the end
   * of the slide. Starts nothing when no time is left or no tab moved.
   */
  #startSlide(from: Map<number, number>, durationMs: number, leadId: number): void {
    if (durationMs <= 0) {
      return;
    }

    const shifted = this.#tabs()
      .map((tab) => {
        const left = from.get(Number(tab.dataset.sheetId));

        return { tab, delta: left === undefined ? 0 : left - tab.offsetLeft };
      })
      .filter(({ delta }) => Math.abs(delta) >= 0.5);

    if (shifted.length === 0) {
      return;
    }

    addClass(this.#host, SLIDING_CLASS);
    this.#host.style.setProperty(SLIDE_DURATION_PROPERTY, `${durationMs}ms`);
    shifted.forEach(({ tab, delta }) => {
      tab.style.transition = 'none';
      tab.style.transform = `translateX(${delta}px)`;
      tab.classList.toggle(SLIDE_LEAD_CLASS, Number(tab.dataset.sheetId) === leadId);
    });
    this.#host.getBoundingClientRect();
    shifted.forEach(({ tab }) => {
      tab.style.removeProperty('transition');
      tab.style.removeProperty('transform');
    });

    this.#slide = { from, endsAt: this.#now() + durationMs, leadId };
    this.#slideTimeout = this.#rootWindow.setTimeout(() => {
      this.#slideTimeout = null;
      this.finishSlide();
    }, durationMs);
  }

  /**
   * Records when the running slide ends and schedules its removal for that point.
   */
  #scheduleIndicatorEnd(durationMs: number): void {
    this.#indicatorEndsAt = this.#now() + durationMs;
    this.#indicatorTimeout = this.#rootWindow.setTimeout(() => {
      this.#indicatorTimeout = null;
      this.finishIndicator();
    }, durationMs);
  }

  /**
   * Puts the marker element at `from` and starts its transition to the active tab's current box
   * over `durationMs`. Creates the element when no slide runs, and puts it back after a repaint
   * that cleared the strip. Ends the slide when no tab is active or no time is left.
   */
  #runIndicator(from: TabBox, durationMs: number): void {
    const target = this.#activeTabBox();

    if (target === null || durationMs <= 0) {
      this.finishIndicator();

      return;
    }

    const indicator = this.#indicator ?? this.#host.ownerDocument.createElement('div');

    indicator.className = INDICATOR_CLASS;
    this.#setAria(indicator, [['aria-hidden', 'true']]);
    indicator.style.transitionProperty = 'none';
    this.#writeIndicatorBox(indicator, from);
    addClass(this.#host, INDICATOR_MOVING_CLASS);
    this.#host.insertBefore(indicator, this.#host.firstChild);
    this.#indicator = indicator;
    this.#indicatorPath = {
      start: Math.min(from.left, target.left),
      end: Math.max(from.left + from.width, target.left + target.width),
    };
    this.#markIndicatorPath();

    indicator.getBoundingClientRect();
    indicator.style.removeProperty('transition-property');
    indicator.style.transitionDuration = `${durationMs}ms`;
    this.#writeIndicatorBox(indicator, target);
  }

  /**
   * Ends the running slide at once: the marker element goes, and the active tab shows its own
   * styling again. A no-op when no slide runs.
   */
  finishIndicator(): void {
    if (this.#indicatorTimeout !== null) {
      this.#rootWindow.clearTimeout(this.#indicatorTimeout);
      this.#indicatorTimeout = null;
    }

    if (this.#indicator !== null) {
      this.#indicator.remove();
      this.#indicator = null;
      this.#indicatorPath = null;
      this.#markIndicatorPath();
      removeClass(this.#host, INDICATOR_MOVING_CLASS);
    }
  }

  /**
   * Slides the tab of a newly created sheet into the strip over `durationMs`. Every repaint
   * within that time rebuilds the tab mid-slide, at the point the slide has reached. A zero
   * duration marks nothing.
   */
  markEntering(id: number, durationMs: number): void {
    if (durationMs <= 0) {
      return;
    }

    this.#trackEntrance(id, this.#now(), durationMs, durationMs);
  }

  /**
   * Records a tab entrance, replacing any the tab had, and schedules its end `remainingMs` from
   * now.
   */
  #trackEntrance(id: number, start: number, duration: number, remainingMs: number): void {
    this.#endEntrance(id);

    const timeout = this.#rootWindow.setTimeout(() => this.#endEntrance(id), remainingMs);

    this.#entering.set(id, { start, duration, timeout });
  }

  /**
   * Ends every running tab entrance at once, leaving each tab in its resting place. A no-op when
   * no tab is sliding in.
   */
  finishEntrances(): void {
    Array.from(this.#entering.keys()).forEach(id => this.#endEntrance(id));
  }

  /**
   * Ends one tab's entrance: forgets it, cancels its timeout, and takes the sliding styles off
   * the tab.
   */
  #endEntrance(id: number): void {
    const entry = this.#entering.get(id);

    if (entry === undefined) {
      return;
    }

    this.#rootWindow.clearTimeout(entry.timeout);
    this.#entering.delete(id);

    const tab = this.getTab(id);

    if (tab !== null) {
      removeClass(tab, ENTERING_CLASS);
      tab.style.removeProperty('animation-delay');
    }
  }

  /**
   * Puts a freshly built tab at the point its entrance has reached, through a negative
   * `animation-delay`, or ends the entrance when its time is up.
   */
  #applyEntrance(tab: HTMLElement, id: number): void {
    const entry = this.#entering.get(id);

    if (entry === undefined) {
      return;
    }

    const elapsed = entranceElapsedMs(entry.start, this.#now(), entry.duration);

    if (elapsed === null) {
      this.#endEntrance(id);

      return;
    }

    addClass(tab, ENTERING_CLASS);
    tab.style.animationDelay = `${-elapsed}ms`;
  }

  /**
   * Reads the strip window's `performance` clock, in milliseconds.
   */
  #now(): number {
    return this.#host.ownerDocument.defaultView?.performance.now() ?? 0;
  }

  /**
   * Returns the active tab's layout box inside the strip, or `null` when no tab is active.
   */
  #activeTabBox(): TabBox | null {
    const tab = this.#host.querySelector('.ht-sheets-bar__tab--active');

    if (!isHTMLElement(tab)) {
      return null;
    }

    return { left: tab.offsetLeft, width: tab.offsetWidth };
  }

  /**
   * Marks the tabs the running slide passes over, and unmarks the rest. The span the marked tabs
   * cover goes onto the strip, which paints the inactive tab surface there, under the marker.
   * With no slide running, every tab is unmarked.
   */
  #markIndicatorPath(): void {
    const path = this.#indicatorPath;
    let start = Infinity;
    let end = -Infinity;

    this.#tabs().forEach((tab) => {
      const left = tab.offsetLeft;
      const right = left + tab.offsetWidth;

      if (path !== null && left < path.end && right > path.start) {
        addClass(tab, INDICATOR_PATH_CLASS);
        start = Math.min(start, left);
        end = Math.max(end, right);
      } else {
        removeClass(tab, INDICATOR_PATH_CLASS);
      }
    });

    if (end > start) {
      this.#host.style.setProperty('--ht-private-tab-indicator-path-x', `${start}px`);
      this.#host.style.setProperty('--ht-private-tab-indicator-path-width', `${end - start}px`);
    } else {
      this.#host.style.removeProperty('--ht-private-tab-indicator-path-x');
      this.#host.style.removeProperty('--ht-private-tab-indicator-path-width');
    }
  }

  /**
   * Writes a box onto the marker element through the custom properties its styles read.
   */
  #writeIndicatorBox(indicator: HTMLElement, box: TabBox): void {
    indicator.style.setProperty('--ht-private-tab-indicator-x', `${box.left}px`);
    indicator.style.setProperty('--ht-private-tab-indicator-width', `${box.width}px`);
  }

  /**
   * Returns the `id` of the active tab's label, which names the grid while the sheet is shown.
   *
   * @returns {string|null} The id, or `null` when no tab is active.
   */
  getActiveLabelId(): string | null {
    const active = [...this.#sheets.values()].find(sheet => sheet.isActive);

    return active === undefined ? null : this.#labelId(active.id);
  }

  /**
   * Builds the `id` of a tab's label.
   *
   * @param {number} sheetId The sheet the tab represents.
   * @returns {string} The id.
   */
  #labelId(sheetId: number): string {
    return `${this.#labelIdPrefix}-${sheetId}`;
  }

  /**
   * Whether a tab holds the strip's one Tab stop: the tab the arrow keys last moved the focus
   * to, while the focus is in the strip, and the active tab otherwise.
   *
   * @param {object} sheet The sheet the tab represents.
   * @returns {boolean} `true` for the tab that takes the focus on Tab.
   */
  #holdsTabStop(sheet: SheetDescriptor): boolean {
    if (this.#rovingId !== null && this.#sheets.has(this.#rovingId)) {
      return sheet.id === this.#rovingId;
    }

    return sheet.isActive;
  }

  /**
   * Gives the strip's Tab stop to one tab and takes it from the others.
   *
   * @param {number|null} id The sheet whose tab takes the stop, or `null` for the active tab.
   */
  #moveTabStop(id: number | null): void {
    this.#rovingId = id;

    this.#tabs().forEach((tab) => {
      const sheet = this.#sheets.get(Number(tab.dataset.sheetId));

      tab.tabIndex = sheet !== undefined && this.#holdsTabStop(sheet) ? 0 : -1;
    });
  }

  /**
   * Builds one tab: the control, its label, and its menu trigger.
   *
   * The whole tab is the control: its label and its menu trigger are decoration inside it
   * rather than controls of their own, which is what lets the two activations mean different
   * things. The strip is one stop in the tab order (a roving tab stop, `#holdsTabStop()`), and
   * the arrow, Home and End keys move along it, so a strip of thirty sheets does not cost thirty
   * presses on the way past.
   *
   * @param {object} sheet The sheet the tab represents.
   * @returns {HTMLElement} The tab element.
   */
  #buildTab(sheet: SheetDescriptor): HTMLElement {
    const tab = this.#host.ownerDocument.createElement('div');
    const label = this.#host.ownerDocument.createElement('span');
    const chevron = this.#host.ownerDocument.createElement('span');

    tab.className = `ht-sheets-bar__tab${sheet.isActive ? ' ht-sheets-bar__tab--active' : ''}`;
    tab.dataset.sheetId = String(sheet.id);
    tab.tabIndex = this.#holdsTabStop(sheet) ? 0 : -1;

    // Only the active tab advertises the popup: on any other tab an activation moves to that
    // sheet, and a "menu button" that navigates instead would promise the wrong thing.
    this.#setAria(tab, [
      ['role', 'button'],
      ...(sheet.isActive ? [['aria-current', 'true'], ['aria-haspopup', 'menu'], ['aria-expanded', 'false']] : []),
    ]);

    label.className = 'ht-sheets-bar__tab-label';
    label.id = this.#labelId(sheet.id);
    label.textContent = sheet.name;
    // The menus ellipsize long names and the strip can scroll a tab half out of view, so the
    // full name stays reachable on hover.
    label.title = sheet.name;
    label.dir = 'auto';

    chevron.className = 'ht-sheets-bar__tab-chevron';
    this.#syncIcon(chevron, CHEVRON_ICON_SLOT_CLASS, 'selectArrow');

    // Pointer-only: the keyboard route to the same menu is the second activation of the tab,
    // so the glyph is decoration to a screen reader rather than a control it should offer.
    // The tab around it is what advertises the popup and takes the focus back.
    this.#setAria(chevron, [['aria-hidden', 'true']]);

    tab.appendChild(label);
    tab.appendChild(chevron);
    this.#applyEntrance(tab, sheet.id);

    return tab;
  }

  /**
   * Whether a tab from the previous paint can show a sheet again. A tab that still holds the
   * input of a rename that ended has no label any more, so it is built anew.
   *
   * @param {HTMLElement} tab The tab from the previous paint.
   * @param {object} sheet The sheet it showed.
   * @returns {boolean} `true` when the tab can be updated in place.
   */
  #canReuseTab(tab: HTMLElement, sheet: SheetDescriptor): boolean {
    return sheet.id === this.#renamingId || tab.querySelector('.ht-sheets-bar__tab-label') !== null;
  }

  /**
   * Updates a tab from the previous paint in place to show a sheet: its active state, its Tab
   * stop, its ARIA and its label. The tab under an open rename keeps its input, and its ARIA
   * stays as the rename set it. The motion a tab is in (an entrance, a slide, the marker's path)
   * is left as it is: it runs on, on the same element, with no restart.
   *
   * @param {HTMLElement} tab The tab from the previous paint.
   * @param {object} sheet The sheet the tab represents.
   * @returns {HTMLElement} The same tab.
   */
  #updateTab(tab: HTMLElement, sheet: SheetDescriptor): HTMLElement {
    const isRenaming = sheet.id === this.#renamingId;

    tab.classList.toggle('ht-sheets-bar__tab--active', sheet.isActive);
    tab.classList.toggle('ht-sheets-bar__tab--renaming', isRenaming);
    tab.tabIndex = this.#holdsTabStop(sheet) ? 0 : -1;

    if (!isRenaming) {
      const label = tab.querySelector('.ht-sheets-bar__tab-label') as HTMLElement;

      removeAttribute(tab, ['aria-current', 'aria-haspopup', 'aria-expanded']);
      this.#setAria(tab, [
        ['role', 'button'],
        ...(sheet.isActive ? [['aria-current', 'true'], ['aria-haspopup', 'menu'], ['aria-expanded', 'false']] : []),
      ]);
      label.textContent = sheet.name;
      label.title = sheet.name;
    }

    return tab;
  }

  /**
   * Runs the activation of the tab that holds the focus: on an inactive sheet it moves there,
   * on the active one it opens the sheet's menu. Bound to <kbd>Enter</kbd> and <kbd>Space</kbd>
   * by the plugin, so a tab answers the keys its `button` role promises.
   *
   * @returns {boolean} `true` when a tab held the focus and was activated.
   */
  activateFocusedTab(): boolean {
    const tab = this.getFocusedTab();

    if (!tab) {
      return false;
    }

    const isActive = tab.classList.contains('ht-sheets-bar__tab--active');
    const sheet = { id: Number(tab.dataset.sheetId), name: '', isActive };

    if (isActive) {
      this.#openMenuFor(sheet, true);
    } else {
      this.runLocalHooks('tabClick', sheet.id);
    }

    return true;
  }

  /**
   * Moves the focus along the strip from the tab that holds it. Bound to the arrow, Home and
   * End keys by the plugin. The arrows follow the reading direction: under RTL the next tab is
   * the one to the left.
   *
   * @param {number|'first'|'last'} step `1` or `-1` for the neighbouring tab in reading order,
   *   or an end of the strip.
   * @returns {boolean} `true` when a tab held the focus and the focus moved.
   */
  focusRelativeTab(step: 1 | -1 | 'first' | 'last'): boolean {
    const tabs = this.#tabs();
    const current = this.getFocusedTab();

    if (!current || tabs.length === 0) {
      return false;
    }

    let index = tabs.indexOf(current);

    if (step === 'first') {
      index = 0;
    } else if (step === 'last') {
      index = tabs.length - 1;
    } else {
      index = Math.min(Math.max(index + step, 0), tabs.length - 1);
    }

    tabs[index].focus();

    return true;
  }

  /**
   * Returns the arrow step that reads as "forward" for the given key name, mirroring the
   * horizontal arrows under RTL.
   *
   * @param {string} key The key name, `ArrowLeft` or `ArrowRight`.
   * @returns {1|-1} The step along the strip's DOM order.
   */
  arrowStep(key: 'ArrowLeft' | 'ArrowRight'): 1 | -1 {
    const forward = key === 'ArrowRight';

    return (forward !== this.#isRtl) ? 1 : -1;
  }

  /**
   * Returns the tab that holds the focus, or `null` when the focus is elsewhere or inside the
   * rename input, which owns its own keys.
   *
   * @returns {HTMLElement|null} The focused tab.
   */
  getFocusedTab(): HTMLElement | null {
    const active = getDeepActiveElement(this.#host.ownerDocument);

    if (!isHTMLElement(active) || !active.classList.contains('ht-sheets-bar__tab')) {
      return null;
    }

    return active;
  }

  /**
   * Brings every tab's chevron icon in step with the theme after a theme change, in place. Unlike
   * `render()`, it neither rebuilds the tabs nor aborts a drag or an open rename: `afterSetTheme`
   * also fires for a color-scheme or density switch, which must not cost the user what they were
   * typing. `syncIcon()` leaves an icon whose mapping did not move untouched.
   */
  refreshIcons(): void {
    this.#host.querySelectorAll<HTMLElement>('.ht-sheets-bar__tab-chevron').forEach((chevron) => {
      this.#syncIcon(chevron, CHEVRON_ICON_SLOT_CLASS, 'selectArrow');
    });
  }

  /**
   * Whether a tab drag is in progress.
   *
   * @returns {boolean} `true` mid-gesture.
   */
  isDragging(): boolean {
    return this.#drag.isDragging();
  }

  /**
   * Puts the strip back the way it was before the drag in progress, if any.
   */
  abortDrag(): void {
    this.#drag.abort();
  }

  /**
   * Opens a sheet's menu, moving to that sheet first when it is not the active one.
   *
   * The anchor is looked up after the move rather than captured before it: activating a sheet
   * repaints the strip, so the element the gesture started on is no longer in the document.
   *
   * @param {object} sheet The sheet whose menu to open.
   * @param {boolean} fromKeyboard Whether the request came from the keyboard, which decides
   *   whether the menu preselects its first item.
   */
  #openMenuFor(sheet: SheetDescriptor, fromKeyboard: boolean): void {
    if (!sheet.isActive) {
      this.runLocalHooks('tabClick', sheet.id);
    }

    const tab = this.getTab(sheet.id);

    // A refused switch leaves another sheet in front of the user, and the menu would act on the
    // sheet they cannot see.
    if (!tab?.classList.contains('ht-sheets-bar__tab--active')) {
      return;
    }
    const chevron = tab?.querySelector('.ht-sheets-bar__tab-chevron');

    // The tab is the control the menu belongs to — it is what takes the focus back and what
    // carries `aria-expanded` — while the menu lines up under the trigger glyph inside it.
    if (tab && isHTMLElement(chevron)) {
      this.runLocalHooks('tabMenuClick', sheet.id, tab, fromKeyboard, chevron);
    }
  }

  /**
   * Checks whether an event landed on a tab's menu trigger.
   *
   * @param {Event} event The event to test.
   * @returns {boolean} `true` when the trigger owns it.
   */
  #isWithinChevron(event: Event): boolean {
    const target = event.target;

    return isHTMLElement(target) && target.closest('.ht-sheets-bar__tab-chevron') !== null;
  }

  /**
   * Records which tab inside the strip holds the focus, so a repaint can hand it back.
   *
   * A repaint removes the tab of a sheet that is gone and builds the tab of a sheet that is new,
   * which drops the focus to the document body when it sat on a removed tab — the user would
   * otherwise lose their place in the tab order. Focus outside the strip is left alone: a
   * repaint must never pull it in.
   *
   * @returns {object|null} The sheet id and the tab's position, or `null`.
   */
  #capturedFocus(): CapturedFocus | null {
    const active = getDeepActiveElement(this.#host.ownerDocument);

    if (!isHTMLElement(active) || !this.#host.contains(active)) {
      return null;
    }

    const tab = active.closest('[data-sheet-id]');

    if (!isHTMLElement(tab) || tab.dataset.sheetId === undefined) {
      return null;
    }

    return { sheetId: tab.dataset.sheetId, index: this.#tabs().indexOf(tab) };
  }

  /**
   * Puts the focus back on the rebuilt tab that held it — or, when that sheet is gone, on the
   * tab that took its place, and on the last tab when it was the last one. The focus must land
   * somewhere in the strip either way; the document body is not a place to leave a user.
   *
   * @param {object|null} focused What `#capturedFocus()` recorded.
   */
  #restoreFocus(focused: CapturedFocus | null): void {
    const active = getDeepActiveElement(this.#host.ownerDocument);

    if (focused === null || (isHTMLElement(active) && this.#host.contains(active))) {
      return;
    }

    const tabs = this.#tabs();
    const tab = this.#host.querySelector(`[data-sheet-id="${focused.sheetId}"]`);
    const target = isHTMLElement(tab) ? tab : tabs[Math.min(focused.index, tabs.length - 1)];

    target?.focus();
  }

  /**
   * Scrolls the strip just far enough to bring the active tab fully into view.
   *
   * Every route to a new active sheet — the add button, either menu, the API — ends in a
   * repaint, so doing it here covers them all. Only a repaint that changed which sheet is
   * active scrolls, or paging the strip by hand would be undone by the next render. The scroll
   * is applied to the strip itself rather than through `scrollIntoView()`, which would also
   * scroll the page the grid sits on. The tab is measured by its layout box, which leaves out
   * the transform of an entrance or a drag in flight, in the coordinates `scrollLeft` uses under
   * both directions.
   *
   * @param {number} activeId The active sheet's id, or `-1` when there is none.
   */
  #revealActiveTab(activeId: number): void {
    if (activeId === this.#revealedId) {
      return;
    }

    const tab = this.#host.querySelector('.ht-sheets-bar__tab--active');

    if (activeId !== -1 && (!isHTMLElement(tab) || this.#host.clientWidth === 0)) {
      return;
    }

    this.#revealedId = activeId;

    if (isHTMLElement(tab)) {
      this.#scrollIntoStrip(tab);
      this.#isRevealUnsettled = true;
    }
  }

  /**
   * Repeats the reveal the last repaint made, once the paging arrows have taken their room. The
   * repaint reveals the active tab against the strip as it is then; the plugin shows or hides the
   * arrows right after, which narrows or widens the strip and could leave the tab cut at the
   * strip's end. Only that one reveal is repeated, so a strip the user paged by hand stays put.
   */
  settleReveal(): void {
    if (!this.#isRevealUnsettled) {
      return;
    }

    this.#isRevealUnsettled = false;

    const tab = this.#host.querySelector('.ht-sheets-bar__tab--active');

    if (isHTMLElement(tab)) {
      this.#scrollIntoStrip(tab);
    }
  }

  /**
   * Brings the active tab into view when no reveal has been measured for it yet. A strip with
   * no width (a grid built or switched inside a hidden container, or the first paint before
   * the bar is laid out) cannot be scrolled, so the reveal waits for the strip to get a size;
   * the plugin calls this when the strip is resized.
   */
  revealPendingActiveTab(): void {
    const active = [...this.#sheets.values()].find(sheet => sheet.isActive);

    this.#revealActiveTab(active?.id ?? -1);
  }

  /**
   * Scrolls the strip just far enough to bring a sheet's tab fully into view, measured by its
   * layout box, so a tab still sliding to its place is revealed at that place.
   */
  revealTab(id: number): void {
    const tab = this.getTab(id);

    if (tab !== null) {
      this.#scrollIntoStrip(tab);
    }
  }

  /**
   * Scrolls the strip just far enough to bring a tab fully into view, by its layout box, which
   * leaves out the transform of an entrance, a slide, or a drag in flight, in the coordinates
   * `scrollLeft` uses under both directions.
   */
  #scrollIntoStrip(tab: HTMLElement): void {
    const start = tab.offsetLeft;
    const end = start + tab.offsetWidth;
    const viewStart = this.#host.scrollLeft;
    const viewEnd = viewStart + this.#host.clientWidth;

    if (start < viewStart) {
      this.#host.scrollLeft = start;
    } else if (end > viewEnd) {
      this.#host.scrollLeft = end - this.#host.clientWidth;
    }
  }

  /**
   * Swaps a tab label for a rename input. Enter/blur commit, Escape cancels; the
   * commit is reported through the `tabRenameCommit` local hook. Keyboard-driven
   * endings (Enter/Escape) request a focus restore on the rebuilt tab label, while a
   * blur-driven commit keeps the focus where the user just moved it.
   */
  startRename(id: number): void {
    const tab = this.getTab(id);
    const label = tab?.querySelector('.ht-sheets-bar__tab-label') as HTMLElement | null;

    if (!tab || !label) {
      return;
    }

    this.finishIndicator();
    this.finishSlide();
    this.finishLeaving();

    const input = this.#host.ownerDocument.createElement('input');
    const mirror = this.#host.ownerDocument.createElement('span');
    const tabWidthBeforeEdit = tab.getBoundingClientRect().width;
    let finished = false;
    let widthFloor = 0;
    const finish = (commit: boolean, restoreFocus: boolean, silent = false) => {
      if (finished) {
        return;
      }
      finished = true;
      this.#cancelRename = null;
      this.#renamingId = null;
      mirror.remove();
      removeClass(tab, 'ht-sheets-bar__tab--renaming');

      if (commit) {
        this.runLocalHooks('tabRenameCommit', id, input.value, restoreFocus);
      } else if (!silent) {
        this.runLocalHooks('tabRenameCancel', id, restoreFocus);
      }
    };

    this.#cancelRename = (silent = false) => finish(false, false, silent);
    this.#renamingId = id;

    input.className = 'ht-sheets-bar__tab-rename';
    input.value = label.textContent ?? '';
    input.dir = 'auto';
    input.setAttribute('data-hot-input', '');
    setAttribute(input, [A11Y_LABEL(this.#translate(C.SHEETS_BAR_RENAME_SHEET))]);
    input.addEventListener('keydown', (event) => {
      // Mid-composition, Enter and Escape belong to the IME: they confirm or discard the
      // candidate, not the name. The browser reports either as an unfinished character.
      if (event.isComposing || event.keyCode === 229) {
        return;
      }

      if (event.key !== 'Enter' && event.key !== 'Escape') {
        return;
      }

      // Ending the edit hands the focus back to the tab while this keystroke is still on its way
      // to the document, where the bar's shortcuts would read the same Enter as an activation of
      // the tab it just landed on. The input owns its keys; nothing above it gets them.
      event.stopPropagation();
      stopImmediatePropagation(event);
      finish(event.key === 'Enter', true);
    });
    // The limit is counted the way the model counts it — in characters a reader sees, so an
    // emoji costs one — rather than through the input's own `maxlength`, which counts UTF-16
    // units and would stop an emoji-heavy name at half the length the API accepts.
    const applyLengthCap = () => {
      const limited = truncateSheetName(input.value);

      if (limited !== input.value) {
        input.value = limited;
      }

      this.#syncRenameWidth(input, mirror, widthFloor);
    };

    input.addEventListener('blur', () => finish(true, false));
    input.addEventListener('input', (event) => {
      // Mid-composition the value belongs to the IME: writing `input.value` here cancels the
      // session, committing or dropping the candidate instead of leaving it in the composition
      // window. The cap waits for `compositionend`; only the width tracks the interim text.
      if ((event as InputEvent).isComposing) {
        this.#syncRenameWidth(input, mirror, widthFloor);

        return;
      }

      applyLengthCap();
    });
    input.addEventListener('compositionend', applyLengthCap);

    mirror.className = 'ht-sheets-bar__tab-rename-mirror';
    mirror.setAttribute('aria-hidden', 'true');

    // The renaming class hides the menu chevron for the duration of the edit: the tab is a
    // text field at that point, and the trigger would open a menu acting on a name the user
    // is still typing. The button role goes with it — a button's children are presentational
    // to assistive technology, which would take the input out of the accessibility tree.
    addClass(tab, 'ht-sheets-bar__tab--renaming');
    removeAttribute(tab, ['role', 'aria-haspopup', 'aria-expanded']);
    label.replaceWith(input);
    tab.appendChild(mirror);
    this.#syncRenameWidth(input, mirror, 0);

    // Entering the edit removes the label, the gap, and the chevron from the tab, which would
    // otherwise make it visibly narrower the moment it is double-clicked. Whatever width that
    // frees is handed to the input, so the tab keeps its size and the field simply flows into
    // the space the trigger left behind. It stays the floor for the rest of the edit, so
    // clearing the name does not collapse the tab either.
    //
    // The deficit is added to the width the input actually renders at, not to the width just
    // asked for: the CSS `min-width` can be holding it wider than its text, and adding to the
    // narrower number would leave the tab short by that difference.
    const deficit = tabWidthBeforeEdit - tab.getBoundingClientRect().width;

    if (deficit > 0) {
      widthFloor = this.#contentWidthOf(input) + deficit;
      this.#syncRenameWidth(input, mirror, widthFloor);
    }

    // The rename always starts from something the user just clicked, so the field is on
    // screen already; letting focus scroll to it only jerks the page under them.
    input.focus({ preventScroll: true });
    input.select();
  }

  /**
   * Grows the rename input to fit the text it holds, the way a spreadsheet tab does.
   *
   * The value is measured on a mirror element that sits inside the same tab and therefore
   * inherits the input's typography, so the width follows the rendered text rather than a
   * character count — proportional fonts make those two disagree. The absolute bounds stay
   * in CSS as `min-width`/`max-width`, leaving only the measured value here.
   *
   * @param {HTMLInputElement} input The rename input being edited.
   * @param {HTMLElement} mirror The hidden element the value is measured on.
   * @param {number} floor Width the input keeps even when its text is narrower, in pixels.
   */
  #syncRenameWidth(input: HTMLInputElement, mirror: HTMLElement, floor: number): void {
    mirror.textContent = input.value;
    input.style.width = `${Math.max(mirror.getBoundingClientRect().width, floor)}px`;
  }

  /**
   * Measures an element's content box, which is what a `width` set on an `input` addresses —
   * the base styles normalize inputs to `content-box`, so its border box carries the padding
   * and border on top of whatever width was assigned.
   *
   * @param {HTMLElement} element The element to measure.
   * @returns {number} The content-box width in pixels.
   */
  #contentWidthOf(element: HTMLElement): number {
    const view = element.ownerDocument.defaultView;
    const borderBox = element.getBoundingClientRect().width;

    if (!view) {
      return borderBox;
    }

    const styles = view.getComputedStyle(element);
    const edges = ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'] as const;

    return edges.reduce((width, edge) => width - (parseFloat(styles[edge]) || 0), borderBox);
  }

  /**
   * Moves the browser focus onto a tab, when it still exists. The tab is the control, so this
   * is where every focus restore lands.
   *
   * @param {number} id The sheet whose tab to focus.
   */
  focusTab(id: number): void {
    this.getTab(id)?.focus();
  }

  /**
   * Returns a sheet's tab as it stands now.
   *
   * @param {number} id The sheet's id.
   * @returns {HTMLElement|null} The tab, or `null` when the sheet has none.
   */
  getTab(id: number): HTMLElement | null {
    const tab = this.#host.querySelector(`[data-sheet-id="${id}"]`);

    return isHTMLElement(tab) ? tab : null;
  }

  /**
   * Returns the tabs in strip order.
   *
   * @returns {HTMLElement[]} The tab elements.
   */
  #tabs(): HTMLElement[] {
    return Array.from(this.#host.querySelectorAll('.ht-sheets-bar__tab')).filter(isHTMLElement);
  }

  /**
   * Writes ARIA attributes when the grid emits them.
   *
   * @param {HTMLElement} element The element to decorate.
   * @param {Array} attributes `[name, value]` pairs.
   */
  #setAria(element: HTMLElement, attributes: string[][]): void {
    if (this.#ariaTags) {
      setAttribute(element, attributes as Array<[string, string]>);
    }
  }

  /**
   * Checks whether an event comes from the inline-rename input, which owns its own text
   * interactions and must keep them.
   *
   * @param {Event} event The event to classify.
   * @returns {boolean} `true` when the event originates inside the rename input.
   */
  #isWithinRenameInput(event: Event): boolean {
    return isHTMLElement(event.target) && event.target.closest('.ht-sheets-bar__tab-rename') !== null;
  }

  /**
   * Clears the strip contents and local hooks.
   */
  destroy(): void {
    this.finishIndicator();
    this.finishEntrances();
    this.finishSlide();
    this.finishLeaving();
    this.#drag.destroy();
    this.clearLocalHooks();
    this.#listenToTabs(false);
    this.#host.textContent = '';
    this.#sheets.clear();
  }

  /**
   * Adds or removes the listeners the strip host carries for every tab inside it. They are added once, when
   * the strip is built, and not to each tab on every repaint: a listener is bound to the context of the call
   * that adds it (Angular's zone, for one), and a repaint the host's own code triggers would otherwise bind
   * the tabs' listeners to that code's context.
   *
   * @param {boolean} listen `true` to add the listeners, `false` to remove them.
   */
  #listenToTabs(listen: boolean): void {
    const host = this.#host;
    const toggle = <K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (event: HTMLElementEventMap[K]) => void,
    ) => {
      if (listen) {
        host.addEventListener(type, listener);
      } else {
        host.removeEventListener(type, listener);
      }
    };

    toggle('click', this.#onTabClick);
    toggle('dblclick', this.#onTabDoubleClick);
    toggle('pointerdown', this.#onTabPointerDown);
    toggle('contextmenu', this.#onTabContextMenu);
    toggle('focusin', this.#onTabFocusIn);
    toggle('focusout', this.#onTabFocusOut);
  }

  /**
   * Gives the Tab stop to the tab that took the focus, so <kbd>Shift</kbd>+<kbd>Tab</kbd> back into
   * the strip returns to it.
   *
   * @param {FocusEvent} event The `focusin` event.
   */
  #onTabFocusIn = (event: FocusEvent): void => {
    const target = this.#tabOfEvent(event);

    if (target !== null && target.sheet.id !== this.#rovingId) {
      this.#moveTabStop(target.sheet.id);
    }
  };

  /**
   * Gives the Tab stop back to the active tab once the focus leaves the strip.
   *
   * @param {FocusEvent} event The `focusout` event.
   */
  #onTabFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget;

    if (this.#rovingId !== null && !(next instanceof Node && this.#host.contains(next))) {
      this.#moveTabStop(null);
    }
  };

  /**
   * Returns the tab an event landed in, and the sheet it shows.
   *
   * @param {Event} event The event.
   * @returns {object|null} The tab and its sheet, or `null` outside a tab.
   */
  #tabOfEvent(event: Event): { tab: HTMLElement, sheet: SheetDescriptor } | null {
    const target = event.target;
    const tab = isHTMLElement(target) ? target.closest('.ht-sheets-bar__tab') : null;

    if (!isHTMLElement(tab) || tab.parentElement !== this.#host) {
      return null;
    }

    const sheet = this.#sheets.get(Number(tab.dataset.sheetId));

    return sheet ? { tab, sheet } : null;
  }

  /**
   * Switches to the clicked tab's sheet, or opens the active sheet's menu from its chevron.
   *
   * @param {Event} event The `click` event.
   */
  #onTabClick = (event: MouseEvent) => {
    const target = this.#tabOfEvent(event);

    if (target === null || this.#isWithinRenameInput(event)) {
      return;
    }

    // The trigger is on every tab, but it only opens a menu for the sheet you are already
    // on. On any other tab the first click means "come here", and the second — now on the
    // active tab — opens the menu. A menu acts on a sheet, so it waits until that sheet is
    // the one in front of you.
    if (target.sheet.isActive && this.#isWithinChevron(event)) {
      this.#openMenuFor(target.sheet, false);

      return;
    }

    this.runLocalHooks('tabClick', target.sheet.id);
  };

  /**
   * Starts renaming the double-clicked tab's sheet.
   *
   * @param {Event} event The `dblclick` event.
   */
  #onTabDoubleClick = (event: MouseEvent) => {
    const target = this.#tabOfEvent(event);

    if (target !== null && !this.#isWithinRenameInput(event) && !this.#isWithinChevron(event)) {
      this.startRename(target.sheet.id);
    }
  };

  /**
   * Starts a drag of the pressed tab.
   *
   * @param {Event} event The `pointerdown` event.
   */
  #onTabPointerDown = (event: PointerEvent) => {
    const target = this.#tabOfEvent(event);

    if (target === null) {
      return;
    }

    if (event.button === 0 && !this.#isWithinRenameInput(event)) {
      if (this.#cancelRename) {
        target.tab.focus({ preventScroll: true });
      }

      this.#drag.start(event, target.tab, target.sheet.id);
    }
  };

  /**
   * Opens the sheet menu of the tab the context menu was raised on.
   *
   * Right-clicking a tab opens the same menu, which is what a spreadsheet user expects.
   * On another sheet it moves there first — the menu acts on a sheet, so it has to be the
   * sheet in front of you. The rename input keeps the browser's own menu; that one is for
   * editing text, not for the sheet. The keyboard raises the same event — Shift+F10, the
   * Menu key — and only then does the menu open with an item preselected. `button` alone
   * cannot tell those apart: a touch long-press and a macOS Ctrl+click both report
   * `button: 0`, so the keyboard is recognized by no button being held and no pointer
   * having gone down on the tab. The long-press half is pinned by a Playwright touch test;
   * a genuine macOS Ctrl+click cannot be synthesized from Playwright, so that half rides on
   * the same flag untested.
   *
   * @param {Event} event The `contextmenu` event.
   */
  #onTabContextMenu = (event: MouseEvent) => {
    const target = this.#tabOfEvent(event);

    if (target === null || this.#isWithinRenameInput(event)) {
      return;
    }

    const fromKeyboard = event.button === 0 && event.buttons === 0 && !this.#drag.isPressing();

    event.preventDefault();
    event.stopPropagation();
    this.#openMenuFor(target.sheet, fromKeyboard);
  };
}

mixin(TabStrip, localHooks);
