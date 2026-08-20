describe('NestedRows Collapsing UI', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('API', () => {
    describe('collapseChildren', () => {
      it('should collapse all children nodes of the row provided as a number', async() => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(rowIndexMapper().isTrimmed(i + 1)).toEqual(false);
        }

        plugin.collapsingUI.collapseChildren(0);

        expect(rowIndexMapper().isTrimmed(0)).toEqual(false);

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(rowIndexMapper().isTrimmed(i + 1)).toEqual(true);
        }

        expect(rowIndexMapper().isTrimmed(plugin.dataManager.countChildren(0) + 2)).toEqual(false);
      });

      it('should keep collapsed rows after collapsing next ones', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          rowHeaders: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapsingUI.collapseChildren(0);

        expect(rowIndexMapper().isTrimmed(0)).toEqual(false);
        expect(rowIndexMapper().isTrimmed(1)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(2)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(3)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(4)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(5)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(6)).toEqual(false);

        plugin.collapsingUI.collapseChildren(6);

        expect(rowIndexMapper().isTrimmed(0)).toEqual(false);
        expect(rowIndexMapper().isTrimmed(1)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(2)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(3)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(4)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(5)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(6)).toEqual(false);

        expect(rowIndexMapper().isTrimmed(6)).toEqual(false);
        expect(rowIndexMapper().isTrimmed(7)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(8)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(9)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(10)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(11)).toEqual(true);
        expect(rowIndexMapper().isTrimmed(12)).toEqual(false);
      });

      it('should collapse all children nodes of the row provided as an object', async() => {
        const sourceDataReference = getMoreComplexNestedData();

        handsontable({
          data: sourceDataReference,
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');
        const child = sourceDataReference[0];

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(rowIndexMapper().isTrimmed(i + 1)).toEqual(false);
        }

        plugin.collapsingUI.collapseChildren(child);

        expect(rowIndexMapper().isTrimmed(0)).toEqual(false);

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(rowIndexMapper().isTrimmed(i + 1)).toEqual(true);
        }

        expect(rowIndexMapper().isTrimmed(plugin.dataManager.countChildren(0) + 2)).toEqual(false);
      });
    });

    describe('expandChildren', () => {
      it('should collapse all children nodes of the row provided as a number', async() => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapsingUI.collapseChildren(0);
        plugin.collapsingUI.expandChildren(0);

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(rowIndexMapper().isTrimmed(i + 1)).toEqual(false);
        }
      });

      it('should collapse all children nodes of the row provided as an object', async() => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true,
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapsingUI.collapseChildren(0);
        plugin.collapsingUI.expandChildren(0);

        for (let i = 0; i < plugin.dataManager.countChildren(0); i++) {
          expect(rowIndexMapper().isTrimmed(i + 1)).toEqual(false);
        }
      });
    });

    describe('expandRows', () => {
      it('Should make the rows provided in the arguments visible', async() => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true,
          rowHeaders: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapsingUI.collapseRows([1, 2, 3, 4, 5], true, true);
        await render();

        expect(countRows()).toEqual(8);

        plugin.collapsingUI.expandRows([3], true, true);
        await render();

        await waitForNextAnimationFrames(2);

        expect(countRows()).toEqual(11);
      });
    });

    describe('expandChildren', () => {
      it('Should make the child rows of the provided element visible', async() => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapsingUI.collapseRows([4, 5], false, true);
        await render();

        expect(countRows()).toEqual(11);

        plugin.collapsingUI.expandChildren(3);
        await render();

        await waitForNextAnimationFrames(2);

        expect(countRows()).toEqual(13);
      });

      it('Should make the child rows of the provided element visible, even if some of them are already visible', async() => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapsingUI.collapseRows([4, 5], false, true);
        await render();

        expect(countRows()).toEqual(11);

        plugin.collapsingUI.expandChildren(0);
        await render();

        await waitForNextAnimationFrames(2);

        expect(countRows()).toEqual(13);
      });
    });

  });

  describe('public API', () => {
    describe('collapseParent / expandParent', () => {
      it('should collapse the children of the parent addressed by a visual row index', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        expect(plugin.collapseParent(0)).toBe(true);
        await render();

        expect(rowIndexMapper().isTrimmed(1)).toBe(true);
        expect(plugin.isParentCollapsed(0)).toBe(true);
      });

      it('should expand a collapsed parent again', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapseParent(0);
        await render();

        expect(plugin.expandParent(0)).toBe(true);
        await render();

        expect(rowIndexMapper().isTrimmed(1)).toBe(false);
        expect(plugin.isParentCollapsed(0)).toBe(false);
      });

      it('should return `false` and change nothing when the row is not a parent', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');
        const rowsBefore = countRows();

        // Row 1 is the first child of the first parent, so it has no children of its own.
        expect(plugin.collapseParent(1)).toBe(false);
        expect(plugin.getCollapsedParents()).toEqual([]);
        expect(countRows()).toBe(rowsBefore);
      });

      it('should return `false` when the parent is already in the requested state', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        expect(plugin.collapseParent(0)).toBe(true);
        expect(plugin.collapseParent(0)).toBe(false);
      });

      it('should record the physical index of the parent addressed by its visual index', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          rowHeaders: true
        });

        const plugin = getPlugin('nestedRows');
        // The second top-level parent sits at physical row 6 in the simpler fixture.
        const secondParentVisualRow = 6;

        expect(plugin.isParent(secondParentVisualRow)).toBe(true);
        expect(plugin.collapseParent(secondParentVisualRow)).toBe(true);

        expect(plugin.getCollapsedParents()).toEqual([toPhysicalRow(secondParentVisualRow)]);
      });

      it('should keep addressing the right parent once collapsing has shifted the visual indexes',
        async() => {
          handsontable({
            data: getSimplerNestedData(),
            nestedRows: true,
            rowHeaders: true
          });

          const plugin = getPlugin('nestedRows');

          // Collapsing the first parent trims its five children, so every parent below it moves up
          // by five visual rows while its physical index stays put. This is the only thing that makes
          // the two index types diverge here - a nested-rows move restructures the source data
          // instead of permuting indexes.
          plugin.collapseParent(0);
          await render();

          expect(toPhysicalRow(1)).toBe(6);
          expect(plugin.collapseParent(1)).toBe(true);

          expect(plugin.getCollapsedParents()).toEqual([0, 6]);
        });
    });

    describe('toggleParent', () => {
      it('should collapse an expanded parent and expand a collapsed one', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        expect(plugin.toggleParent(0)).toBe(true);
        expect(plugin.isParentCollapsed(0)).toBe(true);

        expect(plugin.toggleParent(0)).toBe(true);
        expect(plugin.isParentCollapsed(0)).toBe(false);
      });
    });

    describe('collapseAll / expandAll', () => {
      it('should collapse every top-level parent', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapseAll();
        await render();

        // Three top-level parents, all of their descendants hidden.
        expect(countRows()).toBe(3);
      });

      it('should expand every level, including a parent collapsed inside another one', async() => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');
        const allRows = countRows();

        // Collapse an inner parent first, then the outer one that contains it. In this fixture the
        // level-1 parent under row 0 sits at physical row 3.
        plugin.collapsingUI.collapseChildren(3);
        plugin.collapsingUI.collapseChildren(0);
        await render();

        expect(plugin.getCollapsedParents().length).toBe(2);

        plugin.expandAll();
        await render();

        expect(plugin.getCollapsedParents()).toEqual([]);
        expect(countRows()).toBe(allRows);
      });
    });

    describe('getCollapsedParents', () => {
      it('should return physical indexes, sorted ascending', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapseParent(6);
        plugin.collapseParent(0);

        expect(plugin.getCollapsedParents()).toEqual([0, 6]);
      });

      it('should still report a parent that is nested inside another collapsed parent', async() => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapsingUI.collapseChildren(3);
        plugin.collapsingUI.collapseChildren(0);
        await render();

        // Row 3 is trimmed now, so it has no visual index at all - the physical index is the only
        // way to express this part of the state.
        expect(toVisualRow(3)).toBe(null);
        expect(plugin.getCollapsedParents()).toContain(3);
      });
    });

    describe('structure reads', () => {
      it('should report the nesting level, the parent, and the child count', async() => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        expect(plugin.getRowLevel(0)).toBe(0);
        expect(plugin.isParent(0)).toBe(true);
        expect(plugin.getRowParent(0)).toBe(null);

        expect(plugin.getRowLevel(1)).toBe(1);
        expect(plugin.getRowParent(1)).toBe(0);

        expect(plugin.countChildren(0)).toBe(plugin.dataManager.getDataObject(0).__children.length);
        expect(plugin.countChildren(0, true)).toBe(plugin.dataManager.countChildren(0));
      });

      it('should return safe values for a row that does not exist', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        expect(plugin.getRowLevel(9999)).toBe(null);
        expect(plugin.isParent(9999)).toBe(false);
        expect(plugin.countChildren(9999)).toBe(0);
        expect(plugin.getRowParent(9999)).toBe(null);
        expect(plugin.isParentCollapsed(9999)).toBe(false);
      });

      it('should not report a row without children as collapsed', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        // Row 1 is the first child of the first parent, so it has no children of its own.
        // "Are all children collapsed" is vacuously true for such a row, so this needs its own guard.
        expect(plugin.isParent(1)).toBe(false);
        expect(plugin.isParentCollapsed(1)).toBe(false);
      });
    });

    describe('expandToRow', () => {
      it('should expand every ancestor so a hidden row becomes visible again', async() => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.collapseParent(0);
        await render();

        expect(toVisualRow(1)).toBe(null);

        expect(plugin.expandToRow(1)).toBe(true);
        await render();

        expect(toVisualRow(1)).not.toBe(null);
      });

      it('should return `false` when the row is already visible', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true
        });

        expect(getPlugin('nestedRows').expandToRow(1)).toBe(false);
      });
    });

    describe('expandToLevel', () => {
      it('should leave only the top-level rows visible for level 0', async() => {
        handsontable({
          data: getMoreComplexNestedData(),
          nestedRows: true
        });

        const plugin = getPlugin('nestedRows');

        plugin.expandToLevel(0);
        await render();

        getData().forEach((_, visualRow) => {
          expect(plugin.getRowLevel(visualRow)).toBe(0);
        });
      });
    });
  });

  describe('hooks', () => {
    it('should fire beforeRowCollapse and afterRowCollapse with the documented arguments', async() => {
      const beforeRowCollapse = jasmine.createSpy('beforeRowCollapse');
      const afterRowCollapse = jasmine.createSpy('afterRowCollapse');

      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        beforeRowCollapse,
        afterRowCollapse
      });

      getPlugin('nestedRows').collapseParent(0);

      expect(beforeRowCollapse).toHaveBeenCalledWith([], [0], true);
      expect(afterRowCollapse).toHaveBeenCalledWith([], [0], true, true);
    });

    it('should fire beforeRowExpand and afterRowExpand with the documented arguments', async() => {
      const beforeRowExpand = jasmine.createSpy('beforeRowExpand');
      const afterRowExpand = jasmine.createSpy('afterRowExpand');

      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        beforeRowExpand,
        afterRowExpand
      });

      const plugin = getPlugin('nestedRows');

      plugin.collapseParent(0);
      plugin.expandParent(0);

      expect(beforeRowExpand).toHaveBeenCalledWith([0], [], true);
      expect(afterRowExpand).toHaveBeenCalledWith([0], [], true, true);
    });

    it('should report `collapsePossible` as `false` when the row is not a parent', async() => {
      const beforeRowCollapse = jasmine.createSpy('beforeRowCollapse');
      const afterRowCollapse = jasmine.createSpy('afterRowCollapse');

      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        beforeRowCollapse,
        afterRowCollapse
      });

      getPlugin('nestedRows').collapseParent(1);

      expect(beforeRowCollapse).toHaveBeenCalledWith([], [], false);
      expect(afterRowCollapse).toHaveBeenCalledWith([], [], false, false);
    });

    it('should block the collapse when beforeRowCollapse returns false', async() => {
      const afterRowCollapse = jasmine.createSpy('afterRowCollapse');

      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        beforeRowCollapse: () => false,
        afterRowCollapse
      });

      const plugin = getPlugin('nestedRows');
      const rowsBefore = countRows();

      expect(plugin.collapseParent(0)).toBe(false);
      await render();

      expect(countRows()).toBe(rowsBefore);
      expect(plugin.getCollapsedParents()).toEqual([]);
      expect(afterRowCollapse).not.toHaveBeenCalled();
    });

    it('should block the expand when beforeRowExpand returns false', async() => {
      const afterRowExpand = jasmine.createSpy('afterRowExpand');
      let blockExpand = false;

      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        beforeRowExpand: () => !blockExpand,
        afterRowExpand
      });

      const plugin = getPlugin('nestedRows');

      plugin.collapseParent(0);
      blockExpand = true;

      expect(plugin.expandParent(0)).toBe(false);
      expect(plugin.isParentCollapsed(0)).toBe(true);
      expect(afterRowExpand).not.toHaveBeenCalled();
    });

    it('should fire the same hooks when the row header button is clicked', async() => {
      const afterRowCollapse = jasmine.createSpy('afterRowCollapse');

      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        rowHeaders: true,
        afterRowCollapse
      });

      $(getCell(0, -1)).find('.ht_nestingButton').simulate('mousedown');
      await render();

      expect(afterRowCollapse).toHaveBeenCalledWith([], [0], true, true);
    });
  });

  describe('state consistency', () => {
    it('should not drop another parent when expanding a row that is not collapsed', async() => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true
      });

      const plugin = getPlugin('nestedRows');

      plugin.collapseParent(0);
      await render();

      expect(plugin.getCollapsedParents()).toEqual([0]);

      // Collapsing the first parent trims its five children, so the second top-level parent
      // (physical row 6) is now at visual row 1. It is a parent, and it is NOT collapsed - expanding
      // it used to run `splice(-1, 1)`, which dropped the last tracked parent instead of doing
      // nothing.
      expect(toPhysicalRow(1)).toBe(6);
      plugin.expandParent(1);

      expect(plugin.getCollapsedParents()).toEqual([0]);
    });

    it('should not record a leaf row as a collapsed parent', async() => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true
      });

      const plugin = getPlugin('nestedRows');

      plugin.collapsingUI.collapseChildren(1);

      expect(plugin.getCollapsedParents()).toEqual([]);
    });

    it('should keep the collapsed rows collapsed after updateSettings', async() => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true
      });

      const plugin = getPlugin('nestedRows');

      plugin.collapseParent(0);
      await render();

      const rowsWhileCollapsed = countRows();

      await updateSettings({ nestedRows: true });

      expect(getPlugin('nestedRows').getCollapsedParents()).toEqual([0]);
      expect(countRows()).toBe(rowsWhileCollapsed);
    });
  });
});
