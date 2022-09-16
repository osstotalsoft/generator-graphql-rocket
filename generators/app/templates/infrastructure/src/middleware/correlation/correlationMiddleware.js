const { correlationManager } = require("@totalsoft/correlation");
const CORRELATION_ID = "x-correlation-id";

const correlationMiddleware = () => async (ctx, next) => {
  const correlationId = ctx.req.headers[CORRELATION_ID];
  await correlationManager.useCorrelationId(correlationId, next)
}

module.exports = correlationMiddleware;
