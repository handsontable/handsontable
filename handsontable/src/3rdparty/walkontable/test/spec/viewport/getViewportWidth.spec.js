describe('WalkontableViewport', () => {
  // const BODY_MARGIN = parseInt(getComputedStyle(document.body).margin, 10);
  const OUTER_WIDTH = 200;
  const OUTER_HEIGHT = 200;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(OUTER_WIDTH).height(OUTER_HEIGHT);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');

    createDataArray(200, 200);
  });

  afterEach(function() {
    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  describe('getViewportWidth()', () => {
    describe('with defined table size', () => {
      it('should return correct viewport width when there are no scrollbars', () => {
        createDataArray(6, 6);

        spec().$wrapper.width(300).height(139);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
        });

        wt.prepare();

        expect(wt.wtViewport.getViewportWidth()).toBe(300);

        wt.draw();

        expect(wt.wtViewport.getViewportWidth()).toBe(300);
      });

      it('should return viewport width excluding row headers width', () => {
        createDataArray(6, 6);

        spec().$wrapper.width(400).height(139);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
          rowHeaders: [
            (row, TH) => { TH.innerHTML = row; },
            (row, TH) => { TH.innerHTML = row; },
          ]
        });

        wt.prepare();

        expect(wt.wtViewport.getViewportWidth()).toBe(300);

        wt.draw();

        expect(wt.wtViewport.getViewportWidth()).toBe(300);
      });

      xit('should return viewport width including scrollbar width when there is vertical scrollbar', () => {
        createDataArray(6, 6);

        spec().$wrapper.width(250).height(139);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
        });

        wt.prepare();

        expect(wt.wtViewport.getViewportWidth()).toBe(250);

        wt.draw();

        expect(wt.wtViewport.getViewportWidth()).toBe(250);
      });
    });
  });
});
