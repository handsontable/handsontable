describe('Walkontable Border Renderer', () => {
  const debug = false;

  const THIN_GREEN_BORDER = { color: 'green', width: 1 };
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

  describe('should draw sharp corners', () => {
    it('should render 1px corner', () => {
      const wt = generateWalkontableWithSelection({
        left: THIN_GREEN_BORDER,
        top: THIN_GREEN_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49.5 23 49.5 47', 'M 49 23.5 100 23.5']);
    });

    it('should render 2px corner', () => {
      const wt = generateWalkontableWithSelection({
        left: MEDIUM_GREEN_BORDER,
        top: MEDIUM_GREEN_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 49 23 49 47', 'M 48 23 100 23']);
    });
  });
});
