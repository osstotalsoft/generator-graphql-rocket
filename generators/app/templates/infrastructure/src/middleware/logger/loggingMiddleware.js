const { logger } = require("../../startup");

const loggingMiddleware = async (ctx, next) => {
  ctx.logger = logger;
  await next();
};

module.exports = loggingMiddleware;
