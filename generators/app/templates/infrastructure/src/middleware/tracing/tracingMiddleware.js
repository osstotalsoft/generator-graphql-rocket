const opentracing = require('opentracing');
const { shouldTracerSkipLogging } = require("../../tracing/gqlTracer");
const { getExternalSpan, traceError } = require('../../tracing/tracingUtils');
const { useSpanManager } = require('../../tracing/spanManager');

const tracingMiddleWare = () => async (ctx, next) => {

    const req = ctx.req;
    const res = ctx.res;

    const shouldSkip = shouldTracerSkipLogging(ctx);

    if (shouldSkip) {
        await next();
    } else {
        const tracer = opentracing.globalTracer();
        const externalSpan = getExternalSpan(tracer, ctx.request)
        const span = tracer.startSpan(`${ctx.request.path} ${ctx.request.body.operationName || ''}`, {
            childOf: externalSpan ? externalSpan : undefined
        });

        // Use the log api to capture a log
        span.log({ event: 'request_received' });

        // Use the setTag api to capture standard span tags for http traces
        span.setTag(opentracing.Tags.HTTP_METHOD, req.method);
        span.setTag(opentracing.Tags.SPAN_KIND, opentracing.Tags.HTTP_URL);
        span.setTag(opentracing.Tags.HTTP_URL, req.url);
        span.setTag("nbb.correlation_id", ctx.correlationId);

        // add the span to the request object for any other handler to use the span
        ctx.requestSpan = span;

        // finalize the span when the response is completed
        const finishSpan = () => {
            if (res.statusCode >= 500) {
                traceError(span, { message: res.statusMessage })
            }
            // Capture the status code
            span.setTag(opentracing.Tags.HTTP_STATUS_CODE, res.statusCode);
            span.log({ event: 'request_end' });
            span.finish();
        }
        res.on('finish', finishSpan);

        await useSpanManager(span, async () => {
            await next()
        })
    }
}

module.exports = tracingMiddleWare;
