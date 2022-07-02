const { parse } = require('espree');
const { parse: htmlParse } = require('node-html-parser');
const { renderTemplate } = require('./templates');
const { logChange } = require('./helpers/previewLogger');
const { logger } = require('../utils');
const { getDefaultFramework } = require('../../helpers');
const { CategorizedData } = require('./helpers/categorizedData');
const { Comments } = require('./helpers/comments');
const {
  findVarDeclarationByName,
  getSelectorFromVarDeclarationNode,
  extractVarNames
} = require('./helpers/ast');
const { includeSelfClosingTags } = require('./helpers/htmlParser');

// TODO, address before merging: IMPORTANT NOTE: detached comments are NOT being transformed (in many cases there's no
//  way of knowing where to put them in the transformed code)

// TODO: check before merging, problem with "deeply" ref'd expressions:
/*
  contextMenuPlugin.disablePlugin();


    useEffect(() => {
    const contextMenuPlugin = hot1.getPlugin('contextMenu');
  });

 */


/**
 * Variable names for which the expressions that are based on them are automatically moved to the `refExpressions`
 * section (expressions which are executed after the Handsontable initialization).
 *
 * @type {string[]}
 */
const REF_VAR_NAMES = [
  'hot',
  'hotInstance',
  'instance',
  'plugin'
];

/**
 * Framework constants.
 *
 * @type {{js: string, react: string}}
 */
const FRAMEWORKS = {
  js: 'javascript',
  react: 'react'
};

/**
 * List of frameworks currently supported by the transformer.
 *
 * @type {string[]}
 */
const SUPPORTED_FRAMEWORKS = [
  FRAMEWORKS.js,
  FRAMEWORKS.react
];

