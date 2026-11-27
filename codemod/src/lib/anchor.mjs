const ANCHOR_NODES = new Set(['ObjectProperty', 'ObjectMethod', 'Property', 'ClassProperty', 'ClassMethod']);

/**
 * Where a comment about a property can sit without changing the code around it: before the nearest enclosing
 * property, statement, declaration, or array element. Never before the object itself, because
 * `return // comment` followed by `{` would end the statement.
 *
 * @param {object} path NodePath to start from.
 * @returns {object} The node that takes the comment.
 */
export function enclosingAnchor(path) {
  for (let current = path; current; current = current.parent) {
    const { type } = current.node;

    if (current.parent?.node.type === 'ArrayExpression' || ANCHOR_NODES.has(type)
      || /(?:Statement|Declaration)$/.test(type)) {
      const parentType = current.parent?.node.type;

      return parentType === 'ExportNamedDeclaration' || parentType === 'ExportDefaultDeclaration'
        ? current.parent.node : current.node;
    }
  }

  return path.node;
}

/**
 * Whether a property of an object literal sits on lines of its own, so a comment before it does not land in the
 * middle of a line.
 *
 * @param {object} objectNode The `ObjectExpression` node.
 * @param {object} node The property node.
 * @returns {boolean} `true` when no other property or brace shares a line with it.
 */
export function hasOwnLines(objectNode, node) {
  const list = objectNode.properties;
  const index = list.indexOf(node);
  const before = list[index - 1]?.loc?.end.line ?? objectNode.loc?.start.line;
  const after = list[index + 1]?.loc?.start.line ?? objectNode.loc?.end.line;

  return Boolean(node.loc) && before < node.loc.start.line && after > node.loc.end.line;
}

/**
 * The node that takes a comment about a property that stays in its object: the property when it has lines of
 * its own, else the nearest enclosing property that has lines of its own, else the enclosing statement or
 * declaration. A comment never lands in the middle of a line of code.
 *
 * @param {object} propertyPath NodePath of the property.
 * @returns {object} The node that takes the comment.
 */
export function anchorForProperty(propertyPath) {
  for (let current = propertyPath; current; current = current.parent) {
    const { node, parent } = current;

    if (ANCHOR_NODES.has(node.type) && parent?.node.type === 'ObjectExpression') {
      if (hasOwnLines(parent.node, node)) {
        return node;
      }
    } else if (/(?:Statement|Declaration)$/.test(node.type)) {
      return enclosingAnchor(current);
    }
  }

  return propertyPath.node;
}
