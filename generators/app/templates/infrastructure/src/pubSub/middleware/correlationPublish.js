const { correlationManager } = require('@totalsoft/correlation')

const correlationPublish = async (ctx, next) => {
  ctx.message.headers.pubSubCorrelationId = correlationManager.getCorrelationId()

  return await next()
}

module.exports = { correlationPublish }
