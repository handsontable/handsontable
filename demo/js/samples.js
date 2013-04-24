/**
 * Removes unnecessary spaces from left side of the code block
 * @param {String} code
 * @param {Number} pad
 * @return {Array}
 */

function trimCodeBlock(code, pad) {
  var i;
  pad = pad || 0;
  code = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); //escape html special chars
  code = code.split('\n');
  for (i = 0; i < 10; i++) {
    if ($.trim(code[0]) === '') {
      code.splice(0, 1);
    }
  }
  var offset = 0;
  for (i = 0, ilen = code[0].length; i < ilen; i++) {
    if (code[0].charAt(i) != " ") {
      break;
    }
    offset++;
  }
  for (i = 0, ilen = code.length; i < ilen; i++) {
    code[i] = new Array(pad + 1).join(' ') + code[i].substring(offset);
  }
  return code;
}

$(function() {
  if (!$.browser.msie || parseInt($.browser.version, 10) > 6) { //syntax coloring does not work well with IE7
    $('.descLayout pre.javascript code').each(function() {
      var $script = $(this);
      var code = trimCodeBlock($script[0].innerHTML);
      $script[0].innerHTML = code.join('\n');
    });

    $('.codeLayout script').each(function() {
      var $script = $(this);
      var $pre = $('<pre class="javascript"></pre>');
      var $code = $('<code></code>');
      var code = trimCodeBlock($script[0].innerHTML);
      code = code.join('<br>').replace(/  /g, "&nbsp;&nbsp;");
      $code[0].innerHTML = code;
      $pre.append($code);
      $pre.insertAfter($script);
    });
    hljs.initHighlighting();
  }

  $('.jsFiddleLink').on('click', function() {
    var css = [];

    css.push('</style><!-- Ugly Hack due to jsFiddle issue: http://goo.gl/BUfGZ -->\n');
    css.push('<script src="http://handsontable.com/lib/jquery.min.js"></script>\n');
    css.push('<script src="http://handsontable.com/dist/jquery.handsontable.full.js"></script>\n');

    if (window.Bootstrap) { // these need to be before jquery.handsontable.full.css
      css.push('<script type="text/javascript" src="http://handsontable.com/demo/bootstrap/js/bootstrap.min.js"></script>\n');
      css.push('<link rel="stylesheet" type="text/css" href="http://handsontable.com/demo/bootstrap/css/bootstrap.min.css">\n');
    }

    css.push('<link rel="stylesheet" media="screen" href="http://handsontable.com/dist/jquery.handsontable.full.css">\n');
    css.push('<link rel="stylesheet" media="screen" href="http://handsontable.com/demo/css/samples.css">\n');

    if (window.Bootstrap) {
      css.push('<link rel="stylesheet" media="screen" href="http://handsontable.com/extensions/jquery.handsontable.bootstrap.css">\n');
    }

    if ($.ui && $.ui.datepicker) {
      css.push('<script src="http://handsontable.com/lib/jquery-ui/js/jquery-ui.custom.min.js"></script>\n');
      css.push('<link rel="stylesheet" media="screen" href="http://handsontable.com/lib/jquery-ui/css/ui-bootstrap/jquery-ui.custom.css">\n');
    }

    if (window.Backbone) {
      css.push('<script src="http://handsontable.com/demo/js/backbone/lodash.underscore.js"></script>\n');
      css.push('<script src="http://handsontable.com/demo/js/backbone/backbone.js"></script>\n');
      css.push('<script src="http://handsontable.com/demo/js/backbone/backbone-relational/backbone-relational.js"></script>\n');
    }

    css.push('<style type="text/css">\nbody {background: white; margin: 20px;}\nh2 {margin: 20px 0;}\n\n');
    css = css.join('');

    $('style.common').each(function() {
      css += trimCodeBlock($(this).html()).join('\n') + '\n';
    });

    var js = '$(document).ready(function () {\n\n';

    js += trimCodeBlock(bindDumpButton.toString(), 2).join('\n') + '\n';
    js += '  bindDumpButton();\n\n';

    $('script.common').each(function() {
      js += trimCodeBlock($(this).html(), 2).join('\n') + '\n';
    });
    $(this).parents('.codeLayout').find('script').not('.common').each(function() {
      js += trimCodeBlock($(this).html(), 2).join('\n') + '\n';
    });
    js += '});';

    var clone = $(this).parents('.rowLayout').find('.descLayout .pad').clone();
    var example = clone.find('div[id^="example"]');
    example.html('');
    var originalHT = $(this).parents('.rowLayout').find('.descLayout .pad div[id^="example"]');
    if (originalHT.data('originalStyle')) {
      example.attr('style', originalHT.data('originalStyle'));
    }
    clone.find('a[name]').remove();
    var html = trimCodeBlock(clone.html()).join('\n');

    var form = $('<form action="http://jsfiddle.net/api/post/library/pure/" method="post" target="_blank">' +
      '<input type="text" name="title" value="Handsontable example">' +
      '<textarea name="html">' + html.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>' +
      '<textarea name="js">' + js.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>' +
      '<textarea name="css">' + css.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>' +
      '</form>');
    form.css({
      visibility: 'hidden'
    });
    $('body').append(form);
    $(form).submit();
  });

  bindDumpButton();
});

function bindDumpButton() {
  $('body').on('click', 'button[name=dump]', function() {
    var dump = $(this).data('dump');
    var $container = $(dump);
    console.log('data of ' + dump, $container.handsontable('getData'));
  });
}