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
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
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
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50 23.5 101 23.5']);
    });

    it('should render 2px border', () => {
      const wt = generateWalkontableWithSelection({ top: MEDIUM_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50 23 101 23']);
    });

    it('should render 3px border', () => {
      const wt = generateWalkontableWithSelection({ top: THICK_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50 23.5 101 23.5']);
    });

    it('should render 4px border', () => {
      const wt = generateWalkontableWithSelection({ top: HUGE_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50 23 101 23']);
    });

    it('should render 5px border', () => {
      const wt = generateWalkontableWithSelection({ top: GIGANTIC_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50 23.5 101 23.5']);
    });
  });

  describe('bottom', () => {
    it('should render 1px border', () => {
      const wt = generateWalkontableWithSelection({ bottom: THIN_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50 46.5 101 46.5']);
    });

    it('should render 2px border', () => {
      const wt = generateWalkontableWithSelection({ bottom: MEDIUM_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50 46 101 46']);
    });

    it('should render 3px border', () => {
      const wt = generateWalkontableWithSelection({ bottom: THICK_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50 46.5 101 46.5']);
    });

    it('should render 4px border', () => {
      const wt = generateWalkontableWithSelection({ bottom: HUGE_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50 46 101 46']);
    });

    it('should render 5px border', () => {
      const wt = generateWalkontableWithSelection({ bottom: GIGANTIC_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50 46.5 101 46.5']);
    });
  });

  describe('left', () => {
    it('should render 1px border', () => {
      const wt = generateWalkontableWithSelection({ left: THIN_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50.5 23 50.5 47']);
    });

    it('should render 2px border', () => {
      const wt = generateWalkontableWithSelection({ left: MEDIUM_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50 23 50 47']);
    });

    it('should render 3px border', () => {
      const wt = generateWalkontableWithSelection({ left: THICK_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50.5 23 50.5 47']);
    });

    it('should render 4px border', () => {
      const wt = generateWalkontableWithSelection({ left: HUGE_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50 23 50 47']);
    });

    it('should render 5px border', () => {
      const wt = generateWalkontableWithSelection({ left: GIGANTIC_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50.5 23 50.5 47']);
    });
  });

  describe('right', () => {
    it('should render 1px border', () => {
      const wt = generateWalkontableWithSelection({ right: THIN_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 100.5 23 100.5 47']);
    });

    it('should render 2px border', () => {
      const wt = generateWalkontableWithSelection({ right: MEDIUM_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 100 23 100 47']);
    });

    it('should render 3px border', () => {
      const wt = generateWalkontableWithSelection({ right: THICK_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 100.5 23 100.5 47']);
    });

    it('should render 4px border', () => {
      const wt = generateWalkontableWithSelection({ right: HUGE_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 100 23 100 47']);
    });

    it('should render 5px border', () => {
      const wt = generateWalkontableWithSelection({ right: GIGANTIC_GREEN_BORDER });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 100.5 23 100.5 47']);
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
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 100.5 23 100.5 47 M 50.5 23 50.5 47', 'M 50 23.5 101 23.5 M 50 46.5 101 46.5']);
    });

    it('should render 2px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: MEDIUM_GREEN_BORDER,
        right: MEDIUM_GREEN_BORDER,
        top: MEDIUM_RED_BORDER,
        bottom: MEDIUM_RED_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 100 23 100 47 M 50 23 50 47', 'M 49 23 101 23 M 49 46 101 46']);
    });

    it('should render 3px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: THICK_GREEN_BORDER,
        right: THICK_GREEN_BORDER,
        top: THICK_RED_BORDER,
        bottom: THICK_RED_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 100.5 23 100.5 47 M 50.5 23 50.5 47', 'M 49 23.5 102 23.5 M 49 46.5 102 46.5']);
    });

    it('should render 4px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: HUGE_GREEN_BORDER,
        right: HUGE_GREEN_BORDER,
        top: HUGE_RED_BORDER,
        bottom: HUGE_RED_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 100 23 100 47 M 50 23 50 47', 'M 48 23 102 23 M 48 46 102 46']);
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
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50 23.5 101 23.5 M 50 46.5 101 46.5', 'M 100 23 100 47 M 50 23 50 47']);
    });

    it('should render 2px, 3px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: THICK_GREEN_BORDER,
        right: THICK_GREEN_BORDER,
        top: MEDIUM_RED_BORDER,
        bottom: MEDIUM_RED_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50 23 101 23 M 50 46 101 46', 'M 100.5 22 100.5 47 M 50.5 22 50.5 47']);
    });

    it('should render 3px, 4px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: HUGE_GREEN_BORDER,
        right: HUGE_GREEN_BORDER,
        top: THICK_RED_BORDER,
        bottom: THICK_RED_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50 23.5 101 23.5 M 50 46.5 101 46.5', 'M 100 22 100 48 M 50 22 50 48']);
    });

    it('should render 4px, 5px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: GIGANTIC_GREEN_BORDER,
        right: GIGANTIC_GREEN_BORDER,
        top: HUGE_RED_BORDER,
        bottom: HUGE_RED_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50 23 101 23 M 50 46 101 46', 'M 100.5 21 100.5 48 M 50.5 21 50.5 48']);
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
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 100.5 23 100.5 47 M 50.5 23 50.5 47', 'M 50 23 101 23 M 50 46 101 46']);
    });

    it('should render 3px, 2px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: MEDIUM_RED_BORDER,
        right: MEDIUM_RED_BORDER,
        top: THICK_GREEN_BORDER,
        bottom: THICK_GREEN_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 100 23 100 47 M 50 23 50 47', 'M 49 23.5 101 23.5 M 49 46.5 101 46.5']);
    });

    it('should render 4px, 3px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: THICK_RED_BORDER,
        right: THICK_RED_BORDER,
        top: HUGE_GREEN_BORDER,
        bottom: HUGE_GREEN_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 100.5 23 100.5 47 M 50.5 23 50.5 47', 'M 49 23 102 23 M 49 46 102 46']);
    });

    it('should render 5px, 4px borders', () => {
      const wt = generateWalkontableWithSelection({
        left: HUGE_RED_BORDER,
        right: HUGE_RED_BORDER,
        top: GIGANTIC_GREEN_BORDER,
        bottom: GIGANTIC_GREEN_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 100 23 100 47 M 50 23 50 47', 'M 48 23.5 102 23.5 M 48 46.5 102 46.5']);
    });
  });

  describe('sharp corners', () => {
    it('should render 1px corner', () => {
      const wt = generateWalkontableWithSelection({
        left: THIN_GREEN_BORDER,
        top: THIN_RED_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50.5 23 50.5 47', 'M 50 23.5 101 23.5']);
    });

    it('should render 2px corner', () => {
      const wt = generateWalkontableWithSelection({
        left: MEDIUM_GREEN_BORDER,
        top: MEDIUM_RED_BORDER
      });

      wt.draw();
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 50 23 50 47', 'M 49 23 101 23']);
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
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual(['M 0.5 0 0.5 24', 'M 50 0 50 24', 'M 0 0.5 51 0.5', 'M 0 23 51 23']);
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
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual([
        'M 0.5 23 0.5 47', 'M 50 23 50 47', 'M 0 23.5 51 23.5', 'M 0 46 51 46',
        'M -0.5 23 -0.5 48', 'M 50 23 50 48', 'M -1 23.5 51 23.5', 'M -1 47 51 47']);
      expect(getRenderedBorderStyles(spec().$wrapper[0])).toEqual([
        '1px solid green', '2px solid green', '3px solid green', '4px solid green',
        '1px solid green', '2px solid green', '3px solid green', '4px solid green']);
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
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual([
        'M 49.5 0 49.5 24', 'M 99 0 99 24', 'M 49 0.5 100 0.5', 'M 49 23 100 23',
        'M 49.5 0 49.5 24', 'M 99 0 99 24', 'M 49 0.5 100 0.5', 'M 49 23 100 23']);
      expect(getRenderedBorderStyles(spec().$wrapper[0])).toEqual([
        '1px solid green', '2px solid green', '3px solid green', '4px solid green',
        '1px solid green', '2px solid green', '3px solid green', '4px solid green']);
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
      expect(getRenderedBorderPaths(spec().$wrapper[0])).toEqual([
        'M 49.5 23 49.5 47', 'M 99 23 99 47', 'M 49 23.5 100 23.5', 'M 49 46 100 46',
        'M 49.5 23 49.5 48', 'M 99 23 99 48', 'M 49 23.5 100 23.5', 'M 49 47 100 47',
        'M 49.5 23 49.5 47', 'M 99 23 99 47', 'M 49 23.5 100 23.5', 'M 49 46 100 46',
        'M 49.5 23 49.5 48', 'M 99 23 99 48', 'M 49 23.5 100 23.5', 'M 49 47 100 47']);
      expect(getRenderedBorderStyles(spec().$wrapper[0])).toEqual([
        '1px solid green', '2px solid green', '3px solid green', '4px solid green',
        '1px solid green', '2px solid green', '3px solid green', '4px solid green',
        '1px solid green', '2px solid green', '3px solid green', '4px solid green',
        '1px solid green', '2px solid green', '3px solid green', '4px solid green']);

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

  describe('should render the overlapping fragment of the master column with the overlay', () => {
    it('should render overlapping fragment on left overlay after scroll, with container scrollbars', () => {
      createDataArray(100, 100);
      spec().$wrapper.width(300).height(100); // set grid sizing to large container

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsLeft: 2,
        selections: [
          generateSelection({
            left: THIN_GREEN_BORDER,
            right: MEDIUM_GREEN_BORDER,
            top: THICK_GREEN_BORDER,
            bottom: HUGE_GREEN_BORDER
          }).add(new Walkontable.CellCoords(0, 2))
        ]
      });

      wt.draw();

      const topBorderSelector = 'svg path[data-stroke-style=\'3px solid green\']';
      const topBorderExpectedPathInMaster = 'M 0 0.5 51 0.5'; // Master starts rendering from column 2
      const topBorderExpectedPathInLeft = 'M 100 0.5 151 0.5'; // Left Overlay starts rendering from column 0
      const pathInMaster = document.querySelector(`.ht_master ${topBorderSelector}`);
      const pathInLeftOverlay = document.querySelector(`.ht_clone_left ${topBorderSelector}`);

      expect(pathInMaster.getAttribute('d')).withContext('Master overlay top border of selection before scroll').toEqual(topBorderExpectedPathInMaster);
      expect(pathInLeftOverlay.getAttribute('d')).withContext('Left overlay top border of selection before scroll').toEqual(topBorderExpectedPathInLeft);

      wt.wtTable.holder.scrollLeft = 30;
      wt.draw();

      expect(pathInMaster.getAttribute('d')).withContext('Master overlay top border of selection after scroll').toEqual(topBorderExpectedPathInMaster);
      expect(pathInLeftOverlay.getAttribute('d')).withContext('Left overlay top border of selection after scroll').toEqual(topBorderExpectedPathInLeft);

      wt.wtTable.holder.scrollLeft = 0;
      wt.draw();

      expect(pathInMaster.getAttribute('d')).withContext('Master overlay top border of selection after scroll back').toEqual(topBorderExpectedPathInMaster);
      expect(pathInLeftOverlay.getAttribute('d')).withContext('Left overlay top border of selection after scroll back').toEqual(topBorderExpectedPathInLeft);
    });

    it('should render overlapping fragment on left overlay after scroll, with window scrollbars', () => {
      createDataArray(100, 100);
      spec().$wrapper[0].setAttribute('style', ''); // set grid sizing to window

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsLeft: 2,
        selections: [
          generateSelection({
            left: THIN_GREEN_BORDER,
            right: MEDIUM_GREEN_BORDER,
            top: THICK_GREEN_BORDER,
            bottom: HUGE_GREEN_BORDER
          }).add(new Walkontable.CellCoords(0, 2))
        ]
      });

      wt.draw();

      const topBorderSelector = 'svg path[data-stroke-style=\'3px solid green\']';
      const topBorderExpectedPathInMaster = 'M 0 0.5 51 0.5'; // Master starts rendering from column 2
      const topBorderExpectedPathInLeft = 'M 100 0.5 151 0.5'; // Left Overlay starts rendering from column 0
      const pathInMaster = document.querySelector(`.ht_master ${topBorderSelector}`);
      const pathInLeftOverlay = document.querySelector(`.ht_clone_left ${topBorderSelector}`);

      expect(pathInMaster.getAttribute('d')).withContext('Master overlay top border of selection before scroll').toEqual(topBorderExpectedPathInMaster);
      expect(pathInLeftOverlay.getAttribute('d')).withContext('Left overlay top border of selection before scroll').toEqual(topBorderExpectedPathInLeft);

      window.scroll(30, 0);
      wt.draw();

      expect(pathInMaster.getAttribute('d')).withContext('Master overlay top border of selection after scroll').toEqual(topBorderExpectedPathInMaster);
      expect(pathInLeftOverlay.getAttribute('d')).withContext('Left overlay top border of selection after scroll').toEqual(topBorderExpectedPathInLeft);

      window.scroll(0, 0);
      wt.draw();

      expect(pathInMaster.getAttribute('d')).withContext('Master overlay top border of selection after scroll back').toEqual(topBorderExpectedPathInMaster);

      expect(pathInLeftOverlay.getAttribute('d')).withContext('Left overlay top border of selection after scroll back').toEqual(topBorderExpectedPathInLeft);
    });
  });
});
