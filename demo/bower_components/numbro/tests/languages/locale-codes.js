'use strict';

var cultures = require('./../../languages');

/* Tests for the format of locale codes used in numbro cultures.
 * Tested against the regex /^[a-z]{2,3}(?:-[A-Z]{2,3}(?:-[a-zA-Z]{4})?)?$/g
 * http://stackoverflow.com/a/3962578/1702775
 */

exports['locale-codes'] = {
    default: function (test) {
        var keys = Object.keys(cultures);
        test.expect(keys.length);
        keys.forEach(function(key) {
            var lang = cultures[key];
            test.strictEqual(true, /^[a-z]{2,3}(?:-[A-Z]{2,3}(?:-[a-zA-Z]{4})?)?$/g.test(lang.langLocaleCode),
                "Invalid locale code '" + lang.langLocaleCode + "' in culture " + key);
        });
        test.done();
    }
};
