function strip_tags(input, allowed) {
  // http://kevin.vanzonneveld.net
  // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   improved by: Luke Godfrey
  // +      input by: Pul
  // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   bugfixed by: Onno Marsman
  // +      input by: Alex
  // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +      input by: Marc Palau
  // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +      input by: Brett Zamir (http://brett-zamir.me)
  // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   bugfixed by: Eric Nagel
  // +      input by: Bobby Drake
  // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   bugfixed by: Tomasz Wesolowski
  // +      input by: Evertjan Garretsen
  // +    revised by: Rafał Kukawski (http://blog.kukawski.pl/)
  // *     example 1: strip_tags('<p>Kevin</p> <br /><b>van</b> <i>Zonneveld</i>', '<i><b>');
  // *     returns 1: 'Kevin <b>van</b> <i>Zonneveld</i>'
  // *     example 2: strip_tags('<p>Kevin <img src="someimage.png" onmouseover="someFunction()">van <i>Zonneveld</i></p>', '<p>');
  // *     returns 2: '<p>Kevin van Zonneveld</p>'
  // *     example 3: strip_tags("<a href='http://kevin.vanzonneveld.net'>Kevin van Zonneveld</a>", "<a>");
  // *     returns 3: '<a href='http://kevin.vanzonneveld.net'>Kevin van Zonneveld</a>'
  // *     example 4: strip_tags('1 < 5 5 > 1');
  // *     returns 4: '1 < 5 5 > 1'
  // *     example 5: strip_tags('1 <br/> 1');
  // *     returns 5: '1  1'
  // *     example 6: strip_tags('1 <br/> 1', '<br>');
  // *     returns 6: '1  1'
  // *     example 7: strip_tags('1 <br/> 1', '<br><br/>');
  // *     returns 7: '1 <br/> 1'
  allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
  var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
    commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
  return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
    return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
  });
}

$(function () {
  if (!$.browser.msie || parseInt($.browser.version, 10) > 6) { //syntax coloring does not work well with IE7
    $('.codeLayout script').each(function () {
      var i;
      var $script = $(this);
      var $pre = $('<pre class="javascript"></pre>');
      var $code = $('<code></code>');
      var code = $script[0].innerHTML;
      code = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); //escape html special chars
      code = code.split('\n');
      if ($.trim(code[0]) === '') {
        code.splice(0, 1);
      }
      if ($.trim(code[0]) === '') {
        code.splice(0, 1);
      }
      var offset = 0;
      for (i = 0, ilen = code[0].length; i < ilen; i++) {
        if (code[0].charAt(i) != " ") {
          break;
        }
        offset++;
      }
      for (i = 0, ilen = code.length; i < ilen; i++) {
        code[i] = code[i].substring(offset);
      }
      code = code.join('<br>').replace(/  /g, "&nbsp;&nbsp;");
      $code[0].innerHTML = code;
      $pre.append($code);
      $pre.insertAfter($script);
    });
    hljs.initHighlighting();
  }

  $('button[name=dump]').on('click', function () {
    var dump = $(this).data('dump');
    var $container = $(dump);
    console.log('data of ' + dump, $container.handsontable('getData'));
  });

  if (window.location.hostname === 'warpech.github.com') {
    $('#domainNotice').show();
  }
});