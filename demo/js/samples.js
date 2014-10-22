(function () {

  function addEvent(element, event, callback) {
    if (window.addEventListener) {
      element.addEventListener(event, callback, false)
    } else {
      element.attachEvent('on' + event, callback);
    }
  }

  function ajax(url, method, callback, params) {
    var obj;
    try {
      obj = new XMLHttpRequest();
    } catch (e) {
      try {
        obj = new ActiveXObject("Msxml2.XMLHTTP");
      } catch (e) {
        try {
          obj = new ActiveXObject("Microsoft.XMLHTTP");
        } catch (e) {
          alert("Your browser does not support Ajax.");
          return false;
        }
      }
    }
    obj.onreadystatechange = function () {
      if (obj.readyState == 4) {
        callback(obj);
      }
    }
    obj.open(method, url, true);
    obj.send(params);
    return obj;
  }

  function trimCodeBlock(code, pad) {
    var i, ilen;
    pad = pad || 0;
    code = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); //escape html special chars
    code = code.split('\n');
    for (i = 0; i < 10; i++) {
      if (code[0].trim() === '') {
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

  function bindDumpButton() {
    addEvent(document.body, 'click', function (e) {
      console.log(e)
      if (e.target.nodeName == "BUTTON" && e.target.name == 'dump') {
        var dump = e.target.dataset['dump'];
        console.log(dump);
        var element = document.getElementById(dump.replace('#',''));
        console.log('data of' + dump, Handsontable.tmpHandsontable(element, 'getData'));
      }
    });
  }

  function bindFiddleButton () {
    addEvent(document.body, 'click', function (e) {
      console.log(e)
      if (e.target.className == "jsFiddleLink") {

          var keys = ['common'];
          var runfiddle = e.target.dataset['runfiddle'];;

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
            var dataFillde = document.querySelectorAll('[data-jsfiddle=' + keys[i] + ']');

            for (var x=0, len = dataFillde.length; x < len; x++) {

              var tag;


              if (dataFillde[x].nodeName === 'LINK') {
                tag = dataFillde[x].outerHTML;
              }
              else if (dataFillde[x].nodeName === 'SCRIPT' && dataFillde[x].src) {
                tag = dataFillde[x].outerHTML;
              }
              else if (dataFillde[x].nodeName === 'SCRIPT') {
                js += trimCodeBlock(dataFillde[x].innerHTML, 2).join('\n') + '\n';
              }
              else if (dataFillde[x].nodeName === 'STYLE') {
                css += trimCodeBlock(dataFillde[x].innerHTML).join('\n') + '\n';
              }
              else { //DIV

                var clone = dataFillde[x].cloneNode(true);
                var clonedExample = clone.querySelector('#' + runfiddle);
                clonedExample.innerHtml = ''; //clear example HTML, just leave container
                var originalHT = dataFillde[x].querySelector('#' + runfiddle);

                if (originalHT.data['originalStyle']) {
                  clonedExample.style = originalHT.data['originalStyle'];
                }
                //TODO
//                clone.find('a[name]').remove();
//                clone.find('.handsontable.hidden').remove();
                //

                html += trimCodeBlock(clone.innerHTML).join('\n');
              }
              if (tag) {
                tag = tag.replace(' data-jsfiddle="' + keys[i] + '"', '');

                if (tag.indexOf('href="http') === -1 && tag.indexOf('href="//') && tag.indexOf('src="http') === -1 && tag.indexOf('src="//')) {
                  tag = tag.replace('href="', 'href="' + baseUrl);
                  tag = tag.replace('src="', 'src="' + baseUrl);
                  tag = tag.replace('demo/../', '');

                  if (this.nodeName === 'LINK' && this.rel === "import") {
                    //web component imports must be loaded throught a CORS-enabling proxy, because our local server does not support it yet
                    tag = tag.replace('href="http://', 'href="http://www.corsproxy.com/');
                    onDomReady = false;
                  }
                }

                tags.push(tag)
              }
            }

          }

          tags.push('');
          tags.push('<style type="text/css">');
          tags.push('body {background: white; margin: 20px;}');
          tags.push('h2 {margin: 20px 0;}');
          css = tags.join('\n') + '\n' + css;

          js += trimCodeBlock(bindDumpButton.toString(), 2).join('\n') + '\n';
          js += '  bindDumpButton();\n\n';

          if (onDomReady) {

            document.addEventListener('DOMContentLoaded', function () {
              js
            });
//          js = '$(document).ready(function () {\n\n' + js + '});';
          }

          var form = document.createElement('FORM');
          form.action = 'http://jsfiddle.net/api/post/library/pure/';
          form.method = 'POST';
          form.target = '_blank';
          form.innerHTML = '<input type="text" name="title" value="Handsontable example">' +
            '<textarea name="html">' + html.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>' +
            '<textarea name="js">' + js.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>' +
            '<textarea name="css">' + css.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>';

          form.style.visibility = 'hidden';
//        var form = $('<form action="http://jsfiddle.net/api/post/library/pure/" method="post" target="_blank">' +
//          '<input type="text" name="title" value="Handsontable example">' +
//          '<textarea name="html">' + html.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>' +
//          '<textarea name="js">' + js.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>' +
//          '<textarea name="css">' + css.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>' +
//          '</form>');
//        form.css({
//          visibility: 'hidden'
//        });

          document.body.appendChild(form);

//        $('body').append(form);
          form.submit();
//        form.remove();



      }
    });
  }

  function init() {
    var codes = document.querySelectorAll('.descLayout pre.javascript code');
    for (var i = 0, lenI = codes.length; i < lenI; i++) {
      var script = codes[i];
      var code = trimCodeBlock(codes[i].innerHTML);
      script.innerHTML = code.join('\n');
    }

    var scripts = document.querySelectorAll('.codeLayout script');
    for (var j = 0, lenJ = scripts.length; j < lenJ; j++) {
      var script = scripts[j];
      var pre = document.createElement('PRE');
      pre.className = 'javascript';

      var code = document.createElement('CODE');
      var codeInner = trimCodeBlock(script.innerHTML);
      codeInner = codeInner.join('<br>').replace(/  /g, "&nbsp;&nbsp;");
      code.innerHTML = codeInner;
      pre.appendChild(code);
      script.parentNode.insertBefore(pre, script.nextSibling);
    }
    hljs.initHighlighting();

    bindFiddleButton();
    bindDumpButton();
  }

  function initSidebar() {

    function collapseAll(menu, isImmediate) {

      var ul = menu.querySelectorAll('ul ul');
      for (var i = 0, len = ul.length; i < len; i++) {
        ul[i].style.display = 'none';
      }
      var current = menu.querySelectorAll('.current');
      for(var x = 0, xLen = current.length; x < xLen;x++) {
        current[x].className = current[x].className.replace('current','');
      }
    }

    function expandOne(menu, expand, isImmediate) {
      collapseAll(menu, isImmediate);
      var elem = expand;
      while (elem != menu) {
        elem.className = elem.className + ' current';
        if (elem.nodeName == "UL") {
          elem.style.display = 'block';
        }
        elem = elem.parentNode;
      }
    }

    function importFromHtml(element, html, startWord, endWord) {
      if (element) {
        var fragment = html.substring(html.indexOf(startWord), html.indexOf(endWord));
        var DIV = document.createElement("DIV");
        DIV.style.display = 'none';
        DIV.innerHTML = fragment;
        element.appendChild(DIV);
        DIV.style.display = 'block';
      }
    }

    function onMenuLoad(html) {
      html = html.response;
      //top menu
      importFromHtml(document.getElementById('outside-links-wrapper'), html, "<!-- outside-links start -->", "<!-- outside-links end -->");

      //left menu
      var menu = document.getElementById('global-menu-clone');
      importFromHtml(menu, html, "<!-- menu start -->", "<!-- menu end -->");
      bindMenuEvents(menu);
      var link = menu.querySelectorAll('a');

      for (var i = 0; i < link.length; i++) {
        link[i].href = link[i].href.replace(/demo\//, "");
        if (link[i].href === window.location.href) {
          link[i].className = 'current';
          expandOne(menu, link[i], true);
        }
      }
    }

    function bindMenuEvents(menu) {
      collapseAll(menu, true);
      addEvent(menu, 'click', function (ev) {
        if (ev.target.nodeName == "H3") {
          if (ev.target.parentNode.className.indexOf('current') != -1) {
            collapseAll(menu);
          }
          else {
            expandOne(menu, ev.target.parentNode.querySelector("ul"));
          }
        }
      });
    }
    var menu = document.querySelector("#global-menu");
    if (menu) {
      bindMenuEvents(menu)
    }
    else {
      ajax("../index.html", 'GET', onMenuLoad);
    }

  }

  document.addEventListener('DOMContentLoaded', function () {
    init();
    initSidebar();
  }, false);

})();


//    (function ($) {
//      /**
//       * Removes unnecessary spaces from left side of the code block
//       * @param {String} code
//       * @param {Number} pad
//       * @return {Array}
//       */
//
//      function trimCodeBlock(code, pad) {
//        var i, ilen;
//        pad = pad || 0;
//        code = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); //escape html special chars
//        code = code.split('\n');
//        for (i = 0; i < 10; i++) {
////      if ($.trim(code[0]) === '') {
////        code.splice(0, 1);
////      }
//          if (code[0].trim() === '') {
//            code.splice(0, 1);
//          }
//        }
//        var offset = 0;
//        for (i = 0, ilen = code[0].length; i < ilen; i++) {
//          if (code[0].charAt(i) != " ") {
//            break;
//          }
//          offset++;
//        }
//        for (i = 0, ilen = code.length; i < ilen; i++) {
//          code[i] = new Array(pad + 1).join(' ') + code[i].substring(offset);
//        }
//        return code;
//      }
//
//
//      $(function () {
//        var codes = document.querySelectorAll('.descLayout pre.javascript code');
//
////    $('.descLayout pre.javascript code').each(function () {
////      var $script = $(this);
////      var code = trimCodeBlock($script[0].innerHTML);
////      $script[0].innerHTML = code.join('\n');
////    });
//
//        $('.codeLayout script').each(function () {
//          var $script = $(this);
//          var $pre = $('<pre class="javascript"></pre>');
//          var $code = $('<code></code>');
//          var code = trimCodeBlock($script[0].innerHTML);
//          code = code.join('<br>').replace(/  /g, "&nbsp;&nbsp;");
//          $code[0].innerHTML = code;
//          $pre.append($code);
//          $pre.insertAfter($script);
//        });
//        hljs.initHighlighting();
//
//        //http://stackoverflow.com/questions/2419749/get-selected-elements-outer-html
//        jQuery.fn.outerHTML = function (s) {
//          return s
//            ? this.before(s).remove()
//            : jQuery("<p>").append(this.eq(0).clone()).html();
//        };
//
//        $('.jsFiddleLink').on('click', function () {
//          var keys = ['common'];
//
//          var runfiddle = $(this).data('runfiddle');
//          if (!runfiddle) {
//            throw new Error("Edit in jsFiddle button does not contain runfiddle data");
//          }
//          keys.push(runfiddle);
//
//          var index = window.location.href.lastIndexOf("/") + 1;
//          var baseUrl = window.location.href.substr(0, index);
//
//          var tags = [];
//          var css = '';
//          var js = '';
//          var html = '';
//          var onDomReady = true;
//
//          tags.push('</style><!-- Ugly Hack due to jsFiddle issue: http://goo.gl/BUfGZ -->\n');
//
//          for (var i = 0, ilen = keys.length; i < ilen; i++) {
//            $('[data-jsfiddle=' + keys[i] + ']').each(function () {
//              var tag
//                , $this = $(this);
//              if (this.nodeName === 'LINK') {
//                tag = $this.outerHTML();
//              }
//              else if (this.nodeName === 'SCRIPT' && $this.attr('src')) {
//                tag = $this.outerHTML();
//              }
//              else if (this.nodeName === 'SCRIPT') {
//                js += trimCodeBlock($this.html(), 2).join('\n') + '\n';
//              }
//              else if (this.nodeName === 'STYLE') {
//                css += trimCodeBlock($this.html()).join('\n') + '\n';
//              }
//              else { //DIV
//                var clone = $this.clone();
//                var clonedExample = clone.find('div[id^="example"]');
//                clonedExample.html(''); //clear example HTML, just leave container
//                var originalHT = $this.find('div[id^="example"]');
//                if (originalHT.data('originalStyle')) {
//                  clonedExample.attr('style', originalHT.data('originalStyle'));
//                }
//                clone.find('a[name]').remove();
//                clone.find('.handsontable.hidden').remove();
//                html += trimCodeBlock(clone.html()).join('\n');
//              }
//              if (tag) {
//                tag = tag.replace(' data-jsfiddle="' + keys[i] + '"', '');
//
//                if (tag.indexOf('href="http') === -1 && tag.indexOf('href="//') && tag.indexOf('src="http') === -1 && tag.indexOf('src="//')) {
//                  tag = tag.replace('href="', 'href="' + baseUrl);
//                  tag = tag.replace('src="', 'src="' + baseUrl);
//                  tag = tag.replace('demo/../', '');
//
//                  if (this.nodeName === 'LINK' && this.rel === "import") {
//                    //web component imports must be loaded throught a CORS-enabling proxy, because our local server does not support it yet
//                    tag = tag.replace('href="http://', 'href="http://www.corsproxy.com/');
//                    onDomReady = false;
//                  }
//                }
//
//                tags.push(tag)
//              }
//            });
//          }
//
//          tags.push('');
//          tags.push('<style type="text/css">');
//          tags.push('body {background: white; margin: 20px;}');
//          tags.push('h2 {margin: 20px 0;}');
//          css = tags.join('\n') + '\n' + css;
//
//          js += trimCodeBlock(importFromHtml.toString(), 2).join('\n') + '\n';
//          js += '  bindDumpButton();\n\n';
//
//          if (onDomReady) {
//            js = '$(document).ready(function () {\n\n' + js + '});';
//          }
//
//          var form = $('<form action="http://jsfiddle.net/api/post/library/pure/" method="post" target="_blank">' +
//            '<input type="text" name="title" value="Handsontable example">' +
//            '<textarea name="html">' + html.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>' +
//            '<textarea name="js">' + js.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>' +
//            '<textarea name="css">' + css.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>' +
//            '</form>');
//          form.css({
//            visibility: 'hidden'
//          });
//          $('body').append(form);
//          form.submit();
//          form.remove();
//        });
//
//        bindDumpButton();
//      });
//
//      function bindDumpButton() {
//        $('body').on('click', 'button[name=dump]', function () {
//          var dump = $(this).data('dump');
//          var $container = $(dump);
//          console.log('data of ' + dump, $container.handsontable('getData'));
//        });
//      }
//    })(jQuery);
