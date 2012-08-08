(function ($) {
    /**
    * Handsontable Locking extension
   * @param {Object} instance
   * @param {Object} grid
   * @param {Object} selection
   */
    Handsontable.Locking = function (instance, grid, selection) {
        var that = this;
        this.instance = instance;
        this.grid = grid;
        this.selection = selection;
    };


    Handsontable.Locking.prototype.anyCellsLocked = function () {
        var cells = this.grid.getCellsAtCoords(this.selection.start(), this.selection.end());
        var any = false;
        $.each(cells, function () {
            return !(any = $(this).data('readOnly'));
        });
        return any;
    };

    Handsontable.Locking.prototype.anyCellsUnlocked = function () {
        var cells = this.grid.getCellsAtCoords(this.selection.start(), this.selection.end());
        var any = false;
        $.each(cells, function () {
            return !(any = !$(this).data('readOnly'));
        });
        return any;
    };

    Handsontable.Locking.prototype.lockCells = function (to, from) {
        var cells = this.grid.getCellsAtCoords(to, from);
        $(cells).data("readOnly", true).toggleClass('locked', true);
    };

    Handsontable.Locking.prototype.unlockCells = function (to, from) {
        var cells = this.grid.getCellsAtCoords(to, from);
        $(cells).data("readOnly", false).toggleClass('locked', false);
    };
})(jQuery);