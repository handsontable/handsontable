// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.oRequestAnimationFrame      ||
    window.msRequestAnimationFrame     ||
    function( callback ){
    window.setTimeout(callback, 1000 / 60);
  };
})();

var Paint = function(options) {
  var canvas = options.el;
  // Size the canvas
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Set the default line style.
  var ctx = canvas.getContext("2d");
  ctx.lineWidth = options.size || Math.ceil(Math.random() * 35);
  ctx.lineCap = options.lineCap || "round";


  this.ctx = ctx;
  this.canvas = canvas;
  // All of the lines associated with a pointer.
  this.lines = {};
  // All of the pointers currently on the screen.
  this.pointers = {};

  this.initEvents();


  // Setup render loop.
  requestAnimFrame(this.renderLoop.bind(this));
};

Paint.prototype.initEvents = function() {
  var canvas = this.canvas;
  canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
  canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
  canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
};

Paint.prototype.onPointerDown = function(event) {
  this.pointers[event.pointerId] = new Pointer({x: event.clientX, y: event.clientY});
};

Paint.prototype.onPointerMove = function(event) {
  var pointer = this.pointers[event.pointerId];
  // Check if there's a pointer that's down.
  if (pointer) {
    pointer.setTarget({x: event.clientX, y: event.clientY});
    //console.log('pointers', pointer);
  }
};

Paint.prototype.onPointerUp = function(event) {
  delete this.pointers[event.pointerId];
};

Paint.prototype.renderLoop = function(lastRender) {
  // Go through all pointers, rendering the last segment.
  for (var pointerId in this.pointers) {
    var pointer = this.pointers[pointerId];
    if (pointer.isDelta()) {
      //console.log('rendering', pointer.targetX);
      var ctx = this.ctx;
      ctx.strokeStyle = pointer.color;
      ctx.beginPath();
      ctx.moveTo(pointer.x, pointer.y);

      ctx.lineTo(pointer.targetX, pointer.targetY);
      ctx.stroke();
      ctx.closePath();

      pointer.didReachTarget();
    }
  }
  requestAnimFrame(this.renderLoop.bind(this));
};

function Pointer(options) {
  this.x = options.x;
  this.y = options.y;

  // Pick a random color.
  this.color = Pointer.COLORS[Math.floor(Math.random() * Pointer.COLORS.length)];
}
Pointer.COLORS = ["red", "green", "yellow", "blue", "magenta", "orangered"];

Pointer.prototype.setTarget = function(options) {
  this.targetX = options.x;
  this.targetY = options.y;
};

Pointer.prototype.didReachTarget = function() {
  this.x = this.targetX;
  this.y = this.targetY;
};

Pointer.prototype.isDelta = function() {
  return this.targetX && this.targetY &&
      (this.x != this.targetX || this.y != this.targetY);
}
