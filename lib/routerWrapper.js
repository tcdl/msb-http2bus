var _ = require('lodash');
var msb = require('msb');
var cors = require('cors');
var Router = require('router');
var routesProvider = require('./routesProvider');
var routeHandler = require('./routeHandler');
var normaliseQueryMiddleWare = require('./middleware/normaliseQuery');
var bufferRawBodyMiddleware = require('./middleware/bufferRawBody');
var wrappedRouter;

function RouterWrapper() {
  this.middleware = this.middleware.bind(this);
  this._providers = [];
}

var routerWrapper = RouterWrapper.prototype;

routerWrapper.middleware = function(req, res, next) {
  if (!this.wrappedRouter) return next();

  this.wrappedRouter(req, res, next);
};

routerWrapper.reset = function() {
  this.wrappedRouter = null;
  this._setProvidersCache(null);
};

routerWrapper.load = function(routes) {
  var self = this;

  var newWrappedRouter = new Router({
    mergeParams: true
  });

  var providers = [];
  routes.forEach(function(route) {
    var path = (route.http.basePath || '') + (route.http.path || '');

    if (route.provider) {
      var provider = self._findOrCreateProvider(route.provider);
      providers.push(provider);
      newWrappedRouter.use(path, provider.routerWrapper.middleware);
      return;
    }

    function mapRouteForMethod(method) {
      var middleware = [
        cors(route.http.cors),
        normaliseQueryMiddleWare
      ];

      if (msb.plugins && msb.plugins.http2busMiddleware) {
        middleware.push(msb.plugins.http2busMiddleware(route));
      }

      if (method === 'put' || method === 'post' || method === 'use') {
        middleware.push(bufferRawBodyMiddleware(route));
      }

      newWrappedRouter[method](path, middleware, routeHandler(route));
    }

    if (route.http.remote) {
      mapRouteForMethod('use');
    } else {
      var methods = route.http.methods || ['get'];
      methods.forEach(mapRouteForMethod);
      if (!~methods.indexOf('options')) newWrappedRouter.options(path, cors(route.http.cors));
    }
  });

  this.wrappedRouter = newWrappedRouter;
  this._setProvidersCache(providers);
};

routerWrapper._findOrCreateProvider = function(config) {
  var existingProvider = _.find(this._providers, function(provider) {
    return provider.isProviderForConfig(config);
  });

  return existingProvider || new routesProvider.RoutesProvider(config);
};

routerWrapper._setProvidersCache = function(providers) {
  var providersToRemove = _.difference(this._providers, providers);

  providersToRemove.forEach(function(provider) {
    provider.release();
  });

  this._providers = providers;
};

exports.RouterWrapper = RouterWrapper;
