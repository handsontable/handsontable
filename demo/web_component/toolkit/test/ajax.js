/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('g-ajax', function() {
  var ajax;
  
  setup(function() {
    ajax = document.createElement('g-ajax');
    work.appendChild(ajax);
    // init properties
    ajax.url = 'http://gdata.youtube.com/feeds/api/videos/';
    ajax.params = '{"alt":"json", "q":"chrome"}';
    ajax.handleAs = 'json';
  });
  
  teardown(function() {
    work.textContent = '';
  });

  test('go', function(done) {
    ajax.go();
    ajax.addEventListener('response', function(e) {
      var r = e.detail.response;
      expect(r.feed.entry.length).to.be.greaterThan(1);
      done();
    });
  });
  
  test('auto', function(done) {
    ajax.auto = true;
    ajax.addEventListener('response', function(e) {
      var r = e.detail.response;
      expect(r.feed.entry.length).to.be.greaterThan(1);
      done();
    });
  });
});
