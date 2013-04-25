/**
 * Copyright 2012 Google Inc. All Rights Reserved.
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
var visRoot = document.querySelector("#webAnimVisualizeHere");

if (!visRoot) {
	visRoot = document.body;
}

function createSVGElement(tagName) {
	return document.createElementNS("http://www.w3.org/2000/svg", "svg:" + tagName);
}

if (visRoot.tagName != "SVG") {
	visRoot.appendChild(createSVGElement("svg"));
	visRoot = visRoot.lastChild;
}

function createRect(x, y, width, height) {
	var rect = createSVGElement("rect");
	rect.setAttribute("x", x);
	rect.setAttribute("y", y);
	rect.setAttribute("width", width);
	rect.setAttribute("height", height);
	rect.setAttribute("fill", "none");
	rect.setAttribute("stroke", "gray");
	rect.setAttribute("stroke-width", "1px");
	return rect;
}

function createVLine(x, y1, y2) {
	var line = createSVGElement("line");
	line.setAttribute("x1", x);
	line.setAttribute("x2", x);
	line.setAttribute("y1", y1);
	line.setAttribute("y2", y2);
	line.setAttribute("stroke", "black");
	line.setAttribute("stroke-width", "1px");
	return line;
}

function createText(x, y, data) {
	var text = createSVGElement("text");
	text.setAttribute("x", x);
	text.setAttribute("y", y);
	text.setAttribute("font-family", "Verdana");
	text.setAttribute("font-size", "10");
	text.appendChild(document.createTextNode(data));
	return text;
}

/*
var default_rect = createRect("5%", "10px", "90%", "20px");
visRoot.appendChild(default_rect);

document.animationTimeline._vis = default_rect;
*/

function updateRects(anim, startP, widthP, y) {
	var rect = anim._vis;
	if (!rect) {
		anim._vis = createRect("5%", "10px", "90%", "20px");
		anim._label = createText("5%", "10px", anim.name)
		visRoot.appendChild(anim._vis);
		visRoot.appendChild(anim._label);
	}
	rect = anim._vis;
	var text = anim._label;
	rect.setAttribute("x", startP + "%");
	rect.setAttribute("y", y + "px");
	rect.setAttribute("width", widthP + "%");

	text.setAttribute("x", startP + "%");
	text.setAttribute("y", (y + 9) + "px");
	text.replaceChild(document.createTextNode(anim.name), text.firstChild);

	var height = 0;
	y += 10;

	if (anim.children) {
		var childY = y;
		var start = anim.startTime + anim.timing.startDelay + anim.timeDrift;
		var end = anim.endTime;
		var myLength = end - anim.startTime - anim.timeDrift;
		for (var i = 0; i < anim.children.length; i++) {
			var child = anim.children[i];
			var childLength = Math.min(end - start, (child.timing.startDelay + child.animationDuration) / anim.timing.playbackRate);
			var childWidth = childLength / myLength * widthP;
			var childStart = (anim.timing.startDelay + child.startTime + child.timeDrift) / myLength * widthP / anim.timing.playbackRate + startP;
			if (isNaN(childStart) || childStart == Infinity || childStart == -Infinity|| isNaN(childWidth) || childWidth == Infinity || childWidth == -Infinity) {
				continue;
			}
			var results = updateRects(child, childStart, childWidth, childY);
			height += results[0];
			childY = results[1];
		}
	}
	height += 20;
	y += height - 10;

	rect.setAttribute("height", height + "px");
	return [height, y, myLength];	
}

var line;
var startText;
var endText;

function round(num) {
	return Math.floor(num * 1000) / 1000;
}

function webAnimVisUpdateAnims() {
	var earliestStart = Infinity;
	for (var i = 0; i < document.animationTimeline.children.length; i++) {
		var child = document.animationTimeline.children[i];
		if (child.timeDrift + child.startTime < earliestStart) {
			earliestStart = child.timeDrift + child.startTime;
		}
	}
	// want to set the zero point such that earliestStart is at 5%, and width s.t. 90% represents the distance between earliestStart and endTime.
	var length = document.animationTimeline.endTime;
	var width = 90 * length / (length - earliestStart);
	var left = 90 - width + 5;

	if (isNaN(width)) {
		return;
	}

	var results = updateRects(document.animationTimeline, left, width, 10);
	var height = results[0];
	var length = results[2];
	var xPos = (document.animationTimeline.iterationTime - earliestStart) / (length - earliestStart) * 90 + 5;
	if (line == undefined && !isNaN(xPos)) {
		line = createVLine(xPos + "%", "0px", (height + 20) + "px");
		visRoot.appendChild(line);
		startText = createText("5%", "9px", round(earliestStart) + "s");
		visRoot.appendChild(startText);
		endText = createText("95%", "9px", round(length) + "s");
		visRoot.appendChild(endText);
	} else if (!isNaN(xPos)) {
		line.setAttribute("x1", xPos + "%");
		line.setAttribute("x2", xPos + "%");
		line.setAttribute("y2", (height + 20) + "px");
		startText.replaceChild(document.createTextNode(round(earliestStart) + "s"), startText.firstChild);
		endText.replaceChild(document.createTextNode(round(length) + "s"), endText.firstChild);
	}
}

