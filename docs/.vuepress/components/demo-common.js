/**
 * Given a base URL, transform a URL in a DOM node's attribute from a relative to an absolute value.
 *
 * @param {Node} sourceNode The DOM node from which to get the attribute value.
 * @param {Node} targetNode The DOM node to which set the attribute value.
 * @param {string} attrName The name of the attribute that contains a URL to be transformed.
 * @param {string} baseUrl The base URL that will be the basis of the relative to absolute transformation.
 */
export function convertRelativeToAbsoluteAttributeUrl(sourceNode, targetNode, attrName, baseUrl) {
  const relUrl = sourceNode.getAttribute(attrName);
  const absUrl = new URL(relUrl, baseUrl);

  targetNode.setAttribute(attrName, absUrl);
}
