const { render: reactRender } = require('./react');

const TEMPLATE_RENDERERS = {
  react: reactRender
};

/**
 * Render the snippet using a template.
 *
 * @param {string} framework The desired framework name.
 * @param {object} snippetInformation The snippet content.
 * @returns {string|null}
 */
function renderTemplate(framework, snippetInformation) {
  return typeof TEMPLATE_RENDERERS[framework] === 'function' ? TEMPLATE_RENDERERS[framework](snippetInformation) : null;
}

module.exports = {
  renderTemplate
};
