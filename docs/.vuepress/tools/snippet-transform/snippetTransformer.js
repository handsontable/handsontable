const { parse } = require('espree');
const { renderTemplate } = require('./templates');
const { logChange } = require('./helpers/previewLogger');
const { logger } = require('../utils');
const { CategorizedData } = require('./helpers/categorizedData');
const { Comments } = require('./helpers/comments');

// TODO: IMPORTANT NOTE: detached comments are NOT being transformed (in many cases there's no way of knowing where
//  to put them in the transformed code)

const REF_VAR_NAMES = [
  'hot',
  'hotInstance',
  'instance',
  'plugin'
];

class SnippetTransformer {
  /**
   * Snippet Transformer constructor.
   *
   * @param {string} [framework='js'] The desired framework name.
   * @param {string} content Snippet content.
   * @param {string} baseFilePath Path of the file containing the transformed snippet.
   * @param {number} baseFileLine Index of the line that the snippet lies in in the file.
   */
  constructor(framework = 'js', content, baseFilePath, baseFileLine) {
    /**
     * Snippet information object.
     *
     * @type {{framework: string, parsedContent: object, baseFilePath: string, baseFileLine: number, content: string}}
     */
    this.snippet = {
      framework,
      content,
      parsedContent: null,
      baseFilePath,
      baseFileLine,
    };
    /**
     * Comment container.
     *
     * @type {Comments}
     */
    this.comments = null;
    /**
     * Categorized data container. Contains its own API for retrieving categorized data information.
     *
     * @type {CategorizedData}
     */
    this.categorizedData = new CategorizedData();
  }

  /**
   * Make the final snippet based on the initial snippet content.
   *
   * @param {boolean} [includeImports=false] `true` if the template should include the imports section.
   * @param {boolean} [includeApp=false] `true` if the template should include the app-wrapping function.
   * @param {string} [appContainerId] The id of a container to mount Handsontable in. Defaults to `example`.
   * @returns {string|string|*}
   */
  makeSnippet(includeImports = false, includeApp = false, appContainerId) {
    const {
      content,
      framework,
      baseFilePath,
      baseFileLine,
    } = this.snippet;

    if (framework === 'js') {
      return content;
    }

    this.snippet.parsedContent = this.parseSnippet(content, baseFilePath, baseFileLine);

    this.comments = new Comments(this.snippet.parsedContent);

    if (this.snippet.parsedContent.error) {
      return this.snippet.parsedContent.error;

    } else {
      const neededData = this.readParsedData(content);

      return renderTemplate(
        framework,
        neededData,
        includeImports,
        includeApp,
        appContainerId
      ) || 'No template for the framework is available.';
    }
  }

  /**
   * Parse the extracted snippet.
   *
   * @returns {object}
   */
  parseSnippet() {
    const {
      content,
      baseFilePath,
      baseFileLine
    } = this.snippet;

    const errorMessage = `Snippet parse error in ${baseFilePath} at ${baseFileLine}`;
    let parsedSnippetContent = null;

    try {
      parsedSnippetContent = parse(content, {
        range: true,
        loc: true,
        ecmaVersion: 6,
        comment: true,
      });

    } catch (error) {
      logger.info(errorMessage);
    }

    return parsedSnippetContent || {
      error: errorMessage
    };
  }

  /**
   * Add an expression to the categorized data.
   *
   * @param {string} type Type of the expression.
   * @param {object} node Node returned from the parser.
   */
  addExpression(type, node) {
    const {
      content
    } = this.snippet;
    const commentForLine = this.comments.getCommentForLine(node.mock ? node.line : node.loc.start.line);
    const expressionContent = `\
${commentForLine.length ? `${commentForLine}\n` : ''}${node.mock ? node.content : content.slice(...node.range)}\
`;
    let varName = null;
    let argumentVarNames = null;
    let refArgumentVarNames = null;
    let hasRefVarNames = null;

    switch (type) {
      case CategorizedData.EXP_INITIAL:
        this.categorizedData.addInitialExpression(expressionContent);

        break;
      case CategorizedData.EXP_REF:
        this.categorizedData.addRefExpression(expressionContent);

        break;
      case 'auto':
      default:
        ({
          varName,
          argumentVarNames
        } = this.extractVarNames(node));

        // Check if there's a Handsontable instance stored with the same object name or if the variable name fits
        // the ones listed in the REF_VAR_NAMES constant.
        refArgumentVarNames =
          argumentVarNames.filter(argVarName => this.categorizedData.isHotVarNameUsed(argVarName));
        hasRefVarNames =
          this.categorizedData.isHotVarNameUsed(varName) || REF_VAR_NAMES.includes(varName);

        if (
          refArgumentVarNames.length ||
          hasRefVarNames
        ) {
          this.addExpression(CategorizedData.EXP_REF, node);

          if (hasRefVarNames) {
            this.categorizedData.markHotInstanceAsRef(varName);
          }

          if (refArgumentVarNames.length) {
            refArgumentVarNames.forEach((refVarName) => {
              this.categorizedData.markHotInstanceAsRef(refVarName);
            });
          }

        } else {
          this.addExpression(CategorizedData.EXP_INITIAL, node);
        }
    }
  }

