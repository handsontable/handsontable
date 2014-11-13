var TouchScroll = (function(instance) {

  function TouchScroll(instance) {}

  TouchScroll.prototype.init = function(instance) {
    this.instance = instance;
    this.bindEvents();
  };

  TouchScroll.prototype.bindEvents = function () {
  var that = this;

    this.instance.addHook('beforeTouchScroll', function () {
      Handsontable.freezeOverlays = true;

      that.instance.view.wt.wtScrollbars.vertical.clone.wtTable.holder.parentNode.style.display = "none";
      that.instance.view.wt.wtScrollbars.horizontal.clone.wtTable.holder.parentNode.style.display = "none";
      that.instance.view.wt.wtScrollbars.corner.clone.wtTable.holder.parentNode.style.display = "none";
      //console.log('before touch scroll');
    });

    this.instance.addHook('afterMomentumScroll', function () {
      Handsontable.freezeOverlays = false;

      that.instance.view.wt.wtScrollbars.vertical.clone.wtTable.holder.parentNode.style.display = "";
      that.instance.view.wt.wtScrollbars.horizontal.clone.wtTable.holder.parentNode.style.display = "";
      that.instance.view.wt.wtScrollbars.corner.clone.wtTable.holder.parentNode.style.display = "";

      that.instance.view.wt.wtScrollbars.vertical.refresh();
      that.instance.view.wt.wtScrollbars.vertical.resetFixedPosition();
      that.instance.view.wt.wtScrollbars.horizontal.refresh();
      that.instance.view.wt.wtScrollbars.horizontal.resetFixedPosition();
      that.instance.view.wt.wtScrollbars.corner.refresh();
      that.instance.view.wt.wtScrollbars.corner.resetFixedPosition();
      //console.log('after momentum scroll');

    });

  };

  return TouchScroll;
}());

var touchScrollHandler = new TouchScroll();

Handsontable.hooks.add('afterInit', function() {
  touchScrollHandler.init.call(touchScrollHandler, this);
});
