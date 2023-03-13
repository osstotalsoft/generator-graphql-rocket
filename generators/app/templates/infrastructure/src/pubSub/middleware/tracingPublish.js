const messagingEnvelopeHeaderSpanTagPrefix = "pubSub_header";
const { trace, context, propagation, SpanKind, SpanStatusCode } = require("@opentelemetry/api");
const { correlationManager } = require("@totalsoft/correlation");
const { tenantContextAccessor } = require("@totalsoft/multitenancy-core");
const attributeNames = require("../../constants/tracingAttributes");
const { SemanticAttributes } = require("@opentelemetry/semantic-conventions");

const componentName = "gql-pub-sub";
const tracer = trace.getTracer(componentName);

const tracingPublish = async (ctx, next) => {
  const span = tracer.startSpan(`${ctx.clientTopic} send`, {
    attributes: {
      [SemanticAttributes.MESSAGE_BUS_DESTINATION]: ctx.topic,
      [attributeNames.correlationId]: correlationManager.getCorrelationId(),
      [attributeNames.tenantId]: tenantContextAccessor.getTenantContext()?.tenant?.id
    },
    kind: SpanKind.PRODUCER
  });

  const messageHeaders = ctx.message.headers;

  for (const header in ctx.messageHeaders) {
    span.setAttribute(`${messagingEnvelopeHeaderSpanTagPrefix}.${header.toLowerCase()}`, ctx.message.headers[header]);
  }

  try {
    const ctx = trace.setSpan(context.active(), span);
    propagation.inject(ctx, messageHeaders);

    return await context.with(ctx, next);
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error?.message });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
};

module.exports = { tracingPublish };
