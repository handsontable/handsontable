(function(){

var test = function() {
  render(function(){/*
    <g-A><span id="a1">Where am I?</span></g-A>

    <template id="A">[A->]<g-B><content></content></g-B>[<-A]</template>
    <template id="B">[B->][<content></content>][<-B]</template>
  */});
  var root = new ShadowRoot('g-A', 'A');
  new ShadowRoot(ShadowDOM.localQuery(root, 'g-B'), 'B');
  //
  var host = root.host;
  host.appendChild(document.createElement('span')).textContent = 'ADDED!!';
  host.appendChild(document.createTextNode()).textContent = 'TEXT!!';
  ShadowDOM.distribute(host);
  //
  return host;
};

describe('(6.1.1)-dynamics', function() {
  var expected = '<g-a>[A-&gt;]<g-b>[B-&gt;][<span id="a1">Where am I?</span><span>ADDED!!</span>TEXT!!][&lt;-B]</g-b>[&lt;-A]</g-a>';
  testImpls(test, expected);
});

})();