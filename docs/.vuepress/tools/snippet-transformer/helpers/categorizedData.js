/**
 * Class representing a container structure for the categorized snippet data.
 */
class CategorizedData {
  constructor() {
    this.additionalImports = [];
    this.hotInstances = {
      // Handsontable instances initialized to a variable.
      named: new Map(),
      // Handsontable instances initialized witout a variable.
      unnamed: []
    };
    // Event listeners categorized by the element selector.
    this.eventListeners = new Map();
    this.initialExpressions = [
      // Variable declarations + call expressions, with comments.
    ];
    this.refExpressions = [
      // Everything that references HOT and should be triggered after it's been initialized.
    ];
    // Names of the variables declared in the ref section.
    this.refDeclaredVarNames = [];
    this.eventExpressions = [
      // Expressions adding event listeners.
    ];
    // Output logs categorized by the actual logging snippet (e.g. `outputElement.innerText = 'something';`).
    this.outputLogs = new Map();
    // Variable name under which the output element is referenced.
    this.outputVarName = null; // TODO: implement this
    this.htmlTree = null;
  }

  /**
   * Static values used throughout the container.
   */
  static HOT_NAMED = 'named';
  static HOT_UNNAMED = 'unnamed';
  static EXP_INITIAL = 'initial';
  static EXP_REF = 'ref';
  static EXP_EVENTS = 'events';

  /**
   * Add an expression that need to be defined BEFORE the initialization of Handsontable.
   *
   * @param {string} expressionContent The string representation of the expression.
   * @returns {string} The added expression.
   */
  addInitialExpression(expressionContent) {
    this.initialExpressions.push(expressionContent);

    return expressionContent;
  }

  /**
   * Add an expression that needs to be added AFTER the initialization of Handsontable (usually because it contains
   * operation based on the reference to the Handsontable instance).
   *
   * @param {string} expressionContent The string representation of the expression.
   * @returns {string} The added expression.
   */
  addRefExpression(expressionContent) {
    this.refExpressions.push(expressionContent);

    return expressionContent;
  }

  /**
   * TODO, before merging: docs
   * @param expressionContent
   */
  addEventExpression(expressionContent) {
    this.eventExpressions.push(expressionContent);

    return expressionContent;
  }

  /**
   * TODO, before merging: docs
   */
  addEventListener(selector, type, callbackReference) {
    const callbackInfo = {
      snippet: callbackReference,
      type
    };

    this.eventListeners.set(selector, callbackInfo);

    return {
      selector,
      callbackInfo
    };
  }

  /**
   * TODO, before merging: docs
   * @param importLine
   */
  addAdditionalImport(importLine) {
    this.additionalImports.push(importLine);

    return importLine;
  }

  /**
   * TODO, before merging: docs
   * @param snippet
   * @param message
   */
  addOutputLog(snippet, message) {
    this.outputLogs.set(snippet, message);

    return message;
  }

  /**
   * TODO, before merging: docs
   */
  addRefDeclaredVarName(varName) {
    if (varName && !this.refDeclaredVarNames.includes(varName)) {
      this.refDeclaredVarNames.push(varName);
    }
  }

  /**
   * Remove an expression from the container.
   *
   * @param {string} type Type of the expression to be removed.
   * @param {string} pattern Pattern passed to `RegExp` to recognize the desired expression.
   * @returns {string[]|undefined} Array of matched and removed expressions (or undefined if the passed `type`
   * doesn't match any expression container).
   */
  removeExpression(type, pattern) {
    const expressionContainer = this[`${type}Expressions`];
    const removedExpressions = [];

    if (expressionContainer) {
      this[`${type}Expressions`] = expressionContainer.filter(
        (expression) => {

          if (new RegExp(pattern).test(expression) === false) {
            return true;

          } else {
            removedExpressions.push(expression);

            return false;
          }
        }
      );

      return removedExpressions;
    }
  }

