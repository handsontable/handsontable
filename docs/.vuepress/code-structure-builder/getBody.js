const { formatVersion } = require('../handsontable-manager/dependencies');
const { buildAngularBody } = require('./buildAngularBody');
const { buildJavascriptBody } = require('./buildJavascriptBody');
const { buildReactBody } = require('./buildReactBody');
const { buildVue3Body } = require('./buildVue3Body');
const { buildVueBody } = require('./buildVueBody');

const getBody = ({ id, html, js, css, docsVersion, preset, sandbox, lang }) => {
  const version = formatVersion(docsVersion);
  const hyperformulaVersion = '^3.0.0';
  const themeName = html.match(/class="[^"]*(ht-theme-[^"\s]*)[^"]*"/)?.[1] || '';

  if (/hot(-.*)?/.test(preset)) {
    return buildJavascriptBody({
      id,
      html,
      js,
      css,
      version,
      hyperformulaVersion,
      sandbox,
      lang: lang === 'JavaScript' ? 'js' : 'ts'
    });
  } else if (/react(-.*)?/.test(preset)) {
    return buildReactBody({
      js,
      css,
      version,
      hyperformulaVersion,
      themeName,
      preset,
      sandbox,
      lang: lang === 'JavaScript' ? 'jsx' : 'tsx'
    });
  } else if (/vue3(-.*)?/.test(preset)) {
    return buildVue3Body({ id, html, js, css, version, hyperformulaVersion, preset });
  } else if (/vue(-.*)?/.test(preset)) {
    return buildVueBody({ id, html, js, css, version, hyperformulaVersion, preset });
  } else if (/angular(-.*)?/.test(preset)) {
    return buildAngularBody({ html, js, version, hyperformulaVersion });
  }

  return undefined;
};

module.exports = { getBody };
