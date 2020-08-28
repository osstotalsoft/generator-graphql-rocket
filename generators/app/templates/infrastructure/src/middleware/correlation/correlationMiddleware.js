const { v4 } = require('uuid');
const CORRELATION_ID = "nbb.correlation_id";

const correlationMiddleware = () => async (ctx, next) => {
    if (!ctx.correlationId) {
        const correlationId = ctx.req.headers[CORRELATION_ID] || v4();
        ctx.correlationId = correlationId;
    }
    
    await next();
}

module.exports = correlationMiddleware;