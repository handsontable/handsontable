import { arrayMap, arrayReduce } from '../../../helpers/array';
import SourceSettings from './sourceSettings';
import HeadersTree from './headersTree';
import NodeModifiers from './nodeModifiers';
import { HEADER_DEFAULT_SETTINGS } from './constants';
import { matrixGenerator } from './matrixGenerator';

/**
 * The column state manager is a source of truth for nested headers configuration.
 * The state generation process is divided into three stages.
 *
 *   +---------------------+  1. User-defined configuration normalization;
 *   │                     │  The source settings class normalizes and shares API for
 *   │   SourceSettings    │  raw settings passed by the developer. It is only consumed by
 *   │                     │  the header tree module.
 *   +---------------------+
 *             │
 *            \│/
 *   +---------------------+  2. Building a tree structure for validation and easier node manipulation;
 *   │                     │  The header tree generates a tree based on source settings for future
 *   │     HeadersTree     │  node manipulation (such as collapsible columns feature). While generating a tree
 *   │                     │  the source settings is checked to see if the configuration has overlapping headers.
 *   +---------------------+  If `true` the colspan matrix generation is skipped, overlapped headers are not supported.
 *             │
 *            \│/
 *   +---------------------+  3. Colspan matrix generation;
 *   │                     │  Based on built trees the colspan matrix generation is performed. That part of code
 *   │    colspan matrix   │  generates an array structure similar to normalized data from the SourceSettings
 *   │                     │  but with the difference that this structure contains column settings which changed
 *   +---------------------+  during runtime (after the tree manipulation) e.q after collapse or expand column.
 *                            That settings describes how the TH element should be modified (colspan attribute,
 *                            CSS classes) for a specific column and layer level.
 *
 * @type {StateManager}
 */
export default class StateManager {
  /**
   * The instance of the source settings class.
   *
   * @type {SourceSettings}
   */
  #sourceSettings = new SourceSettings();
  /**
   * The instance of the collapsible modifier class.
   *
   * @type {NodeModifiers}
   */
  #nodeModifiers = new NodeModifiers();
  /**
   * The instance of the headers tree. The tree is generated after setting new confuguration data.
   *
   * @type {HeadersTree|null}
   */
  #headersTree = null;
  /**
   * Cached matrix which is generated from the tree structure.
   *
   * @type {Array[]}
   */
  #stateMatrix = [];

  /**
   * Sets a new state for the nested headers plugin based on settings passed
   * directly to the plugin.
   *
   * @param {Array[]} nestedHeadersSettings The user-defined settings.
   * @returns {boolean} Returns `true` if the settings are processed correctly, `false` otherwise.
   */
  setState(nestedHeadersSettings) {
    this.#sourceSettings.setData(nestedHeadersSettings);
    this.#headersTree = new HeadersTree(this.#sourceSettings);
    let hasError = false;

    try {
      this.#headersTree.buildTree();
    } catch (ex) {
      this.#headersTree.clear();
      this.#sourceSettings.clear();
      hasError = true;
    }

    this.#stateMatrix = matrixGenerator(this.#headersTree.getRoots());

    return hasError;
  }

  /**
   * By default all known default settings (HEADER_DEFAULT_SETTINGS) and foreign keys are merged
   * with source state. But only known keys are exported to matrix.
   *
   * @param {object[]} settings An array of objects to merge with the current source settings.
   *                            It is a requirement that every object has `row` and `col` properties
   *                            which points to the specific header settings object.
   */
  mergeStateWith(settings) {
    const transformedSettings = arrayMap(settings, ({ row, ...rest }) => {
      return {
        row: row < 0 ? this.rowCoordsToLevel(row) : row,
        ...rest,
      };
    });

    this.#sourceSettings.mergeWith(transformedSettings);
    this.#headersTree.buildTree();
    this.#stateMatrix = matrixGenerator(this.#headersTree.getRoots());
  }

  /**
   * By default all known default settings (HEADER_DEFAULT_SETTINGS) and foreign keys are merged
   * with source state. But only known keys are exported to matrix.
   *
   * @param {Function} callback A function that is called for every header source settings.
   *                            Each time the callback is called, the returned value extends
   *                            header settings.
   */
  mapState(callback) {
    this.#sourceSettings.map(callback);
    this.#headersTree.buildTree();
    this.#stateMatrix = matrixGenerator(this.#headersTree.getRoots());
  }

