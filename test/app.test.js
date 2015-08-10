'use strict';
/* Setup */
var Lab = require('lab');
var Code = require('code');
var lab = exports.lab = Lab.script();

var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var beforeEach = lab.beforeEach;
var after = lab.after;
var afterEach = lab.afterEach;
var expect = Code.expect;

/* Modules */
var http = require('http');
var simple = require('simple-mock');
var msb = require('msb');
var app = require('../app');
var routerWrapper = require('../lib/routerWrapper');

describe('http2bus.app', function() {
  afterEach(function(done) {
    simple.restore();
    done();
  });

  describe('start()', function() {
    it('should create server and listen', function(done) {
      var mockRouterWrapper = {
        load: simple.mock(),
        middleware: simple.mock()
      };

      simple.mock(routerWrapper, 'RouterWrapper').returnWith(mockRouterWrapper);

      var mockServer = {
        listen: simple.mock(),
        once: simple.mock(),
        address: simple.mock()
      };

      mockServer.listen.returnWith(mockServer);
      mockServer.once.callback().inThisContext(mockServer);
      mockServer.address.returnWith({ port: 99999 });

      simple.mock(http, 'createServer').returnWith(mockServer);

      app.start(function() {

        expect(http.createServer.callCount).equals(1);
        expect(http.createServer.lastCall.arg).exists();

        expect(mockServer.listen.called).true();

        http.createServer.lastCall.arg('a', 'b');

        expect(mockRouterWrapper.middleware.callCount).equals(1);
        expect(mockRouterWrapper.middleware.lastCall.args[0]).equals('a');
        expect(mockRouterWrapper.middleware.lastCall.args[1]).equals('b');
        expect(typeof mockRouterWrapper.middleware.lastCall.args[2]).equals('function');



        done();
      });
    });
  });
});
