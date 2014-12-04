//this file is called MemoryLeakTest.js (not MemoryLeakSpec.js) to make sure it is manually executed as the last suite
describe('MemoryLeakTest', function () {
  //this is temporarily commented because it fails with 6640. Keep this uncommented to prove event management is free from memory leaks
  it("after all Handsontable instances are destroy()'d, there should be no more active listeners", function () {
    expect(Handsontable.countEventManagerListeners).toEqual(0);
  });
});
