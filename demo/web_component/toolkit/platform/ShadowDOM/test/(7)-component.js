(function(){

var test = function(inImpl) {
  render(function(){/*
    <g-A><span id="a1">Where am I?</span></g-A>

    <template id="A">[A->][<content></content>][<-A]</template>
  */});
  //
  Component.reset();
  Component.register('g-A', ['A'], {
    orangify: function() {
      this.style.color = 'orange';
    }
  });
  Component.upgradeAll($('#work'));
  //
  var A = c$[0];
  A.orangify();
  return A;
};

describe('(7)-component', function() {
  var expected = '<g-a is="g-A" style="color: orange;">[A-&gt;][<span id="a1">Where am I?</span>][&lt;-A]</g-a>';
  testImpls(test, expected);
});

})();