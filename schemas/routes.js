module.exports = {
  type: 'array',
  items: {
    oneOf: [
      {
        type: 'object',
        properties: {
          provider: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                pattern: '[a-z0-9\\-]+'
              }
            },
            required: ['name']
          },

          http: {
            type: 'object',
            path: {
              type: 'string'
            },
            basePath: {
              type: 'string'
            }
          }
        },
        required: ['provider', 'http']
      },

      {
        type: 'object',
        properties: {
          bus: {
            type: 'object',
            properties: {
              namespace: {
                type: 'string',
                pattern: '^_?([a-z0-9\-]+\:)+([a-z0-9\-]+)$'
              },
              waitForResponses: {
                type: 'number'
              },
              waitForResponsesMs: {
                type: 'number'
              },
              waitForAcksMs: {
                type: 'number'
              },
              tags: {
                type: 'array',
                items: {
                  type: 'string'
                }
              }
            },
            additionalProperties: false,
            required: ['namespace']
          },

          http: {
            type: 'object',
            properties: {
              methods: {
                type: 'array',
                items: {
                  enum: ['head', 'get', 'put', 'post', 'delete', 'options']
                }
              },
              remote: {
                type: 'boolean'
              },
              path: {
                type: 'string'
              },
              basePath: {
                type: 'string'
              }
            }
          }
        },
        required: ['bus', 'http']
      }
    ]
  }
};
