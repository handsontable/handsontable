// this file is called MemoryLeakTest.js (not MemoryLeak.spec.js) to make sure it is manually executed as the last suite
describe('MemoryLeakTest', () => {
  it('after all Handsontable instances are destroy()\'d, there should be no more active listeners', () => {
    expect(Handsontable._getListenersCounter()).toBe(0);
  });
});
