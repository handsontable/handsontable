suite('PointerMap', function() {
  test('PointerMap is a constructor', function() {
    var p = new PointerMap;
    expect(p).to.be.a(PointerMap);
  });
  test('PointerMap has Map API', function() {
    var keys = [
      'set',
      'get',
      'has',
      'delete',
      'size'
    ];
    expect(PointerMap.prototype).to.have.keys(keys);
  });
  test('PointerMap has .item', function() {
    expect(PointerMap.prototype).to.have.key('item');
  });
  test('PointerMap .set', function() {
    var p = new PointerMap;
    p.set(1, true);
    expect(p.ids).to.have.length(1);
    expect(p.pointers).to.have.length(1);
    expect(p.size).to.be(1);
  });
  test('PointerMap .get', function() {
    var p = new PointerMap;
  });
  test('PointerMap .size', function() {
    var p = new PointerMap;
    expect(p.size).not.to.be.a('function');
    expect(p.size).to.be(0);
    p.set(1, true);
    expect(p.size).to.be(1);
    p.set(1, false);
    expect(p.size).to.be(1);
  });
  test('PointerMap .has', function() {
    var p = new PointerMap;
    p.set(1, true);
    expect(p.has(1)).to.be(true);
    expect(p.has(0)).to.be(false);
  });
  test('PointerMap .delete', function() {
    var p = new PointerMap;
    p.set(1, true);
    p.set(2, false);
    expect(p.size).to.be(2);
    p.delete(1);
    expect(p.size).to.be(1);
    expect(p.get(2)).to.be(false);
  });
  test('PointerMap .item', function() {
    var p = new PointerMap;
    p.set(2, false);
    p.set(1, true);
    expect(p.item(0)).to.be(p.get(2));
  });
});
