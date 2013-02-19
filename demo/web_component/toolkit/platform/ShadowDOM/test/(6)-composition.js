(function(){

var test = function() {
  render(function(){/*
    <g-A><span id="a1">Where am I?</span></g-A>

    <template id="A">[A->]<br/>
        a B:
        <g-B>Content For B</g-B>
        A's content: [<content></content>]
    <br/>[<-A]</template>
    <template id="B">[B->][<content></content>][<-B]</template>
  */});
  var root = new ShadowRoot('g-A', 'A');
  new ShadowRoot(ShadowDOM.localQuery(root, 'g-B'), 'B')
  return root.host;
};

describe('(6)-composition', function() {
  var expected = '<g-a>[A-&gt;]<br>        a B:        <g-b>[B-&gt;][Content For B][&lt;-B]</g-b>        A\'s content: [<span id="a1">Where am I?</span>]    <br>[&lt;-A]</g-a>';
  testImpls(test, expected);
});

})();