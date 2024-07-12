describe('Walkontable.Selection', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(400).height(200);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(5, 5);
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  describe('"focus" selection type', () => {
    it('should highlight the cell', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getFocus().add(new Walkontable.CellCoords(1, 1));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   | # :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight the column header', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getFocus().add(new Walkontable.CellCoords(-1, 1));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   | # :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight the row header', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getFocus().add(new Walkontable.CellCoords(1, -1));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   : # ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight the corner', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getFocus().add(new Walkontable.CellCoords(-1, -1));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   : # ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight all cells and headers', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getFocus()
        .add(new Walkontable.CellCoords(-2, -2))
        .add(new Walkontable.CellCoords(4, 4));
      wt.draw();

      expect(`
        | # : # ║ # | # : # : # : # |
        | # : # ║ # | # : # : # : # |
        |===:===:===:===:===:===:===|
        | # : # ║ # | # : # : # : # |
        |---:---:---:---:---:---:---|
        | # : # ║ # | # : # : # : # |
        | # : # ║ # | # : # : # : # |
        | # : # ║ # | # : # : # : # |
        |---:---:---:---:---:---:---|
        | # : # ║ # | # : # : # : # |
        `).toBeMatchToSelectionPattern();
    });
  });

  describe('"fill" selection type', () => {
    it('should highlight the cell', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getFill().add(new Walkontable.CellCoords(1, 1));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   | F :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should not highlight the column header', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getFill().add(new Walkontable.CellCoords(-1, 1));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should not highlight the row header', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getFill().add(new Walkontable.CellCoords(1, -1));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should not highlight the corner', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getFill().add(new Walkontable.CellCoords(-1, -1));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight all cells only', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getFill()
        .add(new Walkontable.CellCoords(-2, -2))
        .add(new Walkontable.CellCoords(4, 4));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║ F | F : F : F : F |
        |---:---:---:---:---:---:---|
        |   :   ║ F | F : F : F : F |
        |   :   ║ F | F : F : F : F |
        |   :   ║ F | F : F : F : F |
        |---:---:---:---:---:---:---|
        |   :   ║ F | F : F : F : F |
        `).toBeMatchToSelectionPattern();
    });
  });

  describe('"area" selection type', () => {
    it('should highlight the cell', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getArea().add(new Walkontable.CellCoords(1, 1));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   | 0 :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should not highlight the column header', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getArea().add(new Walkontable.CellCoords(-1, 1));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should not highlight the row header', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getArea().add(new Walkontable.CellCoords(1, -1));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should not highlight the corner', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getArea().add(new Walkontable.CellCoords(-1, -1));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight all cells only', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getArea()
        .add(new Walkontable.CellCoords(-2, -2))
        .add(new Walkontable.CellCoords(4, 4));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║ 0 | 0 : 0 : 0 : 0 |
        |---:---:---:---:---:---:---|
        |   :   ║ 0 | 0 : 0 : 0 : 0 |
        |   :   ║ 0 | 0 : 0 : 0 : 0 |
        |   :   ║ 0 | 0 : 0 : 0 : 0 |
        |---:---:---:---:---:---:---|
        |   :   ║ 0 | 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();
    });

    it('should add more layers of the same type', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getArea()
        .add(new Walkontable.CellCoords(1, 1));
      selections.getArea()
        .add(new Walkontable.CellCoords(0, 0))
        .add(new Walkontable.CellCoords(2, 2));
      selections.getArea()
        .add(new Walkontable.CellCoords(4, 4))
        .add(new Walkontable.CellCoords(4, 2));
      selections.getArea()
        .add(new Walkontable.CellCoords(4, 4))
        .add(new Walkontable.CellCoords(1, 4));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║ 0 | 0 : 0 :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║ 0 | 1 : 0 :   : 0 |
        |   :   ║ 0 | 0 : 0 :   : 0 |
        |   :   ║   |   :   :   : 0 |
        |---:---:---:---:---:---:---|
        |   :   ║   |   : 0 : 0 : 1 |
        `).toBeMatchToSelectionPattern();
    });

    it('should draw intersected selections as many as there are overlapping highlights', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getArea()
        .add(new Walkontable.CellCoords(0, 0))
        .add(new Walkontable.CellCoords(4, 4));
      selections.getArea()
        .add(new Walkontable.CellCoords(0, 0))
        .add(new Walkontable.CellCoords(3, 3));
      selections.getArea()
        .add(new Walkontable.CellCoords(0, 0))
        .add(new Walkontable.CellCoords(2, 2));
      selections.getArea()
        .add(new Walkontable.CellCoords(0, 0))
        .add(new Walkontable.CellCoords(1, 1));
      selections.getArea()
        .add(new Walkontable.CellCoords(0, 0));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║ 4 | 3 : 2 : 1 : 0 |
        |---:---:---:---:---:---:---|
        |   :   ║ 3 | 3 : 2 : 1 : 0 |
        |   :   ║ 2 | 2 : 2 : 1 : 0 |
        |   :   ║ 1 | 1 : 1 : 1 : 0 |
        |---:---:---:---:---:---:---|
        |   :   ║ 0 | 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();
    });
  });

  describe('"header" selection type', () => {
    it('should highlight the row header', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getHeader().add(new Walkontable.CellCoords(1, -1));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   : - ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight multiple row headers', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getHeader()
        .add(new Walkontable.CellCoords(1, -1))
        .add(new Walkontable.CellCoords(4, -2));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        | - : - ║   |   :   :   :   |
        | - : - ║   |   :   :   :   |
        | - : - ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        | - : - ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight header in the corner', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getHeader().add(new Walkontable.CellCoords(-2, -2));
      wt.draw();

      expect(`
        | - :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight the column header', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getHeader().add(new Walkontable.CellCoords(-1, 1));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   | - :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight multiple column headers', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getHeader()
        .add(new Walkontable.CellCoords(-1, 1))
        .add(new Walkontable.CellCoords(-2, 4));
      wt.draw();

      expect(`
        |   :   ║   | - : - : - : - |
        |   :   ║   | - : - : - : - |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight all headers (cells should be untouched)', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getHeader()
        .add(new Walkontable.CellCoords(-2, -2))
        .add(new Walkontable.CellCoords(4, 4));
      wt.draw();

      expect(`
        | - : - ║ - | - : - : - : - |
        | - : - ║ - | - : - : - : - |
        |===:===:===:===:===:===:===|
        | - : - ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        | - : - ║   |   :   :   :   |
        | - : - ║   |   :   :   :   |
        | - : - ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        | - : - ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });
  });

  describe('"active-header" selection type', () => {
    it('should highlight the row header', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getActiveHeader().add(new Walkontable.CellCoords(1, -1));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   : * ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight multiple row headers', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getActiveHeader()
        .add(new Walkontable.CellCoords(1, -1))
        .add(new Walkontable.CellCoords(4, -2));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        | * : * ║   |   :   :   :   |
        | * : * ║   |   :   :   :   |
        | * : * ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        | * : * ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight header in the corner', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getActiveHeader().add(new Walkontable.CellCoords(-2, -2));
      wt.draw();

      expect(`
        | * :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight the column header', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getActiveHeader().add(new Walkontable.CellCoords(-1, 1));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   | * :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight multiple column headers', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getActiveHeader()
        .add(new Walkontable.CellCoords(-1, 1))
        .add(new Walkontable.CellCoords(-2, 4));
      wt.draw();

      expect(`
        |   :   ║   | * : * : * : * |
        |   :   ║   | * : * : * : * |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight all headers (cells should be untouched)', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getActiveHeader()
        .add(new Walkontable.CellCoords(-2, -2))
        .add(new Walkontable.CellCoords(4, 4));
      wt.draw();

      expect(`
        | * : * ║ * | * : * : * : * |
        | * : * ║ * | * : * : * : * |
        |===:===:===:===:===:===:===|
        | * : * ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        | * : * ║   |   :   :   :   |
        | * : * ║   |   :   :   :   |
        | * : * ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        | * : * ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });
  });

  describe('"row" selection type', () => {
    it('should highlight all cells in a row', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getRowHighlight().add(new Walkontable.CellCoords(1, 1));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║ r | r : r : r : r |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight all cells in a row including headers', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getRowHighlight()
        .add(new Walkontable.CellCoords(1, -2))
        .add(new Walkontable.CellCoords(2, 1));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        | r : r ║ r | r : r : r : r |
        | r : r ║ r | r : r : r : r |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight cells in a row by adding more layers', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getRowHighlight()
        .add(new Walkontable.CellCoords(1, -2))
        .add(new Walkontable.CellCoords(1, 1));
      selections.getRowHighlight()
        .add(new Walkontable.CellCoords(4, 4))
        .add(new Walkontable.CellCoords(4, 4));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        | r : r ║ r | r : r : r : r |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║ r | r : r : r : r |
        `).toBeMatchToSelectionPattern();
    });
  });

  describe('"column" selection type', () => {
    it('should highlight all cells in a row', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getColumnHighlight().add(new Walkontable.CellCoords(1, 1));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   | c :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   | c :   :   :   |
        |   :   ║   | c :   :   :   |
        |   :   ║   | c :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   | c :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight all cells in a row including headers', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getColumnHighlight()
        .add(new Walkontable.CellCoords(-2, 1))
        .add(new Walkontable.CellCoords(1, 2));
      wt.draw();

      expect(`
        |   :   ║   | c : c :   :   |
        |   :   ║   | c : c :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   | c : c :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   | c : c :   :   |
        |   :   ║   | c : c :   :   |
        |   :   ║   | c : c :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   | c : c :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should highlight cells in a row by adding more layers', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getColumnHighlight()
        .add(new Walkontable.CellCoords(-2, 1))
        .add(new Walkontable.CellCoords(1, 1));
      selections.getColumnHighlight()
        .add(new Walkontable.CellCoords(4, 4))
        .add(new Walkontable.CellCoords(4, 4));
      wt.draw();

      expect(`
        |   :   ║   | c :   :   :   |
        |   :   ║   | c :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   | c :   :   : c |
        |---:---:---:---:---:---:---|
        |   :   ║   | c :   :   : c |
        |   :   ║   | c :   :   : c |
        |   :   ║   | c :   :   : c |
        |---:---:---:---:---:---:---|
        |   :   ║   | c :   :   : c |
        `).toBeMatchToSelectionPattern();
    });
  });

  describe('unknown selection type', () => {
    it('should not highlights any cells or headers', () => {
      const selections = createSelectionController();
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row + 1; },
          (row, TH) => { TH.innerHTML = row + 1; },
        ],
        columnHeaders: [
          (column, TH) => { TH.innerHTML = column + 1; },
          (column, TH) => { TH.innerHTML = column + 1; },
        ],
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        fixedRowsBottom: 1,
        selections,
      });

      selections.getCustomHighlight()
        .add(new Walkontable.CellCoords(-2, -2))
        .add(new Walkontable.CellCoords(4, 4));
      wt.draw();

      expect(`
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |   :   ║   |   :   :   :   |
        |---:---:---:---:---:---:---|
        |   :   ║   |   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });
  });

  it('should draw all selection types at once without disturbing', () => {
    const selections = createSelectionController();
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [
        (row, TH) => { TH.innerHTML = row + 1; },
        (row, TH) => { TH.innerHTML = row + 1; },
      ],
      columnHeaders: [
        (column, TH) => { TH.innerHTML = column + 1; },
        (column, TH) => { TH.innerHTML = column + 1; },
      ],
      fixedRowsTop: 1,
      fixedColumnsStart: 1,
      fixedRowsBottom: 1,
      selections,
    });

    selections.getFocus()
      .add(new Walkontable.CellCoords(1, 1));
    selections.getArea()
      .add(new Walkontable.CellCoords(0, 0))
      .add(new Walkontable.CellCoords(2, 2));
    selections.getArea()
      .add(new Walkontable.CellCoords(2, 2))
      .add(new Walkontable.CellCoords(3, 4));
    selections.getHeader()
      .add(new Walkontable.CellCoords(-1, 0))
      .add(new Walkontable.CellCoords(-1, 2));
    selections.getHeader()
      .add(new Walkontable.CellCoords(0, -1))
      .add(new Walkontable.CellCoords(2, -1));
    selections.getActiveHeader()
      .add(new Walkontable.CellCoords(-2, 0))
      .add(new Walkontable.CellCoords(-2, 2));
    selections.getActiveHeader()
      .add(new Walkontable.CellCoords(0, -2))
      .add(new Walkontable.CellCoords(2, -2));
    selections.getRowHighlight()
      .add(new Walkontable.CellCoords(4, -1))
      .add(new Walkontable.CellCoords(4, 4));
    selections.getColumnHighlight()
      .add(new Walkontable.CellCoords(-1, 3))
      .add(new Walkontable.CellCoords(4, 3));
    wt.draw();

    expect(`
      |   :   ║ * | * : * :   :   |
      |   :   ║ - | - : - : c :   |
      |===:===:===:===:===:===:===|
      | * : - ║ 0 | 0 : 0 : c :   |
      |---:---:---:---:---:---:---|
      | * : - ║ 0 | A : 0 : c :   |
      | * : - ║ 0 | 0 : 1 : c : 0 |
      |   :   ║   |   : 0 : c : 0 |
      |---:---:---:---:---:---:---|
      |   : r ║ r | r : r : r : r |
      `).toBeMatchToSelectionPattern();
  });

  it('should create the area selection that does not flicker when the table is scrolled back and forth near its left edge (#8317)', async function() {
    spec().$wrapper.width(300).height(300);

    this.data = createSpreadsheetData(10, 10);

    const selections = createSelectionController();
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections,
      rowHeaders: [(row, TH) => {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [(col, TH) => {
        TH.innerHTML = col + 1;
      }],
    });

    const area1 = selections.getArea();

    area1.add(new Walkontable.CellCoords(0, 0));
    area1.add(new Walkontable.CellCoords(0, 2));
    area1.add(new Walkontable.CellCoords(2, 0));
    area1.add(new Walkontable.CellCoords(2, 2));

    const area2 = selections.getArea();

    area2.add(new Walkontable.CellCoords(2, 0));
    area2.add(new Walkontable.CellCoords(2, 2));
    area2.add(new Walkontable.CellCoords(4, 0));
    area2.add(new Walkontable.CellCoords(4, 2));

    wt.draw();

    wt.wtOverlays.inlineStartOverlay.setScrollPosition(1);

    await sleep(100);

    const tds = spec().$wrapper.find('td:contains(A2), td:contains(A3), td:contains(A4)');

    expect(tds.length).toBe(3);
    expect(tds[0].className).toBe('area');
    expect(tds[1].className).toBe('area area-1');
    expect(tds[2].className).toBe('area');

    wt.wtOverlays.inlineStartOverlay.setScrollPosition(0);

    await sleep(100);

    expect(tds.length).toBe(3);
    expect(tds[0].className).toBe('area');
    expect(tds[1].className).toBe('area area-1');
    expect(tds[2].className).toBe('area');
  });

  it('should not add class to selection until it is rerendered', () => {
    const selections = createSelectionController();
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections,
    });

    wt.draw();
    selections.getFocus().add(new Walkontable.CellCoords(0, 0));

    const $td1 = spec().$table.find('tbody td:eq(0)');

    expect($td1.hasClass('current')).toBe(false);

    wt.draw();

    expect($td1.hasClass('current')).toBe(true);
  });

  it('should add a selection that is outside of the viewport', () => {
    const selections = createSelectionController();
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections,
    });

    wt.draw();

    selections.getFocus().add(new Walkontable.CellCoords(20, 0));

    expect(wt.wtTable.getCoords(spec().$table.find('tbody tr:first td:first')[0]))
      .toEqual(new Walkontable.CellCoords(0, 0));
  });

  it('should not scroll the viewport after selection is cleared', () => {
    const scrollbarWidth = getScrollbarWidth(); // normalize viewport size disregarding of the scrollbar size on any OS

    spec().data = createSpreadsheetData(100, 4);
    spec().$wrapper.width(100 + scrollbarWidth).height(200 + scrollbarWidth);

    const selections = createSelectionController();
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections,
    });

    wt.draw();
    selections.getFocus().add(new Walkontable.CellCoords(0, 0));
    wt.draw();

    expect(wt.wtTable.getFirstVisibleRow()).toBe(0);

    wt.scrollViewportVertically(17);
    wt.draw();

    const expectedFirstVisibleRow = 10;

    expect(wt.wtTable.getFirstVisibleRow()).toBe(expectedFirstVisibleRow);
    expect(wt.wtTable.getLastVisibleRow()).toBeAroundValue(17);

    selections.getFocus().clear();

    expect(wt.wtTable.getFirstVisibleRow()).toBe(expectedFirstVisibleRow);
    expect(wt.wtTable.getLastVisibleRow()).toBeAroundValue(17);
  });

  it('should remove highlight when selection is cleared', () => {
    const selections = createSelectionController();
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections,
    });

    wt.draw();

    selections.getFocus()
      .add(new Walkontable.CellCoords(1, 1))
      .add(new Walkontable.CellCoords(2, 3));
    wt.draw();

    expect(`
      |   :   :   :   :   |
      |   : # : # : # :   |
      |   : # : # : # :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

    selections.getFocus().clear();
    wt.draw();

    expect(`
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });
});
