describe('Walkontable viewport rows calculator', () => {
  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable');
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(100, 4);
  });

  afterEach(function() {
    this.$wrapper.remove();

    if (this.wotInstance) {
      this.wotInstance.destroy();
    }
  });

  describe('isVisibleInTrimmingContainer property', () => {
    it('Should be `true` if the entire table is in the viewport when checking for fully visible rows AND if the' +
      ' entire table except for the last column is in the viewport when checking for partially visible rows,' +
      ' `false` otherwise (table on top of the viewport)', async() => {
      spec().$wrapper.css({
        marginBottom: '10000px'
      });

      createDataArray(50, 50);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      const tableHeight = $(wt.wtTable.hider).height();
      const tableOffset = spec().$container.offset().top;

      {
        const calc = wt.wtViewport.createRowsCalculator(['rendered', 'partiallyVisible', 'fullyVisible']);

        expect(calc.getResultsFor('partiallyVisible').isVisibleInTrimmingContainer).toBe(true);
        expect(calc.getResultsFor('fullyVisible').isVisibleInTrimmingContainer).toBe(true);
        expect(calc.getResultsFor('rendered').isVisibleInTrimmingContainer).toBe(true);
      }

      window.scrollBy(0, Math.floor(tableOffset + (tableHeight / 2)));

      await sleep(100);

      {
        const calc = wt.wtViewport.createRowsCalculator(['rendered', 'partiallyVisible', 'fullyVisible']);

        expect(calc.getResultsFor('partiallyVisible').isVisibleInTrimmingContainer).toBe(true);
        expect(calc.getResultsFor('fullyVisible').isVisibleInTrimmingContainer).toBe(true);
        expect(calc.getResultsFor('rendered').isVisibleInTrimmingContainer).toBe(true);
      }

      window.scrollBy(0, Math.ceil((tableHeight / 2) - 1));

      await sleep(100);

      {
        const calc = wt.wtViewport.createRowsCalculator(['rendered', 'partiallyVisible', 'fullyVisible']);

        expect(calc.getResultsFor('partiallyVisible').isVisibleInTrimmingContainer).toBe(true);
        expect(calc.getResultsFor('fullyVisible').isVisibleInTrimmingContainer).toBe(false);
        expect(calc.getResultsFor('rendered').isVisibleInTrimmingContainer).toBe(true);
      }

      window.scrollBy(0, 1);

      await sleep(100);

      {
        const calc = wt.wtViewport.createRowsCalculator(['rendered', 'partiallyVisible', 'fullyVisible']);

        expect(calc.getResultsFor('partiallyVisible').isVisibleInTrimmingContainer).toBe(false);
        expect(calc.getResultsFor('fullyVisible').isVisibleInTrimmingContainer).toBe(false);
        expect(calc.getResultsFor('rendered').isVisibleInTrimmingContainer).toBe(false);
      }

      window.scrollBy(0, 1000);

      await sleep(100);

      {
        const calc = wt.wtViewport.createRowsCalculator(['rendered', 'partiallyVisible', 'fullyVisible']);

        expect(calc.getResultsFor('partiallyVisible').isVisibleInTrimmingContainer).toBe(false);
        expect(calc.getResultsFor('fullyVisible').isVisibleInTrimmingContainer).toBe(false);
        expect(calc.getResultsFor('rendered').isVisibleInTrimmingContainer).toBe(false);
      }
    });

    it('Should be `true` if the entire table is in the viewport,' +
      ' `false` otherwise (table on the bottom of the viewport)', async() => {
      spec().$wrapper.css({
        marginTop: '10000px'
      });

      createDataArray(50, 50);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      const tableHeight = $(wt.wtTable.hider).height();
      const tableOffset = spec().$container.offset().top;

      {
        const calc = wt.wtViewport.createRowsCalculator(['rendered', 'partiallyVisible', 'fullyVisible']);

        expect(calc.getResultsFor('partiallyVisible').isVisibleInTrimmingContainer).toBe(false);
        expect(calc.getResultsFor('fullyVisible').isVisibleInTrimmingContainer).toBe(false);
        expect(calc.getResultsFor('rendered').isVisibleInTrimmingContainer).toBe(false);
      }

      window.scrollBy(0, tableOffset - window.innerHeight + getScrollbarWidth() - 1);

      await sleep(100);

      {
        const calc = wt.wtViewport.createRowsCalculator(['rendered', 'partiallyVisible', 'fullyVisible']);

        expect(calc.getResultsFor('partiallyVisible').isVisibleInTrimmingContainer).toBe(false);
        expect(calc.getResultsFor('fullyVisible').isVisibleInTrimmingContainer).toBe(false);
        expect(calc.getResultsFor('rendered').isVisibleInTrimmingContainer).toBe(false);
      }

      window.scrollBy(0, 1);

      await sleep(100);

      {
        const calc = wt.wtViewport.createRowsCalculator(['rendered', 'partiallyVisible', 'fullyVisible']);

        expect(calc.getResultsFor('partiallyVisible').isVisibleInTrimmingContainer).toBe(true);
        expect(calc.getResultsFor('fullyVisible').isVisibleInTrimmingContainer).toBe(false);
        expect(calc.getResultsFor('rendered').isVisibleInTrimmingContainer).toBe(true);
      }

      window.scrollBy(0, tableHeight / 2);

      await sleep(100);

      {
        const calc = wt.wtViewport.createRowsCalculator(['rendered', 'partiallyVisible', 'fullyVisible']);

        expect(calc.getResultsFor('partiallyVisible').isVisibleInTrimmingContainer).toBe(true);
        expect(calc.getResultsFor('fullyVisible').isVisibleInTrimmingContainer).toBe(true);
        expect(calc.getResultsFor('rendered').isVisibleInTrimmingContainer).toBe(true);
      }

      window.scrollBy(0, tableHeight / 2);

      await sleep(100);

      {
        const calc = wt.wtViewport.createRowsCalculator(['rendered', 'partiallyVisible', 'fullyVisible']);

        expect(calc.getResultsFor('partiallyVisible').isVisibleInTrimmingContainer).toBe(true);
        expect(calc.getResultsFor('fullyVisible').isVisibleInTrimmingContainer).toBe(true);
        expect(calc.getResultsFor('rendered').isVisibleInTrimmingContainer).toBe(true);
      }
    });
  });
});