class SnippetTransformer {
  /**
   * Snippet Transformer constructor.
   *
   * @param {string} [framework=javascript] The desired framework name.
   * @param {string} content JS content of the snippet.
   * @param {string} htmlContent HTML content of the snippet.
   * @param {string} baseFilePath Path of the file containing the transformed snippet.
   * @param {number} baseFileLine Index of the line that the snippet lies in in the file.
   */
  constructor(framework = getDefaultFramework(), content, htmlContent, baseFilePath, baseFileLine) {
    /**
     * Snippet information object.
     *
     * @type {{framework: string, parsedContent: object, baseFilePath: string, baseFileLine: number, content: string}}
     */
    this.snippet = {
      framework,
      content,
      htmlContent,
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
   * @param {boolean} [includeComponentWrapper=false] `true` if the template should include the component-wrapping
   * function.
   * @param {string} [appContainerId] The id of a container to mount Handsontable in. Defaults to `example`.
   * @returns {string}
   */
  makeSnippet(includeImports = false, includeComponentWrapper = false, appContainerId) {
    const {
      content,
      framework
    } = this.snippet;

    // If the framework is set as `javascript`, skip the transformation.
    if (framework === FRAMEWORKS.js) {
      return content;
    }

    this.snippet.parsedContent = this.parseJsSnippet();

    this.snippet.parsedHtmlContent = this.parseHtmlSnippet();

    this.comments = new Comments(this.snippet.parsedContent);

    if (this.snippet.parsedContent.error) {
      return this.snippet.parsedContent.error;

    } else if (this.snippet.parsedHtmlContent.error) {
      return this.snippet.parsedHtmlContent.error;

    } else {
      const expectedData = this.readParsedData();

      return renderTemplate(
        framework,
        expectedData,
        includeImports,
        includeComponentWrapper,
        appContainerId
      ) || `No template for a "${framework}" framework is available.`;
    }
  }

  /**
   * Parse the extracted snippet.
   * TODO, before merging: docs
   *
   * @returns {object}
   */
  parseSnippet(content, parseFn, options) {
    const {
      baseFilePath,
      baseFileLine
    } = this.snippet;

    const errorMessage = `Snippet parse error at ${baseFilePath}:${baseFileLine}.`;
    let parsedSnippetContent = null;

    try {
      parsedSnippetContent = parseFn(content, options);

    } catch (error) {
      logger.info(errorMessage);
    }

    return parsedSnippetContent || {
      error: errorMessage
    };
  }

  /**
   * TODO, before merging: docs
   */
  parseJsSnippet() {
    return this.parseSnippet(this.snippet.content, parse, {
      range: true,
      loc: true,
      ecmaVersion: 6,
      comment: true,
    });
  }

  /**
   * Parse the extracted snippet.
   * TODO, before merging: docs
   *
   * @returns {object}
   */
  parseHtmlSnippet() {
    if (this.snippet.htmlContent === '<!-- snippet -->') {
      return {
        // TODO, before merging: document this
        snippet: true
      }
    }

    // Workaround for an issue with `node-html-parser`
    // https://github.com/taoqf/node-html-parser/issues/178
    return includeSelfClosingTags(
      this.parseSnippet(this.snippet.htmlContent, htmlParse),
      this.snippet.htmlContent
    );
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
${commentForLine.length ? `${commentForLine}\n` : ''}\
${node.mock ? node.content : content.slice(...node.range)}\
`;
    let varName = null;
    let calleeVarName = null;
    let argumentVarNames = null;
    let refArgumentVarNames = null;
    let hasRefVarNames = null;
    let hasRefsInCallback = false;

    switch (type) {
      case CategorizedData.EXP_INITIAL:
        this.categorizedData.addInitialExpression(expressionContent);

        break;
      case CategorizedData.EXP_REF:
        // TODO, before merging: move to a better place
        if (['VariableDeclaration', 'FunctionDeclaration'].includes(node.type)) {
          ({
            varName,
            calleeVarName,
          } = extractVarNames(node));

          this.categorizedData.addRefDeclaredVarName(varName);
        }

        this.categorizedData.addRefExpression(expressionContent);

        break;
      case CategorizedData.EXP_EVENTS:
        this.categorizedData.addEventExpression(expressionContent);

        break;
      case 'auto':
      default:
        ({
          varName,
          calleeVarName,
          argumentVarNames
        } = extractVarNames(node));
        // eslint-disable-next-line no-case-declarations
        const definitionSelector = getSelectorFromVarDeclarationNode(node?.declarations?.[0]);

        // If defining the output reference, save the variable name to categorized data.
        // TODO, before merging: move to outside function
        if (
          definitionSelector === '#output' || // TODO, before merging: magic strings, need to be moved elsewhere
          definitionSelector === 'output'
        ) {
          this.categorizedData.setOutputVarName(node?.declarations[0].id.name);
        }

        // if (definitionSelector) {
        //   debugger;
        //   // Remove the DOM elements definition expressions.
        //   this.categorizedData.removeExpression(CategorizedData.EXP_INITIAL, `${varName} =`);
        // }
        // TODO, before merging: check if works correctly
        if (definitionSelector) {
          return;
        }

        // Check if there's a Handsontable instance stored with the same object name or if the variable name fits
        // the ones listed in the REF_VAR_NAMES constant.
        // TODO, before merging: move to outside function
        refArgumentVarNames =
          argumentVarNames.filter(argVarName => this.categorizedData.isHotVarNameUsed(argVarName));
        hasRefVarNames =
          this.categorizedData.isHotVarNameUsed(calleeVarName) || REF_VAR_NAMES.includes(calleeVarName);

        // TODO, before merging: move to a helper function (IMPORTANT)
        for (const [hotVarName] of this.categorizedData.getNamedHotInstances()) {
          if (
            // TODO, before merging: redundant code (IMPORTANT)
            this.snippet.content.slice(...node.range).includes(`${hotVarName}.`) ||
            this.snippet.content.slice(...node.range).includes(`, ${hotVarName}`) ||
            this.snippet.content.slice(...node.range).includes(`{${hotVarName}`)
          ) {
            hasRefsInCallback = true;

            this.categorizedData.markHotInstanceAsRef(hotVarName);
          }

          if (!hasRefsInCallback) {
            this.categorizedData.getRefDeclaredVarNames().some((refVarName) => {
              if (
                // TODO, before merging: redundant code (IMPORTANT)
                this.snippet.content.slice(...node.range).includes(`${refVarName}.`) ||
                this.snippet.content.slice(...node.range).includes(`, ${refVarName}`) ||
                this.snippet.content.slice(...node.range).includes(`{${refVarName}`)
              ) {
                hasRefsInCallback = true;

                return true;
              }
            });
          }


          // TODO, before merging: IMPORTANT, when the callbacks are moved to useEffect, they stop being available in the global
          //  scope - we need to leave them as let and then move them without const to useEffect


        }

        if (
          hasRefsInCallback ||
          refArgumentVarNames.length ||
          hasRefVarNames
        ) {
          this.addExpression(CategorizedData.EXP_REF, node);

          // TODO, before merging: duplicated code
          this.categorizedData.addRefDeclaredVarName(varName);

          if (hasRefVarNames) {
            this.categorizedData.markHotInstanceAsRef(calleeVarName);
          }

          if (refArgumentVarNames.length) {
            refArgumentVarNames.forEach((refVarName) => {
              this.categorizedData.markHotInstanceAsRef(refVarName);
            });
          }

        } else if (this.categorizedData.getRefDeclaredVarNames().includes(calleeVarName)) {

          this.addExpression(CategorizedData.EXP_REF, node);

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
      content,
      parsedContent
    } = this.snippet;

    const varName = node?.declarations?.[0]?.id?.name;
    const argumentNodeList = varName ? node.declarations[0].init.arguments : node.expression.arguments;
    const hotContainerNode = argumentNodeList[0];
    const hotConfigNode = argumentNodeList[1];
    const config = content.slice(...hotConfigNode.range);
    const containerVarName = hotContainerNode.name;
    const hasReferencedConfig = /^[a-zA-Z0-9]+$/.test(config);
    const containerSelector = getSelectorFromVarDeclarationNode(
      findVarDeclarationByName(containerVarName, parsedContent)
    );

    if (varName) {
      this.categorizedData.addHotInstance(config, containerVarName, containerSelector, varName);

      // If the HOT initialization contains a literal object as a config, define it as a variable.
      if (!hasReferencedConfig) {
        this.addExpression(CategorizedData.EXP_INITIAL, {
          mock: true,
          line: node.loc.start.line,
          content: `const ${varName}Settings = ${config};`
        });
      }

    } else {
      this.categorizedData.addHotInstance(config, containerVarName, containerSelector);

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




  // TODO, before merging: check if the callbacks moved to `useEffect` work fine.



  /**
   * TODO, before merging: docs
   * @param node
   */
  addEventListener(node) {
    const { parsedContent } = this.snippet;
    const elementVarName = node.expression.callee.object.name;
    const type = node.expression.arguments[0].value;
    const callback = this.snippet.content.slice(
      node.expression.arguments[1].range[0],
      node.expression.arguments[1].range[1]
    );
    const callbackType = node.expression.arguments[1].type;
    // TODO, before merging: duplicated code
    const elementSelector = getSelectorFromVarDeclarationNode(
      findVarDeclarationByName(elementVarName, parsedContent)
    );

    let callbackVarName = callback;

    // If callback type is a function, create a variable to store the logic in.
    if (callbackType.includes('Function')) {
      callbackVarName = `${elementVarName}${type[0].toUpperCase() + type.substring(1)}Callback`;

      this.addExpression(CategorizedData.EXP_INITIAL, {
        mock: true,
        line: node.loc.start.line,
        content: `const ${callbackVarName} = ${callback};`
      });
    }

    this.addExpression(CategorizedData.EXP_EVENTS, node);

    this.categorizedData.addEventListener(elementSelector, type, callbackVarName);
  }

  /**
   * TODO, before merging: docs
   */
  addRequiredImports() {
    const { content } = this.snippet;
    const possibleImports = {
      HyperFormula: {
        triggers: ['HyperFormula.', ': HyperFormula'],
        snippet: 'import { HyperFormula } from \'hyperformula\';'
      },
      Handsontable: {
        triggers: ['Handsontable.helper'],
        snippet: 'import Handsontable from \'handsontable\';'
      }
    };

    Object.keys(possibleImports).forEach((libName) => {
      const libObj = possibleImports[libName];

      libObj.triggers.forEach((trigger) => {
        if (content.includes(trigger)) {
          this.categorizedData.addAdditionalImport(libObj.snippet);
        }
      });
    });
  }

  /**
   * TODO, before merging: docs
   * @param htmlTree
   */
  addHtmlTree(htmlTree) {
    this.categorizedData.addHtmlTree(htmlTree);
  }

  // TODO, before merging: probably can be removed
  // /**
  //  * TODO, before merging: docs
  //  * @param node
  //  */
  // addOutputLog(node) {
  //   const {
  //     content,
  //     parsedContent
  //   } = this.snippet;
  //   const htmlTree = this.categorizedData.getHtmlTree();
  //   const expression = node.expression;
  //   const outputElementVarName = expression.left.object.name;
  //
  //   // Make sure if the var name corresponds to the output element.
  //   if (
  //     htmlTree.querySelector(
  //       getSelectorFromVarDeclarationNode(
  //         findVarDeclarationByName(outputElementVarName, parsedContent)
  //       )
  //     ) === htmlTree.querySelector('#output')
  //   ) {
  //     const expressionContent = content.slice(...node.range);
  //     const message = content.slice(...node.expression.right.range);
  //
  //     // TODO, before merging: create a global replacement function and replace innerText with whatever comes as an argument.
  //
  //     this.categorizedData.addOutputLog(expressionContent, message);
  //   }
  // }

  /**
   * Process the parsed snippet. The result of the operation is an object with categorized snippet information.
   *
   * @returns {object}
   */
  readParsedData() {
    const {
      parsedContent,
      parsedHtmlContent
    } = this.snippet;

    this.addHtmlTree(parsedHtmlContent);

    this.addRequiredImports();

    parsedContent.body.forEach((node) => {
      switch (node.type) {
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
          const callee = node.expression?.callee;

          if (callee) {
            // Expression is a Handsontable declaration
            if (callee.name === 'Handsontable') {
              this.addHotInstance(node);

              // Event listener declaration
            } else if (callee.property?.name === 'addEventListener') {
              this.addEventListener(node);

            } else {
              this.addExpression('auto', node);
            }

            // TODO, before merging: probably can be removed
          //   // Setting a message for the output. TODO, before merging: move it to a function
          // } else if (
          //   node?.expression.type === 'AssignmentExpression' &&
          //   node?.expression?.left?.property.name === 'innerText'
          // ) {
          //   this.addOutputLog(node);
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
  logChange,
  SUPPORTED_FRAMEWORKS
};
