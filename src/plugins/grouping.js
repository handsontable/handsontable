// TODO:
// 1) show / hide groups -> see bindEvents method
// 2) render options (+/-) for each group
// 3) tests

var Grouping = function (instance) {
  /**
   * array of items
   * @type {Array}
   */
  var groups = [];

  /**
   * group definition
   * @type {{id: String, level: Number, rows: Array, cols: Array, hide: Number}}
   */
  var item = {
    id: '',
    level: 0,
    hide: 0,
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
   * group levels
   * @type {{rows: number, cols: number}}
   */
  var levels = {
    rows: 1,
    cols: 1
  };

  /**
   * create containers for columns and rows groups and levels
   * @type {HTMLElement}
   */
  var colGroupLevelsContainer = document.createElement('DIV'),
      colGroupListLevels = document.createElement('UL');

  colGroupLevelsContainer.className = 'colGroupLevelsContainer';
  colGroupLevelsContainer.appendChild(colGroupListLevels);

  var rowGroupLevelsContainer = document.createElement('DIV'),
      rowGroupListLevels = document.createElement('UL');

  rowGroupLevelsContainer.className = 'rowGroupLevelsContainer';
  rowGroupLevelsContainer.appendChild(rowGroupListLevels);

  var colGroupsContainer = document.createElement('DIV'),
      colGroupsList = document.createElement('UL');

  colGroupsContainer.className = 'colGroupsContainer';
  colGroupsContainer.appendChild(colGroupsList);

  var rowGroupsContainer = document.createElement('DIV'),
      rowGroupsList = document.createElement('UL');

  rowGroupsContainer.className = 'rowGroupsContainer';
  rowGroupsContainer.appendChild(rowGroupsList);

  /**
   * default css class
   * @type {string}
   */
  var cssClass = 'group';

  /**
   * last clicked item
   * @type {Object}
   */
  var lastClicked = null;

  /**
   * create list element
   * @param {Number} index
   * @returns {HTMLElement}
   */
  var createListElement = function (index) {
    var li = document.createElement('li');

    li.innerHTML = index;
    li.className = cssClass + ' group_' + index;

    var level = index,
        type = '';

    if (instance.selection.selectedHeader.cols) {
      type = 'cols';
    } else {
      type = 'rows';
    }

    li.setAttribute('level', level.toString());
    li.setAttribute('type', type);

    return li;
  };

  /**
   * create group element
   * @param item
   * @returns {HTMLElement}
   */
  var createGroupElement = function (item) {
    var li = document.createElement('li');

    li.innerHTML = item.id;
    li.className = cssClass;

    var type = '';

    if (item.cols instanceof Array) {
      type = 'cols';
    } else {
      type = 'rows';
    }

    li.setAttribute('id', item.id);
    li.setAttribute('level', item.level.toString());
    li.setAttribute('type', type);

    return li;
  }

  /**
   * compare object properties
   * @param {String} property
   * @param {String} orderDirection
   * @returns {Function}
   */
  var compare = function (property, orderDirection) {
    return function (item1, item2) {
      return typeof (orderDirection) === 'undefined' || orderDirection === 'asc' ? item1[property] - item2[property] : item2[property] - item1[property];
    }
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
  var getRangeGroups = function (from, to) {
    var cells = [],
        cell = {
          row: null,
          col: null
        };

    if (instance.selection.selectedHeader.cols) {
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
        return item['rows']
      }).length;

      totalCols += cellsGroups[i].filter(function (item) {
        return item['cols']
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
    return groups.filter(function (item) {
      return item.id === id;
    })[0];
  };

  /**
   * get total column groups
   * @returns {*|Array}
   */
  var getColGroups = function () {
    return groups.filter(function (item) {
      return item['cols'] instanceof Array;
    });
  };

  /**
   * get total col groups by level
   * @param {Number} level
   * @returns {*|Array}
   */
  var getColGroupsByLevel = function (level) {
    return getColGroups().filter(function (item) {
      return item['level'] === level;
    });
  };

  /**
   * get total row groups
   * @returns {*|Array}
   */
  var getRowGroups = function () {
    return groups.filter(function (item) {
      return item['rows'] instanceof Array;
    });
  };

  /**
   * get total row groups by level
   * @param {Number} level
   * @returns {*|Array}
   */
  var getRowGroupsByLevel = function (level) {
    return getRowGroups().filter(function (item) {
      return item['level'] === level;
    });
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
   * update col groups level
   * @param level
   */
  var updateColGroupsLevel = function (level) {
    var groups = getColGroups().sort(compare('level', 'asc'));

    groups.filter(function (item) {
      if (item.level > level) {
        item.level--;
      }
    });
  };

  /**
   * update row groups level
   * @param level
   */
  var updateRowGroupsLevel = function (level) {
    var groups = getRowGroups().sort(compare('level', 'asc'));

    groups.filter(function (item) {
      if (item.level > level) {
        item.level--;
      }
    });
  };

  /**
   * create group for cols
   * @param {Number} from
   * @param {Number} to
   */
  var groupCols = function (from, to) {
    var rangeGroups = getRangeGroups(from, to),
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
      level: levels.cols,
      cols: range(from, to),
      hide: 0
    });
  };

  /**
   * ungroup columns
   * delete range columns from last inserted groups
   * @param {Number} from
   * @param {Number} to
   */
  var ungroupCols = function (from, to) {
    var copyRange = range(from, to),
        rangeGroups = getRangeGroups(from, to);

    // loop for selected range
    for (var i = 0; i < copyRange.length; i++) {

      var cellIndex = copyRange[i], // value to remove
        cellGroups = rangeGroups.groups[i], // get groups which contains cellIndex
        cellGroupsLength = Handsontable.helper.isArray(cellGroups) ? cellGroups.length : 0; // groups length

      if (cellGroupsLength) {

        cellGroups = cellGroups.filter(function (item) {
          return item['cols'];
        }).sort(compare('level', 'desc'));

        if (cellGroups.length) {

          var cellGroup = cellGroups[0],
              cellGroupLevel = cellGroup.level,
              decrementLevel = getColGroupsByLevel(cellGroupLevel).length > 1 ? false : true;

          // remove value from sorted by level array of objects
          groups.filter(function (item, i) {
            if (item.id === cellGroup.id) {
              var cellIndexPosition = item.cols.indexOf(cellIndex);
              item.cols.splice(cellIndexPosition, 1);

              var len = item.cols.length;
              // there are no elements, remove object from array
              if (!len) {
                counters.cols--;
                groups.splice(i, 1);

                if (levels.cols && decrementLevel) {
                  // update col groups level
                  updateColGroupsLevel(cellGroupLevel);
                  levels.cols--;
                }
              }
            }
          });

        }
      }
    }
  };

  /**
   * create group for rows
   * @param {Number} from
   * @param {Number} to
   */
  var groupRows = function (from, to) {
    var rangeGroups = getRangeGroups(from, to),
        lastLevel = getLastLevelRowsInRange(rangeGroups.groups);

    if (lastLevel === levels.rows) {
      levels.rows++;
    } else if (lastLevel > levels.rows) {
      level.rows = lastLevel + 1;
    }

    if (!counters.rows) {
      counters.rows = getRowGroups().length;
    }

    counters.rows++;
    groups.push({
      id: 'r' + counters.rows,
      level: levels.rows,
      rows: range(from, to),
      hide: 0
    });
  };

  /**
   * Ungroup rows
   * delete range rows from last inserted groups
   * @param {Number} from
   * @param {Number} to
   */
  var ungroupRows = function (from, to) {
    var copyRange = range(from, to),
        rangeGroups = getRangeGroups(from, to);

    // loop for selected range
    for (var i = 0; i < copyRange.length; i++) {

      var cellIndex = copyRange[i], // value to remove
          cellGroups = rangeGroups.groups[i], // get groups which contains cellIndex
          cellGroupsLength = Handsontable.helper.isArray(cellGroups) ? cellGroups.length : 0; // groups length

      if (cellGroupsLength) {
        cellGroups = cellGroups.filter(function (item) {
          return item['rows'];
        }).sort(compare('level', 'desc'));

        if (cellGroups.length) {
          var cellGroup = cellGroups[0],
            cellGroupLevel = cellGroup.level,
            decrementLevel = getRowGroupsByLevel(cellGroupLevel).length > 1 ? false : true;

          // remove value from sorted by level array of objects
          groups.filter(function (item, j) {
            if (item.id === cellGroup.id) {

              var cellIndexPosition = item.rows.indexOf(cellIndex);
              item.rows.splice(cellIndexPosition, 1);

              var len = item.rows.length;
              // there are no elements, remove object from array
              if (!len) {
                counters.rows--;
                groups.splice(j, 1);

                if (levels.rows && decrementLevel) {
                  // update col groups level
                  updateRowGroupsLevel(cellGroupLevel);
                  levels.rows--;
                }
              }
            }
          });
        }
      }
    }
  };

  /**
   * show or hide groups
   * @param showHide
   * @param groups
   */
  var showHideGroups = function (showHide, groups) {
    groups.forEach(function (item) {
      item.hide = showHide;
    });
  };

  var bindEvents = function () {
    var root = instance.rootElement[0].parentNode;

    // show/hide single group
    $(root).on('mousedown.groupContainer', '.colGroupsContainer ul li, .rowGroupsContainer ul li', function (e) {
      var element = e.currentTarget,
          id = element.getAttribute('id'),
          level = parseInt(element.getAttribute('level'), 10),
          type = element.getAttribute('type'),
          hide = parseInt(element.getAttribute('hide'), 10);

      if (isNaN(hide)) {
        hide = 1;
      } else {
        hide = (hide ? 0 : 1);
      }

      lastClicked = {
        id: id,
        level: level,
        type: type,
        hide: hide
      };

      element.setAttribute('hide', hide.toString());

      var groups = [];
      groups.push(getGroupById(id));

      showHideGroups(hide, groups);
      instance.render();
    });

    // show/hide all groups on the same level and type
    $(root).on('mousedown.groupLevelsContainer', '.colGroupLevelsContainer ul li, .rowGroupLevelsContainer ul li', function (e) {

      var element = e.currentTarget,
          level = parseInt(element.getAttribute('level'), 10),
          type = element.getAttribute('type'),
          hide = parseInt(element.getAttribute('hide'), 10);

      if (isNaN(hide)) {
        hide = 1;
      } else {
        hide = (hide ? 0 : 1);
      }

      lastClicked = {
        id: null,
        level: level,
        type: type,
        hide: hide
      };

      element.setAttribute('hide', hide.toString());

      // get all groups for level
      var groups = [];

      switch (type) {
        case 'cols':
          groups = getColGroupsByLevel(level);
        break;

        case 'rows':
          groups = getRowGroupsByLevel(level);
        break;
      }

      if (groups.length) {
        showHideGroups(hide, groups);
        instance.render();
      }
    });
  };

  var renderRowGroupLevels = function (rootElement) {

    while (rowGroupListLevels.firstChild) {
      rowGroupListLevels.removeChild(rowGroupListLevels.firstChild);
    }

    for (var i = 1; i <= levels.rows; i++) {
      if (!rowGroupListLevels.querySelector('.group_' + i)) {
        var liElement = createListElement(i);
        rowGroupListLevels.appendChild(liElement);
      }
    }

    if (!rootElement.querySelector('.rowGroupLevelsContainer')) {
      rootElement.appendChild(rowGroupLevelsContainer);
    }
  };

  var renderColGroupLevels = function (rootElement) {
    while (colGroupListLevels.firstChild) {
      colGroupListLevels.removeChild(colGroupListLevels.firstChild);
    }

    for (var i = 1; i <= levels.cols; i++) {
      if (!colGroupListLevels.querySelector('.group_' + i)) {
        var liElement = createListElement(i);
        colGroupListLevels.appendChild(liElement);
      }
    }

    if (!rootElement.querySelector('.colGroupLevelsContainer')) {
      rootElement.appendChild(colGroupLevelsContainer);
    }
  };

  var renderColGroups = function (rootElement) {
    while (colGroupsList.firstChild) {
      colGroupsList.removeChild(colGroupsList.firstChild);
    }

    var colGroups = getColGroups();
    colGroups.forEach(function (item) {
      var liElement = createGroupElement(item);
      colGroupsList.appendChild(liElement);
    });

    if (!rootElement.querySelector('.colGroupsContainer')) {
      rootElement.appendChild(colGroupsContainer);
    }
  };

  var renderRowGroups = function (rootElement) {
    while (rowGroupsList.firstChild) {
      rowGroupsList.removeChild(rowGroupsList.firstChild);
    }

    var rowGroups = getRowGroups();
    rowGroups.forEach(function (item) {
      var liElement = createGroupElement(item);
      rowGroupsList.appendChild(liElement);
    });

    if (!rootElement.querySelector('.rowGroupsContainer')) {
      rootElement.appendChild(rowGroupsContainer);
    }
  };

  return {

    /**
     * all groups for ht instance
     */
    groups: groups,

    /**
     * init group
     * @param {Object} settings, could be an array of objects [{cols: [0,1,2]}, {cols: [3,4,5]}, {rows: [0,1]}]
     */
    init: function (settings) {

      if (settings) {
        var initialGroups = instance.getSettings().groups;

        if (initialGroups instanceof Array) {
          this.initGroupsOnStartup(initialGroups);
        }

        bindEvents.call(this);
      }
    },

    /**
     * init groups from configuration on startup
     */
    initGroupsOnStartup: function (initialGroups) {
      var that = this;
      initialGroups.forEach(function (item) {
        var _group = [],
            isRow = false,
            isCol = false;

        if (item.rows instanceof Array) {
          _group = item.rows;
          isRow = true;
        } else if (item.cols instanceof Array) {
          _group = item.cols;
          isCol = true;
        }

        var from = _group[0],
            to = _group[_group.length - 1];

        var start = {},
            end = {};

        if (isRow) {
          instance.selection.setSelectedHeaders(true, false);
          start = {
            row: from
          };

          end = {
            row: to
          };

        } else if (isCol) {
          instance.selection.setSelectedHeaders(false, true);

          start = {
            col: from
          };

          end = {
            col: to
          };
        }

        that.group(start, end);

      });
    },

    /**
     * group columns, rows
     * @param {Object} start
     * @param {Object} end
     */
    group: function (start, end) {
      instance.selection.selectedHeader.rows ? groupRows(start.row, end.row) : groupCols(start.col, end.col);
      this.render();
    },

    /**
     * ungroup columns, rows
     * @param start
     * @param end
     */
    ungroup: function (start, end) {
      instance.selection.selectedHeader.rows ? ungroupRows(start.row, end.row) : ungroupCols(start.col, end.col);
      this.render();
    },

    /**
     * render groups by level and for single group
     */
    render: function () {
      var rootElement = instance.rootElement[0].parentNode;

      // render group levels and groups
      if (instance.selection.selectedHeader.cols) {

        renderColGroupLevels(rootElement);
        renderColGroups(rootElement);

      } else if (instance.selection.selectedHeader.rows) {

        renderRowGroupLevels(rootElement);
        renderRowGroups(rootElement);

      }
    },

    /**
     * check if grouping is allowed
     * @returns {boolean}
     */
    groupIsAllowed: function () {
      var selected = instance.getSelected(),
          rowTo = selected[2],
          colTo = selected[3];

      if (instance.selection.selectedHeader.rows) {
        if (colTo !== instance.countCols() - 1) {
          return false;
        }
      } else {
        if (rowTo !== instance.countRows() -1) {
          return false;
        }
      }

      return true;
    },

    /**
     * check if ungrouping is allowed
     * @returns {boolean}
     */
    ungroupIsAllowed: function () {
      var selected = instance.getSelected(),
          rowFrom = selected[0],
          colFrom = selected[1],
          rowTo = selected[2],
          colTo = selected[3];

      var start = 0,
          end = 0;

      if (instance.selection.selectedHeader.cols) {
        if (rowFrom <= rowTo) {
          start = colFrom;
          end = colTo;
        } else {
          start = colTo;
          end = colFrom;
        }
      } else {
        if (rowFrom <= rowTo) {
          start = rowFrom;
          end = rowTo;
        } else {
          start = rowTo;
          end = rowFrom;
        }
      }

      var _groups = getRangeGroups(start, end);

      return  (instance.selection.selectedHeader.cols) ? (_groups.total.cols > 0 ? true : false) : (_groups.total.rows > 0 ? true : false);
    },

    /**
     * add group/ungroup options to context menu
     * @param {Object} options
     */
    addGroupingToContextMenu: function (options) {
      var instance = this;
      if (!instance.getSettings().groups) {
        return;
      }

      options.items.groupingCellsSeparator = Handsontable.ContextMenu.SEPARATOR;

      options.items.grouping = {
        name: function () {
          return 'Group';
        },
        callback: function (key, selection) {
          var start = selection.start,
            end = selection.end;

          Handsontable.Grouping.group(start, end);
        },
        disabled: function () {
          return !Handsontable.Grouping.groupIsAllowed();
        }
      };

      options.items.ungrouping = {
        name: function () {
          return 'Ungroup';
        },
        callback: function (key, selection) {
          var start = selection.start,
            end = selection.end;

          Handsontable.Grouping.ungroup(start, end);

        },
        disabled: function () {
          return !Handsontable.Grouping.ungroupIsAllowed();
        }
      };
    },

    afterGetRowHeader: function (row, TH) {
      var instance = this;

      if (!lastClicked) {
        return;
      }

      if (lastClicked.type === 'rows') {

        // ignore row header
        if (row < 0) {
          return;
        }

        var cellGroups = [];

        if (lastClicked.id) {
          // show single group
          cellGroups.push(getGroupById(lastClicked.id));

          cellGroups = cellGroups.filter(function (item) {
            return item['rows'].indexOf(row) !== -1;
          });

        } else if (lastClicked.level > 0) {
          // show group by level
          cellGroups = getCellGroups({
            row: row,
            col: 0
          }, lastClicked.level, 'rows');

        } else {
          return;
        }


        if (!cellGroups.length) {
          return;
        }

        var isHidden = lastClicked.hide;

        var header = instance.view.wt.wtScrollbars.horizontal.clone.wtTable.TBODY,
            THs = header.querySelectorAll('tr th'),
            index = row;

        if (isHidden) {

          TH.style.display = 'none';
          THs[index].style.display = 'none';
          TH.parentNode.style.display = 'none';

        } else {

          TH.style.display = '';
          THs[index].style.display = '';
          TH.parentNode.style.display = '';
        }
      }
    },

    afterGetColHeader: function (col, TH) {
      var instance = this;

      if (!lastClicked) {
        return;
      }

      if (lastClicked.type === 'cols') {

        var cellGroups = [];

        if (lastClicked.id) {
          // show single group
          cellGroups.push(getGroupById(lastClicked.id));

          cellGroups = cellGroups.filter(function (item) {
            return item['cols'].indexOf(col) !== -1;
          });

        } else if (lastClicked.level > 0) {
          // show group by level
          cellGroups = getCellGroups({
            row: 0,
            col: col
          }, lastClicked.level, 'cols');

        } else {
          return;
        }

        if (!cellGroups.length) {
          return;
        }

        var isHidden = lastClicked.hide;

        var header = instance.view.wt.wtScrollbars.vertical.clone.wtTable.THEAD,
            colGroupClone = instance.view.wt.wtScrollbars.vertical.clone.wtTable.COLGROUP,
            colGroup = instance.view.wt.wtTable.COLGROUP;

        var colsClone = colGroupClone.querySelectorAll('col'),
            cols = colGroup.querySelectorAll('col');

        var THs = header.querySelectorAll('tr th'),
            index = col + 1,
            totalRows = instance.countRows(),
            totalRowsVisible = instance.view.wt.wtTable.getRowStrategy().countVisible(),
            i = 0;

        if (!totalRowsVisible) {
          return;
        }

        if (isHidden) {

          // hide cell
          TH.style.display = 'none';
          THs[index].style.display = 'none';
          colsClone[index].style.display = 'none';
          cols[index].style.display = 'none';

          for (i; i < totalRows; i++) {
            var cell = instance.getCell(i, col);
            if (cell) {
              cell.style.display = 'none';
            }
          }

        } else {

          TH.style.display = '';
          THs[index].style.display = '';
          colsClone[index].style.display = '';
          cols[index].style.display = '';

          for (i; i < totalRows; i++) {
            var cell = instance.getCell(i, col);
            if (cell) {
              cell.style.display = '';
            }
          }
        }
      }
    }
  }
};

/**
 * create new instance
 */
var init = function () {
  var instance = this,
      groupingSetting = !!(instance.getSettings().groups);

  if (groupingSetting) {
    Handsontable.Grouping = new Grouping(instance);
    Handsontable.Grouping.init(groupingSetting);

    Handsontable.hooks.add('afterContextMenuDefaultOptions', Handsontable.Grouping.addGroupingToContextMenu);

    Handsontable.hooks.add('afterGetRowHeader', Handsontable.Grouping.afterGetRowHeader);
    Handsontable.hooks.add('afterGetColHeader', Handsontable.Grouping.afterGetColHeader);
  }
};

Handsontable.hooks.add('beforeInit', init);
