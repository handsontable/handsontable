
import * as dom from './../../dom.js';
import {registerPlugin} from './../../plugins.js';

//export {Grouping};

//registerPlugin('grouping', Grouping);

/* jshint sub:true */

/**
 * @class Grouping
 * @private
 * @plugin
 */
function Grouping(instance) {
  /**
   * array of items
   * @type {Array}
   */
  var groups = [];

  /**
   * group definition
   * @type {{id: String, level: Number, rows: Array, cols: Array, hidden: Number}}
   */
  var item = {
    id: '',
    level: 0,
    hidden: 0,
    rows: [],
    cols: []
  };

  /**
   * total rows and cols merged in groups
   * @type {{rows: number, cols: number}}
   */
  var counters = {
    rows: 0,
    cols: 0
  };

  /**
   * Number of group levels in each dimension
   * @type {{rows: number, cols: number}}
   */
  var levels = {
    rows: 0,
    cols: 0
  };

  /**
   * List of hidden rows
   * @type {Array}
   */
  var hiddenRows = [];

  /**
   * List of hidden columns
   * @type {Array}
   */
  var hiddenCols = [];

  /**
   * Classes used
   */
  var classes = {
    'groupIndicatorContainer': 'htGroupIndicatorContainer',
    'groupIndicator': function (direction) {
      return 'ht' + direction + 'Group';
    },
    'groupStart': 'htGroupStart',
    'collapseButton': 'htCollapseButton',
    'expandButton': 'htExpandButton',
    'collapseGroupId': function (id) {
      return 'htCollapse-' + id;
    },
    'collapseFromLevel': function (direction, level) {
      return 'htCollapse' + direction + 'FromLevel-' + level;
    },
    'clickable': 'clickable',
    'levelTrigger': 'htGroupLevelTrigger'
  };

  /**
   * compare object properties
   * @param {String} property
   * @param {String} orderDirection
   * @returns {Function}
   */
  var compare = function (property, orderDirection) {
    return function (item1, item2) {
      return typeof (orderDirection) === 'undefined' || orderDirection === 'asc' ? item1[property] - item2[property] : item2[property] - item1[property];
    };
  };

  /**
   * Create range array between from and to
   * @param {Number} from
   * @param {Number} to
   * @returns {Array}
   */
  var range = function (from, to) {
    var arr = [];
    while (from <= to) {
      arr.push(from++);
    }

    return arr;
  };

  /**
   * * Get groups for range
   * @param from
   * @param to
   * @returns {{total: {rows: number, cols: number}, groups: Array}}
   */
  var getRangeGroups = function (dataType, from, to) {
    var cells = [],
      cell = {
        row: null,
        col: null
      };

    if (dataType == "cols") {
      // get all rows for selected columns
      while (from <= to) {
        cell = {
          row: -1,
          col: from++
        };
        cells.push(cell);
      }

    } else {
      // get all columns for selected rows
      while (from <= to) {
        cell = {
          row: from++,
          col: -1
        };
        cells.push(cell);
      }
    }

    var cellsGroups = getCellsGroups(cells),
      totalRows = 0,
      totalCols = 0;

    // for selected cells, calculate total groups divided into rows and columns
    for (var i = 0; i < cellsGroups.length; i++) {
      totalRows += cellsGroups[i].filter(function (item) {
        return item['rows'];
      }).length;

      totalCols += cellsGroups[i].filter(function (item) {
        return item['cols'];
      }).length;
    }

    return {
      total: {
        rows: totalRows,
        cols: totalCols
      },
      groups: cellsGroups
    };
  };

  /**
   * Get all groups for cells
   * @param {Array} cells [{row:0, col:0}, {row:0, col:1}, {row:1, col:2}]
   * @returns {Array}
   */
  var getCellsGroups = function (cells) {
    var _groups = [];

    for (var i = 0; i < cells.length; i++) {
      _groups.push(getCellGroups(cells[i]));
    }

    return _groups;
  };

  /**
   * Get all groups for cell
   * @param {Object} coords {row:1, col:2}
   * @param {Number} groupLevel Optional
   * @param {String} groupType Optional
   * @returns {Array}
   */
  var getCellGroups = function (coords, groupLevel, groupType) {
    var row = coords.row,
      col = coords.col;

    // for row = -1 and col = -1, get all columns and rows
    var tmpRow = (row === -1 ? 0 : row),
      tmpCol = (col === -1 ? 0 : col);

    var _groups = [];

    for (var i = 0; i < groups.length; i++) {
      var group = groups[i],
        id = group['id'],
        level = group['level'],
        rows = group['rows'] || [],
        cols = group['cols'] || [];

      if (_groups.indexOf(id) === -1) {
        if (rows.indexOf(tmpRow) !== -1 || cols.indexOf(tmpCol) !== -1) {
          _groups.push(group);
        }
      }
    }

    // add col groups
    if (col === -1) {
      _groups = _groups.concat(getColGroups());
    } else if (row === -1) {
      // add row groups
      _groups = _groups.concat(getRowGroups());
    }

    if (groupLevel) {
      _groups = _groups.filter(function (item) {
        return item['level'] === groupLevel;
      });
    }

    if (groupType) {
      if (groupType === 'cols') {
        _groups = _groups.filter(function (item) {
          return item['cols'];
        });
      } else if (groupType === 'rows') {
        _groups = _groups.filter(function (item) {
          return item['rows'];
        });
      }
    }

    // remove duplicates
    var tmp = [];
    return _groups.filter(function (item) {
      if (tmp.indexOf(item.id) === -1) {
        tmp.push(item.id);
        return item;
      }
    });
  };

  /**
   * get group by id
   * @param id
   * @returns {Object} group
   */
  var getGroupById = function (id) {
    for (var i = 0, groupsLength = groups.length; i < groupsLength; i++) {
      if (groups[i].id == id) {
        return groups[i];
      }
    }
    return false;
  };

  /**
   * get group by row and level
   * @param row
   * @param level
   * @returns {Object} group
   */
  var getGroupByRowAndLevel = function (row, level) {
    for (var i = 0, groupsLength = groups.length; i < groupsLength; i++) {
      if (groups[i].level == level && groups[i].rows && groups[i].rows.indexOf(row) > -1) {
        return groups[i];
      }
    }
    return false;
  };

  /**
   * get group by row and level
   * @param row
   * @param level
   * @returns {Object} group
   */
  var getGroupByColAndLevel = function (col, level) {
    for (var i = 0, groupsLength = groups.length; i < groupsLength; i++) {
      if (groups[i].level == level && groups[i].cols && groups[i].cols.indexOf(col) > -1) {
        return groups[i];
      }
    }
    return false;
  };

  /**
   * get total column groups
   * @returns {*|Array}
   */
  var getColGroups = function () {
    var result = [];
    for (var i = 0, groupsLength = groups.length; i < groupsLength; i++) {
      if (Array.isArray(groups[i]['cols'])) {
        result.push(groups[i]);
      }
    }
    return result;
  };

  /**
   * get total col groups by level
   * @param {Number} level
   * @returns {*|Array}
   */
  var getColGroupsByLevel = function (level) {
    var result = [];
    for (var i = 0, groupsLength = groups.length; i < groupsLength; i++) {
      if (groups[i]['cols'] && groups[i]['level'] === level) {
        result.push(groups[i]);
      }
    }
    return result;
  };

  /**
   * get total row groups
   * @returns {*|Array}
   */
  var getRowGroups = function () {
    var result = [];
    for (var i = 0, groupsLength = groups.length; i < groupsLength; i++) {
      if (Array.isArray(groups[i]['rows'])) {
        result.push(groups[i]);
      }
    }
    return result;
  };

  /**
   * get total row groups by level
   * @param {Number} level
   * @returns {*|Array}
   */
  var getRowGroupsByLevel = function (level) {
    var result = [];
    for (var i = 0, groupsLength = groups.length; i < groupsLength; i++) {
      if (groups[i]['rows'] && groups[i]['level'] === level) {
        result.push(groups[i]);
      }
    }
    return result;
  };

  /**
   * get last inserted range level in columns
   * @param {Array} rangeGroups
   * @returns {number}
   */
  var getLastLevelColsInRange = function (rangeGroups) {
    var level = 0;

    if (rangeGroups.length) {
      rangeGroups.forEach(function (items) {
        items = items.filter(function (item) {
          return item['cols'];
        });

        if (items.length) {
          var sortedGroup = items.sort(compare('level', 'desc')),
            lastLevel = sortedGroup[0].level;

          if (level < lastLevel) {
            level = lastLevel;
          }
        }
      });
    }

    return level;
  };

  /**
   * get last inserted range level in rows
   * @param {Array} rangeGroups
   * @returns {number}
   */
  var getLastLevelRowsInRange = function (rangeGroups) {
    var level = 0;

    if (rangeGroups.length) {
      rangeGroups.forEach(function (items) {
        items = items.filter(function (item) {
          return item['rows'];
        });

        if (items.length) {
          var sortedGroup = items.sort(compare('level', 'desc')),
            lastLevel = sortedGroup[0].level;

          if (level < lastLevel) {
            level = lastLevel;
          }
        }
      });
    }

    return level;
  };

  /**
   * create group for cols
   * @param {Number} from
   * @param {Number} to
   */
  var groupCols = function (from, to) {
    var rangeGroups = getRangeGroups("cols", from, to),
      lastLevel = getLastLevelColsInRange(rangeGroups.groups);

    if (lastLevel === levels.cols) {
      levels.cols++;
    } else if (lastLevel > levels.cols) {
      levels.cols = lastLevel + 1;
    }

    if (!counters.cols) {
      counters.cols = getColGroups().length;
    }

    counters.cols++;
    groups.push({
      id: 'c' + counters.cols,
      level: lastLevel + 1,
      cols: range(from, to),
      hidden: 0
    });
  };

  /**
   * create group for rows
   * @param {Number} from
   * @param {Number} to
   */
  var groupRows = function (from, to) {
    var rangeGroups = getRangeGroups("rows", from, to),
      lastLevel = getLastLevelRowsInRange(rangeGroups.groups);

    levels.rows = Math.max(levels.rows, lastLevel + 1);


    if (!counters.rows) {
      counters.rows = getRowGroups().length;
    }

    counters.rows++;
    groups.push({
      id: 'r' + counters.rows,
      level: lastLevel + 1,
      rows: range(from, to),
      hidden: 0
    });
  };

  /**
   * show or hide groups
   * @param showHide
   * @param groups
   */
  var showHideGroups = function (hidden, groups) {
    var level;
    for (var i = 0, groupsLength = groups.length; i < groupsLength; i++) {
      groups[i].hidden = hidden;
      level = groups[i].level;

      if (!hiddenRows[level]) {
        hiddenRows[level] = [];
      }
      if (!hiddenCols[level]) {
        hiddenCols[level] = [];
      }

      if (groups[i].rows) {
        for (var j = 0, rowsLength = groups[i].rows.length; j < rowsLength; j++) {
          if (hidden > 0) {
            hiddenRows[level][groups[i].rows[j]] = true;
          } else {
            hiddenRows[level][groups[i].rows[j]] = void 0;
          }
        }
      } else if (groups[i].cols) {
        for (var j = 0, colsLength = groups[i].cols.length; j < colsLength; j++) {
          if (hidden > 0) {
            hiddenCols[level][groups[i].cols[j]] = true;
          } else {
            hiddenCols[level][groups[i].cols[j]] = void 0;
          }
        }
      }
    }
  };

  /**
   * Check if the next cell of the dimension (row / column) contains a group at the same level
   * @param dimension
   * @param currentPosition
   * @param level
   * @param currentGroupId
   * @returns {boolean}
   */
  var nextIndexSharesLevel = function (dimension, currentPosition, level, currentGroupId) {
    var nextCellGroupId
      , levelsByOrder;

    switch (dimension) {
      case 'rows':
        nextCellGroupId = getGroupByRowAndLevel(currentPosition + 1, level).id;
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByRows();
        break;
      case 'cols':
        nextCellGroupId = getGroupByColAndLevel(currentPosition + 1, level).id;
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByCols();
        break;
    }

    return !!(levelsByOrder[currentPosition + 1] && levelsByOrder[currentPosition + 1].indexOf(level) > -1 && currentGroupId == nextCellGroupId);

  };

  /**
   * Check if the previous cell of the dimension (row / column) contains a group at the same level
   * @param dimension
   * @param currentPosition
   * @param level
   * @param currentGroupId
   * @returns {boolean}
   */
  var previousIndexSharesLevel = function (dimension, currentPosition, level, currentGroupId) {
    var previousCellGroupId
      , levelsByOrder;

    switch (dimension) {
      case 'rows':
        previousCellGroupId = getGroupByRowAndLevel(currentPosition - 1, level).id;
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByRows();
        break;
      case 'cols':
        previousCellGroupId = getGroupByColAndLevel(currentPosition - 1, level).id;
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByCols();
        break;
    }

    return !!(levelsByOrder[currentPosition - 1] && levelsByOrder[currentPosition - 1].indexOf(level) > -1 && currentGroupId == previousCellGroupId);

  };

  /**
   * Check if the provided index is at the end of the group indicator line
   * @param dimension
   * @param index
   * @param level
   * @param currentGroupId
   * @returns {boolean}
   */
  var isLastIndexOfTheLine = function (dimension, index, level, currentGroupId) {
    if (index === 0) {
      return false;
    }
    var levelsByOrder
      , entriesLength
      , previousSharesLevel = previousIndexSharesLevel(dimension, index, level, currentGroupId)
      , nextSharesLevel = nextIndexSharesLevel(dimension, index, level, currentGroupId)
      , nextIsHidden = false;

    switch (dimension) {
      case 'rows':
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByRows();
        entriesLength = instance.countRows();
        for (var i = 0; i <= levels.rows; i++) {
          if (hiddenRows[i] && hiddenRows[i][index + 1]) {
            nextIsHidden = true;
            break;
          }
        }
        break;
      case 'cols':
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByCols();
        entriesLength = instance.countCols();
        for (var i = 0; i <= levels.cols; i++) {
          if (hiddenCols[i] && hiddenCols[i][index + 1]) {
            nextIsHidden = true;
            break;
          }
        }
        break;
    }

    if (previousSharesLevel) {
      if (index == entriesLength - 1) {
        return true;
      } else if (!nextSharesLevel || (nextSharesLevel && nextIsHidden)) {
        return true;
      } else if (!levelsByOrder[index + 1]) {
        return true;
      }
    }
    return false;
  };

  /**
   * Check if all rows/cols are hidden
   * @param dataType
   */
  var isLastHidden = function (dataType) {
    var levelAmount;

    switch (dataType) {
      case 'rows':
        levelAmount = levels.rows;
        for (var j = 0; j <= levelAmount; j++) {
          if (hiddenRows[j] && hiddenRows[j][instance.countRows() - 1]) {
            return true;
          }
        }

        break;
      case 'cols':
        levelAmount = levels.cols;
        for (var j = 0; j <= levelAmount; j++) {
          if (hiddenCols[j] && hiddenCols[j][instance.countCols() - 1]) {
            return true;
          }
        }
        break;
    }

    return false;
  };

  /**
   * Check if the provided index is at the beginning of the group indicator line
   * @param dimension
   * @param index
   * @param level
   * @param currentGroupId
   * @returns {boolean}
   */
  var isFirstIndexOfTheLine = function (dimension, index, level, currentGroupId) {
    var levelsByOrder
      , entriesLength
      , currentGroup = getGroupById(currentGroupId)
      , previousAreHidden = false
      , arePreviousHidden = function (dimension) {
        var hidden = false
          , hiddenArr = dimension == 'rows' ? hiddenRows : hiddenCols;
        for (var i = 0; i <= levels[dimension]; i++) {
          tempInd = index;
          while (currentGroup[dimension].indexOf(tempInd) > -1) {
            hidden = !!(hiddenArr[i] && hiddenArr[i][tempInd]);
            tempInd--;
          }
          if (hidden) {
            break;
          }
        }
        return hidden;
      }
      , previousSharesLevel = previousIndexSharesLevel(dimension, index, level, currentGroupId)
      , nextSharesLevel = nextIndexSharesLevel(dimension, index, level, currentGroupId)
      , tempInd;

    switch (dimension) {
      case 'rows':
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByRows();
        entriesLength = instance.countRows();
        previousAreHidden = arePreviousHidden(dimension);
        break;
      case 'cols':
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByCols();
        entriesLength = instance.countCols();
        previousAreHidden = arePreviousHidden(dimension);
        break;
    }

    if (index == entriesLength - 1) {
      return false;
    }
    else if (index === 0) {
      if (nextSharesLevel) {
        return true;
      }
    } else if (!previousSharesLevel || (previousSharesLevel && previousAreHidden)) {
      if (nextSharesLevel) {
        return true;
      }
    } else if (!levelsByOrder[index - 1]) {
      if (nextSharesLevel) {
        return true;
      }
    }
    return false;
  };

  /**
   * Add group expander button
   * @param dimension
   * @param index
   * @param level
   * @param id
   * @param elem
   * @returns {*}
   */
  var addGroupExpander = function (dataType, index, level, id, elem) {
    var previousIndexGroupId;

    switch (dataType) {
      case 'rows':
        previousIndexGroupId = getGroupByRowAndLevel(index - 1, level).id;
        break;
      case 'cols':
        previousIndexGroupId = getGroupByColAndLevel(index - 1, level).id;
        break;
    }

    if (!previousIndexGroupId) {
      return null;
    }

    if (index > 0) {
      if (previousIndexSharesLevel(dataType, index - 1, level, previousIndexGroupId) && previousIndexGroupId != id) {

        var expanderButton = document.createElement('DIV');
        dom.addClass(expanderButton, classes.expandButton);
        expanderButton.id = 'htExpand-' + previousIndexGroupId;
        expanderButton.appendChild(document.createTextNode('+'));
        expanderButton.setAttribute('data-level', level);
        expanderButton.setAttribute('data-type', dataType);
        expanderButton.setAttribute('data-hidden', "1");

        elem.appendChild(expanderButton);

        return expanderButton;
      }
    }
    return null;
  };

  /**
   * Check if provided cell is collapsed (either by rows or cols)
   * @param currentPosition
   * @returns {boolean}
   */
  var isCollapsed = function (currentPosition) {
    var rowGroups = getRowGroups()
      , colGroups = getColGroups();

    for (var i = 0, rowGroupsCount = rowGroups.length; i < rowGroupsCount; i++) {
      if (rowGroups[i].rows.indexOf(currentPosition.row) > -1 && rowGroups[i].hidden) {
        return true;
      }
    }

    if (currentPosition.col === null) { // if col is set to null, check only rows
      return false;
    }

    for (var i = 0, colGroupsCount = colGroups.length; i < colGroupsCount; i++) {
      if (colGroups[i].cols.indexOf(currentPosition.col) > -1 && colGroups[i].hidden) {
        return true;
      }
    }

    return false;
  };

  return {

    /**
     * all groups for ht instance
     */
    getGroups: function () {
      return groups;
    },
    /**
     * All levels for rows and cols respectively
     */
    getLevels: function () {
      return levels;
    },
    /**
     * Current instance
     */
    instance: instance,
    /**
     * Initial setting for minSpareRows
     */
    baseSpareRows: instance.getSettings().minSpareRows,
    /**
     * Initial setting for minSpareCols
     */
    baseSpareCols: instance.getSettings().minSpareCols,

    getRowGroups: getRowGroups,
    getColGroups: getColGroups,
    /**
     * init group
     * @param {Object} settings, could be an array of objects [{cols: [0,1,2]}, {cols: [3,4,5]}, {rows: [0,1]}]
     */
    init: function () {
      var groupsSetting = instance.getSettings().groups;
      if (groupsSetting) {
        if (Array.isArray(groupsSetting)) {
          Handsontable.Grouping.initGroups(groupsSetting);
        }
      }
    },

    /**
     * init groups from configuration on startup
     */
    initGroups: function (initialGroups) {
      var that = this;

      groups = [];

      initialGroups.forEach(function (item) {
        var _group = [],
          isRow = false,
          isCol = false;

        if (Array.isArray(item.rows)) {
          _group = item.rows;
          isRow = true;
        } else if (Array.isArray(item.cols)) {
          _group = item.cols;
          isCol = true;
        }

        var from = _group[0],
          to = _group[_group.length - 1];

        if (isRow) {
          groupRows(from, to);
        } else if (isCol) {
          groupCols(from, to);
        }
      });
//      this.render();
    },

    /**
     * Remove all existing groups
     */
    resetGroups: function () {
      groups = [];
      counters = {
        rows: 0,
        cols: 0
      };
      levels = {
        rows: 0,
        cols: 0
      };

      var allOccurrences;
      for (var i in classes) {
        if (typeof classes[i] != 'function') {
          allOccurrences = document.querySelectorAll('.' + classes[i]);
          for (var j = 0, occurrencesLength = allOccurrences.length; j < occurrencesLength; j++) {
            dom.removeClass(allOccurrences[j], classes[i]);
          }
        }
      }

      var otherClasses = ['htGroupColClosest', 'htGroupCol'];
      for (var i = 0, otherClassesLength = otherClasses.length; i < otherClassesLength; i++) {
        allOccurrences = document.querySelectorAll('.' + otherClasses[i]);
        for (var j = 0, occurrencesLength = allOccurrences.length; j < occurrencesLength; j++) {
          dom.removeClass(allOccurrences[j], otherClasses[i]);
        }
      }
    },
    /**
     * Update groups from the instance settings
     */
    updateGroups: function () {
      var groupSettings = this.getSettings().groups;

      Handsontable.Grouping.resetGroups();
      Handsontable.Grouping.initGroups(groupSettings);
    },
    afterGetRowHeader: function (row, TH) {
      var currentRowHidden = false;
      for (var i = 0, levels = hiddenRows.length; i < levels; i++) {
        if (hiddenRows[i] && hiddenRows[i][row] === true) {
          currentRowHidden = true;
        }
      }

      if (currentRowHidden) {
        dom.addClass(TH.parentNode, 'hidden');
      } else if (!currentRowHidden && dom.hasClass(TH.parentNode, 'hidden')) {
        dom.removeClass(TH.parentNode, 'hidden');
      }

    },
    afterGetColHeader: function (col, TH) {
      var rowHeaders = this.view.wt.wtSettings.getSetting('rowHeaders').length
        , thisColgroup = instance.rootElement.querySelectorAll('colgroup col:nth-child(' + parseInt(col + rowHeaders + 1, 10) + ')');

      if (thisColgroup.length === 0) {
        return;
      }

      var currentColHidden = false;
      for (var i = 0, levels = hiddenCols.length; i < levels; i++) {
        if (hiddenCols[i] && hiddenCols[i][col] === true) {
          currentColHidden = true;
        }
      }

      if (currentColHidden) {
        for (var i = 0, colsAmount = thisColgroup.length; i < colsAmount; i++) {
          dom.addClass(thisColgroup[i], 'hidden');
        }
      } else if (!currentColHidden && dom.hasClass(thisColgroup[0], 'hidden')) {
        for (var i = 0, colsAmount = thisColgroup.length; i < colsAmount; i++) {
          dom.removeClass(thisColgroup[i], 'hidden');
        }
      }
    },
    /**
     * Create a renderer for additional row/col headers, acting as group indicators
     * @param walkontableConfig
     * @param direction
     */
    groupIndicatorsFactory: function (renderersArr, direction) {
      var groupsLevelsList
        , getCurrentLevel
        , getCurrentGroupId
        , dataType
        , getGroupByIndexAndLevel
        , headersType
        , currentHeaderModifier
        , createLevelTriggers;

      switch (direction) {
        case 'horizontal':
          groupsLevelsList = Handsontable.Grouping.getGroupLevelsByCols();
          getCurrentLevel = function (elem) {
            return Array.prototype.indexOf.call(elem.parentNode.parentNode.childNodes, elem.parentNode) + 1;
          };
          getCurrentGroupId = function (col, level) {
            return getGroupByColAndLevel(col, level).id;
          };
          dataType = 'cols';
          getGroupByIndexAndLevel = function (col, level) {
            return getGroupByColAndLevel(col - 1, level);
          };
          headersType = "columnHeaders";
          currentHeaderModifier = function (headerRenderers) {
            if (headerRenderers.length === 1) {
              var oldFn = headerRenderers[0];

              headerRenderers[0] = function (index, elem, level) {

                if (index < -1) {
                  makeGroupIndicatorsForLevel()(index, elem, level);
                } else {
                  dom.removeClass(elem, classes.groupIndicatorContainer);
                  oldFn(index, elem, level);
                }
              };
            }
            return function () {
              return headerRenderers;
            };
          };
          createLevelTriggers = true;
          break;
        case 'vertical':
          groupsLevelsList = Handsontable.Grouping.getGroupLevelsByRows();
          getCurrentLevel = function (elem) {
            return dom.index(elem) + 1;
          };
          getCurrentGroupId = function (row, level) {
            return getGroupByRowAndLevel(row, level).id;
          };
          dataType = 'rows';
          getGroupByIndexAndLevel = function (row, level) {
            return getGroupByRowAndLevel(row - 1, level);
          };
          headersType = "rowHeaders";
          currentHeaderModifier = function (headerRenderers) {
            return headerRenderers;
          };
          break;
      }

      var createButton = function (parent) {
        var button = document.createElement('div');

        parent.appendChild(button);

        return {
          button: button,
          addClass: function (className) {
            dom.addClass(button, className);
          }
        };
      };

      var makeGroupIndicatorsForLevel = function () {
        var directionClassname = direction.charAt(0).toUpperCase() + direction.slice(1); // capitalize the first letter

        return function (index, elem, level) { // header rendering function

          level++;
          var child
            , collapseButton;

          /* jshint -W084 */
          while (child = elem.lastChild) {
            elem.removeChild(child);
          }

          dom.addClass(elem, classes.groupIndicatorContainer);

          var currentGroupId = getCurrentGroupId(index, level);

          if (index > -1 && (groupsLevelsList[index] && groupsLevelsList[index].indexOf(level) > -1)) {

            collapseButton = createButton(elem);
            collapseButton.addClass(classes.groupIndicator(directionClassname));

            if (isFirstIndexOfTheLine(dataType, index, level, currentGroupId)) { // add a little thingy and the top of the group indicator
              collapseButton.addClass(classes.groupStart);
            }

            if (isLastIndexOfTheLine(dataType, index, level, currentGroupId)) { // add [+]/[-] button at the end of the line
              collapseButton.button.appendChild(document.createTextNode('-'));
              collapseButton.addClass(classes.collapseButton);
              collapseButton.button.id = classes.collapseGroupId(currentGroupId);
              collapseButton.button.setAttribute('data-level', level);
              collapseButton.button.setAttribute('data-type', dataType);
            }

          }

          if (createLevelTriggers) {
            var rowInd = dom.index(elem.parentNode);
            if (index === -1 || (index < -1 && rowInd === Handsontable.Grouping.getLevels().cols + 1) ||
                (rowInd === 0 && Handsontable.Grouping.getLevels().cols === 0)) {
              collapseButton = createButton(elem);
              collapseButton.addClass(classes.levelTrigger);

              if (index === -1) {
                collapseButton.button.id = classes.collapseFromLevel("Cols", level);
                collapseButton.button.appendChild(document.createTextNode(level));
              } else if (index < -1 && rowInd === Handsontable.Grouping.getLevels().cols + 1 ||
                  (rowInd === 0 && Handsontable.Grouping.getLevels().cols === 0)) {
                var colInd = dom.index(elem) + 1;
                collapseButton.button.id = classes.collapseFromLevel("Rows", colInd);
                collapseButton.button.appendChild(document.createTextNode(colInd));
              }
            }
          }

          // add group expending button
          var expanderButton = addGroupExpander(dataType, index, level, currentGroupId, elem);
          if (index > 0) {
            var previousGroupObj = getGroupByIndexAndLevel(index - 1, level);

            if (expanderButton && previousGroupObj.hidden) {
              dom.addClass(expanderButton, classes.clickable);
            }
          }

          updateHeaderWidths();

        };
      };


      renderersArr = currentHeaderModifier(renderersArr);


      if (counters[dataType] > 0) {
        for (var i = 0; i < levels[dataType] + 1; i++) { // for each level of col groups add a header renderer
          if (!Array.isArray(renderersArr)) {
            renderersArr = typeof renderersArr === 'function' ? renderersArr() : new Array(renderersArr);
          }
          renderersArr.unshift(makeGroupIndicatorsForLevel());
        }
      }
    },
    /**
     * Get group levels array arranged by rows
     * @returns {Array}
     */
    getGroupLevelsByRows: function () {
      var rowGroups = getRowGroups()
        , result = [];

      for (var i = 0, groupsLength = rowGroups.length; i < groupsLength; i++) {
        if (rowGroups[i].rows) {
          for (var j = 0, groupRowsLength = rowGroups[i].rows.length; j < groupRowsLength; j++) {
            if (!result[rowGroups[i].rows[j]]) {
              result[rowGroups[i].rows[j]] = [];
            }
            result[rowGroups[i].rows[j]].push(rowGroups[i].level);
          }
        }
      }
      return result;
    },
    /**
     * Get group levels array arranged by cols
     * @returns {Array}
     */
    getGroupLevelsByCols: function () {
      var colGroups = getColGroups()
        , result = [];

      for (var i = 0, groupsLength = colGroups.length; i < groupsLength; i++) {
        if (colGroups[i].cols) {
          for (var j = 0, groupColsLength = colGroups[i].cols.length; j < groupColsLength; j++) {
            if (!result[colGroups[i].cols[j]]) {
              result[colGroups[i].cols[j]] = [];
            }
            result[colGroups[i].cols[j]].push(colGroups[i].level);
          }
        }
      }
      return result;
    },
    /**
     * Toggle the group visibility ( + / - event handler)
     * @param event
     * @param coords
     * @param TD
     */
    toggleGroupVisibility: function (event, coords, TD) {
      if (dom.hasClass(event.target, classes.expandButton) ||
          dom.hasClass(event.target, classes.collapseButton) ||
          dom.hasClass(event.target, classes.levelTrigger)) {
        var element = event.target
          , elemIdSplit = element.id.split('-');

        var groups = []
          , id
          , level
          , type
          , hidden;

        var prepareGroupData = function (componentElement) {
          if (componentElement) {
            element = componentElement;
          }

          elemIdSplit = element.id.split('-');

          id = elemIdSplit[1];
          level = parseInt(element.getAttribute('data-level'), 10);
          type = element.getAttribute('data-type');
          hidden = parseInt(element.getAttribute('data-hidden'));

          if (isNaN(hidden)) {
            hidden = 1;
          } else {
            hidden = (hidden ? 0 : 1);
          }

          element.setAttribute('data-hidden', hidden.toString());


          groups.push(getGroupById(id));
        };

        if (element.className.indexOf(classes.levelTrigger) > -1) { // show levels below, hide all above
          var groupsInLevel
            , groupsToExpand = []
            , groupsToCollapse = []
            , levelType = element.id.indexOf("Rows") > -1 ? "rows" : "cols";

          for (var i = 1, levelsCount = levels[levelType]; i <= levelsCount; i++) {
            groupsInLevel = levelType == "rows" ? getRowGroupsByLevel(i) : getColGroupsByLevel(i);

            if (i >= parseInt(elemIdSplit[1], 10)) {
              for (var j = 0, groupCount = groupsInLevel.length; j < groupCount; j++) {
                groupsToCollapse.push(groupsInLevel[j]);
              }
            } else {
              for (var j = 0, groupCount = groupsInLevel.length; j < groupCount; j++) {
                groupsToExpand.push(groupsInLevel[j]);
              }
            }
          }

          showHideGroups(true, groupsToCollapse);
          showHideGroups(false, groupsToExpand);

        } else {
          prepareGroupData();
          showHideGroups(hidden, groups);
        }

        // add the expander button to a dummy spare row/col, if no longer needed -> remove it
        /* jshint -W038 */
        type = type || levelType;

        var lastHidden = isLastHidden(type)
          , typeUppercase = type.charAt(0).toUpperCase() + type.slice(1)
          , spareElements = Handsontable.Grouping['baseSpare' + typeUppercase];

        if (lastHidden) {
          /* jshint -W041 */
          if (spareElements == 0) {
            instance.alter('insert_' + type.slice(0, -1), instance['count' + typeUppercase]());
            Handsontable.Grouping["dummy" + type.slice(0, -1)] = true;
          }
        } else {
          /* jshint -W041 */
          if (spareElements == 0) {
            if (Handsontable.Grouping["dummy" + type.slice(0, -1)]) {
              instance.alter('remove_' + type.slice(0, -1), instance['count' + typeUppercase]() - 1);
              Handsontable.Grouping["dummy" + type.slice(0, -1)] = false;
            }
          }
        }

        instance.render();

        event.stopImmediatePropagation();
      }
    },
    /**
     * Modify the delta when changing cells using keyobard
     * @param position
     * @returns {Function}
     */
    modifySelectionFactory: function (position) {
      var instance = this.instance;
      var currentlySelected
        , nextPosition = new WalkontableCellCoords(0, 0)
        , nextVisible = function (direction, currentPosition) { // updates delta to skip to the next visible cell
          var updateDelta = 0;

          switch (direction) {
            case 'down':
              while (isCollapsed(currentPosition)) {
                updateDelta++;
                currentPosition.row += 1;
              }
              break;
            case 'up':
              while (isCollapsed(currentPosition)) {
                updateDelta--;
                currentPosition.row -= 1;
              }
              break;
            case 'right':
              while (isCollapsed(currentPosition)) {
                updateDelta++;
                currentPosition.col += 1;
              }
              break;
            case 'left':
              while (isCollapsed(currentPosition)) {
                updateDelta--;
                currentPosition.col -= 1;
              }
              break;
          }

          return updateDelta;
        }
        , updateDelta = function (delta, nextPosition) {
          if (delta.row > 0) { // moving down
            if (isCollapsed(nextPosition)) {
              delta.row += nextVisible('down', nextPosition);
            }
          } else if (delta.row < 0) { // moving up
            if (isCollapsed(nextPosition)) {
              delta.row += nextVisible('up', nextPosition);
            }
          }

          if (delta.col > 0) { // moving right
            if (isCollapsed(nextPosition)) {
              delta.col += nextVisible('right', nextPosition);
            }
          } else if (delta.col < 0) { // moving left
            if (isCollapsed(nextPosition)) {
              delta.col += nextVisible('left', nextPosition);
            }
          }
        };

      /* jshint -W027 */
      switch (position) {
        case 'start':
          return function (delta) {
            currentlySelected = instance.getSelected();
            nextPosition.row = currentlySelected[0] + delta.row;
            nextPosition.col = currentlySelected[1] + delta.col;

            updateDelta(delta, nextPosition);
          };
          break;
        case 'end':
          return function (delta) {
            currentlySelected = instance.getSelected();
            nextPosition.row = currentlySelected[2] + delta.row;
            nextPosition.col = currentlySelected[3] + delta.col;

            updateDelta(delta, nextPosition);
          };
          break;
      }
    },
    modifyRowHeight: function (height, row) {
      if (instance.view.wt.wtTable.rowFilter && isCollapsed({row: row, col: null})) {
        return 0;
      }
    },
    validateGroups: function () {

      var areRangesOverlapping = function (a, b) {
        if ((a[0] < b[0] && a[1] < b[1] && b[0] <= a[1]) ||
            (a[0] > b[0] && b[1] < a[1] && a[0] <= b[1])) {
          return true;
        }
      };

      var configGroups = instance.getSettings().groups
        , cols = []
        , rows = [];

      for (var i = 0, groupsLength = configGroups.length; i < groupsLength; i++) {
        if (configGroups[i].rows) {
          /* jshint -W027 */
          if(configGroups[i].rows.length === 1) { // single-entry group
            throw new Error("Grouping error:  Group {" + configGroups[i].rows[0] + "} is invalid. Cannot define single-entry groups.");
            return false;
          } else if(configGroups[i].rows.length === 0) {
            throw new Error("Grouping error:  Cannot define empty groups.");
            return false;
          }

          rows.push(configGroups[i].rows);

          for (var j = 0, rowsLength = rows.length; j < rowsLength; j++) {
            if (areRangesOverlapping(configGroups[i].rows, rows[j])) {

              throw new Error("Grouping error:  ranges {" + configGroups[i].rows[0] + ", " + configGroups[i].rows[1] + "} and {" + rows[j][0] + ", " + rows[j][1] + "} are overlapping.");
              return false;
            }
          }
        } else if (configGroups[i].cols) {

          if(configGroups[i].cols.length === 1) { // single-entry group
            throw new Error("Grouping error:  Group {" + configGroups[i].cols[0] + "} is invalid. Cannot define single-entry groups.");
            return false;
          } else if(configGroups[i].cols.length === 0) {
            throw new Error("Grouping error:  Cannot define empty groups.");
            return false;
          }

          cols.push(configGroups[i].cols);

          for (var j = 0, colsLength = cols.length; j < colsLength; j++) {
            if (areRangesOverlapping(configGroups[i].cols, cols[j])) {

              throw new Error("Grouping error:  ranges {" + configGroups[i].cols[0] + ", " + configGroups[i].cols[1] + "} and {" + cols[j][0] + ", " + cols[j][1] + "} are overlapping.");
              return false;
            }
          }
        }
      }

      return true;
    },
    afterGetRowHeaderRenderers: function (arr) {
      Handsontable.Grouping.groupIndicatorsFactory(arr, 'vertical');
    },
    afterGetColumnHeaderRenderers: function (arr) {
      Handsontable.Grouping.groupIndicatorsFactory(arr, 'horizontal');
    },
    hookProxy: function (fn, arg) {
      return function () {
        if (instance.getSettings().groups) {
          return arg ? Handsontable.Grouping[fn](arg).apply(this, arguments) : Handsontable.Grouping[fn].apply(this, arguments);
        } else {
          return void 0;
        }
      };
    }
  };
}

