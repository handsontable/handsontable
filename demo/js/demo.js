$(function () {
  function loadExamples() {

    /**
     * Example 1
     */

    $("#example1grid").handsontable({
      rows: 5,
      cols: 5,
      minSpareCols: 1, //always keep at least 1 spare row at the right
      minSpareRows: 1, //always keep at least 1 spare row at the bottom
      contextMenu: true
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

      rowHeaders: true,
      colHeaders: true,

      fillHandle: false, //fillHandle can be turned off

      contextMenu: ["row_above", "row_below", "remove_row"],
      //contextMenu will only allow inserting and removing rows

      legend: [
        {
          match: function (row, col, data) {
            return (row === 0); //if it is first row
          },
          style: {
            color: 'green', //make the text green and bold
            fontWeight: 'bold'
          },
          title: 'Heading' //make some tooltip
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
      cols: 4,
      rowHeaders: false, //turn off 1, 2, 3, ...
      colHeaders: ["Car", "Year", "Chassis color", "Bumper color"],
      legend: [
        {
          match: function (row, col, data) {
            if (col == 0 || col == 2 || col == 3) {
              return true;
            }
            return false;
          },
          style: {
            fontStyle: 'italic' //make the text italic
          },
          title: "Type to show the list of options"
        }
      ],
      autoComplete: [
        {
          match: function (row, col, data) {
            if (col == 2 || col == 3) {
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
      rowHeaders: true,
      colHeaders: true,
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
      rowHeaders: true,
      colHeaders: true,
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
    $("#example6grid").handsontable({
      rows: 8,
      cols: 8,
      rowHeaders: true,
      colHeaders: true,
      minSpareCols: 1,
      minSpareRows: 1,
      contextMenu: true,
      onBeforeChange: function (data) {
        for (var i = 0, ilen = data.length; i < ilen; i++) {
          if (data[i][3] === "foo") {
            //gently don't accept the word "foo"
            data[i][3] = false;
          }
          else if (data[i][3] === "bar") {
            //if the word bar is given, add a ! at the end of it
            data[i][3] = data[i][3] + '!';
          }
          else if (data[i][3] === "nuke") {
            //if any of pasted cells contains the word "nuke", reject the whole paste
            return false;
          }
        }
      },
      onChange: function (data, source) {
        if (source === 'loadData') {
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


    /**
     * Example 7
     */
    $("#example7grid").handsontable({
      rows: 5,
      cols: 5,
      rowHeaders: true,
      colHeaders: true,
      minSpareCols: 1,
      minSpareRows: 1,
      contextMenu: true
    });

    var data = [
      ["", "Kia", "Nissan", "Toyota", "Honda"],
      ["2008", 10, 11, 12, 13],
      ["2009", 20, 11, 14, 13],
      ["2010", 30, 15, 12, 13]
    ];

    $("#example7grid").handsontable("loadData", data);


    /**
     * Example 9 - Load & Save
     */
    var $container = $("#example9grid");
    var $console = $("#example9console");
    var $parent = $container.parent();
    var autosaveNotification;
    $container.handsontable({
      rows: 8,
      cols: 8,
      rowHeaders: true,
      colHeaders: true,
      minSpareCols: 1,
      minSpareRows: 1,
      contextMenu: true,
      onChange: function (change, source) {
        if (source === 'loadData') {
          return; //don't save this change
        }
        if ($parent.find('input[name=autosave]').is(':checked')) {
          clearTimeout(autosaveNotification);
          $.ajax({
            url: "demo/json/save.json",
            dataType: "json",
            type: "POST",
            data: change, //contains changed cells' data
            success: function (data) {
              $console.text('Autosaved (' + change.length + ' cell' + (change.length > 1 ? 's' : '') + ')');
              autosaveNotification = setTimeout(function(){
                $console.text('Changes will be autosaved');
              }, 1000);
            }
          });
        }
      }
    });
    var handsontable = $container.data('handsontable');

    $parent.find('button[name=load]').click(function () {
      $.ajax({
        url: "demo/json/load.json",
        dataType: 'json',
        type: 'GET',
        success: function (res) {
          handsontable.loadData(res.data);
          $console.text('Data loaded');
        }
      });
    });

    $parent.find('button[name=save]').click(function () {
      $.ajax({
        url: "demo/json/save.json",
        data: {"data": handsontable.getData()}, //returns all cells' data
        dataType: 'json',
        type: 'POST',
        success: function (res) {
          if(res.result === 'ok') {
            $console.text('Data saved');
          }
          else {
            $console.text('Save error');
          }
        },
        error: function () {
          $console.text('Save error');
        }
      });
    });

    $parent.find('input[name=autosave]').click(function () {
      if($(this).is(':checked')) {
        $console.text('Changes will be autosaved');
      }
      else{
        $console.text('Changes will not be autosaved');
      }
    });
  }

  loadExamples();
  $('pre.html').each(function (i, e) {
    hljs.highlightBlock(e)
  });

  var examplesList = $('.examplesList');
  $('.example').each(function () {
    var $this = $(this);
    $this.append(examplesList.clone());
    $this.find('a[href~=#' + $this.attr('id').replace('container', '') + ']').addClass('active');
  });
  examplesList.remove();
});