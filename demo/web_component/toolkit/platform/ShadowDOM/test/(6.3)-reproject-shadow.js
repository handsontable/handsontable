(function(){

var test = function() {
  render(function(){/*
    <g-A><span id="a1">Where am I?</span></g-A>

    <!-- content must project through shadow's content to become B content -->
    <template id="A">[A->]<g-B><shadow></shadow></g-B>[<-A]</template>
    <!-- content inserts into this shadow -->
    <template id="Ab">[Ab->]<content></content>[<-Ab]</template>
    <!-- simply echo content -->
    <template id="B">[B->]<content></content>[<-B]</template>
  */});
  new ShadowRoot('g-A', 'Ab');
  var root = new ShadowRoot('g-A', 'A');
  new ShadowRoot(ShadowDOM.localQuery(root, 'g-B'), 'B');
  return root.host;
};

describe('(6.3)-reproject-shadow', function() {
  var expected = '<g-a>[A-&gt;]<g-b>[B-&gt;][Ab-&gt;]<span id="a1">Where am I?</span>[&lt;-Ab][&lt;-B]</g-b>[&lt;-A]</g-a>';
  // skip WebkitShadowDOM since shadow reprojection is not supported yet
  testImpls(test, expected, true);
});

})();