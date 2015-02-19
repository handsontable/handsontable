describe('Handsontable.helpers', function () {

  it('isWebComponent: should detect is element is web component', function () {
    var element = {};

    expect(Handsontable.helper.isWebComponent(element)).toBe(false);

    element.shadowRoot = undefined;

    expect(Handsontable.helper.isWebComponent(element)).toBe(false);

    element.shadowRoot = document.createDocumentFragment();

    expect(Handsontable.helper.isWebComponent(element)).toBe(true);
  });

});
