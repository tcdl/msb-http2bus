var crypto = require('crypto');
var _ = require('lodash');
var msb = require('msb');
var InfoCenterAgent = require('msb/lib/infoCenterAgent');
var routesSchema = require('../../schemas/routes');

var routesAgent = exports;

routesAgent.create = function(config) {

  var agent = new InfoCenterAgent({
    announceNamespace: '_http2bus:routes:announce',
    heartbeatsNamespace: '_http2bus:routes:heartbeat'
  });

  agent.doc = {
    name: config.name,
    ttl: config.ttl,
    versionHash: null,
    updatedAt: config.updatedAt || new Date(),
    routes: null
  };

  agent.load = function(routes) {
    msb.validateWithSchema(routesSchema, routes);

    var name = agent.doc.name;

    // Insert application name tag
    _.each(routes, function(route) {
      if (!route.bus) return;
      if (route.bus.tags) {
        if (!~route.bus.tags.indexOf(name)) route.bus.tags.push(name);
      } else {
        route.bus.tags = [name];
      }
    });

    agent.doc.routes = agent.routes = routes;
    agent._updateVersionHash();
    agent.doBroadcast();
    return agent;
  };

  agent._updateVersionHash = function() {
    agent.doc.versionHash = Number(agent.doc.updatedAt) + md5(JSON.stringify(agent.doc.routes) + agent.doc.ttl);
  };

  return agent;
};

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}
