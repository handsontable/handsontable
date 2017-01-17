'use strict';

var numbro = require('../../numbro');

exports.manipulate = {

    add: function (test) {
        test.expect(4);

        var tests = [
                [1000,10,1010],
                [0.5,3,3.5],
                [-100,200,100],
                [0.1,0.2,0.3]
            ],
            num;

        for (var i = 0; i < tests.length; i++) {
            num = numbro(tests[i][0]);
            num.add(tests[i][1]);
            test.strictEqual(num.value(), tests[i][2], tests[i][0] + ' + ' + tests[i][1]);
        }

        test.done();
    },

    subtract: function (test) {
        test.expect(4);

        var tests = [
                [1000,10,990],
                [0.5,3,-2.5],
                [-100,200,-300],
                [0.3,0.1,0.2]
            ],
            num;

        for (var i = 0; i < tests.length; i++) {
            num = numbro(tests[i][0]);
            num.subtract(tests[i][1]);
            test.strictEqual(num.value(), tests[i][2], tests[i][0] + ' - ' + tests[i][1]);
        }

        test.done();
    },

    multiply: function (test) {
        test.expect(4);

        var tests = [
                [1000,10,10000],
                [0.5,3,1.5],
                [-100,200,-20000],
                [0.1,0.2,0.02]
            ],
            num;

        for (var i = 0; i < tests.length; i++) {
            num = numbro(tests[i][0]);
            num.multiply(tests[i][1]);
            test.strictEqual(num.value(), tests[i][2], tests[i][0] + ' * ' + tests[i][1]);
        }

        test.done();
    },

    divide: function (test) {
        test.expect(4);

        var tests = [
                [1000,10,100],
                [0.5,3,0.16666666666666666],
                [-100,200,-0.5],
                [5.3,0.1,53]
            ],
            num;

        for (var i = 0; i < tests.length; i++) {
            num = numbro(tests[i][0]);
            num.divide(tests[i][1]);
            test.strictEqual(num.value(), tests[i][2], tests[i][0] + ' / ' + tests[i][1]);
        }

        test.done();
    },

    difference: function (test) {
        test.expect(4);

        var tests = [
                [1000,10,990],
                [0.5,3,2.5],
                [-100,200,300],
                [0.3,0.2,0.1]
            ],
            num;

        for (var i = 0; i < tests.length; i++) {
            num = numbro(tests[i][0]);
            test.strictEqual(num.difference(tests[i][1]), tests[i][2],
                'Difference between ' + tests[i][0] + ' and ' + tests[i][1]);
        }

        test.done();
    }

};