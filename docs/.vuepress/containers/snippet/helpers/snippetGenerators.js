const { parseModule } = require('esprima');
const { renderTemplate } = require('../templates');
const { logger } = require('../../../tools/utils');

// TODO: IMPORTANT NOTE: detached comments are NOT being tranformed (in many cases there's no way of knowing where
//  to put them)

// TODO: Add comments support

// TODO: Remove the addition of the `container` variable (based on the first argument of the HOT initialization).

// TODO: Think about a global index map (for example, to check if the functions need to be put before or after the
//  var declaration).

/**
 * Parse the extracted snippet.
 *
 * @param {string} snippetContent The snippet content.
 * @param {string} filePath Path of the processed file.
 * @param {number} lineNumber Line number of the snippet.
 * @returns {object}
 */
function parseSnippet(snippetContent, filePath, lineNumber) {
  const errorMessage = `Snippet parse error in ${filePath} at ${lineNumber}`;
  let parsedSnippetContent = null;

  try {
    parsedSnippetContent = parseModule(snippetContent, {
      range: true,
      loc: true,
      comment: true
    });

  } catch (error) {
    logger.info(errorMessage);
  }

  return parsedSnippetContent || {
    error: errorMessage
  };
}

/**
 * Process the parsed snippet. The result of the operation is an object with categorized snippet information.
 *
 * @param {string} snippetContent The snippet content.
 * @param {object} parsedSnippetContent The parsed snippet object.
 * @returns {object}
 */
function readParsedData(snippetContent, parsedSnippetContent) {
  const commentsByLine = new Map();
  const getCommentForLine = function(codeLine) {
    const commentsForLine = [];
    let currentLine = codeLine - 1;
    let commentObject = null;

    while (commentsByLine.has(currentLine)) {
      commentObject = commentsByLine.get(currentLine);

      switch (commentObject.type) {
        case 'Block':
          commentsForLine.push(`/* ${commentObject.value} */`);
          break;
        case 'Line':
        default:
          commentsForLine.push(`// ${commentObject.value}`);
      }

      currentLine -= 1;
    }

    return `${commentsForLine.reverse().join('\n')}\n`;
  };
  const data = {
    handsontableConfigs: {
      '[no-var]': []
    },
    varDeclarations: [],
    callExpressions: [],
    refExpressions: {}
  };

  let refOrderId = -1;

  // Map the comments to their lines.
  parsedSnippetContent.comments.forEach((commentObject) => {
    commentsByLine.set(commentObject.loc.end.line, {
      type: commentObject.type,
      value: commentObject.value
    });
  });

  parsedSnippetContent.body.forEach((node) => {
    switch (node.type) {
      case 'ImportDeclaration':
        // TODO
        break;
      case 'FunctionDeclaration':
        // Temporarily treat the function declaration as variable declaration
        data.varDeclarations.push(
          getCommentForLine(node.loc.start.line) +
          snippetContent.slice(...node.range)
        );

        break;
      case 'VariableDeclaration':
        // Expression is a Handsontable declaration
        if (node.declarations[0].init?.callee?.name === 'Handsontable') {
          const configContents = snippetContent.slice(...node.declarations[0].init.arguments[1].range);
          const varName = node.declarations[0].id.name;

          // Add the configuration to a property based on the Handsontable instance variable name
          data.handsontableConfigs[varName] = configContents;

        } else {
          data.varDeclarations.push(
            getCommentForLine(node.loc.start.line) +
            snippetContent.slice(...node.range)
          );
        }

        break;
      case 'ExpressionStatement':

        // Expression is a Handsontable declaration
        if (node.expression?.callee?.name === 'Handsontable') {
          data.handsontableConfigs['[no-var]'].push(
            getCommentForLine(node.loc.start.line) +
            snippetContent.slice(...node.expression.arguments[1].range)
          );

        } else if (node.expression.type === 'CallExpression' || node.expression.type === 'MemberExpression') {
          const getTopmostObjectName = (parsedObject) => {
            if (!parsedObject) {
              return null;
            }

            if (parsedObject.object) {
              return getTopmostObjectName(parsedObject.object);
            }

            return parsedObject.name;
          };

          // Get the name of the first object of the expression.
          const varName = getTopmostObjectName(
            node.expression?.callee?.object || node.expression?.object?.callee?.object);

          // TODO: check if ref expressions in useEffect work for var declaration, eg
          // const a = hot.sth();

          // Check if there's a Handsontable instance stored with the same object name.
          if (Object.keys(data.handsontableConfigs).includes(varName)) {
            if (!data.refExpressions[varName]) {
              data.refExpressions[varName] = [];
            }

            refOrderId += 1;

            // Store it as an object with a `refOrderId` - it ensures the calls are being called in the same order
            // as in the original snippet.
            data.refExpressions[varName].push({
              refOrderId,
              snippet: getCommentForLine(node.loc.start.line) +
                snippetContent.slice(...node.expression.range)
            });

          } else {

            data.callExpressions.push(
              getCommentForLine(node.loc.start.line) +
              snippetContent.slice(...node.expression.range)
            );
          }
        }

        break;
      default:
    }
  });

  const iterateHotConfigs = function(callback) {
    Object.keys(this.handsontableConfigs).forEach((varName) => {
      if (varName !== '[no-var]') {
        callback(varName, this.handsontableConfigs[varName]);
      }
    });
  }.bind(data);

  return {
    ...data,
    iterateHotConfigs,
    hasHotInit: Object.keys(data.handsontableConfigs).length > 1 || data.handsontableConfigs['[no-var]'].length > 0,
    hasExternalConfigs: (() => {
      let hasExternalConfigs = false;

      iterateHotConfigs((varName, config) => {
        if (!hasExternalConfigs) {
          hasExternalConfigs = /^[a-zA-Z0-9]+$/.test(config);
        }
      });

      return hasExternalConfigs;
    })()
  };
}

/**
 * Make the final snippet based on the initial snippet content.
 *
 * @param {string} snippetContent The snippet content.
 * @param {string} framework A string representing the desired framework.
 * @param {string} filePath Path of the processed file.
 * @param {number} lineNumber Line number of the processed snippet.
 * @returns {*|string}
 */
function makeSnippet(snippetContent, framework, filePath, lineNumber) {
  if (framework === 'js') {
    return snippetContent;
  }

  const parsedSnippetContent = parseSnippet(snippetContent, filePath, lineNumber);

  if (parsedSnippetContent.error) {
    return parsedSnippetContent.error;

  } else {
    const neededData = readParsedData(snippetContent, parsedSnippetContent);

    return renderTemplate(framework, neededData) || 'No template for the framework is available.';
  }
}

module.exports = {
  makeSnippet,
};
