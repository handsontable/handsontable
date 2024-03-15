const { formatVersion } = require('../handsontable-manager/dependencies');
const { buildAngularBody } = require('./buildAngularBody');
const { buildJavascriptBody } = require('./buildJavaScriptBody');
const { buildReactBody } = require('./buildReactBody');
const { buildVue3Body } = require('./buildVue3Body');
const { buildVueBody } = require('./buildVueBody');

const getBody = (id, html, js, css, docsVersion, preset, sandbox) => {
  const version = formatVersion(docsVersion);

  if (/hot(-.*)?/.test(preset)) {
    return buildJavascriptBody({ id, html, js, css, version });
  } else if (/react(-.*)?/.test(preset)) {
    return buildReactBody({ js, css, version, preset, sandbox });
  } else if (/vue3(-.*)?/.test(preset)) {
    return buildVue3Body({ id, html, js, css, version, preset });
  } else if (/vue(-.*)?/.test(preset)) {
    return buildVueBody({ id, html, js, css, version, preset });
  } else if (/angular(-.*)?/.test(preset)) {
    return buildAngularBody({ html, js, version });
  }

  return undefined;
};

module.exports = { getBody };
