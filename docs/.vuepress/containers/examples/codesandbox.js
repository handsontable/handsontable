const { getParameters } = require('codesandbox/lib/api/define');
const { getBody } = require('../../code-structure-builder/getBody');

const codesandbox = (id, html, js, css, docsVersion, preset, lang) => {
  const body = getBody({ id, html, js, css, docsVersion, preset, lang });
  const parameters = getParameters(body);

  return `
  <form 
    class="form-codesandbox-external" 
    action="https://codesandbox.io/api/v1/sandboxes/define"
    method="post"
    target="_blank"
  >
    <input type="hidden" name="parameters" value="${parameters}" />

    <div class="js-codesandbox-link">
      <button type="submit" aria-label="Edit in CodeSandbox">
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" 
        width="15" height="15" preserveAspectRatio="xMidYMid" viewBox="0 0 256 296" class="icon outbound">
          <path fill="currentColor" d="M115.498 261.088v-106.61L23.814 101.73v60.773l41.996 
          24.347v45.7l49.688 28.54Zm23.814.627 50.605-29.151V185.78l42.269-24.495v-60.011l-92.874 
          53.621v106.82Zm80.66-180.887-48.817-28.289-42.863 24.872-43.188-24.897-49.252 28.667 91.914 
          52.882 92.206-53.235ZM0 222.212V74.495L127.987 0 256 74.182v147.797l-128.016 73.744L0 222.212Z"/>
        </svg>
      </button>
    </div>
  </form>
  `;
};

module.exports = { codesandbox };