  /**
   * @param {Function} callback A function that is called for every tree node.
   *                            Each time the callback is called, the returned value is
   *                            added to returned array.
   * @returns {Array}
   */
  mapNodes(callback) {
    return arrayReduce(this.#headersTree.getRoots(), (acc, rootNode) => {
      rootNode.walkDown((node) => {
        const result = callback(node.data);

        if (result !== void 0) {
          acc.push(result);
        }
      });

      return acc;
    }, []);
  }

  /**
   * @param {string} action An action name to trigger.
   * @param {number} headerLevel Header level index (there is support for negative and positive values).
   * @param {number} columnIndex A visual column index.
   * @returns {object|undefined}
   */
  triggerNodeModification(action, headerLevel, columnIndex) {
    if (headerLevel < 0) {
      headerLevel = this.rowCoordsToLevel(headerLevel);
    }

    const nodeToProcess = this.#headersTree.getNode(headerLevel, columnIndex);
    let actionResult;

    if (nodeToProcess) {
      actionResult = this.#nodeModifiers.triggerAction(action, nodeToProcess);

      this.#stateMatrix = matrixGenerator(this.#headersTree.getRoots());
    }

    return actionResult;
  }

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * Translates row coordinates into header level. The row coordinates counts from -1 to -N
   * and describes headers counting from most closest to most distant from the table.
   * The header levels are counted from 0 to N where 0 describes most distant header
   * from the table.
   *
   *  Row coords             Header level
   *           +--------------+
   *       -3  │ A1 │ A1      │  0
   *           +--------------+
   *       -2  │ B1 │ B2 │ B3 │  1
   *           +--------------+
   *       -1  │ C1 │ C2 │ C3 │  2
   *           +==============+
   *           │    │    │    │
   *           +--------------+
   *           │    │    │    │
   *
   * @param {number} rowIndex A visual row index.
   * @returns {number} Returns unsigned number.
   */
  /* eslint-enable jsdoc/require-description-complete-sentence */
  rowCoordsToLevel(rowIndex) {
    const layersCount = Math.max(this.getLayersCount(), 1);
    const highestPossibleLevel = layersCount - 1;
    const lowestPossibleLevel = 0;

    return Math.min(Math.max(rowIndex + layersCount, lowestPossibleLevel), highestPossibleLevel);
  }

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * Translates header level into row coordinates. The row coordinates counts from -1 to -N
   * and describes headers counting from most closest to most distant from the table.
   * The header levels are counted from 0 to N where 0 describes most distant header
   * from the table.
   *
   *  Header level            Row coords
   *           +--------------+
   *        0  │ A1 │ A1      │  -3
   *           +--------------+
   *        1  │ B1 │ B2 │ B3 │  -2
   *           +--------------+
   *        2  │ C1 │ C2 │ C3 │  -1
   *           +==============+
   *           │    │    │    │
   *           +--------------+
   *           │    │    │    │
   *
   * @param {number} headerLevel Header level index.
   * @returns {number} Returns negative number.
   */
  /* eslint-enable jsdoc/require-description-complete-sentence */
  levelToRowCoords(headerLevel) {
    const layersCount = Math.max(this.getLayersCount(), 1);
    const highestPossibleRow = -1;
    const lowestPossibleRow = -layersCount;

    return Math.min(Math.max(headerLevel - layersCount, lowestPossibleRow), highestPossibleRow);
  }

  /**
   * Gets column header settings for a specified column and header index. The returned object contains
   * all information necessary for header renderers. It contains header label, colspan length, or hidden
   * flag.
   *
   * @param {number} headerLevel Header level (there is support for negative and positive values).
   * @param {number} columnIndex A visual column index.
   * @returns {object}
   */
  getHeaderSettings(headerLevel, columnIndex) {
    if (headerLevel < 0) {
      headerLevel = this.rowCoordsToLevel(headerLevel);
    }

    if (headerLevel >= this.getLayersCount()) {
      return null;
    }

    return this.#stateMatrix[headerLevel][columnIndex] ?? { ...HEADER_DEFAULT_SETTINGS };
  }

  /**
   * The method is helpful in cases where the column index targets in-between currently
   * collapsed column. In that case, the method returns the left-most column index
   * where the nested header begins.
   *
   * @param {number} headerLevel Header level (there is support for negative and positive values).
   * @param {number} columnIndex A visual column index.
   * @returns {number}
   */
  findLeftMostColumnIndex(headerLevel, columnIndex) {
    const { hidden } = this.getHeaderSettings(headerLevel, columnIndex);

    if (hidden === false) {
      return columnIndex;
    }

    let parentCol = columnIndex - 1;

    do {
      const { hidden: isHidden } = this.getHeaderSettings(headerLevel, parentCol);

      if (isHidden === false) {
        break;
      }

      parentCol -= 1;
    } while (columnIndex >= 0);

    return parentCol;
  }

  /**
   * Gets a total number of headers levels.
   *
   * @returns {number}
   */
  getLayersCount() {
    return this.#sourceSettings.getLayersCount();
  }

  /**
   * Gets a total number of columns count.
   *
   * @returns {number}
   */
  getColumnsCount() {
    return this.#sourceSettings.getColumnsCount();
  }

  /**
   * Clears the column state manager to the initial state.
   */
  clear() {
    this.#stateMatrix = [];
    this.#sourceSettings.clear();
    this.#headersTree.clear();
  }
}
