/* eslint max-len: 0 */
const JSFIDDLE_ENDPOINT = 'https://jsfiddle.net/api/post/library/pure/';

const { getDependencies } = require('../../handsontable-manager');

const jsfiddle = (_id, html, code, css, version, preset, lang) => {
  const isBabelPanel = preset.includes('react') || preset.includes('vue') || preset.includes('hot');
  const isAngularPanel = preset.includes('angular');

  const imports = getDependencies(version, preset).reduce(
    (p, c) =>
      p +
      (c[0] ? `<script src="${c[0]}"></script>\n` : '') +
      /* eslint-disable no-nested-ternary */
      (Array.isArray(c[2])
        ? c[2].map(href => `<link type="text/css" rel="stylesheet" href="${href}" /> \n`).join('')
        : c[2] ? `<link type="text/css" rel="stylesheet" href="${c[2]}" /> \n`
          : ''),
    '');

  return `
    <form
      class="form-jsfiddle-external"
      action=${JSFIDDLE_ENDPOINT}
      method="post"
      target="_blank"
    >
      <input type="hidden" name="title" readOnly value="Handsontable example" />
      <input type="hidden" name="wrap" readOnly value="d" />
      <textarea class="hidden" name="js" readOnly v-pre>${code}</textarea>
      <textarea class="hidden" name="html" readOnly v-pre>
${imports}
${html}
      </textarea>
      <textarea class="hidden" name="css" readOnly v-pre>${css}</textarea>
      <input type="hidden" name="panel_css" value="1" readOnly> <!-- enables SCSS panel -->
      ${isBabelPanel && lang === 'JavaScript' ? '<input type="hidden" name="panel_js" value="3" readOnly>' : ''}
      ${isAngularPanel || lang === 'TypeScript' ? '<input type="hidden" name="panel_js" value="4" readOnly>' : ''}

      <div class="js-fiddle-link">
      <button type="submit" aria-label="Edit in JSFiddle">
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" 
        width="15" height="15" viewBox="0 0 64 64" class="icon outbound">
          <path 
            fill="currentColor" 
            d="m20.04 20.76 1.42-2.33c3.307-4.71 7.818-7.473 13.536-8.177 8.378-1.032 16.455 3.59 19.773 11.275 1.11 2.572 1.634 5.26 1.475 8.065-.018.318.08.45.367.577 4.826 2.156 7.758 7.065 7.352 12.278-.42 5.378-4.438 9.963-9.762 11.128-1.147.25-2.307.383-3.485.283-.17-.014-.342-.006-.513-.006-12.335 0-24.67-.003-37.005.003-2.22.001-4.33-.44-6.308-1.463-8.718-4.51-9.283-16.584-1.015-21.884.332-.213.416-.38.314-.768-1.283-4.88 2.13-9.96 7.123-10.644 2.385-.326 4.57.163 6.543 1.553.063.044.13.08.182.11zm8.354 19.394c-.3.254-.552.484-.82.696-1.41 1.11-2.992 1.568-4.766 1.202-1.613-.333-2.845-1.687-3.012-3.252a3.742 3.742 0 0 1 2.174-3.818c1.033-.478 2.11-.508 3.197-.21 1.878.518 3.28 1.707 4.498 3.174 1.317 1.59 2.614 3.2 4 4.717 3.085 3.352 6.894 4.67 11.347 3.555 3.144-.787 5.315-2.793 5.98-6.045.675-3.31-.25-6.145-3.026-8.236-1.58-1.19-3.4-1.66-5.346-1.75-2.975-.136-5.61.667-7.794 2.758-.09.088-.24.115-.358.168l2.935 3.447c.065-.017.08-.017.09-.024l.51-.436c1.342-1.124 2.86-1.68 4.63-1.462a3.92 3.92 0 0 1 3.388 3.43c.185 1.688-.903 3.327-2.6 3.88-1.076.35-2.153.293-3.2-.092-1.765-.643-3.07-1.867-4.24-3.292-1.352-1.644-2.69-3.313-4.18-4.83-2.945-2.998-6.52-4.182-10.686-3.272-3.16.7-6.49 3.372-6.487 7.77.002 3.07 1.267 5.423 3.892 7.022 1.282.78 2.7 1.15 4.187 1.263 2.21.166 4.328-.127 6.265-1.29a11.46 11.46 0 0 0 2.262-1.765l-2.836-3.313z" />
        </svg>
      </button>
      </div>
    </form>
  `;
};

module.exports = {
  jsfiddle
};
