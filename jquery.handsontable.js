/**
 * Handsontable is a simple jQuery plugin for editable tables with basic copy-paste compatibility with Excel and Google Docs
 *
 * Copyright 2011, Marcin Warpechowski
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://warpech.github.com/jquery-handsontable/
 */
(function($){

	function handsontable(container, settings) {
		var _undefined = (function(){}());

		var priv = {
			isMouseOverTable: false,
			isMouseDown: false,
			isCellEdited: false,
			selStart: null,
			selEnd: null,
			editProxy: false,
			table: null
		};
		
		var grid = {
			/**
			 * Creates row at the bottom
			 */
			createRow: function(){
				var tr, td, c;
				tr = $('<tr>');
				for(c=0; c < settings.cols; c++) {
					td = $('<td>');
					tr.append(td);
					td.bind('mousedown', interaction.onMouseDown);
					td.bind('mouseover', interaction.onMouseOver);
				}
				priv.table.append(tr);
			},
			
			/**
			 * Makes sure there are empty rows at the bottom of the table
			 */
			keepEmptyRows: function(){
				if(!settings.keepSpareRows) {
					return;
				}
				var trs, tds, r, c, clen, emptyRows = 0, trslen;
				trs = priv.table.find('tr');
				trslen = trs.length;
				rows : for(r=trslen - 1; r>=0; r--) {
					tds = $(trs[r]).find('td');
					cols : for(c=0, clen=tds.length; c<clen; c++) {
						if(tds[c].innerHTML !== '') {
							break rows;
						}
					}
					emptyRows++;
				}
				if(emptyRows < settings.keepSpareRows) {
					for(; emptyRows<settings.keepSpareRows; emptyRows++) {
						grid.createRow();
					}
				}
				else if(emptyRows > settings.keepSpareRows) {
					r = Math.min(emptyRows - settings.keepSpareRows, trslen - settings.rows);
					if(r > 0) {
						trs.slice(-r).remove(); //slices last n rows from table and removes them
						//if selection is outside, move selection to last row
						if(priv.selStart.row > trslen - r - 1) {
							priv.selStart.row = trslen - r - 1;
							if(priv.selEnd.row > priv.selStart.row) {
								priv.selEnd.row = priv.selStart.row;
							}
							highlight.on();
						}
						else if(priv.selEnd.row > trslen - r - 1) {
							priv.selEnd.row = trslen - r - 1;
							if(priv.selStart.row > priv.selEnd.row) {
								priv.selStart.row = priv.selEnd.row;
							}
							highlight.on();
						}
					}					
				}
			},
			
			/**
			 * Populate cells at position with 2d array
			 * @param {Object} start Start selection position
			 * @param {Array} input 2d array
			 * @return {Object} ending td in pasted area
			 */
			populateFromArray: function(start, input) {
				var r, rlen, c, clen, td, endTd, changes = [];
				rlen = input.length;
				if(rlen === 0) {
					return;
				}
				for(r = 0; r < rlen; r++) {
					if(input[r]) {
						clen = input[r].length;
						for(c = 0; c < clen; c++) {
							if(input[r][c] !== null && input[r][c] !== "") {
								td = grid.getCellAtCoords({row: start.row+r, col: start.col+c});
								if(td) {
									changes.push([start.row+r, start.col+c, td.html(), input[r][c]]);
									td.html(input[r][c]);
									endTd = td;
								}
							}
						}
					}
				}
				if(settings.onChange && changes.length) {
					settings.onChange(changes);
				}
				grid.keepEmptyRows();
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
			 * @param {Object} start (Optional) Start selection position
			 * @param {Object} end (Optional) End selection position
			 * @return {Array}
			 */
			getData: function(start, end) {
				var tds, td, i, ilen, col, row, data = [], r, rlen, c, clen;
				if(start) {
					tds = grid.getCellsAtCoords(start, end);
				}
				else {
					tds = grid.getAllCells();
				}
				var outRow = -1;
				var outCol;
				var lastRow = -1;
				var lastCol = -1;
				for(i=0, ilen=tds.length; i<ilen; i++) {
					td = tds[i];
					col = td.index();
					row = td.parent().index();
					if(row !== lastRow) {
						outCol = 0;
						outRow++;
						data[outRow] = [];
						lastRow = row;
					}
					data[outRow][outCol] = td.html();
					outCol++;
				};
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
			 * Return data as text (tab separated columns)
			 * @param {Object} start (Optional) Start selection position
			 * @param {Object} end (Optional) End selection position
			 * @return {String}
			 */
			getText: function(start, end) {
				var data = grid.getData.apply(this, arguments), text = '';
				for(var r=0, rlen=data.length; r<rlen; r++) {
					for(var c=0, clen=data[r].length; c<clen; c++) {
						if(c > 0) {
							text += "\t";
						}
						text += data[r][c];
					}
					text += "\n";
				}
				return text;
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
				if(!end) {
					return grid.getCellAtCoords(start, end);
				}
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
				selection.setRangeEnd(td);
				editproxy.prepare(td);
				highlight.on();
			},
			
			/**
			 * Ends selection range on given td object
			 */
			setRangeEnd: function(td) {
				selection.deselect();
				selection.end(td);
				editproxy.prepare(td);
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
			transformStart: function(rowDelta, colDelta) {
				var td = grid.getCellAtCoords({row: (priv.selStart.row+rowDelta), col: priv.selStart.col+colDelta});
				if(td.length) {
					selection.setRangeStart(td);
				}
			},
			
			/**
			 * Sets selection end cell relative to current selection end cell (if possible)
			 */
			transformEnd: function(rowDelta, colDelta) {
				var td = grid.getCellAtCoords({row: (priv.selEnd.row+rowDelta), col: priv.selEnd.col+colDelta});
				if(td.length) {
					selection.setRangeEnd(td);
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
				var tds, i, ilen, changes = [], coords;
				tds = grid.getCellsAtCoords(priv.selStart, selection.end());
				for(i=0, ilen=tds.length; i<ilen; i++) {
					var old = tds[i].html();
					if(old !== '') {
						tds[i].html('');
						coords = grid.getCellCoords(tds[i]);
						changes.push([coords.row, coords.col, old, '']);
					}
				}
				highlight.on();
				if(settings.onChange && changes.length) {
					settings.onChange(changes);
				}
				grid.keepEmptyRows();
			}
		};
		
		var highlight = {
			/**
			 * Create highlight border
			 */
			 init: function() {
				priv.selectionArea = {
					top: $("<div class='selectionArea' style='display: none; position: absolute; height: 2px'>"),
					left: $("<div class='selectionArea' style='display: none; position: absolute; width: 2px'>"),
					bottom: $("<div class='selectionArea' style='display: none; position: absolute; height: 2px'>"),
					right: $("<div class='selectionArea' style='display: none; position: absolute; width: 2px'>")
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
				
				
				var top = (firstOffset.top-containerOffset.top || 1)-1;
				var left = (firstOffset.left-containerOffset.left || 1)-1;
				var height = lastOffset.top-firstOffset.top+last.innerHeight();
				var width = lastOffset.left-firstOffset.left+last.innerWidth();
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
				
				function onClick(event) {
					event.stopPropagation();
				}
				
				function onDblClick(event) {
					editproxy.beginEditing(event, true);
				}
				
				function onPaste(event) {
					editproxy.finishEditing(event);
					setTimeout(function(){
						var input = priv.editProxy.val();
						var inputArray = keyboard.parsePasteInput(input);
						var endTd = grid.populateFromArray(priv.selStart, inputArray);
						selection.setRangeEnd(endTd);
					}, 100);
				};
				
				function onKeyDown(event) {
					if(selection.isSelected()) {
						if((event.keyCode >= 48 && event.keyCode <= 57) //0-9
						||(event.keyCode >= 96 && event.keyCode <= 111)  //numpad
						||(event.keyCode >= 65 && event.keyCode <= 90)) { //a-z 
							/* alphanumeric */
							if(!event.ctrlKey) { //disregard CTRL-key shortcuts
								editproxy.beginEditing();
							}
							return;
						}
						
						switch(event.keyCode) {						
							case 38: /* arrow up */
								if(event.shiftKey) {
									selection.transformEnd(-1, 0);
								}
								else {
									editproxy.finishEditing(event);
									selection.transformStart(-1, 0);
								}
								event.preventDefault();
								break;
								
							case 39: /* arrow right */
							case 9: /* tab */
								if(event.shiftKey) {
									selection.transformEnd(0, 1);
								}
								else {
									editproxy.finishEditing(event);
									selection.transformStart(0, 1);
								}
								event.preventDefault();
								break;
								
							case 37: /* arrow left */
								if(event.shiftKey) {
									selection.transformEnd(0, -1);
								}
								else {
									editproxy.finishEditing(event);
									selection.transformStart(0, -1);
								}
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
								if(event.keyCode === 13 && !priv.isCellEdited) {
									editproxy.beginEditing(event, true); //show edit field
									event.preventDefault(); //don't add newline to field
								}
								else {
									if(event.shiftKey) {
										selection.transformEnd(1, 0);
									}
									else {
										editproxy.finishEditing(event);
										selection.transformStart(1, 0);
									}
									event.preventDefault();
								}
								break;
								
							case 16: /* shift */
							case 17: /* ctrl */
							case 18: /* alt */
							case 9: /* tab */
								break;
								
							default:								
								break;
						}
					}
				};
				
				priv.editProxy.bind('click', onClick);
				priv.editProxy.bind('dblclick', onDblClick);
				priv.editProxy.bind('paste', onPaste);
				priv.editProxy.bind('keydown', onKeyDown);
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
						top: (tdOffset.top-containerOffset.top)-100+'px',
						left: (tdOffset.left-containerOffset.left)+'px',
						width: td.width(),
						height: td.height(),
						opacity: 0
					}).val(grid.getText(priv.selStart, priv.selEnd)).show();
				}

				setTimeout(editproxy.focus, 1);
			},
			
			/**
			 * Sets focus to textarea
			 */
			focus: function() {
				priv.editProxy[0].select();
			},
			
			/**
			 * Shows text input in grid cell
			 * @param event {Object}
			 * @param useOriginalValue {Boolean}
			 */
			beginEditing: function(event, useOriginalValue) {
				if(priv.isCellEdited) {
					return;
				}
				priv.isCellEdited = true;
				var td = grid.getCellAtCoords(priv.selStart);
				priv.editProxy.width(td.width() * 1.5);
				priv.editProxy.height(td.height());
				td.data("originalValue", td.html());
				priv.editProxy.css({
					top: parseInt(priv.editProxy.css('top'))+100+'px', //revert position from prepare()
					opacity: 1
				});
				if(useOriginalValue){
					priv.editProxy.val(td.data("originalValue"));
				}
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
							settings.onChange([[priv.selStart.row, priv.selStart.col, td.data("originalValue"), val]]);
						}
						grid.keepEmptyRows();
					}
					
					priv.editProxy.css({
						opacity: 0
					}).val('');
					
					highlight.on();
				}
			}
		};
		
		var interaction = {
			onMouseDown: function(event) {
				priv.isMouseDown = true;
				selection.setRangeStart($(this));
			},
			
			onMouseOver: function(event) {
				if(priv.isMouseDown) {
					selection.setRangeEnd($(this));
				}
				//event.preventDefault();
				//event.stopPropagation();
			}
		}
		
		function init(settings) {
			var r, c, table, tr, td;
			
			function onMouseEnterTable(event) {
				priv.isMouseOverTable = true;
			}
				
			function onMouseLeaveTable(event) {
				priv.isMouseOverTable = false;
			}
			
			priv.table = $('<table>');
			for(r=0; r < settings.rows; r++) {
				grid.createRow();
			}
			
			container.append(priv.table);
			highlight.init();
			editproxy.init();
			
			priv.table.bind('mouseenter', onMouseEnterTable);
			priv.table.bind('mouseleave', onMouseLeaveTable);
			priv.editProxy.bind('mouseenter', onMouseEnterTable);
			priv.editProxy.bind('mouseleave', onMouseLeaveTable);
			
			function onMouseUp() {
				priv.isMouseDown = false;
			}
			
			function onOutsideClick() {
				setTimeout(function(){//do async so all mouseenter, mouseleave events will fire before
					if(!priv.isMouseOverTable){
						selection.deselect();
					}
				}, 1);
			}
			
			$("html").bind('mouseup', onMouseUp);
			$("html").bind('click', onOutsideClick);
		}
		
		/**
		 * Set data at given cell
		 * @public
		 * @param row {Number}
		 * @param col {Number}
		 * @param value {String}
		 */
		this.setDataAtCell = function(row, col, value) {
			var td = grid.getCellAtCoords({row: row, col: col});
			td.html(value);
			/*if(settings.onChange) {
				settings.onChange(); //this is empty by design, to avoid recursive changes in history
			}*/
		};
		
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