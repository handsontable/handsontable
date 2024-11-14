import { ViewDiffer } from 'walkontable/utils/orderView/viewDiffer';
import { ViewSizeSet } from 'walkontable/utils/orderView/viewSizeSet';

describe('ViewDiffer', () => {
  it('should generate leads filled with "append" type when previous order wasn\'t exist', () => {
    const sizeSet = new ViewSizeSet();
    const differ = new ViewDiffer(sizeSet);

    sizeSet.setSize(6);
    sizeSet.setOffset(0);

    expect(differ.diff()).toEqual([
      ['append', 0],
      ['append', 1],
      ['append', 2],
      ['append', 3],
      ['append', 4],
      ['append', 5],
    ]);
  });

  it('should generate leads filled with "append" type when next order is longer than previous', () => {
    const sizeSet = new ViewSizeSet();
    const differ = new ViewDiffer(sizeSet);

    sizeSet.setSize(3);
    sizeSet.setOffset(0);
    sizeSet.setSize(6);
    sizeSet.setOffset(0);

    expect(differ.diff()).toEqual([
      ['none', 0],
      ['none', 1],
      ['none', 2],
      ['append', 3],
      ['append', 4],
      ['append', 5],
    ]);
  });

  it('should generate leads filled with "remove" type when next order is shorter than previous', () => {
    const sizeSet = new ViewSizeSet();
    const differ = new ViewDiffer(sizeSet);

    sizeSet.setSize(6);
    sizeSet.setOffset(0);
    sizeSet.setSize(0);
    sizeSet.setOffset(0);

    expect(differ.diff()).toEqual([
      ['remove', 0],
      ['remove', 1],
      ['remove', 2],
      ['remove', 3],
      ['remove', 4],
      ['remove', 5],
    ]);
  });

  describe('scroll down emulation', () => {
    it('should generate correct leads when a new order is shifted by 1 step down according to the previous order', () => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(0);
      sizeSet.setSize(6);
      sizeSet.setOffset(1);

      expect(differ.diff()).toEqual([
        ['replace', 1, 0],
        ['none', 2],
        ['none', 3],
        ['none', 4],
        ['none', 5],
        ['append', 6],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 3 steps down according to the previous order', () => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(0);
      sizeSet.setSize(6);
      sizeSet.setOffset(3);

      expect(differ.diff()).toEqual([
        ['replace', 3, 0],
        ['replace', 4, 1],
        ['replace', 5, 2],
        ['append', 6],
        ['append', 7],
        ['append', 8],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 5 steps down according to the previous order', () => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(0);
      sizeSet.setSize(6);
      sizeSet.setOffset(5);

      expect(differ.diff()).toEqual([
        ['replace', 5, 0],
        ['replace', 6, 1],
        ['replace', 7, 2],
        ['replace', 8, 3],
        ['replace', 9, 4],
        ['append', 10],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 10 steps down according to the previous order', () => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(0);
      sizeSet.setSize(6);
      sizeSet.setOffset(10);

      expect(differ.diff()).toEqual([
        ['replace', 10, 0],
        ['replace', 11, 1],
        ['replace', 12, 2],
        ['replace', 13, 3],
        ['replace', 14, 4],
        ['replace', 15, 5],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 3 steps down and is longer (by 4 items) according to the previous order', () => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(0);
      sizeSet.setSize(10);
      sizeSet.setOffset(3);

      expect(differ.diff()).toEqual([
        ['replace', 3, 0],
        ['replace', 4, 1],
        ['replace', 5, 2],
        ['append', 6],
        ['append', 7],
        ['append', 8],
        ['append', 9],
        ['append', 10],
        ['append', 11],
        ['append', 12],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 7 steps down and is longer (by 2 items) according to the previous order', () => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(7);
      sizeSet.setOffset(2);
      sizeSet.setSize(8);
      sizeSet.setOffset(9);

      expect(differ.diff()).toEqual([
        ['replace', 9, 2],
        ['replace', 10, 3],
        ['replace', 11, 4],
        ['replace', 12, 5],
        ['replace', 13, 6],
        ['replace', 14, 7],
        ['replace', 15, 8],
        ['append', 16],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 3 steps down and is shorter (by 3 items) according to the previous order', () => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(0);
      sizeSet.setSize(3);
      sizeSet.setOffset(3);

      expect(differ.diff()).toEqual([
        ['replace', 3, 0],
        ['replace', 4, 1],
        ['replace', 5, 2],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 30 steps down and is shorter (3 items) according to the previous order', () => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(0);
      sizeSet.setSize(3);
      sizeSet.setOffset(30);

      expect(differ.diff()).toEqual([
        ['replace', 30, 0],
        ['replace', 31, 1],
        ['replace', 32, 2],
        ['remove', 3],
        ['remove', 4],
        ['remove', 5],
      ]);
    });

    it(`should generate correct leads when a new order is shifted by 2 steps down, is shorter (by 1 item) according to the previous order
        (force generating "replace" and "append" types)`, () => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(9);
      sizeSet.setOffset(19);
      sizeSet.setSize(8);
      sizeSet.setOffset(21);

      expect(differ.diff()).toEqual([
        ['replace', 21, 19],
        ['replace', 22, 20],
        ['none', 23],
        ['none', 24],
        ['none', 25],
        ['none', 26],
        ['none', 27],
        ['append', 28],
      ]);
    });
  });

  describe('scroll up emulation', () => {
    it('should generate correct leads when a new order is shifted by 1 step up according to the previous order', () => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(20);
      sizeSet.setSize(6);
      sizeSet.setOffset(19);

      expect(differ.diff()).toEqual([
        ['insert_before', 19, 20, 25],
        ['none', 20],
        ['none', 21],
        ['none', 22],
        ['none', 23],
        ['none', 24],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 3 steps up according to the previous order', () => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(20);
      sizeSet.setSize(6);
      sizeSet.setOffset(17);

      expect(differ.diff()).toEqual([
        ['insert_before', 17, 20, 25],
        ['insert_before', 18, 20, 24],
        ['insert_before', 19, 20, 23],
        ['none', 20],
        ['none', 21],
        ['none', 22],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 5 steps up according to the previous order', () => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(20);
      sizeSet.setSize(6);
      sizeSet.setOffset(15);

      expect(differ.diff()).toEqual([
        ['insert_before', 15, 20, 25],
        ['insert_before', 16, 20, 24],
        ['insert_before', 17, 20, 23],
        ['insert_before', 18, 20, 22],
        ['insert_before', 19, 20, 21],
        ['none', 20],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 10 steps up according to the previous order', () => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(20);
      sizeSet.setSize(6);
      sizeSet.setOffset(10);

      expect(differ.diff()).toEqual([
        ['insert_before', 10, 20, 25],
        ['insert_before', 11, 20, 24],
        ['insert_before', 12, 20, 23],
        ['insert_before', 13, 20, 22],
        ['insert_before', 14, 20, 21],
        ['insert_before', 15, 20, 20],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 3 steps up and is longer (by 2 items) according to the previous order', () => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(20);
      sizeSet.setSize(8);
      sizeSet.setOffset(17);

      expect(differ.diff()).toEqual([
        ['insert_before', 17, 20, 25],
        ['insert_before', 18, 20, 24],
        ['insert_before', 19, 20, 23],
        ['none', 20],
        ['none', 21],
        ['none', 22],
        ['append', 23],
        ['append', 24],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 7 steps up and is longer (by 2 items) according to the previous order', () => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(20);
      sizeSet.setSize(8);
      sizeSet.setOffset(13);

      expect(differ.diff()).toEqual([
        ['insert_before', 13, 20, 25],
        ['insert_before', 14, 20, 24],
        ['insert_before', 15, 20, 23],
        ['insert_before', 16, 20, 22],
        ['insert_before', 17, 20, 21],
        ['insert_before', 18, 20, 20],
        ['append', 19],
        ['append', 20],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 3 steps up and is shorter (by 4 items) according to the previous order', () => {
      {
        const sizeSet = new ViewSizeSet();
        const differ = new ViewDiffer(sizeSet);

        sizeSet.setSize(7);
        sizeSet.setOffset(20);
        sizeSet.setSize(3);
        sizeSet.setOffset(17);

        expect(differ.diff()).toEqual([
          ['insert_before', 17, 20, 26],
          ['insert_before', 18, 20, 25],
          ['insert_before', 19, 20, 24],
          ['remove', 20],
          ['remove', 21],
          ['remove', 22],
          ['remove', 23],
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
          ['replace', 24, 20],
          ['replace', 25, 21],
          ['replace', 26, 22],
          ['remove', 23],
        ]);
      }
    });

    it('should generate correct leads when a new order is shifted by 20 steps up and is shorter (by 3 items) according to the previous order', () => {
      const sizeSet = new ViewSizeSet();
      const differ = new ViewDiffer(sizeSet);

      sizeSet.setSize(6);
      sizeSet.setOffset(20);
      sizeSet.setSize(3);
      sizeSet.setOffset(0);

      expect(differ.diff()).toEqual([
        ['insert_before', 0, 20, 25],
        ['insert_before', 1, 20, 24],
        ['insert_before', 2, 20, 23],
        ['remove', 20],
        ['remove', 21],
        ['remove', 22],
      ]);
    });
  });

  // Tests for generating commands for the shared root node. In the table, there is only one scenario
  // when this happens. Every TR element (root node) has a different class instances to manage cells
  // order (TD elements) and different for row headers (TH elements) these classes share one
  // root node and for them different commands should be generated.
  describe('shared root node emulation (shared view size)', () => {
    it('should generate "prepend" leads for TH elements', () => {
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
        ['append', 0],
        ['append', 1],
        ['append', 2],
        ['append', 3],
        ['append', 4],
      ]);

      sizeSetTH.setSize(1);
      sizeSetTH.setOffset(0);
      sizeSetTD.setSize(5);
      sizeSetTD.setOffset(0);

      expect(differTH.diff()).toEqual([
        ['prepend', 0],
      ]);
      expect(differTD.diff()).toEqual([
        ['none', 0],
        ['none', 1],
        ['none', 2],
        ['none', 3],
        ['none', 4],
      ]);
    });

    it('should generate "remove" leads for TH elements', () => {
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
        ['prepend', 0],
      ]);
      expect(differTD.diff()).toEqual([
        ['append', 0],
        ['append', 1],
        ['append', 2],
        ['append', 3],
        ['append', 4],
      ]);

      sizeSetTH.setSize(0);
      sizeSetTH.setOffset(0);
      sizeSetTD.setSize(5);
      sizeSetTD.setOffset(0);

      expect(differTH.diff()).toEqual([
        ['remove', 0],
      ]);
      expect(differTD.diff()).toEqual([
        ['none', 0],
        ['none', 1],
        ['none', 2],
        ['none', 3],
        ['none', 4],
      ]);
    });
  });
});
