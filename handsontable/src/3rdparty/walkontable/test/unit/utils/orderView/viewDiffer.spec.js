import { ViewDiffer } from 'walkontable/utils/orderView/viewDiffer';
import { ViewSizeSet } from 'walkontable/utils/orderView/viewSizeSet';
import {
  CMD_NONE,
  CMD_REMOVE,
  CMD_APPEND,
  CMD_PREPEND,
  CMD_INSERT_BEFORE,
  CMD_REPLACE,
} from 'walkontable/utils/orderView/constants';

describe('ViewDiffer', () => {
  it('should generate leads filled with "append" type when previous order wasn\'t exist', async() => {
    const sizeSet = new ViewSizeSet();
    const differ = new ViewDiffer(sizeSet);

    sizeSet.setSize(6);
    sizeSet.setOffset(0);

    expect(differ.diff()).toEqual([
      [CMD_APPEND, 0],
      [CMD_APPEND, 1],
      [CMD_APPEND, 2],
      [CMD_APPEND, 3],
      [CMD_APPEND, 4],
      [CMD_APPEND, 5],
    ]);
  });

  it('should generate leads filled with "append" type when next order is longer than previous', async() => {
    const sizeSet = new ViewSizeSet();
    const differ = new ViewDiffer(sizeSet);

    sizeSet.setSize(3);
    sizeSet.setOffset(0);
    sizeSet.setSize(6);
    sizeSet.setOffset(0);

    expect(differ.diff()).toEqual([
      [CMD_NONE, 0],
      [CMD_NONE, 1],
      [CMD_NONE, 2],
      [CMD_APPEND, 3],
      [CMD_APPEND, 4],
      [CMD_APPEND, 5],
    ]);
  });

  it('should generate leads filled with "remove" type when next order is shorter than previous', async() => {
    const sizeSet = new ViewSizeSet();
    const differ = new ViewDiffer(sizeSet);

    sizeSet.setSize(6);
    sizeSet.setOffset(0);
    sizeSet.setSize(0);
    sizeSet.setOffset(0);

    expect(differ.diff()).toEqual([
      [CMD_REMOVE, 0],
      [CMD_REMOVE, 1],
      [CMD_REMOVE, 2],
      [CMD_REMOVE, 3],
      [CMD_REMOVE, 4],
      [CMD_REMOVE, 5],
    ]);
  });

  describe('scroll down emulation', () => {
    it('should generate correct leads when a new order is shifted by 1 step down according to the previous order', async() => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(0);
      sizeSet.setSize(6);
      sizeSet.setOffset(1);

      expect(differ.diff()).toEqual([
        [CMD_REPLACE, 1, 0],
        [CMD_NONE, 2],
        [CMD_NONE, 3],
        [CMD_NONE, 4],
        [CMD_NONE, 5],
        [CMD_APPEND, 6],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 3 steps down according to the previous order', async() => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(0);
      sizeSet.setSize(6);
      sizeSet.setOffset(3);

      expect(differ.diff()).toEqual([
        [CMD_REPLACE, 3, 0],
        [CMD_REPLACE, 4, 1],
        [CMD_REPLACE, 5, 2],
        [CMD_APPEND, 6],
        [CMD_APPEND, 7],
        [CMD_APPEND, 8],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 5 steps down according to the previous order', async() => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(0);
      sizeSet.setSize(6);
      sizeSet.setOffset(5);

      expect(differ.diff()).toEqual([
        [CMD_REPLACE, 5, 0],
        [CMD_REPLACE, 6, 1],
        [CMD_REPLACE, 7, 2],
        [CMD_REPLACE, 8, 3],
        [CMD_REPLACE, 9, 4],
        [CMD_APPEND, 10],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 10 steps down according to the previous order', async() => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(0);
      sizeSet.setSize(6);
      sizeSet.setOffset(10);

      expect(differ.diff()).toEqual([
        [CMD_REPLACE, 10, 0],
        [CMD_REPLACE, 11, 1],
        [CMD_REPLACE, 12, 2],
        [CMD_REPLACE, 13, 3],
        [CMD_REPLACE, 14, 4],
        [CMD_REPLACE, 15, 5],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 3 steps down and is longer (by 4 items) according to the previous order', async() => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(0);
      sizeSet.setSize(10);
      sizeSet.setOffset(3);

      expect(differ.diff()).toEqual([
        [CMD_REPLACE, 3, 0],
        [CMD_REPLACE, 4, 1],
        [CMD_REPLACE, 5, 2],
        [CMD_APPEND, 6],
        [CMD_APPEND, 7],
        [CMD_APPEND, 8],
        [CMD_APPEND, 9],
        [CMD_APPEND, 10],
        [CMD_APPEND, 11],
        [CMD_APPEND, 12],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 7 steps down and is longer (by 2 items) according to the previous order', async() => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(7);
      sizeSet.setOffset(2);
      sizeSet.setSize(8);
      sizeSet.setOffset(9);

      expect(differ.diff()).toEqual([
        [CMD_REPLACE, 9, 2],
        [CMD_REPLACE, 10, 3],
        [CMD_REPLACE, 11, 4],
        [CMD_REPLACE, 12, 5],
        [CMD_REPLACE, 13, 6],
        [CMD_REPLACE, 14, 7],
        [CMD_REPLACE, 15, 8],
        [CMD_APPEND, 16],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 3 steps down and is shorter (by 3 items) according to the previous order', async() => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(0);
      sizeSet.setSize(3);
      sizeSet.setOffset(3);

      expect(differ.diff()).toEqual([
        [CMD_REPLACE, 3, 0],
        [CMD_REPLACE, 4, 1],
        [CMD_REPLACE, 5, 2],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 30 steps down and is shorter (3 items) according to the previous order', async() => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(0);
      sizeSet.setSize(3);
      sizeSet.setOffset(30);

      expect(differ.diff()).toEqual([
        [CMD_REPLACE, 30, 0],
        [CMD_REPLACE, 31, 1],
        [CMD_REPLACE, 32, 2],
        [CMD_REMOVE, 3],
        [CMD_REMOVE, 4],
        [CMD_REMOVE, 5],
      ]);
    });

    it(`should generate correct leads when a new order is shifted by 2 steps down, is shorter (by 1 item) according to the previous order
        (force generating "replace" and "append" types)`, async() => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(9);
      sizeSet.setOffset(19);
      sizeSet.setSize(8);
      sizeSet.setOffset(21);

      expect(differ.diff()).toEqual([
        [CMD_REPLACE, 21, 19],
        [CMD_REPLACE, 22, 20],
        [CMD_NONE, 23],
        [CMD_NONE, 24],
        [CMD_NONE, 25],
        [CMD_NONE, 26],
        [CMD_NONE, 27],
        [CMD_APPEND, 28],
      ]);
    });
  });

  describe('scroll up emulation', () => {
    it('should generate correct leads when a new order is shifted by 1 step up according to the previous order', async() => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(20);
      sizeSet.setSize(6);
      sizeSet.setOffset(19);

      expect(differ.diff()).toEqual([
        [CMD_INSERT_BEFORE, 19, 20, 25],
        [CMD_NONE, 20],
        [CMD_NONE, 21],
        [CMD_NONE, 22],
        [CMD_NONE, 23],
        [CMD_NONE, 24],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 3 steps up according to the previous order', async() => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(20);
      sizeSet.setSize(6);
      sizeSet.setOffset(17);

      expect(differ.diff()).toEqual([
        [CMD_INSERT_BEFORE, 17, 20, 25],
        [CMD_INSERT_BEFORE, 18, 20, 24],
        [CMD_INSERT_BEFORE, 19, 20, 23],
        [CMD_NONE, 20],
        [CMD_NONE, 21],
        [CMD_NONE, 22],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 5 steps up according to the previous order', async() => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(20);
      sizeSet.setSize(6);
      sizeSet.setOffset(15);

      expect(differ.diff()).toEqual([
        [CMD_INSERT_BEFORE, 15, 20, 25],
        [CMD_INSERT_BEFORE, 16, 20, 24],
        [CMD_INSERT_BEFORE, 17, 20, 23],
        [CMD_INSERT_BEFORE, 18, 20, 22],
        [CMD_INSERT_BEFORE, 19, 20, 21],
        [CMD_NONE, 20],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 10 steps up according to the previous order', async() => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(20);
      sizeSet.setSize(6);
      sizeSet.setOffset(10);

      expect(differ.diff()).toEqual([
        [CMD_INSERT_BEFORE, 10, 20, 25],
        [CMD_INSERT_BEFORE, 11, 20, 24],
        [CMD_INSERT_BEFORE, 12, 20, 23],
        [CMD_INSERT_BEFORE, 13, 20, 22],
        [CMD_INSERT_BEFORE, 14, 20, 21],
        [CMD_INSERT_BEFORE, 15, 20, 20],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 3 steps up and is longer (by 2 items) according to the previous order', async() => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(20);
      sizeSet.setSize(8);
      sizeSet.setOffset(17);

      expect(differ.diff()).toEqual([
        [CMD_INSERT_BEFORE, 17, 20, 25],
        [CMD_INSERT_BEFORE, 18, 20, 24],
        [CMD_INSERT_BEFORE, 19, 20, 23],
        [CMD_NONE, 20],
        [CMD_NONE, 21],
        [CMD_NONE, 22],
        [CMD_APPEND, 23],
        [CMD_APPEND, 24],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 7 steps up and is longer (by 2 items) according to the previous order', async() => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(20);
      sizeSet.setSize(8);
      sizeSet.setOffset(13);

      expect(differ.diff()).toEqual([
        [CMD_INSERT_BEFORE, 13, 20, 25],
        [CMD_INSERT_BEFORE, 14, 20, 24],
        [CMD_INSERT_BEFORE, 15, 20, 23],
        [CMD_INSERT_BEFORE, 16, 20, 22],
        [CMD_INSERT_BEFORE, 17, 20, 21],
        [CMD_INSERT_BEFORE, 18, 20, 20],
        [CMD_APPEND, 19],
        [CMD_APPEND, 20],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 3 steps up and is shorter (by 4 items) according to the previous order', async() => {
      {
        const sizeSet = new ViewSizeSet();
        const differ = new ViewDiffer(sizeSet);

        sizeSet.setSize(7);
        sizeSet.setOffset(20);
        sizeSet.setSize(3);
        sizeSet.setOffset(17);

        expect(differ.diff()).toEqual([
          [CMD_INSERT_BEFORE, 17, 20, 26],
          [CMD_INSERT_BEFORE, 18, 20, 25],
          [CMD_INSERT_BEFORE, 19, 20, 24],
          [CMD_REMOVE, 20],
          [CMD_REMOVE, 21],
          [CMD_REMOVE, 22],
          [CMD_REMOVE, 23],
        ]);
      }
      {
        const sizeSet = new ViewSizeSet();
        const differ = new ViewDiffer(sizeSet);

        sizeSet.setSize(7);
        sizeSet.setOffset(20);
        sizeSet.setSize(3);
        sizeSet.setOffset(24);

        expect(differ.diff()).toEqual([
          [CMD_REPLACE, 24, 20],
          [CMD_REPLACE, 25, 21],
          [CMD_REPLACE, 26, 22],
          [CMD_REMOVE, 23],
        ]);
      }
    });

    it('should generate correct leads when a new order is shifted by 20 steps up and is shorter (by 3 items) according to the previous order', async() => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(20);
      sizeSet.setSize(3);
      sizeSet.setOffset(0);

      expect(differ.diff()).toEqual([
        [CMD_INSERT_BEFORE, 0, 20, 25],
        [CMD_INSERT_BEFORE, 1, 20, 24],
        [CMD_INSERT_BEFORE, 2, 20, 23],
        [CMD_REMOVE, 20],
        [CMD_REMOVE, 21],
        [CMD_REMOVE, 22],
      ]);
    });
  });

  // Tests for generating commands for the shared root node. In the table, there is only one scenario
  // when this happens. Every TR element (root node) has a different class instances to manage cells
  // order (TD elements) and different for row headers (TH elements) these classes share one
  // root node and for them different commands should be generated.
  describe('shared root node emulation (shared view size)', () => {
    it('should generate "prepend" leads for TH elements', async() => {
      const sizeSetTD = new ViewSizeSet();
      const sizeSetTH = new ViewSizeSet();
      const differTD = new ViewDiffer(sizeSetTD);
      const differTH = new ViewDiffer(sizeSetTH);

      // Connect both ViewDiffers to make view size sharable between them.
      sizeSetTD.prepend(sizeSetTH);
      sizeSetTH.append(sizeSetTD);

      sizeSetTH.setSize(0);
      sizeSetTH.setOffset(0);
      sizeSetTD.setSize(5);
      sizeSetTD.setOffset(0);

      expect(differTH.diff()).toEqual([]);
      expect(differTD.diff()).toEqual([
        [CMD_APPEND, 0],
        [CMD_APPEND, 1],
        [CMD_APPEND, 2],
        [CMD_APPEND, 3],
        [CMD_APPEND, 4],
      ]);

      sizeSetTH.setSize(1);
      sizeSetTH.setOffset(0);
      sizeSetTD.setSize(5);
      sizeSetTD.setOffset(0);

      expect(differTH.diff()).toEqual([
        [CMD_PREPEND, 0],
      ]);
      expect(differTD.diff()).toEqual([
        [CMD_NONE, 0],
        [CMD_NONE, 1],
        [CMD_NONE, 2],
        [CMD_NONE, 3],
        [CMD_NONE, 4],
      ]);
    });

    it('should generate "remove" leads for TH elements', async() => {
      const sizeSetTD = new ViewSizeSet();
      const sizeSetTH = new ViewSizeSet();
      const differTD = new ViewDiffer(sizeSetTD);
      const differTH = new ViewDiffer(sizeSetTH);

      // Connect both ViewDiffers to make view size sharable between them.
      sizeSetTD.prepend(sizeSetTH);
      sizeSetTH.append(sizeSetTD);

      sizeSetTH.setSize(1);
      sizeSetTH.setOffset(0);
      sizeSetTD.setSize(5);
      sizeSetTD.setOffset(0);

      expect(differTH.diff()).toEqual([
        [CMD_PREPEND, 0],
      ]);
      expect(differTD.diff()).toEqual([
        [CMD_APPEND, 0],
        [CMD_APPEND, 1],
        [CMD_APPEND, 2],
        [CMD_APPEND, 3],
        [CMD_APPEND, 4],
      ]);

      sizeSetTH.setSize(0);
      sizeSetTH.setOffset(0);
      sizeSetTD.setSize(5);
      sizeSetTD.setOffset(0);

      expect(differTH.diff()).toEqual([
        [CMD_REMOVE, 0],
      ]);
      expect(differTD.diff()).toEqual([
        [CMD_NONE, 0],
        [CMD_NONE, 1],
        [CMD_NONE, 2],
        [CMD_NONE, 3],
        [CMD_NONE, 4],
      ]);
    });
  });
});
