const jaeger = require('jaeger-client')
const { correlationManager } = require("@totalsoft/correlation");
const { spanManager } = require("@totalsoft/opentracing");
const CORRELATION_ID = 'nbb.correlation_id'

const initGqlTracer = ({ logger = console } = {}) => {
  const tracer = jaeger.initTracerFromEnv({}, { logger: logger })
  return tracer
}

function _shouldTraceFieldResolver({ info }) {
  const { schema, parentType, path } = info || {};

  const customResolver = schema?.resolvers[parentType?.name]?.[path?.key];
  return Boolean(customResolver);
}

const _onRequestResolving = (span, _info) => {
  span.setTag(CORRELATION_ID, correlationManager.getCorrelationId());
  spanManager.beginScope(span)
}

const _onRequestResolved = (_span, _response) => {
  spanManager.endScope()
}

const getApolloTracerPluginConfig = tracer => ({
  tracer,
  onRequestResolving: _onRequestResolving,
  onRequestResolved: _onRequestResolved,
  shouldTraceFieldResolver: _shouldTraceFieldResolver
})

const shouldTracerSkipLogging = ctx => {
  if (!ctx.request) {
    return true
  }

  if (ctx.request.method == 'OPTIONS') {
    return true
  }

  if (!ctx.request.body) {
    // web requests
    return false
  }

  const shouldSkip = ctx.request.body.operationName == 'IntrospectionQuery'
  return shouldSkip
}

module.exports = { initGqlTracer, shouldTracerSkipLogging, CORRELATION_ID, getApolloTracerPluginConfig }
