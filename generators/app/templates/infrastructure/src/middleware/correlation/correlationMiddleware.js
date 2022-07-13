const { v4 } = require('uuid');
const CORRELATION_ID = "x-correlation-id";

const correlationMiddleware = () => async (ctx, next) => {
    if (!ctx.correlationId) {
        const correlationId = ctx.req.headers[CORRELATION_ID] || v4();
        ctx.correlationId = correlationId;
    }

    await next();
}

module.exports = correlationMiddleware;
