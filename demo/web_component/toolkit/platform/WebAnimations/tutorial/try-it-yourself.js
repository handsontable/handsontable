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

// TryItDisplay creates and represents the input and output display.
 function TryItDisplay(containerElement) {
  this.iframe = new Iframe();
  this.create(containerElement);
}

// Function that creates the input and output for the TryItYourself object.
 TryItDisplay.prototype.create = function(containerElement) {
  var heading = document.createElement("div");
  heading.setAttribute("class", "heading");
  heading.setAttribute("id", "heading")
  heading.innerHTML = "TRY IT YOURSELF";
  containerElement.appendChild(heading);

  var button = document.createElement("button");
  button.onclick = function(me) { return function() { me.update(); }; }(this);
  button.setAttribute("id", "update");
  button.innerHTML = "Update";
  heading.appendChild(button);

  var code = document.createElement("div");
  code.setAttribute("class", "code");
  code.setAttribute("id", "allCode");
  containerElement.appendChild(code);

  var display = document.createElement("div");
  display.setAttribute("class", "display");
  containerElement.appendChild(display);
  display.appendChild(this.iframe.getDom());

  var htmlHeader = document.createElement("div");
  htmlHeader.setAttribute("class", "label");
  htmlHeader.setAttribute("id", "htmlLabel")
  htmlHeader.innerHTML = "HTML Code";
  code.appendChild(htmlHeader);

  var htmlCode = document.createElement("textarea");
  htmlCode.setAttribute("id", "htmlCode");
  htmlCode.setAttribute("class", "code");
  code.appendChild(htmlCode);

  var cssHeader = document.createElement("div");
  cssHeader.setAttribute("class", "label");
  cssHeader.setAttribute("id", "cssLabel")
  cssHeader.innerHTML = "CSS Style";
  code.appendChild(cssHeader);

  var cssCode = document.createElement("textarea");
  cssCode.setAttribute("id", "cssCode");
  cssCode.setAttribute("class", "code");
  code.appendChild(cssCode);

  var jsHeader = document.createElement("div");
  jsHeader.setAttribute("class", "label");
  jsHeader.setAttribute("id", "jsLabel")
  jsHeader.innerHTML = "Javascript";
  code.appendChild(jsHeader);

  var jsCode = document.createElement("textarea");
  jsCode.setAttribute("id", "jsCode");
  jsCode.setAttribute("class", "code");
  code.appendChild(jsCode);

  var heading = document.createElement("div");
  heading.setAttribute("class", "heading fail");
  heading.setAttribute("id", "passOrFail")
  heading.innerHTML = "YOU PASSED!";
  containerElement.appendChild(heading);
}

TryItDisplay.prototype.setDefaultHtml = function(newHtml) {
  document.getElementById('htmlCode').innerHTML = newHtml ? newHtml : "";
}

TryItDisplay.prototype.setDefaultCss = function(newCss) {
  document.getElementById('cssCode').innerHTML = newCss ? newCss : "";
}

TryItDisplay.prototype.setDefaultJs = function(newJs) {
  document.getElementById('jsCode').innerHTML = newJs ? newJs : "";
}

TryItDisplay.prototype.addCheck = function(object, property, time) {
  this.iframe.checks.push("check(" 
      + object + ", " + property + ", " + time + ", 'default');");
}

// Set the default end time for the animation clock.
// Note: this will be overwritten if the user creates an animation longer than
// the time set here.
TryItDisplay.prototype.setTime = function(newTime) {
  this.iframe.time = newTime;
}

// Update takes the information currently in the HTML, CSS, and JS input boxes
// and displays it in the iframe.
TryItDisplay.prototype.update = function() {
  // Reload the iframe by resetting the source.
  document.getElementById("display").src = document.getElementById("display").src;
  document.getElementById("display").onload = function(me) {
    return function() {
      me.addCssHtml();
      me.addAnimScript();
    };
  }(this);
}

// Add the CSS and HTML into the iframe.
TryItDisplay.prototype.addCssHtml = function() {
  var iframeDoc = this.iframe.doc.contentDocument;
  var htmlVal = document.getElementById("htmlCode").value;
  var cssVal = document.getElementById('cssCode').value 
      +"\n" +"#dummy { display: none; }";
  iframeDoc.getElementsByTagName("body")[0].innerHTML = htmlVal;
  iframeDoc.getElementsByTagName("style")[0].innerHTML = cssVal;

  // dummDiv allows the animation time to display properly the first time
  // the page loads.
  var dummyDiv = document.createElement("div");
  dummyDiv.setAttribute("id", "dummy");
  dummyDiv.setAttribute("class", "test");
  iframeDoc.getElementsByTagName("body")[0].appendChild(dummyDiv);
}

// Add the Javascript value to the iframe.
TryItDisplay.prototype.addAnimScript = function() {
  var scriptElement = document.createElement('script');
  var jsVal = this.getJsVal();
  var iframeDoc = this.iframe.doc.contentDocument;

  var scriptDivs = iframeDoc.getElementsByTagName('script');
  scriptElement.innerHTML = jsVal;
  par = iframeDoc.getElementsByTagName('body')[0];
  par.appendChild(scriptElement);
}

// Get the user provided Javascript value, and append additional information
// to run the tests properly.
TryItDisplay.prototype.getJsVal = function() {
  var iframeDoc = this.iframe.doc.contentDocument;
  // The animation added to the javascript input allows the animation time to
  // display even when the user does not input an animation.
  var jsVal = "setupTutorialTests(); \n" 
      +  document.getElementById('jsCode').value + "\n"
      + "new Animation(document.getElementById('dummy'), {left: '100px'}, "
      + this.iframe.time + ");";

  for (var i = 0; i < this.iframe.checks.length; i++) {
    jsVal += "\n" + this.iframe.checks[i];
  }
  jsVal += " \nrunTests();";
  return jsVal;
}

// Function to call once the user passes the tutorial.
TryItDisplay.pass = function() {
  document.getElementById("passOrFail").className = "heading pass";
}

// Function to call if the user fails the tutorial.
TryItDisplay.fail = function() {
  document.getElementById("passOrFail").className = "heading fail";
}

// Constructor for the Iframe object.
function Iframe() {
  this.doc = document.createElement('iframe');
  // Checks will store all the tests done on the animations in the iframe.
  // Developers can add to it using the addCheck function.
  this.checks = [];
  // Time stores the defualt animation time. It controls how long the hidden
  // animation runs and therefore the default animation timer.
  this.time = 5;

  this.pass = false;

  this.doc.setAttribute('id', 'display');
  this.doc.setAttribute('class', 'display');
  this.doc.setAttribute('src', 'iframe-contents.html');
}

Iframe.prototype.getDom = function() {
  return this.doc;
}

// Make the solution box toggleable.
var toggleSolution = function() {
  var element = document.getElementById('toggleText');
  var elementStyle = getComputedStyle(element, null);
  var label = document.getElementById('hideLabel');

  if (elementStyle.display === 'none') {
    element.style.display = 'block';
    label.innerHTML = 'Hide Solution';
  } else if (elementStyle.display === 'block') {
    element.style.display = 'none';
    label.innerHTML = 'Show Solution';
  }
}
