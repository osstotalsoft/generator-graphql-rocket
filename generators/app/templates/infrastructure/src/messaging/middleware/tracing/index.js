const { envelope } = require("@totalsoft/message-bus");
const opentracing = require("opentracing");
const { useSpanManager } = require("../../../tracing/spanManager");

const tracing = () => async (ctx, next) => {
    const tracer = opentracing.globalTracer();

    const span = tracer.startSpan('messagingHost ' + ctx.received.topic, {});

    ctx.requestSpan = span;
    span.log({ event: 'message', message: ctx.received.msg });
    
    const correlationId = ctx?.correlationId;
    span.setTag(envelope.headers.correlationId, correlationId);
    <%_ if(withMultiTenancy){ _%>
    const tenantId = ctx?.externalTenantId; 
    span.setTag(envelope.headers.tenantId, tenantId);
    <%_}_%>
    
    await useSpanManager(span, async () => {
        await next()
    })

    span.finish();
}

module.exports = tracing;
