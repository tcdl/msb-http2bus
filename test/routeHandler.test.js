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
var _ = require('lodash');
var simple = require('simple-mock');
var msb = require('msb');
var routeHandler = require('../lib/routeHandler');

describe('routeHandler()', function() {

  afterEach(function(done) {
    simple.restore();
    done();
  });

  describe('for a simple 1-1 req-res route', function() {
    var mockReq;
    var mockRes;
    var mockNext;
    var mockRequester;
    var handlerConfig;
    var handler;

    beforeEach(function(done) {

      handlerConfig = {
        bus: {
          namespace: 'abc:123',
          waitForResponses: 1,
          waitForResponsesMs: 1000
        },
        http: {
          basePath: '/api'
        }
      };

      handler = routeHandler(handlerConfig);

      mockRequester = {
        message: {},
        responseMessages: []
      };
      mockRequester.on = simple.mock().returnWith(mockRequester);
      mockRequester.once = simple.mock().returnWith(mockRequester);
      mockRequester.publish = simple.mock().returnWith(mockRequester);

      simple.mock(msb.Requester.prototype, 'publish').returnWith(mockRequester);

      mockReq = {
        url: '/api/something',
        method: 'post',
        headers: {

        },
        params: {

        },
        query: {

        }
      };

      mockRes = {
        setHeader: simple.mock(),
        writeHead: simple.mock(),
        end: simple.mock()
      };

      mockNext = simple.mock();

      done();
    });

    describe('for requests', function() {
      it('can handle a json request', function(done) {
        mockReq.body = '{"doc":"a"}';
        mockReq.headers['content-type'] = 'application/json';

        handler(mockReq, mockRes, mockNext);

        expect(msb.Requester.prototype.publish.callCount).equals(1);

        var publishPayload = msb.Requester.prototype.publish.lastCall.arg;

        expect(publishPayload).exists();
        expect(publishPayload.body).deep.equals({
          doc: 'a'
        });

        done();
      });

      it('can handle a text request', function(done) {
        mockReq.body = 'abc';
        mockReq.headers['content-type'] = 'application/text';

        handler(mockReq, mockRes, mockNext);

        expect(msb.Requester.prototype.publish.callCount).equals(1);

        var publishPayload = msb.Requester.prototype.publish.lastCall.arg;

        expect(publishPayload).exists();
        expect(publishPayload.body).deep.equals('abc');

        done();
      });

      it('can handle a bin data request', function(done) {
        mockReq.body = new Buffer(24);
        mockReq.body.fill(0);

        handler(mockReq, mockRes, mockNext);

        expect(msb.Requester.prototype.publish.callCount).equals(1);

        var publishPayload = msb.Requester.prototype.publish.lastCall.arg;

        expect(publishPayload).exists();
        expect(publishPayload.body).equals(null);
        expect(publishPayload.bodyBuffer).equals('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');

        done();
      });

      it('can modify the url for a basePath', function(done) {
        handler(mockReq, mockRes, mockNext);

        expect(msb.Requester.prototype.publish.callCount).equals(1);

        var publishPayload = msb.Requester.prototype.publish.lastCall.arg;

        expect(publishPayload).exists();
        expect(publishPayload.url).equals('/something');

        done();
      });

      it('can modify the url for a basePath at root', function(done) {
        mockReq.url = '/api';

        handler(mockReq, mockRes, mockNext);

        expect(msb.Requester.prototype.publish.callCount).equals(1);

        var publishPayload = msb.Requester.prototype.publish.lastCall.arg;

        expect(publishPayload).exists();
        expect(publishPayload.url).equals('/');

        done();
      });

      it('can modify the url for a basePath at root', function(done) {
        mockReq.url = '/apiv2';

        handler(mockReq, mockRes, mockNext);

        expect(msb.Requester.prototype.publish.callCount).equals(1);

        var publishPayload = msb.Requester.prototype.publish.lastCall.arg;

        expect(publishPayload).exists();
        expect(publishPayload.url).equals('/v2');

        done();
      });

      it('will ensure the request is tagged with the correlationId', function(done) {
        handler(mockReq, mockRes, mockNext);

        expect(msb.Requester.prototype.publish.callCount).equals(1);

        var requester = msb.Requester.prototype.publish.lastCall.context;

        expect(requester).exists();
        expect(requester.message.tags).deep.equals([requester.message.correlationId]);

        done();
      });

      describe('where the incoming request provides tags', function() {
        beforeEach(function(done) {
          simple.mock(msb, 'Requester').returnWith(mockRequester);
          done();
        });

        it('will add header tags to configuration', function(done) {
          handlerConfig.bus.tags = ['pre', 'one'];
          mockReq.headers['x-msb-tags'] = 'one,two';

          handler(mockReq, mockRes, mockNext);

          expect(msb.Requester.callCount).equals(1);
          expect(msb.Requester.lastCall.arg).exists();
          expect(msb.Requester.lastCall.arg.tags).deep.equals(['one', 'two', 'pre']);

          done();
        });

        it('will add query tags to configuration', function(done) {
          handlerConfig.bus.tags = ['pre', 'one'];
          mockReq.query['_x-msb-tags'] = 'one,two';

          handler(mockReq, mockRes, mockNext);

          expect(msb.Requester.callCount).equals(1);
          expect(msb.Requester.lastCall.arg).exists();
          expect(msb.Requester.lastCall.arg.tags).deep.equals(['one', 'two', 'pre']);

          done();
        });
      });

      it('will ensure the already tagged request is tagged with the correlationId', function(done) {
        handlerConfig.bus.tags = ['zzz'];

        handler(mockReq, mockRes, mockNext);

        expect(msb.Requester.prototype.publish.callCount).equals(1);

        var requester = msb.Requester.prototype.publish.lastCall.context;

        expect(requester).exists();
        expect(requester.message.tags).deep.equals([requester.message.correlationId, 'zzz']);

        done();
      });
    });

    describe('for responses', function() {
      beforeEach(function(done) {
        simple.mock(msb, 'Requester').returnWith(mockRequester);
        done();
      });

      it()

      describe('if no responses were received', function() {
        it('will return an empty 503 where responses are expected', function(done) {
          handler(mockReq, mockRes, mockNext);

          expect(mockRequester.once.lastCall.arg).equals('end');

          var end = mockRequester.once.lastCall.args[1];
          expect(end).exists();

          end();

          expect(mockRes.writeHead.callCount).equals(1);
          expect(mockRes.writeHead.lastCall.arg).equals(503);
          expect(mockRes.end.callCount).equals(1);

          done();
        });

        it('will return an empty 204 where responses are not expected', function(done) {
          handlerConfig.bus.waitForResponses = 0;

          handler(mockReq, mockRes, mockNext);

          expect(mockRequester.once.lastCall.arg).equals('end');

          var end = mockRequester.once.lastCall.args[1];
          expect(end).exists();

          end();

          expect(mockRes.writeHead.callCount).equals(1);
          expect(mockRes.writeHead.lastCall.arg).equals(204);
          expect(mockRes.end.callCount).equals(1);

          done();
        });

        it('will return a correlationId in the header', function(done) {
          handler(mockReq, mockRes, mockNext);

          mockRequester.message.correlationId = 'aCorrelationId';

          expect(mockRequester.once.lastCall.arg).equal('end');

          var end = mockRequester.once.lastCall.args[1];
          expect(end).exist();

          end();

          expect(mockRes.setHeader.callCount).equals(1);
          expect(mockRes.setHeader.lastCall.arg).equals('x-msb-correlation-id');
          expect(mockRes.setHeader.lastCall.args[1]).equals('aCorrelationId');

          done();
        });

      });

      describe('where responses were received', function() {
        var responseMessage;

        beforeEach(function(done) {
          responseMessage = {
            payload: {
              statusCode: 418,
              headers: {
                'access-control-allow-origin': '*',
                'access-control-allow-headers': '*',
                'access-control-allow-methods': '*',
                'access-control-allow-credentials': '*'
              }
            }
          };

          mockRequester.responseMessages.push(responseMessage);
          done();
        });

        it('will return a correlationId in the header', function(done) {
          handler(mockReq, mockRes, mockNext);

          mockRequester.message.correlationId = 'aCorrelationId';

          expect(mockRequester.once.lastCall.arg).equals('end');

          var end = mockRequester.once.lastCall.args[1];
          expect(end).exists();

          end();

          expect(mockRes.setHeader.callCount).equals(1);
          expect(mockRes.setHeader.lastCall.arg).equals('x-msb-correlation-id');
          expect(mockRes.setHeader.lastCall.args[1]).equals('aCorrelationId');

          done();
        });

        it('will use the last response received', function(done) {
          mockRequester.responseMessages.push({
            payload: {
              statusCode: null
            }
          });

          handler(mockReq, mockRes, mockNext);

          expect(mockRequester.once.lastCall.arg).equals('end');

          var end = mockRequester.once.lastCall.args[1];
          expect(end).exists();

          end();

          expect(mockRes.writeHead.callCount).equals(1);
          expect(mockRes.writeHead.lastCall.arg).equals(200);

          done();
        });

        it('can send an empty body', function(done) {
          handler(mockReq, mockRes, mockNext);

          expect(mockRequester.once.lastCall.arg).equals('end');

          var end = mockRequester.once.lastCall.args[1];
          expect(end).exists();

          end();

          expect(mockRes.writeHead.callCount).equals(1);
          expect(mockRes.writeHead.lastCall.arg).equals(418);
          expect(mockRes.writeHead.lastCall.args[1]).deep.equals({
            'content-length': 0
          });
          expect(mockRes.end.callCount).equals(1);
          expect(mockRes.end.lastCall.arg).equals(undefined);

          done();
        });

        it('can send a json body', function(done) {
          responseMessage.payload.body = {
            doc: 'a'
          };

          handler(mockReq, mockRes, mockNext);

          expect(mockRequester.once.lastCall.arg).equals('end');

          var end = mockRequester.once.lastCall.args[1];
          expect(end).exists();

          end();

          expect(mockRes.writeHead.callCount).equals(1);
          expect(mockRes.writeHead.lastCall.arg).equals(418);
          expect(mockRes.writeHead.lastCall.args[1]).deep.equals({
            'content-type': 'application/json'
          });
          expect(mockRes.end.callCount).equals(1);
          expect(mockRes.end.lastCall.arg).equals('{"doc":"a"}');

          done();
        });

        it('can send a json body with custom content-type', function(done) {
          responseMessage.payload.body = {
            doc: 'a'
          };
          responseMessage.payload.headers['content-type'] = 'application/x-my-custom-format';

          handler(mockReq, mockRes, mockNext);

          expect(mockRequester.once.lastCall.arg).equals('end');

          var end = mockRequester.once.lastCall.args[1];
          expect(end).exists();

          end();

          expect(mockRes.writeHead.callCount).equals(1);
          expect(mockRes.writeHead.lastCall.arg).equals(418);
          expect(mockRes.writeHead.lastCall.args[1]).deep.equals({
            'content-type': 'application/x-my-custom-format'
          });
          expect(mockRes.end.callCount).equals(1);
          expect(mockRes.end.lastCall.arg).equals('{"doc":"a"}');

          done();
        });

        it('can send a binary body', function(done) {
          responseMessage.payload.bodyBuffer = 'AAAA';

          handler(mockReq, mockRes, mockNext);

          expect(mockRequester.once.lastCall.arg).equals('end');

          var end = mockRequester.once.lastCall.args[1];
          expect(end).exists();

          end();

          expect(mockRes.writeHead.callCount).equals(1);
          expect(mockRes.writeHead.lastCall.arg).equals(418);
          expect(mockRes.writeHead.lastCall.args[1]).deep.equals({
            'content-type': 'application/octet-stream'
          });
          expect(mockRes.end.callCount).equals(1);
          expect(String(mockRes.end.lastCall.arg)).equals('\u0000\u0000\u0000');

          done();
        });

        it('can send a binary body with provided content-type', function(done) {
          responseMessage.payload.bodyBuffer = 'AAAA';
          responseMessage.payload.headers['content-type'] = 'application/x-my-custom-format';

          handler(mockReq, mockRes, mockNext);

          expect(mockRequester.once.lastCall.arg).equals('end');

          var end = mockRequester.once.lastCall.args[1];
          expect(end).exists();

          end();

          expect(mockRes.writeHead.callCount).equals(1);
          expect(mockRes.writeHead.lastCall.arg).equals(418);
          expect(mockRes.writeHead.lastCall.args[1]).deep.equals({
            'content-type': 'application/x-my-custom-format'
          });
          expect(mockRes.end.callCount).equals(1);
          expect(String(mockRes.end.lastCall.arg)).equals('\u0000\u0000\u0000');

          done();
        });

        it('can rewrite location header relative to basePath', function(done) {
          responseMessage.payload.body = 'A redirect message';
          responseMessage.payload.headers.location = '/some/other';

          handler(mockReq, mockRes, mockNext);

          expect(mockRequester.once.lastCall.arg).equals('end');

          var end = mockRequester.once.lastCall.args[1];
          expect(end).exists();

          end();

          expect(mockRes.writeHead.callCount).equals(1);
          expect(mockRes.writeHead.lastCall.arg).equals(418);
          expect(mockRes.writeHead.lastCall.args[1]).deep.equals({
            'location': '/api/some/other'
          });
          expect(mockRes.end.callCount).equals(1);
          expect(String(mockRes.end.lastCall.arg)).equals('A redirect message');

          done();
        });

        it('can skip rewriting a non path-like locaiton header', function(done) {
          responseMessage.payload.body = 'A redirect message';
          responseMessage.payload.headers.location = 'http://google.com/some/other';

          handler(mockReq, mockRes, mockNext);

          expect(mockRequester.once.lastCall.arg).equals('end');

          var end = mockRequester.once.lastCall.args[1];
          expect(end).exists();

          end();

          expect(mockRes.writeHead.callCount).equals(1);
          expect(mockRes.writeHead.lastCall.arg).equals(418);
          expect(mockRes.writeHead.lastCall.args[1]).deep.equals({
            'location': responseMessage.payload.headers.location
          });
          expect(mockRes.end.callCount).equals(1);
          expect(String(mockRes.end.lastCall.arg)).equals('A redirect message');

          done();
        });

        it('will not rewrite location where there is no basePath', function(done) {
          delete(handlerConfig.http.basePath);
          responseMessage.payload.body = 'A redirect message';
          responseMessage.payload.headers.location = '/some/other';

          handler(mockReq, mockRes, mockNext);

          expect(mockRequester.once.lastCall.arg).equals('end');

          var end = mockRequester.once.lastCall.args[1];
          expect(end).exists();

          end();

          expect(mockRes.writeHead.callCount).equals(1);
          expect(mockRes.writeHead.lastCall.arg).equals(418);
          expect(mockRes.writeHead.lastCall.args[1]).deep.equals({
            'location': responseMessage.payload.headers.location
          });
          expect(mockRes.end.callCount).equals(1);
          expect(String(mockRes.end.lastCall.arg)).equals('A redirect message');

          done();
        });
      });
    });



  });
});
