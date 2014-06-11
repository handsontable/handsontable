/**
 * Plugin allowing user to add new rows by dragging down cells (by the cell itself or by the drag-down handler)
 * @constructor
 */
 function AddRowsOnDrag() {
 	this.listening = false;
 	this.addingStarted = false;
 }

 AddRowsOnDrag.prototype.check = function(hot,event) {
 	
 	var fillCorners,
 	tableRows = hot.countRows(),
 	that = this;

 	if(hot.view.wt.selections.fill.cellRange && this.addingStarted === false) {
 		fillCorners = hot.view.wt.selections.fill.getCorners();

 		if(fillCorners[2] === tableRows - 1) {	 			
 			this.addingStarted = true;

 			setTimeout(function() {
 				
 				hot.getData('map').createRow(tableRows, 1, true);
 				hot.render();
 				
 				that.addingStarted = false;
 			}, 200);
 		}
 	}
 }

 var addRowsOnDrag = new AddRowsOnDrag();

 Handsontable.hooks.add('afterInit', function () {
 	var hot = this;

 	$(document).on('mouseup.' + this.guid, function () {
 		addRowsOnDrag.listening = false;
 	});

 	$(document).on('mousemove.' + this.guid, function (event) {
 		if (addRowsOnDrag.listening) {
 			addRowsOnDrag.check(hot,event);
 		}
 	});
 });
 Handsontable.hooks.add('afterOnCellCornerMouseDown', function() {
 	addRowsOnDrag.listening = true;
 });

 Handsontable.plugins.AddRowsOnDrag = AddRowsOnDrag;



