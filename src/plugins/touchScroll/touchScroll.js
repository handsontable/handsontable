var TouchScroll = (function(instance) {

  function TouchScroll(instance) {}

  TouchScroll.prototype.init = function(instance) {
    this.instance = instance;
    this.bindEvents();

    this.scrollbars = [
      this.instance.view.wt.wtScrollbars.vertical,
      this.instance.view.wt.wtScrollbars.horizontal,
      this.instance.view.wt.wtScrollbars.corner
    ];

    this.clones = [
      this.instance.view.wt.wtScrollbars.vertical.clone.wtTable.holder.parentNode,
      this.instance.view.wt.wtScrollbars.horizontal.clone.wtTable.holder.parentNode,
      this.instance.view.wt.wtScrollbars.corner.clone.wtTable.holder.parentNode
    ];
  };

  TouchScroll.prototype.bindEvents = function () {
  var that = this;

    this.instance.addHook('beforeTouchScroll', function () {
      Handsontable.freezeOverlays = true;

      for(var i = 0, cloneCount = that.clones.length; i < cloneCount ; i++) {
        Handsontable.Dom.addClass(that.clones[i], 'hide-tween');
      }
    });

    this.instance.addHook('afterMomentumScroll', function () {
      Handsontable.freezeOverlays = false;

      for(var i = 0, cloneCount = that.clones.length; i < cloneCount ; i++) {
        Handsontable.Dom.removeClass(that.clones[i], 'hide-tween');
      }

      for(var i = 0, cloneCount = that.clones.length; i < cloneCount ; i++) {
        Handsontable.Dom.addClass(that.clones[i], 'show-tween');
      }

      setTimeout(function () {
        for(var i = 0, cloneCount = that.clones.length; i < cloneCount ; i++) {
          Handsontable.Dom.removeClass(that.clones[i], 'show-tween');
        }
      },400);

      for(var i = 0, cloneCount = that.scrollbars.length; i < cloneCount ; i++) {
        that.scrollbars[i].refresh();
        that.scrollbars[i].resetFixedPosition();
      }

    });

  };

  return TouchScroll;
}());

var touchScrollHandler = new TouchScroll();

Handsontable.hooks.add('afterInit', function() {
  touchScrollHandler.init.call(touchScrollHandler, this);
});
