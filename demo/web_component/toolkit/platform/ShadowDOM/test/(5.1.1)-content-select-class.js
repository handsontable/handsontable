(function(){

var test = function() {
  render(function(){/*
    <g-A>
      <div class="a">To DIV.a perchance</div><span class="b">To SPAN.b or not</span>
    </g-A>
    <template id="A">
      A's template<br/>
      div content:
      <content select=".a"></content>
      span content:
      <div><content select=".b"></content></div>
    </template>
  */});
  // make ShadowRoot
  var root = new ShadowRoot('g-A', 'A');
  return root.host;
};

describe('(5.1.1)-content-select-class', function() {
  var expected = '<g-a>      A\'s template<br>      div content:      <div class="a">To DIV.a perchance</div>      span content:      <div><span class="b">To SPAN.b or not</span></div>    </g-a>';
  testImpls(test, expected);
});

})();