import { isFunction } from '../helpers/function';
import { warnOnce } from '../helpers/console';
import { describeValue } from '../utils/describeValue';
import {
  classifyInlineSize,
  createCssValueOracle,
  resolveRootSize,
  type InlineSizeState,
} from '../utils/rootSize';
import type { GridSettings } from './settings';
import type { HotInstance } from './types';

/**
 * The two root size options, which are also the inline style properties they write.
 */
type RootSizeAxis = 'height' | 'width';

/**
 * The state of the root's inline size, read before and after an `updateSettings` call to tell
 * whether the engine's scrollable elements need re-picking.
 */
interface RootSizeSnapshot {
  heightInline: string;
  height: InlineSizeState;
}

/**
 * What `applyRootSize()` reports back to `updateSettings`.
 */
export interface RootSizeResult {
  /**
   * `true` when the element that scrolls the grid may have changed, so the engine must re-resolve
   * its scrollable elements.
   */
  scrollOwnerChanged: boolean;
}

/**
 * The initial inline style values of the properties this module owns.
 */
interface InitialStyle {
  height: string;
  width: string;
  overflowX: string;
  overflowY: string;
}

/**
 * Tells whether an inline overflow longhand is one this module wrote (`clip`) or is unset. Any
 * other value belongs to the user (for example `overflow: hidden` restored from the initial style)
 * and is never touched.
 *
 * @param {string} overflowValue The inline `overflow-x` or `overflow-y` value.
 * @returns {boolean}
 */
function isOwnedOverflow(overflowValue: string): boolean {
  return overflowValue === '' || overflowValue === 'clip';
}

/**
 * Tells whether an inline height leaves the vertical axis to the page: unset, or `auto`.
 *
 * @param {InlineSizeState} state The classified inline height.
 * @returns {boolean}
 */
function isFreeHeight(state: InlineSizeState): boolean {
  return state === 'unset' || state === 'auto';
}

/**
 * Reads the root's inline size state.
 *
 * @param {HTMLElement} rootElement The grid's root element.
 * @returns {RootSizeSnapshot}
 */
function snapshot(rootElement: HTMLElement): RootSizeSnapshot {
  const heightInline = rootElement.style.height;

  return { heightInline, height: classifyInlineSize(heightInline) };
}

/**
 * Parses the inline style the root carried before the grid took it over. Root instances always
 * build a fresh `<div>`, so the attribute is empty for them; a nested grid can carry one.
 *
 * @param {HTMLElement} rootElement The grid's root element.
 * @returns {InitialStyle}
 */
function parseInitialStyle(rootElement: HTMLElement): InitialStyle {
  const scratch = rootElement.ownerDocument.createElement('div');

  scratch.style.cssText = rootElement.dataset.initialstyle ?? '';

  const { height, width, overflow, overflowX, overflowY } = scratch.style;

  // A browser expands the `overflow` shorthand into the longhands; jsdom does not, so the shorthand
  // is the fallback there.
  return { height, width, overflowX: overflowX || overflow, overflowY: overflowY || overflow };
}

/**
 * Restores one axis to its initial inline value (`null` was passed for the option). Only the axis
 * and the overflow it owns are restored, never the whole `style` attribute: a `height: null` must
 * leave a `width` set through the option in place.
 *
 * @param {HTMLElement} rootElement The grid's root element.
 * @param {RootSizeAxis} axis The axis to restore.
 */
function resetAxis(rootElement: HTMLElement, axis: RootSizeAxis): void {
  const initial = parseInitialStyle(rootElement);
  const { style } = rootElement;

  style[axis] = initial[axis];

  if (axis === 'height') {
    if (isOwnedOverflow(style.overflowY)) {
      style.overflowY = initial.overflowY;
    }
    if (isOwnedOverflow(style.overflowX)) {
      style.overflowX = initial.overflowX;
    }
  }
}

/**
 * Prints the one-time warning for a value that cannot be read as a size. The value is part of the
 * key: keyed on the option name alone, a later `updateSettings` with a different bad value would
 * print nothing, and the console would only ever name the first one. Wrappers that re-send the
 * same settings on every commit still print once.
 *
 * @param {HTMLElement} rootElement The grid's root element, the scope of the warning.
 * @param {RootSizeAxis} axis The option name.
 * @param {*} value The rejected value.
 */
function warnInvalidSize(rootElement: HTMLElement, axis: RootSizeAxis, value: unknown): void {
  const described = describeValue(value);
  const relativeExample = axis === 'height' ? '\'75vh\'' : '\'75vw\'';

  warnOnce(
    rootElement,
    `invalid-root-size-${axis}-${described}`,
    `Handsontable: the \`${axis}\` option expects a number of pixels, such as \`500\`, \`'500'\`, ` +
    `or \`'500px'\`, a CSS length such as \`'50%'\` or \`${relativeExample}\`, or \`'auto'\`. ` +
    `The value ${described} cannot be read as a size, so it is ignored and the grid's ${axis} ` +
    'is left as it was.'
  );
}

