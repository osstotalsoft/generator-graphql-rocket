const { envelope } = require('@totalsoft/message-bus')
const opentracing = require('opentracing')
const { spanManager, traceError, getExternalSpan } = require("@totalsoft/opentracing");
<%_ if(withMultiTenancy){ _%>
const { tenantContextAccessor } = require("@totalsoft/multitenancy-core");
<%_}_%>
const { correlationManager } = require("@totalsoft/correlation");

const messagingEnvelopeHeaderSpanTagPrefix = "messaging_header";
const componentName = "nodebb-messaging";


const tracing = () => async (ctx, next) => {
    const tracer = opentracing.globalTracer()

    const externalSpan = getExternalSpan(tracer, ctx.received.msg)
    const span = tracer.startSpan('messagingHost ' + ctx.received.topic, {
        childOf: externalSpan ? externalSpan : undefined
    })

    ctx.requestSpan = span
    span.log({ event: 'message', message: ctx.received.msg })

    span.setTag("nbb.correlation_id", correlationManager.getCorrelationId());
    <%_ if(withMultiTenancy){ _%>
    span.setTag(envelope.headers.tenantId, tenantContextAccessor.getTenantContext()?.tenant?.id);
    <%_}_%>
    span.setTag(opentracing.Tags.SPAN_KIND, "consumer");
    span.setTag(opentracing.Tags.COMPONENT, componentName);
    span.setTag(opentracing.Tags.MESSAGE_BUS_DESTINATION, ctx.received.topic);

    for (const header in ctx.received.msg.headers) {
      span.setTag(`${messagingEnvelopeHeaderSpanTagPrefix}.${header.toLowerCase()}`, ctx.received.msg.headers[header]);
    }

    try {
      await spanManager.useSpanManager(span, next);
    } catch (error) {
      traceError(span, error);
      throw error;
    } finally {
      span.finish();
    }
}

const tracingPublish = () => async (ctx, next) => {
  const activeSpan = spanManager.getActiveSpan();
  const tracer = opentracing.globalTracer();
  const span = tracer.startSpan(`messageBus publish ${ctx.topic}`, {
    childOf: activeSpan
  });
  span.setTag(opentracing.Tags.SPAN_KIND, "producer");
  span.setTag(opentracing.Tags.MESSAGE_BUS_DESTINATION, ctx.topic);
  span.setTag(opentracing.Tags.COMPONENT, componentName);
  span.setTag("nbb.correlation_id", correlationManager.getCorrelationId());
  span.setTag(envelope.headers.tenantId, tenantContextAccessor.getTenantContext()?.tenant?.id);

  const existingCustomizer = ctx.envelopeCustomizer;
  ctx.envelopeCustomizer = headers => {
    tracer.inject(span, opentracing.FORMAT_HTTP_HEADERS, headers);

    for (const header in headers) {
      span.setTag(`${messagingEnvelopeHeaderSpanTagPrefix}.${header.toLowerCase()}`, headers[header]);
    }

    return existingCustomizer(headers);
  };
  try {
    return await next();
  } catch (error) {
    traceError(span, error);
    throw error;
  } finally {
    span.finish();
  }
};

module.exports = { tracing, tracingPublish };

