const JSFIDDLE_ENDPOINT = 'https://jsfiddle.net/api/post/library/pure/';

const { getDependencies } = require('../../handsontable-manager');

const jsfiddle = (id, html, code, css, version, preset) => {
  const isBabelPanel = preset.includes('react') || preset.includes('vue');
  const isAngularPanel = preset.includes('angular');
  const imports = getDependencies(version, preset).reduce(
    (p, c) =>
      p +
      (c[0] ? `<script src="${c[0]}"></script>\n` : '') +
      (c[2] ? `<link type="text/css" rel="stylesheet" href="${c[2]}" /> \n` : ''),
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
      ${isBabelPanel ? '<input type="hidden" name="panel_js" value="3" readOnly>' : ''}
      ${isAngularPanel ? '<input type="hidden" name="panel_js" value="4" readOnly>' : ''}

      <div class="js-fiddle-link">
        <button type="submit">Edit 
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" 
        x="0px" y="0px" viewBox="0 0 100 100" width="15" height="15" class="icon outbound">
            <path fill="currentColor" d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,
            1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z">
            </path>
            <polygon fill="currentColor" 
            points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9">
            </polygon>
          </svg>
        </button>
      </div>
    </form>
  `;
};

module.exports = {
  jsfiddle
};
