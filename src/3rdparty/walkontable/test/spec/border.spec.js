describe('Walkontable Border Renderer', () => {
  const debug = false;

  const THIN_GREEN_BORDER = { color: 'green', width: 1 };
  const THIN_GREEN_BORDER_HEX = { color: '#0F0', width: 1 };
  const THIN_GREEN_BORDER_RGB = { color: 'rgb(0%,   100%,   0%)', width: 1 }; // color contains spaces for additional complexity
  const THIN_RED_BORDER = { color: 'red', width: 1 };
  const MEDIUM_GREEN_BORDER = { color: 'green', width: 2 };
  const MEDIUM_RED_BORDER = { color: 'red', width: 2 };
  const THICK_GREEN_BORDER = { color: 'green', width: 3 };
  const THICK_RED_BORDER = { color: 'red', width: 3 };
  const HUGE_GREEN_BORDER = { color: 'green', width: 4 };
  const HUGE_RED_BORDER = { color: 'red', width: 4 };
  const GIGANTIC_GREEN_BORDER = { color: 'green', width: 5 };
  const EMPTY = { hide: true };

  function generateSelection(config) {
    const defaultConfig = {
      id: '',
      border: { width: 1, color: '#000', cornerVisible: false },
      top: EMPTY,
      right: EMPTY,
      bottom: EMPTY,
      left: EMPTY
    };
    return new Walkontable.Selection(Object.assign(defaultConfig, config));
  }

  function generateWalkontableWithSelection(selectionConfig) {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      selections: [
        generateSelection(selectionConfig).add(new Walkontable.CellCoords(1, 1))
      ]
    });

    return wt;
  }

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable');
    this.$container = $('<div></div>');
    this.$wrapper.width(100).height(100);
    this.$table = $('<table></table>').addClass('htCore');
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(4, 4);
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
      this.$wrapper.remove();
    }

    this.wotInstance.destroy();
  });

  describe('top', () => {
    it('should render 1px border', () => {
      const wt = generateWalkontableWithSelection({ top: THIN_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49 23.5 100 23.5']);
    });

    it('should render 2px border', () => {
      const wt = generateWalkontableWithSelection({ top: MEDIUM_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49 23 100 23']);
    });

    it('should render 3px border', () => {
      const wt = generateWalkontableWithSelection({ top: THICK_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49 23.5 100 23.5']);
    });

    it('should render 4px border', () => {
      const wt = generateWalkontableWithSelection({ top: HUGE_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49 23 100 23']);
    });

    it('should render 5px border', () => {
      const wt = generateWalkontableWithSelection({ top: GIGANTIC_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49 23.5 100 23.5']);
    });
  });

  describe('bottom', () => {
    it('should render 1px border', () => {
      const wt = generateWalkontableWithSelection({ bottom: THIN_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49 46.5 100 46.5']);
    });

    it('should render 2px border', () => {
      const wt = generateWalkontableWithSelection({ bottom: MEDIUM_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49 46 100 46']);
    });

    it('should render 3px border', () => {
      const wt = generateWalkontableWithSelection({ bottom: THICK_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49 46.5 100 46.5']);
    });

    it('should render 4px border', () => {
      const wt = generateWalkontableWithSelection({ bottom: HUGE_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49 46 100 46']);
    });

    it('should render 5px border', () => {
      const wt = generateWalkontableWithSelection({ bottom: GIGANTIC_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49 46.5 100 46.5']);
    });
  });

  describe('left', () => {
    it('should render 1px border', () => {
      const wt = generateWalkontableWithSelection({ left: THIN_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49.5 23 49.5 47']);
    });

    it('should render 2px border', () => {
      const wt = generateWalkontableWithSelection({ left: MEDIUM_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49 23 49 47']);
    });

    it('should render 3px border', () => {
      const wt = generateWalkontableWithSelection({ left: THICK_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49.5 23 49.5 47']);
    });

    it('should render 4px border', () => {
      const wt = generateWalkontableWithSelection({ left: HUGE_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49 23 49 47']);
    });

    it('should render 5px border', () => {
      const wt = generateWalkontableWithSelection({ left: GIGANTIC_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49.5 23 49.5 47']);
    });
  });

  describe('right', () => {
    it('should render 1px border', () => {
      const wt = generateWalkontableWithSelection({ right: THIN_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 99.5 23 99.5 47']);
    });

    it('should render 2px border', () => {
      const wt = generateWalkontableWithSelection({ right: MEDIUM_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 99 23 99 47']);
    });

    it('should render 3px border', () => {
      const wt = generateWalkontableWithSelection({ right: THICK_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 99.5 23 99.5 47']);
    });

    it('should render 4px border', () => {
      const wt = generateWalkontableWithSelection({ right: HUGE_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 99 23 99 47']);
    });

    it('should render 5px border', () => {
      const wt = generateWalkontableWithSelection({ right: GIGANTIC_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 99.5 23 99.5 47']);
    });
  });

  describe(`when vertical and horizontal line have the same width,
        the horizontal line should be on top and cover the tips of the vertical line`, () => {
    it('should render 1px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: THIN_GREEN_BORDER,
        right: THIN_GREEN_BORDER,
        top: THIN_RED_BORDER,
        bottom: THIN_RED_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 99.5 23 99.5 47 M 49.5 23 49.5 47', 'M 49 23.5 100 23.5 M 49 46.5 100 46.5']);
    });

    it('should render 2px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: MEDIUM_GREEN_BORDER,
        right: MEDIUM_GREEN_BORDER,
        top: MEDIUM_RED_BORDER,
        bottom: MEDIUM_RED_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 99 23 99 47 M 49 23 49 47', 'M 48 23 100 23 M 48 46 100 46']);
    });

    it('should render 3px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: THICK_GREEN_BORDER,
        right: THICK_GREEN_BORDER,
        top: THICK_RED_BORDER,
        bottom: THICK_RED_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 99.5 23 99.5 47 M 49.5 23 49.5 47', 'M 48 23.5 101 23.5 M 48 46.5 101 46.5']);
    });

    it('should render 4px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: HUGE_GREEN_BORDER,
        right: HUGE_GREEN_BORDER,
        top: HUGE_RED_BORDER,
        bottom: HUGE_RED_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 99 23 99 47 M 49 23 49 47', 'M 47 23 101 23 M 47 46 101 46']);
    });
  });

  describe(`when vertical line has a bigger width than the horizontal line,
        the vertical line should be on top and cover the tips of the horizontal line`, () => {
    it('should render 1px, 2px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: MEDIUM_GREEN_BORDER,
        right: MEDIUM_GREEN_BORDER,
        top: THIN_RED_BORDER,
        bottom: THIN_RED_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49 23.5 100 23.5 M 49 46.5 100 46.5', 'M 99 23 99 47 M 49 23 49 47']);
    });

    it('should render 2px, 3px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: THICK_GREEN_BORDER,
        right: THICK_GREEN_BORDER,
        top: MEDIUM_RED_BORDER,
        bottom: MEDIUM_RED_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49 23 100 23 M 49 46 100 46', 'M 99.5 22 99.5 47 M 49.5 22 49.5 47']);
    });

    it('should render 3px, 4px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: HUGE_GREEN_BORDER,
        right: HUGE_GREEN_BORDER,
        top: THICK_RED_BORDER,
        bottom: THICK_RED_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49 23.5 100 23.5 M 49 46.5 100 46.5', 'M 99 22 99 48 M 49 22 49 48']);
    });

    it('should render 4px, 5px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: GIGANTIC_GREEN_BORDER,
        right: GIGANTIC_GREEN_BORDER,
        top: HUGE_RED_BORDER,
        bottom: HUGE_RED_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49 23 100 23 M 49 46 100 46', 'M 99.5 21 99.5 48 M 49.5 21 49.5 48']);
    });
  });

  describe(`when horizontal line has a bigger width than the vertical line,
        the horizontal line should be on top and cover the tips of the vertical line`, () => {
    it('should render 2px, 1px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: THIN_RED_BORDER,
        right: THIN_RED_BORDER,
        top: MEDIUM_GREEN_BORDER,
        bottom: MEDIUM_GREEN_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 99.5 23 99.5 47 M 49.5 23 49.5 47', 'M 49 23 100 23 M 49 46 100 46']);
    });

    it('should render 3px, 2px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: MEDIUM_RED_BORDER,
        right: MEDIUM_RED_BORDER,
        top: THICK_GREEN_BORDER,
        bottom: THICK_GREEN_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 99 23 99 47 M 49 23 49 47', 'M 48 23.5 100 23.5 M 48 46.5 100 46.5']);
    });

    it('should render 4px, 3px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: THICK_RED_BORDER,
        right: THICK_RED_BORDER,
        top: HUGE_GREEN_BORDER,
        bottom: HUGE_GREEN_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 99.5 23 99.5 47 M 49.5 23 49.5 47', 'M 48 23 101 23 M 48 46 101 46']);
    });

    it('should render 5px, 4px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: HUGE_RED_BORDER,
        right: HUGE_RED_BORDER,
        top: GIGANTIC_GREEN_BORDER,
        bottom: GIGANTIC_GREEN_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 99 23 99 47 M 49 23 49 47', 'M 47 23.5 101 23.5 M 47 46.5 101 46.5']);
    });
  });

  describe('sharp corners', () => {
    it('should render 1px corner', () => {
      const wt = generateWalkontableWithSelection({
        left: THIN_GREEN_BORDER,
        top: THIN_RED_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49.5 23 49.5 47', 'M 49 23.5 100 23.5']);
    });

    it('should render 2px corner', () => {
      const wt = generateWalkontableWithSelection({
        left: MEDIUM_GREEN_BORDER,
        top: MEDIUM_RED_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49 23 49 47', 'M 48 23 100 23']);
    });
  });

  describe('row and column headers', () => {
    it('should render top and left edge on master if column and row headers are not present', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        selections: [
          generateSelection({
            left: THIN_GREEN_BORDER,
            right: MEDIUM_GREEN_BORDER,
            top: THICK_GREEN_BORDER,
            bottom: HUGE_GREEN_BORDER
          }).add(new Walkontable.CellCoords(0, 0))
        ]
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 0.5 0 0.5 24', 'M 49 0 49 24', 'M 0 0.5 50 0.5', 'M 0 23 50 23']);
      expect(getRenderedBorderStyles(spec().$wrapper[0])).toEqual(['1px solid green', '2px solid green', '3px solid green', '4px solid green']);
    });

    it('should not render top edge on master if column headers are present', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [(col, TH) => { TH.innerHTML = col; return undefined; }],
        selections: [
          generateSelection({
            left: THIN_GREEN_BORDER,
            right: MEDIUM_GREEN_BORDER,
            top: THICK_GREEN_BORDER,
            bottom: HUGE_GREEN_BORDER
          }).add(new Walkontable.CellCoords(0, 0))
        ]
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 0.5 24 0.5 47', 'M 49 24 49 47', 'M 0 46 50 46']);
      expect(getRenderedBorderStyles(spec().$wrapper[0])).toEqual(['1px solid green', '2px solid green', '4px solid green']);
    });

    it('should not render left edge on master if row headers are present', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [(row, TH) => { TH.innerHTML = row; return undefined; }],
        selections: [
          generateSelection({
            left: THIN_GREEN_BORDER,
            right: MEDIUM_GREEN_BORDER,
            top: THICK_GREEN_BORDER,
            bottom: HUGE_GREEN_BORDER
          }).add(new Walkontable.CellCoords(0, 0))
        ]
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 99 0 99 24', 'M 51 0.5 100 0.5', 'M 51 23 100 23']);
      expect(getRenderedBorderStyles(spec().$wrapper[0])).toEqual(['2px solid green', '3px solid green', '4px solid green']);
    });

    it('should not render top and left edge on master if row or column headers are present', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [(col, TH) => { TH.innerHTML = col; return undefined; }],
        rowHeaders: [(row, TH) => { TH.innerHTML = row; return undefined; }],
        selections: [
          generateSelection({
            left: THIN_GREEN_BORDER,
            right: MEDIUM_GREEN_BORDER,
            top: THICK_GREEN_BORDER,
            bottom: HUGE_GREEN_BORDER
          }).add(new Walkontable.CellCoords(0, 0))
        ]
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 99 24 99 47', 'M 51 46 100 46']);
      expect(getRenderedBorderStyles(spec().$wrapper[0])).toEqual(['2px solid green', '4px solid green']);

    });
  });

  describe('colors', () => {
    it('should correctly apply color expressed by keyword', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        selections: [
          generateSelection({
            left: THIN_GREEN_BORDER,
          }).add(new Walkontable.CellCoords(0, 0))
        ]
      });
      const expectedStrokeStyle = '1px solid green';

      wt.draw();
      expect(getRenderedBorderStyles(spec().$wrapper[0])).toEqual([expectedStrokeStyle]);

      const elem = document.querySelector(`svg path[data-stroke-style='${expectedStrokeStyle}']`);

      expect(elem.getAttribute('stroke')).toEqual('green');
    });

    it('should correctly apply color expressed by hex', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        selections: [
          generateSelection({
            left: THIN_GREEN_BORDER_HEX,
          }).add(new Walkontable.CellCoords(0, 0))
        ]
      });
      const expectedStrokeStyle = '1px solid #0F0';

      wt.draw();
      expect(getRenderedBorderStyles(spec().$wrapper[0])).toEqual([expectedStrokeStyle]);

      const elem = document.querySelector(`svg path[data-stroke-style='${expectedStrokeStyle}']`);

      expect(elem.getAttribute('stroke')).toEqual('#0F0');
    });

    it('should correctly apply color expressed by rgb()', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        selections: [
          generateSelection({
            left: THIN_GREEN_BORDER_RGB,
          }).add(new Walkontable.CellCoords(0, 0))
        ]
      });
      const expectedStrokeStyle = '1px solid rgb(0%,   100%,   0%)';

      wt.draw();
      expect(getRenderedBorderStyles(spec().$wrapper[0])).toEqual([expectedStrokeStyle]);

      const elem = document.querySelector(`svg path[data-stroke-style='${expectedStrokeStyle}']`);

      expect(elem.getAttribute('stroke')).toEqual('rgb(0%,   100%,   0%)');
    });
  });
});