/**
 * Applies one axis of the payload: calls a function value, runs the `before*Change` hook, then
 * resets on `null`, ignores an unreadable value with a warning, and writes anything else.
 *
 * @param {HotInstance} instance The grid instance.
 * @param {RootSizeAxis} axis The option to apply.
 * @param {*} rawValue The value from the payload, `undefined` when the payload does not carry it.
 * @param {string} hookName The hook that may replace the value.
 * @returns {boolean} `true` when the axis was reset to its initial value.
 */
function applyAxis(instance: HotInstance, axis: RootSizeAxis, rawValue: unknown, hookName: string): boolean {
  if (rawValue === undefined) {
    return false;
  }

  let value: unknown = isFunction(rawValue) ? (rawValue as () => unknown)() : rawValue;

  value = instance.runHooks(hookName, value);

  if (value === null) {
    resetAxis(instance.rootElement, axis);

    return true;
  }

  if (value === undefined) {
    return false;
  }

  const resolution = resolveRootSize(value, createCssValueOracle(instance.rootWindow, axis));

  if (resolution.kind === 'invalid') {
    warnInvalidSize(instance.rootElement, axis, value);
  } else {
    instance.rootElement.style[axis] = resolution.cssValue ?? '';
  }

  return false;
}

/**
 * Writes the root's overflow from the sizes now on it. This is the contract the engine reads to
 * pick the owner of each scroll axis.
 *
 * - A sized height (a length, `%`, viewport units) clips both axes: the grid scrolls inside its box.
 * - A free height (unset or `auto`) with a definite width clips the horizontal axis only: the root
 *   scrolls the columns, the page scrolls the rows.
 * - A free height with a free or container-driven width clips nothing: the page scrolls both axes,
 *   and a wider-than-page grid gives the page a horizontal scrollbar rather than hiding columns.
 *
 * Only the longhands this module owns (`clip` or unset) are ever written on the free-height paths.
 * The longhands are written on the sized path too, never the shorthand: a browser serializes two
 * equal longhands back as `overflow: clip`, while jsdom keeps the shorthand and the longhands apart,
 * so writing the longhands is what reads back the same in both.
 *
 * @param {HTMLElement} rootElement The grid's root element.
 * @param {boolean} heightRestored `true` when the height was just reset to its initial inline value.
 * A restored sized height keeps the overflow restored with it, so the initial style comes back
 * whole; a sized height set through the option always clips.
 */
function applyOverflow(rootElement: HTMLElement, heightRestored: boolean): void {
  const { style } = rootElement;
  const heightState = classifyInlineSize(style.height);
  const widthState = classifyInlineSize(style.width);

  if (!isFreeHeight(heightState)) {
    if (!heightRestored) {
      style.overflowX = 'clip';
      style.overflowY = 'clip';
    }

    return;
  }

  if (isOwnedOverflow(style.overflowY)) {
    style.overflowY = '';
  }

  if (isOwnedOverflow(style.overflowX)) {
    style.overflowX = widthState === 'definite' ? 'clip' : '';
  }
}

/**
 * Tells whether the element scrolling the grid may have moved. The rule is a superset of the one
 * `updateSettings` used before this module: a re-pick costs one re-resolution, a missed one leaves
 * a stale scroller. It fires on every payload without a height (as before), when the height moves
 * between free and sized, and when a free height changes its inline value (`'' → 'auto'`).
 *
 * @param {RootSizeSnapshot} before The state before the payload was applied.
 * @param {RootSizeSnapshot} after The state after.
 * @param {boolean} heightInPayload Whether the payload carried a `height`.
 * @returns {boolean}
 */
function hasScrollOwnerChanged(before: RootSizeSnapshot, after: RootSizeSnapshot, heightInPayload: boolean): boolean {
  const freeBefore = isFreeHeight(before.height);
  const freeAfter = isFreeHeight(after.height);

  if (!heightInPayload || freeBefore !== freeAfter) {
    return true;
  }

  return (freeBefore || freeAfter) && before.heightInline !== after.heightInline;
}

/**
 * Applies the `height` and `width` options to the grid's root element. This is the only writer of
 * the root's inline `height`, `width`, and `overflow*`.
 *
 * @param {HotInstance} instance The grid instance.
 * @param {Partial<GridSettings>} settings The `updateSettings` payload.
 * @param {boolean} init `true` on the first call, when the initial inline style is captured.
 * @returns {RootSizeResult}
 */
export function applyRootSize(instance: HotInstance, settings: Partial<GridSettings>, init: boolean): RootSizeResult {
  const { rootElement } = instance;

  if (init) {
    const initialStyle = rootElement.getAttribute('style');

    if (initialStyle) {
      rootElement.dataset.initialstyle = initialStyle;
    }
  }

  const before = snapshot(rootElement);

  const heightRestored = applyAxis(instance, 'height', settings.height, 'beforeHeightChange');

  applyAxis(instance, 'width', settings.width, 'beforeWidthChange');

  if (settings.height !== undefined || settings.width !== undefined) {
    applyOverflow(rootElement, heightRestored);
  }

  return {
    scrollOwnerChanged: hasScrollOwnerChanged(before, snapshot(rootElement), settings.height !== undefined),
  };
}
