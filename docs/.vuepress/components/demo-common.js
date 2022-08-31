export function convertRelativeToAbsoluteAttributeUrl(sourceNode, targetNode, attrName, baseUrl) {
  const relUrl = sourceNode.getAttribute(attrName);
  const absUrl = new URL(relUrl, baseUrl);
  targetNode.setAttribute(attrName, absUrl);
}
