$(function () {
  if (!$.browser.msie || parseInt($.browser.version, 10) > 6) { //syntax coloring does not work well with IE7
    $('.codeLayout script').each(function (i, e) {
      var $script = $(this);
      var $pre = $('<pre class="javascript"></pre>');
      var $code = $('<code></code>');
      var code = $script[0].innerHTML;
      code = code.replace(/\t/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); //escape html special chars
      code = code.split('\n');
      if ($.trim(code[0]) === '') {
        code.splice(0, 1);
      }
      var offset = 0;
      for (var i = 0, ilen = code[0].length; i < ilen; i++) {
        if (code[0][i] != " ") {
          break;
        }
        offset++;
      }
      for (var i = 0, ilen = code.length; i < ilen; i++) {
        code[i] = code[i].slice(offset);
      }
      $code.html(code.join('<br>'));
      $pre.append($code);
      $pre.insertAfter($script);
    });
    hljs.initHighlighting();
  }

  $('button').on('click', function () {
    var dump = $(this).data('dump');
    var $container = $(dump);
    console.log('data of ' + dump, $container.handsontable('getData'));
  });
});