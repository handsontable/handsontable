Handsontable.FocusCatcher = function (instance) {
  this.el = document.createElement('DIV');
  this.el.style.position = 'fixed';
  this.el.style.top = '0';
  this.el.style.left = '0';
  this.el.style.width = '1px';
  this.el.style.height = '1px';
  this.el.setAttribute('tabindex', 10000); //http://www.barryvan.com.au/2009/01/onfocus-and-onblur-for-divs-in-fx/; 32767 is max tabindex for IE7,8
  instance.rootElement.append(this.el);

  this.$el = $(this.el);
};

Handsontable.FocusCatcher.prototype.listen = function () {
  this.el.focus();
};