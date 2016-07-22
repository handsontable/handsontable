'use strict';

var numbro = require('../../numbro');

exports.misc = {
    cultures: function(test) {
        if (typeof module !== 'undefined' && module.exports) {
            test.expect(1);
            var cultures = numbro.cultures();
            // test that cultures were loaded.
            // this relies on the fact that all.js is run before any of the cultures tests
            test.ok(cultures['zh-CN']);
            test.done();
        } else {
            test.done();
        }
    }
};
