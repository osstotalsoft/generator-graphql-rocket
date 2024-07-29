const { correlationManager } = require('@totalsoft/correlation')

const correlationPublish = async (ctx, next) => {
  if (ctx.message.headers)  ctx.message.headers.pubSubCorrelationId = correlationManager.getCorrelationId()

  return await next()
}

module.exports = { correlationPublish }
