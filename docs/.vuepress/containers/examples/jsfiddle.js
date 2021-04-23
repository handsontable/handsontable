const JSFIDDLE_ENDPOINT = 'https://jsfiddle.net/api/post/library/pure/';

const { getDependencies } = require('../../handsontable-manager');

const getCss = (version, preset) => {
  return getDependencies(version, preset).reduce((p, c) =>
    p +
    (c[0] ? `<script src="${c[0]}"></script>\n` : '') +
    (c[2] ? `<link type="text/css" rel="stylesheet" href="${c[2]}" /> \n` : ''),
  '</style><!-- Ugly Hack due to jsFiddle issue -->\n');
};

const jsfiddle = (id, html, code, version, preset) => {
  const isBabelPanel = preset.includes('react') || preset.includes('vue');
  const isAngularPanel = preset.includes('angular');

  return `
    <form
      id="jsfiddle-${id}"
      action=${JSFIDDLE_ENDPOINT}
      method="post"
      target="_blank"
      style="display:none;"
    >
      <input type="text" name="title" readOnly value="Handsontable example" />
      <input type="text" name="wrap" readOnly value="d" />
      <textarea name="js" readOnly v-pre>${code}</textarea>
      <textarea name="html" readOnly v-pre>${html}</textarea>
      <textarea name="css" readOnly>${getCss(version, preset)}</textarea>
      ${isBabelPanel ? '<input type="text" name="panel_js" value="3" readOnly>' : ''}
      ${isAngularPanel ? '<input type="text" name="panel_js" value="4" readOnly>' : ''}
  }
    </form>
    <div class="js-fiddle-link">
      <button type="submit" form="jsfiddle-${id}"><i class="fa fa-jsfiddle"></i>Edit</button>
    </div>
  `;
};

module.exports = {
  getCss,
  jsfiddle
};
