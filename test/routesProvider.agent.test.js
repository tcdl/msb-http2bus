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
            { bus: { namespace: '' }, http: {} }
          ]);
        } catch(e) {
          err = e;
        }
        done(err);
        expect(err).exists();
        done();
      });

      it('should load routes onto agent and do a broadcast', function(done) {
        simple.mock(agent, 'doBroadcast').returnWith();

        var returned = agent.load([
          {
            provider: {
              name: 'hierarchy'
            },
            http: {
              basePath: '/sub-api'
            }
          },

          {
            bus: {
              namespace: 'zzz:111',
              tags: ['abcdefg', 'kkk']
            },
            http: {
              path: '*'
            }
          },

          {
            bus: {
              namespace: 'zzz:112',
              tags: ['mmm']
            },
            http: {
              path: '*'
            }
          },

          {
            bus: {
              namespace: 'zzz:113'
            },
            http: {
              path: '*'
            }
          }
        ]);

        expect(returned).equals(agent);
        expect(returned.doc.versionHash).equals('14186016000007031128c41cc6409babfdbcb4c02b5a4');
        expect(returned.doc.routes[1].bus.tags).deep.equals(['abcdefg', 'kkk']);
        expect(returned.doc.routes[2].bus.tags).deep.equals(['mmm', 'abcdefg']);
        expect(returned.doc.routes[3].bus.tags).deep.equals(['abcdefg']);

        done();
      });


    });
  });
});
