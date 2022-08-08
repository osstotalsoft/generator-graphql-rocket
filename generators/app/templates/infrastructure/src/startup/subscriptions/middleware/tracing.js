const { envelope } = require("@totalsoft/message-bus");
const opentracing = require("opentracing");
const { useSpanManager } = require("../../../tracing/spanManager");
const { getExternalSpan, traceError } = require("../../../tracing/tracingUtils");
const { tenantContextAccessor } = require("../../../multiTenancy");
const { correlationManager } = require("../../../correlation");
const messagingEnvelopeHeaderSpanTagPrefix = "pubSub_header"

const tracing = async (ctx, next) => {
  const tracer = opentracing.globalTracer();

  const externalSpan = getExternalSpan(tracer, ctx.message);
  const span = tracer.startSpan("pub-sub subscription event received", {
    childOf: externalSpan ? externalSpan : undefined
  });

  span.setTag("nbb.correlation_id", correlationManager.getCorrelationId());
  span.setTag(envelope.headers.tenantId, tenantContextAccessor.getTenantContext()?.tenant?.id);
  span.setTag(opentracing.Tags.SPAN_KIND, "consumer");
  span.setTag(opentracing.Tags.COMPONENT, "gql-pub-sub");

  for (const header in ctx.message.headers) {
    span.setTag(`${messagingEnvelopeHeaderSpanTagPrefix}.${header.toLowerCase()}`, ctx.message.headers[header]);
  }

  try {
    return await useSpanManager(span, next);
  } catch (error) {
    traceError(span, error);
    throw error;
  } finally {
    span.finish();
  }
};

module.exports = { tracing };
