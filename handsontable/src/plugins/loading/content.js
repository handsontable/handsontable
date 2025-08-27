import { LOADING_CLASS_NAME, PLUGIN_KEY } from './loading';

/**
 * @description
 * The `loadingContent` function returns a HTML string with the loading content.
 *
 * @param {object} options Loading content options.
 * @param {string} options.id Loading id.
 * @param {string} options.icon Loading icon.
 * @param {string} options.title Loading title.
 * @param {string} options.description Loading description.
 *
 * @returns {string} HTML string with the loading content.
 */
export function loadingContent({ id, icon, title, description }) {
  const content = `
    <div class="${LOADING_CLASS_NAME}__content">
      <i class="${LOADING_CLASS_NAME}__icon">${icon}</i>
      <div class="${LOADING_CLASS_NAME}__text">
        ${title ?
    `<h2 id="${id}-${PLUGIN_KEY}-title" class="${LOADING_CLASS_NAME}__title">${title}</h2>` :
    ''}
        ${description ?
    `<p id="${id}-${PLUGIN_KEY}-description" class="${LOADING_CLASS_NAME}__description">${description}</p>` :
    ''}
      </div>
    </div>
  `;

  return content;
}
