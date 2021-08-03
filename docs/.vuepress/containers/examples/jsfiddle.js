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
      ${isBabelPanel ? '<input type="hidden" name="panel_js" value="3" readOnly>' : ''}
      ${isAngularPanel ? '<input type="hidden" name="panel_js" value="4" readOnly>' : ''}

      <div class="js-fiddle-link">
        <button type="submit">Edit</button>
      </div>
    </form>
  `;
};

module.exports = {
  jsfiddle
};
