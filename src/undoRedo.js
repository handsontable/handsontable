/**
 * Handsontable UndoRedo class
 */
Handsontable.UndoRedo = function (instance) {
  var that = this;
  this.instance = instance;
  this.clear();
  Handsontable.PluginHooks.add("afterChange", function (changes, origin) {
    if (origin !== 'undo' && origin !== 'redo') {
      that.add(changes, origin);
    }
  });
};

/**
 * Undo operation from current revision
 */
Handsontable.UndoRedo.prototype.undo = function () {
  var i, ilen;
  if (this.isUndoAvailable()) {
    var setData = $.extend(true, [], this.data[this.rev]);
    for (i = 0, ilen = setData.length; i < ilen; i++) {
      setData[i].splice(3, 1);
    }
    // this.fixGrid('undo', setData, this.meta[this.rev]);
    this.instance.setDataAtRowProp(setData, null, null, 'undo');
    this.rev--;
  }
};

/**
 * Redo operation from current revision
 */
Handsontable.UndoRedo.prototype.redo = function () {
  var i, ilen;
  if (this.isRedoAvailable()) {
    this.rev++;
    var setData = $.extend(true, [], this.data[this.rev]);
    for (i = 0, ilen = setData.length; i < ilen; i++) {
      setData[i].splice(2, 1);
    }
    // this.fixGrid('redo', setData, this.meta[this.rev]);
    this.instance.setDataAtRowProp(setData, null, null, 'redo');
  }
};

/**
 * Returns true if undo point is available
 * @return {Boolean}
 */
Handsontable.UndoRedo.prototype.isUndoAvailable = function () {
  return (this.rev >= 0);
};

/**
 * Returns true if redo point is available
 * @return {Boolean}
 */
Handsontable.UndoRedo.prototype.isRedoAvailable = function () {
  return (this.rev < this.data.length - 1);
};

/**
 * Add new history poins
 * @param changes
 */
Handsontable.UndoRedo.prototype.add = function (changes, source) {
  this.rev++;
  // this.meta.splice(this.rev);
  this.data.splice(this.rev); //if we are in point abcdef(g)hijk in history, remove everything after (g)
  // this.meta.push(source);
  this.data.push(changes);
};

/**
 * Clears undo history
 */
Handsontable.UndoRedo.prototype.clear = function () {
  this.data = [];
  // this.meta = [];
  this.rev = -1;
};

// /**
//  * Repair grid size
//  */
// Handsontable.UndoRedo.prototype.fixGrid = function (action, data, source) {
//   switch (source) {
//     case 'insert_row':
//       var amount = this.countRows(data);
//       if (action === 'redo') {
//         this.instance.alter('insert_row', data[0][0], amount);
//       }
//       else {
//         this.instance.alter('remove_row', data[0][0], amount);
//       }
//       break;
//     case 'insert_col':
//       var amount = this.countCols(data);
//       if (action === 'redo') {
//         this.instance.alter('insert_col', data[0][1], amount);
//       }
//       else {
//         this.instance.alter('remove_col', data[0][1], amount);
//       }
//       break;
//     case 'remove_row':
//       var amount = this.countRows(data);
//       if (action === 'redo') {
//         this.instance.alter('remove_row', data[0][0], amount);
//       }
//       else {
//         this.instance.alter('insert_row', data[0][0], amount);
//       }
//       break;
//     case 'remove_col':
//       var amount = this.countCols(data);
//       if (action === 'redo') {
//         this.instance.alter('remove_col', data[0][1], amount);
//       }
//       else {
//         this.instance.alter('insert_col', data[0][1], amount);
//       }
//       break;
//   }
// };

// /**
//  * Count rows
//  */
// Handsontable.UndoRedo.prototype.countRows = function (data) {
//   var i = 1, len = data.length, count = 1;
//   for (; i < len; i++) {
//     if (data[i][0] !== data[i-1][0]) {
//       count++
//     }
//   }
//   return count;
// };

// /**
//  * Count columns
//  */
// Handsontable.UndoRedo.prototype.countCols = function (data) {
//   var i = 1, len = data.length;
//   for (; i < len; i++) {
//     if (data[i][0] !== data[i-1][0]) {
//       break;
//     }
//   }
//   return i;
// };