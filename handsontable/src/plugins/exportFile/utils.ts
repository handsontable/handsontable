import { buildTemplate, SVG_NS } from '../../helpers/dom/template';
import { LOADING_CLASS_NAME } from '../../helpers/constants';

/**
 * Builds the dialog overlay DOM fragment for the export progress indicator.
 *
 * The title text is resolved at call-time so it reflects the active locale.
 *
 * The title is rendered as text rather than trusted. Its only current caller passes a translated
 * phrase, which no end user controls, but a customer-registered language dictionary does reach it,
 * and this function is the kind that acquires callers. Writing it through `textContent` (not
 * stripping it) keeps a phrase containing `<` intact.
 *
 * @param {string} title Translated title string (e.g. "Exporting…"). Rendered as text; markup in it
 *   shows up literally.
 * @param {Document} rootDocument The document to build the nodes in.
 * @returns {DocumentFragment}
 */
export function buildExportDialogContent(title: string, rootDocument: Document): DocumentFragment {
  // Spinner SVG reused from the Loading plugin — same arc shape, same CSS class so the
  // `ht-loading__icon-svg` spin animation (defined in handsontable.css) applies automatically.
  const { fragment } = buildTemplate({
    tag: 'div',
    className: `${LOADING_CLASS_NAME}__content`,
    children: [
      {
        tag: 'i',
        className: `${LOADING_CLASS_NAME}__icon`,
        children: [{
          tag: 'svg',
          ns: SVG_NS,
          className: `${LOADING_CLASS_NAME}__icon-svg`,
          attrs: { fill: 'none', viewBox: '0 0 16 16' },
          children: [{
            tag: 'path',
            attrs: {
              stroke: 'currentColor',
              'stroke-width': '2',
              d: 'M15 8a7 7 0 1 1-3.5-6.062',
            },
          }],
        }],
      },
      {
        tag: 'div',
        className: `${LOADING_CLASS_NAME}__text`,
        children: [{ tag: 'h2', className: `${LOADING_CLASS_NAME}__title`, text: title }],
      },
    ],
  }, rootDocument);

  return fragment;
}
