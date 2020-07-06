describe('WalkontableOverlay', () => {
  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(200).height(200);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');

    createDataArray(50, 50);
  });

  afterEach(function() {
    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  it('cloned overlays have to have proper dimensions', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsLeft: 2,
      fixedRowsTop: 2,
      fixedRowsBottom: 2,
    });

    wt.draw();

    expect($(wt.wtTable.holder).width()).toBe(200);
    expect($(wt.wtTable.holder).height()).toBe(200);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).width()).toBe(185); // 200px - 15px scrollbar width
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.leftOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.leftOverlay.clone.wtTable.holder).height()).toBe(185);
    expect($(wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).width()).toBe(185);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).height()).toBe(47);
  });

  it('cloned overlays have to have proper positions', () => {
    createDataArray(5, 5);
    spec().$wrapper
      .css('overflow', '')
      .css('width', '')
      .css('height', '');

    // When margin is applied, the bottom overlay had a tendency to misalign.
    $(document.body).css('margin-top', 20);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsLeft: 2,
      fixedRowsTop: 2,
      fixedRowsBottom: 2,
    });

    wt.draw();

    const getTableRect = (wtTable) => {
      const rect = wtTable.holder.getBoundingClientRect();

      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
      };
    };

    const baseRect = getTableRect(wt.wtTable);

    expect(baseRect).toEqual(jasmine.objectContaining({
      top: 100,
      bottom: 216,
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.topOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 100,
      bottom: 147,
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.topLeftCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 100,
      bottom: 147,
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.leftOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 100,
      bottom: 216,
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 169,
      bottom: 216,
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.bottomOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 169,
      bottom: 216,
      left: 8,
    }));
  });
});
