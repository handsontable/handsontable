import { baseTemplate } from './base';
import { confirmTemplate } from './confirm';

/**
 * Returns the template factory function for the given template.
 *
 * @param {Function} template The template function.
 * @returns {function(): string} The template factory function.
 */
function templateFactory(template) {
  return (templateVars) => {
    const factory = () => template(templateVars);

    factory.TEMPLATE_NAME = template.TEMPLATE_NAME;

    return factory;
  };
}

const TEMPLATES = new Map([
  [baseTemplate.TEMPLATE_NAME, templateFactory(baseTemplate)],
  [confirmTemplate.TEMPLATE_NAME, templateFactory(confirmTemplate)],
]);

export { TEMPLATES };
