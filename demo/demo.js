$(function () {
  function loadExamples() {

    /**
     * Example 1
     */

    $("#example1grid").handsontable({
      rows: 5,
      cols: 5,
      minSpareCols: 1, //always keep at least 1 spare row at the right
      minSpareRows: 1 //always keep at least 1 spare row at the bottom
    });

    var data = [
      ["", "Kia", "Nissan", "Toyota", "Honda"],
      ["2008", 10, 11, 12, 13],
      ["2009", 20, 11, 14, 13],
      ["2010", 30, 15, 12, 13]
    ];

    $("#example1grid").handsontable("loadData", data);


    /**
     * Example 2
     */
    $("#example2grid").handsontable({
      rows: 5,
      cols: 5,
      fillHandle: false, //fillHandle can be turned off
      legend: [
        {
          match: function (row, col, data) {
            return (row === 0); //if it is first row
          },
          style: {
            color: 'green', //make the text green and bold
            fontWeight: 'bold'
          },
          title: 'Heading', //make some tooltip
          readOnly: true //make it read-only
        },
        {
          match: function (row, col, data) {
            //if first row in this column contains word "Nissan"
            return (row > 0 && data()[0][col].indexOf('Nissan') > -1);
          },
          style: {
            fontStyle: 'italic' //make cells text in this column written in italic
          }
        }
      ]
    });

    var data = [
      ["", "Kia", "Nissan", "Toyota", "Honda"],
      ["2008", 10, 11, 12, 13],
      ["2009", 20, 11, 14, 13],
      ["2010", 30, 15, 12, 13]
    ];

    $("#example2grid").handsontable("loadData", data);


    /**
     * Example 3
     */
    $("#example3grid").handsontable({
      rows: 7,
      cols: 5,
      legend: [
        {
          match: function (row, col, data) {
            return (row === 0); //if it is first row
          },
          style: {
            color: '#666', //make the text gray and bold
            fontWeight: 'bold'
          },
          title: 'Heading', //make some tooltip
          readOnly: true //make it read-only
        }
      ],
      autoComplete: [
        {
          match: function (row, col, data) {
            if (data()[0][col].indexOf("color") > -1) { //if column name contains word "color"
              return true;
            }
            return false;
          },
          highlighter: function (item) {
            var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
            var label = item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
              return '<strong>' + match + '</strong>';
            });
            return '<span style="margin-right: 10px; background-color: ' + item + '">&nbsp;&nbsp;&nbsp;</span>' + label;
          },
          source: function () {
            return ["yellow", "red", "orange", "green", "blue", "gray", "black", "white"]
          }
        },
        {
          match: function (row, col, data) {
            return (col === 0); //if it is first column
          },
          source: function () {
            return ["BMW", "Chrysler", "Nissan", "Suzuki", "Toyota", "Volvo"]
          }
        }
      ]
    });

    var data = [
      ["Car", "Year", "Chassis color", "Bumper color"],
      ["Nissan", 2009, "black", "black"],
      ["Nissan", 2006, "blue", "blue"],
      ["Chrysler", 2004, "yellow", "black"],
      ["Volvo", 2012, "white", "gray"]
    ];

    $("#example3grid").handsontable("loadData", data);


    /**
     * Example 4
     */
    $("#example4grid").handsontable({
      rows: 40,
      cols: 40,
      minSpareCols: 1, //always keep at least 1 spare row at the right
      minSpareRows: 1 //always keep at least 1 spare row at the bottom
    });

    var data = [
      ["", "Kia", "Nissan", "Toyota", "Honda"],
      ["2008", 10, 11, 12, 13],
      ["2009", 20, 11, 14, 13],
      ["2010", 30, 15, 12, 13]
    ];

    $("#example4grid").handsontable("loadData", data);


    /**
     * Example 5
     */
    $("#example5grid").handsontable({
      rows: 8,
      cols: 8,
      minSpareCols: 1,
      minSpareRows: 1,
      fillHandle: true //possible values: true, false, "horizontal", "vertical"
    });

    var data = [
      ["", "Kia", "Nissan", "Toyota", "Honda"],
      ["2008", 10, 11, 12, 13],
      ["2009", 20, 11, 14, 13],
      ["2010", 30, 15, 12, 13]
    ];

    $("#example5grid").handsontable("loadData", data);


    /**
     * Example 6
     */
    var first = true;
    $("#example6grid").handsontable({
      rows: 8,
      cols: 8,
      minSpareCols: 1,
      minSpareRows: 1,
      onBeforeChange: function (data) {
        for(var i = 0, ilen = data.length; i < ilen; i++) {
          if(data[i][3] === "foo") {
            data[i][3] = false; //gently don't accept the word "foo"
          }
          else if(data[i][3] === "bar") {
            data[i][3] = data[i][3] + '!'; //if the word bar is given, add a ! at the end of it
          }
          else if(data[i][3] === "nuke") {
            return false; //if any of pasted cells contains the word "nuke", reject the whole paste
          }
        }
      },
      onChange: function (data) {
        if (first) {
          first = false;
          return; //don't show this change in console
        }
        $("#example6console").text(JSON.stringify(data));
      }
    });

    var data = [
      ["", "Kia", "Nissan", "Toyota", "Honda"],
      ["2008", 10, 11, 12, 13],
      ["2009", 20, 11, 14, 13],
      ["2010", 30, 15, 12, 13]
    ];

    $("#example6grid").handsontable("loadData", data);
  }

  loadExamples();

  var examplesList = $('.examplesList');
  $('.example').each(function () {
    var $this = $(this);
    $this.append(examplesList.clone());
    $this.find('a[href~=#' + $this.attr('id').replace('container', '') + ']').addClass('active');
  });
  examplesList.remove();
})
;