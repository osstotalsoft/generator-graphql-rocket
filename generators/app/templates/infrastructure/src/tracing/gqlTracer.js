const jaeger = require('jaeger-client')
const { correlationManager } = require("../correlation");
const spanManager = require('./spanManager')
const CORRELATION_ID = 'nbb.correlation_id'

const initGqlTracer = () => {
  const logger = {
    info: function info(msg) {
      console.log('INFO', msg)
    },
    error: function error(msg) {
      console.log('ERROR ', msg)
    }
  }

  const tracer = jaeger.initTracerFromEnv({}, { logger: logger })
  return tracer
}

function _isPrimitive(value) {
  if (value instanceof Date || value === null || value === undefined) return true

  return typeof value !== 'object'
}

function _shouldTraceFieldResolver({ source, info }) {
  const isResolved = source && typeof source === 'object' && info.path.key in source
  const isPrimitive = isResolved && _isPrimitive(source[info.path.key])
  return !isResolved || !isPrimitive
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
