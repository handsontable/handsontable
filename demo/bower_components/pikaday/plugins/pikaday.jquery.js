/*!
 * Pikaday jQuery plugin.
 *
 * Copyright © 2013 David Bushell | BSD & MIT license | https://github.com/dbushell/Pikaday
 */

(function (root, factory)
{
    'use strict';

    if (typeof exports === 'object') {
        // CommonJS module
        factory(require('jquery'), require('../pikaday'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'pikaday'], factory);
    } else {
        // Browser globals
        factory(root.jQuery, root.Pikaday);
    }
}(this, function ($, Pikaday)
{
    'use strict';

    $.fn.pikaday = function()
    {
        var args = arguments;

        if (!args || !args.length) {
            args = [{ }];
        }

        return this.each(function()
        {
            var self   = $(this),
                plugin = self.data('pikaday');

            if (!(plugin instanceof Pikaday)) {
                if (typeof args[0] === 'object') {
                    var options = $.extend({}, args[0]);
                    options.field = self[0];
                    self.data('pikaday', new Pikaday(options));
                }
            } else {
                if (typeof args[0] === 'string' && typeof plugin[args[0]] === 'function') {
                    plugin[args[0]].apply(plugin, Array.prototype.slice.call(args,1));

                    if (args[0] === 'destroy') {
                        self.removeData('pikaday');
                    }
                }
            }
        });
    };

}));
