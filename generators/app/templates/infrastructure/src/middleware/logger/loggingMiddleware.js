const loggingMiddleware = async (ctx, next) => {
  if (!ctx.logger) ctx.logger = require('../../startup/logger')
  await next()
}

module.exports = loggingMiddleware