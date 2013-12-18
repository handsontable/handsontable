/**
 * WalkontableCellStrategy
 * @constructor
 */
function WalkontableCellStrategy(instance) {
  this.instance = instance;
}

WalkontableCellStrategy.prototype.getSize = function (index) {
  return this.cellSizes[index];
};

WalkontableCellStrategy.prototype.getContainerSize = function (proposedSize) {
  return typeof this.containerSizeFn === 'function' ? this.containerSizeFn(proposedSize) : this.containerSizeFn;
};

WalkontableCellStrategy.prototype.countVisible = function () {
  return this.cellCount;
};

WalkontableCellStrategy.prototype.isLastIncomplete = function () {

  if(this.instance.getSetting('nativeScrollbars')){

    var nativeScrollbar = this.instance.cloneFrom ? this.instance.cloneFrom.wtScrollbars.vertical : this.instance.wtScrollbars.vertical;
    return this.remainingSize > nativeScrollbar.sumCellSizes(nativeScrollbar.offset, nativeScrollbar.offset + nativeScrollbar.curOuts + 1);

  } else {
    return this.remainingSize > 0;
  }

};