/* eslint-disable max-len */
import { LOADING_CLASS_NAME, PLUGIN_KEY } from './loading';
import { escapeHtml } from '../../helpers/string';

/**
 * @description
 * The `loadingContent` function returns a HTML string with the loading content.
 *
 * @param {object} options Loading content options.
 * @param {string} options.id Loading id.
 * @param {string} options.icon Loading icon. Written as markup on purpose, so the default SVG
 *   spinner (and any replacement for it) renders. Never pass a value derived from user input here.
 * @param {string} options.title Loading title. Escaped, so it renders as the text it is: markup
 *   passed here shows up literally instead of being interpreted.
 * @param {string} options.description Loading description. Escaped, like the title.
 *
 * @returns {string} HTML string with the loading content.
 */
export function loadingContent({ id, icon, title, description }: { id: string; icon: string; title: string; description?: string }) {
  return `
    <div class="${LOADING_CLASS_NAME}__content">
      <i class="${LOADING_CLASS_NAME}__icon">${icon}</i>
      <div class="${LOADING_CLASS_NAME}__text">
        <h2 id="${id}-${PLUGIN_KEY}-title" class="${LOADING_CLASS_NAME}__title">${escapeHtml(title)}</h2>
        ${description ? `<p id="${id}-${PLUGIN_KEY}-description" class="${LOADING_CLASS_NAME}__description">${escapeHtml(description)}</p>` : ''}
      </div>
    </div>
  `;
}
