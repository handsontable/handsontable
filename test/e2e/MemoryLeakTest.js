// this file is called MemoryLeakTest.js (not MemoryLeak.spec.js) to make sure it is manually executed as the last suite
describe('MemoryLeakTest', () => {
  it('after all Handsontable instances are destroy()\'d, there should be no more active listeners', () => {
    expect(Handsontable._getListenersCounter()).toBe(0);
  });

  it('should not leave any any DOM containers, except for those created by Jasmine', () => {
    let leftoverNodesCount = 0;

    document.body.children.forEach((child) => {
      if (child.nodeName !== 'SCRIPT' && !child.className.includes('jasmine')) {
        leftoverNodesCount += 1;
      }
    });

    expect(leftoverNodesCount).toBe(0);
  });
});
