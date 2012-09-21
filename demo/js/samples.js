$(function () {
  if (!$.browser.msie || parseInt($.browser.version, 10) > 7) { //syntax coloring does not work well with IE7
    $('.codeLayout script').each(function (i, e) {
      var $script = $(this);
      var $pre = $('<pre class="code"></pre>');
      var code = $script.html();
      code = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); //escape html special chars
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
      $pre.text(code.join('\n'))
      $pre.insertAfter($script);
      hljs.highlightBlock($pre[0])
    });
  }
});