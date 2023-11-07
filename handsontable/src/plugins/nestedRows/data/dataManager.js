import { rangeEach } from '../../../helpers/number';
import { objectEach } from '../../../helpers/object';
import { arrayEach } from '../../../helpers/array';

/**
 * Class responsible for making data operations.
 *
 * @private
 */
class DataManager {
  /**
   * Main Handsontable instance reference.
   *
   * @type {object}
   */
  hot;
  /**
   * Reference to the source data object.
   *
   * @type {Handsontable.CellValue[][]|Handsontable.RowObject[]}
   */
  data = null;
  /**
   * Reference to the NestedRows plugin.
   *
   * @type {object}
   */
  plugin;
  /**
   * Map of row object parents.
   *
   * @type {WeakMap}
   */
  parentReference = new WeakMap();
  /**
   * Nested structure cache.
   *
   * @type {object}
   */
  cache = {
    levels: [],
    levelCount: 0,
    rows: [],
    nodeInfo: new WeakMap()
  };

  constructor(nestedRowsPlugin, hotInstance) {
    this.hot = hotInstance;
    this.plugin = nestedRowsPlugin;
  }

  /**
   * Set the data for the manager.
   *
   * @param {Handsontable.CellValue[][]|Handsontable.RowObject[]} data Data for the manager.
   */
  setData(data) {
    this.data = data;
  }

  /**
   * Get the data cached in the manager.
   *
   * @returns {Handsontable.CellValue[][]|Handsontable.RowObject[]}
   */
  getData() {
    return this.data;
  }

  /**
   * Load the "raw" source data, without NestedRows' modifications.
   *
   * @returns {Handsontable.CellValue[][]|Handsontable.RowObject[]}
   */
  getRawSourceData() {
    let rawSourceData = null;

    this.plugin.disableCoreAPIModifiers();
    rawSourceData = this.hot.getSourceData();
    this.plugin.enableCoreAPIModifiers();

    return rawSourceData;
  }

  /**
   * Update the Data Manager with new data and refresh cache.
   *
   * @param {Handsontable.CellValue[][]|Handsontable.RowObject[]} data Data for the manager.
   */
  updateWithData(data) {
    this.setData(data);
    this.rewriteCache();
  }

  /**
   * Rewrite the nested structure cache.
   *
   * @private
   */
  rewriteCache() {
    this.cache = {
      levels: [],
      levelCount: 0,
      rows: [],
      nodeInfo: new WeakMap()
    };

    rangeEach(0, this.data.length - 1, (i) => {
      this.cacheNode(this.data[i], 0, null);
    });
  }

  /**
   * Cache a data node.
   *
   * @private
   * @param {object} node Node to cache.
   * @param {number} level Level of the node.
   * @param {object} parent Parent of the node.
   */
  cacheNode(node, level, parent) {
    if (!this.cache.levels[level]) {
      this.cache.levels[level] = [];
      this.cache.levelCount += 1;
    }
    this.cache.levels[level].push(node);
    this.cache.rows.push(node);
    this.cache.nodeInfo.set(node, {
      parent,
      row: this.cache.rows.length - 1,
      level
    });

    if (this.hasChildren(node)) {
      arrayEach(node.__children, (elem) => {
        this.cacheNode(elem, level + 1, node);
      });
    }
  }

  /**
   * Get the date for the provided visual row number.
   *
   * @param {number} row Row index.
   * @returns {object}
   */
  getDataObject(row) {
    return row === null || row === undefined ? null : this.cache.rows[row];
  }

  /**
   * Read the row tree in search for a specific row index or row object.
   *
   * @private
   * @param {object} parent The initial parent object.
   * @param {number} readCount Number of read nodes.
   * @param {number} neededIndex The row index we search for.
   * @param {object} neededObject The row object we search for.
   * @returns {number|object}
   */
  readTreeNodes(parent, readCount, neededIndex, neededObject) {
    let rootLevel = false;
    let readNodesCount = readCount;

    if (isNaN(readNodesCount) && readNodesCount.end) {
      return readNodesCount;
    }

    let parentObj = parent;

    if (!parentObj) {
      parentObj = {
        __children: this.data
      };
      rootLevel = true;
      readNodesCount -= 1;
    }

    if (neededIndex !== null && neededIndex !== undefined && readNodesCount === neededIndex) {
      return { result: parentObj, end: true };
    }

    if (neededObject !== null && neededObject !== undefined && parentObj === neededObject) {
      return { result: readNodesCount, end: true };
    }

    readNodesCount += 1;

    if (parentObj.__children) {
      arrayEach(parentObj.__children, (val) => {

        this.parentReference.set(val, rootLevel ? null : parentObj);

        readNodesCount = this.readTreeNodes(val, readNodesCount, neededIndex, neededObject);

        if (isNaN(readNodesCount) && readNodesCount.end) {
          return false;
        }
      });
    }

    return readNodesCount;
  }