  /**
   * Add a Handsontable instance to the categorized data container.
   *
   * @param {object} node Node returned from the parser.
   */
  addHotInstance(node) {
    const {
      content
    } = this.snippet;

    const varName = node?.declarations?.[0]?.id?.name;
    const argumentNodeList = varName ? node.declarations[0].init.arguments : node.expression.arguments;
    const hotContainerNode = argumentNodeList[0];
    const hotConfigNode = argumentNodeList[1];
    const config = content.slice(...hotConfigNode.range);
    const containerVarName = hotContainerNode.name;
    const hasReferencedConfig = /^[a-zA-Z0-9]+$/.test(config);

    if (varName) {
      this.categorizedData.addHotInstance(config, containerVarName, varName);

      // If the HOT initialization contains a literal object as a config, define it as a variable.
      if (!hasReferencedConfig) {
        this.addExpression(CategorizedData.EXP_INITIAL, {
          mock: true,
          line: node.loc.start.line,
          content: `const ${varName}Settings = ${config};\n`
        });
      }

    } else {
      this.categorizedData.addHotInstance(config, containerVarName);

      const instanceIndex = this.categorizedData.countHotInstances(CategorizedData.HOT_UNNAMED);

      // If the HOT initialization contains a literal object as a config, define it as a variable.
      if (!hasReferencedConfig) {
        this.addExpression(CategorizedData.EXP_INITIAL,
          {
            mock: true,
            line: node.loc.start.line,
            content: `const hot${
              instanceIndex > 1 ? instanceIndex : ''
            }Settings = ${config};\n`
          });
      }
    }

    // Remove the container definition expression.
    this.categorizedData.removeExpression(CategorizedData.EXP_INITIAL, `${containerVarName} =`);
  }

  /**
   * Extract the variable name from the very beginning of the expression.
   *
   * @param {object} parsedObject Object being a part of the node returned from the parser.
   * @returns {string}
   */
  extractTopmostObjectName(parsedObject) {
    return parsedObject.object ? this.extractTopmostObjectName(parsedObject.object) : parsedObject.name;
  }

  /**
   * Extract variable names being used in the provided expression node.
   *
   * @param {object} node Node returned from the parser.
   * @returns {{varName: string, argumentVarNames: string[]}}
   */
  extractVarNames(node) {
    /**
     * Extract the callee variable name.
     *
     * @param {object} nodeObj Node returned from the parser.
     * @returns {string|null}
     */
    const getCalleeVarName = (nodeObj) => {
      return nodeObj?.callee ? this.extractTopmostObjectName(nodeObj?.callee) : null;
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
            result.push(this.extractTopmostObjectName(
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
    const argumentVarNames = [];
    let varName = null;

    // Get the name of the first object of the expression.
    switch (node?.expression?.type || node.type) {
      case 'VariableDeclaration':
        varName = getCalleeVarName(node.declarations[0].init);

        argumentVarNames.push(...getCallArgumentsVarNames(node.declarations[0].init));

        break;
      case 'CallExpression':
        varName = getCalleeVarName(node?.expression);

        argumentVarNames.push(...getCallArgumentsVarNames(node?.expression));

        break;
      case 'MemberExpression':
        varName = getCalleeVarName(node.expression?.object);

        argumentVarNames.push(...getCallArgumentsVarNames(node?.expression?.object));

        break;
      default:
    }

    return {
      varName,
      argumentVarNames
    };
  }

  /**
   * Process the parsed snippet. The result of the operation is an object with categorized snippet information.
   *
   * @returns {object}
   */
  readParsedData() {
    const {
      parsedContent
    } = this.snippet;

    parsedContent.body.forEach((node) => {
      switch (node.type) {
        case 'ImportDeclaration':
          // TODO
          break;
        case 'ClassDeclaration':
          this.addExpression(CategorizedData.EXP_INITIAL, node);

          break;
        case 'FunctionDeclaration':
          this.addExpression(CategorizedData.EXP_INITIAL, node);

          break;
        case 'VariableDeclaration':
          // Expression is a Handsontable declaration
          if (node.declarations[0].init?.callee?.name === 'Handsontable') {
            // Add the configuration to a property based on the Handsontable instance variable name
            this.addHotInstance(node);

          } else {
            this.addExpression('auto', node);
          }

          break;
        case 'ExpressionStatement':
          // Expression is a Handsontable declaration
          if (node.expression?.callee?.name === 'Handsontable') {
            this.addHotInstance(node);

          } else {
            this.addExpression('auto', node);
          }

          break;
        default:
      }
    });

    return this.categorizedData;
  }

}

module.exports = {
  SnippetTransformer,
  logChange
};
