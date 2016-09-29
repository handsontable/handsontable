'use strict';

var numbro = require('../../numbro'),
    culture = require('../../languages/en-ZA');

numbro.culture(culture.langLocaleCode, culture);

exports['culture:en-ZA'] = {
    setUp: function (callback) {
        numbro.culture('en-ZA');
        callback();
    },

    tearDown: function (callback) {
        numbro.culture('en-US');
        callback();
    },

    format: function (test) {
        test.expect(16);

        var tests = [
            [10000,'0,0.0000','10,000.0000'],
            [10000.23,'0,0','10,000'],
            [-10000,'0,0.0','-10,000.0'],
            [10000.1234,'0.000','10000.123'],
            [-10000,'(0,0.0000)','(10,000.0000)'],
            [-0.23,'.00','-.23'],
            [-0.23,'(.00)','(.23)'],
            [0.23,'0.00000','0.23000'],
            [1230974,'0.0a','1.2m'],
            [1460,'0a','1k'],
            [-104000,'0a','-104k'],
            [1,'0o','1st'],
            [52,'0o','52nd'],
            [23,'0o','23rd'],
            [100,'0o','100th'],
            [1,'0[.]0','1']
        ];

        for (var i = 0; i < tests.length; i++) {
            test.strictEqual(numbro(tests[i][0]).format(tests[i][1]), tests[i][2], tests[i][1]);
        }

        test.done();
    },

    currency: function (test) {
        test.expect(4);

        var tests = [
            [1000.234,'$0,0.00','R1,000.23'],
            [-1000.234,'($0,0)','(R1,000)'],
            [-1000.234,'$0.00','-R1000.23'],
            [1230974,'($0.00a)','R1.23m']
        ];

        for (var i = 0; i < tests.length; i++) {
            test.strictEqual(numbro(tests[i][0]).format(tests[i][1]), tests[i][2], tests[i][1]);
        }

        test.done();
    },

    percentages: function (test) {
        test.expect(4);

        var tests = [
            [1,'0%','100%'],
            [0.974878234,'0.000%','97.488%'],
            [-0.43,'0%','-43%'],
            [0.43,'(0.000%)','43.000%']
        ];

        for (var i = 0; i < tests.length; i++) {
            test.strictEqual(numbro(tests[i][0]).format(tests[i][1]), tests[i][2], tests[i][1]);
        }

        test.done();
    },

    unformat: function (test) {
        test.expect(9);

        var tests = [
            ['10,000.123',10000.123],
            ['(0.12345)',-0.12345],
            ['(R1.23m)',-1230000],
            ['10k',10000],
            ['-10k',-10000],
            ['23rd',23],
            ['R10,000.00',10000],
            ['-76%',-0.76],
            ['2:23:57',8637]
        ];

        for (var i = 0; i < tests.length; i++) {
            test.strictEqual(numbro().unformat(tests[i][0]), tests[i][1], tests[i][0]);
        }

        test.done();
    }
};
