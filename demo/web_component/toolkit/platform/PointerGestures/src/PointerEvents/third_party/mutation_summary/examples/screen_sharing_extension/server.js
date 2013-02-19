var WebSocket = require('faye-websocket');
var http      = require('http');
var fs        = require('fs');

var server = http.createServer();

fs.readFile('mirror.html', function(err, mirrorHTML) {
  fs.readFile('tree_mirror.js', function(err, treeMirrorJS) {

    server.addListener('request', function(request, response) {
      if (request.url == '/tree_mirror.js') {
        response.writeHead(200, {'Content-Type': 'text/javascript'});
        response.end(treeMirrorJS);

        return;
      }

      response.writeHead(200, {'Content-Type': 'text/html'});
      response.end(mirrorHTML);
    });  
  });
});

var messages = [];
var receivers = [];
var projector;

server.addListener('upgrade', function(request, rawsocket, head) {
  var socket = new WebSocket(request, rawsocket, head);

  // Projector.
  if (request.url == '/projector') {
    console.log('projector connection initiating.');

    if (projector) {
      console.log('closing existing projector. setting messages to 0');
      projector.close();
      messages.length = 0;
    }

    projector = socket;

    messages.push(JSON.stringify({ clear: true }));

    receivers.forEach(function(socket) {
      socket.send(messages[0]);
    });


    socket.onmessage = function(event) {
      console.log('message received. now at ' + messages.length + ' . sending to ' + receivers.length);
      receivers.forEach(function(receiver) {
        receiver.send(event.data);
      });

      messages.push(event.data);
    };

    socket.onclose = function() {
      console.log('projector closing, clearing messages');
      messages.length = 0;
      receivers.forEach(function(socket) {
        socket.send(JSON.stringify({ clear: true }));
      });

      projector = undefined;
    }

    console.log('projector open completed.')
    return;
  }

  // Receivers.
  if (request.url == '/receiver') {
    receivers.push(socket);

    console.log('receiver opened. now at ' + receivers.length + ' sending ' + messages.length + ' messages');
    socket.send(JSON.stringify(messages));


    socket.onclose = function() {
      var index = receivers.indexOf(socket);
      receivers.splice(index, 1);
      console.log('receiver closed. now at ' + receivers.length);
    }
  }
});

server.listen(8080);