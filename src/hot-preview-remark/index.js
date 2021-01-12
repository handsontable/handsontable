const { Buffer } = require('buffer');

/**
 * Matches to:
 * * `hot-preview=<containerId>`
 * * `hot-preview=<containerId>,<instanceVariableName>`
 * Where:
 * * `containerId` (match group 1) is required and it is used to create div with indicated ID. Have to be unique on page.
 * * `instanceVariableName` (march group 3) is optional, it indicated variable which storing HOT instance for purposes of call the `.destroy()` function. Highly recommended.
 * @type {RegExp}
 */
const REGEX = /hot-preview=([a-zA-Z][a-zA-Z0-9]*)(,([a-zA-Z][a-zA-Z0-9]*))?/;
const REGEX_GROUP_CONTAINER = 1;
const REGEX_GROUP_INSTANCE = 3;

const addCodePreview = (node, id, instanceVariableName) => {
  const code = node.value;
  const encodedCode = Buffer.from(code).toString('base64');

  return [
    {
      type: 'jsx',
      value: [
        `<CodePreview hotId="${id}"`,
        instanceVariableName ? `instanceVariableName="${instanceVariableName}"` : '',
        `code="${encodedCode}"`,
        '></CodePreview>',
      ].join(' '),
    },
    {
      type: 'jsx',
      value: `<JsFiddleButton hotId="${id}" code="${encodedCode}"></JsFiddleButton>`,
    },
    node,
  ];
};

const matchNode = (node) => node.type === 'code' && node.meta?.match(REGEX);

const applyResult = (result, tree, index) => {
  if (result) {
    tree.splice(index, 1, ...result);
    return index + result.length;
  }

  return index + 1;
};

const applyImports = (tree) => {
  tree.unshift({
    type: 'import',
    value: "import {CodePreview} from '@site/src/components/code-preview';",
  });
  tree.unshift({
    type: 'import',
    value: "import {JsFiddleButton} from '@site/src/components/jsfiddle';",
  });
};

module.exports = () => {
  let codePreviewAdded = false;
  const transformer = (node) => {
    const match = matchNode(node);
    if (match) {
      codePreviewAdded = true;
      return addCodePreview(node, match[REGEX_GROUP_CONTAINER], match[REGEX_GROUP_INSTANCE]);
    }
    if (Array.isArray(node.children)) {
      let index = 0;
      while (index < node.children.length) {
        index = applyResult(transformer(node.children[index]), node.children, index);
      }
    }
    if (node.type === 'root' && codePreviewAdded) {
      applyImports(node.children);
    }
    return null;
  };
  return transformer;
};
