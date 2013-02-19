(function(){

var test = function(inImpl) {
  render(function(){/*
    <g-A><span id="a1">Where am I?</span></g-A>
  
    <template id="A">[A->]<g-B><content></content></g-B>[<-A]</template>
    <template id="B">[B->][<content></content>][<-B]</template>
  */});
  //
  Component.reset();
  Component.register('g-A', ['A'], {
    orangify: function() {
      this.style.color = 'orange';
    }
  });
  Component.register('g-B', ['B']);
  Component.upgradeAll($('#work'));
  //
  var A = c$[0];
  A.orangify();
  return A;
};

describe('(7.1)-composition', function() {
  var expected = '<g-a is="g-A" style="color: orange;">[A-&gt;]<g-b is="g-B">[B-&gt;][<span id="a1">Where am I?</span>][&lt;-B]</g-b>[&lt;-A]</g-a>';
  testImpls(test, expected);
});

})();