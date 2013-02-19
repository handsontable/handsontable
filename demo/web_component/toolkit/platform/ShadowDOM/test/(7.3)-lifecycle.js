(function(){

var test = function(inImpl) {
  render(function(){/*
    <g-A><span id="a1">Where am I?</span><span id="a2">Where do I go?</span></g-A>

    <template id="A">[A->]<content></content>[<-A]</template>
  */});
  //
  Component.reset();
  Component.register("g-A", ["A"], {
    created: function() {
      this.content = ShadowDOM.localQuery(this.shadow, "content");
    },
    alter: function() {
      if (this.content.hasAttribute("select") && this.content.attributes.select.value == "#a2") {
        this.content.setAttribute("select", "#a1");
      } else {
        this.content.setAttribute("select", "#a2");
      }
      ShadowDOM.distribute(this);
    }
  });
  //
  Component.upgradeAll($('#work'));
  //
  var A = c$[0];
  A.alter();
  return A;
};

describe('(7.3)-lifecycle', function() {
  var expected = '<g-a is="g-A">[A-&gt;]<span id="a2">Where do I go?</span>[&lt;-A]</g-a>';
  testImpls(test, expected);
});

})();