var Pikaday = require('../'),
    expect = require('expect.js');

describe('Pikaday public method', function ()
{
    'use strict';

    describe('#toString()', function ()
    {
        it('should return empty string when date not set', function ()
        {
            var pikaday = new Pikaday();
            expect(pikaday.toString()).to.be.empty;
        });

        it('should return date string, formatted by moment, when date is set', function() {
            var date = new Date(2014, 3, 25),
            pikaday = new Pikaday({
                format: 'DD-MM-YY'
            });

            pikaday.setDate(date);
            expect(pikaday.toString()).to.eql('25-04-14');
        });
    });
});