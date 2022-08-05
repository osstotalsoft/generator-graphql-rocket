const opentracing = require('opentracing')
const { correlationManager } = require('../../correlation')
const { getActiveSpan } = require('../../tracing/spanManager')
const { traceError } = require('../../tracing/tracingUtils')
const messagingEnvelopeHeaderSpanTagPrefix = 'pubsub_header'


const tracingPublish = async (ctx, next) => {
  const activeSpan = getActiveSpan()
  const tracer = opentracing.globalTracer()
  const span = tracer.startSpan(`pub-sub publish ${ctx.clientTopic}`, {
    childOf: activeSpan
  })
  span.setTag(opentracing.Tags.SPAN_KIND, 'producer')
  span.setTag(opentracing.Tags.COMPONENT, 'gql-pub-sub')
  span.setTag('nbb.correlation_id', correlationManager.getCorrelationId())

  tracer.inject(span, opentracing.FORMAT_HTTP_HEADERS, ctx.message.headers)

  for (const header in ctx.message.headers) {
    span.setTag(`${messagingEnvelopeHeaderSpanTagPrefix}.${header.toLowerCase()}`, ctx.message.headers[header])
  }

  try {
    return next()
  } catch (err) {
    traceError(err)
    throw err
  } finally {
    span.finish()
  }
}

module.exports = { tracingPublish }
