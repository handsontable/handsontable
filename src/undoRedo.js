/**
 * Handsontable UndoRedo class
 */
handsontable.UndoRedo = function (instance) {
  var that = this;

  this.data = [];
  this.rev = -1;
  this.instance = instance;

  instance.container.on("datachange.handsontable", function (event, changes, origin) {
    if (origin !== 'undo' && origin !== 'redo') {
      that.add(changes);
    }
  });
};

/**
 * Undo operation from current revision
 */
handsontable.UndoRedo.prototype.undo = function () {
  var i, ilen, tmp;
  if (this.isUndoAvailable()) {
    var changes = $.extend(true, [], this.data[this.rev]); //deep clone
    var setData = $.extend(true, [], this.data[this.rev]);
    for (i = 0, ilen = setData.length; i < ilen; i++) {
      setData[i].splice(3, 1);
    }
    this.instance.setDataAtCell(setData);
    for (i = 0, ilen = changes.length; i < ilen; i++) {
      tmp = changes[i][3];
      changes[i][3] = changes[i][2];
      changes[i][2] = tmp;
    }
    this.instance.container.triggerHandler("datachange.handsontable", [changes, 'undo']);
    this.rev--;
  }
};

/**
 * Redo operation from current revision
 */
handsontable.UndoRedo.prototype.redo = function () {
  var i, ilen;
  if (this.isRedoAvailable()) {
    this.rev++;
    var setData = $.extend(true, [], this.data[this.rev]);
    for (i = 0, ilen = setData.length; i < ilen; i++) {
      setData[i].splice(2, 1);
    }
    this.instance.setDataAtCell(setData);
    this.instance.container.triggerHandler("datachange.handsontable", [this.data[this.rev], 'redo']); //we need old data at index 2 and new data at index 3
  }
};

/**
 * Returns true if undo point is available
 * @return {Boolean}
 */
handsontable.UndoRedo.prototype.isUndoAvailable = function () {
  return (this.rev > 0);
};

/**
 * Returns true if redo point is available
 * @return {Boolean}
 */
handsontable.UndoRedo.prototype.isRedoAvailable = function () {
  return (this.rev < this.data.length - 1);
};

/**
 * Add new history poins
 * @param changes
 */
handsontable.UndoRedo.prototype.add = function (changes) {
  this.rev++;
  this.data.splice(this.rev); //if we are in point abcdef(g)hijk in history, remove everything after (g)
  this.data.push(changes);
};