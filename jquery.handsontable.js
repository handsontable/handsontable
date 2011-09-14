/**
 * Handsontable is a simple jQuery plugin for editable tables with basic copy-paste compatibility with Excel and Google Docs
 * 
 * TODO in firefox 4 it is very slow and doesn't look pixel perfect
 */
(function($){

	function handsontable(container, settings) {
		var _undefined = (function(){}());

		var priv = {
			isMouseDown: false,
			isCellEdited: false,
			selStart: null,
			selEnd: null,
			editProxy: false
		};
		
		var grid = {
			/**
			 * Populate cells at position with 2d array
			 * @param {Object} start Start selection position
			 * @param {Array} input 2d array
			 * @return {Object} ending td in pasted area
			 */
			populateFromArray: function(start, input) {
				var r, rlen, c, clen, td, endTd;
				rlen = input.length;
				if(rlen === 0) {
					return;
				}
				clen = input[0].length;
				for(r = 0; r < rlen; r++) {
					for(c = 0; c < clen; c++) {
						td = grid.getCellAtCoords({row: start.row+r, col: start.col+c});
						if(td) {
							td.html(input[r][c]);
							endTd = td;
						}
					}
				}
				return endTd;
			}, 
			
			/**
			 * Clears all cells in the grid
			 */
			clear: function() {
				var tds = grid.getAllCells();
				tds.html('');
			}, 
			
			/**
			 * Return data as array
			 * @return {Array}
			 */
			getData: function() {
				var td, tr, data = [], r, rlen, c, clen, allEmpty;
				trs = container.find('tr');
				trs.each(function(){
					var dataRow;
					var tr = $(this);
					var tds = tr.find('td');
					if(tds.filter(':parent').length) { //if not all tds are empty in this row
						dataRow = [];
						tds.each(function(){
							dataRow.push($(this).html());
						});
						data.push(dataRow);
					}
				});
				if(data.length > 0 && data[0].length) {
					rlen = data.length;
					col : for(c = data[0].length - 1; c >= 0; c--) {
						for(r = 0; r < rlen; r++) {
							if(data[r][c]) {
								break col;
							}
						}
						for(r = 0; r < rlen; r++) {
							data[r].pop();
						}
					}
				}
				return data;
			}, 
			
			/**
			 * Returns coordinates given td object
			 */
			getCellCoords: function(td) {
				if(td && td.length) {
					return {
						row: td.parent().index(),
						col: td.index()
					};
				}
			},
			
			/**
			 * Returns td object given coordinates
			 */
			getCellAtCoords: function(coords) {
				var td = container.find('tr:eq('+coords.row+') td:eq('+coords.col+')');
				return td;
			},
			
			/**
			 * Returns array of td objects given start and end coordinates
			 */
			getCellsAtCoords: function(start, end) {
				var r, rlen, c, clen, output = [];
				rlen = Math.max(start.row, end.row);
				clen = Math.max(start.col, end.col);
				for(r = Math.min(start.row, end.row); r <= rlen; r++) {
					for(c = Math.min(start.col, end.col); c <= clen; c++) {
						output.push( grid.getCellAtCoords({row: r, col: c}) );
					}
				}
				return output;
			},
			
			/**
			 * Returns all td objects in grid
			 */
			getAllCells: function() {
				var tds = container.find('td');
				return tds;
			}
		};
		
		var selection = {
			/**
			 * Starts selection range on given td object
			 */
			setRangeStart: function(td) {
				selection.deselect();
				priv.selStart = grid.getCellCoords(td);
				editproxy.prepare(td);
				selection.setRangeEnd(td);
				highlight.on();
			},
			
			/**
			 * Ends selection range on given td object
			 */
			setRangeEnd: function(td) {
				selection.deselect();
				selection.end(td);
				highlight.on();
			},
			
			/**
			 * Setter/getter for selection start
			 */
			start: function(td) {
				if(td !== _undefined) {
					priv.selStart = grid.getCellCoords(td);
				}
				return priv.selStart;
			},
			
			/**
			 * Setter/getter for selection end
			 */
			end: function(td) {
				if(td !== _undefined) {
					priv.selEnd = grid.getCellCoords(td);
				}
				return priv.selEnd;
			},
			
			/**
			 * Selects cell relative to current cell (if possible)
			 */
			transform: function(rowDelta, colDelta) {
				var td = grid.getCellAtCoords({row: (priv.selStart.row+rowDelta), col: priv.selStart.col+colDelta});
				if(td.length) {
					selection.setRangeStart(td);
				}
			},
			
			/**
			 * Returns true if currently there is a selection on screen, false otherwise
			 */
			isSelected: function() {
				var selEnd = selection.end();
				if(!selEnd || selEnd.row === _undefined) {
					return false;
				}
				return true;
			},
			
			/**
			 * Deselects all selected cells
			 */
			deselect: function() {
				if(!selection.isSelected()) {
					return;
				}
				if(priv.isCellEdited) {
					editproxy.finishEditing();
				}
				highlight.off();
				selection.end(false);
			},
			
			/**
			 * Deletes data from selected cells
			 */
			empty: function() {
				if(!selection.isSelected()) {
					return;
				}
				var tds, i, ilen;
				tds = grid.getCellsAtCoords(priv.selStart, selection.end());
				for(i=0, ilen=tds.length; i<ilen; i++) {
					tds[i].html('');
				}
				highlight.on();
			}
		};
		
		var highlight = {
			/**
			 * Create highlight border
			 */
			 init: function() {
				priv.selectionArea = {
					top: $("<div class='selectionArea'>").css({position: 'absolute', height: 2}),
					left: $("<div class='selectionArea'>").css({position: 'absolute', width: 2}),
					bottom: $("<div class='selectionArea'>").css({position: 'absolute', height: 2}),
					right: $("<div class='selectionArea'>").css({position: 'absolute', width: 2})
				};
				container.append(priv.selectionArea.top);
				container.append(priv.selectionArea.left);
				container.append(priv.selectionArea.bottom);
				container.append(priv.selectionArea.right);
			 },
			 
			/**
			 * Show border around selected cells
			 */
			 on: function() {
				if(!selection.isSelected()) {
					return false;
				}
				var tds, i, ilen;
				tds = grid.getCellsAtCoords(priv.selStart, selection.end());
				for(i=0, ilen=tds.length; i<ilen; i++) {
					tds[i].addClass('selected');
				}
				grid.getCellAtCoords(priv.selStart).removeClass('selected');
				
				var last = tds[tds.length-1];
				var firstOffset = tds[0].offset();
				var lastOffset = last.offset();
				var containerOffset = last.parent().parent().offset();
				
				
				var top = firstOffset.top-containerOffset.top-1;
				var left = firstOffset.left-containerOffset.left-1;
				var height = lastOffset.top-firstOffset.top+last.height()+5;
				var width = lastOffset.left-firstOffset.left+last.width()+5;
				priv.selectionArea.top.css({
					top: top,
					left: left,
					width: width
				}).show();
				priv.selectionArea.left.css({
					top: top,
					left: left,
					height: height
				}).show();
				priv.selectionArea.bottom.css({
					top: top+height,
					left: left,
					width: width
				}).show();
				priv.selectionArea.right.css({
					top: top,
					left: left+width,
					height: height+2
				}).show();
			 },
			
			/**
			 * Hide border around selected cells
			 */
			 off: function() {
				if(!selection.isSelected()) {
					return false;
				}
				var tds, i, ilen;
				tds = grid.getCellsAtCoords(priv.selStart, selection.end());
				for(i=0, ilen=tds.length; i<ilen; i++) {
					tds[i].removeClass('selected');
				}
				priv.selectionArea.top.hide();
				priv.selectionArea.left.hide();
				priv.selectionArea.bottom.hide();
				priv.selectionArea.right.hide();
			 }
		};
		
		var keyboard = {
			/**
			 * Parse paste input
			 * @param {String} input
			 * @return {Array} 2d array
			 */
			parsePasteInput: function(input) {
				var rows = [], r, rlen;
				
				if(input.indexOf("\t")) { //Excel format
					
					rows = input.split("\n");
					if(rows[rows.length-1] === '') {
						rows.pop();
					}
					for(r=0, rlen=rows.length; r<rlen; r++) {
						rows[r] = rows[r].split("\t");
					}
				}
				return rows;
			}
		};
		
		var editproxy = {
			/**
			 * Create input field
			 */
			init: function() {
				priv.editProxy = $('<textarea class="editInput">').css({
					position: 'absolute',
					opacity: 0
				});
				priv.editProxy.bind('paste',function(event){
					editproxy.finishEditing(event);
					setTimeout(function(){
						var input = priv.editProxy.val();
						var inputArray = keyboard.parsePasteInput(input);
						var endTd = grid.populateFromArray(priv.selStart, inputArray);
						selection.setRangeEnd(endTd);
					}, 100);
				});
				priv.editProxy.bind('keydown',function(event){
					if(selection.isSelected()) {
						switch(event.keyCode) {						
							case 38: /* arrow up */
								editproxy.finishEditing(event);
								selection.transform(-1, 0);
								event.preventDefault();
								break;
								
							case 39: /* arrow right */
							case 9: /* tab */
								editproxy.finishEditing(event);
								selection.transform(0, 1);
								event.preventDefault();
								break;
								
							case 37: /* arrow left */
								editproxy.finishEditing(event);
								selection.transform(0, -1);
								event.preventDefault();
								break;
								
							case 8: /* backspace */
							case 46: /* delete */
								if(!priv.isCellEdited) {
									selection.empty(event);
									event.preventDefault();
								}
								break;
								
							case 13: /* return */
							case 40: /* arrow down */
								editproxy.finishEditing(event);
								selection.transform(1, 0);
								event.preventDefault();
								break;
								
							default:
								var length = priv.editProxy.val().length;
								if(length > 3) {
									priv.editProxy.width(25 + length * 8);
								}
								editproxy.beginEditing();
								break;
						}
					}
				});
				container.append(priv.editProxy);
			},
			
			/**
			 * Prepare text input to be displayed at given grid cell
			 */
			prepare: function(td) {
				var tdOffset = td.offset();
				var containerOffset = priv.editProxy.parent().offset();
				
				if(containerOffset && tdOffset) {
					priv.editProxy.css({
						top: (tdOffset.top-containerOffset.top)+'px',
						left: (tdOffset.left-containerOffset.left)+'px',
						width: td.width(),
						height: td.height(),
						opacity: 0
					}).val('').show();
				}

				setTimeout(function(){
					priv.editProxy.focus();
				}, 1);
			},
			
			/**
			 * Shows text input in grid cell
			 */
			beginEditing: function(event) {
				priv.isCellEdited = true;
				var td = grid.getCellAtCoords(priv.selStart);
				td.data("originalValue", td.html());
				priv.editProxy.css({
					opacity: 1
				});
			},
			
			/**
			 * Shows text input in grid cell
			 */
			finishEditing: function(event) {
				if(priv.isCellEdited) {
					priv.isCellEdited = false;
					var td = grid.getCellAtCoords(priv.selStart);
					var val = priv.editProxy.val();
					if(val !== td.data("originalValue")) {
						td.html( val );
						if(settings.onChange) {
							settings.onChange();
						}
					}
					
					priv.editProxy.css({
						opacity: 0
					}).val('');
					
					highlight.on();
				}
			}
		};
		
		function init(settings) {
			var r, c, table, tr, td;
			
			function onMouseDown() {
				priv.isMouseDown = true;
				selection.setRangeStart($(this));
			}
			function onMouseOver(event) {
				if(priv.isMouseDown) {
					selection.setRangeEnd($(this));
				}
				event.preventDefault();
				event.stopPropagation();
			}
			function onClick(event) {
				event.stopPropagation();
			}
			
			table = $('<table>');
			for(r=0; r < settings.rows; r++) {
				tr = $('<tr>');
				for(c=0; c < settings.cols; c++) {
					td = $('<td>');
					tr.append(td);
					td.bind('mousedown', onMouseDown);
					td.bind('mouseover', onMouseOver);
					td.bind('click', onClick);
				}
				table.append(tr);
			}
			
			container.append(table);
			highlight.init();
			editproxy.init();
			
			$(window).mouseup(function(){
				priv.isMouseDown = false;
			});
			$(window).click(function(){
				selection.deselect();
			});
		}
		
		/**
		 * Load data from array
		 * @public
		 * @param {Array} data
		 */
		this.loadData = function(data) {
			grid.clear();
			grid.populateFromArray({row: 0, col: 0}, data);
		};
		
		/**
		 * Return data as array
		 * @public
		 * @return {Array}
		 */
		this.getData = function() {
			return grid.getData();
		};
		
		init(settings);
	}

	var settings = {
		'rows': 5,
		'cols': 5
	};
  
	$.fn.handsontable = function(action, options) {
		var i, ilen, args, output;
		if(typeof action !== 'string') { //init
			options = action;
			return this.each(function() {
				var currentSettings = $.extend({}, settings);
				if (options) {
					$.extend(currentSettings, options);
				}
				var instance = new handsontable($(this), currentSettings);
				$(this).data("handsontable", instance);
			});
		}
		else {
			args = [];
			if(arguments.length > 1) {
				for(i = 1, ilen = arguments.length; i < ilen; i++) {
					args.push(arguments[i]);
				}
			}
			this.each(function() {
				output = $(this).data("handsontable")[action].apply(this, args);
			});
			return output;
		}
	};
	
})(jQuery);