  /**
   * Mock a parent node.
   *
   * @private
   * @returns {*}
   */
  mockParent() {
    const fakeParent = this.mockNode();

    fakeParent.__children = this.data;

    return fakeParent;
  }

  /**
   * Mock a data node.
   *
   * @private
   * @returns {{}}
   */
  mockNode() {
    const fakeNode = {};

    objectEach(this.data[0], (val, key) => {
      fakeNode[key] = null;
    });

    return fakeNode;
  }

  /**
   * Get the row index for the provided row object.
   *
   * @param {object} rowObj The row object.
   * @returns {number} Row index.
   */
  getRowIndex(rowObj) {
    return rowObj === null || rowObj === undefined ? null : this.cache.nodeInfo.get(rowObj).row;
  }

  /**
   * Get the index of the provided row index/row object within its parent.
   *
   * @param {number|object} row Row index / row object.
   * @returns {number}
   */
  getRowIndexWithinParent(row) {
    let rowObj = null;

    if (isNaN(row)) {
      rowObj = row;
    } else {
      rowObj = this.getDataObject(row);
    }

    const parent = this.getRowParent(row);

    if (parent === null || parent === undefined) {
      return this.data.indexOf(rowObj);
    }

    return parent.__children.indexOf(rowObj);
  }

  /**
   * Count all rows (including all parents and children).
   *
   * @returns {number}
   */
  countAllRows() {
    const rootNodeMock = {
      __children: this.data
    };

    return this.countChildren(rootNodeMock);
  }

  /**
   * Count children of the provided parent.
   *
   * @param {object|number} parent Parent node.
   * @returns {number} Children count.
   */
  countChildren(parent) {
    let rowCount = 0;
    let parentNode = parent;

    if (!isNaN(parentNode)) {
      parentNode = this.getDataObject(parentNode);
    }

    if (!parentNode || !parentNode.__children) {
      return 0;
    }

    arrayEach(parentNode.__children, (elem) => {
      rowCount += 1;

      if (elem.__children) {
        rowCount += this.countChildren(elem);
      }
    });

    return rowCount;
  }

  /**
   * Get the parent of the row at the provided index.
   *
   * @param {number|object} row Physical row index.
   * @returns {object}
   */
  getRowParent(row) {
    let rowObject;

    if (isNaN(row)) {
      rowObject = row;
    } else {
      rowObject = this.getDataObject(row);
    }

    return this.getRowObjectParent(rowObject);
  }

  /**
   * Get the parent of the provided row object.
   *
   * @private
   * @param {object} rowObject The row object (tree node).
   * @returns {object|null}
   */
  getRowObjectParent(rowObject) {
    if (!rowObject || typeof rowObject !== 'object') {
      return null;
    }

    return this.cache.nodeInfo.get(rowObject).parent;
  }

  /**
   * Get the nesting level for the row with the provided row index.
   *
   * @param {number} row Row index.
   * @returns {number|null} Row level or null, when row doesn't exist.
   */
  getRowLevel(row) {
    let rowObject = null;

    if (isNaN(row)) {
      rowObject = row;
    } else {
      rowObject = this.getDataObject(row);
    }

    return rowObject ? this.getRowObjectLevel(rowObject) : null;
  }

  /**
   * Get the nesting level for the row with the provided row index.
   *
   * @private
   * @param {object} rowObject Row object.
   * @returns {number} Row level.
   */
  getRowObjectLevel(rowObject) {
    return rowObject === null || rowObject === undefined ? null : this.cache.nodeInfo.get(rowObject).level;
  }

  /**
   * Check if the provided row/row element has children.
   *
   * @param {number|object} row Row number or row element.
   * @returns {boolean}
   */
  hasChildren(row) {
    let rowObj = row;

    if (!isNaN(rowObj)) {
      rowObj = this.getDataObject(rowObj);
    }

    return !!(rowObj.__children && rowObj.__children.length);
  }

