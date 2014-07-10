function WalkontableSelections(instance, config){
  if (config) {
    for (var i in config) {
      if (config.hasOwnProperty(i)) {
        this[i] = new WalkontableSelection(instance, config[i]);
      }
    }
  }
}

WalkontableSelections.prototype.makeClone = function (instance) {
  function WalkontableSelectionsClone(){}

  var clone = new WalkontableSelectionsClone();

  for (var selectionName in this){
    if (this.hasOwnProperty(selectionName)){
      clone[selectionName] = this[selectionName].makeClone(instance);
    }
  }

  return clone;

};