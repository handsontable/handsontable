(function(){

var test = function() {
  render(function(){/*
    <g-A>
      <span>Where am I?</span>
    </g-A>
    <template id="A">[<content select="*"></content>]</template>
  */});
  // make ShadowRoot
  var root = new ShadowRoot('g-A', 'A');
  return root.host;
};

describe('(5.1.2)-content-select-all', function() {
  var expected = '<g-a>[<span>Where am I?</span>]</g-a>';
  testImpls(test, expected);
});

})();