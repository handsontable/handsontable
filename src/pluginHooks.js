Handsontable.PluginHookClass = (function () {

  var Hooks = function () {
    return {
      // Hooks
      beforeInitWalkontable : [],

      beforeInit : [],
      beforeRender : [],
      beforeChange : [],
      beforeGet : [],
      beforeSet : [],
      beforeGetCellMeta : [],
      beforeAutofill : [],
      beforeKeyDown : [],

      afterInit : [],
      afterLoadData : [],
      afterRender : [],
      afterChange : [],
      afterGetCellMeta : [],
      afterGetColHeader : [],
      afterGetColWidth : [],
      afterDestroy : [],
      afterRemoveRow : [],
      afterCreateRow : [],
      afterRemoveCol : [],
      afterCreateCol : [],
      afterColumnResize : [],
      afterColumnMove : [],
      afterDeselect : [],
      afterSelection : [],
      afterSelectionByProp : [],
      afterSelectionEnd : [],
      afterSelectionEndByProp : [],
      afterCopyLimit : [],

      // Modifiers
      modifyCol : []
    }
  };

  var legacy = {
      onBeforeChange: "beforeChange",
      onChange: "afterChange",
      onCreateRow: "afterCreateRow",
      onCreateCol: "afterCreateCol",
      onSelection: "afterSelection",
      onCopyLimit: "afterCopyLimit",
      onSelectionEnd: "afterSelectionEnd",
      onSelectionByProp: "afterSelectionByProp",
      onSelectionEndByProp: "afterSelectionEndByProp"
    };

  function PluginHookClass () {

    this.hooks = {
      once : Hooks(),
      standard : Hooks()
    };

    this.legacy = legacy;

  };

  var addHook = function (type) {
    return function (key, fn) {
      // provide support for old versions of HOT
      if (key in legacy) {
        key = legacy[key];
      }

      if (typeof this.hooks[type][key] === "undefined") {
        this.hooks[type][key] = [];
      }

      if (fn instanceof Array) {
        for (var i = 0, len = fn.length; i < len; i++) {
          this.hooks[type][key].push(fn[i]);
        }
      } else {
        this.hooks[type][key].push(fn);
      }

      return this;
    };
  };

  PluginHookClass.prototype.add  = addHook('standard');
  PluginHookClass.prototype.once = addHook('once');

  PluginHookClass.prototype.remove = function (key, fn) {
    var status = false
      , hookTypes = ['standard', 'once']
      , type, x, lenx, i, leni;

    // provide support for old versions of HOT
    if (key in legacy) {
      key = legacy[key];
    }

    for (x = 0, lenx = hookTypes.length; x < lenx; x++) {
      type = hookTypes[x];
      if (typeof this.hooks[type][key] !== 'undefined') {

        for (i = 0, leni = this.hooks[type][key].length; i < leni; i++) {
          if (this.hooks[type][key][i] == fn) {
            this.hooks[type][key].splice(i, 1);
            status = true;
            break;
          }
        }

      }
    }

    return status;
  };

  PluginHookClass.prototype.run = function (instance, key, p1, p2, p3, p4, p5) {
    var hookTypes = ['standard', 'once']
      , type, x, lenx, i, leni;

    // provide support for old versions of HOT
    if (key in legacy) {
      key = legacy[key];
    }

    //performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
    for (x = 0, lenx = hookTypes.length; x < lenx; x++) {
      type = hookTypes[x];
      if (typeof this.hooks[type][key] !== 'undefined') {

        for (i = 0, leni = this.hooks[type][key].length; i < leni; i++) {
          this.hooks[type][key][i].call(instance, p1, p2, p3, p4, p5);

          if (type === 'once') {
            this.hooks[type][key].splice(i, 1);
          }
        }

      }
    }
  };

  PluginHookClass.prototype.execute = function (instance, key, p1, p2, p3, p4, p5) {
    var hookTypes = ['standard', 'once']
      , type, x, lenx, i, leni;

    // provide support for old versions of HOT
    if (key in legacy) {
      key = legacy[key];
    }

    //performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
    for (x = 0, lenx = hookTypes.length; x < lenx; x++) {
      type = hookTypes[x];
      if (typeof this.hooks[type][key] !== 'undefined') {

        for (i = 0, leni = this.hooks[type][key].length; i < leni; i++) {
          p1 =  this.hooks[type][key][i].call(instance, p1, p2, p3, p4, p5);

          if (type === 'once') {
            this.hooks[type][key].splice(i, 1);
          }
        }

      }
    }

    return p1;
  };

  return PluginHookClass;

})();

Handsontable.PluginHooks = new Handsontable.PluginHookClass();