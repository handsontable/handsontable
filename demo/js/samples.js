/*
 * https://developer.mozilla.org/en-US/docs/Web/Events/DOMContentLoaded
 *
 * contentloaded.js
 *
 * Author: Diego Perini (diego.perini at gmail.com)
 * Summary: cross-browser wrapper for DOMContentLoaded
 * Updated: 20101020
 * License: MIT
 * Version: 1.2
 *
 * URL:
 * http://javascript.nwbox.com/ContentLoaded/
 * http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
 *
 */

// @win window reference
// @fn function reference
function contentLoaded(win, fn) {

  var done = false, top = true,

    doc = win.document,
    root = doc.documentElement,
    modern = doc.addEventListener,

    add = modern ? 'addEventListener' : 'attachEvent',
    rem = modern ? 'removeEventListener' : 'detachEvent',
    pre = modern ? '' : 'on',

    init = function(e) {
      if (e.type == 'readystatechange' && doc.readyState != 'complete') return;
      (e.type == 'load' ? win : doc)[rem](pre + e.type, init, false);
      if (!done && (done = true)) fn.call(win, e.type || e);
    },

    poll = function() {
      try { root.doScroll('left'); } catch(e) { setTimeout(poll, 50); return; }
      init('poll');
    };

  if (doc.readyState == 'complete') fn.call(win, 'lazy');
  else {
    if (!modern && root.doScroll) {
      try { top = !win.frameElement; } catch(e) { }
      if (top) poll();
    }
    doc[add](pre + 'DOMContentLoaded', init, false);
    doc[add](pre + 'readystatechange', init, false);
    win[add](pre + 'load', init, false);
  }
}


function ajax(url, method, params, callback) {
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
  };
  obj.open(method, url, true);
  obj.setRequestHeader("X-Requested-With", "XMLHttpRequest");
  obj.setRequestHeader("Content-type","application/x-www-form-urlencoded");
  obj.send(params);

  return obj;
}

(function () {


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

    Handsontable.dom.addEvent(document.body, 'click', function (e) {

      var element = e.target || e.srcElement;

      if (element.nodeName == "BUTTON" && element.name == 'dump') {
        var name = element.getAttribute('data-dump');
        var instance = element.getAttribute('data-instance');
        var hot = window[instance];
        console.log('data of ' + name, hot.getData());
      }
    });
  }

  function bindFiddleButton() {
    Handsontable.dom.addEvent(document.body, 'click', function (e) {
      var element = e.target || e.srcElement;

      if (element.className == "jsFiddleLink") {

        var keys = ['common'];
        var runfiddle = element.getAttribute('data-runfiddle');

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
        tags.push('<script src="https://code.jquery.com/jquery-1.11.1.min.js"></script>\n');

        for (var i = 0, ilen = keys.length; i < ilen; i++) {

          var dataFillde = document.querySelectorAll('[data-jsfiddle=' + keys[i] + ']');

          for (var x = 0, len = dataFillde.length; x < len; x++) {

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
              clonedExample.innerHTML = ''; //clear example HTML, just leave container
              var originalHT = dataFillde[x].querySelector('#' + runfiddle);

              var originalStyle = originalHT.getAttribute('data-originalstyle');
              if (originalStyle) {
                clonedExample.setAttribute('style', originalStyle);
              }

              var aName = clone.querySelectorAll('a[name]');
              var hotHidden = clone.querySelectorAll('handsontable.hidden');

              for (var n = 0, nLen = aName.length; n < nLen; n++) {
                aName[n].parentNode.removeChild(aName[n]);
              }

              for (var h = 0, hLen = hotHidden.length; h < hLen; h++) {
                hotHidden[h].parentNode.removeChild(hotHidden[h]);
              }

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
          js = '$(document).ready(function () {\n\n' + js + '});';
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
        form.submit();
        form.parentNode.removeChild(form);


      }
    });
  }

  function init() {
    var codes = document.querySelectorAll('.descLayout pre.javascript code');
    for (var i = 0, lenI = codes.length; i < lenI; i++) {
      var scriptS = codes[i];
      var codeS = trimCodeBlock(codes[i].innerHTML);
      scriptS.innerHTML = codeS.join('\n');
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
    updateFooter();
  }

  function updateFooter () {
    var footer = document.querySelector(".footer-text");
    if(!footer) {
      return true;
    }
    // Email obfuscator script 2.1 by Tim Williams, University of Arizona
    // Random encryption key feature by Andrew Moulden, Site Engineering Ltd
    // This code is freeware provided these four comment lines remain intact
    // A wizard to generate this code is at http://www.jottings.com/obfuscator/

    var coded = "1iffw@1R42Vw4nR0fi.Gwa";
    var key = "GF9al7W2hVXHzeENn30K6QkruRfxov1IATMigJ4BcYLmZSyd5swUpDOCtqb8Pj";
    var shift = coded.length;
    var link = "";
    var ltr;

    for (var i = 0; i < coded.length; i++) {
      if (key.indexOf(coded.charAt(i)) == -1) {
        ltr = coded.charAt(i)
        link += (ltr)
      }
      else {
        ltr = (key.indexOf(coded.charAt(i)) - shift + key.length) % key.length
        link += (key.charAt(ltr))
      }
    }

    footer.innerHTML = 'Handsontable &copy; 2012-' + new Date().getFullYear() + ' Nextgen. Contact us at <a href="mailto:' + link + '">'+ link +'</a>.<br> Code and documentation licensed under the The MIT License.';

  }

  function initSidebar() {

    function collapseAll(menu) {

      var ul = menu.querySelectorAll('ul ul');
      for (var i = 0, len = ul.length; i < len; i++) {
        ul[i].style.display = 'none';
      }
      var current = menu.querySelectorAll('.current');
      for (var x = 0, xLen = current.length; x < xLen; x++) {
        current[x].className = current[x].className.replace('current', '');
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
      html = html.response || html.responseText;
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
          //expandOne(menu, link[i], true);
        }
      }
    }

    function bindMenuEvents(menu) {
      //collapseAll(menu, true);
      //Handsontable.dom.addEvent(menu, 'click', function (ev) {
      //  var element = ev.target || ev.srcElement;
      //
      //  if (element.nodeName == "H3") {
      //    if (element.parentNode.className.indexOf('current') != -1) {
      //      collapseAll(menu);
      //    }
      //    else {
      //      expandOne(menu, element.parentNode.querySelector("ul"));
      //    }
      //  }
      //});
    }

    var menu = document.querySelector("#global-menu");
    if (menu) {
      bindMenuEvents(menu);
    }
    else {
      ajax("../index.html", 'GET', '', onMenuLoad);
    }

  }


  var initAll = function () {
    init();
    initSidebar();
  };

  contentLoaded(window, function (event) {
    initAll();
  });

//if(document.addEventListener) {
//  document.addEventListener('DOMContentLoaded', initAll, false);
//} else {
//  document.attachEvent('DOMContentLoaded', initAll);
//}


})();