  /**
   * Returns `true` if the row at the provided index has a parent.
   *
   * @param {number} index Row index.
   * @returns {boolean} `true` if the row at the provided index has a parent, `false` otherwise.
   */
  isChild(index) {
    return this.getRowParent(index) !== null;
  }

  /**
   * Get child at a provided index from the parent element.
   *
   * @param {object} parent The parent row object.
   * @param {number} index Index of the child element to be retrieved.
   * @returns {object|null} The child element or `null` if the child doesn't exist.
   */
  getChild(parent, index) {
    return parent.__children?.[index] || null;
  }

  /**
   * Return `true` of the row at the provided index is located at the topmost level.
   *
   * @param {number} index Row index.
   * @returns {boolean} `true` of the row at the provided index is located at the topmost level, `false` otherwise.
   */
  isRowHighestLevel(index) {
    return !this.isChild(index);
  }

  /**
   * Return `true` if the provided row index / row object represents a parent in the nested structure.
   *
   * @param {number|object} row Row index / row object.
   * @returns {boolean} `true` if the row is a parent, `false` otherwise.
   */
  isParent(row) {
    let rowObj = row;

    if (!isNaN(rowObj)) {
      rowObj = this.getDataObject(rowObj);
    }

    return rowObj && (!!rowObj.__children && rowObj.__children?.length !== 0);
  }

  /**
   * Add a child to the provided parent. It's optional to add a row object as the "element".
   *
   * @param {object} parent The parent row object.
   * @param {object} [element] The element to add as a child.
   */
  addChild(parent, element) {
    let childElement = element;

    this.hot.runHooks('beforeAddChild', parent, childElement);

    let parentIndex = null;

    if (parent) {
      parentIndex = this.getRowIndex(parent);
    }

    this.hot.runHooks('beforeCreateRow', parentIndex + this.countChildren(parent) + 1, 1);
    let functionalParent = parent;

    if (!parent) {
      functionalParent = this.mockParent();
    }
    if (!functionalParent.__children) {
      functionalParent.__children = [];
    }

    if (!childElement) {
      childElement = this.mockNode();
    }

    functionalParent.__children.push(childElement);

    this.rewriteCache();

    const newRowIndex = this.getRowIndex(childElement);

    this.hot.rowIndexMapper.insertIndexes(newRowIndex, 1);

    this.hot.runHooks('afterCreateRow', newRowIndex, 1);
    this.hot.runHooks('afterAddChild', parent, childElement);
  }

  /**
   * Add a child node to the provided parent at a specified index.
   *
   * @param {object} parent Parent node.
   * @param {number} index Index to insert the child element at.
   * @param {object} [element] Element (node) to insert.
   */
  addChildAtIndex(parent, index, element) {
    let childElement = element;
    let flattenedIndex;

    if (!childElement) {
      childElement = this.mockNode();
    }

    this.hot.runHooks('beforeAddChild', parent, childElement, index);

    if (parent) {
      const parentIndex = this.getRowIndex(parent);
      const finalChildIndex = parentIndex + index + 1;

      this.hot.runHooks('beforeCreateRow', finalChildIndex, 1);

      parent.__children.splice(index, null, childElement);

      this.rewriteCache();

      this.plugin.disableCoreAPIModifiers();

      this.hot.setSourceDataAtCell(
        this.getRowIndexWithinParent(parent),
        '__children',
        parent.__children,
        'NestedRows.addChildAtIndex'
      );

      this.hot.rowIndexMapper.insertIndexes(finalChildIndex, 1);

      this.plugin.enableCoreAPIModifiers();

      this.hot.runHooks('afterCreateRow', finalChildIndex, 1);

      flattenedIndex = finalChildIndex;

    } else {
      this.plugin.disableCoreAPIModifiers();
      this.hot.alter('insert_row_above', index, 1, 'NestedRows.addChildAtIndex');
      this.plugin.enableCoreAPIModifiers();

      flattenedIndex = this.getRowIndex(this.data[index]);
    }

    // Workaround for refreshing cache losing the reference to the mocked row.
    childElement = this.getDataObject(flattenedIndex);

    this.hot.runHooks('afterAddChild', parent, childElement, index);
  }