Grouping.prototype.beforeInit = function() {

};

/**
 * create new instance
 */
var init = function () {
  var instance = this,
    groupingSetting = !!(instance.getSettings().groups);


  if (groupingSetting) {
    var headerUpdates = {};

    Handsontable.Grouping = new Grouping(instance);

    if (!instance.getSettings().rowHeaders) { // force using rowHeaders  --  needs to be changed later
      headerUpdates.rowHeaders = true;
    }
    if (!instance.getSettings().colHeaders) { // force using colHeaders  --  needs to be changed later
      headerUpdates.colHeaders = true;
    }
    if (headerUpdates.colHeaders || headerUpdates.rowHeaders) {
      instance.updateSettings(headerUpdates);
    }

    var groupConfigValid = Handsontable.Grouping.validateGroups();
    if (!groupConfigValid) {
      return;
    }

    instance.addHook('beforeInit', Handsontable.Grouping.hookProxy('init'));
    instance.addHook('afterUpdateSettings', Handsontable.Grouping.hookProxy('updateGroups'));
    instance.addHook('afterGetColumnHeaderRenderers', Handsontable.Grouping.hookProxy('afterGetColumnHeaderRenderers'));
    instance.addHook('afterGetRowHeaderRenderers', Handsontable.Grouping.hookProxy('afterGetRowHeaderRenderers'));
    instance.addHook('afterGetRowHeader', Handsontable.Grouping.hookProxy('afterGetRowHeader'));
    instance.addHook('afterGetColHeader', Handsontable.Grouping.hookProxy('afterGetColHeader'));
    instance.addHook('beforeOnCellMouseDown', Handsontable.Grouping.hookProxy('toggleGroupVisibility'));
    instance.addHook('modifyTransformStart', Handsontable.Grouping.hookProxy('modifySelectionFactory', 'start'));
    instance.addHook('modifyTransformEnd', Handsontable.Grouping.hookProxy('modifySelectionFactory', 'end'));
    instance.addHook('modifyRowHeight', Handsontable.Grouping.hookProxy('modifyRowHeight'));
  }
};

