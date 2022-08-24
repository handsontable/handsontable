describe('Walkontable.CellRange', () => {
  describe('getAll', () => {
    it('should get all cells in range', () => {
      const from = new Walkontable.CellCoords(1, 1);
      const to = new Walkontable.CellCoords(3, 3);
      const range = new Walkontable.CellRange(from, from, to);
      const all = range.getAll();

      expect(all.length).toBe(9);
      expect(all[0].row).toBe(from.row);
      expect(all[0].col).toBe(from.col);
      expect(all[1].row).toBe(1);
      expect(all[1].col).toBe(2);
      expect(all[8].row).toBe(to.row);
      expect(all[8].col).toBe(to.col);
    });

    it('should get all cells in range (reverse order)', () => {
      const from = new Walkontable.CellCoords(3, 3);
      const to = new Walkontable.CellCoords(1, 1);
      const range = new Walkontable.CellRange(from, from, to);
      const all = range.getAll();

      expect(all.length).toBe(9);
      expect(all[0].row).toBe(to.row);
      expect(all[0].col).toBe(to.col);
      expect(all[1].row).toBe(1);
      expect(all[1].col).toBe(2);
      expect(all[8].row).toBe(from.row);
      expect(all[8].col).toBe(from.col);
    });
  });

  describe('getInner', () => {
    it('should get cells in range excluding from and to', () => {
      const from = new Walkontable.CellCoords(1, 1);
      const to = new Walkontable.CellCoords(3, 3);
      const range = new Walkontable.CellRange(from, from, to);
      const inner = range.getInner();

      expect(inner.length).toBe(7);
      expect(inner[1].row).toBe(1);
      expect(inner[1].col).toBe(3);
    });

    it('should get cells in range excluding from and to (reverse order)', () => {
      const from = new Walkontable.CellCoords(3, 3);
      const to = new Walkontable.CellCoords(1, 1);
      const range = new Walkontable.CellRange(from, from, to);
      const inner = range.getInner();

      expect(inner.length).toBe(7);
      expect(inner[1].row).toBe(1);
      expect(inner[1].col).toBe(3);
    });
  });

  describe('includes', () => {
    it('should return true if range is a single cell and the same cell is given', () => {
      const from = new Walkontable.CellCoords(0, 0);
      const to = new Walkontable.CellCoords(0, 0);
      const range = new Walkontable.CellRange(from, from, to);

      expect(range.includes(new Walkontable.CellCoords(0, 0))).toBe(true);
    });

    it('should return true if given cell is within the range', () => {
      const from = new Walkontable.CellCoords(1, 1);
      const to = new Walkontable.CellCoords(3, 3);
      const range = new Walkontable.CellRange(from, from, to);

      expect(range.includes(new Walkontable.CellCoords(1, 1))).toBe(true);
      expect(range.includes(new Walkontable.CellCoords(3, 1))).toBe(true);
      expect(range.includes(new Walkontable.CellCoords(3, 3))).toBe(true);
      expect(range.includes(new Walkontable.CellCoords(1, 3))).toBe(true);
      expect(range.includes(new Walkontable.CellCoords(2, 2))).toBe(true);
      expect(range.includes(new Walkontable.CellCoords(1, 2))).toBe(true);
      expect(range.includes(new Walkontable.CellCoords(2, 1))).toBe(true);
    });

    it('should return false if given cell outside the range', () => {
      const from = new Walkontable.CellCoords(1, 1);
      const to = new Walkontable.CellCoords(3, 3);
      const range = new Walkontable.CellRange(from, from, to);

      expect(range.includes(new Walkontable.CellCoords(0, 0))).toBe(false);
      expect(range.includes(new Walkontable.CellCoords(4, 4))).toBe(false);
      expect(range.includes(new Walkontable.CellCoords(1, 4))).toBe(false);
      expect(range.includes(new Walkontable.CellCoords(4, 1))).toBe(false);
      expect(range.includes(new Walkontable.CellCoords(-1, -1))).toBe(false);
    });
  });

  describe('includesRange', () => {
    describe('B has more than one cell', () => {
      /*
       +----------+
       |  a       |
       | +------+ |
       | |    b | |
       | |      | |
       | +------+ |
       +----------+
       */
      it('B is included in A, none of borders touch each other', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(1, 1);
        const bBottomRight = new Walkontable.CellCoords(4, 4);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +----------+
       |  b       |
       | +------+ |
       | |   a  | |
       | |      | |
       | +------+ |
       +----------+
       */
      it('A is included in B, none of borders touch each other', () => {
        const aTopLeft = new Walkontable.CellCoords(1, 1);
        const aBottomRight = new Walkontable.CellCoords(4, 4);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 0);
        const bBottomRight = new Walkontable.CellCoords(5, 4);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(false);
      });

      /*
       +-----------+
       | a |   b | |
       |   |     | |
       |   +-----+ |
       +-----------+
       */
      it('B is included in A, top borders touch', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 1);
        const bBottomRight = new Walkontable.CellCoords(4, 4);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +---------+
       | a |   b |
       |   |     |
       |   +-----|
       |         |
       +---------+
       */
      it('B is included in A, top and right borders touch', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 1);
        const bBottomRight = new Walkontable.CellCoords(4, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +---------+
       |   +-----|
       | a |   b |
       |   |     |
       |   +-----|
       +---------+
       */
      it('B is included in A, right borders touch', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(1, 1);
        const bBottomRight = new Walkontable.CellCoords(4, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +---------+
       |   +-----|
       | a |   b |
       |   |     |
       +---------+
       */
      it('B is included in A, bottom and right borders touch', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(1, 1);
        const bBottomRight = new Walkontable.CellCoords(5, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +-----------+
       |   +-----+ |
       | a |   b | |
       |   |     | |
       +-----------+
       */
      it('B is included in A, bottom borders touch', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(1, 1);
        const bBottomRight = new Walkontable.CellCoords(5, 4);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +-----------+
       |-----+   a |
       |   b |     |
       |     |     |
       +-----------+
       */
      it('B is included in A, bottom and left borders touch', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(1, 0);
        const bBottomRight = new Walkontable.CellCoords(5, 4);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +-----------+
       |-----+   a |
       |   b |     |
       |     |     |
       |-----+     |
       +-----------+
       */
      it('B is included in A, left borders touch', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(1, 0);
        const bBottomRight = new Walkontable.CellCoords(4, 4);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +-----------+
       |   b |   a |
       |     |     |
       |-----+     |
       +-----------+
       */
      it('B is included in A, top and left borders touch', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 0);
        const bBottomRight = new Walkontable.CellCoords(4, 4);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +------------+
       |  a |   b | |
       |    |     | |
       +------------+
       */
      it('B is included in A, top and bottom borders touch', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 1);
        const bBottomRight = new Walkontable.CellCoords(5, 4);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +----------+
       |  a |   b |
       |    |     |
       +----------+
       */
      it('B is included in A, top, right and bottom borders touch', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 1);
        const bBottomRight = new Walkontable.CellCoords(5, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +----------+
       |  b |   a |
       |    |     |
       +----------+
       */
      it('B is included in A, top, left and bottom borders touch', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 0);
        const bBottomRight = new Walkontable.CellCoords(5, 4);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +----------+
       | a        |
       |----------|
       |  b       |
       |----------|
       +----------+
       */
      it('B is included in A, left and right borders touch', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(1, 0);
        const bBottomRight = new Walkontable.CellCoords(4, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +----------+
       | a        |
       |----------|
       |  b       |
       +----------+
       */
      it('B is included in A, left, bottom and right borders touch', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(1, 0);
        const bBottomRight = new Walkontable.CellCoords(5, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +----------+
       | b        |
       |----------|
       |  a       |
       +----------+
       */
      it('B is included in A, left, top and right borders touch', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 0);
        const bBottomRight = new Walkontable.CellCoords(4, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });
    });
    describe('B has exactly one cell', () => {

      /*
       +----------+
       |  a       |
       | +------+ |
       | |    b | |
       | |      | |
       | +------+ |
       +----------+
       */
      it('B is included in A, none of borders touch each other', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(1, 1);
        const bBottomRight = new Walkontable.CellCoords(1, 1);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

    });
  });

  describe('expand', () => {
    it('should not change range if expander to a cell that fits within the range', () => {
      const from = new Walkontable.CellCoords(1, 1);
      const to = new Walkontable.CellCoords(3, 3);
      const range = new Walkontable.CellRange(from, from, to);

      const topLeft = range.getTopLeftCorner();
      const bottomRight = range.getBottomRightCorner();

      const expander = new Walkontable.CellCoords(3, 1);
      const res = range.expand(expander);

      expect(res).toBe(false);
      const topLeft2 = range.getTopLeftCorner();
      const bottomRight2 = range.getBottomRightCorner();

      expect(topLeft2).toEqual(topLeft);
      expect(bottomRight2).toEqual(bottomRight);
    });

    it('should change range if expander to a cell outside of the cell range', () => {
      const from = new Walkontable.CellCoords(1, 1);
      const to = new Walkontable.CellCoords(3, 3);
      const range = new Walkontable.CellRange(from, from, to);

      const topLeft = range.getTopLeftCorner();

      const expander = new Walkontable.CellCoords(4, 4);
      const res = range.expand(expander);

      expect(res).toBe(true);
      const topLeft2 = range.getTopLeftCorner();
      const bottomRight2 = range.getBottomRightCorner();

      expect(topLeft2).toEqual(topLeft);
      expect(bottomRight2).toEqual(expander);
    });

    it('should change range if expander to a cell outside of the cell range (inverted)', () => {
      const from = new Walkontable.CellCoords(1, 1);
      const to = new Walkontable.CellCoords(3, 3);
      const range = new Walkontable.CellRange(from, from, to);

      const topLeft = range.getTopLeftCorner();

      const expander = new Walkontable.CellCoords(4, 4);
      const res = range.expand(expander);

      expect(res).toBe(true);
      const topLeft2 = range.getTopLeftCorner();
      const bottomRight2 = range.getBottomRightCorner();

      expect(topLeft2).toEqual(topLeft);
      expect(bottomRight2).toEqual(expander);
    });

    it('should change range if expander to a cell outside of the cell range (bottom left)', () => {
      const from = new Walkontable.CellCoords(1, 1);
      const to = new Walkontable.CellCoords(3, 3);
      const range = new Walkontable.CellRange(from, from, to);

      const expander = new Walkontable.CellCoords(3, 0);
      const res = range.expand(expander);

      expect(res).toBe(true);
      const topLeft2 = range.getTopLeftCorner();
      const bottomRight2 = range.getBottomRightCorner();

      expect(topLeft2).toEqual(new Walkontable.CellCoords(1, 0));
      expect(bottomRight2).toEqual(new Walkontable.CellCoords(3, 3));
    });

    it('should change range if expander to a cell outside of the cell range (inverted top right)', () => {
      const from = new Walkontable.CellCoords(2, 0);
      const to = new Walkontable.CellCoords(1, 0);
      const range = new Walkontable.CellRange(from, from, to);

      const expander = new Walkontable.CellCoords(1, 1);
      const res = range.expand(expander);

      expect(res).toBe(true);
      const topLeft2 = range.getTopLeftCorner();
      const bottomRight2 = range.getBottomRightCorner();

      expect(topLeft2).toEqual(new Walkontable.CellCoords(1, 0));
      expect(bottomRight2).toEqual(new Walkontable.CellCoords(2, 1));
    });

    it('should change range if expander to a cell outside of the cell range (inverted bottom left)', () => {
      const from = new Walkontable.CellCoords(2, 1);
      const to = new Walkontable.CellCoords(1, 1);
      const range = new Walkontable.CellRange(from, from, to);

      const expander = new Walkontable.CellCoords(3, 0);
      const res = range.expand(expander);

      expect(res).toBe(true);
      const topLeft2 = range.getTopLeftCorner();
      const bottomRight2 = range.getBottomRightCorner();

      expect(topLeft2).toEqual(new Walkontable.CellCoords(1, 0));
      expect(bottomRight2).toEqual(new Walkontable.CellCoords(3, 1));
    });
  });

  describe('overlaps', () => {
    describe('positive', () => {
      /*
             +-------+
             |       |
             |   b   |
       +-------+     |
       |     +-|-----+
       |   a   |
       |       |
       +-------+
       */
      it('overlapping from NE', () => {
        const aTopLeft = new Walkontable.CellCoords(3, 0);
        const aBottomRight = new Walkontable.CellCoords(8, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 3);
        const bBottomRight = new Walkontable.CellCoords(5, 8);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
       +---------+
       |      +-------+
       |      |  |    |
       |  a   |  |  b |
       |      |  |    |
       |      +-------+
       +---------+
       */
      it('overlapping from E', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(1, 3);
        const bBottomRight = new Walkontable.CellCoords(4, 6);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
       +--------+
       |        |
       |  a     |
       |    +---------+
       |    |   |     |
       +----|---+     |
            |      b  |
            |         |
            +---------+
       */
      it('overlapping from SE', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(3, 3);
        const bBottomRight = new Walkontable.CellCoords(8, 8);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
       +---------+
       |    a    |
       | +-----+ |
       +-|-----|-+
         |  b  |
         +-----+
       */
      it('overlapping from S', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(3, 1);
        const bBottomRight = new Walkontable.CellCoords(6, 4);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
           +--------+
           |      a |
       +--------+   |
       |   |    |   |
       |   +----|---+
       | b      |
       +--------+
       */
      it('overlapping from SW', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 3);
        const aBottomRight = new Walkontable.CellCoords(5, 8);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(3, 0);
        const bBottomRight = new Walkontable.CellCoords(8, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
           +-------+
       +---|--+    |
       |   |  |    |
       | b |  |  a |
       |   |  |    |
       +---|--+    |
           +-------+
       */
      it('overlapping from S', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 3);
        const aBottomRight = new Walkontable.CellCoords(5, 8);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(1, 1);
        const bBottomRight = new Walkontable.CellCoords(4, 4);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
       +------+
       | b    |
       |   +-------+
       |   |  |    |
       +---|--+  a |
           |       |
           +-------+
       */
      it('overlapping from NW', () => {
        const aTopLeft = new Walkontable.CellCoords(3, 3);
        const aBottomRight = new Walkontable.CellCoords(8, 8);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 0);
        const bBottomRight = new Walkontable.CellCoords(5, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
       +---------+
       |    b    |
       | +-----+ |
       +-|-----|-+
         |  a  |
         +-----+
       */
      it('overlapping from N', () => {
        const aTopLeft = new Walkontable.CellCoords(3, 1);
        const aBottomRight = new Walkontable.CellCoords(6, 4);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 0);
        const bBottomRight = new Walkontable.CellCoords(5, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
       +----------+
       |  a       |
       | +------+ |
       | |    b | |
       | |      | |
       | +------+ |
       +----------+
       */
      it('overlapping when includes', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(1, 1);
        const bBottomRight = new Walkontable.CellCoords(4, 4);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
       +----------+
       |  b       |
       | +------+ |
       | |    a | |
       | |      | |
       | +------+ |
       +----------+
       */
      it('overlapping when included', () => {
        const aTopLeft = new Walkontable.CellCoords(1, 1);
        const aBottomRight = new Walkontable.CellCoords(4, 4);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 0);
        const bBottomRight = new Walkontable.CellCoords(5, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*

       b-> +----------+
           |  a       |
           |          |
           |          |
           +----------+
       */
      it('overlapping when A includes B and B has only one cell, and this cell is A\'s top left corner', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 0);
        const bBottomRight = new Walkontable.CellCoords(0, 0);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*

       +----------+ <- b
       |  a       |
       |          |
       |          |
       +----------+
       */
      it('overlapping when A includes B and B has only one cell, and this cell is A\'s top right corner', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 5);
        const bBottomRight = new Walkontable.CellCoords(0, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*

           +----------+
           |  a       |
           |          |
           |          |
      b -> +----------+
       */
      it('overlapping when A includes B and B has only one cell, and this cell is A\'s bottom left corner', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(5, 0);
        const bBottomRight = new Walkontable.CellCoords(5, 0);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*

       +----------+
       |  a       |
       |          |
       |          |
       +----------+ <- b
       */
      it('overlapping when A includes B and B has only one cell, and this cell is A\'s bottom right corner', () => {
        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(5, 5);
        const bBottomRight = new Walkontable.CellCoords(5, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
            +----+
            |b   |
       +----+----+
       |   a|
       +----+
       */
      it('overlapping by touching from NE', () => {

        const aTopLeft = new Walkontable.CellCoords(5, 0);
        const aBottomRight = new Walkontable.CellCoords(10, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 5);
        const bBottomRight = new Walkontable.CellCoords(5, 10);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
       +----+----+
       |   a|   b|
       +----+----+
       */
      it('overlapping by touching from E', () => {

        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 5);
        const bBottomRight = new Walkontable.CellCoords(5, 10);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
       +----+
       |   a|
       +----+----+
            |   b|
            +----+
       */
      it('overlapping by touching from SE', () => {

        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(5, 5);
        const bBottomRight = new Walkontable.CellCoords(10, 10);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
       +----+
       |   a|
       +----+
       |   b|
       +----+
       */
      it('overlapping by touching from S', () => {

        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(5, 5);
        const bBottomRight = new Walkontable.CellCoords(10, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
            +----+
            |   a|
       +----+----+
       |   b|
       +----+
       */
      it('overlapping by touching from SW', () => {

        const aTopLeft = new Walkontable.CellCoords(0, 5);
        const aBottomRight = new Walkontable.CellCoords(5, 10);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(5, 0);
        const bBottomRight = new Walkontable.CellCoords(10, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
       +----+----+
       |   b|   a|
       +----+----+
       */
      it('overlapping by touching from W', () => {

        const aTopLeft = new Walkontable.CellCoords(0, 5);
        const aBottomRight = new Walkontable.CellCoords(5, 10);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 0);
        const bBottomRight = new Walkontable.CellCoords(5, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
       +----+
       |   b|
       +----+----+
            |   a|
            +----+
       */
      it('overlapping by touching from NW', () => {

        const aTopLeft = new Walkontable.CellCoords(5, 5);
        const aBottomRight = new Walkontable.CellCoords(10, 10);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 0);
        const bBottomRight = new Walkontable.CellCoords(5, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
       +----+
       |   b|
       +----+
       |   a|
       +----+
       */
      it('overlapping by touching from E', () => {

        const aTopLeft = new Walkontable.CellCoords(5, 0);
        const aBottomRight = new Walkontable.CellCoords(10, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 0);
        const bBottomRight = new Walkontable.CellCoords(5, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

    });

    describe('negative', () => {
      /*
             +---+
             |  b|
             +---+
       +------+
       |      |
       |  a   |
       |      |
       +------+
       */
      it('not overlapping from NE', () => {

        const aTopLeft = new Walkontable.CellCoords(6, 0);
        const aBottomRight = new Walkontable.CellCoords(11, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 3);
        const bBottomRight = new Walkontable.CellCoords(5, 8);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(false);

      });

      /*
       +------+
       |      | +--+
       |   a  | | b|
       |      | +--+
       +------+
       */
      it('not overlapping from E', () => {

        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(1, 6);
        const bBottomRight = new Walkontable.CellCoords(4, 9);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(false);

      });

      /*
       +----+
       |a   |
       |    | +----+
       +----+ |b   |
              |    |
              +----+
       */
      it('not overlapping from SE', () => {

        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(1, 6);
        const bBottomRight = new Walkontable.CellCoords(4, 9);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(false);

      });

      /*
       +----+
       |a   |
       |    |
       +----+
       +----+
       |b   |
       |    |
       +----+
       */
      it('not overlapping from S', () => {

        const aTopLeft = new Walkontable.CellCoords(0, 0);
        const aBottomRight = new Walkontable.CellCoords(5, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(6, 0);
        const bBottomRight = new Walkontable.CellCoords(11, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(false);

      });

      /*
           +----+
           |a   |
           |    |
           +----+
       +----+
       |b   |
       |    |
       +----+
       */
      it('not overlapping from SW', () => {

        const aTopLeft = new Walkontable.CellCoords(0, 3);
        const aBottomRight = new Walkontable.CellCoords(5, 8);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(6, 0);
        const bBottomRight = new Walkontable.CellCoords(11, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(false);

      });

      /*
            +------+
       +--+ |      |
       | b| |   a  |
       +--+ |      |
            +------+
       */
      it('not overlapping from W', () => {

        const aTopLeft = new Walkontable.CellCoords(0, 6);
        const aBottomRight = new Walkontable.CellCoords(5, 11);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(3, 0);
        const bBottomRight = new Walkontable.CellCoords(6, 3);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(false);

      });

      /*
       +----+
       |b   |
       |    | +----+
       +----+ | a  |
              |    |
              +----+
       */
      it('not overlapping from NW', () => {

        const aTopLeft = new Walkontable.CellCoords(0, 6);
        const aBottomRight = new Walkontable.CellCoords(3, 11);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 0);
        const bBottomRight = new Walkontable.CellCoords(5, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(false);

      });

      /*
       +----+
       |b   |
       +----+
       +----+
       |   a|
       +----+
       */
      it('not overlapping from N', () => {

        const aTopLeft = new Walkontable.CellCoords(6, 0);
        const aBottomRight = new Walkontable.CellCoords(11, 5);
        const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        const bTopLeft = new Walkontable.CellCoords(0, 0);
        const bBottomRight = new Walkontable.CellCoords(5, 5);
        const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(false);
      });
    });
  });

  describe('expand by range', () => {
    it('should not expand range A with range B if A includes B', () => {
      const aTopLeft = new Walkontable.CellCoords(0, 0);
      const aBottomRight = new Walkontable.CellCoords(5, 5);
      const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

      const bTopLeft = new Walkontable.CellCoords(2, 2);
      const bBottomRight = new Walkontable.CellCoords(4, 4);
      const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

      expect(a.expandByRange(b)).toBe(false);

      expect(a.getTopLeftCorner().row).toEqual(0);
      expect(a.getTopLeftCorner().col).toEqual(0);
      expect(a.getBottomRightCorner().row).toEqual(5);
      expect(a.getBottomRightCorner().col).toEqual(5);
    });

    it('should not expand range A with range B if A and B don\'t overlap', () => {
      const aTopLeft = new Walkontable.CellCoords(0, 0);
      const aBottomRight = new Walkontable.CellCoords(5, 5);
      const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

      const bTopLeft = new Walkontable.CellCoords(10, 10);
      const bBottomRight = new Walkontable.CellCoords(15, 15);
      const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

      expect(a.expandByRange(b)).toBe(false);

      expect(a.getTopLeftCorner().row).toEqual(0);
      expect(a.getTopLeftCorner().col).toEqual(0);
      expect(a.getBottomRightCorner().row).toEqual(5);
      expect(a.getBottomRightCorner().col).toEqual(5);
    });

    it('should not expand range A with range B', () => {
      const aTopLeft = new Walkontable.CellCoords(0, 0);
      const aBottomRight = new Walkontable.CellCoords(5, 5);
      const a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

      const bTopLeft = new Walkontable.CellCoords(2, 2);
      const bBottomRight = new Walkontable.CellCoords(7, 7);
      const b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

      expect(a.expandByRange(b)).toBe(true);

      expect(a.getTopLeftCorner().row).toEqual(0);
      expect(a.getTopLeftCorner().col).toEqual(0);
      expect(a.getBottomRightCorner().row).toEqual(7);
      expect(a.getBottomRightCorner().col).toEqual(7);
    });
  });

  describe('forAll', () => {
    it('callback should be called for all cells in the range', () => {
      const from = new Walkontable.CellCoords(1, 1);
      const to = new Walkontable.CellCoords(3, 3);
      const range = new Walkontable.CellRange(from, from, to);
      const forAllCallback = jasmine.createSpy('beforeColumnSortHandler');

      range.forAll(forAllCallback);

      expect(forAllCallback.calls.count()).toBe(9);
    });

    it('callback should be called with row, column parameters', () => {
      const from = new Walkontable.CellCoords(1, 1);
      const to = new Walkontable.CellCoords(2, 2);
      const range = new Walkontable.CellRange(from, from, to);
      const rows = [];
      const cols = [];

      range.forAll((row, col) => {
        rows.push(row);
        cols.push(col);
      });
      expect(rows).toEqual([1, 1, 2, 2]);
      expect(cols).toEqual([1, 2, 1, 2]);
    });

    it('iteration should be interrupted when callback returns false', () => {
      const from = new Walkontable.CellCoords(1, 1);
      const to = new Walkontable.CellCoords(2, 2);
      const range = new Walkontable.CellRange(from, from, to);
      let callCount = 0;

      range.forAll(() => {
        callCount += 1;

        if (callCount === 2) {
          return false;
        }
      });
      expect(callCount).toBe(2);
    });
  });

  describe('direction', () => {
    it('should properly change direction on NW-SE', () => {
      const from = new Walkontable.CellCoords(2, 1);
      const to = new Walkontable.CellCoords(1, 2);
      const range = new Walkontable.CellRange(from, from, to);

      expect(range.getDirection()).toBe('SW-NE');

      range.setDirection('NW-SE');

      expect(range.getDirection()).toBe('NW-SE');
      expect(range.from.row).toBe(1);
      expect(range.from.col).toBe(1);
      expect(range.to.row).toBe(2);
      expect(range.to.col).toBe(2);
    });

    it('should properly change direction on NE-SW', () => {
      const from = new Walkontable.CellCoords(2, 1);
      const to = new Walkontable.CellCoords(1, 2);
      const range = new Walkontable.CellRange(from, from, to);

      expect(range.getDirection()).toBe('SW-NE');

      range.setDirection('NE-SW');

      expect(range.getDirection()).toBe('NE-SW');
      expect(range.from.row).toBe(1);
      expect(range.from.col).toBe(2);
      expect(range.to.row).toBe(2);
      expect(range.to.col).toBe(1);
    });

    it('should properly change direction on SE-NW', () => {
      const from = new Walkontable.CellCoords(1, 1);
      const to = new Walkontable.CellCoords(2, 2);
      const range = new Walkontable.CellRange(from, from, to);

      expect(range.getDirection()).toBe('NW-SE');

      range.setDirection('SE-NW');

      expect(range.getDirection()).toBe('SE-NW');
      expect(range.from.row).toBe(2);
      expect(range.from.col).toBe(2);
      expect(range.to.row).toBe(1);
      expect(range.to.col).toBe(1);
    });

    it('should properly change direction on SW-NE', () => {
      const from = new Walkontable.CellCoords(1, 1);
      const to = new Walkontable.CellCoords(2, 2);
      const range = new Walkontable.CellRange(from, from, to);

      expect(range.getDirection()).toBe('NW-SE');

      range.setDirection('SW-NE');

      expect(range.getDirection()).toBe('SW-NE');
      expect(range.from.row).toBe(2);
      expect(range.from.col).toBe(1);
      expect(range.to.row).toBe(1);
      expect(range.to.col).toBe(2);
    });

    it('should properly return the vertical direction of a range', () => {
      let from = new Walkontable.CellCoords(1, 1);
      let to = new Walkontable.CellCoords(2, 2);
      let range = new Walkontable.CellRange(from, from, to);

      expect(range.getVerticalDirection()).toEqual('N-S');

      from = new Walkontable.CellCoords(2, 2);
      to = new Walkontable.CellCoords(1, 1);
      range = new Walkontable.CellRange(from, from, to);

      expect(range.getVerticalDirection()).toEqual('S-N');
    });

    it('should properly return the horizontal direction of a range', () => {
      let from = new Walkontable.CellCoords(1, 1);
      let to = new Walkontable.CellCoords(2, 2);
      let range = new Walkontable.CellRange(from, from, to);

      expect(range.getHorizontalDirection()).toEqual('W-E');

      from = new Walkontable.CellCoords(2, 2);
      to = new Walkontable.CellCoords(1, 1);
      range = new Walkontable.CellRange(from, from, to);

      expect(range.getHorizontalDirection()).toEqual('E-W');
    });

    it('should flip the direction vertically when using the `flipDirectionVertically` method', () => {
      const from = new Walkontable.CellCoords(1, 1);
      const to = new Walkontable.CellCoords(2, 2);
      const range = new Walkontable.CellRange(from, from, to);

      range.flipDirectionVertically();

      expect(range.from.row).toEqual(2);
      expect(range.from.col).toEqual(1);
      expect(range.to.row).toEqual(1);
      expect(range.to.col).toEqual(2);

      expect(range.getDirection()).toEqual('SW-NE');
    });

    it('should flip the direction horizontally when using the `flipDirectionHorizontally` method', () => {
      const from = new Walkontable.CellCoords(1, 1);
      const to = new Walkontable.CellCoords(2, 2);
      const range = new Walkontable.CellRange(from, from, to);

      range.flipDirectionHorizontally();

      expect(range.from.row).toEqual(1);
      expect(range.from.col).toEqual(2);
      expect(range.to.row).toEqual(2);
      expect(range.to.col).toEqual(1);

      expect(range.getDirection()).toEqual('NE-SW');
    });
  });
});