  /**
   * Add a sibling element at the specified index.
   *
   * @param {number} index New element sibling's index.
   * @param {('above'|'below')} where Direction in which the sibling is to be created.
   */
  addSibling(index, where = 'below') {
    const translatedIndex = this.translateTrimmedRow(index);
    const parent = this.getRowParent(translatedIndex);
    const indexWithinParent = this.getRowIndexWithinParent(translatedIndex);

    switch (where) {
      case 'below':
        this.addChildAtIndex(parent, indexWithinParent + 1, null);
        break;
      case 'above':
        this.addChildAtIndex(parent, indexWithinParent, null);
        break;
      default:
        break;
    }
  }

  /**
   * Detach the provided element from its parent and add it right after it.
   *
   * @param {object|Array} elements Row object or an array of selected coordinates.
   * @param {boolean} [forceRender=true] If true (default), it triggers render after finished.
   */
  detachFromParent(elements, forceRender = true) {
    let element = null;
    const rowObjects = [];

    if (Array.isArray(elements)) {
      rangeEach(elements[0], elements[2], (i) => {
        const translatedIndex = this.translateTrimmedRow(i);

        rowObjects.push(this.getDataObject(translatedIndex));
      });

      rangeEach(0, rowObjects.length - 2, (i) => {
        this.detachFromParent(rowObjects[i], false);
      });

      element = rowObjects[rowObjects.length - 1];
    } else {
      element = elements;
    }

    const childRowIndex = this.getRowIndex(element);
    const childCount = this.countChildren(element);
    const indexWithinParent = this.getRowIndexWithinParent(element);
    const parent = this.getRowParent(element);
    const grandparent = this.getRowParent(parent);
    const grandparentRowIndex = this.getRowIndex(grandparent);
    let movedElementRowIndex = null;

    this.hot.runHooks('beforeDetachChild', parent, element);

    if (indexWithinParent !== null && indexWithinParent !== undefined) {
      const removedRowIndexes = Array.from(
        new Array(childRowIndex + childCount + 1).keys()
      ).splice(-1 * (childCount + 1));

      this.hot.runHooks(
        'beforeRemoveRow',
        childRowIndex,
        childCount + 1,
        removedRowIndexes,
        this.plugin.pluginName
      );

      parent.__children.splice(indexWithinParent, 1);

      this.rewriteCache();

      this.hot.runHooks(
        'afterRemoveRow',
        childRowIndex,
        childCount + 1,
        removedRowIndexes,
        this.plugin.pluginName
      );

      if (grandparent) {
        movedElementRowIndex = grandparentRowIndex + this.countChildren(grandparent);

        const lastGrandparentChild = this.getChild(grandparent, this.countChildren(grandparent) - 1);
        const lastGrandparentChildIndex = this.getRowIndex(lastGrandparentChild);

        this.hot.runHooks('beforeCreateRow', lastGrandparentChildIndex + 1, childCount + 1, this.plugin.pluginName);

        grandparent.__children.push(element);

      } else {
        movedElementRowIndex = this.hot.countRows() + 1;
        this.hot.runHooks('beforeCreateRow', movedElementRowIndex - 2, childCount + 1, this.plugin.pluginName);

        this.data.push(element);
      }
    }

    this.rewriteCache();

    this.hot.runHooks('afterCreateRow', movedElementRowIndex - 2, childCount + 1, this.plugin.pluginName);

    this.hot.runHooks('afterDetachChild', parent, element, this.getRowIndex(element));

    if (forceRender) {
      this.hot.render();
    }
  }

  /**
   * Filter the data by the `logicRows` array.
   *
   * @private
   * @param {number} index Index of the first row to remove.
   * @param {number} amount Number of elements to remove.
   * @param {Array} logicRows Array of indexes to remove.
   */
  filterData(index, amount, logicRows) {
    // TODO: why are the first 2 arguments not used?

    const elementsToRemove = [];

    arrayEach(logicRows, (elem) => {
      elementsToRemove.push(this.getDataObject(elem));
    });

    arrayEach(elementsToRemove, (elem) => {
      const indexWithinParent = this.getRowIndexWithinParent(elem);
      const tempParent = this.getRowParent(elem);

      if (tempParent === null) {
        this.data.splice(indexWithinParent, 1);
      } else {
        tempParent.__children.splice(indexWithinParent, 1);
      }
    });

    this.rewriteCache();
  }

