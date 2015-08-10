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
var routesAgent = require('../lib/routesProvider/agent');

describe('routesProvider.agent', function() {

  describe('an instance', function() {
    var agent;
    var updatedAt;

    beforeEach(function(done) {
      updatedAt = new Date('2014-12-15');
      agent = routesAgent.create({
        name: 'abcdefg',
        ttl: 11111,
        updatedAt: updatedAt
      });
      done();
    });

    it('should be normally instantiated with ttl and predefined updatedAt', function(done) {
      expect(agent.doc.name).equals('abcdefg');
      expect(agent.doc.ttl).equals(11111);
      expect(agent.doc.updatedAt).equals(updatedAt);
      done();
    });

    describe('load()', function() {
      it('should validate routes to schema', function(done) {
        var err;
        try {
          agent.load([
            { bus: {}, http: {} }
          ]);
        } catch(e) {
          err = e;
        }
        done(err);
        expect(err).exists();
        done();
      });



    });
  });
});
