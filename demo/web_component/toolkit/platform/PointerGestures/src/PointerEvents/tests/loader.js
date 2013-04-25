/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('Loader', function() {
  test('PointerEvent', function() {
    expect(PointerEvent).to.be.ok;
  });
  suite('PointerEventsPolyfill modules', function() {
    var pep = window.PointerEventsPolyfill;
    test('PointerEventsPolyfill', function() {
      expect(pep).to.be.ok;
    });
    test('PointerMap', function() {
      expect(pep.PointerMap).to.be.ok;
    });
    test('SideTable', function() {
      expect(pep.SideTable).to.be.ok;
    });
    test('Dispatcher', function() {
      expect(pep.dispatcher).to.be.ok;
    });
    test('Installer', function() {
      expect(pep.installer).to.be.ok;
    });
    test('Target Finding', function() {
      expect(pep.targetFinding).to.be.ok;
    });
  });
});
