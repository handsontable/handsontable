/*
 * Copyright 2013 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Get the current topic of tutorial the user is in
 * E.g. If the user is currently at basic-animation.html
 * currentSection will equals to basic-animation.
 * This variable is used to determine the name of a file.
 * E.g. To get the name of the exercise 1 of basic-animation
 * would add currentSection to '-exercise-' and the number 
 * in the <li> being clicked
 */
var currentSection = window.location.href.split('/').pop();
currentSection = currentSection.split('.')[0];

// waits until all DOM elements are ready to perform
$(document.body).ready(function() {

  // if one of the side menu is clicked
  // update page content without refreshing the whole page.
  $('.sideMenu li').click(function(e) {
    // get the exercise number from the <li> being clicked.
    // e.g. 'Exercise 1' would return 1
    // Though 'Basic Info' would return 'Info'.
    exerciseNum = $(this).html().split(' ')[1];

    // determines if the input string is actually a number
    // if it is not then load the info page of the section
    if (parseInt(exerciseNum) !== exerciseNum && isNaN(exerciseNum)) {
      $('.content').load(currentSection + '.html' + ' .content', function() {
        $(this).children().unwrap();
      });
    } else {
      var url = currentSection + '-exercise-' + exerciseNum + '.html';
      // checks if a file/link exist before adding contents
      // into page
      // after contents are loaded, load editor
      $.ajax({
        url: url,
        type: 'HEAD',
        success: function() {
          $('.content').load(url + ' .content', function() {
            $(this).children().unwrap();
            loadEditor();
          });
        }
      });
    }
  });
});

// This generate an editor object and put it into
// a div called 'tryIt' as well as passing in
// default HTML and CSS codes as animation divs
var loadEditor = function() {
  var html = '', currentId = 'a';

  // Get the number of animation divs needed
  var animNum = findDivNum();

  // generate a number of animation divs according to
  // the requirements of the exercise
  // such as in sequence section
  for (var i = 0; i < animNum; i++) {
    html += '<div id=\"' + currentId + '\" class=\"anim\"></div>' + '\n';
    currentId = nextId(currentId);
  }

  // create a new editor object
  var editor = new TryItDisplay(document.getElementById("tryIt"));
  editor.setDefaultHtml(html);

  // common css for all divs
  var css = '.anim {' + 
    '\n' + 'background-color: red;' + 
    '\n' + 'border-radius: 10px;' + 
    '\n' + 'width: 100px;' + 
    '\n' + 'height: 50px;' + 
    '\n' + 'top: 0px;' + 
    '\n' + 'left: 0px;' + 
    '\n' + 'position: relative;' + 
    '\n' + 'border: 1px solid black;' + 
    '\n' + '}';
  editor.setDefaultCss(css);
  editor.update();
}

// Get the number of animation divs required
// which is stored in an invisible div with id
// 'animNum' and returns the value.
var findDivNum = function() {
  var value = document.getElementById('animNum').innerHTML;
  value = parseInt(value);
  return value;
}

// Generate 'a', 'b', 'c', 'd'... to put in as id.
var nextId = function(currentId) {
  return String.fromCharCode(currentId.charCodeAt() + 1);
}
