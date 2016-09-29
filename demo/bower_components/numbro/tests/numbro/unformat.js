'use strict';

var numbro = require('../../numbro');

exports.unformat = {
    setUp: function (callback) {
        numbro.zeroFormat('N/A');
        callback();
    },

    numbers: function (test) {
        test.expect(20);

        var tests = [
                ['10,000.123', 10000.123],
                ['(0.12345)', -0.12345],
                ['((--0.12345))', 0.12345],
                ['23rd', 23],
                ['31st', 31],
                ['1.23t', 1230000000000],
                ['N/A', 0],

                // Invalid strings which don't represent a number are converted
                // to undefined.
                ['', undefined],
                ['not a number', undefined],

                // Pass Through for Numbers
                [0, 0],
                [1, 1],
                [1.1, 1.1],
                [-0, 0],
                [-1, -1],
                [-1.1, -1.1],
                [NaN, NaN],

                // JavaScript values which are neither Number or String are
                // converted to undefined.
                [undefined, undefined],
                [null, undefined],
                [[], undefined],
                [{}, undefined]
            ],
            val;

        for (var i = 0; i < tests.length; i++) {
            val = numbro().unformat(tests[i][0]);
            if (isNaN(tests[i][1])) {
              test.ok(isNaN(val), tests[i][0]);
            } else {
              test.strictEqual(val, tests[i][1], tests[i][0]);
            }
        }

        test.done();
    },

    currency: function (test) {
        test.expect(2);

        var tests = [
                ['($1.23m)', -1230000],
                ['$ 10,000.00', 10000]
            ];

        for (var i = 0; i < tests.length; i++) {
            test.strictEqual(numbro().unformat(tests[i][0]), tests[i][1], tests[i][0]);
        }

        test.done();
    },

    bytes: function (test) {
        var tests = [
                ['100B', 100],
                ['3.154 TiB', 3467859674006],
                ['3.154 TB', 3154000000000],
                ['1.5YiB', 1.5*1024*1024*1024*1024*1024*1024*1024*1024], // 1024^8
                ['1.5YB', 1.5*1000*1000*1000*1000*1000*1000*1000*1000], // 1000^8
                ['1024YiB', 1024*1024*1024*1024*1024*1024*1024*1024*1024], // 1024^9
                ['1000YB', 1000*1000*1000*1000*1000*1000*1000*1000*1000] // 1024^9
            ];

        test.expect(tests.length);

        for (var i = 0; i < tests.length; i++) {
            test.strictEqual(numbro().unformat(tests[i][0]), tests[i][1], tests[i][0]);
        }

        test.done();
    },

    percentages: function (test) {
        test.expect(1);

        var tests = [
                ['-76%', -0.76]
            ];

        for (var i = 0; i < tests.length; i++) {
            test.strictEqual(numbro().unformat(tests[i][0]), tests[i][1], tests[i][0]);
        }

        test.done();
    },

    time: function (test) {
        test.expect(1);

        var tests = [
                ['2:23:57', 8637]
            ];

        for (var i = 0; i < tests.length; i++) {
            test.strictEqual(numbro().unformat(tests[i][0]), tests[i][1], tests[i][0]);
        }

        test.done();
    }
};