/**
 * Update headers widths for the group indicators
 */
// TODO: this needs cleaning up
var updateHeaderWidths = function () {
  var colgroups = document.querySelectorAll('colgroup');
  for (var i = 0, colgroupsLength = colgroups.length; i < colgroupsLength; i++) {
    var rowHeaders = colgroups[i].querySelectorAll('col.rowHeader');
    if (rowHeaders.length === 0) {
      return;
    }
    for (var j = 0, rowHeadersLength = rowHeaders.length + 1; j < rowHeadersLength; j++) {
      if (rowHeadersLength == 2) {
        return;
      }
      if (j < Handsontable.Grouping.getLevels().rows + 1) {
        if (j == Handsontable.Grouping.getLevels().rows) {
          dom.addClass(rowHeaders[j], 'htGroupColClosest');
        } else {
          dom.addClass(rowHeaders[j], 'htGroupCol');
        }
      }
    }
  }
};

Handsontable.hooks.add('beforeInit', init);

Handsontable.hooks.add('afterUpdateSettings', function () {

  if (this.getSettings().groups && !Handsontable.Grouping) {
    init.call(this, arguments);
  } else if (!this.getSettings().groups && Handsontable.Grouping) {
    Handsontable.Grouping.resetGroups();
    Handsontable.Grouping = void 0;
  }
});

Handsontable.plugins.Grouping = Grouping;
