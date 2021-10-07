// this file is called MemoryLeakTest.js (not MemoryLeak.spec.js) to make sure it is manually executed as the last suite
describe('MemoryLeakTest', () => {
  it('after all Walkontable instances are destroyed, there should be no more active listeners', () => {
    expect(Walkontable.getListenersCounter()).toEqual(0);
  });

  it('should not leave any any DOM containers, except for those created by Jasmine', () => {
    let leftoverNodesCount = 0;

    Array.from(document.body.children).forEach((child) => {
      if (child.nodeName !== 'SCRIPT' && !child.className.includes('jasmine')) {
        leftoverNodesCount += 1;
      }
    });

    expect(leftoverNodesCount).toBe(0);
  });
});