  /**
   * Used to splice the source data. Needed to properly modify the nested structure, which wouldn't work with the
   * default script.
   *
   * @private
   * @param {number} index Physical index of the element at the splice beginning.
   * @param {number} amount Number of elements to be removed.
   * @param {object[]} elements Array of row objects to add.
   */
  spliceData(index, amount, elements) {
    const previousElement = this.getDataObject(index - 1);
    let newRowParent = null;
    let indexWithinParent = index;

    if (previousElement && previousElement.__children && previousElement.__children.length === 0) {
      newRowParent = previousElement;
      indexWithinParent = 0;

    } else if (index < this.countAllRows()) {
      newRowParent = this.getRowParent(index);
      indexWithinParent = this.getRowIndexWithinParent(index);
    }

    if (newRowParent) {
      if (elements) {
        newRowParent.__children.splice(indexWithinParent, amount, ...elements);

      } else {
        newRowParent.__children.splice(indexWithinParent, amount);
      }

    } else if (elements) {
      this.data.splice(indexWithinParent, amount, ...elements);

    } else {
      this.data.splice(indexWithinParent, amount);
    }

    this.rewriteCache();
  }

  /**
   * Update the `__children` key of the upmost parent of the provided row object.
   *
   * @private
   * @param {object} rowElement Row object.
   */
  syncRowWithRawSource(rowElement) {
    let upmostParent = rowElement;
    let tempParent = null;

    do {
      tempParent = this.getRowParent(tempParent);

      if (tempParent !== null) {
        upmostParent = tempParent;
      }

    } while (tempParent !== null);

    this.plugin.disableCoreAPIModifiers();
    this.hot.setSourceDataAtCell(
      this.getRowIndex(upmostParent),
      '__children',
      upmostParent.__children,
      'NestedRows.syncRowWithRawSource',
    );
    this.plugin.enableCoreAPIModifiers();
  }

  /* eslint-disable jsdoc/require-param */
  /**
   * Move a single row.
   *
   * @param {number} fromIndex Index of the row to be moved.
   * @param {number} toIndex Index of the destination.
   * @param {boolean} moveToCollapsed `true` if moving a row to a collapsed parent.
   * @param {boolean} moveToLastChild `true` if moving a row to be a last child of the new parent.
   */

  /* eslint-enable jsdoc/require-param */
  moveRow(fromIndex, toIndex, moveToCollapsed, moveToLastChild) {
    const moveToLastRow = toIndex === this.hot.countRows();
    const fromParent = this.getRowParent(fromIndex);
    const indexInFromParent = this.getRowIndexWithinParent(fromIndex);
    const elemToMove = fromParent.__children.slice(indexInFromParent, indexInFromParent + 1);
    const movingUp = fromIndex > toIndex;
    let toParent = moveToLastRow ? this.getRowParent(toIndex - 1) : this.getRowParent(toIndex);

    if (toParent === null || toParent === undefined) {
      toParent = this.getRowParent(toIndex - 1);
    }

    if (toParent === null || toParent === undefined) {
      toParent = this.getDataObject(toIndex - 1);
    }

    if (!toParent) {
      toParent = this.getDataObject(toIndex);
      toParent.__children = [];

    } else if (!toParent.__children) {
      toParent.__children = [];
    }

    const indexInTargetParent = moveToLastRow || moveToCollapsed || moveToLastChild ?
      toParent.__children.length : this.getRowIndexWithinParent(toIndex);
    const sameParent = fromParent === toParent;

    toParent.__children.splice(indexInTargetParent, 0, elemToMove[0]);
    fromParent.__children.splice(indexInFromParent + (movingUp && sameParent ? 1 : 0), 1);

    // Sync the changes in the cached data with the actual data stored in HOT.
    this.syncRowWithRawSource(fromParent);

    if (!sameParent) {
      this.syncRowWithRawSource(toParent);
    }
  }

  /**
   * Translate the visual row index to the physical index, taking into consideration the state of collapsed rows.
   *
   * @private
   * @param {number} row Row index.
   * @returns {number}
   */
  translateTrimmedRow(row) {
    if (this.plugin.collapsingUI) {
      return this.plugin.collapsingUI.translateTrimmedRow(row);
    }

    return row;
  }

  /**
   * Translate the physical row index to the visual index, taking into consideration the state of collapsed rows.
   *
   * @private
   * @param {number} row Row index.
   * @returns {number}
   */
  untranslateTrimmedRow(row) {
    if (this.plugin.collapsingUI) {
      return this.plugin.collapsingUI.untranslateTrimmedRow(row);
    }

    return row;
  }
}

export default DataManager;
