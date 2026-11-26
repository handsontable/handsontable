/**
 * The custom property the page offset, the sidebar pane, and the ToC panel read the height of the
 * phone and tablet sub-bar from (`styles/layout/responsive.css`).
 */
export const SUBHEADER_HEIGHT_PROPERTY = '--sl-mobile-subheader-height';

/**
 * Keeps `--sl-mobile-subheader-height` on the root element equal to the sub-bar's rendered height.
 *
 * The sub-bar's breadcrumbs wrap instead of being cut off with an ellipsis (WCAG 1.4.10, 1.4.4, and
 * 1.4.12), so the bar grows by a line when the page title does not fit. Everything placed under the
 * bar reads its height from the custom property, so the property follows the bar. While the bar
 * renders no box (the desktop layout), the property is removed and the stylesheet's value applies.
 *
 * @param {HTMLElement} subheader The sub-bar.
 * @param {HTMLElement} root The element that holds the property (`document.documentElement`).
 * @param {{ ResizeObserver?: typeof ResizeObserver }} [env] The `ResizeObserver` constructor.
 * @returns {() => void} A function that stops the sync and removes the property.
 */
export function syncSubheaderHeight(subheader, root, { ResizeObserver: Observer = globalThis.ResizeObserver } = {}) {
  const update = () => {
    const height = subheader.getBoundingClientRect().height;

    if (height > 0) {
      root.style.setProperty(SUBHEADER_HEIGHT_PROPERTY, `${height}px`);
    } else {
      root.style.removeProperty(SUBHEADER_HEIGHT_PROPERTY);
    }
  };

  update();

  if (typeof Observer !== 'function') {
    return () => root.style.removeProperty(SUBHEADER_HEIGHT_PROPERTY);
  }

  const observer = new Observer(update);

  observer.observe(subheader, { box: 'border-box' });

  return () => {
    observer.disconnect();
    root.style.removeProperty(SUBHEADER_HEIGHT_PROPERTY);
  };
}
