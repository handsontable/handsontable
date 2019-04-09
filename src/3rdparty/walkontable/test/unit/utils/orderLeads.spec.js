import { createLeadsFromOrders } from 'walkontable/utils/orderLeads';

describe('createLeadsFromOrders', () => {
  it('should complete leads filled with "append" type when previous order wasn\'t exist', () => {
    expect(createLeadsFromOrders([], [0, 1, 2, 3, 4, 5])).toEqual([
      ['append', 0],
      ['append', 1],
      ['append', 2],
      ['append', 3],
      ['append', 4],
      ['append', 5],
    ]);
  });

  it('should complete leads filled with "append" type when next order is longer than previous', () => {
    expect(createLeadsFromOrders([0, 1, 2], [0, 1, 2, 3, 4, 5])).toEqual([
      ['none', 0],
      ['none', 1],
      ['none', 2],
      ['append', 3],
      ['append', 4],
      ['append', 5],
    ]);
  });

  it('should complete leads filled with "remove" type when next order is shorter than previous', () => {
    expect(createLeadsFromOrders([0, 1, 2, 3, 4, 5], [])).toEqual([
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
      expect(createLeadsFromOrders([0, 1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6])).toEqual([
        ['replace', 1, 0],
        ['none', 2],
        ['none', 3],
        ['none', 4],
        ['none', 5],
        ['append', 6],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 3 steps down according to the previous order', () => {
      expect(createLeadsFromOrders([0, 1, 2, 3, 4, 5], [3, 4, 5, 6, 7, 8])).toEqual([
        ['replace', 3, 0],
        ['replace', 4, 1],
        ['replace', 5, 2],
        ['append', 6],
        ['append', 7],
        ['append', 8],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 5 steps down according to the previous order', () => {
      expect(createLeadsFromOrders([0, 1, 2, 3, 4, 5], [5, 6, 7, 8, 9, 10])).toEqual([
        ['replace', 5, 0],
        ['replace', 6, 1],
        ['replace', 7, 2],
        ['replace', 8, 3],
        ['replace', 9, 4],
        ['append', 10],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 10 steps down according to the previous order', () => {
      expect(createLeadsFromOrders([0, 1, 2, 3, 4, 5], [10, 11, 12, 13, 14, 15])).toEqual([
        ['replace', 10, 0],
        ['replace', 11, 1],
        ['replace', 12, 2],
        ['replace', 13, 3],
        ['replace', 14, 4],
        ['replace', 15, 5],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 3 steps down and is longer (by 4 items) according to the previous order', () => {
      expect(createLeadsFromOrders([0, 1, 2, 3, 4, 5], [3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).toEqual([
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
      expect(createLeadsFromOrders([2, 3, 4, 5, 6, 7, 8], [9, 10, 11, 12, 13, 14, 15, 16])).toEqual([
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
      expect(createLeadsFromOrders([0, 1, 2, 3, 4, 5], [3, 4, 5])).toEqual([
        ['replace', 3, 0],
        ['replace', 4, 1],
        ['replace', 5, 2],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 30 steps down and is shorter (3 items) according to the previous order', () => {
      expect(createLeadsFromOrders([0, 1, 2, 3, 4, 5], [30, 31, 32])).toEqual([
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
      expect(createLeadsFromOrders([19, 20, 21, 22, 23, 24, 25, 26, 27], [21, 22, 23, 24, 25, 26, 27, 28])).toEqual([
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
      expect(createLeadsFromOrders([20, 21, 22, 23, 24, 25], [19, 20, 21, 22, 23, 24])).toEqual([
        ['insert', 19, 20, 25],
        ['none', 20],
        ['none', 21],
        ['none', 22],
        ['none', 23],
        ['none', 24],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 3 steps up according to the previous order', () => {
      expect(createLeadsFromOrders([20, 21, 22, 23, 24, 25], [17, 18, 19, 20, 21, 22])).toEqual([
        ['insert', 17, 20, 25],
        ['insert', 18, 20, 24],
        ['insert', 19, 20, 23],
        ['none', 20],
        ['none', 21],
        ['none', 22],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 5 steps up according to the previous order', () => {
      expect(createLeadsFromOrders([20, 21, 22, 23, 24, 25], [15, 16, 17, 18, 19, 20])).toEqual([
        ['insert', 15, 20, 25],
        ['insert', 16, 20, 24],
        ['insert', 17, 20, 23],
        ['insert', 18, 20, 22],
        ['insert', 19, 20, 21],
        ['none', 20],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 10 steps up according to the previous order', () => {
      expect(createLeadsFromOrders([20, 21, 22, 23, 24, 25], [10, 11, 12, 13, 14, 15])).toEqual([
        ['insert', 10, 20, 25],
        ['insert', 11, 20, 24],
        ['insert', 12, 20, 23],
        ['insert', 13, 20, 22],
        ['insert', 14, 20, 21],
        ['insert', 15, 20, 20],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 3 steps up and is longer (by 2 items) according to the previous order', () => {
      expect(createLeadsFromOrders([20, 21, 22, 23, 24, 25], [17, 18, 19, 20, 21, 22, 23, 24])).toEqual([
        ['insert', 17, 20, 25],
        ['insert', 18, 20, 24],
        ['insert', 19, 20, 23],
        ['none', 20],
        ['none', 21],
        ['none', 22],
        ['append', 23],
        ['append', 24],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 7 steps up and is longer (by 2 items) according to the previous order', () => {
      expect(createLeadsFromOrders([20, 21, 22, 23, 24, 25], [13, 14, 15, 16, 17, 18, 19, 20])).toEqual([
        ['insert', 13, 20, 25],
        ['insert', 14, 20, 24],
        ['insert', 15, 20, 23],
        ['insert', 16, 20, 22],
        ['insert', 17, 20, 21],
        ['insert', 18, 20, 20],
        ['append', 19],
        ['append', 20],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 3 steps up and is shorter (by 4 items) according to the previous order', () => {
      expect(createLeadsFromOrders([20, 21, 22, 23, 24, 25, 26], [17, 18, 19])).toEqual([
        ['insert', 17, 20, 26],
        ['insert', 18, 20, 25],
        ['insert', 19, 20, 24],
        ['remove', 20],
        ['remove', 21],
        ['remove', 22],
        ['remove', 23],
      ]);
      expect(createLeadsFromOrders([20, 21, 22, 23, 24, 25, 26], [24, 25, 26])).toEqual([
        ['replace', 24, 20],
        ['replace', 25, 21],
        ['replace', 26, 22],
        ['remove', 23],
      ]);
    });

    it('should generate correct leads when a new order is shifted by 20 steps up and is shorter (by 3 items) according to the previous order', () => {
      expect(createLeadsFromOrders([20, 21, 22, 23, 24, 25], [0, 1, 2])).toEqual([
        ['insert', 0, 20, 25],
        ['insert', 1, 20, 24],
        ['insert', 2, 20, 23],
        ['remove', 20],
        ['remove', 21],
        ['remove', 22],
      ]);
    });
  });
});
