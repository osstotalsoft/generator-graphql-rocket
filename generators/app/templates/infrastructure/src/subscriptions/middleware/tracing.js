const { trace, context, propagation, SpanKind, SpanStatusCode } = require("@opentelemetry/api");
<%_ if(withMultiTenancy) {_%>
const { tenantContextAccessor } = require("@totalsoft/multitenancy-core");
<%_}_%>
const { correlationManager } = require("@totalsoft/correlation");
const { SemanticAttributes } = require("@opentelemetry/semantic-conventions");
const attributeNames = require("../../constants/tracingAttributes");

const pubsubEnvelopeHeaderSpanTagPrefix = "pubSub_header";
const componentName = "gql-pub-sub";
const tracer = trace.getTracer(componentName);

const tracing = async (ctx, next) => {
  const otelContext = propagation.extract(context.active(), ctx.message.headers);

  const span = tracer.startSpan(
    `${ctx.message?.topic || "pubsub"} receive`,
    {
      attributes: {
        [attributeNames.correlationId]: correlationManager.getCorrelationId(),
        <%_ if(withMultiTenancy) {_%>
        [attributeNames.tenantId]: tenantContextAccessor.getTenantContext()?.tenant?.id,
        <%_}_%>
        [SemanticAttributes.MESSAGE_BUS_DESTINATION]: ctx.message?.topic
      },
      kind: SpanKind.CONSUMER
    },
    otelContext
  );

  for (const header in ctx.message.headers) {
    span.setAttribute(`${pubsubEnvelopeHeaderSpanTagPrefix}.${header.toLowerCase()}`, ctx.message.headers[header]);
  }

  try {
    const ctx = trace.setSpan(context.active(), span);
    const gqlResult = await context.with(ctx, next);

    if (Array.isArray(gqlResult.errors)) {
      for (const error of gqlResult.errors) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error?.message });
        span.recordException(error);
      }
    }

    return gqlResult;
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error?.message });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
};

module.exports = { tracing };
