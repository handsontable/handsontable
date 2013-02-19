(function(){

var test = function() {
  render(function(){/*
    <g-A><span id="a1">Where am I?</span></g-A>

    <template id="A">[A->]<g-B><content></content></g-B>[<-A]</template>
    <template id="B">[B->]<g-C><content></content></g-C>[<-B]</template>
    <template id="C">[C->]<g-D><content></content></g-D>[<-C]</template>
    <template id="D">[D->][<content></content>][<-D]</template>
  */});
  var root = new ShadowRoot('g-A', 'A');
  var br = new ShadowRoot(ShadowDOM.localQuery(root, 'g-B'), 'B');
  var cr = new ShadowRoot(ShadowDOM.localQuery(br, 'g-C'), 'C');
  new ShadowRoot(ShadowDOM.localQuery(cr, 'g-D'), 'D');
  return root.host;
};

describe('(6.2)-more-reprojection', function() {
  var expected = '<g-a>[A-&gt;]<g-b>[B-&gt;]<g-c>[C-&gt;]<g-d>[D-&gt;][<span id="a1">Where am I?</span>][&lt;-D]</g-d>[&lt;-C]</g-c>[&lt;-B]</g-b>[&lt;-A]</g-a>';
  testImpls(test, expected);
});

})();