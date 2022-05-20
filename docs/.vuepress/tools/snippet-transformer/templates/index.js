const { render: reactRender } = require('./react');

const TEMPLATE_RENDERERS = {
  react: reactRender
};

/**
 * Render the snippet using a template.
 *
 * @param {string} framework The desired framework name.
 * @param {object} snippetInformation The snippet content.
 * @param {boolean} [includeImports=false] `true` if the template should include the imports section.
 * @param {boolean} [includeApp=false] `true` if the template should include the app-wrapping function.
 * @param {string} [appContainerId] The id of a container to mount Handsontable in. Defaults to `example`.
 * @returns {string|null}
 */
function renderTemplate(framework, snippetInformation, includeImports = false, includeApp = false, appContainerId) {
  if (typeof TEMPLATE_RENDERERS[framework] === 'function') {
    return TEMPLATE_RENDERERS[framework](snippetInformation, includeImports, includeApp, appContainerId);
  }

  return null;
}

module.exports = {
  renderTemplate
};
