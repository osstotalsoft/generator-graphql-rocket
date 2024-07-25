const { trace, context, propagation, SpanKind, SpanStatusCode } = require("@opentelemetry/api");
<%_ if(withMultiTenancy){ _%>
const { tenantContextAccessor } = require("@totalsoft/multitenancy-core");
<%_}_%>
const { correlationManager } = require("@totalsoft/correlation");
const { SemanticAttributes } = require("@opentelemetry/semantic-conventions");
const attributeNames = require("../../../constants/tracingAttributes");

const messagingEnvelopeHeaderSpanTagPrefix = "messaging_header";
const componentName = "nodebb-messaging";
const tracer = trace.getTracer(componentName);


const tracing = () => async (ctx, next) => {
  const otelContext = propagation.extract(context.active(), ctx.received.msg.headers);
  const span = tracer.startSpan(
    `${ctx.received.topic} receive`,
    {
      attributes: {
        [attributeNames.correlationId]: correlationManager.getCorrelationId(),
        <%_ if(withMultiTenancy){ _%>
        [attributeNames.tenantId]: tenantContextAccessor.getTenantContext()?.tenant?.id,
        <%_}_%>
        [SemanticAttributes.MESSAGE_BUS_DESTINATION]: ctx.received.topic
      },
      kind: SpanKind.CONSUMER
    },
    otelContext
  );

  ctx.requestSpan = span;
  span.addEvent('message', { 'message-payload': JSON.stringify(ctx.received.msg.payload).substring(0, 500) })

  for (const header in ctx.received.msg.headers) {
    span.setAttribute(
      `${messagingEnvelopeHeaderSpanTagPrefix}.${header.toLowerCase()}`,
      ctx.received.msg.headers[header]
    );
  }

  try {
    const ctx = trace.setSpan(context.active(), span);
    await context.with(ctx, next);
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error?.message });
    span.recordException(error);

    throw error;
  } finally {
    span.end();
  }
}

const tracingPublish = () => async (ctx, next) => {
  const span = tracer.startSpan(`${ctx.topic} send`, {
    attributes: {
      [SemanticAttributes.MESSAGE_BUS_DESTINATION]: ctx.topic,
      [attributeNames.correlationId]: correlationManager.getCorrelationId(),
      <%_ if(withMultiTenancy){ _%>
      [attributeNames.tenantId]: tenantContextAccessor.getTenantContext()?.tenant?.id
      <%_}_%>
    },
    kind: SpanKind.PRODUCER
  });

  const existingCustomizer = ctx.envelopeCustomizer;
  ctx.envelopeCustomizer = headers => {
    propagation.inject(context.active(), headers);

    for (const header in headers) {
      span.setAttribute(`${messagingEnvelopeHeaderSpanTagPrefix}.${header.toLowerCase()}`, headers[header]);
    }

    return existingCustomizer(headers);
  };
  try {
    const ctx = trace.setSpan(context.active(), span);
    return await context.with(ctx, next);
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error?.message });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
};

module.exports = { tracing, tracingPublish };

