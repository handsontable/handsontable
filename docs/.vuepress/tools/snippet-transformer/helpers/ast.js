/**
 * TODO, before merging: docs
 * @param varName
 */
function findVarDeclarationByName(varName, astTree) {
  let foundNode = null;

  astTree.body.some((node) => {
    if (node.type === 'VariableDeclaration') {
      node.declarations.some((nodeDeclaration) => {
        if (nodeDeclaration.id.name === varName) {
          foundNode = nodeDeclaration;

          return true;
        }

        return false;
      });
    }

    if (foundNode) {
      return true;
    }

    return false;
  });

  return foundNode;
}

/**
 * TODO, before merging: docs
 * @param node
 */
function getSelectorFromVarDeclarationNode(node) {
  let selector = null;

  if (node && node?.init?.callee?.property?.name) {
    switch (node.init.callee.property.name) {
      case 'getElementById':
        selector = `#${node.init.arguments[0].value}`;
        break;
      case 'querySelector':
        selector = node.init.arguments[0].value;
        break;
      default:
    }

    return selector;
  }
}

/**
 * Extract the variable name from the very beginning of the right hand side of the expression.
 *
 * @param {object} parsedObject Object being a part of the node returned from the parser.
 * @returns {string}
 */
function extractTopmostObjectName(parsedObject) {
  return parsedObject.object ? extractTopmostObjectName(parsedObject.object) : parsedObject.name;
}

/**
 * Extract the callee variable name.
 *
 * @param {object} nodeObj Node returned from the parser.
 * @returns {string|null}
 */
const getCalleeVarName = (nodeObj) => {
  return nodeObj?.callee ? extractTopmostObjectName(nodeObj?.callee) : null;
};
/**
 * Extract the variable names being used in the expression arguments.
 *
 * @param {object} nodeObj Node returned from the parser.
 * @returns {string[]}
 */
const getCallArgumentsVarNames = (nodeObj) => {
  const result = [];

  if (nodeObj?.arguments?.length) {
    nodeObj.arguments.forEach((argObj) => {
      if (argObj.type !== 'Literal') {
        result.push(extractTopmostObjectName(
          argObj?.object?.callee ||
          argObj?.init?.callee ||
          argObj?.callee ||
          argObj
        ));
      }
    });
  }

  return result;
};

/**
 * Extract variable names being used in the provided expression node.
 * TODO, before merging: specify which var name are we extracting
 *
 * @param {object} node Node returned from the parser.
 * @returns {{varName: string, argumentVarNames: string[]}}
 */
function extractVarNames(node) {
  const argumentVarNames = [];
  let leftHandSideVarName = null;
  let rightHandSideNode = null;
  let calleeVarName = null;

  // Get the name of the first object of the expression.
  switch (node?.expression?.type || node.type) {
    case 'VariableDeclaration':
      leftHandSideVarName = node.declarations[0].id.name;
      rightHandSideNode = node.declarations[0].init;

      break;
    case 'CallExpression':
      rightHandSideNode = node?.expression;

      break;
    case 'MemberExpression':
      rightHandSideNode = node?.expression?.object;

      break;
    default:
  }

  calleeVarName = getCalleeVarName(rightHandSideNode);

  argumentVarNames.push(...getCallArgumentsVarNames(rightHandSideNode));

  return {
    varName: leftHandSideVarName,
    calleeVarName,
    argumentVarNames
  };
}

module.exports = {
  findVarDeclarationByName,
  getSelectorFromVarDeclarationNode,
  extractVarNames
};
