/**
 * Created by jkl on 11.06.2014.
 */

(function () {

  function CustomBorders () {
  }

  CustomBorders.prototype.setBorders =  function(row,col){
    var borders = this.getCellMeta(row,col).borders;
    if(borders){

      var tmp = {
          className: 'dupa123',
          border:
          {
            width: 2,
            color: '#5292F7',
            style: 'solid',
            cornerVisible: false
          }
      };


      var border = new WalkontableBorder(this.view.wt,tmp);
      // return [topLeft.row, topLeft.col, bottomRight.row, bottomRight.col];
      //border.appear(0,0,0,4);
      //border.appear();
    }
  };



  var init = function () {
    var settings = this.getSettings().customBorders;
    if(settings){
      if(!this.customBorders){
        this.customBorders = new CustomBorders(settings);
      }
    }
  };

  var removeBorder = function(row,col) {
    this.setCellMeta(row, col, 'borders', {});
    this.render();
  };

  var setBorder = function (row, col,place){
    var border = {
      width: 1,
      color: '#000',
      style: 'solid'
    };

    var borders = this.getCellMeta(row, col).borders;

    if (!borders){
      borders = {};
    }

    borders[place] = border;

    this.setCellMeta(row, col, 'customBorders', borders);
    this.render();
  };

  var prepareBorder = function (range, place, border) {

    if (range.from.row == range.to.row && range.from.col == range.to.col){
      if(place == "noBorders"){
        removeBorder.call(this,range.from.row, range.from.col);
      } else {
        setBorder.call(this, range.from.row, range.from.col, place);
      }

    } else {
      switch (place) {
        case "noBorders":
          for(var column = range.from.col; column <= range.to.col; column++){
            for(var row = range.from.row; row <= range.to.row; row++) {
              removeBorder.call(this,row, column);
            }
          }
          break;
        case "top":
          for(var topCol = range.from.col; topCol <= range.to.col; topCol++){
            setBorder.call(this, range.from.row, topCol, place, border);
          }
          break;
        case "right":
          for(var rowRight = range.from.row; rowRight <=range.to.row; rowRight++){
            setBorder.call(this,rowRight, range.to.col, place, border);
          }
          break;
        case "bottom":
          for(var bottomCol = range.from.col; bottomCol <= range.to.col; bottomCol++){
            setBorder.call(this, range.to.row, bottomCol, place, border);
          }
          break;
        case "left":
          for(var rowLeft = range.from.row; rowLeft <=range.to.row; rowLeft++){
            setBorder.call(this,rowLeft, range.from.col, place, border);
          }
          break;
      }
    }
  };

  var addBordersOptionsToContextMenu = function (defaultOptions) {
    if(!this.getSettings().customBorders){
      return;
    }

    defaultOptions.items.bordersCellsSeparator = Handsontable.ContextMenu.SEPARATOR;
    defaultOptions.items.borders = {
      name: function () {
        var div = document.createElement('div'),
          button = document.createElement('button'),
          xButton = button.cloneNode(true),
          tButton = button.cloneNode(true),
          lButton = button.cloneNode(true),
          bButton = button.cloneNode(true),
          rButton = button.cloneNode(true),

          xText = document.createTextNode('X'),
          tText = document.createTextNode('top'),
          rText = document.createTextNode('right'),
          bText = document.createTextNode('bottom'),
          lText = document.createTextNode('left');

        xButton.appendChild(xText);
        tButton.appendChild(tText);
        rButton.appendChild(rText);
        bButton.appendChild(bText);
        lButton.appendChild(lText);

        Handsontable.Dom.addClass(xButton,'noBorders');
        Handsontable.Dom.addClass(tButton,'top');
        Handsontable.Dom.addClass(rButton,'right');
        Handsontable.Dom.addClass(bButton,'bottom');
        Handsontable.Dom.addClass(lButton,'left');

        div.appendChild(xButton);
        div.appendChild(tButton);
        div.appendChild(rButton);
        div.appendChild(bButton);
        div.appendChild(lButton);

        return div.outerHTML;
      },
      callback:function(key, selection ,event){
        var className = event.target.className,
          type = event.target.tagName;
        if (type === "BUTTON") {
          if(className) {
            //console.log(className);
            prepareBorder.call(this, this.getSelectedRange(), className);
          }
        }
      },
      disabled:function () {
        return false;
      }
    };
  };

  var afterRenderer = function (TD, row, col, prop, value, cellProperties) {

//    console.log('--------------');
//    console.log(TD);
//    console.log(row);
//    console.log(col);
//    console.log(prop);
//    console.log(value);
//    console.log(cellProperties);
//    console.log('--------------');

    if(this.customBorders){
      this.customBorders.setBorders.call(this,row, col);
    }
  };

  Handsontable.hooks.add('beforeInit', init);
  Handsontable.hooks.add('afterContextMenuDefaultOptions', addBordersOptionsToContextMenu);
  Handsontable.hooks.add('afterRenderer', afterRenderer);

  Handsontable.CustomBorders = CustomBorders;

}(Handsontable));