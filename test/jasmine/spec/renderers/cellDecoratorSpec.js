describe('CellDecorator', function () {
	var id = 'testContainer';

	beforeEach(function () {
		this.$container = $('<div id="' + id + '"></div>').appendTo('body');
	});

	afterEach(function () {
		if (this.$container) {
			destroy();
			this.$container.remove();
		}
	});

	var arrayOfObjects = function () {
		return [
		{id: 1, name: "Ted", lastName: "Right"},
		{id: 2, name: "Frank", lastName: "Honest"},
		{id: 3, name: "Joan", lastName: "Well"}
		];
	};

	it('should add an appropriate class name to every cell, if wordWrap=false is set to the whole table', function () {
		var hot = handsontable({
			data: arrayOfObjects(),
			columns: [
			{data: 'id'},
			{data: 'name'},
			{data: 'lastName'}
			],
			wordWrap: false
		});

		var cols = countCols(),
				rows = countRows();

		for(var i = 0; i < cols; i++) {
			for(var j = 0; j < rows; j++) {
				expect($(getCell(i,j)).hasClass(hot.getSettings().noWordWrapClassName)).toBe(true);
			}
		}
	});

	it('should add an appropriate class name to every cell in a column, if wordWrap=false is set to the column settings', function () {
		var hot = handsontable({
			data: arrayOfObjects(),
			columns: [
			{data: 'id'},
			{data: 'name', wordWrap: false},
			{data: 'lastName'}
			]
		});

		var rows = countRows();

		for(var i = 0; i < rows; i++) {
				expect($(getCell(i,1)).hasClass(hot.getSettings().noWordWrapClassName)).toBe(true);
		}

		for(var i = 0; i < rows; i++) {
				expect($(getCell(i,0)).hasClass(hot.getSettings().noWordWrapClassName)).toBe(false); // no class added to other columns
				expect($(getCell(i,2)).hasClass(hot.getSettings().noWordWrapClassName)).toBe(false);
		}
	});

	it('should add an appropriate class to a cell, if wordWrap=false is set to a single cell', function () {
		var hot = handsontable({
			data: arrayOfObjects(),
			columns: [
			{data: 'id'},
			{data: 'name'},
			{data: 'lastName'}
			]
		});

		expect($(getCell(1,1)).hasClass(hot.getSettings().noWordWrapClassName)).toBe(false);

		getCellMeta(1,1).wordWrap = false;
		render();

		expect($(getCell(1,1)).hasClass(hot.getSettings().noWordWrapClassName)).toBe(true);

	});

	it('should set "white-space" css parameter to "nowrap" if htNoWrap class is added to a cell', function () {
		var hot = handsontable({
			data: arrayOfObjects(),
			columns: [
			{data: 'id'},
			{data: 'name'},
			{data: 'lastName'}
			]
		});

		expect(window.getComputedStyle(getCell(1,1)).whiteSpace).toNotEqual("nowrap");

		getCellMeta(1,1).wordWrap = false;
		render();

		expect(window.getComputedStyle(getCell(1,1)).whiteSpace).toEqual("nowrap");

	});

});