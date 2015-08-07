'use strict';
var msb = require('msb');
var app = exports;

app.config = require('./lib/config');
app.router = require('./lib/router');
app.server = require('./lib/server');

app.start = function(cb) {
  app.router.load(app.config.routes);

  app.server
  .listen(app.config.port)
  .once('listening', function() {
    app.config.port = this.address().port;

    if (cb) { cb(); }
    console.log('http2bus listening on ' + app.config.port);
  });
};
