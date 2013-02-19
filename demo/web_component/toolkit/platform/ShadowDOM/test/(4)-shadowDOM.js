(function(){

var test = function() {
  render(function(){/*
      <A>
        <span>Where am I?</span>
      </A>
      <template id="A">
        <span>A's Template</span>
      </template>
  */});
  var root = new ShadowRoot('A', 'A')
  return root.host;
};

describe('(4)-shadowDOM', function() {
  var expected = '<a>        <span>A\'s Template</span>      </a>';
  testImpls(test, expected);
});

})();