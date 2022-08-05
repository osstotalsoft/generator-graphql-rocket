const { correlationManager } = require('../../correlation')

const correlationPublish = async (ctx, next) => {
  ctx.message.headers.pubsubCorrelationId = correlationManager.getCorrelationId()

  return await next()
}

module.exports = { correlationPublish }
