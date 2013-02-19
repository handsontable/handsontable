(function(){

var test = function() {
  render(function(){/*
    <g-A>
      <div>To DIV perchance</div><span>To SPAN or not</span>
    </g-A>
    <template id="A">
      A's template<br/>
      content 1:
      <content select="div"></content>
      <br>
      <div>content 2: </div>
    </template>
  */});
  // make ShadowRoot
  var root = new ShadowRoot('g-A', 'A');
  var host = root.host;
  //
  var changeContent = function() {
    ShadowDOM.localQuery(root, 'content').setAttribute('select', 'span');
    ShadowDOM.distribute(host);
  }
  //
  var addContent = function() {
    var content = document.createElement('content');
    content.setAttribute('select', 'div');
    var div = ShadowDOM.localQuery(root, 'div');
    div.appendChild(content);
    ShadowDOM.distribute(host);
  }
  //
  changeContent();
  addContent();
  //
  return host;
};

describe('(5.1.3)-content-select-dynamic', function() {
  var expected = '<g-a>      A\'s template<br>      content 1:      <span>To SPAN or not</span>      <br>      <div>content 2: <div>To DIV perchance</div></div>    </g-a>';
  testImpls(test, expected);
});

})();