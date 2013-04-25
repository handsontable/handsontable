suite('PointerMap', function() {
  test('PointerMap has Map API', function() {
    var keys = [
      'set',
      'get',
      'has',
      'delete',
      'size'
    ];
    expect(PointerEventsPolyfill.PointerMap.prototype).to.contain.keys(keys);
  });
  test('PointerMap has .item', function() {
    expect(PointerEventsPolyfill.PointerMap.prototype).to.contain.key('item');
  });
  test('PointerMap .set', function() {
    var p = new PointerEventsPolyfill.PointerMap;
    p.set(1, true);
    expect(p.ids).to.have.length(1);
    expect(p.pointers).to.have.length(1);
    expect(p.size).to.equal(1);
  });
  test('PointerMap .get', function() {
    var p = new PointerEventsPolyfill.PointerMap;
  });
  test('PointerMap .size', function() {
    var p = new PointerEventsPolyfill.PointerMap;
    expect(p.size).not.to.be.a('function');
    expect(p.size).to.equal(0);
    p.set(1, true);
    expect(p.size).to.equal(1);
    p.set(1, false);
    expect(p.size).to.equal(1);
  });
  test('PointerMap .has', function() {
    var p = new PointerEventsPolyfill.PointerMap;
    p.set(1, true);
    expect(p.has(1)).to.equal(true);
    expect(p.has(0)).to.equal(false);
  });
  test('PointerMap .delete', function() {
    var p = new PointerEventsPolyfill.PointerMap;
    p.set(1, true);
    p.set(2, false);
    expect(p.size).to.equal(2);
    p.delete(1);
    expect(p.size).to.equal(1);
    expect(p.get(2)).to.equal(false);
  });
  test('PointerMap .item', function() {
    var p = new PointerEventsPolyfill.PointerMap;
    p.set(2, false);
    p.set(1, true);
    expect(p.item(0)).to.equal(p.get(2));
  });
});
