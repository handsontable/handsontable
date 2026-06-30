describe('WalkontableTable', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(200).height(200);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore');
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(5, 4);
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  describe('createHolder()', () => {
    it('should assign "ht_master handsontable" classes to the master overlay ' +
       'when the table element is attached to the current document', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      await wt.draw();

      expect(spec().$wrapper.find('.ht_master').length).toBe(1);
      expect(spec().$wrapper.find('.ht_master.handsontable').length).toBe(1);
    });

    describe('cross-frame rendering', () => {
      // The Handsontable JS bundle runs in the parent window's context, so
      // `HTMLElement` refers to the parent frame's constructor. When HoT is
      // mounted inside an <iframe> (e.g. via React portals), the table element
      // is owned by the iframe's document.  `element instanceof HTMLElement`
      // returns false for those elements, so the fix uses `isHTMLElement()`,
      // which checks `element instanceof element.ownerDocument.defaultView.Element`.

      let iframe = null;

      beforeEach(() => {
        iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
      });

      afterEach(() => {
        // Destroy before removing the iframe so destroy() still has valid DOM refs.
        spec().wotInstance.destroy();

        iframe.remove();
        iframe = null;

        // Prevent the outer afterEach from calling destroy() a second time.
        spec().wotInstance = { destroy: () => {} };
      });

      it('should assign "ht_master handsontable" classes to the master overlay ' +
         'when Walkontable is initialized with a table element owned by a cross-frame document', async() => {
        const iframeDoc = iframe.contentDocument;
        const container = iframeDoc.createElement('div');
        const table = iframeDoc.createElement('table');

        table.className = 'htCore';
        container.appendChild(table);
        iframeDoc.body.appendChild(container);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
        }, table);

        await wt.draw();

        const masterOverlay = iframeDoc.querySelector('.ht_master');

        expect(masterOverlay).not.toBe(null);
        expect(masterOverlay.classList.contains('ht_master')).toBe(true);
        expect(masterOverlay.classList.contains('handsontable')).toBe(true);
      });
    });
  });
});
