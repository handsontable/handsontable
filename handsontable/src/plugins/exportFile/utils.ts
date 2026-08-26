import { html } from '../../helpers/templateLiteralTag';
import { LOADING_CLASS_NAME } from '../../helpers/constants';
import { escapeHtml } from '../../helpers/string';

/**
 * Builds the dialog overlay DOM fragment for the export progress indicator.
 *
 * The title text is resolved at call-time so it reflects the active locale.
 *
 * The title is escaped rather than trusted. Its only current caller passes a translated phrase,
 * which no end user controls, but a customer-registered language dictionary does reach it, and this
 * function is the kind that acquires callers. Escaping (not stripping) keeps a phrase containing
 * `<` intact.
 *
 * @param {string} title Translated title string (e.g. "Exporting…"). Rendered as text; markup in it
 *   shows up literally.
 * @returns {DocumentFragment}
 */
export function buildExportDialogContent(title: string): DocumentFragment {
  // Spinner SVG reused from the Loading plugin — same arc shape, same CSS class so the
  // `ht-loading__icon-svg` spin animation (defined in handsontable.css) applies automatically.
  const { fragment } = html`
    <div class="${LOADING_CLASS_NAME}__content">
      <i class="${LOADING_CLASS_NAME}__icon">
        <svg class="${LOADING_CLASS_NAME}__icon-svg"
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16">
          <path stroke="currentColor" stroke-width="2" d="M15 8a7 7 0 1 1-3.5-6.062"></path>
        </svg>
      </i>
      <div class="${LOADING_CLASS_NAME}__text">
        <h2 class="${LOADING_CLASS_NAME}__title">${escapeHtml(title)}</h2>
      </div>
    </div>
  `;

  return fragment;
}
