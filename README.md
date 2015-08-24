# msb-http2bus [![Build Status](https://travis-ci.org/tcdl/msb-http2bus.svg)](https://travis-ci.org/tcdl/msb-http2bus)
An HTTP server providing endpoints for services exposed through the [MSB](https://github.com/tcdl/msb) bus.

## Installation

```
$ npm install msb-http2bus
```

To run the server from the command line, globally install with option `-g`.

## Server

Start a server with a static configuration file:

```
$ http2bus example/http2bus.json
```

Base configuration format, provided as either _json_ or _js_:

```js
{
  channelMonitorEnabled: true, // Default: true
  port: 8080, // Default: 0 (random port)
  routes: [
    { /* ... */ },
    { /* ... */ }
  ]
}
```

(All standard [MSB environment variables](https://github.com/tcdl/msb#environment-variables) should be provided for broker configuration.)

### Routes

Routes are loaded as an array of configuration objects, always specifying an `http` section as well as either `bus` or `provider` section.

- **http** Object An object required for all routes specifying HTTP behaviour.
- **http.path** String An [Express-style path](https://github.com/pillarjs/path-to-regexp#usage) to listen on.
- **http.basePath** _Optional_ URLs and redirects are relative to this path. (Default: '/')
- **http.methods** _Optional_ Array The HTTP methods to listen for, e.g. `get`, `post`, `put`, `head`. (Default: `['get']`)
- **http.remote** _Optional_ Boolean Route all traffic below this path, for no specific HTTP methods, to a remote router.  (Default: `false`)
- **http.cors** _Optional_ Object CORS middleware [configuration options](https://github.com/expressjs/cors#configuration-options).
- **bus** Object Must be a valid [Requester configuration](https://github.com/tcdl/msb#class-msbrequester).
- **provider** Object Dynamic routes can provided by this provider.
- **provider.name** String The name corresponding to the [Routes Agent](#routes-provider-agent).

#### Static Route Example

For routing _GET_ requests similar to `/api/v1/example/abc123?depth=10` to `example:topic`:

```js
{
  http: {
    basePath: '/api/v1/examples',
    path: '/:example-id',
    methods: ['get']
  },
  bus: {
    namespace: 'example:topic',
    waitForResponses: 1
  }
}
```

The payload placed on `example:topic` would be similar to:

```js
{
  "method": "get",
  "url": "/abc123",
  "headers": {
    "content-type": "application/json"
  },
  "params": {
    "example-id": "abc123"
  },
  "query": {
    "depth": "10"
  }
}
```

See [this normal responder](https://github.com/tcdl/msb#1-1-1) example.

Headers provided in the responder payload are sent in the HTTP response. E.g, for a redirect:

```js
response.writeHead(301, {
  location: '/renamed-abc123'
})
```

If the `location` header, is not fully qualified, i.e. without protocol and domain name, it will be rewritten relative to this base path specified in the route, in this case `/api/v1/examples/renamed-abc123`.

#### Dynamic Routes Example

To route all requests below `/api/v1/remotes` using routes configurations provided by this routes agent.

```js
{
  http: {
    basePath: '/api/v1/remotes'
  },
  provider: {
    name: 'remotes-example-api'
  }
}
```

The routes loaded by the corresponding [Routes Agent](#routes-provider-agent) will be published relative to the specified `basePath`.

## Routes Agent

You can provide routes to http2bus servers from remote agents on the bus. An agent must be specified as a `provider` in a route on the server. Note: an agent does not actually process any requests, it only publishes routes to the servers.


For example:

```js
var http2bus = require('msb-http2bus')

var agent = http2bus.routesAgent.create({
  name: 'remotes-example-api',
  ttl: 3600000
})

var routes = [{
  http: {
    path: '/:example-id',
    methods: ['get']
  },
  bus: {
    namespace: 'example:topic',
    waitForResponses: 1
  }
}]

agent
.start()
.load(routes)
```

The configuration format for routes are the same as on the http2bus server. You can dynamically change routes to be reloaded on all relevant http2bus servers:

```js
agent.load([])
```

(All standard [MSB environment variables](https://github.com/tcdl/msb#environment-variables) should be provided for broker configuration.)

## License

MIT
