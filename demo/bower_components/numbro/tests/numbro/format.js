'use strict';

var numbro = require('../../numbro');

exports.format = {
    default: function (test) {
        test.expect(1);

        numbro.defaultFormat('0,0');

        test.strictEqual(numbro(10000).format(), '10,000', '0.0');

        test.done();
    },
    value: function (test) {
        var tests = [
                '0,0.00',
                '$0,0.00',
                '0b',
                '0,0%',
                '00:00:00'
            ],
            value = 12345.6,
            n = numbro(value),
            format,
            i;

        test.expect(test.length);

        for (i = 0; i < tests.length; i++) {
            format = n.format(test[i]);
            test.strictEqual(n.value(), value, 'value unchanged after format' + test[i]);
        }

        test.done();
    },
    numbers: function (test) {
        var tests = [
                [0,'+0','0'],
                [10000,'0,0.0000','10,000.0000'],
                [10000.23,'0,0','10,000'],
                [-10000,'0,0.0','-10,000.0'],
                [10000.1234,'0.000','10000.123'],
                [10000,'0[.]00','10000'],
                [10000.1,'0[.]00','10000.10'],
                [10000.123,'0[.]00','10000.12'],
                [10000.456,'0[.]00','10000.46'],
                [10000.001,'0[.]00','10000'],
                [10000.45,'0[.]00[0]','10000.45'],
                [10000.456,'0[.]00[0]','10000.456'],
                [-10000,'(0,0.0000)','(10,000.0000)'],
                [-12300,'+0,0.0000','-12,300.0000'],
                [1230,'+0,0','+1,230'],
                [100.78, '0', '101'],
                [100.28, '0', '100'],
                [1.932,'0.0','1.9'],
                [1.9687,'0','2'],
                [1.9687,'0.0','2.0'],
                [-0.23,'.00','-.23'],
                [-0.23,'(.00)','(.23)'],
                [0.23,'0.00000','0.23000'],
                [0.67,'0.0[0000]','0.67'],
                [1.005,'0.00','1.01'],
                [2000000000,'0.0a','2.0b'],
                [1230974,'0.0a','1.2m'],
                [1460,'0a','1k'],
                [-104000,'0 a','-104 k'],
                [1,'0o','1st'],
                [52,'0 o','52 nd'],
                [23,'0o','23rd'],
                [100,'0o','100th'],
                [3124213.12341234, '0.*', '3124213.12341234'],
                [3124213.12341234, ',0.*', '3,124,213.12341234'],

                [1, '000', '001'],
                [10, '000', '010'],
                [100, '000', '100'],
                [1000, '000', '1000'],

                // specified abbreviations
                [-5444333222111, '0,0 aK', '-5,444,333,222 k'],
                [-5444333222111, '0,0 aM', '-5,444,333 m'],
                [-5444333222111, '0,0 aB', '-5,444 b'],
                [-5444333222111, '0,0 aT', '-5 t'],

                //forced precision in abbreviated
                [123, '0 a', '123 '],
                [123, '1 a', '123 '],
                [123, '2 a', '123 '],
                [123, '3 a', '123 '],
                [123, '4 a', '123 '],

                [1450, '4 a', '1450 '],
                [-1450, '4 a', '-1450 '],

                [1234567, '4 a', '1235 k'],

                [123456789, '0 a', '123 m'],
                [123456789, '2 a', '123 m'],
                [123456789, '3 a', '123 m'],
                [123456789, '4 a', '123.5 m'],
                [123456789, '5 a', '123.46 m'],
                [123456789, '6 a', '123457 k'],
                [123456789, '7 a', '123456.8 k'],
                [123456789, '8 a', '123456.79 k'],
                [123456789, '9 a', '123456789 '],
                [1234567891, '10 a', '1234567891 '],

                [18823.85, '6 a', '18823.9 '],
                [188235.85, '6 a', '188236 '],
                [1882357.85, '6 a', '1882.36 k'],
                [18823578.85, '6 a', '18823.6 k'],
                [188235773.85, '6 a', '188236 k'],

                // large numbers
                [100, '0,0[.]0000','100'],
                [1e23, '0,0[.]0000','100,000,000,000,000,000,000,000'],

                [1e19, '0,0.0000','10,000,000,000,000,000,000.0000'],
                [1e20, '0,0.0000','100,000,000,000,000,000,000.0000'],
                [1e21, '0,0.0000','1,000,000,000,000,000,000,000.0000'],
                [1e22, '0,0.0000','10,000,000,000,000,000,000,000.0000'],
                [1e23, '0,0.0000','100,000,000,000,000,000,000,000.0000'],

                [-1e19, '0,0.0000','-10,000,000,000,000,000,000.0000'],
                [-1e20, '0,0.0000','-100,000,000,000,000,000,000.0000'],
                [-1e21, '0,0.0000','-1,000,000,000,000,000,000,000.0000'],
                [-1e22, '0,0.0000','-10,000,000,000,000,000,000,000.0000'],
                [-1e23, '0,0.0000','-100,000,000,000,000,000,000,000.0000'],

                [1.1e23, '0,0.0000','110,000,000,000,000,000,000,000.0000'],
                [1.11e23, '0,0.0000','111,000,000,000,000,000,000,000.0000'],
                [1.111e23, '0,0.0000','111,100,000,000,000,000,000,000.0000'],

                // small numbers - see issue #145
                [1e-5, '0','0'],
                [1e-5, '0.0','0.0'],
                [1e-5, '0.00000','0.00001'],
                [1e-5, '0.00000000','0.00001000'],
                [1e-23, '0.0','0.0'],
                [1e-23, '0.000','0.000'],
                [1e-23, '0.00000000000000000000000','0.00000000000000000000001'],
                [1.1e-23, '0.000000000000000000000000','0.000000000000000000000011'],
                [-0.001, '0.00','0.00'],
                [-0.001, '0.000','-0.001'],
                [-1e-5, '0.00','0.00'],
                [-1e-23, '0.0000000000000000000000','0.0000000000000000000000'],
                [-1e-23, '0.00000000000000000000000','-0.00000000000000000000001'],
                [-1.1e-23, '0.000000000000000000000000','-0.000000000000000000000011'],

                // Non-finite numbers
                [Infinity, '0.0', 'Infinity'],
                [-Infinity, '0.0', '-Infinity'],
                [NaN, '0.0', 'NaN']
            ],
            i;

        test.expect(tests.length);

        for (i = 0; i < tests.length; i++) {
            test.strictEqual(numbro(tests[i][0]).format(tests[i][1]), tests[i][2], tests[i][1]);
        }

        test.done();
    },

    currency: function (test) {
        var tests = [
                [1000.234,'$0,0.00','$1,000.23'],
                [1001,'$ 0,0.[00]','$ 1,001'],
                [1000.234,'+$0,0.00','+$1,000.23'],
                [1000.234,'$+0,0.00','$+1,000.23'],
                [1000.234,'0,0.00 $','1,000.23 $'],
                [-1000.234,'($0,0)','($1,000)'],
                [-1000.234,'(0,0$)','(1,000$)'],
                [-1000.234,'$0.00','-$1000.23'],
                [-1000.234,'+$0,0.00','-$1,000.23'],
                [1230974,'($0.00 a)','$1.23 m'],
                [1000.234,'+$0a','+$1k'],

                // test symbol position before negative sign / open parens
                [-1000.234,'$ (0,0)','$ (1,000)'],
                [-1000.234,'$(0,0)','$(1,000)'],
                [-1000.234,'$ (0,0.00)','$ (1,000.23)'],
                [-1000.234,'$(0,0.00)','$(1,000.23)'],
                [-1000.238,'$(0,0.00)','$(1,000.24)'],
                [-1000.238,'$(-0,0.00)','$(-1,000.24)'],
                [-1000.234,'$-0,0','$-1,000'],
                [-1000.234,'$ -0,0','$ -1,000'],

                [1000.234,'$ (0,0)','$ 1,000'],
                [1000.234,'$(0,0)','$1,000'],
                [1000.234,'$ (0,0.00)','$ 1,000.23'],
                [1000.234,'$(0,0.00)','$1,000.23'],
                [1000.238,'$(0,0.00)','$1,000.24'],
                [1000.234,'$-0,0)','$1,000'],
                [1000.234,'$ -0,0','$ 1,000'],

                // small numbers - see issue #145
                [-0.00000000000001,'$0,0','$0'],
                [-0.00000000000001,'$0,0.00','$0.00']
            ],
            i;

        test.expect(tests.length);

        for (i = 0; i < tests.length; i++) {
            test.strictEqual(numbro(tests[i][0]).format(tests[i][1]), tests[i][2], tests[i][1]);
        }

        test.done();
    },

    foreignCurrency: function (test) {
        var currentCulture = numbro.culture();

        numbro.culture('test1', {
            delimiters: {
                thousands: ',',
                decimal: '.'
            },
            abbreviations: {
                thousand: 'k',
                million: 'm',
                billion: 'b',
                trillion: 't'
            },
            currency: {
                symbol: '$',
                position: 'postfix',
                spaceSeparated: false
            },
            defaults: {
                currencyFormat: '(0.00a)'
            }
        });

        numbro.culture('test1');

        var tests = [
                [1000.234,'€','$0,0.00','€1,000.23'],
                [1001,'€','$ 0,0.[00]','€ 1,001'],
                [1000.234,'€','+$0,0.00','+€1,000.23'],
                [1000.234,'€','$+0,0.00','€+1,000.23'],
                [1000.234,'€','0,0.00 $','1,000.23 €'],
                [-1000.234,'€','($0,0)','(€1,000)'],
                [-1000.234,'€','(0,0$)','(1,000€)'],
                [-1000.234,'€','$0.00','-€1000.23'],
                [-1000.234,'€','+$0,0.00','-€1,000.23'],
                [1230974,'€','($0.00 a)','€1.23 m'],
                [1000.234,'€','+$0a','+€1k'],

                // test symbol position before negative sign / open parens
                [-1000.234,'€','$ (0,0)','€ (1,000)'],
                [-1000.234,'€','$(0,0)','€(1,000)'],
                [-1000.234,'€','$ (0,0.00)','€ (1,000.23)'],
                [-1000.234,'€','$(0,0.00)','€(1,000.23)'],
                [-1000.238,'€','$(0,0.00)','€(1,000.24)'],
                [-1000.238,'€','$(-0,0.00)','€(-1,000.24)'],
                [-1000.234,'€','$-0,0','€-1,000'],
                [-1000.234,'€','$ -0,0','€ -1,000'],

                [1000.234,'€','$ (0,0)','€ 1,000'],
                [1000.234,'€','$(0,0)','€1,000'],
                [1000.234,'€','$ (0,0.00)','€ 1,000.23'],
                [1000.234,'€','$(0,0.00)','€1,000.23'],
                [1000.238,'€','$(0,0.00)','€1,000.24'],
                [1000.234,'€','$-0,0)','€1,000'],
                [1000.234,'€','$ -0,0','€ 1,000'],

                // small numbers - see issue #145
                [-0.00000000000001,'€','$0,0','€0'],
                [-0.00000000000001,'€','$0,0.00','€0.00']
            ],
            i;

        var testsWithoutFormatString = [
                [0.1,'$','0 $'],
                [25,'$','25 $'],
                [107, '$', '107 $'],
                [9288,'$','9.288 $'],
                [10965, '$','10.965 $'],
                [100522, '$', '100.522 $'],
                [1999999, '$', '1.999.999 $'],
                [23333333, '$', '23.333.333 $']
            ],
            j;

        test.expect(tests.length + testsWithoutFormatString.length);

        for (i = 0; i < tests.length; i++) {
            test.strictEqual(numbro(tests[i][0]).formatForeignCurrency(tests[i][1], tests[i][2]), tests[i][3], tests[i][2]);
        }

        numbro.culture('de-DE');

        for (j = 0; j < testsWithoutFormatString.length; j++) {
            test.strictEqual(numbro(testsWithoutFormatString[j][0]).formatForeignCurrency(testsWithoutFormatString[j][1]), testsWithoutFormatString[j][2]);
        }

        numbro.culture(currentCulture);
        test.done();
    },

    formatPostfixedCurrency: function (test) {
        var i;
        var currentCulture = numbro.culture();

        numbro.culture('test1', {
            delimiters: {
                thousands: ',',
                decimal: '.'
            },
            abbreviations: {
                thousand: 'k',
                million: 'm',
                billion: 'b',
                trillion: 't'
            },
            currency: {
                symbol: '$',
                position: 'postfix',
                spaceSeparated: false
            },
            defaults: {
                currencyFormat: '(0.00a)'
            }
        });

        numbro.culture('test1');


        var tests = [
            [100.23, '100.23$'],
            [-100.23, '(100.23$)'],
            [100000.23, '100.00k$']
        ];

        test.expect(tests.length);

        for (i = 0; i < tests.length; i++) {
            test.strictEqual(numbro(tests[i][0]).formatCurrency(), tests[i][1], tests[i][1]);
        }

        numbro.culture(currentCulture);
        test.done();
    },

    formatPostfixedWithSpaceCurrency: function (test) {
        var i;
        var currentCulture = numbro.culture();

        numbro.culture('test2', {
            delimiters: {
                thousands: ',',
                decimal: '.'
            },
            abbreviations: {
                thousand: 'k',
                million: 'm',
                billion: 'b',
                trillion: 't'
            },
            currency: {
                symbol: '$',
                position: 'postfix',
                spaceSeparated: true
            },
            defaults: {
                currencyFormat: '(0.00a)'
            }
        });

        numbro.culture('test2');


        var tests = [
            [100.23, '100.23 $'],
            [100000.23, '100.00k $'],
            [-100.23, '(100.23 $)']
        ];

        test.expect(tests.length);

        for (i = 0; i < tests.length; i++) {
            test.strictEqual(numbro(tests[i][0]).formatCurrency(), tests[i][1], tests[i][1]);
        }

        numbro.culture(currentCulture);
        test.done();
    },

    formatInfixedCurrency: function (test) {
        var i;
        var currentCulture = numbro.culture();

        numbro.culture('test3', {
            delimiters: {
                thousands: ',',
                decimal: '.'
            },
            abbreviations: {
                thousand: 'k',
                million: 'm',
                billion: 'b',
                trillion: 't'
            },
            currency: {
                symbol: '$',
                position: 'infix',
                spaceSeparated: false
            },
            defaults: {
                currencyFormat: '(0.00a)'
            }
        });

        numbro.culture('test3');


        var tests = [
            [100.23, '100$23'],
            [100000.23, '100k$00'],
            [-100.23, '(100$23)']
        ];

        test.expect(tests.length);

        for (i = 0; i < tests.length; i++) {
            test.strictEqual(numbro(tests[i][0]).formatCurrency(), tests[i][1], tests[i][1]);
        }

        numbro.culture(currentCulture);
        test.done();
    },

    formatInfixedWithSpaceCurrency: function (test) {
        var i;
        var currentCulture = numbro.culture();

        numbro.culture('test4', {
            delimiters: {
                thousands: ',',
                decimal: '.'
            },
            abbreviations: {
                thousand: 'k',
                million: 'm',
                billion: 'b',
                trillion: 't'
            },
            currency: {
                symbol: '$',
                position: 'infix',
                spaceSeparated: true
            },
            defaults: {
                currencyFormat: '(0.00a)'
            }
        });

        numbro.culture('test4');


        var tests = [
            [100.23, '100 $ 23'],
            [100000.23, '100k $ 00'],
            [-100.23, '(100 $ 23)']
        ];

        test.expect(tests.length);

        for (i = 0; i < tests.length; i++) {
            test.strictEqual(numbro(tests[i][0]).formatCurrency(), tests[i][1], tests[i][1]);
        }

        numbro.culture(currentCulture);
        test.done();
    },
    formatPrefixedCurrency: function (test) {
        var i;
        var currentCulture = numbro.culture();

        numbro.culture('test5', {
            delimiters: {
                thousands: ',',
                decimal: '.'
            },
            abbreviations: {
                thousand: 'k',
                million: 'm',
                billion: 'b',
                trillion: 't'
            },
            currency: {
                symbol: '$',
                position: 'prefix',
                spaceSeparated: false
            },
            defaults: {
                currencyFormat: '-(0.00a)'
            }
        });

        numbro.culture('test5');


        var tests = [
            [100.23, '$100.23'],
            [100000.23, '$100.00k'],
            [-100.23, '-($100.23)']
        ];

        test.expect(tests.length);

        for (i = 0; i < tests.length; i++) {
            test.strictEqual(numbro(tests[i][0]).formatCurrency(), tests[i][1], tests[i][1]);
        }

        numbro.culture(currentCulture);
        test.done();
    },

    formatPrefixedWithSpaceCurrency: function (test) {
        var i;
        var currentCulture = numbro.culture();

        numbro.culture('test6', {
            delimiters: {
                thousands: ',',
                decimal: '.'
            },
            abbreviations: {
                thousand: 'k',
                million: 'm',
                billion: 'b',
                trillion: 't'
            },
            currency: {
                symbol: '$',
                position: 'prefix',
                spaceSeparated: true
            },
            defaults: {
                currencyFormat: '(0.00a)'
            }
        });

        numbro.culture('test6');


        var tests = [
            [100.23, '$ 100.23'],
            [100000.23, '$ 100.00k'],
            [-100.23, '($ 100.23)']
        ];

        test.expect(tests.length);

        for (i = 0; i < tests.length; i++) {
            test.strictEqual(numbro(tests[i][0]).formatCurrency(), tests[i][1], tests[i][1]);
        }

        numbro.culture(currentCulture);
        test.done();
    },

    escape: function (test) {
        var i;
        var currentCulture = numbro.culture();

        numbro.culture('test7', {
            delimiters: {
                thousands: ',',
                decimal: '.'
            },
            abbreviations: {
                thousand: 'k',
                million: 'm',
                billion: 'b',
                trillion: 't'
            },
            ordinal: function(number) {
              return "th";
            },
            currency: {
                symbol: '€',
                position: 'prefix'
            }
        });

        numbro.culture('test7');


        var tests = [
            [100, '$0', '€100'],
            [100, '{$}0', '$100'],
            [100, '{foo }0o', 'foo 100th'],
            [100, '0o{ foo}', '100th foo'],
            [100, '{$  }0', '$  100'],
            [100, '0{%}', '100%'],
            [100, '0{:}', '100:'],
            [100,'0{b}','100b']
        ];

        test.expect(tests.length);

        for (i = 0; i < tests.length; i++) {
            test.strictEqual(numbro(tests[i][0]).format(tests[i][1]), tests[i][2], tests[i][1]);
        }

        numbro.culture(currentCulture);
        test.done();
    },

    bytes: function (test) {
        var tests = [
                [0,'0 bd','0 B'],
                [100,'0bd','100B'],
                [1024*2,'0 bd','2 KB'],
                [1024*1024*5,'0bd','5MB'],
                [1024*1024*1024*7.343,'0.[0] bd','7.3 GB'],
                [1024*1024*1024*1024*3.1536544,'0.000bd','3.154TB'],
                [1024*1024*1024*1024*1024*2.953454534534,'0bd','3PB'],
                [1024*1024*1024*1024*1024*1024*1024*1024*1024, '0 bd', '1024 YB'],
                [0,'0 b','0 B'],
                [100,'0b','100B'],
                [1024*2,'0 b','2 KiB'],
                [1024*1024*5,'0b','5MiB'],
                [1024*1024*1024*7.343,'0.[0] b','7.3 GiB'],
                [1024*1024*1024*1024*3.1536544,'0.000b','3.154TiB'],
                [1024*1024*1024*1024*1024*2.953454534534,'0b','3PiB'],
                [1024*1024*1024*1024*1024*1024*1024*1024*1024, '0 b', '1024 YiB'],
                [0,'0 d','0 B'],
                [100,'0d','100B'],
                [1000*2,'0 d','2 KB'],
                [1000*1000*5,'0d','5MB'],
                [1000*1000*1000*7.343,'0.[0] d','7.3 GB'],
                [1000*1000*1000*1000*3.1536544,'0.000d','3.154TB'],
                [1000*1000*1000*1000*1000*2.953454534534,'0d','3PB'],
                [1000*1000*1000*1000*1000*1000*1000*1000*1000, '0 d', '1000 YB'],
            ].reduce(function (tests, test) {
              tests.push(test);
              if (test[0] > 0) {
                tests.push([test[0] * -1, test[1], '-' + test[2]]);
              }
              return tests;
            }, []),
            i;

        test.expect(tests.length);

        for (i = 0; i < tests.length; i++) {
            test.strictEqual(numbro(tests[i][0]).format(tests[i][1]), tests[i][2], tests[i][1] + "(" + i + ")");
        }

        test.done();
    },

    percentages: function (test) {
        var tests = [
                [1,'0%','100%'],
                [0.974878234,'0.000%','97.488%'],
                [-0.43,'0 %','-43 %'],
                [0.43,'(0.00[0]%)','43.00%']
            ],
            i;

        test.expect(tests.length);

        for (i = 0; i < tests.length; i++) {
            test.strictEqual(numbro(tests[i][0]).format(tests[i][1]), tests[i][2], tests[i][1]);
        }

        test.done();
    },

    times: function (test) {
        var tests = [
                [25,'00:00:00','0:00:25'],
                [238,'00:00:00','0:03:58'],
                [63846,'00:00:00','17:44:06']
            ],
            i;

        test.expect(tests.length);

        for (i = 0; i < tests.length; i++) {
            test.strictEqual(numbro(tests[i][0]).format(tests[i][1]), tests[i][2], tests[i][1]);
        }

        test.done();
    },

    rounding: function (test) {
      var tests = [
            // value, format string, expected w/ floor, expected w/ ceil
            [2280002, '0.00a', '2.28m', '2.29m'],
            [10000.23,'0,0','10,000', '10,001'],
            [1000.234,'$0,0.00','$1,000.23', '$1,000.24'],
            [0.974878234,'0.000%','97.487%','97.488%'],
            [-0.433,'0 %','-44 %', '-43 %']
        ],
        i;

      test.expect(tests.length * 2);

      for (i = 0; i < tests.length; i++) {
          // floor
          test.strictEqual(numbro(tests[i][0]).format(tests[i][1], Math.floor), tests[i][2], tests[i][1] + ', floor');

          // ceil
          test.strictEqual(numbro(tests[i][0]).format(tests[i][1], Math.ceil), tests[i][3], tests[i][1] + ', ceil');

      }

      test.done();

    }
};
