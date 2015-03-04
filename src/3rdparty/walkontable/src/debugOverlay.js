/**
 * A overlay that renders ALL available rows & columns positioned on top of the original Walkontable instance and all other overlays.
 * Used for debugging purposes to see if the other overlays (that render only part of the rows & columns) are positioned correctly
 *
 * @param instance
 * @constructor
 * @private
 */
function WalkontableDebugOverlay(instance) {
  this.instance = instance;
  this.init();
  this.clone = this.makeClone('debug');
  this.clone.wtTable.holder.style.opacity = 0.4;
  this.clone.wtTable.holder.style.textShadow = '0 0 2px #ff0000';
  this.lastTimeout = null;

  Handsontable.Dom.addClass(this.clone.wtTable.holder.parentNode, 'wtDebugVisible');

  /*var that = this;
  var lastX = 0;
  var lastY = 0;
  var overlayContainer = that.clone.wtTable.holder.parentNode;

  var eventManager = Handsontable.eventManager(instance);

  eventManager.addEventListener(document.body, 'mousemove', function (event) {
    if (!that.instance.wtTable.holder.parentNode) {
      return; //removed from DOM
    }
    if ((event.clientX - lastX > -5 && event.clientX - lastX < 5) && (event.clientY - lastY > -5 && event.clientY - lastY < 5)) {
      return; //ignore minor mouse movement
    }
    lastX = event.clientX;
    lastY = event.clientY;
    Handsontable.Dom.addClass(overlayContainer, 'wtDebugHidden');
    Handsontable.Dom.removeClass(overlayContainer, 'wtDebugVisible');
    clearTimeout(this.lastTimeout);
    this.lastTimeout = setTimeout(function () {
      Handsontable.Dom.removeClass(overlayContainer, 'wtDebugHidden');
      Handsontable.Dom.addClass(overlayContainer, 'wtDebugVisible');
    }, 1000);
  });*/
}

WalkontableDebugOverlay.prototype = new WalkontableOverlay();

WalkontableDebugOverlay.prototype.destroy = function () {
  WalkontableOverlay.prototype.destroy.call(this);
  clearTimeout(this.lastTimeout);
};
