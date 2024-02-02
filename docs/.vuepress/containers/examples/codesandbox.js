const addStyleImport = (code, css) => {
  if (!css) return code;

  return code.replace(
    "import 'handsontable/dist/handsontable.full.min.css';",
    (match) => `${match}\nimport './style.css'`
  );
};

const codesandbox = (html, code, css) => {
  const codeWithStyleImport = addStyleImport(code, css);

  return `
  <form class="form-codesandbox-external" @submit.prevent="$parent.$parent.submitCodesandbox">
    <textarea class="hidden" name="html" readOnly v-pre>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Handontable example</title>
  </head>
<body>
${html}
</body>
</html>
    </textarea>
    <textarea class="hidden" name="js" readOnly v-pre>${codeWithStyleImport}</textarea>
    <textarea class="hidden" name="css" readOnly v-pre>${css}</textarea>

    <div class="js-codesandbox-link">
      <button type="submit" aria-label="Edit codesandbox">
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

module.exports = {
  codesandbox,
};