  /**
   * Add a Handsontable instance to the container.
   *
   * @param {string} config A variable name representing a reference to a Handsontable settings object.
   * @param {string} containerVarName A variable name used in the Handsontable init.
   * @param {string} [varName] Name of the variable Handsontable was initialized in.
   * TODO, before merging: docs
   * @param {boolean} hasRef Boolean holding information about any expressions referencing the Handsontable instance.
   * @returns {object} Object containing information about the added Handsontable instance.
   */
  addHotInstance(config, containerVarName, containerSelector, varName, hasRef = false) {
    const hasReferencedConfig = /^[a-zA-Z0-9]+$/.test(config);
    let hotInstanceInformation = null;

    if (varName) {
      hotInstanceInformation = {
        config: hasReferencedConfig ? config : `${varName}Settings`,
        hasRef,
        containerVarName,
        containerSelector
      };

      this.hotInstances.named.set(varName, hotInstanceInformation);

    } else {
      let configString;

      if (hasReferencedConfig) {
        configString = config;

      } else {
        const unnamedInstancesCount = this.hotInstances.unnamed.length;
        const hotInstanceIndex = unnamedInstancesCount ? unnamedInstancesCount + 1 : null;

        configString = `hot${hotInstanceIndex || ''}Settings`;
      }

      hotInstanceInformation = {
        config: configString,
        containerVarName,
        containerSelector
      };

      this.hotInstances.unnamed.push(hotInstanceInformation);
    }

    return hotInstanceInformation;
  }

  /**
   * TODO, before merging: docs
   */
  setOutputVarName(outputVarName) {
    this.outputVarName = outputVarName;

    return outputVarName;
  }

  /**
   * TODO, before merging: docs
   */
  getOutputVarName() {
    return this.outputVarName;
  }

  /**
   * Get the information object of the Handsontable instance stored under the provided variable name.
   *
   * @param {string} varName Variable name of a Handsontable instance.
   * @returns {object}
   */
  getNamedHotInstance(varName) {
    return this.hotInstances.named.get(varName);
  }

  /**
   * Return the named Handsontable instance container.
   *
   * @returns {Map<string, object>}
   */
  getNamedHotInstances() {
    return this.hotInstances.named;
  }

  /**
   * Return the unnamed Handsontable instance container.
   *
   * @returns {object[]}
   */
  getUnnamedHotInstances() {
    return this.hotInstances.unnamed;
  }

  /**
   * Get a unnamed Handsontable instance information object (an instance not initialized to any variable) based on the
   * provided index, representing the order of appearance.
   *
   * @param {number} index Index of the Handsontable instance being implemented in the snippet.
   * @returns {object}
   */
  getUnnamedHotInstance(index) {
    return this.hotInstances.unnamed[index];
  }

  /**
   * Get the container of the expressions that need to be defined BEFORE the initialization of Handsontable.
   *
   * @returns {string[]}
   */
  getInitialExpressions() {
    return this.initialExpressions;
  }

  /**
   * Get the container of the expressions that need to be defined AFTER the initialization of Handsontable.
   *
   * @returns {string[]}
   */
  getRefExpressions() {
    return this.refExpressions;
  }

  /**
   * TODO, before merging: docs
   */
  getAdditionalImports() {
    return [...new Set(this.additionalImports)].join('\n');
  }

  /**
   * TODO, before merging: docs
   */
  getEventListeners() {
    return this.eventListeners;
  }

  /**
   * TODO, before merging: docs
   * @returns {[]}
   */
  getEventExpressions() {
    return this.eventExpressions;
  }

  /**
   * TODO, before merging: docs
   */
  getRefDeclaredVarNames() {
    return this.refDeclaredVarNames;
  }

  /**
   * TODO, before merging: docs
   * @param htmlTree
   */
  addHtmlTree(htmlTree) {
    this.htmlTree = htmlTree;
  }

  /**
   * TODO, before merging: docs
   */
  getHtmlTree() {
    return this.htmlTree;
  }

  /**
   * TODO, before merging: docs
   * @param selectorToSnippetMap
   */
  getHtmlSnippet(selectorToSnippetMap, eventElementExtensionFn, outputElementExtensionFn) {
    if (this.htmlTree.snippet) {
      // TODO, before merging: will not work for forced-full version of the snippets (check if it's even needed)
      return '';
    }

    selectorToSnippetMap.forEach((snippet, selector) => {
      const node = this.htmlTree.querySelector(selector);

      node.replaceWith(snippet);
    });

    this.getEventListeners().forEach((listenerInfo, selector) => {
      const {
        snippet,
        type
      } = listenerInfo;
      const node = this.htmlTree.querySelector(selector);

      eventElementExtensionFn(node, type, snippet);
    });

    const outputNode = this.htmlTree.querySelector('#output');

    if (outputNode) {
      outputElementExtensionFn(outputNode, this.outputVarName);
    }

    return this.htmlTree.toString();
  }

