/**
 * Class representing a container structure for the categorized snippet data.
 */
class CategorizedData {
  constructor() {
    this.hotInstances = {
      named: new Map(),
      unnamed: []
    };
    this.initialExpressions = [
      // varDeclarations + callExpressions, with comments
    ];
    this.refExpressions = [
      // everything that references HOT and should be triggered after it's been initialized
    ];
  }

  /**
   * Static values used throughout the container.
   */
  static HOT_NAMED = 'named';
  static HOT_UNNAMED = 'unnamed';
  static EXP_INITIAL = 'initial';
  static EXP_REF = 'ref';

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

          if (!(new RegExp(pattern).test(expression))) {
            return true;

          } else {
            removedExpressions.push(expression);

            return false;
          }
        }
      );

      return removedExpressions;

    } else {
      return void 0;
    }
  }

  /**
   * Add a Handsontable instance to the container.
   *
   * @param {string} config A variable name representing a reference to a Handsontable settings object.
   * @param {string} containerVarName A variable name used in the Handsontable init.
   * @param {string} [varName] Name of the variable Handsontable was initialized in.
   * @param {boolean} hasRef Boolean holding information about any expressions referencing the Handsontable instance.
   * @returns {object} Object containing information about the added Handsontable instance.
   */
  addHotInstance(config, containerVarName, varName, hasRef = false) {
    const hasReferencedConfig = /^[a-zA-Z0-9]+$/.test(config);
    let hotInstanceInformation = null;

    if (varName) {
      hotInstanceInformation = {
        config: hasReferencedConfig ? config : `${varName}Settings`,
        hasRef,
        containerVarName
      };

      this.hotInstances.named.set(varName, hotInstanceInformation);

    } else {
      hotInstanceInformation = {
        config: hasReferencedConfig ? config : `hot${
          this.hotInstances.unnamed.length ? this.hotInstances.unnamed.length + 1 : ''
        }Settings`,
        containerVarName
      };

      this.hotInstances.unnamed.push(hotInstanceInformation);
    }

    return hotInstanceInformation;
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
    return !!this.hotInstances.named.size || !!this.hotInstances.unnamed.length;
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
}

module.exports = {
  CategorizedData
};
