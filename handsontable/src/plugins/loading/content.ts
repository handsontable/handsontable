import { LOADING_CLASS_NAME, PLUGIN_KEY, DEFAULT_ICON } from './loading';
import { buildTemplate, SVG_NS, type TemplateSpec } from '../../helpers/dom/template';
import { fastInnerHTML } from '../../helpers/dom/element';
import type { SanitizerFn } from '../../core/settings';

/**
 * The built-in spinner as a template spec, matching `DEFAULT_ICON` node for node.
 *
 * `ns` is load-bearing: an `<svg>` created through `createElement` without the SVG namespace is an
 * unknown HTML element and renders nothing at all, with no error. Descendants inherit it, so only
 * the root carries it.
 */
const DEFAULT_ICON_SPEC: TemplateSpec = {
  tag: 'svg',
  ns: SVG_NS,
  className: `${LOADING_CLASS_NAME}__icon-svg`,
  attrs: { fill: 'none', viewBox: '0 0 16 16' },
  children: [{
    tag: 'path',
    attrs: { stroke: 'currentColor', 'stroke-width': '2', d: 'M15 8a7 7 0 1 1-3.5-6.062' },
  }],
};

/**
 * @description
 * The `loadingContent` function returns the loading content as DOM nodes.
 *
 * It used to return an HTML string, which the dialog plugin then wrote through `fastInnerHTML`.
 * That is a Trusted Types sink, so calling `loading.show()` under `require-trusted-types-for
 * 'script'` threw and the overlay never rendered - the grid constructed cleanly, because the
 * overlay is only built on `show()`/`update()`, which is what made it easy to miss.
 *
 * The one part that cannot become DOM is a caller-supplied `icon`, which the option documents as
 * markup. The default is recognized and built as nodes; anything else is the caller's own markup and
 * goes through `fastInnerHTML`, so it obeys their `sanitizer` and their policy like any other value
 * they hand the grid.
 *
 * @param {object} options Loading content options.
 * @param {string} options.id Loading id.
 * @param {string} options.icon Loading icon. Written as markup when it is not the built-in spinner,
 *   so the default (and any replacement for it) renders. Never pass a value derived from user input.
 * @param {string} options.title Loading title. Rendered as text: markup passed here shows up
 *   literally instead of being interpreted.
 * @param {string} options.description Loading description. Rendered as text, like the title.
 * @param {boolean|Function} [options.sanitizer] The resolved `sanitizer`, applied to a custom icon.
 * @param {object} [options.warnScope] Scope for the once-per-instance missing-sanitizer warning.
 * Returns an ELEMENT, not a `DocumentFragment`, and that is load-bearing. The dialog plugin stores
 * `content` in its settings and re-reads it on every render (`dialog.ts`, `#renderDialog`), and
 * appending a fragment empties it - so the first render showed the overlay and the next one showed
 * an empty box. Re-appending the same element is a no-op when it is already in place.
 *
 * @param {Document} rootDocument The document to build the nodes in.
 * @returns {HTMLElement} The loading content.
 */
export function loadingContent({ id, icon, title, description, sanitizer = true, warnScope }: {
  id: string;
  icon: string;
  title: string;
  description?: string;
  sanitizer?: boolean | SanitizerFn;
  warnScope?: object;
// eslint-disable-next-line no-restricted-globals
}, rootDocument: Document = document): HTMLElement {
  const isDefaultIcon = icon === DEFAULT_ICON;
  const { refs } = buildTemplate({
    tag: 'div',
    ref: 'content',
    className: `${LOADING_CLASS_NAME}__content`,
    children: [
      {
        tag: 'i',
        ref: 'icon',
        className: `${LOADING_CLASS_NAME}__icon`,
        children: isDefaultIcon ? [DEFAULT_ICON_SPEC] : [],
      },
      {
        tag: 'div',
        className: `${LOADING_CLASS_NAME}__text`,
        children: [
          {
            tag: 'h2',
            className: `${LOADING_CLASS_NAME}__title`,
            attrs: { id: `${id}-${PLUGIN_KEY}-title` },
            text: title,
          },
          description ? {
            tag: 'p',
            className: `${LOADING_CLASS_NAME}__description`,
            attrs: { id: `${id}-${PLUGIN_KEY}-description` },
            text: description,
          } : null,
        ],
      },
    ],
  }, rootDocument);

  if (!isDefaultIcon) {
    fastInnerHTML(refs.icon, icon, sanitizer, 'loading', warnScope);
  }

  return refs.content;
}