  /**
   * TODO, before merging: docs
   */
  getOutputLogs() {
    return this.outputLogs;
  }

  /**
   * Check if the provided variable name is assigned to any Handsontable instance.
   *
   * @param {string} varName Variable name.
   * @returns {boolean}
   */
  isHotVarNameUsed(varName) {
    return this.hotInstances.named.has(varName);
  }

  /**
   * Check if the container has information about any Handsontable instances.
   *
   * @returns {boolean}
   */
  hasAnyHotInstances() {
    return this.hotInstances.named.size > 0 || this.hotInstances.unnamed.length > 0;
  }

  /**
   * Count the Handsontable instances in the container, filtered by the provided `type`.
   *
   * @param {string} [type] Type of the Handsontable instance.
   * @returns {number}
   */
  countHotInstances(type) {
    switch (type) {
      case CategorizedData.HOT_NAMED:
        return this.hotInstances.named.size;
      case CategorizedData.HOT_UNNAMED:
        return this.hotInstances.unnamed.length;
      default:
        return this.hotInstances.named.size + this.hotInstances.unnamed.length;
    }
  }

  /**
   * Count the expressions added to the container, filtered by the provided `type`.
   *
   * @param {string} [type] Type of the expressions.
   * @returns {number}
   */
  countExpressions(type) {
    switch (type) {
      case CategorizedData.EXP_INITIAL:
        return this.initialExpressions.length;
      case CategorizedData.EXP_REF:
        return this.refExpressions.length;
      default:
        return this.initialExpressions.length + this.refExpressions.length;
    }
  }

  /**
   * Mark a "named" Handsontable instance as being referenced by an expression.
   *
   * @param {string} varName Variable name of the "named" Handsontable instance.
   */
  markHotInstanceAsRef(varName) {
    if (this.isHotVarNameUsed(varName)) {
      const entry = this.getNamedHotInstance(varName);

      if (!entry.hasRef) {
        entry.hasRef = true;
      }
    }
  }



  // TODO, before merging: VERY IMPORTANT: updating the state updates the Handsontable instances.
  // TODO, before merging: possible fix: always keep the handsontable settings in the state




  /**
   * TODO, before merging: docs
   */
  globalReplaceOutputLog(substituteFn) {
    const outputVarName = this.getOutputVarName();

    // TODO, before merging: RECOGNIZE += and = (IMPORTANT)

    const queryRegex = new RegExp(`${outputVarName}\\.innerText (\\+*)= (.+);`, 'g');

    return this.globalReplaceContent(queryRegex, substituteFn);
  }

  /**
   * TODO, before merging: docs, not sure if the right place for the function (probably not)
   *
   * regex in a form of /${outputVar}\.innerText = (.*);/gm
   *
   * @param queryRegex
   * @param replaceFn
   */
  globalReplaceContent(queryRegex, substituteFn) {
    const reassignExpression = (expression, reassignFn, getFreshExpressionFn) => {
      let matchGroups;

      while (matchGroups !== null) {
        matchGroups = queryRegex.exec(expression);

        if (!matchGroups) {
          return;
        }

        const message = matchGroups[2];

        reassignFn(getFreshExpressionFn().replace(
          new RegExp(queryRegex, ''),
          substituteFn(message))
        );
      }
    };
    const getArrayReassignArgs = (expression, index, array) => [
      expression,
      (newExpression) => { array[index] = newExpression; },
      () => array[index]
    ];

    this.getInitialExpressions().forEach((expression, index, array) => {
      reassignExpression(...getArrayReassignArgs(expression, index, array));
    });

    this.getRefExpressions().forEach((expression, index, array) => {
      reassignExpression(...getArrayReassignArgs(expression, index, array));
    });

    this.getEventExpressions().forEach((expression, index, array) => {
      reassignExpression(...getArrayReassignArgs(expression, index, array));
    });

    this.getEventListeners().forEach((callbackInfo, key, map) => {
      reassignExpression(
        callbackInfo.snippet,
        (newExpression) => { map.set(key, newExpression); },
        () => map.get(key));
    });
  }
}

module.exports = {
  CategorizedData
};
