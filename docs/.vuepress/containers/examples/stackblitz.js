const { getBody } = require('../../code-structure-builder/getBody');

const stackblitz = (id, html, js, css, docsVersion, preset, lang) => {
  const body = getBody({ id, html, js, css, docsVersion, preset, sandbox: 'stackblitz', lang });

  const projects = body?.files
    ? Object.entries(body?.files).map(([key, value]) => (
      `<textarea class="hidden" name="project[files][${key}]" readOnly v-pre>${value.content}</textarea>`
    )) : [];

  const addReactDependencies = preset.includes('react')
    // eslint-disable-next-line max-len
    ? ', "@handsontable/react-wrapper": "latest", "react": "latest", "react-dom": "latest", "redux": "latest", "react-redux": "latest", "react-colorful": "latest", "react-star-rating-component": "latest", "@types/react": "latest", "@types/react-dom": "latest"'
    : '';

  const getTemplate = () => {
    if (preset.includes('react')) {
      return 'create-react-app';
    }

    if (preset.includes('hot') && lang === 'JavaScript') {
      return 'javascript';
    }

    if (preset.includes('hot') && lang === 'TypeScript') {
      return 'typescript';
    }

    return 'node';
  };

  return `
  <form
    class="form-stackblitz-external" 
    action="https://stackblitz.com/run"
    method="post"
    target="_blank"
  >
    ${projects.join('\n')}
    <input type="hidden" name="project[title]" value="handsontable"/>
    <input type="hidden" name="project[description]" value="demo"/>
    <input type="hidden" name="project[dependencies]" 
      value='{"hyperformula":"latest", "handsontable": "latest"${addReactDependencies}}'
    />
    <input type="hidden" name="project[template]" value="${getTemplate()}"/>
    
    <div class="js-stackblitz-link">
      <button type="submit" aria-label="Edit in StackBlitz">
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
