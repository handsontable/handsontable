(function ($) {
  /**
   * Removes unnecessary spaces from left side of the code block
   * @param {String} code
   * @param {Number} pad
   * @return {Array}
   */

  function trimCodeBlock(code, pad) {
    var i, ilen;
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

  $(function () {
    $('.descLayout pre.javascript code').each(function () {
      var $script = $(this);
      var code = trimCodeBlock($script[0].innerHTML);
      $script[0].innerHTML = code.join('\n');
    });

    $('.codeLayout script').each(function () {
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

    //http://stackoverflow.com/questions/2419749/get-selected-elements-outer-html
    jQuery.fn.outerHTML = function (s) {
      return s
        ? this.before(s).remove()
        : jQuery("<p>").append(this.eq(0).clone()).html();
    };

    $('.jsFiddleLink').on('click', function () {
      var keys = ['common'];

      var runfiddle = $(this).data('runfiddle');
      if (!runfiddle) {
        throw new Error("Edit in jsFiddle button does not contain runfiddle data");
      }
      keys.push(runfiddle);

      var index = window.location.href.lastIndexOf("/") + 1;
      var baseUrl = window.location.href.substr(0, index);

      var tags = [];
      var css = '';
      var js = '';
      var html = '';
      var onDomReady = true;

      tags.push('</style><!-- Ugly Hack due to jsFiddle issue: http://goo.gl/BUfGZ -->\n');

      for (var i = 0, ilen = keys.length; i < ilen; i++) {
        $('[data-jsfiddle=' + keys[i] + ']').each(function () {
          var tag
            , $this = $(this);
          if (this.nodeName === 'LINK') {
            tag = $this.outerHTML();
          }
          else if (this.nodeName === 'SCRIPT' && $this.attr('src')) {
            tag = $this.outerHTML();
          }
          else if (this.nodeName === 'SCRIPT') {
            js += trimCodeBlock($this.html(), 2).join('\n') + '\n';
          }
          else if (this.nodeName === 'STYLE') {
            css += trimCodeBlock($this.html()).join('\n') + '\n';
          }
          else { //DIV
            var clone = $this.clone();
            var clonedExample = clone.find('div[id^="example"]');
            clonedExample.html(''); //clear example HTML, just leave container
            var originalHT = $this.find('div[id^="example"]');
            if (originalHT.data('originalStyle')) {
              clonedExample.attr('style', originalHT.data('originalStyle'));
            }
            clone.find('a[name]').remove();
            clone.find('.handsontable.hidden').remove();
            html += trimCodeBlock(clone.html()).join('\n');
          }
          if (tag) {
            tag = tag.replace(' data-jsfiddle="' + keys[i] + '"', '');

            if (tag.indexOf('href="http') === -1 && tag.indexOf('href="//') && tag.indexOf('src="http') === -1 && tag.indexOf('src="//')) {
              tag = tag.replace('href="', 'href="' + baseUrl);
              tag = tag.replace('src="', 'src="' + baseUrl);
              tag = tag.replace('demo/../', '');

              if(this.nodeName === 'LINK' && this.rel === "import") {
                //web component imports must be loaded throught a CORS-enabling proxy, because our local server does not support it yet
                tag = tag.replace('href="http://', 'href="http://www.corsproxy.com/');
                onDomReady = false;
              }
            }

            tags.push(tag)
          }
        });
      }

      tags.push('');
      tags.push('<style type="text/css">');
      tags.push('body {background: white; margin: 20px;}');
      tags.push('h2 {margin: 20px 0;}');
      css = tags.join('\n') + '\n' + css;

      js += trimCodeBlock(bindDumpButton.toString(), 2).join('\n') + '\n';
      js += '  bindDumpButton();\n\n';

      if(onDomReady) {
        js = '$(document).ready(function () {\n\n' + js + '});';
      }

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
      form.submit();
      form.remove();
    });

    bindDumpButton();
  });

  function bindDumpButton() {
    $('body').on('click', 'button[name=dump]', function () {
      var dump = $(this).data('dump');
      var $container = $(dump);
      console.log('data of ' + dump, $container.handsontable('getData'));
    });
  }
})(jQuery);