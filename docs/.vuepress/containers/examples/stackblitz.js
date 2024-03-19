const { getBody } = require('../../code-structure-builder/getBody');

const stackblitz = (id, html, js, css, docsVersion, preset) => {
  const body = getBody(id, html, js, css, docsVersion, preset, 'stackblitz');

  const projects = body?.files
    ? Object.entries(body?.files).map(([key, value]) => (
      `<textarea class="hidden" name="project[files][${key}]" readOnly v-pre>${value.content}</textarea>`
    )) : [];

  return `
  <form
    class="form-stackblitz-external" 
    action="https://stackblitz.com/run"
    method="post"
    target="_blank"
  >
    ${projects.join('\n')}
    <input type="hidden" name="project[title]" value="handsontable">
    <input type="hidden" name="project[description]" value="demo">
    <input type="hidden" name="project[template]" value="node">
    
    <div class="js-stackblitz-link">
      <button type="submit" aria-label="Edit stackblitz">
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"
        width="10.43" height="15" preserveAspectRatio="xMidYMid" viewBox="0 0 256 368" class="icon outbound">
          <path fill="currentColor" d="M109.586 217.013H0L200.34 0l-53.926 150.233H256L55.645 367.246l53.927-150.233z"/>
        </svg>
      </button>
    </div>
  </form>
  `;
};

module.exports = { stackblitz };
