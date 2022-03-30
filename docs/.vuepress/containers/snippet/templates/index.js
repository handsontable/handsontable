const { render: reactRender } = require('./react');

const TEMPLATE_RENDERERS = {
  react: reactRender
};

/**
 * Render the snippet using a template.
 *
 * @param {string} framework The desired framework name.
 * @param {string} snippet The snippet content.
 * @returns {string|null}
 */
function renderTemplate(framework, snippet) {
  return typeof TEMPLATE_RENDERERS[framework] === 'function' ? TEMPLATE_RENDERERS[framework](snippet) : null;
}

module.exports = {
  renderTemplate
};
